/**
 * Scheduler Job Deletion API endpoint
 * DELETE /api/scheduler/jobs/[id] - Delete a scheduled job
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
  // Authorization check (requires trader role to delete jobs)
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
    return badRequestResponse('Job ID parameter is required');
  }

  // If mock mode is enabled, proxy to mock server
  if (shouldProxy()) {
    return proxyToMockServer(request, `/api/scheduler/jobs/${id}`);
  }

  // Mock job deletion logic
  // In real implementation, check if job exists and belongs to user's tenant
  if (id === 'nonexistent') {
    return notFoundResponse('Scheduled job not found');
  }

  // Mock successful deletion response
  return successResponse(
    { id, deletedAt: new Date().toISOString() },
    `Scheduled job ${id} deleted successfully`
  );
}

// TODO: Add real job management integration
// - Implement actual job lookup and validation
// - Add proper job cancellation logic
// - Implement audit logging for job deletions
// - Add job dependency checking before deletion