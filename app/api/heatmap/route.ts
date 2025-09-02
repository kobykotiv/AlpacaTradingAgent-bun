/**
 * Heatmap API endpoint
 * GET /api/heatmap - Retrieve market heatmap data
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
    return proxyToMockServer(request, '/api/heatmap');
  }

  // Mock heatmap data for development
  const mockHeatmap = {
    sectors: [
      {
        name: 'Technology',
        performance: 2.45,
        marketCap: 12750000000000,
        color: '#10B981',
        symbols: ['AAPL', 'MSFT', 'GOOGL', 'NVDA', 'META']
      },
      {
        name: 'Healthcare',
        performance: -0.85,
        marketCap: 5230000000000,
        color: '#EF4444',
        symbols: ['JNJ', 'PFE', 'UNH', 'ABBV', 'MRK']
      },
      {
        name: 'Financial',
        performance: 1.23,
        marketCap: 8940000000000,
        color: '#10B981',
        symbols: ['JPM', 'BAC', 'WFC', 'C', 'GS']
      },
      {
        name: 'Energy',
        performance: -2.10,
        marketCap: 3450000000000,
        color: '#EF4444',
        symbols: ['XOM', 'CVX', 'COP', 'EOG', 'SLB']
      },
      {
        name: 'Consumer Discretionary',
        performance: 0.75,
        marketCap: 4320000000000,
        color: '#F59E0B',
        symbols: ['AMZN', 'TSLA', 'HD', 'MCD', 'NKE']
      }
    ],
    topMovers: {
      gainers: [
        { symbol: 'NVDA', change: 8.45, changePercent: 4.23 },
        { symbol: 'AMD', change: 5.12, changePercent: 3.89 },
        { symbol: 'AAPL', change: 6.78, changePercent: 2.34 }
      ],
      losers: [
        { symbol: 'TSLA', change: -12.45, changePercent: -4.56 },
        { symbol: 'NFLX', change: -8.23, changePercent: -3.21 },
        { symbol: 'META', change: -15.67, changePercent: -2.89 }
      ]
    },
    lastUpdated: new Date().toISOString()
  };

  return successResponse(mockHeatmap, 'Heatmap data retrieved successfully');
}

// TODO: Add real market data integration
// - Connect to live market data providers (Alpha Vantage, IEX, etc.)
// - Implement sector classification logic
// - Add customizable time periods and metrics
// - Implement real-time updates via WebSocket