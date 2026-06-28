#!/bin/bash
# Manual trigger for scraping all clinics
# This sends the scrape task to Celery queue

echo "🚀 Triggering scraping for all clinics..."

docker exec medserviceprice-agent-worker python -c "
from app.tasks.scraper import scrape_all_clinics
result = scrape_all_clinics.delay()
print(f'✅ Scraping task queued with ID: {result.id}')
print(f'📊 Monitor progress at: http://localhost:5555')
print(f'🔍 Task will scrape all clinics with configured websites')
"

echo ""
echo "Done! Check Flower (http://localhost:5555) to monitor progress."
echo "Or check worker logs: docker logs -f medserviceprice-agent-worker"
