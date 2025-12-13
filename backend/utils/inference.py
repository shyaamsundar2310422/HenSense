# utils/inference.py
import os
from PIL import Image

def load_model():
    """
    Try to load an actual model (if available). If not, return a dummy object.
    Keep this function lightweight so main.py startup won't crash permanently.
    """
    try:
        # attempt to import Ultralytics YOLO if installed
        from ultralytics import YOLO
        model_path = os.environ.get("HEN_MODEL_PATH", None)
        if model_path:
            model = YOLO(model_path)
        else:
            # if no custom model, attempt to load default 'yolov8n.pt' if present
            model = YOLO("yolov8n.pt")
        # wrap and return
        return model
    except Exception:
        # fallback dummy
        class DummyModel:
            def predict(self, imgs, conf=0.25):
                # mimic output structure
                return []
        return DummyModel()

def run_inference(model, pil_img: Image.Image, conf: float = 0.25):
    """
    Run inference using either the loaded model or the dummy fallback.
    Returns a dict with keys: predictions (list), sample_health (str)
    Each prediction is a dict: {box: [x1,y1,x2,y2], label:..., score:...}
    """
    try:
        # if it's an ultralytics model, call model.predict or model(pil_img)
        if hasattr(model, "predict") or hasattr(model, "__call__"):
            # try multiple calling styles
            try:
                res = model.predict(pil_img, conf=conf) if hasattr(model, "predict") else model(pil_img)
            except Exception:
                res = model(pil_img)

            # ultralytics returns a list — convert to our simple format
            preds = []
            try:
                # try to parse common ultralytics types
                for r in res:
                    boxes = getattr(r, "boxes", None)
                    if boxes is None:
                        continue
                    for b in boxes:
                        xyxy = b.xyxy.tolist()
                        score = float(b.conf[0]) if hasattr(b, "conf") else float(b.conf)
                        cls = int(b.cls[0]) if hasattr(b, "cls") else (int(b.cls) if hasattr(b, "cls") else 0)
                        preds.append({"box": xyxy, "label": str(cls), "score": score})
            except Exception:
                # fallback empty
                preds = []
            sample_health = "unhealthy" if preds else "healthy"
            return {"predictions": preds, "sample_health": sample_health}
        else:
            # dummy model: no detection
            return {"predictions": [], "sample_health": "healthy"}
    except Exception:
        return {"predictions": [], "sample_health": "unknown"}
