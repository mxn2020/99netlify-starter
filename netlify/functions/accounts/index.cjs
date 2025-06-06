const { Redis } = require('@upstash/redis');
const jwt = require('jsonwebtoken');
const { parse } = require('cookie');
const { generateAccountId, generateInviteId } = require('../secure-id-utils.cjs');

// Initialize Redis
const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL,
  token: process.env.UPSTASH_REDIS_REST_TOKEN,
});

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';
const AUTH_MODE = process.env.AUTH_MODE || 'cookie';

// CORS headers
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
};

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

// Authentication middleware
async function authenticateUser(event) {
  let token;
  const authHeader = event.headers.authorization || event.headers.Authorization;

  if (AUTH_MODE === 'bearer') {
    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.substring(7);
    }
  } else {
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

  if (!token || token.trim() === '' || token === 'null' || token === 'undefined') {
    throw new Error('Invalid token format');
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    return decoded.sub;
  } catch (error) {
    console.error('JWT verification failed:', error.message);
    throw new Error('Invalid token');
  }
}

// Helper function to check if user has permission
async function checkPermission(userId, accountId, requiredPermission) {
  const membershipData = await redis.get(`account:${accountId}:member:${userId}`);
  if (!membershipData) {
    return false;
  }

  const membership = JSON.parse(membershipData);
  const role = MEMBER_ROLES[membership.role];
  
  return role.permissions.includes('all') || role.permissions.includes(requiredPermission);
}

exports.handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers: corsHeaders,
      body: '',
    };
  }

  try {
    const { httpMethod, path, queryStringParameters } = event;
    const pathParts = path.split('/').filter(Boolean);
    const userId = await authenticateUser(event);

    switch (httpMethod) {
      case 'GET':
        if (pathParts.includes('accounts') && pathParts[pathParts.length - 1] === 'accounts') {
          return await handleGetUserAccounts(userId);
        } else if (pathParts.includes('accounts')) {
          const accountId = pathParts[pathParts.indexOf('accounts') + 1];
          if (pathParts.includes('members')) {
            return await handleGetAccountMembers(accountId, userId);
          } else if (pathParts.includes('invites')) {
            return await handleGetAccountInvites(accountId, userId);
          } else {
            return await handleGetAccount(accountId, userId);
          }
        }
        break;

      case 'POST':
        if (pathParts.includes('accounts')) {
          const accountId = pathParts[pathParts.indexOf('accounts') + 1];
          if (pathParts.includes('invite')) {
            return await handleInviteMember(event, accountId, userId);
          } else if (pathParts.includes('join')) {
            return await handleJoinAccount(event, userId);
          } else if (accountId) {
            return await handleUpdateAccount(event, accountId, userId);
          } else {
            return await handleCreateAccount(event, userId);
          }
        }
        break;

      case 'PUT':
        if (pathParts.includes('accounts')) {
          const accountId = pathParts[pathParts.indexOf('accounts') + 1];
          if (pathParts.includes('members')) {
            const memberId = pathParts[pathParts.indexOf('members') + 1];
            return await handleUpdateMember(event, accountId, memberId, userId);
          } else {
            return await handleUpdateAccount(event, accountId, userId);
          }
        }
        break;

      case 'DELETE':
        if (pathParts.includes('accounts')) {
          const accountId = pathParts[pathParts.indexOf('accounts') + 1];
          if (pathParts.includes('members')) {
            const memberId = pathParts[pathParts.indexOf('members') + 1];
            return await handleRemoveMember(accountId, memberId, userId);
          } else if (pathParts.includes('invites')) {
            const inviteId = pathParts[pathParts.indexOf('invites') + 1];
            return await handleCancelInvite(accountId, inviteId, userId);
          }
        }
        break;
    }

    return {
      statusCode: 404,
      headers: corsHeaders,
      body: JSON.stringify({ error: 'Endpoint not found' }),
    };
  } catch (error) {
    console.error('Accounts function error:', error);

    const isAuthError = error.message === 'No token provided' ||
      error.message === 'Invalid token format' ||
      error.message === 'Invalid token';

    return {
      statusCode: isAuthError ? 401 : 500,
      headers: corsHeaders,
      body: JSON.stringify({ error: error.message || 'Internal server error' }),
    };
  }
};

// Create a new account
async function handleCreateAccount(event, userId) {
  try {
    const requestBody = typeof event.body === 'string' ? JSON.parse(event.body) : event.body;
    const { name, type = 'personal', description = '' } = requestBody;

    if (!name) {
      return {
        statusCode: 400,
        headers: corsHeaders,
        body: JSON.stringify({ error: 'Account name is required' }),
      };
    }

    if (!ACCOUNT_TYPES[type]) {
      return {
        statusCode: 400,
        headers: corsHeaders,
        body: JSON.stringify({ error: 'Invalid account type' }),
      };
    }

    const accountId = generateAccountId();
    const now = new Date().toISOString();

    const account = {
      id: accountId,
      name,
      type,
      description,
      ownerId: userId,
      createdAt: now,
      updatedAt: now,
      settings: {
        allowInvites: true,
        defaultMemberRole: 'viewer',
      },
    };

    // Store account
    await redis.set(`account:${accountId}`, JSON.stringify(account));

    // Add owner as member
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
      statusCode: 201,
      headers: corsHeaders,
      body: JSON.stringify({ account }),
    };
  } catch (error) {
    console.error('Create account error:', error);
    throw error;
  }
}

// Get user's accounts
async function handleGetUserAccounts(userId) {
  try {
    const accountIds = await redis.smembers(`user:${userId}:accounts`);
    
    if (accountIds.length === 0) {
      return {
        statusCode: 200,
        headers: corsHeaders,
        body: JSON.stringify({ accounts: [] }),
      };
    }

    const accountsData = await redis.mget(accountIds.map(id => `account:${id}`));
    const accounts = accountsData
      .filter(data => data !== null)
      .map(data => JSON.parse(data))
      .map(account => ({
        ...account,
        typeInfo: ACCOUNT_TYPES[account.type],
      }));

    // Get user's role in each account
    const accountsWithRoles = await Promise.all(
      accounts.map(async (account) => {
        const membershipData = await redis.get(`account:${account.id}:member:${userId}`);
        const membership = membershipData ? JSON.parse(membershipData) : null;
        
        return {
          ...account,
          userRole: membership ? membership.role : null,
          roleInfo: membership ? MEMBER_ROLES[membership.role] : null,
        };
      })
    );

    return {
      statusCode: 200,
      headers: corsHeaders,
      body: JSON.stringify({ accounts: accountsWithRoles }),
    };
  } catch (error) {
    console.error('Get user accounts error:', error);
    throw error;
  }
}

// Get account details
async function handleGetAccount(accountId, userId) {
  try {
    // Check if user is a member
    const membershipData = await redis.get(`account:${accountId}:member:${userId}`);
    if (!membershipData) {
      return {
        statusCode: 403,
        headers: corsHeaders,
        body: JSON.stringify({ error: 'Access denied' }),
      };
    }

    const accountData = await redis.get(`account:${accountId}`);
    if (!accountData) {
      return {
        statusCode: 404,
        headers: corsHeaders,
        body: JSON.stringify({ error: 'Account not found' }),
      };
    }

    const account = JSON.parse(accountData);
    const membership = JSON.parse(membershipData);

    return {
      statusCode: 200,
      headers: corsHeaders,
      body: JSON.stringify({
        account: {
          ...account,
          typeInfo: ACCOUNT_TYPES[account.type],
          userRole: membership.role,
          roleInfo: MEMBER_ROLES[membership.role],
        },
      }),
    };
  } catch (error) {
    console.error('Get account error:', error);
    throw error;
  }
}

// Get account members
async function handleGetAccountMembers(accountId, userId) {
  try {
    // Check if user is a member
    const membershipData = await redis.get(`account:${accountId}:member:${userId}`);
    if (!membershipData) {
      return {
        statusCode: 403,
        headers: corsHeaders,
        body: JSON.stringify({ error: 'Access denied' }),
      };
    }

    const memberIds = await redis.smembers(`account:${accountId}:members`);
    const membersData = await redis.mget(memberIds.map(id => `account:${accountId}:member:${id}`));
    
    const members = await Promise.all(
      membersData
        .filter(data => data !== null)
        .map(async (data) => {
          const membership = JSON.parse(data);
          const userData = await redis.get(`user:${membership.userId}`);
          const user = userData ? JSON.parse(userData) : null;
          
          return {
            ...membership,
            user: user ? {
              id: user.id,
              email: user.email,
              firstName: user.firstName,
              lastName: user.lastName,
            } : null,
            roleInfo: MEMBER_ROLES[membership.role],
          };
        })
    );

    return {
      statusCode: 200,
      headers: corsHeaders,
      body: JSON.stringify({ members }),
    };
  } catch (error) {
    console.error('Get account members error:', error);
    throw error;
  }
}

// Invite member to account
async function handleInviteMember(event, accountId, userId) {
  try {
    // Check if user can manage members
    if (!(await checkPermission(userId, accountId, 'manage_members'))) {
      return {
        statusCode: 403,
        headers: corsHeaders,
        body: JSON.stringify({ error: 'Permission denied' }),
      };
    }

    const requestBody = typeof event.body === 'string' ? JSON.parse(event.body) : event.body;
    const { email, role = 'viewer' } = requestBody;

    if (!email || !MEMBER_ROLES[role]) {
      return {
        statusCode: 400,
        headers: corsHeaders,
        body: JSON.stringify({ error: 'Valid email and role are required' }),
      };
    }

    // Check account limits
    const accountData = await redis.get(`account:${accountId}`);
    const account = JSON.parse(accountData);
    const typeInfo = ACCOUNT_TYPES[account.type];
    
    if (typeInfo.maxMembers > 0) {
      const memberCount = await redis.scard(`account:${accountId}:members`);
      if (memberCount >= typeInfo.maxMembers) {
        return {
          statusCode: 400,
          headers: corsHeaders,
          body: JSON.stringify({ error: 'Account member limit reached' }),
        };
      }
    }

    const inviteId = generateInviteId();
    const now = new Date().toISOString();

    const invite = {
      id: inviteId,
      accountId,
      email,
      role,
      invitedBy: userId,
      createdAt: now,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days
      status: 'pending',
    };

    await redis.set(`invite:${inviteId}`, JSON.stringify(invite));
    await redis.sadd(`account:${accountId}:invites`, inviteId);
    await redis.set(`invite:email:${email}:account:${accountId}`, inviteId);

    return {
      statusCode: 201,
      headers: corsHeaders,
      body: JSON.stringify({ invite }),
    };
  } catch (error) {
    console.error('Invite member error:', error);
    throw error;
  }
}

// Update member role
async function handleUpdateMember(event, accountId, memberId, userId) {
  try {
    if (!(await checkPermission(userId, accountId, 'manage_members'))) {
      return {
        statusCode: 403,
        headers: corsHeaders,
        body: JSON.stringify({ error: 'Permission denied' }),
      };
    }

    const requestBody = typeof event.body === 'string' ? JSON.parse(event.body) : event.body;
    const { role } = requestBody;

    if (!role || !MEMBER_ROLES[role]) {
      return {
        statusCode: 400,
        headers: corsHeaders,
        body: JSON.stringify({ error: 'Valid role is required' }),
      };
    }

    const membershipData = await redis.get(`account:${accountId}:member:${memberId}`);
    if (!membershipData) {
      return {
        statusCode: 404,
        headers: corsHeaders,
        body: JSON.stringify({ error: 'Member not found' }),
      };
    }

    const membership = JSON.parse(membershipData);
    
    // Prevent changing owner role
    if (membership.role === 'owner') {
      return {
        statusCode: 400,
        headers: corsHeaders,
        body: JSON.stringify({ error: 'Cannot change owner role' }),
      };
    }

    membership.role = role;
    membership.updatedAt = new Date().toISOString();

    await redis.set(`account:${accountId}:member:${memberId}`, JSON.stringify(membership));

    return {
      statusCode: 200,
      headers: corsHeaders,
      body: JSON.stringify({ member: membership }),
    };
  } catch (error) {
    console.error('Update member error:', error);
    throw error;
  }
}

// Remove member from account
async function handleRemoveMember(accountId, memberId, userId) {
  try {
    if (!(await checkPermission(userId, accountId, 'manage_members'))) {
      return {
        statusCode: 403,
        headers: corsHeaders,
        body: JSON.stringify({ error: 'Permission denied' }),
      };
    }

    const membershipData = await redis.get(`account:${accountId}:member:${memberId}`);
    if (!membershipData) {
      return {
        statusCode: 404,
        headers: corsHeaders,
        body: JSON.stringify({ error: 'Member not found' }),
      };
    }

    const membership = JSON.parse(membershipData);
    
    // Prevent removing owner
    if (membership.role === 'owner') {
      return {
        statusCode: 400,
        headers: corsHeaders,
        body: JSON.stringify({ error: 'Cannot remove account owner' }),
      };
    }

    await redis.del(`account:${accountId}:member:${memberId}`);
    await redis.srem(`account:${accountId}:members`, memberId);
    await redis.srem(`user:${memberId}:accounts`, accountId);

    return {
      statusCode: 200,
      headers: corsHeaders,
      body: JSON.stringify({ message: 'Member removed successfully' }),
    };
  } catch (error) {
    console.error('Remove member error:', error);
    throw error;
  }
}
