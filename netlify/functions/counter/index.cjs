const { Redis } = require('@upstash/redis');
const { getCorsHeaders } = require('../platform-utils.cjs');

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
  console.error('Redis initialization failed for counter:', error);
}

const redisKey = 'example:counter';

exports.handler = async (event, context) => {
  const headers = getCorsHeaders();

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 204, headers, body: '' };
  }

  if (!redis) {
    return { 
      statusCode: 500, 
      headers, 
      body: JSON.stringify({ success: false, error: 'Redis not available' }) 
    };
  }

  try {
    if (event.httpMethod === 'GET') {
      const count = await redis.get(redisKey) || 0;
      return { 
        statusCode: 200, 
        headers, 
        body: JSON.stringify({ success: true, data: { count: parseInt(count) } }) 
      };
    } else if (event.httpMethod === 'POST') {
      const newCount = await redis.incr(redisKey);
      return { 
        statusCode: 200, 
        headers, 
        body: JSON.stringify({ success: true, data: { count: newCount } }) 
      };
    } else if (event.httpMethod === 'DELETE') {
      await redis.del(redisKey);
      return { 
        statusCode: 200, 
        headers, 
        body: JSON.stringify({ success: true, data: { count: 0 } }) 
      };
    }
    return { 
      statusCode: 405, 
      headers, 
      body: JSON.stringify({ success: false, error: 'Method Not Allowed' }) 
    };
  } catch (error) {
    console.error('Counter function error:', error);
    return { 
      statusCode: 500, 
      headers, 
      body: JSON.stringify({ success: false, error: 'Internal server error' }) 
    };
  }
};
