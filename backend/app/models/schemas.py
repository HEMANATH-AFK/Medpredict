"""Pydantic v2 request/response models for all API endpoints."""

from __future__ import annotations
from datetime import datetime
from typing import Optional, Any
from pydantic import BaseModel, Field, EmailStr


# ─────────────────────────────────────────────────────────────────────────────
#  AUTH
# ─────────────────────────────────────────────────────────────────────────────

class RegisterRequest(BaseModel):
    email:    EmailStr
    password: str = Field(min_length=8)
    name:     str = Field(min_length=2, max_length=100)
    role:     str = Field(default="patient", pattern="^(patient|clinician)$")


class LoginRequest(BaseModel):
    email:    EmailStr
    password: str


class TokenResponse(BaseModel):
    access_token:  str
    refresh_token: str
    token_type:    str = "bearer"


class RefreshRequest(BaseModel):
    refresh_token: str


# ─────────────────────────────────────────────────────────────────────────────
#  TRIAGE SYMPTOM INPUTS
# ─────────────────────────────────────────────────────────────────────────────

class SymptomState(BaseModel):
    severity:  int = Field(default=0, ge=0, le=5, description="Symptom severity (1-5, 0 if inactive)")
    duration:  float = Field(default=0.0, ge=0.0, le=30.0, description="Duration in days")
    frequency: int = Field(default=0, ge=0, le=3, description="0=none, 1=rare, 2=intermittent, 3=constant")


class TriageQuestionsRequest(BaseModel):
    age:      float = Field(ge=0, le=120, description="Patient age")
    gender:   str = Field(pattern="^(male|female)$", description="Biological sex")
    symptoms: dict[str, SymptomState] = Field(description="Map of symptom name to state")


class FollowUpQuestion(BaseModel):
    id:              str
    text:            str
    type:            str  # "boolean" | "choice" | "numeric"
    options:         Optional[list[str]] = None
    symptom_trigger: str


class TriageQuestionsResponse(BaseModel):
    questions: list[FollowUpQuestion]


class TriagePredictRequest(BaseModel):
    age:               float = Field(ge=0, le=120)
    gender:            str = Field(pattern="^(male|female)$")
    symptoms:          dict[str, SymptomState]
    follow_up_answers: dict[str, Any] = Field(default_factory=dict)


# ─────────────────────────────────────────────────────────────────────────────
#  PREDICTION OUTPUT
# ─────────────────────────────────────────────────────────────────────────────

class DiseaseProbability(BaseModel):
    disease:          str
    probability:      float
    confidence_score: str  # e.g., "High", "Medium", "Low"


class SHAPContribution(BaseModel):
    feature:   str
    value:     float
    shap:      float
    direction: str   # "risk" | "protective"


class SHAPResult(BaseModel):
    base_value:      float
    predicted_class: str
    predicted_prob:  float
    contributions:   list[SHAPContribution]


class RiskResult(BaseModel):
    score:    float
    severity: str   # Low | Medium | High | Emergency
    color:    str


class RecommendationResult(BaseModel):
    disease:    str
    severity:   str
    lifestyle:  list[str]
    diet:       list[str]
    exercise:   list[str]
    monitoring: list[str]
    followup:   str


class PredictionResponse(BaseModel):
    prediction_id:   str
    primary_class:   str
    top_diseases:    list[DiseaseProbability]
    risk:            RiskResult
    shap:            SHAPResult
    recommendations: RecommendationResult
    model_version:   str
    created_at:      datetime


# ─────────────────────────────────────────────────────────────────────────────
#  WHAT-IF
# ─────────────────────────────────────────────────────────────────────────────

class WhatIfRequest(BaseModel):
    base_prediction_id: str
    modifications:      dict[str, float]  # e.g. {"fever_severity": 3.0}


class WhatIfResponse(BaseModel):
    original_risk:      RiskResult
    simulated_risk:     RiskResult
    delta_probability:  float
    delta_severity:     str
    message:            str


# ─────────────────────────────────────────────────────────────────────────────
#  ANALYTICS
# ─────────────────────────────────────────────────────────────────────────────

class DashboardResponse(BaseModel):
    total_assessments:   int
    latest_risk_score:   Optional[float]
    latest_severity:     Optional[str]
    risk_trend:          list[dict]   # [{date, score, severity}]
    disease_distribution: dict[str, int]
    top_risk_factor:     Optional[str]


class HealthResponse(BaseModel):
    status:        str
    environment:   str
    model_loaded:  bool
    db_connected:  bool
