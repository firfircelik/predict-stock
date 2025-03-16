import React, { ReactNode } from 'react';
import Head from 'next/head';
import { Box, Container, Flex, Heading, Text, Link } from '@chakra-ui/react';
import { FaGithub, FaLinkedin } from 'react-icons/fa';

interface LayoutProps {
  children: ReactNode;
  title?: string;
}

export default function Layout({ children, title = 'BIST Hisse Tahmin Uygulaması' }: LayoutProps) {
  return (
    <Box minHeight="100vh" display="flex" flexDirection="column">
      <Head>
        <title>{title}</title>
        <meta name="description" content="Borsa İstanbul (BIST) hisse senetleri için alım satım tahmini yapan uygulama" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <Box 
        as="header" 
        py={4} 
        px={[4, 6, 8]} 
        borderBottom="1px" 
        borderColor="gray.200"
        bg="blue.700"
        color="white"
      >
        <Container maxW="container.xl">
          <Flex justify="space-between" align="center">
            <Heading as="h1" size={["md", "lg"]}>
              BIST Hisse Tahmin Uygulaması
            </Heading>
          </Flex>
        </Container>
      </Box>

      <Box as="main" flex="1" py={8} px={[4, 6, 8]}>
        <Container maxW="container.xl">
          {children}
        </Container>
      </Box>

      <Box 
        as="footer" 
        py={6} 
        borderTop="1px" 
        borderColor="gray.200"
        bg="gray.50"
      >
        <Container maxW="container.xl">
          <Flex 
            direction={['column', 'row']} 
            justify="space-between" 
            align={['center', 'flex-start']}
            gap={4}
          >
            <Box>
              <Text fontSize="sm" color="gray.600">
                © {new Date().getFullYear()} BIST Hisse Tahmin Uygulaması
              </Text>
              <Text fontSize="xs" color="gray.500" mt={1}>
                Bu uygulama yatırım tavsiyesi niteliği taşımaz
              </Text>
            </Box>
            <Flex gap={4}>
              <Link href="https://github.com" isExternal>
                <FaGithub size={24} />
              </Link>
              <Link href="https://linkedin.com" isExternal>
                <FaLinkedin size={24} />
              </Link>
            </Flex>
          </Flex>
        </Container>
      </Box>
    </Box>
  );
} 