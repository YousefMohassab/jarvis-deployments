/**
 * Utility Helper Functions
 * Common utilities used across the dashboard application
 */

/**
 * Format a number with specified decimal places
 * @param {number} value - The number to format
 * @param {number} decimals - Number of decimal places
 * @returns {string} Formatted number
 */
function formatNumber(value, decimals = 2) {
    if (value === null || value === undefined || isNaN(value)) {
        return '--';
    }
    return Number(value).toFixed(decimals);
}

/**
 * Format a number with thousands separator
 * @param {number} value - The number to format
 * @returns {string} Formatted number with commas
 */
function formatWithCommas(value) {
    if (value === null || value === undefined || isNaN(value)) {
        return '--';
    }
    return value.toLocaleString('en-US');
}

/**
 * Calculate percentage change between two values
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
 * Get trend direction based on percentage change
 * @param {number} change - Percentage change value
 * @param {boolean} invertLogic - Invert trend logic (for metrics where lower is better)
 * @returns {string} Trend direction: 'up', 'down', or 'neutral'
 */
function getTrendDirection(change, invertLogic = false) {
    const threshold = 0.1; // 0.1% threshold for neutral

    if (Math.abs(change) < threshold) {
        return 'neutral';
    }

    if (invertLogic) {
        return change > 0 ? 'down' : 'up';
    }

    return change > 0 ? 'up' : 'down';
}

/**
 * Format timestamp to readable string
 * @param {Date} date - Date object
 * @returns {string} Formatted date string
 */
function formatTimestamp(date) {
    if (!(date instanceof Date) || isNaN(date)) {
        return '--';
    }

    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const seconds = String(date.getSeconds()).padStart(2, '0');

    return `${hours}:${minutes}:${seconds}`;
}

/**
 * Format full date and time
 * @param {Date} date - Date object
 * @returns {string} Formatted date and time string
 */
function formatDateTime(date) {
    if (!(date instanceof Date) || isNaN(date)) {
        return '--';
    }

    const options = {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
    };

    return date.toLocaleString('en-US', options);
}

/**
 * Generate random number within range
 * @param {number} min - Minimum value
 * @param {number} max - Maximum value
 * @returns {number} Random number
 */
function randomInRange(min, max) {
    return Math.random() * (max - min) + min;
}

/**
 * Add noise to a value (for realistic simulation)
 * @param {number} value - Base value
 * @param {number} noisePercent - Noise percentage (0-100)
 * @returns {number} Value with noise added
 */
function addNoise(value, noisePercent = 2) {
    const noise = (Math.random() - 0.5) * 2 * (value * noisePercent / 100);
    return value + noise;
}

/**
 * Clamp a value between min and max
 * @param {number} value - Value to clamp
 * @param {number} min - Minimum value
 * @param {number} max - Maximum value
 * @returns {number} Clamped value
 */
function clamp(value, min, max) {
    return Math.min(Math.max(value, min), max);
}

/**
 * Deep clone an object
 * @param {Object} obj - Object to clone
 * @returns {Object} Cloned object
 */
function deepClone(obj) {
    return JSON.parse(JSON.stringify(obj));
}

/**
 * Debounce function execution
 * @param {Function} func - Function to debounce
 * @param {number} wait - Wait time in milliseconds
 * @returns {Function} Debounced function
 */
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

/**
 * Throttle function execution
 * @param {Function} func - Function to throttle
 * @param {number} limit - Time limit in milliseconds
 * @returns {Function} Throttled function
 */
function throttle(func, limit) {
    let inThrottle;
    return function executedFunction(...args) {
        if (!inThrottle) {
            func(...args);
            inThrottle = true;
            setTimeout(() => inThrottle = false, limit);
        }
    };
}

/**
 * Calculate moving average
 * @param {Array<number>} values - Array of values
 * @param {number} period - Period for moving average
 * @returns {Array<number>} Moving averages
 */
function calculateMovingAverage(values, period) {
    const result = [];
    for (let i = 0; i < values.length; i++) {
        if (i < period - 1) {
            result.push(null);
            continue;
        }
        const sum = values.slice(i - period + 1, i + 1).reduce((a, b) => a + b, 0);
        result.push(sum / period);
    }
    return result;
}

/**
 * Get status class based on value and thresholds
 * @param {number} value - Current value
 * @param {number} target - Target value
 * @param {number} warningThreshold - Warning threshold percentage
 * @param {boolean} higherIsBetter - Whether higher values are better
 * @returns {string} Status class: 'good', 'warning', or 'critical'
 */
function getStatusClass(value, target, warningThreshold = 5, higherIsBetter = true) {
    if (value === null || value === undefined || isNaN(value)) {
        return 'neutral';
    }

    const percentDiff = Math.abs(((value - target) / target) * 100);
    const isAboveTarget = value >= target;

    if (higherIsBetter) {
        if (isAboveTarget) return 'good';
        if (percentDiff < warningThreshold) return 'warning';
        return 'critical';
    } else {
        if (!isAboveTarget) return 'good';
        if (percentDiff < warningThreshold) return 'warning';
        return 'critical';
    }
}

/**
 * Export all helper functions
 */
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        formatNumber,
        formatWithCommas,
        calculatePercentageChange,
        getTrendDirection,
        formatTimestamp,
        formatDateTime,
        randomInRange,
        addNoise,
        clamp,
        deepClone,
        debounce,
        throttle,
        calculateMovingAverage,
        getStatusClass
    };
}
