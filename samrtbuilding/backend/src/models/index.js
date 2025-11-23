const { sequelize } = require('../config/database');
const User = require('./User');
const Building = require('./Building');
const Zone = require('./Zone');
const Equipment = require('./Equipment');
const Sensor = require('./Sensor');
const EnergyReading = require('./EnergyReading');
const Alert = require('./Alert');
const Schedule = require('./Schedule');

// Define associations
Building.hasMany(Zone, { foreignKey: 'buildingId', as: 'zones' });
Zone.belongsTo(Building, { foreignKey: 'buildingId', as: 'building' });

Building.hasMany(Equipment, { foreignKey: 'buildingId', as: 'equipment' });
Equipment.belongsTo(Building, { foreignKey: 'buildingId', as: 'building' });

Zone.hasMany(Equipment, { foreignKey: 'zoneId', as: 'equipment' });
Equipment.belongsTo(Zone, { foreignKey: 'zoneId', as: 'zone' });

Building.hasMany(Sensor, { foreignKey: 'buildingId', as: 'sensors' });
Sensor.belongsTo(Building, { foreignKey: 'buildingId', as: 'building' });

Zone.hasMany(Sensor, { foreignKey: 'zoneId', as: 'sensors' });
Sensor.belongsTo(Zone, { foreignKey: 'zoneId', as: 'zone' });

Equipment.hasMany(Sensor, { foreignKey: 'equipmentId', as: 'sensors' });
Sensor.belongsTo(Equipment, { foreignKey: 'equipmentId', as: 'equipment' });

Building.hasMany(EnergyReading, { foreignKey: 'buildingId', as: 'energyReadings' });
EnergyReading.belongsTo(Building, { foreignKey: 'buildingId', as: 'building' });

Zone.hasMany(EnergyReading, { foreignKey: 'zoneId', as: 'energyReadings' });
EnergyReading.belongsTo(Zone, { foreignKey: 'zoneId', as: 'zone' });

Equipment.hasMany(EnergyReading, { foreignKey: 'equipmentId', as: 'energyReadings' });
EnergyReading.belongsTo(Equipment, { foreignKey: 'equipmentId', as: 'equipment' });

Building.hasMany(Alert, { foreignKey: 'buildingId', as: 'alerts' });
Alert.belongsTo(Building, { foreignKey: 'buildingId', as: 'building' });

Zone.hasMany(Alert, { foreignKey: 'zoneId', as: 'alerts' });
Alert.belongsTo(Zone, { foreignKey: 'zoneId', as: 'zone' });

Equipment.hasMany(Alert, { foreignKey: 'equipmentId', as: 'alerts' });
Alert.belongsTo(Equipment, { foreignKey: 'equipmentId', as: 'equipment' });

User.hasMany(Alert, { foreignKey: 'acknowledgedBy', as: 'acknowledgedAlerts' });
Alert.belongsTo(User, { foreignKey: 'acknowledgedBy', as: 'acknowledger' });

User.hasMany(Alert, { foreignKey: 'resolvedBy', as: 'resolvedAlerts' });
Alert.belongsTo(User, { foreignKey: 'resolvedBy', as: 'resolver' });

Building.hasMany(Schedule, { foreignKey: 'buildingId', as: 'schedules' });
Schedule.belongsTo(Building, { foreignKey: 'buildingId', as: 'building' });

Zone.hasMany(Schedule, { foreignKey: 'zoneId', as: 'schedules' });
Schedule.belongsTo(Zone, { foreignKey: 'zoneId', as: 'zone' });

Equipment.hasMany(Schedule, { foreignKey: 'equipmentId', as: 'schedules' });
Schedule.belongsTo(Equipment, { foreignKey: 'equipmentId', as: 'equipment' });

module.exports = {
  sequelize,
  User,
  Building,
  Zone,
  Equipment,
  Sensor,
  EnergyReading,
  Alert,
  Schedule
};
