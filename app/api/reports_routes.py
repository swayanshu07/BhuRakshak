from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
from app.db.database import get_db
from app.db.models import Report
from app.auth.dependencies import require_role

router = APIRouter(prefix="/reports", tags=["reports"])

class ReportCreate(BaseModel):
    description: str
    latitude: float
    longitude: float

class VerifyRequest(BaseModel):
    status: str

@router.post("")
def submit_report(data: ReportCreate, db: Session = Depends(get_db), user: dict = Depends(require_role("citizen"))):
    report = Report(reporter_username=user["username"], role="citizen",
                     description=data.description, latitude=data.latitude,
                     longitude=data.longitude, status="pending")
    db.add(report)
    db.commit()
    db.refresh(report)
    return {"message": "report submitted", "id": report.id}

@router.post("/official")
def add_official_report(data: ReportCreate, db: Session = Depends(get_db), user: dict = Depends(require_role("official"))):
    report = Report(reporter_username=user["username"], role="official",
                     description=data.description, latitude=data.latitude,
                     longitude=data.longitude, status="verified")
    db.add(report)
    db.commit()
    db.refresh(report)
    return {"message": "official report added", "id": report.id}

@router.get("")
def list_all_reports(db: Session = Depends(get_db), user: dict = Depends(require_role("official"))):
    reports = db.query(Report).order_by(Report.created_at.desc()).all()
    return [{"id": r.id, "reporter": r.reporter_username, "role": r.role,
             "description": r.description, "latitude": r.latitude,
             "longitude": r.longitude, "status": r.status,
             "created_at": r.created_at} for r in reports]

@router.get("/public")
def list_verified_reports(db: Session = Depends(get_db)):
    reports = db.query(Report).filter(Report.status == "verified").order_by(Report.created_at.desc()).all()
    return [{"id": r.id, "description": r.description, "latitude": r.latitude,
             "longitude": r.longitude, "created_at": r.created_at} for r in reports]

@router.patch("/{report_id}/verify")
def verify_report(report_id: int, data: VerifyRequest, db: Session = Depends(get_db), user: dict = Depends(require_role("official"))):
    report = db.query(Report).filter(Report.id == report_id).first()
    if not report:
        raise HTTPException(status_code=404, detail="Report not found")
    if data.status not in ("verified", "rejected"):
        raise HTTPException(status_code=400, detail="status must be verified or rejected")
    report.status = data.status
    db.commit()
    return {"message": f"report {data.status}"}