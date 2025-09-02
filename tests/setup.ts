/**
 * Test setup file for Vitest
 * Configures environment and mocks for testing
 */

import { beforeAll, afterAll, afterEach } from 'vitest';

// Set up test environment variables
beforeAll(() => {
  process.env.NODE_ENV = 'test';
  process.env.SECRET_KEY = 'test-secret-key-for-testing-only';
  process.env.USE_MOCK = 'true';
  process.env.MOCK_API_BASE = 'http://localhost:3001';
});

// Clean up after each test
afterEach(() => {
  // Reset any global state if needed
});

// Clean up after all tests
afterAll(() => {
  // Perform final cleanup
});