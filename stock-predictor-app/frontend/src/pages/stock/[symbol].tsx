import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { 
  Box, 
  Heading, 
  Text, 
  VStack, 
  Tabs, 
  TabList, 
  Tab, 
  TabPanels, 
  TabPanel,
  Button,
  Grid,
  GridItem,
  Flex,
  Stat,
  StatLabel,
  StatNumber,
  StatHelpText,
  StatArrow,
  Spinner
} from '@chakra-ui/react';
import Layout from '@/components/Layout';
import StockChart from '@/components/StockChart';
import { getForecast } from '@/lib/api';
import { ModelType, StockForecast } from '@/types';
import { MODEL_OPTIONS } from '@/lib/constants';

export default function StockDetail() {
  const router = useRouter();
  const { symbol } = router.query;
  
  const [forecast, setForecast] = useState<StockForecast | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedModel, setSelectedModel] = useState<ModelType>('moving_average');

  const fetchForecast = async () => {
    if (!symbol || typeof symbol !== 'string') return;
    
    try {
      setIsLoading(true);
      setError(null);
      
      const data = await getForecast(symbol, selectedModel);
      setForecast(data);
    } catch (err) {
      console.error('Error fetching forecast:', err);
      setError('Tahmin verileri alınamadı. Lütfen daha sonra tekrar deneyin.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (symbol) {
      fetchForecast();
    }
  }, [symbol, selectedModel]);

  const handleModelChange = (modelType: ModelType) => {
    setSelectedModel(modelType);
  };

  if (!symbol) {
    return (
      <Layout title="Hisse Yükleniyor...">
        <Box textAlign="center" py={20}>
          <Spinner size="xl" />
          <Text mt={4}>Hisse bilgileri yükleniyor...</Text>
        </Box>
      </Layout>
    );
  }

  return (
    <Layout title={`${symbol} - Detaylı Analiz`}>
      <VStack spacing={6} align="stretch">
        <Box>
          <Heading as="h1" size="xl">
            {symbol} {forecast && `- ${forecast.company_name}`}
          </Heading>
          <Text color="gray.600" mt={2}>
            Detaylı tahmin ve analiz
          </Text>
        </Box>

        <Tabs colorScheme="blue" isLazy>
          <TabList>
            <Tab>Fiyat Tahmini</Tab>
            <Tab>Teknik Göstergeler</Tab>
            <Tab>Şirket Bilgisi</Tab>
          </TabList>

          <TabPanels>
            <TabPanel>
              <VStack spacing={6} align="stretch">
                <Box>
                  <Heading size="md" mb={4}>Tahmin Modeli</Heading>
                  <Flex wrap="wrap" gap={2}>
                    {MODEL_OPTIONS.map(model => (
                      <Button 
                        key={model.value}
                        size="sm"
                        colorScheme={selectedModel === model.value ? 'blue' : 'gray'}
                        onClick={() => handleModelChange(model.value)}
                      >
                        {model.label}
                      </Button>
                    ))}
                  </Flex>
                  <Text fontSize="sm" color="gray.600" mt={2}>
                    {MODEL_OPTIONS.find(m => m.value === selectedModel)?.description}
                  </Text>
                </Box>

                {isLoading ? (
                  <Box textAlign="center" py={10}>
                    <Spinner />
                    <Text mt={2}>Tahmin yükleniyor...</Text>
                  </Box>
                ) : error ? (
                  <Box p={4} borderWidth="1px" borderRadius="md" bg="red.50">
                    <Text color="red.500">{error}</Text>
                  </Box>
                ) : forecast ? (
                  <Box p={4} borderWidth="1px" borderRadius="md" bg="white">
                    <Heading size="sm" mb={4}>30 Günlük Tahmin</Heading>
                    <Box height="400px">
                      {/* We need a different chart component for forecast data */}
                      {/* <ForecastChart forecast={forecast} /> */}
                      <Text>Tahmin grafiği burada gösterilecek</Text>
                    </Box>
                  </Box>
                ) : null}
              </VStack>
            </TabPanel>

            <TabPanel>
              <VStack spacing={4} align="stretch">
                <Heading size="md">Teknik Göstergeler</Heading>
                <Text>Bu bölümde RSI, MACD, Bollinger Bantları gibi teknik göstergeleri görebilirsiniz.</Text>
                {/* Technical indicators will be added here */}
              </VStack>
            </TabPanel>

            <TabPanel>
              <VStack spacing={4} align="stretch">
                <Heading size="md">Şirket Bilgisi</Heading>
                <Text>Bu bölümde şirket hakkında temel bilgileri görebilirsiniz.</Text>
                {/* Company information will be added here */}
              </VStack>
            </TabPanel>
          </TabPanels>
        </Tabs>
      </VStack>
    </Layout>
  );
} 