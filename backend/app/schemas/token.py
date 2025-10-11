from pydantic import BaseModel


class Token(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str


class TokenData(BaseModel):
    sub: str | None = None


class RefreshToken(BaseModel):
    refresh_token: str
