from datetime import datetime, timedelta, timezone
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, Request, Response, status
from jose import JWTError, jwt
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.dependencies import get_db_session
from app.core.config import settings
from app.core.logging_config import get_logger
from app.core.security import (
    create_access_token,
    create_refresh_token,
    get_password_hash,
    get_refresh_token_hash,
    verify_password,
)
from app.crud import refresh_token as crud_refresh_token
from app.crud import user as crud_user
from app.schemas.token import RefreshToken, Token
from app.schemas.user import User, UserCreate

router = APIRouter()
logger = get_logger(__name__)


@router.post("/signup", response_model=Token)
async def signup(
    user_in: UserCreate,
    db: Annotated[AsyncSession, Depends(get_db_session)],
):
    """Sign up a new user and return tokens."""
    db_user = await crud_user.get_user_by_email(db, email=user_in.email)
    if db_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered",
        )
    hashed_password = get_password_hash(user_in.password)
    user_in_db = UserCreate(email=user_in.email, password=hashed_password)
    user = await crud_user.create_user(db=db, user_in=user_in_db)

    # Automatically log in the user after signup
    access_token = create_access_token(data={"sub": user.email})
    refresh_token = create_refresh_token(data={"sub": user.email})

    expires_at = datetime.now(timezone.utc) + timedelta(
        days=settings.REFRESH_TOKEN_EXPIRE_DAYS
    )
    hashed_refresh_token = get_refresh_token_hash(refresh_token)

    await crud_refresh_token.create_refresh_token(
        db,
        user_id=user.id,
        token=hashed_refresh_token,
        expires_at=expires_at,
    )

    return Token(
        access_token=access_token,
        refresh_token=refresh_token,
        token_type="bearer",
    )


@router.post("/login", response_model=Token)
async def login(
    db: Annotated[AsyncSession, Depends(get_db_session)],
    user_in: UserCreate,
):
    """Log in a user."""
    user = await crud_user.get_user_by_email(db, email=user_in.email)
    if not user or not verify_password(user_in.password, user.hashed_password):
        logger.warning("Failed login attempt for email: %s", user_in.email)
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )

    access_token = create_access_token(data={"sub": user.email})
    refresh_token = create_refresh_token(data={"sub": user.email})

    expires_at = datetime.now(timezone.utc) + timedelta(
        days=settings.REFRESH_TOKEN_EXPIRE_DAYS
    )
    hashed_refresh_token = get_refresh_token_hash(refresh_token)

    await crud_refresh_token.create_refresh_token(
        db,
        user_id=user.id,
        token=hashed_refresh_token,
        expires_at=expires_at,
    )

    logger.info("User %s logged in successfully", user.email)
    return Token(
        access_token=access_token,
        refresh_token=refresh_token,
        token_type="bearer",
    )


@router.post("/refresh", response_model=Token)
async def refresh(
    token_in: RefreshToken,
    db: Annotated[AsyncSession, Depends(get_db_session)],
):
    """Refresh an access token."""
    refresh_token_value = token_in.refresh_token
    if not refresh_token_value:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Refresh token not found",
        )

    try:
        payload = jwt.decode(
            refresh_token_value,
            settings.SECRET_KEY,
            algorithms=[settings.ALGORITHM],
        )
        email = payload.get("sub")
        if email is None:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Could not validate credentials",
            )
    except JWTError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Could not validate credentials",
        )

    hashed_token = get_refresh_token_hash(refresh_token_value)
    db_token = await crud_refresh_token.get_refresh_token_by_value(
        db, token=hashed_token
    )
    if not db_token or db_token.expires_at < datetime.now(timezone.utc):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Refresh token expired or invalid",
        )

    user = await crud_user.get_user_by_email(db, email=email)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found",
        )

    new_access_token = create_access_token(data={"sub": user.email})
    new_refresh_token = create_refresh_token(data={"sub": user.email})

    new_expires_at = datetime.now(timezone.utc) + timedelta(
        days=settings.REFRESH_TOKEN_EXPIRE_DAYS
    )
    new_hashed_refresh_token = get_refresh_token_hash(new_refresh_token)

    await crud_refresh_token.delete_refresh_token(db, token_id=db_token.id)
    await crud_refresh_token.create_refresh_token(
        db,
        user_id=user.id,
        token=new_hashed_refresh_token,
        expires_at=new_expires_at,
    )

    return Token(
        access_token=new_access_token,
        refresh_token=new_refresh_token,
        token_type="bearer",
    )


@router.post("/logout")
async def logout(
    token_in: RefreshToken,
    db: Annotated[AsyncSession, Depends(get_db_session)],
):
    """Log out a user."""
    refresh_token_value = token_in.refresh_token
    if refresh_token_value:
        hashed_token = get_refresh_token_hash(refresh_token_value)
        db_token = await crud_refresh_token.get_refresh_token_by_value(
            db, token=hashed_token
        )
        if db_token:
            await crud_refresh_token.revoke_refresh_token(
                db, token_id=db_token.id
            )

    return {"message": "Successfully logged out"}
