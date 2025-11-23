const logger = require('../utils/logger');

/**
 * BACnet Service - Mock implementation for demonstration
 * In production, use 'node-bacnet' library for actual BACnet communication
 */

class BACnetService {
  constructor() {
    this.isEnabled = process.env.ENABLE_BACNET === 'true';
    this.isMockMode = process.env.ENABLE_MOCK_DEVICES === 'true';
    this.devices = new Map();
    this.client = null;
  }

  /**
   * Initialize BACnet client
   */
  async initialize() {
    if (!this.isEnabled) {
      logger.info('BACnet service is disabled');
      return;
    }

    try {
      if (this.isMockMode) {
        logger.info('BACnet service initialized in MOCK mode');
        this.initializeMockDevices();
      } else {
        // In production, initialize actual BACnet client
        // const bacnet = require('node-bacnet');
        // this.client = new bacnet({
        //   interface: process.env.BACNET_INTERFACE,
        //   port: parseInt(process.env.BACNET_PORT),
        //   broadcastAddress: process.env.BACNET_BROADCAST_ADDRESS
        // });
        logger.info('BACnet service initialized');
      }
    } catch (error) {
      logger.error('Failed to initialize BACnet service:', error);
      throw error;
    }
  }

  /**
   * Initialize mock BACnet devices
   */
  initializeMockDevices() {
    // Mock HVAC Unit 1
    this.devices.set('192.168.1.100', {
      deviceId: 100,
      name: 'HVAC Unit 1',
      type: 'hvac',
      objects: {
        temperature: { value: 72.5, unit: 'F' },
        setpoint: { value: 72.0, unit: 'F' },
        fanSpeed: { value: 75, unit: '%' },
        mode: { value: 'cool', unit: 'enum' },
        status: { value: 'online', unit: 'enum' },
        power: { value: 12.5, unit: 'kW' }
      }
    });

    // Mock Chiller 1
    this.devices.set('192.168.1.101', {
      deviceId: 101,
      name: 'Chiller 1',
      type: 'chiller',
      objects: {
        supplyTemp: { value: 44.0, unit: 'F' },
        returnTemp: { value: 54.0, unit: 'F' },
        setpoint: { value: 44.0, unit: 'F' },
        load: { value: 80, unit: '%' },
        status: { value: 'online', unit: 'enum' },
        power: { value: 125.0, unit: 'kW' }
      }
    });

    // Mock AHU 1
    this.devices.set('192.168.1.102', {
      deviceId: 102,
      name: 'AHU 1 - Floor 1',
      type: 'ahu',
      objects: {
        supplyAirTemp: { value: 55.0, unit: 'F' },
        returnAirTemp: { value: 72.0, unit: 'F' },
        fanSpeed: { value: 60, unit: '%' },
        damperPosition: { value: 45, unit: '%' },
        status: { value: 'online', unit: 'enum' },
        power: { value: 8.5, unit: 'kW' }
      }
    });

    logger.info(`Initialized ${this.devices.size} mock BACnet devices`);
  }

  /**
   * Read property from BACnet device
   */
  async readProperty(deviceAddress, objectType, objectInstance, propertyId) {
    try {
      if (this.isMockMode) {
        const device = this.devices.get(deviceAddress);
        if (!device) {
          throw new Error(`Device ${deviceAddress} not found`);
        }

        // Simulate reading with slight random variation
        const mockValue = this.getMockValue(device, propertyId);
        return mockValue;
      } else {
        // In production, use actual BACnet client
        // return await this.client.readProperty(deviceAddress, objectType, objectInstance, propertyId);
        throw new Error('BACnet client not implemented');
      }
    } catch (error) {
      logger.error(`Failed to read BACnet property from ${deviceAddress}:`, error);
      throw error;
    }
  }

  /**
   * Write property to BACnet device
   */
  async writeProperty(deviceAddress, objectType, objectInstance, propertyId, value) {
    try {
      if (this.isMockMode) {
        const device = this.devices.get(deviceAddress);
        if (!device) {
          throw new Error(`Device ${deviceAddress} not found`);
        }

        // Update mock value
        const key = this.getPropertyKey(propertyId);
        if (device.objects[key]) {
          device.objects[key].value = value;
          logger.info(`Updated ${deviceAddress} ${key} to ${value}`);
          return true;
        }

        throw new Error(`Property ${propertyId} not found`);
      } else {
        // In production, use actual BACnet client
        // return await this.client.writeProperty(deviceAddress, objectType, objectInstance, propertyId, value);
        throw new Error('BACnet client not implemented');
      }
    } catch (error) {
      logger.error(`Failed to write BACnet property to ${deviceAddress}:`, error);
      throw error;
    }
  }

  /**
   * Get mock value with random variation
   */
  getMockValue(device, propertyId) {
    const key = this.getPropertyKey(propertyId);
    const property = device.objects[key];

    if (!property) {
      return null;
    }

    // Add slight random variation for numeric values
    if (typeof property.value === 'number') {
      const variation = (Math.random() - 0.5) * 2; // -1 to +1
      return {
        value: property.value + variation,
        unit: property.unit
      };
    }

    return property;
  }

  /**
   * Map property ID to key
   */
  getPropertyKey(propertyId) {
    const mapping = {
      'present-value': 'value',
      'temperature': 'temperature',
      'setpoint': 'setpoint',
      'fan-speed': 'fanSpeed',
      'mode': 'mode',
      'status': 'status',
      'power': 'power'
    };

    return mapping[propertyId] || propertyId;
  }

  /**
   * Discover BACnet devices on network
   */
  async discoverDevices() {
    try {
      if (this.isMockMode) {
        return Array.from(this.devices.entries()).map(([address, device]) => ({
          address,
          deviceId: device.deviceId,
          name: device.name,
          type: device.type
        }));
      } else {
        // In production, perform actual device discovery
        // return await this.client.whoIs();
        throw new Error('BACnet discovery not implemented');
      }
    } catch (error) {
      logger.error('Failed to discover BACnet devices:', error);
      throw error;
    }
  }

  /**
   * Get all devices
   */
  getDevices() {
    return Array.from(this.devices.entries()).map(([address, device]) => ({
      address,
      ...device
    }));
  }

  /**
   * Cleanup
   */
  async cleanup() {
    if (this.client) {
      // Close BACnet client
      this.client = null;
    }
    logger.info('BACnet service cleaned up');
  }
}

// Singleton instance
const bacnetService = new BACnetService();

module.exports = bacnetService;
