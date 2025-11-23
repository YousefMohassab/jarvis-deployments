const logger = require('../utils/logger');

class ModbusService {
  constructor() {
    this.isEnabled = process.env.ENABLE_MODBUS === 'true';
  }

  async initialize() {
    if (this.isEnabled) {
      logger.info('Modbus service initialized (mock mode)');
    }
  }

  async readHoldingRegisters(address, register, length) {
    return { data: [0, 0] };
  }

  async writeRegister(address, register, value) {
    return true;
  }
}

module.exports = new ModbusService();
