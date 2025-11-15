-- ============================================================================
-- PostgreSQL Initialization Script
-- Creates databases, users, tables, and indexes for RUL prediction system
-- ============================================================================

-- Create databases
CREATE DATABASE rul_prediction;
CREATE DATABASE airflow;
CREATE DATABASE monitoring;

-- Connect to rul_prediction database
\c rul_prediction;

-- Create extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_stat_statements";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================================
-- Create Tables
-- ============================================================================

-- Bearings table
CREATE TABLE IF NOT EXISTS bearings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    bearing_id VARCHAR(100) UNIQUE NOT NULL,
    equipment_id VARCHAR(100),
    location VARCHAR(255),
    manufacturer VARCHAR(100),
    model VARCHAR(100),
    installation_date TIMESTAMP,
    status VARCHAR(50) DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Sensor data table
CREATE TABLE IF NOT EXISTS sensor_data (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    bearing_id UUID REFERENCES bearings(id) ON DELETE CASCADE,
    timestamp TIMESTAMP NOT NULL,
    temperature FLOAT,
    vibration_x FLOAT,
    vibration_y FLOAT,
    vibration_z FLOAT,
    speed FLOAT,
    load FLOAT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Features table
CREATE TABLE IF NOT EXISTS features (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    bearing_id UUID REFERENCES bearings(id) ON DELETE CASCADE,
    timestamp TIMESTAMP NOT NULL,
    feature_vector JSONB NOT NULL,
    feature_names TEXT[],
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Predictions table
CREATE TABLE IF NOT EXISTS predictions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    bearing_id UUID REFERENCES bearings(id) ON DELETE CASCADE,
    prediction_timestamp TIMESTAMP NOT NULL,
    rul_hours FLOAT NOT NULL,
    confidence VARCHAR(50),
    confidence_score FLOAT,
    model_version VARCHAR(50),
    features_used JSONB,
    status VARCHAR(50),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Models table
CREATE TABLE IF NOT EXISTS models (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    model_name VARCHAR(100) NOT NULL,
    model_version VARCHAR(50) NOT NULL,
    algorithm VARCHAR(100),
    hyperparameters JSONB,
    training_date TIMESTAMP,
    accuracy FLOAT,
    mae FLOAT,
    rmse FLOAT,
    r2_score FLOAT,
    model_path VARCHAR(500),
    status VARCHAR(50) DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(model_name, model_version)
);

-- Training runs table
CREATE TABLE IF NOT EXISTS training_runs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    model_id UUID REFERENCES models(id) ON DELETE CASCADE,
    run_id VARCHAR(100) UNIQUE NOT NULL,
    start_time TIMESTAMP NOT NULL,
    end_time TIMESTAMP,
    duration_seconds INTEGER,
    dataset_size INTEGER,
    training_loss FLOAT,
    validation_loss FLOAT,
    metrics JSONB,
    status VARCHAR(50),
    error_message TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Alerts table
CREATE TABLE IF NOT EXISTS alerts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    bearing_id UUID REFERENCES bearings(id) ON DELETE CASCADE,
    alert_type VARCHAR(50) NOT NULL,
    severity VARCHAR(50) NOT NULL,
    message TEXT NOT NULL,
    details JSONB,
    acknowledged BOOLEAN DEFAULT FALSE,
    acknowledged_by VARCHAR(100),
    acknowledged_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Maintenance logs table
CREATE TABLE IF NOT EXISTS maintenance_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    bearing_id UUID REFERENCES bearings(id) ON DELETE CASCADE,
    maintenance_type VARCHAR(100) NOT NULL,
    description TEXT,
    performed_by VARCHAR(100),
    performed_at TIMESTAMP NOT NULL,
    next_maintenance_date TIMESTAMP,
    cost DECIMAL(10, 2),
    downtime_hours FLOAT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- System logs table
CREATE TABLE IF NOT EXISTS system_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    log_level VARCHAR(50) NOT NULL,
    service VARCHAR(100) NOT NULL,
    message TEXT NOT NULL,
    details JSONB,
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================================
-- Create Indexes
-- ============================================================================

-- Bearings indexes
CREATE INDEX idx_bearings_bearing_id ON bearings(bearing_id);
CREATE INDEX idx_bearings_status ON bearings(status);
CREATE INDEX idx_bearings_equipment ON bearings(equipment_id);

-- Sensor data indexes
CREATE INDEX idx_sensor_data_bearing_id ON sensor_data(bearing_id);
CREATE INDEX idx_sensor_data_timestamp ON sensor_data(timestamp DESC);
CREATE INDEX idx_sensor_data_bearing_timestamp ON sensor_data(bearing_id, timestamp DESC);

-- Features indexes
CREATE INDEX idx_features_bearing_id ON features(bearing_id);
CREATE INDEX idx_features_timestamp ON features(timestamp DESC);
CREATE INDEX idx_features_bearing_timestamp ON features(bearing_id, timestamp DESC);

-- Predictions indexes
CREATE INDEX idx_predictions_bearing_id ON predictions(bearing_id);
CREATE INDEX idx_predictions_timestamp ON predictions(prediction_timestamp DESC);
CREATE INDEX idx_predictions_bearing_timestamp ON predictions(bearing_id, prediction_timestamp DESC);
CREATE INDEX idx_predictions_status ON predictions(status);

-- Models indexes
CREATE INDEX idx_models_name_version ON models(model_name, model_version);
CREATE INDEX idx_models_status ON models(status);

-- Training runs indexes
CREATE INDEX idx_training_runs_model_id ON training_runs(model_id);
CREATE INDEX idx_training_runs_start_time ON training_runs(start_time DESC);
CREATE INDEX idx_training_runs_status ON training_runs(status);

-- Alerts indexes
CREATE INDEX idx_alerts_bearing_id ON alerts(bearing_id);
CREATE INDEX idx_alerts_created_at ON alerts(created_at DESC);
CREATE INDEX idx_alerts_acknowledged ON alerts(acknowledged);
CREATE INDEX idx_alerts_severity ON alerts(severity);

-- Maintenance logs indexes
CREATE INDEX idx_maintenance_bearing_id ON maintenance_logs(bearing_id);
CREATE INDEX idx_maintenance_performed_at ON maintenance_logs(performed_at DESC);

-- System logs indexes
CREATE INDEX idx_system_logs_timestamp ON system_logs(timestamp DESC);
CREATE INDEX idx_system_logs_level ON system_logs(log_level);
CREATE INDEX idx_system_logs_service ON system_logs(service);

-- ============================================================================
-- Create Views
-- ============================================================================

-- Latest predictions view
CREATE OR REPLACE VIEW latest_predictions AS
SELECT DISTINCT ON (bearing_id)
    p.id,
    p.bearing_id,
    b.bearing_id as bearing_name,
    p.prediction_timestamp,
    p.rul_hours,
    p.confidence,
    p.confidence_score,
    p.model_version,
    p.status
FROM predictions p
JOIN bearings b ON p.bearing_id = b.id
ORDER BY bearing_id, prediction_timestamp DESC;

-- Bearing health summary view
CREATE OR REPLACE VIEW bearing_health_summary AS
SELECT
    b.id,
    b.bearing_id,
    b.equipment_id,
    b.status as bearing_status,
    lp.rul_hours,
    lp.confidence,
    lp.prediction_timestamp as last_prediction,
    COUNT(DISTINCT a.id) as active_alerts,
    MAX(ml.performed_at) as last_maintenance
FROM bearings b
LEFT JOIN latest_predictions lp ON b.id = lp.bearing_id
LEFT JOIN alerts a ON b.id = a.bearing_id AND a.acknowledged = FALSE
LEFT JOIN maintenance_logs ml ON b.id = ml.bearing_id
GROUP BY b.id, b.bearing_id, b.equipment_id, b.status,
         lp.rul_hours, lp.confidence, lp.prediction_timestamp;

-- ============================================================================
-- Create Functions
-- ============================================================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger for bearings table
CREATE TRIGGER update_bearings_updated_at
    BEFORE UPDATE ON bearings
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- Insert Sample Data (optional, for testing)
-- ============================================================================

-- Insert sample bearings
INSERT INTO bearings (bearing_id, equipment_id, location, manufacturer, model, installation_date)
VALUES
    ('B001', 'EQ001', 'Line A - Section 1', 'SKF', '6205-2RS1', '2023-01-15'),
    ('B002', 'EQ001', 'Line A - Section 2', 'SKF', '6205-2RS1', '2023-01-15'),
    ('B003', 'EQ002', 'Line B - Section 1', 'Timken', 'SET401', '2023-02-20')
ON CONFLICT (bearing_id) DO NOTHING;

-- ============================================================================
-- Create Users and Grant Permissions
-- ============================================================================

-- Create application user
DO $$
BEGIN
    IF NOT EXISTS (SELECT FROM pg_user WHERE usename = 'rul_app') THEN
        CREATE USER rul_app WITH PASSWORD 'rul_app_password';
    END IF;
END
$$;

-- Grant permissions
GRANT CONNECT ON DATABASE rul_prediction TO rul_app;
GRANT USAGE ON SCHEMA public TO rul_app;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO rul_app;
GRANT SELECT, UPDATE ON ALL SEQUENCES IN SCHEMA public TO rul_app;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO rul_app;

-- Create read-only user for analytics
DO $$
BEGIN
    IF NOT EXISTS (SELECT FROM pg_user WHERE usename = 'rul_readonly') THEN
        CREATE USER rul_readonly WITH PASSWORD 'rul_readonly_password';
    END IF;
END
$$;

GRANT CONNECT ON DATABASE rul_prediction TO rul_readonly;
GRANT USAGE ON SCHEMA public TO rul_readonly;
GRANT SELECT ON ALL TABLES IN SCHEMA public TO rul_readonly;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT SELECT ON TABLES TO rul_readonly;

-- ============================================================================
-- Connect to Airflow database and create user
-- ============================================================================

\c airflow;

DO $$
BEGIN
    IF NOT EXISTS (SELECT FROM pg_user WHERE usename = 'airflow') THEN
        CREATE USER airflow WITH PASSWORD 'airflow';
    END IF;
END
$$;

GRANT ALL PRIVILEGES ON DATABASE airflow TO airflow;

-- ============================================================================
-- Performance Tuning
-- ============================================================================

-- Analyze tables for better query planning
ANALYZE;

-- Enable auto-vacuuming (should be in postgresql.conf, but can be set per table)
ALTER TABLE sensor_data SET (autovacuum_vacuum_scale_factor = 0.1);
ALTER TABLE predictions SET (autovacuum_vacuum_scale_factor = 0.1);

-- ============================================================================
-- Completion Message
-- ============================================================================

\c rul_prediction;
SELECT 'Database initialization completed successfully!' as status;
SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' ORDER BY table_name;
