// Gold Mine Optimizer - Backend Server
import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import helmet from 'helmet';
import path from 'path';
import { fileURLToPath } from 'url';

import { OptimizationEngine } from './optimization/engine.js';
import { DatabaseManager } from './database/manager.js';
import { MonitoringSystem } from './monitoring/system.js';
import { SafetyManager } from './safety/manager.js';
import { ReportGenerator } from './reports/generator.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

class GoldMineServer {
    constructor() {
        this.app = express();
        this.server = createServer(this.app);
        this.io = new Server(this.server, {
            cors: {
                origin: "*",
                methods: ["GET", "POST"]
            }
        });
        
        this.port = process.env.PORT || 3000;
        this.optimizationEngine = new OptimizationEngine();
        this.database = new DatabaseManager();
        this.monitoring = new MonitoringSystem();
        this.safety = new SafetyManager();
        this.reports = new ReportGenerator();
        
        this.init();
    }
    
    async init() {
        try {
            await this.setupMiddleware();
            await this.setupRoutes();
            await this.setupWebSocket();
            await this.initializeDatabase();
            await this.startMonitoring();
            this.startServer();
        } catch (error) {
            console.error('Server initialization failed:', error);
            process.exit(1);
        }
    }
    
    setupMiddleware() {
        this.app.use(helmet());
        this.app.use(cors());
        this.app.use(express.json());
        this.app.use(express.urlencoded({ extended: true }));
        this.app.use(express.static(path.join(__dirname, '../..')));
    }
    
    setupRoutes() {
        // API Routes
        this.app.get('/api/health', (req, res) => {
            res.json({ status: 'healthy', timestamp: new Date().toISOString() });
        });
        
        // Production endpoints
        this.app.get('/api/production', async (req, res) => {
            try {
                const data = await this.database.getProductionData();
                res.json(data);
            } catch (error) {
                res.status(500).json({ error: error.message });
            }
        });
        
        this.app.get('/api/production/optimize', async (req, res) => {
            try {
                const optimization = await this.optimizationEngine.optimizeProduction();
                res.json(optimization);
            } catch (error) {
                res.status(500).json({ error: error.message });
            }
        });
        
        // Equipment endpoints
        this.app.get('/api/equipment', async (req, res) => {
            try {
                const equipment = await this.database.getEquipmentData();
                res.json(equipment);
            } catch (error) {
                res.status(500).json({ error: error.message });
            }
        });
        
        this.app.get('/api/equipment/:id', async (req, res) => {
            try {
                const equipment = await this.database.getEquipmentById(req.params.id);
                res.json(equipment);
            } catch (error) {
                res.status(500).json({ error: error.message });
            }
        });
        
        this.app.post('/api/equipment/:id/maintenance', async (req, res) => {
            try {
                const result = await this.database.scheduleMaintenancefor(req.params.id, req.body);
                res.json(result);
            } catch (error) {
                res.status(500).json({ error: error.message });
            }
        });
        
        // Safety endpoints
        this.app.get('/api/safety', async (req, res) => {
            try {
                const safetyData = await this.safety.getSafetyMetrics();
                res.json(safetyData);
            } catch (error) {
                res.status(500).json({ error: error.message });
            }
        });
        
        this.app.post('/api/safety/incident', async (req, res) => {
            try {
                const incident = await this.safety.reportIncident(req.body);
                res.json(incident);
            } catch (error) {
                res.status(500).json({ error: error.message });
            }
        });
        
        // Analytics endpoints
        this.app.get('/api/analytics/predictions', async (req, res) => {
            try {
                const predictions = await this.optimizationEngine.generatePredictions();
                res.json(predictions);
            } catch (error) {
                res.status(500).json({ error: error.message });
            }
        });
        
        this.app.get('/api/analytics/optimization', async (req, res) => {
            try {
                const optimization = await this.optimizationEngine.getOptimizationSuggestions();
                res.json(optimization);
            } catch (error) {
                res.status(500).json({ error: error.message });
            }
        });
        
        // Reports endpoints
        this.app.get('/api/reports/:type', async (req, res) => {
            try {
                const report = await this.reports.generateReport(req.params.type, req.query);
                res.json(report);
            } catch (error) {
                res.status(500).json({ error: error.message });
            }
        });
        
        // Serve static files
        this.app.get('*', (req, res) => {
            res.sendFile(path.join(__dirname, '../../index.html'));
        });
    }
    
    setupWebSocket() {
        this.io.on('connection', (socket) => {
            console.log('Client connected:', socket.id);
            
            // Send initial data
            this.sendInitialData(socket);
            
            socket.on('request-update', (type) => {
                this.handleUpdateRequest(socket, type);
            });
            
            socket.on('equipment-command', async (data) => {
                try {
                    await this.handleEquipmentCommand(data);
                } catch (error) {
                    socket.emit('error', { message: error.message });
                }
            });
            
            socket.on('disconnect', () => {
                console.log('Client disconnected:', socket.id);
            });
        });
    }
    
    async sendInitialData(socket) {
        try {
            const [production, equipment, safety, alerts] = await Promise.all([
                this.database.getProductionData(),
                this.database.getEquipmentData(),
                this.safety.getSafetyMetrics(),
                this.database.getAlerts()
            ]);
            
            socket.emit('initial-data', {
                production,
                equipment,
                safety,
                alerts
            });
        } catch (error) {
            socket.emit('error', { message: 'Failed to load initial data' });
        }
    }
    
    async handleUpdateRequest(socket, type) {
        try {
            let data;
            switch (type) {
                case 'production':
                    data = await this.database.getProductionData();
                    socket.emit('production-update', data);
                    break;
                case 'equipment':
                    data = await this.database.getEquipmentData();
                    socket.emit('equipment-update', data);
                    break;
                case 'safety':
                    data = await this.safety.getSafetyMetrics();
                    socket.emit('safety-update', data);
                    break;
                default:
                    socket.emit('error', { message: 'Unknown update type' });
            }
        } catch (error) {
            socket.emit('error', { message: error.message });
        }
    }
    
    async handleEquipmentCommand(data) {
        const { equipmentId, command, parameters } = data;
        
        switch (command) {
            case 'start':
                await this.database.updateEquipmentStatus(equipmentId, 'operational');
                break;
            case 'stop':
                await this.database.updateEquipmentStatus(equipmentId, 'offline');
                break;
            case 'maintenance':
                await this.database.updateEquipmentStatus(equipmentId, 'maintenance');
                break;
            default:
                throw new Error('Unknown equipment command');
        }
        
        // Broadcast equipment update
        const equipment = await this.database.getEquipmentData();
        this.io.emit('equipment-update', equipment);
    }
    
    async initializeDatabase() {
        await this.database.initialize();
        console.log('Database initialized');
    }
    
    async startMonitoring() {
        // Start real-time monitoring
        this.monitoring.start();
        
        // Set up monitoring event handlers
        this.monitoring.on('production-update', (data) => {
            this.io.emit('production-update', data);
        });
        
        this.monitoring.on('equipment-alert', (alert) => {
            this.io.emit('alert', alert);
        });
        
        this.monitoring.on('safety-alert', (alert) => {
            this.safety.handleAlert(alert);
            this.io.emit('alert', alert);
        });
        
        console.log('Monitoring system started');
    }
    
    startServer() {
        this.server.listen(this.port, () => {
            console.log(`Gold Mine Optimizer server running on port ${this.port}`);
            console.log(`Dashboard available at: http://localhost:${this.port}`);
        });
    }
}

// Start the server
new GoldMineServer();