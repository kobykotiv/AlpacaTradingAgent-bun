/**
 * Proxy helper for forwarding requests to mock server
 * 
 * When USE_MOCK=true and MOCK_API_BASE is configured, this helper
 * forwards API requests to the mock server and streams responses back.
 */

import { NextRequest, NextResponse } from 'next/server';

/**
 * Check if mock mode is enabled via environment variables
 */
export function isMockEnabled(): boolean {
  return process.env.USE_MOCK === 'true';
}

/**
 * Get the mock API base URL from environment
 */
export function getMockApiBase(): string | null {
  const base = process.env.MOCK_API_BASE;
  if (!base || base.trim() === '') {
    return null;
  }
  return base.trim().replace(/\/$/, ''); // Remove trailing slash
}

/**
 * Proxy a request to the mock server
 * Forwards headers, method, and body to the mock server
 */
export async function proxyToMockServer(
  request: NextRequest,
  originalPath: string
): Promise<NextResponse> {
  const mockApiBase = getMockApiBase();
  
  if (!mockApiBase) {
    return NextResponse.json(
      { 
        error: 'Mock server not configured. Set MOCK_API_BASE environment variable.',
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  }

  const targetUrl = `${mockApiBase}${originalPath}`;
  
  try {
    // Prepare headers (exclude host and other problematic headers)
    const headers = new Headers();
    request.headers.forEach((value, key) => {
      if (!['host', 'connection', 'content-length'].includes(key.toLowerCase())) {
        headers.set(key, value);
      }
    });

    // Prepare request body for non-GET requests
    let body: string | undefined;
    if (request.method !== 'GET' && request.method !== 'HEAD') {
      try {
        body = await request.text();
      } catch {
        // If body can't be read, continue without it
      }
    }

    // Make the proxy request
    const response = await fetch(targetUrl, {
      method: request.method,
      headers,
      body,
    });

    // Prepare response headers
    const responseHeaders = new Headers();
    response.headers.forEach((value, key) => {
      // Filter out headers that might cause issues
      if (!['content-encoding', 'transfer-encoding'].includes(key.toLowerCase())) {
        responseHeaders.set(key, value);
      }
    });

    // Handle different content types
    const contentType = response.headers.get('content-type') || '';
    
    if (contentType.includes('application/json')) {
      const data = await response.json();
      return NextResponse.json(data, {
        status: response.status,
        headers: responseHeaders,
      });
    } else if (contentType.includes('text/')) {
      const text = await response.text();
      return new NextResponse(text, {
        status: response.status,
        headers: responseHeaders,
      });
    } else {
      // For binary content, stream the response
      const arrayBuffer = await response.arrayBuffer();
      return new NextResponse(arrayBuffer, {
        status: response.status,
        headers: responseHeaders,
      });
    }

  } catch (error) {
    console.error('Proxy error:', error);
    
    return NextResponse.json(
      {
        error: 'Failed to proxy request to mock server',
        details: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      },
      { status: 502 }
    );
  }
}

/**
 * Helper to determine if a request should be proxied
 * Returns true if mock mode is enabled and mock server is configured
 */
export function shouldProxy(): boolean {
  return isMockEnabled() && getMockApiBase() !== null;
}