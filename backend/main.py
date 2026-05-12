from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from backend.api.auth import router as auth_router
from backend.api.admin_alert_router import router as admin_alert_router
from backend.api.websocket_router import router as websocket_router
from backend.api.push_router import router as push_router
from backend.api.emergency_response_router import router as emergency_response_router

from backend.core.seed import seed_admin
from backend.database import Base, engine, SessionLocal

from backend.service.alert_reminder_scheduler import (
    start_alert_reminder_scheduler,
    stop_alert_reminder_scheduler,
)

from backend.model import (
    User,
    OTPVerification,
    UserSession,
    Admin,
    EarthquakeAlert,
    PushSubscription,
    SOSAlert,
    UserLocation,
    Notification,
)

from backend.model.emergency_response import EmergencyResponse

Base.metadata.create_all(bind=engine)

app = FastAPI(title="QuakeGuard API")

app.add_middleware(
    CORSMiddleware,
    allow_origin_regex=r"^https?://(localhost|127\.0\.0\.1):\d+$",
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("startup")
def startup_event():
    db = SessionLocal()

    try:
        seed_admin(db)
        start_alert_reminder_scheduler()
    finally:
        db.close()


@app.on_event("shutdown")
def shutdown_event():
    stop_alert_reminder_scheduler()


app.include_router(auth_router)
app.include_router(push_router)
app.include_router(admin_alert_router)
app.include_router(websocket_router)
app.include_router(emergency_response_router)


@app.get("/")
def home():
    return {
        "message": "QuakeGuard API is running",
        "database": "tables created successfully",
    }