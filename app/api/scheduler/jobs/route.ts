/**
 * Scheduler Jobs API route - GET/POST scheduler jobs
 */

import { NextRequest, NextResponse } from 'next/server';
import { facade } from '@/server/lib/factoryFacade';
import { parseAuth, requireAdmin, createErrorResponse, createSuccessResponse } from '@/server/lib/middleware';
import { validateBody, validateQuery, CreateJobSchema, PaginationSchema } from '@/lib/schemas/zodSchemas';
import { config, proxyToMock } from '@/lib/config';
import { SchedulerJob } from '@/lib/types/serverTypes';

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

    // Parse and validate query parameters
    const { searchParams } = new URL(request.url);
    const paginationValidation = validateQuery(searchParams, PaginationSchema);
    
    if (!paginationValidation.success) {
      return NextResponse.json(
        createErrorResponse(
          'Invalid pagination parameters',
          422,
          paginationValidation.error.flatten()
        ),
        { status: 422 }
      );
    }

    const pagination = paginationValidation.data;

    try {
      // Get adapter for user
      const adapter = await facade.getAdapterForUser(ctx.tenantId, ctx.userId);
      
      // Call adapter to get scheduler jobs
      const jobsData = await adapter.list({ 
        type: 'jobs',
        page: pagination.page,
        limit: pagination.limit,
      });

      // Ensure data is array and matches SchedulerJob interface
      const jobs: SchedulerJob[] = Array.isArray(jobsData) 
        ? jobsData.map(job => ({
            id: job.id || `job-${Date.now()}`,
            name: job.name || 'Unnamed Job',
            type: job.type || 'analysis',
            schedule: job.schedule || '0 9 * * 1-5',
            isActive: job.isActive ?? true,
            lastRun: job.lastRun,
            nextRun: job.nextRun,
            settings: job.settings || {},
          }))
        : [];

      const response = {
        jobs,
        pagination: {
          page: pagination.page,
          limit: pagination.limit,
          total: jobs.length,
        },
      };

      return NextResponse.json(createSuccessResponse(response));

    } catch (adapterError) {
      console.warn('Adapter error, falling back to mock:', adapterError);
      
      if (config.useMock) {
        try {
          return await proxyToMock(request);
        } catch (mockError) {
          const fallbackResponse = {
            jobs: [],
            pagination: {
              page: pagination.page,
              limit: pagination.limit,
              total: 0,
            },
          };
          
          return NextResponse.json(
            createSuccessResponse(fallbackResponse, 'Using fallback data - integrations unavailable')
          );
        }
      }
      
      return NextResponse.json(
        createErrorResponse('Scheduler service unavailable', 502),
        { status: 502 }
      );
    }

  } catch (error) {
    console.error('Scheduler jobs GET API error:', error);
    return NextResponse.json(
      createErrorResponse('Internal server error', 500),
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
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

    // Require admin role for creating jobs
    const roleCheck = requireAdmin(ctx);
    if (!roleCheck.success) {
      return NextResponse.json(
        createErrorResponse(roleCheck.error!, roleCheck.status),
        { status: roleCheck.status }
      );
    }

    // Parse and validate request body
    const bodyValidation = await validateBody(request, CreateJobSchema);
    
    if (!bodyValidation.success) {
      return NextResponse.json(
        createErrorResponse(
          'Invalid job request',
          422,
          bodyValidation.error.flatten()
        ),
        { status: 422 }
      );
    }

    const jobRequest = bodyValidation.data;

    try {
      // Get adapter for user
      const adapter = await facade.getAdapterForUser(ctx.tenantId, ctx.userId);
      
      // Create the job
      const jobResult = await adapter.create({
        ...jobRequest,
        userId: ctx.userId,
        tenantId: ctx.tenantId,
        isActive: true,
        createdAt: new Date().toISOString(),
      });

      // Ensure result matches SchedulerJob interface
      const job: SchedulerJob = {
        id: jobResult.id || `job-${Date.now()}`,
        name: jobRequest.name,
        type: jobRequest.type,
        schedule: jobRequest.schedule,
        isActive: true,
        lastRun: undefined,
        nextRun: jobResult.nextRun,
        settings: jobRequest.settings,
      };

      return NextResponse.json(createSuccessResponse(job, 'Job created successfully'));

    } catch (adapterError) {
      console.warn('Adapter error during job creation:', adapterError);
      
      if (config.useMock && process.env.NODE_ENV !== 'production') {
        try {
          return await proxyToMock(request);
        } catch (mockError) {
          return NextResponse.json(
            createErrorResponse('Job creation failed - service unavailable', 502),
            { status: 502 }
          );
        }
      }
      
      return NextResponse.json(
        createErrorResponse('Job creation failed', 502),
        { status: 502 }
      );
    }

  } catch (error) {
    console.error('Scheduler jobs POST API error:', error);
    return NextResponse.json(
      createErrorResponse('Internal server error', 500),
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
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

    // Require admin role for deleting jobs
    const roleCheck = requireAdmin(ctx);
    if (!roleCheck.success) {
      return NextResponse.json(
        createErrorResponse(roleCheck.error!, roleCheck.status),
        { status: roleCheck.status }
      );
    }

    const { searchParams } = new URL(request.url);
    const jobId = searchParams.get('id');
    
    if (!jobId) {
      return NextResponse.json(
        createErrorResponse('Job ID is required', 400),
        { status: 400 }
      );
    }

    try {
      // Get adapter for user
      const adapter = await facade.getAdapterForUser(ctx.tenantId, ctx.userId);
      
      // Delete the job
      const deleteResult = await adapter.delete(jobId);

      return NextResponse.json(
        createSuccessResponse(deleteResult, 'Job deleted successfully')
      );

    } catch (adapterError) {
      console.warn('Adapter error during job deletion:', adapterError);
      
      return NextResponse.json(
        createErrorResponse('Job deletion failed', 502),
        { status: 502 }
      );
    }

  } catch (error) {
    console.error('Scheduler jobs DELETE API error:', error);
    return NextResponse.json(
      createErrorResponse('Internal server error', 500),
      { status: 500 }
    );
  }
}