// netlify/functions/qstash/index.cjs
const { Redis } = require('@upstash/redis');
const { Client, Receiver } = require('@upstash/qstash');
const jwt = require('jsonwebtoken');
const { parse } = require('cookie');
const { getWebhookUrl, getCorsHeaders } = require('../platform-utils.cjs');
const { generateTaskId, generateNotificationId } = require('../secure-id-utils.cjs');

// Initialize Redis and QStash
const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL,
  token: process.env.UPSTASH_REDIS_REST_TOKEN,
});

const qstashClient = new Client({
  token: process.env.QSTASH_TOKEN,
});

const qstashReceiver = new Receiver({
  currentSigningKey: process.env.QSTASH_CURRENT_SIGNING_KEY,
  nextSigningKey: process.env.QSTASH_NEXT_SIGNING_KEY,
});

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';
const AUTH_MODE = process.env.AUTH_MODE || 'cookie'; // 'cookie' or 'bearer'

// CORS headers
const corsHeaders = {
  ...getCorsHeaders(),
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, Upstash-Signature',
};

// Check if QStash feature is enabled
async function isQStashEnabled() {
  try {
    const flagsData = await redis.get('feature_flags');
    if (!flagsData) return false;

    const flags = typeof flagsData === 'string' ? JSON.parse(flagsData) : flagsData;
    return flags.upstash_qstash?.enabled || false;
  } catch (error) {
    console.error('Error checking QStash feature flag:', error);
    return false;
  }
}

// Authentication middleware
async function authenticateUser(event) {
  // Extract token based on auth mode
  let token;
  const authHeader = event.headers.authorization || event.headers.Authorization;

  if (AUTH_MODE === 'bearer') {
    // Bearer token mode - only check Authorization header
    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.substring(7);
    }
  } else {
    // Cookie mode - check both header and cookies for backward compatibility
    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.substring(7);
    } else {
      // Check for token in cookies
      const cookies = event.headers.cookie;
      if (cookies) {
        const parsedCookies = parse(cookies);
        token = parsedCookies.auth_token;
      }
    }
  }

  if (!token) {
    throw new Error('No token provided');
  }

  if (token.trim() === '' || token === 'null' || token === 'undefined') {
    throw new Error('Invalid token format');
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    return decoded.sub || decoded.userId; // Use 'sub' field which contains the user ID
  } catch (error) {
    console.error('JWT verification failed:', error.message);
    throw new Error('Invalid token');
  }
}

exports.handler = async (event) => {
  // Handle CORS preflight
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers: corsHeaders,
      body: '',
    };
  }

  try {
    const { httpMethod, path } = event;
    const pathParts = path.split('/').filter(Boolean);
    const action = pathParts[pathParts.length - 1];

    // Handle QStash webhook callbacks (no auth required)
    if (httpMethod === 'POST' && action === 'webhook') {
      return await handleQStashWebhook(event);
    }

    // Check if QStash is enabled
    const qstashEnabled = await isQStashEnabled();
    if (!qstashEnabled) {
      return {
        statusCode: 503,
        headers: corsHeaders,
        body: JSON.stringify({
          error: 'QStash feature is currently disabled',
          feature: 'upstash_qstash'
        }),
      };
    }

    // Authenticate user for other endpoints
    const userId = await authenticateUser(event);

    switch (httpMethod) {
      case 'POST':
        if (action === 'schedule') {
          return await handleScheduleTask(event, userId);
        } else if (action === 'welcome-email') {
          return await handleWelcomeEmail(event, userId);
        }
        break;
      case 'GET':
        if (action === 'tasks') {
          return await handleGetTasks(userId);
        }
        break;
    }

    return {
      statusCode: 404,
      headers: corsHeaders,
      body: JSON.stringify({ error: 'Endpoint not found' }),
    };
  } catch (error) {
    console.error('QStash function error:', error);

    const isAuthError = error.message === 'No token provided' ||
      error.message === 'Invalid token format' ||
      error.message === 'Invalid token' ||
      error.name === 'JsonWebTokenError' ||
      error.name === 'TokenExpiredError' ||
      error.name === 'NotBeforeError';

    return {
      statusCode: isAuthError ? 401 : 500,
      headers: corsHeaders,
      body: JSON.stringify({ error: error.message || 'Internal server error' }),
    };
  }
};

async function handleScheduleTask(event, userId) {
  try {
    const requestBody = typeof event.body === 'string' ? JSON.parse(event.body) : event.body;
    const { type, payload, scheduledFor, delay } = requestBody;

    if (!type || !payload) {
      return {
        statusCode: 400,
        headers: corsHeaders,
        body: JSON.stringify({ error: 'Task type and payload are required' }),
      };
    }

    const taskId = generateTaskId();
    const webhookUrl = getWebhookUrl('qstash/webhook');

    // Prepare QStash message options
    const messageOptions = {
      url: webhookUrl,
      body: JSON.stringify({
        taskId,
        type,
        payload,
        userId,
        createdAt: new Date().toISOString()
      }),
      headers: {
        'Content-Type': 'application/json',
        'X-Task-ID': taskId,
        'X-User-ID': userId
      }
    };

    // Add scheduling if specified
    if (scheduledFor) {
      messageOptions.notBefore = new Date(scheduledFor).getTime() / 1000;
    } else if (delay) {
      messageOptions.delay = delay;
    }

    // Publish to QStash
    const qstashResponse = await qstashClient.publishJSON(messageOptions);

    // Store task metadata in Redis
    const task = {
      id: taskId,
      type,
      payload,
      scheduledFor: scheduledFor || null,
      status: 'pending',
      retryCount: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      userId,
      qstashMessageId: qstashResponse.messageId
    };

    await redis.set(`task:${taskId}`, JSON.stringify(task));
    await redis.lpush(`user:${userId}:tasks`, taskId);

    return {
      statusCode: 201,
      headers: corsHeaders,
      body: JSON.stringify({
        success: true,
        data: task,
        qstashResponse
      }),
    };
  } catch (error) {
    console.error('Schedule task error:', error);
    throw error;
  }
}

async function handleWelcomeEmail(event, userId) {
  try {
    const requestBody = typeof event.body === 'string' ? JSON.parse(event.body) : event.body;
    const { email, name } = requestBody;

    if (!email || !name) {
      return {
        statusCode: 400,
        headers: corsHeaders,
        body: JSON.stringify({ error: 'Email and name are required' }),
      };
    }

    // Schedule welcome email task
    const task = await scheduleWelcomeEmail(userId, { email, name });

    return {
      statusCode: 201,
      headers: corsHeaders,
      body: JSON.stringify({
        success: true,
        message: 'Welcome email scheduled',
        data: task
      }),
    };
  } catch (error) {
    console.error('Welcome email error:', error);
    throw error;
  }
}

async function handleQStashWebhook(event) {
  try {
    // Verify the request is from QStash
    const signature = event.headers['upstash-signature'] || event.headers['Upstash-Signature'];

    if (!signature) {
      return {
        statusCode: 401,
        headers: corsHeaders,
        body: JSON.stringify({ error: 'Missing QStash signature' }),
      };
    }

    const isValid = await qstashReceiver.verify({
      signature,
      body: event.body
    });

    if (!isValid) {
      return {
        statusCode: 401,
        headers: corsHeaders,
        body: JSON.stringify({ error: 'Invalid QStash signature' }),
      };
    }

    const taskData = typeof event.body === 'string' ? JSON.parse(event.body) : event.body;
    const { taskId, type, payload, userId } = taskData;

    console.log(`Processing QStash task: ${taskId}, type: ${type}`);

    // Update task status
    const taskKey = `task:${taskId}`;
    const existingTask = await redis.get(taskKey);

    if (existingTask) {
      const task = typeof existingTask === 'string' ? JSON.parse(existingTask) : existingTask;
      task.status = 'processing';
      task.updatedAt = new Date().toISOString();
      await redis.set(taskKey, JSON.stringify(task));
    }

    // Process different task types
    let result;
    try {
      switch (type) {
        case 'welcome_email':
          result = await processWelcomeEmail(payload);
          break;
        case 'scheduled_blog_post':
          result = await processScheduledBlogPost(payload);
          break;
        case 'cleanup_task':
          result = await processCleanupTask(payload);
          break;
        case 'notification':
          result = await processNotification(payload);
          break;
        default:
          throw new Error(`Unknown task type: ${type}`);
      }

      // Update task as completed
      if (existingTask) {
        const task = typeof existingTask === 'string' ? JSON.parse(existingTask) : existingTask;
        task.status = 'completed';
        task.result = result;
        task.updatedAt = new Date().toISOString();
        await redis.set(taskKey, JSON.stringify(task));
      }

      console.log(`Task ${taskId} completed successfully`);

      return {
        statusCode: 200,
        headers: corsHeaders,
        body: JSON.stringify({
          success: true,
          taskId,
          result
        }),
      };

    } catch (processingError) {
      console.error(`Task ${taskId} failed:`, processingError);

      // Update task as failed
      if (existingTask) {
        const task = typeof existingTask === 'string' ? JSON.parse(existingTask) : existingTask;
        task.status = 'failed';
        task.error = processingError.message;
        task.retryCount = (task.retryCount || 0) + 1;
        task.updatedAt = new Date().toISOString();
        await redis.set(taskKey, JSON.stringify(task));
      }

      return {
        statusCode: 500,
        headers: corsHeaders,
        body: JSON.stringify({
          success: false,
          taskId,
          error: processingError.message
        }),
      };
    }

  } catch (error) {
    console.error('QStash webhook error:', error);
    return {
      statusCode: 500,
      headers: corsHeaders,
      body: JSON.stringify({ error: 'Webhook processing failed' }),
    };
  }
}

async function handleGetTasks(userId) {
  try {
    const taskIds = await redis.lrange(`user:${userId}:tasks`, 0, 49); // Get latest 50 tasks

    if (taskIds.length === 0) {
      return {
        statusCode: 200,
        headers: corsHeaders,
        body: JSON.stringify({
          success: true,
          data: [],
          total: 0
        }),
      };
    }

    const tasks = await Promise.all(
      taskIds.map(async (taskId) => {
        const taskData = await redis.get(`task:${taskId}`);
        if (taskData) {
          return typeof taskData === 'string' ? JSON.parse(taskData) : taskData;
        }
        return null;
      })
    );

    const validTasks = tasks.filter(task => task !== null);

    return {
      statusCode: 200,
      headers: corsHeaders,
      body: JSON.stringify({
        success: true,
        data: validTasks,
        total: validTasks.length
      }),
    };
  } catch (error) {
    console.error('Get tasks error:', error);
    throw error;
  }
}

// Task processing functions
async function processWelcomeEmail(payload) {
  const { email, name } = payload;

  // Simulate email sending (replace with actual email service)
  console.log(`Sending welcome email to ${email} for ${name}`);

  // Here you would integrate with your email service
  // For now, we'll simulate a successful email send
  await new Promise(resolve => setTimeout(resolve, 1000));

  return {
    success: true,
    message: `Welcome email sent to ${email}`,
    timestamp: new Date().toISOString()
  };
}

async function processScheduledBlogPost(payload) {
  const { postId, action } = payload;

  console.log(`Processing scheduled blog post: ${postId}, action: ${action}`);

  if (action === 'publish') {
    // Get the blog post from Redis
    const postData = await redis.hgetall(`blog:post:${postId}`);

    if (!postData || !postData.id) {
      throw new Error(`Blog post ${postId} not found`);
    }

    // Update post status to published if it was scheduled
    if (postData.status === 'scheduled') {
      await redis.hset(`blog:post:${postId}`, 'status', 'published');
      await redis.hset(`blog:post:${postId}`, 'publishedDate', new Date().toISOString());
    }

    return {
      success: true,
      message: `Blog post ${postId} published successfully`,
      postId,
      timestamp: new Date().toISOString()
    };
  }

  throw new Error(`Unknown blog post action: ${action}`);
}

async function processCleanupTask(payload) {
  const { type, olderThan } = payload;

  console.log(`Processing cleanup task: ${type}, olderThan: ${olderThan}`);

  let cleaned = 0;

  if (type === 'expired_tasks') {
    // Clean up old completed/failed tasks
    const cutoffDate = new Date(Date.now() - (olderThan || 7 * 24 * 60 * 60 * 1000)); // 7 days default

    // This is a simplified cleanup - in production you'd want more sophisticated logic
    console.log(`Cleaning up tasks older than ${cutoffDate.toISOString()}`);
    cleaned = 0; // Placeholder
  }

  return {
    success: true,
    message: `Cleanup completed for ${type}`,
    itemsCleaned: cleaned,
    timestamp: new Date().toISOString()
  };
}

async function processNotification(payload) {
  const { userId, type, message, data } = payload;

  console.log(`Processing notification for user ${userId}: ${type} - ${message}`);

  // Store notification in Redis
  const notificationId = generateNotificationId();
  const notification = {
    id: notificationId,
    userId,
    type,
    message,
    data: data || {},
    read: false,
    createdAt: new Date().toISOString()
  };

  await redis.set(`notification:${notificationId}`, JSON.stringify(notification));
  await redis.lpush(`user:${userId}:notifications`, notificationId);

  // Keep only the latest 100 notifications per user
  await redis.ltrim(`user:${userId}:notifications`, 0, 99);

  return {
    success: true,
    message: `Notification sent to user ${userId}`,
    notificationId,
    timestamp: new Date().toISOString()
  };
}

// Helper function to schedule welcome email
async function scheduleWelcomeEmail(userId, { email, name }) {
  const taskId = generateTaskId();
  const webhookUrl = getWebhookUrl('qstash/webhook');

  const messageOptions = {
    url: webhookUrl,
    body: JSON.stringify({
      taskId,
      type: 'welcome_email',
      payload: { email, name },
      userId,
      createdAt: new Date().toISOString()
    }),
    headers: {
      'Content-Type': 'application/json',
      'X-Task-ID': taskId,
      'X-User-ID': userId
    },
    delay: 5 // 5 second delay to make registration feel instant
  };

  const qstashResponse = await qstashClient.publishJSON(messageOptions);

  const task = {
    id: taskId,
    type: 'welcome_email',
    payload: { email, name },
    scheduledFor: null,
    status: 'pending',
    retryCount: 0,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    userId,
    qstashMessageId: qstashResponse.messageId
  };

  await redis.set(`task:${taskId}`, JSON.stringify(task));
  await redis.lpush(`user:${userId}:tasks`, taskId);

  return task;
}
