const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Building = sequelize.define('Building', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false
  },
  address: {
    type: DataTypes.STRING,
    allowNull: false
  },
  city: {
    type: DataTypes.STRING
  },
  state: {
    type: DataTypes.STRING
  },
  zipCode: {
    type: DataTypes.STRING
  },
  country: {
    type: DataTypes.STRING,
    defaultValue: 'USA'
  },
  area: {
    type: DataTypes.FLOAT,
    allowNull: false,
    comment: 'Total area in square feet'
  },
  floors: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  timezone: {
    type: DataTypes.STRING,
    defaultValue: 'America/New_York'
  },
  latitude: {
    type: DataTypes.FLOAT
  },
  longitude: {
    type: DataTypes.FLOAT
  },
  baselineConsumption: {
    type: DataTypes.FLOAT,
    comment: 'Baseline energy consumption in kWh per day'
  },
  energyRate: {
    type: DataTypes.FLOAT,
    defaultValue: 0.12,
    comment: 'Energy rate in $ per kWh'
  },
  peakDemandCharge: {
    type: DataTypes.FLOAT,
    defaultValue: 15.0,
    comment: 'Peak demand charge in $ per kW'
  },
  operatingHours: {
    type: DataTypes.JSONB,
    defaultValue: {
      monday: { start: '08:00', end: '18:00' },
      tuesday: { start: '08:00', end: '18:00' },
      wednesday: { start: '08:00', end: '18:00' },
      thursday: { start: '08:00', end: '18:00' },
      friday: { start: '08:00', end: '18:00' },
      saturday: { start: '09:00', end: '14:00' },
      sunday: { start: 'closed', end: 'closed' }
    }
  },
  metadata: {
    type: DataTypes.JSONB,
    defaultValue: {}
  },
  isActive: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  }
}, {
  tableName: 'buildings',
  timestamps: true,
  indexes: [
    {
      fields: ['name']
    },
    {
      fields: ['isActive']
    }
  ]
});

module.exports = Building;
