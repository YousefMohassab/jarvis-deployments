/**
 * Dashboard Controller Module
 * Main controller coordinating all dashboard components
 */

const DashboardController = (function() {
    'use strict';

    let updateInterval = null;
    let previousData = null;
    let isRunning = false;

    /**
     * Initialize dashboard
     */
    function init() {
        console.log('Initializing SMT Dashboard...');

        // Initialize all modules
        Config.init();
        DataSimulator.init();
        KPICalculator.init();
        ChartManager.init();
        AlertManager.init();

        // Setup UI event listeners
        setupEventListeners();

        // Initial data load
        updateDashboard();

        // Start auto-refresh
        startAutoRefresh();

        console.log('SMT Dashboard initialized successfully');
    }

    /**
     * Setup event listeners
     */
    function setupEventListeners() {
        // Refresh button
        const refreshBtn = document.getElementById('refreshBtn');
        if (refreshBtn) {
            refreshBtn.addEventListener('click', () => {
                updateDashboard();
                AlertManager.showAlert('info', 'Data Refreshed', 'Dashboard data has been refreshed', true);
            });
        }

        // Config button
        const configBtn = document.getElementById('configBtn');
        const configModal = document.getElementById('configModal');
        const closeModal = document.getElementById('closeModal');

        if (configBtn && configModal) {
            configBtn.addEventListener('click', () => {
                openConfigModal();
            });
        }

        if (closeModal && configModal) {
            closeModal.addEventListener('click', () => {
                closeConfigModal();
            });
        }

        // Close modal on outside click
        if (configModal) {
            configModal.addEventListener('click', (e) => {
                if (e.target === configModal) {
                    closeConfigModal();
                }
            });
        }

        // Save config button
        const saveConfig = document.getElementById('saveConfig');
        if (saveConfig) {
            saveConfig.addEventListener('click', () => {
                saveConfiguration();
            });
        }

        // Reset config button
        const resetConfig = document.getElementById('resetConfig');
        if (resetConfig) {
            resetConfig.addEventListener('click', () => {
                resetConfiguration();
            });
        }

        // Chart period buttons
        const chartButtons = document.querySelectorAll('.chart-btn');
        chartButtons.forEach(btn => {
            btn.addEventListener('click', (e) => {
                const period = e.target.dataset.period;
                if (period) {
                    setChartPeriod(period);

                    // Update active state
                    chartButtons.forEach(b => b.classList.remove('active'));
                    e.target.classList.add('active');
                }
            });
        });

        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            // Ctrl/Cmd + R to refresh
            if ((e.ctrlKey || e.metaKey) && e.key === 'r') {
                e.preventDefault();
                updateDashboard();
            }

            // Escape to close modal
            if (e.key === 'Escape') {
                closeConfigModal();
            }
        });
    }

    /**
     * Update dashboard with latest data
     */
    function updateDashboard() {
        try {
            // Get current data
            const currentData = DataSimulator.getCurrentData();

            // Update KPIs
            KPICalculator.updateAllKPIs(currentData);

            // Update secondary metrics
            const secondaryMetrics = DataSimulator.getSecondaryMetrics();
            KPICalculator.updateSecondaryMetrics(secondaryMetrics);

            // Update charts
            ChartManager.refreshAllCharts();

            // Check thresholds and show alerts
            if (previousData) {
                AlertManager.checkThresholds(currentData, previousData);
            }

            // Update last update timestamp
            updateLastUpdateTime();

            // Store current data for next comparison
            previousData = { ...currentData };

        } catch (error) {
            console.error('Error updating dashboard:', error);
            AlertManager.showAlert('error', 'Update Error', 'Failed to update dashboard data', true);
        }
    }

    /**
     * Start auto-refresh
     */
    function startAutoRefresh() {
        if (isRunning) return;

        const refreshInterval = Config.get('refreshInterval') || 5000;

        updateInterval = setInterval(() => {
            updateDashboard();
        }, refreshInterval);

        isRunning = true;
        console.log(`Auto-refresh started (${refreshInterval}ms)`);
    }

    /**
     * Stop auto-refresh
     */
    function stopAutoRefresh() {
        if (updateInterval) {
            clearInterval(updateInterval);
            updateInterval = null;
        }
        isRunning = false;
        console.log('Auto-refresh stopped');
    }

    /**
     * Restart auto-refresh with new interval
     */
    function restartAutoRefresh() {
        stopAutoRefresh();
        startAutoRefresh();
    }

    /**
     * Update last update timestamp
     */
    function updateLastUpdateTime() {
        const element = document.getElementById('lastUpdate');
        if (element) {
            const now = new Date();
            element.textContent = formatDateTime(now);
        }
    }

    /**
     * Format date and time
     */
    function formatDateTime(date) {
        const hours = String(date.getHours()).padStart(2, '0');
        const minutes = String(date.getMinutes()).padStart(2, '0');
        const seconds = String(date.getSeconds()).padStart(2, '0');
        return `${hours}:${minutes}:${seconds}`;
    }

    /**
     * Open configuration modal
     */
    function openConfigModal() {
        const modal = document.getElementById('configModal');
        if (!modal) return;

        // Load current config values
        const config = Config.getConfig();

        document.getElementById('fpyTarget').value = config.kpiThresholds.fpy.target;
        document.getElementById('oeeTarget').value = config.kpiThresholds.oee.target;
        document.getElementById('dpmoThreshold').value = config.kpiThresholds.dpmo.target;
        document.getElementById('cycleTimeTarget').value = config.kpiThresholds.cycleTime.target;
        document.getElementById('refreshIntervalInput').value = config.refreshInterval / 1000;

        modal.classList.add('active');
    }

    /**
     * Close configuration modal
     */
    function closeConfigModal() {
        const modal = document.getElementById('configModal');
        if (modal) {
            modal.classList.remove('active');
        }
    }

    /**
     * Save configuration
     */
    function saveConfiguration() {
        try {
            const fpyTarget = parseFloat(document.getElementById('fpyTarget').value);
            const oeeTarget = parseFloat(document.getElementById('oeeTarget').value);
            const dpmoThreshold = parseFloat(document.getElementById('dpmoThreshold').value);
            const cycleTimeTarget = parseFloat(document.getElementById('cycleTimeTarget').value);
            const refreshInterval = parseFloat(document.getElementById('refreshIntervalInput').value) * 1000;

            // Validate inputs
            if (isNaN(fpyTarget) || isNaN(oeeTarget) || isNaN(dpmoThreshold) ||
                isNaN(cycleTimeTarget) || isNaN(refreshInterval)) {
                AlertManager.showAlert('error', 'Invalid Input', 'Please enter valid numbers for all fields', true);
                return;
            }

            // Update config
            Config.updateKpiThreshold('fpy', { target: fpyTarget });
            Config.updateKpiThreshold('oee', { target: oeeTarget });
            Config.updateKpiThreshold('dpmo', { target: dpmoThreshold });
            Config.updateKpiThreshold('cycleTime', { target: cycleTimeTarget });
            Config.set('refreshInterval', refreshInterval);

            // Update refresh interval display
            const refreshIntervalElement = document.getElementById('refreshInterval');
            if (refreshIntervalElement) {
                refreshIntervalElement.textContent = `${refreshInterval / 1000}s`;
            }

            // Restart auto-refresh with new interval
            restartAutoRefresh();

            // Close modal
            closeConfigModal();

            // Show success alert
            AlertManager.showAlert('success', 'Settings Saved', 'Configuration has been updated successfully', true);

        } catch (error) {
            console.error('Error saving configuration:', error);
            AlertManager.showAlert('error', 'Save Error', 'Failed to save configuration', true);
        }
    }

    /**
     * Reset configuration to defaults
     */
    function resetConfiguration() {
        if (confirm('Are you sure you want to reset all settings to defaults?')) {
            Config.reset();
            openConfigModal(); // Reload modal with default values
            AlertManager.showAlert('info', 'Settings Reset', 'Configuration has been reset to defaults', true);
        }
    }

    /**
     * Set chart period
     */
    function setChartPeriod(period) {
        ChartManager.setChartPeriod(period);

        // Update chart based on new period
        let hours = 8;
        switch (period) {
            case '1h':
                hours = 1;
                break;
            case '8h':
                hours = 8;
                break;
            case '24h':
                hours = 24;
                break;
        }

        const fpyData = DataSimulator.getHistoricalData('fpy', hours);
        ChartManager.updateFPYChart(fpyData.values, fpyData.timestamps);
    }

    /**
     * Export dashboard data (for future use)
     */
    function exportData() {
        try {
            const data = {
                timestamp: new Date().toISOString(),
                currentData: DataSimulator.getCurrentData(),
                configuration: Config.getConfig()
            };

            const dataStr = JSON.stringify(data, null, 2);
            const dataBlob = new Blob([dataStr], { type: 'application/json' });
            const url = URL.createObjectURL(dataBlob);

            const link = document.createElement('a');
            link.href = url;
            link.download = `smt-dashboard-data-${Date.now()}.json`;
            link.click();

            URL.revokeObjectURL(url);

            AlertManager.showAlert('success', 'Data Exported', 'Dashboard data has been exported successfully', true);
        } catch (error) {
            console.error('Error exporting data:', error);
            AlertManager.showAlert('error', 'Export Error', 'Failed to export data', true);
        }
    }

    /**
     * Trigger quality event (for testing)
     */
    function triggerQualityEvent(eventType) {
        DataSimulator.triggerEvent(eventType);
        updateDashboard();
    }

    /**
     * Export public API
     */
    return {
        init,
        updateDashboard,
        startAutoRefresh,
        stopAutoRefresh,
        exportData,
        triggerQualityEvent
    };
})();

// Initialize on load
if (typeof window !== 'undefined') {
    window.DashboardController = DashboardController;
}
