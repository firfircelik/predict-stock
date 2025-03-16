// En basit static sayfa
export default function Home() {
  return (
    <>
      <h1>Stock Predictor</h1>
      
      <div className="box">
        <h2>Basit Test Sayfası</h2>
        <p>Bu temel bir test sayfasıdır. Sayfa yapısı basitleştirilmiştir.</p>
        <p>Backend API URL: https://predict-stock-oqy3.onrender.com</p>
        <a href="/" style={{ 
          display: 'inline-block', 
          background: '#38a169',
          color: 'white',
          padding: '8px 16px',
          borderRadius: '4px',
          textDecoration: 'none',
          marginTop: '15px'
        }}>
          Sayfayı Yenile
        </a>
      </div>
      
      <p className="footer">
        Bu sayfa, uygulama sorunlarını gidermek için basit bir test sayfasıdır.
      </p>
    </>
  );
} 