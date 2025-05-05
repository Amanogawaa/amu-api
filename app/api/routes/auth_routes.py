from os import environ
from fastapi import APIRouter, Form, HTTPException, Response, Depends
from app.api.controller import auth_controller
from slowapi import Limiter
from slowapi.util import get_remote_address
from app.api.middlewares.auth_middleware import get_current_user
from app.api.models import User

router = APIRouter()

@router.post('/signup')
async def register(user: User):
    return auth_controller.signup(user=user)
    
@router.post('/verify')
async def login(user: User):
    return auth_controller.verify(user=user)

@router.get('/me')
async def get_me(current_user: dict = Depends(get_current_user)):
    """
    Endpoint to retrieve the current authenticated user.
    """
    return {"message": "Current user retrieved successfully", "user": current_user}