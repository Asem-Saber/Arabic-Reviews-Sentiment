import os
from dotenv import load_dotenv
load_dotenv()

class Settings:
    APP_NAME: str = os.getenv("APP_NAME", "ASAP")
    APP_VERSION: str = os.getenv("APP_VERSION", "1.0.0")

    # Model settings
    MODEL_PATH: str = os.getenv("MODEL_PATH", "model/cls_model")
    LABEL_MAP_PATH: str = os.getenv("LABEL_MAP_PATH", "model/label_map.json")
    DEVICE: int = int(os.getenv("DEVICE", -1))
    MAX_LENGTH: int = int(os.getenv("MAX_LENGTH", 128))

    # PostgreSQL settings
    POSTGRES_HOST: str = os.getenv("POSTGRES_HOST", "localhost")
    POSTGRES_PORT: int = int(os.getenv("POSTGRES_PORT", 5432))
    POSTGRES_DB: str = os.getenv("POSTGRES_DB", "arabic_sentiment")
    POSTGRES_USER: str = os.getenv("POSTGRES_USER", "postgres")
    POSTGRES_PASSWORD: str = os.getenv("POSTGRES_PASSWORD", "")
    
    # construct database URL
    @property
    def DATABASE_URL(self) -> str:
        return (
            f"postgresql://{self.POSTGRES_USER}:{self.POSTGRES_PASSWORD}"
            f"@{self.POSTGRES_HOST}:{self.POSTGRES_PORT}/{self.POSTGRES_DB}"
        )

    # Logging
    LOG_FILE: str = os.getenv("LOG_FILE", "logs/app.log")

    # API settings
    API_HOST: str = os.getenv("API_HOST", "0.0.0.0")
    API_PORT: int = int(os.getenv("API_PORT", 8000))

    # Frontend settings
    FRONTEND_BACKEND_URL: str = os.getenv("FRONTEND_BACKEND_URL", "http://backend:8000")

settings = Settings()