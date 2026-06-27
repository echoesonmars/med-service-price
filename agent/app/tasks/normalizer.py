"""
Celery tasks for AI normalization of service names
"""
from typing import Dict, Any
import asyncio

from app.main import celery_app
from app.normalizers.matcher import EmbeddingMatcher
from app.normalizers.llm import LLMNormalizer
from app.config import get_settings
from app.utils.database import async_session_maker

settings = get_settings()


@celery_app.task(name="app.tasks.normalizer.normalize_service")
def normalize_service(clinic_id: str, raw_service: Dict[str, Any]):
    """
    Normalize a service name and match to canonical dictionary.
    
    Pipeline:
    1. Try semantic matching with embeddings (threshold 0.92)
    2. If no match, use LLM to normalize
    3. Save to database
    
    Args:
        clinic_id: Clinic ID
        raw_service: Raw service data (title, price, category, etc.)
    """
    print(f"🔍 Normalizing service: {raw_service.get('title')}")
    
    async def normalize():
        from sqlalchemy import select, text
        
        # Initialize services
        matcher = EmbeddingMatcher()
        llm = LLMNormalizer()
        
        service_title = raw_service.get("title", "").strip()
        if not service_title:
            return {"status": "error", "error": "Empty title"}
        
        # Step 1: Try semantic matching
        canonical = await matcher.find_match(
            service_title,
            threshold=settings.similarity_threshold
        )
        
        if canonical:
            print(f"✅ Matched to canonical: {canonical['title']} (similarity: {canonical['similarity']:.3f})")
            canonical_id = canonical["id"]
        else:
            print(f"🤖 No match found, using LLM normalization...")
            
            # Step 2: LLM normalization
            normalized = await llm.normalize(raw_service)
            
            # Check if this normalized service already exists
            async with async_session_maker() as session:
                query = text("""
                    SELECT id FROM canonical_services
                    WHERE normalized_title = :normalized_title
                    LIMIT 1
                """)
                result = await session.execute(
                    query,
                    {"normalized_title": normalized["normalized_title"]}
                )
                existing = result.first()
                
                if existing:
                    canonical_id = existing.id
                    print(f"✅ Found existing canonical: {canonical_id}")
                else:
                    # Create new canonical service
                    insert_query = text("""
                        INSERT INTO canonical_services 
                        (id, title, normalized_title, category, description, parameters)
                        VALUES (gen_random_uuid()::text, :title, :normalized_title, :category, :description, :parameters)
                        RETURNING id
                    """)
                    result = await session.execute(
                        insert_query,
                        {
                            "title": normalized["title"],
                            "normalized_title": normalized["normalized_title"],
                            "category": normalized["category"],
                            "description": normalized.get("description"),
                            "parameters": normalized.get("parameters")
                        }
                    )
                    canonical_id = result.scalar()
                    await session.commit()
                    print(f"✅ Created new canonical: {canonical_id}")
        
        # Step 3: Save service with canonical link
        async with async_session_maker() as session:
            # Check if service already exists
            check_query = text("""
                SELECT id, price FROM services
                WHERE clinic_id = :clinic_id AND title = :title
                LIMIT 1
            """)
            result = await session.execute(
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
                        canonical_service_id = :canonical_id,
                        updated_at = NOW()
                    WHERE id = :service_id
                """)
                await session.execute(
                    update_query,
                    {
                        "price": new_price,
                        "old_price": raw_service.get("old_price"),
                        "canonical_id": canonical_id,
                        "service_id": existing_service.id
                    }
                )
                
                # If price changed, record history
                if old_price != new_price:
                    history_query = text("""
                        INSERT INTO price_history (id, service_id, price, old_price)
                        VALUES (gen_random_uuid()::text, :service_id, :price, :old_price)
                    """)
                    await session.execute(
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
                    (id, title, category, price, old_price, clinic_id, canonical_service_id)
                    VALUES (gen_random_uuid()::text, :title, :category, :price, :old_price, :clinic_id, :canonical_id)
                    RETURNING id
                """)
                result = await session.execute(
                    insert_query,
                    {
                        "title": service_title,
                        "category": raw_service.get("category", ""),
                        "price": raw_service.get("price", 0),
                        "old_price": raw_service.get("old_price"),
                        "clinic_id": clinic_id,
                        "canonical_id": canonical_id
                    }
                )
                service_id = result.scalar()
                print(f"✅ Created new service: {service_id}")
            
            await session.commit()
        
        return {
            "status": "success",
            "canonical_id": canonical_id,
            "service_title": service_title
        }
    
    try:
        result = asyncio.run(normalize())
        return result
    except Exception as e:
        print(f"❌ Normalization failed: {e}")
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
    
    async def generate():
        from sqlalchemy import text
        from app.normalizers.matcher import EmbeddingMatcher
        
        matcher = EmbeddingMatcher()
        
        async with async_session_maker() as session:
            # Get services without embeddings
            query = text("""
                SELECT id, title, normalized_title
                FROM canonical_services
                WHERE embedding IS NULL
                LIMIT 100
            """)
            result = await session.execute(query)
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
                await session.execute(
                    update_query,
                    {"embedding": embedding, "service_id": service.id}
                )
            
            await session.commit()
            
            return {
                "status": "success",
                "count": len(services)
            }
    
    try:
        result = asyncio.run(generate())
        print(f"✅ Generated {result['count']} embeddings")
        return result
    except Exception as e:
        print(f"❌ Failed to generate embeddings: {e}")
        return {"status": "error", "error": str(e)}
