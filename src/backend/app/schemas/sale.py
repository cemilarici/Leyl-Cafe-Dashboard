from __future__ import annotations

from datetime import datetime
from typing import Literal

from pydantic import BaseModel, field_validator


class SaleItemCreate(BaseModel):
    product_id: str
    quantity: float
    unit_price: float | None = None  # defaults to product.sale_price if omitted

    @field_validator("quantity")
    @classmethod
    def positive(cls, v: float) -> float:
        if v <= 0:
            raise ValueError("quantity must be > 0")
        return v


class SaleCreate(BaseModel):
    payment_method: Literal["cash", "card", "other"]
    items: list[SaleItemCreate]
    sold_at: datetime | None = None  # defaults to now
    note: str | None = None

    @field_validator("items")
    @classmethod
    def at_least_one(cls, v: list) -> list:
        if not v:
            raise ValueError("at least one item required")
        return v


class SaleItemOut(BaseModel):
    id: str
    product_id: str
    product_name: str | None = None
    quantity: float
    unit_price: float
    unit_cogs: float
    line_total: float

    model_config = {"from_attributes": True}


class SaleOut(BaseModel):
    id: str
    slug: str
    payment_method: str
    total_amount: float
    total_cogs: float
    gross_profit: float = 0.0
    note: str | None
    recorded_by: str
    sold_at: datetime
    created_at: datetime
    items: list[SaleItemOut] = []

    model_config = {"from_attributes": True}

    @classmethod
    def from_orm_with_profit(cls, sale: object) -> "SaleOut":
        obj = cls.model_validate(sale)
        obj.gross_profit = round(obj.total_amount - obj.total_cogs, 2)
        return obj


class SaleListOut(BaseModel):
    items: list[SaleOut]
    total: int
    page: int
    page_size: int
