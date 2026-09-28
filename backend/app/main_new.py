"""
Production FastAPI backend for fraud detection.

Features:
- PostgreSQL database with real schema
- Transaction ingest API (idempotent)
- Real-time ML scoring
- Alerts management
- Analyst feedback loop
- Dashboard metrics (all from DB)
- JWT auth (roles: analyst, admin)
- Structured logging
- Health endpoints
"""

import os
import sys
import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

# Add project root to path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.dirname(__file__))))

from backend.app.database.db import init_db, health_check
from backend.app.services.transaction_service import load_model
from backend.app.api.routes import transactions_new, alerts_new, dashboard_new

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    Startup and shutdown events.
    """
    # Startup
    logger.info("Starting up...")
    try:
        init_db()
        load_model()
        logger.info("✓ Database and model loaded")
    except Exception as e:
        logger.error(f"Startup failed: {e}", exc_info=True)
        sys.exit(1)
    
    yield
    
    # Shutdown
    logger.info("Shutting down...")


app = FastAPI(
    title="Fraud Detection API",
    description="Production ML pipeline for fraud detection",
    version="1.0.0",
    lifespan=lifespan
)

# CORS
origins = os.getenv("CORS_ORIGINS", "http://localhost:3000").split(",")
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(
    transactions_new.router,
    prefix="/api/transactions",
    tags=["transactions"]
)

app.include_router(
    alerts_new.router,
    prefix="/api/alerts",
    tags=["alerts"]
)

app.include_router(
    dashboard_new.router,
    prefix="/api/dashboard",
    tags=["dashboard"]
)


# Health endpoints
@app.get("/health")
async def health():
    """Basic health check."""
    return {"status": "ok"}


@app.get("/readiness")
async def readiness():
    """Readiness check (includes DB and model)."""
    db_ok = health_check()
    
    if not db_ok:
        return JSONResponse(
            status_code=503,
            content={"status": "not_ready", "reason": "Database unavailable"}
        )
    
    return {"status": "ready"}


# Error handlers
@app.exception_handler(Exception)
async def general_exception_handler(request: Request, exc: Exception):
    """Global exception handler."""
    logger.error(f"Unhandled exception: {exc}", exc_info=True)
    return JSONResponse(
        status_code=500,
        content={"detail": "Internal server error"}
    )


# Root
@app.get("/")
async def root():
    """API info."""
    return {
        "name": "Fraud Detection API",
        "version": "1.0.0",
        "docs": "/docs",
        "health": "/health",
        "readiness": "/readiness"
    }


if __name__ == "__main__":
    import uvicorn
    
    host = os.getenv("BACKEND_HOST", "0.0.0.0")
    port = int(os.getenv("BACKEND_PORT", 8000))
    
    logger.info(f"Starting server on {host}:{port}")
    
    uvicorn.run(
        "backend.app.main_new:app",
        host=host,
        port=port,
        reload=os.getenv("DEBUG", "false").lower() == "true"
    )
