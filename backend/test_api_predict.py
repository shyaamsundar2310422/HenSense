import requests

url = "http://127.0.0.1:8000/predict"
files = {
    "file": ("pred.jpg", open("uploads/pred_1764937632101.jpg", "rb"), "image/jpeg")
}
data = {
    "username": "SHYAAM"
}

print("Sending request...")
response = requests.post(url, files=files, data=data)

print("Status:", response.status_code)
print("Response:", response.text)
