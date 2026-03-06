from __future__ import annotations

import uuid
from datetime import datetime

from sqlalchemy import Boolean, DateTime, ForeignKey, String, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


class User(Base):
    __tablename__ = "users"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    email: Mapped[str] = mapped_column(String(255), unique=True, nullable=False, index=True)
    password_hash: Mapped[str] = mapped_column(String(255), nullable=False)
    full_name: Mapped[str] = mapped_column(String(100), nullable=False)
    role: Mapped[str] = mapped_column(String(20), nullable=False, default="manager")
    is_active: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, nullable=False, server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(DateTime, nullable=False, server_default=func.now(), onupdate=func.now())

    # relationships
    sales: Mapped[list["Sale"]] = relationship("Sale", back_populates="recorded_by_user", lazy="noload")
    stock_movements: Mapped[list["StockMovement"]] = relationship("StockMovement", back_populates="performed_by_user", lazy="noload")
    expenses: Mapped[list["Expense"]] = relationship("Expense", back_populates="recorded_by_user", lazy="noload")
    import_jobs: Mapped[list["ImportJob"]] = relationship("ImportJob", back_populates="created_by_user", lazy="noload")
    refresh_tokens: Mapped[list["RefreshTokenDenylist"]] = relationship("RefreshTokenDenylist", back_populates="user", lazy="noload")

    def __repr__(self) -> str:
        return f"<User {self.email} role={self.role}>"


class RefreshTokenDenylist(Base):
    __tablename__ = "refresh_token_denylist"

    jti: Mapped[str] = mapped_column(String(36), primary_key=True)
    user_id: Mapped[str] = mapped_column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    expires_at: Mapped[datetime] = mapped_column(DateTime, nullable=False, index=True)
    revoked_at: Mapped[datetime] = mapped_column(DateTime, nullable=False, server_default=func.now())

    user: Mapped["User"] = relationship("User", back_populates="refresh_tokens")
