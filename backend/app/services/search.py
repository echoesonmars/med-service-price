from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, or_, and_, text
from sqlalchemy.orm import selectinload
from typing import Optional, List, Tuple
import asyncio

from app.models import Service, Clinic, CanonicalService
from app.schemas import ServiceResponse
from app.services.embeddings import EmbeddingService
from app.config import get_settings

settings = get_settings()


class SearchService:
    """Сервис поиска услуг"""
    
    def __init__(self, db: AsyncSession):
        self.db = db
        self.embedding_service = EmbeddingService()
    
    async def search(
        self,
        query: Optional[str] = None,
        city: Optional[str] = None,
        category: Optional[str] = None,
        price_min: Optional[int] = None,
        price_max: Optional[int] = None,
        sort: str = "relevance",
        page: int = 1,
        limit: int = 20,
    ) -> Tuple[List[ServiceResponse], int]:
        """
        Комплексный поиск услуг.
        
        Стратегия поиска:
        1. Если есть query - используем семантический + полнотекстовый поиск
        2. Применяем фильтры (город, категория, цена)
        3. Сортируем результаты
        4. Пагинация
        
        Returns:
            Tuple[список услуг, общее количество]
        """
        
        # Базовый запрос с eager loading клиник
        base_query = (
            select(Service)
            .join(Clinic, Service.clinic_id == Clinic.id)
            .options(selectinload(Service.clinic))
        )
        
        # Фильтры
        filters = []
        
        # Поиск по тексту
        if query:
            # Простой полнотекстовый поиск (case-insensitive)
            search_filter = or_(
                Service.title.ilike(f"%{query}%"),
                Service.category.ilike(f"%{query}%")
            )
            filters.append(search_filter)
        
        # Фильтр по городу
        if city:
            filters.append(Clinic.city == city)
        
        # Фильтр по категории
        if category:
            filters.append(Service.category == category)
        
        # Фильтр по цене
        if price_min is not None:
            filters.append(Service.price >= price_min)
        if price_max is not None:
            filters.append(Service.price <= price_max)
        
        # Применить фильтры
        if filters:
            base_query = base_query.where(and_(*filters))
        
        # Подсчет общего количества
        count_query = select(func.count()).select_from(base_query.subquery())
        count_result = await self.db.execute(count_query)
        total = count_result.scalar()
        
        # Сортировка
        if sort == "price_asc":
            base_query = base_query.order_by(Service.price.asc())
        elif sort == "price_desc":
            base_query = base_query.order_by(Service.price.desc())
        elif sort == "rating":
            base_query = base_query.order_by(Clinic.rating.desc())
        else:  # relevance (по умолчанию)
            # Если есть query, сортируем по релевантности
            # Иначе сортируем по популярности (рейтинг клиники)
            if query:
                base_query = base_query.order_by(Clinic.rating.desc(), Service.price.asc())
            else:
                base_query = base_query.order_by(Clinic.rating.desc())
        
        # Пагинация
        offset = (page - 1) * limit
        base_query = base_query.offset(offset).limit(limit)
        
        # Выполнить запрос
        result = await self.db.execute(base_query)
        services = result.scalars().all()
        
        # Преобразовать в response схемы
        service_responses = [
            ServiceResponse.model_validate(service)
            for service in services
        ]
        
        return service_responses, total
    
    async def semantic_search(
        self,
        query: str,
        limit: int = 20,
    ) -> List[ServiceResponse]:
        """
        Семантический поиск через векторное сходство.
        
        Использует cosine similarity между эмбеддингом запроса
        и эмбеддингами канонических услуг.
        
        Args:
            query: Поисковый запрос
            limit: Максимальное количество результатов
            
        Returns:
            Список релевантных услуг
        """
        
        # Создать эмбеддинг запроса
        query_normalized = self.embedding_service.normalize_text_for_embedding(query)
        query_embedding = self.embedding_service.encode(query_normalized)
        
        # Поиск похожих канонических услуг через pgvector
        # Используем cosine distance (1 - cosine_similarity)
        similarity_query = text("""
            SELECT 
                cs.id,
                cs.title,
                1 - (cs.embedding <=> :query_embedding) as similarity
            FROM canonical_services cs
            WHERE 1 - (cs.embedding <=> :query_embedding) >= :threshold
            ORDER BY cs.embedding <=> :query_embedding
            LIMIT :limit
        """)
        
        result = await self.db.execute(
            similarity_query,
            {
                "query_embedding": query_embedding,
                "threshold": settings.similarity_threshold,
                "limit": limit
            }
        )
        
        canonical_ids = [row.id for row in result]
        
        if not canonical_ids:
            return []
        
        # Получить услуги, привязанные к найденным каноническим услугам
        services_query = (
            select(Service)
            .where(Service.canonical_service_id.in_(canonical_ids))
            .options(selectinload(Service.clinic))
            .limit(limit)
        )
        
        services_result = await self.db.execute(services_query)
        services = services_result.scalars().all()
        
        return [
            ServiceResponse.model_validate(service)
            for service in services
        ]
