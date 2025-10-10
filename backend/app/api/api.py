from fastapi import APIRouter

from app.api.endpoints import auth, analyses
from app.websocket import websocket_endpoint

api_router = APIRouter()
api_router.include_router(auth.router, prefix="/auth", tags=["auth"])
api_router.include_router(analyses.router, prefix="/analyses", tags=["analyses"])


api_router.add_api_websocket_route("/ws", websocket_endpoint)

