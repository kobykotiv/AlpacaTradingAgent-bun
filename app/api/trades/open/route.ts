/**
 * Open Trades API route - GET open/pending trades
 */

import { NextRequest, NextResponse } from 'next/server';
import { facade } from '@/server/lib/factoryFacade';
import { parseAuth, createErrorResponse, createSuccessResponse } from '@/server/lib/middleware';
import { validateQuery, PaginationSchema, SymbolFilterSchema } from '@/lib/schemas/zodSchemas';
import { config, proxyToMock } from '@/lib/config';
import { Trade } from '@/lib/types/serverTypes';

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
    const paginationValidation = validateQuery(searchParams, PaginationSchema);
    const symbolFilterValidation = validateQuery(searchParams, SymbolFilterSchema);
    
    if (!paginationValidation.success) {
      return NextResponse.json(
        createErrorResponse(
          'Invalid pagination parameters',
          422,
          paginationValidation.error.flatten()
        ),
        { status: 422 }
      );
    }

    if (!symbolFilterValidation.success) {
      return NextResponse.json(
        createErrorResponse(
          'Invalid symbol filter parameters',
          422,
          symbolFilterValidation.error.flatten()
        ),
        { status: 422 }
      );
    }

    const pagination = paginationValidation.data;
    const symbolFilter = symbolFilterValidation.data;

    try {
      // Get adapter for user
      const adapter = await facade.getAdapterForUser(ctx.tenantId, ctx.userId);
      
      // Call adapter to get open trades
      const tradesData = await adapter.list({ 
        type: 'trades',
        status: 'open',
        symbols: symbolFilter.symbols,
        page: pagination.page,
        limit: pagination.limit,
      });

      // Ensure data is array and matches Trade interface
      const trades: Trade[] = Array.isArray(tradesData) 
        ? tradesData.map(trade => ({
            id: trade.id || `trade-${Date.now()}`,
            symbol: trade.symbol,
            side: trade.side,
            quantity: trade.quantity,
            price: trade.price,
            timestamp: trade.timestamp || new Date().toISOString(),
            status: trade.status || 'pending',
            orderId: trade.orderId,
          }))
        : [];

      const response = {
        trades,
        pagination: {
          page: pagination.page,
          limit: pagination.limit,
          total: trades.length, // In production, this would come from adapter
        },
      };

      return NextResponse.json(createSuccessResponse(response));

    } catch (adapterError) {
      console.warn('Adapter error, falling back to mock:', adapterError);
      
      // Fall back to mock if adapter fails and config allows it
      if (config.useMock) {
        try {
          return await proxyToMock(request);
        } catch (mockError) {
          // Return safe fallback data if mock is also unavailable
          const fallbackResponse = {
            trades: [],
            pagination: {
              page: pagination.page,
              limit: pagination.limit,
              total: 0,
            },
          };
          
          return NextResponse.json(
            createSuccessResponse(fallbackResponse, 'Using fallback data - integrations unavailable')
          );
        }
      }
      
      return NextResponse.json(
        createErrorResponse('Trades service unavailable', 502),
        { status: 502 }
      );
    }

  } catch (error) {
    console.error('Open trades API error:', error);
    return NextResponse.json(
      createErrorResponse('Internal server error', 500),
      { status: 500 }
    );
  }
}