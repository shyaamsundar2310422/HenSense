# backend/routes/auth.py

from fastapi import APIRouter, Depends, HTTPException, Form
from sqlalchemy.orm import Session
from db import SessionLocal
from models.user import User
from utils.hashing import hash_password, verify_password
from utils.jwt_token import create_token

router = APIRouter(prefix="/auth", tags=["Auth"])


# Dependency - DB session
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


# -------------------------------
# REGISTER
# -------------------------------
@router.post("/register")
def register(
    username: str = Form(...),
    password: str = Form(...),
    db: Session = Depends(get_db)
):
    # Check existing user
    if db.query(User).filter(User.username == username).first():
        raise HTTPException(status_code=400, detail="Username already exists")

    # Create new user
    user = User(
        username=username,
        password_hash=hash_password(password)
    )
    db.add(user)
    db.commit()
    db.refresh(user)

    # Optional: issue token immediately
    token = create_token({"id": user.id, "username": user.username})

    return {
        "ok": True,
        "message": "User registered successfully",
        "username": user.username,
        "token": token
    }


# -------------------------------
# LOGIN
# -------------------------------
@router.post("/login")
def login(
    username: str = Form(...),
    password: str = Form(...),
    db: Session = Depends(get_db)
):
    # check existing user
    user = db.query(User).filter(User.username == username).first()
    if not user:
        raise HTTPException(status_code=400, detail="Invalid username or password")

    if not verify_password(password, user.password_hash):
        raise HTTPException(status_code=400, detail="Invalid username or password")

    token = create_token({"id": user.id, "username": user.username})

    return {
        "ok": True,
        "username": user.username,
        "token": token
    }
