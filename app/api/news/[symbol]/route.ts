/**
 * News API endpoint  
 * GET /api/news/[symbol] - Retrieve news articles for a symbol
 */

import { NextRequest } from 'next/server';
import { authorize } from '@/lib/server/middleware';
import { proxyToMockServer, shouldProxy } from '@/lib/server/proxy';
import { 
  successResponse, 
  unauthorizedResponse, 
  forbiddenResponse, 
  badRequestResponse 
} from '@/app/api/_helpers/response';

interface Props {
  params: Promise<{
    symbol: string;
  }>;
}

export async function GET(request: NextRequest, { params }: Props) {
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

  const { symbol } = await params;
  
  if (!symbol || symbol.trim() === '') {
    return badRequestResponse('Symbol parameter is required');
  }

  // If mock mode is enabled, proxy to mock server
  if (shouldProxy()) {
    return proxyToMockServer(request, `/api/news/${symbol}`);
  }

  // Mock news data for development
  const mockNews = {
    symbol: symbol.toUpperCase(),
    articles: [
      {
        id: 'news_001',
        title: `${symbol.toUpperCase()} Reports Strong Q4 Earnings Beat`,
        summary: 'Company exceeded analyst expectations with robust revenue growth and positive guidance for upcoming quarter.',
        content: 'Full article content would be here...',
        source: 'Financial Times',
        publishedAt: '2024-01-02T09:30:00Z',
        url: 'https://example.com/news/1',
        sentiment: 'positive',
        relevanceScore: 0.95
      },
      {
        id: 'news_002',
        title: `Analysts Upgrade ${symbol.toUpperCase()} Price Target Following Innovation Announcement`,
        summary: 'Multiple Wall Street firms raised price targets after the company unveiled breakthrough technology.',
        content: 'Full article content would be here...',
        source: 'Reuters',
        publishedAt: '2024-01-02T08:15:00Z',
        url: 'https://example.com/news/2',
        sentiment: 'positive',
        relevanceScore: 0.88
      },
      {
        id: 'news_003',
        title: `Market Volatility Impacts ${symbol.toUpperCase()} Trading Volume`,
        summary: 'Recent market uncertainty has led to increased trading activity and price volatility.',
        content: 'Full article content would be here...',
        source: 'Bloomberg',
        publishedAt: '2024-01-01T16:45:00Z',
        url: 'https://example.com/news/3',
        sentiment: 'neutral',
        relevanceScore: 0.72
      }
    ],
    sentimentSummary: {
      positive: 67,
      neutral: 25,
      negative: 8,
      overallSentiment: 'positive'
    },
    lastUpdated: new Date().toISOString()
  };

  return successResponse(mockNews, `News for ${symbol.toUpperCase()} retrieved successfully`);
}

// TODO: Add real news integration
// - Connect to news APIs (Finnhub, Alpha Vantage, etc.)
// - Implement sentiment analysis for articles
// - Add news filtering and relevance scoring
// - Implement real-time news updates