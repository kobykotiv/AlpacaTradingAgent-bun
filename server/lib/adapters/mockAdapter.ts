/**
 * Mock Trading Adapter
 * Provides simulated trading operations for testing and development
 */

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

export class MockAdapter {
  private positions: Position[] = [
    {
      symbol: 'AAPL',
      quantity: 10,
      side: 'long',
      marketValue: 1500,
      costBasis: 1400,
      unrealizedPL: 100,
    },
    {
      symbol: 'TSLA',
      quantity: 5,
      side: 'long',
      marketValue: 1000,
      costBasis: 950,
      unrealizedPL: 50,
    },
  ];

  async getAccount(): Promise<AccountInfo> {
    return {
      buyingPower: 50000,
      cash: 25000,
      equity: 75000,
      dayTradeCount: 2,
      portfolioValue: 75000,
    };
  }

  async getPositions(): Promise<Position[]> {
    return [...this.positions];
  }

  async placeOrder(order: TradeOrder): Promise<{ success: boolean; orderId: string; message: string }> {
    // Simulate processing delay
    await new Promise(resolve => setTimeout(resolve, 100));
    
    const orderId = `mock_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    // Update mock positions
    this.updateMockPosition(order);
    
    return {
      success: true,
      orderId,
      message: `MOCK ORDER: ${order.side} ${order.quantity} ${order.symbol} (${order.type})`,
    };
  }

  async getMarketData(symbol: string): Promise<{ price: number; change: number; changePercent: number }> {
    // Generate consistent but varying mock data based on symbol
    const hash = symbol.split('').reduce((a, b) => ((a << 5) - a + b.charCodeAt(0)) | 0, 0);
    const basePrice = Math.abs(hash % 1000) + 50; // Price between 50-1050
    const change = (Math.sin(Date.now() / 100000 + hash) * basePrice * 0.02); // ±2% change
    
    return {
      price: basePrice + change,
      change,
      changePercent: (change / basePrice) * 100,
    };
  }

  private updateMockPosition(order: TradeOrder) {
    const existingPositionIndex = this.positions.findIndex(p => p.symbol === order.symbol);
    
    if (existingPositionIndex >= 0) {
      const position = this.positions[existingPositionIndex];
      const newQuantity = order.side === 'buy' 
        ? position.quantity + order.quantity 
        : position.quantity - order.quantity;
      
      if (newQuantity === 0) {
        this.positions.splice(existingPositionIndex, 1);
      } else {
        position.quantity = newQuantity;
        position.side = newQuantity > 0 ? 'long' : 'short';
      }
    } else if (order.side === 'buy') {
      this.positions.push({
        symbol: order.symbol,
        quantity: order.quantity,
        side: 'long',
        marketValue: order.quantity * (order.price || 100),
        costBasis: order.quantity * (order.price || 100),
        unrealizedPL: 0,
      });
    }
  }
}