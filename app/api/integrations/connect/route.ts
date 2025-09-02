/**
 * Integration Connection API endpoint
 * POST /api/integrations/connect - Connect a new integration
 */

import { NextRequest } from 'next/server';
import { authorize } from '@/lib/server/middleware';
import { proxyToMockServer, shouldProxy } from '@/lib/server/proxy';
import { ConnectIntegrationSchema, IntegrationResponse } from '@/lib/schemas/zodSchemas';
import { 
  successResponse, 
  unauthorizedResponse, 
  forbiddenResponse, 
  badRequestResponse,
  validationErrorResponse
} from '@/app/api/_helpers/response';

export async function POST(request: NextRequest) {
  // Authorization check (requires trader role to connect integrations)
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
    return proxyToMockServer(request, '/api/integrations/connect');
  }

  try {
    // Parse and validate request body
    const body = await request.json();
    const validatedData = ConnectIntegrationSchema.parse(body);

    // Mock integration connection response
    const newIntegration: IntegrationResponse = {
      id: `integration_${Date.now()}`,
      type: validatedData.type,
      name: validatedData.name,
      status: 'connected',
      settings: validatedData.settings,
      enabled: validatedData.enabled,
      createdAt: new Date().toISOString(),
      lastSync: new Date().toISOString()
    };

    return successResponse(
      newIntegration, 
      `Integration '${validatedData.name}' connected successfully`,
      201
    );

  } catch (error) {
    if (error instanceof SyntaxError) {
      return badRequestResponse('Invalid JSON in request body');
    }
    
    if (error && typeof error === 'object' && 'issues' in error) {
      return validationErrorResponse(error as any);
    }

    console.error('Integration connection error:', error);
    return badRequestResponse('Failed to connect integration');
  }
}

// TODO: Add real integration connection logic
// - Implement actual API key validation for each platform
// - Add secure credential storage and encryption
// - Implement connection testing and health checks
// - Add integration-specific configuration options