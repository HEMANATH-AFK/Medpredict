"""
MedPredict AI — Model Training
Trains Decision Tree, Random Forest, XGBoost + Soft Voting Ensemble for symptom prediction.
Random Forest is the baseline production model.
"""

import warnings
import json
import numpy as np
import pandas as pd
import joblib
from pathlib import Path
from datetime import datetime, timezone

from sklearn.model_selection import train_test_split, StratifiedKFold
from sklearn.tree import DecisionTreeClassifier
from sklearn.ensemble import RandomForestClassifier, VotingClassifier
from sklearn.metrics import f1_score, roc_auc_score, accuracy_score, classification_report
from sklearn.impute import SimpleImputer
from sklearn.preprocessing import StandardScaler
from sklearn.compose import ColumnTransformer
from sklearn.pipeline import Pipeline

try:
    from xgboost import XGBClassifier
    XGB_AVAILABLE = True
except ImportError:
    print("[WARN] XGBoost not installed - skipping XGB model")
    XGB_AVAILABLE = False

try:
    from imblearn.over_sampling import SMOTE
    SMOTE_AVAILABLE = True
except ImportError:
    print("[WARN] imbalanced-learn not installed - skipping SMOTE")
    SMOTE_AVAILABLE = False

warnings.filterwarnings("ignore")

DATA_DIR  = Path(__file__).parent.parent / "data"
MODEL_DIR = Path(__file__).parent.parent / "models"
MODEL_DIR.mkdir(parents=True, exist_ok=True)

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

# ─── DATA LOADING ─────────────────────────────────────────────────────────────

def load_data():
    csv_path = DATA_DIR / "processed_dataset.csv"
    if not csv_path.exists():
        print("Running data pipeline first...")
        import sys; sys.path.insert(0, str(Path(__file__).parent))
        from data_pipeline import run_pipeline
        df = run_pipeline()
    else:
        df = pd.read_csv(csv_path)

    X = df[FEATURE_COLS].copy()
    y = df["label"].values.astype(int)
    return X, y


# ─── PREPROCESSING PIPELINE ──────────────────────────────────────────────────

def build_preprocessor():
    numeric_pipe = Pipeline([
        ("imputer", SimpleImputer(strategy="mean")),
        ("scaler",  StandardScaler()),
    ])
    return ColumnTransformer([
        ("num", numeric_pipe, FEATURE_COLS),
    ])


# ─── MODEL DEFINITIONS ────────────────────────────────────────────────────────

def get_decision_tree() -> DecisionTreeClassifier:
    return DecisionTreeClassifier(
        criterion="gini",
        max_depth=8,
        min_samples_split=20,
        min_samples_leaf=10,
        class_weight="balanced",
        random_state=42,
    )


def get_random_forest() -> RandomForestClassifier:
    return RandomForestClassifier(
        n_estimators=300,
        max_depth=12,
        max_features="sqrt",
        min_samples_leaf=5,
        class_weight="balanced_subsample",
        n_jobs=-1,
        random_state=42,
    )


def get_xgboost(n_classes: int) -> "XGBClassifier":
    return XGBClassifier(
        n_estimators=300,
        learning_rate=0.05,
        max_depth=6,
        subsample=0.8,
        colsample_bytree=0.8,
        eval_metric="mlogloss",
        n_jobs=-1,
        random_state=42,
        verbosity=0,
    )


# ─── TRAINING + EVALUATION ────────────────────────────────────────────────────

def evaluate_model(name: str, model, X_test_proc, y_test) -> dict:
    y_pred = model.predict(X_test_proc)
    y_proba = model.predict_proba(X_test_proc)

    acc = accuracy_score(y_test, y_pred)
    f1 = f1_score(y_test, y_pred, average="macro", zero_division=0)
    try:
        auc = roc_auc_score(y_test, y_proba, multi_class="ovr", average="macro")
    except Exception:
        auc = 0.0

    print(f"\n{'-'*50}")
    print(f"  {name}")
    print(f"  Accuracy : {acc:.4f}")
    print(f"  F1-Macro : {f1:.4f}  {'[PASS]' if f1 >= 0.70 else '[WARN]'}")
    print(f"  ROC-AUC  : {auc:.4f}  {'[PASS]' if auc >= 0.85 else '[WARN]'}")
    print(classification_report(y_test, y_pred,
                                target_names=list(LABEL_MAP.values()),
                                zero_division=0))
    return {"name": name, "accuracy": acc, "f1_macro": f1, "roc_auc": auc}


def run_training():
    print("\n" + "="*60)
    print("  MedPredict AI - Model Training")
    print("="*60)

    # 1. Load data
    X, y = load_data()
    print(f"\n[DATA] Dataset: {X.shape[0]} samples, {X.shape[1]} features")
    unique, counts = np.unique(y, return_counts=True)
    for label, count in zip(unique, counts):
        print(f"   {LABEL_MAP[label]}: {count}")

    # 2. Train/Val/Test split (70/15/15 stratified)
    X_trainval, X_test, y_trainval, y_test = train_test_split(
        X, y, test_size=0.15, stratify=y, random_state=42
    )
    X_train, X_val, y_train, y_val = train_test_split(
        X_trainval, y_trainval, test_size=0.176, stratify=y_trainval, random_state=42
    )
    print(f"\n[DATA] Split: train={len(y_train)}, val={len(y_val)}, test={len(y_test)}")

    # 3. Fit preprocessor
    preprocessor = build_preprocessor()
    X_train_proc = preprocessor.fit_transform(X_train)
    X_val_proc   = preprocessor.transform(X_val)
    X_test_proc  = preprocessor.transform(X_test)

    # 4. SMOTE on training set
    if SMOTE_AVAILABLE:
        print("\n[DATA] Applying SMOTE to balance classes...")
        try:
            smote = SMOTE(k_neighbors=5, random_state=42)
            X_train_proc, y_train = smote.fit_resample(X_train_proc, y_train)
            unique, counts = np.unique(y_train, return_counts=True)
            for label, count in zip(unique, counts):
                print(f"   Post-SMOTE {LABEL_MAP[label]}: {count}")
        except Exception as e:
            print(f"   SMOTE failed ({e}), continuing without balancing")

    results = {}

    # 5. Decision Tree
    print("\n[MODEL] Training Decision Tree...")
    dt = get_decision_tree()
    dt.fit(X_train_proc, y_train)
    results["Decision Tree"] = evaluate_model("Decision Tree", dt, X_test_proc, y_test)

    # 6. Random Forest (BASELINE PRODUCTION MODEL)
    print("\n[MODEL] Training Random Forest (Baseline Production)...")
    rf = get_random_forest()
    rf.fit(X_train_proc, y_train)
    results["Random Forest"] = evaluate_model("Random Forest", rf, X_test_proc, y_test)

    # 7. XGBoost
    xgb = None
    if XGB_AVAILABLE:
        print("\n[MODEL] Training XGBoost...")
        xgb = get_xgboost(n_classes=len(LABEL_MAP))
        xgb.fit(X_train_proc, y_train)
        results["XGBoost"] = evaluate_model("XGBoost", xgb, X_test_proc, y_test)

    # 8. Soft Voting Ensemble
    print("\n[MODEL] Building Soft Voting Ensemble...")
    estimators = [("dt", dt), ("rf", rf)]
    weights    = [1, 2]
    if xgb is not None:
        estimators.append(("xgb", xgb))
        weights.append(3)

    ensemble_final = VotingClassifier(estimators=estimators, voting="soft", weights=weights)
    ensemble_final.fit(X_train_proc, y_train)
    results["Ensemble"] = evaluate_model("Ensemble (Voting)", ensemble_final, X_test_proc, y_test)

    # 9. Model comparison table
    print("\n" + "="*60)
    print("  MODEL COMPARISON SUMMARY")
    print("="*60)
    print(f"  {'Model':<22} {'Accuracy':>10} {'F1-Macro':>10} {'ROC-AUC':>10}")
    print("  " + "-"*52)
    for name, r in results.items():
        flag = "<- BASELINE" if name == "Random Forest" else ""
        ens  = "<- PRODUCTION" if name == "Ensemble" else ""
        print(f"  {name:<22} {r['accuracy']:>10.4f} {r['f1_macro']:>10.4f} {r['roc_auc']:>10.4f}  {flag}{ens}")

    # 10. Acceptance gates
    ens_result = results["Ensemble"]
    gates = {
        "F1 >= 0.70":   ens_result["f1_macro"] >= 0.70,
        "AUC >= 0.85":  ens_result["roc_auc"]  >= 0.85,
    }
    print("\n[GATE] Production Acceptance Gates:")
    all_pass = True
    for gate, passed in gates.items():
        icon = "[PASS]" if passed else "[FAIL]"
        print(f"   {icon} {gate}")
        if not passed:
            all_pass = False

    if not all_pass:
        print("\n[WARN] Warning: some gates failed - model saved anyway for demo purposes")
    else:
        print("\n[PASS] All gates passed - ensemble is production-ready")

    # 11. Serialize artefacts
    ensemble_pipeline = Pipeline([
        ("preprocessor", preprocessor),
        ("classifier",   ensemble_final),
    ])
    # Also expose individual models for SHAP (RF is used)
    rf_pipeline = Pipeline([
        ("preprocessor", preprocessor),
        ("classifier",   rf),
    ])

    joblib.dump(ensemble_pipeline, MODEL_DIR / "ensemble_v1.0.0.pkl")
    joblib.dump(rf_pipeline,       MODEL_DIR / "rf_pipeline.pkl")
    joblib.dump(preprocessor,      MODEL_DIR / "preprocessor.pkl")
    joblib.dump(
        {"dt": dt, "rf": rf, "xgb": xgb, "ensemble": ensemble_final},
        MODEL_DIR / "base_models.pkl",
    )

    # Save metrics as JSON
    metrics = {
        "trained_at":    datetime.now(timezone.utc).isoformat() + "Z",
        "model_version": "v1.0.0",
        "results":       results,
        "gates_passed":  all_pass,
        "feature_cols":  FEATURE_COLS,
        "label_map":     {str(k): v for k, v in LABEL_MAP.items()},
    }
    with open(MODEL_DIR / "metrics.json", "w") as f:
        json.dump(metrics, f, indent=2)

    print(f"\n[SAVE] Saved artefacts to {MODEL_DIR}/")
    print("   - ensemble_v1.0.0.pkl  (full inference pipeline)")
    print("   - rf_pipeline.pkl      (RF pipeline for SHAP)")
    print("   - preprocessor.pkl     (fitted preprocessor)")
    print("   - base_models.pkl      (individual models)")
    print("   - metrics.json         (training metrics)")

    return ensemble_pipeline, rf_pipeline, preprocessor, results


if __name__ == "__main__":
    run_training()
