from database import get_database
from datetime import datetime
from typing import Optional


async def blacklist_token(token: str, user_id: str, expires_at: datetime) -> bool:
    """Add a token to the blacklist"""
    db = get_database()
    
    blacklist_entry = {
        "token": token,
        "user_id": user_id,
        "blacklisted_at": datetime.utcnow(),
        "expires_at": expires_at
    }
    
    await db.token_blacklist.insert_one(blacklist_entry)
    return True


async def is_token_blacklisted(token: str) -> bool:
    """Check if a token is blacklisted"""
    db = get_database()
    
    result = await db.token_blacklist.find_one({"token": token})
    return result is not None


async def cleanup_expired_tokens() -> int:
    """Remove expired tokens from blacklist"""
    db = get_database()
    
    result = await db.token_blacklist.delete_many({
        "expires_at": {"$lt": datetime.utcnow()}
    })
    
    return result.deleted_count