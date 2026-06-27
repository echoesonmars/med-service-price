from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from typing import List

from app.database import get_db
from app.models import Clinic
from app.schemas import CityResponse

router = APIRouter()


@router.get("/cities", response_model=List[CityResponse])
async def get_cities(
    db: AsyncSession = Depends(get_db),
):
    """
    Получить список всех городов с количеством клиник.
    """
    
    query = (
        select(
            Clinic.city,
            func.count(Clinic.id).label("clinic_count")
        )
        .group_by(Clinic.city)
        .order_by(func.count(Clinic.id).desc())
    )
    
    result = await db.execute(query)
    cities = result.all()
    
    return [
        CityResponse(city=city, clinic_count=count)
        for city, count in cities
    ]
