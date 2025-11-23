const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const EnergyReading = sequelize.define('EnergyReading', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  timestamp: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW
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
  powerKw: {
    type: DataTypes.FLOAT,
    allowNull: false,
    comment: 'Power consumption in kW'
  },
  energyKwh: {
    type: DataTypes.FLOAT,
    comment: 'Cumulative energy consumption in kWh'
  },
  voltage: {
    type: DataTypes.FLOAT
  },
  current: {
    type: DataTypes.FLOAT
  },
  powerFactor: {
    type: DataTypes.FLOAT
  },
  frequency: {
    type: DataTypes.FLOAT
  },
  temperature: {
    type: DataTypes.FLOAT
  },
  humidity: {
    type: DataTypes.FLOAT
  },
  occupancy: {
    type: DataTypes.INTEGER
  },
  outdoorTemp: {
    type: DataTypes.FLOAT
  },
  cost: {
    type: DataTypes.FLOAT,
    comment: 'Cost in dollars'
  },
  readingType: {
    type: DataTypes.ENUM('actual', 'estimated', 'forecast'),
    defaultValue: 'actual'
  },
  metadata: {
    type: DataTypes.JSONB,
    defaultValue: {}
  }
}, {
  tableName: 'energy_readings',
  timestamps: false,
  indexes: [
    {
      fields: ['timestamp', 'buildingId']
    },
    {
      fields: ['buildingId', 'timestamp']
    },
    {
      fields: ['zoneId', 'timestamp']
    },
    {
      fields: ['equipmentId', 'timestamp']
    },
    {
      fields: ['readingType']
    }
  ]
});

// After model is defined, create hypertable (for TimescaleDB)
// This should be called after table creation
EnergyReading.createHypertable = async function() {
  try {
    await sequelize.query(`
      SELECT create_hypertable(
        'energy_readings',
        'timestamp',
        if_not_exists => TRUE,
        chunk_time_interval => INTERVAL '1 day'
      );
    `);
    console.log('Hypertable created successfully for energy_readings');
  } catch (error) {
    console.warn('Could not create hypertable (TimescaleDB may not be available):', error.message);
  }
};

module.exports = EnergyReading;
