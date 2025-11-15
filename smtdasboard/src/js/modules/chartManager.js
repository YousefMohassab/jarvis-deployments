/**
 * Chart Manager Module
 * Manages chart creation and updates using Chart.js-like API
 * Uses HTML Canvas for lightweight charting
 */

const ChartManager = (function() {
    'use strict';

    const charts = {};
    const chartConfigs = {};

    /**
     * Initialize all charts
     */
    function init() {
        createFPYTrendChart();
        createOEEChart();
        createDefectChart();
    }

    /**
     * Create FPY Trend Chart
     */
    function createFPYTrendChart() {
        const canvas = document.getElementById('fpyChart');
        if (!canvas) return;

        const ctx = canvas.getContext('2d');

        chartConfigs.fpyChart = {
            type: 'line',
            canvas: canvas,
            ctx: ctx,
            data: {
                labels: [],
                datasets: [{
                    label: 'First Pass Yield',
                    data: [],
                    color: '#2563eb',
                    target: 98
                }]
            },
            period: '8h'
        };

        charts.fpyChart = chartConfigs.fpyChart;
    }

    /**
     * Create OEE Components Chart
     */
    function createOEEChart() {
        const canvas = document.getElementById('oeeChart');
        if (!canvas) return;

        const ctx = canvas.getContext('2d');

        chartConfigs.oeeChart = {
            type: 'bar',
            canvas: canvas,
            ctx: ctx,
            data: {
                labels: ['Availability', 'Performance', 'Quality'],
                datasets: [{
                    data: [95, 90, 98],
                    colors: ['#10b981', '#3b82f6', '#8b5cf6']
                }]
            }
        };

        charts.oeeChart = chartConfigs.oeeChart;
    }

    /**
     * Create Defect Distribution Chart
     */
    function createDefectChart() {
        const canvas = document.getElementById('defectChart');
        if (!canvas) return;

        const ctx = canvas.getContext('2d');

        chartConfigs.defectChart = {
            type: 'horizontalBar',
            canvas: canvas,
            ctx: ctx,
            data: {
                labels: [],
                datasets: [{
                    data: [],
                    color: '#ef4444'
                }]
            }
        };

        charts.defectChart = chartConfigs.defectChart;
    }

    /**
     * Update FPY trend chart with historical data
     * @param {Array} values - Data values
     * @param {Array} timestamps - Timestamps
     */
    function updateFPYChart(values, timestamps) {
        const chart = charts.fpyChart;
        if (!chart) return;

        const canvas = chart.canvas;
        const ctx = chart.ctx;

        // Set canvas size
        canvas.width = canvas.offsetWidth;
        canvas.height = canvas.offsetHeight;

        // Clear canvas
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        if (!values || values.length === 0) {
            drawNoData(ctx, canvas);
            return;
        }

        // Drawing parameters
        const padding = { top: 20, right: 20, bottom: 40, left: 50 };
        const chartWidth = canvas.width - padding.left - padding.right;
        const chartHeight = canvas.height - padding.top - padding.bottom;

        // Calculate scales
        const minValue = Math.max(Math.min(...values) - 2, 0);
        const maxValue = Math.min(Math.max(...values) + 2, 100);
        const valueRange = maxValue - minValue;

        // Draw target line
        const targetY = padding.top + chartHeight - ((98 - minValue) / valueRange * chartHeight);
        ctx.strokeStyle = '#10b981';
        ctx.lineWidth = 2;
        ctx.setLineDash([5, 5]);
        ctx.beginPath();
        ctx.moveTo(padding.left, targetY);
        ctx.lineTo(padding.left + chartWidth, targetY);
        ctx.stroke();
        ctx.setLineDash([]);

        // Draw target label
        ctx.fillStyle = '#10b981';
        ctx.font = '12px Arial';
        ctx.textAlign = 'right';
        ctx.fillText('Target: 98%', padding.left - 5, targetY + 4);

        // Draw grid lines
        ctx.strokeStyle = '#e2e8f0';
        ctx.lineWidth = 1;
        for (let i = 0; i <= 5; i++) {
            const y = padding.top + (chartHeight / 5) * i;
            ctx.beginPath();
            ctx.moveTo(padding.left, y);
            ctx.lineTo(padding.left + chartWidth, y);
            ctx.stroke();

            // Y-axis labels
            const value = maxValue - (valueRange / 5) * i;
            ctx.fillStyle = '#64748b';
            ctx.font = '11px Arial';
            ctx.textAlign = 'right';
            ctx.fillText(value.toFixed(1) + '%', padding.left - 8, y + 4);
        }

        // Draw data line
        ctx.strokeStyle = '#2563eb';
        ctx.lineWidth = 2;
        ctx.beginPath();

        for (let i = 0; i < values.length; i++) {
            const x = padding.left + (chartWidth / (values.length - 1)) * i;
            const y = padding.top + chartHeight - ((values[i] - minValue) / valueRange * chartHeight);

            if (i === 0) {
                ctx.moveTo(x, y);
            } else {
                ctx.lineTo(x, y);
            }
        }

        ctx.stroke();

        // Draw data points
        ctx.fillStyle = '#2563eb';
        for (let i = 0; i < values.length; i += Math.floor(values.length / 20) || 1) {
            const x = padding.left + (chartWidth / (values.length - 1)) * i;
            const y = padding.top + chartHeight - ((values[i] - minValue) / valueRange * chartHeight);

            ctx.beginPath();
            ctx.arc(x, y, 3, 0, Math.PI * 2);
            ctx.fill();
        }

        // Draw X-axis labels (time)
        ctx.fillStyle = '#64748b';
        ctx.font = '11px Arial';
        ctx.textAlign = 'center';

        const labelInterval = Math.floor(timestamps.length / 6);
        for (let i = 0; i < timestamps.length; i += labelInterval) {
            const x = padding.left + (chartWidth / (timestamps.length - 1)) * i;
            const time = formatTime(timestamps[i]);
            ctx.fillText(time, x, canvas.height - padding.bottom + 20);
        }
    }

    /**
     * Update OEE components chart
     * @param {Object} components - OEE components (availability, performance, quality)
     */
    function updateOEEChart(components) {
        const chart = charts.oeeChart;
        if (!chart) return;

        const canvas = chart.canvas;
        const ctx = chart.ctx;

        // Set canvas size
        canvas.width = canvas.offsetWidth;
        canvas.height = canvas.offsetHeight;

        // Clear canvas
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        const data = [
            components.availability || 0,
            components.performance || 0,
            components.quality || 0
        ];
        const labels = ['Availability', 'Performance', 'Quality'];
        const colors = ['#10b981', '#3b82f6', '#8b5cf6'];

        // Drawing parameters
        const padding = { top: 40, right: 20, bottom: 60, left: 50 };
        const chartWidth = canvas.width - padding.left - padding.right;
        const chartHeight = canvas.height - padding.top - padding.bottom;

        const barWidth = chartWidth / (data.length * 2);
        const spacing = barWidth / 2;

        // Draw grid lines
        ctx.strokeStyle = '#e2e8f0';
        ctx.lineWidth = 1;
        for (let i = 0; i <= 5; i++) {
            const y = padding.top + (chartHeight / 5) * i;
            ctx.beginPath();
            ctx.moveTo(padding.left, y);
            ctx.lineTo(padding.left + chartWidth, y);
            ctx.stroke();

            // Y-axis labels
            const value = 100 - (100 / 5) * i;
            ctx.fillStyle = '#64748b';
            ctx.font = '11px Arial';
            ctx.textAlign = 'right';
            ctx.fillText(value.toFixed(0) + '%', padding.left - 8, y + 4);
        }

        // Draw bars
        data.forEach((value, index) => {
            const x = padding.left + spacing + (barWidth + spacing) * index * 2;
            const barHeight = (value / 100) * chartHeight;
            const y = padding.top + chartHeight - barHeight;

            // Bar
            ctx.fillStyle = colors[index];
            ctx.fillRect(x, y, barWidth, barHeight);

            // Value label on bar
            ctx.fillStyle = '#1e293b';
            ctx.font = 'bold 13px Arial';
            ctx.textAlign = 'center';
            ctx.fillText(value.toFixed(1) + '%', x + barWidth / 2, y - 8);

            // X-axis label
            ctx.fillStyle = '#64748b';
            ctx.font = '12px Arial';
            ctx.textAlign = 'center';

            // Wrap text if needed
            const label = labels[index];
            ctx.fillText(label, x + barWidth / 2, canvas.height - padding.bottom + 20);
        });

        // Draw target line at 85%
        const targetY = padding.top + chartHeight - (0.85 * chartHeight);
        ctx.strokeStyle = '#f59e0b';
        ctx.lineWidth = 2;
        ctx.setLineDash([5, 5]);
        ctx.beginPath();
        ctx.moveTo(padding.left, targetY);
        ctx.lineTo(padding.left + chartWidth, targetY);
        ctx.stroke();
        ctx.setLineDash([]);

        ctx.fillStyle = '#f59e0b';
        ctx.font = '11px Arial';
        ctx.textAlign = 'left';
        ctx.fillText('OEE Target: 85%', padding.left + 5, targetY - 5);
    }

    /**
     * Update defect distribution chart
     * @param {Object} defectTypes - Defect types and counts
     */
    function updateDefectChart(defectTypes) {
        const chart = charts.defectChart;
        if (!chart) return;

        const canvas = chart.canvas;
        const ctx = chart.ctx;

        // Set canvas size
        canvas.width = canvas.offsetWidth;
        canvas.height = canvas.offsetHeight;

        // Clear canvas
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        const labels = Object.keys(defectTypes);
        const values = Object.values(defectTypes);

        if (values.length === 0) {
            drawNoData(ctx, canvas);
            return;
        }

        // Drawing parameters
        const padding = { top: 20, right: 100, bottom: 20, left: 150 };
        const chartWidth = canvas.width - padding.left - padding.right;
        const chartHeight = canvas.height - padding.top - padding.bottom;

        const maxValue = Math.max(...values);
        const barHeight = chartHeight / values.length * 0.7;
        const barSpacing = chartHeight / values.length;

        // Draw bars
        values.forEach((value, index) => {
            const y = padding.top + barSpacing * index + (barSpacing - barHeight) / 2;
            const barWidth = (value / maxValue) * chartWidth;

            // Bar
            const colors = ['#ef4444', '#f97316', '#f59e0b', '#eab308', '#84cc16', '#22c55e', '#10b981', '#14b8a6'];
            ctx.fillStyle = colors[index % colors.length];
            ctx.fillRect(padding.left, y, barWidth, barHeight);

            // Label
            ctx.fillStyle = '#1e293b';
            ctx.font = '12px Arial';
            ctx.textAlign = 'right';
            ctx.fillText(labels[index], padding.left - 10, y + barHeight / 2 + 4);

            // Value
            ctx.textAlign = 'left';
            ctx.fillText(value.toString(), padding.left + barWidth + 8, y + barHeight / 2 + 4);
        });
    }

    /**
     * Draw "No Data" message
     */
    function drawNoData(ctx, canvas) {
        ctx.fillStyle = '#94a3b8';
        ctx.font = '14px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('No data available', canvas.width / 2, canvas.height / 2);
    }

    /**
     * Format timestamp for X-axis
     */
    function formatTime(timestamp) {
        const date = new Date(timestamp);
        const hours = String(date.getHours()).padStart(2, '0');
        const minutes = String(date.getMinutes()).padStart(2, '0');
        return `${hours}:${minutes}`;
    }

    /**
     * Update chart period
     * @param {string} period - Period (1h, 8h, 24h)
     */
    function setChartPeriod(period) {
        if (charts.fpyChart) {
            charts.fpyChart.period = period;
        }
    }

    /**
     * Refresh all charts
     */
    function refreshAllCharts() {
        // Get historical data
        const fpyData = DataSimulator.getHistoricalData('fpy', 8);
        updateFPYChart(fpyData.values, fpyData.timestamps);

        // Get current data for OEE
        const currentData = DataSimulator.getCurrentData();
        const oeeComponents = KPICalculator.calculateOEEComponents(currentData);
        updateOEEChart(oeeComponents);

        // Update defect chart
        updateDefectChart(currentData.defectTypes);
    }

    /**
     * Export public API
     */
    return {
        init,
        updateFPYChart,
        updateOEEChart,
        updateDefectChart,
        setChartPeriod,
        refreshAllCharts
    };
})();

// Initialize on load
if (typeof window !== 'undefined') {
    window.ChartManager = ChartManager;
}
