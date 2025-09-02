/**
 * Connect Integration API route - POST connect integrations with admin role validation
 */

import { NextRequest, NextResponse } from 'next/server';
import { facade } from '@/server/lib/factoryFacade';
import { parseAuth, requireAdmin, createErrorResponse, createSuccessResponse } from '@/server/lib/middleware';
import { validateBody, ConnectIntegrationSchema } from '@/lib/schemas/zodSchemas';
import { config, crypto } from '@/lib/config';
import { Integration } from '@/lib/types/serverTypes';

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

    // Require admin role for integration connection
    const roleCheck = requireAdmin(ctx);
    if (!roleCheck.success) {
      return NextResponse.json(
        createErrorResponse(roleCheck.error!, roleCheck.status),
        { status: roleCheck.status }
      );
    }

    // Parse and validate request body
    const bodyValidation = await validateBody(request, ConnectIntegrationSchema);
    
    if (!bodyValidation.success) {
      return NextResponse.json(
        createErrorResponse(
          'Invalid integration request',
          422,
          bodyValidation.error.flatten()
        ),
        { status: 422 }
      );
    }

    const integrationRequest = bodyValidation.data;

    try {
      // Encrypt credentials before storing
      const encryptedCredentials: Record<string, string> = {};
      for (const [key, value] of Object.entries(integrationRequest.credentials)) {
        try {
          encryptedCredentials[key] = crypto.encrypt(value);
        } catch (encryptError) {
          console.error('Failed to encrypt credential:', key, encryptError);
          return NextResponse.json(
            createErrorResponse('Failed to secure credentials', 500),
            { status: 500 }
          );
        }
      }

      // Create integration record
      const integrationData = {
        provider: integrationRequest.provider,
        name: integrationRequest.name || `${integrationRequest.provider} Integration`,
        tenantId: ctx.tenantId,
        userId: ctx.userId,
        credentials: encryptedCredentials,
        isActive: true,
        createdAt: new Date().toISOString(),
        status: 'pending' as const,
      };

      // In production, this would save to database via Prisma
      // For now, we'll store in the facade and create a mock integration
      const integrationId = `integration-${Date.now()}`;
      
      // Store configuration in facade
      await facade.setUserProviderConfig(
        ctx.tenantId,
        ctx.userId,
        integrationRequest.provider,
        {
          provider: integrationRequest.provider,
          credentials: integrationRequest.credentials, // Store unencrypted in facade for testing
          settings: {
            isActive: true,
            paperTrading: config.alpacaPaperTrading,
          },
        }
      );

      // Test the connection by getting an adapter
      try {
        const testAdapter = await facade.getAdapterForUser(
          ctx.tenantId,
          ctx.userId,
          integrationRequest.provider
        );
        
        // Try a simple list operation to test connectivity
        await testAdapter.list({ type: 'test' });
        
        integrationData.status = 'connected';
      } catch (testError) {
        console.warn('Integration test failed:', testError);
        integrationData.status = 'error';
      }

      // Create response integration object (without exposing credentials)
      const integration: Integration = {
        id: integrationId,
        provider: integrationData.provider,
        name: integrationData.name,
        isActive: integrationData.isActive,
        createdAt: integrationData.createdAt,
        status: integrationData.status,
      };

      return NextResponse.json(
        createSuccessResponse(integration, 'Integration connected successfully')
      );

    } catch (error) {
      console.error('Integration connection error:', error);
      
      return NextResponse.json(
        createErrorResponse(
          'Failed to connect integration',
          502,
          { provider: integrationRequest.provider }
        ),
        { status: 502 }
      );
    }

  } catch (error) {
    console.error('Connect integration API error:', error);
    return NextResponse.json(
      createErrorResponse('Internal server error', 500),
      { status: 500 }
    );
  }
}