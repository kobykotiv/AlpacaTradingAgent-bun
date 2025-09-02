/**
 * Indicators API route - GET technical indicators
 */

import { NextRequest, NextResponse } from 'next/server';
import { facade } from '@/server/lib/factoryFacade';
import { parseAuth, createErrorResponse, createSuccessResponse } from '@/server/lib/middleware';
import { config, proxyToMock } from '@/lib/config';

export async function GET(request: NextRequest) {
  try {
    const authResult = parseAuth(request);
    if (!authResult.success) {
      return NextResponse.json(createErrorResponse(authResult.error!, authResult.status), { status: authResult.status });
    }

    const ctx = authResult.context!;

    try {
      const adapter = await facade.getAdapterForUser(ctx.tenantId, ctx.userId);
      const indicatorsData = await adapter.list({ type: 'indicators' });
      return NextResponse.json(createSuccessResponse(indicatorsData || []));
    } catch (adapterError) {
      if (config.useMock) {
        try {
          return await proxyToMock(request);
        } catch {
          return NextResponse.json(createSuccessResponse([]));
        }
      }
      return NextResponse.json(createErrorResponse('Indicators service unavailable', 502), { status: 502 });
    }
  } catch (error) {
    return NextResponse.json(createErrorResponse('Internal server error', 500), { status: 500 });
  }
}