/**
 * Server-side middleware for tenant and role authorization
 * 
 * This provides lightweight authorization checking for API routes.
 * In production, this should be replaced with proper JWT validation
 * and database-backed user/tenant management.
 */

import { NextRequest } from 'next/server';

export interface AuthUser {
  id: string;
  roles: string[];
  tenantId: string;
}

export interface AuthResult {
  success: boolean;
  user?: AuthUser;
  error?: string;
}

/**
 * Extract and validate tenant ID from x-tenant-id header
 */
export function extractTenantId(request: NextRequest): string | null {
  const tenantId = request.headers.get('x-tenant-id');
  if (!tenantId || tenantId.trim() === '') {
    return null;
  }
  return tenantId.trim();
}

/**
 * Extract and validate bearer token from Authorization header
 */
export function extractBearerToken(request: NextRequest): string | null {
  const authHeader = request.headers.get('authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }
  return authHeader.substring(7).trim();
}

/**
 * Mock user validation - in production, validate JWT and lookup user
 * For demo purposes, this accepts any non-empty token and returns a mock user
 */
export function validateUser(token: string, tenantId: string): AuthUser | null {
  // TODO: Replace with real JWT validation and user lookup
  if (!token || token.length < 10) {
    return null;
  }
  
  // Mock user for demonstration
  return {
    id: 'mock-user-id',
    roles: ['trader', 'viewer'], // Mock roles
    tenantId: tenantId,
  };
}

/**
 * Check if user has required role for the operation
 */
export function isAuthorized(user: AuthUser, tenant: string, requiredRole: string): boolean {
  // Check tenant match
  if (user.tenantId !== tenant) {
    return false;
  }
  
  // Check role authorization
  // Admin role can access everything
  if (user.roles.includes('admin')) {
    return true;
  }
  
  // Check specific role requirements
  const roleHierarchy: Record<string, string[]> = {
    'viewer': ['viewer'],
    'trader': ['viewer', 'trader'],
    'admin': ['viewer', 'trader', 'admin']
  };
  
  const allowedRoles = roleHierarchy[requiredRole] || [requiredRole];
  return user.roles.some(role => allowedRoles.includes(role));
}

/**
 * Main authorization function for API routes
 * Returns authentication result with user or error details
 */
export function authorize(request: NextRequest, requiredRole: string = 'viewer'): AuthResult {
  // Extract tenant ID
  const tenantId = extractTenantId(request);
  if (!tenantId) {
    return {
      success: false,
      error: 'Missing x-tenant-id header'
    };
  }
  
  // Extract bearer token
  const token = extractBearerToken(request);
  if (!token) {
    return {
      success: false,
      error: 'Missing or invalid Authorization header'
    };
  }
  
  // Validate user
  const user = validateUser(token, tenantId);
  if (!user) {
    return {
      success: false,
      error: 'Invalid token or user not found'
    };
  }
  
  // Check authorization
  if (!isAuthorized(user, tenantId, requiredRole)) {
    return {
      success: false,
      error: `Insufficient permissions. Required role: ${requiredRole}`
    };
  }
  
  return {
    success: true,
    user
  };
}