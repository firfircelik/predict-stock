export interface Stock {
  symbol: string;
  company_name: string;
}

export interface NewsHeadline {
  headline: string;
  date: string;
  source: string;
  url: string;
}

export type RecommendationType = 'BUY' | 'SELL' | 'HOLD';
export type SentimentExplanationType = 'Very Positive' | 'Positive' | 'Neutral' | 'Negative' | 'Very Negative' | 'No data' | 'Error';

export interface StockPrediction {
  symbol: string;
  company_name: string;
  prediction: number;
  last_price: number;
  change: number;
  price_recommendation: RecommendationType;
  sentiment_recommendation: RecommendationType;
  final_recommendation: RecommendationType;
  historical_data: Record<string, number>;
  dates: string[];
  sentiment: number;
  sentiment_explanation: string;
  top_headlines: NewsHeadline[];
  error?: string;
}

export interface StockForecast {
  symbol: string;
  company_name: string;
  forecast: any;
}

export interface SentimentData {
  symbol: string;
  sentiment: number;
  sentiment_explanation: string;
  recommendation: RecommendationType;
  articles_analyzed: number;
  top_headlines: NewsHeadline[];
  analysis_date: string;
}

export interface RecommendationResponse {
  buy: SentimentData[];
  sell: SentimentData[];
  hold: SentimentData[];
}

export type ModelType = 
  | 'moving_average'
  | 'linear_regression'
  | 'knn'
  | 'auto_arima'
  | 'prophet'
  | 'lstm';

export interface ModelOption {
  value: ModelType;
  label: string;
  description: string;
} 