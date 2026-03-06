from __future__ import annotations

import json
from contextlib import asynccontextmanager

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.config import settings
from app.database import engine
from app.models import *  # noqa: F401, F403 — ensure all models are imported for Alembic
from app.routers import auth, dashboard, expenses, imports, inventory, products, reports, sales


@asynccontextmanager
async def lifespan(app: FastAPI):
    yield
    await engine.dispose()


app = FastAPI(
    title="LeylCafeDashboard API",
    version="0.1.0",
    docs_url="/docs" if not settings.is_production else None,
    redoc_url="/redoc" if not settings.is_production else None,
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.exception_handler(Exception)
async def generic_handler(request: Request, exc: Exception):
    return JSONResponse(
        status_code=500,
        content={"code": "INTERNAL_ERROR", "message": "An unexpected error occurred"},
    )


PREFIX = "/api/v1"

app.include_router(auth.router, prefix=PREFIX)
app.include_router(dashboard.router, prefix=PREFIX)
app.include_router(sales.router, prefix=PREFIX)
app.include_router(products.router, prefix=PREFIX)
app.include_router(products.ingredients_router, prefix=PREFIX)
app.include_router(inventory.router, prefix=PREFIX)
app.include_router(expenses.router, prefix=PREFIX)
app.include_router(reports.router, prefix=PREFIX)
app.include_router(imports.router, prefix=PREFIX)


@app.get("/health")
async def health():
    return {"status": "ok", "env": settings.app_env}
