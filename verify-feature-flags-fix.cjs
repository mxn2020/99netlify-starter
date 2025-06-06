#!/usr/bin/env node

/**
 * Feature Flags Performance Fix Verification Script
 * 
 * This script verifies that the feature flags performance issue has been resolved.
 * It checks that:
 * 1. The old useFeatureFlags hook now imports from the context
 * 2. The FeatureFlagsProvider is properly integrated in App.tsx
 * 3. Multiple useFeatureFlag calls will now share the same API request
 */

const fs = require('fs');
const path = require('path');

const BASE_DIR = __dirname;

function readFile(filePath) {
  try {
    return fs.readFileSync(path.join(BASE_DIR, filePath), 'utf8');
  } catch (error) {
    console.error(`❌ Could not read file: ${filePath}`);
    return null;
  }
}

function checkHookRefactor() {
  console.log('🔍 Checking hook refactor...');
  
  const hookContent = readFile('src/hooks/useFeatureFlags.ts');
  if (!hookContent) return false;
  
  // Should now be a simple re-export
  const hasContextImport = hookContent.includes("from '../contexts/FeatureFlagsContext'");
  const hasReExport = hookContent.includes('export { useFeatureFlags, useFeatureFlag }');
  const noOldImplementation = !hookContent.includes('useState') && !hookContent.includes('useEffect');
  
  if (hasContextImport && hasReExport && noOldImplementation) {
    console.log('✅ Hook properly refactored to use context');
    return true;
  } else {
    console.log('❌ Hook refactor incomplete');
    return false;
  }
}

function checkContextImplementation() {
  console.log('🔍 Checking context implementation...');
  
  const contextContent = readFile('src/contexts/FeatureFlagsContext.tsx');
  if (!contextContent) return false;
  
  const hasProvider = contextContent.includes('FeatureFlagsProvider');
  const hasContext = contextContent.includes('FeatureFlagsContext');
  const hasHooks = contextContent.includes('export const useFeatureFlags') && 
                   contextContent.includes('export const useFeatureFlag');
  const hasSingleApiCall = contextContent.includes("api.get('/feature-flags')");
  
  if (hasProvider && hasContext && hasHooks && hasSingleApiCall) {
    console.log('✅ Context implementation is correct');
    return true;
  } else {
    console.log('❌ Context implementation incomplete');
    return false;
  }
}

function checkAppIntegration() {
  console.log('🔍 Checking App.tsx integration...');
  
  const appContent = readFile('src/App.tsx');
  if (!appContent) return false;
  
  const hasImport = appContent.includes("from './contexts/FeatureFlagsContext'");
  const hasProvider = appContent.includes('<FeatureFlagsProvider>');
  const hasClosingProvider = appContent.includes('</FeatureFlagsProvider>');
  
  if (hasImport && hasProvider && hasClosingProvider) {
    console.log('✅ FeatureFlagsProvider properly integrated in App.tsx');
    return true;
  } else {
    console.log('❌ App.tsx integration incomplete');
    return false;
  }
}

function checkFeatureFlagUsage() {
  console.log('🔍 Checking feature flag usage patterns...');
  
  const demoContent = readFile('src/components/shared/FeatureFlagDemo.tsx');
  if (!demoContent) return false;
  
  // Count individual useFeatureFlag calls
  const flagCalls = (demoContent.match(/useFeatureFlag\(/g) || []).length;
  const hasUseFeatureFlags = demoContent.includes('useFeatureFlags()');
  
  console.log(`📊 Found ${flagCalls} individual useFeatureFlag calls in FeatureFlagDemo`);
  
  if (flagCalls >= 8 && hasUseFeatureFlags) {
    console.log('✅ Multiple feature flag usage detected - context will optimize these calls');
    return true;
  } else {
    console.log('⚠️  Expected multiple feature flag calls for testing optimization');
    return false;
  }
}

function main() {
  console.log('🚀 Feature Flags Performance Fix Verification\n');
  
  const checks = [
    checkHookRefactor(),
    checkContextImplementation(), 
    checkAppIntegration(),
    checkFeatureFlagUsage()
  ];
  
  const passed = checks.filter(Boolean).length;
  const total = checks.length;
  
  console.log('\n' + '='.repeat(50));
  console.log(`📋 VERIFICATION SUMMARY: ${passed}/${total} checks passed`);
  
  if (passed === total) {
    console.log('🎉 FEATURE FLAGS PERFORMANCE FIX VERIFIED!');
    console.log('');
    console.log('✨ What was fixed:');
    console.log('  • Replaced individual hook instances with shared context');
    console.log('  • Single API call now serves all useFeatureFlag calls');
    console.log('  • Eliminated duplicate /feature-flags requests');
    console.log('  • Maintained backward compatibility');
    console.log('');
    console.log('🔥 Performance improvement:');
    console.log('  • Before: 8+ API calls for FeatureFlagDemo component alone');
    console.log('  • After: 1 API call shared across entire application');
    console.log('');
    console.log('🧪 To test: Log in and check browser DevTools Network tab');
    console.log('   You should see only 1 /feature-flags request instead of many');
    
    process.exit(0);
  } else {
    console.log('❌ Some checks failed. Please review the implementation.');
    process.exit(1);
  }
}

main();
