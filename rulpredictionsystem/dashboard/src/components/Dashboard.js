import React, { useState, useEffect, useCallback } from 'react';
import BearingList from './BearingList';
import PredictionChart from './PredictionChart';
import AlertPanel from './AlertPanel';
import FeatureImportance from './FeatureImportance';
import { api } from '../services/api';
import { websocketService } from '../services/websocket';
import './Dashboard.css';

const Dashboard = () => {
  const [bearings, setBearings] = useState([]);
  const [selectedBearing, setSelectedBearing] = useState(null);
  const [predictions, setPredictions] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [featureImportance, setFeatureImportance] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isConnected, setIsConnected] = useState(false);

  // Fetch initial data
  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch bearings
      const bearingsData = await api.getBearings();
      setBearings(bearingsData);

      // Select first bearing if none selected
      if (bearingsData.length > 0 && !selectedBearing) {
        setSelectedBearing(bearingsData[0].bearing_id);
      }

      // Fetch alerts
      const alertsData = await api.getAlerts();
      setAlerts(alertsData);

      setLoading(false);
    } catch (err) {
      console.error('Error fetching data:', err);
      setError(err.message || 'Failed to load dashboard data');
      setLoading(false);
    }
  }, [selectedBearing]);

  // Fetch bearing-specific data
  const fetchBearingData = useCallback(async (bearingId) => {
    if (!bearingId) return;

    try {
      // Fetch predictions
      const predictionsData = await api.getPredictions(bearingId);
      setPredictions(predictionsData);

      // Fetch feature importance
      const importanceData = await api.getFeatureImportance(bearingId);
      setFeatureImportance(importanceData);
    } catch (err) {
      console.error('Error fetching bearing data:', err);
    }
  }, []);

  // Handle WebSocket messages
  const handleWebSocketMessage = useCallback((data) => {
    console.log('WebSocket message received:', data);

    if (data.type === 'prediction') {
      // Update predictions
      setPredictions(prev => [...prev, data.data].slice(-50)); // Keep last 50 predictions

      // Update bearing in list
      setBearings(prev => prev.map(bearing =>
        bearing.bearing_id === data.data.bearing_id
          ? { ...bearing, ...data.data }
          : bearing
      ));
    } else if (data.type === 'alert') {
      // Add new alert
      setAlerts(prev => [data.data, ...prev].slice(0, 20)); // Keep last 20 alerts
    } else if (data.type === 'status') {
      // Update bearing status
      setBearings(prev => prev.map(bearing =>
        bearing.bearing_id === data.bearing_id
          ? { ...bearing, status: data.status }
          : bearing
      ));
    }
  }, []);

  // Initialize dashboard
  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Fetch bearing-specific data when selection changes
  useEffect(() => {
    if (selectedBearing) {
      fetchBearingData(selectedBearing);
    }
  }, [selectedBearing, fetchBearingData]);

  // Setup WebSocket connection
  useEffect(() => {
    websocketService.connect('ws://localhost:8000/ws');

    websocketService.onMessage(handleWebSocketMessage);

    websocketService.onConnectionChange((connected) => {
      setIsConnected(connected);
      if (connected) {
        console.log('WebSocket connected');
      } else {
        console.log('WebSocket disconnected');
      }
    });

    return () => {
      websocketService.disconnect();
    };
  }, [handleWebSocketMessage]);

  // Handle bearing selection
  const handleBearingSelect = (bearingId) => {
    setSelectedBearing(bearingId);
  };

  // Handle refresh
  const handleRefresh = () => {
    fetchData();
    if (selectedBearing) {
      fetchBearingData(selectedBearing);
    }
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="spinner"></div>
        <p className="loading-text">Loading dashboard...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="error-container">
        <div className="error-title">
          <span>⚠️</span>
          <span>Error Loading Dashboard</span>
        </div>
        <p className="error-message">{error}</p>
        <button className="btn btn-primary" onClick={handleRefresh} style={{ marginTop: '1rem' }}>
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="dashboard">
      <div className="dashboard-controls">
        <div className="connection-status">
          <span className={`status-indicator ${isConnected ? 'connected' : 'disconnected'}`}></span>
          <span className="status-text">
            {isConnected ? 'Connected' : 'Disconnected'}
          </span>
        </div>
        <button className="btn btn-secondary" onClick={handleRefresh}>
          🔄 Refresh
        </button>
      </div>

      <div className="dashboard-grid">
        <div className="dashboard-sidebar">
          <BearingList
            bearings={bearings}
            selectedBearing={selectedBearing}
            onSelectBearing={handleBearingSelect}
          />
          <AlertPanel alerts={alerts} />
        </div>

        <div className="dashboard-main">
          {selectedBearing ? (
            <>
              <PredictionChart
                bearingId={selectedBearing}
                predictions={predictions}
              />
              <FeatureImportance
                bearingId={selectedBearing}
                featureImportance={featureImportance}
              />
            </>
          ) : (
            <div className="no-selection">
              <p>Select a bearing to view predictions</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
