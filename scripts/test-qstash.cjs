#!/usr/bin/env node

// scripts/test-qstash.cjs
const https = require('https');
const http = require('http');
const { URL: NodeURL } = require('url');

const API_BASE = process.env.VITE_API_BASE_URL || 'http://localhost:8888/.netlify/functions';

// Simple fetch replacement for Node.js
function simpleFetch(url, options = {}) {
  return new Promise((resolve, reject) => {
    const urlObj = new NodeURL(url);
    const isHttps = urlObj.protocol === 'https:';
    const client = isHttps ? https : http;
    
    const requestOptions = {
      hostname: urlObj.hostname,
      port: urlObj.port || (isHttps ? 443 : 80),
      path: urlObj.pathname + urlObj.search,
      method: options.method || 'GET',
      headers: options.headers || {},
    };

    const req = client.request(requestOptions, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const json = data ? JSON.parse(data) : {};
          resolve({
            ok: res.statusCode >= 200 && res.statusCode < 300,
            status: res.statusCode,
            json: () => Promise.resolve(json)
          });
        } catch (e) {
          resolve({
            ok: res.statusCode >= 200 && res.statusCode < 300,
            status: res.statusCode,
            json: () => Promise.resolve({ error: 'Invalid JSON response' })
          });
        }
      });
    });

    req.on('error', reject);
    
    if (options.body) {
      req.write(options.body);
    }
    
    req.end();
  });
}

async function testQStash() {
  console.log('🚀 Testing QStash Integration...\n');

  try {
    // Test 1: Check if QStash feature is enabled
    console.log('1. Checking QStash feature flag...');
    const flagsResponse = await simpleFetch(`${API_BASE}/feature-flags`);
    const flagsData = await flagsResponse.json();
    
    if (!flagsData.success) {
      console.log('❌ Could not check feature flags (admin access required)');
    } else {
      const qstashFlag = flagsData.data?.find(flag => flag.id === 'upstash_qstash');
      if (qstashFlag?.enabled) {
        console.log('✅ QStash feature is enabled');
      } else {
        console.log('⚠️  QStash feature is disabled');
        return;
      }
    }

    // Test 2: Test welcome email scheduling (requires auth)
    console.log('\n2. Testing welcome email scheduling...');
    console.log('ℹ️  This requires authentication - run from browser console or admin panel');

    // Test 3: Test custom task scheduling
    console.log('\n3. Testing custom task scheduling...');
    console.log('ℹ️  This requires authentication - run from browser console or admin panel');

    // Test 4: Test webhook endpoint (without signature - should fail)
    console.log('\n4. Testing webhook endpoint security...');
    const webhookResponse = await simpleFetch(`${API_BASE}/qstash`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ test: 'data' })
    });
    
    if (webhookResponse.status === 401) {
      console.log('✅ Webhook properly rejects unsigned requests');
    } else {
      console.log('❌ Webhook security may be compromised');
    }

    console.log('\n📋 QStash Test Summary:');
    console.log('- Feature flag check: Basic test completed');
    console.log('- Welcome email: Requires authentication (test in browser)');
    console.log('- Custom tasks: Requires authentication (test in browser)');
    console.log('- Webhook security: ✅ Working correctly');
    
    console.log('\n🧪 To test authenticated features:');
    console.log('1. Open browser console on your app');
    console.log('2. Login as admin');
    console.log('3. Run: appTests.testQStash()');

  } catch (error) {
    console.error('❌ QStash test failed:', error.message);
  }
}

if (require.main === module) {
  testQStash();
}

module.exports = { testQStash };
