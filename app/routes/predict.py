from fastapi import APIRouter, HTTPException
from app.models.schemas import (
    PredictRequest,
    PredictResponse,
    BatchPredictRequest,
    BatchPredictResponse,
    FeedbackRequest,
    FeedbackResponse
)
from app.services.predictor import predict_single, predict_batch
from app.services.storage import save_feedback
from app.core.logger import logger

router = APIRouter()

@router.post("/predict", response_model=PredictResponse)
def predict(request: PredictRequest):
    try:
        logger.info(f"Received prediction request: {request.review[:50]}...")
        result = predict_single(request.review)
        logger.info(f"Prediction result: {result['sentiment']} ({result['confidence']})")
        return result
    except ValueError as e:
        logger.warning(f"Validation error: {str(e)}")
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error(f"Inference error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Inference error: {str(e)}")

@router.post("/batch_predict", response_model=BatchPredictResponse)
def batch_predict(request: BatchPredictRequest):
    try:
        logger.info(f"Received batch prediction request: {len(request.reviews)} reviews")
        result = predict_batch(request.reviews)
        logger.info(f"Batch prediction completed: {result['summary']}")
        return result
    except ValueError as e:
        logger.warning(f"Validation error: {str(e)}")
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error(f"Batch inference error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Batch inference error: {str(e)}")

@router.post("/feedback", response_model=FeedbackResponse)
def submit_feedback(request: FeedbackRequest):
    try:
        save_feedback(
            review=request.review,
            predicted_sentiment=request.predicted_sentiment,
            is_correct=request.is_correct,
            comment=request.comment or ""
        )
        logger.info(f"Feedback saved: {request.predicted_sentiment} - correct: {request.is_correct}")
        return {"message": "Feedback saved successfully"}
    except Exception as e:
        logger.error(f"Feedback error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error saving feedback: {str(e)}")