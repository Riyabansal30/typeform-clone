import math
import re
from typing import List

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.exc import SQLAlchemyError
from sqlalchemy.orm import Session

from app import models, schemas
from app.database import get_db

router = APIRouter()
EMAIL_PATTERN = re.compile(r"^[^ @]+@[^ @]+[.][^ @]+$")


def get_published_form(slug: str, db: Session):
    form = db.query(models.Form).filter(
        models.Form.public_slug == slug,
        models.Form.status == "published",
    ).first()
    if not form:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Published form not found")
    return form


@router.get("/public/forms/{slug}", response_model=schemas.PublicFormResponse)
def get_public_form(slug: str, db: Session = Depends(get_db)):
    form = get_published_form(slug, db)
    questions = db.query(models.Question).filter(
        models.Question.form_id == form.id
    ).order_by(models.Question.display_order).all()

    return schemas.PublicFormResponse(
        id=form.id,
        title=form.title,
        description=form.description,
        thank_you_message=form.thank_you_message,
        public_slug=form.public_slug,
        questions=questions,
    )


@router.post(
    "/public/forms/{slug}/submissions",
    response_model=schemas.SubmissionResponse,
    status_code=status.HTTP_201_CREATED,
)
def create_submission(
    slug: str,
    submission_in: schemas.SubmissionCreate,
    db: Session = Depends(get_db),
):
    form = get_published_form(slug, db)
    questions: List[models.Question] = db.query(models.Question).filter(
        models.Question.form_id == form.id
    ).order_by(models.Question.display_order).all()
    questions_by_id = {question.id: question for question in questions}

    provided_answers = {}
    for answer in submission_in.answers:
        if answer.question_id in provided_answers:
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail=f"Duplicate answer for question {answer.question_id}",
            )
        if answer.question_id not in questions_by_id:
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail=f"Question {answer.question_id} does not belong to this form",
            )
        provided_answers[answer.question_id] = answer.value.strip()

    for question in questions:
        value = provided_answers.get(question.id, "")
        if question.is_required and not value:
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail=f"Answer is required for question {question.id}",
            )
        if not value:
            continue

        if question.question_type == "email" and not EMAIL_PATTERN.fullmatch(value):
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail=f"Invalid email for question {question.id}",
            )
        if question.question_type == "number":
            try:
                number_value = float(value)
                if not math.isfinite(number_value):
                    raise ValueError
            except ValueError:
                raise HTTPException(
                    status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                    detail=f"Invalid number for question {question.id}",
                )
        if question.question_type == "multiple_choice" and value not in (question.options or []):
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail=f"Invalid option for question {question.id}",
            )

    submission = models.Submission(form_id=form.id)
    submission.answers = [
        models.Answer(question_id=question_id, value=value)
        for question_id, value in provided_answers.items()
        if value
    ]
    try:
        db.add(submission)
        db.commit()
        db.refresh(submission)
    except SQLAlchemyError:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to save submission",
        )

    return schemas.SubmissionResponse(
        id=submission.id,
        submitted_at=submission.submitted_at,
        thank_you_message=form.thank_you_message,
    )
