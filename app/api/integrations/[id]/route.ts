/**
 * Integration Deletion API endpoint
 * DELETE /api/integrations/[id] - Disconnect an integration
 */

import { NextRequest } from 'next/server';
import { authorize } from '@/lib/server/middleware';
import { proxyToMockServer, shouldProxy } from '@/lib/server/proxy';
import { 
  successResponse, 
  unauthorizedResponse, 
  forbiddenResponse, 
  badRequestResponse,
  notFoundResponse
} from '@/app/api/_helpers/response';

interface Props {
  params: Promise<{
    id: string;
  }>;
}

export async function DELETE(request: NextRequest, { params }: Props) {
  // Authorization check (requires trader role to disconnect integrations)
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

  const { id } = await params;
  
  if (!id || id.trim() === '') {
    return badRequestResponse('Integration ID parameter is required');
  }

  // If mock mode is enabled, proxy to mock server
  if (shouldProxy()) {
    return proxyToMockServer(request, `/api/integrations/${id}`);
  }

  // Mock integration deletion logic
  // In real implementation, check if integration exists and belongs to user's tenant
  if (id === 'nonexistent') {
    return notFoundResponse('Integration not found');
  }

  // Mock successful deletion response
  return successResponse(
    { id, disconnectedAt: new Date().toISOString() },
    `Integration ${id} disconnected successfully`
  );
}

// TODO: Add real integration management
// - Implement actual integration lookup and validation
// - Add proper credential cleanup and revocation
// - Implement audit logging for integration changes
// - Add dependency checking (e.g., active trading strategies)