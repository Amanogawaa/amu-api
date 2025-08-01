from uuid import UUID
from sqlalchemy.orm import Session
from fastapi import HTTPException
from typing import Union, Optional

# modules
from src import models
from src.schema import SpaceCreate, Space, SpaceBase

def get_all_spaces(db: Session, space_id: Optional[UUID] = None)-> Space:
    if space_id:
        space = db.query(models.Space).filter(models.Space.id == space_id).first()
        if not space:
            raise HTTPException(status_code=404, detail="Space not found")
        return {
            "message": "Space Found",
            "data":space,
            "status_code": 200
        }

    result = db.query(models.Space).all()
    return {
        "message": "All Spaces",
        "data": [space for space in result],
        "status_code": 200
    }


def create_space(db:Session, space: SpaceCreate):
    query = db.query(models.Space).filter(models.Space.name == space.name)

    if query.first():
        raise HTTPException(status_code=400, detail="Space already exists")
    
    new_space = models.Space(
        user_id=space.user_id,
        name=space.name,
        topic=space.topic,
        difficulty=space.difficulty
    )

    db.add(new_space)
    db.commit()
    db.refresh(new_space)

    return {
        "message": "Space Created",
        "status_code": 201
    }
    

def delete_space(db: Session, space_id: UUID):
    space = db.query(models.Space).filter(models.Space.id == space_id).first()
    if not space:
        raise HTTPException(status_code=404, detail="Space not found")
    
    db.delete(space)
    db.commit()

    return {
        "message": "Space Deleted",
        "status_code": 200
    }