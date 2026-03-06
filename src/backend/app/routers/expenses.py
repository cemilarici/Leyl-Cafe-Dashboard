from __future__ import annotations

from datetime import date

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import func, select

from app.deps import CurrentUser, DbDep, require_role
from app.models.expense import Expense
from app.schemas.expense import ExpenseCreate, ExpenseListOut, ExpenseOut, ExpenseUpdate

router = APIRouter(prefix="/expenses", tags=["expenses"],
                   dependencies=[Depends(require_role("owner"))])


@router.get("", response_model=ExpenseListOut)
async def list_expenses(
    current_user: CurrentUser,
    db: DbDep,
    date_from: date | None = Query(default=None),
    date_to: date | None = Query(default=None),
    category: str | None = Query(default=None),
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=20, le=100),
):
    q = select(Expense).order_by(Expense.expense_date.desc())
    if date_from:
        q = q.where(Expense.expense_date >= date_from)
    if date_to:
        q = q.where(Expense.expense_date <= date_to)
    if category:
        q = q.where(Expense.category == category)

    total = (await db.execute(select(func.count()).select_from(q.subquery()))).scalar_one()
    items = (await db.execute(q.offset((page - 1) * page_size).limit(page_size))).scalars().all()

    return ExpenseListOut(items=items, total=total, page=page, page_size=page_size)


@router.post("", response_model=ExpenseOut, status_code=status.HTTP_201_CREATED)
async def create_expense(body: ExpenseCreate, current_user: CurrentUser, db: DbDep):
    expense = Expense(**body.model_dump(), recorded_by=current_user.id)
    db.add(expense)
    await db.flush()
    return ExpenseOut.model_validate(expense)


@router.get("/{expense_id}", response_model=ExpenseOut)
async def get_expense(expense_id: str, current_user: CurrentUser, db: DbDep):
    result = await db.execute(select(Expense).where(Expense.id == expense_id))
    expense = result.scalar_one_or_none()
    if not expense:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail={"code": "RESOURCE_NOT_FOUND"})
    return ExpenseOut.model_validate(expense)


@router.patch("/{expense_id}", response_model=ExpenseOut)
async def update_expense(expense_id: str, body: ExpenseUpdate, current_user: CurrentUser, db: DbDep):
    result = await db.execute(select(Expense).where(Expense.id == expense_id))
    expense = result.scalar_one_or_none()
    if not expense:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail={"code": "RESOURCE_NOT_FOUND"})
    for field, value in body.model_dump(exclude_none=True).items():
        setattr(expense, field, value)
    await db.flush()
    return ExpenseOut.model_validate(expense)


@router.delete("/{expense_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_expense(expense_id: str, current_user: CurrentUser, db: DbDep):
    result = await db.execute(select(Expense).where(Expense.id == expense_id))
    expense = result.scalar_one_or_none()
    if not expense:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail={"code": "RESOURCE_NOT_FOUND"})
    await db.delete(expense)
