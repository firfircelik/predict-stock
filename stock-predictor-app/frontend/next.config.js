/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  images: {
    domains: ['finnhub.io'],
  },
  env: {
    API_URL: process.env.API_URL || 'http://localhost:8000',
  },
  publicRuntimeConfig: {
    API_URL: process.env.API_URL || 'http://localhost:8000',
  },
  // Vercel için output konfigürasyonu
  output: 'standalone',
}

module.exports = nextConfig 