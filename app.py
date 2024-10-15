# Ana uygulama kodu buraya gelecek
import os
from flask import Flask, render_template, request, jsonify
import yfinance as yf
import pandas as pd
from sklearn.model_selection import train_test_split
from sklearn.ensemble import RandomForestRegressor
from sklearn.preprocessing import StandardScaler
import plotly
import plotly.graph_objs as go
import json
from utils.sentiment_analysis import analyze_stocks_sentiment

RECOMMENDATIONS = {
    'tr': {'buy': 'AL', 'hold': 'TUT', 'sell': 'SAT'},
    'en': {'buy': 'BUY', 'hold': 'HOLD', 'sell': 'SELL'},
    'fr': {'buy': 'ACHETER', 'hold': 'CONSERVER', 'sell': 'VENDRE'},
    'de': {'buy': 'KAUFEN', 'hold': 'HALTEN', 'sell': 'VERKAUFEN'}
}

LANGUAGES = ['tr', 'en', 'fr', 'de']

app = Flask(__name__)

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
    "AEFES.IS": "Anadolu Efes Biracılık ve Malt Sanayii A.Ş.",
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

def get_stock_data(symbol, period='1y'):
    stock = yf.Ticker(symbol)
    df = stock.history(period=period)
    return df

def prepare_data(df):
    df['SMA20'] = df['Close'].rolling(window=20).mean()
    df['SMA50'] = df['Close'].rolling(window=50).mean()
    df['Target'] = df['Close'].shift(-1)
    df = df.dropna()
    
    feature_columns = ['Open', 'High', 'Low', 'Close', 'Volume', 'SMA20', 'SMA50']
    X = df[feature_columns]
    y = df['Target']
    
    return train_test_split(X, y, test_size=0.2, random_state=42)

def train_model(X_train, y_train):
    scaler = StandardScaler()
    X_train_scaled = scaler.fit_transform(X_train)
    
    model = RandomForestRegressor(n_estimators=100, random_state=42)
    model.fit(X_train_scaled, y_train)
    
    return model, scaler

@app.route('/')
def index():
    return render_template('index.html', stocks=BIST_STOCKS)

@app.route('/api/predict', methods=['POST'])
def predict():
    data = request.json
    symbols = data['symbols']
    lang = data.get('language', 'tr')  # Default to Turkish if not specified
    if lang not in LANGUAGES:
        lang = 'tr'  # Default to Turkish if invalid language is provided

    results = []

    sentiment_results = analyze_stocks_sentiment(BIST_STOCKS)

    for symbol in symbols:
        df = get_stock_data(symbol)
        
        if df.empty:
            results.append({'symbol': symbol, 'error': 'Veri alınamadı.'})
            continue
        
        X_train, X_test, y_train, y_test = prepare_data(df)
        model, scaler = train_model(X_train, y_train)
        
        last_data = X_test.iloc[-1:].copy()
        last_data_scaled = scaler.transform(last_data)
        prediction = model.predict(last_data_scaled)[0]
        
        last_price = df['Close'].iloc[-1]
        change_percent = ((prediction - last_price) / last_price) * 100
        
        if change_percent > 3:
            recommendation = RECOMMENDATIONS[lang]['buy']
        elif change_percent < -3:
            recommendation = RECOMMENDATIONS[lang]['sell']
        else:
            recommendation = RECOMMENDATIONS[lang]['hold']
        
        fig = go.Figure()
        fig.add_trace(go.Scatter(x=df.index, y=df['Close'], mode='lines', name='Gerçek Fiyat'))
        fig.add_trace(go.Scatter(x=[df.index[-1], df.index[-1] + pd.Timedelta(days=1)], 
                                 y=[last_price, prediction], 
                                 mode='lines', name='Tahmin', line=dict(dash='dash')))
        
        fig.update_layout(title=f'{symbol} - {BIST_STOCKS[symbol]} Hisse Senedi Fiyat Tahmini',
                          xaxis_title='Tarih',
                          yaxis_title='Fiyat (TRY)',
                          template='plotly_white')
        
        graph_json = json.dumps(fig, cls=plotly.utils.PlotlyJSONEncoder)
        
        sentiment_data = sentiment_results.get(symbol, {})
        
        results.append({
            'symbol': symbol,
            'company_name': BIST_STOCKS[symbol],
            'prediction': prediction,
            'graph': graph_json,
            'last_price': last_price,
            'change': change_percent,
            'recommendation': recommendation,
            'sentiment': sentiment_data.get('sentiment', 0),
            'sentiment_explanation': sentiment_data.get('sentiment_explanation', 'Bilinmiyor')
        })
    
    return jsonify(results)

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=8082, debug=True)