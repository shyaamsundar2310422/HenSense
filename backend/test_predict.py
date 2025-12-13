import requests

# use your real image here
fn = r"C:\Users\Jeyakumar Sundararaj\OneDrive\Pictures\1stpage.png"

with open(fn, "rb") as f:
    r = requests.post(
        "http://127.0.0.1:8000/predict",
        files={"file": ("1stpage.png", f, "image/png")},
        data={"conf": "0.25"}
    )

print("status:", r.status_code)
print(r.text)
