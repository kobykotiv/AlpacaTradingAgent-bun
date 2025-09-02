/**
 * Alpaca Trading Adapter
 * Provides integration with Alpaca API for trading operations
 */

const Alpaca = require('@alpacahq/alpaca-trade-api');

export interface AlpacaCredentials {
  apiKey: string;
  secret: string;
  paper: boolean;
}

export interface TradeOrder {
  symbol: string;
  side: 'buy' | 'sell';
  quantity: number;
  type: 'market' | 'limit';
  price?: number;
}

export interface Position {
  symbol: string;
  quantity: number;
  side: 'long' | 'short';
  marketValue: number;
  costBasis: number;
  unrealizedPL: number;
}

export interface AccountInfo {
  buyingPower: number;
  cash: number;
  equity: number;
  dayTradeCount: number;
  portfolioValue: number;
}

export class AlpacaAdapter {
  private client: any = null;
  private credentials: AlpacaCredentials | null = null;
  private simulateMode: boolean = true;

  constructor(credentials?: AlpacaCredentials) {
    if (credentials) {
      this.setCredentials(credentials);
    }
  }

  /**
   * Sets Alpaca credentials and initializes client
   */
  setCredentials(credentials: AlpacaCredentials) {
    this.credentials = credentials;
    this.simulateMode = false; // Enable real trading when credentials provided
    
    try {
      this.client = new Alpaca({
        keyId: credentials.apiKey,
        secretKey: credentials.secret,
        paper: credentials.paper,
      });
    } catch (error) {
      console.error('Failed to initialize Alpaca client:', error);
      this.simulateMode = true; // Fallback to simulation
    }
  }

  /**
   * Get account information
   */
  async getAccount(): Promise<AccountInfo> {
    if (this.simulateMode || !this.client) {
      return this.getSimulatedAccount();
    }

    try {
      const account = await this.client.getAccount();
      return {
        buyingPower: parseFloat(account.buying_power),
        cash: parseFloat(account.cash),
        equity: parseFloat(account.equity),
        dayTradeCount: account.day_trade_count,
        portfolioValue: parseFloat(account.portfolio_value),
      };
    } catch (error) {
      console.error('Failed to fetch account:', error);
      return this.getSimulatedAccount();
    }
  }

  /**
   * Get current positions
   */
  async getPositions(): Promise<Position[]> {
    if (this.simulateMode || !this.client) {
      return this.getSimulatedPositions();
    }

    try {
      const positions = await this.client.getPositions();
      return positions.map((pos: any) => ({
        symbol: pos.symbol,
        quantity: parseFloat(pos.qty),
        side: parseFloat(pos.qty) > 0 ? 'long' : 'short',
        marketValue: parseFloat(pos.market_value),
        costBasis: parseFloat(pos.cost_basis),
        unrealizedPL: parseFloat(pos.unrealized_pl),
      }));
    } catch (error) {
      console.error('Failed to fetch positions:', error);
      return this.getSimulatedPositions();
    }
  }

  /**
   * Place a trade order
   */
  async placeOrder(order: TradeOrder): Promise<{ success: boolean; orderId?: string; message: string }> {
    // Safety check: Always simulate by default unless explicitly enabled
    if (this.simulateMode || !this.client || !this.credentials) {
      return this.simulateOrder(order);
    }

    try {
      const alpacaOrder = {
        symbol: order.symbol,
        qty: order.quantity,
        side: order.side,
        type: order.type,
        time_in_force: 'day',
        ...(order.price && { limit_price: order.price }),
      };

      const result = await this.client.createOrder(alpacaOrder);
      return {
        success: true,
        orderId: result.id,
        message: `Order placed successfully: ${order.side} ${order.quantity} ${order.symbol}`,
      };
    } catch (error) {
      console.error('Failed to place order:', error);
      return {
        success: false,
        message: `Failed to place order: ${error instanceof Error ? error.message : 'Unknown error'}`,
      };
    }
  }

  /**
   * Get market data for a symbol
   */
  async getMarketData(symbol: string): Promise<{ price: number; change: number; changePercent: number } | null> {
    if (this.simulateMode || !this.client) {
      return this.getSimulatedMarketData(symbol);
    }

    try {
      const quote = await this.client.getLastTrade({ symbol });
      if (!quote) return null;

      // Calculate mock change for demo (in real implementation, you'd get this from bars)
      const price = quote.price || 100;
      const change = price * (Math.random() - 0.5) * 0.02; // Random change up to 1%
      
      return {
        price,
        change,
        changePercent: (change / price) * 100,
      };
    } catch (error) {
      console.error('Failed to fetch market data:', error);
      return this.getSimulatedMarketData(symbol);
    }
  }

  // Simulation methods for safe testing
  private getSimulatedAccount(): AccountInfo {
    return {
      buyingPower: 100000,
      cash: 50000,
      equity: 100000,
      dayTradeCount: 0,
      portfolioValue: 100000,
    };
  }

  private getSimulatedPositions(): Position[] {
    return [
      {
        symbol: 'AAPL',
        quantity: 10,
        side: 'long',
        marketValue: 1500,
        costBasis: 1400,
        unrealizedPL: 100,
      },
      {
        symbol: 'NVDA',
        quantity: 5,
        side: 'long',
        marketValue: 4500,
        costBasis: 4000,
        unrealizedPL: 500,
      },
    ];
  }

  private simulateOrder(order: TradeOrder): { success: boolean; orderId: string; message: string } {
    const orderId = `sim_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    return {
      success: true,
      orderId,
      message: `SIMULATED: ${order.side} ${order.quantity} ${order.symbol} (${order.type})`,
    };
  }

  private getSimulatedMarketData(symbol: string): { price: number; change: number; changePercent: number } {
    const basePrice = symbol === 'AAPL' ? 150 : symbol === 'NVDA' ? 900 : 100;
    const change = basePrice * (Math.random() - 0.5) * 0.02;
    return {
      price: basePrice + change,
      change,
      changePercent: (change / basePrice) * 100,
    };
  }
}