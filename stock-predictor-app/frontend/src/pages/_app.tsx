import '@/styles/globals.css';
import type { AppProps } from 'next/app';
import { ChakraProvider } from '@chakra-ui/react';
import { Inter } from 'next/font/google';
import theme from '@/styles/theme';
// WebSocket component'ini etkinleştiriyoruz
import WebSocketListener from '@/components/WebSocketListener';

const inter = Inter({ subsets: ['latin'] });

export default function App({ Component, pageProps }: AppProps) {
  return (
    <ChakraProvider theme={theme}>
      <main className={inter.className}>
        <Component {...pageProps} />
        <WebSocketListener />
      </main>
    </ChakraProvider>
  );
} 