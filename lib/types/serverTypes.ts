/**
 * Server-side TypeScript type definitions for AlpacaTradingAgent API
 */

// Authentication context
export interface AuthContext {
  tenantId: string;
  userId: string;
  email?: string;
  roles: string[];
  isAuthenticated: boolean;
}

// Portfolio types
export interface Portfolio {
  balance: number;
  buyingPower: number;
  cash: number;
  positions: Position[];
  dailyChange: number;
  dailyChangePercent: number;
}

export interface Position {
  symbol: string;
  quantity: number;
  averagePrice: number;
  currentPrice: number;
  marketValue: number;
  unrealizedPL: number;
  unrealizedPLPercent: number;
  side: 'long' | 'short';
}

// Trade types
export interface Trade {
  id: string;
  symbol: string;
  side: 'buy' | 'sell';
  quantity: number;
  price: number;
  timestamp: string;
  status: 'pending' | 'filled' | 'cancelled' | 'rejected';
  orderId?: string;
}

export interface ExecuteTradeRequest {
  symbol: string;
  side: 'buy' | 'sell';
  quantity: number;
  orderType: 'market' | 'limit' | 'stop';
  price?: number;
  stopPrice?: number;
}

// Agent types
export interface AgentStatus {
  id: string;
  name: string;
  status: 'active' | 'inactive' | 'analyzing' | 'error';
  lastRun?: string;
  nextRun?: string;
  performance?: {
    accuracy: number;
    totalTrades: number;
    winRate: number;
  };
}

// Scheduler types
export interface SchedulerJob {
  id: string;
  name: string;
  type: 'analysis' | 'trading' | 'reporting';
  schedule: string; // cron expression
  isActive: boolean;
  lastRun?: string;
  nextRun?: string;
  settings: Record<string, any>;
}

export interface CreateJobRequest {
  name: string;
  type: 'analysis' | 'trading' | 'reporting';
  schedule: string;
  settings: Record<string, any>;
}

// Integration types
export interface Integration {
  id: string;
  provider: string;
  name: string;
  isActive: boolean;
  createdAt: string;
  lastSync?: string;
  status: 'connected' | 'error' | 'pending';
}

export interface ConnectIntegrationRequest {
  provider: string;
  credentials: Record<string, string>;
  name?: string;
}

// User profile types
export interface UserProfile {
  id: string;
  email: string;
  name?: string;
  preferences: {
    riskTolerance: 'low' | 'medium' | 'high';
    autoExecute: boolean;
    notifications: boolean;
    maxPositionSize: number;
  };
  tradingSettings: {
    defaultOrderType: 'market' | 'limit';
    allowShorts: boolean;
    paperTrading: boolean;
  };
}

// Report types
export interface Report {
  id: string;
  type: 'performance' | 'risk' | 'market_analysis';
  title: string;
  generatedAt: string;
  data: Record<string, any>;
  summary: string;
}

// Technical indicator types
export interface TechnicalIndicator {
  symbol: string;
  indicators: {
    sma20?: number;
    sma50?: number;
    rsi?: number;
    macd?: {
      value: number;
      signal: number;
      histogram: number;
    };
    volume?: number;
  };
  timestamp: string;
}

// News types
export interface NewsItem {
  id: string;
  title: string;
  summary: string;
  url: string;
  source: string;
  publishedAt: string;
  symbols?: string[];
  sentiment?: 'positive' | 'negative' | 'neutral';
}

// Heatmap types
export interface HeatmapData {
  symbol: string;
  change: number;
  changePercent: number;
  volume: number;
  marketCap?: number;
  sector?: string;
}

// Analysis types
export interface AnalysisRequest {
  symbols: string[];
  analysisType: 'full' | 'technical' | 'fundamental';
  timeframe: '1d' | '1w' | '1m';
}

export interface AnalysisResult {
  id: string;
  symbols: string[];
  status: 'pending' | 'running' | 'completed' | 'failed';
  results?: Record<string, any>;
  startedAt: string;
  completedAt?: string;
}

// Generic API response types
export interface ApiResponse<T = any> {
  data: T;
  success: boolean;
  message?: string;
  timestamp: string;
}

export interface ApiError {
  error: string;
  code?: string;
  details?: Record<string, any>;
  timestamp: string;
}

// Adapter interface types
export interface AdapterMethods {
  list(params?: Record<string, any>): Promise<any>;
  get(id: string, params?: Record<string, any>): Promise<any>;
  create(data: Record<string, any>): Promise<any>;
  update(id: string, data: Record<string, any>): Promise<any>;
  delete(id: string): Promise<any>;
  execute?(data: Record<string, any>): Promise<any>;
  simulate?(data: Record<string, any>): Promise<any>;
}