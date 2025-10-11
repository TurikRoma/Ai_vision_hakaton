from pydantic import PostgresDsn, model_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=True,
    )

    POSTGRES_SERVER: str
    POSTGRES_USER: str
    POSTGRES_PASSWORD: str
    POSTGRES_DB: str
    DATABASE_URL: str
    POSTGRES_PORT: str
    PGDATA: str


    # JWT settings
    SECRET_KEY: str
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7
    ALGORITHM: str = "HS256"

    # MinIO settings
    MINIO_ENDPOINT: str 
    MINIO_ACCESS_KEY: str 
    MINIO_SECRET_KEY: str 
    MINIO_BUCKET: str 
    MINIO_USE_HTTPS: bool = False
    MINIO_ROOT_PASSWORD: str
    MINIO_ROOT_USER: str
    MINIO_PUBLIC_URL: str

    INTERNAL_API_KEY: str


settings = Settings()
