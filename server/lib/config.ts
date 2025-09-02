/**
 * Server configuration helper
 * Reads environment variables and provides safe defaults
 */

export interface ServerConfig {
  useAlpaca: boolean;
  useMock: boolean;
  mockApiBase?: string;
  secretKey: string;
  openaiApiKey?: string;
  alpacaApiKey?: string;
  alpacaSecretKey?: string;
  alpacaPaper: boolean;
}

function getRequiredEnv(name: string, fallback?: string): string {
  const value = process.env[name] || fallback;
  if (!value) {
    throw new Error(`Required environment variable ${name} is not set`);
  }
  return value;
}

function getBooleanEnv(name: string, defaultValue: boolean = false): boolean {
  const value = process.env[name];
  if (!value) return defaultValue;
  return value.toLowerCase() === 'true' || value === '1';
}

export function getConfig(): ServerConfig {
  // Generate a fallback secret key if not provided (log warning)
  let secretKey = process.env.SECRET_KEY;
  if (!secretKey) {
    console.warn('⚠️  SECRET_KEY not set. Using fallback in-memory key. NOT SECURE for production!');
    secretKey = 'fallback-insecure-key-for-development-only';
  }

  return {
    useAlpaca: getBooleanEnv('USE_ALPACA'),
    useMock: getBooleanEnv('USE_MOCK', true), // Default to mock
    mockApiBase: process.env.MOCK_API_BASE,
    secretKey,
    openaiApiKey: process.env.OPENAI_API_KEY,
    alpacaApiKey: process.env.ALPACA_API_KEY,
    alpacaSecretKey: process.env.ALPACA_SECRET_KEY,
    alpacaPaper: getBooleanEnv('ALPACA_USE_PAPER', true), // Default to paper trading
  };
}

export default getConfig;