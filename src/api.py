from fastapi import FastAPI
from src.controllers.auth_contoller import router as auth_router
from src.controllers.user_controller import router as user_router
from src.controllers.rag_controller import router as rag_router
from src.controllers.study_aid import router as study_router

def register_routes(app: FastAPI):
    app.include_router(auth_router)
    app.include_router(user_router)
    app.include_router(rag_router)
    app.include_router(study_router)