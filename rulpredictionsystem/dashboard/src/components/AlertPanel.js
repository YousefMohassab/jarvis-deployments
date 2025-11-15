import React, { useMemo } from 'react';
import './AlertPanel.css';

const AlertPanel = ({ alerts }) => {
  // Sort alerts by timestamp (newest first) and severity
  const sortedAlerts = useMemo(() => {
    if (!alerts || alerts.length === 0) return [];

    const severityOrder = { critical: 0, warning: 1, info: 2 };

    return [...alerts].sort((a, b) => {
      // First by severity
      const severityDiff = (severityOrder[a.severity?.toLowerCase()] || 3) -
                          (severityOrder[b.severity?.toLowerCase()] || 3);
      if (severityDiff !== 0) return severityDiff;

      // Then by timestamp (newest first)
      const timeA = new Date(a.timestamp || 0);
      const timeB = new Date(b.timestamp || 0);
      return timeB - timeA;
    });
  }, [alerts]);

  const getSeverityClass = (severity) => {
    if (!severity) return 'alert-info';
    const severityLower = severity.toLowerCase();
    if (severityLower === 'critical') return 'alert-critical';
    if (severityLower === 'warning') return 'alert-warning';
    return 'alert-info';
  };

  const getSeverityIcon = (severity) => {
    if (!severity) return '🔵';
    const severityLower = severity.toLowerCase();
    if (severityLower === 'critical') return '🔴';
    if (severityLower === 'warning') return '🟡';
    return '🔵';
  };

  const formatTimestamp = (timestamp) => {
    if (!timestamp) return 'Unknown time';
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;

    return date.toLocaleDateString();
  };

  // Count alerts by severity
  const alertCounts = useMemo(() => {
    const counts = { critical: 0, warning: 0, info: 0 };
    sortedAlerts.forEach(alert => {
      const severity = alert.severity?.toLowerCase() || 'info';
      if (counts.hasOwnProperty(severity)) {
        counts[severity]++;
      }
    });
    return counts;
  }, [sortedAlerts]);

  return (
    <div className="card alert-panel-card">
      <div className="card-header">
        <h2 className="card-title">Active Alerts ({sortedAlerts.length})</h2>
        {sortedAlerts.length > 0 && (
          <div className="alert-summary">
            {alertCounts.critical > 0 && (
              <span className="alert-count critical">{alertCounts.critical} Critical</span>
            )}
            {alertCounts.warning > 0 && (
              <span className="alert-count warning">{alertCounts.warning} Warning</span>
            )}
          </div>
        )}
      </div>

      <div className="alert-list">
        {sortedAlerts.length === 0 ? (
          <div className="empty-alerts">
            <div className="empty-icon">✓</div>
            <p>No active alerts</p>
            <p className="empty-subtext">All systems operating normally</p>
          </div>
        ) : (
          sortedAlerts.slice(0, 10).map((alert, index) => (
            <div key={alert.id || index} className={`alert-item ${getSeverityClass(alert.severity)}`}>
              <div className="alert-header">
                <span className="alert-icon">{getSeverityIcon(alert.severity)}</span>
                <div className="alert-info">
                  <div className="alert-title-row">
                    <span className="alert-bearing">{alert.bearing_id || 'System'}</span>
                    <span className="alert-timestamp">{formatTimestamp(alert.timestamp)}</span>
                  </div>
                  <p className="alert-message">{alert.message || 'No message'}</p>
                  {alert.details && (
                    <p className="alert-details">{alert.details}</p>
                  )}
                  {alert.predicted_rul !== undefined && alert.predicted_rul !== null && (
                    <div className="alert-rul">
                      <span className="alert-rul-label">RUL:</span>
                      <span className="alert-rul-value">{Math.round(alert.predicted_rul)} hrs</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {sortedAlerts.length > 10 && (
        <div className="alert-footer">
          <p className="alert-more">+ {sortedAlerts.length - 10} more alerts</p>
        </div>
      )}
    </div>
  );
};

export default AlertPanel;
