"""
What-If Simulation Engine
Merges user symptom modifications into the original triage request and computes delta risk.
"""

from __future__ import annotations
from app.services import prediction_service
from app.models.schemas import TriagePredictRequest, SymptomState


def run_whatif(base_features: dict, modifications: dict) -> dict:
    """
    Merge modifications into base features, re-predict, compute delta.
    Returns a dict matching WhatIfResponse schema.
    """
    # 1. Parse base features as TriagePredictRequest
    orig_req = TriagePredictRequest(**base_features)
    
    # Run original prediction
    orig_result = prediction_service.predict(orig_req)
    orig_risk = orig_result["risk"]
    orig_prob = orig_result["probabilities"][orig_result["primary_class"]]
    orig_severity = orig_risk["severity"]

    # 2. Apply modifications to symptoms or follow-up answers
    # Copy request data
    modified_data = orig_req.model_dump()
    
    changed_features = []
    
    # Modifications can come as {"symptoms": {"Fever": 3}} or flat symptom changes {"Fever": 3}
    for key, value in modifications.items():
        if key in modified_data["symptoms"]:
            # Flat symptom change (e.g. {"Fever": 0}) where value is the new severity
            orig_severity_val = modified_data["symptoms"][key]["severity"]
            modified_data["symptoms"][key]["severity"] = int(value)
            if int(value) == 0:
                modified_data["symptoms"][key]["duration"] = 0.0
                modified_data["symptoms"][key]["frequency"] = 0
            
            changed_features.append(f"{key} severity from {orig_severity_val} to {value}")
        elif key == "follow_up_answers" and isinstance(value, dict):
            # Dict modification for follow ups
            modified_data["follow_up_answers"].update(value)
            for fk, fv in value.items():
                changed_features.append(f"{fk.replace('_', ' ')} to {fv}")
        elif key in modified_data["follow_up_answers"]:
            # Flat follow-up answer change
            orig_val = modified_data["follow_up_answers"][key]
            modified_data["follow_up_answers"][key] = value
            changed_features.append(f"{key.replace('_', ' ')} from {orig_val} to {value}")

    # Build request for simulation
    sim_req = TriagePredictRequest(**modified_data)
    
    # Run simulation prediction
    sim_result = prediction_service.predict(sim_req)
    sim_risk = sim_result["risk"]
    sim_prob = sim_result["probabilities"][sim_result["primary_class"]]
    sim_severity = sim_risk["severity"]

    delta_prob = round(sim_prob - orig_prob, 4)

    # 3. Create natural language summary
    direction = "reduces" if delta_prob < 0 else "increases"
    
    if not changed_features:
        summary = "No modifications were applied."
    else:
        summary = (
            f"Simulated change in {', '.join(changed_features)} "
            f"{direction} the probability of {sim_result['primary_class']} "
            f"from {orig_prob*100:.0f}% to {sim_prob*100:.0f}%."
        )

    return {
        "original_risk":     orig_risk,
        "simulated_risk":    sim_risk,
        "delta_probability": delta_prob,
        "delta_severity":    f"{orig_severity} -> {sim_severity}",
        "message":           summary,
    }
