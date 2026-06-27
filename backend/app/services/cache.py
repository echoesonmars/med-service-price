import redis.asyncio as redis
from typing import Optional, Any
import json
import hashlib

from app.config import get_settings

settings = get_settings()


class CacheService:
    """Сервис кэширования через Redis"""
    
    _redis_client = None
    
    @classmethod
    async def get_client(cls):
        """Получить Redis клиент (singleton)"""
        if cls._redis_client is None:
            cls._redis_client = await redis.from_url(
                settings.redis_url,
                encoding="utf-8",
                decode_responses=True
            )
        return cls._redis_client
    
    @classmethod
    async def close(cls):
        """Закрыть соединение"""
        if cls._redis_client:
            await cls._redis_client.close()
            cls._redis_client = None
    
    @classmethod
    def _make_key(cls, prefix: str, *args, **kwargs) -> str:
        """
        Создать ключ для кэша.
        
        Args:
            prefix: Префикс ключа
            *args, **kwargs: Параметры для хэширования
            
        Returns:
            Уникальный ключ
        """
        # Создать строку из аргументов
        key_parts = [str(arg) for arg in args]
        key_parts.extend([f"{k}={v}" for k, v in sorted(kwargs.items())])
        key_str = ":".join(key_parts)
        
        # Хэш для длинных ключей
        if len(key_str) > 100:
            key_hash = hashlib.md5(key_str.encode()).hexdigest()[:16]
            return f"{prefix}:{key_hash}"
        
        return f"{prefix}:{key_str}"
    
    @classmethod
    async def get(cls, key: str) -> Optional[Any]:
        """
        Получить значение из кэша.
        
        Args:
            key: Ключ
            
        Returns:
            Значение или None
        """
        client = await cls.get_client()
        value = await client.get(key)
        
        if value:
            try:
                return json.loads(value)
            except json.JSONDecodeError:
                return value
        
        return None
    
    @classmethod
    async def set(cls, key: str, value: Any, ttl: Optional[int] = None) -> bool:
        """
        Сохранить значение в кэш.
        
        Args:
            key: Ключ
            value: Значение
            ttl: Время жизни в секундах (по умолчанию из настроек)
            
        Returns:
            True если успешно
        """
        client = await cls.get_client()
        
        # Сериализация
        if not isinstance(value, str):
            value = json.dumps(value)
        
        # TTL
        if ttl is None:
            ttl = settings.cache_ttl
        
        return await client.set(key, value, ex=ttl)
    
    @classmethod
    async def delete(cls, key: str) -> bool:
        """
        Удалить ключ из кэша.
        
        Args:
            key: Ключ
            
        Returns:
            True если удален
        """
        client = await cls.get_client()
        return await client.delete(key) > 0
    
    @classmethod
    async def clear_pattern(cls, pattern: str) -> int:
        """
        Удалить все ключи по паттерну.
        
        Args:
            pattern: Паттерн (например, "services:*")
            
        Returns:
            Количество удаленных ключей
        """
        client = await cls.get_client()
        keys = await client.keys(pattern)
        
        if keys:
            return await client.delete(*keys)
        
        return 0
