# Backend API — MedServicePrice

Высокопроизводительный API для поиска медицинских услуг с семантическим поиском и геолокацией.

## Возможности

- **Быстрый поиск**: Целевое время отклика 15-30 мс
- **Семантический поиск**: Векторный поиск по эмбеддингам с порогом 0.92
- **Полнотекстовый поиск**: PostgreSQL Full-Text Search
- **Геофильтрация**: Фильтрация по городам
- **Отслеживание цен**: История изменения цен
- **Кэширование**: Redis для горячих данных

## Технологии

- FastAPI (Python 3.11+)
- PostgreSQL с pgvector
- Redis
- SQLAlchemy 2.0 (async)
- Sentence Transformers (multilingual embeddings)

## Установка

```bash
# Создать виртуальное окружение
python -m venv venv
source venv/bin/activate  # Linux/Mac
# или
venv\Scripts\activate  # Windows

# Установить зависимости
pip install -r requirements.txt

# Настроить переменные окружения
cp .env.example .env
# Отредактировать .env

# Запустить миграции
alembic upgrade head

# Запустить сервер
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

## API Endpoints

### Поиск услуг
```
GET /api/v1/services/search
  ?q=МРТ
  &city=Шымкент
  &category=мрт
  &price_min=5000
  &price_max=50000
  &sort=price_asc
  &page=1
  &limit=20
```

### Получить услугу
```
GET /api/v1/services/{service_id}
```

### Категории
```
GET /api/v1/categories
```

### История цен
```
GET /api/v1/services/{service_id}/price-history
```

### Города
```
GET /api/v1/cities
```

## Архитектура

```
/backend
├── app/
│   ├── main.py              # FastAPI приложение
│   ├── config.py            # Конфигурация
│   ├── database.py          # Database подключение
│   ├── models/              # SQLAlchemy модели
│   ├── schemas/             # Pydantic схемы
│   ├── api/                 # API роутеры
│   │   └── v1/
│   │       ├── services.py
│   │       ├── categories.py
│   │       └── cities.py
│   ├── services/            # Бизнес-логика
│   │   ├── search.py
│   │   ├── embeddings.py
│   │   └── cache.py
│   └── utils/               # Утилиты
├── alembic/                 # Миграции БД
├── tests/
└── requirements.txt
```
