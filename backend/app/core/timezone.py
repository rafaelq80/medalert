"""
Centralized timezone utilities for MedAlert.
All datetime operations should use these helpers to ensure consistency.

Strategy:
- Internal storage: all datetimes stored with timezone info (PostgreSQL timestamptz)
- Local timezone: America/Sao_Paulo (configurable via TIMEZONE env var)
- The TimezoneMiddleware in main.py converts all UTC datetimes to local on API responses
- JWT tokens and internal comparisons use UTC (correct for expiration checks)
- User-facing times (agendas, registros) use LOCAL_TZ
"""

from datetime import datetime
from zoneinfo import ZoneInfo

from app.core.config import settings

LOCAL_TZ = ZoneInfo(settings.TIMEZONE)


def now_local() -> datetime:
    """Get current datetime in local timezone (timezone-aware)."""
    return datetime.now(LOCAL_TZ)


def today_local():
    """Get today's date in local timezone."""
    return now_local().date()
