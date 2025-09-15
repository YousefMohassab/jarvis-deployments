// Database Manager - SQLite with advanced mining data management
import sqlite3 from 'sqlite3';
import { promisify } from 'util';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export class DatabaseManager {
    constructor() {
        const dbPath = path.join(__dirname, '../../../data/goldmine.db');
        this.db = new sqlite3.Database(dbPath);
        
        // Promisify database methods
        this.run = promisify(this.db.run.bind(this.db));
        this.get = promisify(this.db.get.bind(this.db));
        this.all = promisify(this.db.all.bind(this.db));
    }
    
    async initialize() {
        try {
            await this.createTables();
            await this.seedInitialData();
            console.log('Database initialized successfully');
        } catch (error) {
            console.error('Database initialization failed:', error);
            throw error;
        }
    }
    
    async createTables() {
        // Production data table
        await this.run(`
            CREATE TABLE IF NOT EXISTS production (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
                gold_produced REAL NOT NULL,
                ore_processed REAL NOT NULL,
                waste_generated REAL NOT NULL,
                recovery_rate REAL NOT NULL,
                ore_grade REAL NOT NULL,
                energy_consumed REAL NOT NULL,
                water_used REAL NOT NULL,
                efficiency REAL NOT NULL,
                cost_per_ounce REAL NOT NULL,
                shift_id TEXT,
                weather_conditions TEXT,
                notes TEXT
            )
        `);
        
        // Equipment table
        await this.run(`
            CREATE TABLE IF NOT EXISTS equipment (
                id TEXT PRIMARY KEY,
                name TEXT NOT NULL,
                type TEXT NOT NULL,
                manufacturer TEXT,
                model TEXT,
                status TEXT NOT NULL DEFAULT 'operational',
                efficiency REAL DEFAULT 0,
                location TEXT,
                installation_date DATE,
                last_maintenance DATE,
                next_maintenance DATE,
                operating_hours INTEGER DEFAULT 0,
                maintenance_cost REAL DEFAULT 0,
                energy_consumption REAL DEFAULT 0,
                specifications TEXT,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )
        `);
        
        // Equipment maintenance logs
        await this.run(`
            CREATE TABLE IF NOT EXISTS maintenance_logs (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                equipment_id TEXT NOT NULL,
                maintenance_type TEXT NOT NULL,
                description TEXT,
                cost REAL,
                duration_hours REAL,
                technician TEXT,
                parts_used TEXT,
                started_at DATETIME,
                completed_at DATETIME,
                status TEXT DEFAULT 'scheduled',
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (equipment_id) REFERENCES equipment (id)
            )
        `);
        
        // Safety incidents table
        await this.run(`
            CREATE TABLE IF NOT EXISTS safety_incidents (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                incident_type TEXT NOT NULL,
                severity TEXT NOT NULL,
                description TEXT NOT NULL,
                location TEXT,
                personnel_involved TEXT,
                equipment_involved TEXT,
                injuries INTEGER DEFAULT 0,
                near_miss BOOLEAN DEFAULT 0,
                environmental_impact BOOLEAN DEFAULT 0,
                reported_by TEXT,
                investigated_by TEXT,
                corrective_actions TEXT,
                status TEXT DEFAULT 'open',
                occurred_at DATETIME NOT NULL,
                reported_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                resolved_at DATETIME
            )
        `);
        
        // Alerts and notifications
        await this.run(`
            CREATE TABLE IF NOT EXISTS alerts (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                type TEXT NOT NULL,
                category TEXT NOT NULL,
                severity TEXT NOT NULL,
                title TEXT NOT NULL,
                message TEXT NOT NULL,
                source TEXT,
                equipment_id TEXT,
                acknowledged BOOLEAN DEFAULT 0,
                resolved BOOLEAN DEFAULT 0,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                acknowledged_at DATETIME,
                resolved_at DATETIME,
                FOREIGN KEY (equipment_id) REFERENCES equipment (id)
            )
        `);
        
        // Environmental monitoring
        await this.run(`
            CREATE TABLE IF NOT EXISTS environmental_data (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
                water_ph REAL,
                water_turbidity REAL,
                air_quality_pm25 REAL,
                air_quality_pm10 REAL,
                noise_level REAL,
                dust_concentration REAL,
                temperature REAL,
                humidity REAL,
                wind_speed REAL,
                rainfall REAL,
                monitoring_station TEXT,
                compliance_status TEXT
            )
        `);
        
        // Ore analysis data
        await this.run(`
            CREATE TABLE IF NOT EXISTS ore_analysis (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                sample_id TEXT UNIQUE NOT NULL,
                timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
                location TEXT NOT NULL,
                depth REAL,
                gold_grade REAL NOT NULL,
                silver_grade REAL,
                copper_grade REAL,
                sulfur_content REAL,
                hardness REAL,
                moisture_content REAL,
                particle_size REAL,
                analyzed_by TEXT,
                analysis_method TEXT,
                quality_control BOOLEAN DEFAULT 0
            )
        `);
        
        // Optimization history
        await this.run(`
            CREATE TABLE IF NOT EXISTS optimization_history (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
                optimization_type TEXT NOT NULL,
                parameters TEXT,
                recommendations TEXT,
                projected_impact TEXT,
                actual_impact TEXT,
                implementation_status TEXT DEFAULT 'pending',
                confidence_score REAL,
                created_by TEXT
            )
        `);
        
        // User sessions and activity
        await this.run(`
            CREATE TABLE IF NOT EXISTS user_sessions (
                id TEXT PRIMARY KEY,
                user_id TEXT NOT NULL,
                username TEXT NOT NULL,
                role TEXT NOT NULL,
                login_time DATETIME DEFAULT CURRENT_TIMESTAMP,
                last_activity DATETIME DEFAULT CURRENT_TIMESTAMP,
                ip_address TEXT,
                user_agent TEXT,
                active BOOLEAN DEFAULT 1
            )
        `);
    }
    
    async seedInitialData() {
        // Check if data already exists
        const equipmentCount = await this.get('SELECT COUNT(*) as count FROM equipment');
        if (equipmentCount.count > 0) {
            return; // Data already seeded
        }
        
        // Seed equipment data
        const equipment = [
            {
                id: 'EXC-001',
                name: 'Primary Excavator',
                type: 'Excavator',
                manufacturer: 'Caterpillar',
                model: 'CAT 390F',
                status: 'operational',
                efficiency: 92.5,
                location: 'Pit A, Level 1',
                installation_date: '2022-03-15',
                last_maintenance: '2024-12-15',
                next_maintenance: '2025-02-15',
                operating_hours: 1247,
                maintenance_cost: 15000,
                energy_consumption: 245.5,
                specifications: JSON.stringify({
                    enginePower: '525 HP',
                    bucketCapacity: '4.5 m³',
                    operatingWeight: '90 tons',
                    maxDigDepth: '8.5 m'
                })
            },
            {
                id: 'TRK-001',
                name: 'Haul Truck #1',
                type: 'Haul Truck',
                manufacturer: 'Komatsu',
                model: 'HD785-8',
                status: 'operational',
                efficiency: 88.3,
                location: 'Route 1',
                installation_date: '2022-06-20',
                last_maintenance: '2024-12-20',
                next_maintenance: '2025-01-20',
                operating_hours: 987,
                maintenance_cost: 8500,
                energy_consumption: 189.2,
                specifications: JSON.stringify({
                    payloadCapacity: '91 tons',
                    enginePower: '1050 HP',
                    fuelCapacity: '1500 L',
                    maxSpeed: '64 km/h'
                })
            },
            {
                id: 'CRU-001',
                name: 'Primary Crusher',
                type: 'Crusher',
                manufacturer: 'Metso',
                model: 'C160',
                status: 'maintenance',
                efficiency: 0,
                location: 'Plant A, Crushing Circuit',
                installation_date: '2021-09-10',
                last_maintenance: '2025-01-10',
                next_maintenance: '2025-01-17',
                operating_hours: 2156,
                maintenance_cost: 25000,
                energy_consumption: 450.8,
                specifications: JSON.stringify({
                    capacity: '800 tph',
                    crushingForce: '1000 kN',
                    feedSize: '1200 mm',
                    productSize: '150 mm'
                })
            },
            {
                id: 'DRL-001',
                name: 'Blast Hole Drill #1',
                type: 'Drill',
                manufacturer: 'Atlas Copco',
                model: 'FlexiROC T50R',
                status: 'operational',
                efficiency: 95.1,
                location: 'Pit B, Level 2',
                installation_date: '2022-11-05',
                last_maintenance: '2024-12-08',
                next_maintenance: '2025-02-08',
                operating_hours: 1543,
                maintenance_cost: 12000,
                energy_consumption: 195.4,
                specifications: JSON.stringify({
                    holeDepth: '54 m',
                    holeDiameter: '229 mm',
                    penetrationRate: '40 m/h',
                    tramSpeed: '3.2 km/h'
                })
            },
            {
                id: 'CON-001',
                name: 'Conveyor Belt A',
                type: 'Conveyor',
                manufacturer: 'Continental',
                model: 'ContiTech EP400',
                status: 'operational',
                efficiency: 96.8,
                location: 'Plant A, Material Handling',
                installation_date: '2021-05-12',
                last_maintenance: '2024-12-25',
                next_maintenance: '2025-03-25',
                operating_hours: 3421,
                maintenance_cost: 5500,
                energy_consumption: 125.6,
                specifications: JSON.stringify({
                    beltWidth: '2000 mm',
                    capacity: '4000 tph',
                    speed: '6.3 m/s',
                    length: '1200 m'
                })
            }
        ];
        
        for (const eq of equipment) {
            await this.run(`
                INSERT INTO equipment (
                    id, name, type, manufacturer, model, status, efficiency, location,
                    installation_date, last_maintenance, next_maintenance, operating_hours,
                    maintenance_cost, energy_consumption, specifications
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            `, [
                eq.id, eq.name, eq.type, eq.manufacturer, eq.model, eq.status,
                eq.efficiency, eq.location, eq.installation_date, eq.last_maintenance,
                eq.next_maintenance, eq.operating_hours, eq.maintenance_cost,
                eq.energy_consumption, eq.specifications
            ]);
        }
        
        // Seed production data for the last 30 days
        for (let i = 29; i >= 0; i--) {
            const date = new Date();
            date.setDate(date.getDate() - i);
            
            const baseProduction = 24.5;
            const variance = (Math.random() - 0.5) * 6; // ±3 oz variance
            const goldProduced = Math.max(15, baseProduction + variance);
            const oreProcessed = goldProduced * 580 + (Math.random() - 0.5) * 200;
            
            await this.run(`
                INSERT INTO production (
                    timestamp, gold_produced, ore_processed, waste_generated,
                    recovery_rate, ore_grade, energy_consumed, water_used,
                    efficiency, cost_per_ounce, shift_id
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            `, [
                date.toISOString(),
                goldProduced,
                oreProcessed,
                oreProcessed * 4.2, // waste ratio
                90 + Math.random() * 8, // recovery rate 90-98%
                2.2 + Math.random() * 0.8, // ore grade 2.2-3.0 g/t
                oreProcessed * 0.045, // energy consumption
                oreProcessed * 2.1, // water usage
                82 + Math.random() * 16, // efficiency 82-98%
                1200 + Math.random() * 150, // cost per ounce $1200-$1350
                `SHIFT-${date.getDate()}-${Math.floor(Math.random() * 3) + 1}`
            ]);
        }
        
        // Seed some sample alerts
        const alerts = [
            {
                type: 'warning',
                category: 'equipment',
                severity: 'medium',
                title: 'Crusher Efficiency Drop',
                message: 'Primary crusher efficiency dropped to 75%, maintenance required',
                source: 'monitoring_system',
                equipment_id: 'CRU-001'
            },
            {
                type: 'info',
                category: 'maintenance',
                severity: 'low',
                title: 'Scheduled Maintenance Reminder',
                message: 'Haul Truck #1 maintenance scheduled for tomorrow',
                source: 'maintenance_system',
                equipment_id: 'TRK-001'
            },
            {
                type: 'critical',
                category: 'safety',
                severity: 'high',
                title: 'High Dust Levels Detected',
                message: 'Dust concentration exceeded safe limits in Pit A',
                source: 'environmental_monitoring'
            }
        ];
        
        for (const alert of alerts) {
            await this.run(`
                INSERT INTO alerts (type, category, severity, title, message, source, equipment_id)
                VALUES (?, ?, ?, ?, ?, ?, ?)
            `, [alert.type, alert.category, alert.severity, alert.title, alert.message, alert.source, alert.equipment_id]);
        }
        
        console.log('Initial data seeded successfully');
    }
    
    // Production data methods
    async getProductionData(days = 30) {
        const query = `
            SELECT 
                DATE(timestamp) as date,
                SUM(gold_produced) as gold,
                SUM(ore_processed) as ore,
                AVG(efficiency) as efficiency,
                AVG(recovery_rate) as recovery,
                AVG(ore_grade) as grade,
                SUM(energy_consumed) as energy,
                SUM(water_used) as water,
                AVG(cost_per_ounce) as cost
            FROM production 
            WHERE timestamp >= datetime('now', '-${days} days')
            GROUP BY DATE(timestamp)
            ORDER BY date
        `;
        return await this.all(query);
    }
    
    async addProductionRecord(data) {
        return await this.run(`
            INSERT INTO production (
                gold_produced, ore_processed, waste_generated, recovery_rate,
                ore_grade, energy_consumed, water_used, efficiency,
                cost_per_ounce, shift_id, weather_conditions, notes
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `, [
            data.goldProduced, data.oreProcessed, data.wasteGenerated, data.recoveryRate,
            data.oreGrade, data.energyConsumed, data.waterUsed, data.efficiency,
            data.costPerOunce, data.shiftId, data.weatherConditions, data.notes
        ]);
    }
    
    // Equipment data methods
    async getEquipmentData() {
        const query = `
            SELECT 
                id, name, type, manufacturer, model, status, efficiency,
                location, last_maintenance, next_maintenance, operating_hours,
                maintenance_cost, energy_consumption, specifications
            FROM equipment
            ORDER BY type, name
        `;
        const equipment = await this.all(query);
        
        // Parse JSON specifications
        return equipment.map(eq => ({
            ...eq,
            specifications: eq.specifications ? JSON.parse(eq.specifications) : {}
        }));
    }
    
    async getEquipmentById(id) {
        const equipment = await this.get(`
            SELECT * FROM equipment WHERE id = ?
        `, [id]);
        
        if (equipment && equipment.specifications) {
            equipment.specifications = JSON.parse(equipment.specifications);
        }
        
        return equipment;
    }
    
    async updateEquipmentStatus(id, status) {
        return await this.run(`
            UPDATE equipment 
            SET status = ?, updated_at = CURRENT_TIMESTAMP
            WHERE id = ?
        `, [status, id]);
    }
    
    async updateEquipmentEfficiency(id, efficiency) {
        return await this.run(`
            UPDATE equipment 
            SET efficiency = ?, updated_at = CURRENT_TIMESTAMP
            WHERE id = ?
        `, [efficiency, id]);
    }
    
    // Maintenance methods
    async scheduleMaintenancefor(equipmentId, maintenanceData) {
        return await this.run(`
            INSERT INTO maintenance_logs (
                equipment_id, maintenance_type, description, cost,
                duration_hours, technician, started_at, status
            ) VALUES (?, ?, ?, ?, ?, ?, ?, 'scheduled')
        `, [
            equipmentId, maintenanceData.type, maintenanceData.description,
            maintenanceData.cost, maintenanceData.duration, maintenanceData.technician,
            maintenanceData.scheduledDate
        ]);
    }
    
    async getMaintenanceSchedule() {
        return await this.all(`
            SELECT 
                ml.*, e.name as equipment_name, e.type as equipment_type
            FROM maintenance_logs ml
            JOIN equipment e ON ml.equipment_id = e.id
            WHERE ml.status IN ('scheduled', 'in_progress')
            ORDER BY ml.started_at
        `);
    }
    
    // Alert methods
    async getAlerts(limit = 50) {
        return await this.all(`
            SELECT * FROM alerts 
            ORDER BY created_at DESC 
            LIMIT ?
        `, [limit]);
    }
    
    async addAlert(alert) {
        return await this.run(`
            INSERT INTO alerts (type, category, severity, title, message, source, equipment_id)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        `, [alert.type, alert.category, alert.severity, alert.title, alert.message, alert.source, alert.equipmentId]);
    }
    
    async acknowledgeAlert(id, userId) {
        return await this.run(`
            UPDATE alerts 
            SET acknowledged = 1, acknowledged_at = CURRENT_TIMESTAMP
            WHERE id = ?
        `, [id]);
    }
    
    // Environmental data methods
    async addEnvironmentalData(data) {
        return await this.run(`
            INSERT INTO environmental_data (
                water_ph, water_turbidity, air_quality_pm25, air_quality_pm10,
                noise_level, dust_concentration, temperature, humidity,
                wind_speed, rainfall, monitoring_station, compliance_status
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `, [
            data.waterPh, data.waterTurbidity, data.airQualityPM25, data.airQualityPM10,
            data.noiseLevel, data.dustConcentration, data.temperature, data.humidity,
            data.windSpeed, data.rainfall, data.monitoringStation, data.complianceStatus
        ]);
    }
    
    async getEnvironmentalData(hours = 24) {
        return await this.all(`
            SELECT * FROM environmental_data
            WHERE timestamp >= datetime('now', '-${hours} hours')
            ORDER BY timestamp DESC
        `);
    }
    
    // Analytics and reporting methods
    async getProductionSummary(period = 'week') {
        let dateFilter;
        switch (period) {
            case 'day': dateFilter = '-1 days'; break;
            case 'week': dateFilter = '-7 days'; break;
            case 'month': dateFilter = '-30 days'; break;
            case 'year': dateFilter = '-365 days'; break;
            default: dateFilter = '-7 days';
        }
        
        return await this.get(`
            SELECT 
                COUNT(*) as records,
                SUM(gold_produced) as total_gold,
                SUM(ore_processed) as total_ore,
                AVG(efficiency) as avg_efficiency,
                AVG(recovery_rate) as avg_recovery,
                AVG(cost_per_ounce) as avg_cost,
                MIN(cost_per_ounce) as min_cost,
                MAX(cost_per_ounce) as max_cost
            FROM production
            WHERE timestamp >= datetime('now', '${dateFilter}')
        `);
    }
    
    async getEquipmentEfficiencyTrends() {
        return await this.all(`
            SELECT 
                id, name, type, efficiency,
                operating_hours,
                CASE 
                    WHEN efficiency >= 95 THEN 'excellent'
                    WHEN efficiency >= 85 THEN 'good'
                    WHEN efficiency >= 75 THEN 'fair'
                    ELSE 'poor'
                END as performance_category
            FROM equipment
            ORDER BY efficiency DESC
        `);
    }
    
    // Cleanup and maintenance
    async cleanup() {
        // Remove old records (older than 1 year for production, 6 months for alerts)
        await this.run(`DELETE FROM production WHERE timestamp < datetime('now', '-1 year')`);
        await this.run(`DELETE FROM alerts WHERE created_at < datetime('now', '-6 months') AND resolved = 1`);
        await this.run(`DELETE FROM environmental_data WHERE timestamp < datetime('now', '-3 months')`);
        
        console.log('Database cleanup completed');
    }
    
    async close() {
        return new Promise((resolve, reject) => {
            this.db.close((err) => {
                if (err) reject(err);
                else resolve();
            });
        });
    }
}