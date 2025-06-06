const { Redis } = require('@upstash/redis');
const jwt = require('jsonwebtoken');
const { parse } = require('cookie');
const { getCorsHeaders } = require('../platform-utils.cjs');

const AUTH_MODE = process.env.AUTH_MODE || 'cookie'; // 'cookie' or 'bearer'

let redis;
try {
  if (!process.env.UPSTASH_REDIS_REST_URL || !process.env.UPSTASH_REDIS_REST_TOKEN) {
    throw new Error('Redis configuration missing');
  }
  redis = new Redis({
    url: process.env.UPSTASH_REDIS_REST_URL,
    token: process.env.UPSTASH_REDIS_REST_TOKEN,
  });
} catch (error) {
  console.error('Redis initialization failed for blog:', error);
}

// Helper to verify authentication
const verifyAuth = (event) => {
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
        // Check for token in cookies
        const cookies = event.headers.cookie;
        if (cookies) {
          const parsedCookies = parse(cookies);
          token = parsedCookies.auth_token;
        }
      }
    }

    if (!token) {
      return null;
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    return decoded;
  } catch (error) {
    return null;
  }
};

// Helper to create a slug
const slugify = (text) => text.toString().toLowerCase()
  .replace(/\s+/g, '-')        // Replace spaces with -
  .replace(/[^\w-]+/g, '')     // Remove all non-word chars
  .replace(/--+/g, '-')        // Replace multiple - with single -
  .replace(/^-+/, '')          // Trim - from start of text
  .replace(/-+$/, '');         // Trim - from end of text

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
        imageUrl: 'https://images.unsplash.com/photo-1620712943543-bcc4688e7485?ixlib=rb-1.2.1&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1000&q=80'
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

  // Seed posts on first call - DISABLED for role-based system
  // await seedBlogPosts();

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
      if (pathParts.length === 0) { // GET /blog (list all posts)
        const postSlugs = await redis.lrange('blog:posts_list', 0, -1); // Get all posts from list
        if (!postSlugs || postSlugs.length === 0) {
          return { statusCode: 200, headers, body: JSON.stringify({ success: true, data: [] }) };
        }
        const posts = await Promise.all(
          postSlugs.map(async slug => {
            const post = await redis.hgetall(`blog:post:${slug}`);
            if (post && post.id) {
              // Parse tags back to array - handle both string and array cases
              if (typeof post.tags === 'string') {
                try {
                  post.tags = JSON.parse(post.tags);
                } catch {
                  post.tags = [];
                }
              } else if (Array.isArray(post.tags)) {
                // Tags are already an array, keep as is
                post.tags = post.tags;
              } else {
                post.tags = [];
              }
            }
            return post;
          })
        );
        return { statusCode: 200, headers, body: JSON.stringify({ success: true, data: posts.filter(p => p && p.id) }) };
      } else if (pathParts.length === 1) { // GET /blog/:slug
        const slug = pathParts[0];
        const post = await redis.hgetall(`blog:post:${slug}`);
        if (!post || !post.id) {
          return { statusCode: 404, headers, body: JSON.stringify({ success: false, error: 'Post not found' }) };
        }
        // Parse tags back to array - handle both string and array cases
        if (typeof post.tags === 'string') {
          try {
            post.tags = JSON.parse(post.tags);
          } catch {
            post.tags = [];
          }
        } else if (Array.isArray(post.tags)) {
          // Tags are already an array, keep as is
          post.tags = post.tags;
        } else {
          post.tags = [];
        }
        return { statusCode: 200, headers, body: JSON.stringify({ success: true, data: post }) };
      }
    }

    // Authentication required for all non-GET operations
    const user = verifyAuth(event);
    if (!user) {
      return { statusCode: 401, headers, body: JSON.stringify({ success: false, error: 'Authentication required' }) };
    }

    let data;
    try {
      data = typeof event.body === 'string' ? JSON.parse(event.body) : event.body;
    } catch (error) {
      return { statusCode: 400, headers, body: JSON.stringify({ success: false, error: 'Invalid JSON' }) };
    }

    if (event.httpMethod === 'POST') {
      // Create new blog post
      const { title, content, summary, tags, imageUrl } = data;
      if (!title || !content) {
        return { statusCode: 400, headers, body: JSON.stringify({ success: false, error: 'Title and content are required' }) };
      }

      const slug = slugify(title);
      const id = `${Date.now()}-${slug}`;
      const post = {
        id,
        slug,
        title,
        content,
        summary: summary || '',
        author: user.email || 'Anonymous',
        authorId: user.userId, // Store the author's user ID
        publishedDate: new Date().toISOString(),
        tags: JSON.stringify(Array.isArray(tags) ? tags : []),
        imageUrl: imageUrl || '',
        updatedDate: new Date().toISOString()
      };

      // Check if slug already exists
      const existingPost = await redis.hgetall(`blog:post:${slug}`);
      if (existingPost && existingPost.id) {
        return { statusCode: 409, headers, body: JSON.stringify({ success: false, error: 'A post with this title already exists' }) };
      }

      await redis.hset(`blog:post:${slug}`, post);
      await redis.lpush('blog:posts_list', slug);

      // Parse tags back for response
      const responsePost = { ...post, tags: JSON.parse(post.tags) };
      return { statusCode: 201, headers, body: JSON.stringify({ success: true, data: responsePost }) };
    }

    if (event.httpMethod === 'PUT') {
      // Update existing blog post
      if (pathParts.length !== 1) {
        return { statusCode: 400, headers, body: JSON.stringify({ success: false, error: 'Post slug required' }) };
      }

      const slug = pathParts[0];
      const existingPost = await redis.hgetall(`blog:post:${slug}`);
      if (!existingPost || !existingPost.id) {
        return { statusCode: 404, headers, body: JSON.stringify({ success: false, error: 'Post not found' }) };
      }

      // Check permissions: user can only edit their own posts, admin can edit any post
      const isAdmin = user.role === 'admin';
      const isOwner = existingPost.authorId === user.userId;

      if (!isAdmin && !isOwner) {
        return { statusCode: 403, headers, body: JSON.stringify({ success: false, error: 'You can only edit your own blog posts' }) };
      }

      const { title, content, summary, tags, imageUrl } = data;

      // Parse existing tags
      let existingTags = [];
      try {
        existingTags = JSON.parse(existingPost.tags || '[]');
      } catch {
        existingTags = [];
      }

      const updatedPost = {
        ...existingPost,
        ...(title && { title }),
        ...(content && { content }),
        ...(summary !== undefined && { summary }),
        ...(tags && { tags: JSON.stringify(Array.isArray(tags) ? tags : []) }),
        ...(imageUrl !== undefined && { imageUrl }),
        updatedDate: new Date().toISOString()
      };

      // If title changed, update slug
      if (title && title !== existingPost.title) {
        const newSlug = slugify(title);
        if (newSlug !== slug) {
          // Check if new slug already exists
          const conflictPost = await redis.hgetall(`blog:post:${newSlug}`);
          if (conflictPost && conflictPost.id) {
            return { statusCode: 409, headers, body: JSON.stringify({ success: false, error: 'A post with this title already exists' }) };
          }

          // Move to new slug
          updatedPost.slug = newSlug;
          await redis.hset(`blog:post:${newSlug}`, updatedPost);
          await redis.del(`blog:post:${slug}`);

          // Update posts list
          await redis.lrem('blog:posts_list', 1, slug);
          await redis.lpush('blog:posts_list', newSlug);

          // Parse tags back for response
          const responsePost = { ...updatedPost };
          try {
            responsePost.tags = JSON.parse(updatedPost.tags || '[]');
          } catch {
            responsePost.tags = [];
          }
          return { statusCode: 200, headers, body: JSON.stringify({ success: true, data: responsePost }) };
        }
      }

      await redis.hset(`blog:post:${slug}`, updatedPost);

      // Parse tags back for response
      const responsePost = { ...updatedPost };
      try {
        responsePost.tags = JSON.parse(updatedPost.tags || '[]');
      } catch {
        responsePost.tags = [];
      }
      return { statusCode: 200, headers, body: JSON.stringify({ success: true, data: responsePost }) };
    }

    if (event.httpMethod === 'DELETE') {
      // Delete blog post
      if (pathParts.length !== 1) {
        return { statusCode: 400, headers, body: JSON.stringify({ success: false, error: 'Post slug required' }) };
      }

      const slug = pathParts[0];
      const existingPost = await redis.hgetall(`blog:post:${slug}`);
      if (!existingPost || !existingPost.id) {
        return { statusCode: 404, headers, body: JSON.stringify({ success: false, error: 'Post not found' }) };
      }

      // Check permissions: user can only delete their own posts, admin can delete any post
      const isAdmin = user.role === 'admin';
      const isOwner = existingPost.authorId === user.userId;

      if (!isAdmin && !isOwner) {
        return { statusCode: 403, headers, body: JSON.stringify({ success: false, error: 'You can only delete your own blog posts' }) };
      }

      await redis.del(`blog:post:${slug}`);
      await redis.lrem('blog:posts_list', 1, slug);

      return { statusCode: 200, headers, body: JSON.stringify({ success: true, message: 'Post deleted successfully' }) };
    }

    return { statusCode: 404, headers, body: JSON.stringify({ success: false, error: 'Route not found' }) };
  } catch (error) {
    console.error('Blog function error:', error);
    return { statusCode: 500, headers, body: JSON.stringify({ success: false, error: 'Internal server error' }) };
  }
};
