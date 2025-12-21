from motor.motor_asyncio import AsyncIOMotorClient
from config import settings
import certifi

client = None
db = None


async def connect_to_mongo():
    global client, db
    client = AsyncIOMotorClient(
        settings.mongodb_uri,
        tlsCAFile=certifi.where()
    )
    db = client.updateq
    print("Connected to MongoDB Atlas")


async def close_mongo_connection():
    global client
    if client:
        client.close()
        print("Closed MongoDB connection")


def get_database():
    return db