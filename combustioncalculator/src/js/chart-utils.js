// Chart utilities and visualization functions
class ChartUtils {
    constructor() {
        this.charts = {};
        this.chartConfigs = this.initializeChartConfigs();
    }
    
    // Initialize chart configurations
    initializeChartConfigs() {
        return {
            composition: {
                type: 'doughnut',
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    title: {
                        display: true,
                        text: 'Flue Gas Composition (Dry Basis)'
                    },
                    legend: {
                        position: 'bottom'
                    }
                }
            },
            efficiency: {
                type: 'bar',
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    title: {
                        display: true,
                        text: 'Heat Balance Analysis'
                    },
                    legend: {
                        display: false
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        max: 100,
                        title: {
                            display: true,
                            text: 'Percentage (%)'
                        }
                    }
                }
            }
        };
    }
    
    // Create flue gas composition chart
    createCompositionChart(canvasId, flueGasComposition) {
        const ctx = document.getElementById(canvasId);
        if (!ctx) return null;
        
        // Destroy existing chart if it exists
        if (this.charts[canvasId]) {
            this.charts[canvasId].destroy();
        }
        
        const data = {
            labels: ['CO₂', 'O₂', 'N₂', 'H₂O'],
            datasets: [{
                label: 'Composition (%)',
                data: [
                    flueGasComposition.CO2,
                    flueGasComposition.O2,
                    flueGasComposition.N2,
                    flueGasComposition.H2O
                ],
                backgroundColor: [
                    '#FF6384', // CO2 - Red
                    '#36A2EB', // O2 - Blue
                    '#FFCE56', // N2 - Yellow
                    '#4BC0C0'  // H2O - Teal
                ],
                borderColor: [
                    '#FF6384',
                    '#36A2EB',
                    '#FFCE56',
                    '#4BC0C0'
                ],
                borderWidth: 2
            }]
        };
        
        const config = {
            ...this.chartConfigs.composition,
            data: data
        };
        
        this.charts[canvasId] = new Chart(ctx, config);
        return this.charts[canvasId];
    }
    
    // Create efficiency analysis chart
    createEfficiencyChart(canvasId, efficiencyData) {
        const ctx = document.getElementById(canvasId);
        if (!ctx) return null;
        
        // Destroy existing chart if it exists
        if (this.charts[canvasId]) {
            this.charts[canvasId].destroy();
        }
        
        const data = {
            labels: [
                'Useful Heat', 
                'Stack Loss', 
                'Radiation Loss', 
                'Moisture Loss', 
                'Incomplete Combustion', 
                'Unaccounted'
            ],
            datasets: [{
                label: 'Energy Distribution (%)',
                data: [
                    efficiencyData.efficiencies.thermal,
                    efficiencyData.losses.stack,
                    efficiencyData.losses.radiation,
                    efficiencyData.losses.moisture,
                    efficiencyData.losses.incomplete,
                    efficiencyData.losses.unaccounted
                ],
                backgroundColor: [
                    '#4CAF50', // Useful Heat - Green
                    '#FF9800', // Stack Loss - Orange
                    '#F44336', // Radiation Loss - Red
                    '#2196F3', // Moisture Loss - Blue
                    '#9C27B0', // Incomplete Combustion - Purple
                    '#607D8B'  // Unaccounted - Grey
                ],
                borderColor: [
                    '#4CAF50',
                    '#FF9800',
                    '#F44336',
                    '#2196F3',
                    '#9C27B0',
                    '#607D8B'
                ],
                borderWidth: 2
            }]
        };
        
        const config = {
            ...this.chartConfigs.efficiency,
            data: data
        };
        
        this.charts[canvasId] = new Chart(ctx, config);
        return this.charts[canvasId];
    }
    
    // Create temperature profile chart
    createTemperatureChart(canvasId, temperatureData) {
        const ctx = document.getElementById(canvasId);
        if (!ctx) return null;
        
        // Destroy existing chart if it exists
        if (this.charts[canvasId]) {
            this.charts[canvasId].destroy();
        }
        
        const data = {
            labels: [
                'Ambient',
                'Fuel/Air',
                'Combustion Zone',
                'Post Combustion',
                'Heat Exchange',
                'Stack'
            ],
            datasets: [{
                label: 'Temperature (°C)',
                data: [
                    temperatureData.ambient,
                    Math.max(temperatureData.fuel || 25, temperatureData.air || 25),
                    temperatureData.combustionZone,
                    temperatureData.postCombustion,
                    temperatureData.heatExchange,
                    temperatureData.stack
                ],
                borderColor: '#FF6384',
                backgroundColor: 'rgba(255, 99, 132, 0.1)',
                borderWidth: 3,
                fill: true,
                tension: 0.4
            }]
        };
        
        const config = {
            type: 'line',
            data: data,
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    title: {
                        display: true,
                        text: 'Temperature Profile Through System'
                    },
                    legend: {
                        display: false
                    }
                },
                scales: {
                    y: {
                        beginAtZero: false,
                        title: {
                            display: true,
                            text: 'Temperature (°C)'
                        }
                    },
                    x: {
                        title: {
                            display: true,
                            text: 'Process Stage'
                        }
                    }
                }
            }
        };
        
        this.charts[canvasId] = new Chart(ctx, config);
        return this.charts[canvasId];
    }
    
    // Create heat balance Sankey-style chart (simplified as stacked bar)
    createHeatBalanceChart(canvasId, heatBalanceData) {
        const ctx = document.getElementById(canvasId);
        if (!ctx) return null;
        
        // Destroy existing chart if it exists
        if (this.charts[canvasId]) {
            this.charts[canvasId].destroy();
        }
        
        const inputTotal = heatBalanceData.input.total;
        const outputData = heatBalanceData.output;
        
        const data = {
            labels: ['Heat Input', 'Heat Output'],
            datasets: [
                {
                    label: 'Combustion Heat',
                    data: [heatBalanceData.input.combustion, 0],
                    backgroundColor: '#4CAF50'
                },
                {
                    label: 'Sensible Heat',
                    data: [heatBalanceData.input.sensibleFuel + heatBalanceData.input.sensibleAir, 0],
                    backgroundColor: '#8BC34A'
                },
                {
                    label: 'Useful Heat',
                    data: [0, outputData.useful],
                    backgroundColor: '#2196F3'
                },
                {
                    label: 'Stack Loss',
                    data: [0, outputData.stack],
                    backgroundColor: '#FF9800'
                },
                {
                    label: 'Radiation Loss',
                    data: [0, outputData.radiation],
                    backgroundColor: '#F44336'
                },
                {
                    label: 'Other Losses',
                    data: [0, outputData.moisture + outputData.incomplete + outputData.unaccounted],
                    backgroundColor: '#9C27B0'
                }
            ]
        };
        
        const config = {
            type: 'bar',
            data: data,
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    title: {
                        display: true,
                        text: 'Heat Balance (kW)'
                    }
                },
                scales: {
                    x: {
                        stacked: true,
                        title: {
                            display: true,
                            text: 'Energy Flow'
                        }
                    },
                    y: {
                        stacked: true,
                        beginAtZero: true,
                        title: {
                            display: true,
                            text: 'Heat (kW)'
                        }
                    }
                }
            }
        };
        
        this.charts[canvasId] = new Chart(ctx, config);
        return this.charts[canvasId];
    }
    
    // Create emissions comparison chart
    createEmissionsChart(canvasId, emissionsData, benchmark = null) {
        const ctx = document.getElementById(canvasId);
        if (!ctx) return null;
        
        // Destroy existing chart if it exists
        if (this.charts[canvasId]) {
            this.charts[canvasId].destroy();
        }
        
        const datasets = [
            {
                label: 'Current System',
                data: [emissionsData.co2Specific],
                backgroundColor: '#FF6384',
                borderColor: '#FF6384',
                borderWidth: 2
            }
        ];
        
        // Add benchmark if provided
        if (benchmark) {
            datasets.push({
                label: 'Industry Benchmark',
                data: [benchmark],
                backgroundColor: '#36A2EB',
                borderColor: '#36A2EB',
                borderWidth: 2
            });
        }
        
        const data = {
            labels: ['CO₂ Specific Emissions'],
            datasets: datasets
        };
        
        const config = {
            type: 'bar',
            data: data,
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    title: {
                        display: true,
                        text: 'CO₂ Emissions Comparison'
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        title: {
                            display: true,
                            text: 'kg CO₂/MWh'
                        }
                    }
                }
            }
        };
        
        this.charts[canvasId] = new Chart(ctx, config);
        return this.charts[canvasId];
    }
    
    // Update existing chart with new data
    updateChart(canvasId, newData) {
        if (this.charts[canvasId]) {
            const chart = this.charts[canvasId];
            chart.data = newData;
            chart.update();
        }
    }
    
    // Destroy specific chart
    destroyChart(canvasId) {
        if (this.charts[canvasId]) {
            this.charts[canvasId].destroy();
            delete this.charts[canvasId];
        }
    }
    
    // Destroy all charts
    destroyAllCharts() {
        for (const canvasId in this.charts) {
            this.charts[canvasId].destroy();
        }
        this.charts = {};
    }
    
    // Get chart instance
    getChart(canvasId) {
        return this.charts[canvasId] || null;
    }
    
    // Export chart as image
    exportChart(canvasId, filename = 'chart.png') {
        if (this.charts[canvasId]) {
            const chart = this.charts[canvasId];
            const url = chart.toBase64Image();
            
            // Create download link
            const link = document.createElement('a');
            link.download = filename;
            link.href = url;
            link.click();
        }
    }
    
    // Create comprehensive dashboard with multiple charts
    createDashboard(results) {
        // Create composition chart
        this.createCompositionChart('compositionChart', results.combustion.flueGasComposition);
        
        // Create efficiency chart
        this.createEfficiencyChart('efficiencyChart', results.efficiency);
        
        // Add additional charts if containers exist
        const tempChartContainer = document.getElementById('temperatureChart');
        if (tempChartContainer) {
            this.createTemperatureChart('temperatureChart', results.heatTransfer.temperatures);
        }
        
        const heatBalanceContainer = document.getElementById('heatBalanceChart');
        if (heatBalanceContainer) {
            this.createHeatBalanceChart('heatBalanceChart', results.efficiency.heatBalance);
        }
        
        const emissionsContainer = document.getElementById('emissionsChart');
        if (emissionsContainer) {
            this.createEmissionsChart('emissionsChart', results.efficiency.emissions, 400); // 400 kg/MWh benchmark
        }
    }
}

// Export for use in other modules
window.ChartUtils = ChartUtils;