from fastapi import FastAPI
from .logging import configure_logging, LogLevels
from .api import register_routes
from .config.core import Base, engine

configure_logging(LogLevels.info)

app = FastAPI()

Base.metadata.create_all(bind=engine)

register_routes(app)

