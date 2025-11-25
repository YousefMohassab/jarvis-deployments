require('dotenv').config();
require('express-async-errors');

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const morgan = require('morgan');
const http = require('http');

const logger = require('./src/utils/logger');
const csvDataService = require('./src/services/csvDataService');
const { errorHandler } = require('./src/middleware/errorHandler');
const rateLimiter = require('./src/middleware/rateLimit');

// Import routes
const energyRoutes = require('./src/routes/energy.routes');
const zonesRoutes = require('./src/routes/zones.routes');
const equipmentRoutes = require('./src/routes/equipment.routes');
const analyticsRoutes = require('./src/routes/analytics.routes');
const alertsRoutes = require('./src/routes/alerts.routes');
const settingsRoutes = require('./src/routes/settings.routes');

const app = express();
const server = http.createServer(app);
const PORT = process.env.PORT || 8000;

// Security middleware
app.use(helmet());
app.use(cors({
  origin: process.env.CORS_ORIGIN || '*',
  credentials: true
}));

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Compression
app.use(compression());

// Logging
if (process.env.NODE_ENV !== 'test') {
  app.use(morgan('combined', { stream: logger.stream }));
}

// Rate limiting
app.use(rateLimiter);

// Health check endpoint
app.get('/health', (req, res) => {
  const stats = csvDataService.getStatistics();

  res.status(200).json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV,
    version: require('./package.json').version,
    dataLoaded: stats.initialized,
    stats
  });
});

// API Routes
app.use('/api/energy', energyRoutes);
app.use('/api/zones', zonesRoutes);
app.use('/api/equipment', equipmentRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/alerts', alertsRoutes);
app.use('/api/settings', settingsRoutes);

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    name: 'Smart Building Energy Management API',
    version: '1.0.0',
    status: 'running',
    dataSource: 'CSV',
    documentation: '/docs',
    endpoints: {
      health: '/health',
      energy: '/api/energy',
      zones: '/api/zones',
      equipment: '/api/equipment',
      analytics: '/api/analytics',
      alerts: '/api/alerts',
      settings: '/api/settings'
    }
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    error: 'Not Found',
    message: `Cannot ${req.method} ${req.path}`,
    timestamp: new Date().toISOString()
  });
});

// Global error handler (must be last)
app.use(errorHandler);

// Initialize and start server
async function startServer() {
  try {
    logger.info('Starting Smart Building Energy Management System...');

    // Initialize CSV data service
    logger.info('Loading CSV data...');
    await csvDataService.initialize();
    logger.info('CSV data loaded successfully');

    const stats = csvDataService.getStatistics();
    logger.info(`Data summary:
      - Buildings: ${stats.buildings}
      - Zones: ${stats.zones}
      - Equipment: ${stats.equipment}
      - Sensors: ${stats.sensors}
      - Alerts: ${stats.alerts}
      - Energy Readings: ${stats.energyReadings}
    `);

    // Start server
    server.listen(PORT, () => {
      logger.info(`Server running on port ${PORT} in ${process.env.NODE_ENV} mode`);
      logger.info(`Health check available at http://localhost:${PORT}/health`);
      logger.info(`API documentation available at http://localhost:${PORT}/docs`);
    });

  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
}

// Graceful shutdown
process.on('SIGTERM', gracefulShutdown);
process.on('SIGINT', gracefulShutdown);

async function gracefulShutdown() {
  logger.info('Received shutdown signal, closing server gracefully...');

  // Stop accepting new connections
  server.close(() => {
    logger.info('HTTP server closed');
  });

  logger.info('Graceful shutdown completed');
  process.exit(0);
}

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  logger.error('Uncaught Exception:', error);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

// Start the server
if (require.main === module) {
  startServer();
}

module.exports = { app, server };
