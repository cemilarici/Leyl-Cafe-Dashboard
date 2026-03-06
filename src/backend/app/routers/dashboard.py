from __future__ import annotations

from datetime import date, datetime, timezone

from fastapi import APIRouter, Query
from sqlalchemy import func, select

from app.deps import CurrentUser, DbDep
from app.models.expense import Expense
from app.models.inventory import StockMovement
from app.models.product import Category, Ingredient, Product
from app.models.sale import Sale, SaleItem
from app.schemas.dashboard import CategoryBreakdown, DashboardSummary

router = APIRouter(prefix="/dashboard", tags=["dashboard"])


@router.get("/summary", response_model=DashboardSummary)
async def get_summary(
    current_user: CurrentUser,
    db: DbDep,
    date_from: date = Query(default_factory=lambda: date.today().replace(day=1)),
    date_to: date = Query(default_factory=date.today),
):
    from_dt = datetime(date_from.year, date_from.month, date_from.day, tzinfo=timezone.utc)
    to_dt = datetime(date_to.year, date_to.month, date_to.day, 23, 59, 59, tzinfo=timezone.utc)

    # Sales aggregates
    sales_q = await db.execute(
        select(
            func.coalesce(func.sum(Sale.total_amount), 0).label("revenue"),
            func.coalesce(func.sum(Sale.total_cogs), 0).label("cogs"),
            func.count(Sale.id).label("count"),
        ).where(Sale.sold_at >= from_dt, Sale.sold_at <= to_dt)
    )
    sales_row = sales_q.one()
    total_revenue = float(sales_row.revenue)
    total_cogs = float(sales_row.cogs)
    sale_count = sales_row.count

    # Expenses (owner sees all; manager sees no personel)
    exp_filter = [Expense.expense_date >= date_from, Expense.expense_date <= date_to]
    if current_user.role != "owner":
        exp_filter.append(Expense.category != "personel")

    exp_q = await db.execute(
        select(
            func.coalesce(func.sum(Expense.amount), 0).label("total"),
            func.count(Expense.id).label("count"),
        ).where(*exp_filter)
    )
    exp_row = exp_q.one()
    total_expenses = float(exp_row.total)
    expense_count = exp_row.count

    # Category breakdown
    cat_q = await db.execute(
        select(
            Category.name.label("category"),
            func.coalesce(func.sum(SaleItem.line_total), 0).label("revenue"),
            func.coalesce(func.sum(SaleItem.unit_cogs * SaleItem.quantity), 0).label("cogs"),
            func.count(SaleItem.id).label("item_count"),
        )
        .join(Sale, Sale.id == SaleItem.sale_id)
        .join(Product, Product.id == SaleItem.product_id)
        .join(Category, Category.id == Product.category_id)
        .where(Sale.sold_at >= from_dt, Sale.sold_at <= to_dt)
        .group_by(Category.name)
        .order_by(func.sum(SaleItem.line_total).desc())
    )
    breakdown = [
        CategoryBreakdown(
            category=row.category,
            revenue=float(row.revenue),
            cogs=float(row.cogs),
            gross_profit=round(float(row.revenue) - float(row.cogs), 2),
            item_count=row.item_count,
        )
        for row in cat_q.all()
    ]

    # Stock alerts
    alerts_q = await db.execute(
        select(func.count(Ingredient.id)).where(
            Ingredient.low_stock_threshold > 0,
            Ingredient.stock_balance <= Ingredient.low_stock_threshold,
        )
    )
    stock_alert_count = alerts_q.scalar_one()

    gross_profit = round(total_revenue - total_cogs, 2)
    net_profit = round(gross_profit - total_expenses, 2)
    margin = round((gross_profit / total_revenue * 100) if total_revenue else 0, 1)

    return DashboardSummary(
        total_revenue=total_revenue,
        total_cogs=total_cogs,
        gross_profit=gross_profit,
        gross_margin_pct=margin,
        total_expenses=total_expenses,
        net_profit=net_profit,
        sale_count=sale_count,
        expense_count=expense_count,
        category_breakdown=breakdown,
        stock_alert_count=stock_alert_count,
        date_from=str(date_from),
        date_to=str(date_to),
    )
