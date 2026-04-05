import os
from pydantic import BaseModel
from dotenv import load_dotenv

load_dotenv()

class Settings(BaseModel):
    authjwt_secret_key: str = os.getenv("SECRET_KEY", "112224448f")
    DATABASE_URL: str = os.getenv("DATABASE_URL", "postgresql://postgres:mysecurepassword@localhost:5432/postgres")
    APP_NAME: str = "Timeceptor01"
    APP_VERSION: str = "1.0"
    ENVIRONMENT: str = os.getenv("ENVIRONMENT", "development")
    DEBUG: bool = ENVIRONMENT == "development"

settings = Settings()