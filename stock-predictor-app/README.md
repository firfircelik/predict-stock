# BIST Hisse Senedi Tahmin Uygulaması

Bu uygulama, Borsa İstanbul (BIST) hisse senetlerinin fiyat hareketlerini tahmin etmek ve alım/satım stratejileri oluşturmak için çeşitli makine öğrenmesi modellerini kullanır.

![Screenshot](./screenshots/dashboard.png)

## 🚀 Özellikler

- 📈 BIST hisse senetleri için fiyat tahmini
- 📊 Çoklu makine öğrenmesi ve derin öğrenme modelleri
- 📰 Hisse senetleri için duygu analizi (haber ve sosyal medya verilerine dayalı)
- 📱 Mobil uyumlu modern arayüz
- 📆 Çoklu zaman periyotlarında tahmin
- 🔔 Alım-Satım önerileri

## 🔧 Teknolojiler

### Backend
- Python 3.10
- FastAPI
- pandas, numpy, scikit-learn
- TensorFlow/Keras (LSTM)
- Prophet
- yfinance (Yahoo Finance API)
- finnhub-python (Finnhub API)

### Frontend
- Next.js
- TypeScript
- Chakra UI
- Chart.js
- Axios

## 🛠️ Kurulum

### Gereksinimler
- Docker ve Docker Compose
- Finnhub API anahtarı (ücretsiz: [https://finnhub.io/](https://finnhub.io/))

### Çalıştırma

1. Repo'yu klonlayın:
```bash
git clone https://github.com/yourusername/bist-stock-predictor.git
cd bist-stock-predictor
```

2. `.env` dosyasını oluşturun:
```bash
echo "FINNHUB_API_KEY=your_finnhub_api_key" > .env
```

3. Docker Compose ile çalıştırın:
```bash
docker-compose up -d
```

4. Uygulamaya erişin:
- Frontend: http://localhost:3000
- API: http://localhost:8000/docs

## 🤝 Katkıda Bulunma

1. Projeyi fork edin
2. Feature branch oluşturun (`git checkout -b feature/amazing-feature`)
3. Değişikliklerinizi commit edin (`git commit -m 'Add some amazing feature'`)
4. Branch'inizi push edin (`git push origin feature/amazing-feature`)
5. Pull Request oluşturun

## 📝 Lisans

Bu proje MIT lisansı altında lisanslanmıştır - detaylar için [LICENSE](LICENSE) dosyasına bakın.

## ⚠️ Yasal Uyarı

Bu uygulama, yatırım tavsiyesi niteliği taşımaz. Yazılımın kullanımından doğabilecek maddi kayıplardan geliştiriciler sorumlu tutulamaz. Yatırım kararlarınızı tamamen kendi sorumluluğunuzda vermelisiniz.

---

Made with ❤️ in Türkiye 