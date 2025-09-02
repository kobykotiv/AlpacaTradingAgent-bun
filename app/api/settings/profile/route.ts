/**
 * User Profile API route - GET/PUT user profile settings
 */

import { NextRequest, NextResponse } from 'next/server';
import { facade } from '@/server/lib/factoryFacade';
import { parseAuth, createErrorResponse, createSuccessResponse } from '@/server/lib/middleware';
import { validateBody, UpdateProfileSchema } from '@/lib/schemas/zodSchemas';
import { config, proxyToMock } from '@/lib/config';
import { UserProfile } from '@/lib/types/serverTypes';

export async function GET(request: NextRequest) {
  try {
    const authResult = parseAuth(request);
    if (!authResult.success) {
      return NextResponse.json(
        createErrorResponse(authResult.error!, authResult.status),
        { status: authResult.status }
      );
    }

    const ctx = authResult.context!;

    try {
      const adapter = await facade.getAdapterForUser(ctx.tenantId, ctx.userId);
      const profileData = await adapter.get(ctx.userId, { type: 'profile' });

      const profile: UserProfile = {
        id: profileData.id || ctx.userId,
        email: profileData.email || ctx.email || 'user@example.com',
        name: profileData.name || 'User',
        preferences: profileData.preferences || {
          riskTolerance: 'medium',
          autoExecute: false,
          notifications: true,
          maxPositionSize: 1000,
        },
        tradingSettings: profileData.tradingSettings || {
          defaultOrderType: 'market',
          allowShorts: false,
          paperTrading: true,
        },
      };

      return NextResponse.json(createSuccessResponse(profile));

    } catch (adapterError) {
      if (config.useMock) {
        try {
          return await proxyToMock(request);
        } catch {
          const fallbackProfile: UserProfile = {
            id: ctx.userId,
            email: ctx.email || 'user@example.com',
            name: 'User',
            preferences: { riskTolerance: 'medium', autoExecute: false, notifications: true, maxPositionSize: 1000 },
            tradingSettings: { defaultOrderType: 'market', allowShorts: false, paperTrading: true },
          };
          return NextResponse.json(createSuccessResponse(fallbackProfile));
        }
      }
      return NextResponse.json(createErrorResponse('Profile service unavailable', 502), { status: 502 });
    }

  } catch (error) {
    return NextResponse.json(createErrorResponse('Internal server error', 500), { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const authResult = parseAuth(request);
    if (!authResult.success) {
      return NextResponse.json(
        createErrorResponse(authResult.error!, authResult.status),
        { status: authResult.status }
      );
    }

    const ctx = authResult.context!;

    const bodyValidation = await validateBody(request, UpdateProfileSchema);
    if (!bodyValidation.success) {
      return NextResponse.json(
        createErrorResponse('Invalid profile data', 422, bodyValidation.error.flatten()),
        { status: 422 }
      );
    }

    const updateData = bodyValidation.data;

    try {
      const adapter = await facade.getAdapterForUser(ctx.tenantId, ctx.userId);
      const updatedProfile = await adapter.update(ctx.userId, { type: 'profile', ...updateData });

      return NextResponse.json(createSuccessResponse(updatedProfile, 'Profile updated successfully'));

    } catch (adapterError) {
      if (config.useMock) {
        try {
          return await proxyToMock(request);
        } catch {
          return NextResponse.json(createErrorResponse('Profile update failed', 502), { status: 502 });
        }
      }
      return NextResponse.json(createErrorResponse('Profile service unavailable', 502), { status: 502 });
    }

  } catch (error) {
    return NextResponse.json(createErrorResponse('Internal server error', 500), { status: 500 });
  }
}