# test_login_and_predict.py
import requests
from pathlib import Path
import sys

# === EDIT THESE ===
BASE_URL = "http://127.0.0.1:8000"
USERNAME = "admin"
PASSWORD = "admin123"
IMAGE_PATH = r"C:\Users\Jeyakumar Sundararaj\chicken_app\Screenshot 2025-11-27 205409.png"
CONF = "0.25"
# ==================

def login(username: str, password: str):
    url = f"{BASE_URL}/auth/login"
    try:
        r = requests.post(url, json={"username": username, "password": password}, timeout=20)
    except Exception as e:
        print("Login request failed:", e)
        sys.exit(1)
    if r.status_code != 200:
        print("Login failed:", r.status_code, r.text)
        sys.exit(1)
    j = r.json()
    token = j.get("token")
    if not token:
        print("Login response did not contain token:", j)
        sys.exit(1)
    print("Logged in OK. Username:", j.get("username"))
    return token

def predict_protected(token: str, file_path: str, conf: str = "0.25"):
    url = f"{BASE_URL}/predict/protected"
    headers = {"Authorization": f"Bearer {token}"}
    p = Path(file_path)
    if not p.exists():
        print("Image not found:", file_path)
        return

    with open(p, "rb") as f:
        files = {"file": (p.name, f, "image/png")}
        data = {"conf": conf}
        try:
            r = requests.post(url, headers=headers, files=files, data=data, timeout=120)
        except Exception as e:
            print("Predict request failed:", e)
            return
    print("Predict status:", r.status_code)
    try:
        print("Predict response:", r.json())
    except Exception:
        print("Predict response text:", r.text)

def main():
    token = login(USERNAME, PASSWORD)
    predict_protected(token, IMAGE_PATH, CONF)

if __name__ == "__main__":
    main()
