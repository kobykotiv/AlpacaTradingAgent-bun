/**
 * Factory Facade for adapter management and user-specific adapter selection
 */

import { AdapterMethods } from '@/lib/types/serverTypes';
import { config } from '@/lib/config';

export interface AdapterConfig {
  provider: string;
  credentials?: Record<string, string>;
  settings?: Record<string, any>;
}

/**
 * Mock adapter implementation for fallback behavior
 */
class MockAdapter implements AdapterMethods {
  private provider: string;

  constructor(provider: string = 'mock') {
    this.provider = provider;
  }

  async list(params?: Record<string, any>): Promise<any> {
    // Return appropriate mock data based on the context
    if (params?.type === 'portfolio') {
      return {
        balance: 10000,
        buyingPower: 8000,
        cash: 2000,
        positions: [
          {
            symbol: 'AAPL',
            quantity: 10,
            averagePrice: 150.00,
            currentPrice: 155.00,
            marketValue: 1550.00,
            unrealizedPL: 50.00,
            unrealizedPLPercent: 3.33,
            side: 'long',
          },
        ],
        dailyChange: 50.00,
        dailyChangePercent: 0.5,
      };
    }

    if (params?.type === 'trades') {
      return [
        {
          id: 'mock-trade-1',
          symbol: 'AAPL',
          side: 'buy',
          quantity: 10,
          price: 150.00,
          timestamp: new Date().toISOString(),
          status: 'filled',
          orderId: 'mock-order-1',
        },
      ];
    }

    if (params?.type === 'jobs') {
      return [
        {
          id: 'mock-job-1',
          name: 'Daily Analysis',
          type: 'analysis',
          schedule: '0 9 * * 1-5',
          isActive: true,
          lastRun: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
          nextRun: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
          settings: {},
        },
      ];
    }

    return [];
  }

  async get(id: string, params?: Record<string, any>): Promise<any> {
    return {
      id,
      mock: true,
      provider: this.provider,
      data: params || {},
    };
  }

  async create(data: Record<string, any>): Promise<any> {
    return {
      id: `mock-${Date.now()}`,
      ...data,
      created: true,
      timestamp: new Date().toISOString(),
    };
  }

  async update(id: string, data: Record<string, any>): Promise<any> {
    return {
      id,
      ...data,
      updated: true,
      timestamp: new Date().toISOString(),
    };
  }

  async delete(id: string): Promise<any> {
    return {
      id,
      deleted: true,
      timestamp: new Date().toISOString(),
    };
  }

  async execute(data: Record<string, any>): Promise<any> {
    return {
      orderId: `mock-order-${Date.now()}`,
      status: 'filled',
      ...data,
      executedAt: new Date().toISOString(),
    };
  }

  async simulate(data: Record<string, any>): Promise<any> {
    return {
      ...data,
      simulated: true,
      estimatedOutcome: 'success',
      timestamp: new Date().toISOString(),
    };
  }
}

/**
 * Alpaca adapter implementation (placeholder - would connect to real Alpaca API)
 */
class AlpacaAdapter implements AdapterMethods {
  private credentials: Record<string, string>;
  private isPaperTrading: boolean;

  constructor(credentials: Record<string, string>, settings?: Record<string, any>) {
    this.credentials = credentials;
    this.isPaperTrading = settings?.paperTrading ?? config.alpacaPaperTrading;
  }

  async list(params?: Record<string, any>): Promise<any> {
    // In production, this would make actual Alpaca API calls
    // For now, return mock data but with Alpaca-specific structure
    if (params?.type === 'portfolio') {
      return {
        balance: 25000,
        buyingPower: 50000,
        cash: 5000,
        positions: [],
        dailyChange: -125.50,
        dailyChangePercent: -0.5,
      };
    }

    return [];
  }

  async get(id: string): Promise<any> {
    throw new Error('Alpaca integration not fully implemented - falling back to mock');
  }

  async create(data: Record<string, any>): Promise<any> {
    throw new Error('Alpaca integration not fully implemented - falling back to mock');
  }

  async update(id: string, data: Record<string, any>): Promise<any> {
    throw new Error('Alpaca integration not fully implemented - falling back to mock');
  }

  async delete(id: string): Promise<any> {
    throw new Error('Alpaca integration not fully implemented - falling back to mock');
  }

  async execute(data: Record<string, any>): Promise<any> {
    throw new Error('Alpaca integration not fully implemented - falling back to mock');
  }
}

/**
 * Factory Facade for managing adapters
 */
export class FactoryFacade {
  private adapters: Map<string, AdapterMethods> = new Map();
  private userConfigs: Map<string, AdapterConfig> = new Map();

  /**
   * Get adapter for specific user and provider
   */
  async getAdapterForUser(
    tenantId: string,
    userId: string,
    provider?: string
  ): Promise<AdapterMethods> {
    const userKey = `${tenantId}:${userId}`;
    
    try {
      // If no provider specified, use user's default or fall back to mock
      if (!provider) {
        provider = await this.getUserDefaultProvider(tenantId, userId) || 'mock';
      }

      const adapterKey = `${userKey}:${provider}`;
      
      // Check if adapter is already cached
      if (this.adapters.has(adapterKey)) {
        return this.adapters.get(adapterKey)!;
      }

      // Get user's configuration for this provider
      const userConfig = await this.getUserProviderConfig(tenantId, userId, provider);
      
      // Create appropriate adapter
      let adapter: AdapterMethods;
      
      switch (provider) {
        case 'alpaca':
          if (!userConfig || !userConfig.credentials) {
            throw new Error('Alpaca credentials not found');
          }
          adapter = new AlpacaAdapter(userConfig.credentials, userConfig.settings);
          break;
          
        case 'mock':
        default:
          adapter = new MockAdapter(provider);
          break;
      }

      // Cache the adapter
      this.adapters.set(adapterKey, adapter);
      
      return adapter;
    } catch (error) {
      // Fall back to mock adapter if anything goes wrong
      console.warn(`Failed to get adapter for user ${userKey} with provider ${provider}:`, error);
      
      if (config.useMock) {
        const mockAdapter = new MockAdapter(provider || 'mock');
        return mockAdapter;
      }
      
      throw error;
    }
  }

  /**
   * Get user's default provider (would query database in production)
   */
  private async getUserDefaultProvider(tenantId: string, userId: string): Promise<string | null> {
    // In production, this would query the database
    // For now, return 'alpaca' if user has alpaca config, otherwise null
    const alpacaConfig = await this.getUserProviderConfig(tenantId, userId, 'alpaca');
    return alpacaConfig ? 'alpaca' : null;
  }

  /**
   * Get user's configuration for a specific provider (would query database in production)
   */
  private async getUserProviderConfig(
    tenantId: string,
    userId: string,
    provider: string
  ): Promise<AdapterConfig | null> {
    // In production, this would query the database to get encrypted credentials
    // For now, return null (which will cause fallback to mock)
    return null;
  }

  /**
   * Store user's provider configuration (would save to database in production)
   */
  async setUserProviderConfig(
    tenantId: string,
    userId: string,
    provider: string,
    config: AdapterConfig
  ): Promise<void> {
    const userKey = `${tenantId}:${userId}:${provider}`;
    this.userConfigs.set(userKey, config);
    
    // In production, this would save encrypted credentials to database
    console.log(`Stored configuration for user ${tenantId}:${userId} with provider ${provider}`);
  }

  /**
   * Remove cached adapter (useful when credentials change)
   */
  clearAdapterCache(tenantId: string, userId: string, provider?: string): void {
    const userKey = `${tenantId}:${userId}`;
    
    if (provider) {
      this.adapters.delete(`${userKey}:${provider}`);
    } else {
      // Clear all adapters for this user
      for (const key of this.adapters.keys()) {
        if (key.startsWith(userKey)) {
          this.adapters.delete(key);
        }
      }
    }
  }
}

// Singleton instance
export const facade = new FactoryFacade();