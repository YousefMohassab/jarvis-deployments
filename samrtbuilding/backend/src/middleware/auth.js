const jwt = require('jsonwebtoken');
const logger = require('../utils/logger');
const { cache } = require('../config/redis');

/**
 * Verify JWT token and attach user to request
 */
async function authenticateToken(req, res, next) {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
      return res.status(401).json({
        error: 'Authentication required',
        message: 'No token provided'
      });
    }

    // Check if token is blacklisted
    const isBlacklisted = await cache.exists(`blacklist:${token}`);
    if (isBlacklisted) {
      return res.status(401).json({
        error: 'Authentication failed',
        message: 'Token has been revoked'
      });
    }

    // Verify token
    jwt.verify(token, process.env.JWT_SECRET, async (err, decoded) => {
      if (err) {
        if (err.name === 'TokenExpiredError') {
          return res.status(401).json({
            error: 'Authentication failed',
            message: 'Token has expired'
          });
        }
        return res.status(403).json({
          error: 'Authentication failed',
          message: 'Invalid token'
        });
      }

      // Check if user still exists in cache or database
      const cachedUser = await cache.get(`user:${decoded.id}`);

      if (cachedUser) {
        req.user = cachedUser;
      } else {
        // In a real application, fetch from database
        req.user = {
          id: decoded.id,
          email: decoded.email,
          role: decoded.role,
          firstName: decoded.firstName,
          lastName: decoded.lastName
        };

        // Cache user data
        await cache.set(`user:${decoded.id}`, req.user, 3600);
      }

      req.token = token;
      next();
    });
  } catch (error) {
    logger.error('Authentication error:', error);
    return res.status(500).json({
      error: 'Authentication error',
      message: 'An error occurred during authentication'
    });
  }
}

/**
 * Check if user has required role
 * @param {Array|string} roles - Required role(s)
 */
function authorize(...roles) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        error: 'Authentication required',
        message: 'User not authenticated'
      });
    }

    const userRole = req.user.role;

    if (!roles.includes(userRole)) {
      logger.warn(`Unauthorized access attempt by user ${req.user.id} (role: ${userRole})`);
      return res.status(403).json({
        error: 'Forbidden',
        message: 'You do not have permission to access this resource'
      });
    }

    next();
  };
}

/**
 * Optional authentication - attaches user if token is valid but doesn't require it
 */
async function optionalAuth(req, res, next) {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
      return next();
    }

    jwt.verify(token, process.env.JWT_SECRET, async (err, decoded) => {
      if (!err) {
        const cachedUser = await cache.get(`user:${decoded.id}`);
        if (cachedUser) {
          req.user = cachedUser;
        } else {
          req.user = {
            id: decoded.id,
            email: decoded.email,
            role: decoded.role,
            firstName: decoded.firstName,
            lastName: decoded.lastName
          };
        }
      }
      next();
    });
  } catch (error) {
    logger.error('Optional auth error:', error);
    next();
  }
}

/**
 * Generate JWT token
 * @param {Object} user - User object
 * @returns {string} JWT token
 */
function generateToken(user) {
  const payload = {
    id: user.id,
    email: user.email,
    role: user.role,
    firstName: user.firstName,
    lastName: user.lastName
  };

  return jwt.sign(payload, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '1d'
  });
}

/**
 * Generate refresh token
 * @param {Object} user - User object
 * @returns {string} Refresh token
 */
function generateRefreshToken(user) {
  const payload = {
    id: user.id,
    type: 'refresh'
  };

  return jwt.sign(payload, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d'
  });
}

/**
 * Verify refresh token
 * @param {string} token - Refresh token
 * @returns {Object} Decoded token
 */
function verifyRefreshToken(token) {
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    if (decoded.type !== 'refresh') {
      throw new Error('Invalid token type');
    }
    return decoded;
  } catch (error) {
    throw error;
  }
}

/**
 * Blacklist a token (for logout)
 * @param {string} token - Token to blacklist
 * @param {number} expiresIn - Expiration time in seconds
 */
async function blacklistToken(token, expiresIn = 86400) {
  try {
    await cache.set(`blacklist:${token}`, true, expiresIn);
    return true;
  } catch (error) {
    logger.error('Error blacklisting token:', error);
    return false;
  }
}

/**
 * Check if user owns the resource or is admin
 */
function authorizeOwnerOrAdmin(userIdField = 'userId') {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        error: 'Authentication required',
        message: 'User not authenticated'
      });
    }

    const resourceUserId = req.params[userIdField] || req.body[userIdField];
    const isOwner = resourceUserId && resourceUserId.toString() === req.user.id.toString();
    const isAdmin = req.user.role === 'admin';

    if (!isOwner && !isAdmin) {
      return res.status(403).json({
        error: 'Forbidden',
        message: 'You can only access your own resources'
      });
    }

    next();
  };
}

module.exports = {
  authenticateToken,
  authorize,
  optionalAuth,
  generateToken,
  generateRefreshToken,
  verifyRefreshToken,
  blacklistToken,
  authorizeOwnerOrAdmin
};
