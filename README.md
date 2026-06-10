# MedPredict AI 🏥
> Explainable Multi-Disease Risk Assessment Platform

## Stack
| Layer | Technology |
|-------|-----------|
| ML | Scikit-learn · XGBoost · SHAP |
| Backend | FastAPI · Python 3.14 · Motor |
| Frontend | React 18 · Vite · Tailwind CSS |
| Database | MongoDB Atlas |
| Auth | JWT · bcrypt |
| Reports | ReportLab PDF |

## Quick Start

### 1. Clone & Setup Environment

```bash
# Copy environment template
cp backend/.env.example backend/.env
# Edit backend/.env and fill in MONGODB_URL and JWT_SECRET_KEY
```

### 2. Train the ML Model

```bash
$env:PYTHONIOENCODING="utf-8"
py ml/src/train.py
```

This trains Decision Tree, Random Forest (baseline), and XGBoost, then builds a Soft Voting Ensemble. Models are saved to `ml/models/`.

### 3. Start the Backend

```bash
cd backend
py -m uvicorn app.main:app --reload --port 8000
```

API docs available at: http://localhost:8000/docs

### 4. Start the Frontend

```bash
cd frontend
npm run dev
```

App available at: http://localhost:5173

---

## Architecture

```
USERS ──HTTPS──► FRONTEND (React+Vite) ──REST──► BACKEND (FastAPI)
                                                          │
                                              ┌───────────┴───────────┐
                                         MongoDB Atlas           ML Models (.pkl)
                                         (Users/Predictions)    (DT/RF/XGB/Ensemble)
```

## API Endpoints (12 total)

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /auth/register | Register patient/clinician |
| POST | /auth/login | Get JWT tokens |
| POST | /auth/refresh | Rotate access token |
| POST | /predict | Full risk prediction |
| POST | /predict/whatif | What-If simulation |
| GET | /predict/history | Patient prediction history |
| GET | /predict/{id} | Single prediction |
| GET | /report/{id}/download | Stream PDF report |
| GET | /analytics/dashboard | Patient KPIs |
| GET | /analytics/admin | Admin analytics |
| GET | /analytics/shap-global | Global SHAP summary |
| GET | /health | Health check |

## ML Model Architecture

```
Input (15 features)
       │
┌──────▼──────────────────────────────────┐
│           Preprocessing Pipeline         │
│  IterativeImputer → StandardScaler       │
│  + Feature Engineering (HOMA-IR, etc.)  │
└──────┬──────────────────────────────────┘
       │         SMOTE balancing
       ▼
┌─────────────────────────────────────────┐
│    Soft Voting Ensemble (weights 1:2:3)  │
│  ┌───────────┐ ┌──────────┐ ┌────────┐ │
│  │  Decision │ │  Random  │ │XGBoost │ │
│  │   Tree    │ │  Forest  │ │(3.2.0) │ │
│  └───────────┘ └──────────┘ └────────┘ │
└──────┬──────────────────────────────────┘
       │
┌──────▼──────────────────────────────────┐
│    Output: 4-class probabilities         │
│    Diabetes / Heart Disease / HTN / Healthy │
└─────────────────────────────────────────┘
```

## Disease Features (15 parameters)

`age` · `gender` · `bmi` · `glucose` · `hba1c` · `systolic_bp` · `diastolic_bp` · `cholesterol` · `hdl` · `ldl` · `triglycerides` · `fasting_insulin` · `smoking` · `physical_activity` · `family_history`

## Security

- All credentials loaded from environment variables (never hardcoded)
- bcrypt password hashing (work factor 12)
- JWT access tokens (15-min expiry) + refresh tokens (7-day)
- RBAC: patient / clinician / admin roles
- Rate limiting: 10 req/min (predict), 5 req/min (login)
- CORS configured for frontend origin only
