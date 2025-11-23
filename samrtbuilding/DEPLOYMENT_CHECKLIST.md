# Smart Building Energy Management System - Deployment Checklist

## Pre-Deployment Checklist

### Infrastructure Setup

#### Database (PostgreSQL + TimescaleDB)
- [ ] PostgreSQL 15+ installed
- [ ] TimescaleDB extension enabled
- [ ] Database created with proper character encoding (UTF-8)
- [ ] Database user created with appropriate permissions
- [ ] Connection pooling configured (min: 10, max: 100)
- [ ] SSL/TLS enabled for database connections
- [ ] Backup strategy configured (daily backups, 30-day retention)
- [ ] Point-in-time recovery (PITR) enabled
- [ ] Read replicas configured (if needed)
- [ ] Database monitoring enabled (pg_stat_statements, etc.)
- [ ] Retention policies configured for time-series data
- [ ] Compression policies enabled
- [ ] Row-level security policies tested

#### Redis Cache
- [ ] Redis 7+ installed
- [ ] Persistence enabled (AOF + RDB)
- [ ] Password authentication configured
- [ ] TLS encryption enabled
- [ ] Memory limits configured
- [ ] Eviction policy set (allkeys-lru recommended)
- [ ] Redis monitoring enabled
- [ ] Backup strategy configured

#### MQTT Broker
- [ ] MQTT broker installed (Mosquitto or EMQX)
- [ ] TLS/SSL certificates configured
- [ ] Client authentication enabled
- [ ] ACL (Access Control List) configured
- [ ] WebSocket support enabled (port 9001)
- [ ] Message persistence enabled
- [ ] Retained messages configured
- [ ] Monitoring and logging enabled
- [ ] Cluster setup (if needed)

### Application Configuration

#### Environment Variables
```bash
# Database
DB_HOST=postgres
DB_PORT=5432
DB_NAME=sbems
DB_USER=sbems_user
DB_PASSWORD=<strong-password-here>
DB_SSL=true
DB_POOL_MIN=10
DB_POOL_MAX=100

# Redis
REDIS_HOST=redis
REDIS_PORT=6379
REDIS_PASSWORD=<strong-password-here>
REDIS_TLS=true
REDIS_DB=0

# MQTT
MQTT_HOST=mqtt
MQTT_PORT=8883
MQTT_USERNAME=sbems
MQTT_PASSWORD=<strong-password-here>
MQTT_TLS=true

# JWT
JWT_SECRET=<cryptographically-secure-secret>
JWT_EXPIRES_IN=15m
REFRESH_TOKEN_SECRET=<different-secure-secret>
REFRESH_TOKEN_EXPIRES_IN=7d

# API
API_PORT=3000
NODE_ENV=production
LOG_LEVEL=info
CORS_ORIGIN=https://app.sbems.com

# WebSocket
WS_PORT=3001
WS_PING_INTERVAL=30000
WS_PING_TIMEOUT=5000

# Email (SendGrid example)
SMTP_HOST=smtp.sendgrid.net
SMTP_PORT=587
SMTP_USER=apikey
SMTP_PASSWORD=<sendgrid-api-key>
EMAIL_FROM=noreply@sbems.com

# Monitoring
SENTRY_DSN=<sentry-dsn>
NEW_RELIC_KEY=<new-relic-key>

# Rate Limiting
RATE_LIMIT_WINDOW_MS=60000
RATE_LIMIT_MAX_REQUESTS=100
```

#### Security Checklist
- [ ] All secrets stored in environment variables (never in code)
- [ ] Strong passwords generated (min 32 characters, random)
- [ ] JWT secret is cryptographically secure (256-bit)
- [ ] HTTPS/TLS enabled for all endpoints
- [ ] SSL certificates obtained and configured
- [ ] CORS properly configured with specific origins
- [ ] Rate limiting enabled on all API endpoints
- [ ] Request validation middleware enabled
- [ ] Input sanitization enabled
- [ ] SQL injection protection verified
- [ ] XSS protection headers configured
- [ ] CSRF protection implemented
- [ ] Security headers configured (Helmet.js)
- [ ] File upload restrictions configured
- [ ] API authentication tested
- [ ] Role-based access control (RBAC) verified
- [ ] Audit logging enabled
- [ ] Error messages don't leak sensitive information

### Docker & Container Setup

#### Docker Images
- [ ] Dockerfile optimized (multi-stage builds)
- [ ] Base images from trusted sources
- [ ] Non-root user configured in containers
- [ ] Health checks defined
- [ ] Resource limits configured (CPU, memory)
- [ ] Images scanned for vulnerabilities
- [ ] `.dockerignore` configured properly
- [ ] Build process tested locally
- [ ] Image size optimized (<500MB for Node.js apps)

#### Docker Compose
- [ ] `docker-compose.yml` configured for production
- [ ] Volume mounts configured for persistence
- [ ] Network isolation configured
- [ ] Restart policies set (unless-stopped)
- [ ] Health checks configured
- [ ] Logging drivers configured
- [ ] Resource limits set
- [ ] Secrets management configured
- [ ] Environment variable validation

### Coolify Deployment

#### Coolify Configuration
- [ ] Coolify instance accessible and updated
- [ ] Project created in Coolify
- [ ] Repository connected (GitHub/GitLab)
- [ ] Branch configured (main/production)
- [ ] Build command configured
- [ ] Environment variables imported
- [ ] Domain names configured
- [ ] SSL certificates configured (Let's Encrypt)
- [ ] Health check endpoint configured
- [ ] Deployment strategy selected (rolling/blue-green)
- [ ] Auto-deploy enabled (if desired)
- [ ] Backup schedule configured
- [ ] Monitoring alerts configured

#### Domain & DNS
- [ ] Domain purchased and DNS configured
- [ ] A records pointing to server IP
- [ ] CNAME records for subdomains
  - [ ] `api.sbems.com` → API server
  - [ ] `app.sbems.com` → Frontend
  - [ ] `ws.sbems.com` → WebSocket server
- [ ] SSL certificates obtained (Let's Encrypt)
- [ ] Certificate auto-renewal configured
- [ ] DNS propagation verified

### Integration Setup

#### BACnet/Modbus Integration
- [ ] Network connectivity to HVAC devices verified
- [ ] Firewall rules configured
  - [ ] UDP 47808 (BACnet/IP)
  - [ ] TCP 502 (Modbus TCP)
- [ ] Device discovery tested
- [ ] Point mappings configured
- [ ] Polling intervals configured
- [ ] Error handling tested
- [ ] Connection timeout configured
- [ ] Retry logic implemented
- [ ] Device credentials secured

#### Siemens Thermostat API
- [ ] API credentials obtained
- [ ] API endpoint accessible
- [ ] Authentication tested
- [ ] Rate limits understood
- [ ] Webhook configured (if available)
- [ ] Error handling implemented
- [ ] Device registration completed

### Monitoring & Logging

#### Application Monitoring
- [ ] Health check endpoints configured
  - [ ] `/health` - Basic health check
  - [ ] `/ready` - Readiness probe
  - [ ] `/alive` - Liveness probe
- [ ] Prometheus metrics exposed at `/metrics`
- [ ] Custom metrics defined
  - [ ] Request duration
  - [ ] Error rates
  - [ ] Energy readings processed
  - [ ] Active connections
- [ ] Grafana dashboards configured
- [ ] Alert rules configured
  - [ ] High error rate
  - [ ] High memory usage
  - [ ] Database connection failures
  - [ ] MQTT connection lost
- [ ] APM tool configured (New Relic, DataDog, etc.)
- [ ] Error tracking configured (Sentry, Rollbar)

#### Logging
- [ ] Structured logging implemented (JSON format)
- [ ] Log levels configured (info, warn, error)
- [ ] Log rotation configured
- [ ] Centralized logging setup (ELK, Loki, CloudWatch)
- [ ] Log retention policy configured
- [ ] Sensitive data redacted from logs
- [ ] Request/response logging configured
- [ ] Audit log configured for security events

### Performance Optimization

#### Caching Strategy
- [ ] Redis caching implemented for:
  - [ ] User sessions
  - [ ] API responses
  - [ ] Building configurations
  - [ ] Recent sensor readings
- [ ] Cache TTL configured appropriately
- [ ] Cache invalidation strategy implemented
- [ ] Cache warming for predictable queries
- [ ] CDN configured for static assets

#### Database Optimization
- [ ] Indexes created on frequently queried columns
- [ ] Query performance analyzed (EXPLAIN)
- [ ] N+1 queries eliminated
- [ ] Connection pooling configured
- [ ] Prepared statements used
- [ ] Database vacuum scheduled
- [ ] Statistics updated regularly

### Testing

#### Unit Tests
- [ ] Core business logic tested
- [ ] Services tested with mocks
- [ ] Utility functions tested
- [ ] Test coverage >80%
- [ ] CI/CD running tests automatically

#### Integration Tests
- [ ] Database operations tested
- [ ] MQTT communication tested
- [ ] BACnet/Modbus integration tested
- [ ] API endpoints tested
- [ ] WebSocket connections tested
- [ ] Authentication flow tested

#### Load Testing
- [ ] API load tested (JMeter, k6, Artillery)
- [ ] WebSocket connections stress tested
- [ ] Database performance under load tested
- [ ] MQTT broker load tested
- [ ] Bottlenecks identified and addressed
- [ ] Auto-scaling thresholds configured

#### Security Testing
- [ ] SQL injection testing
- [ ] XSS testing
- [ ] CSRF testing
- [ ] Authentication bypass testing
- [ ] Authorization testing
- [ ] Rate limiting testing
- [ ] Vulnerability scanning (OWASP ZAP, Snyk)

### Backup & Disaster Recovery

#### Backup Strategy
- [ ] Daily database backups configured
- [ ] Backup retention: 30 days
- [ ] Backups stored off-site (S3, GCS, Azure Blob)
- [ ] Backup encryption enabled
- [ ] Backup restoration tested monthly
- [ ] Configuration backups included
- [ ] Redis snapshot backups configured
- [ ] MQTT persistent queue backed up

#### Disaster Recovery Plan
- [ ] RTO (Recovery Time Objective) defined: 1 hour
- [ ] RPO (Recovery Point Objective) defined: 15 minutes
- [ ] Restoration procedure documented
- [ ] Failover procedure documented
- [ ] DR drill scheduled quarterly
- [ ] Contact list for incidents maintained
- [ ] Runbook created for common issues

### Documentation

#### Technical Documentation
- [ ] Architecture document completed
- [ ] Database schema documented
- [ ] API documentation completed
- [ ] Integration guides written
- [ ] Deployment guide created
- [ ] Troubleshooting guide created
- [ ] Code commented adequately
- [ ] README files in all repos

#### Operational Documentation
- [ ] Runbook for common operations
- [ ] Incident response procedures
- [ ] Escalation procedures
- [ ] Maintenance procedures
- [ ] Backup/restore procedures
- [ ] Monitoring alert responses
- [ ] On-call rotation schedule

### Legal & Compliance

#### Data Privacy
- [ ] GDPR compliance verified (if applicable)
- [ ] Data retention policies defined
- [ ] User data deletion procedure
- [ ] Privacy policy created
- [ ] Terms of service created
- [ ] Cookie consent implemented
- [ ] Data processing agreements signed

#### Security Compliance
- [ ] Security audit completed
- [ ] Penetration testing completed
- [ ] Vulnerability remediation plan
- [ ] Incident response plan created
- [ ] Security training completed
- [ ] Compliance certifications obtained (if required)

---

## Deployment Steps

### 1. Pre-Deployment Verification

```bash
# Verify all environment variables
./scripts/check-env.sh

# Run all tests
npm run test

# Build production images
docker-compose -f docker-compose.prod.yml build

# Verify database migrations
npm run db:migrate:check

# Security scan
npm audit
docker scan sbems-api:latest
```

### 2. Database Migration

```bash
# Backup existing database (if upgrading)
./scripts/backup-database.sh

# Run migrations
npm run db:migrate

# Verify migrations
npm run db:migrate:status

# Seed initial data (if new deployment)
npm run db:seed
```

### 3. Deploy to Coolify

```bash
# Push code to repository
git push origin main

# Coolify will auto-deploy or manual deploy:
# 1. Go to Coolify dashboard
# 2. Select project
# 3. Click "Deploy"
# 4. Monitor deployment logs
# 5. Verify health checks pass
```

### 4. Post-Deployment Verification

```bash
# Health checks
curl https://api.sbems.com/health
curl https://api.sbems.com/ready

# Smoke tests
./scripts/smoke-test.sh

# Monitor logs
docker logs -f sbems-api

# Check metrics
curl https://api.sbems.com/metrics

# Verify WebSocket
./scripts/test-websocket.sh

# Test MQTT connection
./scripts/test-mqtt.sh

# Test database connection
./scripts/test-database.sh
```

### 5. Integration Verification

```bash
# Test BACnet connectivity
./scripts/test-bacnet.sh

# Test Modbus connectivity
./scripts/test-modbus.sh

# Test Siemens API
./scripts/test-siemens-api.sh

# Verify data collection
# Check that sensor readings are being stored

# Verify control commands
# Test sending a setpoint change
```

### 6. User Acceptance Testing

- [ ] Admin user can log in
- [ ] Building data loads correctly
- [ ] Real-time data updates in dashboard
- [ ] HVAC controls work correctly
- [ ] Alerts are generated and displayed
- [ ] Schedules can be created and edited
- [ ] Analytics data displays correctly
- [ ] Energy savings calculations are accurate
- [ ] Mobile responsiveness verified
- [ ] Cross-browser compatibility verified

### 7. Performance Monitoring

```bash
# Monitor system resources
htop
docker stats

# Check database performance
./scripts/check-db-performance.sh

# Monitor API response times
# Check Grafana dashboard

# Monitor error rates
# Check Sentry dashboard

# Check MQTT broker stats
./scripts/check-mqtt-stats.sh
```

---

## Rollback Procedure

If deployment fails or critical issues are discovered:

### 1. Immediate Actions

```bash
# Stop new deployment
coolify stop

# Rollback to previous version
coolify rollback

# Or manually rollback
git revert <commit-hash>
git push origin main

# Restore database if needed
./scripts/restore-database.sh <backup-file>
```

### 2. Incident Communication

- [ ] Notify team via Slack/Teams
- [ ] Update status page
- [ ] Notify affected users (if necessary)
- [ ] Document incident details

### 3. Post-Mortem

- [ ] Conduct incident review
- [ ] Document root cause
- [ ] Create action items
- [ ] Update deployment checklist
- [ ] Update runbooks

---

## Maintenance Schedule

### Daily
- [ ] Check health dashboards
- [ ] Review error logs
- [ ] Monitor disk space
- [ ] Check backup completion

### Weekly
- [ ] Review performance metrics
- [ ] Check for security updates
- [ ] Review alert thresholds
- [ ] Database maintenance (vacuum, analyze)

### Monthly
- [ ] Test backup restoration
- [ ] Review and rotate logs
- [ ] Security vulnerability scan
- [ ] Update dependencies
- [ ] Review user feedback
- [ ] Capacity planning review

### Quarterly
- [ ] Disaster recovery drill
- [ ] Security audit
- [ ] Performance optimization review
- [ ] Documentation review
- [ ] Training for new features

### Annually
- [ ] SSL certificate renewal
- [ ] Major version upgrades
- [ ] Architecture review
- [ ] Compliance audit
- [ ] Cost optimization review

---

## Emergency Contacts

```yaml
On-Call Rotation:
  Primary: [Name, Phone, Email]
  Secondary: [Name, Phone, Email]

Team Leads:
  Backend: [Name, Contact]
  Frontend: [Name, Contact]
  DevOps: [Name, Contact]

External Contacts:
  HVAC Vendor: [Trane Support, Contact]
  Thermostat Vendor: [Siemens Support, Contact]
  Cloud Provider: [AWS/Azure/GCP Support]
  Database Support: [PostgreSQL Expert]

Escalation:
  Level 1: Team Lead
  Level 2: Engineering Manager
  Level 3: CTO
```

---

## Success Metrics

### Technical Metrics
- [ ] API response time <200ms (p95)
- [ ] Error rate <0.1%
- [ ] Uptime >99.9%
- [ ] Database query time <100ms (p95)
- [ ] WebSocket latency <50ms
- [ ] MQTT message delivery >99.9%

### Business Metrics
- [ ] Energy savings >5% compared to baseline
- [ ] User satisfaction score >4.0/5.0
- [ ] Alert response time <5 minutes
- [ ] System adoption rate >80%
- [ ] ROI positive within 12 months

---

## Support & Maintenance

### Issue Tracking
- Production issues: [Jira/GitHub Issues link]
- Feature requests: [Product board link]
- Security issues: security@sbems.com

### Documentation
- Technical docs: https://docs.sbems.com
- API docs: https://api.sbems.com/docs
- User guides: https://help.sbems.com

### Monitoring Dashboards
- System health: [Grafana link]
- Application metrics: [New Relic/DataDog link]
- Error tracking: [Sentry link]
- Status page: https://status.sbems.com

---

## Sign-Off

Deployment completed by: _____________________ Date: __________

Verified by: _____________________ Date: __________

Approved by: _____________________ Date: __________

Notes:
_________________________________________________________________
_________________________________________________________________
_________________________________________________________________
