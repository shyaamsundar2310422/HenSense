# db.py
from pathlib import Path
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base
import os

BASE_DIR = Path(__file__).resolve().parent
DB_PATH = BASE_DIR / "app.db"
# sqlite URL
SQLALCHEMY_DATABASE_URL = f"sqlite:///{DB_PATH}"

# For sqlite we need check_same_thread=False when using multiple threads
engine = create_engine(
    SQLALCHEMY_DATABASE_URL,
    connect_args={"check_same_thread": False},
    echo=False,  # set True to see SQL logs
)

# Session factory
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Base class for models (what models should import)
Base = declarative_base()

def get_db():
    """
    Yield a DB session; intended for FastAPI dependency injection.
    Usage in routes: 
       from db import get_db
       db = Depends(get_db)
    """
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# optional helper to create DB tables programmatically
def init_db():
    Base.metadata.create_all(bind=engine)

if __name__ == "__main__":
    # create DB file and tables when run directly
    DB_PATH.parent.mkdir(parents=True, exist_ok=True)
    init_db()
    print(f"Initialized DB at {DB_PATH}")
