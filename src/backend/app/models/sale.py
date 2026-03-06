from __future__ import annotations

import uuid
from datetime import datetime

from sqlalchemy import DateTime, ForeignKey, Numeric, String, Text, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


class Sale(Base):
    __tablename__ = "sales"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    slug: Mapped[str] = mapped_column(String(40), unique=True, nullable=False)
    payment_method: Mapped[str] = mapped_column(String(20), nullable=False)
    total_amount: Mapped[float] = mapped_column(Numeric(10, 2), nullable=False, default=0.0)
    total_cogs: Mapped[float] = mapped_column(Numeric(10, 2), nullable=False, default=0.0)
    note: Mapped[str | None] = mapped_column(Text, nullable=True)
    recorded_by: Mapped[str] = mapped_column(String(36), ForeignKey("users.id"), nullable=False, index=True)
    sold_at: Mapped[datetime] = mapped_column(DateTime, nullable=False, index=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, nullable=False, server_default=func.now())

    recorded_by_user: Mapped["User"] = relationship("User", back_populates="sales")
    items: Mapped[list["SaleItem"]] = relationship("SaleItem", back_populates="sale", cascade="all, delete-orphan", lazy="selectin")

    def __repr__(self) -> str:
        return f"<Sale {self.slug} amount={self.total_amount}>"


class SaleItem(Base):
    __tablename__ = "sale_items"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    slug: Mapped[str] = mapped_column(String(40), unique=True, nullable=False)
    sale_id: Mapped[str] = mapped_column(String(36), ForeignKey("sales.id", ondelete="CASCADE"), nullable=False, index=True)
    product_id: Mapped[str] = mapped_column(String(36), ForeignKey("products.id"), nullable=False, index=True)
    quantity: Mapped[float] = mapped_column(Numeric(10, 3), nullable=False)
    unit_price: Mapped[float] = mapped_column(Numeric(10, 2), nullable=False)
    unit_cogs: Mapped[float] = mapped_column(Numeric(10, 2), nullable=False, default=0.0)
    line_total: Mapped[float] = mapped_column(Numeric(10, 2), nullable=False)

    sale: Mapped["Sale"] = relationship("Sale", back_populates="items")
    product: Mapped["Product"] = relationship("Product", back_populates="sale_items")
