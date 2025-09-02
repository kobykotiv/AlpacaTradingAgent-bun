/**
 * News API route - GET news data
 */

import { NextRequest, NextResponse } from 'next/server';
import { facade } from '@/server/lib/factoryFacade';
import { parseAuth, createErrorResponse, createSuccessResponse } from '@/server/lib/middleware';
import { validateQuery, NewsQuerySchema } from '@/lib/schemas/zodSchemas';
import { config, proxyToMock } from '@/lib/config';
import { NewsItem } from '@/lib/types/serverTypes';

export async function GET(request: NextRequest) {
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

    // Parse and validate query parameters
    const { searchParams } = new URL(request.url);
    const queryValidation = validateQuery(searchParams, NewsQuerySchema);
    
    if (!queryValidation.success) {
      return NextResponse.json(
        createErrorResponse(
          'Invalid query parameters',
          422,
          queryValidation.error.flatten()
        ),
        { status: 422 }
      );
    }

    const queryParams = queryValidation.data;

    try {
      // Get adapter for user
      const adapter = await facade.getAdapterForUser(ctx.tenantId, ctx.userId);
      
      // Call adapter to get news data
      const newsData = await adapter.list({ 
        type: 'news',
        symbols: queryParams.symbols,
        sentiment: queryParams.sentiment,
        source: queryParams.source,
        page: queryParams.page,
        limit: queryParams.limit,
      });

      // Ensure data matches NewsItem interface
      const news: NewsItem[] = Array.isArray(newsData) 
        ? newsData.map(item => ({
            id: item.id || `news-${Date.now()}`,
            title: item.title || 'No title',
            summary: item.summary || item.description || '',
            url: item.url || '',
            source: item.source || 'Unknown',
            publishedAt: item.publishedAt || item.timestamp || new Date().toISOString(),
            symbols: item.symbols || [],
            sentiment: item.sentiment || 'neutral',
          }))
        : [];

      const response = {
        news,
        pagination: {
          page: queryParams.page,
          limit: queryParams.limit,
          total: news.length,
        },
      };

      return NextResponse.json(createSuccessResponse(response));

    } catch (adapterError) {
      console.warn('Adapter error, falling back to mock:', adapterError);
      
      if (config.useMock) {
        try {
          return await proxyToMock(request);
        } catch (mockError) {
          const fallbackResponse = {
            news: [],
            pagination: {
              page: queryParams.page,
              limit: queryParams.limit,
              total: 0,
            },
          };
          
          return NextResponse.json(
            createSuccessResponse(fallbackResponse, 'Using fallback data - integrations unavailable')
          );
        }
      }
      
      return NextResponse.json(
        createErrorResponse('News service unavailable', 502),
        { status: 502 }
      );
    }

  } catch (error) {
    console.error('News API error:', error);
    return NextResponse.json(
      createErrorResponse('Internal server error', 500),
      { status: 500 }
    );
  }
}