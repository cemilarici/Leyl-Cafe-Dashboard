from __future__ import annotations

import uuid
from datetime import datetime

from sqlalchemy import DateTime, ForeignKey, Integer, String, Text, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


class ImportJob(Base):
    __tablename__ = "import_jobs"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    created_by: Mapped[str] = mapped_column(String(36), ForeignKey("users.id"), nullable=False, index=True)
    import_type: Mapped[str] = mapped_column(String(20), nullable=False)   # sales | products | inventory
    status: Mapped[str] = mapped_column(String(20), nullable=False, default="pending")  # pending | processing | done | failed
    original_filename: Mapped[str] = mapped_column(String(255), nullable=False)
    total_rows: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    accepted_rows: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    rejected_rows: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    error_report: Mapped[str | None] = mapped_column(Text, nullable=True)  # JSON string: [{row, reason}, ...]
    created_at: Mapped[datetime] = mapped_column(DateTime, nullable=False, server_default=func.now())
    completed_at: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)

    created_by_user: Mapped["User"] = relationship("User", back_populates="import_jobs")
