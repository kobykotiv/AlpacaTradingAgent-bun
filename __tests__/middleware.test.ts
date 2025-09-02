/**
 * Tests for authentication middleware
 */

import { parseAuth, requireRole, requireAuth, requireAdmin } from '@/server/lib/middleware';

describe('Authentication Middleware', () => {
  describe('parseAuth', () => {
    it('should parse auth headers correctly', () => {
      const request = new Request('http://localhost:3000/api/test', {
        headers: {
          'x-tenant-id': 'tenant-123',
          'x-user-id': 'user-456',
          'authorization': 'Bearer admin-token',
        },
      });

      const result = parseAuth(request);

      expect(result.success).toBe(true);
      expect(result.context).toMatchObject({
        tenantId: 'tenant-123',
        userId: 'user-456',
        email: 'user-456@tenant-123.com',
        roles: ['admin', 'user'],
        isAuthenticated: true,
      });
    });

    it('should handle missing headers with anonymous context', () => {
      const request = new Request('http://localhost:3000/api/test');

      const result = parseAuth(request);

      expect(result.success).toBe(true);
      expect(result.context).toMatchObject({
        tenantId: 'default',
        userId: 'anonymous',
        isAuthenticated: false,
        roles: ['user'],
      });
    });

    it('should return error for incomplete auth headers', () => {
      const request = new Request('http://localhost:3000/api/test', {
        headers: {
          'x-tenant-id': 'tenant-123',
          // Missing x-user-id
        },
      });

      const result = parseAuth(request);

      expect(result.success).toBe(false);
      expect(result.error).toContain('Missing required headers');
      expect(result.status).toBe(401);
    });
  });

  describe('requireRole', () => {
    it('should return true for user with required role', () => {
      const context = {
        tenantId: 'test',
        userId: 'test',
        email: 'test@test.com',
        roles: ['admin', 'user'],
        isAuthenticated: true,
      };

      expect(requireRole(context, 'admin')).toBe(true);
      expect(requireRole(context, 'user')).toBe(true);
    });

    it('should return false for user without required role', () => {
      const context = {
        tenantId: 'test',
        userId: 'test',
        email: 'test@test.com',
        roles: ['user'],
        isAuthenticated: true,
      };

      expect(requireRole(context, 'admin')).toBe(false);
    });
  });

  describe('requireAuth', () => {
    it('should succeed for authenticated user', () => {
      const context = {
        tenantId: 'test',
        userId: 'test',
        email: 'test@test.com',
        roles: ['user'],
        isAuthenticated: true,
      };

      const result = requireAuth(context);

      expect(result.success).toBe(true);
    });

    it('should fail for unauthenticated user', () => {
      const context = {
        tenantId: 'default',
        userId: 'anonymous',
        email: 'anonymous@example.com',
        roles: ['user'],
        isAuthenticated: false,
      };

      const result = requireAuth(context);

      expect(result.success).toBe(false);
      expect(result.error).toContain('Authentication required');
      expect(result.status).toBe(401);
    });
  });

  describe('requireAdmin', () => {
    it('should succeed for authenticated admin user', () => {
      const context = {
        tenantId: 'test',
        userId: 'test',
        email: 'test@test.com',
        roles: ['admin', 'user'],
        isAuthenticated: true,
      };

      const result = requireAdmin(context);

      expect(result.success).toBe(true);
    });

    it('should fail for authenticated non-admin user', () => {
      const context = {
        tenantId: 'test',
        userId: 'test',
        email: 'test@test.com',
        roles: ['user'],
        isAuthenticated: true,
      };

      const result = requireAdmin(context);

      expect(result.success).toBe(false);
      expect(result.error).toContain('Admin role required');
      expect(result.status).toBe(403);
    });

    it('should fail for unauthenticated user', () => {
      const context = {
        tenantId: 'default',
        userId: 'anonymous',
        email: 'anonymous@example.com',
        roles: ['user'],
        isAuthenticated: false,
      };

      const result = requireAdmin(context);

      expect(result.success).toBe(false);
      expect(result.error).toContain('Authentication required');
      expect(result.status).toBe(401);
    });
  });
});