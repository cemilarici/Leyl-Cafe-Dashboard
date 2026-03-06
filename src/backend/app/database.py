from __future__ import annotations

from collections.abc import AsyncGenerator

from sqlalchemy import event, text
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine
from sqlalchemy.orm import DeclarativeBase

from app.config import settings


class Base(DeclarativeBase):
    pass


# Ensure the data directory exists (SQLite needs the parent dir)
import os as _os
_db_path = settings.database_url.replace("sqlite+aiosqlite:///", "").lstrip("/")
if _db_path and not _db_path.startswith(":"):
    _os.makedirs(_os.path.dirname(_os.path.abspath(_db_path)) if _os.path.dirname(_db_path) else ".", exist_ok=True)


engine = create_async_engine(
    settings.database_url,
    connect_args={"check_same_thread": False},
    echo=settings.app_env == "development",
)


@event.listens_for(engine.sync_engine, "connect")
def _set_sqlite_pragmas(dbapi_conn, _connection_record):
    cursor = dbapi_conn.cursor()
    cursor.execute("PRAGMA journal_mode=WAL")
    cursor.execute("PRAGMA foreign_keys=ON")
    cursor.execute("PRAGMA synchronous=NORMAL")
    cursor.execute("PRAGMA busy_timeout=5000")
    cursor.close()


AsyncSessionLocal = async_sessionmaker(
    engine,
    class_=AsyncSession,
    expire_on_commit=False,
)


async def get_db() -> AsyncGenerator[AsyncSession, None]:
    async with AsyncSessionLocal() as session:
        try:
            yield session
            await session.commit()
        except Exception:
            await session.rollback()
            raise
