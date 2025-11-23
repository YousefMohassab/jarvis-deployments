const { Sequelize } = require('sequelize');
const logger = require('../utils/logger');

const sequelize = new Sequelize({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'smart_building',
  username: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'password',
  dialect: 'postgres',
  logging: process.env.DB_LOGGING === 'true' ? (msg) => logger.debug(msg) : false,
  pool: {
    max: 10,
    min: 0,
    acquire: 30000,
    idle: 10000
  },
  define: {
    timestamps: true,
    underscored: true,
    freezeTableName: true
  }
});

async function initializeDatabase() {
  try {
    // Test connection
    await sequelize.authenticate();
    logger.info('Database connection established successfully');

    // Enable TimescaleDB extension
    try {
      await sequelize.query('CREATE EXTENSION IF NOT EXISTS timescaledb CASCADE;');
      logger.info('TimescaleDB extension enabled');
    } catch (error) {
      logger.warn('TimescaleDB extension could not be enabled. Time-series features may be limited.');
    }

    // Sync models (in development)
    if (process.env.NODE_ENV === 'development') {
      await sequelize.sync({ alter: false });
      logger.info('Database models synchronized');
    }

    return sequelize;
  } catch (error) {
    logger.error('Unable to connect to database:', error);
    throw error;
  }
}

module.exports = {
  sequelize,
  initializeDatabase
};
