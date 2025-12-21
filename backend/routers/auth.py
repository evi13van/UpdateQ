from fastapi import APIRouter, HTTPException, status, Depends
from models.user import UserCreate, UserResponse, Token, LoginRequest
from crud.user import create_user, get_user_by_email, verify_password
from auth.jwt import create_access_token
from auth.dependencies import get_current_user

router = APIRouter(prefix="/api/v1/auth", tags=["auth"])


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
async def logout(current_user: dict = Depends(get_current_user)):
    """Logout user (client-side token removal)"""
    return {"message": "Logged out successfully"}


@router.get("/me", response_model=UserResponse)
async def get_me(current_user: dict = Depends(get_current_user)):
    """Get current authenticated user"""
    return UserResponse(
        id=current_user["id"],
        email=current_user["email"],
        name=current_user["name"]
    )