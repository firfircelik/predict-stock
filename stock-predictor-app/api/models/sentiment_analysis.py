import os
import logging
from datetime import datetime, timedelta
from typing import Dict, Any, Optional, List, Tuple
from textblob import TextBlob
import requests
import finnhub
from dotenv import load_dotenv
import concurrent.futures

# Load environment variables
load_dotenv()

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class SentimentAnalyzer:
    """Class for analyzing news sentiment for stocks"""
    
    def __init__(self):
        self.finnhub_key = os.getenv("FINNHUB_API_KEY")
        if not self.finnhub_key:
            logger.warning("FINNHUB_API_KEY not found in environment variables. Sentiment analysis will be limited.")
        else:
            self.finnhub_client = finnhub.Client(api_key=self.finnhub_key)
    
    def get_news_sentiment(self, stock_symbol: str, days: int = 30) -> Optional[Dict[str, Any]]:
        """
        Get sentiment score for a stock based on news articles
        
        Args:
            stock_symbol: Stock symbol
            days: Number of days to look back for news
            
        Returns:
            Dictionary with sentiment score and details, or None if no news found
        """
        if not self.finnhub_key:
            logger.warning(f"Skipping sentiment analysis for {stock_symbol} - no API key")
            return None
            
        end_date = datetime.now()
        start_date = end_date - timedelta(days=days)
        
        try:
            # Remove .IS suffix if present (for BIST stocks)
            clean_symbol = stock_symbol.replace('.IS', '')
            
            # Get news from Finnhub
            finnhub_articles = self.finnhub_client.company_news(
                clean_symbol, 
                _from=start_date.strftime('%Y-%m-%d'), 
                to=end_date.strftime('%Y-%m-%d')
            )
            
            if not finnhub_articles:
                logger.warning(f"No news found for {stock_symbol}")
                return None
                
            logger.info(f"Found {len(finnhub_articles)} news articles for {stock_symbol}")
            
            # Analyze sentiment and return more detailed information
            sentiment_score, articles_analyzed = self._analyze_sentiment(finnhub_articles)
            sentiment_explanation = get_sentiment_explanation(sentiment_score)
            
            # Generate recommendation based on sentiment
            recommendation = self._generate_recommendation_from_sentiment(sentiment_score)
            
            # Extract top headlines
            top_headlines = self._extract_top_headlines(finnhub_articles[:5])
            
            return {
                'symbol': stock_symbol,
                'sentiment': sentiment_score,
                'sentiment_explanation': sentiment_explanation,
                'recommendation': recommendation,
                'articles_analyzed': articles_analyzed,
                'top_headlines': top_headlines,
                'analysis_date': datetime.now().isoformat()
            }
            
        except Exception as e:
            logger.error(f"Error getting news for {stock_symbol}: {e}")
            return None
    
    def _analyze_sentiment(self, articles: list) -> Tuple[float, int]:
        """
        Analyze sentiment from a list of news articles
        
        Args:
            articles: List of articles (dicts with 'headline' and 'summary' keys)
            
        Returns:
            Tuple of (sentiment_score, number_of_articles_analyzed)
        """
        sentiments = []
        articles_analyzed = 0
        
        for article in articles:
            # Combine headline and summary with more weight on the headline
            headline = article.get('headline', '')
            summary = article.get('summary', '')
            
            # Skip empty articles
            if not headline.strip() and not summary.strip():
                continue
                
            # Calculate sentiment with TextBlob (giving headline 2x weight)
            headline_blob = TextBlob(headline)
            summary_blob = TextBlob(summary) if summary else TextBlob("")
            
            headline_sentiment = headline_blob.sentiment.polarity * 2
            summary_sentiment = summary_blob.sentiment.polarity
            
            # Calculate weighted average
            sentiment = (headline_sentiment + summary_sentiment) / 3
            sentiments.append(sentiment)
            articles_analyzed += 1
        
        # Return average sentiment and count of articles analyzed
        return (sum(sentiments) / len(sentiments) if sentiments else 0, articles_analyzed)
    
    def _generate_recommendation_from_sentiment(self, sentiment_score: float) -> str:
        """
        Generate a simple trading recommendation based on sentiment score
        
        Args:
            sentiment_score: Sentiment score between -1 and 1
            
        Returns:
            "BUY", "SELL", or "HOLD" recommendation
        """
        if sentiment_score > 0.3:
            return "BUY"
        elif sentiment_score < -0.2:
            return "SELL"
        else:
            return "HOLD"
            
    def _extract_top_headlines(self, articles: list) -> List[Dict[str, str]]:
        """
        Extract top headlines and their dates from articles
        
        Args:
            articles: List of articles
            
        Returns:
            List of dictionaries with headline and date
        """
        headlines = []
        
        for article in articles:
            headline = article.get('headline', '')
            date_str = article.get('datetime', '')
            source = article.get('source', '')
            url = article.get('url', '')
            
            if headline and date_str:
                try:
                    # Convert Unix timestamp to datetime
                    date = datetime.fromtimestamp(date_str)
                    formatted_date = date.strftime('%Y-%m-%d %H:%M')
                    
                    headlines.append({
                        'headline': headline,
                        'date': formatted_date,
                        'source': source,
                        'url': url
                    })
                except (ValueError, TypeError):
                    # If date conversion fails, just use the headline
                    headlines.append({
                        'headline': headline,
                        'date': 'Unknown',
                        'source': source,
                        'url': url
                    })
        
        return headlines

def analyze_stocks_sentiment(stocks: Dict[str, str], max_workers: int = 10) -> Dict[str, Dict[str, Any]]:
    """
    Analyze sentiment for multiple stocks in parallel
    
    Args:
        stocks: Dictionary with stock symbols as keys
        max_workers: Maximum number of parallel workers
        
    Returns:
        Dictionary with stock symbols as keys and sentiment data as values
    """
    analyzer = SentimentAnalyzer()
    results = {}
    
    # Use ThreadPoolExecutor for parallel processing
    with concurrent.futures.ThreadPoolExecutor(max_workers=max_workers) as executor:
        # Submit all tasks
        future_to_symbol = {
            executor.submit(analyzer.get_news_sentiment, symbol): symbol 
            for symbol in stocks
        }
        
        # Process results as they complete
        for future in concurrent.futures.as_completed(future_to_symbol):
            symbol = future_to_symbol[future]
            try:
                sentiment_data = future.result()
                
                if sentiment_data is not None:
                    results[symbol] = sentiment_data
                else:
                    results[symbol] = {
                        'symbol': symbol,
                        'sentiment': 0,
                        'sentiment_explanation': 'No data',
                        'recommendation': 'HOLD',
                        'articles_analyzed': 0,
                        'top_headlines': [],
                        'analysis_date': datetime.now().isoformat()
                    }
            except Exception as e:
                logger.error(f"Error analyzing sentiment for {symbol}: {e}")
                results[symbol] = {
                    'symbol': symbol,
                    'sentiment': 0,
                    'sentiment_explanation': 'Error',
                    'recommendation': 'HOLD',
                    'articles_analyzed': 0,
                    'top_headlines': [],
                    'analysis_date': datetime.now().isoformat()
                }
    
    return results

def get_sentiment_explanation(score: float) -> str:
    """
    Get textual explanation of sentiment score
    
    Args:
        score: Sentiment score between -1 and 1
        
    Returns:
        Textual explanation of sentiment
    """
    if score > 0.3:
        return "Very Positive"
    elif score > 0.1:
        return "Positive"
    elif score > -0.1:
        return "Neutral"
    elif score > -0.3:
        return "Negative"
    else:
        return "Very Negative"

def get_all_bist_sentiment() -> Dict[str, Dict[str, Any]]:
    """
    Get sentiment analysis for all BIST stocks
    
    Returns:
        Dictionary with results for all stocks
    """
    from main import BIST_STOCKS
    return analyze_stocks_sentiment(BIST_STOCKS) 