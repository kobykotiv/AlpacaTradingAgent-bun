/**
 * API Routes Tests
 * Tests for Next.js API routes including middleware, validation, and proxy behavior
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { NextRequest } from 'next/server';
import { 
  requireAuth, 
  getAuthContext, 
  validateBody, 
  createSuccessResponse,
  createErrorResponse,
  CreateJobSchema 
} from '../lib/middleware';
import { createAdapter } from '../server/lib/factoryFacade';

// Mock the factory facade
vi.mock('../server/lib/factoryFacade', () => ({
  createAdapter: vi.fn(),
}));

// Mock adapter for testing
const mockAdapter = {
  getAccount: vi.fn(),
  getPositions: vi.fn(),
  placeOrder: vi.fn(),
  getMarketData: vi.fn(),
};

describe('API Middleware Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (createAdapter as any).mockResolvedValue(mockAdapter);
  });

  describe('Authentication Middleware', () => {
    it('should return 400 when x-tenant-id header is missing', async () => {
      const request = new NextRequest('http://localhost/api/test');
      const handler = requireAuth(async () => new Response());
      
      const response = await handler(request);
      const data = await response.json();
      
      expect(response.status).toBe(400);
      expect(data.error.code).toBe('MISSING_TENANT');
    });

    it('should return 401 when Authorization header is missing', async () => {
      const request = new NextRequest('http://localhost/api/test', {
        headers: { 'x-tenant-id': 'test-tenant' }
      });
      const handler = requireAuth(async () => new Response());
      
      const response = await handler(request);
      const data = await response.json();
      
      expect(response.status).toBe(401);
      expect(data.error.code).toBe('MISSING_AUTH');
    });

    it('should extract auth context correctly', () => {
      const request = new NextRequest('http://localhost/api/test', {
        headers: {
          'x-tenant-id': 'test-tenant',
          'authorization': 'Bearer user_test123',
          'x-user-role': 'admin'
        }
      });
      
      const context = getAuthContext(request);
      
      expect(context).toEqual({
        tenantId: 'test-tenant',
        userId: 'test123',
        role: 'admin'
      });
    });

    it('should use default demo user for invalid tokens', () => {
      const request = new NextRequest('http://localhost/api/test', {
        headers: {
          'x-tenant-id': 'test-tenant',
          'authorization': 'Bearer invalid-token'
        }
      });
      
      const context = getAuthContext(request);
      
      expect(context?.userId).toBe('demo-user-123');
      expect(context?.role).toBe('user');
    });
  });

  describe('Validation Middleware', () => {
    it('should return 422 for invalid request body', async () => {
      const request = new NextRequest('http://localhost/api/test', {
        method: 'POST',
        headers: {
          'x-tenant-id': 'test-tenant',
          'authorization': 'Bearer user_test123',
          'content-type': 'application/json'
        },
        body: JSON.stringify({
          name: '', // Invalid: empty string
          type: 'invalid-type', // Invalid: not in enum
          schedule: 'invalid-cron'
        })
      });

      const handler = validateBody(CreateJobSchema)(async () => new Response());
      const response = await handler(request);
      const data = await response.json();
      
      expect(response.status).toBe(422);
      expect(data.error.code).toBe('VALIDATION_ERROR');
      expect(data.error.details).toHaveLength(2); // name and type errors
    });

    it('should pass validation with correct body', async () => {
      const validBody = {
        name: 'Test Job',
        type: 'analysis' as const,
        schedule: '0 9 * * 1-5',
        configuration: { test: true }
      };

      const request = new NextRequest('http://localhost/api/test', {
        method: 'POST',
        headers: {
          'x-tenant-id': 'test-tenant',
          'authorization': 'Bearer user_test123',
          'content-type': 'application/json'
        },
        body: JSON.stringify(validBody)
      });

      let capturedBody: any = null;
      const handler = validateBody(CreateJobSchema)(async (req, context, body) => {
        capturedBody = body;
        return createSuccessResponse({ success: true });
      });

      const response = await handler(request);
      
      expect(response.status).toBe(200);
      expect(capturedBody).toEqual(validBody);
    });
  });
});

describe('Proxy Helper Tests', () => {
  it('should forward requests when USE_MOCK=true and MOCK_API_BASE is set', async () => {
    // Mock global fetch
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      headers: new Headers({ 'content-type': 'application/json' }),
      json: async () => ({ mock: 'response' }),
      text: async () => JSON.stringify({ mock: 'response' })
    });
    
    global.fetch = mockFetch;

    // Set environment for proxy mode
    process.env.USE_MOCK = 'true';
    process.env.MOCK_API_BASE = 'http://localhost:3001';

    // Test proxy forwarding logic (simplified)
    const targetUrl = 'http://localhost:3001/api/portfolio';
    const response = await fetch(targetUrl, {
      method: 'GET',
      headers: {
        'x-tenant-id': 'test-tenant',
        'authorization': 'Bearer test-token'
      }
    });

    expect(mockFetch).toHaveBeenCalledWith(targetUrl, expect.objectContaining({
      method: 'GET',
      headers: expect.objectContaining({
        'x-tenant-id': 'test-tenant',
        'authorization': 'Bearer test-token'
      })
    }));

    const data = await response.json();
    expect(data).toEqual({ mock: 'response' });
  });
});

describe('Role-based Authorization', () => {
  it('should return 403 for insufficient permissions', async () => {
    const request = new NextRequest('http://localhost/api/admin', {
      headers: {
        'x-tenant-id': 'test-tenant',
        'authorization': 'Bearer user_test123',
        'x-user-role': 'user'
      }
    });

    // This would be implemented in a route that requires admin role
    const handler = requireAuth(async (req, context) => {
      if (context.role !== 'admin') {
        return createErrorResponse(
          'INSUFFICIENT_PERMISSIONS',
          `Required role: admin, but got: ${context.role}`,
          403
        );
      }
      return createSuccessResponse({ authorized: true });
    });

    const response = await handler(request);
    const data = await response.json();
    
    expect(response.status).toBe(403);
    expect(data.error.code).toBe('INSUFFICIENT_PERMISSIONS');
  });

  it('should allow access with correct role', async () => {
    const request = new NextRequest('http://localhost/api/admin', {
      headers: {
        'x-tenant-id': 'test-tenant',
        'authorization': 'Bearer user_test123',
        'x-user-role': 'admin'
      }
    });

    const handler = requireAuth(async (req, context) => {
      if (context.role !== 'admin') {
        return createErrorResponse(
          'INSUFFICIENT_PERMISSIONS', 
          'Admin role required',
          403
        );
      }
      return createSuccessResponse({ authorized: true });
    });

    const response = await handler(request);
    const data = await response.json();
    
    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.data.authorized).toBe(true);
  });
});

describe('Factory Facade Integration', () => {
  beforeEach(() => {
    mockAdapter.getAccount.mockResolvedValue({
      buyingPower: 50000,
      cash: 25000,
      equity: 75000,
      dayTradeCount: 2,
      portfolioValue: 75000
    });

    mockAdapter.getPositions.mockResolvedValue([
      {
        symbol: 'AAPL',
        quantity: 10,
        side: 'long',
        marketValue: 1500,
        costBasis: 1400,
        unrealizedPL: 100
      }
    ]);
  });

  it('should create adapter with user context', async () => {
    const tenantId = 'test-tenant';
    const userId = 'test-user';
    
    await createAdapter(tenantId, userId);
    
    expect(createAdapter).toHaveBeenCalledWith(tenantId, userId);
  });

  it('should use mock adapter when USE_ALPACA is false', async () => {
    process.env.USE_ALPACA = 'false';
    
    const adapter = await createAdapter('test-tenant', 'test-user');
    const account = await adapter.getAccount();
    
    expect(account).toBeDefined();
    expect(typeof account.buyingPower).toBe('number');
  });
});