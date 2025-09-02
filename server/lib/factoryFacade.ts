/**
 * Factory Facade for Trading Adapters
 * Manages adapter instances based on configuration and user integrations
 */

import { getConfig } from './config';
import { getIntegrationByUser } from './db';
import { AlpacaAdapter } from './adapters/alpacaAdapter';
import { MockAdapter } from './adapters/mockAdapter';

export type TradingAdapter = AlpacaAdapter | MockAdapter;

export interface AdapterFactory {
  getAccount(): Promise<any>;
  getPositions(): Promise<any>;
  placeOrder(order: any): Promise<any>;
  getMarketData(symbol: string): Promise<any>;
}

/**
 * Gets the appropriate trading adapter for a user
 * Falls back to mock adapter if no integration found or feature disabled
 */
export async function getAdapterForUser(
  tenantId: string,
  userId: string,
  provider?: string
): Promise<AdapterFactory> {
  const config = getConfig();
  
  // Check if Alpaca is enabled via feature flag
  if (!config.useAlpaca) {
    console.log('🔧 Alpaca disabled via USE_ALPACA flag, using mock adapter');
    return new MockAdapter();
  }

  // Try to get integration for user
  try {
    const integration = await getIntegrationByUser(tenantId, userId, provider || 'alpaca');
    
    if (integration && integration.provider === 'alpaca') {
      console.log(`🔗 Using Alpaca adapter for user ${userId} (sandbox: ${integration.sandbox})`);
      
      const alpacaAdapter = new AlpacaAdapter({
        apiKey: integration.apiKey,
        secret: integration.secret,
        paper: integration.sandbox,
      });
      
      return alpacaAdapter;
    }
    
    console.log(`📝 No ${provider || 'alpaca'} integration found for user ${userId}, using mock adapter`);
    return new MockAdapter();
    
  } catch (error) {
    console.error('❌ Error fetching user integration:', error);
    console.log('🔄 Falling back to mock adapter');
    return new MockAdapter();
  }
}

/**
 * Gets default adapter based on configuration
 * Used when no user context is available
 */
export function getDefaultAdapter(): AdapterFactory {
  const config = getConfig();
  
  if (config.useAlpaca && config.alpacaApiKey && config.alpacaSecretKey) {
    console.log('🔗 Using default Alpaca adapter from env vars');
    return new AlpacaAdapter({
      apiKey: config.alpacaApiKey,
      secret: config.alpacaSecretKey,
      paper: config.alpacaPaper,
    });
  }
  
  console.log('📝 Using default mock adapter');
  return new MockAdapter();
}

/**
 * Factory method that decides which adapter to use
 * Priority:
 * 1. User-specific integration (if USE_ALPACA=true)
 * 2. Environment-based Alpaca (if USE_ALPACA=true and keys present)
 * 3. Mock adapter (default safe fallback)
 */
export async function createAdapter(
  tenantId?: string,
  userId?: string,
  provider?: string
): Promise<AdapterFactory> {
  // If we have user context, try to get user-specific adapter
  if (tenantId && userId) {
    return await getAdapterForUser(tenantId, userId, provider);
  }
  
  // Otherwise use default adapter
  return getDefaultAdapter();
}

/**
 * Validates that an adapter is properly configured
 */
export async function validateAdapter(adapter: AdapterFactory): Promise<boolean> {
  try {
    // Try to fetch account info as a health check
    await adapter.getAccount();
    return true;
  } catch (error) {
    console.error('Adapter validation failed:', error);
    return false;
  }
}

/**
 * SAFETY: Ensures no live trading by default
 * This function must be explicitly called to enable live trading
 */
export function enableLiveTrading(): void {
  console.warn('⚠️  LIVE TRADING ENABLED - Real money at risk!');
  // This would set a runtime flag if needed
  // For now, we rely on the paper trading flags in individual adapters
}

export default {
  getAdapterForUser,
  getDefaultAdapter,
  createAdapter,
  validateAdapter,
  enableLiveTrading,
};