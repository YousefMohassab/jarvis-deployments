/**
 * Data Simulator Module
 * Simulates realistic SMT process data for the dashboard
 */

const DataSimulator = (function() {
    'use strict';

    // Simulation parameters
    const SIMULATION_STATE = {
        currentShift: 'day', // day, night, off-hours
        productionRate: 1.0, // 0.0 to 1.5
        qualityTrend: 0, // -1 to 1 (negative is degrading, positive is improving)
        machineHealth: 1.0, // 0.0 to 1.0
        operatorExperience: 0.9, // 0.5 to 1.0
        materialQuality: 0.95, // 0.7 to 1.0
    };

    // Historical data storage
    const historicalData = {
        fpy: [],
        oee: [],
        dpmo: [],
        cycleTime: [],
        throughput: [],
        uptime: [],
        timestamps: []
    };

    // Defect types distribution
    const defectTypes = {
        'Solder Insufficient': 0,
        'Component Shift': 0,
        'Tombstone': 0,
        'Solder Bridge': 0,
        'Missing Component': 0,
        'Wrong Component': 0,
        'Component Damage': 0,
        'PCB Damage': 0
    };

    let lastUpdate = null;
    let totalBoardsProduced = 0;
    let totalDefects = 0;

    /**
     * Initialize simulator
     */
    function init() {
        lastUpdate = new Date();
        generateInitialHistory();
    }

    /**
     * Generate initial historical data
     */
    function generateInitialHistory() {
        const now = Date.now();
        const hoursToGenerate = 8;
        const dataPointsPerHour = 60; // One per minute

        for (let i = hoursToGenerate * dataPointsPerHour; i >= 0; i--) {
            const timestamp = new Date(now - (i * 60 * 1000));
            const data = generateDataPoint(timestamp);

            historicalData.fpy.push(data.fpy);
            historicalData.oee.push(data.oee);
            historicalData.dpmo.push(data.dpmo);
            historicalData.cycleTime.push(data.cycleTime);
            historicalData.throughput.push(data.throughput);
            historicalData.uptime.push(data.uptime);
            historicalData.timestamps.push(timestamp);
        }
    }

    /**
     * Generate a single data point
     * @param {Date} timestamp - Timestamp for the data point
     * @returns {Object} Generated data
     */
    function generateDataPoint(timestamp) {
        updateSimulationState(timestamp);

        // Base values with realistic variations
        const baseFpy = 97.5;
        const baseOee = 84.0;
        const baseDpmo = 600;
        const baseCycleTime = 42;
        const baseThroughput = 82;
        const baseUptime = 94;

        // Apply state modifiers
        const qualityModifier = SIMULATION_STATE.materialQuality * (1 + SIMULATION_STATE.qualityTrend * 0.05);
        const productionModifier = SIMULATION_STATE.productionRate;
        const healthModifier = SIMULATION_STATE.machineHealth;

        // Generate KPI values
        const fpy = clamp(addNoise(baseFpy * qualityModifier, 1.5), 90, 100);
        const oee = clamp(addNoise(baseOee * healthModifier * productionModifier, 2), 70, 95);
        const dpmo = clamp(addNoise(baseDpmo / qualityModifier, 15), 100, 3000);
        const cycleTime = clamp(addNoise(baseCycleTime / productionModifier, 3), 35, 60);
        const throughput = clamp(addNoise(baseThroughput * productionModifier, 5), 50, 100);
        const uptime = clamp(addNoise(baseUptime * healthModifier, 2), 80, 100);

        // Update defect distribution
        updateDefectDistribution(dpmo);

        // Update totals
        totalBoardsProduced += Math.round(throughput / 60);
        totalDefects += Math.round((100 - fpy) * (throughput / 60) / 100);

        return {
            fpy: parseFloat(fpy.toFixed(2)),
            oee: parseFloat(oee.toFixed(2)),
            dpmo: Math.round(dpmo),
            cycleTime: parseFloat(cycleTime.toFixed(1)),
            throughput: Math.round(throughput),
            uptime: parseFloat(uptime.toFixed(2)),
            timestamp
        };
    }

    /**
     * Update simulation state based on time and random events
     * @param {Date} timestamp - Current timestamp
     */
    function updateSimulationState(timestamp) {
        const hour = timestamp.getHours();

        // Shift determination
        if (hour >= 6 && hour < 14) {
            SIMULATION_STATE.currentShift = 'day';
            SIMULATION_STATE.operatorExperience = 0.95;
        } else if (hour >= 14 && hour < 22) {
            SIMULATION_STATE.currentShift = 'evening';
            SIMULATION_STATE.operatorExperience = 0.90;
        } else {
            SIMULATION_STATE.currentShift = 'night';
            SIMULATION_STATE.operatorExperience = 0.85;
        }

        // Random quality trend changes
        if (Math.random() < 0.05) {
            SIMULATION_STATE.qualityTrend = clamp(SIMULATION_STATE.qualityTrend + (Math.random() - 0.5) * 0.3, -1, 1);
        }

        // Random machine health changes
        if (Math.random() < 0.02) {
            SIMULATION_STATE.machineHealth = clamp(SIMULATION_STATE.machineHealth + (Math.random() - 0.3) * 0.1, 0.7, 1.0);
        } else {
            // Gradual recovery
            SIMULATION_STATE.machineHealth = Math.min(1.0, SIMULATION_STATE.machineHealth + 0.001);
        }

        // Production rate variations
        SIMULATION_STATE.productionRate = clamp(0.9 + Math.random() * 0.2, 0.7, 1.1);

        // Material quality variations
        if (Math.random() < 0.01) {
            SIMULATION_STATE.materialQuality = clamp(0.85 + Math.random() * 0.15, 0.7, 1.0);
        }
    }

    /**
     * Update defect type distribution
     * @param {number} dpmo - Current DPMO value
     */
    function updateDefectDistribution(dpmo) {
        const totalDefectWeight = dpmo / 100;

        defectTypes['Solder Insufficient'] = Math.round(totalDefectWeight * (30 + Math.random() * 10));
        defectTypes['Component Shift'] = Math.round(totalDefectWeight * (20 + Math.random() * 10));
        defectTypes['Tombstone'] = Math.round(totalDefectWeight * (15 + Math.random() * 5));
        defectTypes['Solder Bridge'] = Math.round(totalDefectWeight * (12 + Math.random() * 8));
        defectTypes['Missing Component'] = Math.round(totalDefectWeight * (10 + Math.random() * 5));
        defectTypes['Wrong Component'] = Math.round(totalDefectWeight * (5 + Math.random() * 5));
        defectTypes['Component Damage'] = Math.round(totalDefectWeight * (4 + Math.random() * 4));
        defectTypes['PCB Damage'] = Math.round(totalDefectWeight * (4 + Math.random() * 3));
    }

    /**
     * Get current live data
     * @returns {Object} Current KPI values
     */
    function getCurrentData() {
        const now = new Date();
        const data = generateDataPoint(now);

        // Add to historical data
        historicalData.fpy.push(data.fpy);
        historicalData.oee.push(data.oee);
        historicalData.dpmo.push(data.dpmo);
        historicalData.cycleTime.push(data.cycleTime);
        historicalData.throughput.push(data.throughput);
        historicalData.uptime.push(data.uptime);
        historicalData.timestamps.push(now);

        // Keep only last 8 hours of data
        const maxDataPoints = 8 * 60;
        if (historicalData.fpy.length > maxDataPoints) {
            for (const key in historicalData) {
                historicalData[key].shift();
            }
        }

        lastUpdate = now;

        return {
            ...data,
            defectTypes: { ...defectTypes },
            totalBoardsProduced,
            totalDefects,
            currentShift: SIMULATION_STATE.currentShift,
            machineHealth: SIMULATION_STATE.machineHealth
        };
    }

    /**
     * Get historical data
     * @param {string} metric - Metric name
     * @param {number} hours - Number of hours to retrieve
     * @returns {Array} Historical data points
     */
    function getHistoricalData(metric, hours = 8) {
        const dataPoints = hours * 60;
        const data = historicalData[metric] || [];
        const timestamps = historicalData.timestamps || [];

        return {
            values: data.slice(-dataPoints),
            timestamps: timestamps.slice(-dataPoints)
        };
    }

    /**
     * Get secondary metrics
     * @returns {Object} Secondary metrics
     */
    function getSecondaryMetrics() {
        return {
            placementAccuracy: formatNumber(99.8 + Math.random() * 0.19, 2) + '%',
            placementRate: Math.round(25000 + Math.random() * 2000) + ' CPH',
            spiResult: formatNumber(98 + Math.random() * 1.5, 1) + '%',
            activeBoards: Math.round(15 + Math.random() * 5),
            completedToday: totalBoardsProduced,
            defectRate: formatNumber((totalDefects / Math.max(totalBoardsProduced, 1)) * 100, 2) + '%'
        };
    }

    /**
     * Trigger a quality event (for testing)
     * @param {string} eventType - Type of event: 'improvement', 'degradation', 'machine_issue'
     */
    function triggerEvent(eventType) {
        switch (eventType) {
            case 'improvement':
                SIMULATION_STATE.qualityTrend = 0.8;
                SIMULATION_STATE.materialQuality = 0.98;
                break;
            case 'degradation':
                SIMULATION_STATE.qualityTrend = -0.7;
                SIMULATION_STATE.materialQuality = 0.85;
                break;
            case 'machine_issue':
                SIMULATION_STATE.machineHealth = 0.75;
                SIMULATION_STATE.productionRate = 0.7;
                break;
        }
    }

    /**
     * Helper functions
     */
    function addNoise(value, noisePercent = 2) {
        const noise = (Math.random() - 0.5) * 2 * (value * noisePercent / 100);
        return value + noise;
    }

    function clamp(value, min, max) {
        return Math.min(Math.max(value, min), max);
    }

    function formatNumber(value, decimals = 2) {
        return Number(value).toFixed(decimals);
    }

    /**
     * Export public API
     */
    return {
        init,
        getCurrentData,
        getHistoricalData,
        getSecondaryMetrics,
        triggerEvent
    };
})();

// Initialize on load
if (typeof window !== 'undefined') {
    window.DataSimulator = DataSimulator;
}
