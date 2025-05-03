from typing import Annotated
from fastapi import APIRouter, Depends, Request
from starlette import status
from sqlalchemy.orm import Session
from ..rate_limiter import limiter
from src.config import SessionLocal
from uuid import UUID

from src.schema import SpaceCreate, Space, SpaceBase
from src.space.service import get_all_spaces, create_space, delete_space

router = APIRouter(
    prefix='/api/v1/space',
    tags=['space']
)


def con_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

@router.get("/")
async def get_spaces(db: Session = Depends(con_db)):
    return get_all_spaces(db)

@router.get("/{space_id}/")
async def get_space(db: Session = Depends(con_db), space_id: UUID | None = None):
    return get_all_spaces(db, space_id)

@router.post("/", status_code=status.HTTP_201_CREATED)
async def space(space: SpaceCreate, db:Session = Depends(con_db)):
    return create_space(db, space)

@router.delete("/{space_id}/", status_code=status.HTTP_204_NO_CONTENT)
async def space(space_id: UUID, db: Session = Depends(con_db)):
    return delete_space(db, space_id)