import { useState, useEffect } from 'react';
import { 
  Box, 
  Heading, 
  Text,
  Container,
  Spinner,
  Button
} from '@chakra-ui/react';

export default function Home() {
  const [loading, setLoading] = useState(true);
  const [apiStatus, setApiStatus] = useState<'loading' | 'error' | 'success'>('loading');
  const [error, setError] = useState<string | null>(null);

  // Basit bir API kontrol fonksiyonu
  useEffect(() => {
    async function checkApiConnection() {
      try {
        const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://predict-stock-oqy3.onrender.com';
        
        console.log('Checking API connection to:', API_URL);
        
        const response = await fetch(`${API_URL}/stocks`);
        
        if (!response.ok) {
          throw new Error(`API error: ${response.status}`);
        }
        
        const data = await response.json();
        console.log('API response:', data);
        
        setApiStatus('success');
      } catch (err) {
        console.error('API connection error:', err);
        setApiStatus('error');
        setError(err instanceof Error ? err.message : 'API bağlantısı kurulamadı');
      } finally {
        setLoading(false);
      }
    }

    checkApiConnection();
  }, []);

  if (loading) {
    return (
      <Container centerContent py={20}>
        <Spinner size="xl" thickness="4px" speed="0.65s" color="blue.500" />
        <Text mt={4}>Yükleniyor...</Text>
      </Container>
    );
  }

  return (
    <Container maxW="container.lg" py={10}>
      <Heading as="h1" mb={6}>Stock Predictor</Heading>
      
      {apiStatus === 'error' ? (
        <Box p={5} bg="red.50" color="red.800" borderRadius="md" mb={5}>
          <Heading size="md">API bağlantı hatası</Heading>
          <Text mt={3}>{error || 'API sunucusuna bağlanılamadı. Lütfen daha sonra tekrar deneyin.'}</Text>
          <Button mt={4} colorScheme="red" onClick={() => window.location.reload()}>
            Tekrar Dene
          </Button>
        </Box>
      ) : (
        <Box p={5} bg="green.50" color="green.800" borderRadius="md">
          <Heading size="md">API bağlantısı başarılı</Heading>
          <Text mt={3}>Stock Predictor uygulamasına hoş geldiniz!</Text>
          <Text mt={2}>Bu basitleştirilmiş sayfa, temel işlevselliği test etmek için oluşturulmuştur.</Text>
          <Button mt={4} colorScheme="green" onClick={() => window.location.reload()}>
            Tam Uygulamayı Yükle
          </Button>
        </Box>
      )}
      
      <Text mt={10} fontSize="sm" color="gray.500">
        API URL: {process.env.NEXT_PUBLIC_API_URL || 'https://predict-stock-oqy3.onrender.com'}
      </Text>
    </Container>
  );
} 