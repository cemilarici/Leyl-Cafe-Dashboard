from __future__ import annotations

import uuid
from datetime import datetime

from sqlalchemy import Boolean, DateTime, ForeignKey, Numeric, String, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


class Category(Base):
    __tablename__ = "categories"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    name: Mapped[str] = mapped_column(String(80), unique=True, nullable=False)
    sort_order: Mapped[int] = mapped_column(nullable=False, default=0)
    created_at: Mapped[datetime] = mapped_column(DateTime, nullable=False, server_default=func.now())

    products: Mapped[list["Product"]] = relationship("Product", back_populates="category", lazy="noload")


class Product(Base):
    __tablename__ = "products"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    slug: Mapped[str] = mapped_column(String(40), unique=True, nullable=False)
    category_id: Mapped[str] = mapped_column(String(36), ForeignKey("categories.id"), nullable=False, index=True)
    name: Mapped[str] = mapped_column(String(120), nullable=False)
    unit: Mapped[str] = mapped_column(String(20), nullable=False, default="adet")
    sale_price: Mapped[float] = mapped_column(Numeric(10, 2), nullable=False)
    cogs_per_unit: Mapped[float] = mapped_column(Numeric(10, 2), nullable=False, default=0.0)
    is_active: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True)
    low_stock_threshold: Mapped[float] = mapped_column(Numeric(10, 3), nullable=False, default=0.0)
    stock_count: Mapped[float] = mapped_column(Numeric(10, 3), nullable=False, default=0.0)
    created_at: Mapped[datetime] = mapped_column(DateTime, nullable=False, server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(DateTime, nullable=False, server_default=func.now(), onupdate=func.now())

    category: Mapped["Category"] = relationship("Category", back_populates="products")
    sale_items: Mapped[list["SaleItem"]] = relationship("SaleItem", back_populates="product", lazy="noload")
    recipes: Mapped[list["ProductRecipe"]] = relationship("ProductRecipe", back_populates="product", cascade="all, delete-orphan", lazy="noload")


class Ingredient(Base):
    __tablename__ = "ingredients"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    name: Mapped[str] = mapped_column(String(120), unique=True, nullable=False)
    unit: Mapped[str] = mapped_column(String(20), nullable=False)
    stock_balance: Mapped[float] = mapped_column(Numeric(12, 3), nullable=False, default=0.0)
    low_stock_threshold: Mapped[float] = mapped_column(Numeric(12, 3), nullable=False, default=0.0)
    cost_per_unit: Mapped[float] = mapped_column(Numeric(10, 4), nullable=False, default=0.0)
    created_at: Mapped[datetime] = mapped_column(DateTime, nullable=False, server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(DateTime, nullable=False, server_default=func.now(), onupdate=func.now())

    recipes: Mapped[list["ProductRecipe"]] = relationship("ProductRecipe", back_populates="ingredient", lazy="noload")
    stock_movements: Mapped[list["StockMovement"]] = relationship("StockMovement", back_populates="ingredient", lazy="noload")


class ProductRecipe(Base):
    __tablename__ = "product_recipes"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    product_id: Mapped[str] = mapped_column(String(36), ForeignKey("products.id", ondelete="CASCADE"), nullable=False, index=True)
    ingredient_id: Mapped[str] = mapped_column(String(36), ForeignKey("ingredients.id"), nullable=False, index=True)
    quantity: Mapped[float] = mapped_column(Numeric(10, 4), nullable=False)

    product: Mapped["Product"] = relationship("Product", back_populates="recipes")
    ingredient: Mapped["Ingredient"] = relationship("Ingredient", back_populates="recipes")
