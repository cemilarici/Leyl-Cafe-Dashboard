from __future__ import annotations

import re
import uuid

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import func, select
from sqlalchemy.orm import selectinload

from app.deps import CurrentUser, DbDep, require_role
from app.models.product import Category, Ingredient, Product
from app.schemas.product import (
    CategoryCreate,
    CategoryOut,
    IngredientCreate,
    IngredientOut,
    ProductCreate,
    ProductListOut,
    ProductOut,
    ProductStockAdjust,
    ProductUpdate,
)

router = APIRouter(prefix="/products", tags=["products"])


def _slugify(name: str, prefix: str = "prd") -> str:
    slug = re.sub(r"[^a-z0-9]+", "-", name.lower()).strip("-")[:30]
    return f"{prefix}-{slug}-{uuid.uuid4().hex[:4]}"


# ── Categories ─────────────────────────────────────────────────────────────

@router.get("/categories", response_model=list[CategoryOut])
async def list_categories(current_user: CurrentUser, db: DbDep):
    result = await db.execute(select(Category).order_by(Category.sort_order, Category.name))
    return result.scalars().all()


@router.post("/categories", response_model=CategoryOut, status_code=status.HTTP_201_CREATED,
             dependencies=[Depends(require_role("owner"))])
async def create_category(body: CategoryCreate, db: DbDep, current_user: CurrentUser):
    cat = Category(name=body.name, sort_order=body.sort_order)
    db.add(cat)
    await db.flush()
    return cat


# ── Products ───────────────────────────────────────────────────────────────

@router.get("", response_model=ProductListOut)
async def list_products(
    current_user: CurrentUser,
    db: DbDep,
    category_id: str | None = Query(default=None),
    is_active: bool | None = Query(default=True),
    search: str | None = Query(default=None),
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=50, le=200),
):
    q = select(Product)
    if category_id:
        q = q.where(Product.category_id == category_id)
    if is_active is not None:
        q = q.where(Product.is_active == is_active)
    if search:
        q = q.where(Product.name.ilike(f"%{search}%"))

    # Build filters separately for count vs. data query
    count_q = select(func.count(Product.id))
    if category_id:
        count_q = count_q.where(Product.category_id == category_id)
    if is_active is not None:
        count_q = count_q.where(Product.is_active == is_active)
    if search:
        count_q = count_q.where(Product.name.ilike(f"%{search}%"))
    total = (await db.execute(count_q)).scalar_one()
    items = (await db.execute(
        q.options(selectinload(Product.category))
        .offset((page - 1) * page_size).limit(page_size)
    )).scalars().all()

    return ProductListOut(items=items, total=total, page=page, page_size=page_size)


@router.post("", response_model=ProductOut, status_code=status.HTTP_201_CREATED,
             dependencies=[Depends(require_role("owner"))])
async def create_product(body: ProductCreate, db: DbDep, current_user: CurrentUser):
    product = Product(slug=_slugify(body.name), **body.model_dump())
    db.add(product)
    await db.flush()
    result = await db.execute(
        select(Product).where(Product.id == product.id).options(selectinload(Product.category))
    )
    return result.scalar_one()


@router.get("/{product_id}", response_model=ProductOut)
async def get_product(product_id: str, current_user: CurrentUser, db: DbDep):
    result = await db.execute(
        select(Product).where(Product.id == product_id).options(selectinload(Product.category))
    )
    product = result.scalar_one_or_none()
    if not product:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail={"code": "RESOURCE_NOT_FOUND"})
    return product


@router.patch("/{product_id}", response_model=ProductOut,
              dependencies=[Depends(require_role("owner"))])
async def update_product(product_id: str, body: ProductUpdate, db: DbDep, current_user: CurrentUser):
    result = await db.execute(
        select(Product).where(Product.id == product_id).options(selectinload(Product.category))
    )
    product = result.scalar_one_or_none()
    if not product:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail={"code": "RESOURCE_NOT_FOUND"})
    for field, value in body.model_dump(exclude_none=True).items():
        setattr(product, field, value)
    await db.flush()
    await db.refresh(product)
    return product


@router.delete("/{product_id}", status_code=status.HTTP_204_NO_CONTENT,
               dependencies=[Depends(require_role("owner"))])
async def delete_product(product_id: str, db: DbDep, current_user: CurrentUser):
    result = await db.execute(
        select(Product).where(Product.id == product_id)
    )
    product = result.scalar_one_or_none()
    if not product:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail={"code": "RESOURCE_NOT_FOUND"})
    # Soft delete
    product.is_active = False


@router.post("/{product_id}/stock", response_model=ProductOut)
async def adjust_product_stock(
    product_id: str, body: ProductStockAdjust, db: DbDep, current_user: CurrentUser
):
    result = await db.execute(
        select(Product).where(Product.id == product_id).options(selectinload(Product.category))
    )
    product = result.scalar_one_or_none()
    if not product:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail={"code": "RESOURCE_NOT_FOUND"})
    new_count = float(product.stock_count) + body.delta
    if new_count < 0:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail={"code": "STOCK_BELOW_ZERO", "current": float(product.stock_count), "delta": body.delta},
        )
    product.stock_count = new_count
    await db.flush()
    await db.refresh(product)
    return product


# ── Ingredients ────────────────────────────────────────────────────────────

ingredients_router = APIRouter(prefix="/ingredients", tags=["ingredients"])


@ingredients_router.get("", response_model=list[IngredientOut])
async def list_ingredients(current_user: CurrentUser, db: DbDep):
    result = await db.execute(select(Ingredient).order_by(Ingredient.name))
    return result.scalars().all()


@ingredients_router.post("", response_model=IngredientOut, status_code=status.HTTP_201_CREATED)
async def create_ingredient(body: IngredientCreate, current_user: CurrentUser, db: DbDep):
    ingredient = Ingredient(**body.model_dump())
    db.add(ingredient)
    await db.flush()
    return ingredient


@ingredients_router.patch("/{ingredient_id}", response_model=IngredientOut)
async def update_ingredient(ingredient_id: str, body: IngredientCreate, current_user: CurrentUser, db: DbDep):
    result = await db.execute(select(Ingredient).where(Ingredient.id == ingredient_id))
    ingredient = result.scalar_one_or_none()
    if not ingredient:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail={"code": "RESOURCE_NOT_FOUND"})
    for field, value in body.model_dump(exclude_none=True).items():
        setattr(ingredient, field, value)
    await db.flush()
    return ingredient


@ingredients_router.delete("/{ingredient_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_ingredient(ingredient_id: str, current_user: CurrentUser, db: DbDep):
    result = await db.execute(select(Ingredient).where(Ingredient.id == ingredient_id))
    ingredient = result.scalar_one_or_none()
    if not ingredient:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail={"code": "RESOURCE_NOT_FOUND"})
    await db.delete(ingredient)
