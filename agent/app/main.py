from celery import Celery
from celery.schedules import crontab
from app.config import get_settings

settings = get_settings()

# Create Celery app
celery_app = Celery(
    "medserviceprice-agent",
    broker=settings.celery_broker_url,
    backend=settings.celery_result_backend,
    include=[
        "app.tasks.scraper",
        "app.tasks.parser",
        "app.tasks.normalizer",
    ]
)

# Celery configuration
celery_app.conf.update(
    task_serializer="json",
    accept_content=["json"],
    result_serializer="json",
    timezone="Asia/Almaty",
    enable_utc=True,
    task_track_started=True,
    task_time_limit=3600,  # 1 hour max per task
    worker_prefetch_multiplier=1,
    worker_max_tasks_per_child=1000,
)

# Periodic tasks schedule
celery_app.conf.beat_schedule = {
    # Scrape all clinics daily at 3:00 AM
    "scrape-all-clinics-daily": {
        "task": "app.tasks.scraper.scrape_all_clinics",
        "schedule": crontab(hour=3, minute=0),
    },
    # Clean old raw data weekly
    "cleanup-old-data-weekly": {
        "task": "app.tasks.scraper.cleanup_old_data",
        "schedule": crontab(hour=2, minute=0, day_of_week=0),  # Sunday 2 AM
    },
}


if __name__ == "__main__":
    celery_app.start()
