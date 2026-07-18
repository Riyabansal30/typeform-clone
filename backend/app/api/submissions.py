from typing import List

from fastapi import APIRouter, Depends, HTTPException, Response, status
from sqlalchemy.exc import SQLAlchemyError
from sqlalchemy.orm import Session, selectinload

from app import models, schemas
from app.database import get_db

router = APIRouter()

# Creator authentication and authorization are outside the current assignment MVP.


def get_form_or_404(form_id: int, db: Session):
    form = db.query(models.Form).filter(models.Form.id == form_id).first()
    if not form:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Form not found")
    return form


def load_form_results(form_id: int, db: Session):
    form = get_form_or_404(form_id, db)
    questions = (
        db.query(models.Question)
        .filter(models.Question.form_id == form_id)
        .order_by(models.Question.display_order)
        .all()
    )
    submissions = (
        db.query(models.Submission)
        .options(selectinload(models.Submission.answers))
        .filter(models.Submission.form_id == form_id)
        .order_by(models.Submission.submitted_at.desc(), models.Submission.id.desc())
        .all()
    )
    return form, questions, submissions


@router.get(
    "/forms/{form_id}/submissions",
    response_model=List[schemas.OwnerSubmissionListItem],
)
def get_form_submissions(form_id: int, db: Session = Depends(get_db)):
    _, _, submissions = load_form_results(form_id, db)
    return [
        schemas.OwnerSubmissionListItem(
            id=submission.id,
            submitted_at=submission.submitted_at,
            answer_count=len(submission.answers),
        )
        for submission in submissions
    ]


@router.get(
    "/forms/{form_id}/submissions/{submission_id}",
    response_model=schemas.OwnerSubmissionDetail,
)
def get_form_submission(
    form_id: int,
    submission_id: int,
    db: Session = Depends(get_db),
):
    get_form_or_404(form_id, db)
    submission = db.query(models.Submission).filter(
        models.Submission.id == submission_id,
        models.Submission.form_id == form_id,
    ).first()
    if not submission:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Submission not found")

    questions = (
        db.query(models.Question)
        .filter(models.Question.form_id == form_id)
        .order_by(models.Question.display_order)
        .all()
    )
    answers = db.query(models.Answer).filter(
        models.Answer.submission_id == submission_id
    ).all()
    answers_by_question = {answer.question_id: answer.value for answer in answers}

    return schemas.OwnerSubmissionDetail(
        id=submission.id,
        submitted_at=submission.submitted_at,
        answers=[
            schemas.OwnerAnswerResponse(
                question_id=question.id,
                question_title=question.text,
                question_type=question.question_type,
                value=answers_by_question.get(question.id),
            )
            for question in questions
        ],
    )


@router.get("/forms/{form_id}/results", response_model=schemas.OwnerResultsResponse)
def get_form_results(form_id: int, db: Session = Depends(get_db)):
    form, questions, submissions = load_form_results(form_id, db)
    total_responses = len(submissions)
    answer_maps = {
        submission.id: {
            answer.question_id: answer.value
            for answer in submission.answers
            if answer.value.strip()
        }
        for submission in submissions
    }

    summaries = []
    for question in questions:
        values = [
            answer_maps[submission.id][question.id]
            for submission in submissions
            if question.id in answer_maps[submission.id]
        ]
        answered_count = len(values)
        summary = schemas.QuestionSummary(
            question_id=question.id,
            title=question.text,
            type=question.question_type,
            answered_count=answered_count,
            unanswered_count=total_responses - answered_count,
        )

        if question.question_type in ("number", "rating") and values:
            numbers = [float(value) for value in values]
            summary.minimum = min(numbers)
            summary.maximum = max(numbers)
            summary.average = round(sum(numbers) / len(numbers), 2)

        if question.question_type in ("multiple_choice", "dropdown", "yes_no", "rating"):
            if question.question_type == "yes_no":
                configured_values = ["Yes", "No"]
            elif question.question_type == "rating":
                maximum = int((question.options or ["5"])[0])
                configured_values = [str(value) for value in range(1, maximum + 1)]
            else:
                configured_values = question.options or []

            summary.options = []
            for option in configured_values:
                count = values.count(option)
                percentage = round((count / answered_count) * 100, 2) if answered_count else 0
                summary.options.append(
                    schemas.SummaryOption(value=option, count=count, percentage=percentage)
                )
        summaries.append(summary)

    return schemas.OwnerResultsResponse(
        form=schemas.ResultsForm(id=form.id, title=form.title),
        questions=[
            schemas.ResultsQuestion(
                id=question.id,
                title=question.text,
                type=question.question_type,
                position=question.display_order,
                options=question.options,
            )
            for question in questions
        ],
        submissions=[
            schemas.ResultsSubmission(
                id=submission.id,
                submitted_at=submission.submitted_at,
                answers={
                    str(question_id): value
                    for question_id, value in answer_maps[submission.id].items()
                },
            )
            for submission in submissions
        ],
        summary=schemas.ResultsSummary(
            total_responses=total_responses,
            questions=summaries,
        ),
    )


@router.delete("/forms/{form_id}/submissions", status_code=status.HTTP_204_NO_CONTENT)
def delete_form_submissions(
    form_id: int,
    delete_in: schemas.BulkDeleteSubmissionsRequest,
    db: Session = Depends(get_db),
):
    get_form_or_404(form_id, db)
    submission_ids = delete_in.submission_ids
    matched_ids = {
        row[0]
        for row in db.query(models.Submission.id).filter(
            models.Submission.id.in_(submission_ids),
            models.Submission.form_id == form_id,
        ).all()
    }
    if matched_ids != set(submission_ids):
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Submission not found")

    try:
        db.query(models.Answer).filter(
            models.Answer.submission_id.in_(submission_ids)
        ).delete(synchronize_session=False)
        db.query(models.Submission).filter(
            models.Submission.id.in_(submission_ids),
            models.Submission.form_id == form_id,
        ).delete(synchronize_session=False)
        db.commit()
    except SQLAlchemyError:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to delete submissions",
        )

    return Response(status_code=status.HTTP_204_NO_CONTENT)
