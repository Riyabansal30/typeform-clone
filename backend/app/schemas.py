from datetime import datetime
from pydantic import BaseModel, field_validator, model_validator
from typing import List, Literal, Optional

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


QuestionType = Literal["short_text", "long_text", "email", "number", "multiple_choice"]


class QuestionCreate(BaseModel):
    text: str
    question_type: QuestionType
    is_required: bool = False
    options: Optional[List[str]] = None

    @field_validator("text")
    @classmethod
    def validate_text(cls, value: str):
        if not value.strip():
            raise ValueError("Question text cannot be blank")
        return value.strip()

    @model_validator(mode="after")
    def validate_options(self):
        if self.question_type == "multiple_choice":
            if not self.options or len(self.options) < 2:
                raise ValueError("Multiple-choice questions require at least two options")
            cleaned_options = [option.strip() for option in self.options]
            if any(not option for option in cleaned_options):
                raise ValueError("Multiple-choice options cannot be blank")
            self.options = cleaned_options
        elif self.options is not None:
            raise ValueError("Options are only allowed for multiple-choice questions")
        return self


class QuestionUpdate(BaseModel):
    text: Optional[str] = None
    question_type: Optional[QuestionType] = None
    is_required: Optional[bool] = None
    display_order: Optional[int] = None
    options: Optional[List[str]] = None

    @field_validator("text")
    @classmethod
    def validate_text(cls, value: Optional[str]):
        if value is not None and not value.strip():
            raise ValueError("Question text cannot be blank")
        return value.strip() if value is not None else value

    @field_validator("display_order")
    @classmethod
    def validate_display_order(cls, value: Optional[int]):
        if value is not None and value < 1:
            raise ValueError("Display order must be at least 1")
        return value


class QuestionResponse(BaseModel):
    id: int
    form_id: int
    text: str
    question_type: QuestionType
    is_required: bool
    display_order: int
    options: Optional[List[str]] = None
    created_at: datetime
    updated_at: datetime

    model_config = {
        "from_attributes": True
    }


class PublicFormResponse(BaseModel):
    id: int
    title: str
    description: Optional[str] = None
    thank_you_message: str
    public_slug: str
    questions: List[QuestionResponse]


class AnswerInput(BaseModel):
    question_id: int
    value: str


class SubmissionCreate(BaseModel):
    answers: List[AnswerInput]


class SubmissionResponse(BaseModel):
    id: int
    submitted_at: datetime
    thank_you_message: str
