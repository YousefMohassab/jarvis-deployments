const rateLimit = require('express-rate-limit');
const logger = require('../utils/logger');

/**
 * General API rate limiter (using in-memory store)
 */
const apiLimiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 900000, // 15 minutes
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100,
  standardHeaders: true,
  legacyHeaders: false,
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
  handler: (req, res) => {
    logger.warn(`Control rate limit exceeded for IP: ${req.ip}`);
    res.status(500).json({
      error: 'Too Many Requests',
      message: 'Too many control actions. Please wait before trying again.',
      retryAfter: res.getHeader('Retry-After')
    });
  },
  keyGenerator: (req) => {
    return `ip:${req.ip}`;
  }
});

/**
 * Flexible rate limiter for specific use cases
 */
function createRateLimiter(options = {}) {
  const {
    windowMs = 900000,
    max = 100,
    message = 'Too many requests. Please try again later.'
  } = options;

  return rateLimit({
    windowMs,
    max,
    standardHeaders: true,
    legacyHeaders: false,
    handler: (req, res) => {
      logger.warn(`Custom rate limit exceeded for ${req.ip}`);
      res.status(429).json({
        error: 'Too Many Requests',
        message,
        retryAfter: res.getHeader('Retry-After')
      });
    },
    keyGenerator: (req) => {
      return `ip:${req.ip}`;
    }
  });
}

module.exports = apiLimiter;
module.exports.controlLimiter = controlLimiter;
module.exports.createRateLimiter = createRateLimiter;
