"""Prediction router — /predict/triage/questions, /predict/triage/predict, /predict/whatif, /predict/history."""

from __future__ import annotations
from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException, Request
from bson import ObjectId

from app.dependencies import get_current_user
from app.models.schemas import (
    TriageQuestionsRequest, TriageQuestionsResponse, FollowUpQuestion,
    TriagePredictRequest, PredictionResponse, WhatIfRequest, WhatIfResponse
)
from app.services import prediction_service, whatif_service
from app.db.mongo import predictions_col

router = APIRouter(prefix="/predict", tags=["Prediction"])


def _serialize(doc: dict) -> dict:
    """Convert MongoDB ObjectId fields to strings."""
    doc = {**doc}
    if "_id" in doc:
        doc["_id"] = str(doc["_id"])
    if "user_id" in doc and doc["user_id"]:
        doc["user_id"] = str(doc["user_id"]) if isinstance(doc["user_id"], ObjectId) else doc["user_id"]
    # Convert datetime to ISO string
    for k, v in doc.items():
        if isinstance(v, datetime):
            doc[k] = v.isoformat()
    return doc


def get_followup_questions(selected_symptoms: list[str], age: float) -> list[dict]:
    questions = []
    selected_lower = [s.lower() for s in selected_symptoms]

    # Fever questions
    if "fever" in selected_lower:
        questions.append({
            "id": "temp_value",
            "text": "What is your body temperature in Fahrenheit? (e.g. 101.5)",
            "type": "numeric",
            "symptom_trigger": "Fever"
        })
        questions.append({
            "id": "chills_present",
            "text": "Are you experiencing sudden chills or shivering?",
            "type": "boolean",
            "symptom_trigger": "Fever"
        })

    # Chest pain questions
    if "chest pain" in selected_lower or "chest_pain" in selected_lower:
        questions.append({
            "id": "chest_pain_type",
            "text": "How would you describe the chest pain?",
            "type": "choice",
            "options": ["Sharp pain", "Dull ache", "Pressure or tightness"],
            "symptom_trigger": "Chest Pain"
        })
        questions.append({
            "id": "chest_pain_spreading",
            "text": "Does the discomfort spread to your left arm, shoulder, neck, or jaw?",
            "type": "boolean",
            "symptom_trigger": "Chest Pain"
        })
        questions.append({
            "id": "chest_pain_activity",
            "text": "When is the chest discomfort most noticeable?",
            "type": "choice",
            "options": ["During physical activity/exertion", "While sitting or resting", "It is constant"],
            "symptom_trigger": "Chest Pain"
        })

    # Headache questions
    if "headache" in selected_lower:
        questions.append({
            "id": "headache_one_side",
            "text": "Is the headache pain primarily on one side of your head?",
            "type": "boolean",
            "symptom_trigger": "Headache"
        })
        questions.append({
            "id": "headache_throbbing",
            "text": "Does the headache feel like it is throbbing or pulsating?",
            "type": "boolean",
            "symptom_trigger": "Headache"
        })
        questions.append({
            "id": "sensory_sensitivity",
            "text": "Are you experiencing increased sensitivity to light or sound?",
            "type": "boolean",
            "symptom_trigger": "Headache"
        })

    # Digestive questions (Nausea, Vomiting, Diarrhea, Stomach Pain)
    digestive_syms = ["nausea", "vomiting", "diarrhea", "stomach pain", "stomach_pain"]
    if any(s in selected_lower for s in digestive_syms):
        questions.append({
            "id": "stomach_cramps",
            "text": "Are you experiencing painful abdominal cramps?",
            "type": "boolean",
            "symptom_trigger": "Digestive Symptoms"
        })
        questions.append({
            "id": "raw_food_exposure",
            "text": "Have you eaten raw or potentially spoiled/suspicious food in the last 24-48 hours?",
            "type": "boolean",
            "symptom_trigger": "Digestive Symptoms"
        })

    # Age / Diabetes Risk screening questions
    if age >= 35 or "fatigue" in selected_lower or "dizziness" in selected_lower:
        questions.append({
            "id": "frequent_urination",
            "text": "Have you experienced unusually frequent urination, especially at night?",
            "type": "boolean",
            "symptom_trigger": "Age/General Symptoms"
        })
        questions.append({
            "id": "excessive_thirst",
            "text": "Have you noticed excessive thirst or dry mouth despite drinking water?",
            "type": "boolean",
            "symptom_trigger": "Age/General Symptoms"
        })
        questions.append({
            "id": "unexplained_weight_loss",
            "text": "Have you experienced any unexplained or sudden weight loss recently?",
            "type": "boolean",
            "symptom_trigger": "Age/General Symptoms"
        })

    return questions


@router.post("/triage/questions", response_model=TriageQuestionsResponse)
async def get_triage_followups(
    body: TriageQuestionsRequest,
    current_user: dict = Depends(get_current_user)
):
    # Extract symptoms where severity > 0
    active_symptoms = [
        sym_name for sym_name, sym_state in body.symptoms.items()
        if sym_state.severity > 0
    ]
    
    questions_data = get_followup_questions(active_symptoms, body.age)
    
    questions = [
        FollowUpQuestion(
            id=q["id"],
            text=q["text"],
            type=q["type"],
            options=q.get("options"),
            symptom_trigger=q["symptom_trigger"]
        )
        for q in questions_data
    ]
    
    return TriageQuestionsResponse(questions=questions)


@router.post("/triage/predict", status_code=201)
async def run_triage_prediction(
    body: TriagePredictRequest,
    request: Request,
    current_user: dict = Depends(get_current_user)
):
    if not prediction_service.is_model_loaded():
        raise HTTPException(503, "ML model not loaded — run training first")

    user_id = str(current_user["_id"])
    result  = prediction_service.predict(body, user_id=user_id)

    # Persist to MongoDB
    doc = {
        "_id":             ObjectId(result["prediction_id"]),
        "user_id":         ObjectId(user_id),
        "created_at":      result["created_at"],
        "features":        body.model_dump(),  # Store raw TriagePredictRequest fields
        "result": {
            "primary_class": result["primary_class"],
            "probabilities": result["probabilities"],
            "risk_score":    result["risk"]["score"],
            "severity":      result["risk"]["severity"],
            "model_version": result["model_version"],
        },
        "shap":            result["shap"],
        "recommendations": result["recommendations"],
    }
    await predictions_col().insert_one(doc)

    return _serialize(result)


@router.post("/whatif")
async def what_if_simulation(
    body: WhatIfRequest,
    current_user: dict = Depends(get_current_user),
):
    col    = predictions_col()
    pred   = await col.find_one({"_id": ObjectId(body.base_prediction_id)})
    if not pred:
        raise HTTPException(404, f"Prediction {body.base_prediction_id} not found")

    base_features = pred["features"]
    result = whatif_service.run_whatif(base_features, body.modifications)
    return result


@router.get("/history")
async def prediction_history(
    current_user: dict = Depends(get_current_user),
    page: int = 1,
    limit: int = 10,
):
    col     = predictions_col()
    user_id = ObjectId(current_user["_id"])
    skip    = (page - 1) * limit

    cursor = col.find(
        {"user_id": user_id},
        {"shap": 0, "recommendations": 0},  # Exclude large fields for list view
    ).sort("created_at", -1).skip(skip).limit(limit)

    docs  = []
    async for doc in cursor:
        doc["_id"]     = str(doc["_id"])
        doc["user_id"] = str(doc["user_id"])
        if isinstance(doc.get("created_at"), datetime):
            doc["created_at"] = doc["created_at"].isoformat()
        docs.append(doc)

    total = await col.count_documents({"user_id": user_id})
    return {"predictions": docs, "total": total, "page": page, "limit": limit}


@router.get("/{prediction_id}")
async def get_prediction(
    prediction_id: str,
    current_user: dict = Depends(get_current_user),
):
    col  = predictions_col()
    pred = await col.find_one({"_id": ObjectId(prediction_id)})
    if not pred:
        raise HTTPException(404, "Prediction not found")

    # Patients can only see their own predictions
    if (current_user["role"] == "patient"
            and str(pred["user_id"]) != str(current_user["_id"])):
        raise HTTPException(403, "Access denied")

    probs = pred["result"].get("probabilities", {})
    sorted_probs = sorted(probs.items(), key=lambda item: item[1], reverse=True)[:3]
    top_diseases = []
    for disease, prob in sorted_probs:
        conf = "Low"
        if prob >= 0.70:
            conf = "High"
        elif prob >= 0.40:
            conf = "Medium"
        top_diseases.append({
            "disease": disease,
            "probability": prob,
            "confidence_score": conf
        })

    sev = pred["result"].get("severity", "Low")
    sev_colors = {"Low": "#16A34A", "Medium": "#CA8A04", "High": "#EA580C", "Emergency": "#DC2626"}

    res_data = {
        "prediction_id":   str(pred["_id"]),
        "user_id":         str(pred["user_id"]),
        "created_at":      pred["created_at"],
        "features":        pred["features"],
        "primary_class":   pred["result"]["primary_class"],
        "top_diseases":    top_diseases,
        "risk": {
            "score":       pred["result"]["risk_score"],
            "severity":    sev,
            "color":       sev_colors.get(sev, "#16A34A")
        },
        "shap":            pred.get("shap"),
        "recommendations": pred.get("recommendations"),
        "model_version":   pred["result"].get("model_version", "v1.0.0"),
    }

    return _serialize(res_data)
