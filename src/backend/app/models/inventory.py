from __future__ import annotations

import uuid
from datetime import datetime

from sqlalchemy import DateTime, ForeignKey, Numeric, String, Text, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


class StockMovement(Base):
    __tablename__ = "stock_movements"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    ingredient_id: Mapped[str] = mapped_column(String(36), ForeignKey("ingredients.id"), nullable=False, index=True)
    movement_type: Mapped[str] = mapped_column(String(20), nullable=False)  # purchase | consumption | adjustment | waste
    quantity_delta: Mapped[float] = mapped_column(Numeric(12, 3), nullable=False)  # positive=in, negative=out
    unit_cost: Mapped[float | None] = mapped_column(Numeric(10, 4), nullable=True)
    reference_sale_id: Mapped[str | None] = mapped_column(String(36), ForeignKey("sales.id", ondelete="SET NULL"), nullable=True, index=True)
    note: Mapped[str | None] = mapped_column(Text, nullable=True)
    performed_by: Mapped[str] = mapped_column(String(36), ForeignKey("users.id"), nullable=False, index=True)
    moved_at: Mapped[datetime] = mapped_column(DateTime, nullable=False, server_default=func.now(), index=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, nullable=False, server_default=func.now())

    ingredient: Mapped["Ingredient"] = relationship("Ingredient", back_populates="stock_movements")
    performed_by_user: Mapped["User"] = relationship("User", back_populates="stock_movements")
    reference_sale: Mapped["Sale | None"] = relationship("Sale", foreign_keys=[reference_sale_id])
