/**
 * Configuration Module
 * Manages dashboard configuration and thresholds
 */

const Config = (function() {
    'use strict';

    // Default configuration
    const DEFAULT_CONFIG = {
        kpiThresholds: {
            fpy: {
                target: 98,
                warning: 95,
                critical: 90
            },
            oee: {
                target: 85,
                warning: 80,
                critical: 75
            },
            dpmo: {
                target: 500,
                warning: 1000,
                critical: 2000
            },
            cycleTime: {
                target: 45,
                warning: 50,
                critical: 60
            },
            throughput: {
                target: 80,
                warning: 70,
                critical: 60
            },
            uptime: {
                target: 95,
                warning: 90,
                critical: 85
            }
        },
        refreshInterval: 5000, // milliseconds
        chartUpdateInterval: 1000,
        dataRetentionPeriod: 8 * 60 * 60 * 1000, // 8 hours in milliseconds
        alertAutoDismiss: 5000, // 5 seconds
        enableAlerts: true,
        enableSounds: false
    };

    let currentConfig = null;

    /**
     * Initialize configuration
     */
    function init() {
        loadConfig();
    }

    /**
     * Load configuration from localStorage or use defaults
     */
    function loadConfig() {
        try {
            const stored = localStorage.getItem('smtDashboardConfig');
            if (stored) {
                currentConfig = JSON.parse(stored);
                // Merge with defaults to ensure all keys exist
                currentConfig = mergeConfig(DEFAULT_CONFIG, currentConfig);
            } else {
                currentConfig = deepClone(DEFAULT_CONFIG);
            }
        } catch (error) {
            console.error('Error loading configuration:', error);
            currentConfig = deepClone(DEFAULT_CONFIG);
        }
    }

    /**
     * Save configuration to localStorage
     */
    function saveConfig() {
        try {
            localStorage.setItem('smtDashboardConfig', JSON.stringify(currentConfig));
            return true;
        } catch (error) {
            console.error('Error saving configuration:', error);
            return false;
        }
    }

    /**
     * Get current configuration
     * @returns {Object} Current configuration
     */
    function getConfig() {
        if (!currentConfig) {
            init();
        }
        return deepClone(currentConfig);
    }

    /**
     * Get specific configuration value
     * @param {string} key - Configuration key (dot notation supported)
     * @returns {*} Configuration value
     */
    function get(key) {
        if (!currentConfig) {
            init();
        }

        const keys = key.split('.');
        let value = currentConfig;

        for (const k of keys) {
            if (value && typeof value === 'object' && k in value) {
                value = value[k];
            } else {
                return undefined;
            }
        }

        return value;
    }

    /**
     * Set specific configuration value
     * @param {string} key - Configuration key (dot notation supported)
     * @param {*} value - Value to set
     */
    function set(key, value) {
        if (!currentConfig) {
            init();
        }

        const keys = key.split('.');
        let obj = currentConfig;

        for (let i = 0; i < keys.length - 1; i++) {
            const k = keys[i];
            if (!(k in obj) || typeof obj[k] !== 'object') {
                obj[k] = {};
            }
            obj = obj[k];
        }

        obj[keys[keys.length - 1]] = value;
        saveConfig();
    }

    /**
     * Update multiple configuration values
     * @param {Object} updates - Object with configuration updates
     */
    function update(updates) {
        if (!currentConfig) {
            init();
        }

        currentConfig = mergeConfig(currentConfig, updates);
        saveConfig();
    }

    /**
     * Reset configuration to defaults
     */
    function reset() {
        currentConfig = deepClone(DEFAULT_CONFIG);
        saveConfig();
    }

    /**
     * Get KPI threshold for specific metric
     * @param {string} kpiName - KPI name
     * @returns {Object} Threshold configuration
     */
    function getKpiThreshold(kpiName) {
        return get(`kpiThresholds.${kpiName}`) || {};
    }

    /**
     * Update KPI threshold
     * @param {string} kpiName - KPI name
     * @param {Object} thresholds - Threshold values
     */
    function updateKpiThreshold(kpiName, thresholds) {
        const currentThresholds = getKpiThreshold(kpiName);
        const updated = { ...currentThresholds, ...thresholds };
        set(`kpiThresholds.${kpiName}`, updated);
    }

    /**
     * Check if value meets threshold criteria
     * @param {string} kpiName - KPI name
     * @param {number} value - Current value
     * @returns {string} Status: 'good', 'warning', or 'critical'
     */
    function checkThreshold(kpiName, value) {
        const thresholds = getKpiThreshold(kpiName);

        if (!thresholds || value === null || value === undefined) {
            return 'neutral';
        }

        // Different logic for metrics where lower is better
        const lowerIsBetter = ['dpmo', 'cycleTime'].includes(kpiName);

        if (lowerIsBetter) {
            if (value <= thresholds.target) return 'good';
            if (value <= thresholds.warning) return 'warning';
            return 'critical';
        } else {
            if (value >= thresholds.target) return 'good';
            if (value >= thresholds.warning) return 'warning';
            return 'critical';
        }
    }

    /**
     * Merge two configuration objects
     * @param {Object} target - Target object
     * @param {Object} source - Source object
     * @returns {Object} Merged object
     */
    function mergeConfig(target, source) {
        const result = deepClone(target);

        for (const key in source) {
            if (source.hasOwnProperty(key)) {
                if (source[key] && typeof source[key] === 'object' && !Array.isArray(source[key])) {
                    result[key] = mergeConfig(result[key] || {}, source[key]);
                } else {
                    result[key] = source[key];
                }
            }
        }

        return result;
    }

    /**
     * Deep clone helper
     */
    function deepClone(obj) {
        return JSON.parse(JSON.stringify(obj));
    }

    /**
     * Export public API
     */
    return {
        init,
        getConfig,
        get,
        set,
        update,
        reset,
        getKpiThreshold,
        updateKpiThreshold,
        checkThreshold
    };
})();

// Initialize on load
if (typeof window !== 'undefined') {
    window.Config = Config;
}
