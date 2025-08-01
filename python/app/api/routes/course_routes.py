from os import environ
from fastapi import APIRouter, Form, HTTPException, Response
from app.api.controller import course_controller
from app.api.models import User

router = APIRouter()
    
@router.get('/course')
async def get_c():
    return course_controller.get_course()