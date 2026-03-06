from __future__ import annotations

from pydantic import BaseModel


class CategoryBreakdown(BaseModel):
    category: str
    revenue: float
    cogs: float
    gross_profit: float
    item_count: int


class DashboardSummary(BaseModel):
    # Revenue
    total_revenue: float
    total_cogs: float
    gross_profit: float
    gross_margin_pct: float

    # Expenses
    total_expenses: float
    net_profit: float

    # Counts
    sale_count: int
    expense_count: int

    # Category breakdown
    category_breakdown: list[CategoryBreakdown]

    # Stock alerts count
    stock_alert_count: int

    # Period
    date_from: str
    date_to: str


class EodReport(BaseModel):
    date: str
    total_revenue: float
    total_cogs: float
    gross_profit: float
    total_expenses: float
    net_profit: float
    sale_count: int
    top_products: list[dict]
    expense_breakdown: list[dict]
    stock_alerts: list[dict]
