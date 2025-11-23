require('dotenv').config();
require('express-async-errors');

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const morgan = require('morgan');
const http = require('http');

const logger = require('./src/utils/logger');
const { initializeDatabase } = require('./src/config/database');
const { initializeRedis } = require('./src/config/redis');
const { initializeWebSocket } = require('./src/config/websocket');
const { initializeMQTT } = require('./src/config/mqtt');
const errorHandler = require('./src/middleware/errorHandler');
const rateLimiter = require('./src/middleware/rateLimit');

// Import routes
const authRoutes = require('./src/routes/auth.routes');
const energyRoutes = require('./src/routes/energy.routes');
const zonesRoutes = require('./src/routes/zones.routes');
const equipmentRoutes = require('./src/routes/equipment.routes');
const analyticsRoutes = require('./src/routes/analytics.routes');
const alertsRoutes = require('./src/routes/alerts.routes');
const settingsRoutes = require('./src/routes/settings.routes');

// Import workers
const dataCollectorWorker = require('./src/workers/dataCollector');
const alertMonitorWorker = require('./src/workers/alertMonitor');
const optimizerWorker = require('./src/workers/optimizer');

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
  res.status(200).json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV,
    version: require('./package.json').version
  });
});

// API Routes
app.use('/api/auth', authRoutes);
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
    documentation: '/docs',
    endpoints: {
      health: '/health',
      auth: '/api/auth',
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

    // Initialize database
    logger.info('Initializing database connection...');
    await initializeDatabase();
    logger.info('Database connected successfully');

    // Initialize Redis
    logger.info('Initializing Redis connection...');
    await initializeRedis();
    logger.info('Redis connected successfully');

    // Initialize WebSocket
    if (process.env.ENABLE_WEBSOCKET === 'true') {
      logger.info('Initializing WebSocket server...');
      initializeWebSocket(server);
      logger.info('WebSocket server initialized');
    }

    // Initialize MQTT
    if (process.env.ENABLE_MQTT === 'true') {
      logger.info('Initializing MQTT client...');
      await initializeMQTT();
      logger.info('MQTT client connected');
    }

    // Start background workers
    logger.info('Starting background workers...');
    dataCollectorWorker.start();
    alertMonitorWorker.start();
    optimizerWorker.start();
    logger.info('Background workers started');

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

  // Stop background workers
  dataCollectorWorker.stop();
  alertMonitorWorker.stop();
  optimizerWorker.stop();
  logger.info('Background workers stopped');

  // Close database connections
  const { sequelize } = require('./src/config/database');
  await sequelize.close();
  logger.info('Database connection closed');

  // Close Redis connection
  const { redisClient } = require('./src/config/redis');
  await redisClient.quit();
  logger.info('Redis connection closed');

  // Close MQTT connection
  if (process.env.ENABLE_MQTT === 'true') {
    const { mqttClient } = require('./src/config/mqtt');
    await mqttClient.end();
    logger.info('MQTT connection closed');
  }

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
