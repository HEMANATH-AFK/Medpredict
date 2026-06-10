"""MongoDB Motor async client + collection accessors."""

import certifi
from motor.motor_asyncio import AsyncIOMotorClient, AsyncIOMotorDatabase
from app.config import settings

_client: AsyncIOMotorClient | None = None


async def connect_db() -> None:
    global _client
    kwargs = {}
    if "mongodb+srv://" in settings.mongodb_url:
        kwargs["tlsCAFile"] = certifi.where()
    _client = AsyncIOMotorClient(settings.mongodb_url, **kwargs)
    # Ping to confirm connection
    await _client.admin.command("ping")



async def close_db() -> None:
    global _client
    if _client:
        _client.close()


def get_database() -> AsyncIOMotorDatabase:
    if _client is None:
        raise RuntimeError("Database not connected — call connect_db() first")
    return _client[settings.database_name]


# ── Collection accessors ──────────────────────────────────────────────────────

def users_col():
    return get_database()["users"]

def predictions_col():
    return get_database()["predictions"]

def recommendations_col():
    return get_database()["recommendations"]

def reports_col():
    return get_database()["reports"]

def audit_logs_col():
    return get_database()["audit_logs"]

def global_shap_col():
    return get_database()["global_shap"]

def model_registry_col():
    return get_database()["model_registry"]


async def ensure_indexes() -> None:
    """Create all required indexes on startup."""
    db = get_database()

    await db["users"].create_index("email", unique=True)

    await db["predictions"].create_index([("user_id", 1), ("created_at", -1)])
    await db["predictions"].create_index("result.primary_class")
    await db["predictions"].create_index("result.severity")

    await db["audit_logs"].create_index([("user_id", 1), ("created_at", -1)])
    # TTL index — auto-expire audit logs after 90 days
    await db["audit_logs"].create_index(
        "created_at", expireAfterSeconds=90 * 24 * 3600
    )
