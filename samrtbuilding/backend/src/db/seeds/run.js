const { sequelize, User, Building, Zone, Equipment } = require('../../models');
const bcrypt = require('bcrypt');
const logger = require('../../utils/logger');

async function runSeeds() {
  try {
    logger.info('Starting database seeding...');
    
    const users = await User.bulkCreate([
      {
        email: 'admin@smartbuilding.com',
        password: await bcrypt.hash('Admin123!', 10),
        firstName: 'Admin',
        lastName: 'User',
        role: 'admin'
      }
    ]);
    
    const building = await Building.create({
      name: 'Main Office',
      address: '123 Energy Way',
      area: 50000,
      floors: 5,
      isActive: true
    });
    
    await Zone.bulkCreate([
      { buildingId: building.id, name: 'Floor 1', floor: 1, area: 10000, setpoint: 72, isActive: true },
      { buildingId: building.id, name: 'Floor 2', floor: 2, area: 10000, setpoint: 72, isActive: true }
    ]);
    
    await Equipment.bulkCreate([
      { buildingId: building.id, name: 'HVAC Unit 1', type: 'hvac', capacity: 15, isActive: true, status: 'online' }
    ]);
    
    logger.info('Database seeding completed!');
  } catch (error) {
    logger.error('Seeding error:', error);
  }
}

if (require.main === module) {
  runSeeds().then(() => process.exit(0)).catch(() => process.exit(1));
}

module.exports = runSeeds;
