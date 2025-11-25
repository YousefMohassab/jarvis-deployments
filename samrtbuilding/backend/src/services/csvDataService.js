const fs = require('fs');
const path = require('path');
const readline = require('readline');

/**
 * CSV Data Service
 * Provides in-memory data access to CSV files
 * Replaces database queries with CSV file parsing
 */

class CSVDataService {
  constructor() {
    this.dataPath = path.join(__dirname, '../../data');
    this.cache = {
      buildings: [],
      zones: [],
      equipment: [],
      sensors: [],
      alerts: [],
      energyReadings: [] // Will be loaded on demand due to size
    };
    this.initialized = false;
    this.energyReadingsLoaded = false;
  }

  /**
   * Initialize and load all CSV data into memory
   */
  async initialize() {
    if (this.initialized) return;

    console.log('Initializing CSV Data Service...');

    try {
      // Load smaller datasets completely into memory
      this.cache.buildings = await this.loadCSV('buildings.csv');
      this.cache.zones = await this.loadCSV('zones.csv');
      this.cache.equipment = await this.loadCSV('equipment.csv');
      this.cache.sensors = await this.loadCSV('sensors.csv');
      this.cache.alerts = await this.loadCSV('alerts.csv');

      console.log(`Loaded ${this.cache.buildings.length} buildings`);
      console.log(`Loaded ${this.cache.zones.length} zones`);
      console.log(`Loaded ${this.cache.equipment.length} equipment`);
      console.log(`Loaded ${this.cache.sensors.length} sensors`);
      console.log(`Loaded ${this.cache.alerts.length} alerts`);

      // Load energy readings into memory (large file - may take time)
      console.log('Loading energy readings... This may take a moment...');
      this.cache.energyReadings = await this.loadCSV('energy_readings.csv');
      console.log(`Loaded ${this.cache.energyReadings.length} energy readings`);
      this.energyReadingsLoaded = true;

      this.initialized = true;
      console.log('CSV Data Service initialized successfully');
    } catch (error) {
      console.error('Error initializing CSV Data Service:', error);
      throw error;
    }
  }

  /**
   * Load CSV file and parse into array of objects
   */
  async loadCSV(filename) {
    const filePath = path.join(this.dataPath, filename);

    return new Promise((resolve, reject) => {
      const data = [];
      const fileStream = fs.createReadStream(filePath);
      const rl = readline.createInterface({
        input: fileStream,
        crlfDelay: Infinity
      });

      let headers = [];
      let isFirstLine = true;

      rl.on('line', (line) => {
        if (isFirstLine) {
          headers = line.split(',');
          isFirstLine = false;
        } else {
          const values = this.parseCSVLine(line);
          const obj = {};

          headers.forEach((header, index) => {
            const value = values[index];
            // Convert numeric strings to numbers
            if (value !== '' && !isNaN(value) && !['id', 'zipCode', 'serialNumber', 'sensorId'].includes(header)) {
              obj[header] = parseFloat(value);
            } else if (value === 'true') {
              obj[header] = true;
            } else if (value === 'false') {
              obj[header] = false;
            } else {
              obj[header] = value;
            }
          });

          data.push(obj);
        }
      });

      rl.on('close', () => {
        resolve(data);
      });

      rl.on('error', (error) => {
        reject(error);
      });
    });
  }

  /**
   * Parse CSV line handling quoted values
   */
  parseCSVLine(line) {
    const values = [];
    let currentValue = '';
    let insideQuotes = false;

    for (let i = 0; i < line.length; i++) {
      const char = line[i];

      if (char === '"') {
        insideQuotes = !insideQuotes;
      } else if (char === ',' && !insideQuotes) {
        values.push(currentValue.trim());
        currentValue = '';
      } else {
        currentValue += char;
      }
    }

    values.push(currentValue.trim());
    return values;
  }

  // ========== BUILDINGS ==========

  async getAllBuildings() {
    return this.cache.buildings.filter(b => b.isActive);
  }

  async getBuildingById(id) {
    return this.cache.buildings.find(b => b.id === parseInt(id));
  }

  // ========== ZONES ==========

  async getAllZones(filters = {}) {
    let zones = this.cache.zones.filter(z => z.isActive);

    if (filters.buildingId) {
      zones = zones.filter(z => z.buildingId === parseInt(filters.buildingId));
    }

    return zones;
  }

  async getZoneById(id) {
    return this.cache.zones.find(z => z.id === parseInt(id));
  }

  async createZone(zoneData) {
    const newId = Math.max(...this.cache.zones.map(z => z.id), 0) + 1;
    const newZone = {
      id: newId,
      ...zoneData,
      isActive: true,
      currentOccupancy: 0,
      currentTemperature: zoneData.targetTemperature || 22,
      currentHumidity: 45,
      setpoint: zoneData.targetTemperature || 22,
      schedule: '{}'
    };
    this.cache.zones.push(newZone);
    return newZone;
  }

  async updateZone(id, updates) {
    const zone = this.cache.zones.find(z => z.id === parseInt(id));
    if (!zone) return null;

    Object.assign(zone, updates);
    return zone;
  }

  async deleteZone(id) {
    const zone = this.cache.zones.find(z => z.id === parseInt(id));
    if (!zone) return false;

    zone.isActive = false;
    return true;
  }

  // ========== EQUIPMENT ==========

  async getAllEquipment(filters = {}) {
    let equipment = this.cache.equipment.filter(e => e.isActive);

    if (filters.zoneId) {
      equipment = equipment.filter(e => e.zoneId === parseInt(filters.zoneId));
    }

    if (filters.buildingId) {
      equipment = equipment.filter(e => e.buildingId === parseInt(filters.buildingId));
    }

    return equipment;
  }

  async getEquipmentById(id) {
    return this.cache.equipment.find(e => e.id === parseInt(id));
  }

  // ========== SENSORS ==========

  async getAllSensors(filters = {}) {
    let sensors = this.cache.sensors.filter(s => s.isActive);

    if (filters.equipmentId) {
      sensors = sensors.filter(s => s.equipmentId === parseInt(filters.equipmentId));
    }

    if (filters.zoneId) {
      sensors = sensors.filter(s => s.zoneId === parseInt(filters.zoneId));
    }

    return sensors;
  }

  // ========== ALERTS ==========

  async getAllAlerts(filters = {}) {
    let alerts = [...this.cache.alerts];

    if (filters.status) {
      alerts = alerts.filter(a => a.status === filters.status);
    }

    if (filters.severity) {
      alerts = alerts.filter(a => a.severity === filters.severity);
    }

    if (filters.buildingId) {
      alerts = alerts.filter(a => a.buildingId === parseInt(filters.buildingId));
    }

    // Sort by timestamp descending
    alerts.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

    return alerts;
  }

  async getAlertById(id) {
    return this.cache.alerts.find(a => a.id === parseInt(id));
  }

  async acknowledgeAlert(id, acknowledgedBy) {
    const alert = this.cache.alerts.find(a => a.id === parseInt(id));
    if (!alert) return null;

    alert.acknowledgedAt = new Date().toISOString();
    alert.acknowledgedBy = acknowledgedBy;
    alert.status = 'acknowledged';
    return alert;
  }

  async resolveAlert(id) {
    const alert = this.cache.alerts.find(a => a.id === parseInt(id));
    if (!alert) return null;

    alert.resolvedAt = new Date().toISOString();
    alert.status = 'resolved';
    return alert;
  }

  // ========== ENERGY READINGS ==========

  async getEnergyReadings(filters = {}) {
    if (!this.energyReadingsLoaded) {
      console.warn('Energy readings not loaded yet');
      return [];
    }

    let readings = [...this.cache.energyReadings];

    // Apply filters
    if (filters.buildingId) {
      readings = readings.filter(r => r.buildingId === parseInt(filters.buildingId));
    }

    if (filters.zoneId) {
      readings = readings.filter(r => r.zoneId === parseInt(filters.zoneId));
    }

    if (filters.equipmentId) {
      readings = readings.filter(r => r.equipmentId === parseInt(filters.equipmentId));
    }

    if (filters.startDate) {
      const startDate = new Date(filters.startDate);
      readings = readings.filter(r => new Date(r.timestamp) >= startDate);
    }

    if (filters.endDate) {
      const endDate = new Date(filters.endDate);
      readings = readings.filter(r => new Date(r.timestamp) <= endDate);
    }

    // Apply limit
    if (filters.limit) {
      readings = readings.slice(0, parseInt(filters.limit));
    }

    return readings;
  }

  async getCurrentEnergyReadings(buildingId = null, minutesBack = 5) {
    if (!this.energyReadingsLoaded) {
      console.warn('Energy readings not loaded yet');
      return [];
    }

    // For demo purposes, return the most recent readings by offsetting timestamps to appear current
    let readings = [...this.cache.energyReadings];

    if (buildingId) {
      readings = readings.filter(r => r.buildingId === parseInt(buildingId));
    }

    // Sort by timestamp descending to get most recent
    readings.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

    // Take the most recent readings and make them appear current
    const recentReadings = readings.slice(0, Math.min(100, readings.length));

    // Offset timestamps to make them appear within the last few minutes
    const now = new Date();
    const timeOffset = minutesBack * 60 * 1000; // Spread over the last N minutes

    return recentReadings.map((reading, index) => ({
      ...reading,
      timestamp: new Date(now.getTime() - (index * timeOffset / recentReadings.length)).toISOString()
    }));
  }

  async getHistoricalEnergyReadings(buildingId, startDate, endDate, limit = 1000) {
    const start = startDate ? new Date(startDate) : new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const end = endDate ? new Date(endDate) : new Date();

    let readings = this.cache.energyReadings.filter(r => {
      if (buildingId && r.buildingId !== parseInt(buildingId)) return false;

      const timestamp = new Date(r.timestamp);
      return timestamp >= start && timestamp <= end;
    });

    // Sort by timestamp ascending
    readings.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));

    return readings.slice(0, limit);
  }

  async getEnergyReadingsByZones(buildingId) {
    const zones = await this.getAllZones({ buildingId });

    const zoneData = await Promise.all(
      zones.map(async (zone) => {
        const readings = await this.getEnergyReadings({
          zoneId: zone.id,
          limit: 10
        });

        return {
          ...zone,
          energyReadings: readings.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
        };
      })
    );

    return zoneData;
  }

  // ========== ANALYTICS & CALCULATIONS ==========

  calculateTodayStats(buildingId = null) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const todayReadings = this.cache.energyReadings.filter(r => {
      if (buildingId && r.buildingId !== parseInt(buildingId)) return false;
      const timestamp = new Date(r.timestamp);
      return timestamp >= today;
    });

    const totalKwh = todayReadings.reduce((sum, r) => sum + (r.energyKwh || 0), 0);
    const totalCost = todayReadings.reduce((sum, r) => sum + (r.cost || 0), 0);
    const avgPower = todayReadings.length > 0
      ? todayReadings.reduce((sum, r) => sum + r.powerKw, 0) / todayReadings.length
      : 0;

    return {
      totalKwh: Math.round(totalKwh * 100) / 100,
      totalCost: Math.round(totalCost * 100) / 100,
      avgPower: Math.round(avgPower * 100) / 100,
      readingsCount: todayReadings.length
    };
  }

  calculateZoneConsumption(buildingId = null) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const zones = buildingId
      ? this.cache.zones.filter(z => z.buildingId === parseInt(buildingId) && z.isActive)
      : this.cache.zones.filter(z => z.isActive);

    return zones.map(zone => {
      const zoneReadings = this.cache.energyReadings.filter(r => {
        const timestamp = new Date(r.timestamp);
        return r.zoneId === zone.id && timestamp >= today;
      });

      const consumption = zoneReadings.reduce((sum, r) => sum + (r.energyKwh || 0), 0);

      return {
        id: zone.id,
        name: zone.name,
        consumption: Math.round(consumption * 100) / 100
      };
    });
  }

  calculatePeakDemand(buildingId, date = null) {
    const targetDate = date ? new Date(date) : new Date();
    targetDate.setHours(0, 0, 0, 0);
    const endDate = new Date(targetDate);
    endDate.setDate(endDate.getDate() + 1);

    const readings = this.cache.energyReadings.filter(r => {
      if (buildingId && r.buildingId !== parseInt(buildingId)) return false;
      const timestamp = new Date(r.timestamp);
      return timestamp >= targetDate && timestamp < endDate;
    });

    // Group by hour
    const hourlyData = {};
    for (let i = 0; i < 24; i++) {
      const hour = i.toString().padStart(2, '0') + ':00';
      hourlyData[hour] = { demands: [], max: 0 };
    }

    readings.forEach(r => {
      const hour = new Date(r.timestamp).getHours();
      const hourKey = hour.toString().padStart(2, '0') + ':00';
      if (hourlyData[hourKey]) {
        hourlyData[hourKey].demands.push(r.powerKw);
        if (r.powerKw > hourlyData[hourKey].max) {
          hourlyData[hourKey].max = r.powerKw;
        }
      }
    });

    const demandProfile = Object.entries(hourlyData).map(([hour, data]) => ({
      hour,
      demand: Math.round(data.max * 100) / 100,
      average: data.demands.length > 0
        ? Math.round((data.demands.reduce((a, b) => a + b, 0) / data.demands.length) * 100) / 100
        : 0
    }));

    const peakData = demandProfile.reduce((max, curr) =>
      curr.demand > max.demand ? curr : max,
      { hour: '00:00', demand: 0 }
    );

    return {
      peakPower: peakData.demand,
      peakTime: peakData.hour,
      demandProfile
    };
  }

  getStatistics() {
    return {
      buildings: this.cache.buildings.length,
      zones: this.cache.zones.filter(z => z.isActive).length,
      equipment: this.cache.equipment.filter(e => e.isActive).length,
      sensors: this.cache.sensors.filter(s => s.isActive).length,
      alerts: this.cache.alerts.length,
      energyReadings: this.cache.energyReadings.length,
      initialized: this.initialized
    };
  }
}

// Create singleton instance
const csvDataService = new CSVDataService();

module.exports = csvDataService;
