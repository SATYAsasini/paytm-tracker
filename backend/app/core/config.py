import os

class Settings:
    PROJECT_NAME: str = "Money Tracker API"
    SECRET_KEY: str = os.getenv("SECRET_KEY", "super_secure_money_tracker_key_12345")
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "1440"))
    
    _database_url: str = os.getenv("DATABASE_URL", "sqlite:///expenses.db")
    
    @property
    def DATABASE_URL(self) -> str:
        # SQLAlchemy 1.4+ removed support for 'postgres://' (used by many platforms)
        # and requires 'postgresql://'
        url = self._database_url
        if url.startswith("postgres://"):
            url = url.replace("postgres://", "postgresql://", 1)
        return url

settings = Settings()
