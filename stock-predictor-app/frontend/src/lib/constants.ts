import { ModelOption } from '@/types';
import type { RecommendationType, SentimentExplanationType, ModelType } from '@/types';

export const MODEL_OPTIONS: ModelOption[] = [
  {
    value: 'linear_regression' as ModelType,
    label: 'Linear Regression',
    description: 'Basit ve yorumlanabilir model, doğrusal trendlerde etkilidir.'
  },
  {
    value: 'knn' as ModelType,
    label: 'K-Nearest Neighbors',
    description: 'Benzer hisselerin davranışlarından öğrenir.'
  },
  {
    value: 'moving_average' as ModelType,
    label: 'Moving Average',
    description: 'Fiyat dalgalanmalarını düzleştirerek trend belirler.'
  },
  {
    value: 'prophet' as ModelType,
    label: 'Prophet',
    description: 'Facebook tarafından geliştirilen, mevsimsel değişiklikleri yakalayan model.'
  },
  {
    value: 'lstm' as ModelType,
    label: 'LSTM',
    description: 'Derin öğrenme kullanarak karmaşık desenleri tespit eder.'
  },
  {
    value: 'auto_arima' as ModelType,
    label: 'Auto ARIMA',
    description: 'Zaman serisi analizi kullanarak tahminler oluşturur'
  },
  {
    value: 'random_forest' as ModelType,
    label: 'Random Forest',
    description: 'Ensemble öğrenme yöntemi, yüksek doğrulukta tahminler için idealdir.'
  }
];

export const SENTIMENT_COLORS: Record<SentimentExplanationType, string> = {
  'Very Positive': 'green.600',
  'Positive': 'green.400',
  'Neutral': 'blue.400',
  'Negative': 'orange.400',
  'Very Negative': 'red.500',
  'No data': 'gray.400',
  'Error': 'red.400'
};

export const RECOMMENDATION_COLORS: Record<RecommendationType, string> = {
  'BUY': 'green.500',
  'SELL': 'red.500',
  'HOLD': 'yellow.500'
};

export const RECOMMENDATION_ICONS: Record<RecommendationType, string> = {
  'BUY': '📈',
  'SELL': '📉',
  'HOLD': '📊'
}; 