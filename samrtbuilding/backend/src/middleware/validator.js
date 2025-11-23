const { validationResult, body, param, query } = require('express-validator');
const logger = require('../utils/logger');

/**
 * Validation result handler
 */
function handleValidationErrors(req, res, next) {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    const formattedErrors = errors.array().map(error => ({
      field: error.param || error.path,
      message: error.msg,
      value: error.value
    }));

    logger.warn('Validation errors:', formattedErrors);

    return res.status(400).json({
      error: 'Validation Error',
      details: formattedErrors
    });
  }

  next();
}

/**
 * Common validation rules
 */
const validationRules = {
  // Email validation
  email: () =>
    body('email')
      .isEmail()
      .normalizeEmail()
      .withMessage('Valid email is required'),

  // Password validation
  password: (minLength = 8) =>
    body('password')
      .isLength({ min: minLength })
      .withMessage(`Password must be at least ${minLength} characters long`)
      .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
      .withMessage('Password must contain at least one uppercase letter, one lowercase letter, and one number'),

  // ID parameter validation
  id: (paramName = 'id') =>
    param(paramName)
      .isInt({ min: 1 })
      .withMessage('Valid ID is required'),

  // Temperature validation
  temperature: (field = 'temperature') =>
    body(field)
      .isFloat({ min: -40, max: 140 })
      .withMessage('Temperature must be between -40 and 140°F'),

  // Setpoint validation
  setpoint: () =>
    body('setpoint')
      .isFloat({ min: 60, max: 85 })
      .withMessage('Setpoint must be between 60 and 85°F'),

  // Date validation
  date: (field = 'date') =>
    body(field)
      .isISO8601()
      .toDate()
      .withMessage('Valid ISO 8601 date is required'),

  // Date range validation
  dateRange: () => [
    query('startDate')
      .optional()
      .isISO8601()
      .toDate()
      .withMessage('Valid start date is required'),
    query('endDate')
      .optional()
      .isISO8601()
      .toDate()
      .withMessage('Valid end date is required')
      .custom((endDate, { req }) => {
        if (req.query.startDate && new Date(endDate) < new Date(req.query.startDate)) {
          throw new Error('End date must be after start date');
        }
        return true;
      })
  ],

  // Pagination validation
  pagination: () => [
    query('page')
      .optional()
      .isInt({ min: 1 })
      .withMessage('Page must be a positive integer')
      .toInt(),
    query('limit')
      .optional()
      .isInt({ min: 1, max: 100 })
      .withMessage('Limit must be between 1 and 100')
      .toInt(),
    query('sortBy')
      .optional()
      .isString()
      .withMessage('Sort field must be a string'),
    query('sortOrder')
      .optional()
      .isIn(['asc', 'desc'])
      .withMessage('Sort order must be asc or desc')
  ],

  // Zone validation
  zone: () => [
    body('name')
      .optional()
      .isString()
      .trim()
      .isLength({ min: 2, max: 100 })
      .withMessage('Zone name must be between 2 and 100 characters'),
    body('mode')
      .optional()
      .isIn(['heat', 'cool', 'auto', 'off'])
      .withMessage('Invalid zone mode')
  ],

  // Equipment control validation
  equipmentControl: () => [
    body('action')
      .isIn(['start', 'stop', 'restart', 'setpoint'])
      .withMessage('Invalid control action'),
    body('value')
      .optional()
      .custom((value, { req }) => {
        if (req.body.action === 'setpoint' && (typeof value !== 'number' || value < 60 || value > 85)) {
          throw new Error('Setpoint value must be between 60 and 85');
        }
        return true;
      })
  ],

  // Alert settings validation
  alertSettings: () => [
    body('type')
      .isIn(['temperature', 'humidity', 'energy', 'equipment', 'maintenance'])
      .withMessage('Invalid alert type'),
    body('threshold')
      .optional()
      .isNumeric()
      .withMessage('Threshold must be a number'),
    body('comparison')
      .optional()
      .isIn(['greater', 'less', 'equal'])
      .withMessage('Invalid comparison operator')
  ],

  // Building validation
  building: () => [
    body('name')
      .isString()
      .trim()
      .isLength({ min: 2, max: 200 })
      .withMessage('Building name must be between 2 and 200 characters'),
    body('address')
      .isString()
      .trim()
      .notEmpty()
      .withMessage('Address is required'),
    body('area')
      .isFloat({ min: 1 })
      .withMessage('Area must be a positive number'),
    body('floors')
      .isInt({ min: 1 })
      .withMessage('Number of floors must be a positive integer')
  ],

  // Equipment validation
  equipment: () => [
    body('name')
      .isString()
      .trim()
      .isLength({ min: 2, max: 100 })
      .withMessage('Equipment name must be between 2 and 100 characters'),
    body('type')
      .isIn(['hvac', 'chiller', 'boiler', 'ahu', 'vav', 'pump', 'fan'])
      .withMessage('Invalid equipment type'),
    body('capacity')
      .optional()
      .isFloat({ min: 0 })
      .withMessage('Capacity must be a positive number')
  ]
};

/**
 * Sanitization middleware
 */
function sanitizeInputs(req, res, next) {
  // Trim all string values in body
  if (req.body && typeof req.body === 'object') {
    Object.keys(req.body).forEach(key => {
      if (typeof req.body[key] === 'string') {
        req.body[key] = req.body[key].trim();
      }
    });
  }

  // Trim all string values in query
  if (req.query && typeof req.query === 'object') {
    Object.keys(req.query).forEach(key => {
      if (typeof req.query[key] === 'string') {
        req.query[key] = req.query[key].trim();
      }
    });
  }

  next();
}

/**
 * Custom validators
 */
const customValidators = {
  isValidTimeRange: (startTime, endTime) => {
    const start = new Date(startTime);
    const end = new Date(endTime);
    return start < end && (end - start) <= 365 * 24 * 60 * 60 * 1000;
  },

  isValidTemperature: (value) => {
    return value >= -40 && value <= 140;
  },

  isValidHumidity: (value) => {
    return value >= 0 && value <= 100;
  },

  isValidCoordinate: (lat, lon) => {
    return lat >= -90 && lat <= 90 && lon >= -180 && lon <= 180;
  }
};

module.exports = {
  handleValidationErrors,
  validationRules,
  sanitizeInputs,
  customValidators
};
