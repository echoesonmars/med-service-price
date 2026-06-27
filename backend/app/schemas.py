from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime


class ClinicBase(BaseModel):
    name: str
    address: str
    city: str = "Шымкент"
    lat: float
    lng: float
    phone: Optional[str] = None
    website: Optional[str] = None
    rating: float = 0
    review_count: int = 0
    work_hours: Optional[str] = None
    logo_url: Optional[str] = None


class ClinicResponse(ClinicBase):
    id: str
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True


class ServiceBase(BaseModel):
    title: str
    category: str
    price: int
    old_price: Optional[int] = None


class ServiceResponse(ServiceBase):
    id: str
    clinic_id: str
    canonical_service_id: Optional[str] = None
    created_at: datetime
    updated_at: datetime
    clinic: Optional[ClinicResponse] = None
    
    class Config:
        from_attributes = True


class ServiceSearchResponse(BaseModel):
    """Результат поиска услуг"""
    services: List[ServiceResponse]
    total: int
    page: int
    limit: int
    has_more: bool


class PriceHistoryResponse(BaseModel):
    id: str
    service_id: str
    price: int
    old_price: Optional[int] = None
    recorded_at: datetime
    
    class Config:
        from_attributes = True


class CategoryResponse(BaseModel):
    category: str
    count: int


class CityResponse(BaseModel):
    city: str
    clinic_count: int


class CanonicalServiceResponse(BaseModel):
    id: str
    title: str
    normalized_title: str
    category: str
    description: Optional[str] = None
    parameters: Optional[str] = None
    
    class Config:
        from_attributes = True
