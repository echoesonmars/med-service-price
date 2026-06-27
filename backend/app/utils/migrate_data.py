"""
Script to initialize the backend with sample data from the web frontend database.
This is useful for testing the backend API with existing data.
"""

import asyncio
import sqlite3
from pathlib import Path
from sqlalchemy.ext.asyncio import AsyncSession
from app.database import async_session_maker
from app.models import Clinic, Service
from app.utils.id_generator import generate_cuid


async def migrate_from_sqlite():
    """Migrate data from web SQLite database to backend PostgreSQL"""
    
    # Path to web database
    web_db_path = Path(__file__).parent.parent.parent / "web" / "prisma" / "dev.db"
    
    if not web_db_path.exists():
        print(f"❌ Web database not found at {web_db_path}")
        return
    
    print(f"📖 Reading data from {web_db_path}")
    
    # Connect to SQLite
    sqlite_conn = sqlite3.connect(str(web_db_path))
    sqlite_conn.row_factory = sqlite3.Row
    cursor = sqlite_conn.cursor()
    
    # Read clinics
    cursor.execute("SELECT * FROM Clinic")
    clinics_data = cursor.fetchall()
    
    # Read services
    cursor.execute("SELECT * FROM Service")
    services_data = cursor.fetchall()
    
    sqlite_conn.close()
    
    print(f"📊 Found {len(clinics_data)} clinics and {len(services_data)} services")
    
    # Insert into PostgreSQL
    async with async_session_maker() as session:
        # Map old IDs to new IDs
        clinic_id_map = {}
        
        # Insert clinics
        print("🏥 Migrating clinics...")
        for clinic_row in clinics_data:
            clinic = Clinic(
                id=clinic_row["id"],
                name=clinic_row["name"],
                address=clinic_row["address"],
                city=clinic_row["city"],
                lat=clinic_row["lat"],
                lng=clinic_row["lng"],
                phone=clinic_row["phone"],
                website=clinic_row["website"],
                rating=clinic_row["rating"],
                review_count=clinic_row["reviewCount"],
                work_hours=clinic_row["workHours"],
                logo_url=clinic_row["logoUrl"],
            )
            session.add(clinic)
            clinic_id_map[clinic_row["id"]] = clinic_row["id"]
        
        await session.flush()
        
        # Insert services
        print("💊 Migrating services...")
        for service_row in services_data:
            service = Service(
                id=service_row["id"],
                title=service_row["title"],
                category=service_row["category"],
                price=service_row["price"],
                old_price=service_row["oldPrice"],
                clinic_id=service_row["clinicId"],
            )
            session.add(service)
        
        await session.commit()
    
    print("✅ Migration completed successfully!")
    print(f"   - {len(clinics_data)} clinics migrated")
    print(f"   - {len(services_data)} services migrated")


if __name__ == "__main__":
    print("🔄 Starting data migration from web database...")
    asyncio.run(migrate_from_sqlite())
