#!/usr/bin/env node

// scripts/test-blog-qstash-fixes.cjs
const https = require('https');
const http = require('http');

const API_BASE = process.env.VITE_API_BASE_URL || 'http://localhost:8888/.netlify/functions';
const ADMIN_EMAIL = 'admin@example.com';
const ADMIN_PASSWORD = 'Admin123!@#';

// Simple fetch replacement for Node.js
function simpleFetch(url, options = {}) {
  return new Promise((resolve, reject) => {
    const isHttps = url.startsWith('https://');
    const client = isHttps ? https : http;
    
    const urlObj = new URL(url);
    const requestOptions = {
      hostname: urlObj.hostname,
      port: urlObj.port || (isHttps ? 443 : 80),
      path: urlObj.pathname + urlObj.search,
      method: options.method || 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...options.headers
      }
    };

    const req = client.request(requestOptions, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        resolve({
          status: res.statusCode,
          headers: res.headers,
          json: () => Promise.resolve(JSON.parse(data))
        });
      });
    });

    req.on('error', reject);
    
    if (options.body) {
      req.write(options.body);
    }
    
    req.end();
  });
}

async function authenticateAdmin() {
  console.log('🔐 Authenticating as admin...');
  
  try {
    const response = await simpleFetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      body: JSON.stringify({
        email: ADMIN_EMAIL,
        password: ADMIN_PASSWORD
      })
    });

    const data = await response.json();
    
    if (data.success && data.data?.token) {
      console.log('✅ Admin authentication successful');
      return data.data.token;
    } else {
      throw new Error(data.error || 'Authentication failed');
    }
  } catch (error) {
    console.error('❌ Admin authentication failed:', error.message);
    throw error;
  }
}

async function testBlogPostCreation(token) {
  console.log('\n📝 Testing blog post creation...');
  
  const testPost = {
    title: `Test Scheduled Post ${Date.now()}`,
    content: 'This is a test post for scheduled publication.',
    excerpt: 'A test post excerpt',
    tags: ['test', 'scheduled'],
    status: 'scheduled',
    isPublic: true,
    scheduledFor: new Date(Date.now() + 30000).toISOString() // 30 seconds from now
  };

  try {
    const response = await simpleFetch(`${API_BASE}/blog`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(testPost)
    });

    const data = await response.json();
    
    if (data.success && data.data) {
      console.log('✅ Blog post created successfully');
      console.log(`   - Slug: ${data.data.slug}`);
      console.log(`   - Status: ${data.data.status}`);
      console.log(`   - Scheduled for: ${data.data.scheduledFor}`);
      console.log(`   - Is Public: ${data.data.isPublic}`);
      return data.data;
    } else {
      throw new Error(data.error || 'Failed to create blog post');
    }
  } catch (error) {
    console.error('❌ Blog post creation failed:', error.message);
    throw error;
  }
}

async function testQStashTaskCreation(token, postId) {
  console.log('\n🚀 Testing QStash task creation...');
  
  const taskData = {
    type: 'scheduled_blog_post',
    payload: {
      postId: postId,
      action: 'publish'
    },
    scheduledFor: new Date(Date.now() + 10000).toISOString() // 10 seconds from now
  };

  try {
    const response = await simpleFetch(`${API_BASE}/qstash/schedule`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(taskData)
    });

    const data = await response.json();
    
    if (data.success && data.data) {
      console.log('✅ QStash task created successfully');
      console.log(`   - Task ID: ${data.data.id}`);
      console.log(`   - Type: ${data.data.type}`);
      console.log(`   - Status: ${data.data.status}`);
      console.log(`   - Scheduled for: ${data.data.scheduledFor}`);
      return data.data;
    } else {
      throw new Error(data.error || 'Failed to create QStash task');
    }
  } catch (error) {
    console.error('❌ QStash task creation failed:', error.message);
    throw error;
  }
}

async function monitorTaskStatus(token, taskId, maxChecks = 10) {
  console.log('\n👀 Monitoring task status changes...');
  
  for (let i = 0; i < maxChecks; i++) {
    try {
      const response = await simpleFetch(`${API_BASE}/qstash/tasks`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      const data = await response.json();
      
      if (data.success && data.data) {
        const task = data.data.find(t => t.id === taskId);
        if (task) {
          console.log(`   Check ${i + 1}: Task status = ${task.status}`);
          
          if (task.status === 'completed') {
            console.log('✅ Task completed successfully!');
            if (task.result) {
              console.log(`   - Result: ${JSON.stringify(task.result, null, 2)}`);
            }
            return task;
          } else if (task.status === 'failed') {
            console.log('❌ Task failed!');
            if (task.error) {
              console.log(`   - Error: ${task.error}`);
            }
            return task;
          }
        } else {
          console.log(`   Check ${i + 1}: Task not found`);
        }
      }
      
      // Wait 3 seconds before next check
      await new Promise(resolve => setTimeout(resolve, 3000));
    } catch (error) {
      console.error(`   Check ${i + 1} failed:`, error.message);
    }
  }
  
  console.log('⚠️ Task monitoring timed out');
  return null;
}

async function verifyBlogPostPublication(token, postSlug) {
  console.log('\n📖 Verifying blog post publication...');
  
  try {
    const response = await simpleFetch(`${API_BASE}/blog/${postSlug}`);
    const data = await response.json();
    
    if (data.success && data.data) {
      console.log('✅ Blog post is accessible');
      console.log(`   - Status: ${data.data.status}`);
      console.log(`   - Is Public: ${data.data.isPublic}`);
      console.log(`   - Published Date: ${data.data.publishedDate}`);
      return data.data;
    } else {
      throw new Error(data.error || 'Failed to fetch blog post');
    }
  } catch (error) {
    console.error('❌ Blog post verification failed:', error.message);
    throw error;
  }
}

async function testServerTimeEndpoint(token) {
  console.log('\n🕐 Testing server time endpoint...');
  
  try {
    const response = await simpleFetch(`${API_BASE}/qstash/server-time`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    const data = await response.json();
    
    if (data.success && data.data) {
      console.log('✅ Server time endpoint working');
      console.log(`   - Server Time: ${data.data.formattedTime}`);
      console.log(`   - Timezone: ${data.data.timezone}`);
      return data.data;
    } else {
      throw new Error(data.error || 'Failed to get server time');
    }
  } catch (error) {
    console.error('❌ Server time test failed:', error.message);
    throw error;
  }
}

async function testAllFixes() {
  console.log('🧪 Testing Blog & QStash Fixes\n');
  console.log('=' .repeat(50));
  
  try {
    // 1. Authenticate
    const token = await authenticateAdmin();
    
    // 2. Test server time endpoint
    await testServerTimeEndpoint(token);
    
    // 3. Create a scheduled blog post
    const blogPost = await testBlogPostCreation(token);
    
    // 4. Create a QStash task for the blog post
    const task = await testQStashTaskCreation(token, blogPost.slug);
    
    // 5. Monitor task status changes
    const finalTask = await monitorTaskStatus(token, task.id);
    
    // 6. Verify blog post was published
    if (finalTask && finalTask.status === 'completed') {
      await verifyBlogPostPublication(token, blogPost.slug);
    }
    
    console.log('\n🎉 All tests completed!');
    
    if (finalTask?.status === 'completed') {
      console.log('\n✅ SUCCESS: All fixes are working correctly!');
      console.log('- Blog post creation ✅');
      console.log('- QStash task scheduling ✅');
      console.log('- Task processing with QStash ✅');
      console.log('- Blog post publication ✅');
      console.log('- Server time endpoint ✅');
    } else {
      console.log('\n⚠️ PARTIAL SUCCESS: Some issues may remain');
    }
    
  } catch (error) {
    console.error('\n❌ Test suite failed:', error.message);
    process.exit(1);
  }
}

// Run tests if called directly
if (require.main === module) {
  testAllFixes();
}

module.exports = { testAllFixes };
