// Real-time Monitoring System - IoT and Sensor Integration
import { EventEmitter } from 'events';

export class MonitoringSystem extends EventEmitter {
    constructor() {
        super();
        this.isRunning = false;
        this.sensors = new Map();
        this.alerts = new Map();
        this.thresholds = this.initializeThresholds();
        this.monitoringInterval = 5000; // 5 seconds
        this.intervalId = null;
    }
    
    initializeThresholds() {
        return {
            equipment: {
                efficiency: { min: 80, critical: 70 },
                temperature: { max: 85, critical: 95 },
                vibration: { max: 10, critical: 15 },
                pressure: { max: 150, critical: 180 }
            },
            production: {
                throughput: { min: 1000, critical: 800 },
                recovery: { min: 88, critical: 85 },
                grade: { min: 2.0, critical: 1.5 }
            },
            environmental: {
                dustLevel: { max: 10, critical: 15 },
                noiseLevel: { max: 85, critical: 95 },
                waterPH: { min: 6.5, max: 8.5, critical: { min: 6.0, max: 9.0 } },
                airQuality: { max: 50, critical: 100 }
            },
            safety: {
                gasLevels: { max: 0.5, critical: 1.0 },
                radiation: { max: 1.0, critical: 2.0 },
                personnelCount: { max: 50, critical: 75 }
            }
        };
    }
    
    start() {
        if (this.isRunning) {
            console.log('Monitoring system already running');
            return;
        }
        
        console.log('Starting real-time monitoring system...');
        this.isRunning = true;
        
        // Initialize sensors
        this.initializeSensors();
        
        // Start monitoring loop
        this.intervalId = setInterval(() => {
            this.monitoringSample();
        }, this.monitoringInterval);
        
        console.log('Real-time monitoring system started');
    }
    
    stop() {
        if (!this.isRunning) {
            console.log('Monitoring system not running');
            return;
        }
        
        console.log('Stopping monitoring system...');
        this.isRunning = false;
        
        if (this.intervalId) {
            clearInterval(this.intervalId);
            this.intervalId = null;
        }
        
        console.log('Monitoring system stopped');
    }
    
    initializeSensors() {
        // Equipment sensors
        this.sensors.set('EXC-001', {
            type: 'excavator',
            location: 'Pit A, Level 1',
            metrics: {
                efficiency: 92.5,
                temperature: 78,
                vibration: 5.2,
                pressure: 125,
                fuelConsumption: 45.6,
                operatingHours: 1247
            },
            status: 'operational'
        });
        
        this.sensors.set('TRK-001', {
            type: 'haul_truck',
            location: 'Route 1',
            metrics: {
                efficiency: 88.3,
                temperature: 82,
                vibration: 6.8,
                pressure: 135,
                fuelConsumption: 189.2,
                speed: 35,
                load: 85
            },
            status: 'operational'
        });
        
        this.sensors.set('CRU-001', {
            type: 'crusher',
            location: 'Plant A',
            metrics: {
                efficiency: 0,
                temperature: 25, // offline
                vibration: 0,
                pressure: 0,
                throughput: 0,
                powerConsumption: 0
            },
            status: 'maintenance'
        });
        
        this.sensors.set('DRL-001', {
            type: 'drill',
            location: 'Pit B, Level 2',
            metrics: {
                efficiency: 95.1,
                temperature: 75,
                vibration: 4.5,
                pressure: 142,
                penetrationRate: 38.5,
                bitWear: 25
            },
            status: 'operational'
        });
        
        // Environmental sensors
        this.sensors.set('ENV-PIT-A', {
            type: 'environmental',
            location: 'Pit A',
            metrics: {
                dustLevel: 8.5,
                noiseLevel: 82,
                windSpeed: 12,
                temperature: 28,
                humidity: 65,
                visibility: 5000
            },
            status: 'operational'
        });
        
        this.sensors.set('ENV-PLANT', {
            type: 'environmental',
            location: 'Processing Plant',
            metrics: {
                airQuality: 35,
                waterPH: 7.2,
                waterTurbidity: 4.5,
                wasteWaterFlow: 125,
                chemicalLevels: 2.3
            },
            status: 'operational'
        });
        
        // Safety sensors
        this.sensors.set('SAFETY-001', {
            type: 'safety',
            location: 'Underground Level 1',
            metrics: {
                gasLevels: 0.2,
                oxygenLevel: 20.8,
                temperature: 22,
                humidity: 75,
                personnelCount: 15,
                emergencyEquipment: 'functional'
            },
            status: 'operational'
        });
    }
    
    monitoringSample() {
        try {
            // Simulate sensor data updates
            this.updateSensorData();
            
            // Check thresholds and generate alerts
            this.checkThresholds();
            
            // Emit monitoring data
            this.emitMonitoringData();
            
        } catch (error) {
            console.error('Monitoring cycle error:', error);
        }
    }
    
    updateSensorData() {
        this.sensors.forEach((sensor, sensorId) => {
            if (sensor.status === 'offline' || sensor.status === 'maintenance') {
                return; // Skip offline sensors
            }
            
            // Simulate realistic sensor fluctuations
            switch (sensor.type) {
                case 'excavator':
                    this.updateExcavatorMetrics(sensor);
                    break;
                case 'haul_truck':
                    this.updateHaulTruckMetrics(sensor);
                    break;
                case 'crusher':
                    this.updateCrusherMetrics(sensor);
                    break;
                case 'drill':
                    this.updateDrillMetrics(sensor);
                    break;
                case 'environmental':
                    this.updateEnvironmentalMetrics(sensor);
                    break;
                case 'safety':
                    this.updateSafetyMetrics(sensor);
                    break;
            }
        });
    }
    
    updateExcavatorMetrics(sensor) {
        const metrics = sensor.metrics;
        
        // Add realistic fluctuations
        metrics.efficiency += (Math.random() - 0.5) * 2;
        metrics.efficiency = Math.max(70, Math.min(98, metrics.efficiency));
        
        metrics.temperature += (Math.random() - 0.5) * 5;
        metrics.temperature = Math.max(65, Math.min(95, metrics.temperature));
        
        metrics.vibration += (Math.random() - 0.5) * 1;
        metrics.vibration = Math.max(2, Math.min(20, metrics.vibration));
        
        metrics.pressure += (Math.random() - 0.5) * 10;
        metrics.pressure = Math.max(100, Math.min(180, metrics.pressure));
        
        metrics.fuelConsumption += (Math.random() - 0.5) * 5;
        metrics.fuelConsumption = Math.max(30, Math.min(60, metrics.fuelConsumption));
        
        metrics.operatingHours += 0.001; // Increment by ~5 seconds
    }
    
    updateHaulTruckMetrics(sensor) {
        const metrics = sensor.metrics;
        
        metrics.efficiency += (Math.random() - 0.5) * 3;
        metrics.efficiency = Math.max(75, Math.min(95, metrics.efficiency));
        
        metrics.temperature += (Math.random() - 0.5) * 8;
        metrics.temperature = Math.max(70, Math.min(105, metrics.temperature));
        
        metrics.speed += (Math.random() - 0.5) * 10;
        metrics.speed = Math.max(0, Math.min(65, metrics.speed));
        
        metrics.load += (Math.random() - 0.5) * 5;
        metrics.load = Math.max(0, Math.min(100, metrics.load));
        
        metrics.fuelConsumption = metrics.speed * 0.8 + metrics.load * 1.2 + (Math.random() * 20);
    }
    
    updateCrusherMetrics(sensor) {
        if (sensor.status === 'maintenance') {
            // Crusher is offline for maintenance
            sensor.metrics.efficiency = 0;
            sensor.metrics.temperature = 25; // Ambient
            sensor.metrics.throughput = 0;
            sensor.metrics.powerConsumption = 0;
            return;
        }
        
        const metrics = sensor.metrics;
        metrics.efficiency += (Math.random() - 0.5) * 4;
        metrics.efficiency = Math.max(60, Math.min(98, metrics.efficiency));
        
        metrics.throughput = metrics.efficiency * 8; // Simulate throughput based on efficiency
        metrics.powerConsumption = metrics.throughput * 0.6;
    }
    
    updateDrillMetrics(sensor) {
        const metrics = sensor.metrics;
        
        metrics.efficiency += (Math.random() - 0.5) * 2;
        metrics.efficiency = Math.max(85, Math.min(98, metrics.efficiency));
        
        metrics.penetrationRate += (Math.random() - 0.5) * 3;
        metrics.penetrationRate = Math.max(25, Math.min(45, metrics.penetrationRate));
        
        metrics.bitWear += Math.random() * 0.1;
        if (metrics.bitWear > 90) {
            metrics.bitWear = 10; // Simulate bit replacement
        }
    }
    
    updateEnvironmentalMetrics(sensor) {
        const metrics = sensor.metrics;
        
        if (sensor.location.includes('Pit')) {
            // Pit environmental conditions
            metrics.dustLevel += (Math.random() - 0.5) * 2;
            metrics.dustLevel = Math.max(0, Math.min(25, metrics.dustLevel));
            
            metrics.noiseLevel += (Math.random() - 0.5) * 5;
            metrics.noiseLevel = Math.max(65, Math.min(105, metrics.noiseLevel));
            
            metrics.windSpeed += (Math.random() - 0.5) * 3;
            metrics.windSpeed = Math.max(0, Math.min(35, metrics.windSpeed));
            
        } else if (sensor.location.includes('Plant')) {
            // Plant environmental conditions
            metrics.airQuality += (Math.random() - 0.5) * 10;
            metrics.airQuality = Math.max(10, Math.min(150, metrics.airQuality));
            
            metrics.waterPH += (Math.random() - 0.5) * 0.2;
            metrics.waterPH = Math.max(6.0, Math.min(9.0, metrics.waterPH));
            
            metrics.wasteWaterFlow += (Math.random() - 0.5) * 20;
            metrics.wasteWaterFlow = Math.max(80, Math.min(200, metrics.wasteWaterFlow));
        }
    }
    
    updateSafetyMetrics(sensor) {
        const metrics = sensor.metrics;
        
        metrics.gasLevels += (Math.random() - 0.5) * 0.1;
        metrics.gasLevels = Math.max(0, Math.min(2, metrics.gasLevels));
        
        metrics.oxygenLevel += (Math.random() - 0.5) * 0.5;
        metrics.oxygenLevel = Math.max(18, Math.min(22, metrics.oxygenLevel));
        
        metrics.personnelCount += Math.floor((Math.random() - 0.5) * 2);
        metrics.personnelCount = Math.max(0, Math.min(100, metrics.personnelCount));
    }
    
    checkThresholds() {
        this.sensors.forEach((sensor, sensorId) => {
            if (sensor.status === 'offline') return;
            
            const alerts = this.checkSensorThresholds(sensorId, sensor);
            alerts.forEach(alert => {
                this.processAlert(alert);
            });
        });
    }
    
    checkSensorThresholds(sensorId, sensor) {
        const alerts = [];
        const metrics = sensor.metrics;
        
        // Check equipment thresholds
        if (sensor.type === 'excavator' || sensor.type === 'haul_truck' || sensor.type === 'drill') {
            if (metrics.efficiency < this.thresholds.equipment.efficiency.critical) {
                alerts.push(this.createAlert('critical', 'equipment', 
                    `Critical efficiency drop on ${sensorId}`,
                    `Equipment efficiency dropped to ${metrics.efficiency.toFixed(1)}%`,
                    sensorId));
            } else if (metrics.efficiency < this.thresholds.equipment.efficiency.min) {
                alerts.push(this.createAlert('warning', 'equipment',
                    `Low efficiency on ${sensorId}`,
                    `Equipment efficiency at ${metrics.efficiency.toFixed(1)}%`,
                    sensorId));
            }
            
            if (metrics.temperature > this.thresholds.equipment.temperature.critical) {
                alerts.push(this.createAlert('critical', 'equipment',
                    `Critical temperature on ${sensorId}`,
                    `Temperature reached ${metrics.temperature.toFixed(1)}°C`,
                    sensorId));
            } else if (metrics.temperature > this.thresholds.equipment.temperature.max) {
                alerts.push(this.createAlert('warning', 'equipment',
                    `High temperature on ${sensorId}`,
                    `Temperature at ${metrics.temperature.toFixed(1)}°C`,
                    sensorId));
            }
        }
        
        // Check environmental thresholds
        if (sensor.type === 'environmental') {
            if (metrics.dustLevel > this.thresholds.environmental.dustLevel.critical) {
                alerts.push(this.createAlert('critical', 'environmental',
                    'Critical dust levels detected',
                    `Dust concentration: ${metrics.dustLevel.toFixed(1)} mg/m³ at ${sensor.location}`,
                    sensorId));
            }
            
            if (metrics.noiseLevel > this.thresholds.environmental.noiseLevel.critical) {
                alerts.push(this.createAlert('critical', 'environmental',
                    'Excessive noise levels',
                    `Noise level: ${metrics.noiseLevel.toFixed(1)} dB at ${sensor.location}`,
                    sensorId));
            }
            
            if (metrics.waterPH && (metrics.waterPH < 6.0 || metrics.waterPH > 9.0)) {
                alerts.push(this.createAlert('warning', 'environmental',
                    'Water pH out of range',
                    `Water pH: ${metrics.waterPH.toFixed(1)} at ${sensor.location}`,
                    sensorId));
            }
        }
        
        // Check safety thresholds
        if (sensor.type === 'safety') {
            if (metrics.gasLevels > this.thresholds.safety.gasLevels.critical) {
                alerts.push(this.createAlert('critical', 'safety',
                    'Dangerous gas levels detected',
                    `Gas concentration: ${metrics.gasLevels.toFixed(2)} ppm at ${sensor.location}`,
                    sensorId));
            }
            
            if (metrics.oxygenLevel < 19.5) {
                alerts.push(this.createAlert('critical', 'safety',
                    'Low oxygen levels',
                    `Oxygen level: ${metrics.oxygenLevel.toFixed(1)}% at ${sensor.location}`,
                    sensorId));
            }
        }
        
        return alerts;
    }
    
    createAlert(severity, category, title, message, sensorId) {
        return {
            id: `ALERT_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            severity,
            category,
            title,
            message,
            sensorId,
            timestamp: new Date().toISOString(),
            acknowledged: false
        };
    }
    
    processAlert(alert) {
        // Prevent duplicate alerts within 5 minutes
        const alertKey = `${alert.sensorId}_${alert.category}_${alert.title}`;
        const existingAlert = this.alerts.get(alertKey);
        
        if (existingAlert && (Date.now() - existingAlert.lastSent) < 300000) {
            return; // Don't send duplicate alert within 5 minutes
        }
        
        this.alerts.set(alertKey, {
            ...alert,
            lastSent: Date.now()
        });
        
        // Emit alert
        this.emit('equipment-alert', alert);
        
        if (alert.severity === 'critical') {
            this.emit('safety-alert', alert);
        }
        
        console.log(`ALERT [${alert.severity.toUpperCase()}]: ${alert.title} - ${alert.message}`);
    }
    
    emitMonitoringData() {
        // Prepare production update
        const productionData = this.calculateProductionMetrics();
        this.emit('production-update', productionData);
        
        // Prepare equipment update
        const equipmentData = this.prepareEquipmentData();
        this.emit('equipment-update', equipmentData);
    }
    
    calculateProductionMetrics() {
        // Calculate current production metrics from sensor data
        const excavators = Array.from(this.sensors.values()).filter(s => s.type === 'excavator');
        const crushers = Array.from(this.sensors.values()).filter(s => s.type === 'crusher');
        
        let totalThroughput = 0;
        let avgEfficiency = 0;
        let activeEquipmentCount = 0;
        
        [...excavators, ...crushers].forEach(equipment => {
            if (equipment.status === 'operational') {
                totalThroughput += equipment.metrics.throughput || (equipment.metrics.efficiency * 10);
                avgEfficiency += equipment.metrics.efficiency;
                activeEquipmentCount++;
            }
        });
        
        avgEfficiency = activeEquipmentCount > 0 ? avgEfficiency / activeEquipmentCount : 0;
        
        return {
            timestamp: new Date().toISOString(),
            throughput: totalThroughput,
            efficiency: avgEfficiency,
            activeEquipment: activeEquipmentCount,
            goldProduction: totalThroughput * 0.018, // Estimated gold production
            estimatedValue: totalThroughput * 0.018 * 2100 // @ $2100/oz
        };
    }
    
    prepareEquipmentData() {
        const equipmentArray = [];
        
        this.sensors.forEach((sensor, sensorId) => {
            if (sensor.type !== 'environmental' && sensor.type !== 'safety') {
                equipmentArray.push({
                    id: sensorId,
                    name: this.getEquipmentName(sensorId),
                    type: sensor.type,
                    status: sensor.status,
                    location: sensor.location,
                    efficiency: sensor.metrics.efficiency,
                    temperature: sensor.metrics.temperature,
                    vibration: sensor.metrics.vibration,
                    lastUpdate: new Date().toISOString()
                });
            }
        });
        
        return equipmentArray;
    }
    
    getEquipmentName(sensorId) {
        const nameMap = {
            'EXC-001': 'Primary Excavator',
            'TRK-001': 'Haul Truck #1',
            'CRU-001': 'Primary Crusher',
            'DRL-001': 'Blast Hole Drill #1'
        };
        return nameMap[sensorId] || sensorId;
    }
    
    // Public methods for external control
    getSensorData(sensorId) {
        return this.sensors.get(sensorId);
    }
    
    getAllSensorData() {
        return Object.fromEntries(this.sensors);
    }
    
    updateThreshold(category, metric, value) {
        if (this.thresholds[category] && this.thresholds[category][metric]) {
            this.thresholds[category][metric] = { ...this.thresholds[category][metric], ...value };
            console.log(`Updated threshold for ${category}.${metric}:`, this.thresholds[category][metric]);
        }
    }
    
    getThresholds() {
        return this.thresholds;
    }
    
    acknowledgeAlert(alertId) {
        // Find and acknowledge alert
        this.alerts.forEach((alert, key) => {
            if (alert.id === alertId) {
                alert.acknowledged = true;
                console.log(`Alert acknowledged: ${alert.title}`);
            }
        });
    }
    
    getActiveAlerts() {
        return Array.from(this.alerts.values()).filter(alert => !alert.acknowledged);
    }
}