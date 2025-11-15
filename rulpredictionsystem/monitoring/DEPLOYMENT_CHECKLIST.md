# Monitoring Stack Deployment Checklist

## Pre-Deployment

### System Requirements
- [ ] Docker 20.10+ installed
- [ ] Docker Compose 2.0+ installed
- [ ] Python 3.10+ installed (for custom exporters)
- [ ] Minimum 4GB RAM available
- [ ] Minimum 20GB disk space available
- [ ] Required ports available (3000, 9090, 9093, 9100, 9187)

### Configuration
- [ ] Copy `.env.example` to `.env`
- [ ] Update database credentials in `.env`
- [ ] Configure SMTP settings for email alerts
- [ ] Add Slack webhook URL (if using)
- [ ] Add PagerDuty service key (if using)
- [ ] Review and adjust alert thresholds in `prometheus/alerts.yml`
- [ ] Review Prometheus retention settings

## Deployment

### Initial Setup
- [ ] Navigate to monitoring directory
- [ ] Make scripts executable: `chmod +x scripts/*.sh`
- [ ] Review `docker-compose.monitoring.yml`
- [ ] Create necessary Docker networks: `docker network create rul-network`
- [ ] Pull all Docker images: `docker-compose -f docker-compose.monitoring.yml pull`

### Start Services
- [ ] Start monitoring stack: `make start` or `docker-compose -f docker-compose.monitoring.yml up -d`
- [ ] Wait 30 seconds for services to initialize
- [ ] Check all services are running: `make status`
- [ ] Run health checks: `./scripts/health_check.sh`

## Post-Deployment

### Verification
- [ ] Access Grafana at http://localhost:3000
- [ ] Login with default credentials (admin/admin123)
- [ ] Change default admin password
- [ ] Verify Prometheus datasource is configured
- [ ] Check all 4 dashboards are loaded
- [ ] Access Prometheus at http://localhost:9090
- [ ] Verify all targets are UP in Prometheus
- [ ] Access AlertManager at http://localhost:9093
- [ ] Send test alert and verify notification

### Security
- [ ] Change all default passwords
- [ ] Configure firewall rules
- [ ] Enable HTTPS/TLS (if public-facing)
- [ ] Set up user authentication
- [ ] Configure network policies
- [ ] Enable audit logging
- [ ] Review and restrict API access

### Integration
- [ ] Add PrometheusMiddleware to FastAPI application
- [ ] Expose /metrics endpoint on FastAPI
- [ ] Verify application metrics appear in Prometheus
- [ ] Install exporters: `sudo ./scripts/install_exporters.sh`
- [ ] Verify all exporters are running
- [ ] Test custom metrics collection

### Alerts
- [ ] Verify alert rules loaded: `make rules`
- [ ] Configure email notifications in AlertManager
- [ ] Configure Slack notifications (if using)
- [ ] Test alert routing
- [ ] Set up on-call rotations (if using PagerDuty)
- [ ] Document escalation procedures

### Monitoring
- [ ] Review all dashboards
- [ ] Set up dashboard favorites
- [ ] Create custom dashboards (if needed)
- [ ] Configure dashboard refresh intervals
- [ ] Set up dashboard snapshots
- [ ] Share dashboard links with team

### Backup
- [ ] Run initial backup: `make backup`
- [ ] Verify backup created in `backups/`
- [ ] Test restore procedure: `./scripts/restore_grafana.sh --list`
- [ ] Schedule automated backups via cron
- [ ] Configure remote backup storage (S3/SCP)
- [ ] Document backup retention policy

## Ongoing Maintenance

### Daily
- [ ] Check system health: `make health`
- [ ] Review active alerts: `make alerts`
- [ ] Monitor resource usage

### Weekly
- [ ] Review dashboard metrics
- [ ] Check for service updates
- [ ] Review alert history
- [ ] Verify backup success

### Monthly
- [ ] Update Docker images: `make update`
- [ ] Review and optimize alert rules
- [ ] Clean up old data if needed
- [ ] Review and update documentation
- [ ] Test disaster recovery procedures

## Troubleshooting

### Common Issues
- [ ] Document solutions to common problems
- [ ] Create runbooks for frequent issues
- [ ] Maintain troubleshooting knowledge base

### Emergency Procedures
- [ ] Document rollback procedures
- [ ] Create incident response plan
- [ ] Set up emergency contacts
- [ ] Test recovery procedures

## Documentation

### Team Training
- [ ] Share dashboard URLs with team
- [ ] Train team on Grafana usage
- [ ] Document alert response procedures
- [ ] Share PromQL query examples
- [ ] Conduct monitoring walkthrough

### Documentation Updates
- [ ] Update README with custom configurations
- [ ] Document custom metrics
- [ ] Update alert descriptions
- [ ] Document integration procedures
- [ ] Maintain change log

## Performance Optimization

### Initial Baseline
- [ ] Record initial metrics
- [ ] Document query performance
- [ ] Note resource usage
- [ ] Establish SLOs/SLIs

### Optimization
- [ ] Review slow queries
- [ ] Optimize dashboard queries
- [ ] Configure recording rules
- [ ] Adjust scrape intervals if needed
- [ ] Review cardinality of metrics

## Compliance & Security

### Access Control
- [ ] Set up role-based access
- [ ] Configure API authentication
- [ ] Enable audit logging
- [ ] Review access logs regularly

### Data Retention
- [ ] Configure retention policies
- [ ] Set up data archival
- [ ] Document data lifecycle
- [ ] Implement GDPR compliance (if applicable)

## Sign-Off

### Deployment Team
- [ ] Development Lead: _________________ Date: _______
- [ ] DevOps Lead: ____________________ Date: _______
- [ ] Security Lead: ___________________ Date: _______
- [ ] Operations Lead: _________________ Date: _______

### Deployment Status
- [ ] Pre-deployment checks completed
- [ ] Deployment successful
- [ ] Post-deployment verification passed
- [ ] Team training completed
- [ ] Documentation updated
- [ ] Monitoring operational

**Deployment Date**: ______________
**Deployed By**: ______________
**Environment**: [ ] Development [ ] Staging [ ] Production

---

## Notes

(Add any deployment-specific notes here)

