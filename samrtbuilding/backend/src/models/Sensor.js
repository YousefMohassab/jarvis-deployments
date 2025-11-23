const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Sensor = sequelize.define('Sensor', {
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
  name: {
    type: DataTypes.STRING,
    allowNull: false
  },
  type: {
    type: DataTypes.ENUM('temperature', 'humidity', 'occupancy', 'co2', 'pressure', 'power', 'flow'),
    allowNull: false
  },
  unit: {
    type: DataTypes.STRING,
    comment: 'Measurement unit (F, %, ppm, kW, etc.)'
  },
  currentValue: {
    type: DataTypes.FLOAT
  },
  minValue: {
    type: DataTypes.FLOAT
  },
  maxValue: {
    type: DataTypes.FLOAT
  },
  lastReading: {
    type: DataTypes.DATE
  },
  protocol: {
    type: DataTypes.ENUM('bacnet', 'modbus', 'mqtt'),
    defaultValue: 'bacnet'
  },
  deviceAddress: {
    type: DataTypes.STRING
  },
  calibrationDate: {
    type: DataTypes.DATE
  },
  calibrationDue: {
    type: DataTypes.DATE
  },
  status: {
    type: DataTypes.ENUM('online', 'offline', 'error', 'calibration'),
    defaultValue: 'online'
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
  tableName: 'sensors',
  timestamps: true,
  indexes: [
    {
      fields: ['buildingId']
    },
    {
      fields: ['zoneId']
    },
    {
      fields: ['equipmentId']
    },
    {
      fields: ['type']
    },
    {
      fields: ['status']
    }
  ]
});

module.exports = Sensor;
