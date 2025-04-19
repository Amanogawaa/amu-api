from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

# api
from src.config import engine

app = FastAPI()

def init_app() -> FastAPI:
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

    print("Server started")

    return app

app = init_app()

@app.get("/")
async def root():
    return {"message": "Hello World"}