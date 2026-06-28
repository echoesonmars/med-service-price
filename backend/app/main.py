from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from contextlib import asynccontextmanager
import time

from app.config import get_settings
from app.api.v1 import services, categories, cities, seed

settings = get_settings()


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Lifecycle events"""
    # Startup
    print("🚀 Starting MedServicePrice Backend API...")
    yield
    # Shutdown
    print("👋 Shutting down...")


app = FastAPI(
    title="MedServicePrice API",
    description="Агрегатор цен на медицинские услуги",
    version="1.0.0",
    lifespan=lifespan,
)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # В продакшене указать конкретные домены
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# Request timing middleware
@app.middleware("http")
async def add_process_time_header(request: Request, call_next):
    start_time = time.time()
    response = await call_next(request)
    process_time = (time.time() - start_time) * 1000  # в миллисекундах
    response.headers["X-Process-Time"] = f"{process_time:.2f}ms"
    return response


# Health check
@app.get("/health")
async def health_check():
    return {
        "status": "healthy",
        "service": "medserviceprice-backend",
        "version": "1.0.0"
    }


# Include routers
app.include_router(
    services.router,
    prefix=settings.api_v1_prefix,
    tags=["services"]
)

app.include_router(
    categories.router,
    prefix=settings.api_v1_prefix,
    tags=["categories"]
)

app.include_router(
    cities.router,
    prefix=settings.api_v1_prefix,
    tags=["cities"]
)

app.include_router(
    seed.router,
    prefix=settings.api_v1_prefix,
    tags=["seed"]
)


# Error handlers
@app.exception_handler(404)
async def not_found_handler(request: Request, exc):
    return JSONResponse(
        status_code=404,
        content={"detail": "Resource not found"}
    )


@app.exception_handler(500)
async def internal_error_handler(request: Request, exc):
    return JSONResponse(
        status_code=500,
        content={"detail": "Internal server error"}
    )


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "app.main:app",
        host=settings.api_host,
        port=settings.api_port,
        reload=True
    )
