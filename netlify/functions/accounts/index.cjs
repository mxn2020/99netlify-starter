const { Redis } = require('@upstash/redis');
const { generateAccountId, generateInviteId } = require('../secure-id-utils.cjs');
const { 
  authenticateUser, 
  getCurrentAccountContext, 
  checkAccountPermission,
  handleAuthError 
} = require('../account-utils.cjs');

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL,
  token: process.env.UPSTASH_REDIS_REST_TOKEN,
});

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
      body: JSON.stringify({ success: false, error: 'Endpoint not found' }),
    };
  } catch (error) {
    console.error('Accounts function error:', error);
    return handleAuthError(error, corsHeaders);
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
        body: JSON.stringify({ success: false, error: 'Account name is required' }),
      };
    }

    if (!ACCOUNT_TYPES[type]) {
      return {
        statusCode: 400,
        headers: corsHeaders,
        body: JSON.stringify({ success: false, error: 'Invalid account type' }),
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
      body: JSON.stringify({ success: true, account }),
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
    
    if (accountIds.length === 0) {    return {
      statusCode: 200,
      headers: corsHeaders,
      body: JSON.stringify({ success: true, accounts: [] }),
    };
    }

    const accountsData = await redis.mget(accountIds.map(id => `account:${id}`));
    const accounts = accountsData
      .filter(data => data !== null)
      .map(data => typeof data === 'string' ? JSON.parse(data) : data)
      .map(account => ({
        ...account,
        typeInfo: ACCOUNT_TYPES[account.type],
      }));

    // Get user's role in each account
    const accountsWithRoles = await Promise.all(
      accounts.map(async (account) => {
        const membershipData = await redis.get(`account:${account.id}:member:${userId}`);
        const membership = membershipData ? (typeof membershipData === 'string' ? JSON.parse(membershipData) : membershipData) : null;
        
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
      body: JSON.stringify({ success: true, accounts: accountsWithRoles }),
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

    const account = typeof accountData === 'string' ? JSON.parse(accountData) : accountData;
    const membership = typeof membershipData === 'string' ? JSON.parse(membershipData) : membershipData;

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
          const membership = typeof data === 'string' ? JSON.parse(data) : data;
          const userData = await redis.get(`user:${membership.userId}`);
          const user = userData ? (typeof userData === 'string' ? JSON.parse(userData) : userData) : null;
          
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
      body: JSON.stringify({ success: true, members }),
    };
  } catch (error) {
    console.error('Get account members error:', error);
    throw error;
  }
}

// Get account invites
async function handleGetAccountInvites(accountId, userId) {
  try {
    // Check if user is a member with permission to view invites
    if (!(await checkAccountPermission(userId, accountId, 'manage_members'))) {
      return {
        statusCode: 403,
        headers: corsHeaders,
        body: JSON.stringify({ success: false, error: 'Permission denied' }),
      };
    }

    const inviteIds = await redis.smembers(`account:${accountId}:invites`);
    
    if (inviteIds.length === 0) {
      return {
        statusCode: 200,
        headers: corsHeaders,
        body: JSON.stringify({ success: true, invites: [] }),
      };
    }

    const invitesData = await redis.mget(inviteIds.map(id => `invite:${id}`));
    
    const invites = invitesData
      .filter(data => data !== null)
      .map(data => typeof data === 'string' ? JSON.parse(data) : data)
      .filter(invite => invite.status === 'pending' && new Date(invite.expiresAt) > new Date());

    return {
      statusCode: 200,
      headers: corsHeaders,
      body: JSON.stringify({ success: true, invites }),
    };
  } catch (error) {
    console.error('Get account invites error:', error);
    throw error;
  }
}

// Join account via invite
async function handleJoinAccount(event, userId) {
  try {
    const requestBody = typeof event.body === 'string' ? JSON.parse(event.body) : event.body;
    const { inviteId } = requestBody;

    if (!inviteId) {
      return {
        statusCode: 400,
        headers: corsHeaders,
        body: JSON.stringify({ success: false, error: 'Invite ID is required' }),
      };
    }

    const inviteData = await redis.get(`invite:${inviteId}`);
    if (!inviteData) {
      return {
        statusCode: 404,
        headers: corsHeaders,
        body: JSON.stringify({ success: false, error: 'Invite not found' }),
      };
    }

    const invite = typeof inviteData === 'string' ? JSON.parse(inviteData) : inviteData;
    
    // Check if invite is still valid
    if (invite.status !== 'pending' || new Date(invite.expiresAt) < new Date()) {
      return {
        statusCode: 400,
        headers: corsHeaders,
        body: JSON.stringify({ success: false, error: 'Invite has expired or is no longer valid' }),
      };
    }

    // Get user email to verify invite
    const userData = await redis.get(`user:${userId}`);
    if (!userData) {
      return {
        statusCode: 400,
        headers: corsHeaders,
        body: JSON.stringify({ success: false, error: 'User not found' }),
      };
    }

    const user = typeof userData === 'string' ? JSON.parse(userData) : userData;
    if (user.email !== invite.email) {
      return {
        statusCode: 400,
        headers: corsHeaders,
        body: JSON.stringify({ success: false, error: 'Invite email does not match user email' }),
      };
    }

    // Check if user is already a member
    const existingMembership = await redis.get(`account:${invite.accountId}:member:${userId}`);
    if (existingMembership) {
      return {
        statusCode: 400,
        headers: corsHeaders,
        body: JSON.stringify({ success: false, error: 'User is already a member of this account' }),
      };
    }

    const now = new Date().toISOString();

    // Create membership
    const membership = {
      userId,
      accountId: invite.accountId,
      role: invite.role,
      joinedAt: now,
      invitedBy: invite.invitedBy,
    };

    await redis.set(`account:${invite.accountId}:member:${userId}`, JSON.stringify(membership));
    await redis.sadd(`account:${invite.accountId}:members`, userId);
    await redis.sadd(`user:${userId}:accounts`, invite.accountId);

    // Mark invite as accepted
    invite.status = 'accepted';
    invite.acceptedAt = now;
    invite.acceptedBy = userId;
    await redis.set(`invite:${inviteId}`, JSON.stringify(invite));

    return {
      statusCode: 200,
      headers: corsHeaders,
      body: JSON.stringify({ success: true, membership }),
    };
  } catch (error) {
    console.error('Join account error:', error);
    throw error;
  }
}

// Update account details
async function handleUpdateAccount(event, accountId, userId) {
  try {
    // Check if user is owner or has admin permissions
    if (!(await checkAccountPermission(userId, accountId, 'manage_content'))) {
      return {
        statusCode: 403,
        headers: corsHeaders,
        body: JSON.stringify({ success: false, error: 'Permission denied' }),
      };
    }

    const requestBody = typeof event.body === 'string' ? JSON.parse(event.body) : event.body;
    const { name, description, settings } = requestBody;

    const accountData = await redis.get(`account:${accountId}`);
    if (!accountData) {
      return {
        statusCode: 404,
        headers: corsHeaders,
        body: JSON.stringify({ success: false, error: 'Account not found' }),
      };
    }

    const account = typeof accountData === 'string' ? JSON.parse(accountData) : accountData;
    
    // Update account fields
    if (name) account.name = name;
    if (description !== undefined) account.description = description;
    if (settings) account.settings = { ...account.settings, ...settings };
    account.updatedAt = new Date().toISOString();

    await redis.set(`account:${accountId}`, JSON.stringify(account));

    return {
      statusCode: 200,
      headers: corsHeaders,
      body: JSON.stringify({ success: true, account }),
    };
  } catch (error) {
    console.error('Update account error:', error);
    throw error;
  }
}

// Cancel invite
async function handleCancelInvite(accountId, inviteId, userId) {
  try {
    // Check if user can manage members
    if (!(await checkAccountPermission(userId, accountId, 'manage_members'))) {
      return {
        statusCode: 403,
        headers: corsHeaders,
        body: JSON.stringify({ success: false, error: 'Permission denied' }),
      };
    }

    const inviteData = await redis.get(`invite:${inviteId}`);
    if (!inviteData) {
      return {
        statusCode: 404,
        headers: corsHeaders,
        body: JSON.stringify({ success: false, error: 'Invite not found' }),
      };
    }

    const invite = typeof inviteData === 'string' ? JSON.parse(inviteData) : inviteData;
    
    // Verify invite belongs to the account
    if (invite.accountId !== accountId) {
      return {
        statusCode: 400,
        headers: corsHeaders,
        body: JSON.stringify({ success: false, error: 'Invite does not belong to this account' }),
      };
    }

    // Mark invite as cancelled
    invite.status = 'cancelled';
    invite.cancelledAt = new Date().toISOString();
    invite.cancelledBy = userId;
    await redis.set(`invite:${inviteId}`, JSON.stringify(invite));

    // Remove from account invites
    await redis.srem(`account:${accountId}:invites`, inviteId);
    await redis.del(`invite:email:${invite.email}:account:${accountId}`);

    return {
      statusCode: 200,
      headers: corsHeaders,
      body: JSON.stringify({ success: true, message: 'Invite cancelled successfully' }),
    };
  } catch (error) {
    console.error('Cancel invite error:', error);
    throw error;
  }
}
