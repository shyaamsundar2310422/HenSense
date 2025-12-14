# backend/routes/predict.py

from fastapi import APIRouter, UploadFile, File, Form, HTTPException, Response
from fastapi.responses import JSONResponse, FileResponse
import os
import io
import base64
import tempfile
import asyncio
from typing import List, Dict
from concurrent.futures import ThreadPoolExecutor
from PIL import Image
import requests

router = APIRouter()

# ---------------- YOLO IMPORT ----------------
try:
    from ultralytics import YOLO
    YOLO_AVAILABLE = True
except Exception as e:
    print("YOLO import failed:", e)
    YOLO_AVAILABLE = False

# ---------------- MODEL CONFIG ----------------
# Set this in Render ENV:
# MODEL_URL=https://huggingface.co/.../best.pt
MODEL_URL = os.getenv("MODEL_URL")

# Render-safe writable location
MODEL_PATH = "/tmp/best.pt"

_MODEL = None
_MODEL_LOCK = asyncio.Lock()
_EXECUTOR = ThreadPoolExecutor(max_workers=1)

# ---------------- LOAD MODEL ----------------
async def load_model_if_needed():
    global _MODEL

    if not YOLO_AVAILABLE:
        raise RuntimeError("YOLO not available")

    async with _MODEL_LOCK:
        if _MODEL is None:
            if not os.path.exists(MODEL_PATH):
                if not MODEL_URL:
                    raise RuntimeError("MODEL_URL not set")

                print("Downloading model from:", MODEL_URL)
                r = requests.get(MODEL_URL, stream=True)
                r.raise_for_status()

                with open(MODEL_PATH, "wb") as f:
                    for chunk in r.iter_content(chunk_size=8192):
                        f.write(chunk)

                print("Model downloaded to", MODEL_PATH)

            _MODEL = YOLO(MODEL_PATH)
            print("YOLO model loaded")

    return _MODEL

# ---------------- PARSE YOLO OUTPUT ----------------
def extract_predictions(results, conf_th: float) -> List[Dict]:
    preds = []
    r = results[0]

    if r.boxes is None:
        return preds

    names = r.names
    boxes = r.boxes

    for i in range(len(boxes)):
        conf = float(boxes.conf[i])
        if conf < conf_th:
            continue

        cls_id = int(boxes.cls[i])
        label = names.get(cls_id, str(cls_id))
        x1, y1, x2, y2 = map(int, boxes.xyxy[i].tolist())

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
            conf=0.001,   # VERY LOW here
            imgsz=640,
            verbose=False
        )

    loop = asyncio.get_running_loop()
    results = await loop.run_in_executor(_EXECUTOR, _predict)

    preds = extract_predictions(results, conf_th)

    # annotated image from YOLO
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
            preds, annotated_bytes = await run_inference(tmp_path, float(conf))
        finally:
            os.unlink(tmp_path)

    except Exception as e:
        raise HTTPException(500, f"Inference error: {e}")

    annotated_b64 = base64.b64encode(annotated_bytes).decode()

    return JSONResponse({
        "ok": True,
        "filename": file.filename,
        "predictions": preds,
        "annotated_image_base64": annotated_b64
    })

# ---------------- MODEL DOWNLOAD (OPTIONAL) ----------------
@router.get("/model/download")
async def download_model():
    if not os.path.exists(MODEL_PATH):
        raise HTTPException(status_code=404, detail="Model not loaded yet")

    return FileResponse(
        path=MODEL_PATH,
        filename="best.pt",
        media_type="application/octet-stream"
    )
