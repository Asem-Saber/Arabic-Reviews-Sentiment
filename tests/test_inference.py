import pytest
from app.models.inference import SentimentModel, load_model

def test_load_model():
    model = load_model()
    assert model is not None
    assert isinstance(model, SentimentModel)

def test_single_predict():
    model = load_model()
    result = model.predict("هذا المنتج رائع جدا")
    
    assert "sentiment" in result
    assert "confidence" in result
    assert result["sentiment"] in ["positive", "negative"]
    assert 0 <= result["confidence"] <= 1

def test_batch_predict():
    model = load_model()
    texts = [
        "الخدمة ممتازة",
        "المنتج سيء جدا"
    ]
    results = model.predict_batch(texts)
    
    assert len(results) == 2
    for result in results:
        assert "sentiment" in result
        assert "confidence" in result
        assert result["sentiment"] in ["positive", "negative"]
        assert 0 <= result["confidence"] <= 1