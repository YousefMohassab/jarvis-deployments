// Gold Mine Optimizer - Main Application
class GoldMineOptimizer {
    constructor() {
        this.socket = null;
        this.charts = {};
        this.currentTab = 'dashboard';
        this.data = {
            production: [],
            equipment: [],
            alerts: [],
            safety: {},
            analytics: {}
        };
        
        this.init();
    }
    
    async init() {
        try {
            await this.initializeUI();
            await this.initializeSocket();
            await this.loadInitialData();
            await this.initializeCharts();
            this.startRealTimeUpdates();
            this.hideLoading();
        } catch (error) {
            console.error('Initialization error:', error);
            this.showError('Failed to initialize application');
        }
    }
    
    initializeUI() {
        // Tab navigation
        document.querySelectorAll('.nav-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.switchTab(e.target.dataset.tab);
            });
        });
        
        // Current time update
        this.updateCurrentTime();
        setInterval(() => this.updateCurrentTime(), 1000);
        
        // Modal handlers
        this.initializeModals();
        
        // Equipment table interactions
        this.initializeEquipmentTable();
    }
    
    initializeSocket() {
        this.socket = io('http://localhost:3000');
        
        this.socket.on('connect', () => {
            console.log('Connected to server');
        });
        
        this.socket.on('production-update', (data) => {
            this.updateProductionData(data);
        });
        
        this.socket.on('equipment-update', (data) => {
            this.updateEquipmentData(data);
        });
        
        this.socket.on('alert', (alert) => {
            this.addAlert(alert);
        });
        
        this.socket.on('safety-update', (data) => {
            this.updateSafetyData(data);
        });
    }
    
    async loadInitialData() {
        // Simulate loading initial data
        await this.delay(1000);
        
        // Generate mock data
        this.data = {
            production: this.generateProductionData(),
            equipment: this.generateEquipmentData(),
            alerts: this.generateAlerts(),
            safety: this.generateSafetyData(),
            analytics: this.generateAnalyticsData()
        };
    }
    
    initializeCharts() {
        this.initializeProductionChart();
        this.initializeMaintenanceChart();
        this.initializeProductionMetricsChart();
        this.initializeOreGradeChart();
        this.initializeEnvironmentalChart();
        this.initializeOptimizationChart();
    }
    
    initializeProductionChart() {
        const ctx = document.getElementById('production-chart');
        if (!ctx) return;
        
        this.charts.production = new Chart(ctx, {
            type: 'line',
            data: {
                labels: this.data.production.map(p => p.date),
                datasets: [{
                    label: 'Gold Production (oz)',
                    data: this.data.production.map(p => p.gold),
                    borderColor: '#FFD700',
                    backgroundColor: 'rgba(255, 215, 0, 0.1)',
                    tension: 0.4,
                    fill: true
                }]
            },
            options: {
                responsive: true,
                plugins: {
                    legend: {
                        labels: { color: '#ffffff' }
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: { color: '#cccccc' },
                        grid: { color: '#404040' }
                    },
                    x: {
                        ticks: { color: '#cccccc' },
                        grid: { color: '#404040' }
                    }
                }
            }
        });
    }
    
    initializeMaintenanceChart() {
        const ctx = document.getElementById('maintenance-chart');
        if (!ctx) return;
        
        const maintenanceData = this.data.equipment.map(eq => ({
            equipment: eq.id,
            daysUntil: Math.floor(Math.random() * 30) + 1
        }));
        
        this.charts.maintenance = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: maintenanceData.map(m => m.equipment),
                datasets: [{
                    label: 'Days Until Maintenance',
                    data: maintenanceData.map(m => m.daysUntil),
                    backgroundColor: '#4A90E2',
                    borderColor: '#2980b9',
                    borderWidth: 1
                }]
            },
            options: {
                responsive: true,
                plugins: {
                    legend: {
                        labels: { color: '#ffffff' }
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: { color: '#cccccc' },
                        grid: { color: '#404040' }
                    },
                    x: {
                        ticks: { color: '#cccccc' },
                        grid: { color: '#404040' }
                    }
                }
            }
        });
    }
    
    initializeProductionMetricsChart() {
        const ctx = document.getElementById('production-metrics-chart');
        if (!ctx) return;
        
        this.charts.productionMetrics = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: ['Processed Ore', 'Waste Material', 'Gold Extracted'],
                datasets: [{
                    data: [65, 25, 10],
                    backgroundColor: ['#4A90E2', '#F5A623', '#FFD700'],
                    borderColor: '#2d2d2d',
                    borderWidth: 2
                }]
            },
            options: {
                responsive: true,
                plugins: {
                    legend: {
                        labels: { color: '#ffffff' }
                    }
                }
            }
        });
    }
    
    initializeOreGradeChart() {
        const ctx = document.getElementById('ore-grade-chart');
        if (!ctx) return;
        
        const gradeData = Array.from({length: 24}, (_, i) => ({
            hour: i,
            grade: 2.5 + (Math.random() - 0.5) * 1.2
        }));
        
        this.charts.oreGrade = new Chart(ctx, {
            type: 'line',
            data: {
                labels: gradeData.map(g => g.hour + ':00'),
                datasets: [{
                    label: 'Ore Grade (g/t)',
                    data: gradeData.map(g => g.grade),
                    borderColor: '#7ED321',
                    backgroundColor: 'rgba(126, 211, 33, 0.1)',
                    tension: 0.4,
                    fill: true
                }]
            },
            options: {
                responsive: true,
                plugins: {
                    legend: {
                        labels: { color: '#ffffff' }
                    }
                },
                scales: {
                    y: {
                        beginAtZero: false,
                        ticks: { color: '#cccccc' },
                        grid: { color: '#404040' }
                    },
                    x: {
                        ticks: { color: '#cccccc' },
                        grid: { color: '#404040' }
                    }
                }
            }
        });
    }
    
    initializeEnvironmentalChart() {
        const ctx = document.getElementById('environmental-chart');
        if (!ctx) return;
        
        const envData = {
            labels: ['Water Quality', 'Air Quality', 'Noise Level', 'Dust Control', 'Waste Management'],
            datasets: [{
                label: 'Compliance Score',
                data: [95, 88, 92, 97, 91],
                backgroundColor: 'rgba(126, 211, 33, 0.6)',
                borderColor: '#7ED321',
                borderWidth: 2
            }]
        };
        
        this.charts.environmental = new Chart(ctx, {
            type: 'radar',
            data: envData,
            options: {
                responsive: true,
                plugins: {
                    legend: {
                        labels: { color: '#ffffff' }
                    }
                },
                scales: {
                    r: {
                        beginAtZero: true,
                        max: 100,
                        ticks: { color: '#cccccc' },
                        grid: { color: '#404040' },
                        pointLabels: { color: '#ffffff' }
                    }
                }
            }
        });
    }
    
    initializeOptimizationChart() {
        const ctx = document.getElementById('optimization-chart');
        if (!ctx) return;
        
        const optimizationData = {
            labels: ['Current', 'Optimized'],
            datasets: [{
                label: 'Production Efficiency (%)',
                data: [87.3, 94.2],
                backgroundColor: ['#F5A623', '#7ED321']
            }, {
                label: 'Cost per Ounce ($)',
                data: [1247, 1156],
                backgroundColor: ['#D0021B', '#7ED321']
            }]
        };
        
        this.charts.optimization = new Chart(ctx, {
            type: 'bar',
            data: optimizationData,
            options: {
                responsive: true,
                plugins: {
                    legend: {
                        labels: { color: '#ffffff' }
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: { color: '#cccccc' },
                        grid: { color: '#404040' }
                    },
                    x: {
                        ticks: { color: '#cccccc' },
                        grid: { color: '#404040' }
                    }
                }
            }
        });
    }
    
    updateDashboard() {
        // Update KPI values
        document.getElementById('daily-production').textContent = '24.7 oz';
        document.getElementById('equipment-efficiency').textContent = '87.3%';
        document.getElementById('cost-per-ounce').textContent = '$1,247';
        document.getElementById('safety-score').textContent = '96.2';
        
        // Update equipment status
        this.updateEquipmentStatus();
        
        // Update alerts
        this.updateAlerts();
    }
    
    updateEquipmentStatus() {
        const container = document.getElementById('equipment-status-list');
        if (!container) return;
        
        container.innerHTML = '';
        this.data.equipment.forEach(equipment => {
            const item = document.createElement('div');
            item.className = 'equipment-item';
            item.innerHTML = `
                <div class="equipment-name">${equipment.name}</div>
                <div class="status-badge status-${equipment.status}">${equipment.status}</div>
            `;
            container.appendChild(item);
        });
    }
    
    updateAlerts() {
        const container = document.getElementById('alert-list');
        if (!container) return;
        
        container.innerHTML = '';
        this.data.alerts.slice(0, 5).forEach(alert => {
            const item = document.createElement('div');
            item.className = `alert-item ${alert.type}`;
            item.innerHTML = `
                <div>${alert.message}</div>
                <div class="alert-time">${new Date(alert.timestamp).toLocaleString()}</div>
            `;
            container.appendChild(item);
        });
    }
    
    updateEquipmentPage() {
        this.updateEquipmentCards();
        this.updateEquipmentTable();
    }
    
    updateEquipmentCards() {
        const container = document.getElementById('equipment-cards');
        if (!container) return;
        
        container.innerHTML = '';
        this.data.equipment.forEach(equipment => {
            const card = document.createElement('div');
            card.className = 'equipment-card';
            card.innerHTML = `
                <h4>${equipment.name}</h4>
                <div class="status-badge status-${equipment.status}">${equipment.status}</div>
                <div>Efficiency: ${equipment.efficiency}%</div>
            `;
            card.addEventListener('click', () => this.showEquipmentDetails(equipment.id));
            container.appendChild(card);
        });
    }
    
    updateEquipmentTable() {
        const tbody = document.getElementById('equipment-table-body');
        if (!tbody) return;
        
        tbody.innerHTML = '';
        this.data.equipment.forEach(equipment => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${equipment.id}</td>
                <td>${equipment.type}</td>
                <td><span class="status-badge status-${equipment.status}">${equipment.status}</span></td>
                <td>${equipment.efficiency}%</td>
                <td>${equipment.nextMaintenance}</td>
                <td>
                    <button class="btn-primary" onclick="app.showEquipmentDetails('${equipment.id}')">
                        View Details
                    </button>
                </td>
            `;
            tbody.appendChild(row);
        });
    }
    
    updateProductionPage() {
        this.updateOptimizationSuggestions();
    }
    
    updateOptimizationSuggestions() {
        const container = document.getElementById('optimization-suggestions');
        if (!container) return;
        
        const suggestions = [
            {
                title: "Increase Crusher Throughput",
                description: "AI analysis suggests increasing crusher speed by 8% could boost daily production by 2.3 oz",
                impact: "High",
                confidence: 92
            },
            {
                title: "Optimize Haul Truck Routes",
                description: "Machine learning routing could reduce transport time by 15 minutes per cycle",
                impact: "Medium",
                confidence: 87
            },
            {
                title: "Adjust Ore Blending Ratios",
                description: "Dynamic blending optimization could improve recovery rates by 3.2%",
                impact: "High",
                confidence: 89
            }
        ];
        
        container.innerHTML = '';
        suggestions.forEach(suggestion => {
            const item = document.createElement('div');
            item.className = 'suggestion-item';
            item.innerHTML = `
                <div class="suggestion-header">
                    <h4>${suggestion.title}</h4>
                    <span class="impact-badge ${suggestion.impact.toLowerCase()}">${suggestion.impact} Impact</span>
                </div>
                <p>${suggestion.description}</p>
                <div class="confidence">AI Confidence: ${suggestion.confidence}%</div>
            `;
            container.appendChild(item);
        });
    }
    
    updateSafetyPage() {
        this.updateSafetyIncidents();
    }
    
    updateSafetyIncidents() {
        const container = document.getElementById('safety-incidents');
        if (!container) return;
        
        const incidents = [
            {
                type: "Near Miss",
                description: "Equipment operator noticed loose guard on conveyor belt",
                date: "2025-01-15",
                status: "Resolved"
            },
            {
                type: "Safety Audit",
                description: "Monthly safety inspection completed - 3 minor issues identified",
                date: "2025-01-14",
                status: "In Progress"
            },
            {
                type: "Training",
                description: "New safety protocol training session for night shift crew",
                date: "2025-01-12",
                status: "Completed"
            }
        ];
        
        container.innerHTML = '';
        incidents.forEach(incident => {
            const item = document.createElement('div');
            item.className = 'incident-item';
            item.innerHTML = `
                <div class="incident-header">
                    <strong>${incident.type}</strong>
                    <span class="incident-date">${incident.date}</span>
                </div>
                <p>${incident.description}</p>
                <div class="incident-status status-${incident.status.toLowerCase().replace(' ', '-')}">${incident.status}</div>
            `;
            container.appendChild(item);
        });
    }
    
    updateAnalyticsPage() {
        this.updateAIPredictions();
        this.updateMLModels();
    }
    
    updateAIPredictions() {
        const container = document.getElementById('ai-predictions');
        if (!container) return;
        
        const predictions = [
            {
                title: "24-Hour Production Forecast",
                prediction: "26.8 oz",
                confidence: "94%",
                trend: "up"
            },
            {
                title: "Equipment Failure Risk",
                prediction: "Low Risk",
                confidence: "87%",
                trend: "stable"
            },
            {
                title: "Optimal Processing Schedule",
                prediction: "Peak: 14:00-18:00",
                confidence: "91%",
                trend: "up"
            }
        ];
        
        container.innerHTML = '';
        predictions.forEach(prediction => {
            const card = document.createElement('div');
            card.className = 'prediction-card';
            card.innerHTML = `
                <h4>${prediction.title}</h4>
                <div class="prediction-value">${prediction.prediction}</div>
                <div class="prediction-confidence">Confidence: ${prediction.confidence}</div>
            `;
            container.appendChild(card);
        });
    }
    
    updateMLModels() {
        const container = document.getElementById('ml-models');
        if (!container) return;
        
        const models = [
            { name: "Production Optimizer", accuracy: "94.2%", status: "Active" },
            { name: "Equipment Health", accuracy: "91.7%", status: "Active" },
            { name: "Ore Grade Predictor", accuracy: "89.3%", status: "Training" },
            { name: "Cost Optimizer", accuracy: "92.8%", status: "Active" }
        ];
        
        container.innerHTML = '';
        models.forEach(model => {
            const item = document.createElement('div');
            item.className = 'model-item';
            item.innerHTML = `
                <div class="model-header">
                    <strong>${model.name}</strong>
                    <span class="model-status status-${model.status.toLowerCase()}">${model.status}</span>
                </div>
                <div class="model-accuracy">Accuracy: ${model.accuracy}</div>
            `;
            container.appendChild(item);
        });
    }
    
    switchTab(tabName) {
        // Update navigation
        document.querySelectorAll('.nav-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        document.querySelector(`[data-tab="${tabName}"]`).classList.add('active');
        
        // Update content
        document.querySelectorAll('.tab-content').forEach(content => {
            content.classList.remove('active');
        });
        document.getElementById(tabName).classList.add('active');
        
        this.currentTab = tabName;
        
        // Update tab-specific content
        switch(tabName) {
            case 'dashboard':
                this.updateDashboard();
                break;
            case 'equipment':
                this.updateEquipmentPage();
                break;
            case 'production':
                this.updateProductionPage();
                break;
            case 'safety':
                this.updateSafetyPage();
                break;
            case 'analytics':
                this.updateAnalyticsPage();
                break;
        }
    }
    
    showEquipmentDetails(equipmentId) {
        const equipment = this.data.equipment.find(eq => eq.id === equipmentId);
        if (!equipment) return;
        
        const modal = document.getElementById('equipment-modal');
        const content = document.getElementById('equipment-modal-content');
        
        content.innerHTML = `
            <h3>${equipment.name}</h3>
            <p><strong>Type:</strong> ${equipment.type}</p>
            <p><strong>Status:</strong> <span class="status-badge status-${equipment.status}">${equipment.status}</span></p>
            <p><strong>Efficiency:</strong> ${equipment.efficiency}%</p>
            <p><strong>Last Maintenance:</strong> ${equipment.lastMaintenance}</p>
            <p><strong>Next Maintenance:</strong> ${equipment.nextMaintenance}</p>
            <p><strong>Operating Hours:</strong> ${equipment.operatingHours}</p>
            <p><strong>Location:</strong> ${equipment.location}</p>
        `;
        
        modal.style.display = 'block';
    }
    
    initializeModals() {
        const modal = document.getElementById('equipment-modal');
        const closeBtn = modal.querySelector('.close');
        
        closeBtn.addEventListener('click', () => {
            modal.style.display = 'none';
        });
        
        window.addEventListener('click', (event) => {
            if (event.target === modal) {
                modal.style.display = 'none';
            }
        });
    }
    
    initializeEquipmentTable() {
        // Equipment table interactions are handled in updateEquipmentTable
    }
    
    startRealTimeUpdates() {
        // Update KPIs every 30 seconds
        setInterval(() => {
            if (this.currentTab === 'dashboard') {
                this.updateDashboard();
            }
        }, 30000);
        
        // Simulate real-time data updates
        setInterval(() => {
            this.simulateDataUpdate();
        }, 5000);
    }
    
    simulateDataUpdate() {
        // Simulate minor fluctuations in production data
        const newProduction = {
            date: new Date().toISOString().split('T')[0],
            gold: 20 + Math.random() * 10,
            ore: 1000 + Math.random() * 200,
            efficiency: 80 + Math.random() * 20
        };
        
        this.data.production.push(newProduction);
        if (this.data.production.length > 30) {
            this.data.production.shift();
        }
        
        // Update charts if visible
        if (this.currentTab === 'dashboard' && this.charts.production) {
            this.charts.production.data.labels = this.data.production.map(p => p.date);
            this.charts.production.data.datasets[0].data = this.data.production.map(p => p.gold);
            this.charts.production.update();
        }
    }
    
    updateCurrentTime() {
        const now = new Date();
        document.getElementById('current-time').textContent = now.toLocaleTimeString();
    }
    
    hideLoading() {
        document.getElementById('loading').style.display = 'none';
    }
    
    showError(message) {
        // Create error notification
        const error = document.createElement('div');
        error.className = 'error-notification';
        error.textContent = message;
        document.body.appendChild(error);
        
        setTimeout(() => {
            document.body.removeChild(error);
        }, 5000);
    }
    
    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
    
    // Data generation methods
    generateProductionData() {
        const data = [];
        for (let i = 29; i >= 0; i--) {
            const date = new Date();
            date.setDate(date.getDate() - i);
            data.push({
                date: date.toISOString().split('T')[0],
                gold: 20 + Math.random() * 10,
                ore: 1000 + Math.random() * 200,
                efficiency: 80 + Math.random() * 20
            });
        }
        return data;
    }
    
    generateEquipmentData() {
        const equipment = [
            { id: 'EXC-001', name: 'Primary Excavator', type: 'Excavator', status: 'operational', efficiency: 92, location: 'Pit A', lastMaintenance: '2024-12-15', nextMaintenance: '2025-02-15', operatingHours: 1247 },
            { id: 'TRK-001', name: 'Haul Truck #1', type: 'Haul Truck', status: 'operational', efficiency: 88, location: 'Route 1', lastMaintenance: '2024-12-20', nextMaintenance: '2025-01-20', operatingHours: 987 },
            { id: 'CRU-001', name: 'Primary Crusher', type: 'Crusher', status: 'maintenance', efficiency: 0, location: 'Plant A', lastMaintenance: '2025-01-10', nextMaintenance: '2025-01-17', operatingHours: 2156 },
            { id: 'DRL-001', name: 'Drill Rig #1', type: 'Drill', status: 'operational', efficiency: 95, location: 'Pit B', lastMaintenance: '2024-12-08', nextMaintenance: '2025-02-08', operatingHours: 1543 },
            { id: 'CON-001', name: 'Conveyor Belt A', type: 'Conveyor', status: 'operational', efficiency: 96, location: 'Plant A', lastMaintenance: '2024-12-25', nextMaintenance: '2025-03-25', operatingHours: 3421 }
        ];
        return equipment;
    }
    
    generateAlerts() {
        const alerts = [
            { type: 'warning', message: 'Crusher efficiency dropped to 75%', timestamp: Date.now() - 300000 },
            { type: 'info', message: 'Scheduled maintenance for TRK-001 tomorrow', timestamp: Date.now() - 600000 },
            { type: 'critical', message: 'High dust levels detected in Pit A', timestamp: Date.now() - 900000 },
            { type: 'info', message: 'New ore deposit analysis available', timestamp: Date.now() - 1200000 },
            { type: 'warning', message: 'Weather forecast shows rain for next 3 days', timestamp: Date.now() - 1800000 }
        ];
        return alerts;
    }
    
    generateSafetyData() {
        return {
            daysWithoutIncident: 127,
            trainingCompletion: 94,
            ppeCompliance: 98.7,
            environmentalScore: 92.3
        };
    }
    
    generateAnalyticsData() {
        return {
            predictions: [],
            models: [],
            optimization: {}
        };
    }
    
    // Event handlers for real-time updates
    updateProductionData(data) {
        this.data.production.push(data);
        if (this.data.production.length > 30) {
            this.data.production.shift();
        }
    }
    
    updateEquipmentData(data) {
        const index = this.data.equipment.findIndex(eq => eq.id === data.id);
        if (index !== -1) {
            this.data.equipment[index] = { ...this.data.equipment[index], ...data };
        }
    }
    
    addAlert(alert) {
        this.data.alerts.unshift(alert);
        if (this.data.alerts.length > 20) {
            this.data.alerts.pop();
        }
        this.updateAlerts();
    }
    
    updateSafetyData(data) {
        this.data.safety = { ...this.data.safety, ...data };
    }
}

// Initialize application when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.app = new GoldMineOptimizer();
});

// Export for potential module use
export default GoldMineOptimizer;