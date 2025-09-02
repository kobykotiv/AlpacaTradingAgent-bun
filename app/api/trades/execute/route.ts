/**
 * Trade Execution API endpoint
 * POST /api/trades/execute - Execute a trade order
 */

import { NextRequest } from 'next/server';
import { authorize } from '@/lib/server/middleware';
import { proxyToMockServer, shouldProxy } from '@/lib/server/proxy';
import { ExecuteTradeSchema, TradeResponse } from '@/lib/schemas/zodSchemas';
import { 
  successResponse, 
  unauthorizedResponse, 
  forbiddenResponse, 
  badRequestResponse,
  validationErrorResponse,
  serviceUnavailableResponse
} from '@/app/api/_helpers/response';

export async function POST(request: NextRequest) {
  // Authorization check (requires trader role for trade execution)
  const authResult = authorize(request, 'trader');
  
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
    return proxyToMockServer(request, '/api/trades/execute');
  }

  try {
    // Parse and validate request body
    const body = await request.json();
    const validatedData = ExecuteTradeSchema.parse(body);

    // TODO: Add real Alpaca integration for trade execution
    // Check if Alpaca API credentials are available
    const alpacaApiKey = process.env.ALPACA_API_KEY;
    const alpacaSecretKey = process.env.ALPACA_SECRET_KEY;
    
    if (!alpacaApiKey || !alpacaSecretKey) {
      return serviceUnavailableResponse(
        'Trading service unavailable. Alpaca API credentials not configured.'
      );
    }

    // Mock trade execution response
    const mockTradeResponse: TradeResponse = {
      id: `order_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      symbol: validatedData.symbol,
      side: validatedData.side,
      type: validatedData.type,
      quantity: validatedData.quantity,
      limitPrice: validatedData.limitPrice,
      stopPrice: validatedData.stopPrice,
      status: 'submitted',
      submittedAt: new Date().toISOString(),
      // For market orders, simulate immediate partial fill
      ...(validatedData.type === 'market' && {
        filledAt: new Date().toISOString(),
        filledPrice: validatedData.side === 'buy' ? 175.25 : 174.85,
        filledQuantity: validatedData.quantity,
        status: 'filled'
      })
    };

    return successResponse(
      mockTradeResponse, 
      `Trade order ${validatedData.side.toUpperCase()} ${validatedData.quantity} ${validatedData.symbol} submitted successfully`
    );

  } catch (error) {
    if (error instanceof SyntaxError) {
      return badRequestResponse('Invalid JSON in request body');
    }
    
    if (error && typeof error === 'object' && 'issues' in error) {
      return validationErrorResponse(error as any);
    }

    console.error('Trade execution error:', error);
    return serviceUnavailableResponse('Trade execution service temporarily unavailable');
  }
}

// TODO: Add real Alpaca trading integration
// - Implement proper Alpaca API order submission
// - Add pre-trade validation (buying power, position limits, etc.)
// - Implement order status tracking and updates
// - Add risk management checks before execution
// - Store trade records in database for audit trail