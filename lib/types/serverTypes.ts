/**
 * Server-side TypeScript types for API responses
 */

// Portfolio types
export interface PortfolioPosition {
  symbol: string;
  quantity: number;
  side: 'long' | 'short';
  marketValue: number;
  costBasis: number;
  unrealizedPL: number;
  unrealizedPLPercent: number;
}

export interface PortfolioSummary {
  totalValue: number;
  totalCash: number;
  totalEquity: number;
  buyingPower: number;
  dayTradeCount: number;
  positions: PortfolioPosition[];
  performance: {
    dayChange: number;
    dayChangePercent: number;
    totalReturn: number;
    totalReturnPercent: number;
  };
}

// Heatmap types
export interface HeatmapData {
  symbol: string;
  value: number;
  change: number;
  changePercent: number;
  volume: number;
  marketCap?: number;
  sector?: string;
}

export interface HeatmapResponse {
  data: HeatmapData[];
  lastUpdated: string;
  marketStatus: 'open' | 'closed' | 'pre-market' | 'after-hours';
}

// Agent status types
export interface AgentStatus {
  id: string;
  name: string;
  status: 'active' | 'idle' | 'error' | 'disabled';
  lastAction: string;
  lastActionTime: string;
  performance: {
    successRate: number;
    totalActions: number;
    avgExecutionTime: number;
  };
  configuration: Record<string, any>;
}

export interface AgentStatusResponse {
  agents: AgentStatus[];
  systemStatus: 'healthy' | 'degraded' | 'error';
  lastUpdated: string;
}

// Trading types
export interface OpenTrade {
  id: string;
  symbol: string;
  side: 'buy' | 'sell';
  quantity: number;
  type: 'market' | 'limit' | 'stop' | 'stop-limit';
  status: 'pending' | 'filled' | 'cancelled' | 'rejected';
  orderPrice?: number;
  fillPrice?: number;
  createdAt: string;
  updatedAt: string;
  agentId?: string;
}

export interface OpenTradesResponse {
  trades: OpenTrade[];
  summary: {
    total: number;
    pending: number;
    filled: number;
  };
  lastUpdated: string;
}

// Reports types
export interface Report {
  id: string;
  type: 'market' | 'sentiment' | 'news' | 'fundamentals' | 'macro';
  title: string;
  content: string;
  summary: string;
  confidence: number;
  recommendations: string[];
  createdAt: string;
  agentId: string;
  symbols: string[];
}

export interface ReportsResponse {
  reports: Report[];
  summary: {
    totalReports: number;
    avgConfidence: number;
    lastGenerated: string;
  };
}

// Scheduler types
export interface ScheduledJob {
  id: string;
  name: string;
  type: 'analysis' | 'trading' | 'reporting';
  schedule: string; // cron expression
  isActive: boolean;
  lastRun?: string;
  nextRun: string;
  configuration: Record<string, any>;
}

export interface CreateJobRequest {
  name: string;
  type: 'analysis' | 'trading' | 'reporting';
  schedule: string;
  configuration?: Record<string, any>;
}

export interface JobsResponse {
  jobs: ScheduledJob[];
  summary: {
    total: number;
    active: number;
    lastExecution: string;
  };
}

// Analysis types
export interface AnalysisRequest {
  symbols: string[];
  analysisType: 'fundamental' | 'technical' | 'sentiment' | 'comprehensive';
  timeframe: '1d' | '1w' | '1m' | '3m' | '1y';
  options?: {
    includeNews?: boolean;
    includeSocialSentiment?: boolean;
    includeOptions?: boolean;
  };
}

export interface AnalysisResult {
  symbol: string;
  score: number;
  recommendation: 'strong_buy' | 'buy' | 'hold' | 'sell' | 'strong_sell';
  confidence: number;
  reasoning: string;
  keyFactors: string[];
  risks: string[];
  targetPrice?: number;
  stopLoss?: number;
}

export interface AnalysisResponse {
  results: AnalysisResult[];
  summary: {
    avgScore: number;
    avgConfidence: number;
    recommendations: Record<string, number>;
  };
  metadata: {
    analysisType: string;
    timeframe: string;
    generatedAt: string;
    processingTime: number;
  };
}

// Common API response wrapper
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: any;
  };
  metadata?: {
    timestamp: string;
    requestId: string;
    version: string;
  };
}

// Error types
export interface ValidationError {
  field: string;
  message: string;
  code: string;
}

export interface ErrorResponse {
  success: false;
  error: {
    code: string;
    message: string;
    details?: ValidationError[];
  };
  metadata: {
    timestamp: string;
    requestId: string;
  };
}