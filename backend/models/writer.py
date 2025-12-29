from pydantic import BaseModel, EmailStr, Field
from datetime import datetime


class WriterCreate(BaseModel):
    name: str
    email: EmailStr


class WriterUpdate(BaseModel):
    name: str | None = None
    email: EmailStr | None = None

class WriterResponse(BaseModel):
    id: str
    name: str
    email: EmailStr

    class Config:
        populate_by_name = True