"""
FastAPI Application Factory
Wires together all routers, middleware, CORS, and lifespan events.
"""

from __future__ import annotations
from contextlib import asynccontextmanager

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded

from app.config import settings
from app.db.mongo import connect_db, close_db, ensure_indexes
from app.services import prediction_service

from app.routers import auth, predict, reports, analytics


# ── Rate limiter ──────────────────────────────────────────────────────────────
limiter = Limiter(key_func=get_remote_address)


# ── Lifespan ──────────────────────────────────────────────────────────────────
@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    print("[START] MedPredict AI starting up...")
    try:
        await connect_db()
        await ensure_indexes()
        print("[DB] MongoDB connected and indexes ensured")
    except Exception as e:
        print(f"[ERROR] MongoDB connection failed: {e}")

    loaded = prediction_service.load_models()
    if not loaded:
        print("[WARN] ML models not loaded - run `py ml/src/train.py` first")

    yield

    # Shutdown
    print("[SHUTDOWN] MedPredict AI shutting down...")

    await close_db()


# ── App factory ───────────────────────────────────────────────────────────────
app = FastAPI(
    title="MedPredict AI",
    description="Explainable Multi-Disease Risk Assessment API",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
    lifespan=lifespan,
)

# Rate limiter state
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Routers ───────────────────────────────────────────────────────────────────
app.include_router(auth.router)
app.include_router(predict.router)
app.include_router(reports.router)
app.include_router(analytics.router)


# ── Health check ──────────────────────────────────────────────────────────────
@app.get("/health", tags=["Health"])
async def health():
    from app.db.mongo import _client
    db_ok = _client is not None
    return {
        "status":        "ok",
        "environment":   settings.environment,
        "model_loaded":  prediction_service.is_model_loaded(),
        "model_version": prediction_service.get_model_version(),
        "db_connected":  db_ok,
    }


# ── Global error handler ──────────────────────────────────────────────────────
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    import traceback, uuid
    trace_id = str(uuid.uuid4())[:8]
    print(f"[ERROR {trace_id}] {type(exc).__name__}: {exc}\n{traceback.format_exc()}")
    return JSONResponse(
        status_code=500,
        content={"detail": "Internal server error", "trace_id": trace_id},
    )
