import React, { useMemo } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell
} from 'recharts';
import './FeatureImportance.css';

const FeatureImportance = ({ bearingId, featureImportance }) => {
  // Process feature importance data
  const chartData = useMemo(() => {
    if (!featureImportance || !featureImportance.features) return [];

    // Convert object to array if needed
    const features = Array.isArray(featureImportance.features)
      ? featureImportance.features
      : Object.entries(featureImportance.features).map(([name, importance]) => ({
          feature: name,
          importance: importance
        }));

    // Sort by importance and take top 10
    return features
      .sort((a, b) => (b.importance || 0) - (a.importance || 0))
      .slice(0, 10)
      .map(item => ({
        feature: formatFeatureName(item.feature || item.name),
        importance: (item.importance || 0) * 100,
        rawImportance: item.importance || 0
      }));
  }, [featureImportance]);

  // Format feature names for better display
  function formatFeatureName(name) {
    if (!name) return 'Unknown';

    // Replace underscores with spaces and capitalize
    return name
      .replace(/_/g, ' ')
      .replace(/\b\w/g, char => char.toUpperCase())
      .replace(/Rms/g, 'RMS')
      .replace(/Std/g, 'Std Dev')
      .replace(/Fft/g, 'FFT');
  }

  // Get color based on importance
  const getBarColor = (importance) => {
    if (importance > 15) return '#f44336'; // High importance - red
    if (importance > 10) return '#ff9800'; // Medium importance - orange
    if (importance > 5) return '#4fc3f7';  // Low-medium importance - blue
    return '#66bb6a';                       // Low importance - green
  };

  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      return (
        <div className="custom-tooltip">
          <p className="tooltip-label">{payload[0].payload.feature}</p>
          <p className="tooltip-value" style={{ color: payload[0].fill }}>
            Importance: {payload[0].value.toFixed(2)}%
          </p>
        </div>
      );
    }
    return null;
  };

  if (!featureImportance || chartData.length === 0) {
    return (
      <div className="card feature-importance-card">
        <div className="card-header">
          <h2 className="card-title">Feature Importance - {bearingId}</h2>
        </div>
        <div className="empty-chart">
          <p>No feature importance data available</p>
        </div>
      </div>
    );
  }

  return (
    <div className="card feature-importance-card">
      <div className="card-header">
        <h2 className="card-title">Feature Importance - {bearingId}</h2>
        <div className="importance-info">
          <span className="info-label">Top {chartData.length} Features</span>
        </div>
      </div>

      <div className="chart-container">
        <ResponsiveContainer width="100%" height={400}>
          <BarChart
            data={chartData}
            layout="vertical"
            margin={{ top: 5, right: 30, left: 120, bottom: 5 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#2a2f4a" />
            <XAxis
              type="number"
              stroke="#b0bec5"
              tick={{ fill: '#b0bec5', fontSize: 12 }}
              label={{ value: 'Importance (%)', position: 'insideBottom', offset: -5, fill: '#b0bec5' }}
            />
            <YAxis
              type="category"
              dataKey="feature"
              stroke="#b0bec5"
              tick={{ fill: '#b0bec5', fontSize: 11 }}
              width={110}
            />
            <Tooltip content={<CustomTooltip />} />
            <Bar
              dataKey="importance"
              radius={[0, 4, 4, 0]}
            >
              {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={getBarColor(entry.importance)} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="feature-legend">
        <div className="legend-item">
          <div className="legend-color" style={{ background: '#f44336' }}></div>
          <span>High Impact (&gt;15%)</span>
        </div>
        <div className="legend-item">
          <div className="legend-color" style={{ background: '#ff9800' }}></div>
          <span>Medium Impact (10-15%)</span>
        </div>
        <div className="legend-item">
          <div className="legend-color" style={{ background: '#4fc3f7' }}></div>
          <span>Low-Medium Impact (5-10%)</span>
        </div>
        <div className="legend-item">
          <div className="legend-color" style={{ background: '#66bb6a' }}></div>
          <span>Low Impact (&lt;5%)</span>
        </div>
      </div>

      {featureImportance.model_info && (
        <div className="model-info">
          <div className="info-row">
            <span className="info-label">Model:</span>
            <span className="info-value">{featureImportance.model_info.type || 'Unknown'}</span>
          </div>
          {featureImportance.model_info.accuracy && (
            <div className="info-row">
              <span className="info-label">Accuracy:</span>
              <span className="info-value">
                {(featureImportance.model_info.accuracy * 100).toFixed(2)}%
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default FeatureImportance;
