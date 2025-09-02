/**
 * P&L Reports API endpoint
 * GET /api/reports/pnl - Retrieve profit and loss reports
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
    return proxyToMockServer(request, '/api/reports/pnl');
  }

  // Mock P&L report data for development
  const mockPnLReport = {
    summary: {
      totalPnL: 3450.75,
      totalPnLPercent: 2.89,
      realizedPnL: 2100.50,
      unrealizedPnL: 1350.25,
      winRate: 68.5,
      totalTrades: 47,
      winningTrades: 32,
      losingTrades: 15
    },
    daily: [
      { date: '2024-01-02', pnl: 245.50, pnlPercent: 0.21, trades: 3 },
      { date: '2024-01-01', pnl: -120.25, pnlPercent: -0.10, trades: 2 },
      { date: '2023-12-29', pnl: 180.75, pnlPercent: 0.15, trades: 1 },
      { date: '2023-12-28', pnl: 320.00, pnlPercent: 0.27, trades: 4 },
      { date: '2023-12-27', pnl: -95.50, pnlPercent: -0.08, trades: 2 }
    ],
    bySymbol: [
      {
        symbol: 'AAPL',
        totalPnL: 1250.50,
        realizedPnL: 800.25,
        unrealizedPnL: 450.25,
        trades: 12,
        winRate: 75.0
      },
      {
        symbol: 'TSLA',
        totalPnL: -345.25,
        realizedPnL: -200.00,
        unrealizedPnL: -145.25,
        trades: 8,
        winRate: 37.5
      },
      {
        symbol: 'NVDA',
        totalPnL: 2100.75,
        realizedPnL: 1500.25,
        unrealizedPnL: 600.50,
        trades: 15,
        winRate: 80.0
      }
    ],
    monthlyTrends: [
      { month: '2024-01', pnl: 125.25, trades: 5 },
      { month: '2023-12', pnl: 1845.50, trades: 18 },
      { month: '2023-11', pnl: 980.75, trades: 14 },
      { month: '2023-10', pnl: 499.25, trades: 10 }
    ],
    lastUpdated: new Date().toISOString()
  };

  return successResponse(mockPnLReport, 'P&L report retrieved successfully');
}

// TODO: Add real P&L calculation integration
// - Connect to actual trading account data
// - Implement real-time P&L calculations
// - Add tax lot tracking for accurate cost basis
// - Implement customizable date ranges and groupings