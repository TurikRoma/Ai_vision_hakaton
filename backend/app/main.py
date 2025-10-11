from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from app.api.api import api_router
from app.core.logging_config import setup_logging

setup_logging()

app = FastAPI(
    title="AI Vision Hakaton",
    openapi_url="/docs/openapi.json",
)

app.mount("/media", StaticFiles(directory="media"), name="media")

# Set all CORS enabled origins
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(api_router)
