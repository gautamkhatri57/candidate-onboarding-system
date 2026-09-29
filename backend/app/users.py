import bcrypt

from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from pydantic import BaseModel, EmailStr
from sqlalchemy.orm import Session

from database import get_db
from app.auth import create_access_token, get_current_user, require_role
from app.models import User, UserRole


router = APIRouter(
    prefix="/users",
    tags=["Users"]
)


class UserCreate(BaseModel):
    name: str
    email: EmailStr
    password: str
    role: UserRole


class UserResponse(BaseModel):
    id: int
    name: str
    email: str
    role: UserRole
    is_active: bool

    model_config = {
        "from_attributes": True
    }


class PasswordReset(BaseModel):
    password: str


@router.post(
    "/",
    response_model=UserResponse,
    status_code=status.HTTP_201_CREATED
)
def create_user(
    user_data: UserCreate,
    db: Session = Depends(get_db)
):
    existing_user = db.query(User).filter(
        User.email == user_data.email
    ).first()

    if existing_user:
        raise HTTPException(
            status_code=400,
            detail="User with this email already exists"
        )

    password_hash = bcrypt.hashpw(
        user_data.password.encode("utf-8"),
        bcrypt.gensalt()
    ).decode("utf-8")

    user = User(
        name=user_data.name,
        email=user_data.email,
        password_hash=password_hash,
        role=user_data.role
    )

    db.add(user)
    db.commit()
    db.refresh(user)

    return user


@router.get(
    "/",
    response_model=list[UserResponse]
)
def get_users(
    db: Session = Depends(get_db)
):
    return db.query(User).order_by(
        User.id.desc()
    ).all()


@router.get(
    "/me",
    response_model=UserResponse
)
def get_current_user_info(
    current_user: User = Depends(get_current_user)
):
    return current_user


@router.get(
    "/admin-test",
    response_model=UserResponse
)
def admin_test(
    current_user: User = Depends(
        require_role(UserRole.ADMIN)
    )
):
    return current_user


@router.get(
    "/{user_id}",
    response_model=UserResponse
)
def get_user(
    user_id: int,
    db: Session = Depends(get_db)
):
    user = db.query(User).filter(
        User.id == user_id
    ).first()

    if not user:
        raise HTTPException(
            status_code=404,
            detail="User not found"
        )

    return user


@router.post("/login")
def login(
    form_data: OAuth2PasswordRequestForm = Depends(),
    db: Session = Depends(get_db)
):
    user = db.query(User).filter(
        User.email == form_data.username
    ).first()

    if not user:
        raise HTTPException(
            status_code=401,
            detail="Invalid email or password"
        )

    password_valid = bcrypt.checkpw(
        form_data.password.encode("utf-8"),
        user.password_hash.encode("utf-8")
    )

    if not password_valid:
        raise HTTPException(
            status_code=401,
            detail="Invalid email or password"
        )

    if not user.is_active:
        raise HTTPException(
            status_code=403,
            detail="User account is inactive"
        )

    access_token = create_access_token({
        "sub": str(user.id),
        "role": user.role.value
    })

    return {
        "access_token": access_token,
        "token_type": "bearer"
    }


@router.put("/{user_id}/reset-password")
def reset_password(
    user_id: int,
    password_data: PasswordReset,
    db: Session = Depends(get_db)
):
    user = db.query(User).filter(
        User.id == user_id
    ).first()

    if not user:
        raise HTTPException(
            status_code=404,
            detail="User not found"
        )

    user.password_hash = bcrypt.hashpw(
        password_data.password.encode("utf-8"),
        bcrypt.gensalt()
    ).decode("utf-8")

    db.commit()

    return {
        "message": "Password reset successfully"
    }