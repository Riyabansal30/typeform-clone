from datetime import datetime
from uuid import uuid4
from fastapi import APIRouter, Depends, HTTPException, status, Response
from sqlalchemy.orm import Session
from typing import List

from app.database import get_db
from app import models, schemas

router = APIRouter()

@router.get("/forms", response_model=List[schemas.FormResponse])
def get_forms(db: Session = Depends(get_db)):
    # Returns newest forms first
    forms = db.query(models.Form).order_by(models.Form.created_at.desc()).all()
    return forms

@router.post("/forms", response_model=schemas.FormResponse, status_code=status.HTTP_201_CREATED)
def create_form(form_in: schemas.FormCreate, db: Session = Depends(get_db)):
    if form_in.public_slug:
        existing = db.query(models.Form).filter(models.Form.public_slug == form_in.public_slug).first()
        if existing:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Public slug already exists"
            )
            
    form = models.Form(
        title=form_in.title,
        description=form_in.description,
        status=form_in.status if form_in.status is not None else "draft",
        public_slug=form_in.public_slug,
        thank_you_message=form_in.thank_you_message if form_in.thank_you_message is not None else "Thank you for your response!"
    )
    db.add(form)
    db.commit()
    db.refresh(form)
    return form

@router.get("/forms/{form_id}", response_model=schemas.FormResponse)
def get_form(form_id: int, db: Session = Depends(get_db)):
    form = db.query(models.Form).filter(models.Form.id == form_id).first()
    if not form:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Form not found"
        )
    return form

@router.patch("/forms/{form_id}", response_model=schemas.FormResponse)
def update_form(form_id: int, form_in: schemas.FormUpdate, db: Session = Depends(get_db)):
    db_form = db.query(models.Form).filter(models.Form.id == form_id).first()
    if not db_form:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Form not found"
        )
    
    update_data = form_in.model_dump(exclude_unset=True)
    
    if "public_slug" in update_data and update_data["public_slug"] is not None:
        existing = db.query(models.Form).filter(
            models.Form.public_slug == update_data["public_slug"],
            models.Form.id != form_id
        ).first()
        if existing:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Public slug already exists"
            )

    for field, value in update_data.items():
        setattr(db_form, field, value)
    
    db_form.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(db_form)
    return db_form

@router.delete("/forms/{form_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_form(form_id: int, db: Session = Depends(get_db)):
    form = db.query(models.Form).filter(models.Form.id == form_id).first()
    if not form:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Form not found"
        )
    db.delete(form)
    db.commit()
    return Response(status_code=status.HTTP_204_NO_CONTENT)

@router.post("/forms/{form_id}/duplicate", response_model=schemas.FormResponse, status_code=status.HTTP_201_CREATED)
def duplicate_form(form_id: int, db: Session = Depends(get_db)):
    original_form = db.query(models.Form).filter(models.Form.id == form_id).first()
    if not original_form:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Form not found"
        )
    
    duplicated = models.Form(
        title=f"Copy of {original_form.title}",
        description=original_form.description,
        status="draft",
        public_slug=None,
        thank_you_message=original_form.thank_you_message,
        published_at=None
    )
    db.add(duplicated)
    db.commit()
    db.refresh(duplicated)
    return duplicated


@router.post("/forms/{form_id}/publish", response_model=schemas.FormResponse)
def publish_form(form_id: int, db: Session = Depends(get_db)):
    form = db.query(models.Form).filter(models.Form.id == form_id).first()
    if not form:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Form not found")

    if not form.public_slug:
        while True:
            slug = uuid4().hex[:12]
            existing = db.query(models.Form).filter(models.Form.public_slug == slug).first()
            if not existing:
                form.public_slug = slug
                break

    form.status = "published"
    form.published_at = datetime.utcnow()
    form.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(form)
    return form


@router.post("/forms/{form_id}/unpublish", response_model=schemas.FormResponse)
def unpublish_form(form_id: int, db: Session = Depends(get_db)):
    form = db.query(models.Form).filter(models.Form.id == form_id).first()
    if not form:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Form not found")

    form.status = "draft"
    form.published_at = None
    form.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(form)
    return form
