# Smart Building Energy Management System - Architecture Document

## Executive Summary

This document outlines the production-ready architecture for a Smart Building Energy Management System (SBEMS) that integrates with Trane HVAC systems and Siemens thermostats to provide AI-powered predictive cooling optimization, real-time monitoring, and automated control.

## Table of Contents

1. [System Architecture Overview](#system-architecture-overview)
2. [Component Architecture](#component-architecture)
3. [Data Flow Architecture](#data-flow-architecture)
4. [Database Schema Design](#database-schema-design)
5. [API Design](#api-design)
6. [Integration Architecture](#integration-architecture)
7. [Security Architecture](#security-architecture)
8. [Scalability Strategy](#scalability-strategy)
9. [Deployment Architecture](#deployment-architecture)
10. [Architecture Decision Records](#architecture-decision-records)

---

## 1. System Architecture Overview

### 1.1 High-Level Architecture (C4 Context Diagram)

```
┌─────────────────────────────────────────────────────────────────────┐
│                     Smart Building Energy Management System          │
│                                                                       │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────┐          │
│  │   Frontend   │◄───┤   API Gateway│◄───┤  Auth Service│          │
│  │  React App   │    │   (Express)  │    │   (JWT/OAuth)│          │
│  └──────────────┘    └──────┬───────┘    └──────────────┘          │
│                              │                                        │
│  ┌──────────────────────────┼────────────────────────────┐          │
│  │                           ▼                            │          │
│  │  ┌────────────┐  ┌──────────────┐  ┌──────────────┐  │          │
│  │  │ WebSocket  │  │   Business   │  │  ML Engine   │  │          │
│  │  │  Server    │  │    Logic     │  │ (TensorFlow) │  │          │
│  │  └────────────┘  └──────────────┘  └──────────────┘  │          │
│  │                                                        │          │
│  └────────────────────────────────────────────────────────          │
│                              │                                        │
│  ┌──────────────────────────┼────────────────────────────┐          │
│  │                           ▼                            │          │
│  │  ┌────────────┐  ┌──────────────┐  ┌──────────────┐  │          │
│  │  │   MQTT     │  │  PostgreSQL  │  │    Redis     │  │          │
│  │  │  Broker    │  │ TimescaleDB  │  │    Cache     │  │          │
│  │  └────────────┘  └──────────────┘  └──────────────┘  │          │
│  └────────────────────────────────────────────────────────          │
│                              │                                        │
│  ┌──────────────────────────┼────────────────────────────┐          │
│  │     Integration Layer     ▼                            │          │
│  │  ┌────────────┐  ┌──────────────┐  ┌──────────────┐  │          │
│  │  │  BACnet    │  │    Modbus    │  │   Siemens    │  │          │
│  │  │  Gateway   │  │    Gateway   │  │   Thermostat │  │          │
│  │  └────────────┘  └──────────────┘  └──────────────┘  │          │
│  └────────────────────────────────────────────────────────          │
└───────────────────────────────────────┬───────────────────┘
                                        │
        ┌───────────────────────────────┼───────────────────┐
        │                               ▼                   │
   ┌────────┐                    ┌──────────┐         ┌─────────┐
   │ Trane  │                    │ Siemens  │         │ Sensors │
   │  HVAC  │                    │Thermostats│        │Network  │
   └────────┘                    └──────────┘         └─────────┘
```

### 1.2 System Components

**Presentation Layer:**
- React 18 frontend with Vite build system
- TailwindCSS for responsive UI
- Recharts for real-time energy visualization
- Progressive Web App (PWA) capabilities

**Application Layer:**
- Node.js/Express REST API server
- WebSocket server for real-time data streaming
- Authentication/Authorization service
- Business logic services

**Data Layer:**
- PostgreSQL with TimescaleDB for time-series data
- Redis for caching and session management
- MQTT broker for IoT message queuing

**Integration Layer:**
- BACnet protocol handler (Trane HVAC)
- Modbus TCP/RTU protocol handler
- Siemens thermostat API integration
- MQTT message routing

**Intelligence Layer:**
- TensorFlow.js ML models for predictive optimization
- Rule engine for automated control
- Anomaly detection algorithms
- Energy optimization algorithms

---

## 2. Component Architecture

### 2.1 Frontend Architecture

```
src/
├── components/
│   ├── dashboard/
│   │   ├── EnergyOverview.jsx
│   │   ├── ZoneControl.jsx
│   │   ├── AlertPanel.jsx
│   │   └── RealTimeMetrics.jsx
│   ├── analytics/
│   │   ├── EnergyChart.jsx
│   │   ├── PredictionPanel.jsx
│   │   └── SavingsCalculator.jsx
│   ├── control/
│   │   ├── HVACControl.jsx
│   │   ├── ThermostatControl.jsx
│   │   └── ScheduleManager.jsx
│   └── common/
│       ├── Layout.jsx
│       ├── Navigation.jsx
│       └── ErrorBoundary.jsx
├── services/
│   ├── api.service.js
│   ├── websocket.service.js
│   └── auth.service.js
├── stores/
│   ├── energyStore.js
│   ├── hvacStore.js
│   └── userStore.js
├── hooks/
│   ├── useRealTimeData.js
│   ├── useWebSocket.js
│   └── useAuth.js
└── utils/
    ├── calculations.js
    └── formatters.js
```

**Key Frontend Components:**

1. **Dashboard Components:**
   - Real-time energy consumption widgets
   - Zone temperature visualization
   - Alert and notification center
   - Equipment status indicators

2. **Control Components:**
   - Zone-based temperature setpoint controls
   - HVAC mode selection
   - Schedule configuration interface
   - Manual override controls

3. **Analytics Components:**
   - Historical energy usage charts
   - Predictive analytics visualization
   - Savings calculation dashboard
   - Comparative analysis tools

### 2.2 Backend Architecture

```
backend/
├── src/
│   ├── api/
│   │   ├── routes/
│   │   │   ├── auth.routes.js
│   │   │   ├── hvac.routes.js
│   │   │   ├── zones.routes.js
│   │   │   ├── analytics.routes.js
│   │   │   ├── schedules.routes.js
│   │   │   └── alerts.routes.js
│   │   ├── controllers/
│   │   │   ├── hvac.controller.js
│   │   │   ├── zones.controller.js
│   │   │   ├── analytics.controller.js
│   │   │   └── alerts.controller.js
│   │   └── middlewares/
│   │       ├── auth.middleware.js
│   │       ├── validation.middleware.js
│   │       ├── rateLimit.middleware.js
│   │       └── error.middleware.js
│   ├── services/
│   │   ├── integration/
│   │   │   ├── bacnet.service.js
│   │   │   ├── modbus.service.js
│   │   │   └── siemens.service.js
│   │   ├── ml/
│   │   │   ├── prediction.service.js
│   │   │   ├── optimization.service.js
│   │   │   └── anomaly.service.js
│   │   ├── data/
│   │   │   ├── timeseries.service.js
│   │   │   ├── aggregation.service.js
│   │   │   └── export.service.js
│   │   └── notification/
│   │       ├── alert.service.js
│   │       ├── email.service.js
│   │       └── push.service.js
│   ├── models/
│   │   ├── Building.js
│   │   ├── Zone.js
│   │   ├── HVACUnit.js
│   │   ├── Thermostat.js
│   │   ├── Sensor.js
│   │   ├── EnergyReading.js
│   │   ├── Schedule.js
│   │   ├── Alert.js
│   │   └── User.js
│   ├── websocket/
│   │   ├── server.js
│   │   ├── handlers/
│   │   │   ├── energy.handler.js
│   │   │   ├── control.handler.js
│   │   │   └── alert.handler.js
│   │   └── middleware/
│   │       └── auth.middleware.js
│   ├── mqtt/
│   │   ├── client.js
│   │   ├── topics.js
│   │   └── handlers/
│   │       ├── sensor.handler.js
│   │       ├── hvac.handler.js
│   │       └── thermostat.handler.js
│   ├── workers/
│   │   ├── data-collection.worker.js
│   │   ├── ml-prediction.worker.js
│   │   ├── optimization.worker.js
│   │   └── aggregation.worker.js
│   ├── config/
│   │   ├── database.js
│   │   ├── mqtt.js
│   │   ├── redis.js
│   │   └── security.js
│   └── utils/
│       ├── logger.js
│       ├── validator.js
│       └── calculations.js
├── tests/
└── package.json
```

### 2.3 Key Service Descriptions

**Integration Services:**

1. **BACnet Service:**
   - Communicates with Trane HVAC systems
   - Reads temperature, pressure, flow rates
   - Sends control commands
   - Handles BACnet device discovery
   - Manages point mapping

2. **Modbus Service:**
   - TCP and RTU protocol support
   - Register mapping for HVAC parameters
   - Polling strategy for data collection
   - Error handling and retry logic

3. **Siemens Thermostat Service:**
   - API integration for thermostat control
   - Real-time temperature monitoring
   - Setpoint management
   - Schedule synchronization

**ML Services:**

1. **Prediction Service:**
   - Load forecasting (next 1-24 hours)
   - Temperature prediction
   - Occupancy prediction
   - Model training and retraining

2. **Optimization Service:**
   - Cooling optimization algorithms
   - Pre-cooling strategies
   - Load shifting recommendations
   - Energy cost minimization

3. **Anomaly Detection Service:**
   - Equipment failure prediction
   - Performance degradation detection
   - Unusual consumption patterns
   - Alert generation

---

## 3. Data Flow Architecture

### 3.1 Real-Time Data Collection Flow

```
┌─────────────┐
│   Sensors   │
│  (BACnet/   │
│   Modbus)   │
└──────┬──────┘
       │ Poll every 30s
       ▼
┌──────────────────┐
│  Integration     │
│   Gateway        │◄────── Configuration
│  (Node.js)       │        from DB
└──────┬───────────┘
       │ Publish
       ▼
┌──────────────────┐
│  MQTT Broker     │
│  (Mosquitto)     │
└──────┬───────────┘
       │ Subscribe
       ▼
┌──────────────────┐
│  Data Collection │
│     Worker       │
└──────┬───────────┘
       │
       ├──────────────────┐
       │                  │
       ▼                  ▼
┌──────────────┐   ┌──────────────┐
│ TimescaleDB  │   │    Redis     │
│ (Persistent) │   │   (Cache)    │
└──────┬───────┘   └──────┬───────┘
       │                  │
       └────────┬─────────┘
                ▼
       ┌────────────────┐
       │   WebSocket    │
       │    Server      │
       └────────┬───────┘
                │
                ▼
       ┌────────────────┐
       │   Frontend     │
       │  (Real-time    │
       │   Dashboard)   │
       └────────────────┘
```

### 3.2 Control Command Flow

```
┌─────────────┐
│   User      │
│  Interface  │
└──────┬──────┘
       │ HTTP POST/WebSocket
       ▼
┌──────────────────┐
│  API Gateway     │
│  + Auth Check    │
└──────┬───────────┘
       │
       ▼
┌──────────────────┐
│  Validation      │
│  + Business      │
│    Rules         │
└──────┬───────────┘
       │
       ├─────────────────┐
       │                 │
       ▼                 ▼
┌──────────────┐   ┌──────────────┐
│   Command    │   │   Audit      │
│   Queue      │   │     Log      │
└──────┬───────┘   └──────────────┘
       │
       ▼
┌──────────────────┐
│  Protocol        │
│  Translator      │
│  (BACnet/Modbus) │
└──────┬───────────┘
       │
       ▼
┌──────────────────┐
│  HVAC/Thermostat │
│     Device       │
└──────┬───────────┘
       │ Status feedback
       ▼
┌──────────────────┐
│  Status Update   │
│  to Frontend     │
└──────────────────┘
```

### 3.3 ML Prediction Flow

```
┌──────────────────┐
│  Scheduled Job   │
│  (Every 15 min)  │
└──────┬───────────┘
       │
       ▼
┌──────────────────┐
│  Fetch Recent    │
│  Data (Last 48h) │
└──────┬───────────┘
       │
       ▼
┌──────────────────┐
│  Feature         │
│  Engineering     │
└──────┬───────────┘
       │
       ▼
┌──────────────────┐
│  TensorFlow.js   │
│  Model Inference │
└──────┬───────────┘
       │
       ├──────────────────┬──────────────────┐
       │                  │                  │
       ▼                  ▼                  ▼
┌──────────────┐   ┌──────────────┐  ┌──────────────┐
│ Store        │   │ Optimization │  │   Alert      │
│ Predictions  │   │  Decisions   │  │  Generation  │
└──────────────┘   └──────┬───────┘  └──────────────┘
                          │
                          ▼
                   ┌──────────────┐
                   │  Auto-adjust │
                   │  HVAC if     │
                   │  enabled     │
                   └──────────────┘
```

### 3.4 Event-Driven Architecture

**MQTT Topic Structure:**
```
sbems/
├── building/{building_id}/
│   ├── zone/{zone_id}/
│   │   ├── temperature
│   │   ├── humidity
│   │   ├── occupancy
│   │   └── setpoint
│   ├── hvac/{unit_id}/
│   │   ├── status
│   │   ├── power
│   │   ├── mode
│   │   └── fault
│   └── thermostat/{device_id}/
│       ├── current_temp
│       ├── target_temp
│       └── mode
├── commands/
│   ├── hvac/{unit_id}/control
│   └── thermostat/{device_id}/control
└── alerts/
    ├── critical
    ├── warning
    └── info
```

---

## 4. Database Schema Design

### 4.1 Core Entity Models

```sql
-- Buildings table
CREATE TABLE buildings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    address TEXT,
    total_area DECIMAL(10,2),
    floors INTEGER,
    timezone VARCHAR(50),
    metadata JSONB,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Zones table
CREATE TABLE zones (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    building_id UUID REFERENCES buildings(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    floor INTEGER,
    area DECIMAL(10,2),
    zone_type VARCHAR(50), -- office, conference, lobby, etc.
    target_temp_min DECIMAL(4,2),
    target_temp_max DECIMAL(4,2),
    occupancy_capacity INTEGER,
    metadata JSONB,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_zones_building ON zones(building_id);

-- HVAC Units table
CREATE TABLE hvac_units (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    building_id UUID REFERENCES buildings(id) ON DELETE CASCADE,
    zone_id UUID REFERENCES zones(id) ON DELETE SET NULL,
    name VARCHAR(255) NOT NULL,
    manufacturer VARCHAR(100), -- Trane
    model VARCHAR(100),
    serial_number VARCHAR(100),
    capacity_kw DECIMAL(10,2),
    protocol VARCHAR(20), -- bacnet, modbus
    connection_config JSONB, -- IP, device ID, registers, etc.
    status VARCHAR(50) DEFAULT 'active',
    installed_date DATE,
    last_maintenance DATE,
    metadata JSONB,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_hvac_building ON hvac_units(building_id);
CREATE INDEX idx_hvac_zone ON hvac_units(zone_id);

-- Thermostats table
CREATE TABLE thermostats (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    zone_id UUID REFERENCES zones(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    manufacturer VARCHAR(100), -- Siemens
    model VARCHAR(100),
    device_id VARCHAR(100) UNIQUE,
    api_config JSONB, -- API credentials, endpoint
    current_temp DECIMAL(4,2),
    target_temp DECIMAL(4,2),
    mode VARCHAR(50), -- cool, heat, auto, off
    status VARCHAR(50) DEFAULT 'online',
    metadata JSONB,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_thermostats_zone ON thermostats(zone_id);

-- Sensors table
CREATE TABLE sensors (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    zone_id UUID REFERENCES zones(id) ON DELETE CASCADE,
    sensor_type VARCHAR(50), -- temperature, humidity, occupancy, co2
    name VARCHAR(255) NOT NULL,
    device_id VARCHAR(100) UNIQUE,
    protocol VARCHAR(20),
    connection_config JSONB,
    unit VARCHAR(20), -- celsius, percent, ppm
    status VARCHAR(50) DEFAULT 'active',
    calibration_offset DECIMAL(6,2),
    metadata JSONB,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_sensors_zone ON sensors(zone_id);
CREATE INDEX idx_sensors_type ON sensors(sensor_type);
```

### 4.2 Time-Series Data (TimescaleDB Hypertables)

```sql
-- Energy readings (hypertable)
CREATE TABLE energy_readings (
    time TIMESTAMPTZ NOT NULL,
    building_id UUID REFERENCES buildings(id),
    zone_id UUID REFERENCES zones(id),
    hvac_unit_id UUID REFERENCES hvac_units(id),
    power_consumption DECIMAL(10,4), -- kW
    energy_total DECIMAL(10,4), -- kWh cumulative
    efficiency_ratio DECIMAL(5,2),
    runtime_hours DECIMAL(10,2),
    metadata JSONB
);

SELECT create_hypertable('energy_readings', 'time');

CREATE INDEX idx_energy_building_time ON energy_readings (building_id, time DESC);
CREATE INDEX idx_energy_zone_time ON energy_readings (zone_id, time DESC);
CREATE INDEX idx_energy_hvac_time ON energy_readings (hvac_unit_id, time DESC);

-- Automatic aggregation for hourly data
CREATE MATERIALIZED VIEW energy_readings_hourly
WITH (timescaledb.continuous) AS
SELECT
    time_bucket('1 hour', time) AS bucket,
    building_id,
    zone_id,
    hvac_unit_id,
    AVG(power_consumption) as avg_power,
    MAX(power_consumption) as peak_power,
    SUM(energy_total) as total_energy,
    AVG(efficiency_ratio) as avg_efficiency
FROM energy_readings
GROUP BY bucket, building_id, zone_id, hvac_unit_id;

-- Automatic aggregation for daily data
CREATE MATERIALIZED VIEW energy_readings_daily
WITH (timescaledb.continuous) AS
SELECT
    time_bucket('1 day', time) AS bucket,
    building_id,
    zone_id,
    SUM(energy_total) as total_energy,
    AVG(power_consumption) as avg_power,
    MAX(power_consumption) as peak_power
FROM energy_readings
GROUP BY bucket, building_id, zone_id;

-- Sensor readings (hypertable)
CREATE TABLE sensor_readings (
    time TIMESTAMPTZ NOT NULL,
    sensor_id UUID REFERENCES sensors(id),
    zone_id UUID REFERENCES zones(id),
    value DECIMAL(10,4),
    unit VARCHAR(20),
    quality INTEGER -- data quality score 0-100
);

SELECT create_hypertable('sensor_readings', 'time');

CREATE INDEX idx_sensor_readings_sensor_time ON sensor_readings (sensor_id, time DESC);
CREATE INDEX idx_sensor_readings_zone_time ON sensor_readings (zone_id, time DESC);

-- HVAC telemetry (hypertable)
CREATE TABLE hvac_telemetry (
    time TIMESTAMPTZ NOT NULL,
    hvac_unit_id UUID REFERENCES hvac_units(id),
    supply_temp DECIMAL(5,2),
    return_temp DECIMAL(5,2),
    flow_rate DECIMAL(10,2),
    pressure DECIMAL(10,2),
    compressor_speed DECIMAL(5,2), -- percentage
    fan_speed DECIMAL(5,2), -- percentage
    mode VARCHAR(50),
    status VARCHAR(50),
    fault_codes JSONB,
    metadata JSONB
);

SELECT create_hypertable('hvac_telemetry', 'time');

CREATE INDEX idx_hvac_telemetry_unit_time ON hvac_telemetry (hvac_unit_id, time DESC);

-- Data retention policies
SELECT add_retention_policy('energy_readings', INTERVAL '2 years');
SELECT add_retention_policy('sensor_readings', INTERVAL '1 year');
SELECT add_retention_policy('hvac_telemetry', INTERVAL '1 year');
```

### 4.3 Operational Tables

```sql
-- Schedules table
CREATE TABLE schedules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    zone_id UUID REFERENCES zones(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    schedule_type VARCHAR(50), -- daily, weekly, custom
    days_of_week INTEGER[], -- 0=Sunday, 6=Saturday
    start_time TIME,
    end_time TIME,
    target_temp DECIMAL(4,2),
    mode VARCHAR(50), -- cool, heat, auto, eco
    enabled BOOLEAN DEFAULT true,
    priority INTEGER DEFAULT 0,
    effective_from DATE,
    effective_to DATE,
    metadata JSONB,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_schedules_zone ON schedules(zone_id);
CREATE INDEX idx_schedules_enabled ON schedules(enabled);

-- Alerts table
CREATE TABLE alerts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    building_id UUID REFERENCES buildings(id),
    zone_id UUID REFERENCES zones(id),
    hvac_unit_id UUID REFERENCES hvac_units(id),
    alert_type VARCHAR(50), -- anomaly, fault, threshold, maintenance
    severity VARCHAR(20), -- critical, warning, info
    title VARCHAR(255) NOT NULL,
    description TEXT,
    metric_name VARCHAR(100),
    threshold_value DECIMAL(10,4),
    actual_value DECIMAL(10,4),
    acknowledged BOOLEAN DEFAULT false,
    acknowledged_by UUID REFERENCES users(id),
    acknowledged_at TIMESTAMP,
    resolved BOOLEAN DEFAULT false,
    resolved_at TIMESTAMP,
    metadata JSONB,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_alerts_building ON alerts(building_id);
CREATE INDEX idx_alerts_severity ON alerts(severity);
CREATE INDEX idx_alerts_resolved ON alerts(resolved);
CREATE INDEX idx_alerts_created ON alerts(created_at DESC);

-- ML Predictions table
CREATE TABLE ml_predictions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    building_id UUID REFERENCES buildings(id),
    zone_id UUID REFERENCES zones(id),
    prediction_type VARCHAR(50), -- load, temperature, occupancy, savings
    model_version VARCHAR(50),
    prediction_time TIMESTAMPTZ NOT NULL,
    horizon_minutes INTEGER, -- forecast horizon
    predicted_value DECIMAL(10,4),
    confidence DECIMAL(5,2), -- 0-100
    actual_value DECIMAL(10,4), -- filled in later for accuracy tracking
    metadata JSONB,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_predictions_building_time ON ml_predictions(building_id, prediction_time DESC);
CREATE INDEX idx_predictions_type ON ml_predictions(prediction_type);

-- Control commands log
CREATE TABLE control_commands (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id),
    hvac_unit_id UUID REFERENCES hvac_units(id),
    thermostat_id UUID REFERENCES thermostats(id),
    command_type VARCHAR(50), -- setpoint, mode, on_off, schedule
    command_data JSONB,
    source VARCHAR(50), -- manual, automated, schedule, ml
    status VARCHAR(50), -- pending, sent, confirmed, failed
    sent_at TIMESTAMP,
    confirmed_at TIMESTAMP,
    error_message TEXT,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_commands_hvac ON control_commands(hvac_unit_id);
CREATE INDEX idx_commands_user ON control_commands(user_id);
CREATE INDEX idx_commands_created ON control_commands(created_at DESC);

-- Users and permissions
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255),
    first_name VARCHAR(100),
    last_name VARCHAR(100),
    role VARCHAR(50), -- admin, facility_manager, operator, viewer
    phone VARCHAR(20),
    avatar_url TEXT,
    email_verified BOOLEAN DEFAULT false,
    active BOOLEAN DEFAULT true,
    last_login TIMESTAMP,
    metadata JSONB,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);

-- User building access
CREATE TABLE user_building_access (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    building_id UUID REFERENCES buildings(id) ON DELETE CASCADE,
    access_level VARCHAR(50), -- full, readonly, control
    granted_at TIMESTAMP DEFAULT NOW(),
    granted_by UUID REFERENCES users(id),
    UNIQUE(user_id, building_id)
);

CREATE INDEX idx_user_access_user ON user_building_access(user_id);
CREATE INDEX idx_user_access_building ON user_building_access(building_id);

-- Energy savings calculations
CREATE TABLE energy_savings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    building_id UUID REFERENCES buildings(id),
    period_start TIMESTAMPTZ NOT NULL,
    period_end TIMESTAMPTZ NOT NULL,
    baseline_consumption DECIMAL(10,4), -- kWh
    actual_consumption DECIMAL(10,4), -- kWh
    savings_kwh DECIMAL(10,4),
    savings_percent DECIMAL(5,2),
    cost_savings DECIMAL(10,2), -- currency
    co2_reduction DECIMAL(10,2), -- kg
    calculation_method VARCHAR(100),
    metadata JSONB,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_savings_building ON energy_savings(building_id);
CREATE INDEX idx_savings_period ON energy_savings(period_start DESC);
```

### 4.4 Database Optimization Strategy

**Indexing Strategy:**
- B-tree indexes on foreign keys
- Partial indexes for frequently filtered columns (status='active')
- Composite indexes for common query patterns
- TimescaleDB automatic time-based partitioning

**Partitioning:**
- Automatic time-based partitioning via TimescaleDB hypertables
- 7-day chunks for high-frequency data
- 30-day chunks for aggregated data

**Retention Policies:**
- Raw sensor data: 1 year
- Hourly aggregates: 3 years
- Daily aggregates: 10 years
- Audit logs: 7 years

**Compression:**
- Enable TimescaleDB compression on older chunks (>7 days)
- Compress sensor_readings after 30 days
- 80-90% storage reduction expected

---

## 5. API Design

### 5.1 RESTful API Endpoints

**Base URL:** `https://api.sbems.com/v1`

#### Authentication Endpoints

```
POST   /auth/register           - Register new user
POST   /auth/login              - User login (returns JWT)
POST   /auth/logout             - User logout
POST   /auth/refresh            - Refresh access token
POST   /auth/forgot-password    - Request password reset
POST   /auth/reset-password     - Reset password with token
GET    /auth/verify-email/:token - Verify email address
```

#### Buildings Endpoints

```
GET    /buildings                    - List all accessible buildings
POST   /buildings                    - Create new building (admin)
GET    /buildings/:id                - Get building details
PATCH  /buildings/:id                - Update building
DELETE /buildings/:id                - Delete building (admin)
GET    /buildings/:id/overview       - Building overview with current stats
GET    /buildings/:id/energy-summary - Energy consumption summary
```

#### Zones Endpoints

```
GET    /buildings/:buildingId/zones           - List zones in building
POST   /buildings/:buildingId/zones           - Create new zone
GET    /zones/:id                             - Get zone details
PATCH  /zones/:id                             - Update zone
DELETE /zones/:id                             - Delete zone
GET    /zones/:id/current-status              - Current temperature, occupancy
GET    /zones/:id/energy                      - Zone energy consumption
POST   /zones/:id/setpoint                    - Set target temperature
```

#### HVAC Units Endpoints

```
GET    /buildings/:buildingId/hvac-units      - List HVAC units
POST   /buildings/:buildingId/hvac-units      - Register new HVAC unit
GET    /hvac-units/:id                        - Get HVAC unit details
PATCH  /hvac-units/:id                        - Update HVAC unit config
DELETE /hvac-units/:id                        - Remove HVAC unit
GET    /hvac-units/:id/status                 - Current operational status
GET    /hvac-units/:id/telemetry              - Recent telemetry data
POST   /hvac-units/:id/control                - Send control command
GET    /hvac-units/:id/performance            - Performance metrics
```

#### Thermostats Endpoints

```
GET    /zones/:zoneId/thermostats             - List thermostats in zone
POST   /zones/:zoneId/thermostats             - Add thermostat
GET    /thermostats/:id                       - Get thermostat details
PATCH  /thermostats/:id                       - Update thermostat
DELETE /thermostats/:id                       - Remove thermostat
GET    /thermostats/:id/status                - Current status
POST   /thermostats/:id/setpoint              - Set temperature
POST   /thermostats/:id/mode                  - Change mode (cool/heat/auto)
```

#### Sensors Endpoints

```
GET    /zones/:zoneId/sensors                 - List sensors in zone
POST   /zones/:zoneId/sensors                 - Add sensor
GET    /sensors/:id                           - Get sensor details
PATCH  /sensors/:id                           - Update sensor config
DELETE /sensors/:id                           - Remove sensor
GET    /sensors/:id/readings                  - Recent readings
```

#### Analytics Endpoints

```
GET    /analytics/energy-consumption          - Energy consumption data
       Query params: buildingId, zoneId, startDate, endDate, granularity

GET    /analytics/temperature-history         - Historical temperature data
       Query params: zoneId, startDate, endDate, interval

GET    /analytics/savings                     - Calculated energy savings
       Query params: buildingId, period

GET    /analytics/performance                 - Equipment performance metrics
       Query params: hvacUnitId, startDate, endDate

GET    /analytics/occupancy                   - Occupancy patterns
       Query params: zoneId, startDate, endDate

GET    /analytics/cost                        - Energy cost analysis
       Query params: buildingId, period

GET    /analytics/comparison                  - Comparative analysis
       Query params: buildingIds[], metric, period

GET    /analytics/export                      - Export data (CSV/Excel)
       Query params: type, buildingId, startDate, endDate, format
```

#### Predictions Endpoints

```
GET    /predictions/load-forecast             - Predicted energy load
       Query params: buildingId, horizon (hours)

GET    /predictions/temperature               - Temperature predictions
       Query params: zoneId, horizon

GET    /predictions/occupancy                 - Occupancy predictions
       Query params: zoneId, date

GET    /predictions/optimization              - Optimization recommendations
       Query params: buildingId
```

#### Schedules Endpoints

```
GET    /zones/:zoneId/schedules               - List schedules
POST   /zones/:zoneId/schedules               - Create schedule
GET    /schedules/:id                         - Get schedule details
PATCH  /schedules/:id                         - Update schedule
DELETE /schedules/:id                         - Delete schedule
POST   /schedules/:id/enable                  - Enable schedule
POST   /schedules/:id/disable                 - Disable schedule
```

#### Alerts Endpoints

```
GET    /alerts                                - List alerts
       Query params: buildingId, severity, resolved, limit, offset

GET    /alerts/:id                            - Get alert details
POST   /alerts/:id/acknowledge                - Acknowledge alert
POST   /alerts/:id/resolve                    - Resolve alert
GET    /alerts/summary                        - Alert summary statistics
POST   /alerts/rules                          - Create alert rule
GET    /alerts/rules                          - List alert rules
PATCH  /alerts/rules/:id                      - Update alert rule
DELETE /alerts/rules/:id                      - Delete alert rule
```

#### Users & Access Endpoints

```
GET    /users                                 - List users (admin)
POST   /users                                 - Create user (admin)
GET    /users/:id                             - Get user details
PATCH  /users/:id                             - Update user
DELETE /users/:id                             - Delete user (admin)
GET    /users/me                              - Get current user profile
PATCH  /users/me                              - Update own profile
GET    /users/:id/access                      - Get user building access
POST   /users/:id/access                      - Grant building access (admin)
DELETE /users/:id/access/:buildingId          - Revoke building access (admin)
```

#### Control Endpoints

```
POST   /control/hvac/:id/mode                 - Set HVAC mode
POST   /control/hvac/:id/fan                  - Set fan speed
POST   /control/hvac/:id/power                - Turn on/off
POST   /control/thermostat/:id/temperature    - Set temperature
POST   /control/zone/:id/temperature          - Set zone temperature
POST   /control/zone/:id/mode                 - Set zone mode
POST   /control/override                      - Manual override
GET    /control/history                       - Control command history
```

### 5.2 WebSocket API

**Connection:** `wss://api.sbems.com/ws`

**Authentication:**
```javascript
// Connect with JWT token
const ws = new WebSocket('wss://api.sbems.com/ws?token=<jwt_token>');
```

**Message Format:**
```javascript
{
  "type": "subscribe|unsubscribe|message",
  "channel": "energy|temperature|alerts|status",
  "payload": { /* channel-specific data */ }
}
```

**Channels:**

1. **Energy Channel:**
```javascript
// Subscribe
{
  "type": "subscribe",
  "channel": "energy",
  "payload": { "buildingId": "uuid", "zoneId": "uuid" }
}

// Received messages
{
  "type": "message",
  "channel": "energy",
  "payload": {
    "buildingId": "uuid",
    "zoneId": "uuid",
    "timestamp": "2025-11-22T10:30:00Z",
    "powerConsumption": 45.6,
    "energyTotal": 123.4,
    "efficiency": 92.5
  }
}
```

2. **Temperature Channel:**
```javascript
// Subscribe
{
  "type": "subscribe",
  "channel": "temperature",
  "payload": { "zoneId": "uuid" }
}

// Received messages
{
  "type": "message",
  "channel": "temperature",
  "payload": {
    "zoneId": "uuid",
    "timestamp": "2025-11-22T10:30:00Z",
    "currentTemp": 22.5,
    "targetTemp": 23.0,
    "humidity": 45.2
  }
}
```

3. **Alerts Channel:**
```javascript
// Subscribe to building alerts
{
  "type": "subscribe",
  "channel": "alerts",
  "payload": { "buildingId": "uuid" }
}

// Received messages
{
  "type": "message",
  "channel": "alerts",
  "payload": {
    "id": "uuid",
    "buildingId": "uuid",
    "severity": "critical",
    "title": "HVAC Unit Fault Detected",
    "description": "Compressor pressure exceeds threshold",
    "timestamp": "2025-11-22T10:30:00Z"
  }
}
```

4. **Status Channel:**
```javascript
// Subscribe to equipment status
{
  "type": "subscribe",
  "channel": "status",
  "payload": { "hvacUnitId": "uuid" }
}

// Received messages
{
  "type": "message",
  "channel": "status",
  "payload": {
    "hvacUnitId": "uuid",
    "status": "running",
    "mode": "cooling",
    "compressorSpeed": 75.0,
    "fanSpeed": 60.0,
    "timestamp": "2025-11-22T10:30:00Z"
  }
}
```

### 5.3 API Response Format

**Success Response:**
```javascript
{
  "success": true,
  "data": { /* response data */ },
  "metadata": {
    "timestamp": "2025-11-22T10:30:00Z",
    "requestId": "req_123456"
  }
}
```

**Error Response:**
```javascript
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid temperature setpoint",
    "details": [
      {
        "field": "targetTemp",
        "message": "Must be between 18 and 26 degrees"
      }
    ]
  },
  "metadata": {
    "timestamp": "2025-11-22T10:30:00Z",
    "requestId": "req_123456"
  }
}
```

**Pagination Response:**
```javascript
{
  "success": true,
  "data": [ /* array of items */ ],
  "pagination": {
    "total": 150,
    "page": 1,
    "pageSize": 20,
    "totalPages": 8,
    "hasNext": true,
    "hasPrev": false
  }
}
```

### 5.4 API Security

**Authentication:**
- JWT-based authentication
- Access token: 15 minutes expiry
- Refresh token: 7 days expiry
- Token rotation on refresh

**Rate Limiting:**
- 100 requests per minute per user
- 1000 requests per hour per user
- 10,000 requests per day per user
- WebSocket: 100 messages per minute

**Request Validation:**
- JSON schema validation for all payloads
- Input sanitization
- SQL injection prevention
- XSS protection

---

## 6. Integration Architecture

### 6.1 BACnet Integration (Trane HVAC)

**Technology Stack:**
- Node.js library: `node-bacnet` or `bacstack`
- Protocol: BACnet/IP
- Port: UDP 47808

**Architecture:**

```javascript
// BACnet Service Structure
class BACnetService {
  constructor() {
    this.client = new BACnet({ /* config */ });
    this.devices = new Map(); // Discovered devices
    this.pointMappings = new Map(); // BACnet points to our data model
  }

  // Device discovery
  async discoverDevices() {
    // WHO-IS broadcast
    // Build device database
  }

  // Read operations
  async readProperty(deviceId, objectType, objectInstance, propertyId) {
    // Read single property
  }

  async readMultiple(deviceId, readList) {
    // Read multiple properties efficiently
  }

  // Write operations
  async writeProperty(deviceId, objectType, objectInstance, propertyId, value) {
    // Write property with priority
  }

  // Subscription to COV (Change of Value)
  async subscribeCOV(deviceId, objectType, objectInstance) {
    // Subscribe to property changes
  }
}
```

**BACnet Point Mapping:**

```javascript
const BACNET_POINT_MAPPINGS = {
  // Analog Inputs (sensors)
  'AI:0': { type: 'temperature', unit: 'celsius', location: 'supply' },
  'AI:1': { type: 'temperature', unit: 'celsius', location: 'return' },
  'AI:2': { type: 'pressure', unit: 'psi', location: 'discharge' },
  'AI:3': { type: 'flow', unit: 'cfm', location: 'supply' },

  // Analog Values (setpoints)
  'AV:0': { type: 'setpoint', unit: 'celsius', control: 'temperature' },
  'AV:1': { type: 'setpoint', unit: 'percent', control: 'fan_speed' },

  // Binary Inputs (status)
  'BI:0': { type: 'status', value: 'run_status' },
  'BI:1': { type: 'alarm', value: 'fault_status' },

  // Binary Values (control)
  'BV:0': { type: 'control', value: 'enable_disable' },
  'BV:1': { type: 'control', value: 'mode_select' },

  // Multi-State Values
  'MSV:0': { type: 'mode', values: ['off', 'cool', 'heat', 'auto'] }
};
```

**Data Collection Strategy:**

```javascript
// Polling configuration
const POLLING_CONFIG = {
  // High-priority points (every 30 seconds)
  high: {
    interval: 30000,
    points: [
      'temperature_supply',
      'temperature_return',
      'run_status',
      'fault_status'
    ]
  },

  // Medium-priority points (every 2 minutes)
  medium: {
    interval: 120000,
    points: [
      'pressure_discharge',
      'flow_rate',
      'power_consumption'
    ]
  },

  // Low-priority points (every 5 minutes)
  low: {
    interval: 300000,
    points: [
      'total_runtime',
      'maintenance_counters',
      'firmware_version'
    ]
  }
};

// Efficient polling implementation
class BACnetPoller {
  async poll() {
    // Group reads by device for efficiency
    const readRequests = this.buildReadMultipleRequest();
    const results = await this.bacnetService.readMultiple(readRequests);

    // Publish to MQTT
    results.forEach(reading => {
      this.mqttClient.publish(
        `sbems/building/${buildingId}/hvac/${unitId}/telemetry`,
        JSON.stringify(reading)
      );
    });
  }
}
```

### 6.2 Modbus Integration

**Technology Stack:**
- Node.js library: `modbus-serial` or `node-modbus`
- Protocols: Modbus TCP and Modbus RTU
- Ports: TCP 502, Serial RS-485

**Architecture:**

```javascript
class ModbusService {
  constructor() {
    this.tcpClients = new Map(); // IP-based devices
    this.rtuPorts = new Map(); // Serial connections
    this.registerMappings = new Map();
  }

  // TCP connection
  async connectTCP(host, port, unitId) {
    const client = new ModbusTCP({ host, port, unitId });
    await client.connect();
    this.tcpClients.set(unitId, client);
  }

  // Read holding registers
  async readHoldingRegisters(unitId, address, length) {
    const client = this.tcpClients.get(unitId);
    return await client.readHoldingRegisters(address, length);
  }

  // Write single register
  async writeSingleRegister(unitId, address, value) {
    const client = this.tcpClients.get(unitId);
    return await client.writeSingleRegister(address, value);
  }

  // Parse register data
  parseRegisters(registers, mapping) {
    // Convert raw register values to engineering units
    return {
      temperature: this.parseFloat(registers, 0, mapping.temperatureScale),
      pressure: this.parseFloat(registers, 2, mapping.pressureScale),
      status: this.parseUInt16(registers, 4)
    };
  }
}
```

**Modbus Register Mapping:**

```javascript
const MODBUS_REGISTER_MAP = {
  // Holding Registers (read/write)
  setpoint_temperature: { address: 1000, type: 'float32', scale: 0.1 },
  fan_speed_setpoint: { address: 1002, type: 'uint16', scale: 1 },
  mode_select: { address: 1004, type: 'uint16', values: { 0: 'off', 1: 'cool', 2: 'heat' } },

  // Input Registers (read-only)
  current_temperature: { address: 2000, type: 'float32', scale: 0.1 },
  return_temperature: { address: 2002, type: 'float32', scale: 0.1 },
  discharge_pressure: { address: 2004, type: 'float32', scale: 0.01 },
  power_consumption: { address: 2006, type: 'float32', scale: 0.1 },

  // Coils (binary read/write)
  enable: { address: 0, type: 'boolean' },
  reset_alarm: { address: 1, type: 'boolean' },

  // Discrete Inputs (binary read-only)
  run_status: { address: 100, type: 'boolean' },
  fault_status: { address: 101, type: 'boolean' },
  high_pressure_alarm: { address: 102, type: 'boolean' }
};
```

### 6.3 Siemens Thermostat Integration

**Technology Stack:**
- HTTP/HTTPS REST API
- Authentication: API key or OAuth2
- Response format: JSON

**Architecture:**

```javascript
class SiemensThermostatService {
  constructor(apiKey, baseUrl) {
    this.apiKey = apiKey;
    this.baseUrl = baseUrl;
    this.axios = axios.create({
      baseURL: baseUrl,
      headers: { 'Authorization': `Bearer ${apiKey}` }
    });
  }

  // Get current status
  async getStatus(deviceId) {
    const response = await this.axios.get(`/devices/${deviceId}/status`);
    return response.data;
  }

  // Set temperature
  async setTemperature(deviceId, temperature) {
    return await this.axios.post(`/devices/${deviceId}/setpoint`, {
      value: temperature,
      unit: 'celsius'
    });
  }

  // Set mode
  async setMode(deviceId, mode) {
    return await this.axios.post(`/devices/${deviceId}/mode`, {
      mode: mode // cool, heat, auto, off
    });
  }

  // Get schedule
  async getSchedule(deviceId) {
    const response = await this.axios.get(`/devices/${deviceId}/schedule`);
    return response.data;
  }

  // Update schedule
  async updateSchedule(deviceId, schedule) {
    return await this.axios.put(`/devices/${deviceId}/schedule`, schedule);
  }

  // Webhook for real-time updates
  setupWebhook(callbackUrl) {
    return this.axios.post('/webhooks', {
      url: callbackUrl,
      events: ['temperature_change', 'mode_change', 'schedule_trigger']
    });
  }
}
```

### 6.4 MQTT Message Broker Architecture

**Technology:** Eclipse Mosquitto or EMQX

**Topic Hierarchy:**
```
sbems/
├── building/{building_id}/
│   ├── zone/{zone_id}/
│   │   ├── temperature          (sensor → system)
│   │   ├── humidity             (sensor → system)
│   │   ├── occupancy            (sensor → system)
│   │   ├── setpoint             (system → sensor)
│   │   └── control              (system → actuator)
│   ├── hvac/{unit_id}/
│   │   ├── telemetry           (HVAC → system)
│   │   ├── status              (HVAC → system)
│   │   ├── command             (system → HVAC)
│   │   └── response            (HVAC → system)
│   └── thermostat/{device_id}/
│       ├── status              (thermostat → system)
│       ├── command             (system → thermostat)
│       └── schedule            (system → thermostat)
├── alerts/
│   ├── critical                (system → notification service)
│   ├── warning                 (system → notification service)
│   └── info                    (system → notification service)
└── system/
    ├── health                  (services → monitoring)
    └── metrics                 (services → monitoring)
```

**Message Format (JSON):**

```javascript
// Temperature reading
{
  "deviceId": "sensor_123",
  "zoneId": "zone_456",
  "timestamp": "2025-11-22T10:30:00Z",
  "value": 22.5,
  "unit": "celsius",
  "quality": 100
}

// Control command
{
  "commandId": "cmd_789",
  "deviceId": "hvac_abc",
  "timestamp": "2025-11-22T10:30:00Z",
  "action": "set_temperature",
  "parameters": {
    "value": 23.0,
    "priority": 8
  },
  "userId": "user_xyz"
}

// Status update
{
  "deviceId": "hvac_abc",
  "timestamp": "2025-11-22T10:30:00Z",
  "status": "running",
  "mode": "cooling",
  "metrics": {
    "supplyTemp": 15.5,
    "returnTemp": 24.2,
    "power": 45.6
  }
}
```

**QoS Levels:**
- QoS 0: Fire and forget (non-critical telemetry)
- QoS 1: At least once (important telemetry, alerts)
- QoS 2: Exactly once (control commands, critical data)

**Retained Messages:**
- Last known status of devices
- Current setpoints
- System configuration

### 6.5 Integration Data Flow

```
┌──────────────┐
│   Physical   │
│   Devices    │
└──────┬───────┘
       │
       ├──── BACnet ────┐
       ├──── Modbus ────┤
       └──── REST API ──┤
                        │
                   ┌────▼──────┐
                   │ Protocol  │
                   │ Adapters  │
                   └────┬──────┘
                        │
                   ┌────▼──────┐
                   │   MQTT    │
                   │  Broker   │
                   └────┬──────┘
                        │
        ┌───────────────┼───────────────┐
        │               │               │
   ┌────▼────┐    ┌────▼────┐    ┌────▼────┐
   │  Data   │    │   ML    │    │  Real-  │
   │ Storage │    │ Engine  │    │  time   │
   │ Worker  │    │ Worker  │    │  API    │
   └─────────┘    └─────────┘    └─────────┘
```

### 6.6 Error Handling & Retry Strategy

```javascript
class IntegrationErrorHandler {
  async executeWithRetry(operation, maxRetries = 3) {
    let lastError;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        return await operation();
      } catch (error) {
        lastError = error;

        // Log error
        logger.error(`Attempt ${attempt} failed:`, error);

        // Determine if retryable
        if (!this.isRetryable(error)) {
          throw error;
        }

        // Exponential backoff
        const delay = Math.min(1000 * Math.pow(2, attempt - 1), 30000);
        await this.sleep(delay);
      }
    }

    // All retries failed
    throw new IntegrationError('Max retries exceeded', lastError);
  }

  isRetryable(error) {
    // Network errors, timeouts, temporary failures
    return error.code === 'ETIMEDOUT' ||
           error.code === 'ECONNRESET' ||
           error.statusCode === 503 ||
           error.statusCode === 429;
  }
}
```

---

## 7. Security Architecture

### 7.1 Authentication & Authorization

**Authentication Strategy:**

```javascript
// JWT Token Structure
{
  "header": {
    "alg": "RS256",
    "typ": "JWT"
  },
  "payload": {
    "sub": "user_id",
    "email": "user@example.com",
    "role": "facility_manager",
    "buildings": ["building_id_1", "building_id_2"],
    "permissions": ["read:energy", "write:control", "read:analytics"],
    "iat": 1700000000,
    "exp": 1700000900 // 15 minutes
  }
}

// Refresh Token (stored in HTTP-only cookie)
{
  "sub": "user_id",
  "type": "refresh",
  "iat": 1700000000,
  "exp": 1700604800 // 7 days
}
```

**Role-Based Access Control (RBAC):**

```javascript
const ROLES = {
  ADMIN: {
    permissions: ['*'] // All permissions
  },
  FACILITY_MANAGER: {
    permissions: [
      'read:*',
      'write:control',
      'write:schedules',
      'write:alerts',
      'manage:zones'
    ]
  },
  OPERATOR: {
    permissions: [
      'read:*',
      'write:control',
      'read:schedules'
    ]
  },
  VIEWER: {
    permissions: [
      'read:energy',
      'read:analytics',
      'read:zones',
      'read:status'
    ]
  }
};

// Permission check middleware
const requirePermission = (permission) => {
  return async (req, res, next) => {
    const userPermissions = req.user.permissions;

    if (userPermissions.includes('*') ||
        userPermissions.includes(permission)) {
      return next();
    }

    return res.status(403).json({
      error: 'Insufficient permissions'
    });
  };
};
```

**Multi-Factor Authentication (MFA):**
- TOTP (Time-based One-Time Password)
- SMS backup option
- Recovery codes
- Required for admin users

### 7.2 API Security

**Request Security:**

```javascript
// Rate limiting
const rateLimitConfig = {
  windowMs: 60 * 1000, // 1 minute
  max: 100, // 100 requests per window
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    res.status(429).json({
      error: 'Too many requests, please try again later'
    });
  }
};

// Request validation
const validateRequest = (schema) => {
  return async (req, res, next) => {
    try {
      await schema.validateAsync(req.body);
      next();
    } catch (error) {
      res.status(400).json({
        error: 'Validation failed',
        details: error.details
      });
    }
  };
};

// Input sanitization
const sanitizeInput = (req, res, next) => {
  req.body = sanitize(req.body);
  req.query = sanitize(req.query);
  req.params = sanitize(req.params);
  next();
};
```

**CORS Configuration:**

```javascript
const corsOptions = {
  origin: (origin, callback) => {
    const allowedOrigins = [
      'https://app.sbems.com',
      'https://dashboard.sbems.com',
      process.env.FRONTEND_URL
    ];

    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  maxAge: 86400 // 24 hours
};
```

### 7.3 Data Security

**Encryption:**

**At Rest:**
- Database: PostgreSQL with pgcrypto extension
- Sensitive fields encrypted (API keys, credentials)
- AES-256-GCM encryption algorithm
- Key management via environment variables or KMS

**In Transit:**
- TLS 1.3 for all HTTP connections
- MQTTS (MQTT over TLS) for IoT communication
- WSS (WebSocket Secure) for real-time data
- Certificate pinning for mobile apps

**Database Security:**

```sql
-- Encrypt sensitive columns
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Encrypted API keys
CREATE TABLE integration_credentials (
    id UUID PRIMARY KEY,
    device_id UUID REFERENCES hvac_units(id),
    api_key BYTEA, -- encrypted
    api_secret BYTEA, -- encrypted
    created_at TIMESTAMP DEFAULT NOW()
);

-- Insert encrypted data
INSERT INTO integration_credentials (device_id, api_key)
VALUES (
    'device_uuid',
    pgp_sym_encrypt('api_key_value', 'encryption_key')
);

-- Query encrypted data
SELECT
    device_id,
    pgp_sym_decrypt(api_key, 'encryption_key') as api_key
FROM integration_credentials;

-- Row-level security
ALTER TABLE energy_readings ENABLE ROW LEVEL SECURITY;

CREATE POLICY user_building_access ON energy_readings
    FOR SELECT
    USING (
        building_id IN (
            SELECT building_id
            FROM user_building_access
            WHERE user_id = current_setting('app.user_id')::UUID
        )
    );
```

### 7.4 Network Security

**Firewall Rules:**
```
# Allow HTTPS
ALLOW 443/tcp from anywhere

# Allow HTTP (redirect to HTTPS)
ALLOW 80/tcp from anywhere

# Allow PostgreSQL (internal only)
ALLOW 5432/tcp from internal_network

# Allow Redis (internal only)
ALLOW 6379/tcp from internal_network

# Allow MQTT
ALLOW 1883/tcp from iot_devices (non-TLS)
ALLOW 8883/tcp from iot_devices (TLS)

# Allow BACnet
ALLOW 47808/udp from hvac_network

# Allow Modbus
ALLOW 502/tcp from hvac_network

# Deny all other incoming
DENY all
```

**VPN for HVAC Network:**
- Isolated VLAN for building automation
- VPN tunnel for remote device access
- Certificate-based authentication
- Network segmentation

### 7.5 Audit Logging

```javascript
class AuditLogger {
  async log(event) {
    const auditEntry = {
      id: uuid(),
      timestamp: new Date(),
      userId: event.userId,
      action: event.action, // create, read, update, delete, control
      resource: event.resource, // hvac_unit, zone, schedule
      resourceId: event.resourceId,
      changes: event.changes, // before/after values
      ipAddress: event.ipAddress,
      userAgent: event.userAgent,
      result: event.result, // success, failure
      errorMessage: event.errorMessage
    };

    await db.auditLog.insert(auditEntry);

    // Also log to external SIEM if critical
    if (event.severity === 'critical') {
      await this.sendToSIEM(auditEntry);
    }
  }
}

// Usage
await auditLogger.log({
  userId: req.user.id,
  action: 'control',
  resource: 'hvac_unit',
  resourceId: hvacUnitId,
  changes: {
    before: { mode: 'off' },
    after: { mode: 'cooling' }
  },
  ipAddress: req.ip,
  userAgent: req.headers['user-agent'],
  result: 'success'
});
```

**Retention Policy:**
- Audit logs: 7 years
- Access logs: 90 days
- Error logs: 1 year
- Compliance with industry regulations

### 7.6 Security Monitoring

**Intrusion Detection:**
- Monitor for unusual API access patterns
- Detect brute force attempts
- Alert on privilege escalation attempts
- Monitor for SQL injection attempts

**Security Alerts:**
```javascript
const SECURITY_EVENTS = {
  MULTIPLE_FAILED_LOGINS: {
    threshold: 5,
    window: '5 minutes',
    action: 'lock_account'
  },
  UNUSUAL_CONTROL_COMMANDS: {
    threshold: 10,
    window: '1 minute',
    action: 'alert_admin'
  },
  UNAUTHORIZED_ACCESS_ATTEMPT: {
    threshold: 3,
    window: '1 minute',
    action: 'block_ip'
  }
};
```

---

## 8. Scalability Strategy

### 8.1 Horizontal Scaling

**Stateless API Servers:**
```yaml
# Load balancer configuration
upstream api_servers {
    least_conn;
    server api1.sbems.internal:3000;
    server api2.sbems.internal:3000;
    server api3.sbems.internal:3000;

    # Health check
    check interval=3000 rise=2 fall=3 timeout=1000;
}

server {
    listen 443 ssl http2;
    server_name api.sbems.com;

    location / {
        proxy_pass http://api_servers;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

**WebSocket Server Scaling:**
- Redis pub/sub for message broadcasting
- Sticky sessions for WebSocket connections
- Horizontal Pod Autoscaling (HPA) in Kubernetes

```javascript
// Redis adapter for Socket.IO
const io = require('socket.io')(server);
const redisAdapter = require('@socket.io/redis-adapter');
const { createClient } = require('redis');

const pubClient = createClient({ host: 'redis.internal', port: 6379 });
const subClient = pubClient.duplicate();

io.adapter(redisAdapter(pubClient, subClient));
```

### 8.2 Database Scaling

**Read Replicas:**
```
┌──────────────┐
│   Primary    │
│  PostgreSQL  │◄──── Writes only
└──────┬───────┘
       │ Streaming replication
       │
       ├──────────────┬──────────────┐
       │              │              │
  ┌────▼────┐    ┌────▼────┐    ┌────▼────┐
  │ Replica │    │ Replica │    │ Replica │
  │   #1    │    │   #2    │    │   #3    │
  └─────────┘    └─────────┘    └─────────┘
       ▲              ▲              ▲
       └──────────────┴──────────────┘
              Reads distributed
```

**Connection Pooling:**
```javascript
const { Pool } = require('pg');

const pool = new Pool({
  host: process.env.DB_HOST,
  port: 5432,
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,

  // Pool configuration
  min: 10, // Minimum connections
  max: 100, // Maximum connections
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,

  // Read replica support
  application_name: 'sbems_api',

  // For reads, use replica
  replication: 'database'
});
```

**TimescaleDB Partitioning:**
```sql
-- Automatic time-based partitioning
SELECT create_hypertable(
    'energy_readings',
    'time',
    chunk_time_interval => INTERVAL '7 days'
);

-- Distributed hypertables for multi-node setup
SELECT create_distributed_hypertable(
    'energy_readings',
    'time',
    'building_id',
    number_partitions => 4
);
```

### 8.3 Caching Strategy

**Multi-Layer Caching:**

```
┌──────────────┐
│   Browser    │
│    Cache     │ (Service Worker, 5 minutes)
└──────┬───────┘
       │
┌──────▼───────┐
│     CDN      │ (CloudFlare, 1 hour)
└──────┬───────┘
       │
┌──────▼───────┐
│  Redis Cache │ (Application, 15 minutes)
└──────┬───────┘
       │
┌──────▼───────┐
│  PostgreSQL  │
│  + TimescaleDB│
└──────────────┘
```

**Redis Caching Implementation:**

```javascript
class CacheService {
  constructor(redisClient) {
    this.redis = redisClient;
  }

  async get(key, fetchFunction, ttl = 900) {
    // Try cache first
    const cached = await this.redis.get(key);
    if (cached) {
      return JSON.parse(cached);
    }

    // Cache miss, fetch from source
    const data = await fetchFunction();

    // Store in cache
    await this.redis.setex(key, ttl, JSON.stringify(data));

    return data;
  }

  async invalidate(pattern) {
    const keys = await this.redis.keys(pattern);
    if (keys.length > 0) {
      await this.redis.del(...keys);
    }
  }
}

// Usage
const energyData = await cacheService.get(
  `energy:building:${buildingId}:${date}`,
  () => db.getEnergyData(buildingId, date),
  900 // 15 minutes TTL
);

// Invalidate on update
await cacheService.invalidate(`energy:building:${buildingId}:*`);
```

**Cache Invalidation Strategy:**
- Time-based expiration for analytics data
- Event-based invalidation for real-time data
- Cache warming for predictable queries
- Stale-while-revalidate pattern

### 8.4 Message Queue Scaling

**MQTT Broker Clustering:**

```yaml
# EMQX cluster configuration
cluster:
  name: sbems-mqtt-cluster
  discovery_strategy: static
  static_nodes:
    - emqx1@mqtt1.internal
    - emqx2@mqtt2.internal
    - emqx3@mqtt3.internal

# Load balancing
listener:
  tcp:
    external:
      acceptors: 64
      max_connections: 1024000
```

**Worker Queues:**

```javascript
// Bull queue for background jobs
const Queue = require('bull');

const dataProcessingQueue = new Queue('data-processing', {
  redis: {
    host: 'redis.internal',
    port: 6379
  }
});

// Add job
await dataProcessingQueue.add('process-sensor-data', {
  sensorId: 'sensor_123',
  readings: [...]
}, {
  attempts: 3,
  backoff: {
    type: 'exponential',
    delay: 2000
  }
});

// Worker (can run on multiple instances)
dataProcessingQueue.process('process-sensor-data', 5, async (job) => {
  await processSensorData(job.data);
});
```

### 8.5 Multi-Building/Multi-Tenant Architecture

**Data Isolation:**

```sql
-- Building-based partitioning
CREATE TABLE energy_readings_building_1
    PARTITION OF energy_readings
    FOR VALUES IN ('building_uuid_1');

CREATE TABLE energy_readings_building_2
    PARTITION OF energy_readings
    FOR VALUES IN ('building_uuid_2');

-- Row-level security for tenant isolation
CREATE POLICY tenant_isolation ON energy_readings
    FOR ALL
    USING (
        building_id IN (
            SELECT building_id
            FROM user_building_access
            WHERE user_id = current_setting('app.user_id')::UUID
        )
    );
```

**Multi-Region Deployment:**

```
Region 1 (US-East)          Region 2 (US-West)
┌────────────────┐          ┌────────────────┐
│  API Cluster   │◄────────►│  API Cluster   │
│  + WebSocket   │   Sync   │  + WebSocket   │
└────────┬───────┘          └────────┬───────┘
         │                           │
    ┌────▼────┐                 ┌────▼────┐
    │  Primary│                 │ Primary │
    │   DB    │◄───Replication──►  DB    │
    └─────────┘                 └─────────┘
```

### 8.6 Performance Optimization

**Database Query Optimization:**

```sql
-- Materialized views for common aggregations
CREATE MATERIALIZED VIEW daily_energy_summary AS
SELECT
    date_trunc('day', time) as day,
    building_id,
    zone_id,
    SUM(energy_total) as total_energy,
    AVG(power_consumption) as avg_power,
    MAX(power_consumption) as peak_power
FROM energy_readings
GROUP BY day, building_id, zone_id;

-- Refresh strategy (scheduled job)
REFRESH MATERIALIZED VIEW CONCURRENTLY daily_energy_summary;

-- Indexes for common queries
CREATE INDEX idx_energy_building_time_brin
    ON energy_readings USING BRIN (building_id, time);

CREATE INDEX idx_energy_zone_time_covering
    ON energy_readings (zone_id, time)
    INCLUDE (power_consumption, energy_total);
```

**API Response Optimization:**

```javascript
// Pagination
const getPaginatedResults = async (query, page = 1, pageSize = 20) => {
  const offset = (page - 1) * pageSize;

  const [results, total] = await Promise.all([
    db.query(query).limit(pageSize).offset(offset),
    db.query(query).count()
  ]);

  return {
    data: results,
    pagination: {
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize)
    }
  };
};

// Field selection
const getEnergyData = async (buildingId, fields = ['*']) => {
  const selectedFields = fields.join(', ');
  return db.query(`
    SELECT ${selectedFields}
    FROM energy_readings
    WHERE building_id = $1
  `, [buildingId]);
};
```

### 8.7 Auto-Scaling Configuration

**Kubernetes HPA (Horizontal Pod Autoscaler):**

```yaml
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: api-server-hpa
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: api-server
  minReplicas: 3
  maxReplicas: 20
  metrics:
  - type: Resource
    resource:
      name: cpu
      target:
        type: Utilization
        averageUtilization: 70
  - type: Resource
    resource:
      name: memory
      target:
        type: Utilization
        averageUtilization: 80
  behavior:
    scaleUp:
      stabilizationWindowSeconds: 60
      policies:
      - type: Percent
        value: 50
        periodSeconds: 60
    scaleDown:
      stabilizationWindowSeconds: 300
      policies:
      - type: Pods
        value: 1
        periodSeconds: 60
```

---

## 9. Deployment Architecture

### 9.1 Docker Containerization

**Directory Structure:**

```
deployment/
├── docker/
│   ├── api/
│   │   ├── Dockerfile
│   │   └── .dockerignore
│   ├── frontend/
│   │   ├── Dockerfile
│   │   └── nginx.conf
│   ├── workers/
│   │   └── Dockerfile
│   └── integration/
│       └── Dockerfile
├── docker-compose.yml
├── docker-compose.prod.yml
└── .env.example
```

**API Dockerfile:**

```dockerfile
# backend/Dockerfile
FROM node:18-alpine AS builder

WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN npm ci --only=production

# Copy source
COPY . .

# Build (if using TypeScript)
RUN npm run build

# Production image
FROM node:18-alpine

WORKDIR /app

# Copy built application
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./

# Create non-root user
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001

USER nodejs

EXPOSE 3000

CMD ["node", "dist/server.js"]
```

**Frontend Dockerfile:**

```dockerfile
# frontend/Dockerfile
FROM node:18-alpine AS builder

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

# Production image with Nginx
FROM nginx:alpine

# Copy built files
COPY --from=builder /app/dist /usr/share/nginx/html

# Copy nginx configuration
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
```

**Nginx Configuration:**

```nginx
server {
    listen 80;
    server_name _;
    root /usr/share/nginx/html;
    index index.html;

    # Gzip compression
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_types text/plain text/css text/xml text/javascript
               application/x-javascript application/xml+rss
               application/json application/javascript;

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;

    # Cache static assets
    location ~* \.(js|css|png|jpg|jpeg|gif|svg|ico|woff|woff2|ttf|eot)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    # SPA fallback
    location / {
        try_files $uri $uri/ /index.html;
    }

    # Health check
    location /health {
        access_log off;
        return 200 "OK\n";
        add_header Content-Type text/plain;
    }
}
```

### 9.2 Docker Compose Configuration

**docker-compose.yml (Development):**

```yaml
version: '3.8'

services:
  # PostgreSQL with TimescaleDB
  postgres:
    image: timescale/timescaledb:latest-pg15
    container_name: sbems-postgres
    environment:
      POSTGRES_DB: sbems
      POSTGRES_USER: sbems_user
      POSTGRES_PASSWORD: ${DB_PASSWORD}
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data
      - ./init-scripts:/docker-entrypoint-initdb.d
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U sbems_user"]
      interval: 10s
      timeout: 5s
      retries: 5

  # Redis
  redis:
    image: redis:7-alpine
    container_name: sbems-redis
    ports:
      - "6379:6379"
    volumes:
      - redis_data:/data
    command: redis-server --appendonly yes
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 10s
      timeout: 3s
      retries: 5

  # MQTT Broker
  mqtt:
    image: eclipse-mosquitto:2
    container_name: sbems-mqtt
    ports:
      - "1883:1883"
      - "8883:8883"
      - "9001:9001"
    volumes:
      - ./mosquitto/config:/mosquitto/config
      - ./mosquitto/data:/mosquitto/data
      - ./mosquitto/log:/mosquitto/log
    healthcheck:
      test: ["CMD", "mosquitto_sub", "-t", "$$SYS/#", "-C", "1", "-W", "3"]
      interval: 30s
      timeout: 10s
      retries: 3

  # API Server
  api:
    build:
      context: ./backend
      dockerfile: Dockerfile
    container_name: sbems-api
    environment:
      NODE_ENV: development
      PORT: 3000
      DB_HOST: postgres
      DB_PORT: 5432
      DB_NAME: sbems
      DB_USER: sbems_user
      DB_PASSWORD: ${DB_PASSWORD}
      REDIS_HOST: redis
      REDIS_PORT: 6379
      MQTT_HOST: mqtt
      MQTT_PORT: 1883
      JWT_SECRET: ${JWT_SECRET}
    ports:
      - "3000:3000"
    depends_on:
      postgres:
        condition: service_healthy
      redis:
        condition: service_healthy
      mqtt:
        condition: service_healthy
    volumes:
      - ./backend:/app
      - /app/node_modules
    command: npm run dev

  # WebSocket Server
  websocket:
    build:
      context: ./backend
      dockerfile: Dockerfile
    container_name: sbems-websocket
    environment:
      NODE_ENV: development
      PORT: 3001
      REDIS_HOST: redis
      REDIS_PORT: 6379
    ports:
      - "3001:3001"
    depends_on:
      - redis
    volumes:
      - ./backend:/app
      - /app/node_modules
    command: npm run websocket

  # Data Collection Worker
  worker-data:
    build:
      context: ./backend
      dockerfile: Dockerfile
    container_name: sbems-worker-data
    environment:
      NODE_ENV: development
      DB_HOST: postgres
      DB_PORT: 5432
      MQTT_HOST: mqtt
      MQTT_PORT: 1883
    depends_on:
      - postgres
      - mqtt
    volumes:
      - ./backend:/app
      - /app/node_modules
    command: npm run worker:data

  # ML Worker
  worker-ml:
    build:
      context: ./backend
      dockerfile: Dockerfile
    container_name: sbems-worker-ml
    environment:
      NODE_ENV: development
      DB_HOST: postgres
      DB_PORT: 5432
    depends_on:
      - postgres
    volumes:
      - ./backend:/app
      - /app/node_modules
      - ./models:/app/models
    command: npm run worker:ml

  # Integration Gateway
  integration:
    build:
      context: ./integration
      dockerfile: Dockerfile
    container_name: sbems-integration
    environment:
      MQTT_HOST: mqtt
      MQTT_PORT: 1883
    depends_on:
      - mqtt
    network_mode: host  # Needed for BACnet/Modbus
    volumes:
      - ./integration:/app
      - /app/node_modules
    command: npm start

  # Frontend
  frontend:
    build:
      context: ./frontend
      dockerfile: Dockerfile.dev
    container_name: sbems-frontend
    environment:
      VITE_API_URL: http://localhost:3000
      VITE_WS_URL: ws://localhost:3001
    ports:
      - "5173:5173"
    volumes:
      - ./frontend:/app
      - /app/node_modules
    command: npm run dev

volumes:
  postgres_data:
  redis_data:

networks:
  default:
    name: sbems-network
```

**docker-compose.prod.yml (Production Overrides):**

```yaml
version: '3.8'

services:
  postgres:
    restart: unless-stopped
    volumes:
      - /var/lib/sbems/postgres:/var/lib/postgresql/data

  redis:
    restart: unless-stopped
    volumes:
      - /var/lib/sbems/redis:/data

  mqtt:
    restart: unless-stopped
    volumes:
      - /var/lib/sbems/mqtt:/mosquitto/data

  api:
    restart: unless-stopped
    environment:
      NODE_ENV: production
    command: node dist/server.js
    deploy:
      replicas: 3
      resources:
        limits:
          cpus: '1'
          memory: 1G
        reservations:
          cpus: '0.5'
          memory: 512M

  websocket:
    restart: unless-stopped
    environment:
      NODE_ENV: production
    command: node dist/websocket.js
    deploy:
      replicas: 2

  worker-data:
    restart: unless-stopped
    deploy:
      replicas: 2

  worker-ml:
    restart: unless-stopped
    deploy:
      replicas: 1

  integration:
    restart: unless-stopped

  frontend:
    restart: unless-stopped
    build:
      context: ./frontend
      dockerfile: Dockerfile
    ports:
      - "80:80"
```

### 9.3 Coolify Deployment

**Coolify Configuration:**

Coolify supports Docker Compose deployments directly. Here's how to configure:

1. **Repository Setup:**
   - Connect GitHub/GitLab repository
   - Set branch to deploy (main/production)
   - Configure build settings

2. **Environment Variables:**
```bash
# Database
DB_HOST=postgres
DB_PORT=5432
DB_NAME=sbems
DB_USER=sbems_user
DB_PASSWORD=<generated-secure-password>

# Redis
REDIS_HOST=redis
REDIS_PORT=6379

# MQTT
MQTT_HOST=mqtt
MQTT_PORT=1883

# JWT
JWT_SECRET=<generated-secure-secret>
JWT_EXPIRES_IN=15m
REFRESH_TOKEN_EXPIRES_IN=7d

# API
API_PORT=3000
NODE_ENV=production

# Frontend
VITE_API_URL=https://api.sbems.com
VITE_WS_URL=wss://api.sbems.com

# Email (for notifications)
SMTP_HOST=smtp.sendgrid.net
SMTP_PORT=587
SMTP_USER=apikey
SMTP_PASSWORD=<sendgrid-api-key>
```

3. **Domain Configuration:**
   - api.sbems.com → API service
   - app.sbems.com → Frontend service
   - ws.sbems.com → WebSocket service

4. **SSL Certificates:**
   - Automatic Let's Encrypt certificates
   - Auto-renewal configured

5. **Deployment Strategy:**
```yaml
# .coolify/deploy.yml
deploy:
  strategy: rolling
  healthcheck:
    enabled: true
    path: /health
    interval: 30s
  auto_deploy:
    enabled: true
    branch: main
  backup:
    enabled: true
    schedule: "0 2 * * *"  # Daily at 2 AM
    retention: 30  # Keep 30 days
```

### 9.4 Health Checks & Monitoring

**Health Check Endpoints:**

```javascript
// Health check endpoint
app.get('/health', async (req, res) => {
  const health = {
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    checks: {}
  };

  try {
    // Database check
    await db.query('SELECT 1');
    health.checks.database = 'ok';
  } catch (error) {
    health.checks.database = 'error';
    health.status = 'degraded';
  }

  try {
    // Redis check
    await redis.ping();
    health.checks.redis = 'ok';
  } catch (error) {
    health.checks.redis = 'error';
    health.status = 'degraded';
  }

  try {
    // MQTT check
    const connected = mqtt.connected;
    health.checks.mqtt = connected ? 'ok' : 'disconnected';
    if (!connected) health.status = 'degraded';
  } catch (error) {
    health.checks.mqtt = 'error';
    health.status = 'degraded';
  }

  const statusCode = health.status === 'ok' ? 200 : 503;
  res.status(statusCode).json(health);
});

// Readiness probe
app.get('/ready', async (req, res) => {
  // Check if service is ready to accept traffic
  const ready = await checkAllDependencies();
  res.status(ready ? 200 : 503).json({ ready });
});

// Liveness probe
app.get('/alive', (req, res) => {
  // Simple check that process is alive
  res.status(200).json({ alive: true });
});
```

**Prometheus Metrics:**

```javascript
const prometheus = require('prom-client');

// Create metrics
const httpRequestDuration = new prometheus.Histogram({
  name: 'http_request_duration_seconds',
  help: 'Duration of HTTP requests in seconds',
  labelNames: ['method', 'route', 'status_code']
});

const energyReadingsProcessed = new prometheus.Counter({
  name: 'energy_readings_processed_total',
  help: 'Total number of energy readings processed'
});

const activeHVACUnits = new prometheus.Gauge({
  name: 'active_hvac_units',
  help: 'Number of active HVAC units'
});

// Metrics endpoint
app.get('/metrics', async (req, res) => {
  res.set('Content-Type', prometheus.register.contentType);
  res.end(await prometheus.register.metrics());
});
```

### 9.5 Backup & Disaster Recovery

**Backup Strategy:**

```bash
#!/bin/bash
# backup.sh

BACKUP_DIR="/var/backups/sbems"
DATE=$(date +%Y%m%d_%H%M%S)

# PostgreSQL backup
docker exec sbems-postgres pg_dump \
  -U sbems_user \
  -d sbems \
  -F c \
  -f /tmp/sbems_${DATE}.dump

docker cp sbems-postgres:/tmp/sbems_${DATE}.dump \
  ${BACKUP_DIR}/postgres/

# Redis backup
docker exec sbems-redis redis-cli BGSAVE
docker cp sbems-redis:/data/dump.rdb \
  ${BACKUP_DIR}/redis/dump_${DATE}.rdb

# Configuration backup
tar -czf ${BACKUP_DIR}/config/config_${DATE}.tar.gz \
  .env \
  docker-compose.yml \
  mosquitto/config/

# Upload to cloud storage (S3, etc.)
aws s3 sync ${BACKUP_DIR} s3://sbems-backups/

# Cleanup old backups (keep 30 days)
find ${BACKUP_DIR} -type f -mtime +30 -delete

echo "Backup completed: ${DATE}"
```

**Disaster Recovery Plan:**

1. **Recovery Time Objective (RTO):** 1 hour
2. **Recovery Point Objective (RPO):** 15 minutes

**Recovery Steps:**
```bash
# 1. Restore database
docker exec -i sbems-postgres pg_restore \
  -U sbems_user \
  -d sbems \
  -c \
  /tmp/sbems_backup.dump

# 2. Restore Redis
docker cp dump.rdb sbems-redis:/data/
docker restart sbems-redis

# 3. Verify data integrity
docker exec sbems-postgres psql \
  -U sbems_user \
  -d sbems \
  -c "SELECT COUNT(*) FROM energy_readings;"

# 4. Restart all services
docker-compose down
docker-compose up -d
```

---

## 10. Architecture Decision Records (ADRs)

### ADR-001: TimescaleDB for Time-Series Data

**Status:** Accepted

**Context:**
Need efficient storage and querying of high-frequency sensor data and energy consumption metrics.

**Decision:**
Use TimescaleDB extension for PostgreSQL instead of separate time-series database.

**Rationale:**
- Combines benefits of PostgreSQL (ACID, SQL) with time-series optimization
- Automatic data partitioning by time
- Built-in compression (80-90% storage reduction)
- Continuous aggregates for pre-computed rollups
- No additional database to manage
- Native PostgreSQL tooling compatibility

**Consequences:**
- Positive: Reduced operational complexity
- Positive: Better query performance for time-series data
- Positive: Automatic data retention policies
- Negative: Single database dependency (mitigated by replication)

---

### ADR-002: MQTT for IoT Device Communication

**Status:** Accepted

**Context:**
Need reliable, scalable protocol for communication with HVAC systems and sensors.

**Decision:**
Use MQTT as the primary messaging protocol for IoT devices.

**Rationale:**
- Lightweight protocol suitable for constrained devices
- Publish-subscribe pattern for efficient distribution
- Quality of Service (QoS) levels for reliability
- Industry standard for IoT
- Built-in support for offline devices
- Retained messages for last known state

**Consequences:**
- Positive: Scalable to thousands of devices
- Positive: Low bandwidth overhead
- Positive: Built-in reliability mechanisms
- Negative: Requires MQTT broker management
- Mitigation: Use managed broker or containerized solution

---

### ADR-003: TensorFlow.js for ML Predictions

**Status:** Accepted

**Context:**
Need to run ML models for predictive optimization without separate Python service.

**Decision:**
Use TensorFlow.js for ML model training and inference in Node.js.

**Rationale:**
- Same runtime as backend (Node.js)
- Can also run models in browser
- No Python/Node.js bridge required
- Sufficient for our use cases (regression, time-series forecasting)
- Easier deployment (single technology stack)

**Consequences:**
- Positive: Simplified architecture
- Positive: Reduced deployment complexity
- Positive: Browser-based inference possible
- Negative: Limited ML ecosystem compared to Python
- Mitigation: Use pre-trained models for complex tasks

---

### ADR-004: WebSockets for Real-Time Updates

**Status:** Accepted

**Context:**
Frontend needs real-time updates for energy consumption, temperature, and alerts.

**Decision:**
Use WebSockets (Socket.IO) for bidirectional real-time communication.

**Rationale:**
- Full-duplex communication
- Automatic reconnection
- Room-based broadcasting
- Fallback to HTTP long-polling
- Lower latency than polling
- Efficient for high-frequency updates

**Consequences:**
- Positive: Real-time user experience
- Positive: Reduced server load vs polling
- Positive: Bidirectional communication for controls
- Negative: Stateful connections (requires sticky sessions)
- Mitigation: Redis adapter for horizontal scaling

---

### ADR-005: JWT for Authentication

**Status:** Accepted

**Context:**
Need stateless authentication for API and WebSocket connections.

**Decision:**
Use JWT (JSON Web Tokens) with short-lived access tokens and refresh tokens.

**Rationale:**
- Stateless authentication (no session storage)
- Self-contained tokens (claims included)
- Scales horizontally
- Industry standard
- Supports fine-grained permissions

**Consequences:**
- Positive: Stateless, scalable authentication
- Positive: Works across multiple services
- Negative: Token revocation challenges
- Mitigation: Short expiry (15 min) + refresh token rotation

---

### ADR-006: Docker Compose for Deployment

**Status:** Accepted

**Context:**
Need simple deployment solution compatible with Coolify.

**Decision:**
Use Docker Compose for service orchestration.

**Rationale:**
- Simple, declarative configuration
- Native Coolify support
- Good for single-server deployments
- Easy local development
- Version controlled infrastructure
- Can migrate to Kubernetes if needed

**Consequences:**
- Positive: Simple deployment process
- Positive: Development/production parity
- Positive: Easy to understand and maintain
- Negative: Limited to single-host scaling
- Mitigation: Design for horizontal scaling from start

---

### ADR-007: BACnet/IP Over BACnet MS/TP

**Status:** Accepted

**Context:**
Need to decide between BACnet/IP and BACnet MS/TP for Trane HVAC integration.

**Decision:**
Prefer BACnet/IP over BACnet MS/TP for primary integration.

**Rationale:**
- Uses standard Ethernet network
- Easier integration with modern infrastructure
- No special serial hardware required
- Better for remote monitoring
- Trane equipment supports BACnet/IP

**Consequences:**
- Positive: Standard networking infrastructure
- Positive: Easier troubleshooting
- Positive: Better security (network-level)
- Negative: Requires BACnet/IP gateway for older devices
- Mitigation: Use gateway for MS/TP devices

---

### ADR-008: Multi-Tenant Architecture

**Status:** Accepted

**Context:**
System needs to support multiple buildings with data isolation.

**Decision:**
Use shared database with building-level partitioning and row-level security.

**Rationale:**
- Better resource utilization than separate databases
- Easier maintenance and updates
- Consistent schema across buildings
- PostgreSQL row-level security for isolation
- TimescaleDB partition by building ID

**Consequences:**
- Positive: Cost-effective for many buildings
- Positive: Easier to maintain
- Positive: Cross-building analytics possible
- Negative: Need careful access control
- Mitigation: Row-level security + application-level checks

---

## Summary

This architecture document provides a comprehensive blueprint for implementing a production-ready Smart Building Energy Management System. Key highlights:

**Strengths:**
1. **Scalable:** Horizontal scaling at every layer
2. **Secure:** Multi-layer security with encryption, authentication, and audit logging
3. **Reliable:** Health checks, monitoring, and disaster recovery
4. **Maintainable:** Clear separation of concerns, well-documented
5. **Performance:** Caching, indexing, and query optimization
6. **Real-time:** WebSocket and MQTT for instant updates

**Technology Choices:**
- Modern, proven technologies
- Open-source where possible
- Strong community support
- Production-ready libraries

**Next Steps:**
1. Review and approve architecture
2. Set up development environment
3. Implement core infrastructure
4. Build integration layer
5. Develop API and frontend
6. Implement ML models
7. Testing and optimization
8. Production deployment

This architecture is designed to be implemented incrementally, allowing for early testing and feedback while maintaining a clear path to a complete, production-ready system.
