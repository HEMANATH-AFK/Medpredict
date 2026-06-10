"""
Prediction Service
Orchestrates the full prediction pipeline:
  triage input → feature mapping → model inference → risk scoring → SHAP explanation → recommendations → response mapping
"""

from __future__ import annotations
import numpy as np
import pandas as pd
import joblib
from pathlib import Path
from datetime import datetime, timezone
from bson import ObjectId

from app.config import settings
from app.services import risk_engine, shap_service, recommendation_service
from app.models.schemas import TriagePredictRequest

# ─── CORE SYMPTOMS ────────────────────────────────────────────────────────────
SYMPTOMS = [
    "fever", "cough", "sneezing", "sore_throat", "headache", "body_pain",
    "fatigue", "dizziness", "nausea", "vomiting", "diarrhea", "chest_pain",
    "shortness_of_breath", "stomach_pain", "chills", "loss_of_taste", "loss_of_smell"
]

# ─── FOLLOW-UP DYNAMICS ────────────────────────────────────────────────────────
FOLLOW_UPS = [
    "temp_value", "chills_present", "chest_pain_type_sharp", "chest_pain_type_dull",
    "chest_pain_type_pressure", "chest_pain_spreading", "chest_pain_activity_exertion",
    "chest_pain_activity_rest", "chest_pain_activity_constant", "frequent_urination",
    "excessive_thirst", "unexplained_weight_loss", "headache_one_side",
    "headache_throbbing", "sensory_sensitivity", "stomach_cramps", "raw_food_exposure"
]

# ─── FEATURE COLUMNS ──────────────────────────────────────────────────────────
FEATURE_COLS = ["age", "gender_male", "gender_female"]
for sym in SYMPTOMS:
    FEATURE_COLS += [f"{sym}_severity", f"{sym}_duration", f"{sym}_frequency"]
FEATURE_COLS += FOLLOW_UPS

LABEL_MAP = {
    0: "Common Cold",
    1: "Influenza",
    2: "COVID-19",
    3: "Migraine",
    4: "Gastroenteritis",
    5: "Food Poisoning",
    6: "Hypertension",
    7: "Diabetes Risk",
    8: "Heart Disease Risk",
    9: "Healthy"
}

# Global model state
_ensemble_pipeline = None
_rf_pipeline       = None
_model_version     = "v1.0.0"
_model_loaded      = False


def load_models() -> bool:
    """Load ensemble and RF pipelines from disk. Called once at app startup."""
    global _ensemble_pipeline, _rf_pipeline, _model_loaded, _model_version

    ensemble_path = Path(settings.model_path)
    rf_path       = Path(settings.rf_model_path)

    if not ensemble_path.exists():
        print(f"[WARN] Ensemble model not found at {ensemble_path}")
        return False

    try:
        _ensemble_pipeline = joblib.load(ensemble_path)
        print(f"[SUCCESS] Ensemble pipeline loaded from {ensemble_path}")

        if rf_path.exists():
            _rf_pipeline = joblib.load(rf_path)
            shap_service.initialise_shap_explainer(_rf_pipeline)
            print(f"[SUCCESS] RF pipeline loaded for SHAP from {rf_path}")
        else:
            print(f"[WARN] RF pipeline not found at {rf_path} - SHAP disabled")

        _model_loaded = True

        # Read model version from metrics.json
        metrics_path = ensemble_path.parent / "metrics.json"
        if metrics_path.exists():
            import json
            with open(metrics_path) as f:
                meta = json.load(f)
            _model_version = meta.get("model_version", _model_version)

        return True

    except Exception as e:
        print(f"[ERROR] Failed to load models: {e}")
        return False


def is_model_loaded() -> bool:
    return _model_loaded


def get_model_version() -> str:
    return _model_version


# ─────────────────────────────────────────────────────────────────────────────
#  FEATURE MAPPING & PREDICTION
# ─────────────────────────────────────────────────────────────────────────────

def map_inputs_to_features(inp: TriagePredictRequest) -> dict:
    """
    Map schema input dictionary to flat 71-feature map conforming to training schema.
    """
    row = {col: 0.0 for col in FEATURE_COLS}
    row["temp_value"] = 98.6  # Default normal body temperature

    # Demographics
    row["age"] = float(inp.age)
    row["gender_male"] = 1.0 if inp.gender == "male" else 0.0
    row["gender_female"] = 1.0 if inp.gender == "female" else 0.0

    # Primary Symptoms
    for sym_name, sym_state in inp.symptoms.items():
        sym_key = sym_name.lower().replace(" ", "_")
        if sym_key in SYMPTOMS:
            row[f"{sym_key}_severity"] = float(sym_state.severity)
            row[f"{sym_key}_duration"] = float(sym_state.duration)
            row[f"{sym_key}_frequency"] = float(sym_state.frequency)

    # Follow-Up Answers
    answers = inp.follow_up_answers
    
    # temp_value
    if "temp_value" in answers:
        try:
            row["temp_value"] = float(answers["temp_value"])
        except (ValueError, TypeError):
            pass

    # chills_present
    if "chills_present" in answers:
        row["chills_present"] = 1.0 if answers["chills_present"] else 0.0

    # chest_pain_type
    if "chest_pain_type" in answers:
        t = str(answers["chest_pain_type"]).lower()
        row["chest_pain_type_sharp"] = 1.0 if t == "sharp" else 0.0
        row["chest_pain_type_dull"] = 1.0 if t == "dull" else 0.0
        row["chest_pain_type_pressure"] = 1.0 if t == "pressure" else 0.0

    # chest_pain_spreading
    if "chest_pain_spreading" in answers:
        row["chest_pain_spreading"] = 1.0 if answers["chest_pain_spreading"] else 0.0

    # chest_pain_activity
    if "chest_pain_activity" in answers:
        a = str(answers["chest_pain_activity"]).lower()
        row["chest_pain_activity_exertion"] = 1.0 if a == "exertion" else 0.0
        row["chest_pain_activity_rest"] = 1.0 if a == "rest" else 0.0
        row["chest_pain_activity_constant"] = 1.0 if a == "constant" else 0.0

    # diabetes follow-ups
    for col in ["frequent_urination", "excessive_thirst", "unexplained_weight_loss"]:
        if col in answers:
            row[col] = 1.0 if answers[col] else 0.0

    # migraine follow-ups
    for col in ["headache_one_side", "headache_throbbing", "sensory_sensitivity"]:
        if col in answers:
            row[col] = 1.0 if answers[col] else 0.0

    # gastro follow-ups
    if "stomach_cramps" in answers:
        row["stomach_cramps"] = 1.0 if answers["stomach_cramps"] else 0.0
    if "raw_food_exposure" in answers:
        row["raw_food_exposure"] = 1.0 if answers["raw_food_exposure"] else 0.0

    return row


def predict(inp: TriagePredictRequest, user_id: str | None = None) -> dict:
    """
    Run prediction pipeline against dynamic triage inputs.
    """
    if not _model_loaded or _ensemble_pipeline is None:
        raise RuntimeError("Model not loaded — cannot run prediction")

    # 1. Map to flat features dict
    features_dict = map_inputs_to_features(inp)
    X = pd.DataFrame([features_dict], columns=FEATURE_COLS)

    # 2. Preprocess + predict probabilities
    y_proba_arr = _ensemble_pipeline.predict_proba(X)  # shape (1, 10)
    y_proba     = y_proba_arr[0]
    pred_idx    = int(np.argmax(y_proba))
    pred_class  = LABEL_MAP[pred_idx]

    # Map probability per class
    probabilities = {LABEL_MAP[i]: round(float(p), 4) for i, p in enumerate(y_proba)}

    # Top 3 diseases mapping
    top_indices = np.argsort(y_proba)[-3:][::-1]
    top_diseases = []
    for idx in top_indices:
        prob = float(y_proba[idx])
        conf = "Low"
        if prob >= 0.70:
            conf = "High"
        elif prob >= 0.40:
            conf = "Medium"
        top_diseases.append({
            "disease": LABEL_MAP[idx],
            "probability": round(prob, 4),
            "confidence_score": conf
        })

    # Get max reported severity of symptoms
    max_severity = 0
    for sym_state in inp.symptoms.values():
        max_severity = max(max_severity, sym_state.severity)

    # 3. Dynamic risk engine scoring
    risk = risk_engine.compute_risk(probabilities, pred_class, max_severity)

    # 4. SHAP local explainability
    preprocessor = _ensemble_pipeline.named_steps["preprocessor"]
    X_proc = preprocessor.transform(X)
    shap_result = shap_service.explain_prediction(X_proc, pred_idx, float(y_proba[pred_idx]))

    # 5. Get recommendations based on primary prediction and risk severity
    recs = recommendation_service.get_recommendations(pred_class, risk.severity)

    # 6. Build response
    result = {
        "prediction_id":  str(ObjectId()),
        "user_id":        user_id,
        "created_at":     datetime.now(timezone.utc),
        "features":       inp.model_dump(),  # Store original inputs in DB
        "primary_class":  pred_class,
        "probabilities":  probabilities,
        "top_diseases":    top_diseases,
        "risk": {
            "score":    risk.score,
            "severity": risk.severity,
            "color":    risk.color,
        },
        "shap":              shap_result,
        "recommendations":   recs,
        "model_version":     _model_version,
    }
    return result
