-- ============================================================================
-- Smart Building Energy Management System - Database Migrations
-- ============================================================================
-- Version: 1.0.0
-- PostgreSQL 15+ with TimescaleDB Extension
-- ============================================================================

-- ============================================================================
-- MIGRATION 001: Extensions and Core Setup
-- ============================================================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "timescaledb";

-- Create custom types
CREATE TYPE user_role AS ENUM ('admin', 'facility_manager', 'operator', 'viewer');
CREATE TYPE access_level AS ENUM ('full', 'control', 'readonly');
CREATE TYPE hvac_status AS ENUM ('active', 'inactive', 'maintenance', 'fault');
CREATE TYPE hvac_mode AS ENUM ('off', 'cool', 'heat', 'auto', 'fan_only', 'eco');
CREATE TYPE alert_severity AS ENUM ('critical', 'warning', 'info');
CREATE TYPE alert_type AS ENUM ('anomaly', 'fault', 'threshold', 'maintenance', 'communication');
CREATE TYPE command_status AS ENUM ('pending', 'sent', 'confirmed', 'failed', 'timeout');
CREATE TYPE schedule_type AS ENUM ('daily', 'weekly', 'custom', 'holiday');
CREATE TYPE protocol_type AS ENUM ('bacnet', 'modbus_tcp', 'modbus_rtu', 'api', 'mqtt');
CREATE TYPE sensor_type AS ENUM ('temperature', 'humidity', 'occupancy', 'co2', 'pressure', 'flow', 'power');

-- ============================================================================
-- MIGRATION 002: Core Entity Tables
-- ============================================================================

-- Buildings table
CREATE TABLE buildings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    address TEXT,
    city VARCHAR(100),
    state VARCHAR(100),
    country VARCHAR(100),
    postal_code VARCHAR(20),
    total_area DECIMAL(10,2),
    floors INTEGER,
    timezone VARCHAR(50) DEFAULT 'UTC',
    latitude DECIMAL(10,7),
    longitude DECIMAL(10,7),
    utility_account VARCHAR(100),
    baseline_consumption DECIMAL(10,2), -- kWh/day baseline
    metadata JSONB DEFAULT '{}',
    active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_buildings_active ON buildings(active);
CREATE INDEX idx_buildings_name ON buildings(name);

-- Zones table
CREATE TABLE zones (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    building_id UUID NOT NULL REFERENCES buildings(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    floor INTEGER,
    area DECIMAL(10,2),
    zone_type VARCHAR(50), -- office, conference, lobby, data_center, etc.
    target_temp_min DECIMAL(4,2) DEFAULT 20.0,
    target_temp_max DECIMAL(4,2) DEFAULT 24.0,
    target_humidity_min DECIMAL(5,2) DEFAULT 30.0,
    target_humidity_max DECIMAL(5,2) DEFAULT 60.0,
    occupancy_capacity INTEGER,
    occupancy_enabled BOOLEAN DEFAULT true,
    hvac_enabled BOOLEAN DEFAULT true,
    metadata JSONB DEFAULT '{}',
    active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_zones_building ON zones(building_id);
CREATE INDEX idx_zones_active ON zones(active);
CREATE INDEX idx_zones_floor ON zones(floor);

-- HVAC Units table
CREATE TABLE hvac_units (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    building_id UUID NOT NULL REFERENCES buildings(id) ON DELETE CASCADE,
    zone_id UUID REFERENCES zones(id) ON DELETE SET NULL,
    name VARCHAR(255) NOT NULL,
    manufacturer VARCHAR(100),
    model VARCHAR(100),
    serial_number VARCHAR(100),
    capacity_tons DECIMAL(10,2), -- Cooling capacity in tons
    capacity_kw DECIMAL(10,2), -- Equivalent kW capacity
    protocol protocol_type NOT NULL,
    connection_config JSONB DEFAULT '{}',
    status hvac_status DEFAULT 'active',
    current_mode hvac_mode DEFAULT 'off',
    installed_date DATE,
    last_maintenance DATE,
    next_maintenance DATE,
    maintenance_interval_days INTEGER DEFAULT 180,
    efficiency_rating DECIMAL(5,2), -- SEER or EER rating
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_hvac_building ON hvac_units(building_id);
CREATE INDEX idx_hvac_zone ON hvac_units(zone_id);
CREATE INDEX idx_hvac_status ON hvac_units(status);
CREATE INDEX idx_hvac_protocol ON hvac_units(protocol);

-- Thermostats table
CREATE TABLE thermostats (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    zone_id UUID NOT NULL REFERENCES zones(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    manufacturer VARCHAR(100),
    model VARCHAR(100),
    device_id VARCHAR(100) UNIQUE,
    mac_address VARCHAR(17),
    ip_address INET,
    api_config JSONB DEFAULT '{}',
    current_temp DECIMAL(4,2),
    current_humidity DECIMAL(5,2),
    target_temp DECIMAL(4,2),
    mode hvac_mode DEFAULT 'auto',
    fan_mode VARCHAR(50),
    hold_enabled BOOLEAN DEFAULT false,
    hold_until TIMESTAMP,
    status VARCHAR(50) DEFAULT 'online',
    last_seen TIMESTAMP,
    firmware_version VARCHAR(50),
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_thermostats_zone ON thermostats(zone_id);
CREATE INDEX idx_thermostats_device_id ON thermostats(device_id);
CREATE INDEX idx_thermostats_status ON thermostats(status);

-- Sensors table
CREATE TABLE sensors (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    zone_id UUID NOT NULL REFERENCES zones(id) ON DELETE CASCADE,
    sensor_type sensor_type NOT NULL,
    name VARCHAR(255) NOT NULL,
    device_id VARCHAR(100) UNIQUE,
    protocol protocol_type NOT NULL,
    connection_config JSONB DEFAULT '{}',
    unit VARCHAR(20),
    min_value DECIMAL(10,4),
    max_value DECIMAL(10,4),
    status VARCHAR(50) DEFAULT 'active',
    calibration_offset DECIMAL(6,2) DEFAULT 0,
    last_reading DECIMAL(10,4),
    last_reading_time TIMESTAMP,
    metadata JSONB DEFAULT '{}',
    active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_sensors_zone ON sensors(zone_id);
CREATE INDEX idx_sensors_type ON sensors(sensor_type);
CREATE INDEX idx_sensors_device_id ON sensors(device_id);
CREATE INDEX idx_sensors_active ON sensors(active);

-- ============================================================================
-- MIGRATION 003: Time-Series Tables (TimescaleDB Hypertables)
-- ============================================================================

-- Energy readings
CREATE TABLE energy_readings (
    time TIMESTAMPTZ NOT NULL,
    building_id UUID NOT NULL REFERENCES buildings(id) ON DELETE CASCADE,
    zone_id UUID REFERENCES zones(id) ON DELETE CASCADE,
    hvac_unit_id UUID REFERENCES hvac_units(id) ON DELETE CASCADE,
    power_consumption DECIMAL(10,4), -- kW
    energy_total DECIMAL(10,4), -- kWh cumulative
    voltage DECIMAL(6,2),
    current DECIMAL(8,2),
    power_factor DECIMAL(4,3),
    efficiency_ratio DECIMAL(5,2),
    runtime_hours DECIMAL(10,2),
    metadata JSONB DEFAULT '{}'
);

SELECT create_hypertable('energy_readings', 'time', chunk_time_interval => INTERVAL '7 days');

CREATE INDEX idx_energy_building_time ON energy_readings (building_id, time DESC);
CREATE INDEX idx_energy_zone_time ON energy_readings (zone_id, time DESC);
CREATE INDEX idx_energy_hvac_time ON energy_readings (hvac_unit_id, time DESC);

-- Sensor readings
CREATE TABLE sensor_readings (
    time TIMESTAMPTZ NOT NULL,
    sensor_id UUID NOT NULL REFERENCES sensors(id) ON DELETE CASCADE,
    zone_id UUID NOT NULL REFERENCES zones(id) ON DELETE CASCADE,
    value DECIMAL(10,4) NOT NULL,
    unit VARCHAR(20),
    quality INTEGER DEFAULT 100, -- data quality score 0-100
    anomaly_score DECIMAL(5,2) -- ML-generated anomaly score
);

SELECT create_hypertable('sensor_readings', 'time', chunk_time_interval => INTERVAL '7 days');

CREATE INDEX idx_sensor_readings_sensor_time ON sensor_readings (sensor_id, time DESC);
CREATE INDEX idx_sensor_readings_zone_time ON sensor_readings (zone_id, time DESC);

-- HVAC telemetry
CREATE TABLE hvac_telemetry (
    time TIMESTAMPTZ NOT NULL,
    hvac_unit_id UUID NOT NULL REFERENCES hvac_units(id) ON DELETE CASCADE,
    supply_temp DECIMAL(5,2),
    return_temp DECIMAL(5,2),
    outdoor_temp DECIMAL(5,2),
    flow_rate DECIMAL(10,2),
    pressure_discharge DECIMAL(10,2),
    pressure_suction DECIMAL(10,2),
    compressor_speed DECIMAL(5,2), -- percentage 0-100
    fan_speed DECIMAL(5,2), -- percentage 0-100
    valve_position DECIMAL(5,2), -- percentage 0-100
    mode hvac_mode,
    status VARCHAR(50),
    fault_codes JSONB DEFAULT '[]',
    metadata JSONB DEFAULT '{}'
);

SELECT create_hypertable('hvac_telemetry', 'time', chunk_time_interval => INTERVAL '7 days');

CREATE INDEX idx_hvac_telemetry_unit_time ON hvac_telemetry (hvac_unit_id, time DESC);

-- ============================================================================
-- MIGRATION 004: Continuous Aggregates (Materialized Views)
-- ============================================================================

-- Hourly energy aggregates
CREATE MATERIALIZED VIEW energy_readings_hourly
WITH (timescaledb.continuous) AS
SELECT
    time_bucket('1 hour', time) AS bucket,
    building_id,
    zone_id,
    hvac_unit_id,
    AVG(power_consumption) as avg_power,
    MAX(power_consumption) as peak_power,
    MIN(power_consumption) as min_power,
    SUM(energy_total) as total_energy,
    AVG(efficiency_ratio) as avg_efficiency,
    COUNT(*) as reading_count
FROM energy_readings
GROUP BY bucket, building_id, zone_id, hvac_unit_id
WITH NO DATA;

-- Refresh policy for hourly aggregates (every 30 minutes)
SELECT add_continuous_aggregate_policy('energy_readings_hourly',
    start_offset => INTERVAL '2 hours',
    end_offset => INTERVAL '30 minutes',
    schedule_interval => INTERVAL '30 minutes');

-- Daily energy aggregates
CREATE MATERIALIZED VIEW energy_readings_daily
WITH (timescaledb.continuous) AS
SELECT
    time_bucket('1 day', time) AS bucket,
    building_id,
    zone_id,
    SUM(energy_total) as total_energy,
    AVG(power_consumption) as avg_power,
    MAX(power_consumption) as peak_power,
    MIN(power_consumption) as min_power,
    AVG(efficiency_ratio) as avg_efficiency
FROM energy_readings
GROUP BY bucket, building_id, zone_id
WITH NO DATA;

-- Refresh policy for daily aggregates (once per hour)
SELECT add_continuous_aggregate_policy('energy_readings_daily',
    start_offset => INTERVAL '3 days',
    end_offset => INTERVAL '1 hour',
    schedule_interval => INTERVAL '1 hour');

-- Hourly temperature averages
CREATE MATERIALIZED VIEW temperature_hourly
WITH (timescaledb.continuous) AS
SELECT
    time_bucket('1 hour', time) AS bucket,
    zone_id,
    AVG(value) as avg_temp,
    MAX(value) as max_temp,
    MIN(value) as min_temp,
    STDDEV(value) as temp_stddev
FROM sensor_readings sr
JOIN sensors s ON sr.sensor_id = s.id
WHERE s.sensor_type = 'temperature'
GROUP BY bucket, zone_id
WITH NO DATA;

SELECT add_continuous_aggregate_policy('temperature_hourly',
    start_offset => INTERVAL '2 hours',
    end_offset => INTERVAL '30 minutes',
    schedule_interval => INTERVAL '30 minutes');

-- ============================================================================
-- MIGRATION 005: Operational Tables
-- ============================================================================

-- Schedules
CREATE TABLE schedules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    zone_id UUID NOT NULL REFERENCES zones(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    schedule_type schedule_type NOT NULL,
    days_of_week INTEGER[], -- 0=Sunday, 6=Saturday
    start_time TIME,
    end_time TIME,
    target_temp DECIMAL(4,2),
    target_humidity DECIMAL(5,2),
    mode hvac_mode DEFAULT 'auto',
    priority INTEGER DEFAULT 0,
    enabled BOOLEAN DEFAULT true,
    effective_from DATE,
    effective_to DATE,
    exceptions JSONB DEFAULT '[]', -- [{date: "2025-12-25", reason: "Holiday"}]
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_schedules_zone ON schedules(zone_id);
CREATE INDEX idx_schedules_enabled ON schedules(enabled);
CREATE INDEX idx_schedules_priority ON schedules(priority DESC);

-- Alerts
CREATE TABLE alerts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    building_id UUID REFERENCES buildings(id) ON DELETE CASCADE,
    zone_id UUID REFERENCES zones(id) ON DELETE CASCADE,
    hvac_unit_id UUID REFERENCES hvac_units(id) ON DELETE CASCADE,
    sensor_id UUID REFERENCES sensors(id) ON DELETE CASCADE,
    alert_type alert_type NOT NULL,
    severity alert_severity NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    metric_name VARCHAR(100),
    threshold_value DECIMAL(10,4),
    actual_value DECIMAL(10,4),
    rule_id UUID, -- Reference to alert rule that triggered this
    acknowledged BOOLEAN DEFAULT false,
    acknowledged_by UUID, -- References users(id)
    acknowledged_at TIMESTAMP,
    resolved BOOLEAN DEFAULT false,
    resolved_by UUID, -- References users(id)
    resolved_at TIMESTAMP,
    resolution_notes TEXT,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_alerts_building ON alerts(building_id);
CREATE INDEX idx_alerts_zone ON alerts(zone_id);
CREATE INDEX idx_alerts_hvac ON alerts(hvac_unit_id);
CREATE INDEX idx_alerts_severity ON alerts(severity);
CREATE INDEX idx_alerts_resolved ON alerts(resolved);
CREATE INDEX idx_alerts_created ON alerts(created_at DESC);
CREATE INDEX idx_alerts_unresolved ON alerts(resolved) WHERE resolved = false;

-- Alert rules
CREATE TABLE alert_rules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    building_id UUID REFERENCES buildings(id) ON DELETE CASCADE,
    zone_id UUID REFERENCES zones(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    alert_type alert_type NOT NULL,
    severity alert_severity NOT NULL,
    metric VARCHAR(100) NOT NULL,
    condition VARCHAR(50) NOT NULL, -- gt, lt, eq, gte, lte
    threshold DECIMAL(10,4) NOT NULL,
    duration_minutes INTEGER, -- Alert only if condition persists
    enabled BOOLEAN DEFAULT true,
    notification_channels JSONB DEFAULT '["email", "sms", "push"]',
    cooldown_minutes INTEGER DEFAULT 60, -- Min time between alerts
    last_triggered TIMESTAMP,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_alert_rules_building ON alert_rules(building_id);
CREATE INDEX idx_alert_rules_enabled ON alert_rules(enabled);

-- ML predictions
CREATE TABLE ml_predictions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    building_id UUID REFERENCES buildings(id) ON DELETE CASCADE,
    zone_id UUID REFERENCES zones(id) ON DELETE CASCADE,
    prediction_type VARCHAR(50) NOT NULL, -- load, temperature, occupancy, savings
    model_version VARCHAR(50) NOT NULL,
    prediction_time TIMESTAMPTZ NOT NULL,
    horizon_minutes INTEGER NOT NULL,
    predicted_value DECIMAL(10,4) NOT NULL,
    confidence DECIMAL(5,2), -- 0-100
    upper_bound DECIMAL(10,4), -- Confidence interval
    lower_bound DECIMAL(10,4),
    actual_value DECIMAL(10,4), -- Filled in later for accuracy tracking
    error DECIMAL(10,4), -- Prediction error when actual_value is available
    features JSONB DEFAULT '{}', -- Input features used
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_predictions_building_time ON ml_predictions(building_id, prediction_time DESC);
CREATE INDEX idx_predictions_zone_time ON ml_predictions(zone_id, prediction_time DESC);
CREATE INDEX idx_predictions_type ON ml_predictions(prediction_type);

-- Control commands
CREATE TABLE control_commands (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID, -- References users(id)
    hvac_unit_id UUID REFERENCES hvac_units(id) ON DELETE CASCADE,
    thermostat_id UUID REFERENCES thermostats(id) ON DELETE CASCADE,
    zone_id UUID REFERENCES zones(id) ON DELETE CASCADE,
    command_type VARCHAR(50) NOT NULL, -- setpoint, mode, fan_speed, power, override
    command_data JSONB NOT NULL,
    source VARCHAR(50) NOT NULL, -- manual, automated, schedule, ml, api
    priority INTEGER DEFAULT 5, -- 1-16 (BACnet priority)
    status command_status DEFAULT 'pending',
    sent_at TIMESTAMP,
    confirmed_at TIMESTAMP,
    expires_at TIMESTAMP,
    error_message TEXT,
    retry_count INTEGER DEFAULT 0,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_commands_hvac ON control_commands(hvac_unit_id);
CREATE INDEX idx_commands_thermostat ON control_commands(thermostat_id);
CREATE INDEX idx_commands_user ON control_commands(user_id);
CREATE INDEX idx_commands_status ON control_commands(status);
CREATE INDEX idx_commands_created ON control_commands(created_at DESC);

-- Energy savings calculations
CREATE TABLE energy_savings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    building_id UUID NOT NULL REFERENCES buildings(id) ON DELETE CASCADE,
    period_start TIMESTAMPTZ NOT NULL,
    period_end TIMESTAMPTZ NOT NULL,
    baseline_consumption DECIMAL(10,4), -- kWh
    actual_consumption DECIMAL(10,4), -- kWh
    savings_kwh DECIMAL(10,4),
    savings_percent DECIMAL(5,2),
    cost_per_kwh DECIMAL(6,4),
    cost_savings DECIMAL(10,2),
    co2_per_kwh DECIMAL(6,4), -- kg CO2 per kWh
    co2_reduction DECIMAL(10,2), -- kg
    calculation_method VARCHAR(100),
    weather_normalized BOOLEAN DEFAULT false,
    verified BOOLEAN DEFAULT false,
    verified_by UUID, -- References users(id)
    verified_at TIMESTAMP,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_savings_building ON energy_savings(building_id);
CREATE INDEX idx_savings_period ON energy_savings(period_start DESC);

-- ============================================================================
-- MIGRATION 006: User Management
-- ============================================================================

-- Users
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255),
    first_name VARCHAR(100),
    last_name VARCHAR(100),
    role user_role NOT NULL DEFAULT 'viewer',
    phone VARCHAR(20),
    avatar_url TEXT,
    email_verified BOOLEAN DEFAULT false,
    email_verification_token VARCHAR(255),
    password_reset_token VARCHAR(255),
    password_reset_expires TIMESTAMP,
    mfa_enabled BOOLEAN DEFAULT false,
    mfa_secret VARCHAR(255),
    active BOOLEAN DEFAULT true,
    last_login TIMESTAMP,
    login_count INTEGER DEFAULT 0,
    failed_login_attempts INTEGER DEFAULT 0,
    locked_until TIMESTAMP,
    preferences JSONB DEFAULT '{}',
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_users_active ON users(active);

-- User building access
CREATE TABLE user_building_access (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    building_id UUID NOT NULL REFERENCES buildings(id) ON DELETE CASCADE,
    access_level access_level NOT NULL DEFAULT 'readonly',
    granted_at TIMESTAMP DEFAULT NOW(),
    granted_by UUID REFERENCES users(id),
    expires_at TIMESTAMP,
    metadata JSONB DEFAULT '{}',
    UNIQUE(user_id, building_id)
);

CREATE INDEX idx_user_access_user ON user_building_access(user_id);
CREATE INDEX idx_user_access_building ON user_building_access(building_id);

-- Audit log
CREATE TABLE audit_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    action VARCHAR(50) NOT NULL, -- create, read, update, delete, control, login, logout
    resource_type VARCHAR(50) NOT NULL,
    resource_id UUID,
    changes JSONB DEFAULT '{}', -- {before: {...}, after: {...}}
    ip_address INET,
    user_agent TEXT,
    result VARCHAR(20) NOT NULL, -- success, failure, unauthorized
    error_message TEXT,
    severity VARCHAR(20) DEFAULT 'info',
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_audit_user ON audit_log(user_id);
CREATE INDEX idx_audit_action ON audit_log(action);
CREATE INDEX idx_audit_resource ON audit_log(resource_type, resource_id);
CREATE INDEX idx_audit_created ON audit_log(created_at DESC);
CREATE INDEX idx_audit_result ON audit_log(result);

-- ============================================================================
-- MIGRATION 007: Data Retention Policies
-- ============================================================================

-- Keep raw sensor readings for 1 year
SELECT add_retention_policy('sensor_readings', INTERVAL '1 year');

-- Keep raw energy readings for 2 years
SELECT add_retention_policy('energy_readings', INTERVAL '2 years');

-- Keep HVAC telemetry for 1 year
SELECT add_retention_policy('hvac_telemetry', INTERVAL '1 year');

-- Keep audit log for 7 years (compliance)
-- Note: No retention policy for audit_log - managed manually

-- ============================================================================
-- MIGRATION 008: Compression Policies
-- ============================================================================

-- Compress sensor readings after 7 days
SELECT add_compression_policy('sensor_readings', INTERVAL '7 days');

-- Compress energy readings after 30 days
SELECT add_compression_policy('energy_readings', INTERVAL '30 days');

-- Compress HVAC telemetry after 7 days
SELECT add_compression_policy('hvac_telemetry', INTERVAL '7 days');

-- ============================================================================
-- MIGRATION 009: Row-Level Security
-- ============================================================================

-- Enable RLS on sensitive tables
ALTER TABLE energy_readings ENABLE ROW LEVEL SECURITY;
ALTER TABLE sensor_readings ENABLE ROW LEVEL SECURITY;
ALTER TABLE hvac_telemetry ENABLE ROW LEVEL SECURITY;
ALTER TABLE alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE control_commands ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only see data for buildings they have access to
CREATE POLICY user_building_access_policy ON energy_readings
    FOR SELECT
    USING (
        building_id IN (
            SELECT building_id
            FROM user_building_access
            WHERE user_id = current_setting('app.user_id', true)::UUID
                AND (expires_at IS NULL OR expires_at > NOW())
        )
    );

CREATE POLICY user_building_access_policy ON sensor_readings
    FOR SELECT
    USING (
        zone_id IN (
            SELECT z.id
            FROM zones z
            JOIN user_building_access uba ON z.building_id = uba.building_id
            WHERE uba.user_id = current_setting('app.user_id', true)::UUID
                AND (uba.expires_at IS NULL OR uba.expires_at > NOW())
        )
    );

CREATE POLICY user_building_access_policy ON alerts
    FOR SELECT
    USING (
        building_id IN (
            SELECT building_id
            FROM user_building_access
            WHERE user_id = current_setting('app.user_id', true)::UUID
                AND (expires_at IS NULL OR expires_at > NOW())
        )
    );

-- ============================================================================
-- MIGRATION 010: Helper Functions
-- ============================================================================

-- Function to calculate energy cost
CREATE OR REPLACE FUNCTION calculate_energy_cost(
    p_kwh DECIMAL,
    p_rate_schedule JSONB
) RETURNS DECIMAL AS $$
DECLARE
    v_cost DECIMAL := 0;
BEGIN
    -- Simplified flat rate calculation
    -- In production, this would use time-of-use rates
    v_cost := p_kwh * (p_rate_schedule->>'base_rate')::DECIMAL;
    RETURN v_cost;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Function to calculate CO2 emissions
CREATE OR REPLACE FUNCTION calculate_co2_emissions(
    p_kwh DECIMAL,
    p_emission_factor DECIMAL DEFAULT 0.42 -- kg CO2 per kWh (US average)
) RETURNS DECIMAL AS $$
BEGIN
    RETURN p_kwh * p_emission_factor;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Function to get current zone status
CREATE OR REPLACE FUNCTION get_zone_status(p_zone_id UUID)
RETURNS TABLE (
    zone_id UUID,
    zone_name VARCHAR,
    current_temp DECIMAL,
    target_temp DECIMAL,
    current_humidity DECIMAL,
    occupancy INTEGER,
    hvac_mode VARCHAR,
    power_consumption DECIMAL
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        z.id,
        z.name,
        (SELECT value FROM sensor_readings sr
         JOIN sensors s ON sr.sensor_id = s.id
         WHERE s.zone_id = z.id AND s.sensor_type = 'temperature'
         ORDER BY sr.time DESC LIMIT 1),
        t.target_temp,
        (SELECT value FROM sensor_readings sr
         JOIN sensors s ON sr.sensor_id = s.id
         WHERE s.zone_id = z.id AND s.sensor_type = 'humidity'
         ORDER BY sr.time DESC LIMIT 1),
        (SELECT value::INTEGER FROM sensor_readings sr
         JOIN sensors s ON sr.sensor_id = s.id
         WHERE s.zone_id = z.id AND s.sensor_type = 'occupancy'
         ORDER BY sr.time DESC LIMIT 1),
        t.mode::VARCHAR,
        (SELECT power_consumption FROM energy_readings
         WHERE zone_id = z.id
         ORDER BY time DESC LIMIT 1)
    FROM zones z
    LEFT JOIN thermostats t ON t.zone_id = z.id
    WHERE z.id = p_zone_id;
END;
$$ LANGUAGE plpgsql;

-- Function to check maintenance due
CREATE OR REPLACE FUNCTION check_maintenance_due()
RETURNS TABLE (
    hvac_unit_id UUID,
    unit_name VARCHAR,
    building_name VARCHAR,
    last_maintenance DATE,
    next_maintenance DATE,
    days_overdue INTEGER
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        hu.id,
        hu.name,
        b.name,
        hu.last_maintenance,
        hu.next_maintenance,
        EXTRACT(DAY FROM NOW() - hu.next_maintenance)::INTEGER
    FROM hvac_units hu
    JOIN buildings b ON hu.building_id = b.id
    WHERE hu.next_maintenance < NOW()
        AND hu.status = 'active'
    ORDER BY hu.next_maintenance ASC;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- MIGRATION 011: Triggers
-- ============================================================================

-- Update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_buildings_updated_at BEFORE UPDATE ON buildings
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_zones_updated_at BEFORE UPDATE ON zones
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_hvac_units_updated_at BEFORE UPDATE ON hvac_units
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Auto-calculate next maintenance date
CREATE OR REPLACE FUNCTION calculate_next_maintenance()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.last_maintenance IS NOT NULL AND NEW.maintenance_interval_days IS NOT NULL THEN
        NEW.next_maintenance := NEW.last_maintenance + (NEW.maintenance_interval_days || ' days')::INTERVAL;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER calculate_hvac_next_maintenance
    BEFORE INSERT OR UPDATE OF last_maintenance, maintenance_interval_days
    ON hvac_units
    FOR EACH ROW
    EXECUTE FUNCTION calculate_next_maintenance();

-- ============================================================================
-- MIGRATION 012: Initial Data / Seed Data
-- ============================================================================

-- Insert default admin user (password: Admin123!)
INSERT INTO users (email, password_hash, first_name, last_name, role, email_verified, active)
VALUES (
    'admin@sbems.com',
    '$2b$10$rR5hqYqXQxqz5XBqxKZ0vOJKqZQYqXqz5XBqxKZ0vOJKqZQYqXqz',
    'System',
    'Administrator',
    'admin',
    true,
    true
);

-- Insert sample alert rules
INSERT INTO alert_rules (name, description, alert_type, severity, metric, condition, threshold, enabled)
VALUES
    ('High Energy Consumption', 'Alert when power consumption exceeds 100 kW', 'threshold', 'warning', 'power_consumption', 'gt', 100.0, true),
    ('HVAC Fault Detected', 'Alert on HVAC fault codes', 'fault', 'critical', 'fault_codes', 'eq', 1.0, true),
    ('High Temperature', 'Alert when zone temperature exceeds 28°C', 'threshold', 'warning', 'temperature', 'gt', 28.0, true),
    ('Low Temperature', 'Alert when zone temperature drops below 18°C', 'threshold', 'warning', 'temperature', 'lt', 18.0, true),
    ('Communication Lost', 'Alert when device hasn\'t reported in 10 minutes', 'communication', 'critical', 'last_seen', 'gt', 10.0, true);

-- ============================================================================
-- END OF MIGRATIONS
-- ============================================================================

-- Grant permissions to application user
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO sbems_user;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO sbems_user;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO sbems_user;

-- Display migration summary
SELECT 'Database migrations completed successfully!' as status;
SELECT tablename, pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS size
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;
