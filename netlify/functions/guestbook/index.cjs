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
  console.error('Redis initialization failed for guestbook:', error);
}

const redisKey = 'example:guestbook_entries';

exports.handler = async (event, context) => {
  const headers = getCorsHeaders();

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 204, headers, body: '' };
  }

  if (!redis) {
    return { statusCode: 500, headers, body: JSON.stringify({ success: false, error: 'Redis not available' }) };
  }

  try {
    if (event.httpMethod === 'GET') {
      const entries = await redis.lrange(redisKey, 0, 49); // Get latest 50
      console.log('Raw entries from Redis:', entries);

      const parsedEntries = entries.map((entry, index) => {
        try {
          // Handle both string and object entries from Redis
          if (typeof entry === 'string') {
            return JSON.parse(entry);
          } else if (typeof entry === 'object' && entry !== null) {
            return entry;
          } else {
            console.warn(`Unexpected entry type at index ${index}:`, typeof entry, entry);
            return null;
          }
        } catch (parseError) {
          console.error(`Failed to parse entry at index ${index}:`, entry, parseError);
          return null;
        }
      }).filter(entry => entry !== null); // Remove failed parses

      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({ success: true, data: parsedEntries })
      };
    } else if (event.httpMethod === 'POST') {
      let body;
      try {
        body = JSON.parse(event.body);
      } catch (parseError) {
        console.error('Failed to parse request body:', event.body, parseError);
        return {
          statusCode: 400,
          headers,
          body: JSON.stringify({ success: false, error: 'Invalid request body format.' })
        };
      }

      if (!body.name || !body.message) {
        return {
          statusCode: 400,
          headers,
          body: JSON.stringify({ success: false, error: 'Name and message are required.' })
        };
      }
      const entry = {
        name: body.name,
        message: body.message,
        timestamp: new Date().toISOString()
      };

      console.log('Storing entry:', entry);
      const entryString = JSON.stringify(entry);
      console.log('Entry string:', entryString);

      await redis.lpush(redisKey, entryString);
      await redis.ltrim(redisKey, 0, 99); // Keep only the latest 100 entries

      return {
        statusCode: 201,
        headers,
        body: JSON.stringify({ success: true, data: entry })
      };
    }
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ success: false, error: 'Method Not Allowed' })
    };
  } catch (error) {
    console.error('Guestbook function error:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ success: false, error: 'Internal server error' })
    };
  }
};
