from sqlalchemy.ext.asyncio import async_sessionmaker, create_async_engine

from app.core.config import settings
from pydantic import PostgresDsn


def get_uri():
    return str(
        PostgresDsn.build(
            scheme="postgresql+asyncpg",
            username=settings.POSTGRES_USER,
            password=settings.POSTGRES_PASSWORD,
            host=settings.POSTGRES_SERVER,
            path=settings.POSTGRES_DB,
        )
    )


engine = create_async_engine(get_uri())
async_session_maker = async_sessionmaker(engine, expire_on_commit=False)
