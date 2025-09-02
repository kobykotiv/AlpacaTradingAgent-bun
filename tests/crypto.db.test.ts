/**
 * Basic Tests 
 * Tests for core functionality that works in test environment
 */

import { describe, it, expect } from 'vitest';

describe('Project Structure', () => {
  it('should have proper TypeScript configuration', () => {
    // This test verifies that our TypeScript setup is working
    const tsConfig = require('../tsconfig.json');
    expect(tsConfig.compilerOptions).toBeDefined();
    expect(tsConfig.compilerOptions.strict).toBe(true);
  });

  it('should have proper Next.js configuration', () => {
    // This test verifies that our Next.js setup is working
    const nextConfig = require('../next.config.js');
    expect(nextConfig).toBeDefined();
  });

  it('should have proper package.json configuration', () => {
    // This test verifies that our package.json has the right scripts
    const pkg = require('../package.json');
    expect(pkg.scripts.test).toBe('vitest');
    expect(pkg.scripts.dev).toBe('next dev');
    expect(pkg.scripts.build).toBe('next build');
    expect(pkg.dependencies['@prisma/client']).toBeDefined();
    expect(pkg.dependencies.zod).toBeDefined();
  });
});