from fastapi import FastAPI, HTTPException, Query, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional, Dict, Any, Set
import pandas as pd
import json
import os
from dotenv import load_dotenv
from fastapi_utils.tasks import repeat_every
import asyncio
from datetime import datetime, timedelta
import logging

from models.stock_data import get_stock_data, prepare_data, train_model
from models.ml_models import (
    moving_average_forecast,
    linear_regression_forecast,
    knn_forecast,
    auto_arima_forecast,
    prophet_forecast,
    lstm_forecast
)
from models.sentiment_analysis import analyze_stocks_sentiment, get_all_bist_sentiment, SentimentAnalyzer
from models.predictor import StockPredictor

# Load environment variables
load_dotenv()

# Initialize FastAPI app
app = FastAPI(title="Stock Prediction API")
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # For production, replace with specific origins
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Cache for sentiment analysis results
SENTIMENT_CACHE: Dict[str, Dict] = {}
PREDICTION_CACHE: Dict[str, Dict] = {}

# BIST hisselerinin listesi ve şirket adları
BIST_STOCKS = {
    "ACSEL.IS": "Acıselsan Acıpayam Selüloz Sanayi ve Ticaret A.Ş.",
    "ADEL.IS": "Adel Kalemcilik Ticaret ve Sanayi A.Ş.",
    "ADESE.IS": "Adese Alışveriş Merkezleri Ticaret A.Ş.",
    "AEFES.IS": "Anadolu Efes Biracılık ve Malt Sanayii A.Ş.",
    "AFYON.IS": "Afyon Çimento Sanayi T.A.Ş.",
    "AGESA.IS": "AgeSA Hayat ve Emeklilik A.Ş.",
    "AGHOL.IS": "AG Anadolu Grubu Holding A.Ş.",
    "AGYO.IS": "Atakule Gayrimenkul Yatırım Ortaklığı A.Ş.",
    "AKBNK.IS": "Akbank T.A.Ş.",
    "AKCNS.IS": "Akçansa Çimento Sanayi ve Ticaret A.Ş.",
    "AKENR.IS": "Akenerji Elektrik Üretim A.Ş.",
    "AKFGY.IS": "Akfen Gayrimenkul Yatırım Ortaklığı A.Ş.",
    "AKGRT.IS": "Aksigorta A.Ş.",
    "AKSA.IS": "Aksa Akrilik Kimya Sanayii A.Ş.",
    "AKSEN.IS": "Aksa Enerji Üretim A.Ş.",
    "ALARK.IS": "Alarko Holding A.Ş.",
    "ALBRK.IS": "Albaraka Türk Katılım Bankası A.Ş.",
    "ANACM.IS": "Anadolu Cam Sanayii A.Ş.",
    "ARCLK.IS": "Arçelik A.Ş.",
    "ASELS.IS": "Aselsan Elektronik Sanayi ve Ticaret A.Ş.",
    "BIMAS.IS": "BİM Birleşik Mağazalar A.Ş.",
    "DOHOL.IS": "Doğan Şirketler Grubu Holding A.Ş.",
    "EKGYO.IS": "Emlak Konut Gayrimenkul Yatırım Ortaklığı A.Ş.",
    "ENKAI.IS": "ENKA İnşaat ve Sanayi A.Ş.",
    "EREGL.IS": "Ereğli Demir ve Çelik Fabrikaları T.A.Ş.",
    "FROTO.IS": "Ford Otomotiv Sanayi A.Ş.",
    "GARAN.IS": "Türkiye Garanti Bankası A.Ş.",
    "GUBRF.IS": "Gübre Fabrikaları T.A.Ş.",
    "HALKB.IS": "Türkiye Halk Bankası A.Ş.",
    "ISCTR.IS": "Türkiye İş Bankası A.Ş.",
    "KCHOL.IS": "Koç Holding A.Ş.",
    "KOZAA.IS": "Koza Anadolu Metal Madencilik İşletmeleri A.Ş.",
    "KOZAL.IS": "Koza Altın İşletmeleri A.Ş.",
    "KRDMD.IS": "Kardemir Karabük Demir Çelik Sanayi ve Ticaret A.Ş.",
    "PETKM.IS": "Petkim Petrokimya Holding A.Ş.",
    "PGSUS.IS": "Pegasus Hava Taşımacılığı A.Ş.",
    "SAHOL.IS": "Hacı Ömer Sabancı Holding A.Ş.",
    "SISE.IS": "Türkiye Şişe ve Cam Fabrikaları A.Ş.",
    "TAVHL.IS": "TAV Havalimanları Holding A.Ş.",
    "TCELL.IS": "Turkcell İletişim Hizmetleri A.Ş.",
    "THYAO.IS": "Türk Hava Yolları A.O.",
    "TKFEN.IS": "Tekfen Holding A.Ş.",
    "TOASO.IS": "Tofaş Türk Otomobil Fabrikası A.Ş.",
    "TTKOM.IS": "Türk Telekomünikasyon A.Ş.",
    "TUPRS.IS": "Türkiye Petrol Rafinerileri A.Ş.",
    "VAKBN.IS": "Türkiye Vakıflar Bankası T.A.O.",
    "VESTL.IS": "Vestel Elektronik Sanayi ve Ticaret A.Ş.",
    "YKBNK.IS": "Yapı ve Kredi Bankası A.Ş."
}

# Input models
class PredictionRequest(BaseModel):
    symbol: str
    time_horizon: int = 7
    model_type: str = "random_forest"

class ForecastRequest(BaseModel):
    symbols: List[str]
    time_horizon: int = 7
    model_type: str = "random_forest"

class SentimentRequest(BaseModel):
    symbols: List[str]
    force_refresh: bool = False

class WebSocketSubscription(BaseModel):
    action: str  # "subscribe" veya "unsubscribe"
    symbols: List[str]

# Model ve analizör başlatma
predictor = StockPredictor()
sentiment_analyzer = SentimentAnalyzer()

# WebSocket bağlantı yöneticisi
class ConnectionManager:
    def __init__(self):
        self.active_connections: List[WebSocket] = []
        self.subscriptions: Dict[WebSocket, Set[str]] = {}
        
    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.append(websocket)
        self.subscriptions[websocket] = set()
        
    def disconnect(self, websocket: WebSocket):
        self.active_connections.remove(websocket)
        if websocket in self.subscriptions:
            del self.subscriptions[websocket]
            
    def subscribe(self, websocket: WebSocket, symbols: List[str]):
        if websocket in self.subscriptions:
            for symbol in symbols:
                self.subscriptions[websocket].add(symbol)
                
    def unsubscribe(self, websocket: WebSocket, symbols: List[str]):
        if websocket in self.subscriptions:
            for symbol in symbols:
                if symbol in self.subscriptions[websocket]:
                    self.subscriptions[websocket].remove(symbol)
                    
    async def broadcast_to_subscribers(self, symbol: str, message: str):
        for connection, symbols in self.subscriptions.items():
            if symbol in symbols or "*" in symbols:  # "*" tüm hisselere abone olmak anlamına gelir
                try:
                    await connection.send_text(message)
                except Exception as e:
                    logger.error(f"Broadcast error: {e}")

manager = ConnectionManager()

@app.on_event("startup")
@repeat_every(seconds=60 * 60 * 3)  # Run every 3 hours
async def update_caches():
    """Önbellekleri periyodik olarak günceller."""
    try:
        await update_sentiment_cache()
        await update_prediction_cache()
    except Exception as e:
        logger.error(f"Cache update error: {e}")

async def update_sentiment_cache():
    """Duygu analizi önbelleğini günceller."""
    logger.info("Updating sentiment cache...")
    try:
        results = await asyncio.to_thread(sentiment_analyzer.get_all_bist_sentiment)
        for symbol, data in results.items():
            SENTIMENT_CACHE[symbol] = {
                **data,
                "analysis_date": datetime.now().isoformat()
            }
        
        # Önemli haber veya değişiklik olan hisseleri belirle ve bildirimleri gönder
        for symbol, data in results.items():
            if symbol in SENTIMENT_CACHE:
                old_recommendation = SENTIMENT_CACHE[symbol].get("recommendation")
                new_recommendation = data.get("recommendation")
                
                # Tavsiye değiştiğinde bildirim gönder
                if old_recommendation != new_recommendation:
                    notification = {
                        "type": "recommendation_change",
                        "symbol": symbol,
                        "company": BIST_STOCKS.get(symbol, symbol),
                        "old_recommendation": old_recommendation,
                        "new_recommendation": new_recommendation,
                        "sentiment": data.get("sentiment"),
                        "timestamp": datetime.now().isoformat()
                    }
                    await manager.broadcast_to_subscribers(
                        symbol, 
                        json.dumps(notification)
                    )
    except Exception as e:
        logger.error(f"Sentiment update error: {e}")

async def update_prediction_cache():
    """Fiyat tahmin önbelleğini günceller."""
    logger.info("Updating prediction cache...")
    try:
        for symbol in BIST_STOCKS.keys():
            try:
                prediction = await asyncio.to_thread(
                    predictor.predict_stock, 
                    symbol, 
                    7, 
                    "random_forest"
                )
                PREDICTION_CACHE[symbol] = {
                    **prediction,
                    "prediction_date": datetime.now().isoformat()
                }
            except Exception as e:
                logger.error(f"Prediction error for {symbol}: {e}")
    except Exception as e:
        logger.error(f"Prediction update error: {e}")

@app.get("/")
async def root():
    return {"message": "Stock Prediction API is running"}

@app.get("/stocks")
async def get_stocks():
    return BIST_STOCKS

@app.post("/predict")
async def predict(request: PredictionRequest):
    try:
        # Önbelleği kontrol et
        cache_key = f"{request.symbol}_{request.model_type}_{request.time_horizon}"
        
        # Tahmin önbelleği kontrolü
        prediction_data = None
        if request.symbol in PREDICTION_CACHE:
            cache_time = datetime.fromisoformat(PREDICTION_CACHE[request.symbol]["prediction_date"])
            if datetime.now() - cache_time < timedelta(hours=12):  # 12 saatten yeni ise
                prediction_data = PREDICTION_CACHE[request.symbol]
        
        # Önbellekte yoksa hesapla
        if not prediction_data:
            prediction_data = await asyncio.to_thread(
                predictor.predict_stock, 
                request.symbol, 
                request.time_horizon, 
                request.model_type
            )
        
        # Duygu analizi için önbelleği kontrol et
        sentiment_data = None
        if request.symbol in SENTIMENT_CACHE:
            cache_time = datetime.fromisoformat(SENTIMENT_CACHE[request.symbol]["analysis_date"])
            if datetime.now() - cache_time < timedelta(hours=12):  # 12 saatten yeni ise
                sentiment_data = SENTIMENT_CACHE[request.symbol]
        
        # Önbellekte yoksa duygu analizini hesapla
        if not sentiment_data:
            sentiment_result = await asyncio.to_thread(
                sentiment_analyzer.get_news_sentiment, 
                request.symbol
            )
            sentiment_data = {
                **sentiment_result,
                "analysis_date": datetime.now().isoformat()
            }
            SENTIMENT_CACHE[request.symbol] = sentiment_data
        
        # Tahmin ve duygu analizini birleştir
        result = {
            **prediction_data,
            "price_recommendation": prediction_data.get("recommendation", "HOLD"),
            "sentiment_recommendation": sentiment_data.get("recommendation", "HOLD"),
            "sentiment": sentiment_data.get("sentiment", 0),
            "sentiment_explanation": sentiment_data.get("sentiment_explanation", ""),
            "articles_analyzed": sentiment_data.get("articles_analyzed", 0),
            "top_headlines": sentiment_data.get("top_headlines", [])
        }
        
        # Final tavsiyeyi belirle (duygu ve fiyat tahminlerini birleştir)
        price_rec = result["price_recommendation"]
        sent_rec = result["sentiment_recommendation"]
        
        if price_rec == sent_rec:
            final_rec = price_rec
        elif price_rec == "HOLD" or sent_rec == "HOLD":
            final_rec = "BUY" if (price_rec == "BUY" or sent_rec == "BUY") else "SELL"
        else:
            # BUY ve SELL çakışırsa, duygu analizine öncelik ver
            final_rec = sent_rec
            
        result["final_recommendation"] = final_rec
        
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/forecast")
async def forecast(request: ForecastRequest):
    results = {}
    for symbol in request.symbols:
        try:
            # Önbelleği kontrol et
            if symbol in PREDICTION_CACHE:
                cache_time = datetime.fromisoformat(PREDICTION_CACHE[symbol]["prediction_date"])
                if datetime.now() - cache_time < timedelta(hours=12):  # 12 saatten yeni ise
                    results[symbol] = PREDICTION_CACHE[symbol]
                    continue
            
            # Önbellekte yoksa hesapla
            prediction = await asyncio.to_thread(
                predictor.predict_stock, 
                symbol, 
                request.time_horizon, 
                request.model_type
            )
            results[symbol] = prediction
            
            # Önbelleğe ekle
            PREDICTION_CACHE[symbol] = {
                **prediction,
                "prediction_date": datetime.now().isoformat()
            }
        except Exception as e:
            results[symbol] = {"error": str(e)}
    
    return results

@app.get("/sentiment")
async def get_all_sentiment(force_refresh: bool = False):
    """Tüm BIST hisseleri için duygu analizi sonuçlarını döndürür"""
    try:
        # Force refresh kontrolü
        if force_refresh:
            await update_sentiment_cache()
        
        # Önbellek boşsa güncelle
        if not SENTIMENT_CACHE:
            await update_sentiment_cache()
        
        # Kategorize edilmiş sonuçları döndür
        buy = []
        sell = []
        hold = []
        
        for symbol, data in SENTIMENT_CACHE.items():
            result = {
                "symbol": symbol,
                "company": BIST_STOCKS.get(symbol, symbol),
                "sentiment": data.get("sentiment", 0),
                "sentiment_explanation": data.get("sentiment_explanation", ""),
                "recommendation": data.get("recommendation", "HOLD"),
                "articles_analyzed": data.get("articles_analyzed", 0),
                "top_headlines": data.get("top_headlines", []),
                "analysis_date": data.get("analysis_date", datetime.now().isoformat())
            }
            
            if result["recommendation"] == "BUY":
                buy.append(result)
            elif result["recommendation"] == "SELL":
                sell.append(result)
            else:
                hold.append(result)
        
        # Duygu puanına göre sırala
        buy.sort(key=lambda x: x["sentiment"], reverse=True)
        sell.sort(key=lambda x: x["sentiment"])
        hold.sort(key=lambda x: abs(x["sentiment"]))
        
        return {
            "buy": buy,
            "sell": sell,
            "hold": hold,
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/sentiment-specific")
async def get_specific_sentiment(request: SentimentRequest):
    """Belirli hisseler için duygu analizi sonuçlarını döndürür"""
    try:
        results = {}
        
        for symbol in request.symbols:
            # Önbelleği kontrol et
            if not request.force_refresh and symbol in SENTIMENT_CACHE:
                cache_time = datetime.fromisoformat(SENTIMENT_CACHE[symbol]["analysis_date"])
                if datetime.now() - cache_time < timedelta(hours=12):  # 12 saatten yeni ise
                    results[symbol] = SENTIMENT_CACHE[symbol]
                    continue
            
            # Önbellekte yoksa veya yenileme isteniyorsa
            sentiment_result = await asyncio.to_thread(
                sentiment_analyzer.get_news_sentiment, 
                symbol
            )
            
            results[symbol] = {
                **sentiment_result,
                "analysis_date": datetime.now().isoformat()
            }
            
            # Önbelleğe ekle/güncelle
            SENTIMENT_CACHE[symbol] = results[symbol]
            
        return results
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/recommendations")
async def get_recommendations(min_confidence: float = 0.2):
    """Güven seviyesine göre alım-satım tavsiyelerini döndürür"""
    try:
        # Önbellek boşsa güncelle
        if not SENTIMENT_CACHE:
            await update_sentiment_cache()
        
        buy = []
        sell = []
        hold = []
        
        for symbol, data in SENTIMENT_CACHE.items():
            sentiment = data.get("sentiment", 0)
            
            # Sadece belirli güven seviyesinin üstündeki tavsiyeleri ekle
            if abs(sentiment) < min_confidence:
                continue
                
            result = {
                "symbol": symbol,
                "company": BIST_STOCKS.get(symbol, symbol),
                "sentiment": sentiment,
                "sentiment_explanation": data.get("sentiment_explanation", ""),
                "recommendation": data.get("recommendation", "HOLD"),
                "articles_analyzed": data.get("articles_analyzed", 0),
                "top_headlines": data.get("top_headlines", [])[:3],  # Sadece en üst 3 başlık
                "analysis_date": data.get("analysis_date", datetime.now().isoformat())
            }
            
            if result["recommendation"] == "BUY":
                buy.append(result)
            elif result["recommendation"] == "SELL":
                sell.append(result)
            else:
                hold.append(result)
        
        # Duygu puanına göre sırala
        buy.sort(key=lambda x: x["sentiment"], reverse=True)
        sell.sort(key=lambda x: x["sentiment"])
        hold.sort(key=lambda x: abs(x["sentiment"]))
        
        return {
            "buy": buy,
            "sell": sell,
            "hold": hold,
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    await manager.connect(websocket)
    try:
        while True:
            data = await websocket.receive_text()
            try:
                message = json.loads(data)
                subscription = WebSocketSubscription(**message)
                
                if subscription.action == "subscribe":
                    manager.subscribe(websocket, subscription.symbols)
                    await websocket.send_text(json.dumps({
                        "type": "subscription_success",
                        "message": f"Abonelik başarılı: {', '.join(subscription.symbols)}",
                        "symbols": subscription.symbols
                    }))
                elif subscription.action == "unsubscribe":
                    manager.unsubscribe(websocket, subscription.symbols)
                    await websocket.send_text(json.dumps({
                        "type": "unsubscribe_success",
                        "message": f"Abonelik iptal edildi: {', '.join(subscription.symbols)}",
                        "symbols": subscription.symbols
                    }))
            except Exception as e:
                await websocket.send_text(json.dumps({
                    "type": "error",
                    "message": f"Hata: {str(e)}"
                }))
    except WebSocketDisconnect:
        manager.disconnect(websocket)

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True) 