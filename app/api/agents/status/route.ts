/**
 * Agent Status API route
 * Returns status of all trading agents
 */

import { NextRequest } from 'next/server';
import { requireAuth, createSuccessResponse, createErrorResponse, withErrorHandling } from '@/lib/middleware';
import { AgentStatusResponse, AgentStatus } from '@/lib/types/serverTypes';

// Mock agent data - in real implementation, this would come from a monitoring system
const MOCK_AGENTS: AgentStatus[] = [
  {
    id: 'market-analyst-001',
    name: 'Market Analyst',
    status: 'active',
    lastAction: 'Analyzed SPY market trends',
    lastActionTime: new Date(Date.now() - 5 * 60 * 1000).toISOString(), // 5 minutes ago
    performance: {
      successRate: 87.5,
      totalActions: 156,
      avgExecutionTime: 2.3,
    },
    configuration: {
      symbols: ['SPY', 'QQQ', 'IWM'],
      refreshInterval: 300, // 5 minutes
      enabled: true,
    },
  },
  {
    id: 'sentiment-analyst-001',
    name: 'Social Sentiment Analyst',
    status: 'active',
    lastAction: 'Processed Reddit sentiment for NVDA',
    lastActionTime: new Date(Date.now() - 2 * 60 * 1000).toISOString(), // 2 minutes ago
    performance: {
      successRate: 92.1,
      totalActions: 243,
      avgExecutionTime: 4.7,
    },
    configuration: {
      sources: ['reddit', 'twitter'],
      sentiment_threshold: 0.6,
      enabled: true,
    },
  },
  {
    id: 'news-analyst-001',
    name: 'News Analyst',
    status: 'active',
    lastAction: 'Analyzed earnings reports for tech sector',
    lastActionTime: new Date(Date.now() - 8 * 60 * 1000).toISOString(), // 8 minutes ago
    performance: {
      successRate: 89.7,
      totalActions: 134,
      avgExecutionTime: 3.1,
    },
    configuration: {
      sources: ['finnhub', 'reuters', 'bloomberg'],
      relevance_threshold: 0.7,
      enabled: true,
    },
  },
  {
    id: 'fundamentals-analyst-001',
    name: 'Fundamentals Analyst',
    status: 'idle',
    lastAction: 'Calculated P/E ratios for portfolio holdings',
    lastActionTime: new Date(Date.now() - 15 * 60 * 1000).toISOString(), // 15 minutes ago
    performance: {
      successRate: 94.3,
      totalActions: 89,
      avgExecutionTime: 8.2,
    },
    configuration: {
      metrics: ['pe_ratio', 'debt_to_equity', 'roa', 'roe'],
      update_frequency: 'daily',
      enabled: true,
    },
  },
  {
    id: 'macro-analyst-001',
    name: 'Macro Analyst',
    status: 'active',
    lastAction: 'Processed latest Fed interest rate data',
    lastActionTime: new Date(Date.now() - 1 * 60 * 1000).toISOString(), // 1 minute ago
    performance: {
      successRate: 91.2,
      totalActions: 67,
      avgExecutionTime: 12.5,
    },
    configuration: {
      indicators: ['fed_rate', 'inflation', 'gdp', 'unemployment'],
      data_sources: ['fred', 'bls'],
      enabled: true,
    },
  },
  {
    id: 'trading-executor-001',
    name: 'Trading Executor',
    status: 'error',
    lastAction: 'Failed to execute TSLA buy order',
    lastActionTime: new Date(Date.now() - 3 * 60 * 1000).toISOString(), // 3 minutes ago
    performance: {
      successRate: 78.9,
      totalActions: 45,
      avgExecutionTime: 1.8,
    },
    configuration: {
      max_position_size: 0.05,
      risk_tolerance: 'moderate',
      enabled: false, // Disabled due to error
    },
  },
];

async function agentStatusHandler(request: NextRequest, context: any) {
  try {
    // Calculate system status based on agent statuses
    const errorAgents = MOCK_AGENTS.filter(agent => agent.status === 'error').length;
    const totalAgents = MOCK_AGENTS.length;
    
    let systemStatus: 'healthy' | 'degraded' | 'error' = 'healthy';
    if (errorAgents > 0) {
      systemStatus = errorAgents > totalAgents / 2 ? 'error' : 'degraded';
    }

    const response: AgentStatusResponse = {
      agents: MOCK_AGENTS,
      systemStatus,
      lastUpdated: new Date().toISOString(),
    };

    return createSuccessResponse(response);
    
  } catch (error) {
    console.error('Agent status fetch error:', error);
    return createErrorResponse(
      'AGENT_STATUS_ERROR',
      'Failed to fetch agent status',
      500
    );
  }
}

export const GET = withErrorHandling(requireAuth(agentStatusHandler));