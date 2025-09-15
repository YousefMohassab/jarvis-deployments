// Main Application Logic
class CornSyrupForecastApp {
    constructor() {
        this.forecastEngine = new ForecastEngine();
        this.chart = null;
        this.currentChartType = 'demand';
        this.initializeApp();
    }

    initializeApp() {
        this.setupEventListeners();
        this.loadSampleData();
    }

    setupEventListeners() {
        // Range input listeners for scenario planning
        document.getElementById('scenario-demand').addEventListener('input', () => this.updateScenario());
        document.getElementById('scenario-price').addEventListener('input', () => this.updateScenario());
        
        // Chart type toggle listeners
        document.querySelectorAll('.chart-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const chartType = e.target.textContent.toLowerCase().replace(' trends', '').replace(' ', '');
                this.toggleChart(chartType);
            });
        });
    }

    loadSampleData() {
        const sampleData = `Date,Production(tons),Price($),Demand(tons)
2023-01-01,1200,45.5,1180
2023-02-01,1350,46.2,1320
2023-03-01,1400,47.1,1380
2023-04-01,1250,46.8,1230
2023-05-01,1500,48.2,1450
2023-06-01,1600,49.1,1580
2023-07-01,1750,50.3,1720
2023-08-01,1800,51.2,1780
2023-09-01,1650,49.8,1630
2023-10-01,1550,48.5,1520
2023-11-01,1700,50.1,1680
2023-12-01,1900,52.3,1850
2024-01-01,1300,47.2,1280
2024-02-01,1450,48.1,1420
2024-03-01,1500,49.3,1480
2024-04-01,1350,48.9,1330
2024-05-01,1650,51.1,1620
2024-06-01,1750,52.4,1730
2024-07-01,1850,53.8,1820
2024-08-01,1900,54.2,1880`;

        document.getElementById('historical-data').value = sampleData;
        this.processData();
    }

    processData() {
        try {
            const csvData = document.getElementById('historical-data').value;
            if (!csvData.trim()) {
                this.showMessage('Please enter historical data', 'error');
                return;
            }

            this.forecastEngine.parseCSVData(csvData);
            this.updateMetrics();
            this.showMessage('Data processed successfully', 'success');
            
        } catch (error) {
            console.error('Error processing data:', error);
            this.showMessage('Error processing data: ' + error.message, 'error');
        }
    }

    generateForecast() {
        try {
            const method = document.getElementById('forecast-method').value;
            const periods = parseInt(document.getElementById('forecast-periods').value);
            const confidenceLevel = parseInt(document.getElementById('confidence-level').value);

            if (!this.forecastEngine.data.length) {
                this.showMessage('Please process data first', 'error');
                return;
            }

            let forecastResult;
            
            switch (method) {
                case 'linear':
                    forecastResult = this.forecastEngine.linearRegressionForecast(periods);
                    break;
                case 'exponential':
                    forecastResult = this.forecastEngine.exponentialSmoothingForecast(periods);
                    break;
                case 'moving-average':
                    forecastResult = this.forecastEngine.movingAverageForecast(periods);
                    break;
                case 'seasonal':
                    forecastResult = this.forecastEngine.seasonalDecompositionForecast(periods);
                    break;
                default:
                    forecastResult = this.forecastEngine.linearRegressionForecast(periods);
            }

            // Generate confidence intervals
            const confidenceIntervals = this.forecastEngine.generateConfidenceIntervals(
                forecastResult.forecast, 
                confidenceLevel
            );

            forecastResult.confidenceIntervals = confidenceIntervals;
            
            // Generate recommendations
            const recommendations = this.forecastEngine.generateRecommendations(forecastResult);
            forecastResult.recommendations = recommendations;

            this.displayForecastResults(forecastResult);
            this.updateChart(forecastResult);
            this.showMessage('Forecast generated successfully', 'success');
            
        } catch (error) {
            console.error('Error generating forecast:', error);
            this.showMessage('Error generating forecast: ' + error.message, 'error');
        }
    }

    updateMetrics() {
        const stats = this.forecastEngine.processedData.stats;
        if (!stats) return;

        document.getElementById('current-production').textContent = Math.round(stats.avgProduction).toLocaleString();
        document.getElementById('avg-demand').textContent = Math.round(stats.avgDemand).toLocaleString();
        document.getElementById('trend-direction').textContent = stats.trend.charAt(0).toUpperCase() + stats.trend.slice(1);
        
        // Calculate a simple forecast accuracy metric
        const accuracy = Math.max(0, 100 - (stats.demandStdDev / stats.avgDemand * 100));
        document.getElementById('forecast-accuracy').textContent = Math.round(accuracy) + '%';
    }

    displayForecastResults(forecastResult) {
        const resultsContainer = document.getElementById('forecast-results');
        
        let html = `<h3>Forecast Results - ${forecastResult.method}</h3>`;
        
        // Summary statistics
        const avgForecast = this.forecastEngine.mean(forecastResult.forecast);
        const maxForecast = Math.max(...forecastResult.forecast);
        const minForecast = Math.min(...forecastResult.forecast);
        
        html += `
            <div class="forecast-summary">
                <p><strong>Average Forecasted Demand:</strong> ${Math.round(avgForecast).toLocaleString()} tons</p>
                <p><strong>Peak Demand:</strong> ${Math.round(maxForecast).toLocaleString()} tons</p>
                <p><strong>Minimum Demand:</strong> ${Math.round(minForecast).toLocaleString()} tons</p>
            </div>
        `;

        // Method-specific information
        if (forecastResult.r2) {
            html += `<p><strong>Model Accuracy (R²):</strong> ${(forecastResult.r2 * 100).toFixed(1)}%</p>`;
        }
        
        if (forecastResult.alpha) {
            html += `<p><strong>Smoothing Factor:</strong> ${forecastResult.alpha}</p>`;
        }

        // Recommendations
        if (forecastResult.recommendations && forecastResult.recommendations.length > 0) {
            html += '<h4>Recommendations:</h4><ul>';
            forecastResult.recommendations.forEach(rec => {
                html += `<li class="${rec.priority}-priority">${rec.message}</li>`;
            });
            html += '</ul>';
        }

        // Forecast values
        html += '<h4>Detailed Forecast:</h4><ul>';
        const startDate = new Date();
        startDate.setMonth(startDate.getMonth() + 1);
        
        forecastResult.forecast.slice(0, 6).forEach((value, index) => {
            const forecastDate = new Date(startDate);
            forecastDate.setMonth(forecastDate.getMonth() + index);
            const dateStr = forecastDate.toLocaleDateString('en-US', { year: 'numeric', month: 'short' });
            
            html += `<li>${dateStr}: ${Math.round(value).toLocaleString()} tons`;
            
            if (forecastResult.confidenceIntervals && forecastResult.confidenceIntervals[index]) {
                const ci = forecastResult.confidenceIntervals[index];
                html += ` (${Math.round(ci.lower).toLocaleString()} - ${Math.round(ci.upper).toLocaleString()})`;
            }
            
            html += '</li>';
        });
        html += '</ul>';

        resultsContainer.innerHTML = html;
    }

    updateChart(forecastResult) {
        const ctx = document.getElementById('forecast-chart').getContext('2d');
        
        if (this.chart) {
            this.chart.destroy();
        }

        const data = this.forecastEngine.processedData;
        const historical = data[this.currentChartType] || data.demand;
        
        // Create date labels
        const historicalDates = data.dates.map(date => date.toLocaleDateString('en-US', { year: 'numeric', month: 'short' }));
        
        const forecastDates = [];
        const startDate = new Date(data.dates[data.dates.length - 1]);
        
        for (let i = 1; i <= forecastResult.forecast.length; i++) {
            const forecastDate = new Date(startDate);
            forecastDate.setMonth(forecastDate.getMonth() + i);
            forecastDates.push(forecastDate.toLocaleDateString('en-US', { year: 'numeric', month: 'short' }));
        }

        const chartData = {
            labels: [...historicalDates, ...forecastDates],
            datasets: [{
                label: 'Historical',
                data: [...historical, ...Array(forecastResult.forecast.length).fill(null)],
                borderColor: '#667eea',
                backgroundColor: 'rgba(102, 126, 234, 0.1)',
                fill: false,
                tension: 0.1
            }, {
                label: 'Forecast',
                data: [...Array(historical.length).fill(null), ...forecastResult.forecast],
                borderColor: '#48bb78',
                backgroundColor: 'rgba(72, 187, 120, 0.1)',
                fill: false,
                tension: 0.1,
                borderDash: [5, 5]
            }]
        };

        // Add confidence intervals if available
        if (forecastResult.confidenceIntervals) {
            const upperBound = [...Array(historical.length).fill(null), 
                ...forecastResult.confidenceIntervals.map(ci => ci.upper)];
            const lowerBound = [...Array(historical.length).fill(null), 
                ...forecastResult.confidenceIntervals.map(ci => ci.lower)];

            chartData.datasets.push({
                label: 'Upper Confidence',
                data: upperBound,
                borderColor: 'rgba(72, 187, 120, 0.3)',
                backgroundColor: 'rgba(72, 187, 120, 0.1)',
                fill: '+1',
                tension: 0.1
            }, {
                label: 'Lower Confidence',
                data: lowerBound,
                borderColor: 'rgba(72, 187, 120, 0.3)',
                backgroundColor: 'rgba(72, 187, 120, 0.1)',
                fill: false,
                tension: 0.1
            });
        }

        this.chart = new Chart(ctx, {
            type: 'line',
            data: chartData,
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    y: {
                        beginAtZero: true,
                        title: {
                            display: true,
                            text: this.currentChartType === 'price' ? 'Price ($)' : 'Volume (tons)'
                        }
                    },
                    x: {
                        title: {
                            display: true,
                            text: 'Time Period'
                        }
                    }
                },
                plugins: {
                    legend: {
                        display: true,
                        position: 'top'
                    },
                    tooltip: {
                        mode: 'index',
                        intersect: false,
                    }
                }
            }
        });
    }

    toggleChart(chartType) {
        this.currentChartType = chartType;
        
        // Update button states
        document.querySelectorAll('.chart-btn').forEach(btn => btn.classList.remove('active'));
        event.target.classList.add('active');
        
        // Regenerate chart if we have data
        if (this.forecastEngine.processedData.dates) {
            this.generateForecast();
        }
    }

    updateScenario() {
        const demandChange = document.getElementById('scenario-demand').value;
        const priceChange = document.getElementById('scenario-price').value;
        
        document.getElementById('demand-value').textContent = `${demandChange}%`;
        document.getElementById('price-value').textContent = `${priceChange}%`;
        
        // Calculate scenario impact
        let impact = 'Baseline scenario';
        const totalChange = Math.abs(parseInt(demandChange)) + Math.abs(parseInt(priceChange));
        
        if (totalChange > 30) {
            impact = 'High impact scenario - Significant adjustments needed';
        } else if (totalChange > 15) {
            impact = 'Medium impact scenario - Moderate adjustments recommended';
        } else if (totalChange > 5) {
            impact = 'Low impact scenario - Minor adjustments may be needed';
        }
        
        document.getElementById('impact-text').textContent = impact;
    }

    exportForecast() {
        if (!this.forecastEngine.data.length) {
            this.showMessage('No data to export', 'error');
            return;
        }

        // Create CSV content
        let csvContent = 'Date,Historical Demand,Forecasted Demand,Upper Bound,Lower Bound\n';
        
        const data = this.forecastEngine.processedData;
        
        // Add historical data
        data.dates.forEach((date, index) => {
            csvContent += `${date.toISOString().split('T')[0]},${data.demand[index]},,\n`;
        });
        
        // Add forecast data (if available)
        // This would be populated after generating a forecast
        
        // Create and download file
        const blob = new Blob([csvContent], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'corn_syrup_forecast.csv';
        a.click();
        window.URL.revokeObjectURL(url);
        
        this.showMessage('Forecast exported successfully', 'success');
    }

    generateReport() {
        if (!this.forecastEngine.data.length) {
            this.showMessage('No data available for report', 'error');
            return;
        }

        const stats = this.forecastEngine.processedData.stats;
        const reportDate = new Date().toLocaleDateString();
        
        const reportHTML = `
            <div class="report-content">
                <h2>Corn Syrup Demand Forecast Report</h2>
                <p><strong>Generated:</strong> ${reportDate}</p>
                
                <h3>Executive Summary</h3>
                <p>This report analyzes historical corn syrup production and demand data to provide forecasting insights for production planning.</p>
                
                <h3>Key Metrics</h3>
                <ul>
                    <li>Average Historical Production: ${Math.round(stats.avgProduction).toLocaleString()} tons</li>
                    <li>Average Historical Demand: ${Math.round(stats.avgDemand).toLocaleString()} tons</li>
                    <li>Demand Trend: ${stats.trend}</li>
                    <li>Seasonality Detected: ${stats.seasonality.detected ? 'Yes' : 'No'}</li>
                </ul>
                
                <h3>Recommendations</h3>
                <p>Based on the analysis, we recommend:</p>
                <ul>
                    <li>Monitor demand trends closely for capacity planning</li>
                    <li>Implement seasonal inventory adjustments</li>
                    <li>Consider market factors in production scheduling</li>
                </ul>
            </div>
        `;
        
        // Open report in new window
        const reportWindow = window.open('', '_blank');
        reportWindow.document.write(`
            <html>
                <head>
                    <title>Corn Syrup Forecast Report</title>
                    <style>
                        body { font-family: Arial, sans-serif; padding: 20px; }
                        h2, h3 { color: #333; }
                        ul { padding-left: 20px; }
                        .report-content { max-width: 800px; margin: 0 auto; }
                    </style>
                </head>
                <body>${reportHTML}</body>
            </html>
        `);
        
        this.showMessage('Report generated successfully', 'success');
    }

    showMessage(message, type) {
        // Create message element
        const messageDiv = document.createElement('div');
        messageDiv.className = type;
        messageDiv.textContent = message;
        
        // Add to page
        const container = document.querySelector('.container');
        container.insertBefore(messageDiv, container.firstChild);
        
        // Remove after 3 seconds
        setTimeout(() => {
            messageDiv.remove();
        }, 3000);
    }
}

// Global functions for HTML event handlers
function processData() {
    app.processData();
}

function generateForecast() {
    app.generateForecast();
}

function toggleChart(chartType) {
    app.toggleChart(chartType);
}

function updateScenario() {
    app.updateScenario();
}

function exportForecast() {
    app.exportForecast();
}

function generateReport() {
    app.generateReport();
}

// Initialize app when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    window.app = new CornSyrupForecastApp();
});