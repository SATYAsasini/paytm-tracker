from sqlmodel import create_engine, SQLModel, Session
from app.core.config import settings

class DatabaseManager:
    _instance = None
    _engine = None

    def __new__(cls):
        if cls._instance is None:
            cls._instance = super(DatabaseManager, cls).__new__(cls)
            connect_args = {"check_same_thread": False} if "sqlite" in settings.DATABASE_URL else {}
            cls._engine = create_engine(settings.DATABASE_URL, connect_args=connect_args)
        return cls._instance

    @property
    def engine(self):
        return self._engine

db_manager = DatabaseManager()

def create_db_and_tables():
    SQLModel.metadata.create_all(db_manager.engine)

def get_session():
    with Session(db_manager.engine) as session:
        yield session
