/**
 * Trade History API route - GET trade history
 */

import { NextRequest, NextResponse } from 'next/server';
import { facade } from '@/server/lib/factoryFacade';
import { parseAuth, createErrorResponse, createSuccessResponse } from '@/server/lib/middleware';
import { validateQuery, TradeHistoryQuerySchema } from '@/lib/schemas/zodSchemas';
import { config, proxyToMock } from '@/lib/config';
import { Trade } from '@/lib/types/serverTypes';

export async function GET(request: NextRequest) {
  try {
    const authResult = parseAuth(request);
    if (!authResult.success) {
      return NextResponse.json(
        createErrorResponse(authResult.error!, authResult.status),
        { status: authResult.status }
      );
    }

    const ctx = authResult.context!;
    const { searchParams } = new URL(request.url);
    const queryValidation = validateQuery(searchParams, TradeHistoryQuerySchema);
    
    if (!queryValidation.success) {
      return NextResponse.json(
        createErrorResponse('Invalid query parameters', 422, queryValidation.error.flatten()),
        { status: 422 }
      );
    }

    const queryParams = queryValidation.data;

    try {
      const adapter = await facade.getAdapterForUser(ctx.tenantId, ctx.userId);
      const tradesData = await adapter.list({ type: 'history', ...queryParams });

      const trades: Trade[] = Array.isArray(tradesData) 
        ? tradesData.map(trade => ({
            id: trade.id || `trade-${Date.now()}`,
            symbol: trade.symbol,
            side: trade.side,
            quantity: trade.quantity,
            price: trade.price,
            timestamp: trade.timestamp || new Date().toISOString(),
            status: trade.status || 'filled',
            orderId: trade.orderId,
          }))
        : [];

      return NextResponse.json(createSuccessResponse({ trades, pagination: { page: queryParams.page, limit: queryParams.limit, total: trades.length } }));

    } catch (adapterError) {
      if (config.useMock) {
        try {
          return await proxyToMock(request);
        } catch {
          return NextResponse.json(createSuccessResponse({ trades: [], pagination: { page: queryParams.page, limit: queryParams.limit, total: 0 } }));
        }
      }
      return NextResponse.json(createErrorResponse('Trade history service unavailable', 502), { status: 502 });
    }

  } catch (error) {
    return NextResponse.json(createErrorResponse('Internal server error', 500), { status: 500 });
  }
}