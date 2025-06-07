const { Redis } = require('@upstash/redis');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { parse } = require('cookie');
const {
  SECURITY_CONFIG,
  getSecurityHeaders,
  checkRateLimit,
  clearRateLimit,
  validatePassword,
  validateEmail,
  validateUsername,
  sanitizeInput,
  blacklistToken,
  isTokenBlacklisted,
  generateSecureToken,
  setSecureCookie,
  clearSecureCookie,
  recordFailedLogin,
  clearFailedLoginAttempts,
} = require('./security-utils.cjs');
const { generateUserId } = require('../secure-id-utils.cjs');

// Initialize Redis
const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL,
  token: process.env.UPSTASH_REDIS_REST_TOKEN,
});

const JWT_SECRET = process.env.JWT_SECRET;
const AUTH_MODE = process.env.AUTH_MODE || 'cookie'; // 'cookie' or 'bearer'

// Validate JWT secret exists and is strong enough
if (!JWT_SECRET || JWT_SECRET.length < 32) {
  throw new Error('JWT_SECRET must be at least 32 characters long for security');
}

// Get client IP address
const getClientIP = (event) => {
  return event.headers['x-forwarded-for'] ||
    event.headers['x-real-ip'] ||
    event.requestContext?.identity?.sourceIp ||
    'unknown';
};

// Helper function to extract token based on auth mode
const extractToken = (event) => {
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

  return token;
};

// Helper function to set authentication response based on auth mode
const setAuthResponse = (response, token) => {
  if (AUTH_MODE === 'bearer') {
    // Bearer mode - return token in response body only
    return response;
  } else {
    // Cookie mode - set HTTP-only cookie
    const cookieValue = setSecureCookie(token);
    return {
      ...response,
      headers: {
        ...response.headers,
        'Set-Cookie': cookieValue,
      },
    };
  }
};

// CORS headers with enhanced security
const corsHeaders = getSecurityHeaders();

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

    switch (httpMethod) {
      case 'POST':
        if (action === 'register') {
          return await handleRegister(event);
        } else if (action === 'login') {
          return await handleLogin(event);
        }
        break;
      case 'GET':
        if (action === 'me') {
          return await handleGetMe(event);
        }
        break;
      case 'PUT':
        if (action === 'profile') {
          return await handleUpdateProfile(event);
        } else if (action === 'password') {
          return await handleChangePassword(event);
        }
        break;
      case 'DELETE':
        if (action === 'logout') {
          return await handleLogout(event);
        }
        break;
    }

    return {
      statusCode: 404,
      headers: corsHeaders,
      body: JSON.stringify({ error: 'Endpoint not found' }),
    };
  } catch (error) {
    console.error('Auth function error:', error);
    return {
      statusCode: 500,
      headers: corsHeaders,
      body: JSON.stringify({ error: 'Internal server error' }),
    };
  }
};

async function handleRegister(event) {
  try {
    const clientIP = getClientIP(event);

    // Check rate limiting
    const rateLimit = await checkRateLimit(`register:${clientIP}`);
    if (!rateLimit.allowed) {
      return {
        statusCode: 429,
        headers: corsHeaders,
        body: JSON.stringify({
          error: 'Too many registration attempts. Please try again later.',
          retryAfter: Math.ceil((rateLimit.resetTime - Date.now()) / 1000)
        }),
      };
    }

    // Safely parse the request body
    let body;
    if (typeof event.body === 'string') {
      body = JSON.parse(event.body);
    } else if (event.body && typeof event.body === 'object') {
      body = event.body;
    } else {
      return {
        statusCode: 400,
        headers: corsHeaders,
        body: JSON.stringify({ error: 'Invalid request body' }),
      };
    }

    const { username, email, password } = body;

    // Validate required fields
    if (!username || !email || !password) {
      return {
        statusCode: 400,
        headers: corsHeaders,
        body: JSON.stringify({ error: 'Username, email, and password are required' }),
      };
    }

    // Sanitize and validate inputs
    const sanitizedUsername = sanitizeInput(username);
    const sanitizedEmail = sanitizeInput(email);

    const usernameValidation = validateUsername(sanitizedUsername);
    if (!usernameValidation.valid) {
      return {
        statusCode: 400,
        headers: corsHeaders,
        body: JSON.stringify({ error: usernameValidation.message }),
      };
    }

    const emailValidation = validateEmail(sanitizedEmail);
    if (!emailValidation.valid) {
      return {
        statusCode: 400,
        headers: corsHeaders,
        body: JSON.stringify({ error: emailValidation.message }),
      };
    }

    const passwordValidation = validatePassword(password);
    if (!passwordValidation.valid) {
      return {
        statusCode: 400,
        headers: corsHeaders,
        body: JSON.stringify({ error: passwordValidation.message }),
      };
    }

    // Check if user already exists
    const existingUser = await redis.get(`user:email:${sanitizedEmail}`);
    if (existingUser) {
      return {
        statusCode: 409,
        headers: corsHeaders,
        body: JSON.stringify({ error: 'User already exists with this email' }),
      };
    }

    // Hash password with increased salt rounds
    const hashedPassword = await bcrypt.hash(password, SECURITY_CONFIG.BCRYPT_ROUNDS);

    // Generate secure user ID
    const userId = generateUserId();

    // Create user object
    const user = {
      id: userId,
      username: sanitizedUsername,
      name: sanitizedUsername,
      email: sanitizedEmail,
      password: hashedPassword,
      role: 'user', // Default role is 'user', can be 'admin' or 'super-admin'
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      lastLogin: null,
      loginAttempts: 0,
    };

    // Store user data
    await redis.set(`user:${userId}`, JSON.stringify(user));
    await redis.set(`user:email:${sanitizedEmail}`, userId);

    // Create personal account for the user
    const { generateAccountId } = require('../secure-id-utils.cjs');
    const accountId = generateAccountId();
    const now = new Date().toISOString();

    const personalAccount = {
      id: accountId,
      name: `${sanitizedUsername}'s Personal Account`,
      type: 'personal',
      description: 'Personal account',
      ownerId: userId,
      createdAt: now,
      updatedAt: now,
      settings: {
        allowInvites: false,
        defaultMemberRole: 'viewer',
      },
    };

    // Store account and membership
    await redis.set(`account:${accountId}`, JSON.stringify(personalAccount));
    
    const ownerMembership = {
      userId,
      accountId,
      role: 'owner',
      joinedAt: now,
      invitedBy: userId,
    };

    await redis.set(`account:${accountId}:member:${userId}`, JSON.stringify(ownerMembership));
    await redis.sadd(`account:${accountId}:members`, userId);
    await redis.sadd(`user:${userId}:accounts`, accountId);

    // Schedule welcome email via QStash (if enabled)
    try {
      await scheduleWelcomeEmail(userId, {
        email: sanitizedEmail,
        name: sanitizedUsername
      });
    } catch (qstashError) {
      // Don't fail registration if welcome email fails
      console.warn('Welcome email scheduling failed:', qstashError.message);
    }

    // Generate secure JWT token
    const token = generateSecureToken(user);

    // Return user data without password
    const { password: _, ...userWithoutPassword } = user;

    const response = {
      statusCode: 201,
      headers: corsHeaders,
      body: JSON.stringify({
        success: true,
        user: userWithoutPassword,
        token: AUTH_MODE === 'bearer' ? token : undefined, // Only include token in body for Bearer mode
        message: 'Registration successful'
      }),
    };

    return setAuthResponse(response, token);
  } catch (error) {
    console.error('Register error:', error);
    return {
      statusCode: 500,
      headers: corsHeaders,
      body: JSON.stringify({ error: 'Failed to register user' }),
    };
  }
}

async function handleLogin(event) {
  try {
    const clientIP = getClientIP(event);

    // Safely parse the request body
    let body;
    if (typeof event.body === 'string') {
      body = JSON.parse(event.body);
    } else if (event.body && typeof event.body === 'object') {
      body = event.body;
    } else {
      return {
        statusCode: 400,
        headers: corsHeaders,
        body: JSON.stringify({ error: 'Invalid request body' }),
      };
    }

    const { email, password } = body;

    if (!email || !password) {
      return {
        statusCode: 400,
        headers: corsHeaders,
        body: JSON.stringify({ error: 'Email and password are required' }),
      };
    }

    // Sanitize email input
    const sanitizedEmail = sanitizeInput(email);

    // Check rate limiting for login attempts
    const emailRateLimit = await checkRateLimit(`login:email:${sanitizedEmail}`);
    const ipRateLimit = await checkRateLimit(`login:ip:${clientIP}`);

    if (!emailRateLimit.allowed || !ipRateLimit.allowed) {
      return {
        statusCode: 429,
        headers: corsHeaders,
        body: JSON.stringify({
          error: 'Too many login attempts. Please try again later.',
          retryAfter: Math.ceil(Math.max(
            (emailRateLimit.resetTime - Date.now()) / 1000,
            (ipRateLimit.resetTime - Date.now()) / 1000
          ))
        }),
      };
    }

    // Get user ID by email
    const userId = await redis.get(`user:email:${sanitizedEmail}`);
    if (!userId) {
      await recordFailedLogin(sanitizedEmail, clientIP);
      return {
        statusCode: 401,
        headers: corsHeaders,
        body: JSON.stringify({ error: 'Invalid credentials' }),
      };
    }

    // Get user data
    const userData = await redis.get(`user:${userId}`);
    if (!userData) {
      await recordFailedLogin(sanitizedEmail, clientIP);
      return {
        statusCode: 401,
        headers: corsHeaders,
        body: JSON.stringify({ error: 'Invalid credentials' }),
      };
    }

    // Safely parse user data
    let user;
    try {
      user = typeof userData === 'string' ? JSON.parse(userData) : userData;
    } catch (parseError) {
      console.error('Failed to parse user data:', parseError);
      return {
        statusCode: 500,
        headers: corsHeaders,
        body: JSON.stringify({ error: 'Invalid user data' }),
      };
    }

    // Verify password
    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      await recordFailedLogin(sanitizedEmail, clientIP);
      return {
        statusCode: 401,
        headers: corsHeaders,
        body: JSON.stringify({ error: 'Invalid credentials' }),
      };
    }

    // Clear failed login attempts on successful login
    await clearFailedLoginAttempts(sanitizedEmail, clientIP);

    // Update user's last login
    const updatedUser = {
      ...user,
      lastLogin: new Date().toISOString(),
      loginAttempts: 0,
      updatedAt: new Date().toISOString()
    };
    await redis.set(`user:${userId}`, JSON.stringify(updatedUser));

    // Generate secure JWT token
    const token = generateSecureToken(updatedUser);

    // Return user data without password
    const { password: _, ...userWithoutPassword } = updatedUser;

    const response = {
      statusCode: 200,
      headers: corsHeaders,
      body: JSON.stringify({
        success: true,
        user: userWithoutPassword,
        token: AUTH_MODE === 'bearer' ? token : undefined, // Only include token in body for Bearer mode
        message: 'Login successful'
      }),
    };

    return setAuthResponse(response, token);
  } catch (error) {
    console.error('Login error:', error);
    return {
      statusCode: 500,
      headers: corsHeaders,
      body: JSON.stringify({ error: 'Failed to login' }),
    };
  }
}

async function handleGetMe(event) {
  try {
    // Extract token based on auth mode
    const token = extractToken(event);

    if (!token) {
      return {
        statusCode: 401,
        headers: corsHeaders,
        body: JSON.stringify({ error: 'No token provided' }),
      };
    }

    // Check if token is blacklisted
    const isBlacklisted = await isTokenBlacklisted(token);
    if (isBlacklisted) {
      return {
        statusCode: 401,
        headers: corsHeaders,
        body: JSON.stringify({ error: 'Token has been revoked' }),
      };
    }

    // Verify token
    const decoded = jwt.verify(token, JWT_SECRET);

    // Get user data
    const userData = await redis.get(`user:${decoded.sub || decoded.userId}`);
    if (!userData) {
      return {
        statusCode: 404,
        headers: corsHeaders,
        body: JSON.stringify({ error: 'User not found' }),
      };
    }

    // Safely parse user data
    let user;
    try {
      user = typeof userData === 'string' ? JSON.parse(userData) : userData;
    } catch (parseError) {
      console.error('Failed to parse user data:', parseError);
      return {
        statusCode: 500,
        headers: corsHeaders,
        body: JSON.stringify({ error: 'Invalid user data' }),
      };
    }

    const { password: _, ...userWithoutPassword } = user;

    return {
      statusCode: 200,
      headers: corsHeaders,
      body: JSON.stringify({ user: userWithoutPassword }),
    };
  } catch (error) {
    console.error('Get me error:', error);
    return {
      statusCode: 401,
      headers: corsHeaders,
      body: JSON.stringify({ error: 'Invalid token' }),
    };
  }
}

async function handleLogout(event) {
  try {
    // Get token from Authorization header or cookies
    let token;
    const authHeader = event.headers.authorization || event.headers.Authorization;

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

    // If token exists, blacklist it
    if (token) {
      await blacklistToken(token);
    }

    return {
      statusCode: 200,
      headers: {
        ...corsHeaders,
        'Set-Cookie': clearSecureCookie()
      },
      body: JSON.stringify({ message: 'Logged out successfully' }),
    };
  } catch (error) {
    console.error('Logout error:', error);
    return {
      statusCode: 500,
      headers: corsHeaders,
      body: JSON.stringify({ error: 'Failed to logout' }),
    };
  }
}

async function handleUpdateProfile(event) {
  try {
    // Get token from Authorization header or cookies
    let token;
    const authHeader = event.headers.authorization || event.headers.Authorization;

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

    if (!token) {
      return {
        statusCode: 401,
        headers: corsHeaders,
        body: JSON.stringify({ error: 'No token provided' }),
      };
    }

    // Check if token is blacklisted
    const isBlacklisted = await isTokenBlacklisted(token);
    if (isBlacklisted) {
      return {
        statusCode: 401,
        headers: corsHeaders,
        body: JSON.stringify({ error: 'Token has been revoked' }),
      };
    }

    // Verify token
    const decoded = jwt.verify(token, JWT_SECRET);

    // Get user data
    const userData = await redis.get(`user:${decoded.sub || decoded.userId}`);
    if (!userData) {
      return {
        statusCode: 404,
        headers: corsHeaders,
        body: JSON.stringify({ error: 'User not found' }),
      };
    }

    // Safely parse user data
    let user;
    try {
      user = typeof userData === 'string' ? JSON.parse(userData) : userData;
    } catch (parseError) {
      console.error('Failed to parse user data:', parseError);
      return {
        statusCode: 500,
        headers: corsHeaders,
        body: JSON.stringify({ error: 'Invalid user data' }),
      };
    }

    // Parse request body
    let body;
    if (typeof event.body === 'string') {
      body = JSON.parse(event.body);
    } else if (event.body && typeof event.body === 'object') {
      body = event.body;
    } else {
      return {
        statusCode: 400,
        headers: corsHeaders,
        body: JSON.stringify({ error: 'Invalid request body' }),
      };
    }

    // Validate and sanitize inputs
    let updatedFields = {};

    if (body.name !== undefined) {
      const sanitizedName = sanitizeInput(body.name);
      if (sanitizedName.length < 1 || sanitizedName.length > 100) {
        return {
          statusCode: 400,
          headers: corsHeaders,
          body: JSON.stringify({ error: 'Name must be between 1 and 100 characters' }),
        };
      }
      updatedFields.name = sanitizedName;
    }

    if (body.email !== undefined) {
      const sanitizedEmail = sanitizeInput(body.email);
      const emailValidation = validateEmail(sanitizedEmail);
      if (!emailValidation.valid) {
        return {
          statusCode: 400,
          headers: corsHeaders,
          body: JSON.stringify({ error: emailValidation.message }),
        };
      }

      // Check if new email is already taken by another user
      if (sanitizedEmail !== user.email) {
        const existingUser = await redis.get(`user:email:${sanitizedEmail}`);
        if (existingUser && existingUser !== user.id) {
          return {
            statusCode: 409,
            headers: corsHeaders,
            body: JSON.stringify({ error: 'Email is already in use by another account' }),
          };
        }
      }

      updatedFields.email = sanitizedEmail;
    }

    if (body.preferences !== undefined) {
      // Validate preferences object
      if (typeof body.preferences === 'object' && body.preferences !== null) {
        updatedFields.preferences = body.preferences;
      }
    }

    // Update user fields
    const updatedUser = {
      ...user,
      ...updatedFields,
      updatedAt: new Date().toISOString()
    };

    // If email is changed, update the email index
    if (updatedFields.email && updatedFields.email !== user.email) {
      // Remove old email index
      await redis.del(`user:email:${user.email}`);
      // Add new email index
      await redis.set(`user:email:${updatedFields.email}`, user.id);
    }

    // Save updated user
    await redis.set(`user:${user.id}`, JSON.stringify(updatedUser));

    // Return user data without password
    const { password: _, ...userWithoutPassword } = updatedUser;

    return {
      statusCode: 200,
      headers: corsHeaders,
      body: JSON.stringify({
        user: userWithoutPassword,
        message: 'Profile updated successfully'
      }),
    };
  } catch (error) {
    console.error('Update profile error:', error);
    return {
      statusCode: 500,
      headers: corsHeaders,
      body: JSON.stringify({ error: 'Failed to update profile' }),
    };
  }
}

async function handleChangePassword(event) {
  try {
    // Authentication check
    const authResult = await verifyAuth(event);
    if (!authResult.success) {
      return {
        statusCode: 401,
        headers: corsHeaders,
        body: JSON.stringify({ error: authResult.error }),
      };
    }

    const { user } = authResult;
    const clientIP = getClientIP(event);

    // Parse request body
    let body;
    if (typeof event.body === 'string') {
      body = JSON.parse(event.body);
    } else if (event.body && typeof event.body === 'object') {
      body = event.body;
    } else {
      return {
        statusCode: 400,
        headers: corsHeaders,
        body: JSON.stringify({ error: 'Invalid request body' }),
      };
    }

    const { currentPassword, newPassword } = body;

    if (!currentPassword || !newPassword) {
      return {
        statusCode: 400,
        headers: corsHeaders,
        body: JSON.stringify({ error: 'Current password and new password are required' }),
      };
    }

    // Rate limiting for password change attempts
    const ipRateLimit = await checkRateLimit(`password-change:ip:${clientIP}`);
    const userRateLimit = await checkRateLimit(`password-change:user:${user.id}`);

    if (!ipRateLimit.allowed || !userRateLimit.allowed) {
      return {
        statusCode: 429,
        headers: corsHeaders,
        body: JSON.stringify({
          error: 'Too many password change attempts. Please try again later.',
          retryAfter: Math.ceil(Math.max(
            (ipRateLimit.resetTime - Date.now()) / 1000,
            (userRateLimit.resetTime - Date.now()) / 1000
          ))
        }),
      };
    }

    // Verify current password
    const isCurrentPasswordValid = await bcrypt.compare(currentPassword, user.password);
    if (!isCurrentPasswordValid) {
      await recordFailedPasswordChange(user.id, clientIP);
      return {
        statusCode: 400,
        headers: corsHeaders,
        body: JSON.stringify({ error: 'Current password is incorrect' }),
      };
    }

    // Validate new password strength
    const passwordValidation = validatePassword(newPassword);
    if (!passwordValidation.valid) {
      return {
        statusCode: 400,
        headers: corsHeaders,
        body: JSON.stringify({ error: passwordValidation.message }),
      };
    }

    // Check if new password is the same as current password
    const isSamePassword = await bcrypt.compare(newPassword, user.password);
    if (isSamePassword) {
      return {
        statusCode: 400,
        headers: corsHeaders,
        body: JSON.stringify({ error: 'New password must be different from current password' }),
      };
    }

    // Hash new password with increased rounds for security
    const saltRounds = 12;
    const hashedNewPassword = await bcrypt.hash(newPassword, saltRounds);

    // Update user with new password
    const updatedUser = {
      ...user,
      password: hashedNewPassword,
      passwordChangedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    // Save updated user
    await redis.set(`user:${user.id}`, JSON.stringify(updatedUser));

    // Invalidate all existing tokens for this user (force re-login for security)
    await blacklistUserTokens(user.id);

    // Clear password change rate limits on success
    await clearRateLimit(`password-change:ip:${clientIP}`);
    await clearRateLimit(`password-change:user:${user.id}`);

    return {
      statusCode: 200,
      headers: corsHeaders,
      body: JSON.stringify({
        message: 'Password changed successfully. Please log in again with your new password.',
        requireReauth: true
      }),
    };
  } catch (error) {
    console.error('Change password error:', error);
    return {
      statusCode: 500,
      headers: corsHeaders,
      body: JSON.stringify({ error: 'Failed to change password' }),
    };
  }
}

// Helper function to record failed password change attempts
async function recordFailedPasswordChange(userId, clientIP) {
  const ipKey = `password-change:ip:${clientIP}`;
  const userKey = `password-change:user:${userId}`;

  // Increment failure counters
  await redis.incr(ipKey);
  await redis.incr(userKey);

  // Set expiration (15 minutes)
  await redis.expire(ipKey, 900);
  await redis.expire(userKey, 900);
}

// Helper function to blacklist all tokens for a user
async function blacklistUserTokens(userId) {
  try {
    // Get all blacklisted tokens to find user-specific ones
    const allKeys = await redis.keys('token_blacklist:*');
    const userTokenKeys = [];

    for (const key of allKeys) {
      const tokenData = await redis.get(key);
      if (tokenData) {
        try {
          const data = JSON.parse(tokenData);
          if (data.userId === userId) {
            userTokenKeys.push(key);
          }
        } catch (e) {
          // Skip invalid token data
        }
      }
    }

    // For security, we'll set a general blacklist entry for this user
    // This is a simplified approach - in production, you might want a more sophisticated token management
    const blacklistKey = `user_password_changed:${userId}`;
    await redis.set(blacklistKey, new Date().toISOString(), 'EX', 3600); // 1 hour expiry
  } catch (error) {
    console.error('Error blacklisting user tokens:', error);
    // Don't throw - password change should still succeed
  }
}

// Helper function to schedule welcome email via QStash
async function scheduleWelcomeEmail(userId, { email, name }) {
  try {
    // Check if QStash feature is enabled
    const flagsData = await redis.get('feature_flags');
    if (!flagsData) return;

    const flags = typeof flagsData === 'string' ? JSON.parse(flagsData) : flagsData;
    const qstashEnabled = flags.upstash_qstash?.enabled || false;
    
    if (!qstashEnabled) {
      console.log('QStash is disabled, skipping welcome email');
      return;
    }

    // Import QStash client dynamically to avoid loading if not needed
    const { Client } = require('@upstash/qstash');
    const { getWebhookUrl } = require('../platform-utils.cjs');
    const { generateTaskId } = require('../secure-id-utils.cjs');

    const qstashClient = new Client({
      token: process.env.QSTASH_TOKEN,
    });

    const taskId = generateTaskId();
    const webhookUrl = getWebhookUrl('qstash/webhook');

    // Use QStash for all environments
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

    console.log(`Welcome email scheduled for ${email} (Task: ${taskId})`);
    return task;
  } catch (error) {
    console.error('Failed to schedule welcome email:', error);
    throw error;
  }
}
