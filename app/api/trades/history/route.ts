/**
 * Trade History API endpoint
 * GET /api/trades/history - Retrieve trade history
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
    return proxyToMockServer(request, '/api/trades/history');
  }

  // Mock trade history data for development
  const mockTradeHistory = {
    trades: [
      {
        id: 'trade_001',
        symbol: 'AAPL',
        side: 'buy',
        type: 'market',
        quantity: 50,
        filledPrice: 164.25,
        totalValue: 8212.50,
        status: 'filled',
        executedAt: '2024-01-02T10:30:00Z',
        pnl: 550.00,
        pnlPercent: 6.71
      },
      {
        id: 'trade_002',
        symbol: 'TSLA',
        side: 'buy',
        type: 'limit',
        quantity: 25,
        filledPrice: 280.00,
        limitPrice: 280.00,
        totalValue: 7000.00,
        status: 'filled',
        executedAt: '2024-01-01T14:15:00Z',
        pnl: -750.00,
        pnlPercent: -10.71
      },
      {
        id: 'trade_003',
        symbol: 'NVDA',
        side: 'buy',
        type: 'market',
        quantity: 15,
        filledPrice: 700.00,
        totalValue: 10500.00,
        status: 'filled',
        executedAt: '2023-12-28T11:45:00Z',
        pnl: 1500.00,
        pnlPercent: 14.29
      },
      {
        id: 'trade_004',
        symbol: 'AAPL',
        side: 'sell',
        type: 'limit',
        quantity: 25,
        filledPrice: 168.50,
        limitPrice: 168.00,
        totalValue: 4212.50,
        status: 'filled',
        executedAt: '2023-12-27T15:20:00Z',
        pnl: 112.50,
        pnlPercent: 2.74
      }
    ],
    summary: {
      totalTrades: 4,
      totalVolume: 30925.00,
      totalPnL: 1412.50,
      winRate: 75.0,
      avgTradeSize: 7731.25,
      bestTrade: 1500.00,
      worstTrade: -750.00
    },
    pagination: {
      currentPage: 1,
      totalPages: 1,
      totalRecords: 4,
      pageSize: 50
    },
    lastUpdated: new Date().toISOString()
  };

  return successResponse(mockTradeHistory, 'Trade history retrieved successfully');
}

// TODO: Add real trade history integration
// - Connect to actual trading account history
// - Implement pagination and filtering options
// - Add performance analytics and metrics
// - Implement trade export functionality