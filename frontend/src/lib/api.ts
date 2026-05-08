import type {
  PredictResponse,
  BatchPredictResponse,
  FeedbackRequest,
  FeedbackResponse,
  HealthResponse,
  StatsResponse,
  RecentPrediction,
} from "./types";

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:8000";

async function request<T>(
  endpoint: string,
  options?: RequestInit
): Promise<T> {
  const res = await fetch(`${API_BASE}${endpoint}`, {
    headers: { "Content-Type": "application/json" },
    ...options,
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.detail || `Request failed: ${res.status}`);
  }

  return res.json() as Promise<T>;
}

// ── Single Prediction ──
export function predict(review: string) {
  return request<PredictResponse>("/predict", {
    method: "POST",
    body: JSON.stringify({ review }),
  });
}

// ── Batch Prediction ──
export function batchPredict(reviews: string[]) {
  return request<BatchPredictResponse>("/batch_predict", {
    method: "POST",
    body: JSON.stringify({ reviews }),
  });
}

// ── Feedback ──
export function submitFeedback(data: FeedbackRequest) {
  return request<FeedbackResponse>("/feedback", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

// ── Stats ──
export function getStats() {
  return request<StatsResponse>("/stats");
}

// ── Recent Predictions ──
export function getRecent(limit = 20) {
  return request<RecentPrediction[]>(`/recent?limit=${limit}`);
}

// ── Health Check ──
export function healthCheck() {
  return request<HealthResponse>("/health");
}
