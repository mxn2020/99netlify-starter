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

// Handle GET requests for blog posts (public access or admin access)
async function handleGetPosts(pathParts, queryParams, event = null) {
  const headers = getCorsHeaders();
  
  try {
    if (pathParts.length === 0) { // GET /blog (list all posts)
      // Check if this is an admin request
      const isAdminRequest = queryParams?.admin === 'true';
      
      if (isAdminRequest) {
        // Admin request requires authentication
        if (!event) {
          return { statusCode: 400, headers, body: JSON.stringify({ success: false, error: 'Missing request context for admin access' }) };
        }
        
        try {
          const userId = await authenticateUser(event);
          
          // Get user to check permissions
          const userData = await redis.get(`user:${userId}`);
          if (!userData) {
            return { statusCode: 403, headers, body: JSON.stringify({ success: false, error: 'User not found' }) };
          }
          
          const user = typeof userData === 'string' ? JSON.parse(userData) : userData;
          
          // Check if user has admin permissions
          if (user.role !== 'super-admin' && user.role !== 'admin') {
            return { statusCode: 403, headers, body: JSON.stringify({ success: false, error: 'Admin access required' }) };
          }
          
          // Admin user - return all posts without filtering
          const postSlugs = await redis.lrange('blog:posts_list', 0, -1);
          if (!postSlugs || postSlugs.length === 0) {
            return { statusCode: 200, headers, body: JSON.stringify({ success: true, data: [] }) };
          }

          const allPosts = await Promise.all(
            postSlugs.map(async slug => {
              const post = await redis.hgetall(`blog:post:${slug}`);
              if (post && post.id) {
                post.tags = parseTags(post.tags);
              }
              return post;
            })
          );

          // Return all posts for admin (no filtering)
          const validPosts = allPosts.filter(p => p && p.id);
          return { statusCode: 200, headers, body: JSON.stringify({ success: true, data: validPosts }) };
          
        } catch (authError) {
          return { statusCode: 401, headers, body: JSON.stringify({ success: false, error: 'Authentication failed' }) };
        }
      }
      
      // Public request - apply public filtering
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

      // Filter to only show posts that should be visible to the public
      const now = new Date();
      console.log('All posts before filtering:', posts.map(p => ({ 
        id: p?.id, 
        title: p?.title, 
        status: p?.status, 
        isPublic: p?.isPublic, 
        isPublicType: typeof p?.isPublic 
      })));
      
      const publicPosts = posts.filter(p => {
        if (!p || !p.id) {
          console.log('Filtered out: no id');
          return false;
        }
        
        // Only show published posts
        if (p.status !== 'published') {
          console.log(`Filtered out ${p.title}: status is ${p.status}, not published`);
          return false;
        }
        
        // Must be marked as public - handle both string and boolean values
        const isPublic = p.isPublic === 'true' || p.isPublic === true;
        if (!isPublic) {
          console.log(`Filtered out ${p.title}: isPublic is ${p.isPublic} (type: ${typeof p.isPublic})`);
          return false;
        }
        
        console.log(`Including post: ${p.title}`);
        return true;
      });

      return { statusCode: 200, headers, body: JSON.stringify({ success: true, data: publicPosts }) };
    } else if (pathParts.length === 1) { // GET /blog/:slug
      const slug = pathParts[0];
      const post = await redis.hgetall(`blog:post:${slug}`);
      
      if (!post || !post.id) {
        return { statusCode: 404, headers, body: JSON.stringify({ success: false, error: 'Post not found' }) };
      }

      // Check if post is accessible for public viewing
      const isPublic = post.isPublic === 'true' || post.isPublic === true;
      if (post.status !== 'published' || !isPublic) {
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

    const { title, content, summary, tags, imageUrl, isPublic = false, status = 'published', scheduledFor } = data;
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

    // Determine the actual publication status
    let actualStatus = status;
    let actualPublishedDate = now;
    let actualIsPublic = isPublic; // Always respect the user's public/private choice

    // If scheduled for future, set status to scheduled
    if (scheduledFor && new Date(scheduledFor) > new Date()) {
      actualStatus = 'scheduled';
      actualPublishedDate = scheduledFor;
      // Keep the user's isPublic preference - it will be used when the post is published
    }
    // Draft and scheduled posts keep their public/private setting for when they become published

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
      publishedDate: actualPublishedDate,
      updatedDate: now,
      tags: JSON.stringify(Array.isArray(tags) ? tags : []),
      imageUrl: imageUrl || '',
      isPublic: actualIsPublic.toString(),
      status: actualStatus,
      ...(scheduledFor && { scheduledFor })
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

    // If this is a scheduled post, create a QStash task to publish it
    if (actualStatus === 'scheduled' && scheduledFor) {
      try {
        await schedulePostPublication(slug, scheduledFor, userId);
        console.log(`Scheduled publication task created for post: ${slug} at ${scheduledFor}`);
      } catch (qstashError) {
        console.error('Failed to schedule post publication:', qstashError);
        // Don't fail the post creation if QStash scheduling fails
      }
    }

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

    const { title, content, summary, tags, imageUrl, isPublic, status, scheduledFor } = data;

    // Handle status and scheduling changes
    let actualStatus = status || existingPost.status || 'published';
    let actualIsPublic = isPublic !== undefined ? isPublic : (existingPost.isPublic === 'true');
    let actualScheduledFor = scheduledFor || existingPost.scheduledFor;

    // If scheduled for future, set status to scheduled
    if (scheduledFor && new Date(scheduledFor) > new Date()) {
      actualStatus = 'scheduled';
      // Keep the user's isPublic preference for scheduled posts
      // The post will respect this setting when published
    }
    // Always respect the user's public/private choice regardless of status

    const updatedPost = {
      ...existingPost,
      ...(title && { title }),
      ...(content && { content }),
      ...(summary !== undefined && { summary }),
      ...(tags && { tags: JSON.stringify(Array.isArray(tags) ? tags : []) }),
      ...(imageUrl !== undefined && { imageUrl }),
      isPublic: actualIsPublic.toString(),
      status: actualStatus,
      ...(actualScheduledFor && { scheduledFor: actualScheduledFor }),
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

    // If this post was updated to scheduled status, create a QStash task to publish it
    if (actualStatus === 'scheduled' && actualScheduledFor && 
        (!existingPost.status || existingPost.status !== 'scheduled' || existingPost.scheduledFor !== actualScheduledFor)) {
      try {
        await schedulePostPublication(slug, actualScheduledFor, userId);
        console.log(`Scheduled publication task created for updated post: ${slug} at ${actualScheduledFor}`);
      } catch (qstashError) {
        console.error('Failed to schedule post publication:', qstashError);
        // Don't fail the post update if QStash scheduling fails
      }
    }

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
      // GET requests - can be public or admin access
      return await handleGetPosts(pathParts, event.queryStringParameters, event);
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

// Helper function to schedule post publication via QStash
async function schedulePostPublication(postSlug, scheduledFor, userId) {
  try {
    // Check if QStash feature is enabled
    const flagsData = await redis.get('feature_flags');
    if (!flagsData) return;

    const flags = typeof flagsData === 'string' ? JSON.parse(flagsData) : flagsData;
    const qstashEnabled = flags.upstash_qstash?.enabled || false;
    
    if (!qstashEnabled) {
      console.log('QStash is disabled, skipping post publication scheduling');
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
        type: 'scheduled_blog_post',
        payload: { postId: postSlug, action: 'publish' },
        userId,
        createdAt: new Date().toISOString()
      }),
      headers: {
        'Content-Type': 'application/json',
        'X-Task-ID': taskId,
        'X-User-ID': userId
      },
      notBefore: new Date(scheduledFor).getTime() / 1000 // QStash expects Unix timestamp
    };

    const qstashResponse = await qstashClient.publishJSON(messageOptions);

    // Store task metadata in Redis
    const task = {
      id: taskId,
      type: 'scheduled_blog_post',
      payload: { postId: postSlug, action: 'publish' },
      scheduledFor,
      status: 'pending',
      retryCount: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      userId,
      qstashMessageId: qstashResponse.messageId
    };

    await redis.set(`task:${taskId}`, JSON.stringify(task));
    await redis.lpush(`user:${userId}:tasks`, taskId);

    console.log(`Created QStash task ${taskId} for blog post ${postSlug} scheduled at ${scheduledFor}`);
    return task;

  } catch (error) {
    console.error('Error scheduling post publication:', error);
    throw error;
  }
}

// Local function to process scheduled blog post publication (legacy - now using QStash directly)
async function processScheduledBlogPostLocal(postSlug) {
  console.log(`Processing scheduled blog post: ${postSlug}, action: publish`);

  // Get the blog post by slug
  let postData = await redis.hgetall(`blog:post:${postSlug}`);

  if (!postData || !postData.id) {
    throw new Error(`Blog post with slug "${postSlug}" not found`);
  }

  // Verify the post can be published
  if (!postData.status || (postData.status !== 'scheduled' && postData.status !== 'draft')) {
    console.log(`Post ${postSlug} has status '${postData.status}', skipping publication`);
    return {
      success: true,
      message: `Blog post ${postSlug} already published or has invalid status`,
      postId: postSlug,
      timestamp: new Date().toISOString()
    };
  }

  // Update post status to published and respect the original isPublic setting
  const updates = {
    status: 'published',
    publishedDate: new Date().toISOString(),
    updatedDate: new Date().toISOString()
  };
  
  // Preserve the user's original isPublic preference
  console.log(`Publishing post ${postSlug} with isPublic: ${postData.isPublic}`);
  
  // Remove scheduledFor field since it's now published
  if (postData.scheduledFor) {
    await redis.hdel(`blog:post:${postSlug}`, 'scheduledFor');
  }
  
  // Apply updates
  for (const [key, value] of Object.entries(updates)) {
    await redis.hset(`blog:post:${postSlug}`, key, value);
  }
  
  console.log(`Blog post ${postSlug} (ID: ${postData.id}) published successfully with isPublic: ${postData.isPublic}`);

  return {
    success: true,
    message: `Blog post ${postSlug} published successfully`,
    postId: postSlug,
    timestamp: new Date().toISOString()
  };
}
