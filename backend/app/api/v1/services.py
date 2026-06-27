from fastapi import APIRouter, Depends, Query, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, or_
from typing import Optional, List
import asyncio

from app.database import get_db
from app.models import Service, Clinic, CanonicalService, PriceHistory
from app.schemas import ServiceResponse, ServiceSearchResponse, PriceHistoryResponse
from app.services.search import SearchService
from app.services.embeddings import EmbeddingService

router = APIRouter()


@router.get("/services/search", response_model=ServiceSearchResponse)
async def search_services(
    q: Optional[str] = Query(None, description="Поисковый запрос"),
    city: Optional[str] = Query(None, description="Город"),
    category: Optional[str] = Query(None, description="Категория"),
    price_min: Optional[int] = Query(None, description="Минимальная цена"),
    price_max: Optional[int] = Query(None, description="Максимальная цена"),
    sort: str = Query("relevance", description="Сортировка: relevance, price_asc, price_desc, rating"),
    page: int = Query(1, ge=1, description="Номер страницы"),
    limit: int = Query(20, ge=1, le=100, description="Количество результатов"),
    db: AsyncSession = Depends(get_db),
):
    """
    Поиск медицинских услуг с фильтрацией и сортировкой.
    
    Поддерживает:
    - Полнотекстовый поиск по названию
    - Семантический поиск через эмбеддинги
    - Фильтрацию по городу, категории, цене
    - Различные виды сортировки
    """
    
    search_service = SearchService(db)
    
    # Выполнить поиск
    services, total = await search_service.search(
        query=q,
        city=city,
        category=category,
        price_min=price_min,
        price_max=price_max,
        sort=sort,
        page=page,
        limit=limit,
    )
    
    return ServiceSearchResponse(
        services=services,
        total=total,
        page=page,
        limit=limit,
        has_more=total > (page * limit)
    )


@router.get("/services/{service_id}", response_model=ServiceResponse)
async def get_service(
    service_id: str,
    db: AsyncSession = Depends(get_db),
):
    """Получить информацию об услуге по ID"""
    
    query = (
        select(Service)
        .where(Service.id == service_id)
    )
    
    result = await db.execute(query)
    service = result.scalar_one_or_none()
    
    if not service:
        raise HTTPException(status_code=404, detail="Service not found")
    
    return service


@router.get("/services/{service_id}/price-history", response_model=List[PriceHistoryResponse])
async def get_price_history(
    service_id: str,
    days: int = Query(30, ge=1, le=365, description="Количество дней истории"),
    db: AsyncSession = Depends(get_db),
):
    """Получить историю изменения цен на услугу"""
    
    # Проверить существование услуги
    service_query = select(Service).where(Service.id == service_id)
    service_result = await db.execute(service_query)
    service = service_result.scalar_one_or_none()
    
    if not service:
        raise HTTPException(status_code=404, detail="Service not found")
    
    # Получить историю цен
    query = (
        select(PriceHistory)
        .where(PriceHistory.service_id == service_id)
        .where(PriceHistory.recorded_at >= func.now() - func.make_interval(0, 0, 0, days))
        .order_by(PriceHistory.recorded_at.desc())
    )
    
    result = await db.execute(query)
    history = result.scalars().all()
    
    return history
