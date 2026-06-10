"""
MedPredict AI — Model Evaluation
Runs acceptance gate checks and generates evaluation report.
"""

import json
import numpy as np
import pandas as pd
import joblib
from pathlib import Path
from sklearn.metrics import f1_score, roc_auc_score, accuracy_score, classification_report, confusion_matrix

MODEL_DIR = Path(__file__).parent.parent / "models"
DATA_DIR  = Path(__file__).parent.parent / "data"

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

SYMPTOMS = [
    "fever", "cough", "sneezing", "sore_throat", "headache", "body_pain",
    "fatigue", "dizziness", "nausea", "vomiting", "diarrhea", "chest_pain",
    "shortness_of_breath", "stomach_pain", "chills", "loss_of_taste", "loss_of_smell"
]

FOLLOW_UPS = [
    "temp_value", "chills_present", "chest_pain_type_sharp", "chest_pain_type_dull",
    "chest_pain_type_pressure", "chest_pain_spreading", "chest_pain_activity_exertion",
    "chest_pain_activity_rest", "chest_pain_activity_constant", "frequent_urination",
    "excessive_thirst", "unexplained_weight_loss", "headache_one_side",
    "headache_throbbing", "sensory_sensitivity", "stomach_cramps", "raw_food_exposure"
]

FEATURE_COLS = ["age", "gender_male", "gender_female"]
for sym in SYMPTOMS:
    FEATURE_COLS += [f"{sym}_severity", f"{sym}_duration", f"{sym}_frequency"]
FEATURE_COLS += FOLLOW_UPS


def test_model_acceptance():
    """Run all 6 production acceptance gates."""
    print("\n[GATE] Running Model Acceptance Gates\n")

    metrics_path = MODEL_DIR / "metrics.json"
    if not metrics_path.exists():
        print("[FAIL] metrics.json not found — run train.py first")
        return False

    with open(metrics_path) as f:
        metrics = json.load(f)

    ens = metrics["results"].get("Ensemble", {})
    rf  = metrics["results"].get("Random Forest", {})

    gates = [
        ("Gate 1: Ensemble F1-macro >= 0.70",  ens.get("f1_macro", 0) >= 0.70),
        ("Gate 2: Random Forest F1-macro >= 0.65", rf.get("f1_macro", 0) >= 0.65),
        ("Gate 3: ROC-AUC (Ensemble) >= 0.85", ens.get("roc_auc", 0)  >= 0.85),
        ("Gate 4: ensemble_v1.0.0.pkl exists", (MODEL_DIR / "ensemble_v1.0.0.pkl").exists()),
        ("Gate 5: preprocessor.pkl exists",    (MODEL_DIR / "preprocessor.pkl").exists()),
        ("Gate 6: metrics.json exists",        metrics_path.exists()),
    ]

    all_pass = True
    for gate_name, passed in gates:
        icon = "[PASS]" if passed else "[FAIL]"
        print(f"  {icon} {gate_name}")
        if not passed:
            all_pass = False

    print()
    if all_pass:
        print("[PASS] All acceptance gates passed - model is production-ready")
    else:
        print("[WARN] Some gates failed - review training metrics")

    return all_pass


def print_full_report():
    """Load test data and print full evaluation metrics."""
    csv_path = DATA_DIR / "processed_dataset.csv"
    if not csv_path.exists():
        print("No processed_dataset.csv found — run data_pipeline.py first")
        return

    df = pd.read_csv(csv_path)
    X  = df[FEATURE_COLS]
    y  = df["label"].values.astype(int)

    from sklearn.model_selection import train_test_split
    _, X_test, _, y_test = train_test_split(
        X, y, test_size=0.15, stratify=y, random_state=42
    )

    model_path = MODEL_DIR / "ensemble_v1.0.0.pkl"
    if not model_path.exists():
        print("No ensemble model found — run train.py first")
        return

    pipeline = joblib.load(model_path)
    y_pred   = pipeline.predict(X_test)

    print("\n[REPORT] Ensemble Classification Report (Hold-out Test Set)")
    print(classification_report(
        y_test, y_pred,
        target_names=list(LABEL_MAP.values()),
        zero_division=0,
    ))

    cm = confusion_matrix(y_test, y_pred)
    print("Confusion Matrix:")
    print(pd.DataFrame(cm, index=list(LABEL_MAP.values()), columns=list(LABEL_MAP.values())).to_string())


if __name__ == "__main__":
    test_model_acceptance()
    print_full_report()
