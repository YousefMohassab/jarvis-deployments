const rateLimit = require('express-rate-limit');
const { cache } = require('../config/redis');
const logger = require('../utils/logger');

/**
 * Redis store for rate limiting
 */
class RedisStore {
  constructor(options = {}) {
    this.prefix = options.prefix || 'rl:';
    this.resetExpiryOnChange = options.resetExpiryOnChange || false;
  }

  async increment(key) {
    const redisKey = this.prefix + key;
    try {
      const current = await cache.increment(redisKey, 1);

      if (current === 1) {
        // First request, set expiration
        const windowMs = parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 900000;
        await cache.expire(redisKey, Math.ceil(windowMs / 1000));
      }

      return {
        totalHits: current,
        resetTime: null
      };
    } catch (error) {
      logger.error('Redis rate limit increment error:', error);
      // Fallback: allow the request
      return { totalHits: 0, resetTime: null };
    }
  }

  async decrement(key) {
    const redisKey = this.prefix + key;
    try {
      await cache.increment(redisKey, -1);
    } catch (error) {
      logger.error('Redis rate limit decrement error:', error);
    }
  }

  async resetKey(key) {
    const redisKey = this.prefix + key;
    try {
      await cache.del(redisKey);
    } catch (error) {
      logger.error('Redis rate limit reset error:', error);
    }
  }
}

/**
 * General API rate limiter
 */
const apiLimiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 900000, // 15 minutes
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100,
  standardHeaders: true,
  legacyHeaders: false,
  store: new RedisStore({ prefix: 'rl:api:' }),
  handler: (req, res) => {
    logger.warn(`Rate limit exceeded for IP: ${req.ip}`);
    res.status(429).json({
      error: 'Too Many Requests',
      message: 'You have exceeded the rate limit. Please try again later.',
      retryAfter: res.getHeader('Retry-After')
    });
  },
  skip: (req) => {
    // Skip rate limiting for health check
    return req.path === '/health';
  },
  keyGenerator: (req) => {
    // Use user ID if authenticated, otherwise IP
    return req.user ? `user:${req.user.id}` : `ip:${req.ip}`;
  }
});

/**
 * Stricter rate limiter for authentication endpoints
 */
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 requests per window
  standardHeaders: true,
  legacyHeaders: false,
  store: new RedisStore({ prefix: 'rl:auth:' }),
  handler: (req, res) => {
    logger.warn(`Auth rate limit exceeded for IP: ${req.ip}`);
    res.status(429).json({
      error: 'Too Many Requests',
      message: 'Too many authentication attempts. Please try again later.',
      retryAfter: res.getHeader('Retry-After')
    });
  },
  keyGenerator: (req) => {
    return `ip:${req.ip}`;
  }
});

/**
 * Rate limiter for control actions
 */
const controlLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 10, // 10 control actions per minute
  standardHeaders: true,
  legacyHeaders: false,
  store: new RedisStore({ prefix: 'rl:control:' }),
  handler: (req, res) => {
    logger.warn(`Control rate limit exceeded for user: ${req.user?.id || req.ip}`);
    res.status(429).json({
      error: 'Too Many Requests',
      message: 'Too many control actions. Please wait before trying again.',
      retryAfter: res.getHeader('Retry-After')
    });
  },
  keyGenerator: (req) => {
    return req.user ? `user:${req.user.id}` : `ip:${req.ip}`;
  }
});

/**
 * Flexible rate limiter for specific use cases
 */
function createRateLimiter(options = {}) {
  const {
    windowMs = 900000,
    max = 100,
    prefix = 'rl:custom:',
    message = 'Too many requests. Please try again later.'
  } = options;

  return rateLimit({
    windowMs,
    max,
    standardHeaders: true,
    legacyHeaders: false,
    store: new RedisStore({ prefix }),
    handler: (req, res) => {
      logger.warn(`Custom rate limit exceeded: ${prefix} for ${req.ip}`);
      res.status(429).json({
        error: 'Too Many Requests',
        message,
        retryAfter: res.getHeader('Retry-After')
      });
    },
    keyGenerator: (req) => {
      return req.user ? `user:${req.user.id}` : `ip:${req.ip}`;
    }
  });
}

/**
 * Dynamic rate limiter based on user role
 */
function roleBasedLimiter(limits = {}) {
  const defaultLimits = {
    admin: { windowMs: 900000, max: 1000 },
    manager: { windowMs: 900000, max: 500 },
    operator: { windowMs: 900000, max: 200 },
    viewer: { windowMs: 900000, max: 100 },
    guest: { windowMs: 900000, max: 50 }
  };

  const roleLimits = { ...defaultLimits, ...limits };

  return async (req, res, next) => {
    const role = req.user?.role || 'guest';
    const config = roleLimits[role] || roleLimits.guest;

    const limiter = rateLimit({
      windowMs: config.windowMs,
      max: config.max,
      standardHeaders: true,
      legacyHeaders: false,
      store: new RedisStore({ prefix: `rl:role:${role}:` }),
      handler: (req, res) => {
        logger.warn(`Role-based rate limit exceeded for ${role}: ${req.user?.id || req.ip}`);
        res.status(429).json({
          error: 'Too Many Requests',
          message: `Rate limit exceeded for ${role} role.`,
          retryAfter: res.getHeader('Retry-After')
        });
      },
      keyGenerator: (req) => {
        return req.user ? `user:${req.user.id}` : `ip:${req.ip}`;
      }
    });

    return limiter(req, res, next);
  };
}

module.exports = apiLimiter;

module.exports.authLimiter = authLimiter;
module.exports.controlLimiter = controlLimiter;
module.exports.createRateLimiter = createRateLimiter;
module.exports.roleBasedLimiter = roleBasedLimiter;
module.exports.RedisStore = RedisStore;
