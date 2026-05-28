"""
Apple Push Notification Service (APNs) integration via HTTP/2.
Uses httpx with HTTP/2 support to send notifications to Apple's push service.
"""

import json
import logging
import time

import httpx

from app.core.config import settings

logger = logging.getLogger(__name__)

APNS_PRODUCTION_URL = "https://api.push.apple.com"
APNS_SANDBOX_URL = "https://api.sandbox.push.apple.com"


async def send_apns_notification(
    token: str, title: str, body: str, data: dict | None = None
) -> bool:
    """
    Send notification via APNs HTTP/2.
    Returns True on success, False on failure.
    Raises InvalidTokenError if the token is detected as invalid.
    """
    from app.push.service import InvalidTokenError

    # Check if APNs is configured
    if not settings.APNS_BUNDLE_ID:
        logger.warning("APNS_BUNDLE_ID not configured, skipping APNs push")
        return False

    base_url = APNS_SANDBOX_URL if settings.APNS_USE_SANDBOX else APNS_PRODUCTION_URL
    url = f"{base_url}/3/device/{token}"

    # Build APNs payload
    payload = {
        "aps": {
            "alert": {
                "title": title,
                "body": body,
            },
            "sound": "default",
            "badge": 1,
        },
    }
    if data:
        payload["custom_data"] = data

    headers = {
        "apns-topic": settings.APNS_BUNDLE_ID,
        "apns-push-type": "alert",
        "apns-priority": "10",
        "content-type": "application/json",
    }

    # Add JWT authorization if key is configured
    auth_token = _generate_apns_token()
    if auth_token:
        headers["authorization"] = f"bearer {auth_token}"

    try:
        async with httpx.AsyncClient(http2=True) as client:
            response = await client.post(
                url,
                content=json.dumps(payload),
                headers=headers,
                timeout=10.0,
            )

            if response.status_code == 200:
                logger.debug(f"APNs push sent successfully to token: {token[:20]}...")
                return True

            # Handle specific APNs error responses
            if response.status_code == 410:
                # 410 Gone — device token is no longer active
                logger.warning(
                    f"APNs token expired (410 Gone) for token: {token[:20]}..."
                )
                raise InvalidTokenError("APNs reported token expired (410)")

            if response.status_code == 400:
                try:
                    error_body = response.json()
                    reason = error_body.get("reason", "")
                except Exception:
                    reason = response.text[:100]

                if reason in ("BadDeviceToken", "Unregistered", "DeviceTokenNotForTopic"):
                    logger.warning(
                        f"APNs invalid token error '{reason}' "
                        f"for token: {token[:20]}..."
                    )
                    raise InvalidTokenError(f"APNs reported invalid token: {reason}")

                logger.error(f"APNs bad request: {reason}")
                return False

            if response.status_code == 403:
                logger.error("APNs authentication failed — check APNs credentials")
                return False

            logger.error(
                f"APNs request failed with status {response.status_code}: "
                f"{response.text[:200]}"
            )
            return False

    except InvalidTokenError:
        raise  # Re-raise to be handled by service layer

    except httpx.TimeoutException:
        logger.error("APNs request timed out")
        return False

    except httpx.ConnectError as e:
        logger.error(f"APNs connection error: {e}")
        return False

    except Exception as e:
        logger.error(f"APNs request error: {e}")
        return False


def _generate_apns_token() -> str | None:
    """
    Generate a JWT token for APNs authentication.
    Returns None if APNs key is not configured (falls back to certificate auth).
    """
    if not settings.APNS_KEY_ID or not settings.APNS_TEAM_ID or not settings.APNS_KEY_PATH:
        return None

    try:
        from jose import jwt

        # Read the private key
        with open(settings.APNS_KEY_PATH, "r") as f:
            private_key = f.read()

        # Create JWT token
        token_payload = {
            "iss": settings.APNS_TEAM_ID,
            "iat": int(time.time()),
        }
        headers = {
            "alg": "ES256",
            "kid": settings.APNS_KEY_ID,
        }

        return jwt.encode(
            token_payload,
            private_key,
            algorithm="ES256",
            headers=headers,
        )

    except FileNotFoundError:
        logger.error(f"APNs key file not found: {settings.APNS_KEY_PATH}")
        return None
    except Exception as e:
        logger.error(f"Failed to generate APNs token: {e}")
        return None
