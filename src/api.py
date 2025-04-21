from fastapi import FastAPI
from src.auth.controller import router as auth_router
from src.space.controller import router as space_router

def register_routes(app: FastAPI):
    app.include_router(auth_router)
    app.include_router(space_router)