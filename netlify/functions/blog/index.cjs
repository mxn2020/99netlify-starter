const { Redis } = require('@upstash/redis');
const { getCorsHeaders } = require('../platform-utils.cjs');
const { generateBlogPostId } = require('../secure-id-utils.cjs');
const { 
  authenticateUser, 
  getCurrentAccountContext, 
  checkPermission,
  handleAuthError 
} = require('../account-utils.cjs');

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL,
  token: process.env.UPSTASH_REDIS_REST_TOKEN,
});

// Helper to create a slug
const slugify = (text) => text.toString().toLowerCase()
  .replace(/\s+/g, '-')        // Replace spaces with -
  .replace(/[^\w-]+/g, '')     // Remove all non-word chars
  .replace(/--+/g, '-')        // Replace multiple - with single -
  .replace(/^-+/, '')          // Trim - from start of text
  .replace(/-+$/, '');         // Trim - from end of text

// Helper to parse tags consistently
const parseTags = (tags) => {
  if (typeof tags === 'string') {
    try {
      return JSON.parse(tags);
    } catch {
      return [];
    }
  } else if (Array.isArray(tags)) {
    return tags;
  } else {
    return [];
  }
};

// Handle GET requests for blog posts (public access)
async function handleGetPosts(pathParts, queryParams) {
  const headers = getCorsHeaders();
  
  try {
    if (pathParts.length === 0) { // GET /blog (list all posts)
      // Get posts from both account-based and legacy structures
      const postSlugs = await redis.lrange('blog:posts_list', 0, -1);
      if (!postSlugs || postSlugs.length === 0) {
        return { statusCode: 200, headers, body: JSON.stringify({ success: true, data: [] }) };
      }

      const posts = await Promise.all(
        postSlugs.map(async slug => {
          const post = await redis.hgetall(`blog:post:${slug}`);
          if (post && post.id) {
            post.tags = parseTags(post.tags);
          }
          return post;
        })
      );

      // Filter to only show public posts for unauthenticated requests
      const publicPosts = posts.filter(p => p && p.id && (p.isPublic !== 'false'));

      return { statusCode: 200, headers, body: JSON.stringify({ success: true, data: publicPosts }) };
    } else if (pathParts.length === 1) { // GET /blog/:slug
      const slug = pathParts[0];
      const post = await redis.hgetall(`blog:post:${slug}`);
      
      if (!post || !post.id) {
        return { statusCode: 404, headers, body: JSON.stringify({ success: false, error: 'Post not found' }) };
      }

      // Check if post is public for unauthenticated access
      if (post.isPublic === 'false') {
        return { statusCode: 403, headers, body: JSON.stringify({ success: false, error: 'Access denied' }) };
      }

      post.tags = parseTags(post.tags);
      return { statusCode: 200, headers, body: JSON.stringify({ success: true, data: post }) };
    }

    return { statusCode: 404, headers, body: JSON.stringify({ success: false, error: 'Route not found' }) };
  } catch (error) {
    console.error('Get posts error:', error);
    return { statusCode: 500, headers, body: JSON.stringify({ success: false, error: 'Internal server error' }) };
  }
}

// Handle creating blog posts
async function handleCreatePost(event, accountContext) {
  const headers = getCorsHeaders();
  const { accountId, userId, role } = accountContext;

  try {
    // Check if user has permission to create content in this account
    if (role === 'viewer') {
      return { 
        statusCode: 403, 
        headers, 
        body: JSON.stringify({ success: false, error: 'Insufficient permissions to create content' }) 
      };
    }

    let data;
    try {
      data = typeof event.body === 'string' ? JSON.parse(event.body) : event.body;
    } catch (error) {
      return { statusCode: 400, headers, body: JSON.stringify({ success: false, error: 'Invalid JSON' }) };
    }

    const { title, content, summary, tags, imageUrl, isPublic = false } = data;
    if (!title || !content) {
      return { 
        statusCode: 400, 
        headers, 
        body: JSON.stringify({ success: false, error: 'Title and content are required' }) 
      };
    }

    const slug = slugify(title);
    const id = generateBlogPostId();
    const now = new Date().toISOString();

    const post = {
      id,
      slug,
      title,
      content,
      summary: summary || '',
      accountId, // Link to account
      userId, // Creator attribution
      createdBy: userId,
      author: '', // Will be populated from user data
      publishedDate: now,
      updatedDate: now,
      tags: JSON.stringify(Array.isArray(tags) ? tags : []),
      imageUrl: imageUrl || '',
      isPublic: isPublic.toString()
    };

    // Get user info for author field
    const userData = await redis.get(`user:${userId}`);
    if (userData) {
      const user = typeof userData === 'string' ? JSON.parse(userData) : userData;
      post.author = user.email || user.name || 'Anonymous';
    }

    // Check if slug already exists
    const existingPost = await redis.hgetall(`blog:post:${slug}`);
    if (existingPost && existingPost.id) {
      return { 
        statusCode: 409, 
        headers, 
        body: JSON.stringify({ success: false, error: 'A post with this title already exists' }) 
      };
    }

    // Store post
    await redis.hset(`blog:post:${slug}`, post);
    
    // Add to account's posts list (new structure)
    await redis.lpush(`account:${accountId}:blog:posts`, slug);
    
    // Also add to global posts list for backwards compatibility and public access
    await redis.lpush('blog:posts_list', slug);

    // Parse tags back for response
    const responsePost = { ...post, tags: parseTags(post.tags) };
    return { 
      statusCode: 201, 
      headers, 
      body: JSON.stringify({ 
        success: true, 
        data: responsePost,
        accountContext: { accountId, role }
      }) 
    };
  } catch (error) {
    console.error('Create post error:', error);
    return { statusCode: 500, headers, body: JSON.stringify({ success: false, error: 'Internal server error' }) };
  }
}

// Handle updating blog posts
async function handleUpdatePost(event, slug, accountContext) {
  const headers = getCorsHeaders();
  const { accountId, userId, role } = accountContext;

  try {
    const existingPost = await redis.hgetall(`blog:post:${slug}`);
    if (!existingPost || !existingPost.id) {
      return { statusCode: 404, headers, body: JSON.stringify({ success: false, error: 'Post not found' }) };
    }

    // Verify account access - check both new account-based and legacy user-based ownership
    const hasAccess = existingPost.accountId === accountId || (existingPost.userId === userId && !existingPost.accountId);
    if (!hasAccess) {
      return { 
        statusCode: 403, 
        headers, 
        body: JSON.stringify({ success: false, error: 'Access denied' }) 
      };
    }

    // Check if user has permission to edit content in this account
    if (role === 'viewer') {
      return { 
        statusCode: 403, 
        headers, 
        body: JSON.stringify({ success: false, error: 'Insufficient permissions to edit content' }) 
      };
    }

    let data;
    try {
      data = typeof event.body === 'string' ? JSON.parse(event.body) : event.body;
    } catch (error) {
      return { statusCode: 400, headers, body: JSON.stringify({ success: false, error: 'Invalid JSON' }) };
    }

    const { title, content, summary, tags, imageUrl, isPublic } = data;

    const updatedPost = {
      ...existingPost,
      ...(title && { title }),
      ...(content && { content }),
      ...(summary !== undefined && { summary }),
      ...(tags && { tags: JSON.stringify(Array.isArray(tags) ? tags : []) }),
      ...(imageUrl !== undefined && { imageUrl }),
      ...(isPublic !== undefined && { isPublic: isPublic.toString() }),
      accountId: existingPost.accountId || accountId, // Preserve or set accountId
      updatedBy: userId, // Track who updated it
      updatedDate: new Date().toISOString()
    };

    // If title changed, update slug
    if (title && title !== existingPost.title) {
      const newSlug = slugify(title);
      if (newSlug !== slug) {
        // Check if new slug already exists
        const conflictPost = await redis.hgetall(`blog:post:${newSlug}`);
        if (conflictPost && conflictPost.id) {
          return { 
            statusCode: 409, 
            headers, 
            body: JSON.stringify({ success: false, error: 'A post with this title already exists' }) 
          };
        }

        // Move to new slug
        updatedPost.slug = newSlug;
        await redis.hset(`blog:post:${newSlug}`, updatedPost);
        await redis.del(`blog:post:${slug}`);

        // Update posts lists
        await redis.lrem('blog:posts_list', 1, slug);
        await redis.lpush('blog:posts_list', newSlug);
        await redis.lrem(`account:${accountId}:blog:posts`, 1, slug);
        await redis.lpush(`account:${accountId}:blog:posts`, newSlug);

        // Parse tags back for response
        const responsePost = { ...updatedPost, tags: parseTags(updatedPost.tags) };
        return { 
          statusCode: 200, 
          headers, 
          body: JSON.stringify({ 
            success: true, 
            data: responsePost,
            accountContext: { accountId, role }
          }) 
        };
      }
    }

    await redis.hset(`blog:post:${slug}`, updatedPost);

    // Parse tags back for response
    const responsePost = { ...updatedPost, tags: parseTags(updatedPost.tags) };
    return { 
      statusCode: 200, 
      headers, 
      body: JSON.stringify({ 
        success: true, 
        data: responsePost,
        accountContext: { accountId, role }
      }) 
    };
  } catch (error) {
    console.error('Update post error:', error);
    return { statusCode: 500, headers, body: JSON.stringify({ success: false, error: 'Internal server error' }) };
  }
}

// Handle deleting blog posts
async function handleDeletePost(slug, accountContext) {
  const headers = getCorsHeaders();
  const { accountId, userId, role } = accountContext;

  try {
    const existingPost = await redis.hgetall(`blog:post:${slug}`);
    if (!existingPost || !existingPost.id) {
      return { statusCode: 404, headers, body: JSON.stringify({ success: false, error: 'Post not found' }) };
    }

    // Verify account access - check both new account-based and legacy user-based ownership
    const hasAccess = existingPost.accountId === accountId || (existingPost.userId === userId && !existingPost.accountId);
    if (!hasAccess) {
      return { 
        statusCode: 403, 
        headers, 
        body: JSON.stringify({ success: false, error: 'Access denied' }) 
      };
    }

    // Check if user has delete permissions
    if (role === 'viewer' || (role === 'editor' && existingPost.createdBy !== userId && existingPost.userId !== userId)) {
      return { 
        statusCode: 403, 
        headers, 
        body: JSON.stringify({ success: false, error: 'Insufficient permissions to delete content' }) 
      };
    }

    // Delete post and remove from all lists
    await redis.del(`blog:post:${slug}`);
    await redis.lrem('blog:posts_list', 1, slug);
    await redis.lrem(`account:${accountId}:blog:posts`, 1, slug);

    return { 
      statusCode: 200, 
      headers, 
      body: JSON.stringify({ 
        success: true, 
        message: 'Post deleted successfully',
        accountContext: { accountId, role }
      }) 
    };
  } catch (error) {
    console.error('Delete post error:', error);
    return { statusCode: 500, headers, body: JSON.stringify({ success: false, error: 'Internal server error' }) };
  }
}

// Seed some initial blog posts if they don't exist (for template demonstration)
const seedBlogPosts = async () => {
  const postExists = await redis.exists('blog:post:hello-ai-world');
  if (!postExists) {
    const posts = [
      {
        id: 'hello-ai-world',
        slug: 'hello-ai-world',
        title: 'Hello AI World: A New Beginning',
        author: 'AI Template Bot',
        publishedDate: new Date('2025-06-01T10:00:00Z').toISOString(),
        summary: 'Welcome to your new AI-enhanced application template, ready to be customized!',
        content: '# Welcome to Your New App!\n\nThis is a sample blog post. You can store your posts in **Markdown** format in Upstash Redis.\n\n## Features\n\n* Netlify Functions\n* Upstash Redis\n* React Frontend\n\nStart building something amazing!',
        tags: JSON.stringify(['welcome', 'ai', 'template']),
        imageUrl: 'https://images.unsplash.com/photo-1620712943543-bcc4688e7485?ixlib=rb-1.2.1&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1000&q=80',
        isPublic: 'true'
      },
      {
        id: 'getting-started-with-redis',
        slug: 'getting-started-with-redis',
        title: 'Using Upstash Redis with Netlify Functions',
        author: 'AI Template Bot',
        publishedDate: new Date('2025-06-02T12:00:00Z').toISOString(),
        summary: 'A quick guide on how this template uses Upstash Redis for data persistence.',
        content: '## Upstash Redis Integration\n\nThis template demonstrates storing blog posts, notes, and user data in Upstash Redis. \n\nEach blog post is stored as a HASH with its content and metadata. A sorted set `blog:posts:by_date` can be used to fetch posts chronologically.',
        tags: JSON.stringify(['redis', 'netlify', 'tutorial']),
        isPublic: 'true'
      }
    ];

    const pipeline = redis.pipeline();
    for (const post of posts) {
      pipeline.hset(`blog:post:${post.slug}`, post);
      pipeline.lpush('blog:posts_list', post.slug);
    }
    await pipeline.exec();
    console.log('Seeded blog posts.');
  }
};

exports.handler = async (event, context) => {
  const headers = getCorsHeaders();

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 204, headers, body: '' };
  }

  if (!redis) {
    return { statusCode: 500, headers, body: JSON.stringify({ success: false, error: 'Redis not available' }) };
  }

  // Handle both direct function calls and API redirects
  let pathForParsing = event.path;
  if (pathForParsing.startsWith('/.netlify/functions/blog')) {
    pathForParsing = pathForParsing.replace('/.netlify/functions/blog', '');
  } else if (pathForParsing.startsWith('/api/blog')) {
    pathForParsing = pathForParsing.replace('/api/blog', '');
  }
  const pathParts = pathForParsing.split('/').filter(Boolean);

  try {
    if (event.httpMethod === 'GET') {
      // Public GET requests - can access public posts without authentication
      return await handleGetPosts(pathParts, event.queryStringParameters);
    }

    // Authentication required for all non-GET operations
    const userId = await authenticateUser(event);
    
    // Get account context (from query param or use default personal account)
    const requestedAccountId = event.queryStringParameters?.accountId;
    const accountContext = await getCurrentAccountContext(userId, requestedAccountId);

    if (event.httpMethod === 'POST') {
      return await handleCreatePost(event, accountContext);
    }

    if (event.httpMethod === 'PUT') {
      if (pathParts.length !== 1) {
        return { statusCode: 400, headers, body: JSON.stringify({ success: false, error: 'Post slug required' }) };
      }
      return await handleUpdatePost(event, pathParts[0], accountContext);
    }

    if (event.httpMethod === 'DELETE') {
      if (pathParts.length !== 1) {
        return { statusCode: 400, headers, body: JSON.stringify({ success: false, error: 'Post slug required' }) };
      }
      return await handleDeletePost(pathParts[0], accountContext);
    }

    return { statusCode: 404, headers, body: JSON.stringify({ success: false, error: 'Route not found' }) };
  } catch (error) {
    console.error('Blog function error:', error);

    // Handle different types of authentication errors
    const isAuthError = error.message === 'No token provided' ||
      error.message === 'Invalid token format' ||
      error.message === 'Invalid token' ||
      error.message === 'Access denied to account' ||
      error.message === 'No accounts found for user' ||
      error.name === 'JsonWebTokenError' ||
      error.name === 'TokenExpiredError' ||
      error.name === 'NotBeforeError';

    return { 
      statusCode: isAuthError ? 401 : 500, 
      headers, 
      body: JSON.stringify({ success: false, error: error.message || 'Internal server error' }) 
    };
  }
};
