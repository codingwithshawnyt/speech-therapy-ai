// database.js - This file would typically be located in the 'server/src/config' directory

import mongoose from 'mongoose';
import redis from 'redis';
import { promisify } from 'util';

// Database connection URI (should be stored securely in environment variables)
const MONGO_URI = process.env.MONGO_URI;

// Redis connection options (should be stored securely in environment variables)
const REDIS_HOST = process.env.REDIS_HOST;
const REDIS_PORT = process.env.REDIS_PORT;
const REDIS_PASSWORD = process.env.REDIS_PASSWORD;

// Connect to MongoDB
mongoose
  .connect(MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    // ... other options as needed
  })
  .then(() => {
    console.log('Connected to MongoDB');
  })
  .catch((error) => {
    console.error('Error connecting to MongoDB:', error);
    process.exit(1); // Exit the process if unable to connect to the database
  });

// Create Redis client
const redisClient = redis.createClient({
  host: REDIS_HOST,
  port: REDIS_PORT,
  password: REDIS_PASSWORD,
  // ... other options as needed
});

redisClient.on('connect', () => {
  console.log('Connected to Redis');
});

redisClient.on('error', (error) => {
  console.error('Error connecting to Redis:', error);
  // Handle Redis connection errors (e.g., retry connection, use fallback)
});

// Promisify Redis methods for async/await usage
const redisGetAsync = promisify(redisClient.get).bind(redisClient);
const redisSetAsync = promisify(redisClient.set).bind(redisClient);
const redisHGetAsync = promisify(redisClient.hget).bind(redisClient);
const redisHSetAsync = promisify(redisClient.hset).bind(redisClient);
// ... promisify other Redis methods as needed

// Advanced Redis usage examples:

// 1. Caching frequently accessed data
const cacheData = async (key, data, expirySeconds = 3600) => {
  try {
    await redisSetAsync(key, JSON.stringify(data), 'EX', expirySeconds);
  } catch (error) {
    console.error('Error caching data in Redis:', error);
  }
};

const getCachedData = async (key) => {
  try {
    const cachedData = await redisGetAsync(key);
    if (cachedData) {
      return JSON.parse(cachedData);
    }
    return null;
  } catch (error) {
    console.error('Error getting cached data from Redis:', error);
    return null;
  }
};

// 2. Implementing a rate limiter
const checkRateLimit = async (userId, action, limit = 10, windowSeconds = 60) => {
  const key = `ratelimit:${userId}:${action}`;
  try {
    const count = await redisGetAsync(key);
    if (count && parseInt(count) >= limit) {
      return false; // Rate limit exceeded
    }
    await redisSetAsync(key, (parseInt(count) || 0) + 1, 'EX', windowSeconds);
    return true; // Rate limit not exceeded
  } catch (error) {
    console.error('Error checking rate limit in Redis:', error);
    return false; // Assume rate limit exceeded on error
  }
};

// 3. Using Redis for distributed locking
const acquireLock = async (key, expirySeconds = 10) => {
  const identifier = uuidv4(); // Generate unique identifier for this lock
  try {
    const result = await redisSetAsync(key, identifier, 'NX', 'EX', expirySeconds);
    if (result) {
      return identifier; // Lock acquired successfully
    }
    return null; // Failed to acquire lock
  } catch (error) {
    console.error('Error acquiring lock in Redis:', error);
    return null;
  }
};

const releaseLock = async (key, identifier) => {
  const script = `
    if redis.call("get", KEYS[1]) == ARGV[1] then
      return redis.call("del", KEYS[1])
    else
      return 0
    end
  `;
  try {
    const result = await redisClient.evalAsync(script, 1, key, identifier);
    return result === 1; // Lock released successfully
  } catch (error) {
    console.error('Error releasing lock in Redis:', error);
    return false;
  }
};

// Export database connections and helper functions
export { mongoose, redisClient, redisGetAsync, redisSetAsync, redisHGetAsync, redisHSetAsync, cacheData, getCachedData, checkRateLimit, acquireLock, releaseLock };