# Monitoring Stack - Quick Reference Card

## 🚀 Instant Start

```bash
cd monitoring/
make start
```

Access at:
- **Grafana**: http://localhost:3000 (admin/admin123)
- **Prometheus**: http://localhost:9090
- **AlertManager**: http://localhost:9093

## 📊 Key Metrics to Watch

### API Health
```promql
# Request rate
rate(fastapi_requests_total[5m])

# Error rate (%)
sum(rate(fastapi_requests_total{status=~"5.."}[5m]))
/ sum(rate(fastapi_requests_total[5m])) * 100

# Response time (p95)
histogram_quantile(0.95, rate(fastapi_request_duration_seconds_bucket[5m]))
```

### Model Performance
```promql
# Current accuracy
model_prediction_accuracy

# Inference time (p95)
histogram_quantile(0.95, rate(model_inference_duration_seconds_bucket[5m]))

# Failed predictions
rate(model_predictions_failed_total[5m])
```

### System Resources
```promql
# CPU usage (%)
100 - (avg(rate(node_cpu_seconds_total{mode="idle"}[5m])) * 100)

# Memory usage (%)
(1 - (node_memory_MemAvailable_bytes / node_memory_MemTotal_bytes)) * 100

# Disk usage (%)
(1 - (node_filesystem_avail_bytes / node_filesystem_size_bytes)) * 100
```

## 🔔 Critical Alert Thresholds

| Alert | Threshold | Action |
|-------|-----------|--------|
| API Response Time | > 2s for 5m | Check app performance |
| Model Accuracy | < 85% for 10m | Review model |
| Error Rate | > 5% for 5m | Check logs |
| CPU Usage | > 85% for 5m | Scale up |
| Memory Usage | > 85% for 5m | Scale up |
| Disk Space | > 80% | Clean up |

## 🛠️ Essential Commands

### Service Management
```bash
make start          # Start all services
make stop           # Stop all services
make restart        # Restart services
make status         # Show status
make logs           # View all logs
```

### Health Checks
```bash
make health         # Run full health check
make targets        # Show Prometheus targets
make alerts         # Show active alerts
```

### Maintenance
```bash
make backup         # Backup Grafana
make restore        # Restore from backup
make clean          # Remove all data (careful!)
make update         # Update Docker images
```

## 📈 Dashboard URLs

1. **System Overview**: http://localhost:3000/d/rul-system-overview
2. **Model Performance**: http://localhost:3000/d/model-performance
3. **API Metrics**: http://localhost:3000/d/api-metrics
4. **Infrastructure**: http://localhost:3000/d/infrastructure

## 🔌 Integration Snippet

### FastAPI
```python
from monitoring.exporters.fastapi_exporter import (
    PrometheusMiddleware,
    setup_metrics_endpoint,
    track_prediction
)

app = FastAPI()
app.add_middleware(PrometheusMiddleware)
setup_metrics_endpoint(app)

@app.post("/predict")
async def predict(data: dict):
    start = time.time()
    result = model.predict(data)

    track_prediction(
        model_version="1.0.0",
        rul_value=result['rul'],
        confidence=result['confidence'],
        duration=time.time() - start,
        success=True
    )
    return result
```

## 🔧 Common Troubleshooting

### Service Not Starting
```bash
# Check logs
docker logs rul-prometheus
docker logs rul-grafana

# Check ports
netstat -tulpn | grep -E '3000|9090'

# Restart service
docker restart rul-prometheus
```

### No Data in Dashboards
```bash
# 1. Check Prometheus targets
curl http://localhost:9090/api/v1/targets

# 2. Test datasource in Grafana
# Go to: Configuration → Data sources → Test

# 3. Verify metrics are being exposed
curl http://localhost:9100/metrics
```

### Alerts Not Firing
```bash
# Check alert rules
curl http://localhost:9090/api/v1/rules

# Check AlertManager
curl http://localhost:9093/api/v1/alerts

# Send test alert
curl -X POST http://localhost:9093/api/v1/alerts -d '[{
  "labels": {"alertname":"Test","severity":"warning"},
  "annotations": {"summary":"Test alert"}
}]'
```

## 📊 Custom Metrics Examples

### Counter (Events)
```python
from prometheus_client import Counter

REQUESTS = Counter('my_requests_total', 'Total requests', ['endpoint'])
REQUESTS.labels(endpoint='/predict').inc()
```

### Gauge (Current Value)
```python
from prometheus_client import Gauge

ACTIVE_USERS = Gauge('active_users', 'Active users')
ACTIVE_USERS.set(150)
```

### Histogram (Distribution)
```python
from prometheus_client import Histogram

LATENCY = Histogram('request_latency_seconds', 'Request latency')
with LATENCY.time():
    # Your code here
    pass
```

## 🔐 Security Checklist

- [ ] Change Grafana admin password
- [ ] Configure SMTP for alerts
- [ ] Set up Slack/PagerDuty webhooks
- [ ] Enable HTTPS (if public)
- [ ] Restrict network access
- [ ] Set strong database passwords
- [ ] Enable authentication on all services
- [ ] Regular backups scheduled

## 📞 Quick Links

- **Documentation**: `README.md`
- **Quick Start**: `QUICKSTART.md`
- **Architecture**: `STRUCTURE.md`
- **Prometheus Docs**: https://prometheus.io/docs/
- **Grafana Docs**: https://grafana.com/docs/
- **PromQL Tutorial**: https://prometheus.io/docs/prometheus/latest/querying/basics/

## 💾 Backup & Restore

### Backup
```bash
# Manual backup
./scripts/backup_grafana.sh

# Automated (crontab)
0 2 * * * /path/to/monitoring/scripts/backup_grafana.sh
```

### Restore
```bash
# List backups
./scripts/restore_grafana.sh --list

# Restore specific backup
./scripts/restore_grafana.sh /path/to/backup.tar.gz
```

## 🎯 Performance Tips

1. **Optimize Queries**: Use recording rules for expensive queries
2. **Reduce Cardinality**: Limit unique label values
3. **Adjust Retention**: Balance storage vs. history needs
4. **Use Caching**: Enable Grafana query caching
5. **Horizontal Scaling**: Run multiple Prometheus instances

## 📝 Important Notes

- Default retention: 30 days
- Metrics scrape interval: 15s
- Alert evaluation: 30s
- Grafana refresh: 30s (configurable per dashboard)
- Backup retention: 30 days

## 🆘 Emergency Contacts

When alerts fire:
1. Check relevant dashboard
2. Review recent changes (git log)
3. Check service logs
4. Review alert history in AlertManager
5. Escalate if unresolved in 30 minutes

---

**Quick Help**: `make help`
**Full Docs**: Open `README.md`
**Status**: Run `./scripts/health_check.sh`
