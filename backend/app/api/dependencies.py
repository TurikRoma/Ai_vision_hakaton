from typing import Annotated, AsyncGenerator

from fastapi import Depends, HTTPException, status, Request
from fastapi.security import APIKeyHeader, OAuth2PasswordBearer
from jose import JWTError, jwt
from pydantic import ValidationError
from sqlalchemy.ext.asyncio import AsyncSession
from app.services.ml_pipeline import ModelPipeline, get_pipeline

from app.core import config, security
from app.crud import user as crud_user
from app.db import models
from app.db.session import async_session_maker
from app.schemas import token as schemas_token


reusable_oauth2 = OAuth2PasswordBearer(
    tokenUrl=f"{config.settings}/auth/access-token"
)

APIKeyHeader = APIKeyHeader(name="X-API-KEY")


async def get_db_session() -> AsyncGenerator[AsyncSession, None]:
    async with async_session_maker() as session:
        yield session


async def get_current_user(
    db: Annotated[AsyncSession, Depends(get_db_session)],
    token: Annotated[str, Depends(reusable_oauth2)],
) -> models.User:
    try:
        payload = jwt.decode(
            token,
            config.settings.SECRET_KEY,
            algorithms=[security.ALGORITHM],
        )
        token_data = schemas_token.TokenData(**payload)
    except (JWTError, ValidationError):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Could not validate credentials",
        )
    user = await crud_user.get_user_by_email(db, email=token_data.sub)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return user


async def get_optional_current_user(
    token: Annotated[str | None, Depends(reusable_oauth2)] = None,
    db: Annotated[AsyncSession, Depends(get_db_session)] = None,
) -> models.User | None:
    if token:
        try:
            return await get_current_user(db, token)
        except HTTPException:
            return None
    return None


async def api_key_auth(
    x_api_key: Annotated[str, Depends(APIKeyHeader)],
) -> bool:
    if x_api_key != config.settings.INTERNAL_API_KEY:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid API Key",
        )
    return True
