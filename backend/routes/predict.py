# backend/routes/predict.py

from fastapi import APIRouter, UploadFile, File, Form, HTTPException, Response
from fastapi.responses import JSONResponse, FileResponse
import os, io, base64, tempfile, asyncio, requests
from typing import List, Dict
from concurrent.futures import ThreadPoolExecutor
from PIL import Image

router = APIRouter()

# ---------------- YOLO IMPORT ----------------
try:
    from ultralytics import YOLO
    YOLO_AVAILABLE = True
except Exception as e:
    print("YOLO import failed:", e)
    YOLO_AVAILABLE = False

# ---------------- MODEL CONFIG ----------------
MODEL_URL = os.getenv(
    "MODEL_URL",
    "https://huggingface.co/shyaam2310422/hensense-yolo/resolve/main/best%20(2).pt"
)

MODEL_LOCAL_PATH = "/tmp/best.pt"

_MODEL = None
_MODEL_LOCK = asyncio.Lock()
_EXECUTOR = ThreadPoolExecutor(max_workers=1)


# ---------------- DOWNLOAD MODEL ----------------
def download_model_if_needed():
    if os.path.exists(MODEL_LOCAL_PATH):
        return

    print(f"Downloading model from: {MODEL_URL}")
    r = requests.get(MODEL_URL, stream=True)
    if r.status_code != 200:
        raise RuntimeError("Failed to download model")

    with open(MODEL_LOCAL_PATH, "wb") as f:
        for chunk in r.iter_content(chunk_size=8192):
            if chunk:
                f.write(chunk)

    print("Model downloaded successfully")


# ---------------- LOAD MODEL ----------------
async def load_model_if_needed():
    global _MODEL

    if not YOLO_AVAILABLE:
        raise RuntimeError("YOLO not available (check requirements.txt)")

    async with _MODEL_LOCK:
        if _MODEL is None:
            download_model_if_needed()
            _MODEL = YOLO(MODEL_LOCAL_PATH)
            print("YOLO model loaded")

    return _MODEL


# ---------------- PARSE YOLO OUTPUT ----------------
def extract_predictions(results, conf_th: float) -> List[Dict]:
    preds = []
    r = results[0]

    if r.boxes is None:
        return preds

    names = r.names

    for i in range(len(r.boxes)):
        conf = float(r.boxes.conf[i])
        if conf < conf_th:
            continue

        cls_id = int(r.boxes.cls[i])
        label = names.get(cls_id, str(cls_id))
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
            conf=0.001,   # VERY LOW here
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
            preds, annotated_bytes = await run_inference(tmp_path, float(conf))
        finally:
            os.unlink(tmp_path)

    except Exception as e:
        raise HTTPException(500, f"Inference error: {e}")

    b64 = base64.b64encode(annotated_bytes).decode()

    return JSONResponse({
        "ok": True,
        "filename": file.filename,
        "predictions": preds,
        "annotated_image_base64": b64,
        "annotated_image": b64
    })
