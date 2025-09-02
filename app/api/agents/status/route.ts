/**
 * Agents Status API endpoint
 * GET /api/agents/status - Retrieve trading agents status
 */

import { NextRequest } from 'next/server';
import { authorize } from '@/lib/server/middleware';
import { proxyToMockServer, shouldProxy } from '@/lib/server/proxy';
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
    return proxyToMockServer(request, '/api/agents/status');
  }

  // Mock agents status data for development
  const mockAgentsStatus = {
    agents: [
      {
        id: 'market-analyst-1',
        name: 'Market Analyst',
        type: 'market_analyst',
        status: 'active',
        lastActivity: new Date(Date.now() - 300000).toISOString(), // 5 minutes ago
        performance: {
          accuracy: 78.5,
          totalPredictions: 142,
          successfulTrades: 89
        },
        currentTask: 'Analyzing AAPL technical indicators'
      },
      {
        id: 'sentiment-analyst-1',
        name: 'Sentiment Analyst',
        type: 'sentiment_analyst',
        status: 'active',
        lastActivity: new Date(Date.now() - 180000).toISOString(), // 3 minutes ago
        performance: {
          accuracy: 72.3,
          totalPredictions: 98,
          successfulTrades: 67
        },
        currentTask: 'Processing social media sentiment for TSLA'
      },
      {
        id: 'news-analyst-1',
        name: 'News Analyst',
        type: 'news_analyst',
        status: 'idle',
        lastActivity: new Date(Date.now() - 1800000).toISOString(), // 30 minutes ago
        performance: {
          accuracy: 81.2,
          totalPredictions: 76,
          successfulTrades: 58
        },
        currentTask: null
      },
      {
        id: 'risk-manager-1',
        name: 'Risk Manager',
        type: 'risk_manager',
        status: 'active',
        lastActivity: new Date(Date.now() - 60000).toISOString(), // 1 minute ago
        performance: {
          accuracy: 85.7,
          totalPredictions: 234,
          successfulTrades: 189
        },
        currentTask: 'Monitoring portfolio risk exposure'
      },
      {
        id: 'portfolio-manager-1',
        name: 'Portfolio Manager',
        type: 'portfolio_manager',
        status: 'error',
        lastActivity: new Date(Date.now() - 3600000).toISOString(), // 1 hour ago
        performance: {
          accuracy: 68.9,
          totalPredictions: 45,
          successfulTrades: 31
        },
        currentTask: null,
        error: 'API rate limit exceeded'
      }
    ],
    summary: {
      totalAgents: 5,
      activeAgents: 3,
      idleAgents: 1,
      errorAgents: 1,
      avgAccuracy: 77.3,
      systemHealth: 'good'
    },
    lastUpdated: new Date().toISOString()
  };

  return successResponse(mockAgentsStatus, 'Agents status retrieved successfully');
}

// TODO: Add real agent management integration
// - Connect to actual trading agent framework status
// - Implement agent lifecycle management (start/stop/restart)
// - Add real-time agent communication and monitoring
// - Implement agent performance analytics and optimization