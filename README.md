# MedPredict AI

> AI-powered symptom-based disease prediction platform with explainable AI (SHAP), dynamic clinical follow-ups, and PDF reports.

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18 · Vite · Zustand · Recharts |
| Backend | FastAPI · Python 3.11/3.12 · Motor |
| Database | MongoDB Atlas |
| ML | scikit-learn · XGBoost · SHAP |
| Auth | JWT · bcrypt |
| Reports | ReportLab PDF |

---

## Prerequisites

| Tool | Version | Link |
|------|---------|------|
| Python | **3.11 or 3.12** | [python.org](https://python.org/downloads) |
| Node.js | 18+ LTS | [nodejs.org](https://nodejs.org) |
| Git | Latest | [git-scm.com](https://git-scm.com) |

> ⚠️ **Python 3.14 has TLS issues with MongoDB Atlas on Windows. Use 3.11 or 3.12.**

---

## Installation

### 1. Clone the Repository

```bash
git clone https://github.com/HEMANATH-AFK/Medpredict.git
cd Medpredict
```

---

### 2. MongoDB Setup

**Option A — MongoDB Atlas (Cloud, Recommended)**

1. Sign up at [cloud.mongodb.com](https://cloud.mongodb.com)
2. Create a free **M0** cluster
3. **Security → Database Access** → Create user with `readWriteAnyDatabase` role
4. **Security → Network Access** → Add `0.0.0.0/0` (allow all IPs for dev)
5. **Connect → Drivers** → Copy the connection string:
   ```
   mongodb+srv://<user>:<pass>@<cluster>.mongodb.net/?retryWrites=true&w=majority
   ```

**Option B — Local MongoDB**

```bash
# Start local MongoDB
mongod --dbpath C:\data\db
# Connection string: mongodb://localhost:27017
```

---

### 3. Backend Setup

```bash
cd backend

# Create and activate virtual environment
python -m venv venv
venv\Scripts\activate          # Windows
# source venv/bin/activate     # macOS/Linux

# Install dependencies
pip install --upgrade pip
pip install -r requirements.txt

# Configure environment
copy .env.example .env         # Windows
# cp .env.example .env         # macOS/Linux
```

Edit `backend/.env`:

```env
# MongoDB
MONGODB_URL=mongodb+srv://<user>:<pass>@<cluster>.mongodb.net/?retryWrites=true&w=majority
DATABASE_NAME=medpredict

# JWT — generate with: python -c "import secrets; print(secrets.token_hex(32))"
JWT_SECRET_KEY=your-64-character-random-secret-here
JWT_ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=15
REFRESH_TOKEN_EXPIRE_DAYS=7

# API
API_HOST=0.0.0.0
API_PORT=8000
ENVIRONMENT=development
ALLOWED_ORIGINS=http://localhost:5173,http://localhost:3000

# Model paths
MODEL_PATH=../ml/models/ensemble_v1.0.0.pkl
RF_MODEL_PATH=../ml/models/rf_pipeline.pkl

# Rate limiting
PREDICT_RATE_LIMIT=10/minute
LOGIN_RATE_LIMIT=5/minute
```

---

### 4. Train the ML Model

```bash
cd ml
pip install -r requirements.txt

# Windows
set PYTHONIOENCODING=utf-8
python src/train.py

# macOS/Linux
PYTHONIOENCODING=utf-8 python src/train.py
```

After training, verify these files exist:
```
ml/models/
├── ensemble_v1.0.0.pkl
└── rf_pipeline.pkl
```

---

### 5. Start the Backend

```bash
cd backend
venv\Scripts\activate

python -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

- API Server: http://localhost:8000
- Swagger Docs: http://localhost:8000/docs
- Health Check: http://localhost:8000/health

---

### 6. Start the Frontend

Open a **new terminal**:

```bash
cd frontend
npm install
npm run dev
```

App runs at: **http://localhost:5173**

---

## Running the App

Open two terminals side by side:

**Terminal 1 — Backend**
```bash
cd backend && venv\Scripts\activate && python -m uvicorn app.main:app --reload --port 8000
```

**Terminal 2 — Frontend**
```bash
cd frontend && npm run dev
```

| Service | URL |
|---------|-----|
| App | http://localhost:5173 |
| API | http://localhost:8000 |
| Docs | http://localhost:8000/docs |

---

## Migrate Local DB to Atlas

If you have existing local data:

```bash
cd backend
python migrate_to_atlas.py
```

Then update `backend/.env` with your Atlas connection string and restart the server.

---

## API Reference

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/auth/register` | Register patient/clinician |
| POST | `/auth/login` | Get JWT tokens |
| POST | `/auth/refresh` | Rotate access token |
| POST | `/predict/triage/questions` | Get AI follow-up questions |
| POST | `/predict/triage/predict` | Run disease prediction |
| POST | `/predict/whatif` | What-If simulation |
| GET | `/predict/history` | Patient prediction history |
| GET | `/predict/{id}` | Single prediction detail |
| GET | `/report/{id}/download` | Download PDF report |
| GET | `/analytics/dashboard` | Patient dashboard KPIs |
| GET | `/analytics/shap-global` | Global SHAP summary |
| GET | `/health` | Health check |

---

## Troubleshooting

| Problem | Fix |
|---------|-----|
| `ModuleNotFoundError` | Activate venv: `venv\Scripts\activate` then `pip install -r requirements.txt` |
| ML model not found | Run `python src/train.py` from the `ml/` directory |
| Atlas connection timeout | Add your IP to Atlas Network Access, or allow `0.0.0.0/0` |
| Python 3.14 TLS error | Downgrade to Python **3.11** or **3.12** |
| Frontend blank / API 404 | Ensure backend is running on port 8000 |
| Port already in use | Kill the process or change port in `.env` and `vite.config.js` |

---

## Security

- Passwords hashed with **bcrypt** (work factor 12)
- **JWT** access tokens (15 min) + refresh tokens (7 days)
- **RBAC**: patient / clinician / admin roles
- **Rate limiting**: 10 req/min (predict), 5 req/min (login)
- All secrets loaded from environment variables — never hardcoded
