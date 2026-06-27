from sqlalchemy import Column, String, Integer, Float, DateTime, ForeignKey, Index, Text
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.database import Base
from pgvector.sqlalchemy import Vector


class Clinic(Base):
    """Клиника"""
    __tablename__ = "clinics"
    
    id = Column(String, primary_key=True)
    name = Column(String, nullable=False, index=True)
    address = Column(String, nullable=False)
    city = Column(String, nullable=False, index=True, default="Шымкент")
    lat = Column(Float, nullable=False)
    lng = Column(Float, nullable=False)
    phone = Column(String)
    website = Column(String)
    rating = Column(Float, default=0)
    review_count = Column(Integer, default=0)
    work_hours = Column(String)
    logo_url = Column(String)
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())
    
    # Relationships
    services = relationship("Service", back_populates="clinic", cascade="all, delete-orphan")


class CanonicalService(Base):
    """Канонический словарь услуг"""
    __tablename__ = "canonical_services"
    
    id = Column(String, primary_key=True)
    title = Column(String, nullable=False, unique=True, index=True)
    normalized_title = Column(String, nullable=False, index=True)
    category = Column(String, nullable=False, index=True)
    description = Column(Text)
    
    # Параметры услуги (JSON)
    parameters = Column(Text)  # JSON: {"with_contrast": bool, "with_anesthesia": bool, ...}
    
    # Эмбеддинг для семантического поиска (384 dimensions для multilingual-MiniLM)
    embedding = Column(Vector(384))
    
    # Полнотекстовый поиск
    search_vector = Column(Text)  # tsvector для PostgreSQL FTS
    
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())
    
    # Relationships
    services = relationship("Service", back_populates="canonical_service")


class Service(Base):
    """Услуга в клинике"""
    __tablename__ = "services"
    
    id = Column(String, primary_key=True)
    title = Column(String, nullable=False)
    category = Column(String, nullable=False, index=True)
    price = Column(Integer, nullable=False)
    old_price = Column(Integer)
    
    # Foreign Keys
    clinic_id = Column(String, ForeignKey("clinics.id", ondelete="CASCADE"), nullable=False, index=True)
    canonical_service_id = Column(String, ForeignKey("canonical_services.id"), index=True)
    
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())
    
    # Relationships
    clinic = relationship("Clinic", back_populates="services")
    canonical_service = relationship("CanonicalService", back_populates="services")
    price_history = relationship("PriceHistory", back_populates="service", cascade="all, delete-orphan")
    
    # Indexes
    __table_args__ = (
        Index("idx_service_clinic_category", "clinic_id", "category"),
        Index("idx_service_canonical", "canonical_service_id"),
    )


class PriceHistory(Base):
    """История изменения цен"""
    __tablename__ = "price_history"
    
    id = Column(String, primary_key=True)
    service_id = Column(String, ForeignKey("services.id", ondelete="CASCADE"), nullable=False, index=True)
    price = Column(Integer, nullable=False)
    old_price = Column(Integer)
    recorded_at = Column(DateTime, server_default=func.now(), index=True)
    
    # Relationships
    service = relationship("Service", back_populates="price_history")
    
    # Indexes
    __table_args__ = (
        Index("idx_price_history_service_date", "service_id", "recorded_at"),
    )
