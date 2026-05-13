from datetime import datetime, timedelta
from uuid import UUID

from apscheduler.schedulers.asyncio import AsyncIOScheduler
from apscheduler.triggers.interval import IntervalTrigger

from backend.database import SessionLocal
from backend.model.earthquake_alert import Alert
from backend.model.emergency_response import EmergencyResponse
from backend.model.push_subscription import PushSubscription
from backend.service.push_service import send_web_push

scheduler = AsyncIOScheduler()


def start_alert_reminder_scheduler():
    if not scheduler.running:
        scheduler.start()


def stop_alert_reminder_scheduler():
    if scheduler.running:
        scheduler.shutdown()


def schedule_hourly_alert_reminder(alert_id: str):
    job_id = f"earthquake-alert-reminder-{alert_id}"

    scheduler.add_job(
        send_hourly_alert_reminder,
        trigger=IntervalTrigger(
            hours=1,
            start_date=datetime.utcnow() + timedelta(hours=1),
        ),
        id=job_id,
        args=[alert_id],
        replace_existing=True,
        max_instances=1,
        coalesce=True,
    )

    print(f"Hourly reminder scheduled for alert {alert_id}")


def remove_hourly_alert_reminder(alert_id: str):
    job_id = f"earthquake-alert-reminder-{alert_id}"

    if scheduler.get_job(job_id):
        scheduler.remove_job(job_id)
        print(f"Hourly reminder stopped for alert {alert_id}")


async def send_hourly_alert_reminder(alert_id: str):
    db = SessionLocal()

    try:
        alert_uuid = UUID(str(alert_id))

        alert = db.query(EarthquakeAlert).filter(
            EarthquakeAlert.id == alert_uuid
        ).first()

        if not alert:
            remove_hourly_alert_reminder(alert_id)
            return

        safe_user_ids = [
            row.user_id
            for row in db.query(EmergencyResponse.user_id)
            .filter(
                EmergencyResponse.alert_id == alert_uuid,
                EmergencyResponse.response == "SAFE",
            )
            .all()
        ]

        query = db.query(PushSubscription)

        if safe_user_ids:
            query = query.filter(
                PushSubscription.user_id.notin_(safe_user_ids)
            )

        subscriptions = query.all()

        if not subscriptions:
            remove_hourly_alert_reminder(alert_id)
            return

        push_payload = {
            "type": "EARTHQUAKE_ALERT_REMINDER",
            "alert_id": str(alert.id),
            "title": "Emergency Response Required",
            "body": "Please respond: I Am Safe.",
            "message": alert.message,
            "magnitude": float(alert.magnitude),
            "risk_level": alert.risk_level,
            "emergency": True,
            "alarm": True,
            "vibration": True,
            "requires_response": True,
            "response_options": ["SAFE", "NEED_HELP"],
            "open_url": "/emergency",
        }

        sent_count = 0

        for sub in subscriptions:
            success = send_web_push(
                subscription=sub.subscription_json,
                payload=push_payload,
            )

            if success:
                sent_count += 1

        print(
            f"Hourly alarm reminder sent for alert {alert_id}. "
            f"Users notified: {sent_count}"
        )

    finally:
        db.close()