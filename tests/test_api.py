import pytest
from fastapi.testclient import TestClient
from app.main import app



@pytest.fixture(scope="module")
def client():
    with TestClient(app) as c:
        yield c

def test_health(client):
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json()["status"] == "ok"

def test_predict_valid(client):
    response = client.post(
        "/predict",
        json={"review": "هذا المنتج ممتاز جدا"}
    )
    assert response.status_code == 200
    data = response.json()
    assert "sentiment" in data
    assert "confidence" in data
    assert data["sentiment"] in ["positive", "negative"]
    assert 0 <= data["confidence"] <= 1

def test_predict_empty(client):
    response = client.post(
        "/predict",
        json={"review": ""}
    )
    assert response.status_code == 422  # Validation error

def test_batch_predict(client):
    response = client.post(
        "/batch_predict",
        json={
            "reviews": [
                "الخدمة رائعة",
                "المنتج سيء"
            ]
        }
    )
    assert response.status_code == 200
    data = response.json()
    assert "results" in data
    assert "summary" in data
    assert len(data["results"]) == 2
    assert "average_confidence" in data["summary"]

def test_stats(client):
    response = client.get("/stats")
    assert response.status_code == 200
    data = response.json()
    assert "total_predictions" in data
    assert "distribution" in data

def test_recent(client):
    response = client.get("/recent?limit=5")
    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, list)

def test_feedback(client):
    response = client.post(
        "/feedback",
        json={
            "review": "منتج رائع",
            "predicted_sentiment": "positive",
            "is_correct": True,
            "comment": ""
        }
    )
    assert response.status_code == 200
    assert response.json()["message"] == "Feedback saved successfully"