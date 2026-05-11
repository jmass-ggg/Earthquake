import json

from pywebpush import webpush, WebPushException

from backend.core.config import settings


def send_web_push(subscription: dict, payload: dict) -> bool:
    if not settings.VAPID_PRIVATE_KEY:
        print("VAPID_PRIVATE_KEY missing. Push skipped.")
        return False

    try:
        webpush(
            subscription_info=subscription,
            data=json.dumps(payload),
            vapid_private_key=settings.VAPID_PRIVATE_KEY,
            vapid_claims={
                "sub": f"mailto:{settings.VAPID_EMAIL}",
            },
        )
        return True

    except WebPushException as exc:
        print("Web push failed:", exc)
        return False