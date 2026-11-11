from pydantic import BaseModel
from datetime import datetime
from typing import Optional


class SessionStartRequest(BaseModel):
    latitude: Optional[float] = None
    longitude: Optional[float] = None


class SessionStartResponse(BaseModel):
    id: str
    status: str
    started_at: datetime
    first_check_at: datetime
    latitude: Optional[float] = None
    longitude: Optional[float] = None

    model_config = {"from_attributes": True}


class SessionStatusResponse(BaseModel):
    id: str
    status: str
    started_at: datetime
    ended_at: Optional[datetime]
    latitude: Optional[float] = None
    longitude: Optional[float] = None

    model_config = {"from_attributes": True}


class CheckResponse(BaseModel):
    id: str
    sequence_number: int
    due_at: datetime
    response_deadline: datetime
    status: str
    response: Optional[str]
    responded_at: Optional[datetime]

    model_config = {"from_attributes": True}


class RespondRequest(BaseModel):
    response: str  # "YES" | "NO" | "SOS"


class EmergencyResponse(BaseModel):
    id: str
    session_id: str
    status: str
    trigger_reason: str
    triggered_at: datetime
    last_updated_at: datetime
    resolved_at: Optional[datetime]

    model_config = {"from_attributes": True}


class GuardianAlertResponse(BaseModel):
    """Emergency alert enriched with user info and location for guardian view."""
    id: str
    session_id: str
    status: str
    trigger_reason: str
    triggered_at: datetime
    last_updated_at: datetime
    resolved_at: Optional[datetime]
    user_email: str
    latitude: Optional[float] = None
    longitude: Optional[float] = None


class ReportCreateRequest(BaseModel):
    report_type: str
    description: str
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    is_public: bool = False


class ReportResponse(BaseModel):
    id: str
    report_type: str
    description: str
    ai_summary: Optional[str]
    latitude: Optional[float]
    longitude: Optional[float]
    is_public: bool
    created_at: datetime

    model_config = {"from_attributes": True}
