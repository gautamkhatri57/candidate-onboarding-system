
from datetime import datetime
import os

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session

from database import get_db
from app.auth import get_current_user, require_role
from app.email_service import (
    send_candidate_session_scheduled_email,
    send_interviewer_session_scheduled_email,
)
from app.models import (
    Candidate,
    CandidateStatus,
    InterviewSession,
    SessionOutcome,
    SessionStatus,
    SessionType,
    User,
    UserRole,
)


router = APIRouter(
    prefix="/sessions",
    tags=["Sessions"],
)


class SessionCreate(BaseModel):
    candidate_id: int
    interviewer_id: int
    scheduled_at: datetime


class SessionComplete(BaseModel):
    outcome: SessionOutcome
    notes: str | None = None


class SessionResponse(BaseModel):
    id: int
    candidate_id: int
    interviewer_id: int
    session_number: int
    session_type: SessionType
    scheduled_at: datetime
    status: SessionStatus
    outcome: SessionOutcome | None
    notes: str | None

    class Config:
        from_attributes = True


class InterviewerResponse(BaseModel):
    id: int
    name: str
    email: str

    class Config:
        from_attributes = True


class FinalDecision(BaseModel):
    decision: str
    notes: str | None = None


def get_next_session_number(
    db: Session,
    candidate_id: int,
) -> int:
    last_session = (
        db.query(InterviewSession)
        .filter(
            InterviewSession.candidate_id == candidate_id
        )
        .order_by(
            InterviewSession.session_number.desc()
        )
        .first()
    )

    if not last_session:
        return 1

    return last_session.session_number + 1


def send_session_email(
    candidate: Candidate,
    session: InterviewSession,
):
    frontend_url = os.getenv(
        "FRONTEND_URL",
        "http://localhost:5173",
    ).rstrip("/")

    candidate_portal_link = (
        f"{frontend_url}/candidate/{candidate.secure_token}"
    )

    interviewer = session.interviewer

    # Send notification to candidate
    try:
        send_candidate_session_scheduled_email(
            candidate_email=candidate.email,
            candidate_name=candidate.name,
            position_name=candidate.position.name,
            session_number=session.session_number,
            scheduled_at=session.scheduled_at,
            candidate_portal_link=candidate_portal_link,
        )

        print(
            f"Session {session.session_number} email "
            f"sent to candidate: {candidate.email}"
        )

    except Exception as e:
        print(f"Candidate session email failed: {e}")

    # Send notification to assigned interviewer
    try:
        if not interviewer or not interviewer.email:
            raise ValueError("Assigned interviewer email is missing")

        send_interviewer_session_scheduled_email(
            interviewer_email=interviewer.email,
            interviewer_name=interviewer.name,
            candidate_name=candidate.name,
            position_name=candidate.position.name,
            session_number=session.session_number,
            scheduled_at=session.scheduled_at,
        )

        print(
            f"Session {session.session_number} email "
            f"sent to interviewer: {interviewer.email}"
        )

    except Exception as e:
        print(f"Interviewer session email failed: {e}")


def update_candidate_after_interviewer_confirmation(
    session: InterviewSession,
):
    candidate = session.candidate

    # Session 1
    if (
        session.session_number == 1
        and session.session_type
        == SessionType.MANAGEMENT_FIRST_INTERVIEW
    ):
        candidate.status = CandidateStatus.SESSION_1_COMPLETED

    # Session 2
    elif (
        session.session_number >= 2
        and session.session_type
        == SessionType.MANAGEMENT_FIRST_INTERVIEW
    ):
        candidate.status = CandidateStatus.UNDER_REVIEW

    # Remedial session
    elif session.session_type == SessionType.REMEDIAL:
        candidate.status = CandidateStatus.REMEDIAL_COMPLETED

    # Final interview
    elif session.session_type == SessionType.FINAL_ADMIN_INTERVIEW:
        candidate.status = CandidateStatus.FINAL_INTERVIEW


@router.get(
    "/interviewers",
    response_model=list[InterviewerResponse],
)
def get_interviewers(
    db: Session = Depends(get_db),
    current_user: User = Depends(
        require_role(UserRole.MANAGEMENT)
    ),
):
    interviewers = (
        db.query(User)
        .filter(
            User.role == UserRole.MANAGEMENT,
            User.is_active.is_(True),
        )
        .order_by(User.name.asc())
        .all()
    )

    return interviewers


@router.post(
    "",
    response_model=SessionResponse,
)
def create_session(
    data: SessionCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(
        require_role(UserRole.MANAGEMENT)
    ),
):
    candidate = (
        db.query(Candidate)
        .filter(
            Candidate.id == data.candidate_id
        )
        .first()
    )

    if not candidate:
        raise HTTPException(
            status_code=404,
            detail="Candidate not found",
        )

    if candidate.assigned_manager_id != current_user.id:
        raise HTTPException(
            status_code=403,
            detail="You are not assigned to this candidate",
        )

    interviewer = (
        db.query(User)
        .filter(
            User.id == data.interviewer_id
        )
        .first()
    )

    if not interviewer:
        raise HTTPException(
            status_code=404,
            detail="Interviewer not found",
        )

    if interviewer.role != UserRole.MANAGEMENT:
        raise HTTPException(
            status_code=400,
            detail="Selected interviewer must be a Management user",
        )

    if not interviewer.is_active:
        raise HTTPException(
            status_code=400,
            detail="Selected interviewer is inactive",
        )

    session_number = get_next_session_number(
        db,
        candidate.id,
    )

    # Session 1
    if session_number == 1:
        if candidate.status != CandidateStatus.CREATED:
            raise HTTPException(
                status_code=400,
                detail="Candidate is not ready for Session 1",
            )

        session_type = SessionType.MANAGEMENT_FIRST_INTERVIEW

    # Session 2
    elif session_number == 2:
        if candidate.status != CandidateStatus.SESSION_1_COMPLETED:
            raise HTTPException(
                status_code=400,
                detail=(
                    "Session 1 must be completed "
                    "before scheduling Session 2"
                ),
            )

        session_type = SessionType.MANAGEMENT_FIRST_INTERVIEW

    else:
        raise HTTPException(
            status_code=400,
            detail="Session 2 is already scheduled or completed",
        )

    session = InterviewSession(
        candidate_id=candidate.id,
        interviewer_id=interviewer.id,
        session_number=session_number,
        session_type=session_type,
        scheduled_at=data.scheduled_at,
        status=SessionStatus.SCHEDULED,
        created_at=datetime.utcnow(),
    )

    db.add(session)

    if session_number == 1:
        candidate.status = CandidateStatus.SESSION_1_SCHEDULED

    db.commit()
    db.refresh(session)

    send_session_email(candidate, session)

    return session


@router.get(
    "",
    response_model=list[SessionResponse],
)
def get_sessions(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    query = db.query(InterviewSession)

    if current_user.role == UserRole.MANAGEMENT:
        query = (
            query
            .join(Candidate)
            .filter(
                Candidate.assigned_manager_id == current_user.id
            )
        )

    return (
        query
        .order_by(
            InterviewSession.scheduled_at.asc()
        )
        .all()
    )


@router.get(
    "/{session_id}",
    response_model=SessionResponse,
)
def get_session(
    session_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    session = (
        db.query(InterviewSession)
        .filter(
            InterviewSession.id == session_id
        )
        .first()
    )

    if not session:
        raise HTTPException(
            status_code=404,
            detail="Session not found",
        )

    if current_user.role == UserRole.MANAGEMENT:
        if (
            session.candidate.assigned_manager_id
            != current_user.id
        ):
            raise HTTPException(
                status_code=403,
                detail="Access denied",
            )

    return session


@router.put(
    "/{session_id}/confirm",
    response_model=SessionResponse,
)
def interviewer_confirm_session(
    session_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Interviewer confirms that the candidate-completed
    session has actually been completed.

    Flow:
    SCHEDULED
        ↓
    Candidate confirms
        ↓
    CANDIDATE_CONFIRMED
        ↓
    Interviewer confirms
        ↓
    COMPLETED
    """

    session = (
        db.query(InterviewSession)
        .filter(
            InterviewSession.id == session_id
        )
        .first()
    )

    if not session:
        raise HTTPException(
            status_code=404,
            detail="Session not found",
        )

    if session.interviewer_id != current_user.id:
        raise HTTPException(
            status_code=403,
            detail=(
                "Only the assigned interviewer "
                "can confirm this session"
            ),
        )

    if session.status == SessionStatus.COMPLETED:
        raise HTTPException(
            status_code=400,
            detail="Session is already completed",
        )

    if session.status != SessionStatus.CANDIDATE_CONFIRMED:
        raise HTTPException(
            status_code=400,
            detail=(
                "Candidate must confirm session "
                "completion first"
            ),
        )

    session.status = SessionStatus.COMPLETED

    update_candidate_after_interviewer_confirmation(
        session
    )

    db.commit()
    db.refresh(session)

    return session


@router.put(
    "/{session_id}/complete",
    response_model=SessionResponse,
)
def complete_session(
    session_id: int,
    data: SessionComplete,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Optional interviewer completion endpoint
    when an interview outcome and notes are required.
    """

    session = (
        db.query(InterviewSession)
        .filter(
            InterviewSession.id == session_id
        )
        .first()
    )

    if not session:
        raise HTTPException(
            status_code=404,
            detail="Session not found",
        )

    if session.interviewer_id != current_user.id:
        raise HTTPException(
            status_code=403,
            detail=(
                "Only assigned interviewer "
                "can complete this session"
            ),
        )

    if session.status == SessionStatus.COMPLETED:
        raise HTTPException(
            status_code=400,
            detail="Session is already completed",
        )

    if session.status != SessionStatus.CANDIDATE_CONFIRMED:
        raise HTTPException(
            status_code=400,
            detail=(
                "Candidate must confirm session "
                "completion first"
            ),
        )

    session.status = SessionStatus.COMPLETED
    session.outcome = data.outcome
    session.notes = data.notes

    candidate = session.candidate

    if (
        session.session_type
        == SessionType.MANAGEMENT_FIRST_INTERVIEW
    ):
        if (
            session.session_number == 1
            and data.outcome == SessionOutcome.PASS
        ):
            candidate.status = CandidateStatus.SESSION_1_COMPLETED

        elif (
            session.session_number >= 2
            and data.outcome == SessionOutcome.PASS
        ):
            candidate.status = CandidateStatus.UNDER_REVIEW

        elif data.outcome == SessionOutcome.REJECT:
            candidate.status = CandidateStatus.REJECTED

    elif session.session_type == SessionType.REMEDIAL:
        if data.outcome == SessionOutcome.PASS:
            candidate.status = CandidateStatus.REMEDIAL_COMPLETED

        elif data.outcome == SessionOutcome.REJECT:
            candidate.status = CandidateStatus.REJECTED

    elif (
        session.session_type
        == SessionType.FINAL_ADMIN_INTERVIEW
    ):
        if data.outcome == SessionOutcome.PASS:
            candidate.status = CandidateStatus.SELECTED

        elif data.outcome == SessionOutcome.REJECT:
            candidate.status = CandidateStatus.REJECTED

    db.commit()
    db.refresh(session)

    return session


@router.post(
    "/{candidate_id}/remedial",
    response_model=SessionResponse,
)
def create_remedial_session(
    candidate_id: int,
    data: SessionCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if current_user.role != UserRole.ADMIN:
        raise HTTPException(
            status_code=403,
            detail="Only admin can schedule remedial session",
        )

    candidate = (
        db.query(Candidate)
        .filter(
            Candidate.id == candidate_id
        )
        .first()
    )

    if not candidate:
        raise HTTPException(
            status_code=404,
            detail="Candidate not found",
        )

    interviewer = (
        db.query(User)
        .filter(
            User.id == data.interviewer_id
        )
        .first()
    )

    if not interviewer:
        raise HTTPException(
            status_code=404,
            detail="Interviewer not found",
        )

    if not interviewer.is_active:
        raise HTTPException(
            status_code=400,
            detail="Selected interviewer is inactive",
        )

    session_number = get_next_session_number(
        db,
        candidate.id,
    )

    session = InterviewSession(
        candidate_id=candidate.id,
        interviewer_id=interviewer.id,
        session_number=session_number,
        session_type=SessionType.REMEDIAL,
        scheduled_at=data.scheduled_at,
        status=SessionStatus.SCHEDULED,
        created_at=datetime.utcnow(),
    )

    db.add(session)

    candidate.status = CandidateStatus.REMEDIAL_REQUIRED

    db.commit()
    db.refresh(session)

    send_session_email(candidate, session)

    return session


@router.post(
    "/{candidate_id}/final",
    response_model=SessionResponse,
)
def create_final_session(
    candidate_id: int,
    data: SessionCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if current_user.role != UserRole.ADMIN:
        raise HTTPException(
            status_code=403,
            detail="Only admin can schedule final interview",
        )

    candidate = (
        db.query(Candidate)
        .filter(
            Candidate.id == candidate_id
        )
        .first()
    )

    if not candidate:
        raise HTTPException(
            status_code=404,
            detail="Candidate not found",
        )

    interviewer = (
        db.query(User)
        .filter(
            User.id == data.interviewer_id
        )
        .first()
    )

    if not interviewer:
        raise HTTPException(
            status_code=404,
            detail="Interviewer not found",
        )

    if not interviewer.is_active:
        raise HTTPException(
            status_code=400,
            detail="Selected interviewer is inactive",
        )

    session_number = get_next_session_number(
        db,
        candidate.id,
    )

    session = InterviewSession(
        candidate_id=candidate.id,
        interviewer_id=interviewer.id,
        session_number=session_number,
        session_type=SessionType.FINAL_ADMIN_INTERVIEW,
        scheduled_at=data.scheduled_at,
        status=SessionStatus.SCHEDULED,
        created_at=datetime.utcnow(),
    )

    db.add(session)

    candidate.status = CandidateStatus.FINAL_INTERVIEW

    db.commit()
    db.refresh(session)

    send_session_email(candidate, session)

    return session


@router.put(
    "/{session_id}/final-decision",
    response_model=SessionResponse,
)
def final_decision(
    session_id: int,
    data: FinalDecision,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if current_user.role != UserRole.ADMIN:
        raise HTTPException(
            status_code=403,
            detail="Only admin can make final decision",
        )

    session = (
        db.query(InterviewSession)
        .filter(
            InterviewSession.id == session_id
        )
        .first()
    )

    if not session:
        raise HTTPException(
            status_code=404,
            detail="Session not found",
        )

    if (
        session.session_type
        != SessionType.FINAL_ADMIN_INTERVIEW
    ):
        raise HTTPException(
            status_code=400,
            detail="This is not a final interview",
        )

    candidate = session.candidate
    decision = data.decision.upper()

    if decision == "SELECTED":
        candidate.status = CandidateStatus.SELECTED

    elif decision == "REJECTED":
        candidate.status = CandidateStatus.REJECTED

    else:
        raise HTTPException(
            status_code=400,
            detail="Decision must be SELECTED or REJECTED",
        )

    session.notes = data.notes

    db.commit()
    db.refresh(session)

    return session