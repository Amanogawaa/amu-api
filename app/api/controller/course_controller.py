from os import environ
from fastapi import Depends, HTTPException, Response
from app.api.core.logger import setup_logger
from app.api.core.config import supabase
from app.api.middlewares.auth_middleware import get_current_user

logger = setup_logger()

def get_course(current_user: dict = Depends(get_current_user)):
    return 'hello world'