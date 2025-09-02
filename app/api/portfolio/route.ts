/**
 * Portfolio API endpoint
 * GET /api/portfolio - Retrieve portfolio information
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
    return proxyToMockServer(request, '/api/portfolio');
  }

  // Mock portfolio data for development
  const mockPortfolio = {
    account: {
      id: 'portfolio-123',
      equity: 125750.50,
      cash: 15230.25,
      buyingPower: 251501.00,
      dayTradeCount: 2,
      portfolioValue: 125750.50,
      lastUpdated: new Date().toISOString()
    },
    positions: [
      {
        symbol: 'AAPL',
        quantity: 50,
        side: 'long',
        marketValue: 8750.00,
        costBasis: 8200.00,
        unrealizedPL: 550.00,
        unrealizedPLPercent: 6.71,
        avgEntryPrice: 164.00,
        currentPrice: 175.00
      },
      {
        symbol: 'TSLA',
        quantity: 25,
        side: 'long',
        marketValue: 6250.00,
        costBasis: 7000.00,
        unrealizedPL: -750.00,
        unrealizedPLPercent: -10.71,
        avgEntryPrice: 280.00,
        currentPrice: 250.00
      },
      {
        symbol: 'NVDA',
        quantity: 15,
        side: 'long',
        marketValue: 12000.00,
        costBasis: 10500.00,
        unrealizedPL: 1500.00,
        unrealizedPLPercent: 14.29,
        avgEntryPrice: 700.00,
        currentPrice: 800.00
      }
    ],
    performance: {
      totalReturn: 1300.00,
      totalReturnPercent: 2.11,
      dayChange: 425.75,
      dayChangePercent: 0.34,
      portfolioAllocation: [
        { sector: 'Technology', percentage: 65.5, value: 82417.08 },
        { sector: 'Cash', percentage: 12.1, value: 15230.25 },
        { sector: 'Healthcare', percentage: 12.2, value: 15341.56 },
        { sector: 'Financial', percentage: 10.2, value: 12761.61 }
      ]
    }
  };

  return successResponse(mockPortfolio, 'Portfolio retrieved successfully');
}

// TODO: Add real Alpaca integration
// - Replace mock data with live Alpaca API calls
// - Implement user-specific API key retrieval from secure storage
// - Add portfolio analytics and risk calculations
// - Implement caching for performance optimization