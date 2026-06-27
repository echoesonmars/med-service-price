#!/bin/bash

# Backend startup script

set -e

echo "🚀 Starting MedServicePrice Backend..."

# Check if virtual environment exists
if [ ! -d "venv" ]; then
    echo "📦 Creating virtual environment..."
    python3 -m venv venv
fi

# Activate virtual environment
echo "🔧 Activating virtual environment..."
source venv/bin/activate

# Install dependencies
echo "📥 Installing dependencies..."
pip install -r requirements.txt

# Check if .env exists
if [ ! -f ".env" ]; then
    echo "⚠️  .env file not found. Copying from .env.example..."
    cp .env.example .env
    echo "⚠️  Please update .env with your database credentials!"
    exit 1
fi

# Load environment variables
export $(grep -v '^#' .env | xargs)

# Check database connection
echo "🔍 Checking database connection..."
python3 -c "
import asyncio
from sqlalchemy.ext.asyncio import create_async_engine
from app.config import get_settings

async def check_db():
    settings = get_settings()
    engine = create_async_engine(
        settings.database_url.replace('postgresql://', 'postgresql+asyncpg://'),
        echo=False
    )
    try:
        async with engine.connect() as conn:
            print('✅ Database connection successful')
    except Exception as e:
        print(f'❌ Database connection failed: {e}')
        exit(1)
    finally:
        await engine.dispose()

asyncio.run(check_db())
" || exit 1

# Run migrations
echo "🗄️  Running database migrations..."
alembic upgrade head

# Start server
echo "🌐 Starting FastAPI server..."
echo "📍 Server will be available at http://localhost:8000"
echo "📚 API docs at http://localhost:8000/docs"
echo ""

uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
