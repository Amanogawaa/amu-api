from typing import Annotated
from fastapi import APIRouter, Depends, Request
from starlette import status
from sqlalchemy.orm import Session
from ..rate_limiter import limiter
from src.config import SessionLocal
from uuid import UUID

from src.schema import *
from src.auth.service import register_user, login_user, get_all_users

router = APIRouter(
    prefix='/api/v1/auth',
    tags=['auth']
)


def con_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


@router.post("/", status_code=status.HTTP_201_CREATED)
async def create_user(data: UserCreate, db: Session = Depends(con_db)):
    print(data)
    return register_user(db, data)
    

@router.post("/token", response_model=Token)
async def token(data: UserCreate, db: Session = Depends(con_db)):
    return login_user(db, data)

@router.get("/auth/")
async def get_users(db: Session = Depends(con_db)):
    return get_all_users(db)

@router.get("/auth/{user_id}/")
async def get_user(db: Session = Depends(con_db), user_id: UUID | None = None):
    return get_all_users(db, user_id)