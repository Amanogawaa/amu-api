from os import environ
from typing import List
from fastapi import FastAPI, Query, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from slowapi import Limiter
from slowapi.errors import RateLimitExceeded
from slowapi.util import get_remote_address
from app.api.core.logger import setup_logger
from app.api.middlewares.auth_middleware import auth_middleware
from app.api.routes import auth_routes, course_routes


logger = setup_logger()

def create_app() -> FastAPI:
    app = FastAPI()

    allowed_origins: List[str] = environ.get("CORS_ORIGINS", "http://localhost,http://localhost:5173").split(",")

    app.add_middleware(
        CORSMiddleware,
        allow_origins=allowed_origins,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )
    app.middleware('http')(auth_middleware)

    app.include_router(router=auth_routes.router, prefix="/api/auth", tags=["auth"])
    app.include_router(router=course_routes.router, prefix="/api/course", tags=["course"])    


    logger.info("Server is running...")

    return app


app = create_app()