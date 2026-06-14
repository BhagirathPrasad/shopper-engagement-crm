import Redis from 'ioredis';

/**
 * Parses a Redis URL and returns the correct ioredis connection config.
 * Handles both standard redis:// and TLS rediss:// URLs (required for Upstash).
 */
function buildRedisConfig(redisUrl) {
  if (!redisUrl) return null;

  const isTLS = redisUrl.startsWith('rediss://');

  return {
    // ioredis can take the full URL directly
    // but we add TLS config explicitly for Upstash / Render Redis
    ...(isTLS ? { tls: { rejectUnauthorized: false } } : {}),
    maxRetriesPerRequest: null,        // required by BullMQ
    enableReadyCheck: false,           // avoids startup race conditions
    retryStrategy: (times) => {
      if (times > 5) {
        // Stop retrying after 5 attempts — don't block the process
        console.error(`[Redis] Giving up after ${times} connection attempts.`);
        return null;
      }
      const delay = Math.min(times * 500, 3000);
      console.warn(`[Redis] Reconnecting in ${delay}ms (attempt ${times})...`);
      return delay;
    },
  };
}

let redisClient = null;
let redisAvailable = false;

const REDIS_URL = process.env.REDIS_URL
  || process.env.REDIS_URI
  || process.env.UPSTASH_REDIS_REST_URL
  || null;

if (REDIS_URL) {
  try {
    redisClient = new Redis(REDIS_URL, buildRedisConfig(REDIS_URL));

    redisClient.on('connect', () => {
      redisAvailable = true;
      console.log('[Redis] Connected successfully.');
    });

    redisClient.on('ready', () => {
      redisAvailable = true;
    });

    redisClient.on('error', (err) => {
      redisAvailable = false;
      // Log but do NOT crash the process — let the app run without queues
      console.error('[Redis] Connection error:', err.message);
    });

    redisClient.on('close', () => {
      redisAvailable = false;
      console.warn('[Redis] Connection closed.');
    });

  } catch (err) {
    console.error('[Redis] Failed to initialise client:', err.message);
    redisClient = null;
  }
} else {
  console.warn(
    '[Redis] REDIS_URL is not set. BullMQ queues will be DISABLED.\n' +
    'Set REDIS_URL in your environment variables to enable background jobs.'
  );
}

export { redisClient, redisAvailable, REDIS_URL };
