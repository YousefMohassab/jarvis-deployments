/**
 * KPI Calculator Module
 * Calculates and updates KPI values and trends
 */

const KPICalculator = (function() {
    'use strict';

    let previousValues = {};

    /**
     * Initialize KPI calculator
     */
    function init() {
        previousValues = {};
    }

    /**
     * Update KPI card with current data
     * @param {string} kpiName - KPI identifier
     * @param {number} value - Current value
     * @param {string} unit - Unit of measurement (optional)
     */
    function updateKPI(kpiName, value, unit = '') {
        const valueElement = document.getElementById(`${kpiName}Value`);
        const trendElement = document.getElementById(`${kpiName}Trend`);
        const card = document.querySelector(`.kpi-card[data-kpi="${kpiName}"]`);

        if (!valueElement || !card) {
            console.warn(`KPI element not found: ${kpiName}`);
            return;
        }

        // Update value
        if (value !== null && value !== undefined && !isNaN(value)) {
            valueElement.textContent = formatKPIValue(value, kpiName);
        } else {
            valueElement.textContent = '--';
        }

        // Calculate and update trend
        if (trendElement) {
            updateTrend(kpiName, value, trendElement);
        }

        // Update status class
        updateStatusClass(kpiName, value, card);

        // Store current value for next comparison
        previousValues[kpiName] = value;
    }

    /**
     * Format KPI value based on type
     * @param {number} value - Value to format
     * @param {string} kpiName - KPI name
     * @returns {string} Formatted value
     */
    function formatKPIValue(value, kpiName) {
        switch (kpiName) {
            case 'fpy':
            case 'oee':
            case 'uptime':
                return value.toFixed(1);
            case 'dpmo':
            case 'throughput':
                return Math.round(value).toLocaleString();
            case 'cycleTime':
                return value.toFixed(1);
            default:
                return value.toFixed(2);
        }
    }

    /**
     * Update trend indicator
     * @param {string} kpiName - KPI identifier
     * @param {number} currentValue - Current value
     * @param {HTMLElement} trendElement - Trend element
     */
    function updateTrend(kpiName, currentValue, trendElement) {
        const previousValue = previousValues[kpiName];

        if (previousValue === undefined || previousValue === null) {
            trendElement.classList.add('trend-neutral');
            trendElement.querySelector('.trend-value').textContent = '--';
            return;
        }

        const change = calculatePercentageChange(currentValue, previousValue);
        const absChange = Math.abs(change);

        // Determine trend direction
        // For DPMO and cycle time, lower is better
        const invertLogic = ['dpmo', 'cycleTime'].includes(kpiName);
        let trendClass = 'trend-neutral';

        if (absChange > 0.1) {
            if (invertLogic) {
                trendClass = change < 0 ? 'trend-up' : 'trend-down';
            } else {
                trendClass = change > 0 ? 'trend-up' : 'trend-down';
            }
        }

        // Update classes
        trendElement.classList.remove('trend-up', 'trend-down', 'trend-neutral');
        trendElement.classList.add(trendClass);

        // Update text
        const trendValue = trendElement.querySelector('.trend-value');
        if (absChange < 0.1) {
            trendValue.textContent = 'Stable';
        } else {
            const sign = change > 0 ? '+' : '';
            trendValue.textContent = `${sign}${change.toFixed(1)}%`;
        }
    }

    /**
     * Update card status class based on threshold
     * @param {string} kpiName - KPI identifier
     * @param {number} value - Current value
     * @param {HTMLElement} card - Card element
     */
    function updateStatusClass(kpiName, value, card) {
        const status = Config.checkThreshold(kpiName, value);

        // Remove existing status classes
        card.classList.remove('status-good', 'status-warning', 'status-critical');

        // Add new status class
        if (status !== 'neutral') {
            card.classList.add(`status-${status}`);
        }
    }

    /**
     * Calculate percentage change
     * @param {number} current - Current value
     * @param {number} previous - Previous value
     * @returns {number} Percentage change
     */
    function calculatePercentageChange(current, previous) {
        if (previous === 0 || previous === null || previous === undefined) {
            return 0;
        }
        return ((current - previous) / previous) * 100;
    }

    /**
     * Update all KPIs with new data
     * @param {Object} data - Data object containing all KPI values
     */
    function updateAllKPIs(data) {
        updateKPI('fpy', data.fpy);
        updateKPI('oee', data.oee);
        updateKPI('dpmo', data.dpmo);
        updateKPI('cycleTime', data.cycleTime);
        updateKPI('throughput', data.throughput);
        updateKPI('uptime', data.uptime);
    }

    /**
     * Update secondary metrics
     * @param {Object} metrics - Secondary metrics object
     */
    function updateSecondaryMetrics(metrics) {
        const metricMappings = {
            placementAccuracy: 'placementAccuracy',
            placementRate: 'placementRate',
            spiResult: 'spiResult',
            activeBoards: 'activeBoards',
            completedToday: 'completedToday',
            defectRate: 'defectRate'
        };

        for (const [id, key] of Object.entries(metricMappings)) {
            const element = document.getElementById(id);
            if (element && metrics[key] !== undefined) {
                element.textContent = metrics[key];
            }
        }
    }

    /**
     * Calculate OEE components
     * @param {Object} data - Production data
     * @returns {Object} OEE components
     */
    function calculateOEEComponents(data) {
        // OEE = Availability × Performance × Quality
        const availability = data.uptime / 100;
        const quality = data.fpy / 100;
        const performance = data.throughput / (data.throughput / availability); // Simplified

        return {
            availability: availability * 100,
            performance: Math.min(performance * 100, 100),
            quality: quality * 100
        };
    }

    /**
     * Get KPI summary statistics
     * @param {Array} values - Array of historical values
     * @returns {Object} Summary statistics
     */
    function getKPIStatistics(values) {
        if (!values || values.length === 0) {
            return {
                min: 0,
                max: 0,
                average: 0,
                current: 0,
                trend: 'neutral'
            };
        }

        const validValues = values.filter(v => v !== null && v !== undefined && !isNaN(v));

        if (validValues.length === 0) {
            return {
                min: 0,
                max: 0,
                average: 0,
                current: 0,
                trend: 'neutral'
            };
        }

        const min = Math.min(...validValues);
        const max = Math.max(...validValues);
        const average = validValues.reduce((a, b) => a + b, 0) / validValues.length;
        const current = validValues[validValues.length - 1];

        // Determine trend (comparing last 25% to first 25%)
        const quarterLength = Math.floor(validValues.length / 4);
        const firstQuarter = validValues.slice(0, quarterLength);
        const lastQuarter = validValues.slice(-quarterLength);

        const firstAvg = firstQuarter.reduce((a, b) => a + b, 0) / firstQuarter.length;
        const lastAvg = lastQuarter.reduce((a, b) => a + b, 0) / lastQuarter.length;

        let trend = 'neutral';
        const change = ((lastAvg - firstAvg) / firstAvg) * 100;

        if (Math.abs(change) > 1) {
            trend = change > 0 ? 'improving' : 'declining';
        }

        return {
            min: min.toFixed(2),
            max: max.toFixed(2),
            average: average.toFixed(2),
            current: current.toFixed(2),
            trend
        };
    }

    /**
     * Export public API
     */
    return {
        init,
        updateKPI,
        updateAllKPIs,
        updateSecondaryMetrics,
        calculateOEEComponents,
        getKPIStatistics
    };
})();

// Initialize on load
if (typeof window !== 'undefined') {
    window.KPICalculator = KPICalculator;
}
