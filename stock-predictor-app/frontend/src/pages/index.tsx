import { useState, useEffect } from 'react';
import { 
  Box, 
  Grid, 
  Heading, 
  Text, 
  VStack, 
  SimpleGrid,
  Alert,
  AlertIcon,
  AlertTitle,
  AlertDescription,
  Divider,
  Spinner,
  Tabs,
  TabList,
  Tab,
  TabPanels,
  TabPanel,
  Badge,
  Link,
  Flex
} from '@chakra-ui/react';
import { ExternalLinkIcon } from '@chakra-ui/icons';
import Layout from '@/components/Layout';
import StockSelector from '@/components/StockSelector';
import StockCard from '@/components/StockCard';
import { StockPrediction, ModelType, SentimentData, RecommendationResponse } from '@/types';
import { predictStocks, getRecommendations } from '@/lib/api';
import { SENTIMENT_COLORS, RECOMMENDATION_COLORS, RECOMMENDATION_ICONS } from '@/lib/constants';

export default function Home() {
  const [predictions, setPredictions] = useState<StockPrediction[]>([]);
  const [recommendations, setRecommendations] = useState<RecommendationResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingRecommendations, setIsLoadingRecommendations] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState(0);

  // Fetch recommendations on page load
  useEffect(() => {
    fetchRecommendations();
  }, []);

  const handlePrediction = async (symbols: string[], modelType: ModelType) => {
    try {
      setIsLoading(true);
      setError(null);
      setActiveTab(1); // Switch to results tab after prediction
      
      const results = await predictStocks(symbols);
      setPredictions(results);
    } catch (err) {
      console.error('Error predicting stocks:', err);
      setError('Tahmin sırasında bir hata oluştu. Lütfen daha sonra tekrar deneyin.');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchRecommendations = async () => {
    try {
      setIsLoadingRecommendations(true);
      const results = await getRecommendations(0.2); // 0.2 confidence minimum
      setRecommendations(results);
    } catch (err) {
      console.error('Error fetching recommendations:', err);
    } finally {
      setIsLoadingRecommendations(false);
    }
  };

  const renderRecommendationBadge = (type: 'BUY' | 'SELL' | 'HOLD') => {
    const color = RECOMMENDATION_COLORS[type];
    const icon = RECOMMENDATION_ICONS[type];
    
    return (
      <Badge 
        colorScheme={color.split('.')[0]} 
        fontSize="md" 
        py={1} 
        px={3} 
        borderRadius="full"
      >
        {icon} {type}
      </Badge>
    );
  };

  const renderSentimentData = (data: SentimentData[]) => {
    if (data.length === 0) {
      return (
        <Box p={4} borderWidth="1px" borderRadius="md" bg="gray.50">
          <Text>Bu kategoride tavsiye bulunmamaktadır.</Text>
        </Box>
      );
    }

    return (
      <VStack spacing={4} align="stretch">
        {data.map((item) => (
          <Box 
            key={item.symbol} 
            p={4} 
            borderWidth="1px" 
            borderRadius="md" 
            boxShadow="sm"
            bg="white"
          >
            <Flex justify="space-between" mb={2}>
              <Heading size="sm">{item.symbol}</Heading>
              {renderRecommendationBadge(item.recommendation)}
            </Flex>
            
            <Text fontSize="sm" mb={2}>
              {BIST_STOCKS[item.symbol] || item.symbol}
            </Text>
            
            <Text fontSize="sm" fontWeight="medium" mt={3} mb={1}>
              Duygu Analizi: 
              <Text as="span" color={SENTIMENT_COLORS[item.sentiment_explanation]}>
                {" "}{item.sentiment_explanation}
              </Text>
            </Text>
            
            {item.top_headlines && item.top_headlines.length > 0 && (
              <Box mt={3}>
                <Text fontSize="sm" fontWeight="medium" mb={1}>Son Haberler:</Text>
                <VStack align="stretch" spacing={1}>
                  {item.top_headlines.slice(0, 3).map((headline, idx) => (
                    <Link 
                      key={idx} 
                      href={headline.url} 
                      isExternal 
                      fontSize="sm"
                      color="blue.600"
                    >
                      {headline.headline} <ExternalLinkIcon mx="1px" />
                    </Link>
                  ))}
                </VStack>
              </Box>
            )}
          </Box>
        ))}
      </VStack>
    );
  };

  return (
    <Layout title="BIST Hisse Senedi Tahmin Uygulaması">
      <VStack spacing={8} align="stretch">
        <Box>
          <Heading as="h1" size="xl" mb={2}>
            BIST Hisse Senedi Tahmin Uygulaması
          </Heading>
          <Text color="gray.600">
            Yapay zeka ve makine öğrenmesi kullanarak Borsa İstanbul hisse senetlerinin 
            fiyat hareketlerini tahmin edin ve alım/satım stratejileri oluşturun.
          </Text>
        </Box>

        <Divider />

        <Tabs index={activeTab} onChange={setActiveTab} colorScheme="blue">
          <TabList>
            <Tab>Haber Bazlı Tavsiyeler</Tab>
            <Tab>Özel Tahmin</Tab>
          </TabList>

          <TabPanels>
            {/* News-based Recommendations Tab */}
            <TabPanel>
              <Box>
                <Heading size="md" mb={4}>Haber Analizine Dayalı Tavsiyeler</Heading>
                
                {isLoadingRecommendations ? (
                  <Box textAlign="center" py={10}>
                    <Spinner size="xl" />
                    <Text mt={4}>Tavsiyeler yükleniyor...</Text>
                  </Box>
                ) : recommendations ? (
                  <Grid templateColumns={{ base: '1fr', lg: '1fr 1fr 1fr' }} gap={6}>
                    <Box>
                      <Heading size="sm" mb={3} color="green.500">Al Tavsiyeleri</Heading>
                      {renderSentimentData(recommendations.buy)}
                    </Box>
                    
                    <Box>
                      <Heading size="sm" mb={3} color="red.500">Sat Tavsiyeleri</Heading>
                      {renderSentimentData(recommendations.sell)}
                    </Box>
                    
                    <Box>
                      <Heading size="sm" mb={3} color="yellow.500">Tut Tavsiyeleri</Heading>
                      {renderSentimentData(recommendations.hold)}
                    </Box>
                  </Grid>
                ) : (
                  <Box bg="gray.50" p={6} borderRadius="md" textAlign="center">
                    <Text>
                      Tavsiyeleri yüklerken bir hata oluştu. Lütfen sayfayı yenileyin.
                    </Text>
                  </Box>
                )}
              </Box>
            </TabPanel>

            {/* Custom Prediction Tab */}
            <TabPanel>
              <Grid templateColumns={{ base: '1fr', md: '1fr 2fr' }} gap={8}>
                <Box>
                  <StockSelector onSubmit={handlePrediction} isLoading={isLoading} />
                </Box>
                
                <Box>
                  {error && (
                    <Alert status="error" mb={4}>
                      <AlertIcon />
                      <AlertTitle>Hata!</AlertTitle>
                      <AlertDescription>{error}</AlertDescription>
                    </Alert>
                  )}
                  
                  {isLoading ? (
                    <Box textAlign="center" py={10}>
                      <Spinner size="xl" />
                      <Text mt={4}>Tahminler yapılıyor...</Text>
                    </Box>
                  ) : predictions.length > 0 ? (
                    <VStack spacing={4} align="stretch">
                      <Heading size="md">Tahmin Sonuçları</Heading>
                      <SimpleGrid columns={{ base: 1, lg: 2 }} spacing={4}>
                        {predictions.map((prediction) => (
                          <StockCard key={prediction.symbol} prediction={prediction} />
                        ))}
                      </SimpleGrid>
                    </VStack>
                  ) : (
                    <Box bg="gray.50" p={6} borderRadius="md" textAlign="center">
                      <Text>
                        Tahmin sonuçlarını görmek için önce hisse senetleri seçin.
                      </Text>
                    </Box>
                  )}
                </Box>
              </Grid>
            </TabPanel>
          </TabPanels>
        </Tabs>
      </VStack>
    </Layout>
  );
}

// BIST Stocks dictionary for reference in components
const BIST_STOCKS: Record<string, string> = {
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
}; 