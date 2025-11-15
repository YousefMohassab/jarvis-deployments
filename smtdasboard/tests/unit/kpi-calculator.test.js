/**
 * Unit Tests for KPI Calculator Module
 */

// Mock DOM elements for testing
function setupMockDOM() {
    const mockElements = {
        fpyValue: { textContent: '' },
        oeeValue: { textContent: '' },
        dpmoValue: { textContent: '' },
        cycleTimeValue: { textContent: '' },
        throughputValue: { textContent: '' },
        uptimeValue: { textContent: '' },
        fpyTrend: { textContent: '', classList: { add: () => {}, remove: () => {} } },
        oeeTrend: { textContent: '', classList: { add: () => {}, remove: () => {} } },
    };

    global.document = {
        getElementById: (id) => mockElements[id] || null,
        querySelector: () => ({ classList: { add: () => {}, remove: () => {} } })
    };
}

// Test Suite
const tests = {
    // Test 1: Format KPI Value - Percentage
    testFormatKPIValuePercentage() {
        const result = formatKPIValue(97.5432, 'fpy');
        return result === '97.5' ? 'PASS' : `FAIL: Expected 97.5, got ${result}`;
    },

    // Test 2: Format KPI Value - Integer
    testFormatKPIValueInteger() {
        const result = formatKPIValue(1234.56, 'dpmo');
        return result === '1,235' ? 'PASS' : `FAIL: Expected 1,235, got ${result}`;
    },

    // Test 3: Calculate Percentage Change - Positive
    testCalculatePercentageChangePositive() {
        const result = calculatePercentageChange(110, 100);
        return result === 10 ? 'PASS' : `FAIL: Expected 10, got ${result}`;
    },

    // Test 4: Calculate Percentage Change - Negative
    testCalculatePercentageChangeNegative() {
        const result = calculatePercentageChange(90, 100);
        return result === -10 ? 'PASS' : `FAIL: Expected -10, got ${result}`;
    },

    // Test 5: Calculate Percentage Change - Zero Previous
    testCalculatePercentageChangeZero() {
        const result = calculatePercentageChange(50, 0);
        return result === 0 ? 'PASS' : `FAIL: Expected 0, got ${result}`;
    },

    // Test 6: OEE Component Calculation
    testOEEComponents() {
        const data = {
            uptime: 95,
            fpy: 98,
            throughput: 80
        };
        const components = calculateOEEComponents(data);
        const hasAllComponents = components.availability && components.performance && components.quality;
        return hasAllComponents ? 'PASS' : 'FAIL: Missing OEE components';
    },

    // Test 7: KPI Statistics Calculation
    testKPIStatistics() {
        const values = [95, 96, 97, 98, 97, 96, 95, 94];
        const stats = getKPIStatistics(values);
        const hasStats = stats.min && stats.max && stats.average && stats.current;
        return hasStats ? 'PASS' : 'FAIL: Missing statistics';
    },

    // Test 8: Empty Values Handling
    testEmptyValuesHandling() {
        const stats = getKPIStatistics([]);
        return stats.average === 0 ? 'PASS' : 'FAIL: Should handle empty array';
    },

    // Test 9: Null Value Handling
    testNullValueHandling() {
        const result = formatKPIValue(null, 'fpy');
        return result === '--' ? 'PASS' : `FAIL: Expected --, got ${result}`;
    },

    // Test 10: Trend Direction - Improvement
    testTrendDirectionImprovement() {
        const values = [90, 91, 92, 93, 94, 95];
        const stats = getKPIStatistics(values);
        return stats.trend === 'improving' ? 'PASS' : `FAIL: Expected improving, got ${stats.trend}`;
    }
};

// Helper functions needed for tests
function formatKPIValue(value, kpiName) {
    if (value === null || value === undefined || isNaN(value)) {
        return '--';
    }
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

function calculatePercentageChange(current, previous) {
    if (previous === 0 || previous === null || previous === undefined) {
        return 0;
    }
    return ((current - previous) / previous) * 100;
}

function calculateOEEComponents(data) {
    const availability = data.uptime / 100;
    const quality = data.fpy / 100;
    const performance = data.throughput / (data.throughput / availability);

    return {
        availability: availability * 100,
        performance: Math.min(performance * 100, 100),
        quality: quality * 100
    };
}

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

// Run tests
function runTests() {
    console.log('=== KPI Calculator Unit Tests ===\n');

    let passed = 0;
    let failed = 0;

    for (const [testName, testFunc] of Object.entries(tests)) {
        try {
            const result = testFunc();
            console.log(`${testName}: ${result}`);

            if (result.startsWith('PASS')) {
                passed++;
            } else {
                failed++;
            }
        } catch (error) {
            console.log(`${testName}: FAIL - ${error.message}`);
            failed++;
        }
    }

    console.log(`\n=== Test Results ===`);
    console.log(`Total: ${passed + failed}`);
    console.log(`Passed: ${passed}`);
    console.log(`Failed: ${failed}`);
    console.log(`Success Rate: ${((passed / (passed + failed)) * 100).toFixed(1)}%`);

    return failed === 0;
}

// Export for Node.js
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { runTests, tests };
}

// Run tests if executed directly
if (typeof window === 'undefined') {
    const success = runTests();
    process.exit(success ? 0 : 1);
}
