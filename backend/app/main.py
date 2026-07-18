import os

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.database import engine, Base
from app import models
from app.api.health import router as health_router
from app.api.forms import router as forms_router
from app.api.questions import router as questions_router
from app.api.public_forms import router as public_forms_router
from app.api.submissions import router as submissions_router

Base.metadata.create_all(bind=engine)

app = FastAPI(title="Typeform Clone API")

cors_origins = [
    origin.strip()
    for origin in os.getenv(
        "CORS_ORIGINS",
        "http://localhost:3000,http://127.0.0.1:3000",
    ).split(",")
    if origin.strip()
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(health_router, prefix="/api")
app.include_router(forms_router, prefix="/api")
app.include_router(questions_router, prefix="/api")
app.include_router(public_forms_router, prefix="/api")
app.include_router(submissions_router, prefix="/api")
