from datetime import datetime
from sqlalchemy import Column, Integer, String, Text, DateTime
from app.database import Base

class Form(Base):
    __tablename__ = "forms"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, nullable=False)
    description = Column(Text, nullable=True)
    status = Column(String, default="draft", nullable=False)
    public_slug = Column(String, unique=True, nullable=True, index=True)
    thank_you_message = Column(String, default="Thank you for your response!", nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
    published_at = Column(DateTime, nullable=True)
