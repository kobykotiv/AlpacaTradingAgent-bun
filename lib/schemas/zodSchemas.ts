/**
 * Zod validation schemas for AlpacaTradingAgent API
 */

import { z } from 'zod';

// Authentication schemas
export const AuthHeadersSchema = z.object({
  authorization: z.string().optional(),
  'x-tenant-id': z.string().optional(),
  'x-user-id': z.string().optional(),
});

// Trade execution schema
export const ExecuteTradeSchema = z.object({
  symbol: z.string().min(1).max(10),
  side: z.enum(['buy', 'sell']),
  quantity: z.number().positive(),
  orderType: z.enum(['market', 'limit', 'stop']),
  price: z.number().positive().optional(),
  stopPrice: z.number().positive().optional(),
}).refine(
  (data) => {
    if (data.orderType === 'limit' && !data.price) {
      return false;
    }
    if (data.orderType === 'stop' && !data.stopPrice) {
      return false;
    }
    return true;
  },
  {
    message: 'Price is required for limit orders, stop price is required for stop orders',
  }
);

// Scheduler job schemas
export const CreateJobSchema = z.object({
  name: z.string().min(1).max(100),
  type: z.enum(['analysis', 'trading', 'reporting']),
  schedule: z.string().regex(/^(\*|[0-5]?\d)(\s+(\*|[01]?\d|2[0-3])){1}(\s+(\*|[0-2]?\d|3[01])){1}(\s+(\*|[1-9]|1[0-2])){1}(\s+(\*|[0-6])){1}$/, 
    'Invalid cron expression'),
  settings: z.record(z.any()).default({}),
});

export const UpdateJobSchema = CreateJobSchema.partial().extend({
  isActive: z.boolean().optional(),
});

// Integration schemas
export const ConnectIntegrationSchema = z.object({
  provider: z.enum(['alpaca', 'binance', 'coinbase']),
  credentials: z.record(z.string()),
  name: z.string().optional(),
});

// User profile schemas
export const UpdateProfileSchema = z.object({
  name: z.string().optional(),
  preferences: z.object({
    riskTolerance: z.enum(['low', 'medium', 'high']).optional(),
    autoExecute: z.boolean().optional(),
    notifications: z.boolean().optional(),
    maxPositionSize: z.number().positive().optional(),
  }).optional(),
  tradingSettings: z.object({
    defaultOrderType: z.enum(['market', 'limit']).optional(),
    allowShorts: z.boolean().optional(),
    paperTrading: z.boolean().optional(),
  }).optional(),
});

// Analysis schemas
export const AnalysisRequestSchema = z.object({
  symbols: z.array(z.string().min(1).max(10)).min(1).max(20),
  analysisType: z.enum(['full', 'technical', 'fundamental']).default('full'),
  timeframe: z.enum(['1d', '1w', '1m']).default('1d'),
});

// Query parameter schemas
export const PaginationSchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
});

export const DateRangeSchema = z.object({
  from: z.string().datetime().optional(),
  to: z.string().datetime().optional(),
});

export const SymbolFilterSchema = z.object({
  symbols: z.string().transform(val => val.split(',').map(s => s.trim())).optional(),
});

// Portfolio query schemas
export const PortfolioQuerySchema = z.object({
  includePositions: z.string().optional().transform((val, ctx) => {
    if (val === undefined) return true;
    if (val === 'true') return true;
    if (val === 'false') return false;
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'includePositions must be "true" or "false"',
    });
    return z.NEVER;
  }),
  includeProfitLoss: z.string().optional().transform((val, ctx) => {
    if (val === undefined) return true;
    if (val === 'true') return true;
    if (val === 'false') return false;
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'includeProfitLoss must be "true" or "false"',
    });
    return z.NEVER;
  }),
});

// Trade history query schemas
export const TradeHistoryQuerySchema = PaginationSchema.merge(DateRangeSchema).merge(SymbolFilterSchema).extend({
  status: z.enum(['all', 'filled', 'cancelled', 'rejected']).default('all'),
});

// News query schemas
export const NewsQuerySchema = PaginationSchema.merge(SymbolFilterSchema).extend({
  sentiment: z.enum(['positive', 'negative', 'neutral', 'all']).default('all'),
  source: z.string().optional(),
});

// Heatmap query schemas
export const HeatmapQuerySchema = z.object({
  sector: z.string().optional(),
  minMarketCap: z.coerce.number().positive().optional(),
  sortBy: z.enum(['change', 'volume', 'marketCap']).default('change'),
  limit: z.coerce.number().int().positive().max(500).default(100),
});

// Generic response validation
export const ApiResponseSchema = z.object({
  data: z.any(),
  success: z.boolean(),
  message: z.string().optional(),
  timestamp: z.string(),
});

export const ApiErrorSchema = z.object({
  error: z.string(),
  code: z.string().optional(),
  details: z.record(z.any()).optional(),
  timestamp: z.string(),
});

// Helper function to validate request body
export const validateBody = async <T>(
  request: Request,
  schema: z.ZodSchema<T>
): Promise<{ success: true; data: T } | { success: false; error: z.ZodError }> => {
  try {
    const body = await request.json();
    const result = schema.safeParse(body);
    
    if (result.success) {
      return { success: true, data: result.data };
    } else {
      return { success: false, error: result.error };
    }
  } catch (error) {
    return {
      success: false,
      error: new z.ZodError([
        {
          code: z.ZodIssueCode.custom,
          message: 'Invalid JSON in request body',
          path: [],
        },
      ]),
    };
  }
};

// Helper function to validate query parameters
export const validateQuery = <T>(
  searchParams: URLSearchParams,
  schema: z.ZodSchema<T>
): { success: true; data: T } | { success: false; error: z.ZodError } => {
  const queryObject: Record<string, string> = {};
  
  for (const [key, value] of searchParams.entries()) {
    queryObject[key] = value;
  }
  
  const result = schema.safeParse(queryObject);
  
  if (result.success) {
    return { success: true, data: result.data };
  } else {
    return { success: false, error: result.error };
  }
};