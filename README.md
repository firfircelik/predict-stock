<<<<<<< HEAD
# predict-stock
=======
# BIST Stock Prediction Application

This application provides price predictions for stocks listed on Borsa Istanbul (BIST). Using machine learning models and sentiment analysis, it offers future price predictions and investment recommendations for selected stocks.

## Features

- Price predictions for BIST stocks
- Graphical representation based on historical price data
- News sentiment scores through sentiment analysis
- User-friendly web interface
- Multiple stock selection and analysis

## Installation

1. Clone the repository:
   ```
   git clone https://github.com/your-username/bist-stock-prediction.git
   cd bist-stock-prediction
   ```

2. Create and activate a virtual environment:
   ```
   python -m venv venv
   source venv/bin/activate  # For Windows: venv\Scripts\activate
   ```

3. Install required packages:
   ```
   pip install -r requirements.txt
   ```

4. Create a `.env` file and add your News API key:
   ```
   NEWS_API_KEY=your_news_api_key_here
   ```

## Usage

1. Start the application:
   ```
   python app.py
   ```

2. Navigate to `http://localhost:8080` in your browser.

3. Select the stocks you wish to analyze from the interface.

4. Click the "Predict" button to view the results.

## Project Structure

- `app.py`: Main application file, Flask server, and prediction logic
- `utils/sentiment_analysis.py`: Sentiment analysis functions
- `templates/index.html`: Web interface template
- `requirements.txt`: Required Python packages

## Technologies

- Python
- Flask
- yfinance
- scikit-learn
- plotly
- TextBlob
- News API

## Contributing

We welcome contributions! Please open an issue to discuss your changes before submitting a pull request.

## License

This project is licensed under the MIT License. See the `LICENSE` file for more information.
>>>>>>> 20ce4e99 (chore: adding v1 files)
