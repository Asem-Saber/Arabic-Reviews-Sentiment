from fastapi import APIRouter
from app.models.schemas import HealthResponse, StatsResponse
from app.services.storage import get_prediction_stats, get_recent_predictions

router = APIRouter()

@router.get("/health", response_model=HealthResponse)
def health_check():
    return {"status": "ok"}

@router.get("/stats")
def stats():
    return get_prediction_stats()

@router.get("/recent")
def recent_predictions(limit: int = 10):
    return get_recent_predictions(limit)