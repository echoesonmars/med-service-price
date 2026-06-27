"""
Утилиты для генерации ID
"""
import uuid
from typing import Optional


def generate_cuid() -> str:
    """
    Генерирует уникальный ID в стиле cuid (compatible with Prisma).
    
    Для простоты используем UUID4, но с префиксом 'c' для совместимости.
    В продакшене можно использовать библиотеку cuid.
    """
    return f"c{uuid.uuid4().hex[:24]}"


def generate_uuid() -> str:
    """Генерирует UUID4"""
    return str(uuid.uuid4())
