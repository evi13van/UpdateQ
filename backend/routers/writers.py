from fastapi import APIRouter, HTTPException, status, Depends
from models.writer import WriterCreate, WriterResponse, WriterUpdate
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


@router.patch("/{writer_id}", response_model=WriterResponse)
async def update_writer(
    writer_id: str,
    writer_data: WriterUpdate,
    current_user: dict = Depends(get_current_user)
):
    """Update writer information"""
    db = get_database()
    
    # Verify writer belongs to user
    writer = await db.writers.find_one({
        "_id": ObjectId(writer_id),
        "user_id": ObjectId(current_user["id"])
    })
    
    if not writer:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Writer not found"
        )
    
    # Build update dict with only provided fields
    update_data = {}
    if writer_data.name is not None:
        update_data["name"] = writer_data.name
    if writer_data.email is not None:
        update_data["email"] = writer_data.email
    
    if not update_data:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No fields to update"
        )
    
    # Update writer
    await db.writers.update_one(
        {"_id": ObjectId(writer_id)},
        {"$set": update_data}
    )
    
    # Get updated writer
    updated_writer = await db.writers.find_one({"_id": ObjectId(writer_id)})
    
    return WriterResponse(
        id=str(updated_writer["_id"]),
        name=updated_writer["name"],
        email=updated_writer["email"]
    )