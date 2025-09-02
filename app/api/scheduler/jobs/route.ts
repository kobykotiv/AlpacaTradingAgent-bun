/**
 * Scheduler Jobs API route
 * Manages scheduled trading and analysis jobs
 */

import { NextRequest } from 'next/server';
import { 
  requireAuth, 
  validateBody,
  createSuccessResponse, 
  createErrorResponse, 
  withErrorHandling,
  CreateJobSchema 
} from '@/lib/middleware';
import { JobsResponse, ScheduledJob, CreateJobRequest } from '@/lib/types/serverTypes';

// Mock scheduled jobs - in real implementation, this would be stored in database
let MOCK_JOBS: ScheduledJob[] = [
  {
    id: 'job_001',
    name: 'Daily Market Analysis',
    type: 'analysis',
    schedule: '0 9 * * 1-5', // 9 AM weekdays
    isActive: true,
    lastRun: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(), // 2 hours ago
    nextRun: new Date(Date.now() + 22 * 60 * 60 * 1000).toISOString(), // Tomorrow 9 AM
    configuration: {
      symbols: ['SPY', 'QQQ', 'IWM'],
      analysisDepth: 'comprehensive',
      includeNews: true,
      includeSentiment: true,
    },
  },
  {
    id: 'job_002',
    name: 'Hourly Portfolio Rebalance',
    type: 'trading',
    schedule: '0 * * * *', // Every hour
    isActive: true,
    lastRun: new Date(Date.now() - 45 * 60 * 1000).toISOString(), // 45 minutes ago
    nextRun: new Date(Date.now() + 15 * 60 * 1000).toISOString(), // 15 minutes from now
    configuration: {
      maxPositionSize: 0.1,
      riskTolerance: 'moderate',
      rebalanceThreshold: 0.05,
    },
  },
  {
    id: 'job_003',
    name: 'Weekly Performance Report',
    type: 'reporting',
    schedule: '0 18 * * 5', // 6 PM Fridays
    isActive: true,
    lastRun: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(), // 3 days ago
    nextRun: new Date(Date.now() + 4 * 24 * 60 * 60 * 1000).toISOString(), // Next Friday
    configuration: {
      reportType: 'comprehensive',
      emailRecipients: ['trader@example.com'],
      includeCharts: true,
    },
  },
  {
    id: 'job_004',
    name: 'Risk Monitoring',
    type: 'analysis',
    schedule: '*/15 * * * *', // Every 15 minutes
    isActive: false,
    lastRun: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(), // 2 hours ago
    nextRun: new Date(Date.now() + 13 * 60 * 1000).toISOString(), // 13 minutes from now
    configuration: {
      maxDrawdown: 0.15,
      positionSizeLimit: 0.2,
      alertThresholds: {
        volatility: 0.25,
        correlation: 0.8,
      },
    },
  },
];

async function getJobsHandler(request: NextRequest, context: any) {
  const { searchParams } = new URL(request.url);
  
  // Filter options
  const typeFilter = searchParams.get('type');
  const activeFilter = searchParams.get('active');

  try {
    let jobs = [...MOCK_JOBS];

    // Apply filters
    if (typeFilter) {
      jobs = jobs.filter(job => job.type === typeFilter);
    }
    
    if (activeFilter !== null) {
      const isActive = activeFilter === 'true';
      jobs = jobs.filter(job => job.isActive === isActive);
    }

    // Calculate summary
    const summary = {
      total: jobs.length,
      active: jobs.filter(job => job.isActive).length,
      lastExecution: jobs.reduce((latest, job) => {
        const jobTime = new Date(job.lastRun || 0).getTime();
        const latestTime = new Date(latest || 0).getTime();
        return jobTime > latestTime ? job.lastRun! : latest;
      }, ''),
    };

    const response: JobsResponse = {
      jobs,
      summary,
    };

    return createSuccessResponse(response);
    
  } catch (error) {
    console.error('Jobs fetch error:', error);
    return createErrorResponse(
      'JOBS_FETCH_ERROR',
      'Failed to fetch scheduled jobs',
      500
    );
  }
}

async function createJobHandler(request: NextRequest, context: any, body: CreateJobRequest) {
  try {
    // Validate cron expression (basic validation)
    if (!isValidCron(body.schedule)) {
      return createErrorResponse(
        'INVALID_SCHEDULE',
        'Invalid cron schedule expression',
        400
      );
    }

    // Create new job
    const newJob: ScheduledJob = {
      id: `job_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      name: body.name,
      type: body.type,
      schedule: body.schedule,
      isActive: true,
      nextRun: calculateNextRun(body.schedule),
      configuration: body.configuration || {},
    };

    // Add to mock storage (in real implementation, save to database)
    MOCK_JOBS.push(newJob);

    return createSuccessResponse(newJob, 201);
    
  } catch (error) {
    console.error('Job creation error:', error);
    return createErrorResponse(
      'JOB_CREATION_ERROR',
      'Failed to create scheduled job',
      500
    );
  }
}

// Basic cron validation
function isValidCron(schedule: string): boolean {
  const parts = schedule.trim().split(/\s+/);
  return parts.length === 5; // Basic check for 5 parts
}

// Mock function to calculate next run time
function calculateNextRun(schedule: string): string {
  // In real implementation, use a cron library like 'node-cron' or 'cron-parser'
  // For now, return a time 1 hour from now
  return new Date(Date.now() + 60 * 60 * 1000).toISOString();
}

export const GET = withErrorHandling(requireAuth(getJobsHandler));
export const POST = withErrorHandling(validateBody(CreateJobSchema)(createJobHandler));