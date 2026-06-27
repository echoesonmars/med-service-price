"""
Seed script to populate database with popular clinics in Kazakhstan
"""
import asyncio
import uuid
from datetime import datetime
from sqlalchemy import text
from app.database import async_session_maker


# Popular medical clinics and laboratories in Kazakhstan
CLINICS_DATA = [
    # Shymkent
    {
        "id": str(uuid.uuid4()),
        "name": "KDL Olymp",
        "city": "Шымкент",
        "address": "мкр. Нурсат, ул. Байтурсынова 1",
        "lat": 42.32,
        "lng": 69.6,
        "phone": "+7 (7252) 53-53-53",
        "website": "https://www.kdlolymp.kz/pricelist/shymkent",
        "rating": 4.5,
        "review_count": 234,
        "work_hours": "Пн-Пт: 08:00-20:00, Сб: 09:00-18:00",
        "logo_url": None,
    },
    {
        "id": str(uuid.uuid4()),
        "name": "Invitro Шымкент",
        "city": "Шымкент",
        "address": "проспект Тауке хана, 30",
        "lat": 42.315,
        "lng": 69.595,
        "phone": "+7 (7252) 97-00-00",
        "website": "https://invitro.kz",
        "rating": 4.3,
        "review_count": 189,
        "work_hours": "Пн-Пт: 07:30-19:00, Сб-Вс: 08:00-17:00",
        "logo_url": None,
    },
    {
        "id": str(uuid.uuid4()),
        "name": "Medical Center Interteach",
        "city": "Шымкент",
        "address": "мкр. Аймак, ул. Жибек Жолы, 124",
        "lat": 42.34,
        "lng": 69.62,
        "phone": "+7 (7252) 55-44-33",
        "website": "https://interteach.kz",
        "rating": 4.6,
        "review_count": 156,
        "work_hours": "Пн-Вс: 08:00-20:00",
        "logo_url": None,
    },
    
    # Almaty
    {
        "id": str(uuid.uuid4()),
        "name": "KDL Olymp Алматы",
        "city": "Алматы",
        "address": "мкр. Самал-2, ул. Жолдасбекова, 97",
        "lat": 43.238,
        "lng": 76.945,
        "phone": "+7 (727) 311-00-00",
        "website": "https://www.kdlolymp.kz/pricelist/almaty",
        "rating": 4.7,
        "review_count": 567,
        "work_hours": "Пн-Пт: 08:00-20:00, Сб: 09:00-18:00",
        "logo_url": None,
    },
    {
        "id": str(uuid.uuid4()),
        "name": "Invitro Алматы",
        "city": "Алматы",
        "address": "проспект Абая, 68",
        "lat": 43.25,
        "lng": 76.92,
        "phone": "+7 (727) 311-10-10",
        "website": "https://invitro.kz",
        "rating": 4.5,
        "review_count": 432,
        "work_hours": "Пн-Пт: 07:30-19:00, Сб-Вс: 08:00-17:00",
        "logo_url": None,
    },
    {
        "id": str(uuid.uuid4()),
        "name": "Mediker",
        "city": "Алматы",
        "address": "мкр. Самал-1, ул. Жолдасбекова, 17А",
        "lat": 43.24,
        "lng": 76.94,
        "phone": "+7 (727) 356-00-00",
        "website": "https://mediker.kz",
        "rating": 4.4,
        "review_count": 298,
        "work_hours": "Пн-Вс: 08:00-21:00",
        "logo_url": None,
    },
    {
        "id": str(uuid.uuid4()),
        "name": "Европейский Медицинский Центр (EMC)",
        "city": "Алматы",
        "address": "проспект Достык, 117/6",
        "lat": 43.222,
        "lng": 76.852,
        "phone": "+7 (727) 356-35-35",
        "website": "https://emc.kz",
        "rating": 4.8,
        "review_count": 412,
        "work_hours": "Пн-Пт: 08:00-20:00, Сб: 09:00-16:00",
        "logo_url": None,
    },
    
    # Astana (Nur-Sultan)
    {
        "id": str(uuid.uuid4()),
        "name": "KDL Olymp Астана",
        "city": "Астана",
        "address": "проспект Мангилик Ел, 55/20",
        "lat": 51.128,
        "lng": 71.43,
        "phone": "+7 (7172) 97-97-97",
        "website": "https://www.kdlolymp.kz/pricelist/astana",
        "rating": 4.6,
        "review_count": 389,
        "work_hours": "Пн-Пт: 08:00-20:00, Сб: 09:00-18:00",
        "logo_url": None,
    },
    {
        "id": str(uuid.uuid4()),
        "name": "Invitro Астана",
        "city": "Астана",
        "address": "проспект Кабанбай батыра, 58",
        "lat": 51.16,
        "lng": 71.42,
        "phone": "+7 (7172) 55-55-55",
        "website": "https://invitro.kz",
        "rating": 4.4,
        "review_count": 276,
        "work_hours": "Пн-Пт: 07:30-19:00, Сб-Вс: 08:00-17:00",
        "logo_url": None,
    },
    {
        "id": str(uuid.uuid4()),
        "name": "SM Doctor Астана",
        "city": "Астана",
        "address": "ул. Сарайшык, 34",
        "lat": 51.15,
        "lng": 71.47,
        "phone": "+7 (7172) 78-88-88",
        "website": "https://smdoctor.kz",
        "rating": 4.5,
        "review_count": 201,
        "work_hours": "Пн-Вс: 08:00-20:00",
        "logo_url": None,
    },
    {
        "id": str(uuid.uuid4()),
        "name": "Viva Medical Center",
        "city": "Астана",
        "address": "проспект Туран, 37/9",
        "lat": 51.135,
        "lng": 71.445,
        "phone": "+7 (7172) 99-99-99",
        "website": "https://viva.kz",
        "rating": 4.7,
        "review_count": 334,
        "work_hours": "Пн-Пт: 08:00-20:00, Сб-Вс: 09:00-18:00",
        "logo_url": None,
    },
    
    # Karaganda
    {
        "id": str(uuid.uuid4()),
        "name": "KDL Olymp Караганда",
        "city": "Караганда",
        "address": "проспект Бухар-Жырау, 66",
        "lat": 49.804,
        "lng": 73.09,
        "phone": "+7 (7212) 42-42-42",
        "website": "https://www.kdlolymp.kz/pricelist/karaganda",
        "rating": 4.5,
        "review_count": 145,
        "work_hours": "Пн-Пт: 08:00-20:00, Сб: 09:00-18:00",
        "logo_url": None,
    },
    {
        "id": str(uuid.uuid4()),
        "name": "Invitro Караганда",
        "city": "Караганда",
        "address": "ул. Ерубаева, 45",
        "lat": 49.81,
        "lng": 73.1,
        "phone": "+7 (7212) 50-60-70",
        "website": "https://invitro.kz",
        "rating": 4.3,
        "review_count": 112,
        "work_hours": "Пн-Пт: 07:30-19:00, Сб-Вс: 08:00-17:00",
        "logo_url": None,
    },
    
    # Aktobe
    {
        "id": str(uuid.uuid4()),
        "name": "KDL Olymp Актобе",
        "city": "Актобе",
        "address": "проспект Абилкайыр хана, 89",
        "lat": 50.28,
        "lng": 57.17,
        "phone": "+7 (7132) 55-66-77",
        "website": "https://www.kdlolymp.kz/pricelist/aktobe",
        "rating": 4.4,
        "review_count": 98,
        "work_hours": "Пн-Пт: 08:00-20:00, Сб: 09:00-18:00",
        "logo_url": None,
    },
    {
        "id": str(uuid.uuid4()),
        "name": "Медицинский центр Казмедцентр",
        "city": "Актобе",
        "address": "ул. Маресьева, 112",
        "lat": 50.29,
        "lng": 57.18,
        "phone": "+7 (7132) 44-55-66",
        "website": "https://kazmedcentr.kz",
        "rating": 4.2,
        "review_count": 76,
        "work_hours": "Пн-Пт: 08:00-19:00, Сб: 09:00-16:00",
        "logo_url": None,
    },
]


# Sample services data
SAMPLE_SERVICES = [
    # Анализы крови
    {"title": "Общий анализ крови с лейкоцитарной формулой", "category": "Анализы крови", "price_range": (1500, 2500)},
    {"title": "Биохимический анализ крови (расширенный)", "category": "Анализы крови", "price_range": (3000, 5000)},
    {"title": "Глюкоза в крови", "category": "Анализы крови", "price_range": (800, 1500)},
    {"title": "Холестерин общий", "category": "Анализы крови", "price_range": (900, 1600)},
    {"title": "Анализ на гормоны щитовидной железы (ТТГ, Т3, Т4)", "category": "Анализы крови", "price_range": (2500, 4000)},
    
    # УЗИ
    {"title": "УЗИ органов брюшной полости", "category": "УЗИ", "price_range": (4000, 7000)},
    {"title": "УЗИ щитовидной железы", "category": "УЗИ", "price_range": (3000, 5500)},
    {"title": "УЗИ почек и мочевого пузыря", "category": "УЗИ", "price_range": (3500, 6000)},
    {"title": "УЗИ молочных желез", "category": "УЗИ", "price_range": (4000, 6500)},
    {"title": "УЗИ сердца (ЭхоКГ)", "category": "УЗИ", "price_range": (5000, 9000)},
    
    # МРТ
    {"title": "МРТ головного мозга", "category": "МРТ", "price_range": (18000, 35000)},
    {"title": "МРТ позвоночника (один отдел)", "category": "МРТ", "price_range": (16000, 30000)},
    {"title": "МРТ коленного сустава", "category": "МРТ", "price_range": (14000, 25000)},
    {"title": "МРТ головного мозга с контрастом", "category": "МРТ", "price_range": (25000, 45000)},
    
    # КТ
    {"title": "КТ органов грудной клетки", "category": "КТ", "price_range": (12000, 22000)},
    {"title": "КТ брюшной полости и малого таза", "category": "КТ", "price_range": (14000, 25000)},
    {"title": "КТ придаточных пазух носа", "category": "КТ", "price_range": (8000, 15000)},
    
    # Приёмы врачей
    {"title": "Прием врача-терапевта", "category": "Приём врачей", "price_range": (3000, 8000)},
    {"title": "Прием врача-кардиолога", "category": "Приём врачей", "price_range": (5000, 12000)},
    {"title": "Прием врача-эндокринолога", "category": "Приём врачей", "price_range": (5000, 11000)},
    {"title": "Прием врача-невролога", "category": "Приём врачей", "price_range": (5000, 11000)},
    {"title": "Прием врача-гастроэнтеролога", "category": "Приём врачей", "price_range": (5000, 12000)},
    {"title": "Прием врача-уролога", "category": "Приём врачей", "price_range": (5000, 11000)},
    {"title": "Прием врача-гинеколога", "category": "Приём врачей", "price_range": (5000, 11000)},
]


async def seed_clinics():
    """Seed clinics into database"""
    async with async_session_maker() as session:
        print("🌱 Seeding clinics...")
        
        for clinic_data in CLINICS_DATA:
            # Check if clinic already exists
            result = await session.execute(
                text("SELECT id FROM clinics WHERE name = :name AND city = :city"),
                {"name": clinic_data["name"], "city": clinic_data["city"]}
            )
            existing = result.first()
            
            if existing:
                print(f"⏭️  Clinic already exists: {clinic_data['name']} ({clinic_data['city']})")
                continue
            
            # Insert clinic
            await session.execute(
                text("""
                    INSERT INTO clinics (id, name, address, city, lat, lng, phone, website, rating, review_count, work_hours, logo_url, created_at, updated_at)
                    VALUES (:id, :name, :address, :city, :lat, :lng, :phone, :website, :rating, :review_count, :work_hours, :logo_url, NOW(), NOW())
                """),
                clinic_data
            )
            print(f"✅ Added clinic: {clinic_data['name']} ({clinic_data['city']})")
        
        await session.commit()
        print(f"\n✨ Successfully seeded {len(CLINICS_DATA)} clinics!")


async def seed_services():
    """Seed sample services for each clinic"""
    import random
    
    async with async_session_maker() as session:
        print("\n🌱 Seeding services...")
        
        # Get all clinics
        result = await session.execute(text("SELECT id, name FROM clinics"))
        clinics = result.fetchall()
        
        if not clinics:
            print("⚠️  No clinics found. Please seed clinics first.")
            return
        
        total_services = 0
        
        for clinic in clinics:
            clinic_id = clinic.id
            clinic_name = clinic.name
            
            # Add 10-15 random services per clinic
            num_services = random.randint(10, 15)
            services_to_add = random.sample(SAMPLE_SERVICES, min(num_services, len(SAMPLE_SERVICES)))
            
            for service in services_to_add:
                # Generate random price within range
                price = random.randint(service["price_range"][0], service["price_range"][1])
                
                # 20% chance of having old price (discount)
                old_price = None
                if random.random() < 0.2:
                    old_price = int(price * random.uniform(1.1, 1.3))
                
                service_id = str(uuid.uuid4())
                
                try:
                    await session.execute(
                        text("""
                            INSERT INTO services (id, title, category, price, old_price, clinic_id, created_at, updated_at)
                            VALUES (:id, :title, :category, :price, :old_price, :clinic_id, NOW(), NOW())
                        """),
                        {
                            "id": service_id,
                            "title": service["title"],
                            "category": service["category"],
                            "price": price,
                            "old_price": old_price,
                            "clinic_id": clinic_id,
                        }
                    )
                    total_services += 1
                except Exception as e:
                    print(f"⚠️  Error adding service: {e}")
            
            print(f"✅ Added {len(services_to_add)} services for {clinic_name}")
        
        await session.commit()
        print(f"\n✨ Successfully seeded {total_services} services!")


async def seed_canonical_services():
    """Seed canonical service dictionary"""
    async with async_session_maker() as session:
        print("\n🌱 Seeding canonical services...")
        
        for service in SAMPLE_SERVICES:
            # Check if canonical service exists
            result = await session.execute(
                text("SELECT id FROM canonical_services WHERE title = :title"),
                {"title": service["title"]}
            )
            existing = result.first()
            
            if existing:
                print(f"⏭️  Canonical service already exists: {service['title']}")
                continue
            
            # Insert canonical service
            canonical_id = str(uuid.uuid4())
            normalized_title = service["title"].lower().strip()
            
            await session.execute(
                text("""
                    INSERT INTO canonical_services (id, title, normalized_title, category, created_at, updated_at)
                    VALUES (:id, :title, :normalized_title, :category, NOW(), NOW())
                """),
                {
                    "id": canonical_id,
                    "title": service["title"],
                    "normalized_title": normalized_title,
                    "category": service["category"],
                }
            )
            print(f"✅ Added canonical service: {service['title']}")
        
        await session.commit()
        print(f"\n✨ Successfully seeded {len(SAMPLE_SERVICES)} canonical services!")


async def main():
    """Main seed function"""
    print("🚀 Starting database seeding...\n")
    
    await seed_clinics()
    await seed_canonical_services()
    await seed_services()
    
    print("\n🎉 Database seeding completed!")


if __name__ == "__main__":
    asyncio.run(main())
