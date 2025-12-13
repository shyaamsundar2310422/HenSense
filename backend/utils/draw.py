# utils/draw.py
import os
from PIL import Image, ImageDraw, ImageFont
from datetime import datetime

def annotate_and_save(pil_img, predictions, out_dir="uploads"):
    """
    Draw bounding boxes and labels onto the image and save into out_dir.
    Returns a relative path like "uploads/annotated_20251210_...png"
    """
    os.makedirs(out_dir, exist_ok=True)
    img = pil_img.copy()
    draw = ImageDraw.Draw(img)

    # choose a basic font if available
    try:
        font = ImageFont.load_default()
    except Exception:
        font = None

    for i, p in enumerate(predictions or []):
        try:
            box = p.get("box", p.get("xyxy", None))
            if not box:
                continue
            # ensure box numbers are floats or ints
            x1, y1, x2, y2 = [int(float(v)) for v in box[:4]]
            label = p.get("label", "obj")
            score = p.get("score", None)
            draw.rectangle([x1, y1, x2, y2], outline="red", width=2)
            text = f"{label}" + (f" {score:.2f}" if score is not None else "")
            text_pos = (x1 + 4, max(0, y1 - 12))
            draw.text(text_pos, text, fill="red", font=font)
        except Exception:
            continue

    filename = f"annotated_{datetime.utcnow().strftime('%Y%m%d_%H%M%S_%f')}.png"
    saved = os.path.join(out_dir, filename)
    img.save(saved)
    # return path relative to project root so FastAPI can serve it via FileResponse
    rel_path = os.path.relpath(saved, os.path.dirname(__file__))
    # rel_path will be like "../uploads/annotated..." so normalize to "uploads/..."
    rel_path = saved.replace(os.path.dirname(os.path.abspath(__file__)) + os.sep, "")
    # if path still absolute, fallback to out_dir/filename
    if os.path.isabs(rel_path):
        rel_path = os.path.join(out_dir, filename)
    return rel_path.replace("\\", "/")
