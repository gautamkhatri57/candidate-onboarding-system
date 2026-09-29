
from datetime import datetime
from enum import Enum as PyEnum

from sqlalchemy import (
    Boolean,
    DateTime,
    Enum,
    ForeignKey,
    Integer,
    String,
    Text,
)
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column, relationship


# =========================================================
# DATABASE BASE
# =========================================================

class Base(DeclarativeBase):
    pass


# =========================================================
# ENUMS
# =========================================================

class UserRole(str, PyEnum):
    ADMIN = "ADMIN"
    MANAGEMENT = "MANAGEMENT"
    HR = "HR"


class CandidateStatus(str, PyEnum):
    CREATED = "CREATED"

    SESSION_1_SCHEDULED = "SESSION_1_SCHEDULED"
    SESSION_1_COMPLETED = "SESSION_1_COMPLETED"
    CANDIDATE_CONFIRMED = "CANDIDATE_CONFIRMED"

    UNDER_REVIEW = "UNDER_REVIEW"
    APPROVED = "APPROVED"

    REMEDIAL_REQUIRED = "REMEDIAL_REQUIRED"
    REMEDIAL_COMPLETED = "REMEDIAL_COMPLETED"

    FINAL_INTERVIEW = "FINAL_INTERVIEW"

    SELECTED = "SELECTED"
    REJECTED = "REJECTED"
    ONBOARDED = "ONBOARDED"


class SessionType(str, PyEnum):
    MANAGEMENT_FIRST_INTERVIEW = "MANAGEMENT_FIRST_INTERVIEW"
    REMEDIAL = "REMEDIAL"
    FINAL_ADMIN_INTERVIEW = "FINAL_ADMIN_INTERVIEW"


class SessionStatus(str, PyEnum):
    SCHEDULED = "SCHEDULED"
    CANDIDATE_CONFIRMED = "CANDIDATE_CONFIRMED"
    COMPLETED = "COMPLETED"


class SessionOutcome(str, PyEnum):
    PASS = "PASS"
    FAIL = "FAIL"
    REJECT = "REJECT"


class DocumentStatus(str, PyEnum):
    PENDING = "PENDING"
    UPLOADED = "UPLOADED"


# =========================================================
# USER
# =========================================================

class User(Base):
    __tablename__ = "users"

    id: Mapped[int] = mapped_column(
        Integer,
        primary_key=True,
        index=True,
    )

    name: Mapped[str] = mapped_column(
        String,
        nullable=False,
    )

    email: Mapped[str] = mapped_column(
        String,
        unique=True,
        index=True,
        nullable=False,
    )

    password_hash: Mapped[str] = mapped_column(
        String,
        nullable=False,
    )

    role: Mapped[UserRole] = mapped_column(
        Enum(UserRole, name="userrole"),
        nullable=False,
    )

    created_at: Mapped[datetime] = mapped_column(
        DateTime,
        default=datetime.utcnow,
        nullable=False,
    )

    is_active: Mapped[bool] = mapped_column(
        Boolean,
        default=True,
        nullable=False,
    )

    managed_candidates = relationship(
        "Candidate",
        foreign_keys="Candidate.assigned_manager_id",
        back_populates="assigned_manager",
    )

    interview_sessions = relationship(
        "InterviewSession",
        foreign_keys="InterviewSession.interviewer_id",
        back_populates="interviewer",
    )


# =========================================================
# POSITION
# =========================================================

class Position(Base):
    __tablename__ = "positions"

    id: Mapped[int] = mapped_column(
        Integer,
        primary_key=True,
        index=True,
    )

    # Python attribute "name" maps to database column "title"
    name: Mapped[str] = mapped_column(
        "title",
        String(150),
        nullable=False,
    )

    description: Mapped[str | None] = mapped_column(
        Text,
        nullable=True,
    )

    is_active: Mapped[bool] = mapped_column(
        Boolean,
        default=True,
        nullable=False,
    )

    created_at: Mapped[datetime] = mapped_column(
        DateTime,
        default=datetime.utcnow,
        nullable=False,
    )

    documents = relationship(
        "PositionDocument",
        back_populates="position",
        cascade="all, delete-orphan",
    )

    candidates = relationship(
        "Candidate",
        back_populates="position",
    )


# =========================================================
# POSITION DOCUMENT
# =========================================================

class PositionDocument(Base):
    __tablename__ = "position_documents"

    id: Mapped[int] = mapped_column(
        Integer,
        primary_key=True,
        index=True,
    )

    position_id: Mapped[int] = mapped_column(
        ForeignKey("positions.id", ondelete="CASCADE"),
        nullable=False,
    )

    document_name: Mapped[str] = mapped_column(
        String,
        nullable=False,
    )

    is_required: Mapped[bool] = mapped_column(
        Boolean,
        default=True,
        nullable=False,
    )

    created_at: Mapped[datetime] = mapped_column(
        DateTime,
        default=datetime.utcnow,
        nullable=False,
    )

    position = relationship(
        "Position",
        back_populates="documents",
    )

    candidate_documents = relationship(
        "CandidateDocument",
        back_populates="position_document",
    )


# =========================================================
# CANDIDATE
# =========================================================

class Candidate(Base):
    __tablename__ = "candidates"

    id: Mapped[int] = mapped_column(
        Integer,
        primary_key=True,
        index=True,
    )

    name: Mapped[str] = mapped_column(
        String,
        nullable=False,
    )

    email: Mapped[str] = mapped_column(
        String,
        nullable=False,
    )

    phone: Mapped[str] = mapped_column(
        String,
        nullable=False,
    )

    position_id: Mapped[int] = mapped_column(
        ForeignKey("positions.id"),
        nullable=False,
    )

    assigned_manager_id: Mapped[int | None] = mapped_column(
        ForeignKey("users.id"),
        nullable=True,
    )

    status: Mapped[CandidateStatus] = mapped_column(
        Enum(CandidateStatus, name="candidatestatus"),
        default=CandidateStatus.CREATED,
        nullable=False,
    )

    secure_token: Mapped[str] = mapped_column(
        String,
        unique=True,
        index=True,
        nullable=False,
    )

    application_submitted: Mapped[bool] = mapped_column(
        Boolean,
        default=False,
        nullable=False,
    )

    created_at: Mapped[datetime] = mapped_column(
        DateTime,
        default=datetime.utcnow,
        nullable=False,
    )

    updated_at: Mapped[datetime] = mapped_column(
        DateTime,
        default=datetime.utcnow,
        onupdate=datetime.utcnow,
        nullable=False,
    )

    position = relationship(
        "Position",
        back_populates="candidates",
    )

    assigned_manager = relationship(
        "User",
        foreign_keys=[assigned_manager_id],
        back_populates="managed_candidates",
    )

    documents = relationship(
        "CandidateDocument",
        back_populates="candidate",
        cascade="all, delete-orphan",
    )

    sessions = relationship(
        "InterviewSession",
        back_populates="candidate",
        cascade="all, delete-orphan",
    )


# =========================================================
# CANDIDATE DOCUMENT
# =========================================================

class CandidateDocument(Base):
    __tablename__ = "candidate_documents"

    id: Mapped[int] = mapped_column(
        Integer,
        primary_key=True,
        index=True,
    )

    candidate_id: Mapped[int] = mapped_column(
        ForeignKey("candidates.id", ondelete="CASCADE"),
        nullable=False,
    )

    position_document_id: Mapped[int] = mapped_column(
        ForeignKey("position_documents.id", ondelete="CASCADE"),
        nullable=False,
    )

    file_path: Mapped[str | None] = mapped_column(
        String,
        nullable=True,
    )

    file_name: Mapped[str | None] = mapped_column(
        String,
        nullable=True,
    )

    status: Mapped[DocumentStatus] = mapped_column(
        Enum(DocumentStatus, name="documentstatus"),
        default=DocumentStatus.PENDING,
        nullable=False,
    )

    uploaded_at: Mapped[datetime | None] = mapped_column(
        DateTime,
        nullable=True,
    )

    candidate = relationship(
        "Candidate",
        back_populates="documents",
    )

    position_document = relationship(
        "PositionDocument",
        back_populates="candidate_documents",
    )


# =========================================================
# INTERVIEW SESSION
# =========================================================

class InterviewSession(Base):
    __tablename__ = "interview_sessions"

    id: Mapped[int] = mapped_column(
        Integer,
        primary_key=True,
        index=True,
    )

    candidate_id: Mapped[int] = mapped_column(
        ForeignKey("candidates.id", ondelete="CASCADE"),
        nullable=False,
    )

    interviewer_id: Mapped[int] = mapped_column(
        ForeignKey("users.id"),
        nullable=False,
    )

    session_number: Mapped[int] = mapped_column(
        Integer,
        nullable=False,
    )

    session_type: Mapped[SessionType] = mapped_column(
        Enum(SessionType, name="sessiontype"),
        nullable=False,
    )

    scheduled_at: Mapped[datetime] = mapped_column(
        DateTime,
        nullable=False,
    )

    status: Mapped[SessionStatus] = mapped_column(
        Enum(SessionStatus, name="sessionstatus"),
        default=SessionStatus.SCHEDULED,
        nullable=False,
    )

    outcome: Mapped[SessionOutcome | None] = mapped_column(
        Enum(SessionOutcome, name="sessionoutcome"),
        nullable=True,
    )

    notes: Mapped[str | None] = mapped_column(
        Text,
        nullable=True,
    )

    created_at: Mapped[datetime] = mapped_column(
        DateTime,
        default=datetime.utcnow,
        nullable=False,
    )

    candidate = relationship(
        "Candidate",
        back_populates="sessions",
    )

    interviewer = relationship(
        "User",
        foreign_keys=[interviewer_id],
        back_populates="interview_sessions",
    )