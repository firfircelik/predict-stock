import '@/styles/globals.css';
import type { AppProps } from 'next/app';
import { ChakraProvider } from '@chakra-ui/react';
import { Box, Text, Heading } from '@chakra-ui/react';
import { useState, useEffect } from 'react';

// Basit hata sınırı bileşeni 
function ErrorBoundary({ children }: { children: React.ReactNode }) {
  const [hasError, setHasError] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const handleError = (error: ErrorEvent) => {
      console.error('Global error caught:', error);
      setError(error.error);
      setHasError(true);
    };

    window.addEventListener('error', handleError);
    return () => window.removeEventListener('error', handleError);
  }, []);

  if (hasError) {
    return (
      <Box p={5} bg="red.50" color="red.800" borderRadius="md" m={5}>
        <Heading size="md">Uygulama yüklenirken bir hata oluştu</Heading>
        <Text mt={3}>Lütfen daha sonra tekrar deneyin.</Text>
        <Text mt={2}>{error?.message}</Text>
        <Text mt={2} fontSize="sm">Tekrar denemek için sayfayı yenileyin.</Text>
      </Box>
    );
  }

  return <>{children}</>;
}

export default function App({ Component, pageProps }: AppProps) {
  return (
    <ChakraProvider>
      <ErrorBoundary>
        <Component {...pageProps} />
      </ErrorBoundary>
    </ChakraProvider>
  );
} 