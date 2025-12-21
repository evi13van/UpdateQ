from datetime import datetime, timedelta
from jose import JWTError, jwt
from config import settings


def create_access_token(user_id: str) -> str:
    """Generate JWT access token for user"""
    expire = datetime.utcnow() + timedelta(seconds=settings.jwt_expires_in)
    to_encode = {
        "sub": user_id,
        "exp": expire
    }
    encoded_jwt = jwt.encode(to_encode, settings.jwt_secret, algorithm="HS256")
    return encoded_jwt


def verify_token(token: str) -> str:
    """Verify JWT token and return user_id"""
    try:
        payload = jwt.decode(token, settings.jwt_secret, algorithms=["HS256"])
        user_id: str = payload.get("sub")
        if user_id is None:
            raise ValueError("Invalid token payload")
        return user_id
    except JWTError:
        raise ValueError("Could not validate credentials")