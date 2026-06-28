#!/bin/bash
# Trigger scraping for ALL clinics immediately

echo "🚀 Triggering scraping for all clinics..."

docker-compose exec agent-worker python -c "
from app.tasks.scraper import scrape_all_clinics
result = scrape_all_clinics.delay()
print(f'✅ Task queued: {result.id}')
print('📊 Monitor at: http://localhost:5555')
"
