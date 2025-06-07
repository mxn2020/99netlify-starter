// netlify/functions/feature-flags/index.cjs
const { Redis } = require('@upstash/redis');
const { 
  authenticateUser, 
  getCurrentAccountContext, 
  checkPermission,
  handleAuthError 
} = require('../account-utils.cjs');

// Initialize Redis
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

// Default feature flags
const DEFAULT_FEATURE_FLAGS = [
  {
    id: 'upstash_qstash',
    name: 'Upstash QStash Task Queue',
    description: 'Asynchronous task processing with Upstash QStash for welcome emails, scheduled blog posts, and background jobs',
    enabled: true,
    category: 'integration',
    status: 'active',
    adminOnly: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 'upstash_vector_search',
    name: 'Upstash Vector (AI-Powered Search)',
    description: 'Semantic search for notes using AI-generated vector embeddings. Search with natural language questions.',
    enabled: false,
    category: 'ai',
    status: 'shipping_soon',
    adminOnly: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 'upstash_workflow',
    name: 'Upstash Workflow (Durable Orchestration)',
    description: 'Multi-step user onboarding workflows with state management and retry handling',
    enabled: false,
    category: 'integration',
    status: 'shipping_soon',
    adminOnly: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 'upstash_search',
    name: 'Upstash Search (Full-Text Search)',
    description: 'Fast, typo-tolerant full-text search across blog posts and notes with instant results',
    enabled: false,
    category: 'core',
    status: 'shipping_soon',
    adminOnly: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 'netlify_identity',
    name: 'Netlify Identity Integration',
    description: 'Social logins (Google, GitHub) and secure password recovery flows with managed user database',
    enabled: false,
    category: 'integration',
    status: 'shipping_soon',
    adminOnly: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 'netlify_blobs',
    name: 'Netlify Blobs Image Uploads',
    description: 'File upload handling for user avatars and blog post images via Netlify Blobs',
    enabled: false,
    category: 'integration',
    status: 'shipping_soon',
    adminOnly: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 'sentry_monitoring',
    name: 'Sentry Error & Performance Monitoring',
    description: 'Production-grade error tracking and performance monitoring with Web Vitals',
    enabled: false,
    category: 'core',
    status: 'shipping_soon',
    adminOnly: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 'web3_token_gating',
    name: 'Web3 Token-Gated Content',
    description: 'Premium content access requiring specific NFTs or token holdings via Nodely.io',
    enabled: false,
    category: 'experimental',
    status: 'shipping_soon',
    adminOnly: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 'elevenlabs_tts',
    name: 'ElevenLabs Text-to-Speech',
    description: 'AI voice generation for article narration and audio notes with voice selection',
    enabled: false,
    category: 'ai',
    status: 'shipping_soon',
    adminOnly: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 'tavus_personalized_video',
    name: 'Tavus Personalized Video',
    description: 'AI-generated personalized welcome videos and milestone celebrations',
    enabled: false,
    category: 'ai',
    status: 'shipping_soon',
    adminOnly: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 'advanced_analytics',
    name: 'Advanced Analytics Dashboard',
    description: 'Detailed usage analytics and user behavior insights for administrators',
    enabled: false,
    category: 'core',
    status: 'shipping_soon',
    adminOnly: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 'api_rate_limiting',
    name: 'Advanced API Rate Limiting',
    description: 'Configurable rate limiting per user role and endpoint with burst allowances',
    enabled: false,
    category: 'core',
    status: 'shipping_soon',
    adminOnly: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 'bearer_token_auth',
    name: 'Bearer Token Authentication',
    description: 'Use Bearer tokens in Authorization headers instead of HTTP-only cookies for authentication. Provides more flexibility for API integrations.',
    enabled: false,
    category: 'core',
    status: 'active',
    adminOnly: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }
];

// Initialize feature flags if they don't exist
async function initializeFeatureFlags() {
  const existingFlags = await redis.get('feature_flags');
  if (!existingFlags) {
    const flagsMap = {};
    DEFAULT_FEATURE_FLAGS.forEach(flag => {
      flagsMap[flag.id] = flag;
    });
    await redis.set('feature_flags', JSON.stringify(flagsMap));
    console.log('Feature flags initialized');
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
    // Initialize feature flags on first request
    await initializeFeatureFlags();

    const { httpMethod, path } = event;
    const pathParts = path.split('/').filter(Boolean);
    const flagId = pathParts[pathParts.length - 1];

    // Public endpoint to get feature flags (filtered by user role)
    if (httpMethod === 'GET' && (flagId === 'feature-flags' || !flagId)) {
      return await handleGetFeatureFlags(event);
    }

    // Admin-only endpoints
    const userId = await authenticateUser(event);
    const accountContext = await getCurrentAccountContext(userId);
    
    if (!checkPermission(accountContext.role, 'super-admin')) {
      return {
        statusCode: 403,
        headers: corsHeaders,
        body: JSON.stringify({ error: 'Super admin access required' }),
      };
    }

    switch (httpMethod) {
      case 'PUT':
        if (flagId && flagId !== 'feature-flags') {
          return await handleUpdateFeatureFlag(flagId, event);
        }
        break;
      case 'POST':
        if (flagId === 'reset') {
          return await handleResetFeatureFlags();
        }
        break;
    }

    return {
      statusCode: 404,
      headers: corsHeaders,
      body: JSON.stringify({ error: 'Endpoint not found' }),
    };
  } catch (error) {
    console.error('Feature flags function error:', error);
    return handleAuthError(error, corsHeaders);
  }
};

async function handleGetFeatureFlags(event) {
  try {
    let userRole = 'user';

    // Try to get user role if authenticated
    try {
      const userId = await authenticateUser(event);
      const accountContext = await getCurrentAccountContext(userId);
      // For feature flags, we check if user has admin permissions in their account
      userRole = checkPermission(accountContext.role, 'super-admin') ? 'super-admin' : 'user';
    } catch (error) {
      // Not authenticated, use default 'user' role
    }

    const flagsData = await redis.get('feature_flags');
    let flags = {};

    if (flagsData) {
      flags = typeof flagsData === 'string' ? JSON.parse(flagsData) : flagsData;
    }

    // Filter flags based on user role
    const filteredFlags = Object.values(flags).filter(flag => {
      // Super-admin users see all flags
      if (userRole === 'super-admin') return true;
      // Regular users only see non-admin flags
      return !flag.adminOnly;
    });

    return {
      statusCode: 200,
      headers: corsHeaders,
      body: JSON.stringify({
        success: true,
        data: filteredFlags,
        userRole
      }),
    };
  } catch (error) {
    console.error('Get feature flags error:', error);
    throw error;
  }
}

async function handleUpdateFeatureFlag(flagId, event) {
  try {
    const updates = typeof event.body === 'string' ? JSON.parse(event.body) : event.body;

    const flagsData = await redis.get('feature_flags');
    let flags = {};

    if (flagsData) {
      flags = typeof flagsData === 'string' ? JSON.parse(flagsData) : flagsData;
    }

    if (!flags[flagId]) {
      return {
        statusCode: 404,
        headers: corsHeaders,
        body: JSON.stringify({ error: 'Feature flag not found' }),
      };
    }

    // Update the flag
    flags[flagId] = {
      ...flags[flagId],
      ...updates,
      updatedAt: new Date().toISOString()
    };

    await redis.set('feature_flags', JSON.stringify(flags));

    return {
      statusCode: 200,
      headers: corsHeaders,
      body: JSON.stringify({
        success: true,
        data: flags[flagId]
      }),
    };
  } catch (error) {
    console.error('Update feature flag error:', error);
    throw error;
  }
}

async function handleResetFeatureFlags() {
  try {
    const flagsMap = {};
    DEFAULT_FEATURE_FLAGS.forEach(flag => {
      flagsMap[flag.id] = {
        ...flag,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
    });

    await redis.set('feature_flags', JSON.stringify(flagsMap));

    return {
      statusCode: 200,
      headers: corsHeaders,
      body: JSON.stringify({
        success: true,
        message: 'Feature flags reset to defaults',
        data: Object.values(flagsMap)
      }),
    };
  } catch (error) {
    console.error('Reset feature flags error:', error);
    throw error;
  }
}