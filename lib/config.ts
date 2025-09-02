/**
 * Application configuration for AlpacaTradingAgent API
 */

export interface AppConfig {
  useMock: boolean;
  mockServerUrl: string;
  alpacaApiUrl: string;
  alpacaPaperTrading: boolean;
  enableEncryption: boolean;
  jwtSecret: string;
}

// Load configuration from environment variables
export const config: AppConfig = {
  useMock: process.env.USE_MOCK === 'true' || true, // Default to mock for safety
  mockServerUrl: process.env.MOCK_SERVER_URL || 'http://localhost:3001',
  alpacaApiUrl: process.env.ALPACA_API_URL || 'https://paper-api.alpaca.markets',
  alpacaPaperTrading: process.env.ALPACA_USE_PAPER !== 'false',
  enableEncryption: process.env.ENABLE_ENCRYPTION === 'true',
  jwtSecret: process.env.JWT_SECRET || 'fallback-secret-for-dev',
};

// Crypto utilities for encrypting sensitive data
export const crypto = {
  encrypt: (data: string): string => {
    // Simple base64 encoding for development - should use proper encryption in production
    if (!config.enableEncryption) {
      return data;
    }
    return Buffer.from(data).toString('base64');
  },
  
  decrypt: (encryptedData: string): string => {
    // Simple base64 decoding for development - should use proper decryption in production
    if (!config.enableEncryption) {
      return encryptedData;
    }
    try {
      return Buffer.from(encryptedData, 'base64').toString('utf-8');
    } catch {
      throw new Error('Failed to decrypt data');
    }
  },
};

// Mock proxy utility
export const proxyToMock = async (req: Request): Promise<Response> => {
  try {
    const url = new URL(req.url);
    const mockUrl = `${config.mockServerUrl}${url.pathname}${url.search}`;
    
    const mockResponse = await fetch(mockUrl, {
      method: req.method,
      headers: req.headers,
      body: req.method !== 'GET' ? await req.text() : undefined,
    });
    
    return mockResponse;
  } catch (error) {
    // Return safe fallback if mock server is not available
    return new Response(
      JSON.stringify({ 
        error: 'Mock server unavailable', 
        fallback: true,
        data: null 
      }),
      { 
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
};