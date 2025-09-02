/**
 * Profile Settings API endpoint
 * GET /api/settings/profile - Retrieve user profile
 * POST /api/settings/profile - Update user profile
 */

import { NextRequest } from 'next/server';
import { authorize } from '@/lib/server/middleware';
import { proxyToMockServer, shouldProxy } from '@/lib/server/proxy';
import { UpdateProfileSchema, ProfileResponse } from '@/lib/schemas/zodSchemas';
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
    return proxyToMockServer(request, '/api/settings/profile');
  }

  // Mock profile data for development
  const mockProfile: ProfileResponse = {
    id: 'user_123',
    displayName: 'John Doe',
    email: 'john.doe@example.com',
    preferences: {
      riskTolerance: 'moderate',
      tradingStyle: 'swing',
      notifications: {
        email: true,
        sms: false,
        push: true
      },
      defaultPortfolio: 'main'
    },
    timezone: 'America/New_York',
    createdAt: '2023-10-01T00:00:00Z',
    updatedAt: new Date().toISOString()
  };

  return successResponse(mockProfile, 'Profile retrieved successfully');
}

export async function POST(request: NextRequest) {
  // Authorization check (requires trader role to update profile)
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
    return proxyToMockServer(request, '/api/settings/profile');
  }

  try {
    // Parse and validate request body
    const body = await request.json();
    const validatedData = UpdateProfileSchema.parse(body);

    // Mock profile update response
    const updatedProfile: ProfileResponse = {
      id: 'user_123',
      displayName: validatedData.displayName || 'John Doe',
      email: validatedData.email || 'john.doe@example.com',
      preferences: {
        riskTolerance: validatedData.preferences?.riskTolerance || 'moderate',
        tradingStyle: validatedData.preferences?.tradingStyle || 'swing',
        notifications: {
          email: validatedData.preferences?.notifications?.email ?? true,
          sms: validatedData.preferences?.notifications?.sms ?? false,
          push: validatedData.preferences?.notifications?.push ?? true
        },
        defaultPortfolio: validatedData.preferences?.defaultPortfolio || 'main'
      },
      timezone: validatedData.timezone || 'America/New_York',
      createdAt: '2023-10-01T00:00:00Z',
      updatedAt: new Date().toISOString()
    };

    return successResponse(updatedProfile, 'Profile updated successfully');

  } catch (error) {
    if (error instanceof SyntaxError) {
      return badRequestResponse('Invalid JSON in request body');
    }
    
    if (error && typeof error === 'object' && 'issues' in error) {
      return validationErrorResponse(error as any);
    }

    console.error('Profile update error:', error);
    return badRequestResponse('Failed to update profile');
  }
}

// TODO: Add real user management integration
// - Connect to user database for profile persistence
// - Implement proper user authentication and session management
// - Add profile picture upload functionality
// - Implement audit logging for profile changes