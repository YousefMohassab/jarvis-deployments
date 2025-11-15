import React, { useMemo } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ReferenceLine
} from 'recharts';
import './PredictionChart.css';

const PredictionChart = ({ bearingId, predictions }) => {
  // Process predictions for chart
  const chartData = useMemo(() => {
    if (!predictions || predictions.length === 0) return [];

    return predictions.map((pred, index) => ({
      index: index + 1,
      rul: pred.predicted_rul || pred.rul,
      confidence: (pred.confidence || 0) * 100,
      timestamp: pred.timestamp ? new Date(pred.timestamp).toLocaleTimeString() : `Point ${index + 1}`,
      lowerBound: pred.lower_bound || null,
      upperBound: pred.upper_bound || null,
    }));
  }, [predictions]);

  // Calculate statistics
  const stats = useMemo(() => {
    if (chartData.length === 0) return null;

    const ruls = chartData.map(d => d.rul).filter(r => r !== null && r !== undefined);
    const confidences = chartData.map(d => d.confidence).filter(c => c !== null && c !== undefined);

    if (ruls.length === 0) return null;

    const currentRUL = ruls[ruls.length - 1];
    const avgRUL = ruls.reduce((a, b) => a + b, 0) / ruls.length;
    const minRUL = Math.min(...ruls);
    const maxRUL = Math.max(...ruls);
    const avgConfidence = confidences.length > 0
      ? confidences.reduce((a, b) => a + b, 0) / confidences.length
      : 0;

    // Calculate trend
    const trend = ruls.length > 1 ? ruls[ruls.length - 1] - ruls[0] : 0;

    return {
      current: currentRUL,
      average: avgRUL,
      min: minRUL,
      max: maxRUL,
      trend,
      avgConfidence
    };
  }, [chartData]);

  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      return (
        <div className="custom-tooltip">
          <p className="tooltip-label">{payload[0].payload.timestamp}</p>
          <p className="tooltip-value" style={{ color: '#4fc3f7' }}>
            RUL: {Math.round(payload[0].value)} hrs
          </p>
          {payload[1] && (
            <p className="tooltip-value" style={{ color: '#66bb6a' }}>
              Confidence: {Math.round(payload[1].value)}%
            </p>
          )}
        </div>
      );
    }
    return null;
  };

  if (!predictions || predictions.length === 0) {
    return (
      <div className="card prediction-chart-card">
        <div className="card-header">
          <h2 className="card-title">RUL Predictions - {bearingId}</h2>
        </div>
        <div className="empty-chart">
          <p>No prediction data available</p>
        </div>
      </div>
    );
  }

  return (
    <div className="card prediction-chart-card">
      <div className="card-header">
        <h2 className="card-title">RUL Predictions - {bearingId}</h2>
        {stats && (
          <div className="chart-stats">
            <div className="stat-item">
              <span className="stat-label">Current</span>
              <span className="stat-value">{Math.round(stats.current)} hrs</span>
            </div>
            <div className="stat-item">
              <span className="stat-label">Average</span>
              <span className="stat-value">{Math.round(stats.average)} hrs</span>
            </div>
            <div className="stat-item">
              <span className="stat-label">Trend</span>
              <span className={`stat-value ${stats.trend >= 0 ? 'positive' : 'negative'}`}>
                {stats.trend >= 0 ? '↑' : '↓'} {Math.abs(Math.round(stats.trend))} hrs
              </span>
            </div>
          </div>
        )}
      </div>

      <div className="chart-container">
        <ResponsiveContainer width="100%" height={400}>
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#2a2f4a" />
            <XAxis
              dataKey="timestamp"
              stroke="#b0bec5"
              tick={{ fill: '#b0bec5', fontSize: 12 }}
              angle={-45}
              textAnchor="end"
              height={80}
            />
            <YAxis
              yAxisId="left"
              stroke="#b0bec5"
              tick={{ fill: '#b0bec5', fontSize: 12 }}
              label={{ value: 'RUL (hours)', angle: -90, position: 'insideLeft', fill: '#b0bec5' }}
            />
            <YAxis
              yAxisId="right"
              orientation="right"
              stroke="#b0bec5"
              tick={{ fill: '#b0bec5', fontSize: 12 }}
              label={{ value: 'Confidence (%)', angle: 90, position: 'insideRight', fill: '#b0bec5' }}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend
              wrapperStyle={{ paddingTop: '20px' }}
              iconType="line"
            />
            <ReferenceLine
              yAxisId="left"
              y={100}
              stroke="#f44336"
              strokeDasharray="5 5"
              label={{ value: 'Critical', fill: '#f44336', position: 'right' }}
            />
            <Line
              yAxisId="left"
              type="monotone"
              dataKey="rul"
              stroke="#4fc3f7"
              strokeWidth={2}
              dot={{ fill: '#4fc3f7', r: 3 }}
              activeDot={{ r: 5 }}
              name="RUL"
            />
            <Line
              yAxisId="right"
              type="monotone"
              dataKey="confidence"
              stroke="#66bb6a"
              strokeWidth={2}
              dot={{ fill: '#66bb6a', r: 3 }}
              activeDot={{ r: 5 }}
              name="Confidence"
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {stats && (
        <div className="chart-footer">
          <div className="footer-stats">
            <div className="footer-stat">
              <span className="footer-label">Min RUL</span>
              <span className="footer-value">{Math.round(stats.min)} hrs</span>
            </div>
            <div className="footer-stat">
              <span className="footer-label">Max RUL</span>
              <span className="footer-value">{Math.round(stats.max)} hrs</span>
            </div>
            <div className="footer-stat">
              <span className="footer-label">Avg Confidence</span>
              <span className="footer-value">{Math.round(stats.avgConfidence)}%</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PredictionChart;
