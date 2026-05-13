from fastapi import APIRouter, WebSocket, WebSocketDisconnect, Depends
from sqlalchemy.orm import Session

from backend.api.auth_dependency import get_current_admin
from backend.database import get_db
from backend.model.admin import Admin
from backend.model.earthquake_alert import Alert
from backend.schema.alert_schema import EarthquakeAlertCreate, EarthquakeAlertResponse
from backend.websocket.manager import manager

router = APIRouter(
    prefix="/ws",
    tags=["WebSocket"],
)


@router.websocket("/alerts")
async def websocket_alerts(websocket: WebSocket):
    await manager.connect(websocket)

    try:
        while True:
            await websocket.receive_text()

    except WebSocketDisconnect:
        manager.disconnect(websocket)

    except Exception as e:
        manager.disconnect(websocket)
        print("WebSocket error:", e)


@router.post("/admin/alert", response_model=EarthquakeAlertResponse)
async def send_alert(
    payload: EarthquakeAlertCreate,
    db: Session = Depends(get_db),
    current_admin: Admin = Depends(get_current_admin),
):
    alert = Alert(
        title=payload.title,
        message=payload.message,
        alert_type=payload.alert_type,
        magnitude=payload.magnitude,
        risk_level=payload.risk_level,
        status=payload.status,
        emergency=payload.emergency,
        created_by=current_admin.id,
    )

    db.add(alert)
    db.commit()
    db.refresh(alert)

    alert_data = {
        "id": str(alert.id),
        "title": alert.title,
        "message": alert.message,
        "status": alert.status.value if hasattr(alert.status, "value") else alert.status,
        "risk_level": alert.risk_level.value if hasattr(alert.risk_level, "value") else alert.risk_level,
        "magnitude": float(alert.magnitude) if alert.magnitude is not None else None,
        "emergency": alert.emergency,
    }

    print("🚨 Alert saved. Now broadcasting...")
    await manager.broadcast(alert_data)

    return EarthquakeAlertResponse(
        id=str(alert.id),
        title=alert.title,
        message=alert.message,
        magnitude=float(alert.magnitude) if alert.magnitude is not None else None,
        risk_level=alert.risk_level.value if hasattr(alert.risk_level, "value") else alert.risk_level,
        emergency=alert.emergency,
    )