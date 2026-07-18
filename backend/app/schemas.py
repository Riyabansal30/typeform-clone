from datetime import datetime
from pydantic import BaseModel
from typing import Optional

class FormCreate(BaseModel):
    title: str
    description: Optional[str] = None
    status: Optional[str] = "draft"
    public_slug: Optional[str] = None
    thank_you_message: Optional[str] = "Thank you for your response!"

class FormUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    status: Optional[str] = None
    public_slug: Optional[str] = None
    thank_you_message: Optional[str] = None
    published_at: Optional[datetime] = None

class FormResponse(BaseModel):
    id: int
    title: str
    description: Optional[str] = None
    status: str
    public_slug: Optional[str] = None
    thank_you_message: str
    created_at: datetime
    updated_at: datetime
    published_at: Optional[datetime] = None

    model_config = {
        "from_attributes": True
    }
