from os import environ
from fastapi import APIRouter, Form, HTTPException, Response
from app.api.controller import auth_controller
from slowapi import Limiter
from slowapi.util import get_remote_address
from app.api.models import User

router = APIRouter()

@router.post('/signup')
async def register(user: User):
    return auth_controller.signup(user=user)
    
@router.post('/verify')
async def login(user: User):
    return auth_controller.verify(user=user)

