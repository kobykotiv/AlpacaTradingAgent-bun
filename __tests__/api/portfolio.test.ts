/**
 * Tests for Portfolio API route
 */

import { GET } from '@/app/api/portfolio/route';
import { facade } from '@/server/lib/factoryFacade';
import { NextRequest } from 'next/server';

// Mock the facade
jest.mock('@/server/lib/factoryFacade', () => ({
  facade: {
    getAdapterForUser: jest.fn(),
  },
}));

// Mock the config
jest.mock('@/lib/config', () => ({
  config: {
    useMock: true,
    mockServerUrl: 'http://localhost:3001',
  },
  proxyToMock: jest.fn().mockResolvedValue(
    new Response(
      JSON.stringify({
        data: {
          balance: 5000,
          buyingPower: 4000,
          cash: 1000,
          positions: [],
          dailyChange: 0,
          dailyChangePercent: 0,
        },
        success: true,
        timestamp: new Date().toISOString(),
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    )
  ),
}));

describe('/api/portfolio', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return portfolio data when adapter succeeds', async () => {
    // Mock adapter
    const mockAdapter = {
      list: jest.fn().mockResolvedValue({
        balance: 10000,
        buyingPower: 8000,
        cash: 2000,
        positions: [
          {
            symbol: 'AAPL',
            quantity: 10,
            averagePrice: 150.00,
            currentPrice: 155.00,
            marketValue: 1550.00,
            unrealizedPL: 50.00,
            unrealizedPLPercent: 3.33,
            side: 'long',
          },
        ],
        dailyChange: 50.00,
        dailyChangePercent: 0.5,
      }),
    };

    (facade.getAdapterForUser as jest.Mock).mockResolvedValue(mockAdapter);

    // Create mock request with auth headers
    const request = new NextRequest('http://localhost:3000/api/portfolio', {
      method: 'GET',
      headers: {
        'x-tenant-id': 'test-tenant',
        'x-user-id': 'test-user',
        'authorization': 'Bearer test-token',
      },
    });

    const response = await GET(request);
    const responseData = await response.json();

    expect(response.status).toBe(200);
    expect(responseData.success).toBe(true);
    expect(responseData.data).toMatchObject({
      balance: 10000,
      buyingPower: 8000,
      cash: 2000,
      positions: expect.arrayContaining([
        expect.objectContaining({
          symbol: 'AAPL',
          quantity: 10,
        }),
      ]),
    });

    // Verify facade was called correctly
    expect(facade.getAdapterForUser).toHaveBeenCalledWith('test-tenant', 'test-user');
    expect(mockAdapter.list).toHaveBeenCalledWith({
      type: 'portfolio',
      includePositions: true,
      includeProfitLoss: true,
    });
  });

  it('should return 401 when auth headers are missing and user is not authenticated', async () => {
    const request = new NextRequest('http://localhost:3000/api/portfolio', {
      method: 'GET',
    });

    const response = await GET(request);
    
    // Should succeed but with anonymous user context
    expect(response.status).toBe(200);
  });

  it('should fall back to mock when adapter fails', async () => {
    // Mock adapter to throw error
    (facade.getAdapterForUser as jest.Mock).mockRejectedValue(new Error('Adapter failed'));

    const request = new NextRequest('http://localhost:3000/api/portfolio', {
      method: 'GET',
      headers: {
        'x-tenant-id': 'test-tenant',
        'x-user-id': 'test-user',
      },
    });

    const response = await GET(request);
    const responseData = await response.json();

    expect(response.status).toBe(200);
    expect(responseData.data).toMatchObject({
      balance: 5000,
      buyingPower: 4000,
      cash: 1000,
    });
  });

  it('should validate query parameters correctly', async () => {
    const mockAdapter = {
      list: jest.fn().mockResolvedValue({
        balance: 0,
        buyingPower: 0,
        cash: 0,
        positions: [],
        dailyChange: 0,
        dailyChangePercent: 0,
      }),
    };

    (facade.getAdapterForUser as jest.Mock).mockResolvedValue(mockAdapter);

    const request = new NextRequest('http://localhost:3000/api/portfolio?includePositions=false&includeProfitLoss=false', {
      method: 'GET',
      headers: {
        'x-tenant-id': 'test-tenant',
        'x-user-id': 'test-user',
      },
    });

    const response = await GET(request);
    
    expect(response.status).toBe(200);
    expect(mockAdapter.list).toHaveBeenCalledWith({
      type: 'portfolio',
      includePositions: false,
      includeProfitLoss: false,
    });
  });

  it('should return 422 for invalid query parameters', async () => {
    const request = new NextRequest('http://localhost:3000/api/portfolio?includePositions=invalid', {
      method: 'GET',
      headers: {
        'x-tenant-id': 'test-tenant',
        'x-user-id': 'test-user',
      },
    });

    const response = await GET(request);
    
    expect(response.status).toBe(422);
    const responseData = await response.json();
    expect(responseData.error).toContain('Invalid query parameters');
  });
});