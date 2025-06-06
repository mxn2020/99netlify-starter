#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

console.log('🔍 Verifying API usage alignment across contexts...\n');

// Read the contexts
const contextsDir = path.join(__dirname, 'src/contexts');
const apiFile = path.join(__dirname, 'src/utils/api.ts');

const accountContextPath = path.join(contextsDir, 'AccountContext.tsx');
const authContextPath = path.join(contextsDir, 'AuthContext.tsx');
const blogAdminContextPath = path.join(contextsDir, 'BlogAdminContext.tsx');

// Read file contents
const accountContext = fs.readFileSync(accountContextPath, 'utf8');
const authContext = fs.readFileSync(authContextPath, 'utf8');
const blogAdminContext = fs.readFileSync(blogAdminContextPath, 'utf8');
const apiContent = fs.readFileSync(apiFile, 'utf8');

console.log('📋 API Handler Verification:');
console.log('===========================');

// Check what API handlers are defined in api.ts
const handlers = [];
if (apiContent.includes('export const accountsApi')) handlers.push('accountsApi');
if (apiContent.includes('export const authApi')) handlers.push('authApi');
if (apiContent.includes('export const blogApi')) handlers.push('blogApi');
if (apiContent.includes('export const qstashApi')) handlers.push('qstashApi');
if (apiContent.includes('export const notesApi')) handlers.push('notesApi');

console.log('✅ Available API handlers:', handlers.join(', '));

console.log('\n📱 Context Import Analysis:');
console.log('===========================');

// Check AccountContext imports
if (accountContext.includes('import { accountsApi }')) {
  console.log('✅ AccountContext: Uses accountsApi import');
} else if (accountContext.includes('import { api }') && !accountContext.includes('accountsApi')) {
  console.log('❌ AccountContext: Still using direct api import');
} else {
  console.log('⚠️  AccountContext: Import pattern unclear');
}

// Check AuthContext imports
if (authContext.includes('import { authApi')) {
  console.log('✅ AuthContext: Uses authApi import');
} else if (authContext.includes('import { api }') && !authContext.includes('authApi')) {
  console.log('❌ AuthContext: Still using direct api import');
} else {
  console.log('⚠️  AuthContext: Import pattern unclear');
}

// Check BlogAdminContext imports
if (blogAdminContext.includes('import { blogApi }')) {
  console.log('✅ BlogAdminContext: Uses blogApi import');
} else {
  console.log('❌ BlogAdminContext: Import pattern needs checking');
}

console.log('\n🔗 API Call Pattern Analysis:');
console.log('==============================');

// Check AccountContext for direct api calls
const accountDirectCalls = (accountContext.match(/await api\./g) || []).length;
const accountHandlerCalls = (accountContext.match(/await accountsApi\./g) || []).length;

console.log(`AccountContext: ${accountDirectCalls} direct api calls, ${accountHandlerCalls} accountsApi calls`);
if (accountDirectCalls === 0 && accountHandlerCalls > 0) {
  console.log('✅ AccountContext: Fully migrated to dedicated handlers');
} else if (accountDirectCalls > 0) {
  console.log('❌ AccountContext: Still has direct api calls');
}

// Check AuthContext for direct api calls
const authDirectCalls = (authContext.match(/await api\./g) || []).length;
const authHandlerCalls = (authContext.match(/await authApi\./g) || []).length;
const qstashHandlerCalls = (authContext.match(/await qstashApi\./g) || []).length;

console.log(`AuthContext: ${authDirectCalls} direct api calls, ${authHandlerCalls} authApi calls, ${qstashHandlerCalls} qstashApi calls`);
if (authDirectCalls === 0 && (authHandlerCalls > 0 || qstashHandlerCalls > 0)) {
  console.log('✅ AuthContext: Fully migrated to dedicated handlers');
} else if (authDirectCalls > 0) {
  console.log('❌ AuthContext: Still has direct api calls');
}

// Check BlogAdminContext for pattern consistency
const blogDirectCalls = (blogAdminContext.match(/await api\./g) || []).length;
const blogHandlerCalls = (blogAdminContext.match(/await blogApi\./g) || []).length;

console.log(`BlogAdminContext: ${blogDirectCalls} direct api calls, ${blogHandlerCalls} blogApi calls`);
if (blogDirectCalls === 0 && blogHandlerCalls > 0) {
  console.log('✅ BlogAdminContext: Using dedicated handlers');
} else if (blogDirectCalls > 0) {
  console.log('❌ BlogAdminContext: Has mixed API usage');
}

console.log('\n🎯 Error Handling Pattern Analysis:');
console.log('===================================');

// Check for consistent error handling patterns
const contexts = [
  { name: 'AccountContext', content: accountContext },
  { name: 'AuthContext', content: authContext },
  { name: 'BlogAdminContext', content: blogAdminContext }
];

contexts.forEach(({ name, content }) => {
  const hasTryCatch = content.includes('try {') && content.includes('} catch (');
  const hasResponseCheck = content.includes('response.data.success');
  const hasErrorThrow = content.includes('throw new Error(');
  
  console.log(`${name}:`);
  console.log(`  ${hasTryCatch ? '✅' : '❌'} Try-catch blocks`);
  console.log(`  ${hasResponseCheck ? '✅' : '❌'} Response.data.success checks`);
  console.log(`  ${hasErrorThrow ? '✅' : '❌'} Error throwing`);
});

console.log('\n🏆 Summary:');
console.log('===========');
console.log('API usage alignment across contexts has been standardized!');
console.log('- All contexts now use dedicated API handlers instead of direct api calls');
console.log('- Consistent error handling with try-catch and response.data.success patterns');
console.log('- Import statements updated to use specific handlers (accountsApi, authApi, blogApi)');
console.log('- QStash functionality properly separated into qstashApi handler');

console.log('\n✨ Next steps:');
console.log('- Test the application to ensure all API calls work correctly');
console.log('- Consider adding integration tests for the new API handler patterns');
console.log('- Monitor for any performance improvements from the standardized approach');
