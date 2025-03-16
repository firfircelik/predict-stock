import axios from 'axios';
import { Stock, StockPrediction, StockForecast, ModelType, SentimentData, RecommendationResponse } from '@/types';

const api = axios.create({
  baseURL: process.env.API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

export const getStocks = async (): Promise<Record<string, string>> => {
  const { data } = await api.get('/stocks');
  return data;
};

export const predictStocks = async (symbols: string[]): Promise<StockPrediction[]> => {
  const { data } = await api.post('/predict', { symbols });
  return data;
};

export const getForecast = async (
  stockSymbol: string,
  modelType: ModelType,
  days: number = 30
): Promise<StockForecast> => {
  const { data } = await api.post('/forecast', {
    stock_symbol: stockSymbol,
    model_type: modelType,
    days,
  });
  return data;
};

export const getSentiment = async (forceRefresh: boolean = false): Promise<Record<string, SentimentData>> => {
  const { data } = await api.get('/sentiment', {
    params: { force_refresh: forceRefresh }
  });
  return data;
};

export const getSentimentForSymbols = async (
  symbols: string[],
  forceRefresh: boolean = false
): Promise<Record<string, SentimentData>> => {
  const { data } = await api.post('/sentiment-specific', {
    symbols,
    force_refresh: forceRefresh,
  });
  return data;
};

export const getRecommendations = async (
  minConfidence: number = 0.2
): Promise<RecommendationResponse> => {
  const { data } = await api.get('/recommendations', {
    params: { min_confidence: minConfidence }
  });
  return data;
};

export default api; 