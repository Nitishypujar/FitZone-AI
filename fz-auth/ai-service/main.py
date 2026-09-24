from __future__ import annotations

import math
import os
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional

from fastapi import FastAPI, HTTPException
from pydantic import BaseModel, Field


# ============================================================
# FitZone AI Completion Prediction Service
# ============================================================
#
# Purpose:
#   Predict the probability that a user will complete a
#   recommended action based on the current fitness state.
#
# Architecture:
#
#   FitZone Backend
#          |
#          v
#   /predict/completion
#          |
#          v
#   Logistic Regression
#          |
#          v
#   completion_probability
#
# Training:
#
#   /train
#          |
#          v
#   historical recommendation outcomes
#          |
#          v
#   trained model
#
# No ONNX Runtime is required.
# The logistic regression implementation is intentionally
# lightweight so the service can run on the current machine.
# ============================================================


APP_NAME = "FitZone AI ML Service"
APP_VERSION = "1.0.0"

HOST = os.getenv("ML_HOST", "127.0.0.1")
PORT = int(os.getenv("ML_PORT", "8000"))


app = FastAPI(
    title=APP_NAME,
    version=APP_VERSION,
    description=(
        "FitZone AI completion prediction service. "
        "Uses a lightweight logistic regression model "
        "to estimate recommendation completion probability."
    ),
)


# ============================================================
# Feature definition
# ============================================================

FEATURE_NAMES = [
    "age",
    "weight_kg",
    "height_cm",
    "workout_days_per_week",
    "preferred_workout_duration",
    "fitness_level",
    "primary_goal",
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
    "recommendation_action",
]


# ============================================================
# Category encodings
# ============================================================

FITNESS_LEVELS = {
    "beginner": 0.0,
    "intermediate": 0.5,
    "advanced": 1.0,
}


GOALS = {
    "fat loss": 0.0,
    "weight loss": 0.0,
    "weight-loss": 0.0,
    "weight gain": 0.15,
    "muscle": 0.30,
    "muscle growth": 0.30,
    "build muscle": 0.30,
    "strength": 0.45,
    "endurance": 0.60,
    "general fitness": 0.70,
    "fitness": 0.70,
    "maintain fitness": 0.75,
    "flexibility": 0.85,
    "stamina": 0.90,
}


ACTIONS = {
    "recovery": 0.0,
    "short-easy-workout": 0.10,
    "complete-planned-workout": 0.20,
    "follow-planned-workout": 0.30,
    "progress-workout": 0.40,
    "improve-protein-intake": 0.50,
    "cardio-workout": 0.60,
    "strength-workout": 0.70,
    "mobility-workout": 0.80,
    "endurance-workout": 0.90,
}


# ============================================================
# Request models
# ============================================================

class CompletionFeatures(BaseModel):
    age: float = 0
    weight_kg: float = 0
    height_cm: float = 0

    workout_days_per_week: float = 0
    preferred_workout_duration: float = 0

    fitness_level: str = "Beginner"
    primary_goal: str = "General Fitness"

    adherence_percentage: float = 0
    weekly_workout_progress: float = 0
    weekly_minute_progress: float = 0

    recent_sessions: float = 0
    recent_active_minutes: float = 0

    nutrition_available: float = 0
    calorie_percentage: float = 0
    protein_percentage: float = 0

    readiness_score: float = 50
    difficulty_preference: float = 0

    recommendation_action: str = "follow-planned-workout"


class TrainingExample(BaseModel):
    features: CompletionFeatures
    completed: bool


class TrainingRequest(BaseModel):
    examples: List[TrainingExample] = Field(default_factory=list)


# ============================================================
# Lightweight Logistic Regression
# ============================================================

class LogisticRegressionModel:
    """
    Lightweight binary logistic regression.

    Implemented using only Python's standard library.

    This avoids requiring:
        - onnxruntime
        - numpy
        - scikit-learn

    The model is trained using gradient descent.
    """

    def __init__(
        self,
        feature_count: int,
        learning_rate: float = 0.05,
        epochs: int = 1200,
        regularization: float = 0.001,
    ):
        self.feature_count = feature_count
        self.learning_rate = learning_rate
        self.epochs = epochs
        self.regularization = regularization

        self.weights = [0.0] * feature_count
        self.bias = 0.0

        self.trained = False
        self.sample_count = 0
        self.training_accuracy = None
        self.trained_at = None

    @staticmethod
    def sigmoid(value: float) -> float:
        value = max(-60.0, min(60.0, value))
        return 1.0 / (1.0 + math.exp(-value))

    def predict_probability(self, features: List[float]) -> float:
        if len(features) != self.feature_count:
            raise ValueError("Invalid feature count")

        score = self.bias

        for weight, feature in zip(
            self.weights,
            features,
        ):
            score += weight * feature

        return self.sigmoid(score)

    def train(
        self,
        X: List[List[float]],
        y: List[int],
    ) -> Dict[str, Any]:

        if not X:
            raise ValueError(
                "At least one training example is required."
            )

        if len(X) != len(y):
            raise ValueError(
                "Training features and labels must have equal length."
            )

        if len(X) < 4:
            raise ValueError(
                "At least 4 training examples are required."
            )

        if len(set(y)) < 2:
            raise ValueError(
                "Training data must contain both completed and "
                "not-completed examples."
            )

        self.weights = [0.0] * self.feature_count
        self.bias = 0.0

        sample_count = len(X)

        for _ in range(self.epochs):

            gradients = [
                0.0
                for _ in range(self.feature_count)
            ]

            bias_gradient = 0.0

            for features, label in zip(X, y):

                probability = self.predict_probability(
                    features
                )

                error = probability - label

                bias_gradient += error

                for index, feature in enumerate(features):
                    gradients[index] += (
                        error * feature
                    )

            for index in range(self.feature_count):

                regularization_gradient = (
                    self.regularization
                    * self.weights[index]
                )

                gradient = (
                    gradients[index] / sample_count
                    + regularization_gradient
                )

                self.weights[index] -= (
                    self.learning_rate * gradient
                )

            self.bias -= (
                self.learning_rate
                * bias_gradient
                / sample_count
            )

        self.sample_count = sample_count
        self.trained = True
        self.trained_at = (
            datetime.now(timezone.utc)
            .isoformat()
        )

        predictions = [
            1
            if self.predict_probability(features) >= 0.5
            else 0
            for features in X
        ]

        correct = sum(
            prediction == label
            for prediction, label in zip(
                predictions,
                y,
            )
        )

        self.training_accuracy = (
            correct / sample_count
        )

        return {
            "samples": sample_count,
            "training_accuracy": self.training_accuracy,
            "trained_at": self.trained_at,
        }

    def to_state(self) -> Dict[str, Any]:
        return {
            "weights": self.weights,
            "bias": self.bias,
            "trained": self.trained,
            "sample_count": self.sample_count,
            "training_accuracy": self.training_accuracy,
            "trained_at": self.trained_at,
        }

    def load_state(self, state: Dict[str, Any]) -> None:
        if len(state.get("weights", [])) != self.feature_count:
            return
        self.weights = state["weights"]
        self.bias = state.get("bias", 0.0)
        self.trained = state.get("trained", False)
        self.sample_count = state.get("sample_count", 0)
        self.training_accuracy = state.get("training_accuracy")
        self.trained_at = state.get("trained_at")


# ============================================================
# Global model
# ============================================================

MODEL = LogisticRegressionModel(
    feature_count=19
)

MODEL_STATE_PATH = os.path.join(
    os.path.dirname(__file__), "models", "completion_model_state.json"
)


def load_model_state() -> None:
    import json

    if not os.path.exists(MODEL_STATE_PATH):
        return
    try:
        with open(MODEL_STATE_PATH, "r", encoding="utf-8") as file:
            MODEL.load_state(json.load(file))
    except (OSError, ValueError):
        pass


def save_model_state() -> None:
    import json

    os.makedirs(os.path.dirname(MODEL_STATE_PATH), exist_ok=True)
    with open(MODEL_STATE_PATH, "w", encoding="utf-8") as file:
        json.dump(MODEL.to_state(), file)


load_model_state()


# ============================================================
# Feature normalization
# ============================================================

def clamp(
    value: float,
    minimum: float,
    maximum: float,
) -> float:

    return max(
        minimum,
        min(maximum, value),
    )


def normalize_percentage(
    value: float,
) -> float:

    return clamp(
        float(value or 0),
        0,
        100,
    ) / 100.0


def normalize_feature_vector(
    features: CompletionFeatures,
) -> List[float]:

    fitness_level = (
        FITNESS_LEVELS.get(
            str(
                features.fitness_level or ""
            ).strip().lower(),
            0.0,
        )
    )

    goal = str(
        features.primary_goal or ""
    ).strip().lower()

    goal_value = GOALS.get(
        goal,
        0.70,
    )

    action = str(
        features.recommendation_action or ""
    ).strip().lower()

    action_value = ACTIONS.get(
        action,
        0.30,
    )

    age = clamp(
        float(features.age or 0),
        0,
        100,
    ) / 100.0

    weight = clamp(
        float(features.weight_kg or 0),
        0,
        200,
    ) / 200.0

    height = clamp(
        float(features.height_cm or 0),
        0,
        220,
    ) / 220.0

    workout_days = clamp(
        float(
            features.workout_days_per_week
            or 0
        ),
        0,
        7,
    ) / 7.0

    duration = clamp(
        float(
            features.preferred_workout_duration
            or 0
        ),
        0,
        180,
    ) / 180.0

    adherence = normalize_percentage(
        features.adherence_percentage
    )

    weekly_workout_progress = normalize_percentage(
        features.weekly_workout_progress
    )

    weekly_minute_progress = normalize_percentage(
        features.weekly_minute_progress
    )

    recent_sessions = clamp(
        float(
            features.recent_sessions
            or 0
        ),
        0,
        14,
    ) / 14.0

    recent_active_minutes = clamp(
        float(
            features.recent_active_minutes
            or 0
        ),
        0,
        600,
    ) / 600.0

    nutrition_available = (
        1.0
        if float(
            features.nutrition_available
            or 0
        ) > 0
        else 0.0
    )

    calorie_percentage = normalize_percentage(
        features.calorie_percentage
    )

    protein_percentage = normalize_percentage(
        features.protein_percentage
    )

    readiness = normalize_percentage(
        features.readiness_score
    )

    difficulty_preference = clamp(
        float(
            features.difficulty_preference
            or 0
        ),
        0,
        5,
    ) / 5.0

    return [
        age,
        weight,
        height,
        workout_days,
        duration,
        fitness_level,
        goal_value,
        adherence,
        weekly_workout_progress,
        weekly_minute_progress,
        recent_sessions,
        recent_active_minutes,
        nutrition_available,
        calorie_percentage,
        protein_percentage,
        readiness,
        difficulty_preference,
        action_value,
        # Interaction signal:
        # adherence + readiness.
        (
            adherence
            * readiness
        ),
    ]


# ============================================================
# Cold-start prediction
# ============================================================

def cold_start_probability(
    features: CompletionFeatures,
) -> float:
    """
    Used only before enough real historical outcomes exist
    to train the ML model.

    This is NOT labelled as trained ML.
    It provides a sensible starting probability so the
    recommendation system can operate during cold start.
    """

    probability = 0.50

    adherence = clamp(
        float(
            features.adherence_percentage
            or 0
        ),
        0,
        100,
    )

    readiness = clamp(
        float(
            features.readiness_score
            or 0
        ),
        0,
        100,
    )

    weekly_progress = clamp(
        float(
            features.weekly_workout_progress
            or 0
        ),
        0,
        100,
    )

    duration = float(
        features.preferred_workout_duration
        or 0
    )

    action = str(
        features.recommendation_action
        or ""
    ).lower()

    probability += (
        adherence - 50
    ) / 250.0

    probability += (
        readiness - 50
    ) / 300.0

    probability += (
        weekly_progress - 50
    ) / 400.0

    if (
        "short" in action
        or "easy" in action
    ):
        probability += 0.05

    if (
        duration > 0
        and duration <= 30
    ):
        probability += 0.03

    if action == "recovery":
        probability += 0.02

    return clamp(
        probability,
        0.05,
        0.95,
    )


# ============================================================
# Routes
# ============================================================

@app.get("/")
def root():
    return {
        "service": APP_NAME,
        "version": APP_VERSION,
        "status": "running",
        "model": {
            "type": "logistic_regression",
            "trained": MODEL.trained,
            "sample_count": MODEL.sample_count,
        },
    }


@app.get("/health")
def health():
    return {
        "status": "success",
        "service": APP_NAME,
        "model_trained": MODEL.trained,
        "training_samples": MODEL.sample_count,
    }


@app.get("/docs-info")
def docs_info():
    return {
        "prediction_endpoint": "/predict/completion",
        "training_endpoint": "/train",
        "health_endpoint": "/health",
    }


@app.post("/predict/completion")
def predict_completion(
    features: CompletionFeatures,
):

    try:

        vector = normalize_feature_vector(
            features
        )

        if MODEL.trained:

            probability = (
                MODEL.predict_probability(
                    vector
                )
            )

            model_source = (
                "trained_logistic_regression"
            )

        else:

            probability = (
                cold_start_probability(
                    features
                )
            )

            model_source = "cold_start"

        probability = clamp(
            probability,
            0.01,
            0.99,
        )

        predicted_completion = (
            probability >= 0.50
        )

        return {
            "status": "success",

            "completion_probability": round(
                probability,
                4,
            ),

            "predicted_completion":
                predicted_completion,

            "model_enabled":
                MODEL.trained,

            "model_source":
                model_source,

            "training_samples":
                MODEL.sample_count,

            "trained_at":
                MODEL.trained_at,

            "recommendation_action":
                features.recommendation_action,
        }

    except Exception as error:

        raise HTTPException(
            status_code=500,
            detail=str(error),
        )


@app.post("/train")
def train_model(
    request: TrainingRequest,
):

    if not request.examples:
        raise HTTPException(
            status_code=400,
            detail=(
                "Training examples are required."
            ),
        )

    X = []
    y = []

    for example in request.examples:

        vector = normalize_feature_vector(
            example.features
        )

        X.append(vector)

        y.append(
            1 if example.completed else 0
        )

    try:

        result = MODEL.train(
            X,
            y,
        )

        save_model_state()

    except ValueError as error:

        raise HTTPException(
            status_code=400,
            detail=str(error),
        )

    return {
        "status": "success",
        "message": (
            "Completion model trained successfully."
        ),
        "model": {
            "type": "logistic_regression",
            "trained": MODEL.trained,
            "samples": MODEL.sample_count,
            "training_accuracy":
                MODEL.training_accuracy,
            "trained_at":
                MODEL.trained_at,
        },
    }


@app.get("/model")
def model_status():

    return {
        "status": "success",
        "model": {
            "type": "logistic_regression",
            "trained": MODEL.trained,
            "sample_count": MODEL.sample_count,
            "training_accuracy":
                MODEL.training_accuracy,
            "trained_at":
                MODEL.trained_at,
        },
    }


# ============================================================
# Local development entry point
# ============================================================

if __name__ == "__main__":

    import uvicorn

    uvicorn.run(
        app,
        host=HOST,
        port=PORT,
    )