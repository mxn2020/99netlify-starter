const { Redis } = require('@upstash/redis');
const bcrypt = require('bcryptjs');
const { generateUserId } = require('../netlify/functions/secure-id-utils.cjs');
require('dotenv').config({ path: '.env' });

console.log('🔧 Environment check:');
console.log('  UPSTASH_REDIS_REST_URL:', process.env.UPSTASH_REDIS_REST_URL ? 'Set ✅' : 'Missing ❌');
console.log('  UPSTASH_REDIS_REST_TOKEN:', process.env.UPSTASH_REDIS_REST_TOKEN ? 'Set ✅' : 'Missing ❌');

// Initialize Redis
const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL,
  token: process.env.UPSTASH_REDIS_REST_TOKEN,
});

console.log('🔗 Redis initialized');

async function clearAllBlogPosts() {
  try {
    console.log('🧹 Clearing all existing blog posts...');

    // Get all blog post slugs
    const postSlugs = await redis.lrange('blog:posts_list', 0, -1);
    console.log('  📋 Retrieved posts list from Redis');

    if (postSlugs && postSlugs.length > 0) {
      console.log(`Found ${postSlugs.length} blog posts to delete`);

      // Delete each blog post
      for (const slug of postSlugs) {
        await redis.del(`blog:post:${slug}`);
        console.log(`  ✅ Deleted post: ${slug}`);
      }

      // Clear the posts list
      await redis.del('blog:posts_list');
      console.log('  ✅ Cleared posts list');
    } else {
      console.log('No blog posts found to delete');
    }

    console.log('✅ Blog posts cleared successfully\n');
  } catch (error) {
    console.error('❌ Error clearing blog posts:', error);
    throw error;
  }
}

async function createAdminUser() {
  try {
    console.log('👤 Creating super-admin user...');

    const adminEmail = 'admin@example.com';
    const adminPassword = 'admin123';
    const adminName = 'Super Admin User';

    // Check if admin already exists
    const existingAdminId = await redis.get(`user:email:${adminEmail}`);
    if (existingAdminId) {
      console.log('⚠️  Admin user already exists');

      // Update existing user to ensure they have super-admin role
      const existingUserData = await redis.get(`user:${existingAdminId}`);
      if (existingUserData) {
        const userData = typeof existingUserData === 'string' ? JSON.parse(existingUserData) : existingUserData;
        userData.role = 'super-admin';
        userData.name = adminName; // Update name to reflect super-admin status
        await redis.set(`user:${existingAdminId}`, JSON.stringify(userData));
        console.log('✅ Updated existing user to super-admin role');
      }
      return;
    }

    // Create super-admin user
    const hashedPassword = await bcrypt.hash(adminPassword, 10);
    const adminId = generateUserId();

    const adminUser = {
      id: adminId,
      username: adminName,
      name: adminName,
      email: adminEmail,
      password: hashedPassword,
      role: 'super-admin',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    // Store super-admin user
    await redis.set(`user:${adminId}`, JSON.stringify(adminUser));
    await redis.set(`user:email:${adminEmail}`, adminId);

    console.log('✅ Super-admin user created successfully');
    console.log(`   📧 Email: ${adminEmail}`);
    console.log(`   🔑 Password: ${adminPassword}`);
    console.log(`   👑 Role: super-admin\n`);
  } catch (error) {
    console.error('❌ Error creating super-admin user:', error);
    throw error;
  }
}

async function updateExistingUsers() {
  try {
    console.log('🔄 Updating existing users to add role field...');

    // Get all user keys - use a more specific pattern
    const userKeys = [];
    try {
      const allKeys = await redis.keys('user:user_*');
      userKeys.push(...allKeys);
    } catch (error) {
      console.log('No user keys found with pattern user:user_*, trying alternate pattern...');
      // Try different pattern if needed
    }

    if (userKeys && userKeys.length > 0) {
      console.log(`Found ${userKeys.length} existing users to update`);

      for (const userKey of userKeys) {
        try {
          const userData = await redis.get(userKey);
          if (userData) {
            const user = typeof userData === 'string' ? JSON.parse(userData) : userData;

            // Add role if it doesn't exist
            if (!user.role) {
              user.role = 'user'; // Default role for existing users
              await redis.set(userKey, JSON.stringify(user));
              console.log(`  ✅ Updated ${user.email || user.username} with user role`);
            } else {
              console.log(`  ℹ️  ${user.email || user.username} already has role: ${user.role}`);
            }
          }
        } catch (userError) {
          console.log(`  ⚠️  Skipping ${userKey} due to error:`, userError.message);
        }
      }
    } else {
      console.log('No existing users found to update');
    }

    console.log('✅ Existing users updated successfully\n');
  } catch (error) {
    console.error('⚠️  Warning updating existing users (continuing anyway):', error.message);
    console.log('✅ Continuing with admin user creation...\n');
  }
}

async function seedDatabase() {
  try {
    console.log('🌱 Starting database seeding...\n');

    await clearAllBlogPosts();
    await updateExistingUsers();
    await createAdminUser();

    console.log('🎉 Database seeding completed successfully!');
    console.log('\n📝 What was done:');
    console.log('  - Cleared all existing blog posts');
    console.log('  - Updated existing users to have default "user" role');
    console.log('  - Created admin user (admin@example.com / admin123)');
    console.log('\n🚀 You can now:');
    console.log('  - Login as admin to manage all blog posts');
    console.log('  - Regular users can only edit/delete their own posts');

  } catch (error) {
    console.error('💥 Seeding failed:', error);
    process.exit(1);
  }
}

// Run the seeding
seedDatabase().then(() => {
  console.log('\n✅ Seeding process completed');
  process.exit(0);
}).catch((error) => {
  console.error('❌ Seeding process failed:', error);
  process.exit(1);
});
