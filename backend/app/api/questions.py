from datetime import datetime
from typing import List

from fastapi import APIRouter, Depends, HTTPException, Response, status
from sqlalchemy import func
from sqlalchemy.orm import Session

from app import models, schemas
from app.database import get_db

router = APIRouter()


def get_question_or_404(question_id: int, db: Session):
    question = db.query(models.Question).filter(models.Question.id == question_id).first()
    if not question:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Question not found")
    return question


def validate_options(question_type: str, options):
    if question_type == "multiple_choice":
        if not options or len(options) < 2:
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail="Multiple-choice questions require at least two options",
            )
        cleaned_options = [option.strip() for option in options]
        if any(not option for option in cleaned_options):
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail="Multiple-choice options cannot be blank",
            )
        return cleaned_options

    if options is not None:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Options are only allowed for multiple-choice questions",
        )
    return None


@router.get("/forms/{form_id}/questions", response_model=List[schemas.QuestionResponse])
def get_questions(form_id: int, db: Session = Depends(get_db)):
    form = db.query(models.Form).filter(models.Form.id == form_id).first()
    if not form:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Form not found")

    return (
        db.query(models.Question)
        .filter(models.Question.form_id == form_id)
        .order_by(models.Question.display_order)
        .all()
    )


@router.post(
    "/forms/{form_id}/questions",
    response_model=schemas.QuestionResponse,
    status_code=status.HTTP_201_CREATED,
)
def create_question(form_id: int, question_in: schemas.QuestionCreate, db: Session = Depends(get_db)):
    form = db.query(models.Form).filter(models.Form.id == form_id).first()
    if not form:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Form not found")

    last_order = (
        db.query(func.max(models.Question.display_order))
        .filter(models.Question.form_id == form_id)
        .scalar()
        or 0
    )
    question = models.Question(
        form_id=form_id,
        text=question_in.text,
        question_type=question_in.question_type,
        is_required=question_in.is_required,
        display_order=last_order + 1,
        options=question_in.options,
    )
    db.add(question)
    db.commit()
    db.refresh(question)
    return question


@router.patch("/questions/{question_id}", response_model=schemas.QuestionResponse)
def update_question(question_id: int, question_in: schemas.QuestionUpdate, db: Session = Depends(get_db)):
    question = get_question_or_404(question_id, db)
    update_data = question_in.model_dump(exclude_unset=True)

    resulting_type = update_data.get("question_type", question.question_type)
    resulting_options = update_data.get("options", question.options)
    update_data["options"] = validate_options(resulting_type, resulting_options)

    requested_order = update_data.pop("display_order", None)
    if requested_order is not None and requested_order != question.display_order:
        question_count = db.query(models.Question).filter(
            models.Question.form_id == question.form_id
        ).count()
        new_order = min(requested_order, question_count)

        if new_order < question.display_order:
            db.query(models.Question).filter(
                models.Question.form_id == question.form_id,
                models.Question.display_order >= new_order,
                models.Question.display_order < question.display_order,
            ).update(
                {models.Question.display_order: models.Question.display_order + 1},
                synchronize_session=False,
            )
        else:
            db.query(models.Question).filter(
                models.Question.form_id == question.form_id,
                models.Question.display_order > question.display_order,
                models.Question.display_order <= new_order,
            ).update(
                {models.Question.display_order: models.Question.display_order - 1},
                synchronize_session=False,
            )
        question.display_order = new_order

    for field, value in update_data.items():
        setattr(question, field, value)

    question.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(question)
    return question


@router.delete("/questions/{question_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_question(question_id: int, db: Session = Depends(get_db)):
    question = get_question_or_404(question_id, db)
    form_id = question.form_id
    deleted_order = question.display_order

    db.delete(question)
    db.query(models.Question).filter(
        models.Question.form_id == form_id,
        models.Question.display_order > deleted_order,
    ).update(
        {models.Question.display_order: models.Question.display_order - 1},
        synchronize_session=False,
    )
    db.commit()
    return Response(status_code=status.HTTP_204_NO_CONTENT)
