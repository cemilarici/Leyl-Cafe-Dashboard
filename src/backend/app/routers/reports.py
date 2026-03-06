from __future__ import annotations

from datetime import date, datetime, timezone

from fastapi import APIRouter, Query
from sqlalchemy import func, select

from app.deps import CurrentUser, DbDep
from app.models.expense import Expense
from app.models.inventory import StockMovement
from app.models.product import Category, Ingredient, Product
from app.models.sale import Sale, SaleItem
from app.schemas.dashboard import EodReport

router = APIRouter(prefix="/reports", tags=["reports"])


@router.get("/eod", response_model=EodReport)
async def end_of_day_report(
    current_user: CurrentUser,
    db: DbDep,
    report_date: date = Query(default_factory=date.today),
):
    from_dt = datetime(report_date.year, report_date.month, report_date.day, tzinfo=timezone.utc)
    to_dt = datetime(report_date.year, report_date.month, report_date.day, 23, 59, 59, tzinfo=timezone.utc)

    # Sales
    sales_row = (await db.execute(
        select(
            func.coalesce(func.sum(Sale.total_amount), 0).label("revenue"),
            func.coalesce(func.sum(Sale.total_cogs), 0).label("cogs"),
            func.count(Sale.id).label("count"),
        ).where(Sale.sold_at >= from_dt, Sale.sold_at <= to_dt)
    )).one()

    # Expenses
    exp_row = (await db.execute(
        select(func.coalesce(func.sum(Expense.amount), 0).label("total"))
        .where(Expense.expense_date == report_date)
    )).one()

    # Top products
    top_q = await db.execute(
        select(
            Product.name,
            func.sum(SaleItem.quantity).label("qty"),
            func.sum(SaleItem.line_total).label("revenue"),
        )
        .join(Sale, Sale.id == SaleItem.sale_id)
        .join(Product, Product.id == SaleItem.product_id)
        .where(Sale.sold_at >= from_dt, Sale.sold_at <= to_dt)
        .group_by(Product.name)
        .order_by(func.sum(SaleItem.line_total).desc())
        .limit(10)
    )
    top_products = [{"name": r.name, "quantity": float(r.qty), "revenue": float(r.revenue)} for r in top_q]

    # Expense breakdown
    exp_breakdown_q = await db.execute(
        select(Expense.category, func.sum(Expense.amount).label("total"))
        .where(Expense.expense_date == report_date)
        .group_by(Expense.category)
    )
    expense_breakdown = [{"category": r.category, "amount": float(r.total)} for r in exp_breakdown_q]

    # Stock alerts
    alerts_q = await db.execute(
        select(Ingredient.name, Ingredient.stock_balance, Ingredient.low_stock_threshold, Ingredient.unit)
        .where(Ingredient.low_stock_threshold > 0, Ingredient.stock_balance <= Ingredient.low_stock_threshold)
    )
    stock_alerts = [
        {"name": r.name, "stock_balance": float(r.stock_balance),
         "threshold": float(r.low_stock_threshold), "unit": r.unit}
        for r in alerts_q
    ]

    revenue = float(sales_row.revenue)
    cogs = float(sales_row.cogs)
    gross_profit = round(revenue - cogs, 2)
    expenses = float(exp_row.total)

    return EodReport(
        date=str(report_date),
        total_revenue=revenue,
        total_cogs=cogs,
        gross_profit=gross_profit,
        total_expenses=expenses,
        net_profit=round(gross_profit - expenses, 2),
        sale_count=sales_row.count,
        top_products=top_products,
        expense_breakdown=expense_breakdown,
        stock_alerts=stock_alerts,
    )
