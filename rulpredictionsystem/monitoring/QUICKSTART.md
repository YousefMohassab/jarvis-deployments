# Quick Start Guide - RUL Monitoring Stack

Get the monitoring stack up and running in 5 minutes!

## Prerequisites

- Docker and Docker Compose installed
- 4GB RAM available
- Ports 3000, 9090, 9093 available

## 1. Start the Stack

```bash
cd monitoring/

# Using docker-compose
docker-compose -f docker-compose.monitoring.yml up -d

# OR using Makefile
make start
```

## 2. Access Dashboards

### Grafana (Visualization)
- URL: http://localhost:3000
- Username: `admin`
- Password: `admin123`
- Change password on first login

### Prometheus (Metrics)
- URL: http://localhost:9090
- No authentication required

### AlertManager (Alerts)
- URL: http://localhost:9093
- No authentication required

## 3. View Pre-configured Dashboards

In Grafana, navigate to Dashboards → Browse:

1. **RUL System Overview**
   - Overall system health
   - Request rate and errors
   - Model accuracy
   - Resource utilization

2. **ML Model Performance**
   - Prediction accuracy
   - Inference latency
   - Feature importance
   - Model drift

3. **API Monitoring**
   - Endpoint performance
   - Response times
   - Error rates
   - Active connections

4. **Infrastructure**
   - CPU and memory usage
   - Disk and network I/O
   - Container stats
   - Database metrics

## 4. Configure Alerts

Edit notification channels in Grafana:

1. Go to Alerting → Contact points
2. Add your email or Slack webhook
3. Test the notification

Or edit `alertmanager/alertmanager.yml` and restart:

```bash
docker restart rul-alertmanager
```

## 5. Integrate with Your Application

Add to your FastAPI app:

```python
from monitoring.exporters.fastapi_exporter import (
    PrometheusMiddleware,
    setup_metrics_endpoint
)

app = FastAPI()
app.add_middleware(PrometheusMiddleware)
setup_metrics_endpoint(app)
```

Restart your app and metrics will be available at `/metrics`

## 6. Verify Everything Works

```bash
# Check all services
make status

# Check health
make health

# View logs
make logs
```

## Common Commands

```bash
# Start
make start

# Stop
make stop

# Restart
make restart

# View logs
make logs

# Backup
make backup

# Health check
make health
```

## Troubleshooting

### Services not starting?

```bash
# Check logs
docker-compose -f docker-compose.monitoring.yml logs

# Check ports
netstat -tulpn | grep -E '3000|9090|9093'
```

### No data in dashboards?

1. Check Prometheus is scraping targets:
   - Go to http://localhost:9090/targets
   - All targets should be "UP"

2. Check datasource in Grafana:
   - Go to Configuration → Data sources
   - Test Prometheus connection

### Alerts not firing?

1. Check alert rules in Prometheus:
   - Go to http://localhost:9090/alerts

2. Check AlertManager:
   - Go to http://localhost:9093

## Next Steps

1. Customize alert thresholds in `prometheus/alerts.yml`
2. Add your notification channels in `alertmanager/alertmanager.yml`
3. Create custom dashboards for your specific needs
4. Set up automated backups with `make backup`
5. Read the full documentation in `README.md`

## Getting Help

- Full documentation: `README.md`
- Prometheus docs: https://prometheus.io/docs/
- Grafana docs: https://grafana.com/docs/

## Need Support?

Check the troubleshooting section in `README.md` or file an issue in the project repository.
