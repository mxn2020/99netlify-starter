const { Redis } = require('@upstash/redis');
const { generateAccountId } = require('../netlify/functions/secure-id-utils.cjs');

// Load environment variables
require('dotenv').config();

// Initialize Redis
const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL,
  token: process.env.UPSTASH_REDIS_REST_TOKEN,
});

async function fixUserAccounts() {
  try {
    console.log('🔍 Checking all users for missing accounts...');
    
    // Get all user email keys
    const userEmailKeys = await redis.keys('user:email:*');
    console.log(`Found ${userEmailKeys.length} user email entries`);
    
    for (const emailKey of userEmailKeys) {
      const userId = await redis.get(emailKey);
      if (!userId) continue;
      
      console.log(`\n📧 Checking user ${userId}...`);
      
      // Get user data
      const userData = await redis.get(`user:${userId}`);
      if (!userData) {
        console.log(`❌ User data not found for ${userId}`);
        continue;
      }
      
      const user = typeof userData === 'string' ? JSON.parse(userData) : userData;
      console.log(`👤 User: ${user.firstName} ${user.lastName} (${user.email})`);
      
      // Check if user has accounts
      const userAccounts = await redis.smembers(`user:${userId}:accounts`);
      console.log(`📁 User has ${userAccounts.length} accounts`);
      
      if (userAccounts.length === 0) {
        console.log(`🔧 Creating personal account for ${user.email}...`);
        
        // Create personal account
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
        
        // Store account
        await redis.set(`account:${accountId}`, JSON.stringify(personalAccount));
        
        // Create ownership membership
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
        
        console.log(`✅ Created personal account ${accountId} for ${user.email}`);
      } else {
        console.log(`✅ User already has accounts: ${userAccounts.join(', ')}`);
        
        // Verify account data exists
        for (const accountId of userAccounts) {
          const accountData = await redis.get(`account:${accountId}`);
          if (!accountData) {
            console.log(`❌ Account data missing for ${accountId}, removing from user`);
            await redis.srem(`user:${userId}:accounts`, accountId);
          } else {
            const account = typeof accountData === 'string' ? JSON.parse(accountData) : accountData;
            console.log(`  📁 ${account.name} (${account.type})`);
          }
        }
      }
    }
    
    console.log('\n🎉 User account fix completed!');
  } catch (error) {
    console.error('❌ Error fixing user accounts:', error);
  }
}

// Run the fix
fixUserAccounts();