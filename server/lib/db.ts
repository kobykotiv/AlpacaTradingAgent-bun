/**
 * Database utilities using Prisma
 * Provides helper functions for user and integration management
 */

import { PrismaClient } from '@prisma/client';
import { encrypt, decrypt } from './crypto';

// Global instance to avoid multiple connections in serverless environment
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma = globalForPrisma.prisma ?? new PrismaClient();

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;

export interface Integration {
  id: string;
  userId: string;
  tenantId: string;
  provider: string;
  apiKey: string; // Decrypted
  secret: string; // Decrypted
  sandbox: boolean;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateIntegrationData {
  userId: string;
  tenantId: string;
  provider: string;
  apiKey: string;
  secret: string;
  sandbox?: boolean;
}

/**
 * Fetches integration by user and provider, decrypting credentials
 */
export async function getIntegrationByUser(
  tenantId: string,
  userId: string,
  provider?: string
): Promise<Integration | null> {
  const where = {
    userId,
    tenantId,
    isActive: true,
    ...(provider && { provider }),
  };

  const integration = await prisma.integration.findFirst({
    where,
    orderBy: { createdAt: 'desc' }, // Get most recent if no provider specified
  });

  if (!integration) return null;

  try {
    return {
      ...integration,
      apiKey: decrypt(integration.encryptedApiKey),
      secret: decrypt(integration.encryptedSecret),
    };
  } catch (error) {
    console.error('Failed to decrypt integration credentials:', error);
    return null;
  }
}

/**
 * Creates a new integration with encrypted credentials
 */
export async function createIntegration(data: CreateIntegrationData): Promise<Integration> {
  const encryptedApiKey = encrypt(data.apiKey);
  const encryptedSecret = encrypt(data.secret);

  const integration = await prisma.integration.create({
    data: {
      userId: data.userId,
      tenantId: data.tenantId,
      provider: data.provider,
      encryptedApiKey,
      encryptedSecret,
      sandbox: data.sandbox ?? true,
    },
  });

  return {
    ...integration,
    apiKey: data.apiKey,
    secret: data.secret,
  };
}

/**
 * Updates integration credentials
 */
export async function updateIntegration(
  id: string,
  data: Partial<{ apiKey: string; secret: string; sandbox: boolean; isActive: boolean }>
): Promise<Integration | null> {
  const updateData: any = {};

  if (data.apiKey) updateData.encryptedApiKey = encrypt(data.apiKey);
  if (data.secret) updateData.encryptedSecret = encrypt(data.secret);
  if (data.sandbox !== undefined) updateData.sandbox = data.sandbox;
  if (data.isActive !== undefined) updateData.isActive = data.isActive;

  const integration = await prisma.integration.update({
    where: { id },
    data: updateData,
  });

  return {
    ...integration,
    apiKey: data.apiKey ? data.apiKey : decrypt(integration.encryptedApiKey),
    secret: data.secret ? data.secret : decrypt(integration.encryptedSecret),
  };
}

/**
 * Gets or creates a user by email
 */
export async function getOrCreateUser(email: string, tenantId: string, name?: string) {
  return await prisma.user.upsert({
    where: { email },
    update: { tenantId, name },
    create: { email, tenantId, name },
  });
}

/**
 * Lists all integrations for a user
 */
export async function listUserIntegrations(userId: string, tenantId: string): Promise<Integration[]> {
  const integrations = await prisma.integration.findMany({
    where: { userId, tenantId, isActive: true },
    orderBy: { createdAt: 'desc' },
  });

  return integrations.map(integration => ({
    ...integration,
    apiKey: decrypt(integration.encryptedApiKey),
    secret: decrypt(integration.encryptedSecret),
  }));
}