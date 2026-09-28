"""
Database connection and session management.
"""

import os
import logging
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, Session

logger = logging.getLogger(__name__)

# Read from environment
DATABASE_URL = os.getenv(
    "DATABASE_URL",
    "postgresql://fraud_user:fraud_pass@localhost:5432/fraud_detection"
)

# Create engine
engine = create_engine(
    DATABASE_URL,
    echo=os.getenv("SQL_ECHO", "false").lower() == "true",
    pool_size=20,
    max_overflow=40,
    pool_recycle=3600
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


def get_db() -> Session:
    """Dependency for FastAPI routes."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def init_db():
    """Create all tables."""
    from ai_engine.backend.app.database.models import Base
    logger.info(f"Initializing database at {DATABASE_URL}")
    Base.metadata.create_all(bind=engine)
    logger.info("Database initialized")


def health_check() -> bool:
    """Check database connectivity."""
    try:
        with engine.connect() as conn:
            conn.execute("SELECT 1")
        return True
    except Exception as e:
        logger.error(f"Database health check failed: {e}")
        return False


if __name__ == "__main__":
    logging.basicConfig(level=logging.INFO)
    init_db()
