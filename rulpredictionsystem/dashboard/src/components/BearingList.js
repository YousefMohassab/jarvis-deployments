import React from 'react';
import './BearingList.css';

const BearingList = ({ bearings, selectedBearing, onSelectBearing }) => {
  const getStatusClass = (status) => {
    if (!status) return 'status-unknown';
    const statusLower = status.toLowerCase();
    if (statusLower === 'healthy' || statusLower === 'normal') return 'status-healthy';
    if (statusLower === 'warning') return 'status-warning';
    if (statusLower === 'critical') return 'status-critical';
    return 'status-unknown';
  };

  const formatRUL = (rul) => {
    if (rul === null || rul === undefined) return 'N/A';
    if (rul < 0) return '0 hrs';
    return `${Math.round(rul)} hrs`;
  };

  const getHealthPercentage = (rul, maxRul = 1000) => {
    if (rul === null || rul === undefined) return 0;
    return Math.max(0, Math.min(100, (rul / maxRul) * 100));
  };

  return (
    <div className="card bearing-list-card">
      <div className="card-header">
        <h2 className="card-title">Bearings ({bearings.length})</h2>
      </div>
      <div className="bearing-list">
        {bearings.length === 0 ? (
          <div className="empty-state">
            <p>No bearings available</p>
          </div>
        ) : (
          bearings.map((bearing) => {
            const isSelected = bearing.bearing_id === selectedBearing;
            const healthPercentage = getHealthPercentage(bearing.predicted_rul);

            return (
              <div
                key={bearing.bearing_id}
                className={`bearing-item ${isSelected ? 'selected' : ''}`}
                onClick={() => onSelectBearing(bearing.bearing_id)}
              >
                <div className="bearing-header">
                  <div className="bearing-info">
                    <h3 className="bearing-name">{bearing.bearing_id}</h3>
                    <span className={`status-badge ${getStatusClass(bearing.status)}`}>
                      {bearing.status || 'Unknown'}
                    </span>
                  </div>
                </div>

                <div className="bearing-metrics">
                  <div className="metric">
                    <span className="metric-label">RUL</span>
                    <span className="metric-value">
                      {formatRUL(bearing.predicted_rul)}
                    </span>
                  </div>
                  <div className="metric">
                    <span className="metric-label">Confidence</span>
                    <span className="metric-value">
                      {bearing.confidence
                        ? `${Math.round(bearing.confidence * 100)}%`
                        : 'N/A'
                      }
                    </span>
                  </div>
                </div>

                <div className="health-bar">
                  <div
                    className="health-fill"
                    style={{
                      width: `${healthPercentage}%`,
                      background: healthPercentage > 50
                        ? '#4caf50'
                        : healthPercentage > 25
                        ? '#ff9800'
                        : '#f44336'
                    }}
                  ></div>
                </div>

                {bearing.last_updated && (
                  <div className="bearing-timestamp">
                    Last updated: {new Date(bearing.last_updated).toLocaleTimeString()}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

export default BearingList;
