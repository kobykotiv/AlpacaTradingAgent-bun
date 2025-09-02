/**
 * API middleware for authentication, validation, and request processing
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

export interface AuthContext {
  tenantId: string;
  userId: string;
  role: string;
}

/**
 * Extracts authentication context from request headers
 */
export function getAuthContext(request: NextRequest): AuthContext | null {
  const tenantId = request.headers.get('x-tenant-id');
  const authorization = request.headers.get('authorization');
  const role = request.headers.get('x-user-role') || 'user';

  if (!tenantId) {
    return null;
  }

  if (!authorization) {
    return null;
  }

  // In a real implementation, you would validate the JWT token here
  // For now, we'll extract a mock userId from the token
  const userId = extractUserIdFromToken(authorization);
  if (!userId) {
    return null;
  }

  return { tenantId, userId, role };
}

/**
 * Mock function to extract user ID from authorization token
 * In production, this would validate and decode a JWT
 */
function extractUserIdFromToken(authorization: string): string | null {
  // Remove 'Bearer ' prefix if present
  const token = authorization.replace(/^Bearer\s+/, '');
  
  // For demo purposes, use a simple format: "user_<userId>"
  // In production, this would decode and validate a proper JWT
  if (token.startsWith('user_')) {
    return token.substring(5);
  }
  
  // Default demo user
  return 'demo-user-123';
}

/**
 * Middleware to require authentication
 */
export function requireAuth(handler: (request: NextRequest, context: AuthContext) => Promise<NextResponse>) {
  return async (request: NextRequest): Promise<NextResponse> => {
    const authContext = getAuthContext(request);
    
    if (!authContext) {
      if (!request.headers.get('x-tenant-id')) {
        return NextResponse.json(
          { error: { code: 'MISSING_TENANT', message: 'x-tenant-id header is required' } },
          { status: 400 }
        );
      }
      
      if (!request.headers.get('authorization')) {
        return NextResponse.json(
          { error: { code: 'MISSING_AUTH', message: 'Authorization header is required' } },
          { status: 401 }
        );
      }
      
      return NextResponse.json(
        { error: { code: 'INVALID_AUTH', message: 'Invalid authorization token' } },
        { status: 401 }
      );
    }
    
    return handler(request, authContext);
  };
}

/**
 * Middleware to require specific roles
 */
export function requireRole(requiredRoles: string[]) {
  return (handler: (request: NextRequest, context: AuthContext) => Promise<NextResponse>) => {
    return requireAuth(async (request: NextRequest, context: AuthContext) => {
      if (!requiredRoles.includes(context.role)) {
        return NextResponse.json(
          { 
            error: { 
              code: 'INSUFFICIENT_PERMISSIONS', 
              message: `Required role: ${requiredRoles.join(' or ')}, but got: ${context.role}` 
            } 
          },
          { status: 403 }
        );
      }
      
      return handler(request, context);
    });
  };
}

/**
 * Validates request body against a Zod schema
 */
export function validateBody<T>(schema: z.ZodSchema<T>) {
  return (handler: (request: NextRequest, context: AuthContext, body: T) => Promise<NextResponse>) => {
    return requireAuth(async (request: NextRequest, context: AuthContext) => {
      try {
        const rawBody = await request.json();
        const validatedBody = schema.parse(rawBody);
        return handler(request, context, validatedBody);
      } catch (error) {
        if (error instanceof z.ZodError) {
          return NextResponse.json(
            {
              error: {
                code: 'VALIDATION_ERROR',
                message: 'Request body validation failed',
                details: error.errors.map(err => ({
                  field: err.path.join('.'),
                  message: err.message,
                  code: err.code,
                })),
              },
            },
            { status: 422 }
          );
        }
        
        return NextResponse.json(
          { error: { code: 'INVALID_JSON', message: 'Invalid JSON in request body' } },
          { status: 400 }
        );
      }
    });
  };
}

/**
 * Wraps handlers with error handling and standard response format
 */
export function withErrorHandling(
  handler: (request: NextRequest, context?: AuthContext) => Promise<NextResponse>
) {
  return async (request: NextRequest): Promise<NextResponse> => {
    try {
      return await handler(request);
    } catch (error) {
      console.error('API Error:', error);
      
      return NextResponse.json(
        {
          error: {
            code: 'INTERNAL_ERROR',
            message: 'An internal server error occurred',
          },
          metadata: {
            timestamp: new Date().toISOString(),
            requestId: generateRequestId(),
          },
        },
        { status: 500 }
      );
    }
  };
}

/**
 * Creates a standardized success response
 */
export function createSuccessResponse<T>(data: T, status = 200): NextResponse {
  return NextResponse.json(
    {
      success: true,
      data,
      metadata: {
        timestamp: new Date().toISOString(),
        requestId: generateRequestId(),
        version: '1.0.0',
      },
    },
    { status }
  );
}

/**
 * Creates a standardized error response
 */
export function createErrorResponse(
  code: string,
  message: string,
  status = 400,
  details?: any
): NextResponse {
  return NextResponse.json(
    {
      success: false,
      error: {
        code,
        message,
        ...(details && { details }),
      },
      metadata: {
        timestamp: new Date().toISOString(),
        requestId: generateRequestId(),
      },
    },
    { status }
  );
}

/**
 * Generates a unique request ID for tracing
 */
function generateRequestId(): string {
  return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

// Common Zod schemas
export const CreateJobSchema = z.object({
  name: z.string().min(1).max(100),
  type: z.enum(['analysis', 'trading', 'reporting']),
  schedule: z.string().min(1), // Could add cron validation here
  configuration: z.record(z.any()).optional(),
});

export const AnalysisRequestSchema = z.object({
  symbols: z.array(z.string()).min(1).max(10),
  analysisType: z.enum(['fundamental', 'technical', 'sentiment', 'comprehensive']),
  timeframe: z.enum(['1d', '1w', '1m', '3m', '1y']),
  options: z.object({
    includeNews: z.boolean().optional(),
    includeSocialSentiment: z.boolean().optional(),
    includeOptions: z.boolean().optional(),
  }).optional(),
});