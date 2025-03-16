# Stock Prediction API

This API provides endpoints for stock prediction using various machine learning models.

## Setup

### Prerequisites

- Python 3.10 or higher
- pip (Python package manager)

### Installation

1. Clone the repository
2. Navigate to the API directory
3. Install dependencies:
```bash
pip install -r requirements.txt
```
4. Create a `.env` file with your API keys:
```
FINNHUB_API_KEY=your_finnhub_api_key_here
```

### Running the API locally

```bash
uvicorn main:app --reload
```

The API will be available at `http://localhost:8000`.

### Running with Docker

```bash
docker build -t stock-predictor-api .
docker run -p 8000:8000 --env-file .env stock-predictor-api
```

## API Endpoints

### GET /
Health check endpoint

### GET /stocks
Returns a list of available BIST stocks

### POST /predict
Predicts stock prices for given symbols

**Payload:**
```json
{
  "symbols": ["AKBNK.IS", "GARAN.IS"]
}
```

### POST /forecast
Forecasts future stock prices using a specified model

**Payload:**
```json
{
  "stock_symbol": "AKBNK.IS",
  "model_type": "lstm",
  "days": 30
}
```

Available model types:
- `moving_average`: Simple moving average
- `linear_regression`: Linear regression
- `knn`: K-Nearest Neighbors
- `auto_arima`: ARIMA
- `prophet`: Facebook Prophet
- `lstm`: Long Short-Term Memory neural network

## License

MIT 