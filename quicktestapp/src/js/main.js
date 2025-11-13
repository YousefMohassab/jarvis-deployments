/**
 * Quick Test Application - Main JavaScript
 * Modern ES6+ vanilla JavaScript for interactive testing dashboard
 */

// Test Scenarios Configuration
const TEST_SCENARIOS = [
    {
        id: 'auth-test',
        name: 'User Authentication Test',
        description: 'Validates user login and session management',
        endpoint: '/api/auth/login',
        method: 'POST',
        expectedTime: 1500
    },
    {
        id: 'db-test',
        name: 'Database Connection Test',
        description: 'Checks database connectivity and query performance',
        endpoint: '/api/db/health',
        method: 'GET',
        expectedTime: 2000
    },
    {
        id: 'api-test',
        name: 'API Endpoint Test',
        description: 'Tests REST API endpoints and response validation',
        endpoint: '/api/users',
        method: 'GET',
        expectedTime: 1200
    },
    {
        id: 'upload-test',
        name: 'File Upload Test',
        description: 'Validates file upload functionality and size limits',
        endpoint: '/api/upload',
        method: 'POST',
        expectedTime: 2500
    },
    {
        id: 'validation-test',
        name: 'Data Validation Test',
        description: 'Tests input validation and sanitization rules',
        endpoint: '/api/validate',
        method: 'POST',
        expectedTime: 1000
    }
];

// Application State
const appState = {
    tests: {},
    isRunningAll: false,
    history: []
};

/**
 * Initialize the application when DOM is ready
 */
document.addEventListener('DOMContentLoaded', () => {
    console.log('Quick Test Application initialized');
    initializeTests();
    renderTestScenarios();
    attachEventListeners();
    loadTestHistory();
    updateDashboardStats();
});

/**
 * Initialize test state for all scenarios
 */
function initializeTests() {
    TEST_SCENARIOS.forEach(scenario => {
        appState.tests[scenario.id] = {
            ...scenario,
            status: 'pending',
            result: null,
            executionTime: null,
            timestamp: null
        };
    });
}

/**
 * Render test scenario cards dynamically
 */
function renderTestScenarios() {
    const container = document.getElementById('test-scenarios');
    if (!container) return;

    container.innerHTML = '';

    TEST_SCENARIOS.forEach(scenario => {
        const card = createTestCard(scenario);
        container.appendChild(card);
    });
}

/**
 * Create a test scenario card element
 * @param {Object} scenario - Test scenario configuration
 * @returns {HTMLElement} Card element
 */
function createTestCard(scenario) {
    const card = document.createElement('div');
    card.className = 'test-card';
    card.id = `card-${scenario.id}`;
    card.setAttribute('data-test-id', scenario.id);

    card.innerHTML = `
        <div class="test-card-header">
            <h3>${scenario.name}</h3>
            <span class="test-status-badge" id="badge-${scenario.id}">Pending</span>
        </div>
        <div class="test-card-body">
            <p class="test-description">${scenario.description}</p>
            <div class="test-details">
                <span class="test-method">${scenario.method}</span>
                <span class="test-endpoint">${scenario.endpoint}</span>
            </div>
            <div class="test-result" id="result-${scenario.id}" style="display: none;">
                <div class="result-content"></div>
            </div>
        </div>
        <div class="test-card-footer">
            <button class="btn btn-primary run-test-btn" data-test-id="${scenario.id}">
                <span class="btn-text">Run Test</span>
                <span class="btn-loader" style="display: none;"></span>
            </button>
            <span class="test-time" id="time-${scenario.id}"></span>
        </div>
    `;

    return card;
}

/**
 * Attach event listeners for interactive elements
 */
function attachEventListeners() {
    // Run individual test buttons
    document.addEventListener('click', (e) => {
        if (e.target.closest('.run-test-btn')) {
            const button = e.target.closest('.run-test-btn');
            const testId = button.getAttribute('data-test-id');
            runTest(testId);
        }
    });

    // Run all tests button
    const runAllBtn = document.getElementById('run-all-btn');
    if (runAllBtn) {
        runAllBtn.addEventListener('click', runAllTests);
    }

    // Reset tests button
    const resetBtn = document.getElementById('reset-btn');
    if (resetBtn) {
        resetBtn.addEventListener('click', resetTests);
    }

    // Keyboard accessibility for test cards
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && e.target.classList.contains('run-test-btn')) {
            e.target.click();
        }
    });
}

/**
 * Run a single test scenario
 * @param {string} testId - Test scenario ID
 */
async function runTest(testId) {
    const test = appState.tests[testId];
    if (!test || test.status === 'running') return;

    console.log(`Starting test: ${test.name}`);

    // Update UI to running state
    updateTestStatus(testId, 'running');
    showLoadingState(testId, true);

    try {
        // Simulate API call
        const result = await simulateAPICall(test);

        // Update test state
        appState.tests[testId] = {
            ...test,
            status: result.success ? 'passed' : 'failed',
            result: result,
            executionTime: result.executionTime,
            timestamp: new Date().toISOString()
        };

        // Update UI with results
        updateTestStatus(testId, result.success ? 'passed' : 'failed');
        displayTestResult(testId, result);

        // Add to history
        addToHistory(testId, result);

    } catch (error) {
        console.error(`Test ${testId} failed:`, error);
        appState.tests[testId].status = 'failed';
        updateTestStatus(testId, 'failed');
        displayTestResult(testId, {
            success: false,
            error: error.message,
            executionTime: 0
        });
    } finally {
        showLoadingState(testId, false);
        updateDashboardStats();
        saveTestHistory();
    }
}

/**
 * Run all test scenarios sequentially
 */
async function runAllTests() {
    if (appState.isRunningAll) return;

    appState.isRunningAll = true;
    const runAllBtn = document.getElementById('run-all-btn');

    if (runAllBtn) {
        runAllBtn.disabled = true;
        runAllBtn.innerHTML = '<span class="btn-loader"></span> Running All Tests...';
    }

    console.log('Running all tests...');

    for (const scenario of TEST_SCENARIOS) {
        await runTest(scenario.id);
        // Small delay between tests for better UX
        await new Promise(resolve => setTimeout(resolve, 300));
    }

    if (runAllBtn) {
        runAllBtn.disabled = false;
        runAllBtn.innerHTML = 'Run All Tests';
    }

    appState.isRunningAll = false;
    console.log('All tests completed');
}

/**
 * Reset all tests to initial state
 */
function resetTests() {
    console.log('Resetting all tests');

    // Reset state
    initializeTests();

    // Clear UI
    TEST_SCENARIOS.forEach(scenario => {
        updateTestStatus(scenario.id, 'pending');
        hideTestResult(scenario.id);

        const timeElement = document.getElementById(`time-${scenario.id}`);
        if (timeElement) timeElement.textContent = '';
    });

    // Clear results table
    const resultsBody = document.getElementById('results-body');
    if (resultsBody) resultsBody.innerHTML = '';

    // Update dashboard
    updateDashboardStats();

    // Clear history
    appState.history = [];
    saveTestHistory();
}

/**
 * Simulate an API call with random success/failure
 * @param {Object} test - Test configuration
 * @returns {Promise<Object>} Test result
 */
async function simulateAPICall(test) {
    const startTime = Date.now();

    // Random delay between 1-3 seconds
    const delay = Math.random() * 2000 + 1000;
    await new Promise(resolve => setTimeout(resolve, delay));

    const executionTime = Date.now() - startTime;

    // 80% success rate for demonstration
    const success = Math.random() > 0.2;

    if (success) {
        return {
            success: true,
            status: 200,
            message: 'Test passed successfully',
            executionTime: executionTime,
            data: {
                endpoint: test.endpoint,
                method: test.method,
                responseTime: `${executionTime}ms`,
                statusCode: 200,
                payload: generateMockPayload(test)
            }
        };
    } else {
        return {
            success: false,
            status: Math.random() > 0.5 ? 500 : 404,
            message: 'Test failed',
            executionTime: executionTime,
            error: generateMockError(test)
        };
    }
}

/**
 * Generate mock payload based on test type
 * @param {Object} test - Test configuration
 * @returns {Object} Mock payload
 */
function generateMockPayload(test) {
    const payloads = {
        'auth-test': { token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...', userId: '12345', expiresIn: 3600 },
        'db-test': { connected: true, latency: '5ms', activeConnections: 42 },
        'api-test': { users: 150, endpoints: 23, uptime: '99.9%' },
        'upload-test': { fileId: 'f-98765', size: '2.3MB', url: '/uploads/file.pdf' },
        'validation-test': { valid: true, fieldsChecked: 12, errors: 0 }
    };

    return payloads[test.id] || { message: 'Success' };
}

/**
 * Generate mock error based on test type
 * @param {Object} test - Test configuration
 * @returns {string} Mock error message
 */
function generateMockError(test) {
    const errors = [
        'Connection timeout',
        'Invalid credentials',
        'Database connection failed',
        'Network error occurred',
        'Invalid request format',
        'Server returned 500 error',
        'Resource not found'
    ];

    return errors[Math.floor(Math.random() * errors.length)];
}

/**
 * Update test status badge and card styling
 * @param {string} testId - Test ID
 * @param {string} status - Test status (pending, running, passed, failed)
 */
function updateTestStatus(testId, status) {
    const badge = document.getElementById(`badge-${testId}`);
    const card = document.getElementById(`card-${testId}`);

    if (badge) {
        badge.textContent = status.charAt(0).toUpperCase() + status.slice(1);
        badge.className = `test-status-badge status-${status}`;
    }

    if (card) {
        card.className = `test-card status-${status}`;
    }
}

/**
 * Show/hide loading state for test button
 * @param {string} testId - Test ID
 * @param {boolean} isLoading - Loading state
 */
function showLoadingState(testId, isLoading) {
    const button = document.querySelector(`[data-test-id="${testId}"].run-test-btn`);
    if (!button) return;

    const btnText = button.querySelector('.btn-text');
    const btnLoader = button.querySelector('.btn-loader');

    if (isLoading) {
        button.disabled = true;
        btnText.textContent = 'Running...';
        if (btnLoader) btnLoader.style.display = 'inline-block';
    } else {
        button.disabled = false;
        btnText.textContent = 'Run Test';
        if (btnLoader) btnLoader.style.display = 'none';
    }
}

/**
 * Display test result in the card
 * @param {string} testId - Test ID
 * @param {Object} result - Test result data
 */
function displayTestResult(testId, result) {
    const resultContainer = document.getElementById(`result-${testId}`);
    const timeElement = document.getElementById(`time-${testId}`);

    if (!resultContainer) return;

    const resultContent = resultContainer.querySelector('.result-content');
    resultContainer.style.display = 'block';

    if (result.success) {
        resultContent.innerHTML = `
            <div class="result-success">
                <strong>Success!</strong> ${result.message}
                <div class="result-details">
                    <p><strong>Status:</strong> ${result.status}</p>
                    <p><strong>Response Time:</strong> ${result.executionTime}ms</p>
                    ${result.data ? `<pre>${JSON.stringify(result.data, null, 2)}</pre>` : ''}
                </div>
            </div>
        `;
    } else {
        resultContent.innerHTML = `
            <div class="result-error">
                <strong>Failed!</strong> ${result.message}
                <div class="result-details">
                    <p><strong>Status:</strong> ${result.status || 'Error'}</p>
                    <p><strong>Error:</strong> ${result.error || 'Unknown error'}</p>
                    <p><strong>Execution Time:</strong> ${result.executionTime}ms</p>
                </div>
            </div>
        `;
    }

    if (timeElement) {
        timeElement.textContent = `${result.executionTime}ms`;
    }

    // Add animation
    resultContainer.classList.add('result-fade-in');
}

/**
 * Hide test result in the card
 * @param {string} testId - Test ID
 */
function hideTestResult(testId) {
    const resultContainer = document.getElementById(`result-${testId}`);
    if (resultContainer) {
        resultContainer.style.display = 'none';
        resultContainer.classList.remove('result-fade-in');
    }
}

/**
 * Update dashboard statistics
 */
function updateDashboardStats() {
    const tests = Object.values(appState.tests);

    const total = tests.length;
    const passed = tests.filter(t => t.status === 'passed').length;
    const failed = tests.filter(t => t.status === 'failed').length;
    const successRate = total > 0 ? ((passed / total) * 100).toFixed(1) : 0;

    // Update stat cards
    updateStatCard('total-tests', total);
    updateStatCard('passed-tests', passed);
    updateStatCard('failed-tests', failed);
    updateStatCard('success-rate', `${successRate}%`);

    // Update results table
    updateResultsTable();
}

/**
 * Update individual stat card
 * @param {string} elementId - Element ID
 * @param {string|number} value - Value to display
 */
function updateStatCard(elementId, value) {
    const element = document.getElementById(elementId);
    if (element) {
        element.textContent = value;

        // Add animation
        element.classList.add('stat-update');
        setTimeout(() => element.classList.remove('stat-update'), 300);
    }
}

/**
 * Update results table with test history
 */
function updateResultsTable() {
    const resultsBody = document.getElementById('results-body');
    if (!resultsBody) return;

    const completedTests = Object.values(appState.tests)
        .filter(test => test.status === 'passed' || test.status === 'failed')
        .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

    if (completedTests.length === 0) {
        resultsBody.innerHTML = '<tr><td colspan="5" style="text-align: center; color: #666;">No tests run yet</td></tr>';
        return;
    }

    resultsBody.innerHTML = completedTests.map(test => `
        <tr class="result-row status-${test.status}">
            <td>${test.name}</td>
            <td><span class="badge-small status-${test.status}">${test.status.toUpperCase()}</span></td>
            <td>${test.method}</td>
            <td>${test.executionTime}ms</td>
            <td>${formatTimestamp(test.timestamp)}</td>
        </tr>
    `).join('');
}

/**
 * Format timestamp for display
 * @param {string} timestamp - ISO timestamp
 * @returns {string} Formatted timestamp
 */
function formatTimestamp(timestamp) {
    if (!timestamp) return '-';
    const date = new Date(timestamp);
    return date.toLocaleTimeString();
}

/**
 * Add test result to history
 * @param {string} testId - Test ID
 * @param {Object} result - Test result
 */
function addToHistory(testId, result) {
    appState.history.unshift({
        testId,
        result,
        timestamp: new Date().toISOString()
    });

    // Keep only last 50 results
    if (appState.history.length > 50) {
        appState.history = appState.history.slice(0, 50);
    }
}

/**
 * Save test history to localStorage
 */
function saveTestHistory() {
    try {
        localStorage.setItem('quick-test-history', JSON.stringify(appState.history));
    } catch (error) {
        console.error('Failed to save test history:', error);
    }
}

/**
 * Load test history from localStorage
 */
function loadTestHistory() {
    try {
        const saved = localStorage.getItem('quick-test-history');
        if (saved) {
            appState.history = JSON.parse(saved);
            console.log('Test history loaded:', appState.history.length, 'entries');
        }
    } catch (error) {
        console.error('Failed to load test history:', error);
    }
}

/**
 * Export results as JSON (bonus feature)
 */
function exportResults() {
    const data = {
        tests: appState.tests,
        history: appState.history,
        exportDate: new Date().toISOString()
    };

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `test-results-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
}

// Make export function globally accessible
window.exportResults = exportResults;

// Log application ready
console.log('Quick Test Application ready with', TEST_SCENARIOS.length, 'test scenarios');
