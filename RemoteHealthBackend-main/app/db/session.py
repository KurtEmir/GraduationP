from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from app.core.config import settings

# Use connect_args only for SQLite
connect_args = {"check_same_thread": False} if settings.DATABASE_URL.startswith('sqlite') else {}

# Create the engine with the right configuration
engine = create_engine(
    settings.DATABASE_URL, 
    connect_args=connect_args
)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Dependency
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close() 