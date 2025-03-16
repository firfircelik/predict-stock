import { useEffect, useRef } from 'react';
import { Box } from '@chakra-ui/react';
import { Chart, registerables } from 'chart.js';
import { StockPrediction } from '@/types';

Chart.register(...registerables);

interface StockChartProps {
  prediction: StockPrediction;
}

const StockChart: React.FC<StockChartProps> = ({ prediction }) => {
  const chartRef = useRef<HTMLCanvasElement>(null);
  const chartInstance = useRef<Chart | null>(null);

  useEffect(() => {
    if (chartRef.current) {
      // Önceki chart'ı temizle
      if (chartInstance.current) {
        chartInstance.current.destroy();
      }

      const ctx = chartRef.current.getContext('2d');
      if (!ctx) return;

      // Tarihleri ve fiyatları al
      const dates = Object.keys(prediction.historical_data).slice(-30); // Son 30 gün
      const prices = dates.map(date => prediction.historical_data[date]);

      // Tahmin edilen fiyatı ekle
      const allDates = [...dates];
      
      // Son tarihten bir gün sonrası için tahmin
      const lastDate = new Date(dates[dates.length - 1]);
      const nextDay = new Date(lastDate);
      nextDay.setDate(nextDay.getDate() + 1);
      allDates.push(nextDay.toISOString().split('T')[0]);
      
      const allPrices = [...prices, prediction.prediction];

      const gradientFill = ctx.createLinearGradient(0, 0, 0, 400);
      gradientFill.addColorStop(0, 'rgba(33, 150, 243, 0.3)');  
      gradientFill.addColorStop(1, 'rgba(33, 150, 243, 0.0)');

      // Tahmin noktasının rengi
      const pointColors = allDates.map((_, i) => 
        i === allDates.length - 1 ? 
          prediction.change >= 0 ? '#4CAF50' : '#F44336' // Yeşil veya kırmızı
          : 'rgba(33, 150, 243, 0.7)'
      );

      // Tahmin noktasının boyutu
      const pointRadius = allDates.map((_, i) => 
        i === allDates.length - 1 ? 6 : 3
      );

      chartInstance.current = new Chart(ctx, {
        type: 'line',
        data: {
          labels: allDates.map(date => {
            // Tarih formatını düzelt
            const [year, month, day] = date.split('-');
            return `${day}/${month}`;
          }),
          datasets: [
            {
              label: 'Hisse Fiyatı',
              data: allPrices,
              borderColor: 'rgb(33, 150, 243)',
              backgroundColor: gradientFill,
              pointBackgroundColor: pointColors,
              pointRadius: pointRadius,
              pointHoverRadius: 8,
              tension: 0.3,
              fill: true
            }
          ]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: {
              display: false
            },
            tooltip: {
              callbacks: {
                label: function(context) {
                  const value = context.raw as number;
                  return `₺${value.toFixed(2)}`;
                },
                title: function(tooltipItems) {
                  // Son eleman için özel başlık
                  if (tooltipItems[0].dataIndex === allDates.length - 1) {
                    return `Tahmin: ${tooltipItems[0].label}`;
                  }
                  return tooltipItems[0].label;
                }
              }
            }
          },
          scales: {
            x: {
              grid: {
                display: false
              }
            },
            y: {
              grid: {
                color: 'rgba(0, 0, 0, 0.05)'
              },
              ticks: {
                callback: function(value) {
                  return `₺${value}`;
                }
              }
            }
          }
        }
      });
    }

    return () => {
      if (chartInstance.current) {
        chartInstance.current.destroy();
      }
    };
  }, [prediction]);

  return (
    <Box width="100%" height="100%">
      <canvas ref={chartRef} />
    </Box>
  );
};

export default StockChart; 