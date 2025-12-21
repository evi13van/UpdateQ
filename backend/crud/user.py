from passlib.hash import argon2
from database import get_database
from datetime import datetime
from bson import ObjectId


async def create_user(email: str, password: str) -> dict:
    """Create a new user with hashed password"""
    db = get_database()
    
    # Check if user already exists
    existing_user = await db.users.find_one({"email": email})
    if existing_user:
        raise ValueError("Email already registered")
    
    # Hash password
    password_hash = argon2.hash(password)
    
    # Extract name from email (before @)
    name = email.split("@")[0]
    
    # Create user document
    user_doc = {
        "email": email,
        "password_hash": password_hash,
        "name": name,
        "created_at": datetime.utcnow(),
        "updated_at": datetime.utcnow()
    }
    
    result = await db.users.insert_one(user_doc)
    
    return {
        "id": str(result.inserted_id),
        "email": email,
        "name": name
    }


async def get_user_by_email(email: str) -> dict:
    """Get user by email"""
    db = get_database()
    user = await db.users.find_one({"email": email})
    
    if user:
        return {
            "id": str(user["_id"]),
            "email": user["email"],
            "name": user["name"],
            "password_hash": user["password_hash"]
        }
    return None


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verify password against hash"""
    return argon2.verify(plain_password, hashed_password)