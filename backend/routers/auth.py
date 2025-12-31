from fastapi import APIRouter, HTTPException, status, Depends
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from models.user import UserCreate, UserResponse, Token, LoginRequest
from crud.user import create_user, get_user_by_email, verify_password
from auth.jwt import create_access_token, decode_token
from auth.dependencies import get_current_user
from crud.token_blacklist import blacklist_token
from datetime import datetime

router = APIRouter(prefix="/api/v1/auth", tags=["auth"])
security = HTTPBearer()


@router.post("/signup", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
async def signup(user_data: UserCreate):
    """Register a new user"""
    try:
        user = await create_user(user_data.email, user_data.password)
        return UserResponse(
            id=user["id"],
            email=user["email"],
            name=user["name"]
        )
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )


@router.post("/login", response_model=Token)
async def login(login_data: LoginRequest):
    """Authenticate user and return JWT token"""
    user = await get_user_by_email(login_data.email)
    
    if not user or not verify_password(login_data.password, user["password_hash"]):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password"
        )
    
    access_token = create_access_token(user["id"])
    
    return Token(
        access_token=access_token,
        token_type="bearer",
        user=UserResponse(
            id=user["id"],
            email=user["email"],
            name=user["name"]
        )
    )


@router.post("/logout")
async def logout(
    current_user: dict = Depends(get_current_user),
    credentials: HTTPAuthorizationCredentials = Depends(security)
):
    """Logout user and blacklist token"""
    try:
        token = credentials.credentials
        
        # Decode token to get expiration
        payload = decode_token(token)
        exp_timestamp = payload.get("exp")
        
        if exp_timestamp:
            expires_at = datetime.fromtimestamp(exp_timestamp)
            await blacklist_token(token, current_user["id"], expires_at)
        
        return {"message": "Logged out successfully"}
    except Exception as e:
        # Even if blacklisting fails, return success for client-side cleanup
        return {"message": "Logged out successfully"}


@router.get("/me", response_model=UserResponse)
async def get_me(current_user: dict = Depends(get_current_user)):
    """Get current authenticated user"""
    return UserResponse(
        id=current_user["id"],
        email=current_user["email"],
        name=current_user["name"]
    )