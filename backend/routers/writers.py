from fastapi import APIRouter, HTTPException, status, Depends
from models.writer import WriterCreate, WriterResponse
from auth.dependencies import get_current_user
from database import get_database
from bson import ObjectId
from datetime import datetime

router = APIRouter(prefix="/api/v1/writers", tags=["writers"])


@router.get("")
async def get_writers(current_user: dict = Depends(get_current_user)):
    """Get list of writers for authenticated user"""
    db = get_database()
    
    cursor = db.writers.find({"user_id": ObjectId(current_user["id"])})
    
    writers = []
    async for writer in cursor:
        writers.append({
            "id": str(writer["_id"]),
            "name": writer["name"],
            "email": writer["email"]
        })
    
    return {"writers": writers}


@router.post("", response_model=WriterResponse, status_code=status.HTTP_201_CREATED)
async def add_writer(
    writer_data: WriterCreate,
    current_user: dict = Depends(get_current_user)
):
    """Add new writer"""
    db = get_database()
    
    writer_doc = {
        "user_id": ObjectId(current_user["id"]),
        "name": writer_data.name,
        "email": writer_data.email,
        "created_at": datetime.utcnow()
    }
    
    result = await db.writers.insert_one(writer_doc)
    
    return WriterResponse(
        id=str(result.inserted_id),
        name=writer_data.name,
        email=writer_data.email
    )