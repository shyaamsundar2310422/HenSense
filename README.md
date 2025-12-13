
🐔 HenSense

(AI-based Chicken Detection & Health Classification System)

HenSense is an end-to-end AI-powered web application that detects chickens in images and classifies their health condition using YOLO, FastAPI, and React.
It is designed for real-world poultry monitoring, combining computer vision with a modern full-stack setup.

------------------------------------------------------------------------------------------------------------------

 🚀 Features

1.	📸 Image Upload & Detection

•	Upload chicken images from desktop or mobile
•	Real-time detection with bounding boxes

2.	🧠 YOLO-based AI Model

•	Custom-trained YOLO model
•	Detects chickens and health conditions
•	Adjustable confidence threshold

3.	🖼️ Annotated Output

•	Bounding boxes + labels
•	Download annotated image

4.	📊 Dashboard & History

•	View recent detections
•	Statistics for last 7 days
•	Export results as CSV



5.	⚙️ Settings

•	Confidence control
•	API configuration
•	Local history management

6.	🎨 Modern UI

•	Glassmorphism design
•	Light/Dark mode toggle
•	Responsive layout

------------------------------------------------------------------------------------------------------------------

 🛠️ Tech Stack

Backend

•	FastAPI
•	Ultralytics YOLO
•	Python 3.11
•	Pillow
•	Uvicorn

 Frontend

•	React (Vite)
•	Tailwind CSS
•	Glassmorphism UI
•	Axios

------------------------------------------------------------------------------------------------------------------

📂 Project Structure

```
CHICKEN_FINAL/
│
├── backend/
│   ├── main.py
│   ├── routes/
│   │   ├── predict.py
│   │   ├── auth.py
│   │   └── history.py
│   ├── models/
│   │   └── best.pt
│   └── uploads/
│
├── chicken-frontend/
│   ├── src/
│   │   ├── components/
│   │   ├── contexts/
│   │   ├── hooks/
│   │   └── utils/
│   └── index.html
│
└── README.md
```

------------------------------------------------------------------------------------------------------------------

⚙️ Setup Instructions

 1️⃣ Backend Setup

```bash
cd backend
python -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt
uvicorn main:app --reload
```

Backend runs at:

```
http://127.0.0.1:8000
```

---

2️⃣ Frontend Setup

```bash
cd chicken-frontend
npm install
npm run dev
```

Frontend runs at:

```
http://localhost:5173
```

------------------------------------------------------------------------------------------------------------------

🧪 API Endpoint

•	`POST /predict`

**Form Data**

* `file` → Image file
* `conf` → Confidence threshold (default `0.25`)

**Response**

```json
{
  "ok": true,
  "filename": "image.png",
  "predictions": [
    {
      "label": "healthy",
      "conf": 0.92,
      "box": [x1, y1, x2, y2]
    }
  ],
  "annotated_image_base64": "..."
}
```

---

 📌 Use Cases

•	Poultry farm monitoring
•	Early disease detection
•	AI-assisted livestock management
•	Academic & research projects

------------------------------------------------------------------------------------------------------------------

 🔒 Notes

•	Model runs **server-side**
•	Images are processed securely
•	History stored locally per user

------------------------------------------------------------------------------------------------------------------

 📈 Future Enhancements

•	Live camera feed support
•	Multi-animal classification
•	Cloud deployment
•	Mobile app version
•	Health analytics & alerts

------------------------------------------------------------------------------------------------------------------

👨‍💻 Author

Shyaam Sundar M
3rd Year IT Undergraduate
AI | Machine Learning | Computer Vision

🔗 GitHub: [https://github.com/shyaamsundar2310422](https://github.com/shyaamsundar2310422)

------------------------------------------------------------------------------------------------------------------



