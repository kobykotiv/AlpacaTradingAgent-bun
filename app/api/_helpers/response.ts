/**
 * Response helpers for consistent API responses
 * 
 * Provides standardized JSON response formatting across all API routes
 */

import { NextResponse } from 'next/server';
import { ZodError } from 'zod';

/**
 * Success response helper
 */
export function successResponse<T>(
  data: T, 
  message?: string, 
  status: number = 200
): NextResponse {
  return NextResponse.json(
    {
      data,
      message,
      timestamp: new Date().toISOString(),
    },
    { status }
  );
}

/**
 * Error response helper
 */
export function errorResponse(
  error: string,
  status: number = 500,
  code?: string,
  details?: any
): NextResponse {
  return NextResponse.json(
    {
      error,
      code,
      details,
      timestamp: new Date().toISOString(),
    },
    { status }
  );
}

/**
 * Validation error response helper for Zod errors
 */
export function validationErrorResponse(zodError: ZodError): NextResponse {
  const details = zodError.issues.map((err: any) => ({
    field: err.path.join('.'),
    message: err.message,
    code: err.code,
  }));

  return NextResponse.json(
    {
      error: 'Validation failed',
      code: 'VALIDATION_ERROR',
      details,
      timestamp: new Date().toISOString(),
    },
    { status: 422 }
  );
}

/**
 * Authorization error responses
 */
export function unauthorizedResponse(message: string = 'Missing or invalid authorization'): NextResponse {
  return errorResponse(message, 401, 'UNAUTHORIZED');
}

export function forbiddenResponse(message: string = 'Insufficient permissions'): NextResponse {
  return errorResponse(message, 403, 'FORBIDDEN');
}

export function badRequestResponse(message: string = 'Bad request'): NextResponse {
  return errorResponse(message, 400, 'BAD_REQUEST');
}

/**
 * Service unavailable response for missing dependencies
 */
export function serviceUnavailableResponse(message: string): NextResponse {
  return errorResponse(message, 503, 'SERVICE_UNAVAILABLE');
}

/**
 * Not found response
 */
export function notFoundResponse(message: string = 'Resource not found'): NextResponse {
  return errorResponse(message, 404, 'NOT_FOUND');
}