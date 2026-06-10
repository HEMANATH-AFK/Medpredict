from app.services.risk_engine import compute_risk

def test_compute_risk_healthy():
    # Healthy base is 5.0. prob 1.0 -> Score 5.0 + 0 = 5.0 -> Low
    probs = {"Healthy": 1.0}
    res = compute_risk(probs, "Healthy", max_symptom_severity=0)
    assert res.score == 5.0
    assert res.severity == "Low"
    assert res.color == "#16A34A"

def test_compute_risk_covid_high():
    # COVID-19 base is 80.0. prob 0.8 -> Score 80.0 * 0.8 = 64.0. max_symptom_severity 3 -> 64 + 9 = 73 -> High
    probs = {"COVID-19": 0.8}
    res = compute_risk(probs, "COVID-19", max_symptom_severity=3)
    assert res.score == 73.0
    assert res.severity == "High"
    assert res.color == "#EA580C"

def test_compute_risk_emergency():
    # Heart Disease Risk base is 85.0. prob 1.0 -> 85 + (4 * 3) = 97 -> Emergency
    probs = {"Heart Disease Risk": 1.0}
    res = compute_risk(probs, "Heart Disease Risk", max_symptom_severity=4)
    assert res.score == 97.0
    assert res.severity == "Emergency"
    assert res.color == "#DC2626"
