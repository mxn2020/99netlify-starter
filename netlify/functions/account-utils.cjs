/**
 * Centralized account management utilities for serverless functions
 * Provides common authentication and account context helpers
 */

const { Redis } = require('@upstash/redis');
const jwt = require('jsonwebtoken');
const { parse } = require('cookie');

// Initialize Redis
const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL,
  token: process.env.UPSTASH_REDIS_REST_TOKEN,
});

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';
const AUTH_MODE = process.env.AUTH_MODE || 'cookie'; // 'cookie' or 'bearer'

// Account types and their limits
const ACCOUNT_TYPES = {
  personal: {
    name: 'Personal',
    maxMembers: 1,
    features: ['notes', 'blog'],
  },
  family: {
    name: 'Family',
    maxMembers: 6,
    features: ['notes', 'blog', 'sharing'],
  },
  team: {
    name: 'Team',
    maxMembers: 25,
    features: ['notes', 'blog', 'sharing', 'collaboration'],
  },
  enterprise: {
    name: 'Enterprise',
    maxMembers: -1, // Unlimited
    features: ['notes', 'blog', 'sharing', 'collaboration', 'analytics'],
  },
};

// Member roles and permissions
const MEMBER_ROLES = {
  owner: {
    name: 'Owner',
    permissions: ['all'],
  },
  admin: {
    name: 'Admin',
    permissions: ['manage_members', 'manage_content', 'view_analytics'],
  },
  editor: {
    name: 'Editor',
    permissions: ['manage_content'],
  },
  viewer: {
    name: 'Viewer',
    permissions: ['view_content'],
  },
};

/**
 * Authenticate user from request event
 * Supports both cookie and bearer token authentication modes
 */
async function authenticateUser(event) {
  try {
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

    // Check if token is valid and not just empty or malformed
    if (!token || token.trim() === '' || token === 'null' || token === 'undefined') {
      throw new Error('Invalid token format');
    }

    // Verify JWT token
    const decoded = jwt.verify(token, JWT_SECRET);
    return decoded.sub; // Return user ID
  } catch (error) {
    console.error('JWT verification failed:', error.message);
    throw new Error('Invalid token');
  }
}

/**
 * Get user's current account context
 * Returns account information and user's role within that account
 */
async function getCurrentAccountContext(userId, accountId = null) {
  try {
    // If specific accountId is provided, validate user's access to it
    if (accountId) {
      const membershipData = await redis.get(`account:${accountId}:member:${userId}`);
      if (!membershipData) {
        throw new Error('Access denied to account');
      }
      const membership = typeof membershipData === 'string' ? JSON.parse(membershipData) : membershipData;
      return {
        accountId,
        userId,
        role: membership.role
      };
    }

    // Get user's personal account as default
    const userAccounts = await redis.smembers(`user:${userId}:accounts`);
    if (userAccounts.length === 0) {
      // Auto-create personal account if none exists
      console.log(`Creating personal account for user ${userId}`);
      
      const userData = await redis.get(`user:${userId}`);
      if (!userData) {
        throw new Error('User not found');
      }
      
      const user = typeof userData === 'string' ? JSON.parse(userData) : userData;
      const { generateAccountId } = require('./secure-id-utils.cjs');
      const accountId = generateAccountId();
      const now = new Date().toISOString();

      const personalAccount = {
        id: accountId,
        name: `${user.firstName} ${user.lastName}'s Personal Account`,
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
      
      return {
        accountId,
        userId,
        role: 'owner'
      };
    }

    // Use the first account (personal account) as default
    const defaultAccountId = userAccounts[0];
    const membershipData = await redis.get(`account:${defaultAccountId}:member:${userId}`);
    const membership = typeof membershipData === 'string' ? JSON.parse(membershipData) : membershipData;
    
    return {
      accountId: defaultAccountId,
      userId,
      role: membership.role
    };
  } catch (error) {
    console.error('Error getting account context:', error);
    throw error;
  }
}

/**
 * Check if user has specific permission within an account
 */
async function checkAccountPermission(userId, accountId, requiredPermission) {
  try {
    const membershipData = await redis.get(`account:${accountId}:member:${userId}`);
    if (!membershipData) {
      return false;
    }

    const membership = typeof membershipData === 'string' ? JSON.parse(membershipData) : membershipData;
    const role = MEMBER_ROLES[membership.role];
    
    return role.permissions.includes('all') || role.permissions.includes(requiredPermission);
  } catch (error) {
    console.error('Error checking account permission:', error);
    return false;
  }
}

/**
 * Validate account ownership or admin access
 */
async function validateAccountAccess(userId, accountId, requireAdminOrOwner = false) {
  try {
    const membershipData = await redis.get(`account:${accountId}:member:${userId}`);
    if (!membershipData) {
      throw new Error('Access denied to account');
    }

    const membership = typeof membershipData === 'string' ? JSON.parse(membershipData) : membershipData;
    
    if (requireAdminOrOwner) {
      if (!['owner', 'admin'].includes(membership.role)) {
        throw new Error('Admin or owner access required');
      }
    }

    return {
      accountId,
      userId,
      role: membership.role,
      permissions: MEMBER_ROLES[membership.role].permissions
    };
  } catch (error) {
    console.error('Error validating account access:', error);
    throw error;
  }
}

/**
 * Check if account exists and get account details
 */
async function getAccountDetails(accountId) {
  try {
    const accountData = await redis.get(`account:${accountId}`);
    if (!accountData) {
      throw new Error('Account not found');
    }

    const account = typeof accountData === 'string' ? JSON.parse(accountData) : accountData;
    return {
      ...account,
      typeInfo: ACCOUNT_TYPES[account.type]
    };
  } catch (error) {
    console.error('Error getting account details:', error);
    throw error;
  }
}

/**
 * Check if user can perform action on content based on ownership and account context
 */
async function validateContentAccess(userId, accountId, contentOwnerId = null, requiredPermission = 'view_content') {
  try {
    // Check account access
    const accountAccess = await validateAccountAccess(userId, accountId);
    
    // If user is owner or admin, allow all actions
    if (['owner', 'admin'].includes(accountAccess.role)) {
      return accountAccess;
    }

    // For editors, check if they're accessing their own content or have manage_content permission
    if (accountAccess.role === 'editor') {
      if (requiredPermission === 'manage_content' && (!contentOwnerId || contentOwnerId === userId)) {
        return accountAccess;
      }
      if (requiredPermission === 'view_content') {
        return accountAccess;
      }
    }

    // For viewers, only allow viewing
    if (accountAccess.role === 'viewer' && requiredPermission === 'view_content') {
      return accountAccess;
    }

    throw new Error('Insufficient permissions');
  } catch (error) {
    console.error('Error validating content access:', error);
    throw error;
  }
}

/**
 * Check if a user role has specific permissions for system-level access
 * This is different from account-based permissions and focuses on system roles
 */
function checkPermission(userRole, requiredPermission) {
  // Define system-level permissions for each role
  const systemPermissions = {
    'super-admin': ['super-admin', 'admin', 'user'], // super-admin has all permissions
    'admin': ['admin', 'user'], // regular admin has some permissions 
    'user': ['user'] // regular users have basic permissions
  };

  // Check if the user role has the required permission
  return systemPermissions[userRole]?.includes(requiredPermission) || false;
}

/**
 * Helper to determine if content should be accessible based on account context
 * Handles both new account-based content and legacy user-based content
 */
function hasContentAccess(content, accountContext) {
  const { accountId, userId } = accountContext;
  
  // New account-based content
  if (content.accountId) {
    return content.accountId === accountId;
  }
  
  // Legacy user-based content (backwards compatibility)
  return content.userId === userId;
}

/**
 * Standard error response for authentication failures
 */
function getAuthErrorResponse() {
  return {
    statusCode: 401,
    body: JSON.stringify({ error: 'Authentication required' }),
  };
}

/**
 * Standard error response for permission failures
 */
function getPermissionErrorResponse(message = 'Insufficient permissions') {
  return {
    statusCode: 403,
    body: JSON.stringify({ error: message }),
  };
}

/**
 * Standard error response for account not found
 */
function getAccountNotFoundResponse() {
  return {
    statusCode: 404,
    body: JSON.stringify({ error: 'Account not found' }),
  };
}

/**
 * Handle authentication errors consistently
 */
function handleAuthError(error, corsHeaders = {}) {
  console.error('Authentication error:', error);
  
  if (error.message === 'Authentication required' || error.message === 'Invalid token') {
    return {
      statusCode: 401,
      headers: corsHeaders,
      body: JSON.stringify({ success: false, error: 'Authentication required' }),
    };
  }
  
  if (error.message === 'Insufficient permissions' || error.message === 'Access denied') {
    return {
      statusCode: 403,
      headers: corsHeaders,
      body: JSON.stringify({ success: false, error: 'Access denied' }),
    };
  }
  
  // Generic server error
  return {
    statusCode: 500,
    headers: corsHeaders,
    body: JSON.stringify({ success: false, error: 'Internal server error' }),
  };
}

module.exports = {
  // Core functions
  authenticateUser,
  getCurrentAccountContext,
  checkAccountPermission,
  validateAccountAccess,
  getAccountDetails,
  validateContentAccess,
  hasContentAccess,
  checkPermission,
  
  // Constants
  ACCOUNT_TYPES,
  MEMBER_ROLES,
  
  // Response helpers
  getAuthErrorResponse,
  getPermissionErrorResponse,
  getAccountNotFoundResponse,
  handleAuthError,
  
  // Redis instance for advanced usage
  redis
};
