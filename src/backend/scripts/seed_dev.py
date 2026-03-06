"""Idempotent development seed script.

Usage:
    cd src/backend
    python -m scripts.seed_dev
"""
from __future__ import annotations

import asyncio
import sys
import uuid
from datetime import date, datetime, timedelta, timezone

sys.path.insert(0, ".")

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import AsyncSessionLocal, engine
from app.models.expense import Expense
from app.models.inventory import StockMovement
from app.models.product import Category, Ingredient, Product
from app.models.sale import Sale, SaleItem
from app.models.user import User
from app.services.auth import hash_password


async def seed():
    async with AsyncSessionLocal() as db:
        # ── Users ──────────────────────────────────────────────────────────
        existing = (await db.execute(select(User).where(User.email == "owner@leyl.dev"))).scalar_one_or_none()
        if not existing:
            db.add(User(
                id=str(uuid.uuid4()),
                email="owner@leyl.dev",
                password_hash=hash_password("dev1234"),
                full_name="Ayşe Kara",
                role="owner",
            ))
            db.add(User(
                id=str(uuid.uuid4()),
                email="manager@leyl.dev",
                password_hash=hash_password("dev1234"),
                full_name="Mehmet Yılmaz",
                role="manager",
            ))
            await db.commit()
            print("[OK] Users seeded")
        else:
            print("[SKIP] Users already exist")

        # ── Owner user for FK references ───────────────────────────────────
        owner = (await db.execute(select(User).where(User.email == "owner@leyl.dev"))).scalar_one()

        # ── Categories ─────────────────────────────────────────────────────
        cat_names = ["Sıcak İçecek", "Soğuk İçecek", "Tatlı", "Tuzlu", "Kahve", "Diğer"]
        cats: dict[str, Category] = {}
        for i, name in enumerate(cat_names):
            existing = (await db.execute(select(Category).where(Category.name == name))).scalar_one_or_none()
            if not existing:
                cat = Category(id=str(uuid.uuid4()), name=name, sort_order=i)
                db.add(cat)
                await db.flush()
                cats[name] = cat
            else:
                cats[name] = existing
        await db.commit()
        print("[OK] Categories seeded")

        # ── Ingredients ────────────────────────────────────────────────────
        ingredient_data = [
            ("Süt", "lt", 20.0, 5.0, 18.0),
            ("Espresso Çekirdeği", "kg", 5.0, 1.0, 150.0),
            ("Şeker", "kg", 10.0, 2.0, 25.0),
            ("Krema", "lt", 3.0, 1.0, 60.0),
            ("Ekmek", "adet", 50.0, 10.0, 5.0),
        ]
        ingredients: dict[str, Ingredient] = {}
        for name, unit, balance, threshold, cost in ingredient_data:
            existing = (await db.execute(select(Ingredient).where(Ingredient.name == name))).scalar_one_or_none()
            if not existing:
                ing = Ingredient(
                    id=str(uuid.uuid4()), name=name, unit=unit,
                    stock_balance=balance, low_stock_threshold=threshold, cost_per_unit=cost,
                )
                db.add(ing)
                await db.flush()
                ingredients[name] = ing
            else:
                ingredients[name] = existing
        await db.commit()
        print("[OK] Ingredients seeded")

        # ── Products ───────────────────────────────────────────────────────
        product_data = [
            ("Türk Kahvesi", "Kahve", 45.0, 8.0),
            ("Latte", "Sıcak İçecek", 65.0, 12.0),
            ("Cappuccino", "Sıcak İçecek", 60.0, 11.0),
            ("Americano", "Sıcak İçecek", 50.0, 7.0),
            ("Soğuk Kahve", "Soğuk İçecek", 70.0, 13.0),
            ("Limonata", "Soğuk İçecek", 45.0, 6.0),
            ("Çay", "Sıcak İçecek", 25.0, 3.0),
            ("Cheesecake", "Tatlı", 80.0, 25.0),
            ("Brownie", "Tatlı", 65.0, 18.0),
            ("Tost", "Tuzlu", 55.0, 15.0),
        ]
        products: dict[str, Product] = {}
        for name, cat_name, price, cogs in product_data:
            existing = (await db.execute(select(Product).where(Product.name == name))).scalar_one_or_none()
            if not existing:
                import re
                slug = f"prd-{re.sub(r'[^a-z0-9]+', '-', name.lower())[:20]}-{uuid.uuid4().hex[:4]}"
                prod = Product(
                    id=str(uuid.uuid4()), slug=slug,
                    name=name, category_id=cats[cat_name].id,
                    sale_price=price, cogs_per_unit=cogs, unit="adet",
                )
                db.add(prod)
                await db.flush()
                products[name] = prod
            else:
                products[name] = existing
        await db.commit()
        print("[OK] Products seeded")

        # ── Sample sales (last 7 days) ──────────────────────────────────────
        sale_count = (await db.execute(select(Sale))).scalars().first()
        if not sale_count:
            import random
            random.seed(42)
            prod_list = list(products.values())
            for day_offset in range(7):
                day = date.today() - timedelta(days=day_offset)
                for _ in range(random.randint(5, 15)):
                    product = random.choice(prod_list)
                    qty = random.randint(1, 3)
                    sold_at = datetime(day.year, day.month, day.day, random.randint(9, 20), tzinfo=timezone.utc)
                    sale = Sale(
                        id=str(uuid.uuid4()),
                        slug=f"sal-{uuid.uuid4().hex[:8]}",
                        payment_method=random.choice(["cash", "card"]),
                        total_amount=round(float(product.sale_price) * qty, 2),
                        total_cogs=round(float(product.cogs_per_unit) * qty, 2),
                        recorded_by=owner.id,
                        sold_at=sold_at,
                    )
                    db.add(sale)
                    await db.flush()
                    db.add(SaleItem(
                        id=str(uuid.uuid4()),
                        slug=f"sli-{uuid.uuid4().hex[:8]}",
                        sale_id=sale.id,
                        product_id=product.id,
                        quantity=qty,
                        unit_price=float(product.sale_price),
                        unit_cogs=float(product.cogs_per_unit),
                        line_total=round(float(product.sale_price) * qty, 2),
                    ))
            await db.commit()
            print("[OK] Sample sales seeded")
        else:
            print("[SKIP] Sales already exist")

        # ── Sample expenses (last 7 days) ────────────────────────────────────
        exp_count = (await db.execute(select(Expense))).scalars().first()
        if not exp_count:
            for day_offset in range(7):
                day = date.today() - timedelta(days=day_offset)
                db.add(Expense(id=str(uuid.uuid4()), category="kira", amount=1500.0,
                               expense_date=day, recorded_by=owner.id))
                db.add(Expense(id=str(uuid.uuid4()), category="malzeme", amount=800.0,
                               expense_date=day, recorded_by=owner.id))
            await db.commit()
            print("[OK] Sample expenses seeded")
        else:
            print("[SKIP] Expenses already exist")

    await engine.dispose()
    print("\nSeed complete.")
    print("  Owner:   owner@leyl.dev   / dev1234")
    print("  Manager: manager@leyl.dev / dev1234")


if __name__ == "__main__":
    asyncio.run(seed())
