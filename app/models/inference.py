import json
from transformers import pipeline
from app.core.config import settings

class SentimentModel:
    def __init__(self):
        self.model_path = settings.MODEL_PATH
        self.label_map_path = settings.LABEL_MAP_PATH
        self.device = settings.DEVICE
        self.max_length = settings.MAX_LENGTH
        self.pipeline = pipeline(
            "text-classification",
            model=self.model_path,
            tokenizer=self.model_path,
            device=self.device,
            max_length=self.max_length,
            truncation=True,
            padding=True
        )
        self.label_map = self._load_label_map()

    def _load_label_map(self):
        with open(self.label_map_path, "r", encoding="utf-8") as f:
            return json.load(f)

    def predict(self, text: str) -> dict:
        result = self.pipeline(text)[0]
        sentiment = self.label_map.get(str(result["label"]), result["label"]).lower()
        confidence = result["score"]
        return {"sentiment": sentiment, "confidence": confidence}

    def predict_batch(self, texts: list[str]) -> list[dict]:
        results = self.pipeline(texts)
        return [
            {
                "sentiment": self.label_map.get(str(result["label"]), result["label"]).lower(),
                "confidence": result["score"]
            }
            for result in results
        ]


# Global model instance
sentiment_model = None

def load_model() -> SentimentModel:
    global sentiment_model
    if sentiment_model is None:
        sentiment_model = SentimentModel()
    return sentiment_model