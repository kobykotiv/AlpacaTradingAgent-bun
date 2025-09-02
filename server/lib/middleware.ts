/**
 * Middleware for authentication and request parsing
 */

import { AuthContext } from '@/lib/types/serverTypes';

export interface ParseAuthResult {
  success: boolean;
  context?: AuthContext;
  error?: string;
  status?: number;
}

/**
 * Parse authentication from request headers
 * Extracts tenant ID, user ID, and validates authentication
 */
export const parseAuth = (request: Request): ParseAuthResult => {
  try {
    const headers = request.headers;
    const authorization = headers.get('authorization');
    const tenantId = headers.get('x-tenant-id');
    const userId = headers.get('x-user-id');

    // For development, allow requests without auth headers but mark as unauthenticated
    if (!authorization && !tenantId && !userId) {
      return {
        success: true,
        context: {
          tenantId: 'default',
          userId: 'anonymous',
          email: 'anonymous@example.com',
          roles: ['user'],
          isAuthenticated: false,
        },
      };
    }

    // Basic validation - in production this would validate JWT tokens
    if (!tenantId || !userId) {
      return {
        success: false,
        error: 'Missing required headers: x-tenant-id and x-user-id',
        status: 401,
      };
    }

    // Extract roles from authorization header (simplified for demo)
    const roles = extractRolesFromAuth(authorization);

    const context: AuthContext = {
      tenantId,
      userId,
      email: `${userId}@${tenantId}.com`, // Mock email generation
      roles,
      isAuthenticated: true,
    };

    return {
      success: true,
      context,
    };
  } catch (error) {
    return {
      success: false,
      error: 'Failed to parse authentication',
      status: 500,
    };
  }
};

/**
 * Extract roles from authorization header
 * In production, this would decode and validate a JWT token
 */
const extractRolesFromAuth = (authorization: string | null): string[] => {
  if (!authorization) {
    return ['user'];
  }

  // Simple role extraction for demo - in production, decode JWT
  if (authorization.includes('admin')) {
    return ['admin', 'user'];
  }
  
  if (authorization.includes('trader')) {
    return ['trader', 'user'];
  }
  
  return ['user'];
};

/**
 * Check if user has required role
 */
export const requireRole = (context: AuthContext, requiredRole: string): boolean => {
  return context.roles.includes(requiredRole);
};

/**
 * Middleware to ensure user is authenticated
 */
export const requireAuth = (context: AuthContext): { success: boolean; error?: string; status?: number } => {
  if (!context.isAuthenticated) {
    return {
      success: false,
      error: 'Authentication required',
      status: 401,
    };
  }
  
  return { success: true };
};

/**
 * Middleware to ensure user has admin role
 */
export const requireAdmin = (context: AuthContext): { success: boolean; error?: string; status?: number } => {
  const authCheck = requireAuth(context);
  if (!authCheck.success) {
    return authCheck;
  }
  
  if (!requireRole(context, 'admin')) {
    return {
      success: false,
      error: 'Admin role required',
      status: 403,
    };
  }
  
  return { success: true };
};

/**
 * Create standardized error response
 */
export const createErrorResponse = (
  error: string,
  status: number = 500,
  details?: Record<string, any>
) => {
  return {
    error,
    code: status.toString(),
    details,
    timestamp: new Date().toISOString(),
  };
};

/**
 * Create standardized success response
 */
export const createSuccessResponse = <T>(
  data: T,
  message?: string
) => {
  return {
    data,
    success: true,
    message,
    timestamp: new Date().toISOString(),
  };
};