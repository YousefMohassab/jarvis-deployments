const Joi = require('joi');

/**
 * Validation schemas for API requests
 */

const schemas = {
  // Authentication
  login: Joi.object({
    email: Joi.string().email().required(),
    password: Joi.string().min(6).required()
  }),

  register: Joi.object({
    email: Joi.string().email().required(),
    password: Joi.string().min(8).required(),
    firstName: Joi.string().min(2).required(),
    lastName: Joi.string().min(2).required(),
    role: Joi.string().valid('admin', 'manager', 'operator', 'viewer').default('viewer')
  }),

  // Zone management
  updateZone: Joi.object({
    name: Joi.string().min(2).max(100),
    setpoint: Joi.number().min(60).max(85),
    mode: Joi.string().valid('heat', 'cool', 'auto', 'off'),
    schedule: Joi.object()
  }),

  setpoint: Joi.object({
    temperature: Joi.number().min(60).max(85).required(),
    mode: Joi.string().valid('heat', 'cool', 'auto').default('auto')
  }),

  // Equipment control
  equipmentControl: Joi.object({
    action: Joi.string().valid('start', 'stop', 'restart', 'setpoint').required(),
    value: Joi.any()
  }),

  // Energy query
  energyQuery: Joi.object({
    startDate: Joi.date().iso(),
    endDate: Joi.date().iso().min(Joi.ref('startDate')),
    interval: Joi.string().valid('1min', '5min', '15min', '1hour', '1day').default('15min'),
    zoneId: Joi.number().integer().positive(),
    equipmentId: Joi.number().integer().positive()
  }),

  // Analytics report
  analyticsReport: Joi.object({
    reportType: Joi.string().valid('consumption', 'savings', 'efficiency', 'trends').required(),
    startDate: Joi.date().iso().required(),
    endDate: Joi.date().iso().min(Joi.ref('startDate')).required(),
    format: Joi.string().valid('json', 'csv', 'pdf').default('json'),
    zoneIds: Joi.array().items(Joi.number().integer().positive()),
    equipmentIds: Joi.array().items(Joi.number().integer().positive())
  }),

  // Alert settings
  alertSettings: Joi.object({
    type: Joi.string().valid('temperature', 'humidity', 'energy', 'equipment', 'maintenance').required(),
    enabled: Joi.boolean().default(true),
    threshold: Joi.number(),
    comparison: Joi.string().valid('greater', 'less', 'equal'),
    notification: Joi.object({
      email: Joi.boolean().default(true),
      sms: Joi.boolean().default(false),
      push: Joi.boolean().default(true)
    })
  }),

  // Pagination
  pagination: Joi.object({
    page: Joi.number().integer().min(1).default(1),
    limit: Joi.number().integer().min(1).max(100).default(20),
    sortBy: Joi.string(),
    sortOrder: Joi.string().valid('asc', 'desc').default('desc')
  }),

  // Date range
  dateRange: Joi.object({
    startDate: Joi.date().iso().required(),
    endDate: Joi.date().iso().min(Joi.ref('startDate')).required()
  }),

  // ID parameter
  id: Joi.object({
    id: Joi.number().integer().positive().required()
  }),

  // Building creation
  createBuilding: Joi.object({
    name: Joi.string().min(2).max(200).required(),
    address: Joi.string().required(),
    area: Joi.number().positive().required(),
    floors: Joi.number().integer().positive().required(),
    timezone: Joi.string().default('America/New_York')
  }),

  // Zone creation
  createZone: Joi.object({
    buildingId: Joi.number().integer().positive().required(),
    name: Joi.string().min(2).max(100).required(),
    floor: Joi.number().integer().positive().required(),
    area: Joi.number().positive().required(),
    setpoint: Joi.number().min(60).max(85).default(72),
    mode: Joi.string().valid('heat', 'cool', 'auto', 'off').default('auto')
  }),

  // Equipment creation
  createEquipment: Joi.object({
    buildingId: Joi.number().integer().positive().required(),
    zoneId: Joi.number().integer().positive(),
    name: Joi.string().min(2).max(100).required(),
    type: Joi.string().valid('hvac', 'chiller', 'boiler', 'ahu', 'vav', 'pump', 'fan').required(),
    manufacturer: Joi.string(),
    model: Joi.string(),
    capacity: Joi.number().positive(),
    protocol: Joi.string().valid('bacnet', 'modbus', 'mqtt').default('bacnet')
  }),

  // Maintenance log
  maintenanceLog: Joi.object({
    equipmentId: Joi.number().integer().positive().required(),
    type: Joi.string().valid('preventive', 'corrective', 'inspection').required(),
    description: Joi.string().required(),
    performedBy: Joi.string().required(),
    cost: Joi.number().min(0),
    nextScheduled: Joi.date().iso()
  })
};

/**
 * Validate request data against a schema
 * @param {Object} data - Data to validate
 * @param {string} schemaName - Name of the schema to use
 * @returns {Object} Validation result
 */
function validate(data, schemaName) {
  const schema = schemas[schemaName];

  if (!schema) {
    throw new Error(`Schema '${schemaName}' not found`);
  }

  const { error, value } = schema.validate(data, {
    abortEarly: false,
    stripUnknown: true
  });

  if (error) {
    const errors = error.details.map(detail => ({
      field: detail.path.join('.'),
      message: detail.message
    }));

    return {
      isValid: false,
      errors,
      value: null
    };
  }

  return {
    isValid: true,
    errors: [],
    value
  };
}

/**
 * Express middleware for validation
 * @param {string} schemaName - Name of the schema to use
 * @param {string} source - Source of data ('body', 'query', 'params')
 * @returns {Function} Express middleware
 */
function validateRequest(schemaName, source = 'body') {
  return (req, res, next) => {
    const data = req[source];
    const result = validate(data, schemaName);

    if (!result.isValid) {
      return res.status(400).json({
        error: 'Validation Error',
        details: result.errors
      });
    }

    // Replace request data with validated and sanitized value
    req[source] = result.value;
    next();
  };
}

/**
 * Custom validators
 */
const customValidators = {
  isValidTemperature(value) {
    return value >= -40 && value <= 140;
  },

  isValidHumidity(value) {
    return value >= 0 && value <= 100;
  },

  isValidPowerReading(value) {
    return value >= 0;
  },

  isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  },

  isValidPhoneNumber(phone) {
    const phoneRegex = /^\+?[\d\s\-()]+$/;
    return phoneRegex.test(phone) && phone.replace(/\D/g, '').length >= 10;
  },

  isValidTimeRange(startTime, endTime) {
    const start = new Date(startTime);
    const end = new Date(endTime);
    return start < end && end - start <= 365 * 24 * 60 * 60 * 1000; // Max 1 year
  }
};

module.exports = {
  schemas,
  validate,
  validateRequest,
  customValidators
};
