/**
 * Open Trades API endpoint
 * GET /api/trades/open - Retrieve open/pending trades
 */

import { NextRequest } from 'next/server';
import { authorize } from '@/lib/server/middleware';
import { proxyToMockServer, shouldProxy } from '@/lib/server/proxy';
import { 
  successResponse, 
  unauthorizedResponse, 
  forbiddenResponse, 
  badRequestResponse 
} from '@/app/api/_helpers/response';

export async function GET(request: NextRequest) {
  // Authorization check
  const authResult = authorize(request, 'viewer');
  
  if (!authResult.success) {
    if (authResult.error?.includes('Missing x-tenant-id')) {
      return badRequestResponse(authResult.error);
    }
    if (authResult.error?.includes('Missing or invalid Authorization')) {
      return unauthorizedResponse(authResult.error);
    }
    return forbiddenResponse(authResult.error);
  }

  // If mock mode is enabled, proxy to mock server
  if (shouldProxy()) {
    return proxyToMockServer(request, '/api/trades/open');
  }

  // Mock open trades data for development
  const mockOpenTrades = {
    trades: [
      {
        id: 'order_1703876543_abc123',
        symbol: 'AAPL',
        side: 'buy',
        type: 'limit',
        quantity: 25,
        limitPrice: 172.50,
        status: 'pending_new',
        submittedAt: '2024-01-02T10:30:00Z',
        timeInForce: 'day',
        remainingQuantity: 25,
        filledQuantity: 0
      },
      {
        id: 'order_1703876789_def456',
        symbol: 'TSLA',
        side: 'sell',
        type: 'stop',
        quantity: 10,
        stopPrice: 245.00,
        status: 'accepted',
        submittedAt: '2024-01-02T11:15:00Z',
        timeInForce: 'gtc',
        remainingQuantity: 10,
        filledQuantity: 0
      },
      {
        id: 'order_1703877012_ghi789',
        symbol: 'NVDA',
        side: 'buy',
        type: 'limit',
        quantity: 5,
        limitPrice: 795.00,
        status: 'partially_filled',
        submittedAt: '2024-01-02T12:00:00Z',
        timeInForce: 'day',
        remainingQuantity: 2,
        filledQuantity: 3,
        avgFillPrice: 794.75
      }
    ],
    summary: {
      totalOrders: 3,
      pendingOrders: 2,
      partiallyFilledOrders: 1,
      totalValue: 23237.50,
      lastUpdated: new Date().toISOString()
    }
  };

  return successResponse(mockOpenTrades, 'Open trades retrieved successfully');
}

// TODO: Add real Alpaca integration
// - Connect to Alpaca API to fetch real open orders
// - Implement real-time order status updates
// - Add order modification and cancellation capabilities
// - Implement order filtering and sorting options