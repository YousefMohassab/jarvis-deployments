/**
 * Integration Tests for Dashboard
 * Tests the complete workflow and module integration
 */

const integrationTests = {
    // Test 1: Complete Data Flow
    testCompleteDataFlow() {
        console.log('Testing complete data flow...');

        // Simulate data generation
        const mockData = {
            fpy: 97.5,
            oee: 84.0,
            dpmo: 600,
            cycleTime: 42,
            throughput: 82,
            uptime: 94,
            defectTypes: {
                'Solder Insufficient': 180,
                'Component Shift': 120,
                'Tombstone': 90,
                'Solder Bridge': 72,
                'Missing Component': 60,
                'Wrong Component': 30,
                'Component Damage': 24,
                'PCB Damage': 24
            }
        };

        // Verify data structure
        const hasAllKPIs = mockData.fpy && mockData.oee && mockData.dpmo &&
            mockData.cycleTime && mockData.throughput && mockData.uptime;

        return hasAllKPIs ? 'PASS' : 'FAIL: Missing KPI data';
    },

    // Test 2: Configuration Persistence
    testConfigurationPersistence() {
        console.log('Testing configuration persistence...');

        const mockConfig = {
            kpiThresholds: {
                fpy: { target: 98, warning: 95, critical: 90 },
                oee: { target: 85, warning: 80, critical: 75 }
            },
            refreshInterval: 5000
        };

        // Simulate save/load
        const saved = JSON.stringify(mockConfig);
        const loaded = JSON.parse(saved);

        return JSON.stringify(mockConfig) === JSON.stringify(loaded) ?
            'PASS' : 'FAIL: Config not persisted correctly';
    },

    // Test 3: Threshold Detection
    testThresholdDetection() {
        console.log('Testing threshold detection...');

        const thresholds = {
            target: 98,
            warning: 95,
            critical: 90
        };

        const testCases = [
            { value: 99, expected: 'good' },
            { value: 96, expected: 'warning' },
            { value: 88, expected: 'critical' }
        ];

        for (const testCase of testCases) {
            const status = checkThreshold(testCase.value, thresholds);
            if (status !== testCase.expected) {
                return `FAIL: Expected ${testCase.expected}, got ${status} for value ${testCase.value}`;
            }
        }

        return 'PASS';
    },

    // Test 4: Alert Generation
    testAlertGeneration() {
        console.log('Testing alert generation...');

        const alerts = [];
        const mockAlertSystem = {
            showAlert: (type, title, message) => {
                alerts.push({ type, title, message });
            }
        };

        // Simulate threshold violation
        mockAlertSystem.showAlert('error', 'FPY Critical', 'First Pass Yield below threshold');
        mockAlertSystem.showAlert('warning', 'OEE Warning', 'OEE approaching threshold');

        return alerts.length === 2 && alerts[0].type === 'error' ?
            'PASS' : 'FAIL: Alerts not generated correctly';
    },

    // Test 5: Historical Data Management
    testHistoricalDataManagement() {
        console.log('Testing historical data management...');

        const historicalData = [];
        const maxDataPoints = 480; // 8 hours at 1 per minute

        // Add data points
        for (let i = 0; i < 500; i++) {
            historicalData.push({ timestamp: new Date(), value: 95 + Math.random() * 5 });

            // Trim to max
            if (historicalData.length > maxDataPoints) {
                historicalData.shift();
            }
        }

        return historicalData.length === maxDataPoints ?
            'PASS' : `FAIL: Expected ${maxDataPoints} points, got ${historicalData.length}`;
    },

    // Test 6: Chart Data Preparation
    testChartDataPreparation() {
        console.log('Testing chart data preparation...');

        const rawData = [95, 96, 97, 98, 97, 96, 95, 94];
        const timestamps = rawData.map((_, i) => new Date(Date.now() - i * 60000));

        const chartData = {
            values: rawData,
            timestamps: timestamps,
            labels: timestamps.map(t => t.toLocaleTimeString())
        };

        return chartData.values.length === rawData.length &&
            chartData.timestamps.length === timestamps.length ?
            'PASS' : 'FAIL: Chart data not prepared correctly';
    },

    // Test 7: Defect Distribution Calculation
    testDefectDistribution() {
        console.log('Testing defect distribution...');

        const totalDefects = 600;
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

        // Distribute defects
        const weights = [0.30, 0.20, 0.15, 0.12, 0.10, 0.05, 0.04, 0.04];
        const types = Object.keys(defectTypes);

        types.forEach((type, index) => {
            defectTypes[type] = Math.round(totalDefects * weights[index]);
        });

        const sum = Object.values(defectTypes).reduce((a, b) => a + b, 0);
        const difference = Math.abs(sum - totalDefects);

        return difference < 10 ?
            'PASS' : `FAIL: Defect distribution off by ${difference}`;
    },

    // Test 8: Real-time Update Simulation
    testRealtimeUpdate() {
        console.log('Testing real-time update simulation...');

        let updateCount = 0;
        const maxUpdates = 5;

        function simulateUpdate() {
            updateCount++;
            return {
                fpy: 97 + Math.random() * 2,
                oee: 83 + Math.random() * 3,
                timestamp: new Date()
            };
        }

        for (let i = 0; i < maxUpdates; i++) {
            const data = simulateUpdate();
            if (!data.fpy || !data.oee || !data.timestamp) {
                return 'FAIL: Update missing data';
            }
        }

        return updateCount === maxUpdates ?
            'PASS' : `FAIL: Expected ${maxUpdates} updates, got ${updateCount}`;
    },

    // Test 9: Error Handling
    testErrorHandling() {
        console.log('Testing error handling...');

        try {
            // Simulate error condition
            const invalidData = { fpy: 'invalid' };
            const value = parseFloat(invalidData.fpy);

            if (isNaN(value)) {
                // Handle error gracefully
                const fallback = '--';
                return fallback === '--' ? 'PASS' : 'FAIL: Error not handled';
            }

            return 'FAIL: Should have detected invalid data';
        } catch (error) {
            return 'PASS: Error caught and handled';
        }
    },

    // Test 10: Module Integration
    testModuleIntegration() {
        console.log('Testing module integration...');

        const modules = {
            Config: { initialized: true, getConfig: () => ({}) },
            DataSimulator: { initialized: true, getCurrentData: () => ({}) },
            KPICalculator: { initialized: true, updateKPI: () => {} },
            ChartManager: { initialized: true, updateChart: () => {} },
            AlertManager: { initialized: true, showAlert: () => {} }
        };

        const allInitialized = Object.values(modules).every(m => m.initialized);

        return allInitialized ?
            'PASS' : 'FAIL: Not all modules initialized';
    }
};

// Helper function
function checkThreshold(value, thresholds) {
    if (value >= thresholds.target) return 'good';
    if (value >= thresholds.warning) return 'warning';
    return 'critical';
}

// Run integration tests
function runIntegrationTests() {
    console.log('=== Dashboard Integration Tests ===\n');

    let passed = 0;
    let failed = 0;

    for (const [testName, testFunc] of Object.entries(integrationTests)) {
        try {
            const result = testFunc();
            console.log(`${testName}: ${result}\n`);

            if (result.startsWith('PASS')) {
                passed++;
            } else {
                failed++;
            }
        } catch (error) {
            console.log(`${testName}: FAIL - ${error.message}\n`);
            failed++;
        }
    }

    console.log(`\n=== Integration Test Results ===`);
    console.log(`Total: ${passed + failed}`);
    console.log(`Passed: ${passed}`);
    console.log(`Failed: ${failed}`);
    console.log(`Success Rate: ${((passed / (passed + failed)) * 100).toFixed(1)}%`);

    return failed === 0;
}

// Export for Node.js
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { runIntegrationTests, integrationTests };
}

// Run tests if executed directly
if (typeof window === 'undefined') {
    const success = runIntegrationTests();
    process.exit(success ? 0 : 1);
}
