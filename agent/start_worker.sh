#!/bin/bash

# Worker startup script

set -e

echo "🚀 Starting MedServicePrice Agent Worker..."

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
    echo "⚠️  Please update .env with your configuration!"
    exit 1
fi

# Start Celery worker
echo "👷 Starting Celery worker..."
echo "📍 Worker will process tasks from Redis"
echo ""

celery -A app.main worker --loglevel=info --concurrency=4
