/**
 * Heatmap API route
 * Returns market heatmap data with price changes and volume
 */

import { NextRequest } from 'next/server';
import { requireAuth, createSuccessResponse, createErrorResponse, withErrorHandling } from '@/lib/middleware';
import { createAdapter } from '@/server/lib/factoryFacade';
import { HeatmapResponse, HeatmapData } from '@/lib/types/serverTypes';

// Common stock symbols for the heatmap
const DEFAULT_SYMBOLS = [
  'AAPL', 'MSFT', 'GOOGL', 'AMZN', 'TSLA', 'NVDA', 'META', 'BRK.B',
  'TSM', 'V', 'JNJ', 'WMT', 'JPM', 'PG', 'UNH', 'HD', 'MA', 'BAC',
  'ABBV', 'ORCL', 'KO', 'PEP', 'TMO', 'MRK', 'COST', 'NFLX'
];

async function heatmapHandler(request: NextRequest, context: any) {
  const { tenantId, userId } = context;
  const { searchParams } = new URL(request.url);
  
  // Allow custom symbols via query parameter
  const symbolsParam = searchParams.get('symbols');
  const symbols = symbolsParam ? symbolsParam.split(',').map(s => s.trim()) : DEFAULT_SYMBOLS;

  try {
    const adapter = await createAdapter(tenantId, userId);
    
    // Fetch market data for all symbols
    const marketDataPromises = symbols.map(symbol => 
      adapter.getMarketData(symbol).then(data => ({ symbol, data }))
    );
    
    const results = await Promise.allSettled(marketDataPromises);
    
    const heatmapData: HeatmapData[] = results
      .filter(result => result.status === 'fulfilled')
      .map(result => {
        const { symbol, data } = (result as PromiseFulfilledResult<any>).value;
        if (!data) return null;
        
        return {
          symbol,
          value: data.price,
          change: data.change,
          changePercent: data.changePercent,
          volume: Math.floor(Math.random() * 10000000), // Mock volume
          marketCap: Math.floor(Math.random() * 1000) * 1000000000, // Mock market cap
          sector: getSectorForSymbol(symbol),
        };
      })
      .filter(Boolean) as HeatmapData[];

    // Mock market status (in real implementation, this would come from market data API)
    const now = new Date();
    const hour = now.getHours();
    const isWeekday = now.getDay() >= 1 && now.getDay() <= 5;
    
    let marketStatus: 'open' | 'closed' | 'pre-market' | 'after-hours' = 'closed';
    if (isWeekday) {
      if (hour >= 4 && hour < 9.5) {
        marketStatus = 'pre-market';
      } else if (hour >= 9.5 && hour < 16) {
        marketStatus = 'open';
      } else if (hour >= 16 && hour < 20) {
        marketStatus = 'after-hours';
      }
    }

    const response: HeatmapResponse = {
      data: heatmapData,
      lastUpdated: new Date().toISOString(),
      marketStatus,
    };

    return createSuccessResponse(response);
    
  } catch (error) {
    console.error('Heatmap fetch error:', error);
    return createErrorResponse(
      'HEATMAP_FETCH_ERROR',
      'Failed to fetch heatmap data',
      500
    );
  }
}

function getSectorForSymbol(symbol: string): string {
  const sectorMap: Record<string, string> = {
    'AAPL': 'Technology',
    'MSFT': 'Technology',
    'GOOGL': 'Technology',
    'AMZN': 'Consumer Discretionary',
    'TSLA': 'Consumer Discretionary',
    'NVDA': 'Technology',
    'META': 'Technology',
    'BRK.B': 'Financial',
    'TSM': 'Technology',
    'V': 'Financial',
    'JNJ': 'Healthcare',
    'WMT': 'Consumer Staples',
    'JPM': 'Financial',
    'PG': 'Consumer Staples',
    'UNH': 'Healthcare',
    'HD': 'Consumer Discretionary',
    'MA': 'Financial',
    'BAC': 'Financial',
    'ABBV': 'Healthcare',
    'ORCL': 'Technology',
    'KO': 'Consumer Staples',
    'PEP': 'Consumer Staples',
    'TMO': 'Healthcare',
    'MRK': 'Healthcare',
    'COST': 'Consumer Staples',
    'NFLX': 'Technology',
  };
  
  return sectorMap[symbol] || 'Other';
}

export const GET = withErrorHandling(requireAuth(heatmapHandler));