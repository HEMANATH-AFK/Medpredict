"""
MedPredict AI — Data Pipeline
Generates clinical symptom-disease profiles based on real-world medical distributions,
standardizes features, and exports the unified dataset.
"""

import os
import json
import warnings
import numpy as np
import pandas as pd
import joblib
from pathlib import Path
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import StandardScaler
from sklearn.compose import ColumnTransformer
from sklearn.impute import SimpleImputer

warnings.filterwarnings("ignore")

DATA_DIR  = Path(__file__).parent.parent / "data"
MODEL_DIR = Path(__file__).parent.parent / "models"
DATA_DIR.mkdir(parents=True, exist_ok=True)
MODEL_DIR.mkdir(parents=True, exist_ok=True)

# ─── TARGET DISEASES ─────────────────────────────────────────────────────────
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
N_CLASSES = 10

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

# ─── CONSTRUCT FEATURE COLUMNS ────────────────────────────────────────────────
FEATURE_COLS = ["age", "gender_male", "gender_female"]
for sym in SYMPTOMS:
    FEATURE_COLS += [f"{sym}_severity", f"{sym}_duration", f"{sym}_frequency"]
FEATURE_COLS += FOLLOW_UPS

# ─── DATA GENERATION ──────────────────────────────────────────────────────────

def generate_clinical_data(n_samples=5000, seed=42) -> pd.DataFrame:
    rng = np.random.default_rng(seed)
    data = []

    # Distribute samples evenly across 10 classes
    samples_per_class = n_samples // N_CLASSES

    for label in range(N_CLASSES):
        disease = LABEL_MAP[label]
        for _ in range(samples_per_class):
            row = {col: 0.0 for col in FEATURE_COLS}
            row["temp_value"] = 98.6  # Default normal temp
            
            # Common demographics
            gender = rng.choice(["male", "female"])
            row["gender_male"] = 1.0 if gender == "male" else 0.0
            row["gender_female"] = 1.0 if gender == "female" else 0.0

            # Default age
            row["age"] = float(rng.integers(18, 85))

            if label == 9:  # Healthy
                # All symptoms 0, normal temp, no follow-ups
                row["age"] = float(rng.integers(18, 70))
                row["temp_value"] = round(rng.normal(98.6, 0.25), 1)

            elif label == 0:  # Common Cold
                row["age"] = float(rng.integers(5, 80))
                # High sneezing, cough, sore throat
                for s in ["sneezing", "cough", "sore_throat"]:
                    if rng.random() < 0.90:
                        row[f"{s}_severity"] = float(rng.integers(2, 4))
                        row[f"{s}_duration"] = float(rng.integers(3, 8))
                        row[f"{s}_frequency"] = float(rng.choice([2, 3])) # Intermittent/Constant
                # Mild fatigue
                if rng.random() < 0.60:
                    row["fatigue_severity"] = float(rng.integers(1, 3))
                    row["fatigue_duration"] = float(rng.integers(2, 6))
                    row["fatigue_frequency"] = 2.0
                # Low fever
                if rng.random() < 0.25:
                    row["fever_severity"] = float(rng.integers(1, 2))
                    row["fever_duration"] = float(rng.integers(1, 4))
                    row["fever_frequency"] = 2.0
                    row["temp_value"] = round(rng.normal(99.6, 0.4), 1)

            elif label == 1:  # Influenza
                row["age"] = float(rng.integers(5, 85))
                # High fever, body pain, chills, fatigue, cough
                row["fever_severity"] = float(rng.integers(4, 5))
                row["fever_duration"] = float(rng.integers(3, 7))
                row["fever_frequency"] = 3.0
                row["temp_value"] = round(rng.normal(102.2, 0.8), 1)
                
                row["chills_present"] = 1.0
                row["chills_severity"] = float(rng.integers(3, 5))
                row["chills_duration"] = float(rng.integers(2, 5))
                row["chills_frequency"] = 2.0

                for s in ["body_pain", "fatigue", "cough", "headache"]:
                    if rng.random() < 0.85:
                        row[f"{s}_severity"] = float(rng.integers(3, 5))
                        row[f"{s}_duration"] = float(rng.integers(3, 8))
                        row[f"{s}_frequency"] = 3.0

            elif label == 2:  # COVID-19
                row["age"] = float(rng.integers(18, 85))
                # Loss of taste/smell, shortness of breath, fever, dry cough
                if rng.random() < 0.70:
                    row["loss_of_taste_severity"] = float(rng.integers(4, 5))
                    row["loss_of_taste_duration"] = float(rng.integers(5, 14))
                    row["loss_of_taste_frequency"] = 3.0
                    row["loss_of_smell_severity"] = float(rng.integers(4, 5))
                    row["loss_of_smell_duration"] = float(rng.integers(5, 14))
                    row["loss_of_smell_frequency"] = 3.0
                
                row["fever_severity"] = float(rng.integers(3, 5))
                row["fever_duration"] = float(rng.integers(4, 10))
                row["fever_frequency"] = 2.0
                row["temp_value"] = round(rng.normal(101.4, 0.7), 1)
                
                row["cough_severity"] = float(rng.integers(3, 5))
                row["cough_duration"] = float(rng.integers(5, 14))
                row["cough_frequency"] = 3.0

                if rng.random() < 0.65:
                    row["shortness_of_breath_severity"] = float(rng.integers(3, 5))
                    row["shortness_of_breath_duration"] = float(rng.integers(4, 10))
                    row["shortness_of_breath_frequency"] = 2.0
                
                if rng.random() < 0.80:
                    row["fatigue_severity"] = float(rng.integers(3, 5))
                    row["fatigue_duration"] = float(rng.integers(5, 14))
                    row["fatigue_frequency"] = 3.0

            elif label == 3:  # Migraine
                row["age"] = float(rng.integers(15, 60))
                # Severe headache, one sided, pulsating, photophobia, nausea
                row["headache_severity"] = float(rng.integers(4, 5))
                row["headache_duration"] = float(rng.choice([1, 2, 3]))
                row["headache_frequency"] = 3.0
                
                row["headache_one_side"] = 1.0 if rng.random() < 0.85 else 0.0
                row["headache_throbbing"] = 1.0 if rng.random() < 0.90 else 0.0
                row["sensory_sensitivity"] = 1.0 if rng.random() < 0.90 else 0.0

                if rng.random() < 0.70:
                    row["nausea_severity"] = float(rng.integers(2, 4))
                    row["nausea_duration"] = row["headache_duration"]
                    row["nausea_frequency"] = 2.0
                if rng.random() < 0.60:
                    row["dizziness_severity"] = float(rng.integers(2, 4))
                    row["dizziness_duration"] = row["headache_duration"]
                    row["dizziness_frequency"] = 2.0

            elif label == 4:  # Gastroenteritis
                row["age"] = float(rng.integers(1, 80))
                # Nausea, vomiting, diarrhea, stomach cramps
                row["diarrhea_severity"] = float(rng.integers(3, 5))
                row["diarrhea_duration"] = float(rng.integers(2, 5))
                row["diarrhea_frequency"] = 3.0
                
                row["vomiting_severity"] = float(rng.integers(3, 5))
                row["vomiting_duration"] = float(rng.integers(1, 3))
                row["vomiting_frequency"] = 2.0
                
                row["nausea_severity"] = float(rng.integers(3, 4))
                row["nausea_duration"] = float(rng.integers(2, 4))
                row["nausea_frequency"] = 3.0

                row["stomach_cramps"] = 1.0
                row["stomach_pain_severity"] = float(rng.integers(2, 4))
                row["stomach_pain_duration"] = float(rng.integers(2, 4))
                row["stomach_pain_frequency"] = 2.0

                if rng.random() < 0.35:
                    row["fever_severity"] = float(rng.integers(1, 3))
                    row["fever_duration"] = float(rng.integers(1, 3))
                    row["fever_frequency"] = 2.0
                    row["temp_value"] = round(rng.normal(100.1, 0.4), 1)

            elif label == 5:  # Food Poisoning
                row["age"] = float(rng.integers(10, 75))
                # Sudden onset vomiting, stomach cramps, nausea, history of eating raw/undercooked food
                row["vomiting_severity"] = float(rng.integers(4, 5))
                row["vomiting_duration"] = float(rng.choice([1, 2]))
                row["vomiting_frequency"] = 3.0

                row["stomach_pain_severity"] = float(rng.integers(4, 5))
                row["stomach_pain_duration"] = float(rng.choice([1, 2]))
                row["stomach_pain_frequency"] = 3.0

                row["nausea_severity"] = float(rng.integers(4, 5))
                row["nausea_duration"] = float(rng.choice([1, 2]))
                row["nausea_frequency"] = 3.0

                row["stomach_cramps"] = 1.0
                row["raw_food_exposure"] = 1.0
                
                if rng.random() < 0.60:
                    row["diarrhea_severity"] = float(rng.integers(3, 5))
                    row["diarrhea_duration"] = float(rng.choice([1, 2]))
                    row["diarrhea_frequency"] = 2.0

            elif label == 6:  # Hypertension
                row["age"] = float(rng.integers(40, 85))
                # Dizziness, headache (occipital), fatigue, mostly silent
                if rng.random() < 0.65:
                    row["dizziness_severity"] = float(rng.integers(2, 3))
                    row["dizziness_duration"] = float(rng.integers(5, 30))
                    row["dizziness_frequency"] = 2.0
                if rng.random() < 0.45:
                    row["headache_severity"] = float(rng.integers(1, 3))
                    row["headache_duration"] = float(rng.integers(5, 30))
                    row["headache_frequency"] = 2.0

            elif label == 7:  # Diabetes Risk
                row["age"] = float(rng.integers(35, 80))
                # Fatigue, polyuria, polydipsia, weight loss
                row["fatigue_severity"] = float(rng.integers(2, 4))
                row["fatigue_duration"] = float(rng.integers(10, 30))
                row["fatigue_frequency"] = 3.0

                row["frequent_urination"] = 1.0
                row["excessive_thirst"] = 1.0
                if rng.random() < 0.55:
                    row["unexplained_weight_loss"] = 1.0

                if rng.random() < 0.40:
                    row["dizziness_severity"] = float(rng.integers(1, 2))
                    row["dizziness_duration"] = float(rng.integers(10, 30))
                    row["dizziness_frequency"] = 2.0

            elif label == 8:  # Heart Disease Risk
                row["age"] = float(rng.integers(45, 85))
                # Chest pain (pressure/heavy), radiation to left arm, dyspnea on exertion
                row["chest_pain_severity"] = float(rng.integers(4, 5))
                row["chest_pain_duration"] = float(rng.integers(1, 10))
                row["chest_pain_frequency"] = 2.0 # Intermittent

                row["chest_pain_type_pressure"] = 1.0 if rng.random() < 0.80 else 0.0
                row["chest_pain_type_sharp"] = 1.0 if row["chest_pain_type_pressure"] == 0.0 else 0.0
                row["chest_pain_spreading"] = 1.0 if rng.random() < 0.75 else 0.0
                row["chest_pain_activity_exertion"] = 1.0 if rng.random() < 0.85 else 0.0
                
                row["shortness_of_breath_severity"] = float(rng.integers(3, 5))
                row["shortness_of_breath_duration"] = float(rng.integers(5, 30))
                row["shortness_of_breath_frequency"] = 2.0

                if rng.random() < 0.60:
                    row["fatigue_severity"] = float(rng.integers(2, 4))
                    row["fatigue_duration"] = float(rng.integers(5, 30))
                    row["fatigue_frequency"] = 2.0

            row["label"] = label
            data.append(row)

    df = pd.DataFrame(data)
    # Shuffle
    df = df.sample(frac=1.0, random_state=seed).reset_index(drop=True)
    return df


# ─── PREPROCESSING PIPELINE ──────────────────────────────────────────────────

def build_preprocessing_pipeline() -> Pipeline:
    numeric_transformer = Pipeline([
        ("imputer", SimpleImputer(strategy="mean")),
        ("scaler",  StandardScaler()),
    ])
    preprocessor = ColumnTransformer([
        ("num", numeric_transformer, FEATURE_COLS),
    ], remainder="drop")
    return preprocessor


def run_pipeline():
    df = generate_clinical_data(n_samples=5000)
    csv_path = DATA_DIR / "processed_dataset.csv"
    df.to_csv(csv_path, index=False)
    print(f"[SUCCESS] Generated and saved clinical dataset with {len(df)} rows and {df.shape[1]} features.")
    print(df["label"].value_counts().rename(LABEL_MAP).to_string())
    return df


if __name__ == "__main__":
    run_pipeline()
