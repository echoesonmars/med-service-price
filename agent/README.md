# Agent — Фоновый сервис обработки данных

Изолированный сервис для асинхронной обработки прайс-листов клиник.

## Возможности

- **Планирование задач**: Cron-based scraping scheduler
- **Парсинг документов**: HTML, Excel, PDF прайс-листы
- **ИИ-нормализация**: LLM-based service name standardization
- **Семантический матчинг**: Embedding-based matching (порог 0.92)
- **Обработка очередей**: Celery + Redis для распределенной обработки

## Архитектура

```
/agent
├── app/
│   ├── main.py              # Celery application
│   ├── config.py            # Configuration
│   ├── tasks/               # Celery tasks
│   │   ├── scraper.py       # Scraping tasks
│   │   ├── parser.py        # Document parsing tasks
│   │   └── normalizer.py    # AI normalization tasks
│   ├── scrapers/            # Web scrapers
│   │   ├── base.py          # Base scraper class
│   │   ├── html_scraper.py  # HTML parser
│   │   └── registry.py      # Scraper registry
│   ├── parsers/             # Document parsers
│   │   ├── excel.py         # Excel parser
│   │   ├── pdf.py           # PDF parser
│   │   └── html.py          # HTML parser
│   ├── normalizers/         # AI normalization
│   │   ├── llm.py           # LLM integration
│   │   └── matcher.py       # Embedding matcher
│   └── utils/
│       ├── database.py      # DB connection
│       └── scheduler.py     # Cron scheduler
├── parse/                   # Sample price lists
├── requirements.txt
└── README.md
```

## Технологии

- Python 3.11+
- Celery (task queue)
- Redis (message broker + result backend)
- BeautifulSoup4 (HTML parsing)
- openpyxl (Excel parsing)
- PyPDF2 (PDF parsing)
- Google Gemini (LLM normalization)
- Sentence Transformers (embeddings)

## Установка

```bash
# Создать виртуальное окружение
python -m venv venv
source venv/bin/activate

# Установить зависимости
pip install -r requirements.txt

# Настроить переменные окружения
cp .env.example .env

# Запустить Celery worker
celery -A app.main worker --loglevel=info

# Запустить Celery beat (scheduler)
celery -A app.main beat --loglevel=info
```

## Пайплайн обработки

### 1. Scraping
```python
# Запланированная задача каждый день в 3:00
@celery.task
def scrape_clinic_prices():
    for clinic in clinics:
        scraper = ScraperRegistry.get(clinic.scraper_type)
        raw_data = scraper.scrape(clinic.url)
        # Отправить на парсинг
        parse_price_list.delay(clinic.id, raw_data)
```

### 2. Parsing
```python
@celery.task
def parse_price_list(clinic_id, raw_data):
    parser = get_parser(raw_data.type)
    services = parser.parse(raw_data)
    # Отправить на нормализацию
    for service in services:
        normalize_service.delay(clinic_id, service)
```

### 3. Normalization
```python
@celery.task
def normalize_service(clinic_id, raw_service):
    # 1. Semantic matching
    canonical = matcher.find_match(raw_service.title, threshold=0.92)
    
    if canonical:
        # Высокое совпадение - сохранить
        save_service(clinic_id, raw_service, canonical.id)
    else:
        # 2. LLM normalization
        normalized = llm.normalize(raw_service)
        canonical = create_or_get_canonical(normalized)
        save_service(clinic_id, raw_service, canonical.id)
```

## Запуск

```bash
# Worker (обработка задач)
./start_worker.sh

# Beat (планировщик)
./start_beat.sh

# Мониторинг (Flower)
celery -A app.main flower
```
