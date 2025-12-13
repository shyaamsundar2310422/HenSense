from fastapi.testclient import TestClient
import main

client = TestClient(main.app)

with open(r"C:\Users\Jeyakumar Sundararaj\OneDrive\Pictures\1stpage.png", "rb") as f:
    response = client.post("/predict", files={"file": ("1stpage.png", f, "image/png")}, data={"conf": "0.25"})

print("STATUS:", response.status_code)
print("RESPONSE:", response.text)
