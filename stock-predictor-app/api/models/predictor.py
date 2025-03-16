import pandas as pd
import numpy as np
from sklearn.ensemble import RandomForestRegressor
from sklearn.preprocessing import StandardScaler
from sklearn.model_selection import train_test_split
from sklearn.metrics import mean_absolute_error
from typing import Dict, Any, Tuple, Optional
import logging
import yfinance as yf

logger = logging.getLogger(__name__)

class StockPredictor:
    """Hisse senedi fiyat tahmini için kullanılan sınıf"""
    
    def __init__(self):
        self.models = {}
        self.scalers = {}
        
    def predict_stock(self, symbol: str, time_horizon: int = 7, model_type: str = "random_forest") -> Dict[str, Any]:
        """
        Verilen sembol için hisse senedi fiyat tahmini yapar.
        
        Args:
            symbol: Hisse senedi sembolü
            time_horizon: Tahmin yapılacak gün sayısı
            model_type: Kullanılacak model tipi
            
        Returns:
            Tahmin sonuçlarını içeren sözlük
        """
        try:
            # Veriyi çek
            df = self._get_stock_data(symbol)
            
            if df.empty:
                return {"error": "Veri bulunamadı"}
                
            # Özellikleri hazırla
            df = self._prepare_features(df)
            
            # Model tipi kontrolü
            if model_type not in ["random_forest", "linear_regression"]:
                model_type = "random_forest"  # Varsayılan model
                
            # Model eğitimi ve tahmin
            prediction, confidence, last_price, historical_data = self._train_and_predict(
                df, symbol, model_type
            )
            
            # Değişim yüzdesini hesapla
            change_percent = ((prediction - last_price) / last_price) * 100
            
            # Tavsiye belirle
            recommendation = self._get_recommendation(change_percent)
            
            return {
                "symbol": symbol,
                "company_name": symbol,  # Daha sonra şirket adı eklenebilir
                "prediction": float(prediction),
                "last_price": float(last_price),
                "change": float(change_percent),
                "confidence": float(confidence),
                "recommendation": recommendation,
                "historical_data": historical_data,
                "model_type": model_type,
                "time_horizon": time_horizon
            }
            
        except Exception as e:
            logger.error(f"Prediction error for {symbol}: {e}")
            return {"error": str(e), "symbol": symbol}
    
    def _get_stock_data(self, symbol: str) -> pd.DataFrame:
        """
        Yahoo Finance'ten hisse senedi verisini çeker
        
        Args:
            symbol: Hisse senedi sembolü
            
        Returns:
            Hisse senedi verisini içeren DataFrame
        """
        # BIST hisseleri için .IS eklenmeli
        if not symbol.endswith('.IS'):
            ticker = f"{symbol}.IS"
        else:
            ticker = symbol
            
        try:
            # Son 2 yıllık veriyi çek
            df = yf.download(ticker, period="2y")
            
            if df.empty:
                logger.warning(f"No data found for {ticker}")
                return pd.DataFrame()
                
            return df
        except Exception as e:
            logger.error(f"Error fetching data for {ticker}: {e}")
            return pd.DataFrame()
    
    def _prepare_features(self, df: pd.DataFrame) -> pd.DataFrame:
        """
        Tahmin için özellikleri hazırlar
        
        Args:
            df: İşlenmemiş hisse senedi verisi
            
        Returns:
            Özellikler eklenmiş DataFrame
        """
        # DataFrame'in kopyasını al
        df_copy = df.copy()
        
        # NaN değerlerini doldur
        df_copy = df_copy.fillna(method='ffill')
        
        # Tarih özelliklerini ekle
        df_copy['Day'] = df_copy.index.day
        df_copy['Month'] = df_copy.index.month
        df_copy['Year'] = df_copy.index.year
        df_copy['DayOfWeek'] = df_copy.index.dayofweek
        
        # Teknik göstergeleri hesapla
        # Hareketli ortalamalar
        df_copy['MA5'] = df_copy['Close'].rolling(window=5).mean()
        df_copy['MA10'] = df_copy['Close'].rolling(window=10).mean()
        df_copy['MA20'] = df_copy['Close'].rolling(window=20).mean()
        df_copy['MA50'] = df_copy['Close'].rolling(window=50).mean()
        
        # Volatilite
        df_copy['Volatility'] = df_copy['Close'].rolling(window=10).std()
        
        # RSI (Relative Strength Index)
        delta = df_copy['Close'].diff()
        gain = delta.where(delta > 0, 0)
        loss = -delta.where(delta < 0, 0)
        avg_gain = gain.rolling(window=14).mean()
        avg_loss = loss.rolling(window=14).mean()
        rs = avg_gain / avg_loss
        df_copy['RSI'] = 100 - (100 / (1 + rs))
        
        # MACD (Moving Average Convergence Divergence)
        ema12 = df_copy['Close'].ewm(span=12, adjust=False).mean()
        ema26 = df_copy['Close'].ewm(span=26, adjust=False).mean()
        df_copy['MACD'] = ema12 - ema26
        df_copy['MACD_Signal'] = df_copy['MACD'].ewm(span=9, adjust=False).mean()
        
        # Bollinger Bantları
        df_copy['BB_Middle'] = df_copy['Close'].rolling(window=20).mean()
        df_copy['BB_Upper'] = df_copy['BB_Middle'] + 2 * df_copy['Close'].rolling(window=20).std()
        df_copy['BB_Lower'] = df_copy['BB_Middle'] - 2 * df_copy['Close'].rolling(window=20).std()
        
        # NaN değerlerini doldur
        df_copy = df_copy.fillna(method='bfill')
        df_copy = df_copy.fillna(0)  # Kalan NaN değerlerini 0 yap
        
        return df_copy
    
    def _train_and_predict(self, df: pd.DataFrame, symbol: str, model_type: str) -> Tuple[float, float, float, Dict[str, float]]:
        """
        Model eğitimi ve tahmin yapma
        
        Args:
            df: Hazırlanmış veri
            symbol: Hisse senedi sembolü
            model_type: Kullanılacak model tipi
            
        Returns:
            Tahmin, güven seviyesi, son fiyat ve geçmiş veri
        """
        # Hedef değişken ve özellikler
        features = df.drop(['Open', 'High', 'Low', 'Close', 'Adj Close', 'Volume'], axis=1)
        target = df['Close']
        
        # Eğitim ve test setlerini ayır - son 30 gün test için
        X_train = features.iloc[:-30]
        X_test = features.iloc[-30:]
        y_train = target.iloc[:-30]
        y_test = target.iloc[-30:]
        
        # Standardizasyon
        scaler = StandardScaler()
        X_train_scaled = scaler.fit_transform(X_train)
        X_test_scaled = scaler.transform(X_test)
        
        # Model eğitimi
        if model_type == "random_forest":
            model = RandomForestRegressor(n_estimators=100, random_state=42)
        else:
            # Varsayılan olarak Random Forest kullanılır
            model = RandomForestRegressor(n_estimators=100, random_state=42)
            
        model.fit(X_train_scaled, y_train)
        
        # Modeli ve ölçekleyiciyi sakla
        self.models[symbol] = model
        self.scalers[symbol] = scaler
        
        # Test verisinde performans değerlendirme
        y_pred = model.predict(X_test_scaled)
        mae = mean_absolute_error(y_test, y_pred)
        accuracy = 1 - (mae / df['Close'].mean())
        
        # Son veri noktasını tahmin et
        last_data = features.iloc[-1:].values
        last_data_scaled = scaler.transform(last_data)
        prediction = model.predict(last_data_scaled)[0]
        
        # Son fiyat
        last_price = df['Close'].iloc[-1]
        
        # Geçmiş veri - son 90 gün
        historical_data = df['Close'].tail(90).to_dict()
        
        return prediction, accuracy, last_price, historical_data
    
    def _get_recommendation(self, change_percent: float) -> str:
        """
        Fiyat değişimi yüzdesine göre tavsiye belirler
        
        Args:
            change_percent: Yüzde değişim
            
        Returns:
            Tavsiye (BUY, SELL, HOLD)
        """
        if change_percent > 5:
            return "BUY"
        elif change_percent < -5:
            return "SELL"
        else:
            return "HOLD" 