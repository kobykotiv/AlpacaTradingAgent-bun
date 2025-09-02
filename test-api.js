#!/usr/bin/env node

/**
 * Simple script to test API endpoints
 * Run with: node test-api.js
 */

const BASE_URL = 'http://localhost:3000';

const testEndpoints = [
  {
    name: 'Portfolio',
    method: 'GET',
    url: '/api/portfolio',
    headers: {
      'x-tenant-id': 'test-tenant',
      'x-user-id': 'test-user',
    },
  },
  {
    name: 'Agent Status',
    method: 'GET', 
    url: '/api/agents/status',
    headers: {
      'x-tenant-id': 'test-tenant',
      'x-user-id': 'test-user',
    },
  },
  {
    name: 'Open Trades',
    method: 'GET',
    url: '/api/trades/open',
    headers: {
      'x-tenant-id': 'test-tenant',
      'x-user-id': 'test-user',
    },
  },
  {
    name: 'Integrations',
    method: 'GET',
    url: '/api/integrations',
    headers: {
      'x-tenant-id': 'test-tenant',
      'x-user-id': 'test-user',
    },
  },
];

async function testAPI() {
  console.log('🚀 Testing AlpacaTradingAgent API endpoints...\n');

  for (const endpoint of testEndpoints) {
    try {
      console.log(`📍 Testing ${endpoint.name}...`);
      
      const response = await fetch(`${BASE_URL}${endpoint.url}`, {
        method: endpoint.method,
        headers: endpoint.headers,
      });

      const data = await response.json();
      
      if (response.ok) {
        console.log(`✅ ${endpoint.name}: ${response.status} - Success`);
        console.log(`   Data keys: ${Object.keys(data.data || {}).join(', ')}`);
      } else {
        console.log(`❌ ${endpoint.name}: ${response.status} - ${data.error}`);
      }
      
    } catch (error) {
      console.log(`🔥 ${endpoint.name}: Network error - ${error.message}`);
    }
    
    console.log('');
  }

  console.log('💡 To start the Next.js dev server: npm run dev');
  console.log('🧪 To run tests: npm test');
}

if (require.main === module) {
  testAPI();
}

module.exports = { testAPI };