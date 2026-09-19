from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Optional
from app.db.database import get_db
from app.db.models import Alert
from app.auth.dependencies import require_role

router = APIRouter(prefix="/alerts", tags=["alerts"])

class AlertCreate(BaseModel):
    title: str
    message: str
    risk_level: Optional[str] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None

@router.post("")
def create_alert(data: AlertCreate, db: Session = Depends(get_db), user: dict = Depends(require_role("official"))):
    alert = Alert(title=data.title, message=data.message, risk_level=data.risk_level,
                  latitude=data.latitude, longitude=data.longitude, issued_by=user["username"])
    db.add(alert)
    db.commit()
    db.refresh(alert)
    return {"message": "alert issued", "id": alert.id}

@router.get("")
def list_alerts(db: Session = Depends(get_db)):
    alerts = db.query(Alert).order_by(Alert.created_at.desc()).all()
    return [{"id": a.id, "title": a.title, "message": a.message, "risk_level": a.risk_level,
             "latitude": a.latitude, "longitude": a.longitude, "issued_by": a.issued_by,
             "created_at": a.created_at} for a in alerts]