/**
 * Agent Status API route - GET agent status information
 */

import { NextRequest, NextResponse } from 'next/server';
import { facade } from '@/server/lib/factoryFacade';
import { parseAuth, createErrorResponse, createSuccessResponse } from '@/server/lib/middleware';
import { config, proxyToMock } from '@/lib/config';
import { AgentStatus } from '@/lib/types/serverTypes';

export async function GET(request: NextRequest) {
  try {
    // Parse authentication
    const authResult = parseAuth(request);
    if (!authResult.success) {
      return NextResponse.json(
        createErrorResponse(authResult.error!, authResult.status),
        { status: authResult.status }
      );
    }

    const ctx = authResult.context!;

    try {
      // Get adapter for user
      const adapter = await facade.getAdapterForUser(ctx.tenantId, ctx.userId);
      
      // Call adapter to get agent status
      const agentsData = await adapter.list({ type: 'agents' });

      // Ensure data matches AgentStatus interface
      const agents: AgentStatus[] = Array.isArray(agentsData) 
        ? agentsData.map(agent => ({
            id: agent.id || `agent-${Date.now()}`,
            name: agent.name || 'Unknown Agent',
            status: agent.status || 'inactive',
            lastRun: agent.lastRun,
            nextRun: agent.nextRun,
            performance: agent.performance,
          }))
        : [
            {
              id: 'agent-market-analyst',
              name: 'Market Analyst',
              status: 'active',
              lastRun: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
              nextRun: new Date(Date.now() + 6 * 60 * 60 * 1000).toISOString(),
              performance: {
                accuracy: 0.78,
                totalTrades: 45,
                winRate: 0.67,
              },
            },
            {
              id: 'agent-risk-manager',
              name: 'Risk Manager',
              status: 'active',
              lastRun: new Date(Date.now() - 10 * 60 * 1000).toISOString(),
              performance: {
                accuracy: 0.92,
                totalTrades: 0,
                winRate: 0.0,
              },
            },
          ];

      return NextResponse.json(createSuccessResponse(agents));

    } catch (adapterError) {
      console.warn('Adapter error, falling back to mock:', adapterError);
      
      if (config.useMock) {
        try {
          return await proxyToMock(request);
        } catch (mockError) {
          // Return safe fallback data
          const fallbackAgents: AgentStatus[] = [
            {
              id: 'agent-fallback',
              name: 'Fallback Agent',
              status: 'inactive',
              performance: {
                accuracy: 0.0,
                totalTrades: 0,
                winRate: 0.0,
              },
            },
          ];
          
          return NextResponse.json(
            createSuccessResponse(fallbackAgents, 'Using fallback data - integrations unavailable')
          );
        }
      }
      
      return NextResponse.json(
        createErrorResponse('Agent service unavailable', 502),
        { status: 502 }
      );
    }

  } catch (error) {
    console.error('Agent status API error:', error);
    return NextResponse.json(
      createErrorResponse('Internal server error', 500),
      { status: 500 }
    );
  }
}