/**
 * Zod validation schemas for API endpoints
 * 
 * These schemas validate incoming request payloads and provide 
 * TypeScript types for request/response interfaces.
 */

import { z } from 'zod';

// ============================================================================
// Scheduler Job Schemas
// ============================================================================

export const CreateSchedulerJobSchema = z.object({
  name: z.string().min(1, 'Job name is required'),
  type: z.enum(['analysis', 'trade', 'report', 'alert']),
  schedule: z.string().min(1, 'Schedule expression is required'),
  symbol: z.string().optional(),
  parameters: z.record(z.string(), z.any()).optional(),
  enabled: z.boolean().default(true),
  description: z.string().optional()
});

export type CreateSchedulerJobRequest = z.infer<typeof CreateSchedulerJobSchema>;

export interface SchedulerJobResponse {
  id: string;
  name: string;
  type: string;
  schedule: string;
  symbol?: string;
  parameters?: Record<string, any>;
  enabled: boolean;
  description?: string;
  createdAt: string;
  updatedAt: string;
  nextRun?: string;
}

// ============================================================================
// Trade Execution Schemas  
// ============================================================================

export const ExecuteTradeSchema = z.object({
  symbol: z.string().min(1, 'Symbol is required'),
  side: z.enum(['buy', 'sell']),
  type: z.enum(['market', 'limit', 'stop', 'stop_limit']),
  quantity: z.number().positive('Quantity must be positive'),
  limitPrice: z.number().positive().optional(),
  stopPrice: z.number().positive().optional(),
  timeInForce: z.enum(['day', 'gtc', 'ioc', 'fok']).default('day'),
  extendedHours: z.boolean().default(false)
});

export type ExecuteTradeRequest = z.infer<typeof ExecuteTradeSchema>;

export interface TradeResponse {
  id: string;
  symbol: string;
  side: string;
  type: string;
  quantity: number;
  limitPrice?: number;
  stopPrice?: number;
  status: string;
  submittedAt: string;
  filledAt?: string;
  filledPrice?: number;
  filledQuantity?: number;
}

// ============================================================================
// Integration Connection Schemas
// ============================================================================

export const ConnectIntegrationSchema = z.object({
  type: z.enum(['alpaca', 'binance', 'coinbase', 'kraken', 'webhook']),
  name: z.string().min(1, 'Integration name is required'),
  credentials: z.object({
    apiKey: z.string().min(1, 'API key is required'),
    secretKey: z.string().min(1, 'Secret key is required'),
    sandbox: z.boolean().default(true)
  }),
  settings: z.record(z.string(), z.any()).optional(),
  enabled: z.boolean().default(true)
});

export type ConnectIntegrationRequest = z.infer<typeof ConnectIntegrationSchema>;

export interface IntegrationResponse {
  id: string;
  type: string;
  name: string;
  status: 'connected' | 'disconnected' | 'error';
  settings?: Record<string, any>;
  enabled: boolean;
  createdAt: string;
  lastSync?: string;
}

// ============================================================================
// Profile Update Schemas
// ============================================================================

export const UpdateProfileSchema = z.object({
  displayName: z.string().min(1, 'Display name is required').optional(),
  email: z.string().email('Invalid email format').optional(),
  preferences: z.object({
    riskTolerance: z.enum(['conservative', 'moderate', 'aggressive']).optional(),
    tradingStyle: z.enum(['day', 'swing', 'position']).optional(),
    notifications: z.object({
      email: z.boolean().optional(),
      sms: z.boolean().optional(),
      push: z.boolean().optional()
    }).optional(),
    defaultPortfolio: z.string().optional()
  }).optional(),
  timezone: z.string().optional()
});

export type UpdateProfileRequest = z.infer<typeof UpdateProfileSchema>;

export interface ProfileResponse {
  id: string;
  displayName: string;
  email: string;
  preferences: {
    riskTolerance: string;
    tradingStyle: string;
    notifications: {
      email: boolean;
      sms: boolean;
      push: boolean;
    };
    defaultPortfolio?: string;
  };
  timezone: string;
  createdAt: string;
  updatedAt: string;
}

// ============================================================================
// Analysis Payload Schemas
// ============================================================================

export const AnalyzePredictionSchema = z.object({
  symbol: z.string().min(1, 'Symbol is required'),
  timeframe: z.enum(['1m', '5m', '15m', '1h', '4h', '1d']).default('1h'),
  analysisType: z.enum(['technical', 'fundamental', 'sentiment', 'comprehensive']).default('comprehensive'),
  parameters: z.object({
    lookbackPeriod: z.number().min(1).max(365).default(30),
    includeNews: z.boolean().default(true),
    includeSentiment: z.boolean().default(true),
    includeIndicators: z.boolean().default(true),
    riskLevel: z.enum(['low', 'medium', 'high']).default('medium')
  }).optional(),
  context: z.string().optional()
});

export type AnalyzePredictionRequest = z.infer<typeof AnalyzePredictionSchema>;

export interface AnalysisPredictionResponse {
  symbol: string;
  timeframe: string;
  prediction: {
    direction: 'bullish' | 'bearish' | 'neutral';
    confidence: number;
    targetPrice?: number;
    stopLoss?: number;
    timeHorizon: string;
  };
  reasoning: {
    technical: string;
    fundamental?: string;
    sentiment?: string;
    summary: string;
  };
  indicators: Record<string, any>;
  risks: string[];
  generatedAt: string;
}

// ============================================================================
// Common Response Schemas
// ============================================================================

export interface ApiErrorResponse {
  error: string;
  code?: string;
  details?: any;
  timestamp: string;
}

export interface ApiSuccessResponse<T = any> {
  data: T;
  message?: string;
  timestamp: string;
}