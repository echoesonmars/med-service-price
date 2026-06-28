"""
Celery tasks for AI normalization of service names
"""
from typing import Dict, Any
from sqlalchemy import create_engine, text
from sqlalchemy.orm import Session, sessionmaker

from app.main import celery_app
from app.normalizers.matcher import EmbeddingMatcher
from app.normalizers.llm import LLMNormalizer
from app.config import get_settings

settings = get_settings()

# Create SYNCHRONOUS engine for Celery tasks (not asyncpg)
# This avoids event loop conflicts in forked/threaded Celery workers
sync_engine = create_engine(
    settings.database_url.replace("postgresql+asyncpg://", "postgresql://").replace("postgresql://", "postgresql+psycopg2://"),
    echo=False,
    pool_size=10,
    max_overflow=20,
    pool_pre_ping=True,
    pool_recycle=3600,
)

SyncSessionLocal = sessionmaker(bind=sync_engine)


@celery_app.task(name="app.tasks.normalizer.normalize_service")
def normalize_service(clinic_id: str, raw_service: Dict[str, Any]):
    """
    Normalize a service name and match to canonical dictionary.
    
    SIMPLIFIED VERSION: Skip LLM/matching, just save the service directly for now.
    
    Args:
        clinic_id: Clinic ID
        raw_service: Raw service data (title, price, category, etc.)
    """
    print(f"💾 Saving service: {raw_service.get('title')}")
    
    service_title = raw_service.get("title", "").strip()
    if not service_title:
        return {"status": "error", "error": "Empty title"}
    
    try:
        with SyncSessionLocal() as session:
            # Check if service already exists
            check_query = text("""
                SELECT id, price FROM services
                WHERE clinic_id = :clinic_id AND title = :title
                LIMIT 1
            """)
            result = session.execute(
                check_query,
                {"clinic_id": clinic_id, "title": service_title}
            )
            existing_service = result.first()
            
            if existing_service:
                # Update existing service
                old_price = existing_service.price
                new_price = raw_service.get("price", 0)
                
                update_query = text("""
                    UPDATE services
                    SET price = :price,
                        old_price = :old_price,
                        updated_at = NOW()
                    WHERE id = :service_id
                """)
                session.execute(
                    update_query,
                    {
                        "price": new_price,
                        "old_price": raw_service.get("old_price"),
                        "service_id": existing_service.id
                    }
                )
                
                # If price changed, record history
                if old_price != new_price:
                    history_query = text("""
                        INSERT INTO price_history (id, service_id, price, old_price)
                        VALUES (gen_random_uuid()::text, :service_id, :price, :old_price)
                    """)
                    session.execute(
                        history_query,
                        {
                            "service_id": existing_service.id,
                            "price": new_price,
                            "old_price": old_price
                        }
                    )
                    print(f"💰 Price changed: {old_price} → {new_price}")
                
            else:
                # Insert new service
                insert_query = text("""
                    INSERT INTO services 
                    (id, title, category, price, old_price, clinic_id)
                    VALUES (gen_random_uuid()::text, :title, :category, :price, :old_price, :clinic_id)
                    RETURNING id
                """)
                result = session.execute(
                    insert_query,
                    {
                        "title": service_title,
                        "category": raw_service.get("category", "Не указано"),
                        "price": raw_service.get("price", 0),
                        "old_price": raw_service.get("old_price"),
                        "clinic_id": clinic_id
                    }
                )
                service_id = result.scalar()
                print(f"✅ Created service: {service_id}")
            
            session.commit()
        
        return {
            "status": "success",
            "service_title": service_title
        }
    except Exception as e:
        print(f"❌ Save failed: {e}")
        import traceback
        traceback.print_exc()
        return {
            "status": "error",
            "error": str(e),
            "service_title": raw_service.get("title")
        }


@celery_app.task(name="app.tasks.normalizer.generate_embeddings")
def generate_embeddings():
    """
    Generate embeddings for all canonical services that don't have them.
    
    This is a maintenance task that runs periodically.
    """
    print("🧮 Generating embeddings for canonical services...")
    
    try:
        matcher = EmbeddingMatcher()
        
        with SyncSessionLocal() as session:
            # Get services without embeddings
            query = text("""
                SELECT id, title, normalized_title
                FROM canonical_services
                WHERE embedding IS NULL
                LIMIT 100
            """)
            result = session.execute(query)
            services = result.fetchall()
            
            if not services:
                print("✅ All services have embeddings")
                return {"status": "complete", "count": 0}
            
            print(f"📊 Generating embeddings for {len(services)} services...")
            
            # Generate embeddings
            for service in services:
                embedding = matcher.generate_embedding(service.normalized_title)
                
                update_query = text("""
                    UPDATE canonical_services
                    SET embedding = :embedding
                    WHERE id = :service_id
                """)
                session.execute(
                    update_query,
                    {"embedding": embedding, "service_id": service.id}
                )
            
            session.commit()
        
        print(f"✅ Generated {len(services)} embeddings")
        return {
            "status": "success",
            "count": len(services)
        }
    except Exception as e:
        print(f"❌ Failed to generate embeddings: {e}")
        return {"status": "error", "error": str(e)}
