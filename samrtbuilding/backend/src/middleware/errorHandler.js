const logger = require('../utils/logger');

/**
 * Custom error classes
 */
class AppError extends Error {
  constructor(message, statusCode = 500) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true;
    Error.captureStackTrace(this, this.constructor);
  }
}

class ValidationError extends AppError {
  constructor(message, errors = []) {
    super(message, 400);
    this.errors = errors;
  }
}

class AuthenticationError extends AppError {
  constructor(message = 'Authentication failed') {
    super(message, 401);
  }
}

class AuthorizationError extends AppError {
  constructor(message = 'Access denied') {
    super(message, 403);
  }
}

class NotFoundError extends AppError {
  constructor(message = 'Resource not found') {
    super(message, 404);
  }
}

class ConflictError extends AppError {
  constructor(message = 'Resource conflict') {
    super(message, 409);
  }
}

class DatabaseError extends AppError {
  constructor(message = 'Database operation failed') {
    super(message, 500);
  }
}

class ExternalServiceError extends AppError {
  constructor(message = 'External service error', serviceName = 'Unknown') {
    super(message, 503);
    this.serviceName = serviceName;
  }
}

/**
 * Global error handler middleware
 */
function errorHandler(err, req, res, next) {
  let error = { ...err };
  error.message = err.message;
  error.stack = err.stack;

  // Log error
  logger.logError(error, req);

  // Set default error values
  let statusCode = error.statusCode || 500;
  let message = error.message || 'Internal Server Error';
  let details = null;

  // Handle specific error types
  if (err.name === 'SequelizeValidationError' || err.name === 'SequelizeUniqueConstraintError') {
    statusCode = 400;
    message = 'Validation Error';
    details = err.errors?.map(e => ({
      field: e.path,
      message: e.message
    }));
  }

  if (err.name === 'SequelizeForeignKeyConstraintError') {
    statusCode = 400;
    message = 'Invalid reference to related resource';
  }

  if (err.name === 'SequelizeDatabaseError') {
    statusCode = 500;
    message = 'Database error occurred';
    if (process.env.NODE_ENV !== 'production') {
      details = err.parent?.message;
    }
  }

  if (err.name === 'JsonWebTokenError') {
    statusCode = 401;
    message = 'Invalid token';
  }

  if (err.name === 'TokenExpiredError') {
    statusCode = 401;
    message = 'Token expired';
  }

  if (err.name === 'ValidationError' && err.errors) {
    statusCode = 400;
    message = 'Validation Error';
    details = err.errors;
  }

  if (err.code === 'ECONNREFUSED') {
    statusCode = 503;
    message = 'Service unavailable';
  }

  if (err.code === 'ETIMEDOUT') {
    statusCode = 504;
    message = 'Request timeout';
  }

  // Construct error response
  const errorResponse = {
    error: message,
    statusCode,
    timestamp: new Date().toISOString(),
    path: req.originalUrl,
    method: req.method
  };

  // Add details in development
  if (process.env.NODE_ENV !== 'production') {
    errorResponse.details = details || error.message;
    errorResponse.stack = error.stack;
  } else if (details) {
    errorResponse.details = details;
  }

  // Add request ID if available
  if (req.id) {
    errorResponse.requestId = req.id;
  }

  // Send error response
  res.status(statusCode).json(errorResponse);
}

/**
 * Handle 404 errors
 */
function notFound(req, res, next) {
  const error = new NotFoundError(`Route ${req.originalUrl} not found`);
  next(error);
}

/**
 * Async error wrapper
 * Wraps async route handlers to catch errors
 */
function asyncHandler(fn) {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

/**
 * Handle unhandled promise rejections
 */
process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled Rejection at:', promise, 'reason:', reason);
  // In production, you might want to gracefully shut down the server
  if (process.env.NODE_ENV === 'production') {
    // Perform graceful shutdown
    process.exit(1);
  }
});

/**
 * Handle uncaught exceptions
 */
process.on('uncaughtException', (error) => {
  logger.error('Uncaught Exception:', error);
  // In production, you should gracefully shut down
  if (process.env.NODE_ENV === 'production') {
    process.exit(1);
  }
});

module.exports = {
  errorHandler,
  notFound,
  asyncHandler,
  AppError,
  ValidationError,
  AuthenticationError,
  AuthorizationError,
  NotFoundError,
  ConflictError,
  DatabaseError,
  ExternalServiceError
};
