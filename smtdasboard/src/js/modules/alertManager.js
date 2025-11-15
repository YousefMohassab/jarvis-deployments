/**
 * Alert Manager Module
 * Manages alert notifications and threshold violations
 */

const AlertManager = (function() {
    'use strict';

    let alertQueue = [];
    let alertIdCounter = 0;
    const MAX_VISIBLE_ALERTS = 3;
    const AUTO_DISMISS_TIME = 5000; // 5 seconds

    /**
     * Initialize alert manager
     */
    function init() {
        // Setup event listeners
        setupEventListeners();
    }

    /**
     * Setup event listeners
     */
    function setupEventListeners() {
        // Listen for clicks on close buttons (event delegation)
        const container = document.getElementById('alertContainer');
        if (container) {
            container.addEventListener('click', (e) => {
                if (e.target.classList.contains('alert-close') ||
                    e.target.closest('.alert-close')) {
                    const alert = e.target.closest('.alert');
                    if (alert) {
                        dismissAlert(alert.dataset.alertId);
                    }
                }
            });
        }
    }

    /**
     * Show alert notification
     * @param {string} type - Alert type: 'success', 'warning', 'error', 'info'
     * @param {string} title - Alert title
     * @param {string} message - Alert message
     * @param {boolean} autoDismiss - Auto dismiss after timeout
     */
    function showAlert(type, title, message, autoDismiss = true) {
        const alertId = `alert-${alertIdCounter++}`;

        const alert = {
            id: alertId,
            type: type,
            title: title,
            message: message,
            timestamp: new Date(),
            autoDismiss: autoDismiss
        };

        alertQueue.push(alert);
        renderAlert(alert);

        // Auto dismiss
        if (autoDismiss) {
            setTimeout(() => {
                dismissAlert(alertId);
            }, AUTO_DISMISS_TIME);
        }

        // Manage queue size
        if (alertQueue.length > MAX_VISIBLE_ALERTS) {
            const oldestAlert = alertQueue.shift();
            dismissAlert(oldestAlert.id);
        }
    }

    /**
     * Render alert to DOM
     * @param {Object} alert - Alert object
     */
    function renderAlert(alert) {
        const container = document.getElementById('alertContainer');
        if (!container) return;

        const alertElement = createAlertElement(alert);
        container.appendChild(alertElement);

        // Trigger animation
        setTimeout(() => {
            alertElement.style.opacity = '1';
            alertElement.style.transform = 'translateX(0)';
        }, 10);
    }

    /**
     * Create alert DOM element
     * @param {Object} alert - Alert object
     * @returns {HTMLElement} Alert element
     */
    function createAlertElement(alert) {
        const alertDiv = document.createElement('div');
        alertDiv.className = `alert alert-${alert.type}`;
        alertDiv.dataset.alertId = alert.id;
        alertDiv.style.opacity = '0';
        alertDiv.style.transform = 'translateX(100%)';
        alertDiv.style.transition = 'all 0.3s ease-out';

        const icon = getAlertIcon(alert.type);

        alertDiv.innerHTML = `
            <div class="alert-icon">
                ${icon}
            </div>
            <div class="alert-content">
                <div class="alert-title">${escapeHtml(alert.title)}</div>
                <div class="alert-message">${escapeHtml(alert.message)}</div>
                <div class="alert-timestamp">${formatTimestamp(alert.timestamp)}</div>
            </div>
            <button class="alert-close" aria-label="Close alert">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <line x1="18" y1="6" x2="6" y2="18"/>
                    <line x1="6" y1="6" x2="18" y2="18"/>
                </svg>
            </button>
            ${alert.autoDismiss ? '<div class="alert-progress"></div>' : ''}
        `;

        return alertDiv;
    }

    /**
     * Get icon SVG for alert type
     * @param {string} type - Alert type
     * @returns {string} SVG icon HTML
     */
    function getAlertIcon(type) {
        const icons = {
            success: `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
                <polyline points="22 4 12 14.01 9 11.01"/>
            </svg>`,
            warning: `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
                <line x1="12" y1="9" x2="12" y2="13"/>
                <line x1="12" y1="17" x2="12.01" y2="17"/>
            </svg>`,
            error: `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <circle cx="12" cy="12" r="10"/>
                <line x1="15" y1="9" x2="9" y2="15"/>
                <line x1="9" y1="9" x2="15" y2="15"/>
            </svg>`,
            info: `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <circle cx="12" cy="12" r="10"/>
                <line x1="12" y1="16" x2="12" y2="12"/>
                <line x1="12" y1="8" x2="12.01" y2="8"/>
            </svg>`
        };

        return icons[type] || icons.info;
    }

    /**
     * Dismiss alert
     * @param {string} alertId - Alert ID
     */
    function dismissAlert(alertId) {
        const alertElement = document.querySelector(`[data-alert-id="${alertId}"]`);
        if (!alertElement) return;

        alertElement.classList.add('closing');
        alertElement.style.opacity = '0';
        alertElement.style.transform = 'translateX(100%)';

        setTimeout(() => {
            if (alertElement.parentNode) {
                alertElement.parentNode.removeChild(alertElement);
            }
        }, 300);

        // Remove from queue
        alertQueue = alertQueue.filter(alert => alert.id !== alertId);
    }

    /**
     * Check KPI thresholds and trigger alerts
     * @param {Object} data - Current KPI data
     * @param {Object} previousData - Previous KPI data
     */
    function checkThresholds(data, previousData = {}) {
        const kpis = ['fpy', 'oee', 'dpmo', 'cycleTime', 'throughput', 'uptime'];

        kpis.forEach(kpiName => {
            const value = data[kpiName];
            const previousValue = previousData[kpiName];
            const status = Config.checkThreshold(kpiName, value);
            const previousStatus = previousData[kpiName] ? Config.checkThreshold(kpiName, previousValue) : null;

            // Alert on status change to warning or critical
            if (status === 'critical' && previousStatus !== 'critical') {
                showAlert(
                    'error',
                    `${getKPIDisplayName(kpiName)} Critical`,
                    `${getKPIDisplayName(kpiName)} has reached critical level: ${formatKPIValue(value, kpiName)}`,
                    true
                );
            } else if (status === 'warning' && previousStatus !== 'warning' && previousStatus !== 'critical') {
                showAlert(
                    'warning',
                    `${getKPIDisplayName(kpiName)} Warning`,
                    `${getKPIDisplayName(kpiName)} is below target: ${formatKPIValue(value, kpiName)}`,
                    true
                );
            } else if (status === 'good' && (previousStatus === 'warning' || previousStatus === 'critical')) {
                showAlert(
                    'success',
                    `${getKPIDisplayName(kpiName)} Recovered`,
                    `${getKPIDisplayName(kpiName)} has returned to acceptable levels: ${formatKPIValue(value, kpiName)}`,
                    true
                );
            }
        });
    }

    /**
     * Get KPI display name
     * @param {string} kpiName - KPI identifier
     * @returns {string} Display name
     */
    function getKPIDisplayName(kpiName) {
        const names = {
            fpy: 'First Pass Yield',
            oee: 'OEE',
            dpmo: 'DPMO',
            cycleTime: 'Cycle Time',
            throughput: 'Throughput',
            uptime: 'Uptime'
        };

        return names[kpiName] || kpiName;
    }

    /**
     * Format KPI value for display
     * @param {number} value - Value
     * @param {string} kpiName - KPI name
     * @returns {string} Formatted value
     */
    function formatKPIValue(value, kpiName) {
        switch (kpiName) {
            case 'fpy':
            case 'oee':
            case 'uptime':
                return value.toFixed(1) + '%';
            case 'dpmo':
                return Math.round(value).toLocaleString();
            case 'cycleTime':
                return value.toFixed(1) + 's';
            case 'throughput':
                return Math.round(value) + ' boards/hr';
            default:
                return value.toString();
        }
    }

    /**
     * Format timestamp
     * @param {Date} date - Date object
     * @returns {string} Formatted timestamp
     */
    function formatTimestamp(date) {
        const now = new Date();
        const diff = Math.floor((now - date) / 1000);

        if (diff < 60) return 'Just now';
        if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
        return date.toLocaleTimeString();
    }

    /**
     * Escape HTML to prevent XSS
     * @param {string} text - Text to escape
     * @returns {string} Escaped text
     */
    function escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    /**
     * Clear all alerts
     */
    function clearAll() {
        alertQueue.forEach(alert => dismissAlert(alert.id));
        alertQueue = [];
    }

    /**
     * Export public API
     */
    return {
        init,
        showAlert,
        dismissAlert,
        checkThresholds,
        clearAll
    };
})();

// Initialize on load
if (typeof window !== 'undefined') {
    window.AlertManager = AlertManager;
}
