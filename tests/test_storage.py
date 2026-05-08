import pytest
from app.services import storage

def test_init_db():
    # Should run without error to ensure tables exist
    storage.init_db()

def test_save_prediction():
    # Create a dummy prediction
    review = "test_review_for_storage"
    processed_text = "test_processed"
    sentiment = "positive"
    confidence = 0.987
    
    # Save it to the database
    storage.save_prediction(review, processed_text, sentiment, confidence)
    
    # Fetch recent predictions and verify it exists
    recent = storage.get_recent_predictions(limit=10)
    
    assert len(recent) > 0, "Expected at least one prediction in the database"
    
    # Check if our dummy prediction is in the returned list
    found = any(p["review"] == review and p["sentiment"] == sentiment for p in recent)
    assert found is True, "Failed to find the recently saved prediction"

def test_save_feedback():
    # Create dummy feedback
    review = "test_review_for_storage"
    predicted_sentiment = "positive"
    is_correct = True   
    comment = "Testing storage layer"
    
    # Should run without raising any exceptions
    storage.save_feedback(review, predicted_sentiment, is_correct, comment)

def test_get_prediction_stats():
    # Fetch statistics
    stats = storage.get_prediction_stats()
    
    assert isinstance(stats, dict)
    assert "total_predictions" in stats
    assert "distribution" in stats
    assert "average_confidence" in stats
    
    # Since we explicitly inserted a prediction above, total should be at least 1
    assert stats["total_predictions"] > 0
    
    # Average confidence should be a float
    assert isinstance(stats["average_confidence"], float)
