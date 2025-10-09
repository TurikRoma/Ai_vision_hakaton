from datetime import datetime

from sqlalchemy import delete, select, update
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.models import UserRefreshToken


async def create_refresh_token(
    db: AsyncSession, user_id: int, token: str, expires_at: datetime
) -> UserRefreshToken:
    """Create a new refresh token."""
    db_token = UserRefreshToken(
        user_id=user_id, refresh_token=token, expires_at=expires_at
    )
    db.add(db_token)
    await db.commit()
    await db.refresh(db_token)
    return db_token


async def get_refresh_token_by_value(
    db: AsyncSession, token: str
) -> UserRefreshToken | None:
    """Get a refresh token by its value."""
    result = await db.execute(
        select(UserRefreshToken).where(UserRefreshToken.refresh_token == token)
    )
    return result.scalars().first()


async def delete_refresh_token(db: AsyncSession, token_id: int) -> None:
    """Delete a refresh token by its id."""
    await db.execute(delete(UserRefreshToken).where(UserRefreshToken.id == token_id))
    await db.commit()

async def revoke_refresh_token(db: AsyncSession, token_id: int) -> None:
    """Revoke a refresh token by its id."""
    await db.execute(
        update(UserRefreshToken).where(UserRefreshToken.id == token_id).values(revoked=True)
    )
    await db.commit()
