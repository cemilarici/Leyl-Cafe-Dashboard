from __future__ import annotations

from datetime import date, datetime
from typing import Literal

from pydantic import BaseModel, field_validator


ExpenseCategory = Literal["kira", "elektrik", "personel", "malzeme", "diger"]


class ExpenseCreate(BaseModel):
    category: ExpenseCategory
    amount: float
    description: str | None = None
    expense_date: date

    @field_validator("amount")
    @classmethod
    def positive(cls, v: float) -> float:
        if v <= 0:
            raise ValueError("amount must be > 0")
        return v


class ExpenseUpdate(BaseModel):
    category: ExpenseCategory | None = None
    amount: float | None = None
    description: str | None = None
    expense_date: date | None = None


class ExpenseOut(BaseModel):
    id: str
    category: str
    amount: float
    description: str | None
    expense_date: date
    recorded_by: str
    created_at: datetime

    model_config = {"from_attributes": True}


class ExpenseListOut(BaseModel):
    items: list[ExpenseOut]
    total: int
    page: int
    page_size: int
