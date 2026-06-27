from pydantic_settings import BaseSettings
from functools import lru_cache


class Settings(BaseSettings):
    """Agent configuration"""
    
    # Database
    database_url: str = "postgresql://user:password@localhost:5432/medserviceprice"
    
    # Redis
    redis_url: str = "redis://localhost:6379/0"
    celery_broker_url: str = "redis://localhost:6379/1"
    celery_result_backend: str = "redis://localhost:6379/2"
    
    # LLM API Keys
    google_api_key: str = ""
    openai_api_key: str = ""
    
    # Embeddings
    embedding_model: str = "sentence-transformers/paraphrase-multilingual-MiniLM-L12-v2"
    similarity_threshold: float = 0.92
    
    # Scraping
    user_agent: str = "MedServicePrice-Bot/1.0"
    scraping_delay: float = 2.0
    scraping_timeout: int = 30
    
    # Normalization
    llm_provider: str = "google"  # google or openai
    llm_model: str = "gemini-2.0-flash-exp"
    
    class Config:
        env_file = ".env"
        case_sensitive = False


@lru_cache()
def get_settings() -> Settings:
    """Get settings singleton"""
    return Settings()
