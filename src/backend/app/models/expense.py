from __future__ import annotations

import uuid
from datetime import date, datetime

from sqlalchemy import Date, DateTime, ForeignKey, Numeric, String, Text, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


class Expense(Base):
    __tablename__ = "expenses"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    category: Mapped[str] = mapped_column(String(50), nullable=False)  # kira | elektrik | personel | malzeme | diger
    amount: Mapped[float] = mapped_column(Numeric(10, 2), nullable=False)
    description: Mapped[str | None] = mapped_column(String(255), nullable=True)
    expense_date: Mapped[date] = mapped_column(Date, nullable=False, index=True)
    recorded_by: Mapped[str] = mapped_column(String(36), ForeignKey("users.id"), nullable=False, index=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, nullable=False, server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(DateTime, nullable=False, server_default=func.now(), onupdate=func.now())

    recorded_by_user: Mapped["User"] = relationship("User", back_populates="expenses")
