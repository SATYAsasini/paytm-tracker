import os

class Settings:
    PROJECT_NAME: str = "Money Tracker API"
    SECRET_KEY: str = os.getenv("SECRET_KEY", "super_secure_money_tracker_key_12345")
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "1440"))
    DATABASE_URL: str = os.getenv("DATABASE_URL", "sqlite:///expenses.db")

settings = Settings()
