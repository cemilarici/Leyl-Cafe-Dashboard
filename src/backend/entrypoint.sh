#!/bin/sh
set -e

echo "[entrypoint] Veritabani migrasyonlari calistiriliyor..."
alembic upgrade head

echo "[entrypoint] Sunucu baslatiliyor..."
exec uvicorn app.main:app --host 0.0.0.0 --port 8000
