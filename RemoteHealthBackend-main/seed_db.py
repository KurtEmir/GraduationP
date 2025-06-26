import logging
from app.db.session import SessionLocal, engine
from app.db.init_db import init_db
from app.models.base import Base

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def seed_data():
    db = SessionLocal()
    try:
        logger.info("Creating tables...")
        Base.metadata.create_all(bind=engine)
        logger.info("Tables created.")
        
        logger.info("Initializing database...")
        init_db(db)
        logger.info("Database initialization finished.")
    finally:
        db.close()

if __name__ == "__main__":
    seed_data() 