from __future__ import annotations

from datetime import datetime
from typing import Literal

from pydantic import BaseModel, field_validator


class StockMovementCreate(BaseModel):
    ingredient_id: str
    movement_type: Literal["purchase", "consumption", "adjustment", "waste"]
    quantity_delta: float
    unit_cost: float | None = None
    note: str | None = None
    moved_at: datetime | None = None


class StockMovementOut(BaseModel):
    id: str
    ingredient_id: str
    ingredient_name: str | None = None
    movement_type: str
    quantity_delta: float
    unit_cost: float | None
    note: str | None
    performed_by: str
    moved_at: datetime
    created_at: datetime

    model_config = {"from_attributes": True}


class StockMovementListOut(BaseModel):
    items: list[StockMovementOut]
    total: int
    page: int
    page_size: int


class StockAlertItem(BaseModel):
    ingredient_id: str
    name: str
    unit: str
    stock_balance: float
    low_stock_threshold: float


class StockAlertsOut(BaseModel):
    items: list[StockAlertItem]
    count: int
