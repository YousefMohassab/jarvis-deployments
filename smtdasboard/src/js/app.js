/**
 * Main Application Entry Point
 * SMT Process Dashboard
 */

(function() {
    'use strict';

    /**
     * Initialize application when DOM is ready
     */
    function initApp() {
        console.log('SMT Dashboard v1.0.0 starting...');

        try {
            // Initialize dashboard controller
            DashboardController.init();

            // Show welcome message
            setTimeout(() => {
                AlertManager.showAlert(
                    'info',
                    'Dashboard Ready',
                    'SMT Process Dashboard is now monitoring your production line',
                    true
                );
            }, 500);

            // Log system info
            console.log('Dashboard initialized successfully');
            console.log('Modules loaded:', {
                Config: typeof Config !== 'undefined',
                DataSimulator: typeof DataSimulator !== 'undefined',
                KPICalculator: typeof KPICalculator !== 'undefined',
                ChartManager: typeof ChartManager !== 'undefined',
                AlertManager: typeof AlertManager !== 'undefined',
                DashboardController: typeof DashboardController !== 'undefined'
            });

        } catch (error) {
            console.error('Failed to initialize dashboard:', error);
            displayFatalError(error);
        }
    }

    /**
     * Display fatal error
     */
    function displayFatalError(error) {
        const body = document.body;
        if (!body) return;

        const errorDiv = document.createElement('div');
        errorDiv.style.cssText = `
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: #fee2e2;
            border: 2px solid #ef4444;
            border-radius: 8px;
            padding: 24px;
            max-width: 500px;
            z-index: 9999;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
        `;

        errorDiv.innerHTML = `
            <h2 style="color: #991b1b; margin: 0 0 12px 0; font-size: 18px;">
                Dashboard Initialization Error
            </h2>
            <p style="color: #7f1d1d; margin: 0 0 12px 0; font-size: 14px;">
                Failed to initialize the dashboard. Please refresh the page.
            </p>
            <pre style="background: #fff; padding: 12px; border-radius: 4px; font-size: 12px; overflow: auto;">
${error.message}
            </pre>
            <button onclick="location.reload()" style="
                background: #ef4444;
                color: white;
                border: none;
                padding: 8px 16px;
                border-radius: 4px;
                cursor: pointer;
                font-size: 14px;
                margin-top: 12px;
            ">
                Reload Page
            </button>
        `;

        body.appendChild(errorDiv);
    }

    /**
     * Check browser compatibility
     */
    function checkBrowserCompatibility() {
        const requiredFeatures = {
            'localStorage': typeof Storage !== 'undefined',
            'canvas': !!document.createElement('canvas').getContext,
            'fetch': typeof fetch !== 'undefined',
            'Promise': typeof Promise !== 'undefined',
            'Arrow Functions': (function() {
                try {
                    eval('() => {}');
                    return true;
                } catch (e) {
                    return false;
                }
            })()
        };

        const unsupported = [];
        for (const [feature, supported] of Object.entries(requiredFeatures)) {
            if (!supported) {
                unsupported.push(feature);
            }
        }

        if (unsupported.length > 0) {
            console.warn('Unsupported features:', unsupported);
            alert('Your browser may not support all dashboard features. Please use a modern browser like Chrome, Firefox, or Edge.');
        }

        return unsupported.length === 0;
    }

    /**
     * Handle page visibility changes
     */
    function handleVisibilityChange() {
        document.addEventListener('visibilitychange', () => {
            if (document.hidden) {
                console.log('Dashboard hidden, pausing updates');
                // Could pause updates here to save resources
            } else {
                console.log('Dashboard visible, resuming updates');
                DashboardController.updateDashboard();
            }
        });
    }

    /**
     * Handle window unload
     */
    function handleUnload() {
        window.addEventListener('beforeunload', () => {
            console.log('Dashboard closing');
            DashboardController.stopAutoRefresh();
        });
    }

    /**
     * Setup global error handler
     */
    function setupErrorHandler() {
        window.addEventListener('error', (event) => {
            console.error('Global error:', event.error);
        });

        window.addEventListener('unhandledrejection', (event) => {
            console.error('Unhandled promise rejection:', event.reason);
        });
    }

    /**
     * Add keyboard shortcuts info to console
     */
    function logKeyboardShortcuts() {
        console.log('%cKeyboard Shortcuts:', 'font-weight: bold; font-size: 14px');
        console.log('Ctrl/Cmd + R: Refresh dashboard data');
        console.log('Escape: Close modal windows');
    }

    /**
     * Expose API for debugging
     */
    function exposeDebugAPI() {
        window.SMTDashboard = {
            version: '1.0.0',
            refresh: () => DashboardController.updateDashboard(),
            exportData: () => DashboardController.exportData(),
            triggerEvent: (type) => DashboardController.triggerQualityEvent(type),
            getConfig: () => Config.getConfig(),
            showAlert: (type, title, message) => AlertManager.showAlert(type, title, message),
            help: () => {
                console.log('%cSMT Dashboard Debug API', 'font-weight: bold; font-size: 16px');
                console.log('Available commands:');
                console.log('  SMTDashboard.refresh() - Refresh dashboard data');
                console.log('  SMTDashboard.exportData() - Export current data');
                console.log('  SMTDashboard.triggerEvent(type) - Trigger quality event');
                console.log('    Types: "improvement", "degradation", "machine_issue"');
                console.log('  SMTDashboard.getConfig() - Get current configuration');
                console.log('  SMTDashboard.showAlert(type, title, message) - Show custom alert');
                console.log('    Types: "success", "warning", "error", "info"');
            }
        };

        console.log('%cDebug API available: window.SMTDashboard', 'color: #2563eb; font-weight: bold');
        console.log('Type SMTDashboard.help() for available commands');
    }

    /**
     * Main initialization
     */
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            checkBrowserCompatibility();
            initApp();
            handleVisibilityChange();
            handleUnload();
            setupErrorHandler();
            logKeyboardShortcuts();
            exposeDebugAPI();
        });
    } else {
        checkBrowserCompatibility();
        initApp();
        handleVisibilityChange();
        handleUnload();
        setupErrorHandler();
        logKeyboardShortcuts();
        exposeDebugAPI();
    }

})();
