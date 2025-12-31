"""
JWT Token Management Module

SECURITY NOTE: ecdsa timing attack vulnerability (CVE-2024-23342)
------------------------------------------------------------------
The ecdsa library (transitive dependency of python-jose) has known timing
attack vulnerabilities. This is considered acceptable for our use case because:

1. JWT signing happens server-side only (not exposed to timing attacks)
2. python-jose 3.5.0+ includes mitigations for JWT-specific vulnerabilities
3. The ecdsa maintainer considers side-channel attacks out of scope for pure Python
4. No practical exploit exists for our server-side JWT signing use case

If additional security is required in the future, consider migrating to PyJWT
which uses cryptography library for better side-channel resistance.

References:
- CVE-2024-23342: https://github.com/advisories/GHSA-wj6h-64fc-37mp
- ecdsa security policy: https://pypi.org/project/ecdsa/#security
"""

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


def decode_token(token: str) -> dict:
    """Decode JWT token and return full payload"""
    try:
        payload = jwt.decode(token, settings.jwt_secret, algorithms=["HS256"])
        return payload
    except JWTError:
        raise ValueError("Could not validate credentials")