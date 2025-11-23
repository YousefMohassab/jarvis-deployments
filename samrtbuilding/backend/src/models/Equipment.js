const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Equipment = sequelize.define('Equipment', {
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
  name: {
    type: DataTypes.STRING,
    allowNull: false
  },
  type: {
    type: DataTypes.ENUM('hvac', 'chiller', 'boiler', 'ahu', 'vav', 'pump', 'fan'),
    allowNull: false
  },
  manufacturer: {
    type: DataTypes.STRING
  },
  model: {
    type: DataTypes.STRING
  },
  serialNumber: {
    type: DataTypes.STRING
  },
  installDate: {
    type: DataTypes.DATE
  },
  capacity: {
    type: DataTypes.FLOAT,
    comment: 'Capacity in tons or kW'
  },
  efficiency: {
    type: DataTypes.FLOAT,
    comment: 'Efficiency rating (SEER, EER, or COP)'
  },
  status: {
    type: DataTypes.ENUM('online', 'offline', 'maintenance', 'error'),
    defaultValue: 'online'
  },
  isRunning: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  currentLoad: {
    type: DataTypes.FLOAT,
    defaultValue: 0,
    comment: 'Current load percentage (0-100)'
  },
  powerConsumption: {
    type: DataTypes.FLOAT,
    defaultValue: 0,
    comment: 'Current power consumption in kW'
  },
  protocol: {
    type: DataTypes.ENUM('bacnet', 'modbus', 'mqtt'),
    defaultValue: 'bacnet'
  },
  deviceAddress: {
    type: DataTypes.STRING,
    comment: 'Device address for communication protocol'
  },
  controlPoints: {
    type: DataTypes.JSONB,
    defaultValue: {},
    comment: 'Control points and their current values'
  },
  lastMaintenance: {
    type: DataTypes.DATE
  },
  nextMaintenance: {
    type: DataTypes.DATE
  },
  operatingHours: {
    type: DataTypes.FLOAT,
    defaultValue: 0,
    comment: 'Total operating hours'
  },
  alarms: {
    type: DataTypes.JSONB,
    defaultValue: [],
    comment: 'Active alarms and warnings'
  },
  isActive: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  },
  metadata: {
    type: DataTypes.JSONB,
    defaultValue: {}
  }
}, {
  tableName: 'equipment',
  timestamps: true,
  indexes: [
    {
      fields: ['buildingId']
    },
    {
      fields: ['zoneId']
    },
    {
      fields: ['type']
    },
    {
      fields: ['status']
    },
    {
      fields: ['isActive']
    }
  ]
});

module.exports = Equipment;
