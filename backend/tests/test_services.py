from app.services.recommendation_service import get_recommendations
from app.services.whatif_service import run_whatif

def test_get_recommendations_valid():
    res = get_recommendations("Diabetes Risk", "High")
    assert res["disease"] == "Diabetes Risk"
    assert res["severity"] == "High"
    assert len(res["lifestyle"]) > 0
    assert len(res["diet"]) > 0
    assert len(res["exercise"]) > 0
    assert len(res["monitoring"]) > 0
    assert len(res["followup"]) > 0

def test_get_recommendations_fallback():
    res = get_recommendations("UnknownDisease", "Low")
    assert res["disease"] == "UnknownDisease"
    assert res["severity"] == "Low"
    assert isinstance(res["lifestyle"], list)
    assert len(res["followup"]) > 0

def test_run_whatif_delta():
    base_features = {
        "age": 35.0,
        "gender": "male",
        "symptoms": {
            "Fever": {"severity": 4, "duration": 3.0, "frequency": 2},
            "Cough": {"severity": 3, "duration": 4.0, "frequency": 2}
        },
        "follow_up_answers": {
            "temp_value": 101.5,
            "chills_present": True
        }
    }
    
    # Lower symptoms severity to 0
    modifications = {
        "Fever": 0,
        "Cough": 0
    }
    
    res = run_whatif(base_features, modifications)
    
    assert "original_risk" in res
    assert "simulated_risk" in res
    assert "delta_probability" in res
    assert "delta_severity" in res
    assert "message" in res
    
    # Reducing symptom severities should lower the computed risk score
    assert res["simulated_risk"]["score"] < res["original_risk"]["score"]
