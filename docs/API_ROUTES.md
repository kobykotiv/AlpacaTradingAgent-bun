# API Routes Documentation

This document describes the Next.js API routes for the AlpacaTradingAgent system.

## Quick Start

1. **Enable Alpaca Integration (Optional)**
   ```bash
   # In your .env file
   USE_ALPACA=true
   ALPACA_API_KEY=your_key_here
   ALPACA_SECRET_KEY=your_secret_here
   ```

2. **Set up Database**
   ```bash
   npm run db:migrate
   ```

3. **Generate Secure Secret Key**
   ```bash
   # Generate a 32-character secret for encryption
   node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
   # Add to .env as SECRET_KEY=generated_key_here
   ```

4. **Run Tests**
   ```bash
   npm run test
   ```

## Configuration

### Environment Variables

| Variable | Required | Description | Default |
|----------|----------|-------------|---------|
| `USE_ALPACA` | No | Enable live Alpaca integration | `false` |
| `USE_MOCK` | No | Use mock data for development | `true` |
| `SECRET_KEY` | Yes | 32+ character key for encryption | - |
| `OPENAI_API_KEY` | No | OpenAI API key for analysis | - |
| `ALPACA_API_KEY` | No* | Alpaca API key | - |
| `ALPACA_SECRET_KEY` | No* | Alpaca secret key | - |
| `ALPACA_USE_PAPER` | No | Use paper trading | `true` |

*Required when `USE_ALPACA=true`

### Feature Flags

- **USE_ALPACA=false**: All routes use mock adapters (safe default)
- **USE_ALPACA=true**: Routes use real Alpaca API when user has integration configured
- **Per-user integrations**: Individual users can connect their own Alpaca accounts

## Authentication

All API routes require these headers:

```javascript
{
  "x-tenant-id": "your-tenant-id",
  "authorization": "Bearer user_<userId>",  // Demo format
  "x-user-role": "user|admin"  // Optional, defaults to 'user'
}
```

## API Routes

### Portfolio

**GET** `/api/portfolio`

Returns user's current portfolio positions and performance.

**Response:**
```json
{
  "success": true,
  "data": {
    "totalValue": 75000,
    "totalCash": 25000,
    "totalEquity": 75000,
    "buyingPower": 50000,
    "dayTradeCount": 2,
    "positions": [
      {
        "symbol": "AAPL",
        "quantity": 10,
        "side": "long",
        "marketValue": 1500,
        "costBasis": 1400,
        "unrealizedPL": 100,
        "unrealizedPLPercent": 7.14
      }
    ],
    "performance": {
      "dayChange": 150.25,
      "dayChangePercent": 0.2,
      "totalReturn": 100,
      "totalReturnPercent": 0.13
    }
  }
}
```

### Heatmap

**GET** `/api/heatmap?symbols=AAPL,MSFT,NVDA`

Returns market heatmap data with price changes.

**Query Parameters:**
- `symbols`: Comma-separated list of symbols (optional)

### Agent Status

**GET** `/api/agents/status`

Returns status of all trading agents.

**Response:**
```json
{
  "success": true,
  "data": {
    "agents": [
      {
        "id": "market-analyst-001",
        "name": "Market Analyst",
        "status": "active",
        "lastAction": "Analyzed SPY market trends",
        "performance": {
          "successRate": 87.5,
          "totalActions": 156,
          "avgExecutionTime": 2.3
        }
      }
    ],
    "systemStatus": "healthy"
  }
}
```

### Open Trades

**GET** `/api/trades/open?status=pending&limit=50`

Returns user's current open/pending trades.

**Query Parameters:**
- `status`: Filter by status (pending|filled|cancelled|rejected)
- `symbol`: Filter by symbol
- `limit`: Maximum number of results (default: 50)

### Reports

**GET** `/api/reports?type=market&symbol=AAPL`

Returns generated analysis reports from agents.

**Query Parameters:**
- `type`: Filter by report type (market|sentiment|news|fundamentals|macro)
- `symbol`: Filter by symbol
- `agent`: Filter by agent ID
- `limit`: Maximum results (default: 20)

### Scheduler Jobs

**GET** `/api/scheduler/jobs`

Returns scheduled trading and analysis jobs.

**POST** `/api/scheduler/jobs`

Creates a new scheduled job.

**Request Body:**
```json
{
  "name": "Daily Market Analysis",
  "type": "analysis",
  "schedule": "0 9 * * 1-5",
  "configuration": {
    "symbols": ["SPY", "QQQ"],
    "analysisDepth": "comprehensive"
  }
}
```

### Analysis

**POST** `/api/analyze`

Performs AI-powered analysis using ChatGPT (when OPENAI_API_KEY is available).

**Request Body:**
```json
{
  "symbols": ["AAPL", "NVDA"],
  "analysisType": "comprehensive",
  "timeframe": "1w",
  "options": {
    "includeNews": true,
    "includeSocialSentiment": true
  }
}
```

**Response (when OpenAI unavailable):**
```json
{
  "success": false,
  "error": {
    "code": "OPENAI_UNAVAILABLE",
    "message": "OpenAI API key not configured. Analysis service unavailable."
  }
}
```

## Error Responses

All routes return standardized error responses:

```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "Human readable message",
    "details": []  // Optional validation errors
  },
  "metadata": {
    "timestamp": "2024-01-01T00:00:00.000Z",
    "requestId": "req_123456789"
  }
}
```

### Common Error Codes

- `MISSING_TENANT`: x-tenant-id header missing (400)
- `MISSING_AUTH`: authorization header missing (401)
- `INVALID_AUTH`: invalid authorization token (401)
- `INSUFFICIENT_PERMISSIONS`: insufficient role permissions (403)
- `VALIDATION_ERROR`: request body validation failed (422)
- `OPENAI_UNAVAILABLE`: OpenAI API key not configured (503)

## Database Schema

### Users Table
```sql
CREATE TABLE users (
  id TEXT PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  name TEXT,
  tenantId TEXT NOT NULL,
  createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
  updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

### Integrations Table
```sql
CREATE TABLE integrations (
  id TEXT PRIMARY KEY,
  userId TEXT NOT NULL,
  tenantId TEXT NOT NULL,
  provider TEXT NOT NULL,
  encryptedApiKey TEXT NOT NULL,  -- AES-256-GCM encrypted
  encryptedSecret TEXT NOT NULL,  -- AES-256-GCM encrypted
  sandbox BOOLEAN DEFAULT true,
  isActive BOOLEAN DEFAULT true,
  createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
  updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (userId) REFERENCES users(id),
  UNIQUE(userId, provider)
);
```

## Security Features

### Encryption
- All API keys stored using AES-256-GCM encryption
- Each encrypted value uses unique salt and IV
- Master key derived using PBKDF2 with 100,000 iterations

### Safe Defaults
- `USE_ALPACA=false` by default (mock adapters only)
- `ALPACA_USE_PAPER=true` by default (paper trading)
- Simulation mode enabled unless real credentials provided
- Warning logged when fallback secret key used

### Per-User Isolation
- Each user has separate encrypted integrations
- Tenant-based data isolation
- No cross-user data access

## Testing

Run the test suite:

```bash
# Unit and integration tests
npm run test

# Test with UI
npm run test:ui

# Test with coverage
npm run test:coverage
```

Tests cover:
- Authentication middleware (missing headers, invalid tokens)
- Authorization (role-based access control)
- Validation (Zod schema validation, error handling)
- Proxy behavior (mock API forwarding)
- Encryption (AES-256-GCM encrypt/decrypt)
- Database operations (user/integration CRUD)

## Next Steps for Production

1. **Harden Secrets Management**
   - Use AWS Secrets Manager or Azure Key Vault
   - Implement key rotation
   - Add HSM support for encryption keys

2. **Enhanced Security**
   - Implement proper JWT validation
   - Add rate limiting
   - Enable CORS policies
   - Add audit logging

3. **Monitoring**
   - Add health check endpoints
   - Implement metrics collection
   - Set up error tracking
   - Add performance monitoring

4. **Scalability**
   - Implement connection pooling
   - Add caching layer
   - Consider database sharding
   - Add horizontal scaling

## Development Tips

1. **Use Mock Mode**: Keep `USE_ALPACA=false` during development
2. **Test Encryption**: Verify SECRET_KEY is properly set
3. **Check Logs**: Monitor console for security warnings
4. **Validate Requests**: Use provided Zod schemas for validation
5. **Handle Errors**: Always use error response helpers