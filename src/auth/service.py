from uuid import UUID
from sqlalchemy.orm import Session
from fastapi import HTTPException
from typing import Union, Optional

# modules
from src.schema import UserCreate, User, Token
from src import models
from src.utils import *

def register_user(db: Session, user: UserCreate):

    query = db.query(models.User).filter(models.User.email == user.email).first()

    if query:
        raise HTTPException(status_code=400, detail="Email already exists")

    hash_pass = hash_password(user.password)

    db_user = models.User(email=user.email, password_hash=hash_pass)
    db.add(db_user)
    db.commit()
    db.refresh(db_user)

    return {
        "message": "User Created Successfully",
        "status_code": 200,
    }

def login_user(db: Session, user: UserCreate):
    query = db.query(models.User).filter(models.User.email == user.email).first()

    if query is None:
        raise HTTPException(status_code=400, detail="Invalid Email")

    if not verify_password(user.password, query.password_hash):
        raise HTTPException(status_code=400, detail="Invalid Password")

    access = create_access_token(query.id, [query.email])
    refresh = refresh_token(query.id)

    return Token(access_token=access, refresh_token=refresh)

def get_all_users(db: Session, user: Optional[UUID] = None):
    if user is not None:
        user = db.query(models.User).filter(models.User.id == user).first()
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
        return {
            "message": "User Found",
            "data": User.model_validate(user),
            "status_code": 200
        }

    result = db.query(models.User).all()
    return {
        "message": "All Users",
        "data": [User.model_validate(user) for user in result],
        "status_code": 200
    }