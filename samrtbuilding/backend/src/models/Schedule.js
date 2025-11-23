const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Schedule = sequelize.define('Schedule', {
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
    type: DataTypes.ENUM('temperature', 'occupancy', 'operation', 'maintenance'),
    allowNull: false
  },
  schedule: {
    type: DataTypes.JSONB,
    allowNull: false,
    comment: 'Schedule definition with days, times, and values'
  },
  priority: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    comment: 'Higher priority schedules override lower ones'
  },
  isActive: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  },
  startDate: {
    type: DataTypes.DATE
  },
  endDate: {
    type: DataTypes.DATE
  },
  metadata: {
    type: DataTypes.JSONB,
    defaultValue: {}
  }
}, {
  tableName: 'schedules',
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
      fields: ['isActive']
    }
  ]
});

module.exports = Schedule;
