# Container Architecture - RUL Prediction System

This document describes the detailed container architecture, design decisions, and best practices for the RUL prediction system.

## Table of Contents

- [Overview](#overview)
- [Container Design](#container-design)
- [Service Dependencies](#service-dependencies)
- [Network Topology](#network-topology)
- [Volume Management](#volume-management)
- [Resource Allocation](#resource-allocation)
- [Security Architecture](#security-architecture)
- [Monitoring Strategy](#monitoring-strategy)
- [Scaling Strategy](#scaling-strategy)
- [Disaster Recovery](#disaster-recovery)

## Overview

The RUL prediction system is containerized using Docker with orchestration support for both Docker Compose and Kubernetes. The architecture follows microservices principles with clear separation of concerns.

### Design Principles

1. **Separation of Concerns**: Each service has a single responsibility
2. **Scalability**: Services can scale independently
3. **Reliability**: Health checks and auto-recovery
4. **Security**: Non-root users, network isolation, secrets management
5. **Observability**: Comprehensive logging and metrics
6. **Maintainability**: Clear documentation and configuration

### Technology Stack

- **Containerization**: Docker 24.0+
- **Orchestration**: Docker Compose, Kubernetes
- **Base Images**: Alpine Linux (minimal), Debian Slim (compatibility)
- **Languages**: Python 3.10, Node.js 18
- **Databases**: PostgreSQL 15, Redis 7
- **Monitoring**: Prometheus, Grafana

## Container Design

### Multi-Stage Builds

All images use multi-stage builds to optimize size and security:

```
┌─────────────────┐
│  Builder Stage  │  ← Compile, install dependencies
└────────┬────────┘
         │
    Copy artifacts
         │
┌────────▼────────┐
│  Runtime Stage  │  ← Minimal runtime, no build tools
└─────────────────┘
```

**Benefits**:
- Smaller image size (50-70% reduction)
- Faster deployment
- Reduced attack surface
- No build tools in production

### Image Hierarchy

```
python:3.10-slim (base)
    ├── rul-prediction-api
    ├── rul-prediction-training
    └── apache/airflow:2.7.3
            └── rul-prediction-airflow

node:18-alpine (base)
    └── build stage
            └── nginx:1.25-alpine
                    └── rul-prediction-dashboard

Official Images (unchanged)
    ├── postgres:15-alpine
    ├── redis:7-alpine
    ├── prom/prometheus:v2.48.0
    └── grafana/grafana:10.2.2
```

### Non-Root Users

All custom containers run as non-root users:

| Container | User | UID | GID |
|-----------|------|-----|-----|
| API | appuser | 1000 | 1000 |
| Dashboard | nginx | 101 | 101 |
| Training | mluser | 1000 | 1000 |
| Airflow | airflow | 50000 | 0 |

**Security Benefits**:
- Container escape limited
- File system protection
- Privilege escalation prevention

## Service Dependencies

### Dependency Graph

```
┌──────────────┐
│  Dashboard   │
└──────┬───────┘
       │
       ├──────────────────┐
       │                  │
┌──────▼───────┐   ┌──────▼─────┐
│     API      │   │  Grafana   │
└──────┬───────┘   └──────┬─────┘
       │                  │
       ├─────────┬────────┼─────────┐
       │         │        │         │
┌──────▼─────┐ ┌▼────────▼┐  ┌─────▼──────┐
│ PostgreSQL │ │   Redis   │  │ Prometheus │
└────────────┘ └───────────┘  └────────────┘
       │         │
       ├─────────┴────────────────┐
       │                          │
┌──────▼─────────┐        ┌───────▼────────┐
│    Airflow     │        │    Flower      │
│   Webserver    │        │ (Monitoring)   │
└────────────────┘        └────────────────┘
       │
       ├─────────────┬─────────────┐
       │             │             │
┌──────▼─────┐ ┌────▼──────┐ ┌────▼──────┐
│  Scheduler │ │  Worker   │ │  Worker   │
└────────────┘ └───────────┘ └───────────┘
```

### Startup Order

Services start in dependency order using health checks:

1. **Infrastructure Layer** (independent)
   - PostgreSQL
   - Redis

2. **Application Layer** (depends on infrastructure)
   - API (waits for postgres, redis)
   - Airflow Init (waits for postgres, redis)

3. **Orchestration Layer** (depends on application)
   - Airflow Webserver (waits for init)
   - Airflow Scheduler (waits for init)
   - Airflow Worker (waits for init)

4. **Presentation Layer** (depends on application)
   - Dashboard (waits for API)

5. **Monitoring Layer** (independent or soft dependency)
   - Prometheus
   - Grafana (waits for prometheus)

### Health Check Configuration

```yaml
healthcheck:
  test: ["CMD", "curl", "-f", "http://localhost:8000/health"]
  interval: 30s      # Check every 30 seconds
  timeout: 10s       # Timeout after 10 seconds
  retries: 3         # 3 failed checks = unhealthy
  start_period: 40s  # Grace period on startup
```

## Network Topology

### Network Segmentation

```
┌─────────────────────────────────────────────────────────┐
│                      Internet                           │
└────────────────────────┬────────────────────────────────┘
                         │
┌────────────────────────▼────────────────────────────────┐
│                  Frontend Network                       │
│  ┌─────────────┐              ┌────────────┐          │
│  │  Dashboard  │◄────────────►│    API     │          │
│  └─────────────┘              └─────┬──────┘          │
└────────────────────────────────────┼──────────────────┘
                                     │
┌────────────────────────────────────▼──────────────────┐
│                  Backend Network                       │
│  ┌──────────┐  ┌──────────┐  ┌────────────┐          │
│  │PostgreSQL│  │  Redis   │  │  Airflow   │          │
│  └──────────┘  └──────────┘  └────────────┘          │
└────────────────────────────────────┬──────────────────┘
                                     │
┌────────────────────────────────────▼──────────────────┐
│                Monitoring Network                      │
│  ┌──────────────┐         ┌──────────────┐           │
│  │  Prometheus  │◄───────►│   Grafana    │           │
│  └──────────────┘         └──────────────┘           │
└────────────────────────────────────────────────────────┘
```

### Network Configuration

```yaml
networks:
  frontend:
    driver: bridge
    ipam:
      config:
        - subnet: 172.20.0.0/16
    driver_opts:
      com.docker.network.bridge.name: rul-frontend

  backend:
    driver: bridge
    ipam:
      config:
        - subnet: 172.21.0.0/16
    internal: true  # No external access

  monitoring:
    driver: bridge
    ipam:
      config:
        - subnet: 172.22.0.0/16
```

### Network Security

1. **Isolation**: Backend network is internal-only
2. **Segmentation**: Services only join necessary networks
3. **Firewall**: Host firewall restricts external access
4. **TLS**: All inter-service communication encrypted (production)

## Volume Management

### Volume Types

```
┌──────────────────────────────────────────────────────┐
│                   Host Machine                       │
│                                                      │
│  ┌────────────────────────────────────────────┐    │
│  │        Named Volumes (managed)             │    │
│  │                                            │    │
│  │  postgres_data     ←  PostgreSQL data     │    │
│  │  redis_data        ←  Redis persistence   │    │
│  │  prometheus_data   ←  Metrics storage     │    │
│  │  grafana_data      ←  Dashboards          │    │
│  │  airflow_logs      ←  Execution logs      │    │
│  │  model_artifacts   ←  ML models           │    │
│  └────────────────────────────────────────────┘    │
│                                                      │
│  ┌────────────────────────────────────────────┐    │
│  │        Bind Mounts (development)           │    │
│  │                                            │    │
│  │  ./airflow/dags    →  DAG files           │    │
│  │  ./dashboard/src   →  React source        │    │
│  │  ./logs            →  Application logs    │    │
│  └────────────────────────────────────────────┘    │
└──────────────────────────────────────────────────────┘
```

### Volume Lifecycle

| Volume | Persistence | Backup | Size | Cleanup |
|--------|-------------|--------|------|---------|
| postgres_data | Persistent | Daily | ~10GB | Manual |
| redis_data | Persistent | Daily | ~2GB | Manual |
| airflow_logs | Persistent | Weekly | ~5GB | Auto (30d) |
| prometheus_data | Persistent | Weekly | ~10GB | Auto (30d) |
| grafana_data | Persistent | Weekly | ~1GB | Manual |
| model_artifacts | Persistent | Daily | ~5GB | Manual |
| training_data | Ephemeral | No | ~50GB | Auto |

### Backup Strategy

1. **Database Backups**
   - PostgreSQL: pg_dump daily
   - Redis: RDB + AOF snapshots
   - Retention: 30 days

2. **Volume Backups**
   - Docker volume export
   - Compressed tar archives
   - Off-site storage (S3)

3. **Configuration Backups**
   - Git repository
   - Version controlled
   - Tagged releases

## Resource Allocation

### Resource Limits

| Service | CPU Request | CPU Limit | Memory Request | Memory Limit | Priority |
|---------|-------------|-----------|----------------|--------------|----------|
| API | 500m | 2000m | 512Mi | 1Gi | High |
| Dashboard | 100m | 500m | 128Mi | 256Mi | Medium |
| PostgreSQL | 1000m | 2000m | 1Gi | 2Gi | Critical |
| Redis | 500m | 1000m | 256Mi | 512Mi | High |
| Airflow Web | 500m | 2000m | 1Gi | 2Gi | Medium |
| Airflow Scheduler | 500m | 2000m | 1Gi | 2Gi | Critical |
| Airflow Worker | 1000m | 4000m | 2Gi | 4Gi | High |
| Prometheus | 500m | 2000m | 1Gi | 2Gi | Medium |
| Grafana | 250m | 1000m | 512Mi | 1Gi | Low |

### Resource Calculation

**Total Minimum** (development):
- CPU: 5.85 cores
- Memory: 9.4GB

**Total Recommended** (production):
- CPU: 18 cores
- Memory: 18.5GB

**With Overhead** (20%):
- CPU: 22 cores
- Memory: 22GB

### Auto-Scaling

Horizontal scaling supported for:
- API (3-10 instances)
- Airflow Workers (3-20 instances)
- Dashboard (2-5 instances)

## Security Architecture

### Security Layers

```
┌─────────────────────────────────────────────────────┐
│  Layer 1: Network Security                          │
│  - Firewall rules                                   │
│  - Network segmentation                             │
│  - TLS/SSL encryption                               │
└─────────────────────────────────────────────────────┘
                       │
┌─────────────────────▼───────────────────────────────┐
│  Layer 2: Container Security                        │
│  - Non-root users                                   │
│  - Read-only filesystems                            │
│  - Security scanning                                │
└─────────────────────────────────────────────────────┘
                       │
┌─────────────────────▼───────────────────────────────┐
│  Layer 3: Application Security                      │
│  - Authentication & authorization                   │
│  - Input validation                                 │
│  - Secret management                                │
└─────────────────────────────────────────────────────┘
                       │
┌─────────────────────▼───────────────────────────────┐
│  Layer 4: Data Security                             │
│  - Encryption at rest                               │
│  - Encrypted backups                                │
│  - Access audit logs                                │
└─────────────────────────────────────────────────────┘
```

### Security Best Practices

1. **Image Security**
   - Scan with Trivy/Snyk
   - Use minimal base images
   - Regular updates
   - Vulnerability patching

2. **Runtime Security**
   - Drop unnecessary capabilities
   - Read-only root filesystem
   - No privileged containers
   - AppArmor/SELinux profiles

3. **Secret Management**
   - Never in images or code
   - Docker secrets / Kubernetes secrets
   - Vault integration
   - Automatic rotation

4. **Network Security**
   - Internal networks
   - Service mesh (optional)
   - mTLS between services
   - API gateway

## Monitoring Strategy

### Metrics Collection

```
┌──────────────────────────────────────────────────────┐
│                  Metrics Sources                     │
│                                                      │
│  ┌─────────┐  ┌─────────┐  ┌─────────┐            │
│  │   API   │  │Airflow  │  │  Redis  │            │
│  │/metrics │  │/metrics │  │exporter │            │
│  └────┬────┘  └────┬────┘  └────┬────┘            │
└───────┼───────────┼─────────────┼──────────────────┘
        │           │             │
        └───────────┴─────────────┘
                    │
        ┌───────────▼───────────┐
        │     Prometheus        │
        │  (Metrics Storage)    │
        └───────────┬───────────┘
                    │
        ┌───────────▼───────────┐
        │      Grafana          │
        │   (Visualization)     │
        └───────────────────────┘
```

### Key Metrics

**Application Metrics**:
- Request rate (req/s)
- Error rate (%)
- Response time (ms)
- Active connections

**System Metrics**:
- CPU usage (%)
- Memory usage (MB)
- Disk I/O (IOPS)
- Network I/O (MB/s)

**Business Metrics**:
- Predictions per hour
- Model accuracy
- Alert count
- User activity

### Alerting Rules

1. **Critical** (immediate action):
   - Service down
   - Database unreachable
   - Disk full (>95%)

2. **Warning** (investigate):
   - High error rate (>5%)
   - High latency (p95 > 1s)
   - High memory (>80%)

3. **Info** (monitoring):
   - Model retrained
   - Backup completed
   - Scale event

## Scaling Strategy

### Horizontal Scaling

**Stateless Services** (easily scalable):
- API: 3-10 instances
- Airflow Workers: 3-20 instances
- Dashboard: 2-5 instances

**Stateful Services** (vertical scaling preferred):
- PostgreSQL: Read replicas
- Redis: Cluster mode
- Prometheus: Federation

### Load Balancing

```
┌────────────────────────────────────────┐
│         Load Balancer (Nginx)          │
└────────┬────────────┬──────────────────┘
         │            │
    ┌────▼────┐  ┌────▼────┐  ┌─────────┐
    │ API #1  │  │ API #2  │  │ API #3  │
    └─────────┘  └─────────┘  └─────────┘
         │            │            │
         └────────────┴────────────┘
                     │
              ┌──────▼──────┐
              │  PostgreSQL │
              └─────────────┘
```

### Auto-Scaling Triggers

- CPU > 70% for 5 minutes
- Memory > 80% for 5 minutes
- Request queue > 100
- Response time > 2s (p95)

## Disaster Recovery

### Recovery Time Objective (RTO)

- **Critical Services**: < 15 minutes
- **Non-Critical Services**: < 1 hour
- **Data Recovery**: < 4 hours

### Recovery Point Objective (RPO)

- **Database**: < 1 hour (hourly backups)
- **Volumes**: < 24 hours (daily backups)
- **Configuration**: 0 (version controlled)

### Recovery Procedures

1. **Service Failure**
   ```bash
   docker-compose restart [service]
   ```

2. **Data Corruption**
   ```bash
   ./docker/scripts/restore.sh [backup_file]
   ```

3. **Complete Failure**
   ```bash
   # New environment
   git clone repo
   cp backups/latest.tar.gz .
   ./docker/scripts/restore.sh latest.tar.gz
   docker-compose up -d
   ```

### Backup Locations

1. **Primary**: Local disk (fast recovery)
2. **Secondary**: S3/Azure Blob (durability)
3. **Tertiary**: Off-site (disaster recovery)

## Conclusion

This architecture provides:
- **High Availability**: Health checks, auto-recovery
- **Scalability**: Horizontal and vertical scaling
- **Security**: Multi-layer defense
- **Observability**: Comprehensive monitoring
- **Maintainability**: Clear documentation
- **Reliability**: Backup and recovery

For implementation details, see [README.md](README.md).
