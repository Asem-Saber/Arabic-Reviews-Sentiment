// ── Backend API Types ──

export interface PredictRequest {
  review: string;
}

export interface PredictResponse {
  review: string;
  processed_text: string;
  sentiment: "positive" | "negative";
  confidence: number;
}

export interface BatchPredictRequest {
  reviews: string[];
}

export interface BatchSummary {
  total: number;
  positive: number;
  negative: number;
  average_confidence: number;
}

export interface BatchPredictResponse {
  results: PredictResponse[];
  summary: BatchSummary;
}

export interface FeedbackRequest {
  review: string;
  predicted_sentiment: string;
  is_correct: boolean;
  comment?: string;
}

export interface FeedbackResponse {
  message: string;
}

export interface HealthResponse {
  status: string;
}

export interface StatsResponse {
  total_predictions: number;
  distribution: Record<string, number>;
  average_confidence: number;
}

export interface RecentPrediction {
  review: string;
  processed_text: string;
  sentiment: string;
  confidence: number;
  created_at: string;
}
