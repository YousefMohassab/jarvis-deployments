#!/usr/bin/env node

/**
 * Test Runner
 * Runs all unit and integration tests
 */

const fs = require('fs');
const path = require('path');

console.log('=================================');
console.log('SMT Dashboard Test Suite');
console.log('=================================\n');

// Test results
const results = {
    unit: { passed: 0, failed: 0 },
    integration: { passed: 0, failed: 0 }
};

// Run unit tests
console.log('Running Unit Tests...\n');
try {
    const unitTests = require('./unit/kpi-calculator.test.js');
    const unitSuccess = unitTests.runTests();
    if (unitSuccess) {
        results.unit.passed = Object.keys(unitTests.tests).length;
    } else {
        results.unit.failed = Object.keys(unitTests.tests).length;
    }
} catch (error) {
    console.error('Error running unit tests:', error.message);
    results.unit.failed++;
}

console.log('\n---\n');

// Run integration tests
console.log('Running Integration Tests...\n');
try {
    const integrationTests = require('./integration/dashboard.test.js');
    const integrationSuccess = integrationTests.runIntegrationTests();
    if (integrationSuccess) {
        results.integration.passed = Object.keys(integrationTests.integrationTests).length;
    } else {
        results.integration.failed = Object.keys(integrationTests.integrationTests).length;
    }
} catch (error) {
    console.error('Error running integration tests:', error.message);
    results.integration.failed++;
}

// Summary
console.log('\n=================================');
console.log('Overall Test Summary');
console.log('=================================');
console.log(`Unit Tests: ${results.unit.passed} passed, ${results.unit.failed} failed`);
console.log(`Integration Tests: ${results.integration.passed} passed, ${results.integration.failed} failed`);

const totalPassed = results.unit.passed + results.integration.passed;
const totalFailed = results.unit.failed + results.integration.failed;
const total = totalPassed + totalFailed;
const successRate = total > 0 ? ((totalPassed / total) * 100).toFixed(1) : 0;

console.log(`\nTotal: ${total}`);
console.log(`Passed: ${totalPassed}`);
console.log(`Failed: ${totalFailed}`);
console.log(`Success Rate: ${successRate}%`);

// Exit with appropriate code
process.exit(totalFailed > 0 ? 1 : 0);
