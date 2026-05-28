"""
Firebase Cloud Messaging (FCM) integration via HTTP v1 API.
Uses httpx to POST to FCM endpoint with server key authentication.
"""

import logging

import httpx

from app.core.config import settings

logger = logging.getLogger(__name__)

FCM_URL = "https://fcm.googleapis.com/fcm/send"


async def send_fcm_notification(
    token: str, title: str, body: str, data: dict | None = None
) -> bool:
    """
    Send notification via FCM HTTP API.
    Returns True on success, False on failure.
    Raises InvalidTokenError if the token is detected as invalid.
    """
    from app.push.service import InvalidTokenError

    if not settings.FCM_SERVER_KEY:
        logger.warning("FCM_SERVER_KEY not configured, skipping push")
        return False

    payload = {
        "to": token,
        "notification": {"title": title, "body": body},
        "data": data or {},
    }
    headers = {
        "Authorization": f"key={settings.FCM_SERVER_KEY}",
        "Content-Type": "application/json",
    }

    try:
        async with httpx.AsyncClient() as client:
            response = await client.post(
                FCM_URL, json=payload, headers=headers, timeout=10.0
            )

            if response.status_code == 200:
                result = response.json()

                # Check for invalid token errors in FCM response
                if result.get("failure", 0) > 0:
                    results = result.get("results", [])
                    for r in results:
                        error = r.get("error", "")
                        if error in (
                            "InvalidRegistration",
                            "NotRegistered",
                            "MismatchSenderId",
                        ):
                            logger.warning(
                                f"FCM invalid token error '{error}' "
                                f"for token: {token[:20]}..."
                            )
                            raise InvalidTokenError(
                                f"FCM reported invalid token: {error}"
                            )
                    # Other delivery failures (not invalid token)
                    logger.warning(
                        f"FCM delivery failure for token: {token[:20]}..."
                    )
                    return False

                return True

            elif response.status_code == 401:
                logger.error("FCM authentication failed — check FCM_SERVER_KEY")
                return False

            else:
                logger.error(
                    f"FCM request failed with status {response.status_code}: "
                    f"{response.text[:200]}"
                )
                return False

    except InvalidTokenError:
        raise  # Re-raise to be handled by service layer

    except httpx.TimeoutException:
        logger.error("FCM request timed out")
        return False

    except httpx.ConnectError as e:
        logger.error(f"FCM connection error: {e}")
        return False

    except Exception as e:
        logger.error(f"FCM request error: {e}")
        return False
