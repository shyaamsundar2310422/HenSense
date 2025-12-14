# backend/routes/predict.py

from fastapi import APIRouter, UploadFile, File, Form, HTTPException, Response
from fastapi.responses import JSONResponse, FileResponse
import os, io, base64, tempfile, asyncio, requests
from typing import List, Dict
from concurrent.futures import ThreadPoolExecutor
from PIL import Image
from ultralytics import YOLO

router = APIRouter()

# ---------------- CONFIG ----------------
MODEL_URL = "https://huggingface.co/shyaam2310422/hensense-yolo/resolve/main/best%20(2).pt"
MODEL_DIR = os.path.join(os.getcwd(), "models")
MODEL_PATH = os.path.join(MODEL_DIR, "best.pt")

_MODEL = None
_MODEL_LOCK = asyncio.Lock()
_EXECUTOR = ThreadPoolExecutor(max_workers=1)

# ---------------- MODEL DOWNLOAD ----------------
def download_model():
    os.makedirs(MODEL_DIR, exist_ok=True)

    if os.path.exists(MODEL_PATH):
        print("✅ Model already exists")
        return

    print("⬇️ Downloading YOLO model from Hugging Face...")
    r = requests.get(MODEL_URL, stream=True, timeout=300)
    r.raise_for_status()

    with open(MODEL_PATH, "wb") as f:
        for chunk in r.iter_content(chunk_size=8192):
            f.write(chunk)

    print("✅ Model downloaded successfully")

# ---------------- LOAD MODEL ----------------
async def load_model_if_needed():
    global _MODEL

    async with _MODEL_LOCK:
        if _MODEL is None:
            download_model()
            print("🚀 Loading YOLO model...")
            _MODEL = YOLO(MODEL_PATH)
            print("✅ YOLO model loaded")

    return _MODEL

# ---------------- EXTRACT PREDICTIONS ----------------
def extract_predictions(results, conf_th: float) -> List[Dict]:
    preds = []
    r = results[0]

    if r.boxes is None:
        return preds

    for i in range(len(r.boxes)):
        conf = float(r.boxes.conf[i])
        if conf < conf_th:
            continue

        cls_id = int(r.boxes.cls[i])
        label = r.names.get(cls_id, str(cls_id))
        x1, y1, x2, y2 = map(int, r.boxes.xyxy[i].tolist())

        preds.append({
            "label": label,
            "conf": conf,
            "box": [x1, y1, x2, y2]
        })

    return preds

# ---------------- INFERENCE ----------------
async def run_inference(image_path: str, conf_th: float):
    model = await load_model_if_needed()

    def _predict():
        return model.predict(
            source=image_path,
            conf=0.001,   # keep ultra-low here
            imgsz=640,
            verbose=False
        )

    loop = asyncio.get_running_loop()
    results = await loop.run_in_executor(_EXECUTOR, _predict)

    preds = extract_predictions(results, conf_th)

    img_np = results[0].plot()
    pil_img = Image.fromarray(img_np)

    buf = io.BytesIO()
    pil_img.save(buf, format="PNG")

    return preds, buf.getvalue()

# ---------------- ROUTES ----------------
@router.options("/predict")
async def predict_options():
    return Response(status_code=204)

@router.post("/predict")
async def predict(
    file: UploadFile = File(...),
    conf: float = Form(0.25)
):
    if not file:
        raise HTTPException(400, "No file uploaded")

    contents = await file.read()

    try:
        Image.open(io.BytesIO(contents)).verify()
    except Exception:
        raise HTTPException(400, "Invalid image")

    try:
        with tempfile.NamedTemporaryFile(
            suffix=os.path.splitext(file.filename)[1] or ".jpg",
            delete=False
        ) as tmp:
            tmp.write(contents)
            tmp_path = tmp.name

        try:
            preds, annotated_bytes = await run_inference(tmp_path, conf)
        finally:
            os.unlink(tmp_path)

    except Exception as e:
        raise HTTPException(500, f"Inference error: {e}")

    encoded = base64.b64encode(annotated_bytes).decode()

    return JSONResponse({
        "ok": True,
        "filename": file.filename,
        "predictions": preds,
        "annotated_image_base64": encoded,
        "annotated_image": encoded
    })

@router.get("/model/download")
async def download_model_endpoint():
    if not os.path.exists(MODEL_PATH):
        raise HTTPException(404, "Model not found")

    return FileResponse(
        MODEL_PATH,
        filename="best.pt",
        media_type="application/octet-stream"
    )
