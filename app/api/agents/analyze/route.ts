/**
 * Agents Analyze API route - POST trigger analysis
 */

import { NextRequest, NextResponse } from 'next/server';
import { facade } from '@/server/lib/factoryFacade';
import { parseAuth, createErrorResponse, createSuccessResponse } from '@/server/lib/middleware';
import { validateBody, AnalysisRequestSchema } from '@/lib/schemas/zodSchemas';
import { config, proxyToMock } from '@/lib/config';

export async function POST(request: NextRequest) {
  try {
    const authResult = parseAuth(request);
    if (!authResult.success) {
      return NextResponse.json(createErrorResponse(authResult.error!, authResult.status), { status: authResult.status });
    }

    const ctx = authResult.context!;

    const bodyValidation = await validateBody(request, AnalysisRequestSchema);
    if (!bodyValidation.success) {
      return NextResponse.json(createErrorResponse('Invalid analysis request', 422, bodyValidation.error.flatten()), { status: 422 });
    }

    const analysisRequest = bodyValidation.data;

    try {
      const adapter = await facade.getAdapterForUser(ctx.tenantId, ctx.userId);
      const analysisResult = await adapter.create({ type: 'analysis', ...analysisRequest });
      return NextResponse.json(createSuccessResponse(analysisResult, 'Analysis started successfully'));
    } catch (adapterError) {
      if (config.useMock) {
        try {
          return await proxyToMock(request);
        } catch {
          const mockResult = { id: `analysis-${Date.now()}`, status: 'pending', symbols: analysisRequest.symbols };
          return NextResponse.json(createSuccessResponse(mockResult, 'Mock analysis started'));
        }
      }
      return NextResponse.json(createErrorResponse('Analysis service unavailable', 502), { status: 502 });
    }
  } catch (error) {
    return NextResponse.json(createErrorResponse('Internal server error', 500), { status: 500 });
  }
}