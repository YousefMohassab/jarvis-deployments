const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Alert = sequelize.define('Alert', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  buildingId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'buildings',
      key: 'id'
    }
  },
  zoneId: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'zones',
      key: 'id'
    }
  },
  equipmentId: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'equipment',
      key: 'id'
    }
  },
  type: {
    type: DataTypes.ENUM('temperature', 'humidity', 'energy', 'equipment', 'maintenance', 'system'),
    allowNull: false
  },
  severity: {
    type: DataTypes.ENUM('info', 'warning', 'critical'),
    allowNull: false,
    defaultValue: 'warning'
  },
  title: {
    type: DataTypes.STRING,
    allowNull: false
  },
  message: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  value: {
    type: DataTypes.FLOAT,
    comment: 'The value that triggered the alert'
  },
  threshold: {
    type: DataTypes.FLOAT,
    comment: 'The threshold that was exceeded'
  },
  status: {
    type: DataTypes.ENUM('active', 'acknowledged', 'resolved'),
    defaultValue: 'active'
  },
  acknowledgedBy: {
    type: DataTypes.INTEGER,
    references: {
      model: 'users',
      key: 'id'
    }
  },
  acknowledgedAt: {
    type: DataTypes.DATE
  },
  resolvedBy: {
    type: DataTypes.INTEGER,
    references: {
      model: 'users',
      key: 'id'
    }
  },
  resolvedAt: {
    type: DataTypes.DATE
  },
  resolution: {
    type: DataTypes.TEXT
  },
  notificationsSent: {
    type: DataTypes.JSONB,
    defaultValue: [],
    comment: 'Array of notification types sent (email, sms, push)'
  },
  metadata: {
    type: DataTypes.JSONB,
    defaultValue: {}
  }
}, {
  tableName: 'alerts',
  timestamps: true,
  indexes: [
    {
      fields: ['buildingId']
    },
    {
      fields: ['status']
    },
    {
      fields: ['severity']
    },
    {
      fields: ['type']
    },
    {
      fields: ['createdAt']
    },
    {
      fields: ['buildingId', 'status', 'severity']
    }
  ]
});

module.exports = Alert;
