from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
import os
import numpy as np
import onnxruntime as ort


app = FastAPI(title="FitZone AI ML Service")


BASE_DIR = os.path.dirname(__file__)
MODEL_DIR = os.path.join(BASE_DIR, "models")

ACTIVITY_MODEL_PATH = os.path.join(
    MODEL_DIR,
    "activity_level_model.onnx"
)

PERSONALIZATION_MODEL_PATH = os.path.join(
    MODEL_DIR,
    "personalization_completion_model.onnx"
)


ACTIVITY_FEATURES = [
    "age",
    "sex",
    "race_ethnicity",
    "education",
    "marital_status",
    "income_poverty_ratio",
    "vigorous_activity_days",
    "moderate_activity_days",
    "vigorous_minutes_week",
    "moderate_minutes_week",
    "sedentary_minutes_day",
]


PERSONALIZATION_NUMERIC_FEATURES = [
    "age",
    "weight_kg",
    "height_cm",
    "workout_days_per_week",
    "preferred_workout_duration",
    "adherence_percentage",
    "weekly_workout_progress",
    "weekly_minute_progress",
    "recent_sessions",
    "recent_active_minutes",
    "nutrition_available",
    "calorie_percentage",
    "protein_percentage",
    "readiness_score",
    "difficulty_preference",
]


PERSONALIZATION_CATEGORICAL_FEATURES = [
    "fitness_level",
    "primary_goal",
    "recommendation_action",
]


activity_session = None
personalization_session = None


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


class PersonalizationCompletionRequest(BaseModel):
    age: float
    weight_kg: float
    height_cm: float
    workout_days_per_week: float
    preferred_workout_duration: float

    fitness_level: str
    primary_goal: str

    adherence_percentage: float
    weekly_workout_progress: float
    weekly_minute_progress: float

    recent_sessions: float
    recent_active_minutes: float

    nutrition_available: float
    calorie_percentage: float
    protein_percentage: float

    readiness_score: float
    difficulty_preference: float

    recommendation_action: str


def get_activity_session():
    global activity_session

    if activity_session is None:
        if not os.path.exists(ACTIVITY_MODEL_PATH):
            raise FileNotFoundError(
                f"Activity model not found: {ACTIVITY_MODEL_PATH}"
            )

        activity_session = ort.InferenceSession(
            ACTIVITY_MODEL_PATH,
            providers=["CPUExecutionProvider"]
        )

    return activity_session


def get_personalization_session():
    global personalization_session

    if personalization_session is None:
        if not os.path.exists(PERSONALIZATION_MODEL_PATH):
            raise FileNotFoundError(
                "Personalization model not found: "
                f"{PERSONALIZATION_MODEL_PATH}"
            )

        personalization_session = ort.InferenceSession(
            PERSONALIZATION_MODEL_PATH,
            providers=["CPUExecutionProvider"]
        )

    return personalization_session


def numeric(value):
    return float(value)


@app.get("/")
def root():
    return {
        "service": "FitZone AI ML Service",
        "status": "running",
        "models": [
            "activity-profile",
            "personalization-completion"
        ]
    }


@app.get("/health")
def health():
    try:
        activity_ml_session = get_activity_session()
        personalization_ml_session = (
            get_personalization_session()
        )

        return {
            "status": "healthy",
            "runtime": "ONNX Runtime",
            "models": {
                "activity_profile": {
                    "status": "loaded",
                    "inputs": [
                        item.name
                        for item in activity_ml_session.get_inputs()
                    ]
                },
                "personalization_completion": {
                    "status": "loaded",
                    "inputs": [
                        item.name
                        for item in personalization_ml_session.get_inputs()
                    ]
                }
            }
        }

    except Exception as error:
        raise HTTPException(
            status_code=500,
            detail=str(error)
        )


@app.post("/predict/activity-profile")
def predict_activity_profile(
    request: ActivityProfileRequest
):
    try:
        ml_session = get_activity_session()

        values = [
            getattr(request, feature)
            for feature in ACTIVITY_FEATURES
        ]

        X = np.array(
            [values],
            dtype=np.float32
        )

        inputs = {
            ml_session.get_inputs()[i].name:
            X[:, i:i + 1]
            for i in range(len(ACTIVITY_FEATURES))
        }

        outputs = ml_session.run(
            None,
            inputs
        )

        prediction = outputs[0][0]

        probability_map = {}

        if len(outputs) > 1:
            probabilities = outputs[1][0]

            if isinstance(probabilities, dict):
                probability_map = {
                    str(key): float(value)
                    for key, value in probabilities.items()
                }

        confidence = (
            max(probability_map.values())
            if probability_map
            else None
        )

        return {
            "status": "success",
            "activity_level": str(prediction),
            "confidence": confidence,
            "probabilities": probability_map
        }

    except Exception as error:
        raise HTTPException(
            status_code=500,
            detail=str(error)
        )


@app.post("/predict/completion")
def predict_completion(
    request: PersonalizationCompletionRequest
):
    try:
        ml_session = get_personalization_session()

        numeric_values = {
            feature: numeric(
                getattr(request, feature)
            )
            for feature in PERSONALIZATION_NUMERIC_FEATURES
        }

        categorical_values = {
            feature: getattr(request, feature)
            for feature in PERSONALIZATION_CATEGORICAL_FEATURES
        }

        inputs = {}

        for input_meta in ml_session.get_inputs():
            name = input_meta.name

            if name in numeric_values:
                inputs[name] = np.array(
                    [[numeric_values[name]]],
                    dtype=np.float32
                )

            elif name in categorical_values:
                inputs[name] = np.array(
                    [[categorical_values[name]]],
                    dtype=object
                )

            else:
                raise ValueError(
                    f"Unexpected model input: {name}"
                )

        outputs = ml_session.run(
            None,
            inputs
        )

        prediction = int(outputs[0][0])

        probability = None

        if len(outputs) > 1:
            probability_sequence = outputs[1]

            if len(probability_sequence) > 0:
                probability_map = probability_sequence[0]

                if isinstance(
                    probability_map,
                    dict
                ):
                    probability = float(
                        probability_map.get(
                            1,
                            probability_map.get(
                                "1",
                                0.0
                            )
                        )
                    )

        if probability is None:
            probability = (
                1.0
                if prediction == 1
                else 0.0
            )

        return {
            "status": "success",
            "completion_probability": round(
                probability,
                4
            ),
            "predicted_completion": (
                prediction == 1
            ),
            "recommendation_action": (
                request.recommendation_action
            )
        }

    except Exception as error:
        raise HTTPException(
            status_code=500,
            detail=str(error)
        )