#!/usr/bin/env node

/**
 * Test script to verify platform detection and environment handling
 */

const { getDeploymentUrl, getDeploymentContext, getCorsOrigins, getPrimaryCorsOrigin } = require('./netlify/functions/platform-utils.cjs');

console.log('🧪 Testing Platform Detection\n');

// Test current environment
console.log('📊 Current Environment:');
console.log(`NODE_ENV: ${process.env.NODE_ENV || 'undefined'}`);
console.log(`URL: ${process.env.URL || 'undefined'}`);
console.log(`CONTEXT: ${process.env.CONTEXT || 'undefined'}`);
console.log(`VERCEL_URL: ${process.env.VERCEL_URL || 'undefined'}`);
console.log(`VERCEL_ENV: ${process.env.VERCEL_ENV || 'undefined'}`);
console.log(`VITE_APP_URL: ${process.env.VITE_APP_URL || 'undefined'}`);

console.log('\n🔍 Platform Detection Results:');
console.log(`Deployment URL: ${getDeploymentUrl()}`);
console.log(`Deployment Context: ${getDeploymentContext()}`);
console.log(`Primary CORS Origin: ${getPrimaryCorsOrigin()}`);
console.log(`All CORS Origins: ${getCorsOrigins().join(', ')}`);

// Test different scenarios
console.log('\n🎭 Testing Different Scenarios:');

// Simulate Netlify production
console.log('\n1. Simulating Netlify Production:');
process.env.URL = 'https://my-app.netlify.app';
process.env.CONTEXT = 'production';
delete process.env.VERCEL_URL;
delete process.env.VERCEL_ENV;
console.log(`  URL: ${getDeploymentUrl()}`);
console.log(`  Context: ${getDeploymentContext()}`);

// Simulate Vercel production  
console.log('\n2. Simulating Vercel Production:');
delete process.env.URL;
delete process.env.CONTEXT;
process.env.VERCEL_URL = 'https://my-app.vercel.app';
process.env.VERCEL_ENV = 'production';
console.log(`  URL: ${getDeploymentUrl()}`);
console.log(`  Context: ${getDeploymentContext()}`);

// Simulate custom override
console.log('\n3. Simulating Custom Override:');
process.env.VITE_APP_URL = 'https://custom-domain.com';
console.log(`  URL: ${getDeploymentUrl()}`);
console.log(`  Context: ${getDeploymentContext()}`);

// Test webhook URL generation
console.log('\n🔗 Webhook URL Generation:');
const { getWebhookUrl } = require('./netlify/functions/platform-utils.cjs');

// Reset to Netlify for webhook test
delete process.env.VITE_APP_URL;
delete process.env.VERCEL_URL;
delete process.env.VERCEL_ENV;
process.env.URL = 'https://my-app.netlify.app';
process.env.CONTEXT = 'production';
console.log(`Netlify QStash Webhook: ${getWebhookUrl('qstash/webhook')}`);

// Switch to Vercel for webhook test
delete process.env.URL;
delete process.env.CONTEXT;
process.env.VERCEL_URL = 'https://my-app.vercel.app';
process.env.VERCEL_ENV = 'production';
console.log(`Vercel QStash Webhook: ${getWebhookUrl('qstash/webhook')}`);

console.log('\n✅ Platform detection test completed!');
console.log('\n💡 Tips:');
console.log('- Set VITE_APP_URL to override auto-detection');
console.log('- Set CORS_ORIGINS for custom CORS configuration');
console.log('- The template will auto-detect Netlify or Vercel deployment');
