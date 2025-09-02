/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    appDir: true,
  },
  env: {
    NODE_ENV: process.env.NODE_ENV,
  },
  // Exclude Python directories from Next.js processing
  webpack: (config) => {
    config.module.rules.push({
      test: /\.(py|pyc)$/,
      use: 'ignore-loader',
    });
    return config;
  },
};

module.exports = nextConfig;