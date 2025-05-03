from pydantic import BaseModel, EmailStr, Field,field_validator, ConfigDict
from typing import Optional, List, Dict
from datetime import datetime
from uuid import UUID
from .models import Difficulty, QuestionType, ProgressStatus
from enum import Enum

# Enums for Pydantic
class Difficulty(str, Enum):
    beginner = "beginner"
    intermediate = "intermediate"
    advanced = "advanced"

class QuestionType(str, Enum):
    multiple_choice = "multiple_choice"
    short_answer = "short_answer"
    coding = "coding"

class ProgressStatus(str, Enum):
    started = "started"
    completed = "completed"
    failed = "failed"

# User Schemas
class UserBase(BaseModel):
    email: EmailStr

class UserCreate(UserBase):
    password: str = Field(..., min_length=8)

class User(UserBase):
    id: UUID
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)

# Space Schemas
class SpaceBase(BaseModel):
    name: str = Field(..., min_length=1, max_length=100)
    topic: str = Field(..., min_length=1, max_length=200)
    difficulty: Difficulty

class SpaceCreate(SpaceBase):
    user_id: UUID
    pass

class Space(SpaceBase):
    id: UUID
    user_id: UUID
    created_at: datetime

    class Config:
        orm_mode = True

# Course Schemas
class CourseBase(BaseModel):
    title: str = Field(..., min_length=1, max_length=200)
    description: Optional[str] = None

class CourseCreate(CourseBase):
    pass

class Course(CourseBase):
    id: UUID
    space_id: UUID
    created_at: datetime

    class Config:
        orm_mode = True

# Chapter Schemas
class ChapterBase(BaseModel):
    title: str = Field(..., min_length=1, max_length=200)
    content: str = Field(..., min_length=1)
    order_number: int = Field(..., ge=1)

class ChapterCreate(ChapterBase):
    pass

class Chapter(ChapterBase):
    id: UUID
    course_id: UUID
    created_at: datetime

    class Config:
        orm_mode = True

# Exercise Schemas
class ExerciseBase(BaseModel):
    question: str = Field(..., min_length=1, max_length=500)
    question_type: QuestionType
    options: Optional[Dict[str, str]] = None
    correct_answer: str = Field(..., min_length=1)

    @field_validator("options")
    def validate_options(cls, v, values):
        if "question_type" in values and values["question_type"] == QuestionType.multiple_choice and not v:
            raise ValueError("Options must be provided for multiple_choice questions")
        if v and values.get("question_type") != QuestionType.multiple_choice:
            raise ValueError("Options are only valid for multiple_choice questions")
        return v

class ExerciseCreate(ExerciseBase):
    pass

class Exercise(ExerciseBase):
    id: UUID
    chapter_id: UUID
    created_at: datetime

    class Config:
        orm_mode = True

# UserProgress Schemas
class UserProgressBase(BaseModel):
    status: ProgressStatus
    score: Optional[int] = Field(None, ge=0, le=100)

class UserProgressCreate(UserProgressBase):
    chapter_id: Optional[UUID] = None
    exercise_id: Optional[UUID] = None

    @field_validator("exercise_id")
    def validate_ids(cls, v, values):
        if v and not values.get("chapter_id"):
            raise ValueError("chapter_id must be provided if exercise_id is set")
        return v

class UserProgress(UserProgressBase):
    id: UUID
    user_id: UUID
    chapter_id: Optional[UUID]
    exercise_id: Optional[UUID]
    completed_at: Optional[datetime]
    created_at: datetime

    class Config:
        orm_mode = True

# Nested Schemas for Relationships
class ChapterWithExercises(Chapter):
    exercises: List[Exercise] = []

class CourseWithChapters(Course):
    chapters: List[ChapterWithExercises] = []

class SpaceWithCourse(Space):
    course: Optional[CourseWithChapters] = None

class UserWithSpaces(User):
    spaces: List[SpaceWithCourse] = []

class Token(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"