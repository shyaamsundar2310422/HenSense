from fastapi import APIRouter, Depends, HTTPException, Form
from db import SessionLocal
from utils.jwt_token import decode_token
from models.prediction import Prediction

router = APIRouter(prefix="/history", tags=["History"])

def get_user(token: str = Form(...)):
    try:
        return decode_token(token)
    except:
        raise HTTPException(401, "Invalid token")

@router.post("/")
def get_history(token: str = Form(...)):
    user = get_user(token)
    db = SessionLocal()
    items = db.query(Prediction).filter(Prediction.user_id == user["id"]).all()
    return items
