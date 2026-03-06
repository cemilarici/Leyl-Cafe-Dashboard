from __future__ import annotations

import io
import json
import uuid
from datetime import datetime, timezone
from typing import Literal

import pandas as pd
from fastapi import APIRouter, HTTPException, UploadFile, status
from sqlalchemy import select

from app.config import settings
from app.deps import CurrentUser, DbDep
from app.models.import_job import ImportJob
from app.models.product import Ingredient, Product
from app.models.sale import Sale, SaleItem

router = APIRouter(prefix="/import", tags=["import"])

ALLOWED_CONTENT_TYPES = {
    "text/csv",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    "application/vnd.ms-excel",
}

ImportType = Literal["sales", "products", "inventory"]


def _read_file(file: UploadFile, content: bytes) -> pd.DataFrame:
    name = file.filename or ""
    if name.endswith(".csv"):
        return pd.read_csv(io.BytesIO(content))
    return pd.read_excel(io.BytesIO(content), engine="openpyxl")


@router.post("/{import_type}", status_code=status.HTTP_207_MULTI_STATUS)
async def import_data(
    import_type: ImportType,
    file: UploadFile,
    current_user: CurrentUser,
    db: DbDep,
):
    # File size check
    content = await file.read()
    if len(content) > settings.max_import_bytes:
        raise HTTPException(
            status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
            detail={"code": "FILE_TOO_LARGE", "max_mb": settings.max_import_file_mb},
        )

    # MIME check
    if file.content_type and file.content_type not in ALLOWED_CONTENT_TYPES:
        raise HTTPException(
            status_code=status.HTTP_415_UNSUPPORTED_MEDIA_TYPE,
            detail={"code": "INVALID_MIME_TYPE", "received": file.content_type},
        )

    # Parse file
    try:
        df = _read_file(file, content)
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail={"code": "PARSE_ERROR", "message": str(exc)},
        )

    job = ImportJob(
        created_by=current_user.id,
        import_type=import_type,
        status="processing",
        original_filename=file.filename or "upload",
        total_rows=len(df),
    )
    db.add(job)
    await db.flush()

    rejected: list[dict] = []
    accepted = 0

    if import_type == "sales":
        accepted, rejected = await _import_sales(df, current_user.id, db)
    elif import_type == "products":
        accepted, rejected = await _import_products(df, db)
    elif import_type == "inventory":
        accepted, rejected = await _import_inventory(df, current_user.id, db)

    job.status = "done"
    job.accepted_rows = accepted
    job.rejected_rows = len(rejected)
    job.error_report = json.dumps(rejected)
    job.completed_at = datetime.now(timezone.utc)

    return {"imported": accepted, "rejected": rejected}


async def _import_sales(df: pd.DataFrame, user_id: str, db) -> tuple[int, list[dict]]:
    required = {"product_id", "quantity", "payment_method", "sold_at"}
    rejected: list[dict] = []
    accepted = 0

    if not required.issubset(df.columns):
        return 0, [{"row": 0, "reason": f"Missing columns: {required - set(df.columns)}"}]

    for idx, row in df.iterrows():
        row_num = int(idx) + 2
        try:
            qty = float(row["quantity"])
            if qty <= 0:
                raise ValueError("quantity must be > 0")
            result = await db.execute(select(Product).where(Product.id == str(row["product_id"])))
            product = result.scalar_one_or_none()
            if not product:
                rejected.append({"row": row_num, "reason": "product_id not found"})
                continue

            sold_at = pd.to_datetime(row["sold_at"]).to_pydatetime()
            sale = Sale(
                slug=f"sal-{uuid.uuid4().hex[:8]}",
                payment_method=str(row["payment_method"]),
                recorded_by=user_id,
                sold_at=sold_at,
                total_amount=round(qty * float(product.sale_price), 2),
                total_cogs=round(qty * float(product.cogs_per_unit), 2),
            )
            db.add(sale)
            await db.flush()
            db.add(SaleItem(
                slug=f"sli-{uuid.uuid4().hex[:8]}",
                sale_id=sale.id,
                product_id=product.id,
                quantity=qty,
                unit_price=float(product.sale_price),
                unit_cogs=float(product.cogs_per_unit),
                line_total=round(qty * float(product.sale_price), 2),
            ))
            accepted += 1
        except Exception as exc:
            rejected.append({"row": row_num, "reason": str(exc)})

    return accepted, rejected


async def _import_products(df: pd.DataFrame, db) -> tuple[int, list[dict]]:
    required = {"name", "category_id", "sale_price", "unit"}
    rejected: list[dict] = []
    accepted = 0

    if not required.issubset(df.columns):
        return 0, [{"row": 0, "reason": f"Missing columns: {required - set(df.columns)}"}]

    for idx, row in df.iterrows():
        row_num = int(idx) + 2
        try:
            import re
            name = str(row["name"]).strip()
            slug = f"prd-{re.sub(r'[^a-z0-9]+', '-', name.lower())[:20]}-{uuid.uuid4().hex[:4]}"
            from app.models.product import Product as ProductModel
            db.add(ProductModel(
                slug=slug,
                name=name,
                category_id=str(row["category_id"]),
                sale_price=float(row["sale_price"]),
                cogs_per_unit=float(row.get("cogs_per_unit", 0)),
                unit=str(row["unit"]),
            ))
            accepted += 1
        except Exception as exc:
            rejected.append({"row": row_num, "reason": str(exc)})

    return accepted, rejected


async def _import_inventory(df: pd.DataFrame, user_id: str, db) -> tuple[int, list[dict]]:
    required = {"ingredient_id", "quantity_delta", "movement_type"}
    rejected: list[dict] = []
    accepted = 0

    if not required.issubset(df.columns):
        return 0, [{"row": 0, "reason": f"Missing columns: {required - set(df.columns)}"}]

    for idx, row in df.iterrows():
        row_num = int(idx) + 2
        try:
            result = await db.execute(select(Ingredient).where(Ingredient.id == str(row["ingredient_id"])))
            ingredient = result.scalar_one_or_none()
            if not ingredient:
                rejected.append({"row": row_num, "reason": "ingredient_id not found"})
                continue
            delta = float(row["quantity_delta"])
            new_balance = float(ingredient.stock_balance) + delta
            if new_balance < 0:
                rejected.append({"row": row_num, "reason": "stock would go below 0"})
                continue
            from app.models.inventory import StockMovement
            db.add(StockMovement(
                ingredient_id=ingredient.id,
                movement_type=str(row["movement_type"]),
                quantity_delta=delta,
                performed_by=user_id,
            ))
            ingredient.stock_balance = new_balance
            accepted += 1
        except Exception as exc:
            rejected.append({"row": row_num, "reason": str(exc)})

    return accepted, rejected
