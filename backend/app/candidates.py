
import os
import secrets

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, EmailStr
from sqlalchemy.orm import Session

from database import get_db
from app.auth import get_current_user
from app.email_service import send_candidate_application_email
from app.models import (
    Candidate,
    CandidateDocument,
    CandidateStatus,
    DocumentStatus,
    Position,
    User,
    UserRole,
)

router = APIRouter(prefix="/candidates", tags=["Candidates"])


# ============================================================
# Schemas
# ============================================================

class CandidateCreate(BaseModel):
    name: str
    email: EmailStr
    phone: str
    position_id: int
    assigned_manager_id: int | None = None


class CandidateResponse(BaseModel):
    id: int
    name: str
    email: str
    phone: str
    status: CandidateStatus
    position_id: int
    assigned_manager_id: int | None

    model_config = {
        "from_attributes": True
    }


class CandidateCreateResponse(CandidateResponse):
    email_sent: bool
    message: str


class ReviewResponse(BaseModel):
    id: int
    status: CandidateStatus
    message: str


class ReviewDecision(BaseModel):
    decision: str


class EmailResendResponse(BaseModel):
    id: int
    message: str


# ============================================================
# Helpers
# ============================================================

def check_hr(current_user: User):
    if current_user.role != UserRole.HR:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only HR can create candidates",
        )


def check_admin_or_hr_or_management(current_user: User):
    if current_user.role not in [
        UserRole.ADMIN,
        UserRole.HR,
        UserRole.MANAGEMENT,
    ]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You do not have permission to access this resource",
        )


def check_admin(current_user: User):
    if current_user.role != UserRole.ADMIN:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only admin can perform this action",
        )


def get_application_link(secure_token: str) -> str:
    frontend_url = os.getenv(
        "FRONTEND_URL",
        "http://localhost:5173",
    ).rstrip("/")

    return f"{frontend_url}/candidate/{secure_token}"


def send_application_email(candidate: Candidate) -> bool:
    application_link = get_application_link(candidate.secure_token)

    try:
        send_candidate_application_email(
            candidate_email=candidate.email,
            candidate_name=candidate.name,
            application_link=application_link,
        )
        return True
    except Exception as email_error:
        # Log the failure on the server; do not expose internal details.
        print(
            f"Application email failed for candidate "
            f"{candidate.id}: {email_error}"
        )
        return False


# ============================================================
# Create Candidate (HR)
# ============================================================

@router.post(
    "/",
    response_model=CandidateCreateResponse,
    status_code=status.HTTP_201_CREATED,
)
def create_candidate(
    candidate_data: CandidateCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    check_hr(current_user)

    position = (
        db.query(Position)
        .filter(
            Position.id == candidate_data.position_id,
            Position.is_active.is_(True),
        )
        .first()
    )

    if not position:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Active position not found",
        )

    existing_candidate = (
        db.query(Candidate)
        .filter(Candidate.email == candidate_data.email)
        .first()
    )

    if existing_candidate:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="A candidate with this email already exists",
        )

    if candidate_data.assigned_manager_id is not None:
        manager = (
            db.query(User)
            .filter(
                User.id == candidate_data.assigned_manager_id,
                User.role == UserRole.MANAGEMENT,
            )
            .first()
        )

        if not manager:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Assigned manager not found",
            )

    secure_token = secrets.token_urlsafe(32)

    candidate = Candidate(
        name=candidate_data.name,
        email=candidate_data.email,
        phone=candidate_data.phone,
        position_id=candidate_data.position_id,
        assigned_manager_id=candidate_data.assigned_manager_id,
        secure_token=secure_token,
        status=CandidateStatus.CREATED,
        application_submitted=False,
    )

    try:
        db.add(candidate)
        db.flush()

        # Create checklist from the position's configured documents.
        for position_document in position.documents:
            candidate_document = CandidateDocument(
                candidate_id=candidate.id,
                position_document_id=position_document.id,
                status=DocumentStatus.PENDING,
            )
            db.add(candidate_document)

        db.commit()
        db.refresh(candidate)

    except Exception:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Candidate could not be created",
        )

    email_sent = send_application_email(candidate)

    return CandidateCreateResponse(
        id=candidate.id,
        name=candidate.name,
        email=candidate.email,
        phone=candidate.phone,
        status=candidate.status,
        position_id=candidate.position_id,
        assigned_manager_id=candidate.assigned_manager_id,
        email_sent=email_sent,
        message=(
            "Candidate created and application email sent"
            if email_sent
            else "Candidate created, but application email could not be sent"
        ),
    )


# ============================================================
# Resend Application Email (HR / Admin)
# ============================================================

@router.post(
    "/{candidate_id}/resend-email",
    response_model=EmailResendResponse,
)
def resend_candidate_email(
    candidate_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if current_user.role not in [UserRole.HR, UserRole.ADMIN]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only HR or Admin can resend application email",
        )

    candidate = (
        db.query(Candidate)
        .filter(Candidate.id == candidate_id)
        .first()
    )

    if not candidate:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Candidate not found",
        )

    if candidate.status != CandidateStatus.CREATED:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Application email can only be resent while candidate status is CREATED",
        )

    email_sent = send_application_email(candidate)

    if not email_sent:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail="Email could not be sent. Check email service configuration.",
        )

    return EmailResendResponse(
        id=candidate.id,
        message="Application email sent successfully",
    )


# ============================================================
# Get Candidates (HR, Admin, Assigned Management)
# ============================================================

@router.get(
    "/",
    response_model=list[CandidateResponse],
)
def get_candidates(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    check_admin_or_hr_or_management(current_user)

    query = db.query(Candidate)

    if current_user.role == UserRole.MANAGEMENT:
        query = query.filter(
            Candidate.assigned_manager_id == current_user.id
        )

    return query.order_by(Candidate.id.desc()).all()


# ============================================================
# Get Single Candidate
# ============================================================

@router.get(
    "/{candidate_id}",
    response_model=CandidateResponse,
)
def get_candidate(
    candidate_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    check_admin_or_hr_or_management(current_user)

    candidate = (
        db.query(Candidate)
        .filter(Candidate.id == candidate_id)
        .first()
    )

    if not candidate:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Candidate not found",
        )

    if (
        current_user.role == UserRole.MANAGEMENT
        and candidate.assigned_manager_id != current_user.id
    ):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You do not have permission to access this candidate",
        )

    return candidate


# ============================================================
# Start Management Review
# ============================================================

@router.post(
    "/{candidate_id}/review",
    response_model=ReviewResponse,
)
def start_management_review(
    candidate_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if current_user.role != UserRole.MANAGEMENT:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only management can start review",
        )

    candidate = (
        db.query(Candidate)
        .filter(
            Candidate.id == candidate_id,
            Candidate.assigned_manager_id == current_user.id,
        )
        .first()
    )

    if not candidate:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Candidate not found or not assigned to you",
        )

    if candidate.status not in [
        CandidateStatus.SESSION_1_COMPLETED,
        CandidateStatus.UNDER_REVIEW,
    ]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Candidate must have completed the required sessions before review",
        )

    candidate.status = CandidateStatus.UNDER_REVIEW

    db.commit()
    db.refresh(candidate)

    return ReviewResponse(
        id=candidate.id,
        status=candidate.status,
        message="Candidate moved to management review",
    )


# ============================================================
# Admin Review Decision
# ============================================================

@router.put(
    "/{candidate_id}/review",
    response_model=ReviewResponse,
)
def admin_review_candidate(
    candidate_id: int,
    decision_data: ReviewDecision,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    check_admin(current_user)

    candidate = (
        db.query(Candidate)
        .filter(Candidate.id == candidate_id)
        .first()
    )

    if not candidate:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Candidate not found",
        )

    if candidate.status != CandidateStatus.UNDER_REVIEW:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Candidate must be UNDER_REVIEW before an admin review decision can be made",
        )

    decision = decision_data.decision.strip().upper()

    if decision == "APPROVE":
        candidate.status = CandidateStatus.APPROVED
        message = "Candidate approved by admin"

    elif decision == "REMEDIAL":
        candidate.status = CandidateStatus.REMEDIAL_REQUIRED
        message = "Candidate marked for remedial session"

    elif decision == "REJECT":
        candidate.status = CandidateStatus.REJECTED
        message = "Candidate rejected by admin"

    else:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Decision must be APPROVE, REMEDIAL, or REJECT",
        )

    db.commit()
    db.refresh(candidate)

    return ReviewResponse(
        id=candidate.id,
        status=candidate.status,
        message=message,
    )


# ============================================================
# Legacy Management Review Decision (Disabled)
# ============================================================

@router.put(
    "/{candidate_id}/review-decision",
    response_model=ReviewResponse,
)
def management_review_decision(
    candidate_id: int,
    decision_data: ReviewDecision,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    raise HTTPException(
        status_code=status.HTTP_403_FORBIDDEN,
        detail="Review decisions can only be made by Admin",
    )


# ============================================================
# Delete Candidate (Admin)
# ============================================================

@router.delete(
    "/{candidate_id}",
    status_code=status.HTTP_204_NO_CONTENT,
)
def delete_candidate(
    candidate_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    check_admin(current_user)

    candidate = (
        db.query(Candidate)
        .filter(Candidate.id == candidate_id)
        .first()
    )

    if not candidate:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Candidate not found",
        )

    db.delete(candidate)
    db.commit()

    return None


# ============================================================
# Onboard Candidate (Admin)
# ============================================================

@router.put(
    "/{candidate_id}/onboard",
    response_model=ReviewResponse,
)
def onboard_candidate(
    candidate_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    check_admin(current_user)

    candidate = (
        db.query(Candidate)
        .filter(Candidate.id == candidate_id)
        .first()
    )

    if not candidate:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Candidate not found",
        )

    if candidate.status != CandidateStatus.SELECTED:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Candidate must be selected before onboarding",
        )

    candidate.status = CandidateStatus.ONBOARDED

    db.commit()
    db.refresh(candidate)

    return ReviewResponse(
        id=candidate.id,
        status=candidate.status,
        message="Candidate successfully onboarded",
    )