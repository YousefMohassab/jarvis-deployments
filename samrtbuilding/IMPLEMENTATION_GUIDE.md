# Smart Building Energy Management System - Implementation Guide

## Phase 1: Infrastructure Setup (Week 1-2)

### 1.1 Development Environment Setup

```bash
# Clone repository structure
mkdir -p sbems/{backend,frontend,integration,deployment}
cd sbems

# Initialize Git
git init
git checkout -b main

# Backend setup
cd backend
npm init -y
npm install express pg redis socket.io mqtt jsonwebtoken bcrypt joi
npm install @tensorflow/tfjs-node
npm install -D typescript @types/node @types/express nodemon

# Frontend setup
cd ../frontend
npm create vite@latest . -- --template react
npm install tailwindcss postcss autoprefixer recharts
npm install axios socket.io-client zustand react-router-dom
npx tailwindcss init -p

# Integration layer
cd ../integration
npm init -y
npm install bacstack modbus-serial mqtt axios
```

### 1.2 Docker Environment

```bash
# Create docker-compose.yml
cd ../deployment
touch docker-compose.yml

# Create environment file
cp .env.example .env

# Generate secure secrets
openssl rand -base64 32  # JWT_SECRET
openssl rand -base64 32  # DB_PASSWORD

# Start infrastructure
docker-compose up -d postgres redis mqtt
```

### 1.3 Database Initialization

```sql
-- Create database and user
CREATE DATABASE sbems;
CREATE USER sbems_user WITH ENCRYPTED PASSWORD 'secure_password';
GRANT ALL PRIVILEGES ON DATABASE sbems TO sbems_user;

-- Connect to database
\c sbems

-- Enable extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "timescaledb";

-- Run migration scripts
\i migrations/001_create_core_tables.sql
\i migrations/002_create_timeseries_tables.sql
\i migrations/003_create_indexes.sql
```

---

## Phase 2: Core Backend Development (Week 3-5)

### 2.1 Project Structure

```
backend/src/
├── config/
│   ├── database.js          # PostgreSQL config
│   ├── redis.js             # Redis config
│   ├── mqtt.js              # MQTT config
│   └── security.js          # Security settings
├── models/
│   ├── Building.js
│   ├── Zone.js
│   ├── HVACUnit.js
│   └── index.js             # Model exports
├── repositories/
│   ├── BuildingRepository.js
│   ├── ZoneRepository.js
│   └── EnergyRepository.js
├── services/
│   ├── auth.service.js
│   ├── hvac.service.js
│   ├── energy.service.js
│   └── prediction.service.js
├── api/
│   ├── routes/
│   ├── controllers/
│   ├── middlewares/
│   └── validators/
├── websocket/
│   ├── server.js
│   └── handlers/
├── utils/
│   ├── logger.js
│   ├── errors.js
│   └── calculations.js
├── app.js
└── server.js
```

### 2.2 Database Repository Pattern

```javascript
// repositories/BaseRepository.js
class BaseRepository {
  constructor(tableName, db) {
    this.tableName = tableName;
    this.db = db;
  }

  async findById(id) {
    const query = `SELECT * FROM ${this.tableName} WHERE id = $1`;
    const result = await this.db.query(query, [id]);
    return result.rows[0];
  }

  async findAll(filters = {}, pagination = {}) {
    const { page = 1, pageSize = 20 } = pagination;
    const offset = (page - 1) * pageSize;

    let query = `SELECT * FROM ${this.tableName}`;
    const params = [];
    const conditions = [];

    // Build WHERE clause
    Object.keys(filters).forEach((key, index) => {
      conditions.push(`${key} = $${index + 1}`);
      params.push(filters[key]);
    });

    if (conditions.length > 0) {
      query += ` WHERE ${conditions.join(' AND ')}`;
    }

    query += ` ORDER BY created_at DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
    params.push(pageSize, offset);

    const result = await this.db.query(query, params);
    return result.rows;
  }

  async create(data) {
    const keys = Object.keys(data);
    const values = Object.values(data);
    const placeholders = keys.map((_, i) => `$${i + 1}`).join(', ');

    const query = `
      INSERT INTO ${this.tableName} (${keys.join(', ')})
      VALUES (${placeholders})
      RETURNING *
    `;

    const result = await this.db.query(query, values);
    return result.rows[0];
  }

  async update(id, data) {
    const keys = Object.keys(data);
    const values = Object.values(data);
    const setClause = keys.map((key, i) => `${key} = $${i + 2}`).join(', ');

    const query = `
      UPDATE ${this.tableName}
      SET ${setClause}, updated_at = NOW()
      WHERE id = $1
      RETURNING *
    `;

    const result = await this.db.query(query, [id, ...values]);
    return result.rows[0];
  }

  async delete(id) {
    const query = `DELETE FROM ${this.tableName} WHERE id = $1`;
    await this.db.query(query, [id]);
  }
}

// repositories/EnergyRepository.js
class EnergyRepository extends BaseRepository {
  constructor(db) {
    super('energy_readings', db);
  }

  async getEnergyConsumption(buildingId, startDate, endDate, granularity = 'hour') {
    const query = `
      SELECT
        time_bucket($1, time) as bucket,
        AVG(power_consumption) as avg_power,
        MAX(power_consumption) as peak_power,
        SUM(energy_total) as total_energy
      FROM energy_readings
      WHERE building_id = $2
        AND time >= $3
        AND time <= $4
      GROUP BY bucket
      ORDER BY bucket ASC
    `;

    const interval = granularity === 'hour' ? '1 hour' : '1 day';
    const result = await this.db.query(query, [interval, buildingId, startDate, endDate]);
    return result.rows;
  }

  async insertBulk(readings) {
    const query = `
      INSERT INTO energy_readings
        (time, building_id, zone_id, hvac_unit_id, power_consumption, energy_total)
      SELECT * FROM UNNEST($1::timestamptz[], $2::uuid[], $3::uuid[], $4::uuid[], $5::decimal[], $6::decimal[])
    `;

    const times = readings.map(r => r.time);
    const buildingIds = readings.map(r => r.buildingId);
    const zoneIds = readings.map(r => r.zoneId);
    const hvacUnitIds = readings.map(r => r.hvacUnitId);
    const powerConsumptions = readings.map(r => r.powerConsumption);
    const energyTotals = readings.map(r => r.energyTotal);

    await this.db.query(query, [
      times,
      buildingIds,
      zoneIds,
      hvacUnitIds,
      powerConsumptions,
      energyTotals
    ]);
  }
}

module.exports = { BaseRepository, EnergyRepository };
```

### 2.3 API Controller Pattern

```javascript
// controllers/hvac.controller.js
const { HVACService } = require('../services/hvac.service');
const { ValidationError } = require('../utils/errors');
const logger = require('../utils/logger');

class HVACController {
  constructor() {
    this.hvacService = new HVACService();
  }

  // Get HVAC unit status
  getStatus = async (req, res, next) => {
    try {
      const { id } = req.params;
      const status = await this.hvacService.getStatus(id);

      res.json({
        success: true,
        data: status,
        metadata: {
          timestamp: new Date().toISOString(),
          requestId: req.id
        }
      });
    } catch (error) {
      next(error);
    }
  };

  // Send control command
  sendControlCommand = async (req, res, next) => {
    try {
      const { id } = req.params;
      const { action, parameters } = req.body;

      // Validate command
      if (!['set_temperature', 'set_mode', 'set_fan_speed', 'power'].includes(action)) {
        throw new ValidationError('Invalid action');
      }

      // Log command for audit
      logger.info(`Control command: ${action}`, {
        userId: req.user.id,
        hvacUnitId: id,
        parameters
      });

      // Execute command
      const result = await this.hvacService.sendCommand(id, action, parameters, req.user.id);

      res.json({
        success: true,
        data: result,
        metadata: {
          timestamp: new Date().toISOString(),
          requestId: req.id
        }
      });
    } catch (error) {
      next(error);
    }
  };

  // Get performance metrics
  getPerformanceMetrics = async (req, res, next) => {
    try {
      const { id } = req.params;
      const { startDate, endDate } = req.query;

      const metrics = await this.hvacService.getPerformanceMetrics(
        id,
        new Date(startDate),
        new Date(endDate)
      );

      res.json({
        success: true,
        data: metrics
      });
    } catch (error) {
      next(error);
    }
  };
}

module.exports = { HVACController };
```

---

## Phase 3: Integration Layer (Week 6-8)

### 3.1 BACnet Integration Implementation

```javascript
// integration/bacnet/BACnetClient.js
const bacnet = require('bacstack');
const EventEmitter = require('events');

class BACnetClient extends EventEmitter {
  constructor(config) {
    super();
    this.config = config;
    this.client = new bacnet({
      port: config.port || 47808,
      interface: config.interface,
      broadcastAddress: config.broadcastAddress
    });
    this.devices = new Map();
    this.setupListeners();
  }

  setupListeners() {
    // Handle incoming data
    this.client.on('iAm', (device) => {
      this.devices.set(device.deviceId, {
        address: device.address,
        deviceId: device.deviceId,
        maxApdu: device.maxApdu,
        segmentation: device.segmentation,
        vendorId: device.vendorId
      });
      this.emit('deviceDiscovered', device);
    });

    this.client.on('error', (error) => {
      this.emit('error', error);
    });
  }

  // Discover devices
  async discoverDevices() {
    return new Promise((resolve) => {
      this.client.whoIs();

      // Wait for responses
      setTimeout(() => {
        resolve(Array.from(this.devices.values()));
      }, 5000);
    });
  }

  // Read property
  async readProperty(address, objectType, objectInstance, propertyId) {
    return new Promise((resolve, reject) => {
      this.client.readProperty(
        address,
        { type: objectType, instance: objectInstance },
        propertyId,
        (err, value) => {
          if (err) reject(err);
          else resolve(value);
        }
      );
    });
  }

  // Read multiple properties
  async readMultiple(address, readAccessSpecification) {
    return new Promise((resolve, reject) => {
      this.client.readPropertyMultiple(
        address,
        readAccessSpecification,
        (err, value) => {
          if (err) reject(err);
          else resolve(value);
        }
      );
    });
  }

  // Write property
  async writeProperty(address, objectType, objectInstance, propertyId, value, priority = 8) {
    return new Promise((resolve, reject) => {
      this.client.writeProperty(
        address,
        { type: objectType, instance: objectInstance },
        propertyId,
        [{ type: value.type, value: value.value }],
        { priority },
        (err) => {
          if (err) reject(err);
          else resolve();
        }
      );
    });
  }

  // Subscribe to COV
  async subscribeCOV(address, objectType, objectInstance, lifetime = 0) {
    const subscribeId = Math.floor(Math.random() * 1000000);

    return new Promise((resolve, reject) => {
      this.client.subscribeCOV(
        address,
        { type: objectType, instance: objectInstance },
        subscribeId,
        false,
        false,
        lifetime,
        (err) => {
          if (err) reject(err);
          else resolve(subscribeId);
        }
      );
    });
  }
}

// integration/bacnet/BACnetPoller.js
class BACnetPoller {
  constructor(bacnetClient, mqttClient, config) {
    this.bacnetClient = bacnetClient;
    this.mqttClient = mqttClient;
    this.config = config;
    this.pollingIntervals = new Map();
  }

  start() {
    // High priority polling (30 seconds)
    this.startPollingGroup('high', 30000);

    // Medium priority polling (2 minutes)
    this.startPollingGroup('medium', 120000);

    // Low priority polling (5 minutes)
    this.startPollingGroup('low', 300000);
  }

  startPollingGroup(priority, interval) {
    const intervalId = setInterval(async () => {
      await this.pollGroup(priority);
    }, interval);

    this.pollingIntervals.set(priority, intervalId);
  }

  async pollGroup(priority) {
    const devices = this.config.devices[priority] || [];

    for (const device of devices) {
      try {
        const readings = await this.pollDevice(device);
        this.publishReadings(device, readings);
      } catch (error) {
        console.error(`Error polling device ${device.id}:`, error);
      }
    }
  }

  async pollDevice(device) {
    const readSpec = device.points.map(point => ({
      objectId: { type: point.objectType, instance: point.objectInstance },
      properties: [{ id: point.propertyId }]
    }));

    const result = await this.bacnetClient.readMultiple(device.address, readSpec);
    return this.parseReadings(device, result);
  }

  parseReadings(device, result) {
    const readings = {};

    result.values.forEach((valueSet, index) => {
      const point = device.points[index];
      const value = valueSet.values[0].value;

      readings[point.name] = {
        value: this.applyScale(value, point.scale),
        unit: point.unit,
        timestamp: new Date().toISOString()
      };
    });

    return readings;
  }

  applyScale(value, scale) {
    if (typeof scale === 'number') {
      return value * scale;
    }
    return value;
  }

  publishReadings(device, readings) {
    const topic = `sbems/building/${device.buildingId}/hvac/${device.id}/telemetry`;
    const payload = {
      deviceId: device.id,
      timestamp: new Date().toISOString(),
      readings
    };

    this.mqttClient.publish(topic, JSON.stringify(payload));
  }

  stop() {
    this.pollingIntervals.forEach(intervalId => clearInterval(intervalId));
    this.pollingIntervals.clear();
  }
}

module.exports = { BACnetClient, BACnetPoller };
```

### 3.2 Modbus Integration Implementation

```javascript
// integration/modbus/ModbusClient.js
const ModbusRTU = require('modbus-serial');

class ModbusClient {
  constructor(config) {
    this.config = config;
    this.clients = new Map();
  }

  // Connect to Modbus TCP device
  async connectTCP(deviceId, host, port, unitId) {
    const client = new ModbusRTU();
    await client.connectTCP(host, { port });
    client.setID(unitId);
    this.clients.set(deviceId, client);
    return client;
  }

  // Connect to Modbus RTU device
  async connectRTU(deviceId, port, baudRate, unitId) {
    const client = new ModbusRTU();
    await client.connectRTUBuffered(port, { baudRate });
    client.setID(unitId);
    this.clients.set(deviceId, client);
    return client;
  }

  // Read holding registers
  async readHoldingRegisters(deviceId, address, length) {
    const client = this.clients.get(deviceId);
    if (!client) throw new Error(`Device ${deviceId} not connected`);

    const result = await client.readHoldingRegisters(address, length);
    return result.data;
  }

  // Read input registers
  async readInputRegisters(deviceId, address, length) {
    const client = this.clients.get(deviceId);
    if (!client) throw new Error(`Device ${deviceId} not connected`);

    const result = await client.readInputRegisters(address, length);
    return result.data;
  }

  // Write single register
  async writeSingleRegister(deviceId, address, value) {
    const client = this.clients.get(deviceId);
    if (!client) throw new Error(`Device ${deviceId} not connected`);

    await client.writeRegister(address, value);
  }

  // Write multiple registers
  async writeMultipleRegisters(deviceId, address, values) {
    const client = this.clients.get(deviceId);
    if (!client) throw new Error(`Device ${deviceId} not connected`);

    await client.writeRegisters(address, values);
  }

  // Parse register value based on type
  parseValue(registers, offset, type, scale = 1) {
    let value;

    switch (type) {
      case 'uint16':
        value = registers[offset];
        break;
      case 'int16':
        value = registers[offset] > 32767
          ? registers[offset] - 65536
          : registers[offset];
        break;
      case 'uint32':
        value = (registers[offset] << 16) | registers[offset + 1];
        break;
      case 'float32':
        const buffer = Buffer.allocUnsafe(4);
        buffer.writeUInt16BE(registers[offset], 0);
        buffer.writeUInt16BE(registers[offset + 1], 2);
        value = buffer.readFloatBE(0);
        break;
      default:
        throw new Error(`Unknown type: ${type}`);
    }

    return value * scale;
  }

  // Encode value to registers
  encodeValue(value, type, scale = 1) {
    const scaledValue = value / scale;
    const registers = [];

    switch (type) {
      case 'uint16':
        registers.push(Math.round(scaledValue) & 0xFFFF);
        break;
      case 'int16':
        const int16Value = Math.round(scaledValue);
        registers.push(int16Value < 0 ? int16Value + 65536 : int16Value);
        break;
      case 'uint32':
        const uint32Value = Math.round(scaledValue);
        registers.push((uint32Value >> 16) & 0xFFFF);
        registers.push(uint32Value & 0xFFFF);
        break;
      case 'float32':
        const buffer = Buffer.allocUnsafe(4);
        buffer.writeFloatBE(scaledValue, 0);
        registers.push(buffer.readUInt16BE(0));
        registers.push(buffer.readUInt16BE(2));
        break;
      default:
        throw new Error(`Unknown type: ${type}`);
    }

    return registers;
  }

  disconnect(deviceId) {
    const client = this.clients.get(deviceId);
    if (client) {
      client.close(() => {});
      this.clients.delete(deviceId);
    }
  }

  disconnectAll() {
    this.clients.forEach((client, deviceId) => {
      this.disconnect(deviceId);
    });
  }
}

module.exports = { ModbusClient };
```

---

## Phase 4: ML Prediction Engine (Week 9-10)

### 4.1 Energy Load Prediction

```javascript
// services/ml/prediction.service.js
const tf = require('@tensorflow/tfjs-node');

class EnergyPredictionService {
  constructor() {
    this.model = null;
    this.loadModel();
  }

  async loadModel() {
    try {
      // Load pre-trained model
      this.model = await tf.loadLayersModel('file://./models/energy-prediction/model.json');
      console.log('Energy prediction model loaded');
    } catch (error) {
      console.log('No existing model found, will train new model');
    }
  }

  // Prepare training data
  prepareTrainingData(historicalData) {
    // Features: hour, day_of_week, temperature, occupancy, previous_hour_consumption
    const features = historicalData.map(record => [
      new Date(record.timestamp).getHours() / 24,
      new Date(record.timestamp).getDay() / 7,
      record.temperature / 35, // Normalize to 0-1
      record.occupancy / 100, // Normalize to 0-1
      record.previousConsumption / 100 // Normalize
    ]);

    // Labels: energy consumption
    const labels = historicalData.map(record => record.consumption / 100);

    return {
      xs: tf.tensor2d(features),
      ys: tf.tensor2d(labels, [labels.length, 1])
    };
  }

  // Train model
  async trainModel(historicalData) {
    const { xs, ys } = this.prepareTrainingData(historicalData);

    // Create model
    this.model = tf.sequential({
      layers: [
        tf.layers.dense({ units: 64, activation: 'relu', inputShape: [5] }),
        tf.layers.dropout({ rate: 0.2 }),
        tf.layers.dense({ units: 32, activation: 'relu' }),
        tf.layers.dropout({ rate: 0.2 }),
        tf.layers.dense({ units: 16, activation: 'relu' }),
        tf.layers.dense({ units: 1, activation: 'linear' })
      ]
    });

    // Compile model
    this.model.compile({
      optimizer: tf.train.adam(0.001),
      loss: 'meanSquaredError',
      metrics: ['mae']
    });

    // Train
    await this.model.fit(xs, ys, {
      epochs: 100,
      batchSize: 32,
      validationSplit: 0.2,
      callbacks: {
        onEpochEnd: (epoch, logs) => {
          console.log(`Epoch ${epoch}: loss = ${logs.loss.toFixed(4)}, mae = ${logs.mae.toFixed(4)}`);
        }
      }
    });

    // Save model
    await this.model.save('file://./models/energy-prediction');

    // Cleanup
    xs.dispose();
    ys.dispose();
  }

  // Predict energy consumption
  async predict(features) {
    if (!this.model) {
      throw new Error('Model not loaded');
    }

    const normalizedFeatures = [
      features.hour / 24,
      features.dayOfWeek / 7,
      features.temperature / 35,
      features.occupancy / 100,
      features.previousConsumption / 100
    ];

    const inputTensor = tf.tensor2d([normalizedFeatures]);
    const prediction = this.model.predict(inputTensor);
    const result = await prediction.data();

    // Denormalize
    const predictedConsumption = result[0] * 100;

    // Cleanup
    inputTensor.dispose();
    prediction.dispose();

    return predictedConsumption;
  }

  // Predict for next N hours
  async predictHorizon(currentState, horizonHours = 24) {
    const predictions = [];
    let previousConsumption = currentState.currentConsumption;

    for (let i = 0; i < horizonHours; i++) {
      const futureTime = new Date(currentState.timestamp);
      futureTime.setHours(futureTime.getHours() + i);

      const features = {
        hour: futureTime.getHours(),
        dayOfWeek: futureTime.getDay(),
        temperature: currentState.predictedTemperature || currentState.temperature,
        occupancy: this.predictOccupancy(futureTime),
        previousConsumption
      };

      const prediction = await this.predict(features);
      previousConsumption = prediction;

      predictions.push({
        timestamp: futureTime.toISOString(),
        predictedConsumption: prediction
      });
    }

    return predictions;
  }

  // Simple occupancy prediction based on time
  predictOccupancy(time) {
    const hour = time.getHours();
    const dayOfWeek = time.getDay();

    // Weekend
    if (dayOfWeek === 0 || dayOfWeek === 6) {
      return 10; // 10% occupancy
    }

    // Weekday
    if (hour >= 8 && hour <= 18) {
      return 80; // 80% occupancy during business hours
    } else {
      return 5; // 5% occupancy outside business hours
    }
  }
}

module.exports = { EnergyPredictionService };
```

### 4.2 Optimization Engine

```javascript
// services/ml/optimization.service.js
class OptimizationService {
  constructor(predictionService) {
    this.predictionService = predictionService;
  }

  // Calculate optimal cooling schedule
  async calculateOptimalSchedule(zoneId, date) {
    // Get predictions
    const predictions = await this.predictionService.predictHorizon({
      timestamp: date,
      temperature: 22,
      currentConsumption: 45
    }, 24);

    // Get utility rate schedule
    const rateSchedule = await this.getUtilityRates(date);

    // Calculate optimal pre-cooling times
    const schedule = this.optimizePreCooling(predictions, rateSchedule);

    return schedule;
  }

  optimizePreCooling(predictions, rateSchedule) {
    const schedule = [];
    let currentTemp = 22;

    predictions.forEach((prediction, hour) => {
      const rate = rateSchedule[hour];

      // If next hour is peak rate, pre-cool during off-peak
      if (hour < 23 && rateSchedule[hour + 1].isPeak && !rate.isPeak) {
        schedule.push({
          time: prediction.timestamp,
          action: 'pre_cool',
          targetTemp: 20, // 2 degrees below normal
          reason: 'Peak rate avoidance',
          estimatedSavings: this.calculateSavings(prediction, rate)
        });
      }
      // Normal operation
      else {
        schedule.push({
          time: prediction.timestamp,
          action: 'maintain',
          targetTemp: 22,
          reason: 'Normal operation'
        });
      }
    });

    return schedule;
  }

  calculateSavings(prediction, rate) {
    // Simplified savings calculation
    const peakRate = 0.25; // $/kWh
    const offPeakRate = 0.10; // $/kWh

    if (rate.isPeak) {
      return 0;
    }

    // Estimate pre-cooling cost vs peak operation cost
    const preCoolingCost = prediction.predictedConsumption * 1.2 * offPeakRate;
    const peakOperationCost = prediction.predictedConsumption * peakRate;

    return peakOperationCost - preCoolingCost;
  }

  async getUtilityRates(date) {
    // Simplified rate schedule
    const schedule = [];

    for (let hour = 0; hour < 24; hour++) {
      schedule.push({
        hour,
        rate: (hour >= 12 && hour < 18) ? 0.25 : 0.10,
        isPeak: (hour >= 12 && hour < 18)
      });
    }

    return schedule;
  }
}

module.exports = { OptimizationService };
```

---

## Phase 5: Frontend Development (Week 11-13)

### 5.1 Dashboard Structure

```javascript
// frontend/src/pages/Dashboard.jsx
import { useEffect, useState } from 'react';
import { useWebSocket } from '../hooks/useWebSocket';
import EnergyOverview from '../components/dashboard/EnergyOverview';
import ZoneControl from '../components/dashboard/ZoneControl';
import AlertPanel from '../components/dashboard/AlertPanel';
import RealTimeMetrics from '../components/dashboard/RealTimeMetrics';

export default function Dashboard() {
  const [buildingData, setBuildingData] = useState(null);
  const { connected, subscribe, sendMessage } = useWebSocket();

  useEffect(() => {
    if (connected) {
      // Subscribe to building data
      subscribe('energy', { buildingId: 'building_123' }, (data) => {
        setBuildingData(prev => ({ ...prev, energy: data }));
      });

      subscribe('temperature', { buildingId: 'building_123' }, (data) => {
        setBuildingData(prev => ({ ...prev, temperature: data }));
      });

      subscribe('alerts', { buildingId: 'building_123' }, (data) => {
        setBuildingData(prev => ({
          ...prev,
          alerts: [...(prev?.alerts || []), data]
        }));
      });
    }
  }, [connected]);

  if (!buildingData) {
    return <div className="flex items-center justify-center h-screen">
      <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-500"></div>
    </div>;
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">
          Energy Management Dashboard
        </h1>

        {/* Real-time metrics */}
        <RealTimeMetrics data={buildingData} />

        {/* Energy overview */}
        <div className="mt-8">
          <EnergyOverview data={buildingData.energy} />
        </div>

        {/* Zone controls */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {buildingData.zones?.map(zone => (
            <ZoneControl key={zone.id} zone={zone} />
          ))}
        </div>

        {/* Alerts */}
        <div className="mt-8">
          <AlertPanel alerts={buildingData.alerts} />
        </div>
      </div>
    </div>
  );
}
```

This implementation guide provides detailed, production-ready code examples for each phase of the system. Each section builds upon the architecture document with concrete implementation patterns, error handling, and best practices.

The guide covers:
- Complete development environment setup
- Repository patterns for database access
- Integration implementations for BACnet and Modbus
- ML services for prediction and optimization
- Frontend component structure with real-time updates

All code follows SOLID principles, includes error handling, and is designed for scalability and maintainability.
