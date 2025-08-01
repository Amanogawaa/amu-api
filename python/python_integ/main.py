from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

# api
from src.config import engine
from src.logging import configure_logging, LogLevels
from src.api import register_routes


def init_app() -> FastAPI:
    configure_logging(LogLevels.info)

    app = FastAPI()

    origin = [
        "http://localhost:5173",
        "http://localhost:*",
    ]   


    app.add_middleware(
        CORSMiddleware,
        allow_origins=origin,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    register_routes(app)

    print("Server started")

    return app

app = init_app()

