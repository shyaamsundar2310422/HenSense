import jwt
from datetime import datetime, timedelta
import os

SECRET = os.getenv("JWT_SECRET", "SUPER_SECRET_KEY")
ALGO = "HS256"

def create_token(data: dict):
    payload = data.copy()
    payload["exp"] = datetime.utcnow() + timedelta(days=2)
    return jwt.encode(payload, SECRET, algorithm=ALGO)

def decode_token(token: str):
    return jwt.decode(token, SECRET, algorithms=[ALGO])
