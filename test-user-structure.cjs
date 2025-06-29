#!/usr/bin/env node

/**
 * Test script to verify the new user structure works correctly
 */

const fetch = require('node-fetch');

const BASE_URL = 'http://localhost:8888';

// Test user data
const testUser = {
  email: `test_${Date.now()}@example.com`,
  password: 'TestPassword123!',
  username: `testuser_${Date.now()}`,
  firstName: 'Test',
  lastName: 'User'
};

async function testRegistration() {
  console.log('🧪 Testing user registration with new structure...');
  
  try {
    const response = await fetch(`${BASE_URL}/api/auth/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(testUser),
    });

    const data = await response.json();
    
    if (response.ok) {
      console.log('✅ Registration successful!');
      console.log('User data:', {
        id: data.user.id,
        email: data.user.email,
        username: data.user.username,
        firstName: data.user.firstName,
        lastName: data.user.lastName,
        name: data.user.name // Should be computed as "firstName lastName"
      });
      
      // Verify computed name
      const expectedName = `${testUser.firstName} ${testUser.lastName}`;
      if (data.user.name === expectedName) {
        console.log('✅ Computed name is correct:', data.user.name);
      } else {
        console.log('❌ Computed name is incorrect. Expected:', expectedName, 'Got:', data.user.name);
      }
      
      return data.user;
    } else {
      console.log('❌ Registration failed:', data.error);
      return null;
    }
  } catch (error) {
    console.log('❌ Registration error:', error.message);
    return null;
  }
}

async function testLogin(email, password) {
  console.log('\n🧪 Testing user login...');
  
  try {
    const response = await fetch(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, password }),
    });

    const data = await response.json();
    
    if (response.ok) {
      console.log('✅ Login successful!');
      console.log('User data:', {
        id: data.user.id,
        email: data.user.email,
        username: data.user.username,
        firstName: data.user.firstName,
        lastName: data.user.lastName,
        name: data.user.name
      });
      
      return data.token;
    } else {
      console.log('❌ Login failed:', data.error);
      return null;
    }
  } catch (error) {
    console.log('❌ Login error:', error.message);
    return null;
  }
}

async function testProfileUpdate(token) {
  console.log('\n🧪 Testing profile update...');
  
  const updateData = {
    firstName: 'Updated',
    lastName: 'TestUser',
    username: `updated_${Date.now()}`
  };
  
  try {
    const response = await fetch(`${BASE_URL}/api/auth/profile`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify(updateData),
    });

    const data = await response.json();
    
    if (response.ok) {
      console.log('✅ Profile update successful!');
      console.log('Updated user data:', {
        username: data.user.username,
        firstName: data.user.firstName,
        lastName: data.user.lastName,
        name: data.user.name
      });
      
      // Verify computed name updated
      const expectedName = `${updateData.firstName} ${updateData.lastName}`;
      if (data.user.name === expectedName) {
        console.log('✅ Computed name updated correctly:', data.user.name);
      } else {
        console.log('❌ Computed name not updated correctly. Expected:', expectedName, 'Got:', data.user.name);
      }
      
      return true;
    } else {
      console.log('❌ Profile update failed:', data.error);
      return false;
    }
  } catch (error) {
    console.log('❌ Profile update error:', error.message);
    return false;
  }
}

async function runTests() {
  console.log('🚀 Starting user structure tests...\n');
  
  // Test registration
  const user = await testRegistration();
  if (!user) {
    console.log('\n❌ Tests failed at registration step');
    return;
  }
  
  // Test login
  const token = await testLogin(testUser.email, testUser.password);
  if (!token) {
    console.log('\n❌ Tests failed at login step');
    return;
  }
  
  // Test profile update
  const updateSuccess = await testProfileUpdate(token);
  if (!updateSuccess) {
    console.log('\n❌ Tests failed at profile update step');
    return;
  }
  
  console.log('\n🎉 All tests passed! User structure is working correctly.');
}

// Run tests if this script is executed directly
if (require.main === module) {
  runTests().catch(console.error);
}

module.exports = { runTests, testRegistration, testLogin, testProfileUpdate };
