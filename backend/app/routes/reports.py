"""
Community incident reports — TASK-031/032.
Users submit personal-experience reports; public reports appear on the community map.
AI structuring via Gemini is optional.
"""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
from ..database import get_db
from ..models.incident_report import IncidentReport
from ..models.user import User
from ..schemas.session import ReportCreateRequest, ReportResponse
from ..security.auth import get_current_user

router = APIRouter(prefix="/api/v1/reports", tags=["reports"])


class DraftRequest(BaseModel):
    description: str
    report_type: str


@router.post("/draft")
def ai_draft(
    payload: DraftRequest,
    current_user: User = Depends(get_current_user),
):
    """Return an AI-structured draft for user review — does NOT save anything."""
    if not payload.description.strip():
        raise HTTPException(status_code=422, detail="Description is required")
    from ..services.gemini_service import structure_incident_report
    suggestion = structure_incident_report(payload.description)
    if not suggestion:
        raise HTTPException(status_code=503, detail="AI service not available — submit your original text")
    return {"suggestion": suggestion}


@router.post("", response_model=ReportResponse, status_code=201)
def create_report(
    payload: ReportCreateRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Submit an incident report. AI structuring applied if Gemini is configured."""
    ai_summary = None
    if payload.description:
        from ..services.gemini_service import structure_incident_report
        ai_summary = structure_incident_report(payload.description)

    report = IncidentReport(
        user_id=current_user.id,
        report_type=payload.report_type,
        description=payload.description,
        ai_summary=ai_summary,
        latitude=payload.latitude,
        longitude=payload.longitude,
        is_public=payload.is_public,
    )
    db.add(report)
    db.commit()
    db.refresh(report)
    return report


@router.get("", response_model=list[ReportResponse])
def list_public_reports(db: Session = Depends(get_db)):
    """Return all public reports for the community map. No auth required."""
    reports = (
        db.query(IncidentReport)
        .filter_by(is_public=True)
        .order_by(IncidentReport.created_at.desc())
        .limit(200)
        .all()
    )
    return reports


@router.get("/mine", response_model=list[ReportResponse])
def list_my_reports(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Return the current user's own reports."""
    return (
        db.query(IncidentReport)
        .filter_by(user_id=current_user.id)
        .order_by(IncidentReport.created_at.desc())
        .all()
    )
