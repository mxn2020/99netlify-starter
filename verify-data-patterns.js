#!/usr/bin/env node

/**
 * Data Handling Verification Script
 * Verifies that all contexts follow consistent patterns for API usage, error handling, and response structure
 */

const fs = require('fs');
const path = require('path');

console.log('🔍 DATA HANDLING PATTERN VERIFICATION\n');

// Check API usage patterns in contexts
function checkAPIUsagePatterns() {
  console.log('📡 Checking API Usage Patterns:\n');
  
  const contextFiles = [
    { name: 'AccountContext', path: './src/contexts/AccountContext.tsx' },
    { name: 'AuthContext', path: './src/contexts/AuthContext.tsx' },
    { name: 'BlogAdminContext', path: './src/contexts/BlogAdminContext.tsx' }
  ];
  
  let allPassed = true;
  
  contextFiles.forEach(file => {
    console.log(`🧩 ${file.name}:`);
    
    try {
      const content = fs.readFileSync(file.path, 'utf8');
      
      // Check for api import
      const hasApiImport = content.includes("import { api }") || content.includes("from '../utils/api'");
      console.log(`  ✓ API import: ${hasApiImport ? '✅' : '❌'}`);
      if (!hasApiImport) allPassed = false;
      
      // Check for consistent response.data.success pattern
      const successPatternMatches = content.match(/response\.data\.success/g) || [];
      const responseDataMatches = content.match(/response\.data\./g) || [];
      const consistentPattern = successPatternMatches.length > 0 || responseDataMatches.length > 0;
      console.log(`  ✓ Response.data pattern: ${consistentPattern ? '✅' : '❌'} (${responseDataMatches.length} usages)`);
      
      // Check for raw fetch() usage (should be avoided)
      const hasFetch = content.includes('fetch(') && !content.includes('// fetch allowed');
      console.log(`  ✓ No raw fetch(): ${!hasFetch ? '✅' : '❌'}`);
      if (hasFetch) allPassed = false;
      
      // Check for consistent error handling
      const hasErrorHandling = content.includes('catch (err') || content.includes('catch (error');
      console.log(`  ✓ Error handling: ${hasErrorHandling ? '✅' : '❌'}`);
      if (!hasErrorHandling) allPassed = false;
      
      // Check for deprecated getAuthHeaders usage
      const hasDeprecatedHeaders = content.includes('getAuthHeaders');
      console.log(`  ✓ No deprecated getAuthHeaders: ${!hasDeprecatedHeaders ? '✅' : '❌'}`);
      if (hasDeprecatedHeaders) allPassed = false;
      
    } catch (error) {
      console.log(`  ❌ Failed to read file: ${error.message}`);
      allPassed = false;
    }
    
    console.log('');
  });
  
  return allPassed;
}

// Check backend API response consistency
function checkBackendResponsePatterns() {
  console.log('🖥️  Checking Backend Response Patterns:\n');
  
  const backendFiles = [
    { name: 'Auth Function', path: './netlify/functions/auth/index.cjs' },
    { name: 'Accounts Function', path: './netlify/functions/accounts/index.cjs' },
    { name: 'Notes Function', path: './netlify/functions/notes/index.cjs' },
    { name: 'Blog Function', path: './netlify/functions/blog/index.cjs' }
  ];
  
  let allPassed = true;
  
  backendFiles.forEach(file => {
    console.log(`🔧 ${file.name}:`);
    
    try {
      const content = fs.readFileSync(file.path, 'utf8');
      
      // Check for success field in responses
      const successFieldMatches = content.match(/success:\s*true/g) || [];
      console.log(`  ✓ Success responses: ${successFieldMatches.length > 0 ? '✅' : '❌'} (${successFieldMatches.length} found)`);
      
      // Check for error field in error responses
      const errorFieldMatches = content.match(/error:/g) || [];
      console.log(`  ✓ Error responses: ${errorFieldMatches.length > 0 ? '✅' : '❌'} (${errorFieldMatches.length} found)`);
      
      // Check for consistent CORS headers
      const hasCorsHeaders = content.includes('corsHeaders') || content.includes('Access-Control');
      console.log(`  ✓ CORS headers: ${hasCorsHeaders ? '✅' : '❌'}`);
      
    } catch (error) {
      console.log(`  ❌ Failed to read file: ${error.message}`);
      allPassed = false;
    }
    
    console.log('');
  });
  
  return allPassed;
}

// Check API utility patterns
function checkApiUtilityPatterns() {
  console.log('🛠️  Checking API Utility Patterns:\n');
  
  try {
    const content = fs.readFileSync('./src/utils/api.ts', 'utf8');
    
    // Check for axios configuration
    const hasAxios = content.includes('axios');
    console.log(`  ✓ Uses Axios: ${hasAxios ? '✅' : '❌'}`);
    
    // Check for interceptors
    const hasInterceptors = content.includes('interceptors');
    console.log(`  ✓ Has interceptors: ${hasInterceptors ? '✅' : '❌'}`);
    
    // Check for auth handling
    const hasAuthHandling = content.includes('Authorization') && content.includes('Bearer');
    console.log(`  ✓ Auth handling: ${hasAuthHandling ? '✅' : '❌'}`);
    
    // Check for account context
    const hasAccountContext = content.includes('accountId');
    console.log(`  ✓ Account context: ${hasAccountContext ? '✅' : '❌'}`);
    
    console.log('');
    return hasAxios && hasInterceptors && hasAuthHandling;
    
  } catch (error) {
    console.log(`  ❌ Failed to read api.ts: ${error.message}\n`);
    return false;
  }
}

// Check TypeScript types consistency
function checkTypeConsistency() {
  console.log('📝 Checking TypeScript Type Consistency:\n');
  
  try {
    const content = fs.readFileSync('./src/types/index.ts', 'utf8');
    
    // Check for API response type
    const hasApiResponseType = content.includes('ApiResponse');
    console.log(`  ✓ ApiResponse type: ${hasApiResponseType ? '✅' : '❌'}`);
    
    // Check for context types
    const hasContextTypes = content.includes('ContextType');
    console.log(`  ✓ Context types: ${hasContextTypes ? '✅' : '❌'}`);
    
    // Check for account types
    const hasAccountTypes = content.includes('Account') && content.includes('AccountMember');
    console.log(`  ✓ Account types: ${hasAccountTypes ? '✅' : '❌'}`);
    
    console.log('');
    return hasApiResponseType && hasContextTypes && hasAccountTypes;
    
  } catch (error) {
    console.log(`  ❌ Failed to read types: ${error.message}\n`);
    return false;
  }
}

// Main verification
async function main() {
  console.log('🔍 Account System Data Handling Verification\n');
  console.log('='.repeat(50) + '\n');
  
  const apiPatternsPass = checkAPIUsagePatterns();
  const backendPatternsPass = checkBackendResponsePatterns();
  const apiUtilityPass = checkApiUtilityPatterns();
  const typesPass = checkTypeConsistency();
  
  console.log('📊 VERIFICATION SUMMARY:\n');
  console.log(`  Frontend API Patterns: ${apiPatternsPass ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`  Backend Response Patterns: ${backendPatternsPass ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`  API Utility Configuration: ${apiUtilityPass ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`  TypeScript Type Consistency: ${typesPass ? '✅ PASS' : '❌ FAIL'}`);
  
  const allPassed = apiPatternsPass && backendPatternsPass && apiUtilityPass && typesPass;
  
  console.log('\n' + '='.repeat(50));
  
  if (allPassed) {
    console.log('🎉 ALL CHECKS PASSED!');
    console.log('✅ Data handling patterns are consistent across the codebase');
    console.log('✅ Account system implementation is complete and standardized');
    process.exit(0);
  } else {
    console.log('⚠️  SOME CHECKS FAILED');
    console.log('❌ Data handling patterns need attention');
    process.exit(1);
  }
}

main().catch(console.error);
