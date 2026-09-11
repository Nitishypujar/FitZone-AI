from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
import os
import numpy as np
import onnxruntime as ort

app = FastAPI(title="FitZone AI ML Service")

MODEL_PATH = os.path.join(os.path.dirname(__file__), "models", "activity_level_model.onnx")

FEATURES = [
    "age", "sex", "race_ethnicity", "education", "marital_status",
    "income_poverty_ratio", "vigorous_activity_days", "moderate_activity_days",
    "vigorous_minutes_week", "moderate_minutes_week", "sedentary_minutes_day"
]

session = None

class ActivityProfileRequest(BaseModel):
    age: float = 0
    sex: float = 0
    race_ethnicity: float = 0
    education: float = 0
    marital_status: float = 0
    income_poverty_ratio: float = 0
    vigorous_activity_days: float = 0
    moderate_activity_days: float = 0
    vigorous_minutes_week: float = 0
    moderate_minutes_week: float = 0
    sedentary_minutes_day: float = 0

def get_session():
    global session
    if session is None:
        if not os.path.exists(MODEL_PATH):
            raise FileNotFoundError(f"Model not found: {MODEL_PATH}")
        session = ort.InferenceSession(MODEL_PATH, providers=["CPUExecutionProvider"])
    return session

@app.get("/")
def root():
    return {"service": "FitZone AI ML Service", "status": "running"}

@app.get("/health")
def health():
    try:
        ml_session = get_session()
        return {
            "status": "healthy",
            "model": "FitZone Activity Level Model",
            "runtime": "ONNX Runtime",
            "input_features": FEATURES,
            "model_inputs": [input.name for input in ml_session.get_inputs()]
        }
    except Exception as error:
        raise HTTPException(status_code=500, detail=str(error))

@app.post("/predict/activity-profile")
def predict_activity_profile(request: ActivityProfileRequest):
    try:
        ml_session = get_session()
        values = [getattr(request, feature) for feature in FEATURES]
        X = np.array([values], dtype=np.float32)
        inputs = {
            ml_session.get_inputs()[i].name: X[:, i:i + 1]
            for i in range(len(FEATURES))
        }
        outputs = ml_session.run(None, inputs)
        prediction = outputs[0][0]
        probability_map = {}
        if len(outputs) > 1:
            probabilities = outputs[1][0]
            if isinstance(probabilities, dict):
                probability_map = {
                    str(key): float(value)
                    for key, value in probabilities.items()
                }
        confidence = max(probability_map.values()) if probability_map else None
        return {
            "status": "success",
            "activity_level": str(prediction),
            "confidence": confidence,
            "probabilities": probability_map
        }
    except Exception as error:
        raise HTTPException(status_code=500, detail=str(error))
