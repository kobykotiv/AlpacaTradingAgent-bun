/**
 * Execute Trade API route - POST execute trades with admin role validation
 */

import { NextRequest, NextResponse } from 'next/server';
import { facade } from '@/server/lib/factoryFacade';
import { parseAuth, requireAdmin, createErrorResponse, createSuccessResponse } from '@/server/lib/middleware';
import { validateBody, ExecuteTradeSchema } from '@/lib/schemas/zodSchemas';
import { config, proxyToMock } from '@/lib/config';
import { Trade } from '@/lib/types/serverTypes';

export async function POST(request: NextRequest) {
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

    // Require admin role for trade execution
    const roleCheck = requireAdmin(ctx);
    if (!roleCheck.success) {
      return NextResponse.json(
        createErrorResponse(roleCheck.error!, roleCheck.status),
        { status: roleCheck.status }
      );
    }

    // Parse and validate request body
    const bodyValidation = await validateBody(request, ExecuteTradeSchema);
    
    if (!bodyValidation.success) {
      return NextResponse.json(
        createErrorResponse(
          'Invalid trade request',
          422,
          bodyValidation.error.flatten()
        ),
        { status: 422 }
      );
    }

    const tradeRequest = bodyValidation.data;

    try {
      // Get adapter for user
      const adapter = await facade.getAdapterForUser(ctx.tenantId, ctx.userId);
      
      // Check if adapter supports execute method, otherwise use create
      const executeMethod = adapter.execute || adapter.create;
      
      // Execute the trade
      const tradeResult = await executeMethod.call(adapter, {
        ...tradeRequest,
        userId: ctx.userId,
        tenantId: ctx.tenantId,
        timestamp: new Date().toISOString(),
      });

      // Ensure result matches Trade interface
      const trade: Trade = {
        id: tradeResult.id || tradeResult.orderId || `trade-${Date.now()}`,
        symbol: tradeRequest.symbol,
        side: tradeRequest.side,
        quantity: tradeRequest.quantity,
        price: tradeResult.price || tradeRequest.price || 0,
        timestamp: tradeResult.timestamp || tradeResult.executedAt || new Date().toISOString(),
        status: tradeResult.status || 'pending',
        orderId: tradeResult.orderId,
      };

      return NextResponse.json(createSuccessResponse(trade, 'Trade executed successfully'));

    } catch (adapterError) {
      console.warn('Adapter error during trade execution:', adapterError);
      
      // For trade execution, be more careful about fallbacks
      // Only fall back to mock if explicitly enabled and not in production
      if (config.useMock && process.env.NODE_ENV !== 'production') {
        try {
          return await proxyToMock(request);
        } catch (mockError) {
          return NextResponse.json(
            createErrorResponse('Trade execution failed - service unavailable', 502),
            { status: 502 }
          );
        }
      }
      
      return NextResponse.json(
        createErrorResponse(
          'Trade execution failed',
          502,
          { originalError: adapterError instanceof Error ? adapterError.message : 'Unknown error' }
        ),
        { status: 502 }
      );
    }

  } catch (error) {
    console.error('Trade execution API error:', error);
    return NextResponse.json(
      createErrorResponse('Internal server error', 500),
      { status: 500 }
    );
  }
}