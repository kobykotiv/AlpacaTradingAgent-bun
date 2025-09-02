/**
 * Portfolio API route
 * Returns user's current portfolio positions and performance
 */

import { NextRequest } from 'next/server';
import { requireAuth, createSuccessResponse, createErrorResponse, withErrorHandling } from '@/lib/middleware';
import { createAdapter } from '@/server/lib/factoryFacade';
import { PortfolioSummary } from '@/lib/types/serverTypes';

async function portfolioHandler(request: NextRequest, context: any) {
  const { tenantId, userId } = context;

  try {
    // Get the appropriate adapter for this user
    const adapter = await createAdapter(tenantId, userId);
    
    // Fetch account info and positions
    const [account, positions] = await Promise.all([
      adapter.getAccount(),
      adapter.getPositions(),
    ]);

    // Calculate performance metrics
    const totalValue = account.portfolioValue || account.equity;
    const totalCash = account.cash;
    const totalEquity = account.equity;
    const buyingPower = account.buyingPower;
    
    // Calculate total unrealized P/L
    const totalUnrealizedPL = positions.reduce((sum: number, pos: any) => sum + (pos.unrealizedPL || 0), 0);
    
    // Mock day change calculation (in real implementation, this would come from historical data)
    const dayChange = totalValue * (Math.random() - 0.5) * 0.02; // ±1% random change
    const dayChangePercent = (dayChange / totalValue) * 100;
    
    // Format positions with additional calculations
    const formattedPositions = positions.map((pos: any) => ({
      symbol: pos.symbol,
      quantity: pos.quantity,
      side: pos.side,
      marketValue: pos.marketValue,
      costBasis: pos.costBasis,
      unrealizedPL: pos.unrealizedPL,
      unrealizedPLPercent: pos.costBasis ? (pos.unrealizedPL / pos.costBasis) * 100 : 0,
    }));

    const portfolioSummary: PortfolioSummary = {
      totalValue,
      totalCash,
      totalEquity,
      buyingPower,
      dayTradeCount: account.dayTradeCount || 0,
      positions: formattedPositions,
      performance: {
        dayChange,
        dayChangePercent,
        totalReturn: totalUnrealizedPL,
        totalReturnPercent: totalValue ? (totalUnrealizedPL / totalValue) * 100 : 0,
      },
    };

    return createSuccessResponse(portfolioSummary);
    
  } catch (error) {
    console.error('Portfolio fetch error:', error);
    return createErrorResponse(
      'PORTFOLIO_FETCH_ERROR',
      'Failed to fetch portfolio data',
      500
    );
  }
}

export const GET = withErrorHandling(requireAuth(portfolioHandler));