from typing import List
from app.models.preprocessing import clean_text
from app.models.inference import load_model
from app.services.storage import save_prediction

def predict_single(review: str) -> dict:
    original_text = review
    processed_text = clean_text(review)

    if not processed_text:
        raise ValueError("Review is empty after preprocessing.")

    model = load_model()
    result = model.predict(processed_text)

    save_prediction(
        review=original_text,
        processed_text=processed_text,
        sentiment=result["sentiment"],
        confidence=result["confidence"]
    )

    return {
        "review": original_text,
        "processed_text": processed_text,
        "sentiment": result["sentiment"],
        "confidence": round(result["confidence"], 4)
    }

def predict_batch(reviews: List[str]) -> dict:
    processed_reviews = [clean_text(r) for r in reviews]
    valid_pairs = [
        (orig, proc) 
        for orig, proc in zip(reviews, processed_reviews) 
        if proc
    ]

    if not valid_pairs:
        raise ValueError("No valid reviews found after preprocessing.")

    originals = [x[0] for x in valid_pairs]
    processed = [x[1] for x in valid_pairs]

    model = load_model()
    predictions = model.predict_batch(processed)

    results = []
    for orig, proc, pred in zip(originals, processed, predictions):
        save_prediction(
            review=orig,
            processed_text=proc,
            sentiment=pred["sentiment"],
            confidence=pred["confidence"]
        )
        results.append({
            "review": orig,
            "processed_text": proc,
            "sentiment": pred["sentiment"],
            "confidence": round(pred["confidence"], 4)
        })

    positive_count = sum(1 for r in results if r["sentiment"] == "positive")
    negative_count = sum(1 for r in results if r["sentiment"] == "negative")
    average_confidence = round(sum(r["confidence"] for r in results) / len(results), 4)

    return {
        "results": results,
        "summary": {
            "total": len(results),
            "positive": positive_count,
            "negative": negative_count,
            "average_confidence": average_confidence
        }
    }