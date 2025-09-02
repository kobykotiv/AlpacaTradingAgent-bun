/**
 * Integrations API route - GET integrations
 */

import { NextRequest, NextResponse } from 'next/server';
import { facade } from '@/server/lib/factoryFacade';
import { parseAuth, createErrorResponse, createSuccessResponse } from '@/server/lib/middleware';
import { config, proxyToMock } from '@/lib/config';
import { Integration } from '@/lib/types/serverTypes';

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

    try {
      const adapter = await facade.getAdapterForUser(ctx.tenantId, ctx.userId);
      const integrationsData = await adapter.list({ type: 'integrations' });

      const integrations: Integration[] = Array.isArray(integrationsData) 
        ? integrationsData.map(integration => ({
            id: integration.id || `integration-${Date.now()}`,
            provider: integration.provider || 'unknown',
            name: integration.name || 'Unknown Integration',
            isActive: integration.isActive ?? false,
            createdAt: integration.createdAt || new Date().toISOString(),
            lastSync: integration.lastSync,
            status: integration.status || 'pending',
          }))
        : [];

      return NextResponse.json(createSuccessResponse(integrations));

    } catch (adapterError) {
      if (config.useMock) {
        try {
          return await proxyToMock(request);
        } catch {
          return NextResponse.json(createSuccessResponse([]));
        }
      }
      return NextResponse.json(createErrorResponse('Integrations service unavailable', 502), { status: 502 });
    }

  } catch (error) {
    return NextResponse.json(createErrorResponse('Internal server error', 500), { status: 500 });
  }
}