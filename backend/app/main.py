import sys
import os

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..')))

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
import torch
import torch.nn as nn
from torchvision.models import mobilenet_v3_small
import torchvision.transforms as transforms
from ultralytics import YOLO
import asyncio
import time

from app.api.api import api_router
from app.core.logging_config import setup_logging
from app.services.ml_pipeline import pipeline

setup_logging()

app = FastAPI(
    title="AI Vision Hakaton",
    openapi_url="/docs/openapi.json",
)

app.mount("/media", StaticFiles(directory="media"), name="media")

# Set all CORS enabled origins
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "https://997d9a722301.ngrok-free.app",
        "https://ai-vision-hakaton.vercel.app",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(api_router)

@app.on_event("startup")
async def startup_event():
    """Загрузка моделей при старте приложения"""
    await pipeline.load_all_models()
    print("🚀 FastAPI сервер запущен с загруженными моделями")

@app.get("/health")
async def health_check():
    """Проверка статуса сервера и моделей"""
    return {
        "status": "healthy",
        "models_loaded": bool(pipeline and pipeline.models),
        "loaded_models": list(pipeline.models.keys()) if pipeline else []
    }