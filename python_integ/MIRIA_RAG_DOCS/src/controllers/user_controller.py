from fastapi import APIRouter, status, Depends
from uuid import UUID

from ..config.core import DbSession
from ..schema import user_schema as model
from ..services import user_service as service
from ..services.auth_service import CurrentUser

router = APIRouter(
    prefix="/users",
    tags=["Users"]
)

@router.get("/me", response_model=model.UserResponse)
def get_current_user_endpoint(current_user: CurrentUser, db: DbSession):
    return service.get_user_by_id(db, current_user.get_uuid())

@router.put("/change-password", status_code=status.HTTP_200_OK)
def change_password(
    password_change: model.PasswordChange,
    db: DbSession,
    current_user: CurrentUser
):
    service.change_password(db, current_user.get_uuid(), password_change)
