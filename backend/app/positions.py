
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session

from database import get_db
from app.models import Position, PositionDocument


router = APIRouter(
    prefix="/positions",
    tags=["Positions"],
)


# =========================================================
# SCHEMAS
# =========================================================

class PositionCreate(BaseModel):
    title: str
    description: str | None = None


class PositionResponse(BaseModel):
    id: int
    title: str = Field(validation_alias="name")
    description: str | None
    is_active: bool

    model_config = {
        "from_attributes": True
    }


class PositionDocumentCreate(BaseModel):
    document_name: str
    is_required: bool = True


class PositionDocumentResponse(BaseModel):
    id: int
    position_id: int
    document_name: str
    is_required: bool

    model_config = {
        "from_attributes": True
    }


# =========================================================
# CREATE POSITION
# =========================================================

@router.post(
    "/",
    response_model=PositionResponse,
    status_code=status.HTTP_201_CREATED,
)
def create_position(
    position_data: PositionCreate,
    db: Session = Depends(get_db),
):
    existing_position = (
        db.query(Position)
        .filter(Position.name == position_data.title)
        .first()
    )

    if existing_position:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Position already exists",
        )

    position = Position(
        name=position_data.title,
        description=position_data.description,
        is_active=True,
    )

    db.add(position)
    db.commit()
    db.refresh(position)

    return position


# =========================================================
# GET ALL POSITIONS
# =========================================================

@router.get(
    "/",
    response_model=list[PositionResponse],
)
def get_positions(
    db: Session = Depends(get_db),
):
    return (
        db.query(Position)
        .order_by(Position.id.asc())
        .all()
    )


# =========================================================
# GET SINGLE POSITION
# =========================================================

@router.get(
    "/{position_id}",
    response_model=PositionResponse,
)
def get_position(
    position_id: int,
    db: Session = Depends(get_db),
):
    position = (
        db.query(Position)
        .filter(Position.id == position_id)
        .first()
    )

    if not position:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Position not found",
        )

    return position


# =========================================================
# ADD POSITION DOCUMENT
# =========================================================

@router.post(
    "/{position_id}/documents",
    response_model=PositionDocumentResponse,
    status_code=status.HTTP_201_CREATED,
)
def add_position_document(
    position_id: int,
    document_data: PositionDocumentCreate,
    db: Session = Depends(get_db),
):
    position = (
        db.query(Position)
        .filter(Position.id == position_id)
        .first()
    )

    if not position:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Position not found",
        )

    existing_document = (
        db.query(PositionDocument)
        .filter(
            PositionDocument.position_id == position_id,
            PositionDocument.document_name == document_data.document_name,
        )
        .first()
    )

    if existing_document:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Document already exists for this position",
        )

    document = PositionDocument(
        position_id=position_id,
        document_name=document_data.document_name,
        is_required=document_data.is_required,
    )

    db.add(document)
    db.commit()
    db.refresh(document)

    return document


# =========================================================
# GET POSITION DOCUMENTS
# =========================================================

@router.get(
    "/{position_id}/documents",
    response_model=list[PositionDocumentResponse],
)
def get_position_documents(
    position_id: int,
    db: Session = Depends(get_db),
):
    position = (
        db.query(Position)
        .filter(Position.id == position_id)
        .first()
    )

    if not position:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Position not found",
        )

    return (
        db.query(PositionDocument)
        .filter(PositionDocument.position_id == position_id)
        .order_by(PositionDocument.id.asc())
        .all()
    )


# =========================================================
# DELETE POSITION DOCUMENT
# =========================================================

@router.delete(
    "/{position_id}/documents/{document_id}",
    status_code=status.HTTP_204_NO_CONTENT,
)
def delete_position_document(
    position_id: int,
    document_id: int,
    db: Session = Depends(get_db),
):
    document = (
        db.query(PositionDocument)
        .filter(
            PositionDocument.id == document_id,
            PositionDocument.position_id == position_id,
        )
        .first()
    )

    if not document:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Document not found",
        )

    db.delete(document)
    db.commit()

    return None


# =========================================================
# DELETE POSITION
# =========================================================

@router.delete(
    "/{position_id}",
    status_code=status.HTTP_204_NO_CONTENT,
)
def delete_position(
    position_id: int,
    db: Session = Depends(get_db),
):
    position = (
        db.query(Position)
        .filter(Position.id == position_id)
        .first()
    )

    if not position:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Position not found",
        )

    db.delete(position)
    db.commit()

    return None