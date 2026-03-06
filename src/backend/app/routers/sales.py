from __future__ import annotations

import uuid
from datetime import date, datetime, timezone

from fastapi import APIRouter, HTTPException, Query, status
from sqlalchemy import func, select
from sqlalchemy.orm import selectinload

from app.deps import CurrentUser, DbDep
from app.models.product import Product
from app.models.sale import Sale, SaleItem
from app.schemas.sale import SaleCreate, SaleListOut, SaleOut

router = APIRouter(prefix="/sales", tags=["sales"])


def _sale_slug() -> str:
    return f"sal-{uuid.uuid4().hex[:8]}"


def _item_slug() -> str:
    return f"sli-{uuid.uuid4().hex[:8]}"


@router.get("", response_model=SaleListOut)
async def list_sales(
    current_user: CurrentUser,
    db: DbDep,
    date_from: date | None = Query(default=None),
    date_to: date | None = Query(default=None),
    payment_method: str | None = Query(default=None),
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=20, le=100),
):
    filters = []
    if date_from:
        filters.append(Sale.sold_at >= datetime(date_from.year, date_from.month, date_from.day))
    if date_to:
        filters.append(Sale.sold_at <= datetime(date_to.year, date_to.month, date_to.day, 23, 59, 59))
    if payment_method:
        filters.append(Sale.payment_method == payment_method)

    total_q = await db.execute(select(func.count(Sale.id)).where(*filters))
    total = total_q.scalar_one()

    result = await db.execute(
        select(Sale)
        .where(*filters)
        .options(selectinload(Sale.items))
        .order_by(Sale.sold_at.desc())
        .offset((page - 1) * page_size)
        .limit(page_size)
    )
    sales = result.scalars().all()

    items = []
    for s in sales:
        out = SaleOut.model_validate(s)
        out.gross_profit = round(s.total_amount - s.total_cogs, 2)
        items.append(out)

    return SaleListOut(items=items, total=total, page=page, page_size=page_size)


@router.post("", response_model=SaleOut, status_code=status.HTTP_201_CREATED)
async def create_sale(body: SaleCreate, current_user: CurrentUser, db: DbDep):
    sold_at = body.sold_at or datetime.now(timezone.utc)

    # Resolve products
    product_ids = [item.product_id for item in body.items]
    result = await db.execute(select(Product).where(Product.id.in_(product_ids)))
    products = {p.id: p for p in result.scalars().all()}

    for item in body.items:
        if item.product_id not in products:
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail={"code": "PRODUCT_NOT_FOUND", "product_id": item.product_id},
            )

    # Build sale
    sale = Sale(
        slug=_sale_slug(),
        payment_method=body.payment_method,
        note=body.note,
        recorded_by=current_user.id,
        sold_at=sold_at,
    )
    db.add(sale)
    await db.flush()  # get sale.id

    total_amount = 0.0
    total_cogs = 0.0

    for item_data in body.items:
        product = products[item_data.product_id]
        unit_price = item_data.unit_price if item_data.unit_price is not None else float(product.sale_price)
        unit_cogs = float(product.cogs_per_unit)
        line_total = round(unit_price * item_data.quantity, 2)

        sale_item = SaleItem(
            slug=_item_slug(),
            sale_id=sale.id,
            product_id=product.id,
            quantity=item_data.quantity,
            unit_price=unit_price,
            unit_cogs=unit_cogs,
            line_total=line_total,
        )
        db.add(sale_item)
        total_amount += line_total
        total_cogs += round(unit_cogs * item_data.quantity, 2)
        # Deduct stock — do this before any flush to avoid lazy-load errors
        product.stock_count = float(product.stock_count) - item_data.quantity

    sale.total_amount = round(total_amount, 2)
    sale.total_cogs = round(total_cogs, 2)
    await db.flush()

    # Reload to get server-generated fields (created_at) and eager-load items
    result = await db.execute(
        select(Sale).where(Sale.id == sale.id).options(selectinload(Sale.items))
    )
    sale = result.scalar_one()

    out = SaleOut.model_validate(sale)
    out.gross_profit = round(sale.total_amount - sale.total_cogs, 2)
    return out


@router.get("/{sale_id}", response_model=SaleOut)
async def get_sale(sale_id: str, current_user: CurrentUser, db: DbDep):
    result = await db.execute(select(Sale).where(Sale.id == sale_id))
    sale = result.scalar_one_or_none()
    if not sale:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail={"code": "RESOURCE_NOT_FOUND"})
    out = SaleOut.model_validate(sale)
    out.gross_profit = round(sale.total_amount - sale.total_cogs, 2)
    return out


@router.delete("/{sale_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_sale(sale_id: str, current_user: CurrentUser, db: DbDep):
    result = await db.execute(select(Sale).where(Sale.id == sale_id))
    sale = result.scalar_one_or_none()
    if not sale:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail={"code": "RESOURCE_NOT_FOUND"})
    await db.delete(sale)
