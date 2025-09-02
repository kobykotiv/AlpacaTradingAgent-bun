/**
 * Open Trades API route
 * Returns user's current open/pending trades
 */

import { NextRequest } from 'next/server';
import { requireAuth, createSuccessResponse, createErrorResponse, withErrorHandling } from '@/lib/middleware';
import { OpenTradesResponse, OpenTrade } from '@/lib/types/serverTypes';

// Mock open trades data - in real implementation, this would come from the trading adapter
const MOCK_TRADES: OpenTrade[] = [
  {
    id: 'order_001',
    symbol: 'AAPL',
    side: 'buy',
    quantity: 10,
    type: 'limit',
    status: 'pending',
    orderPrice: 185.50,
    createdAt: new Date(Date.now() - 30 * 60 * 1000).toISOString(), // 30 minutes ago
    updatedAt: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
    agentId: 'trading-executor-001',
  },
  {
    id: 'order_002',
    symbol: 'NVDA',
    side: 'sell',
    quantity: 5,
    type: 'market',
    status: 'filled',
    fillPrice: 892.34,
    createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(), // 2 hours ago
    updatedAt: new Date(Date.now() - 2 * 60 * 60 * 1000 + 5 * 60 * 1000).toISOString(), // Filled 5 min later
    agentId: 'trading-executor-001',
  },
  {
    id: 'order_003',
    symbol: 'TSLA',
    side: 'buy',
    quantity: 8,
    type: 'stop',
    status: 'cancelled',
    orderPrice: 245.00,
    createdAt: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(), // 4 hours ago
    updatedAt: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(), // Cancelled 1 hour ago
    agentId: 'trading-executor-001',
  },
  {
    id: 'order_004',
    symbol: 'META',
    side: 'buy',
    quantity: 15,
    type: 'limit',
    status: 'pending',
    orderPrice: 495.75,
    createdAt: new Date(Date.now() - 45 * 60 * 1000).toISOString(), // 45 minutes ago
    updatedAt: new Date(Date.now() - 45 * 60 * 1000).toISOString(),
    agentId: 'trading-executor-001',
  },
  {
    id: 'order_005',
    symbol: 'GOOGL',
    side: 'sell',
    quantity: 3,
    type: 'market',
    status: 'rejected',
    createdAt: new Date(Date.now() - 10 * 60 * 1000).toISOString(), // 10 minutes ago
    updatedAt: new Date(Date.now() - 8 * 60 * 1000).toISOString(), // Rejected 2 min later
    agentId: 'trading-executor-001',
  },
];

async function openTradesHandler(request: NextRequest, context: any) {
  const { searchParams } = new URL(request.url);
  
  // Filter options
  const statusFilter = searchParams.get('status');
  const symbolFilter = searchParams.get('symbol');
  const limit = parseInt(searchParams.get('limit') || '50');

  try {
    let trades = [...MOCK_TRADES];

    // Apply filters
    if (statusFilter) {
      trades = trades.filter(trade => trade.status === statusFilter);
    }
    
    if (symbolFilter) {
      trades = trades.filter(trade => 
        trade.symbol.toLowerCase().includes(symbolFilter.toLowerCase())
      );
    }

    // Apply limit
    trades = trades.slice(0, limit);

    // Sort by creation date (newest first)
    trades.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    // Calculate summary
    const summary = {
      total: trades.length,
      pending: trades.filter(trade => trade.status === 'pending').length,
      filled: trades.filter(trade => trade.status === 'filled').length,
    };

    const response: OpenTradesResponse = {
      trades,
      summary,
      lastUpdated: new Date().toISOString(),
    };

    return createSuccessResponse(response);
    
  } catch (error) {
    console.error('Open trades fetch error:', error);
    return createErrorResponse(
      'TRADES_FETCH_ERROR',
      'Failed to fetch open trades',
      500
    );
  }
}

export const GET = withErrorHandling(requireAuth(openTradesHandler));