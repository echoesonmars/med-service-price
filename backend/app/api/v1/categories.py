from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from typing import List

from app.database import get_db
from app.models import Service
from app.schemas import CategoryResponse

router = APIRouter()


@router.get("/categories", response_model=List[CategoryResponse])
async def get_categories(
    db: AsyncSession = Depends(get_db),
):
    """
    Получить список всех категорий с количеством услуг.
    """
    
    query = (
        select(
            Service.category,
            func.count(Service.id).label("count")
        )
        .group_by(Service.category)
        .order_by(func.count(Service.id).desc())
    )
    
    result = await db.execute(query)
    categories = result.all()
    
    return [
        CategoryResponse(category=cat, count=count)
        for cat, count in categories
    ]
