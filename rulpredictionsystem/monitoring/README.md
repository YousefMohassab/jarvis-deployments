# RUL Prediction System - Monitoring & Observability

Production-grade monitoring and observability stack for the Remaining Useful Life (RUL) Prediction System using Prometheus and Grafana.

## Table of Contents

- [Overview](#overview)
- [Architecture](#architecture)
- [Components](#components)
- [Quick Start](#quick-start)
- [Installation](#installation)
- [Configuration](#configuration)
- [Dashboards](#dashboards)
- [Alerts](#alerts)
- [Custom Metrics](#custom-metrics)
- [Troubleshooting](#troubleshooting)
- [Maintenance](#maintenance)
- [Best Practices](#best-practices)

## Overview

This monitoring stack provides comprehensive observability for:

- **API Performance**: Request rate, latency, errors, and throughput
- **ML Model Performance**: Accuracy, inference time, prediction distribution
- **Infrastructure**: CPU, memory, disk, network usage
- **Database**: Connection pools, query performance, locks
- **Business Metrics**: Prediction volume, bearing health, alert rates

### Key Features

- Real-time metrics collection and visualization
- Automated alerting with multiple notification channels
- Custom ML model performance tracking
- Pre-built dashboards for all system components
- Automated backup and restore capabilities
- 30-day metrics retention (configurable)

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     Monitoring Stack                         │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────┐ │
│  │   Grafana    │◄───│  Prometheus  │◄───│  Exporters   │ │
│  │  (Visualize) │    │  (Collect)   │    │  (Expose)    │ │
│  └──────────────┘    └──────┬───────┘    └──────────────┘ │
│                              │                               │
│                              ▼                               │
│                       ┌──────────────┐                      │
│                       │ AlertManager │                      │
│                       │   (Notify)   │                      │
│                       └──────────────┘                      │
│                                                              │
└─────────────────────────────────────────────────────────────┘
                            │
        ┌───────────────────┼───────────────────┐
        │                   │                   │
        ▼                   ▼                   ▼
┌──────────────┐    ┌──────────────┐    ┌──────────────┐
│   FastAPI    │    │  PostgreSQL  │    │   Airflow    │
│     API      │    │   Database   │    │   Scheduler  │
└──────────────┘    └──────────────┘    └──────────────┘
```

## Components

### Core Services

1. **Prometheus** (Port 9090)
   - Time-series database
   - Metrics collection engine
   - Alert rule evaluation

2. **Grafana** (Port 3000)
   - Visualization and dashboarding
   - Alert management UI
   - User authentication

3. **AlertManager** (Port 9093)
   - Alert routing and grouping
   - Notification management
   - Alert silencing

### Exporters

1. **Node Exporter** (Port 9100)
   - System metrics (CPU, memory, disk, network)
   - Hardware monitoring
   - Filesystem statistics

2. **PostgreSQL Exporter** (Port 9187)
   - Database metrics
   - Connection pool statistics
   - Query performance

3. **Model Exporter** (Port 9090)
   - Custom ML model metrics
   - Prediction statistics
   - Feature importance
   - Drift detection

4. **cAdvisor** (Port 8080)
   - Container metrics
   - Resource utilization
   - Docker statistics

### Optional Services

5. **Loki** (Port 3100)
   - Log aggregation
   - Log querying

6. **Promtail**
   - Log collection
   - Log forwarding to Loki

## Quick Start

### Using Docker Compose (Recommended)

```bash
# Navigate to monitoring directory
cd /path/to/rul-prediction-system/monitoring

# Start the monitoring stack
docker-compose -f docker-compose.monitoring.yml up -d

# Check services status
docker-compose -f docker-compose.monitoring.yml ps

# Access services
# Prometheus: http://localhost:9090
# Grafana: http://localhost:3000 (admin/admin123)
# AlertManager: http://localhost:9093
```

### Manual Installation

```bash
# Install exporters
sudo ./scripts/install_exporters.sh

# Start Docker services
docker-compose -f docker-compose.monitoring.yml up -d
```

## Installation

### Prerequisites

- Docker 20.10+
- Docker Compose 2.0+
- Python 3.10+
- PostgreSQL 13+
- 4GB RAM minimum
- 20GB disk space for metrics storage

### Step 1: Environment Setup

```bash
# Create .env file
cat > .env << EOF
# Grafana Configuration
GF_SECURITY_ADMIN_USER=admin
GF_SECURITY_ADMIN_PASSWORD=your-secure-password

# Database Configuration
DB_HOST=postgres
DB_PORT=5432
DB_NAME=rul_db
DB_USER=postgres
DB_PASSWORD=your-db-password

# SMTP Configuration (for alerts)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=your-app-password

# Slack Webhook (optional)
SLACK_WEBHOOK_URL=https://hooks.slack.com/services/YOUR/WEBHOOK/URL

# PagerDuty (optional)
PAGERDUTY_SERVICE_KEY=your-service-key
EOF
```

### Step 2: Install Exporters

```bash
# Make scripts executable
chmod +x scripts/*.sh

# Install exporters (requires sudo)
sudo ./scripts/install_exporters.sh

# Verify exporters are running
systemctl status node_exporter
systemctl status postgres_exporter
systemctl status model_exporter
```

### Step 3: Start Monitoring Stack

```bash
# Start all services
docker-compose -f docker-compose.monitoring.yml up -d

# View logs
docker-compose -f docker-compose.monitoring.yml logs -f

# Check health
curl http://localhost:9090/-/healthy  # Prometheus
curl http://localhost:3000/api/health # Grafana
```

### Step 4: Configure Grafana

```bash
# Default credentials
Username: admin
Password: admin123 (change on first login)

# Grafana automatically provisions:
# - Prometheus datasource
# - All dashboards
# - Alert channels
```

## Configuration

### Prometheus Configuration

Edit `prometheus/prometheus.yml`:

```yaml
# Adjust scrape interval
global:
  scrape_interval: 15s  # Default: 15s

# Adjust retention
storage:
  tsdb:
    retention.time: 30d  # Default: 30 days
```

### Alert Configuration

Edit `prometheus/alerts.yml` to customize alert rules:

```yaml
- alert: HighAPIResponseTime
  expr: histogram_quantile(0.95, rate(fastapi_request_duration_seconds_bucket[5m])) > 2
  for: 5m
  labels:
    severity: warning
  annotations:
    summary: "High API response time"
```

### Grafana Configuration

Datasources: `grafana/provisioning/datasources/prometheus.yml`
Dashboards: `grafana/provisioning/dashboards/dashboards.yml`

## Dashboards

### 1. RUL System Overview

**File**: `grafana/dashboards/rul-system-overview.json`

**Metrics**:
- System health status (API, Database, Airflow)
- Request rate and error rate
- Response time percentiles
- Model prediction accuracy
- Resource utilization (CPU, memory, disk)
- Active alerts

**URL**: http://localhost:3000/d/rul-system-overview

### 2. ML Model Performance

**File**: `grafana/dashboards/model-performance.json`

**Metrics**:
- Prediction accuracy over time
- Model error metrics (MAE, RMSE, MAPE)
- R² score
- Inference latency distribution
- Confidence score distribution
- RUL prediction categories
- Feature importance
- Model drift detection
- Bearing health status

**URL**: http://localhost:3000/d/model-performance

### 3. API Monitoring

**File**: `grafana/dashboards/api-metrics.json`

**Metrics**:
- Total requests and request rate
- Response time percentiles (p50, p90, p95, p99)
- Error rate by status code
- Request rate by endpoint
- Active connections
- WebSocket connections
- Request/response size
- Rate limiting
- Top slowest endpoints

**URL**: http://localhost:3000/d/api-metrics

### 4. Infrastructure Monitoring

**File**: `grafana/dashboards/infrastructure.json`

**Metrics**:
- System information
- CPU usage (overall and by mode)
- Memory usage and details
- Disk usage and I/O
- Network traffic and errors
- Load average
- Container statistics
- Database connections
- PostgreSQL performance
- Airflow task status

**URL**: http://localhost:3000/d/infrastructure

## Alerts

### Alert Categories

#### Critical Alerts
- API service down
- Database connection failures
- Model accuracy below 70%
- Disk space above 90%
- Memory usage above 95%

#### Warning Alerts
- API response time > 2s
- Model accuracy below 85%
- High error rate (>5%)
- Disk space above 80%
- Memory usage above 85%

#### Info Alerts
- Unusual prediction patterns
- Low prediction volume
- Model needs retraining

### Alert Routing

Alerts are routed based on:
- **Severity**: Critical, Warning, Info
- **Component**: API, ML Model, Database, Infrastructure
- **Team**: API Team, ML Team, Ops Team, Database Team

### Notification Channels

Configure in `alertmanager/alertmanager.yml`:

1. **Email**
   - Default notification method
   - Configurable per team

2. **Slack**
   - Real-time notifications
   - Separate channels by severity

3. **PagerDuty**
   - Critical alerts only
   - On-call escalation

4. **Webhook**
   - Custom integrations
   - ITSM systems

### Testing Alerts

```bash
# Send test alert
curl -X POST http://localhost:9093/api/v1/alerts -d '[{
  "labels": {
    "alertname": "TestAlert",
    "severity": "warning"
  },
  "annotations": {
    "summary": "Test alert"
  }
}]'

# View active alerts
curl http://localhost:9093/api/v1/alerts

# View silences
curl http://localhost:9093/api/v1/silences
```

## Custom Metrics

### FastAPI Integration

Add to your FastAPI application:

```python
from monitoring.exporters.fastapi_exporter import (
    PrometheusMiddleware,
    setup_metrics_endpoint,
    track_prediction,
    update_model_metrics
)

app = FastAPI()

# Add middleware
app.add_middleware(PrometheusMiddleware)

# Setup metrics endpoint
setup_metrics_endpoint(app)

# Track predictions
@app.post("/predict")
async def predict(data: dict):
    start_time = time.time()

    result = model.predict(data)
    duration = time.time() - start_time

    track_prediction(
        model_version="1.0.0",
        rul_value=result['rul'],
        confidence=result['confidence'],
        duration=duration,
        success=True
    )

    return result
```

### Custom Metric Types

#### Counter
```python
from prometheus_client import Counter

REQUEST_COUNT = Counter(
    'custom_requests_total',
    'Total requests',
    ['endpoint', 'method']
)

REQUEST_COUNT.labels(endpoint='/predict', method='POST').inc()
```

#### Gauge
```python
from prometheus_client import Gauge

ACTIVE_USERS = Gauge(
    'active_users',
    'Number of active users'
)

ACTIVE_USERS.set(150)
```

#### Histogram
```python
from prometheus_client import Histogram

RESPONSE_TIME = Histogram(
    'response_time_seconds',
    'Response time',
    buckets=(0.1, 0.5, 1.0, 2.0, 5.0)
)

with RESPONSE_TIME.time():
    # Your code here
    pass
```

### PromQL Queries

Common queries for custom dashboards:

```promql
# Request rate
rate(fastapi_requests_total[5m])

# Error rate
sum(rate(fastapi_requests_total{status=~"5.."}[5m]))
/ sum(rate(fastapi_requests_total[5m]))

# 95th percentile response time
histogram_quantile(0.95, rate(fastapi_request_duration_seconds_bucket[5m]))

# Model accuracy trend
avg_over_time(model_prediction_accuracy[1h])

# CPU usage
100 - (avg(rate(node_cpu_seconds_total{mode="idle"}[5m])) * 100)
```

## Troubleshooting

### Common Issues

#### 1. Prometheus Cannot Scrape Targets

**Symptom**: Targets showing as "DOWN" in Prometheus

**Solution**:
```bash
# Check network connectivity
docker network inspect rul-monitoring

# Check target service
curl http://localhost:9100/metrics

# Check Prometheus logs
docker logs rul-prometheus

# Verify configuration
docker exec rul-prometheus promtool check config /etc/prometheus/prometheus.yml
```

#### 2. Grafana Dashboards Not Loading

**Symptom**: Empty dashboards or "No Data"

**Solution**:
```bash
# Check Grafana logs
docker logs rul-grafana

# Verify datasource
curl http://localhost:3000/api/datasources

# Test Prometheus connection
curl http://localhost:9090/api/v1/query?query=up

# Restart Grafana
docker restart rul-grafana
```

#### 3. Alerts Not Firing

**Symptom**: No alerts despite conditions being met

**Solution**:
```bash
# Check alert rules
curl http://localhost:9090/api/v1/rules

# Check AlertManager
curl http://localhost:9093/api/v1/alerts

# Verify AlertManager config
docker exec rul-alertmanager amtool check-config /etc/alertmanager/alertmanager.yml

# Check AlertManager logs
docker logs rul-alertmanager
```

#### 4. High Memory Usage

**Symptom**: Prometheus consuming too much memory

**Solution**:
```bash
# Reduce retention time
# Edit prometheus.yml:
storage.tsdb.retention.time: 15d

# Reduce scrape interval
global.scrape_interval: 30s

# Optimize queries using recording rules
```

#### 5. Model Exporter Not Starting

**Symptom**: Model metrics not available

**Solution**:
```bash
# Check exporter logs
docker logs rul-model-exporter

# Verify database connection
docker exec rul-model-exporter python -c "import psycopg2; psycopg2.connect('postgresql://postgres:postgres@postgres:5432/rul_db')"

# Check environment variables
docker exec rul-model-exporter env | grep DB_

# Restart exporter
docker restart rul-model-exporter
```

### Debugging Commands

```bash
# Check all service status
docker-compose -f docker-compose.monitoring.yml ps

# View all logs
docker-compose -f docker-compose.monitoring.yml logs -f

# Restart all services
docker-compose -f docker-compose.monitoring.yml restart

# Check Prometheus targets
curl http://localhost:9090/api/v1/targets

# Query Prometheus
curl 'http://localhost:9090/api/v1/query?query=up'

# Check metrics endpoint
curl http://localhost:9100/metrics
curl http://localhost:9187/metrics
curl http://localhost:9090/metrics
```

## Maintenance

### Backup Grafana

```bash
# Backup dashboards and configuration
./scripts/backup_grafana.sh

# Backups are stored in:
./backups/grafana_backup_YYYYMMDD_HHMMSS.tar.gz

# Schedule automatic backups (crontab)
0 2 * * * /path/to/monitoring/scripts/backup_grafana.sh
```

### Restore Grafana

```bash
# List available backups
./scripts/restore_grafana.sh --list

# Restore from backup
./scripts/restore_grafana.sh /path/to/backup.tar.gz

# Restore dashboards only
./scripts/restore_grafana.sh --dashboards-only backup.tar.gz

# Force restore without confirmation
./scripts/restore_grafana.sh --force backup.tar.gz
```

### Update Services

```bash
# Pull latest images
docker-compose -f docker-compose.monitoring.yml pull

# Restart with new images
docker-compose -f docker-compose.monitoring.yml up -d

# Clean old images
docker image prune -a
```

### Clean Up Old Data

```bash
# Remove old Prometheus data
docker exec rul-prometheus rm -rf /prometheus/*

# Remove old Grafana data
docker exec rul-grafana rm -rf /var/lib/grafana/grafana.db

# Restart services
docker-compose -f docker-compose.monitoring.yml restart
```

### Performance Tuning

```bash
# Optimize Prometheus storage
# Edit prometheus.yml:
storage.tsdb.min-block-duration: 2h
storage.tsdb.max-block-duration: 24h

# Enable compression
storage.tsdb.compression: true

# Limit concurrent queries
query.max-concurrency: 20
```

## Best Practices

### 1. Metric Naming

- Use consistent naming convention: `component_metric_unit`
- Examples:
  - `fastapi_requests_total`
  - `model_inference_duration_seconds`
  - `database_connections_active`

### 2. Label Usage

- Use labels for dimensions, not values
- Keep cardinality low (< 10 values per label)
- Avoid high-cardinality labels (user IDs, timestamps)

```python
# Good
requests_total{endpoint="/predict", method="POST"}

# Bad (high cardinality)
requests_total{user_id="12345", timestamp="2023-12-01"}
```

### 3. Alert Design

- Set appropriate thresholds based on baselines
- Use `for` clause to avoid flapping
- Include actionable information in annotations
- Group related alerts

### 4. Dashboard Design

- One dashboard per audience (developers, ops, business)
- Use template variables for filtering
- Set appropriate refresh intervals
- Include context and documentation

### 5. Retention Policy

- Keep detailed metrics for 30 days
- Use recording rules for long-term trends
- Consider remote storage for longer retention

### 6. Security

- Change default passwords
- Enable HTTPS
- Use authentication for all services
- Restrict network access
- Encrypt sensitive data

### 7. Monitoring the Monitors

- Alert on Prometheus service down
- Monitor scrape failures
- Track query performance
- Monitor disk usage

## Advanced Topics

### Remote Storage

For long-term storage, configure remote write:

```yaml
# prometheus.yml
remote_write:
  - url: "https://your-remote-storage/api/v1/write"
    basic_auth:
      username: 'prometheus'
      password: 'your-password'
```

### High Availability

For production, run multiple Prometheus instances:

```bash
# Start multiple Prometheus instances
docker-compose -f docker-compose.monitoring.yml \
  --scale prometheus=2 up -d
```

### Federation

For multi-cluster setup:

```yaml
# prometheus.yml
scrape_configs:
  - job_name: 'federate'
    scrape_interval: 15s
    honor_labels: true
    metrics_path: '/federate'
    params:
      'match[]':
        - '{job="prometheus"}'
    static_configs:
      - targets:
        - 'prometheus-1:9090'
        - 'prometheus-2:9090'
```

## Support

For issues and questions:
- Check the troubleshooting section
- Review Prometheus docs: https://prometheus.io/docs/
- Review Grafana docs: https://grafana.com/docs/
- File an issue in the project repository

## License

This monitoring configuration is part of the RUL Prediction System project.
