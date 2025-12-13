# backend/routes/predict.py

from fastapi import APIRouter, UploadFile, File, Form, HTTPException, Response
from fastapi.responses import JSONResponse
import os, io, base64, tempfile, asyncio
from typing import List, Dict
from concurrent.futures import ThreadPoolExecutor
from PIL import Image, ImageDraw, ImageFont

router = APIRouter()

# ---------------- YOLO IMPORT ----------------
try:
    from ultralytics import YOLO
    YOLO_AVAILABLE = True
except Exception:
    YOLO_AVAILABLE = False

# ---------------- MODEL PATH ----------------
MODEL_PATH = os.path.join(os.path.dirname(__file__), "..", "models", "best.pt")

_MODEL = None
_MODEL_LOCK = asyncio.Lock()
_EXECUTOR = ThreadPoolExecutor(max_workers=1)

# ---------------- LOAD MODEL ----------------
async def load_model_if_needed():
    global _MODEL
    if not YOLO_AVAILABLE:
        return None

    async with _MODEL_LOCK:
        if _MODEL is None:
            if not os.path.exists(MODEL_PATH):
                raise RuntimeError(f"Model not found: {MODEL_PATH}")
            _MODEL = YOLO(MODEL_PATH)

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
    if model is None:
        raise RuntimeError("YOLO not available")

    def _predict():
        # 🚨 DO NOT FILTER HERE
        return model.predict(
            source=image_path,
            conf=0.001,        # VERY LOW
            imgsz=640,
            verbose=False
        )

    loop = asyncio.get_running_loop()
    results = await loop.run_in_executor(_EXECUTOR, _predict)

    preds = extract_predictions(results, conf_th)

    # annotated image (YOLO-drawn)
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

    # validate image
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

    return JSONResponse({
        "ok": True,
        "filename": file.filename,
        "predictions": preds,
        "annotated_image_base64": base64.b64encode(annotated_bytes).decode(),
        "annotated_image": base64.b64encode(annotated_bytes).decode()
    })

from fastapi.responses import FileResponse

@router.get("/model/download")
async def download_model():
    model_path = os.path.join(
        os.path.dirname(__file__),
        "..",
        "models",
        "best.pt"
    )

    if not os.path.exists(model_path):
        raise HTTPException(status_code=404, detail="Model not found")

    return FileResponse(
        path=model_path,
        filename="best.pt",
        media_type="application/octet-stream"
    )
