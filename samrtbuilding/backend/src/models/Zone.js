const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Zone = sequelize.define('Zone', {
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
  name: {
    type: DataTypes.STRING,
    allowNull: false
  },
  floor: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  area: {
    type: DataTypes.FLOAT,
    allowNull: false,
    comment: 'Area in square feet'
  },
  currentTemperature: {
    type: DataTypes.FLOAT,
    comment: 'Current temperature in Fahrenheit'
  },
  currentHumidity: {
    type: DataTypes.FLOAT,
    comment: 'Current humidity percentage'
  },
  setpoint: {
    type: DataTypes.FLOAT,
    defaultValue: 72,
    comment: 'Target temperature in Fahrenheit'
  },
  mode: {
    type: DataTypes.ENUM('heat', 'cool', 'auto', 'off'),
    defaultValue: 'auto'
  },
  occupancy: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    comment: 'Current number of occupants'
  },
  maxOccupancy: {
    type: DataTypes.INTEGER,
    comment: 'Maximum occupancy'
  },
  schedule: {
    type: DataTypes.JSONB,
    defaultValue: {},
    comment: 'Temperature schedule by day and time'
  },
  sensors: {
    type: DataTypes.JSONB,
    defaultValue: [],
    comment: 'Associated sensor IDs'
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
  tableName: 'zones',
  timestamps: true,
  indexes: [
    {
      fields: ['buildingId']
    },
    {
      fields: ['buildingId', 'floor']
    },
    {
      fields: ['isActive']
    }
  ]
});

module.exports = Zone;
