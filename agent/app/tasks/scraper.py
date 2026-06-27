"""
Celery tasks for web scraping
"""
from celery import group
from datetime import datetime, timedelta
import asyncio

from app.main import celery_app
from app.scrapers.registry import ScraperRegistry
from app.utils.database import async_session_maker


@celery_app.task(name="app.tasks.scraper.scrape_clinic")
def scrape_clinic(clinic_id: str, clinic_url: str, scraper_type: str):
    """
    Scrape a single clinic's price list.
    
    Args:
        clinic_id: Clinic ID in database
        clinic_url: URL to scrape
        scraper_type: Type of scraper to use (e.g., 'kdl', 'html_table')
    """
    from app.tasks.parser import parse_price_list
    
    print(f"🕷️  Scraping clinic {clinic_id} from {clinic_url}")
    
    try:
        # Get scraper
        scraper = ScraperRegistry.get(scraper_type)
        
        # Scrape
        raw_data = scraper.scrape(clinic_url)
        
        print(f"✅ Scraped {len(raw_data.get('services', []))} services from {clinic_id}")
        
        # Send to parser
        parse_price_list.delay(clinic_id, raw_data)
        
        return {
            "status": "success",
            "clinic_id": clinic_id,
            "services_count": len(raw_data.get('services', []))
        }
        
    except Exception as e:
        print(f"❌ Failed to scrape clinic {clinic_id}: {e}")
        return {
            "status": "error",
            "clinic_id": clinic_id,
            "error": str(e)
        }


@celery_app.task(name="app.tasks.scraper.scrape_all_clinics")
def scrape_all_clinics():
    """
    Scrape all active clinics (scheduled task).
    
    This runs daily at 3:00 AM to update all price lists.
    """
    print("🔄 Starting daily scrape of all clinics...")
    
    async def get_clinics():
        from sqlalchemy import select, text
        
        async with async_session_maker() as session:
            # Get all clinics with scraping configuration
            query = text("""
                SELECT id, name, website, city
                FROM clinics
                WHERE website IS NOT NULL
                ORDER BY city, name
            """)
            
            result = await session.execute(query)
            return result.fetchall()
    
    # Get clinics from database
    clinics = asyncio.run(get_clinics())
    
    if not clinics:
        print("⚠️  No clinics found to scrape")
        return {"status": "no_clinics", "count": 0}
    
    print(f"📋 Found {len(clinics)} clinics to scrape")
    
    # Create scraping tasks for all clinics
    # Group them for parallel execution
    scrape_tasks = group([
        scrape_clinic.s(
            clinic_id=str(clinic.id),
            clinic_url=clinic.website,
            scraper_type="html_generic"  # Default scraper
        )
        for clinic in clinics
    ])
    
    # Execute in parallel
    result = scrape_tasks.apply_async()
    
    return {
        "status": "started",
        "clinics_count": len(clinics),
        "task_id": result.id
    }


@celery_app.task(name="app.tasks.scraper.cleanup_old_data")
def cleanup_old_data(days: int = 90):
    """
    Clean up old raw scraping data (runs weekly).
    
    Args:
        days: Delete data older than this many days
    """
    print(f"🧹 Cleaning up raw data older than {days} days...")
    
    async def cleanup():
        from sqlalchemy import text
        
        async with async_session_maker() as session:
            cutoff_date = datetime.utcnow() - timedelta(days=days)
            
            # Delete old raw fetches
            query = text("""
                DELETE FROM raw_fetches
                WHERE fetched_at < :cutoff_date
            """)
            
            result = await session.execute(query, {"cutoff_date": cutoff_date})
            await session.commit()
            
            return result.rowcount
    
    try:
        deleted_count = asyncio.run(cleanup())
        print(f"✅ Deleted {deleted_count} old raw fetch records")
        
        return {
            "status": "success",
            "deleted_count": deleted_count,
            "cutoff_days": days
        }
        
    except Exception as e:
        print(f"❌ Cleanup failed: {e}")
        return {
            "status": "error",
            "error": str(e)
        }
