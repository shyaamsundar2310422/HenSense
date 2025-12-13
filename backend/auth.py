# routes/auth.py
from fastapi import APIRouter, Depends, HTTPException, Form
from db import SessionLocal
from models.user import User
from utils.hashing import hash_password, verify_password
from utils.jwt_token import create_token

router = APIRouter(prefix="/auth", tags=["Auth"])

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

@router.post("/register")
def register(
    username: str = Form(...),
    password: str = Form(...),
    db=Depends(get_db)
):
    if db.query(User).filter(User.username == username).first():
        raise HTTPException(400, "Username already exists")

    user = User(
        username=username,
        password_hash=hash_password(password)
    )
    db.add(user)
    db.commit()

    return {"message": "User registered"}

@router.post("/login")
def login(
    username: str = Form(...),
    password: str = Form(...),
    db=Depends(get_db)
):
    user = db.query(User).filter(User.username == username).first()
    if not user or not verify_password(password, user.password_hash):
        raise HTTPException(400, "Invalid credentials")

    token = create_token({"id": user.id, "username": user.username})
    return {"token": token, "username": user.username}
