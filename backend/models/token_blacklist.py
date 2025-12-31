from pydantic import BaseModel
from datetime import datetime
from typing import Optional


class TokenBlacklist(BaseModel):
    """Model for blacklisted tokens"""
    token: str
    user_id: str
    blacklisted_at: datetime
    expires_at: datetime
    
    class Config:
        json_encoders = {
            datetime: lambda v: v.isoformat()
        }