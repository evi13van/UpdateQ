from motor.motor_asyncio import AsyncIOMotorClient
from config import settings
import certifi
import sys

client = None
db = None


async def connect_to_mongo():
    global client, db
    try:
        print("🔌 Attempting to connect to MongoDB...", file=sys.stderr)
        client = AsyncIOMotorClient(
            settings.mongodb_uri,
            tlsCAFile=certifi.where(),
            serverSelectionTimeoutMS=5000  # 5 second timeout for faster failure detection
        )
        # Test the connection
        await client.admin.command('ping')
        db = client.updateq
        print("✅ Connected to MongoDB Atlas successfully", file=sys.stderr)
    except Exception as e:
        print(f"❌ FATAL: Failed to connect to MongoDB", file=sys.stderr)
        print(f"   Error Type: {type(e).__name__}", file=sys.stderr)
        print(f"   Error Message: {str(e)}", file=sys.stderr)
        print(f"   This could be due to:", file=sys.stderr)
        print(f"   - Invalid MongoDB URI", file=sys.stderr)
        print(f"   - Network connectivity issues", file=sys.stderr)
        print(f"   - Authentication failure", file=sys.stderr)
        print(f"   - IP whitelist restrictions", file=sys.stderr)
        raise


async def close_mongo_connection():
    global client
    if client:
        client.close()
        print("Closed MongoDB connection")


def get_database():
    return db