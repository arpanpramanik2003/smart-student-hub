import { createClient } from 'redis';
import { logger } from './observability/logger.js';

const createMemoryAuthLimiter = (config) => {
  const store = new Map();

  return {
    mode: 'memory',
    middleware: (req, res, next) => {
      if (!req.path.startsWith('/api/auth/')) {
        next();
        return;
      }

      const isAdminReset = req.path.endsWith('/admin-password-reset');
      const maxLimit = isAdminReset ? config.adminResetRateLimitMax : config.authRateLimitMax;
      const windowMs = isAdminReset ? config.adminResetRateLimitWindowMs : config.authRateLimitWindowMs;

      const now = Date.now();
      const ip = req.ip || req.socket?.remoteAddress || 'unknown';
      const key = `${ip}:${req.path}`;
      const current = store.get(key);

      if (!current || current.expiresAt <= now) {
        store.set(key, { count: 1, expiresAt: now + windowMs });
        next();
        return;
      }

      if (current.count >= maxLimit) {
        const retryAfterSec = Math.ceil((current.expiresAt - now) / 1000);
        res.setHeader('Retry-After', String(Math.max(retryAfterSec, 1)));
        res.status(429).json({ message: 'Too many requests. Please try again later.' });
        return;
      }

      current.count += 1;
      store.set(key, current);
      next();
    },
    close: async () => {
      store.clear();
    },
  };
};

const createRedisAuthLimiter = async (config) => {
  const client = createClient({ url: config.redisUrl });
  client.on('error', (error) => {
    logger.error({ err: error }, 'Redis client error');
  });

  await client.connect();

  return {
    mode: 'redis',
    middleware: async (req, res, next) => {
      if (!req.path.startsWith('/api/auth/')) {
        next();
        return;
      }

      const isAdminReset = req.path.endsWith('/admin-password-reset');
      const maxLimit = isAdminReset ? config.adminResetRateLimitMax : config.authRateLimitMax;
      const windowMs = isAdminReset ? config.adminResetRateLimitWindowMs : config.authRateLimitWindowMs;

      const now = Date.now();
      const windowId = Math.floor(now / windowMs);
      const ip = req.ip || req.socket?.remoteAddress || 'unknown';
      const key = `rl:auth:${req.path}:${ip}:${windowId}`;
      const ttlSec = Math.ceil(windowMs / 1000) + 1;

      const count = await client.incr(key);
      if (count === 1) {
        await client.expire(key, ttlSec);
      }

      if (count > maxLimit) {
        const remainingMs = windowMs - (now % windowMs);
        const retryAfterSec = Math.ceil(remainingMs / 1000);
        res.setHeader('Retry-After', String(Math.max(retryAfterSec, 1)));
        res.status(429).json({ message: 'Too many requests. Please try again later.' });
        return;
      }

      next();
    },
    close: async () => {
      if (client.isOpen) {
        await client.quit();
      }
    },
  };
};

const createUpstashAuthLimiter = async (config) => {
  const baseUrl = config.upstashRedisRestUrl.replace(/\/+$/, '');
  const token = config.upstashRedisRestToken;

  const command = async (...parts) => {
    const encodedParts = parts.map((part) => encodeURIComponent(String(part)));
    const endpoint = `${baseUrl}/${encodedParts.join('/')}`;

    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      const text = await response.text();
      throw new Error(`Upstash command failed (${response.status}): ${text}`);
    }

    const payload = await response.json();
    if (payload.error) {
      throw new Error(`Upstash error: ${payload.error}`);
    }

    return payload.result;
  };

  // Verify credentials early so startup fails fast when backend is forced to upstash.
  await command('PING');

  return {
    mode: 'upstash',
    middleware: async (req, res, next) => {
      if (!req.path.startsWith('/api/auth/')) {
        next();
        return;
      }

      const isAdminReset = req.path.endsWith('/admin-password-reset');
      const maxLimit = isAdminReset ? config.adminResetRateLimitMax : config.authRateLimitMax;
      const windowMs = isAdminReset ? config.adminResetRateLimitWindowMs : config.authRateLimitWindowMs;

      const now = Date.now();
      const windowId = Math.floor(now / windowMs);
      const ip = req.ip || req.socket?.remoteAddress || 'unknown';
      const key = `rl:auth:${req.path}:${ip}:${windowId}`;
      const ttlSec = Math.ceil(windowMs / 1000) + 1;

      const count = Number(await command('INCR', key));
      if (count === 1) {
        await command('EXPIRE', key, ttlSec);
      }

      if (count > maxLimit) {
        const remainingMs = windowMs - (now % windowMs);
        const retryAfterSec = Math.ceil(remainingMs / 1000);
        res.setHeader('Retry-After', String(Math.max(retryAfterSec, 1)));
        res.status(429).json({ message: 'Too many requests. Please try again later.' });
        return;
      }

      next();
    },
    close: async () => {},
  };
};

export const createAuthRateLimiter = async (config) => {
  const backend = config.authRateLimitBackend;

  if (backend === 'memory') {
    return createMemoryAuthLimiter(config);
  }

  if (backend === 'redis' && !config.redisUrl) {
    throw new Error('AUTH_RATE_LIMIT_BACKEND=redis requires REDIS_URL.');
  }

  if (backend === 'upstash' && (!config.upstashRedisRestUrl || !config.upstashRedisRestToken)) {
    throw new Error('AUTH_RATE_LIMIT_BACKEND=upstash requires UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN.');
  }

  if (backend === 'redis' || (backend === 'auto' && config.redisUrl)) {
    try {
      const limiter = await createRedisAuthLimiter(config);
      logger.info({ mode: 'redis' }, 'Auth rate limiter initialized');
      return limiter;
    } catch (error) {
      if (backend === 'redis') {
        throw error;
      }
      logger.warn({ err: error.message }, 'Redis limiter unavailable, falling back to memory');
    }
  }

  if (backend === 'upstash' || (backend === 'auto' && config.upstashRedisRestUrl && config.upstashRedisRestToken)) {
    try {
      const limiter = await createUpstashAuthLimiter(config);
      logger.info({ mode: 'upstash' }, 'Auth rate limiter initialized');
      return limiter;
    } catch (error) {
      if (backend === 'upstash') {
        throw error;
      }
      logger.warn({ err: error.message }, 'Upstash limiter unavailable, falling back to memory');
    }
  }

  logger.info({ mode: 'memory' }, 'Auth rate limiter initialized');
  return createMemoryAuthLimiter(config);
};
