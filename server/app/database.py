from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, DeclarativeBase
from dotenv import load_dotenv
import os

load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL", "")

if not DATABASE_URL:
    raise ValueError("DATABASE_URL environment variable is not set!")

# Ensure we use psycopg3 driver (not psycopg2)
if DATABASE_URL.startswith("postgresql://"):
    DATABASE_URL = DATABASE_URL.replace("postgresql://", "postgresql+psycopg://", 1)
# Remove channel_binding param (not supported by psycopg3 + SQLAlchemy)
if "channel_binding" in DATABASE_URL:
    import re
    DATABASE_URL = re.sub(r'[&?]channel_binding=[^&]*', '', DATABASE_URL)

engine = create_engine(
    DATABASE_URL,
    echo=False,
    pool_pre_ping=True,       # Verify connection is alive before using it
    pool_size=10,              # Keep 10 connections warm (no cold-start penalty)
    max_overflow=10,           # Allow up to 20 total during bursts
    pool_recycle=1800,         # Recycle connections every 30 minutes
    pool_timeout=10,           # Timeout waiting for a connection from pool
)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


class Base(DeclarativeBase):
    pass


def get_db():
    """FastAPI dependency: yields a database session per request."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
