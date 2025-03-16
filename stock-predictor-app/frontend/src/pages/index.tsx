// Next.js ile sadece statik HTML içerik döndürelim
export default function Home() {
  return (
    <div style={{
      padding: "20px",
      maxWidth: "800px",
      margin: "0 auto",
      fontFamily: "Arial, sans-serif"
    }}>
      <h1 style={{ 
        fontSize: "24px", 
        marginBottom: "20px",
        color: "#333"
      }}>
        Stock Predictor
      </h1>
      
      <div style={{
        padding: "20px",
        backgroundColor: "#f0fff4",
        borderRadius: "5px",
        marginBottom: "20px",
        border: "1px solid #38a169"
      }}>
        <h2 style={{ fontSize: "18px", marginBottom: "10px", color: "#276749" }}>
          Basit Test Sayfası
        </h2>
        <p style={{ marginBottom: "10px" }}>
          Bu temel bir test sayfasıdır. JavaScript kodları çalışmıyor olabilir, bu nedenle basit HTML kullanıyoruz.
        </p>
        <p>
          Backend API URL: https://predict-stock-oqy3.onrender.com
        </p>
        <button style={{
          backgroundColor: "#38a169",
          color: "white",
          border: "none",
          padding: "8px 16px",
          borderRadius: "4px",
          marginTop: "15px",
          cursor: "pointer"
        }} onClick={() => window.location.reload()}>
          Sayfayı Yenile
        </button>
      </div>
      
      <p style={{ fontSize: "12px", color: "#666", marginTop: "20px" }}>
        Bu sayfa, uygulama sorunlarını gidermek için basit bir test sayfasıdır.
      </p>
    </div>
  );
} 