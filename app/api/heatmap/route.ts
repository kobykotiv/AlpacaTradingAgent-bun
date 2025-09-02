/**
 * Heatmap API route - GET market heatmap data
 */

import { NextRequest, NextResponse } from 'next/server';
import { facade } from '@/server/lib/factoryFacade';
import { parseAuth, createErrorResponse, createSuccessResponse } from '@/server/lib/middleware';
import { validateQuery, HeatmapQuerySchema } from '@/lib/schemas/zodSchemas';
import { config, proxyToMock } from '@/lib/config';
import { HeatmapData } from '@/lib/types/serverTypes';

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
    const queryValidation = validateQuery(searchParams, HeatmapQuerySchema);
    
    if (!queryValidation.success) {
      return NextResponse.json(
        createErrorResponse('Invalid query parameters', 422, queryValidation.error.flatten()),
        { status: 422 }
      );
    }

    const queryParams = queryValidation.data;

    try {
      const adapter = await facade.getAdapterForUser(ctx.tenantId, ctx.userId);
      const heatmapData = await adapter.list({ type: 'heatmap', ...queryParams });

      const data: HeatmapData[] = Array.isArray(heatmapData) 
        ? heatmapData.map(item => ({
            symbol: item.symbol || 'UNKNOWN',
            change: item.change || 0,
            changePercent: item.changePercent || 0,
            volume: item.volume || 0,
            marketCap: item.marketCap,
            sector: item.sector,
          }))
        : [];

      return NextResponse.json(createSuccessResponse(data));

    } catch (adapterError) {
      if (config.useMock) {
        try {
          return await proxyToMock(request);
        } catch (mockError) {
          return NextResponse.json(
            createSuccessResponse([], 'Using fallback data - integrations unavailable')
          );
        }
      }
      
      return NextResponse.json(
        createErrorResponse('Heatmap service unavailable', 502),
        { status: 502 }
      );
    }

  } catch (error) {
    console.error('Heatmap API error:', error);
    return NextResponse.json(
      createErrorResponse('Internal server error', 500),
      { status: 500 }
    );
  }
}