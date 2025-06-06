#!/usr/bin/env node

/**
 * Validation script for environment variable handling
 * Ensures proper fallbacks and platform detection
 */

console.log('🔍 Environment Variable Validation\n');

// Test cases for environment variable handling
const testCases = [
  {
    name: 'Local Development',
    env: {
      NODE_ENV: 'development'
    },
    expected: {
      url: 'http://localhost:8888',
      context: 'development'
    }
  },
  {
    name: 'Netlify Production',
    env: {
      NODE_ENV: 'production',
      URL: 'https://app.netlify.app',
      CONTEXT: 'production'
    },
    expected: {
      url: 'https://app.netlify.app',
      context: 'production'
    }
  },
  {
    name: 'Vercel Production',
    env: {
      NODE_ENV: 'production',
      VERCEL_URL: 'https://app.vercel.app',
      VERCEL_ENV: 'production'
    },
    expected: {
      url: 'https://app.vercel.app',
      context: 'production'
    }
  },
  {
    name: 'Custom Override',
    env: {
      NODE_ENV: 'production',
      VITE_APP_URL: 'https://custom-domain.com',
      URL: 'https://should-be-ignored.netlify.app'
    },
    expected: {
      url: 'https://custom-domain.com',
      context: 'production'
    }
  }
];

const { getDeploymentUrl, getDeploymentContext, getWebhookUrl } = require('./netlify/functions/platform-utils.cjs');

// Store original env
const originalEnv = { ...process.env };

let allPassed = true;

testCases.forEach((testCase, index) => {
  console.log(`📋 Test ${index + 1}: ${testCase.name}`);
  
  // Clear and set test environment
  Object.keys(process.env).forEach(key => {
    if (key.startsWith('URL') || key.startsWith('CONTEXT') || key.startsWith('VERCEL') || key.startsWith('VITE_') || key === 'NODE_ENV') {
      delete process.env[key];
    }
  });
  
  Object.assign(process.env, testCase.env);
  
  // Test URL detection
  const detectedUrl = getDeploymentUrl();
  const detectedContext = getDeploymentContext();
  
  const urlPassed = detectedUrl === testCase.expected.url;
  const contextPassed = detectedContext === testCase.expected.context;
  
  console.log(`  URL: ${detectedUrl} ${urlPassed ? '✅' : '❌'}`);
  console.log(`  Context: ${detectedContext} ${contextPassed ? '✅' : '❌'}`);
  
  if (!urlPassed || !contextPassed) {
    allPassed = false;
    console.log(`  Expected URL: ${testCase.expected.url}`);
    console.log(`  Expected Context: ${testCase.expected.context}`);
  }
  
  // Test webhook URL generation
  if (process.env.VERCEL_ENV) {
    const webhookUrl = getWebhookUrl('qstash/webhook');
    const expectedPattern = '/api/qstash/webhook';
    if (webhookUrl.includes(expectedPattern)) {
      console.log(`  Webhook: ${webhookUrl} ✅`);
    } else {
      console.log(`  Webhook: ${webhookUrl} ❌ (should contain ${expectedPattern})`);
      allPassed = false;
    }
  } else {
    const webhookUrl = getWebhookUrl('qstash/webhook');
    const expectedPattern = '/.netlify/functions/qstash/webhook';
    if (webhookUrl.includes(expectedPattern)) {
      console.log(`  Webhook: ${webhookUrl} ✅`);
    } else {
      console.log(`  Webhook: ${webhookUrl} ❌ (should contain ${expectedPattern})`);
      allPassed = false;
    }
  }
  
  console.log('');
});

// Restore original environment
Object.keys(process.env).forEach(key => {
  if (key.startsWith('URL') || key.startsWith('CONTEXT') || key.startsWith('VERCEL') || key.startsWith('VITE_') || key === 'NODE_ENV') {
    delete process.env[key];
  }
});
Object.assign(process.env, originalEnv);

// Summary
if (allPassed) {
  console.log('🎉 All environment variable tests passed!');
  console.log('\n✅ Summary:');
  console.log('  - Platform detection working correctly');
  console.log('  - URL resolution priority respected');
  console.log('  - Webhook URL generation accurate');
  console.log('  - Fallbacks functioning properly');
  process.exit(0);
} else {
  console.log('❌ Some tests failed. Please check the implementation.');
  process.exit(1);
}
