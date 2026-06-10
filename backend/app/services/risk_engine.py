"""
Risk Scoring Engine
Maps predicted disease and symptom severity to weighted risk score and triage severity levels.
"""

from __future__ import annotations
from dataclasses import dataclass

DISEASE_BASE_SCORES: dict[str, float] = {
    "Healthy":            5.0,
    "Common Cold":        20.0,
    "Migraine":           40.0,
    "Gastroenteritis":    45.0,
    "Food Poisoning":     50.0,
    "Hypertension":       55.0,
    "Diabetes Risk":      70.0,
    "Influenza":          75.0,
    "COVID-19":           80.0,
    "Heart Disease Risk": 85.0,
}

SEVERITY_THRESHOLDS = [
    (85, "Emergency", "#DC2626"),  # Red
    (65, "High",      "#EA580C"),  # Orange
    (35, "Medium",    "#CA8A04"),  # Yellow
    (0,  "Low",       "#16A34A"),  # Green
]


@dataclass
class RiskScore:
    score:    float
    severity: str
    color:    str


def compute_risk(probabilities: dict[str, float], primary_class: str, max_symptom_severity: int = 0) -> RiskScore:
    """
    Compute a dynamic risk score based on:
    1. Base disease risk score.
    2. Probability of the primary prediction.
    3. Patient-reported maximum symptom severity.
    """
    base = DISEASE_BASE_SCORES.get(primary_class, 5.0)
    prob = probabilities.get(primary_class, 1.0)
    
    # Scale score with prediction confidence + symptom severity
    score = (base * prob) + (max_symptom_severity * 3.0)
    score = min(max(score, 0.0), 100.0)

    for threshold, severity, color in SEVERITY_THRESHOLDS:
        if score >= threshold:
            return RiskScore(score=round(score, 2), severity=severity, color=color)

    return RiskScore(score=round(score, 2), severity="Low", color="#16A34A")
