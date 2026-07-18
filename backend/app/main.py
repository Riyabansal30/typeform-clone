from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.database import engine, Base
from app import models
from app.api.health import router as health_router
from app.api.forms import router as forms_router

# Create database tables automatically when FastAPI starts
Base.metadata.create_all(bind=engine)

app = FastAPI(title="Typeform Clone API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(health_router, prefix="/api")
app.include_router(forms_router, prefix="/api")
