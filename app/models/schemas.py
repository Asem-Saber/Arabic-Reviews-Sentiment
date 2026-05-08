from typing import List, Optional
from pydantic import BaseModel, Field

class PredictRequest(BaseModel):
    review: str = Field(..., min_length=1, description="Arabic review text")

class PredictResponse(BaseModel):
    review: str
    processed_text: str
    sentiment: str
    confidence: float

class BatchPredictRequest(BaseModel):
    reviews: List[str]

class PredictionItem(BaseModel):
    review: str
    processed_text: str
    sentiment: str
    confidence: float

class BatchSummary(BaseModel):
    total: int
    positive: int
    negative: int
    average_confidence: float

class BatchPredictResponse(BaseModel):
    results: List[PredictionItem]
    summary: BatchSummary

class FeedbackRequest(BaseModel):
    review: str
    predicted_sentiment: str
    is_correct: bool
    comment: Optional[str] = None

class FeedbackResponse(BaseModel):
    message: str

class HealthResponse(BaseModel):
    status: str

class StatsResponse(BaseModel):
    total_predictions: int
    distribution: dict

class RecentPredictionItem(BaseModel):
    review: str
    processed_text: str
    sentiment: str
    confidence: float
    created_at: str