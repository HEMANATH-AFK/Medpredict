import asyncio
import pytest
import pytest_asyncio
from httpx import AsyncClient, ASGITransport
from motor.motor_asyncio import AsyncIOMotorClient

# ── Override Settings ────────────────────────────────────────────────────────
from app.config import settings
settings.database_name = "medpredict_test"

from app.main import app
from app.db.mongo import connect_db, close_db, get_database, users_col, predictions_col
from app.services import prediction_service


# Scope fixtures cleanly
@pytest.fixture(scope="session")
def event_loop():
    """Create an instance of the default event loop for each test case."""
    try:
        loop = asyncio.get_running_loop()
    except RuntimeError:
        loop = asyncio.new_event_loop()
    yield loop
    loop.close()


@pytest_asyncio.fixture(scope="session", autouse=True)
async def setup_test_db():
    """Initialise test database connection and load machine learning models once."""
    await connect_db()
    prediction_service.load_models()
    yield
    # Cleanup at end of session using a synchronous client to avoid closed loop issues
    await close_db()
    import pymongo
    client = pymongo.MongoClient(settings.mongodb_url)
    client.drop_database("medpredict_test")
    client.close()



@pytest_asyncio.fixture(autouse=True)
async def bind_db_to_current_loop():
    """Re-bind MongoDB motor client to the current running event loop of this test."""
    import app.db.mongo as mongo
    import certifi
    kwargs = {}
    if "mongodb+srv://" in settings.mongodb_url:
        kwargs["tlsCAFile"] = certifi.where()
    # Instantiate client on the current test's event loop
    mongo._client = AsyncIOMotorClient(settings.mongodb_url, **kwargs)
    yield


@pytest_asyncio.fixture(autouse=True)
async def clean_collections(bind_db_to_current_loop):
    """Clean MongoDB collections before each test to guarantee isolation."""
    db = get_database()
    for col_name in await db.list_collection_names():
        if col_name not in ["system.views"]:
            await db[col_name].delete_many({})


@pytest_asyncio.fixture
async def client():
    """Expose an HTTP async client pointing to the FastAPI application."""
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://testserver") as ac:
        yield ac


@pytest_asyncio.fixture
async def test_user():
    """Fixture that returns a registered patient user dictionary."""
    from app.utils.auth import hash_password
    col = users_col()
    user_doc = {
        "email": "testpatient@medpredict.ai",
        "password_hash": hash_password("SecurePassword123!"),
        "role": "patient",
        "profile": {"name": "Test Patient"},
    }
    result = await col.insert_one(user_doc)
    user_doc["_id"] = str(result.inserted_id)
    return user_doc


@pytest_asyncio.fixture
async def test_admin():
    """Fixture that returns a registered admin user dictionary."""
    from app.utils.auth import hash_password
    col = users_col()
    user_doc = {
        "email": "testadmin@medpredict.ai",
        "password_hash": hash_password("SecureAdminPassword123!"),
        "role": "admin",
        "profile": {"name": "Test Admin"},
    }
    result = await col.insert_one(user_doc)
    user_doc["_id"] = str(result.inserted_id)
    return user_doc


@pytest.fixture
def auth_headers():
    """Helper fixture to generate Bearer token authorization headers."""
    from app.utils.auth import create_access_token

    def _headers(user: dict) -> dict:
        token_data = {
            "sub": str(user["_id"]),
            "role": user["role"],
            "email": user["email"],
        }
        token = create_access_token(token_data)
        return {"Authorization": f"Bearer {token}"}

    return _headers
