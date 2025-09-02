/**
 * Portfolio API route - GET portfolio balance and positions
 */

import { NextRequest, NextResponse } from 'next/server';
import { facade } from '@/server/lib/factoryFacade';
import { parseAuth, createErrorResponse, createSuccessResponse } from '@/server/lib/middleware';
import { validateQuery, PortfolioQuerySchema } from '@/lib/schemas/zodSchemas';
import { config, proxyToMock } from '@/lib/config';
import { Portfolio } from '@/lib/types/serverTypes';

export async function GET(request: NextRequest) {
  try {
    // Parse authentication
    const authResult = parseAuth(request);
    if (!authResult.success) {
      return NextResponse.json(
        createErrorResponse(authResult.error!, authResult.status),
        { status: authResult.status }
      );
    }

    const ctx = authResult.context!;

    // Parse and validate query parameters
    const { searchParams } = new URL(request.url);
    const queryValidation = validateQuery(searchParams, PortfolioQuerySchema);
    
    if (!queryValidation.success) {
      return NextResponse.json(
        createErrorResponse(
          'Invalid query parameters',
          422,
          queryValidation.error.flatten()
        ),
        { status: 422 }
      );
    }

    const queryParams = queryValidation.data;

    try {
      // Get adapter for user
      const adapter = await facade.getAdapterForUser(ctx.tenantId, ctx.userId);
      
      // Call adapter to get portfolio data
      const portfolioData = await adapter.list({ 
        type: 'portfolio',
        includePositions: queryParams.includePositions,
        includeProfitLoss: queryParams.includeProfitLoss,
      });

      // Ensure data matches Portfolio interface
      const portfolio: Portfolio = {
        balance: portfolioData.balance || 0,
        buyingPower: portfolioData.buyingPower || 0,
        cash: portfolioData.cash || 0,
        positions: portfolioData.positions || [],
        dailyChange: portfolioData.dailyChange || 0,
        dailyChangePercent: portfolioData.dailyChangePercent || 0,
      };

      return NextResponse.json(createSuccessResponse(portfolio));

    } catch (adapterError) {
      console.warn('Adapter error, falling back to mock:', adapterError);
      
      // Fall back to mock if adapter fails and config allows it
      if (config.useMock) {
        try {
          return await proxyToMock(request);
        } catch (mockError) {
          // Return safe fallback data if mock is also unavailable
          const fallbackPortfolio: Portfolio = {
            balance: 0,
            buyingPower: 0,
            cash: 0,
            positions: [],
            dailyChange: 0,
            dailyChangePercent: 0,
          };
          
          return NextResponse.json(
            createSuccessResponse(fallbackPortfolio, 'Using fallback data - integrations unavailable')
          );
        }
      }
      
      return NextResponse.json(
        createErrorResponse('Portfolio service unavailable', 502),
        { status: 502 }
      );
    }

  } catch (error) {
    console.error('Portfolio API error:', error);
    return NextResponse.json(
      createErrorResponse('Internal server error', 500),
      { status: 500 }
    );
  }
}