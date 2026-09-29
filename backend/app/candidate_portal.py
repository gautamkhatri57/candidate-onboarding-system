import os
import shutil
import uuid
from datetime import datetime

from fastapi import APIRouter, Depends, File, HTTPException, UploadFile
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session

from database import get_db
from app.auth import get_current_user
from app.email_service import send_manager_documents_completed_email
from app.models import (
    Candidate,
    CandidateDocument,
    CandidateStatus,
    InterviewSession,
    SessionStatus,
    User,
    UserRole,
)

router = APIRouter(tags=["Candidate Portal"])

UPLOAD_DIR = "uploads/candidates"


# =========================================================
# GET CANDIDATE PORTAL
# =========================================================

@router.get("/candidate/{token}")
def get_candidate_portal(
    token: str,
    db: Session = Depends(get_db),
):
    candidate = (
        db.query(Candidate)
        .filter(Candidate.secure_token == token)
        .first()
    )

    if not candidate:
        raise HTTPException(
            status_code=404,
            detail="Invalid or expired candidate link",
        )

    documents = (
        db.query(CandidateDocument)
        .filter(CandidateDocument.candidate_id == candidate.id)
        .all()
    )

    sessions = (
        db.query(InterviewSession)
        .filter(InterviewSession.candidate_id == candidate.id)
        .order_by(InterviewSession.session_number.asc())
        .all()
    )

    document_list = []

    for document in documents:
        position_document = document.position_document

        document_list.append({
            "id": document.id,
            "document_name": (
                position_document.document_name
                if position_document
                else "Document"
            ),
            "is_required": (
                position_document.is_required
                if position_document
                else True
            ),
            "status": (
                document.status.value
                if document.status
                else "PENDING"
            ),
            "file_path": document.file_path,
            "file_name": (
                document.file_name
                or os.path.basename(document.file_path)
                if document.file_path
                else None
            ),
            "uploaded_at": (
                document.uploaded_at.isoformat()
                if document.uploaded_at
                else None
            ),
        })

    session_list = []

    for interview_session in sessions:
        session_list.append({
            "id": interview_session.id,
            "session_number": interview_session.session_number,
            "session_type": (
                interview_session.session_type.value
                if interview_session.session_type
                else None
            ),
            "scheduled_at": (
                interview_session.scheduled_at.isoformat()
                if interview_session.scheduled_at
                else None
            ),
            "status": (
                interview_session.status.value
                if interview_session.status
                else None
            ),
            "outcome": (
                interview_session.outcome.value
                if interview_session.outcome
                else None
            ),
        })

    return {
        "id": candidate.id,
        "name": candidate.name,
        "email": candidate.email,
        "phone": candidate.phone,
        "position_id": candidate.position_id,
        "status": (
            candidate.status.value
            if candidate.status
            else None
        ),
        "application_submitted": candidate.application_submitted,
        "documents": document_list,
        "sessions": session_list,
    }


# =========================================================
# UPLOAD CANDIDATE DOCUMENT
# =========================================================

@router.post("/candidate/{token}/documents/{document_id}/upload")
def upload_candidate_document(
    token: str,
    document_id: int,
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
):
    candidate = (
        db.query(Candidate)
        .filter(Candidate.secure_token == token)
        .first()
    )

    if not candidate:
        raise HTTPException(
            status_code=404,
            detail="Invalid or expired candidate link",
        )

    if candidate.application_submitted:
        raise HTTPException(
            status_code=400,
            detail="Application has already been submitted",
        )

    candidate_document = (
        db.query(CandidateDocument)
        .filter(
            CandidateDocument.id == document_id,
            CandidateDocument.candidate_id == candidate.id,
        )
        .first()
    )

    if not candidate_document:
        raise HTTPException(
            status_code=404,
            detail="Candidate document not found",
        )

    if not file.filename:
        raise HTTPException(
            status_code=400,
            detail="No file selected",
        )

    allowed_extensions = {
        ".pdf",
        ".jpg",
        ".jpeg",
        ".png",
        ".doc",
        ".docx",
    }

    original_filename = os.path.basename(file.filename)
    extension = os.path.splitext(original_filename)[1].lower()

    if extension not in allowed_extensions:
        raise HTTPException(
            status_code=400,
            detail=(
                "Invalid file type. "
                "Allowed: PDF, JPG, JPEG, PNG, DOC, DOCX"
            ),
        )

    os.makedirs(UPLOAD_DIR, exist_ok=True)

    unique_filename = (
        f"{candidate.id}_"
        f"{document_id}_"
        f"{uuid.uuid4().hex}"
        f"{extension}"
    )

    file_path = os.path.join(UPLOAD_DIR, unique_filename)

    try:
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)

        candidate_document.file_path = file_path
        candidate_document.file_name = original_filename
        candidate_document.status = "UPLOADED"
        candidate_document.uploaded_at = datetime.utcnow()

        db.commit()
        db.refresh(candidate_document)

    except Exception as error:
        db.rollback()

        if os.path.isfile(file_path):
            os.remove(file_path)

        raise HTTPException(
            status_code=500,
            detail=f"Failed to save file: {error}",
        )

    finally:
        file.file.close()

    return {
        "success": True,
        "message": "Document uploaded successfully",
        "document": {
            "id": candidate_document.id,
            "file_name": candidate_document.file_name,
            "status": candidate_document.status.value,
        },
    }


# =========================================================
# SUBMIT APPLICATION
# =========================================================

@router.post("/candidate/{token}/submit")
def submit_candidate_application(
    token: str,
    db: Session = Depends(get_db),
):
    candidate = (
        db.query(Candidate)
        .filter(Candidate.secure_token == token)
        .first()
    )

    if not candidate:
        raise HTTPException(
            status_code=404,
            detail="Invalid or expired candidate link",
        )

    if candidate.application_submitted:
        return {
            "success": True,
            "message": "Application has already been submitted",
            "application_submitted": True,
        }

    documents = (
        db.query(CandidateDocument)
        .filter(CandidateDocument.candidate_id == candidate.id)
        .all()
    )

    if not documents:
        raise HTTPException(
            status_code=400,
            detail="No documents found",
        )

    missing_required_documents = []

    for document in documents:
        position_document = document.position_document

        if not position_document:
            continue

        if position_document.is_required and not document.file_path:
            missing_required_documents.append(
                position_document.document_name
            )

    if missing_required_documents:
        raise HTTPException(
            status_code=400,
            detail={
                "message": (
                    "Please upload all required documents "
                    "before submitting the application."
                ),
                "missing_documents": missing_required_documents,
            },
        )

    candidate.application_submitted = True

    db.commit()
    db.refresh(candidate)

    try:
        manager = candidate.assigned_manager

        position_name = (
            candidate.position.name
            if candidate.position
            else "Candidate Position"
        )

        if manager and manager.email:
            send_manager_documents_completed_email(
                manager_email=manager.email,
                candidate_name=candidate.name,
                position_name=position_name,
            )

    except Exception as email_error:
        print(
            "Manager notification email could not be sent:",
            email_error,
        )

    return {
        "success": True,
        "message": (
            "Application submitted successfully. "
            "The assigned manager has been notified."
        ),
        "application_submitted": True,
    }


# =========================================================
# CANDIDATE CONFIRMS SESSION COMPLETION
# =========================================================

@router.post(
    "/candidate/{token}/sessions/{session_id}/confirm"
)
def confirm_candidate_session(
    token: str,
    session_id: int,
    db: Session = Depends(get_db),
):
    candidate = (
        db.query(Candidate)
        .filter(Candidate.secure_token == token)
        .first()
    )

    if not candidate:
        raise HTTPException(
            status_code=404,
            detail="Invalid or expired candidate link",
        )

    interview_session = (
        db.query(InterviewSession)
        .filter(
            InterviewSession.id == session_id,
            InterviewSession.candidate_id == candidate.id,
        )
        .first()
    )

    if not interview_session:
        raise HTTPException(
            status_code=404,
            detail="Session not found",
        )

    if interview_session.status != SessionStatus.SCHEDULED:
        raise HTTPException(
            status_code=400,
            detail=(
                "This session is not currently "
                "waiting for candidate confirmation."
            ),
        )

    interview_session.status = SessionStatus.CANDIDATE_CONFIRMED

    if interview_session.session_number == 1:
        candidate.status = CandidateStatus.CANDIDATE_CONFIRMED

    db.commit()
    db.refresh(interview_session)

    return {
        "success": True,
        "message": (
            f"Session {interview_session.session_number} "
            "completion confirmed successfully."
        ),
        "session": {
            "id": interview_session.id,
            "session_number": interview_session.session_number,
            "status": interview_session.status.value,
        },
    }


# =========================================================
# HR: VIEW CANDIDATE DOCUMENTS
# =========================================================

@router.get("/hr/candidates/{candidate_id}/documents")
def get_hr_candidate_documents(
    candidate_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if current_user.role != UserRole.HR:
        raise HTTPException(
            status_code=403,
            detail="Only HR users can access candidate documents",
        )

    candidate = (
        db.query(Candidate)
        .filter(Candidate.id == candidate_id)
        .first()
    )

    if not candidate:
        raise HTTPException(
            status_code=404,
            detail="Candidate not found",
        )

    documents = (
        db.query(CandidateDocument)
        .filter(CandidateDocument.candidate_id == candidate_id)
        .all()
    )

    document_list = []

    for document in documents:
        position_document = document.position_document

        document_list.append({
            "id": document.id,
            "document_name": (
                position_document.document_name
                if position_document
                else "Document"
            ),
            "is_required": (
                position_document.is_required
                if position_document
                else True
            ),
            "status": (
                document.status.value
                if document.status
                else "PENDING"
            ),
            "file_name": (
                document.file_name
                or os.path.basename(document.file_path)
                if document.file_path
                else None
            ),
            "uploaded_at": (
                document.uploaded_at.isoformat()
                if document.uploaded_at
                else None
            ),
            "download_url": (
                f"/hr/candidates/{candidate_id}/documents/"
                f"{document.id}/download"
                if document.file_path
                else None
            ),
        })

    return {
        "candidate_id": candidate.id,
        "candidate_name": candidate.name,
        "documents": document_list,
    }


# =========================================================
# HR: DOWNLOAD CANDIDATE DOCUMENT
# =========================================================

@router.get(
    "/hr/candidates/{candidate_id}/documents/{document_id}/download"
)
def download_hr_candidate_document(
    candidate_id: int,
    document_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if current_user.role != UserRole.HR:
        raise HTTPException(
            status_code=403,
            detail="Only HR users can download candidate documents",
        )

    document = (
        db.query(CandidateDocument)
        .filter(
            CandidateDocument.id == document_id,
            CandidateDocument.candidate_id == candidate_id,
        )
        .first()
    )

    if not document:
        raise HTTPException(
            status_code=404,
            detail="Candidate document not found",
        )

    if not document.file_path:
        raise HTTPException(
            status_code=404,
            detail="No file has been uploaded for this document",
        )

    upload_root = os.path.realpath(UPLOAD_DIR)
    file_path = os.path.realpath(document.file_path)

    try:
        is_inside_upload_dir = (
            os.path.commonpath([upload_root, file_path])
            == upload_root
        )
    except ValueError:
        is_inside_upload_dir = False

    if not is_inside_upload_dir:
        raise HTTPException(
            status_code=403,
            detail="Invalid document path",
        )

    if not os.path.isfile(file_path):
        raise HTTPException(
            status_code=404,
            detail="Uploaded file not found on server",
        )

    return FileResponse(
        path=file_path,
        filename=(
            document.file_name
            or os.path.basename(file_path)
        ),
    )