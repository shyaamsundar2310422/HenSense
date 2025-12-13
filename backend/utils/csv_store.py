# utils/csv_store.py
import os
from datetime import datetime
import pandas as pd

PREDICTIONS_CSV = "predictions.csv"

def save_prediction(username, image_name, label, confidence, csv_path=PREDICTIONS_CSV):
    row = {
        "timestamp": datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
        "username": username,
        "image_name": image_name,
        "label": label,
        "confidence": round(float(confidence), 4),
    }
    if os.path.exists(csv_path):
        df_old = pd.read_csv(csv_path)
        df_new = pd.concat([df_old, pd.DataFrame([row])], ignore_index=True)
    else:
        df_new = pd.DataFrame([row])
    df_new.to_csv(csv_path, index=False)

def load_predictions(csv_path=PREDICTIONS_CSV):
    if os.path.exists(csv_path):
        return pd.read_csv(csv_path)
    # keep same columns as save_prediction for consistency
    return pd.DataFrame(columns=["timestamp", "username", "image_name", "label", "confidence"])
