const bcrypt = require('bcrypt');
const { User } = require('../models');
const {
  generateToken,
  generateRefreshToken,
  verifyRefreshToken,
  blacklistToken
} = require('../middleware/auth');
const { cache } = require('../config/redis');
const logger = require('../utils/logger');

/**
 * Login user
 */
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validate input
    if (!email || !password) {
      return res.status(400).json({
        error: 'Validation Error',
        message: 'Email and password are required'
      });
    }

    // Find user
    const user = await User.findOne({ where: { email, isActive: true } });

    if (!user) {
      return res.status(401).json({
        error: 'Authentication Failed',
        message: 'Invalid email or password'
      });
    }

    // Verify password
    const isValidPassword = await user.comparePassword(password);

    if (!isValidPassword) {
      return res.status(401).json({
        error: 'Authentication Failed',
        message: 'Invalid email or password'
      });
    }

    // Update last login
    await user.update({ lastLogin: new Date() });

    // Generate tokens
    const token = generateToken(user);
    const refreshToken = generateRefreshToken(user);

    // Cache user data
    await cache.set(`user:${user.id}`, user.toJSON(), 3600);

    // Store refresh token
    await cache.set(`refresh:${user.id}`, refreshToken, 7 * 24 * 3600);

    logger.info(`User logged in: ${user.email} (ID: ${user.id})`);

    res.json({
      success: true,
      message: 'Login successful',
      data: {
        user: user.toJSON(),
        token,
        refreshToken
      }
    });
  } catch (error) {
    logger.error('Login error:', error);
    res.status(500).json({
      error: 'Server Error',
      message: 'An error occurred during login'
    });
  }
};

/**
 * Register new user
 */
exports.register = async (req, res) => {
  try {
    const { email, password, firstName, lastName, role = 'viewer' } = req.body;

    // Validate input
    if (!email || !password || !firstName || !lastName) {
      return res.status(400).json({
        error: 'Validation Error',
        message: 'All fields are required'
      });
    }

    // Check if user exists
    const existingUser = await User.findOne({ where: { email } });

    if (existingUser) {
      return res.status(409).json({
        error: 'Conflict',
        message: 'User with this email already exists'
      });
    }

    // Create user
    const user = await User.create({
      email,
      password,
      firstName,
      lastName,
      role
    });

    // Generate tokens
    const token = generateToken(user);
    const refreshToken = generateRefreshToken(user);

    // Cache user data
    await cache.set(`user:${user.id}`, user.toJSON(), 3600);

    logger.info(`New user registered: ${user.email} (ID: ${user.id})`);

    res.status(201).json({
      success: true,
      message: 'Registration successful',
      data: {
        user: user.toJSON(),
        token,
        refreshToken
      }
    });
  } catch (error) {
    logger.error('Registration error:', error);
    res.status(500).json({
      error: 'Server Error',
      message: 'An error occurred during registration'
    });
  }
};

/**
 * Logout user
 */
exports.logout = async (req, res) => {
  try {
    const { token, user } = req;

    // Blacklist current token
    await blacklistToken(token, 24 * 3600);

    // Remove cached user data
    await cache.del(`user:${user.id}`);
    await cache.del(`refresh:${user.id}`);

    logger.info(`User logged out: ${user.email} (ID: ${user.id})`);

    res.json({
      success: true,
      message: 'Logout successful'
    });
  } catch (error) {
    logger.error('Logout error:', error);
    res.status(500).json({
      error: 'Server Error',
      message: 'An error occurred during logout'
    });
  }
};

/**
 * Refresh access token
 */
exports.refreshToken = async (req, res) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(400).json({
        error: 'Validation Error',
        message: 'Refresh token is required'
      });
    }

    // Verify refresh token
    const decoded = verifyRefreshToken(refreshToken);

    // Check if refresh token is still valid in cache
    const cachedRefreshToken = await cache.get(`refresh:${decoded.id}`);

    if (cachedRefreshToken !== refreshToken) {
      return res.status(401).json({
        error: 'Authentication Failed',
        message: 'Invalid or expired refresh token'
      });
    }

    // Get user
    const user = await User.findByPk(decoded.id);

    if (!user || !user.isActive) {
      return res.status(401).json({
        error: 'Authentication Failed',
        message: 'User not found or inactive'
      });
    }

    // Generate new tokens
    const newToken = generateToken(user);
    const newRefreshToken = generateRefreshToken(user);

    // Update cached refresh token
    await cache.set(`refresh:${user.id}`, newRefreshToken, 7 * 24 * 3600);

    res.json({
      success: true,
      message: 'Token refreshed successfully',
      data: {
        token: newToken,
        refreshToken: newRefreshToken
      }
    });
  } catch (error) {
    logger.error('Refresh token error:', error);
    res.status(401).json({
      error: 'Authentication Failed',
      message: 'Invalid or expired refresh token'
    });
  }
};

/**
 * Get current user
 */
exports.getCurrentUser = async (req, res) => {
  try {
    const user = await User.findByPk(req.user.id);

    if (!user) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'User not found'
      });
    }

    res.json({
      success: true,
      data: user.toJSON()
    });
  } catch (error) {
    logger.error('Get current user error:', error);
    res.status(500).json({
      error: 'Server Error',
      message: 'An error occurred while fetching user data'
    });
  }
};

/**
 * Update user profile
 */
exports.updateProfile = async (req, res) => {
  try {
    const { firstName, lastName, phone, preferences } = req.body;

    const user = await User.findByPk(req.user.id);

    if (!user) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'User not found'
      });
    }

    // Update fields
    if (firstName) user.firstName = firstName;
    if (lastName) user.lastName = lastName;
    if (phone !== undefined) user.phone = phone;
    if (preferences) user.preferences = { ...user.preferences, ...preferences };

    await user.save();

    // Update cache
    await cache.set(`user:${user.id}`, user.toJSON(), 3600);

    logger.info(`User profile updated: ${user.email} (ID: ${user.id})`);

    res.json({
      success: true,
      message: 'Profile updated successfully',
      data: user.toJSON()
    });
  } catch (error) {
    logger.error('Update profile error:', error);
    res.status(500).json({
      error: 'Server Error',
      message: 'An error occurred while updating profile'
    });
  }
};

/**
 * Change password
 */
exports.changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        error: 'Validation Error',
        message: 'Current password and new password are required'
      });
    }

    const user = await User.findByPk(req.user.id);

    if (!user) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'User not found'
      });
    }

    // Verify current password
    const isValidPassword = await user.comparePassword(currentPassword);

    if (!isValidPassword) {
      return res.status(401).json({
        error: 'Authentication Failed',
        message: 'Current password is incorrect'
      });
    }

    // Update password
    user.password = newPassword;
    await user.save();

    // Invalidate all existing tokens
    await cache.del(`user:${user.id}`);
    await cache.del(`refresh:${user.id}`);

    logger.info(`Password changed for user: ${user.email} (ID: ${user.id})`);

    res.json({
      success: true,
      message: 'Password changed successfully. Please login again.'
    });
  } catch (error) {
    logger.error('Change password error:', error);
    res.status(500).json({
      error: 'Server Error',
      message: 'An error occurred while changing password'
    });
  }
};
