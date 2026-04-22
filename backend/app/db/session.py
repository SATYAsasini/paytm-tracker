from sqlmodel import create_engine, SQLModel, Session
from app.core.config import settings
import logging

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class DatabaseManager:
    _instance = None
    _engine = None

    def __new__(cls):
        if cls._instance is None:
            cls._instance = super(DatabaseManager, cls).__new__(cls)
            db_url = settings.DATABASE_URL
            logger.info(f"Connecting to database") # Don't log the full URL for security
            
            connect_args = {"check_same_thread": False} if "sqlite" in db_url else {}
            
            # pool_pre_ping=True is vital for serverless/long-lived connections 
            # to check if the connection is still alive before using it.
            cls._engine = create_engine(
                db_url, 
                connect_args=connect_args,
                pool_pre_ping=True,
                echo=False # Set to True for SQL debugging
            )
        return cls._instance

    @property
    def engine(self):
        return self._engine

db_manager = DatabaseManager()

def create_db_and_tables():
    try:
        SQLModel.metadata.create_all(db_manager.engine)
        logger.info("Database tables created successfully")
    except Exception as e:
        logger.error(f"Failed to create database tables: {e}")
        raise e

def get_session():
    with Session(db_manager.engine) as session:
        yield session
