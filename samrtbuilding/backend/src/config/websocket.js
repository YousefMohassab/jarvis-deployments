const { Server } = require('socket.io');
const jwt = require('jsonwebtoken');
const logger = require('../utils/logger');

let io = null;

function initializeWebSocket(server) {
  io = new Server(server, {
    cors: {
      origin: process.env.CORS_ORIGIN || '*',
      methods: ['GET', 'POST'],
      credentials: true
    },
    pingTimeout: 60000,
    pingInterval: 25000
  });

  // Authentication middleware
  io.use((socket, next) => {
    const token = socket.handshake.auth.token || socket.handshake.query.token;

    if (!token) {
      return next(new Error('Authentication token required'));
    }

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      socket.userId = decoded.id;
      socket.userRole = decoded.role;
      next();
    } catch (error) {
      logger.error('WebSocket authentication error:', error);
      next(new Error('Invalid authentication token'));
    }
  });

  // Connection handling
  io.on('connection', (socket) => {
    logger.info(`WebSocket client connected: ${socket.id} (User: ${socket.userId})`);

    // Join user-specific room
    socket.join(`user:${socket.userId}`);

    // Join building-specific rooms based on user permissions
    socket.on('join:building', (buildingId) => {
      socket.join(`building:${buildingId}`);
      logger.info(`User ${socket.userId} joined building room: ${buildingId}`);
    });

    // Join zone-specific rooms
    socket.on('join:zone', (zoneId) => {
      socket.join(`zone:${zoneId}`);
      logger.info(`User ${socket.userId} joined zone room: ${zoneId}`);
    });

    // Leave rooms
    socket.on('leave:building', (buildingId) => {
      socket.leave(`building:${buildingId}`);
      logger.info(`User ${socket.userId} left building room: ${buildingId}`);
    });

    socket.on('leave:zone', (zoneId) => {
      socket.leave(`zone:${zoneId}`);
      logger.info(`User ${socket.userId} left zone room: ${zoneId}`);
    });

    // Handle disconnection
    socket.on('disconnect', (reason) => {
      logger.info(`WebSocket client disconnected: ${socket.id} (Reason: ${reason})`);
    });

    // Handle errors
    socket.on('error', (error) => {
      logger.error(`WebSocket error for client ${socket.id}:`, error);
    });

    // Send initial connection success
    socket.emit('connected', {
      message: 'Successfully connected to Smart Building WebSocket',
      timestamp: new Date().toISOString()
    });
  });

  logger.info('WebSocket server initialized');
  return io;
}

// Emit functions for different event types
const emit = {
  // Energy update to specific building
  energyUpdate(buildingId, data) {
    if (io) {
      io.to(`building:${buildingId}`).emit('energy:update', {
        ...data,
        timestamp: new Date().toISOString()
      });
    }
  },

  // Zone update
  zoneUpdate(zoneId, data) {
    if (io) {
      io.to(`zone:${zoneId}`).emit('zone:update', {
        ...data,
        timestamp: new Date().toISOString()
      });
    }
  },

  // Equipment status update
  equipmentStatus(buildingId, data) {
    if (io) {
      io.to(`building:${buildingId}`).emit('equipment:status', {
        ...data,
        timestamp: new Date().toISOString()
      });
    }
  },

  // New alert
  newAlert(buildingId, alert) {
    if (io) {
      io.to(`building:${buildingId}`).emit('alert:new', {
        ...alert,
        timestamp: new Date().toISOString()
      });
    }
  },

  // System status
  systemStatus(buildingId, status) {
    if (io) {
      io.to(`building:${buildingId}`).emit('system:status', {
        ...status,
        timestamp: new Date().toISOString()
      });
    }
  },

  // Broadcast to all connected clients
  broadcast(event, data) {
    if (io) {
      io.emit(event, {
        ...data,
        timestamp: new Date().toISOString()
      });
    }
  },

  // Send to specific user
  toUser(userId, event, data) {
    if (io) {
      io.to(`user:${userId}`).emit(event, {
        ...data,
        timestamp: new Date().toISOString()
      });
    }
  }
};

function getIO() {
  if (!io) {
    throw new Error('WebSocket not initialized. Call initializeWebSocket first.');
  }
  return io;
}

module.exports = {
  initializeWebSocket,
  getIO,
  emit
};
