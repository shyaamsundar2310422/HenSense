# backend/routes/predict.py

from fastapi import APIRouter, UploadFile, File, Form, HTTPException, Response
from fastapi.responses import JSONResponse, FileResponse
import os, io, base64, tempfile, asyncio
from typing import List, Dict
from concurrent.futures import ThreadPoolExecutor
from PIL import Image
import urllib.request

router = APIRouter()

# ---------------- YOLO IMPORT ----------------
try:
    from ultralytics import YOLO
    YOLO_AVAILABLE = True
except Exception as e:
    print("YOLO import failed:", e)
    YOLO_AVAILABLE = False

# ---------------- MODEL CONFIG ----------------
MODEL_URL = "https://huggingface.co/shyaam2310422/hensense-yolo/resolve/main/best%20(2).pt"
MODEL_DIR = "/tmp"
MODEL_PATH = os.path.join(MODEL_DIR, "best.pt")

_MODEL = None
_MODEL_LOCK = asyncio.Lock()
_EXECUTOR = ThreadPoolExecutor(max_workers=1)

# ---------------- DOWNLOAD + LOAD MODEL AT STARTUP ----------------
async def load_model_once():
    global _MODEL

    if not YOLO_AVAILABLE:
        print("YOLO NOT AVAILABLE")
        return

    async with _MODEL_LOCK:
        if _MODEL is not None:
            return

        os.makedirs(MODEL_DIR, exist_ok=True)

        if not os.path.exists(MODEL_PATH):
            print("Downloading model from HuggingFace...")
            urllib.request.urlretrieve(MODEL_URL, MODEL_PATH)
            print("Model downloaded:", MODEL_PATH)

        print("Loading YOLO model...")
        _MODEL = YOLO(MODEL_PATH)
        print("YOLO model loaded successfully")

# 🚀 Trigger model load at import time
asyncio.get_event_loop().create_task(load_model_once())

# ---------------- INFERENCE ----------------
async def run_inference(image_path: str, conf_th: float):
    if _MODEL is None:
        raise RuntimeError("Model not loaded")

    def _predict():
        return _MODEL.predict(
            source=image_path,
            conf=0.001,   # allow all, filter later
            imgsz=640,
            verbose=False
        )

    loop = asyncio.get_running_loop()
    results = await loop.run_in_executor(_EXECUTOR, _predict)

    preds = []
    r = results[0]

    if r.boxes is not None:
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

    img_np = r.plot()
    img = Image.fromarray(img_np)
    buf = io.BytesIO()
    img.save(buf, format="PNG")

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
    contents = await file.read()

    try:
        Image.open(io.BytesIO(contents)).verify()
    except Exception:
        raise HTTPException(400, "Invalid image")

    try:
        with tempfile.NamedTemporaryFile(
            suffix=".jpg",
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

    return JSONResponse({
        "ok": True,
        "predictions": preds,
        "annotated_image_base64": base64.b64encode(annotated_bytes).decode()
    })

# ---------------- MODEL DOWNLOAD (OPTIONAL) ----------------
@router.get("/model/download")
async def download_model():
    if not os.path.exists(MODEL_PATH):
        raise HTTPException(404, "Model not found")

    return FileResponse(
        MODEL_PATH,
        filename="best.pt",
        media_type="application/octet-stream"
    )
