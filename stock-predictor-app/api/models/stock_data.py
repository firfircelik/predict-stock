import yfinance as yf
import pandas as pd
from sklearn.model_selection import train_test_split
from sklearn.ensemble import RandomForestRegressor
from sklearn.preprocessing import StandardScaler
import numpy as np
from typing import Tuple, Dict, Any

def get_stock_data(symbol: str, period: str = '1y') -> pd.DataFrame:
    """
    Fetch stock data for a given symbol
    
    Args:
        symbol: Stock symbol (e.g., "AAPL")
        period: Time period ('1d', '5d', '1mo', '3mo', '6mo', '1y', '2y', '5y', '10y', 'ytd', 'max')
    
    Returns:
        DataFrame with stock data or empty DataFrame if error
    """
    try:
        stock = yf.Ticker(symbol)
        df = stock.history(period=period)
        
        if df.empty:
            return pd.DataFrame()
            
        # Fill missing values
        df.fillna(method='ffill', inplace=True)
        return df
    except Exception as e:
        print(f"Error fetching data for {symbol}: {e}")
        return pd.DataFrame()

def prepare_data(df: pd.DataFrame) -> Tuple[pd.DataFrame, pd.DataFrame, pd.Series, pd.Series]:
    """
    Prepare stock data for machine learning
    
    Args:
        df: DataFrame with stock data
    
    Returns:
        Tuple of (X_train, X_test, y_train, y_test)
    """
    # Create technical indicators
    df['SMA20'] = df['Close'].rolling(window=20).mean()
    df['SMA50'] = df['Close'].rolling(window=50).mean()
    df['SMA200'] = df['Close'].rolling(window=200).mean()
    
    # Relative Strength Index
    delta = df['Close'].diff()
    gain = delta.where(delta > 0, 0)
    loss = -delta.where(delta < 0, 0)
    avg_gain = gain.rolling(window=14).mean()
    avg_loss = loss.rolling(window=14).mean()
    rs = avg_gain / avg_loss
    df['RSI'] = 100 - (100 / (1 + rs))
    
    # MACD
    exp1 = df['Close'].ewm(span=12, adjust=False).mean()
    exp2 = df['Close'].ewm(span=26, adjust=False).mean()
    df['MACD'] = exp1 - exp2
    df['Signal_Line'] = df['MACD'].ewm(span=9, adjust=False).mean()
    
    # Bollinger Bands
    df['BB_Middle'] = df['Close'].rolling(window=20).mean()
    df['BB_Upper'] = df['BB_Middle'] + (df['Close'].rolling(window=20).std() * 2)
    df['BB_Lower'] = df['BB_Middle'] - (df['Close'].rolling(window=20).std() * 2)
    
    # Price ratios
    df['Price_Change'] = df['Close'].pct_change()
    df['Price_Momentum'] = df['Close'] / df['Close'].shift(20)
    
    # Target - next day's closing price
    df['Target'] = df['Close'].shift(-1)
    
    # Drop NaN values
    df = df.dropna()
    
    # Feature columns
    feature_columns = [
        'Open', 'High', 'Low', 'Close', 'Volume', 
        'SMA20', 'SMA50', 'SMA200', 'RSI', 'MACD', 
        'Signal_Line', 'BB_Middle', 'BB_Upper', 'BB_Lower',
        'Price_Change', 'Price_Momentum'
    ]
    
    X = df[feature_columns]
    y = df['Target']
    
    return train_test_split(X, y, test_size=0.2, random_state=42, shuffle=False)

def train_model(X_train: pd.DataFrame, y_train: pd.Series) -> Tuple[RandomForestRegressor, StandardScaler]:
    """
    Train a RandomForestRegressor model
    
    Args:
        X_train: Training features
        y_train: Training target
    
    Returns:
        Tuple of (trained_model, scaler)
    """
    # Standardize features
    scaler = StandardScaler()
    X_train_scaled = scaler.fit_transform(X_train)
    
    # Train model
    model = RandomForestRegressor(
        n_estimators=200, 
        max_depth=10,
        random_state=42,
        n_jobs=-1
    )
    model.fit(X_train_scaled, y_train)
    
    return model, scaler

def get_stock_info(symbol: str) -> Dict[str, Any]:
    """
    Get company information for a stock
    
    Args:
        symbol: Stock symbol
    
    Returns:
        Dictionary with company information
    """
    try:
        stock = yf.Ticker(symbol)
        info = stock.info
        
        return {
            'name': info.get('shortName', 'Unknown'),
            'sector': info.get('sector', 'Unknown'),
            'industry': info.get('industry', 'Unknown'),
            'country': info.get('country', 'Unknown'),
            'website': info.get('website', 'Unknown'),
            'logo': info.get('logo_url', ''),
            'summary': info.get('longBusinessSummary', 'No information available')
        }
    except Exception as e:
        print(f"Error getting info for {symbol}: {e}")
        return {
            'name': symbol,
            'sector': 'Unknown',
            'industry': 'Unknown',
            'country': 'Unknown',
            'website': 'Unknown',
            'logo': '',
            'summary': 'Information could not be retrieved'
        } 