/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    appDir: true,
  },
  env: {
    USE_ALPACA: process.env.USE_ALPACA,
    USE_MOCK: process.env.USE_MOCK,
    MOCK_API_BASE: process.env.MOCK_API_BASE,
    SECRET_KEY: process.env.SECRET_KEY,
    OPENAI_API_KEY: process.env.OPENAI_API_KEY,
  },
}

module.exports = nextConfig