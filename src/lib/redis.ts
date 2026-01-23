import { Redis } from 'ioredis';

const globalForRedis = global as unknown as { redis: Redis };

// In a real environment, you would use process.env.REDIS_URL
// Since this is a local setup without Redis, we will use a mock or standard in-memory object if needed.
// But complying with the request to "implement redis", here is the standard client code.

export const redis =
    globalForRedis.redis ||
    new Redis(process.env.REDIS_URL || 'redis://localhost:6379', {
        lazyConnect: true // Don't crash if Redis is missing on start
    });

if (process.env.NODE_ENV !== 'production') globalForRedis.redis = redis;

// Fallback in-memory cache if Redis fails
const memoryCache: Record<string, any> = {};

export const cacheGet = async (key: string) => {
    try {
        if (redis.status === 'ready') return await redis.get(key);
        return memoryCache[key];
    } catch {
        return memoryCache[key];
    }
};

export const cacheSet = async (key: string, value: any, ttlSeconds = 60) => {
    try {
        if (redis.status === 'ready') await redis.setex(key, ttlSeconds, value);
        else memoryCache[key] = value;
    } catch {
        memoryCache[key] = value;
    }
};

export const cacheDel = async (key: string) => {
    try {
        if (redis.status === 'ready') await redis.del(key);
        else delete memoryCache[key];
    } catch {
        delete memoryCache[key];
    }
};
