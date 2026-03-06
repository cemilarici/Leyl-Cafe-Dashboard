from __future__ import annotations

from datetime import datetime, timezone

from fastapi import APIRouter, HTTPException, Query, status
from sqlalchemy import func, select

from app.deps import CurrentUser, DbDep
from app.models.inventory import StockMovement
from app.models.product import Ingredient
from app.schemas.inventory import (
    StockAlertItem,
    StockAlertsOut,
    StockMovementCreate,
    StockMovementListOut,
    StockMovementOut,
)

router = APIRouter(prefix="/inventory", tags=["inventory"])


@router.get("/alerts", response_model=StockAlertsOut)
async def get_stock_alerts(current_user: CurrentUser, db: DbDep):
    result = await db.execute(
        select(Ingredient).where(
            Ingredient.low_stock_threshold > 0,
            Ingredient.stock_balance <= Ingredient.low_stock_threshold,
        ).order_by(Ingredient.stock_balance)
    )
    items = result.scalars().all()
    alerts = [
        StockAlertItem(
            ingredient_id=i.id,
            name=i.name,
            unit=i.unit,
            stock_balance=float(i.stock_balance),
            low_stock_threshold=float(i.low_stock_threshold),
        )
        for i in items
    ]
    return StockAlertsOut(items=alerts, count=len(alerts))


@router.get("/movements", response_model=StockMovementListOut)
async def list_movements(
    current_user: CurrentUser,
    db: DbDep,
    ingredient_id: str | None = Query(default=None),
    movement_type: str | None = Query(default=None),
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=20, le=100),
):
    q = select(StockMovement).order_by(StockMovement.moved_at.desc())
    if ingredient_id:
        q = q.where(StockMovement.ingredient_id == ingredient_id)
    if movement_type:
        q = q.where(StockMovement.movement_type == movement_type)

    total = (await db.execute(select(func.count()).select_from(q.subquery()))).scalar_one()
    items = (await db.execute(q.offset((page - 1) * page_size).limit(page_size))).scalars().all()

    return StockMovementListOut(
        items=[StockMovementOut.model_validate(m) for m in items],
        total=total,
        page=page,
        page_size=page_size,
    )


@router.post("/movements", response_model=StockMovementOut, status_code=status.HTTP_201_CREATED)
async def create_movement(body: StockMovementCreate, current_user: CurrentUser, db: DbDep):
    # Verify ingredient exists
    result = await db.execute(select(Ingredient).where(Ingredient.id == body.ingredient_id))
    ingredient = result.scalar_one_or_none()
    if not ingredient:
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                            detail={"code": "INGREDIENT_NOT_FOUND"})

    moved_at = body.moved_at or datetime.now(timezone.utc)

    movement = StockMovement(
        ingredient_id=body.ingredient_id,
        movement_type=body.movement_type,
        quantity_delta=body.quantity_delta,
        unit_cost=body.unit_cost,
        note=body.note,
        performed_by=current_user.id,
        moved_at=moved_at,
    )
    db.add(movement)

    # Update stock balance atomically
    new_balance = float(ingredient.stock_balance) + body.quantity_delta
    if new_balance < 0:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail={"code": "STOCK_BELOW_ZERO", "current": float(ingredient.stock_balance), "delta": body.quantity_delta},
        )
    ingredient.stock_balance = new_balance
    await db.flush()

    return StockMovementOut.model_validate(movement)
