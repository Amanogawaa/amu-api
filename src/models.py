from sqlalchemy import Column, String, Integer, ForeignKey, DateTime, Enum, JSON, Boolean
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.sql import func
import uuid
import enum

Base = declarative_base()

class Difficulty(enum.Enum):
    beginner = "beginner"
    intermediate = "intermediate"
    advanced = "advanced"

class QuestionType(enum.Enum):
    multiple_choice = "multiple_choice"
    short_answer = "short_answer"
    coding = "coding"

class ProgressStatus(enum.Enum):
    started = "started"
    completed = "completed"
    failed = "failed"

class User(Base):
    __tablename__ = "users"
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    email = Column(String, unique=True, nullable=False)
    password_hash = Column(String, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

class Course(Base):
    __tablename__ = "courses"
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    course_id = Column(String, unique=True, nullable=False)
    name = Column(String, nullable=False)
    category = Column(String, nullable=False)  
    level = Column(Enum(Difficulty), nullable=False)
    include_video = Column(Boolean, nullable=False, default=True)  
    course_output = Column(JSONB, nullable=False)
    created_by = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)  
    created_at = Column(DateTime(timezone=True), server_default=func.now())

class Chapter(Base):
    __tablename__ = "chapters"
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    course_id = Column(UUID(as_uuid=True), ForeignKey("courses.id", ondelete="CASCADE"), nullable=False)
    chapter_id = Column(Integer, nullable=False)  
    content = Column(JSONB, nullable=False)  
    video_id = Column(String, nullable=False)  
    created_at = Column(DateTime(timezone=True), server_default=func.now())

class Exercise(Base):
    __tablename__ = "exercises"
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    chapter_id = Column(UUID(as_uuid=True), ForeignKey("chapters.id", ondelete="CASCADE"), nullable=False)
    question = Column(String, nullable=False)
    question_type = Column(Enum(QuestionType), nullable=False)
    options = Column(JSONB)
    correct_answer = Column(String, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

class UserProgress(Base):
    __tablename__ = "user_progress"
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    chapter_id = Column(UUID(as_uuid=True), ForeignKey("chapters.id", ondelete="SET NULL"))
    exercise_id = Column(UUID(as_uuid=True), ForeignKey("exercises.id", ondelete="SET NULL"))
    status = Column(Enum(ProgressStatus), nullable=False)
    score = Column(Integer)
    completed_at = Column(DateTime(timezone=True))
    created_at = Column(DateTime(timezone=True), server_default=func.now())