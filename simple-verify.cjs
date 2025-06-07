const fs = require('fs');
const path = require('path');

console.log('🚀 Account Consolidation Verification\n');

// Test 1: Check for duplicated authenticateUser functions
console.log('=== Testing No Duplicated Functions ===');

const functionsDir = path.join(__dirname, 'netlify/functions');
let duplicatedAuth = 0;

function checkFile(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    const filename = path.basename(filePath);
    
    if (filename === 'account-utils.cjs') return; // Skip the centralized file
    
    if (content.includes('async function authenticateUser(')) {
      console.log(`❌ Found duplicated authenticateUser in ${filePath}`);
      duplicatedAuth++;
    }
  } catch (error) {
    // Ignore file read errors
  }
}

// Check specific function files
const functionFiles = [
  'netlify/functions/notes/index.cjs',
  'netlify/functions/blog/index.cjs',
  'netlify/functions/qstash/index.cjs',
  'netlify/functions/feature-flags/index.cjs',
  'netlify/functions/accounts/index.cjs'
];

functionFiles.forEach(file => {
  const fullPath = path.join(__dirname, file);
  checkFile(fullPath);
});

if (duplicatedAuth === 0) {
  console.log('✅ No duplicated authenticateUser functions found');
} else {
  console.log(`❌ Found ${duplicatedAuth} duplicated functions`);
}

// Test 2: Check imports
console.log('\n=== Testing Account Utils Imports ===');

let correctImports = 0;
functionFiles.forEach(file => {
  const fullPath = path.join(__dirname, file);
  try {
    const content = fs.readFileSync(fullPath, 'utf8');
    const filename = path.basename(path.dirname(fullPath));
    
    if (content.includes("require('../account-utils.cjs')")) {
      console.log(`✅ ${filename} imports account-utils`);
      correctImports++;
    } else {
      console.log(`❌ ${filename} missing account-utils import`);
    }
  } catch (error) {
    console.log(`⚠️  Could not read ${file}`);
  }
});

console.log(`\n📊 Results: ${correctImports}/${functionFiles.length} functions properly configured`);

if (correctImports === functionFiles.length && duplicatedAuth === 0) {
  console.log('\n🎉 Account consolidation verification PASSED!');
  process.exit(0);
} else {
  console.log('\n⚠️  Account consolidation needs attention');
  process.exit(1);
}
