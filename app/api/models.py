from pydantic import BaseModel, EmailStr, Field, field_validator
from uuid import UUID
from typing import Dict, Any, Optional
from datetime import datetime


class User(BaseModel):
    email: EmailStr
    password: str 

    @field_validator('password')
    def validate_password(cls, password):
        if len(password) < 8:
            raise ValueError("Password must be at least 8 characters long")
        
        return password
        
class UserResponse(User):
    id: str = Field(..., description="User's unique identifier")


class CourseListCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=255, description="Name of the course")
    category: str = Field(..., min_length=1, max_length=255, description="Category of the course")
    level: str = Field(..., min_length=1, max_length=255, description="Difficulty level of the course")
    include_video: str = Field(default="Yes", min_length=1, max_length=10, description="Whether the course includes videos")
    course_output: Dict[str, Any] = Field(..., description="Course output in JSON format")
    created_by: UUID = Field(..., description="UUID of the user who created the course (from auth.users.id)")
    user_name: Optional[str] = Field(None, max_length=255, description="Name of the user who created the course")
    user_profile_image: Optional[str] = Field(None, max_length=255, description="URL of the user’s profile image")
    course_banner: str = Field(default="/placeholder.png", max_length=255, description="URL of the course banner image")
    publish: bool = Field(default=False, description="Whether the course is published")

class CourseListUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=1, max_length=255)
    category: Optional[str] = Field(None, min_length=1, max_length=255)
    level: Optional[str] = Field(None, min_length=1, max_length=255)
    include_video: Optional[str] = Field(None, min_length=1, max_length=10)
    course_output: Optional[Dict[str, Any]] = None
    user_name: Optional[str] = Field(None, max_length=255)
    user_profile_image: Optional[str] = Field(None, max_length=255)
    course_banner: Optional[str] = Field(None, max_length=255)
    publish: Optional[bool] = None

class CourseList(BaseModel):
    id: int = Field(..., description="Auto-generated ID of the course")
    course_id: int = Field(..., description="Auto-generated ID of the course")
    name: str = Field(..., min_length=1, max_length=255)
    category: str = Field(..., min_length=1, max_length=255)
    level: str = Field(..., min_length=1, max_length=255)
    include_video: str = Field(..., min_length=1, max_length=10)
    course_output: Dict[str, Any] = Field(...)
    created_by: UUID = Field(...)
    user_name: Optional[str] = Field(None, max_length=255)
    user_profile_image: Optional[str] = Field(None, max_length=255)
    course_banner: str = Field(..., max_length=255)
    publish: bool = Field(...)

    class Config:
        from_attributes = True 

class ChapterCreate(BaseModel):
    course_id: int = Field(..., description="Course ID that this chapter belongs to")
    chapter_id: int = Field(..., ge=1, description="Chapter number or identifier")
    content: Dict[str, Any] = Field(..., description="Chapter content in JSON format")
    video_id: str = Field(..., min_length=1, max_length=255, description="ID of the video associated with this chapter")

class ChapterUpdate(BaseModel):
    course_id: Optional[str] = Field(None, min_length=1, max_length=255)
    chapter_id: Optional[int] = Field(None, ge=1)
    content: Optional[Dict[str, Any]] = None
    video_id: Optional[str] = Field(None, min_length=1, max_length=255)

class Chapter(BaseModel):
    id: int = Field(..., description="Auto-generated ID of the chapter")
    course_id: str = Field(..., min_length=1, max_length=255)
    chapter_id: int = Field(..., ge=1)
    content: Dict[str, Any] = Field(...)
    video_id: str = Field(..., min_length=1, max_length=255)

    class Config:
        from_attributes = True