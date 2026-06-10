import sys
from pathlib import Path
import certifi

# Add backend directory to path
sys.path.append(str(Path(__file__).parent))

from motor.motor_asyncio import AsyncIOMotorClient
import asyncio
from app.config import settings

async def test_conn():
    print(f"Testing connection to: {settings.mongodb_url}")
    kwargs = {}
    if "mongodb+srv://" in settings.mongodb_url:
        kwargs["tlsCAFile"] = certifi.where()
    client = AsyncIOMotorClient(settings.mongodb_url, **kwargs)
    try:
        await client.admin.command("ping")
        print("MongoDB Connection Successful!")
    except Exception as e:
        print(f"MongoDB Connection Failed: {e}")

    finally:
        client.close()

if __name__ == "__main__":
    asyncio.run(test_conn())

