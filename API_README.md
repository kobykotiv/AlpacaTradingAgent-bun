# AlpacaTradingAgent API

This directory contains the Next.js App Router API implementation for the AlpacaTradingAgent project.

## Architecture

The API uses a **Factory Facade pattern** to provide adapter-backed endpoints that can seamlessly switch between real trading providers (like Alpaca) and mock implementations for testing and development.

### Key Components

- **`server/lib/factoryFacade.ts`** - Central adapter management with user-specific configuration
- **`server/lib/middleware.ts`** - Authentication parsing and role-based access control
- **`lib/types/serverTypes.ts`** - TypeScript type definitions for all API responses
- **`lib/schemas/zodSchemas.ts`** - Zod validation schemas for request validation
- **`lib/config.ts`** - Configuration management and utilities

### API Endpoints

#### Portfolio Management
- `GET /api/portfolio` - Get portfolio balance and positions
- `GET /api/heatmap` - Get market heatmap data

#### Trading
- `GET /api/trades/open` - Get open/pending trades
- `GET /api/trades/history` - Get trade history
- `POST /api/trades/execute` - Execute trades (requires admin role)

#### Agent Management
- `GET /api/agents/status` - Get agent status information
- `POST /api/agents/analyze` - Trigger analysis

#### Scheduler
- `GET /api/scheduler/jobs` - List scheduled jobs
- `POST /api/scheduler/jobs` - Create new job (requires admin role)
- `DELETE /api/scheduler/jobs` - Delete job (requires admin role)

#### Integrations
- `GET /api/integrations` - List user integrations
- `POST /api/integrations/connect` - Connect new integration (requires admin role)

#### User Management
- `GET /api/settings/profile` - Get user profile
- `PUT /api/settings/profile` - Update user profile

#### Data & Analytics
- `GET /api/reports` - Get reports
- `GET /api/indicators` - Get technical indicators
- `GET /api/news` - Get news data

## Authentication

The API uses header-based authentication:

```
x-tenant-id: your-tenant-id
x-user-id: your-user-id
authorization: Bearer your-token
```

For development, the API supports anonymous access with fallback to mock data.

## Role-Based Access Control

Certain endpoints require specific roles:
- **Admin role required**: trade execution, integration connection, scheduler management
- **User role**: all read operations, profile updates

## Error Handling

All endpoints return consistent error responses:

```json
{
  "error": "Error message",
  "code": "HTTP_STATUS",
  "details": {},
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

## Mock Fallback

When `config.useMock` is true or integrations fail, the API automatically falls back to mock data, ensuring the system remains functional during development and when external services are unavailable.

## Development

```bash
# Install dependencies
npm install

# Run tests
npm test

# Type check
npm run type-check

# Build
npm run build
```

## Security Features

- Credential encryption for stored integrations
- Request validation using Zod schemas
- Response sanitization (no raw secrets exposed)
- Role-based access control
- Safe fallback to mock data