#!/usr/bin/env python3
"""
Manual trigger for scraping all clinics
Run this to immediately start scraping instead of waiting for scheduled task
"""
import sys
import os

# Add the agent directory to the path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'agent'))

from celery import Celery

# Create Celery app (same config as in agent)
celery_app = Celery(
    "medserviceprice-agent",
    broker="redis://localhost:6379/1",
    backend="redis://localhost:6379/2",
)

def trigger_scraping():
    """Trigger scraping for all clinics"""
    print("🚀 Triggering scraping for all clinics...")
    
    # Import the task
    from app.tasks.scraper import scrape_all_clinics
    
    # Send task to queue
    result = scrape_all_clinics.delay()
    
    print(f"✅ Scraping task queued with ID: {result.id}")
    print(f"📊 Monitor progress at: http://localhost:5555")
    print(f"🔍 Check task status: result.state")
    
    return result

if __name__ == "__main__":
    result = trigger_scraping()
    
    # Wait a bit to show initial status
    import time
    time.sleep(2)
    
    print(f"\n📈 Task status: {result.state}")
    
    if result.state == "PENDING":
        print("⏳ Task is waiting to be executed by a worker...")
    elif result.state == "STARTED":
        print("▶️  Task is running...")
    elif result.state == "SUCCESS":
        print("✅ Task completed!")
        print(f"Result: {result.result}")
