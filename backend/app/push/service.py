"""
Push notification service.
Detects platform and delegates to FCM or APNs.
Handles invalid tokens by clearing them from the user record.
"""

import logging

from sqlalchemy import select, update

from app.core.database import AsyncSessionLocal
from app.push.apns import send_apns_notification
from app.push.fcm import send_fcm_notification

logger = logging.getLogger(__name__)


async def send_push(
    push_token: str, title: str, body: str, data: dict | None = None
) -> bool:
    """
    Send push notification. Detects platform by token format.
    FCM tokens are typically longer (>100 chars).
    APNs tokens are 64 hex chars.
    Returns True if sent successfully, False otherwise.
    Never raises exceptions — all failures are logged.
    """
    if not push_token:
        logger.warning("Attempted to send push with empty or None token")
        return False

    try:
        if _is_apns_token(push_token):
            success = await send_apns_notification(push_token, title, body, data)
        else:
            success = await send_fcm_notification(push_token, title, body, data)

        if not success:
            logger.warning(f"Push notification failed for token: {push_token[:20]}...")

        return success

    except InvalidTokenError:
        logger.warning(
            f"Invalid push token detected: {push_token[:20]}... — clearing from user"
        )
        await _clear_invalid_token(push_token)
        return False

    except Exception as e:
        logger.error(f"Failed to send push notification: {e}")
        return False


def _is_apns_token(token: str) -> bool:
    """
    Detect if a token is an APNs device token.
    APNs tokens are 64 hex characters.
    FCM tokens are typically longer (>100 chars) and contain non-hex characters.
    """
    return len(token) == 64 and all(c in "0123456789abcdef" for c in token.lower())


async def _clear_invalid_token(push_token: str) -> None:
    """
    Clear an invalid push_token from the user record.
    Creates its own session since this may be called from scheduler context.
    """
    try:
        from app.modules.usuarios.models import Usuario

        async with AsyncSessionLocal() as db:
            result = await db.execute(
                select(Usuario).where(Usuario.push_token == push_token)
            )
            user = result.scalar_one_or_none()
            if user:
                user.push_token = None
                await db.commit()
                logger.info(
                    f"Cleared invalid push_token for user {user.id}"
                )
    except Exception as e:
        logger.error(f"Failed to clear invalid push_token: {e}")


class InvalidTokenError(Exception):
    """Raised when a push token is detected as invalid by the push service."""

    pass
