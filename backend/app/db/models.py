import sqlalchemy as sa
from sqlalchemy.orm import mapped_column, Mapped, relationship

from .base import Base


class User(Base):
    __tablename__ = "users"

    id: Mapped[int] = mapped_column(primary_key=True)
    email: Mapped[str] = mapped_column(sa.String(255), unique=True, index=True)
    hashed_password: Mapped[str] = mapped_column(sa.Text)
    is_active: Mapped[bool] = mapped_column(sa.Boolean, default=True)

    analyses: Mapped[list["Analysis"]] = relationship(back_populates="owner")
    user_refresh_tokens: Mapped[list["UserRefreshToken"]] = relationship(
        "UserRefreshToken", back_populates="user"
    )


class Analysis(Base):
    __tablename__ = "analyses"

    id: Mapped[int] = mapped_column(primary_key=True)
    image_path: Mapped[str] = mapped_column(sa.String(1024))
    result: Mapped[dict] = mapped_column(sa.JSON, nullable=True)
    created_at: Mapped[sa.DateTime] = mapped_column(
        sa.DateTime(timezone=True), default=sa.func.now()
    )
    owner_id: Mapped[int] = mapped_column(sa.ForeignKey("users.id"))

    owner = relationship("User", back_populates="analyses")


class UserRefreshToken(Base):
    __tablename__ = "user_refresh_tokens"

    id: Mapped[int] = mapped_column(primary_key=True)
    refresh_token: Mapped[str] = mapped_column(sa.String(1024), index=True)
    expires_at: Mapped[sa.DateTime] = mapped_column(sa.DateTime(timezone=True))
    created_at: Mapped[sa.DateTime] = mapped_column(
        sa.DateTime(timezone=True), default=sa.func.now()
    )
    revoked: Mapped[bool] = mapped_column(sa.Boolean, default=False)
    user_id: Mapped[int] = mapped_column(sa.ForeignKey("users.id"))

    user = relationship("User", back_populates="user_refresh_tokens")
