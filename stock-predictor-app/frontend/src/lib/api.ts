import axios from 'axios';
import { Stock, StockPrediction, StockForecast, ModelType, SentimentData, RecommendationResponse } from '@/types';

// API URL'yi environment variable'dan al veya varsayılan değeri kullan
const API_URL = process.env.NEXT_PUBLIC_API_URL || process.env.API_URL || 'http://localhost:8000';

console.log('API URL:', API_URL); // Debug için

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Hata işleme için interceptor ekleyelim
api.interceptors.response.use(
  response => response,
  error => {
    console.error('API Error:', error);
    return Promise.reject(error);
  }
);

export const getStocks = async (): Promise<Record<string, string>> => {
  try {
    const { data } = await api.get('/stocks');
    return data;
  } catch (error) {
    console.error('Error fetching stocks:', error);
    return {}; // Boş obje döndür, böylece uygulama çökmez
  }
};

export const predictStocks = async (symbols: string[]): Promise<StockPrediction[]> => {
  try {
    const { data } = await api.post('/predict', { symbols });
    return data;
  } catch (error) {
    console.error('Error predicting stocks:', error);
    return []; // Boş array döndür, böylece uygulama çökmez
  }
};

export const getForecast = async (
  stockSymbol: string,
  modelType: ModelType,
  days: number = 30
): Promise<StockForecast> => {
  try {
    const { data } = await api.post('/forecast', {
      stock_symbol: stockSymbol,
      model_type: modelType,
      days,
    });
    return data;
  } catch (error) {
    console.error('Error getting forecast:', error);
    return { 
      symbol: stockSymbol, 
      company_name: '', 
      forecast: { 
        dates: [], 
        values: [], 
        confidence: 0 
      } 
    }; // Varsayılan değer döndür
  }
};

export const getSentiment = async (forceRefresh: boolean = false): Promise<Record<string, SentimentData>> => {
  try {
    const { data } = await api.get('/sentiment', {
      params: { force_refresh: forceRefresh }
    });
    return data;
  } catch (error) {
    console.error('Error getting sentiment:', error);
    return {}; // Boş obje döndür
  }
};

export const getSentimentForSymbols = async (
  symbols: string[],
  forceRefresh: boolean = false
): Promise<Record<string, SentimentData>> => {
  try {
    const { data } = await api.post('/sentiment-specific', {
      symbols,
      force_refresh: forceRefresh,
    });
    return data;
  } catch (error) {
    console.error('Error getting sentiment for symbols:', error);
    return {}; // Boş obje döndür
  }
};

export const getRecommendations = async (
  minConfidence: number = 0.2
): Promise<RecommendationResponse> => {
  try {
    const { data } = await api.get('/recommendations', {
      params: { min_confidence: minConfidence }
    });
    return data;
  } catch (error) {
    console.error('Error getting recommendations:', error);
    return { buy: [], sell: [], hold: [] }; // Varsayılan değer döndür
  }
};

export default api; 