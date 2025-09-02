# API Routes Documentation

This document describes the Next.js API routes for the AlpacaTradingAgent frontend/backend integration.

## Configuration

### Environment Variables

Set these environment variables to configure the API behavior:

```bash
# Mock Server Configuration
USE_MOCK=true                           # Enable mock proxy mode
MOCK_API_BASE=http://localhost:8000     # Mock server base URL

# Service Configuration  
OPENAI_API_KEY=your_openai_key          # Required for analysis endpoints
ALPACA_API_KEY=your_alpaca_key          # Required for trading endpoints
ALPACA_SECRET_KEY=your_alpaca_secret    # Required for trading endpoints
```

### Authentication Headers

All API requests require these headers:

```bash
x-tenant-id: your-tenant-id             # Required for all endpoints
Authorization: Bearer your-jwt-token     # Required for all endpoints
```

## API Endpoints

### Portfolio Management

#### GET /api/portfolio
Retrieve portfolio information including positions, performance, and allocation.

```bash
curl -X GET http://localhost:3000/api/portfolio \
  -H "x-tenant-id: demo-tenant" \
  -H "Authorization: Bearer demo-token-123"
```

#### GET /api/heatmap
Get market heatmap data with sector performance and top movers.

```bash
curl -X GET http://localhost:3000/api/heatmap \
  -H "x-tenant-id: demo-tenant" \
  -H "Authorization: Bearer demo-token-123"
```

### Trading Operations

#### GET /api/trades/open
List all open/pending trade orders.

```bash
curl -X GET http://localhost:3000/api/trades/open \
  -H "x-tenant-id: demo-tenant" \
  -H "Authorization: Bearer demo-token-123"
```

#### POST /api/trades/execute
Execute a trade order. Requires trader role.

```bash
curl -X POST http://localhost:3000/api/trades/execute \
  -H "x-tenant-id: demo-tenant" \
  -H "Authorization: Bearer demo-token-123" \
  -H "Content-Type: application/json" \
  -d '{
    "symbol": "AAPL",
    "side": "buy",
    "type": "market",
    "quantity": 10,
    "timeInForce": "day"
  }'
```

#### GET /api/trades/history
Retrieve trade history and performance data.

```bash
curl -X GET http://localhost:3000/api/trades/history \
  -H "x-tenant-id: demo-tenant" \
  -H "Authorization: Bearer demo-token-123"
```

### Analysis & Agents

#### GET /api/agents/status
Get status of all trading agents including performance metrics.

```bash
curl -X GET http://localhost:3000/api/agents/status \
  -H "x-tenant-id: demo-tenant" \
  -H "Authorization: Bearer demo-token-123"
```

#### POST /api/agents/analyze
Trigger analysis prediction for a symbol. Requires trader role and OpenAI API key.

```bash
curl -X POST http://localhost:3000/api/agents/analyze \
  -H "x-tenant-id: demo-tenant" \
  -H "Authorization: Bearer demo-token-123" \
  -H "Content-Type: application/json" \
  -d '{
    "symbol": "AAPL",
    "timeframe": "1h",
    "analysisType": "comprehensive",
    "parameters": {
      "lookbackPeriod": 30,
      "includeNews": true,
      "includeSentiment": true,
      "riskLevel": "medium"
    }
  }'
```

### Market Data

#### GET /api/indicators/[symbol]
Get technical indicators for a specific symbol.

```bash
curl -X GET http://localhost:3000/api/indicators/AAPL \
  -H "x-tenant-id: demo-tenant" \
  -H "Authorization: Bearer demo-token-123"
```

#### GET /api/news/[symbol]
Retrieve news articles for a specific symbol.

```bash
curl -X GET http://localhost:3000/api/news/AAPL \
  -H "x-tenant-id: demo-tenant" \
  -H "Authorization: Bearer demo-token-123"
```

### Scheduling

#### GET /api/scheduler/jobs
List all scheduled jobs.

```bash
curl -X GET http://localhost:3000/api/scheduler/jobs \
  -H "x-tenant-id: demo-tenant" \
  -H "Authorization: Bearer demo-token-123"
```

#### POST /api/scheduler/jobs
Create a new scheduled job. Requires trader role.

```bash
curl -X POST http://localhost:3000/api/scheduler/jobs \
  -H "x-tenant-id: demo-tenant" \
  -H "Authorization: Bearer demo-token-123" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Daily AAPL Analysis",
    "type": "analysis",
    "schedule": "0 9 * * 1-5",
    "symbol": "AAPL",
    "description": "Analyze AAPL every weekday at 9 AM",
    "enabled": true
  }'
```

#### DELETE /api/scheduler/jobs/[id]
Delete a scheduled job. Requires trader role.

```bash
curl -X DELETE http://localhost:3000/api/scheduler/jobs/job_123 \
  -H "x-tenant-id: demo-tenant" \
  -H "Authorization: Bearer demo-token-123"
```

### Reports

#### GET /api/reports/pnl
Generate profit and loss report.

```bash
curl -X GET http://localhost:3000/api/reports/pnl \
  -H "x-tenant-id: demo-tenant" \
  -H "Authorization: Bearer demo-token-123"
```

#### GET /api/reports/metrics
Get trading performance metrics.

```bash
curl -X GET http://localhost:3000/api/reports/metrics \
  -H "x-tenant-id: demo-tenant" \
  -H "Authorization: Bearer demo-token-123"
```

#### GET /api/reports/export
Export trading data and reports.

```bash
curl -X GET http://localhost:3000/api/reports/export \
  -H "x-tenant-id: demo-tenant" \
  -H "Authorization: Bearer demo-token-123"
```

### Settings

#### GET /api/settings/profile
Retrieve user profile settings.

```bash
curl -X GET http://localhost:3000/api/settings/profile \
  -H "x-tenant-id: demo-tenant" \
  -H "Authorization: Bearer demo-token-123"
```

#### POST /api/settings/profile
Update user profile settings. Requires trader role.

```bash
curl -X POST http://localhost:3000/api/settings/profile \
  -H "x-tenant-id: demo-tenant" \
  -H "Authorization: Bearer demo-token-123" \
  -H "Content-Type: application/json" \
  -d '{
    "displayName": "John Doe",
    "preferences": {
      "riskTolerance": "moderate",
      "tradingStyle": "swing",
      "notifications": {
        "email": true,
        "push": true
      }
    }
  }'
```

### Integrations

#### GET /api/integrations
List all connected integrations.

```bash
curl -X GET http://localhost:3000/api/integrations \
  -H "x-tenant-id: demo-tenant" \
  -H "Authorization: Bearer demo-token-123"
```

#### POST /api/integrations/connect
Connect a new integration. Requires trader role.

```bash
curl -X POST http://localhost:3000/api/integrations/connect \
  -H "x-tenant-id: demo-tenant" \
  -H "Authorization: Bearer demo-token-123" \
  -H "Content-Type: application/json" \
  -d '{
    "type": "alpaca",
    "name": "My Alpaca Account",
    "credentials": {
      "apiKey": "your-api-key",
      "secretKey": "your-secret-key",
      "sandbox": true
    }
  }'
```

#### DELETE /api/integrations/[id]
Disconnect an integration. Requires trader role.

```bash
curl -X DELETE http://localhost:3000/api/integrations/integration_123 \
  -H "x-tenant-id: demo-tenant" \
  -H "Authorization: Bearer demo-token-123"
```

## Mock Proxy Mode

When `USE_MOCK=true` and `MOCK_API_BASE` is set, all API requests are forwarded to the mock server instead of returning static mock data. This is useful for:

- Testing with a dedicated mock server
- Simulating realistic API responses
- Load testing and performance evaluation

Example mock server setup:
```bash
# Start a mock server on port 8000
export USE_MOCK=true
export MOCK_API_BASE=http://localhost:8000
npm run dev
```

## Response Format

All API responses follow a consistent format:

### Success Response
```json
{
  "data": { /* response data */ },
  "message": "Operation completed successfully",
  "timestamp": "2024-01-02T12:00:00.000Z"
}
```

### Error Response
```json
{
  "error": "Error description",
  "code": "ERROR_CODE", 
  "details": { /* additional error details */ },
  "timestamp": "2024-01-02T12:00:00.000Z"
}
```

### Validation Error Response
```json
{
  "error": "Validation failed",
  "code": "VALIDATION_ERROR",
  "details": [
    {
      "field": "symbol",
      "message": "Symbol is required",
      "code": "invalid_type"
    }
  ],
  "timestamp": "2024-01-02T12:00:00.000Z"
}
```

## Development

### Running the API Server

```bash
npm run dev
```

The API will be available at `http://localhost:3000/api/*`

### Type Checking

```bash
npm run type-check
```

### Building for Production

```bash
npm run build
npm start
```

## Next Steps

1. **Real Integrations**: Replace mock data with actual Alpaca API calls
2. **Authentication**: Implement proper JWT validation and user management
3. **Database**: Add persistent storage for user data, trades, and settings
4. **Rate Limiting**: Implement API rate limiting and request throttling
5. **Monitoring**: Add logging, metrics, and error tracking
6. **Testing**: Add comprehensive unit and integration tests