import pandas as pd
import numpy as np
from sklearn.linear_model import LinearRegression
from sklearn.neighbors import KNeighborsRegressor
import statsmodels.api as sm
from prophet import Prophet
from sklearn.preprocessing import StandardScaler
from tensorflow.keras.models import Sequential
from tensorflow.keras.layers import LSTM, Dense, Dropout
from typing import Union, Dict, List

def moving_average_forecast(data: pd.DataFrame, window_size: int = 50) -> pd.Series:
    """
    Compute Moving Average forecast
    
    Args:
        data: DataFrame with stock data
        window_size: Size of the rolling window for moving average
        
    Returns:
        Series with moving average forecast
    """
    ma = data['Close'].rolling(window=window_size).mean()
    return ma

def linear_regression_forecast(data: pd.DataFrame) -> np.ndarray:
    """
    Linear Regression forecast for stock prices
    
    Args:
        data: DataFrame with stock data
    
    Returns:
        Array with forecasted values
    """
    # Create a dataframe with date as ordinal number
    df = data.copy()
    df['Date'] = pd.to_datetime(df.index)
    df['Date_ordinal'] = df['Date'].map(pd.Timestamp.toordinal)
    
    # Create feature and target
    X = df['Date_ordinal'].values.reshape(-1, 1)
    y = df['Close'].values
    
    # Train model
    model = LinearRegression()
    model.fit(X, y)
    
    # Forecast
    last_date = df['Date_ordinal'].iloc[-1]
    future_dates = np.array(range(last_date + 1, last_date + 31))
    forecast = model.predict(future_dates.reshape(-1, 1))
    
    return forecast

def knn_forecast(data: pd.DataFrame, n_neighbors: int = 5) -> np.ndarray:
    """
    k-Nearest Neighbors (KNN) forecast for stock prices
    
    Args:
        data: DataFrame with stock data
        n_neighbors: Number of neighbors
    
    Returns:
        Array with forecasted values
    """
    # Prepare data
    X = np.arange(len(data)).reshape(-1, 1)
    y = data['Close'].values
    
    # Train model
    model = KNeighborsRegressor(n_neighbors=n_neighbors)
    model.fit(X, y)
    
    # Forecast
    last_idx = len(data) - 1
    future_idx = np.array(range(last_idx + 1, last_idx + 31))
    forecast = model.predict(future_idx.reshape(-1, 1))
    
    return forecast

def auto_arima_forecast(data: pd.DataFrame) -> np.ndarray:
    """
    ARIMA forecast for stock prices
    
    Args:
        data: DataFrame with stock data
    
    Returns:
        Array with forecasted values
    """
    # Prepare data
    y = data['Close'].values
    
    # Fit ARIMA model
    model = sm.tsa.ARIMA(y, order=(5, 1, 0))
    model_fit = model.fit()
    
    # Forecast
    forecast = model_fit.forecast(steps=30)
    
    return forecast

def prophet_forecast(data: pd.DataFrame) -> Dict[str, List]:
    """
    Facebook Prophet forecast for stock prices
    
    Args:
        data: DataFrame with stock data
    
    Returns:
        Dictionary with forecasted values and dates
    """
    # Prepare data
    df = data.reset_index()[['Date', 'Close']]
    df.columns = ['ds', 'y']
    
    # Train model
    model = Prophet(daily_seasonality=True)
    model.fit(df)
    
    # Create future dataframe
    future = model.make_future_dataframe(periods=30)
    
    # Forecast
    forecast = model.predict(future)
    
    # Format results for return
    return {
        'dates': forecast['ds'][-30:].dt.strftime('%Y-%m-%d').tolist(),
        'forecast': forecast['yhat'][-30:].tolist(),
        'lower_bound': forecast['yhat_lower'][-30:].tolist(),
        'upper_bound': forecast['yhat_upper'][-30:].tolist()
    }

def lstm_forecast(data: pd.DataFrame, look_back: int = 60) -> np.ndarray:
    """
    LSTM forecast for stock prices
    
    Args:
        data: DataFrame with stock data
        look_back: Number of previous days to use for prediction
    
    Returns:
        Array with forecasted values
    """
    # Prepare data
    df = data.copy()
    dataset = df['Close'].values.reshape(-1, 1)
    
    scaler = StandardScaler()
    scaled_data = scaler.fit_transform(dataset)
    
    # Create sequences
    X, y = [], []
    for i in range(look_back, len(scaled_data)):
        X.append(scaled_data[i-look_back:i, 0])
        y.append(scaled_data[i, 0])
    
    X, y = np.array(X), np.array(y)
    X = np.reshape(X, (X.shape[0], X.shape[1], 1))
    
    # Build LSTM model
    model = Sequential()
    model.add(LSTM(units=50, return_sequences=True, input_shape=(X.shape[1], 1)))
    model.add(Dropout(0.2))
    model.add(LSTM(units=50, return_sequences=False))
    model.add(Dropout(0.2))
    model.add(Dense(units=1))
    
    # Compile and fit
    model.compile(optimizer='adam', loss='mean_squared_error')
    model.fit(X, y, epochs=5, batch_size=32, verbose=0)
    
    # Generate future predictions
    last_sequence = scaled_data[-look_back:].reshape(1, look_back, 1)
    forecasts = []
    
    for _ in range(30):  # Predict 30 days ahead
        next_pred = model.predict(last_sequence)[0]
        forecasts.append(next_pred)
        # Update sequence for next prediction
        last_sequence = np.append(last_sequence[:, 1:, :], 
                                  np.array([[[next_pred]]]), 
                                  axis=1)
    
    # Inverse transform
    forecasts = np.array(forecasts).reshape(-1, 1)
    forecasts = scaler.inverse_transform(forecasts)
    
    return forecasts.flatten() 