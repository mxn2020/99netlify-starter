const { Redis } = require('@upstash/redis');
require('dotenv').config();

// Initialize Redis
const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL,
  token: process.env.UPSTASH_REDIS_REST_TOKEN,
});

async function testBlogPostVisibility() {
  console.log('🧪 Testing Blog Post Visibility Fixes...\n');

  try {
    // Get all posts
    const postSlugs = await redis.lrange('blog:posts_list', 0, -1);
    console.log(`Found ${postSlugs.length} blog posts:\n`);

    const publicPosts = [];
    
    for (const slug of postSlugs) {
      const post = await redis.hgetall(`blog:post:${slug}`);
      if (post && post.id) {
        console.log(`📝 Post: ${post.title}`);
        console.log(`   Slug: ${slug}`);
        console.log(`   Status: ${post.status || 'published'}`);
        console.log(`   Public: ${post.isPublic === 'true' ? 'Yes' : 'No'}`);
        console.log(`   Scheduled: ${post.scheduledFor || 'N/A'}`);
        
        // Test public visibility logic
        const shouldBeVisible = post.status === 'published' && post.isPublic === 'true';
        console.log(`   Should be publicly visible: ${shouldBeVisible ? 'Yes' : 'No'}`);
        
        if (shouldBeVisible) {
          publicPosts.push(post);
        }
        console.log('');
      }
    }

    console.log(`✅ Posts that would be visible to public: ${publicPosts.length}`);
    console.log(`✅ Posts that would be hidden from public: ${postSlugs.length - publicPosts.length}`);

  } catch (error) {
    console.error('❌ Error testing blog posts:', error);
  }
}

async function main() {
  try {
    await testBlogPostVisibility();
    console.log('✅ Blog post testing complete!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error in main:', error);
    process.exit(1);
  }
}

main();
