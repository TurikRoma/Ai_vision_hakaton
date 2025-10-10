from datetime import datetime, timedelta, timezone
from hashlib import sha256

from jose import jwt
from passlib.context import CryptContext

from app.core.config import settings

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

ALGORITHM = "HS256"


def create_access_token(data: dict):
    """Create an access JWT token."""
    to_encode = data.copy()
    expire = datetime.now(timezone.utc) + timedelta(
        minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES
    )
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(
        to_encode, settings.SECRET_KEY, algorithm=ALGORITHM
    )
    return encoded_jwt


def create_refresh_token(data: dict, expires_delta: timedelta | None = None):
    """Create a refresh JWT token."""
    to_encode = data.copy()
    expire = datetime.now(timezone.utc) + timedelta(
        days=settings.REFRESH_TOKEN_EXPIRE_DAYS
    )
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(
        to_encode, settings.SECRET_KEY, algorithm=ALGORITHM
    )
    return encoded_jwt


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verify a password against a hash."""
    password_hash = sha256(plain_password.encode()).hexdigest()
    return pwd_context.verify(password_hash, hashed_password)


def get_password_hash(password: str) -> str:
    """Hash a password."""
    password_hash = sha256(password.encode()).hexdigest()
    return pwd_context.hash(password_hash)


def get_refresh_token_hash(token: str) -> str:
    """Hash a refresh token using SHA256."""
    return sha256(token.encode()).hexdigest()
