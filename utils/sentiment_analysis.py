# Duygu analizi fonksiyonları buraya gelecek

import requests
from textblob import TextBlob
from datetime import datetime, timedelta
import os
from dotenv import load_dotenv
import logging
from newsapi import NewsApiClient

load_dotenv()  # .env dosyasından çevre değişkenlerini yükle

class SentimentAnalyzer:
    def __init__(self):
        self.api_key = os.getenv('MARKETAUX_API_KEY')
        if not self.api_key:
            raise ValueError("MARKETAUX_API_KEY bulunamadı. .env dosyanızı kontrol edin.")
        self.base_url = "https://newsapi.org/v2/everything"
        self.newsapi = NewsApiClient(api_key=self.api_key)
        logging.basicConfig(level=logging.INFO)
        self.logger = logging.getLogger(__name__)

    def get_news_sentiment(self, stock_symbol, days=30):  # Süreyi 30 güne çıkardık
        end_date = datetime.now()
        start_date = end_date - timedelta(days=days)
        
        # Şirket adını ve sembolü birlikte kullanarak arama yapma
        company_name = self.get_company_name(stock_symbol)  # Bu fonksiyonu eklemeniz gerekecek
        query = f'"{stock_symbol}" OR "{company_name}"'
        
        try:
            articles = self.newsapi.get_everything(
                q=query,
                from_param=start_date.strftime('%Y-%m-%d'),
                to=end_date.strftime('%Y-%m-%d'),
                language='en,tr',  # İngilizce ve Türkçe haberleri al
                sort_by='relevancy',
            )['articles']
        except Exception as e:
            self.logger.error(f"Haber API'si hatası: {e}")
            return None

        if not articles:
            self.logger.warning(f"{stock_symbol} için haber bulunamadı.")
            return None

        self.logger.info(f"{stock_symbol} için {len(articles)} haber bulundu.")

        sentiments = []
        for article in articles:
            text = article['title'] + ' ' + (article['description'] or '')
            blob = TextBlob(text)
            sentiments.append(blob.sentiment.polarity)
        
        avg_sentiment = sum(sentiments) / len(sentiments) if sentiments else 0
        return avg_sentiment

    def get_company_name(self, stock_symbol):
        from app import BIST_STOCKS
        return BIST_STOCKS.get(stock_symbol, stock_symbol)

def analyze_stocks_sentiment(stocks):
    analyzer = SentimentAnalyzer()
    results = {}

    for symbol in stocks:
        clean_symbol = symbol.replace('.IS', '')
        sentiment = analyzer.get_news_sentiment(clean_symbol)
        if sentiment is not None:
            results[symbol] = {
                'symbol': clean_symbol,
                'sentiment': sentiment,
                'sentiment_explanation': get_sentiment_explanation(sentiment)
            }
        else:
            logging.warning(f"{symbol} için duygu analizi yapılamadı.")
    
    return results

def get_sentiment_explanation(score):
    if score > 0.1:
        return "Pozitif"
    elif score < -0.1:
        return "Negatif"
    else:
        return "Nötr"

# Test
if __name__ == "__main__":
    from app import BIST_STOCKS
    results = analyze_stocks_sentiment(BIST_STOCKS)
    for symbol, data in results.items():
        print(f"{symbol}: Duygu Skoru = {data['sentiment']:.2f}, Açıklama = {data['sentiment_explanation']}")
