/**
 * Scheduler Jobs API endpoint
 * GET /api/scheduler/jobs - List scheduled jobs
 * POST /api/scheduler/jobs - Create a new scheduled job
 */

import { NextRequest } from 'next/server';
import { authorize } from '@/lib/server/middleware';
import { proxyToMockServer, shouldProxy } from '@/lib/server/proxy';
import { CreateSchedulerJobSchema, SchedulerJobResponse } from '@/lib/schemas/zodSchemas';
import { 
  successResponse, 
  unauthorizedResponse, 
  forbiddenResponse, 
  badRequestResponse,
  validationErrorResponse
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
    return proxyToMockServer(request, '/api/scheduler/jobs');
  }

  // Mock scheduled jobs data for development
  const mockJobs: SchedulerJobResponse[] = [
    {
      id: 'job_001',
      name: 'Daily Portfolio Analysis',
      type: 'analysis',
      schedule: '0 9 * * 1-5', // 9 AM weekdays
      symbol: 'PORTFOLIO',
      parameters: { 
        analysisType: 'comprehensive',
        includeRisk: true 
      },
      enabled: true,
      description: 'Comprehensive portfolio analysis every trading day',
      createdAt: '2024-01-01T00:00:00Z',
      updatedAt: '2024-01-01T00:00:00Z',
      nextRun: '2024-01-03T09:00:00Z'
    },
    {
      id: 'job_002',
      name: 'AAPL Technical Analysis',
      type: 'analysis',
      schedule: '0 */4 * * *', // Every 4 hours
      symbol: 'AAPL',
      parameters: {
        indicators: ['RSI', 'MACD', 'Bollinger'],
        timeframe: '1h'
      },
      enabled: true,
      description: 'Regular technical analysis for Apple stock',
      createdAt: '2024-01-01T12:00:00Z',
      updatedAt: '2024-01-02T08:00:00Z',
      nextRun: '2024-01-02T16:00:00Z'
    },
    {
      id: 'job_003',
      name: 'Market Alert Check',
      type: 'alert',
      schedule: '*/15 * * * *', // Every 15 minutes
      parameters: {
        priceThreshold: 5,
        volumeThreshold: 2
      },
      enabled: false,
      description: 'Check for significant market movements',
      createdAt: '2024-01-01T18:00:00Z',
      updatedAt: '2024-01-02T10:00:00Z'
    }
  ];

  return successResponse(mockJobs, 'Scheduled jobs retrieved successfully');
}

export async function POST(request: NextRequest) {
  // Authorization check (requires trader role to create jobs)
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
    return proxyToMockServer(request, '/api/scheduler/jobs');
  }

  try {
    // Parse and validate request body
    const body = await request.json();
    const validatedData = CreateSchedulerJobSchema.parse(body);

    // Mock job creation response
    const newJob: SchedulerJobResponse = {
      id: `job_${Date.now()}`,
      name: validatedData.name,
      type: validatedData.type,
      schedule: validatedData.schedule,
      symbol: validatedData.symbol,
      parameters: validatedData.parameters,
      enabled: validatedData.enabled,
      description: validatedData.description,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      nextRun: new Date(Date.now() + 3600000).toISOString() // Mock next run in 1 hour
    };

    return successResponse(newJob, `Scheduled job '${validatedData.name}' created successfully`, 201);

  } catch (error) {
    if (error instanceof SyntaxError) {
      return badRequestResponse('Invalid JSON in request body');
    }
    
    if (error && typeof error === 'object' && 'issues' in error) {
      return validationErrorResponse(error as any);
    }

    console.error('Job creation error:', error);
    return badRequestResponse('Failed to create scheduled job');
  }
}

// TODO: Add real job scheduler integration
// - Implement actual cron job scheduling system
// - Add job execution tracking and logging
// - Implement job dependency management
// - Add job queue management and priority handling