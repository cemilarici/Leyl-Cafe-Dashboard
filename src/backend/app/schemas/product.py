from __future__ import annotations

from datetime import datetime

from pydantic import BaseModel, field_validator


class CategoryOut(BaseModel):
    id: str
    name: str
    sort_order: int

    model_config = {"from_attributes": True}


class CategoryCreate(BaseModel):
    name: str
    sort_order: int = 0


class ProductBase(BaseModel):
    name: str
    category_id: str
    unit: str = "adet"
    sale_price: float
    cogs_per_unit: float = 0.0
    low_stock_threshold: float = 0.0
    stock_count: float = 0.0
    is_active: bool = True

    @field_validator("sale_price", "cogs_per_unit", "low_stock_threshold")
    @classmethod
    def non_negative(cls, v: float) -> float:
        if v < 0:
            raise ValueError("must be >= 0")
        return v


class ProductCreate(ProductBase):
    pass


class ProductUpdate(BaseModel):
    name: str | None = None
    category_id: str | None = None
    unit: str | None = None
    sale_price: float | None = None
    cogs_per_unit: float | None = None
    low_stock_threshold: float | None = None
    is_active: bool | None = None
    # stock_count intentionally excluded — use /stock endpoint


class ProductStockAdjust(BaseModel):
    delta: float  # positive = add stock, negative = consume
    note: str | None = None


class ProductOut(ProductBase):
    id: str
    slug: str
    created_at: datetime
    updated_at: datetime
    category: CategoryOut | None = None

    model_config = {"from_attributes": True}


class ProductListOut(BaseModel):
    items: list[ProductOut]
    total: int
    page: int
    page_size: int


class IngredientBase(BaseModel):
    name: str
    unit: str
    stock_balance: float = 0.0
    low_stock_threshold: float = 0.0
    cost_per_unit: float = 0.0


class IngredientCreate(IngredientBase):
    pass


class IngredientOut(IngredientBase):
    id: str
    created_at: datetime

    model_config = {"from_attributes": True}
