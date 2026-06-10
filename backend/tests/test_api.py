import pytest
from bson import ObjectId

# ─────────────────────────────────────────────────────────────────────────────
#  HEALTH CHECK
# ─────────────────────────────────────────────────────────────────────────────

@pytest.mark.asyncio
async def test_health_endpoint(client):
    response = await client.get("/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "ok"
    assert "environment" in data


# ─────────────────────────────────────────────────────────────────────────────
#  AUTH ROUTER
# ─────────────────────────────────────────────────────────────────────────────

@pytest.mark.asyncio
async def test_register_and_login(client):
    # Register
    reg_payload = {
        "email": "testregister@medpredict.ai",
        "password": "SecurePassword123!",
        "role": "patient",
        "name": "Jane Doe"
    }
    reg_response = await client.post("/auth/register", json=reg_payload)
    assert reg_response.status_code == 201
    reg_data = reg_response.json()
    assert reg_data["message"] == "Account created"
    assert "user_id" in reg_data

    # Register duplicate email -> conflict
    dup_response = await client.post("/auth/register", json=reg_payload)
    assert dup_response.status_code == 409

    # Login success
    login_payload = {
        "email": "testregister@medpredict.ai",
        "password": "SecurePassword123!"
    }
    login_response = await client.post("/auth/login", json=login_payload)
    assert login_response.status_code == 200
    login_data = login_response.json()
    assert "access_token" in login_data
    assert "refresh_token" in login_data

    # Login failure
    bad_login_payload = {
        "email": "testregister@medpredict.ai",
        "password": "WrongPassword!"
    }
    bad_login_response = await client.post("/auth/login", json=bad_login_payload)
    assert bad_login_response.status_code == 401


@pytest.mark.asyncio
async def test_token_refresh(client):
    # Register & Login
    reg_payload = {
        "email": "testrefresh@medpredict.ai",
        "password": "SecurePassword123!",
        "role": "patient",
        "name": "John Doe"
    }
    await client.post("/auth/register", json=reg_payload)
    login_response = await client.post("/auth/login", json={
        "email": "testrefresh@medpredict.ai",
        "password": "SecurePassword123!"
    })
    tokens = login_response.json()
    refresh_token = tokens["refresh_token"]

    # Refresh token rotation
    refresh_response = await client.post("/auth/refresh", json={"refresh_token": refresh_token})
    assert refresh_response.status_code == 200
    refresh_data = refresh_response.json()
    assert "access_token" in refresh_data
    assert "refresh_token" in refresh_data

    # Bad refresh token
    bad_refresh_response = await client.post("/auth/refresh", json={"refresh_token": "invalid_token"})
    assert bad_refresh_response.status_code == 401


# ─────────────────────────────────────────────────────────────────────────────
#  PREDICTION ROUTER
# ─────────────────────────────────────────────────────────────────────────────

@pytest.mark.asyncio
async def test_prediction_flows(client, test_user, auth_headers):
    headers = auth_headers(test_user)
    
    # 1. POST /predict/triage/predict without auth headers -> 401
    unauth_res = await client.post("/predict/triage/predict", json={})
    assert unauth_res.status_code == 401

    # 2. POST /predict/triage/questions
    questions_payload = {
        "age": 45.0,
        "gender": "female",
        "symptoms": {
            "Fever": {"severity": 4, "duration": 3.0, "frequency": 2}
        }
    }
    q_res = await client.post("/predict/triage/questions", json=questions_payload, headers=headers)
    assert q_res.status_code == 200
    q_data = q_res.json()
    assert "questions" in q_data

    # 3. POST /predict/triage/predict with correct auth headers & payload
    pred_payload = {
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
    pred_res = await client.post("/predict/triage/predict", json=pred_payload, headers=headers)
    assert pred_res.status_code == 201
    pred_data = pred_res.json()
    assert "prediction_id" in pred_data
    assert "primary_class" in pred_data
    assert "risk" in pred_data
    assert "shap" in pred_data
    assert "recommendations" in pred_data
    
    pred_id = pred_data["prediction_id"]

    # 4. GET /predict/{id}
    get_res = await client.get(f"/predict/{pred_id}", headers=headers)
    assert get_res.status_code == 200
    get_data = get_res.json()
    assert get_data["_id"] == pred_id
    assert get_data["result"]["primary_class"] == pred_data["primary_class"]

    # 5. GET /predict/{id} from another patient -> 403
    from app.db.mongo import users_col
    col = users_col()
    other_user_doc = {
        "email": "other@medpredict.ai",
        "password_hash": "dummyhash",
        "role": "patient",
        "profile": {"name": "Other Patient"}
    }
    insert_res = await col.insert_one(other_user_doc)
    other_user = {**other_user_doc, "_id": str(insert_res.inserted_id)}
    other_headers = auth_headers(other_user)
    forbidden_res = await client.get(f"/predict/{pred_id}", headers=other_headers)
    assert forbidden_res.status_code == 403

    # 6. GET /predict/history
    history_res = await client.get("/predict/history", headers=headers)
    assert history_res.status_code == 200
    history_data = history_res.json()
    assert history_data["total"] == 1
    assert len(history_data["predictions"]) == 1
    assert history_data["predictions"][0]["_id"] == pred_id

    # 7. POST /predict/whatif
    whatif_payload = {
        "base_prediction_id": pred_id,
        "modifications": {
            "Fever": 0
        }
    }
    whatif_res = await client.post("/predict/whatif", json=whatif_payload, headers=headers)
    assert whatif_res.status_code == 200
    whatif_data = whatif_res.json()
    assert "simulated_risk" in whatif_data
    assert "delta_probability" in whatif_data


# ─────────────────────────────────────────────────────────────────────────────
#  REPORTS ROUTER
# ─────────────────────────────────────────────────────────────────────────────

@pytest.mark.asyncio
async def test_pdf_report_download(client, test_user, auth_headers):
    headers = auth_headers(test_user)
    
    # Save a dummy prediction record to download
    pred_payload = {
        "age": 35.0,
        "gender": "male",
        "symptoms": {
            "Fever": {"severity": 4, "duration": 3.0, "frequency": 2}
        },
        "follow_up_answers": {
            "temp_value": 101.5,
            "chills_present": True
        }
    }
    pred_res = await client.post("/predict/triage/predict", json=pred_payload, headers=headers)
    pred_id = pred_res.json()["prediction_id"]

    # Download report
    report_res = await client.get(f"/report/{pred_id}/download", headers=headers)
    assert report_res.status_code == 200
    assert report_res.headers["content-type"] == "application/pdf"
    assert len(report_res.content) > 0


# ─────────────────────────────────────────────────────────────────────────────
#  ANALYTICS ROUTER
# ─────────────────────────────────────────────────────────────────────────────

@pytest.mark.asyncio
async def test_analytics_dashboard_patient(client, test_user, auth_headers):
    headers = auth_headers(test_user)
    
    # Save a prediction to have trend data
    pred_payload = {
        "age": 35.0,
        "gender": "male",
        "symptoms": {
            "Fever": {"severity": 4, "duration": 3.0, "frequency": 2}
        },
        "follow_up_answers": {
            "temp_value": 101.5,
            "chills_present": True
        }
    }
    await client.post("/predict/triage/predict", json=pred_payload, headers=headers)

    # Get Dashboard analytics
    dash_res = await client.get("/analytics/dashboard", headers=headers)
    assert dash_res.status_code == 200
    dash_data = dash_res.json()
    assert dash_data["total_assessments"] == 1
    assert "risk_trend" in dash_data
    assert len(dash_data["risk_trend"]) == 1


@pytest.mark.asyncio
async def test_analytics_admin_endpoints(client, test_user, test_admin, auth_headers):
    patient_headers = auth_headers(test_user)
    admin_headers = auth_headers(test_admin)

    # 1. Non-admin calls admin endpoints -> 403 Forbidden
    res1 = await client.get("/analytics/admin", headers=patient_headers)
    assert res1.status_code == 403
    res2 = await client.get("/analytics/shap-global", headers=patient_headers)
    assert res2.status_code == 403

    # 2. Admin calls admin stats dashboard -> 200 OK
    res_admin = await client.get("/analytics/admin", headers=admin_headers)
    assert res_admin.status_code == 200
    admin_data = res_admin.json()
    assert "total_predictions" in admin_data
    assert "severity_breakdown" in admin_data

    # 3. Admin calls shap-global endpoint -> 200 OK
    res_shap = await client.get("/analytics/shap-global", headers=admin_headers)
    assert res_shap.status_code == 200
