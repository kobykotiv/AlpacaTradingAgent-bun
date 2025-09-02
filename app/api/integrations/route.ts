/**
 * Integrations API endpoint
 * GET /api/integrations - List connected integrations
 */

import { NextRequest } from 'next/server';
import { authorize } from '@/lib/server/middleware';
import { proxyToMockServer, shouldProxy } from '@/lib/server/proxy';
import { IntegrationResponse } from '@/lib/schemas/zodSchemas';
import { 
  successResponse, 
  unauthorizedResponse, 
  forbiddenResponse, 
  badRequestResponse 
} from '@/app/api/_helpers/response';

export async function GET(request: NextRequest) {
  // Authorization check
  const authResult = authorize(request, 'viewer');
  
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
    return proxyToMockServer(request, '/api/integrations');
  }

  // Mock integrations data for development
  const mockIntegrations: IntegrationResponse[] = [
    {
      id: 'integration_001',
      type: 'alpaca',
      name: 'Main Trading Account',
      status: 'connected',
      settings: {
        paperTrading: true,
        accountType: 'margin'
      },
      enabled: true,
      createdAt: '2023-12-01T00:00:00Z',
      lastSync: '2024-01-02T12:30:00Z'
    },
    {
      id: 'integration_002',
      type: 'webhook',
      name: 'TradingView Alerts',
      status: 'connected',
      settings: {
        url: 'https://example.com/webhook',
        secret: 'webhook_secret_***'
      },
      enabled: true,
      createdAt: '2023-12-15T00:00:00Z',
      lastSync: '2024-01-02T11:45:00Z'
    },
    {
      id: 'integration_003',
      type: 'binance',
      name: 'Crypto Trading',
      status: 'error',
      settings: {
        testnet: true
      },
      enabled: false,
      createdAt: '2024-01-01T00:00:00Z'
    }
  ];

  return successResponse(mockIntegrations, 'Integrations retrieved successfully');
}

// TODO: Add real integration management
// - Connect to actual trading platform APIs
// - Implement integration health monitoring
// - Add credential encryption and secure storage
// - Implement integration sync status tracking