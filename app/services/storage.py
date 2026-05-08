import psycopg2
from psycopg2.extras import RealDictCursor
from datetime import datetime, timezone
from app.core.config import settings
from app.core.logger import logger
from contextlib import contextmanager

@contextmanager
def get_connection():
    conn = None
    try:
        conn = psycopg2.connect(
            host=settings.POSTGRES_HOST,
            port=settings.POSTGRES_PORT,
            database=settings.POSTGRES_DB,
            user=settings.POSTGRES_USER,
            password=settings.POSTGRES_PASSWORD
        )
        yield conn
    except psycopg2.Error as e:
        logger.error(f"Database connection error: {e}")
        raise
    finally:
        if conn is not None:
            conn.close()

def init_db():
    with get_connection() as conn:
        cursor = conn.cursor()

        cursor.execute("""
            CREATE TABLE IF NOT EXISTS predictions (
                id SERIAL PRIMARY KEY,
            review TEXT,
            processed_text TEXT,
            sentiment TEXT,
            confidence REAL,
            created_at TEXT
        )
    """)

        cursor.execute("""
            CREATE TABLE IF NOT EXISTS feedback (
                id SERIAL PRIMARY KEY,
                review TEXT,
                predicted_sentiment TEXT,
                is_correct BOOLEAN,
                comment TEXT,
                created_at TIMESTAMPTZ DEFAULT NOW()
            )
        """)

        conn.commit()
        logger.info("Database tables initialized successfully")

def save_prediction(review: str, processed_text: str, sentiment: str, confidence: float):
    with get_connection() as conn:
        cursor = conn.cursor()
        cursor.execute("""
            INSERT INTO predictions (review, processed_text, sentiment, confidence, created_at)
            VALUES (%s, %s, %s, %s, %s)
        """, (review, processed_text, sentiment, confidence, datetime.now(timezone.utc).isoformat()))
        conn.commit()

def save_feedback(review: str, predicted_sentiment: str, is_correct: bool, comment: str):
    with get_connection() as conn:
        cursor = conn.cursor()
        cursor.execute("""
            INSERT INTO feedback (review, predicted_sentiment, is_correct, comment, created_at)
            VALUES (%s, %s, %s, %s, %s)
        """, (review, predicted_sentiment, is_correct, comment, datetime.now(timezone.utc).isoformat()))
        conn.commit()

def get_prediction_stats() -> dict:
    with get_connection() as conn:
        cursor = conn.cursor()

        cursor.execute("SELECT COUNT(*) FROM predictions")
        total = cursor.fetchone()[0]

        cursor.execute("SELECT sentiment, COUNT(*) FROM predictions GROUP BY sentiment")
        distribution = dict(cursor.fetchall())

        cursor.execute("SELECT AVG(confidence) FROM predictions")
        avg_confidence = cursor.fetchone()[0] or 0

    return {
        "total_predictions": total,
        "distribution": distribution,
        "average_confidence": round(avg_confidence, 4)
    }

def get_recent_predictions(limit: int = 10) -> list:
    with get_connection() as conn:
        cursor = conn.cursor()
        cursor.execute("""
            SELECT review, processed_text, sentiment, confidence, created_at 
            FROM predictions 
            ORDER BY id DESC 
            LIMIT %s
        """, (limit,))
        rows = cursor.fetchall()

        return [
            {
                "review": row[0],
                "processed_text": row[1],
                "sentiment": row[2],
                "confidence": row[3],
                "created_at": row[4]
            }
            for row in rows
        ]