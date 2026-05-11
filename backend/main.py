from fastapi import FastAPI

from backend.api.auth import router as auth_router
from backend.api.admin_alert_router import router as admin_alert_router
from backend.api.websocket_router import router as websocket_router

from backend.core.seed import seed_admin
from backend.database import Base, engine, SessionLocal

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

Base.metadata.create_all(bind=engine)

app = FastAPI(title="QuakeGuard API")


@app.on_event("startup")
def startup_event():
    db = SessionLocal()

    try:
        seed_admin(db)
    finally:
        db.close()


app.include_router(auth_router)
app.include_router(admin_alert_router)
app.include_router(websocket_router)


@app.get("/")
def home():
    return {
        "message": "QuakeGuard API is running",
        "database": "tables created successfully",
    }