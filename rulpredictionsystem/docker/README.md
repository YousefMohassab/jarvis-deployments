# Docker Infrastructure - RUL Prediction System

Complete Docker containerization and orchestration infrastructure for the RUL (Remaining Useful Life) prediction system.

## Table of Contents

- [Quick Start](#quick-start)
- [Architecture Overview](#architecture-overview)
- [Prerequisites](#prerequisites)
- [Building Images](#building-images)
- [Running the Stack](#running-the-stack)
- [Environment Configuration](#environment-configuration)
- [Service Details](#service-details)
- [Monitoring and Logging](#monitoring-and-logging)
- [Scaling](#scaling)
- [Backup and Recovery](#backup-and-recovery)
- [Troubleshooting](#troubleshooting)
- [Security Best Practices](#security-best-practices)
- [Production Deployment](#production-deployment)

## Quick Start

### Development Environment

```bash
# 1. Copy environment file
cp .env.example .env

# 2. Update environment variables
vim .env

# 3. Build all images
./docker/scripts/build_all.sh

# 4. Start development stack
docker-compose -f docker-compose.yml -f docker-compose.dev.yml up -d

# 5. Check service health
./docker/scripts/health_check.sh

# 6. View logs
./docker/scripts/logs.sh -f
```

### Production Environment

```bash
# 1. Configure production environment
cp .env.production .env
vim .env  # Update all CHANGE_ME values

# 2. Build production images
VERSION=1.0.0 ./docker/scripts/build_all.sh

# 3. Run security scan
trivy image rul-prediction-api:1.0.0

# 4. Start production stack
docker-compose up -d

# 5. Verify all services
./docker/scripts/health_check.sh
```

## Architecture Overview

### Service Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                         Load Balancer                        │
│                      (Nginx / Ingress)                       │
└────────────────────┬────────────────────────────────────────┘
                     │
          ┌──────────┴──────────┐
          │                     │
    ┌─────▼──────┐      ┌──────▼─────┐
    │  Dashboard │      │  API (x3)  │
    │  (React)   │      │ (FastAPI)  │
    └────────────┘      └──────┬─────┘
                               │
          ┌────────────────────┼────────────────────┐
          │                    │                    │
    ┌─────▼──────┐     ┌──────▼─────┐     ┌───────▼────────┐
    │ PostgreSQL │     │   Redis    │     │    Models      │
    │  Database  │     │   Cache    │     │  (Volume)      │
    └────────────┘     └────────────┘     └────────────────┘
                               │
          ┌────────────────────┼────────────────────┐
          │                    │                    │
    ┌─────▼──────┐     ┌──────▼─────┐     ┌───────▼────────┐
    │  Airflow   │     │  Airflow   │     │    Airflow     │
    │ Webserver  │     │ Scheduler  │     │  Worker (x3)   │
    └────────────┘     └────────────┘     └────────────────┘
                               │
          ┌────────────────────┼────────────────────┐
          │                    │                    │
    ┌─────▼──────┐     ┌──────▼─────┐     ┌───────▼────────┐
    │ Prometheus │     │  Grafana   │     │    Flower      │
    │ Monitoring │     │ Dashboard  │     │ Celery Monitor │
    └────────────┘     └────────────┘     └────────────────┘
```

### Network Architecture

- **frontend**: Dashboard and external-facing services
- **backend**: API, databases, cache
- **monitoring**: Prometheus, Grafana, metrics collection

### Data Flow

1. User accesses dashboard (React SPA)
2. Dashboard makes API calls to FastAPI backend
3. API processes requests, queries PostgreSQL, uses Redis cache
4. Airflow orchestrates batch jobs and model training
5. Prometheus scrapes metrics from all services
6. Grafana visualizes metrics and system health

## Prerequisites

### Required Software

- Docker 24.0+ ([install](https://docs.docker.com/get-docker/))
- Docker Compose 2.0+ ([install](https://docs.docker.com/compose/install/))
- Git 2.0+
- 8GB+ RAM available
- 50GB+ disk space

### Optional Tools

- **Trivy**: Security scanning ([install](https://github.com/aquasecurity/trivy))
- **kubectl**: Kubernetes CLI ([install](https://kubernetes.io/docs/tasks/tools/))
- **helm**: Kubernetes package manager ([install](https://helm.sh/docs/intro/install/))

### System Requirements

#### Minimum (Development)
- CPU: 4 cores
- RAM: 8GB
- Disk: 50GB SSD

#### Recommended (Production)
- CPU: 8+ cores
- RAM: 16GB+
- Disk: 200GB+ SSD
- Network: 1Gbps+

## Building Images

### Build All Images

```bash
# Build with default version (latest)
./docker/scripts/build_all.sh

# Build with specific version
VERSION=1.0.0 ./docker/scripts/build_all.sh

# Build for specific registry
DOCKER_REGISTRY=myregistry.azurecr.io VERSION=1.0.0 ./docker/scripts/build_all.sh
```

### Build Individual Images

```bash
# API
docker build -f docker/api/Dockerfile -t rul-prediction-api:latest .

# Dashboard
docker build -f docker/dashboard/Dockerfile -t rul-prediction-dashboard:latest .

# Training
docker build -f docker/training/Dockerfile -t rul-prediction-training:latest .

# Airflow
docker build -f docker/airflow/Dockerfile -t rul-prediction-airflow:latest .
```

### Multi-Architecture Builds

```bash
# Create builder
docker buildx create --name multiarch --use

# Build for multiple platforms
docker buildx build \
  --platform linux/amd64,linux/arm64 \
  -f docker/api/Dockerfile \
  -t rul-prediction-api:latest \
  --push .
```

## Running the Stack

### Start Services

```bash
# Start all services (production)
docker-compose up -d

# Start with development overrides
docker-compose -f docker-compose.yml -f docker-compose.dev.yml up -d

# Start specific services
docker-compose up -d postgres redis api

# Start and rebuild
docker-compose up -d --build
```

### Stop Services

```bash
# Stop all services
docker-compose down

# Stop and remove volumes (WARNING: deletes data)
docker-compose down -v

# Stop and remove images
docker-compose down --rmi all
```

### Service Management

```bash
# View running services
docker-compose ps

# View service logs
docker-compose logs -f [service_name]

# Restart service
docker-compose restart [service_name]

# Scale service
docker-compose up -d --scale api=3
```

## Environment Configuration

### Environment Files

- `.env.example`: Template with all variables
- `.env.development`: Development settings
- `.env.production`: Production settings (never commit!)

### Key Variables

#### Database
```bash
POSTGRES_USER=postgres
POSTGRES_PASSWORD=secure_password
POSTGRES_DB=rul_prediction
```

#### API
```bash
API_PORT=8000
SECRET_KEY=generate_32_char_key
API_KEY=your_api_key
```

#### Monitoring
```bash
PROMETHEUS_PORT=9090
GRAFANA_PORT=3000
GRAFANA_ADMIN_PASSWORD=secure_password
```

### Generate Secrets

```bash
# Generate secret key
openssl rand -base64 32

# Generate Airflow Fernet key
python -c "from cryptography.fernet import Fernet; print(Fernet.generate_key().decode())"

# Generate API key
openssl rand -hex 32
```

## Service Details

### API Backend (FastAPI)

- **Port**: 8000
- **Image**: rul-prediction-api
- **Resources**: 1-2 CPU, 512MB-1GB RAM
- **Health**: http://localhost:8000/health
- **Docs**: http://localhost:8000/docs (dev only)
- **Metrics**: http://localhost:8000/metrics

### Dashboard (React)

- **Port**: 80
- **Image**: rul-prediction-dashboard
- **Resources**: 0.5-1 CPU, 256MB-512MB RAM
- **Health**: http://localhost:80/health
- **Access**: http://localhost

### PostgreSQL

- **Port**: 5432
- **Image**: postgres:15-alpine
- **Resources**: 1-2 CPU, 1-2GB RAM
- **Volume**: postgres_data
- **Backup**: Automated via backup script

### Redis

- **Port**: 6379
- **Image**: redis:7-alpine
- **Resources**: 0.5-1 CPU, 256MB-512MB RAM
- **Volume**: redis_data
- **Persistence**: RDB + AOF

### Airflow

#### Webserver
- **Port**: 8080
- **Access**: http://localhost:8080
- **Credentials**: admin/admin (change in production)

#### Scheduler
- **Resources**: 1-2 CPU, 1-2GB RAM
- **Critical**: Single instance only

#### Worker
- **Resources**: 2-4 CPU, 2-4GB RAM
- **Scalable**: Yes (3+ recommended)

### Prometheus

- **Port**: 9090
- **Access**: http://localhost:9090
- **Retention**: 30 days
- **Storage**: 10GB limit

### Grafana

- **Port**: 3000
- **Access**: http://localhost:3000
- **Credentials**: admin/admin (change in production)
- **Dashboards**: Auto-provisioned

## Monitoring and Logging

### Health Checks

```bash
# Run comprehensive health check
./docker/scripts/health_check.sh

# Check specific service
docker-compose exec api curl http://localhost:8000/health
```

### View Logs

```bash
# All services
./docker/scripts/logs.sh

# Follow logs
./docker/scripts/logs.sh -f

# Specific service
./docker/scripts/logs.sh api

# Last 500 lines
./docker/scripts/logs.sh -n 500 postgres

# Search logs
./docker/scripts/logs.sh search:error
```

### Metrics

Access metrics endpoints:

- **API Metrics**: http://localhost:8000/metrics
- **Prometheus**: http://localhost:9090
- **Grafana Dashboards**: http://localhost:3000

### Alerts

Prometheus alerts are configured in `monitoring/prometheus/alerts.yml`:

- High error rate
- High latency
- Resource exhaustion
- Service down

## Scaling

### Horizontal Scaling

```bash
# Scale API instances
docker-compose up -d --scale api=5

# Scale Airflow workers
docker-compose up -d --scale airflow-worker=5
```

### Vertical Scaling

Update resource limits in `docker-compose.yml`:

```yaml
deploy:
  resources:
    limits:
      cpus: '4'
      memory: 4G
```

### Load Balancing

For production, use:
- Nginx reverse proxy
- HAProxy
- Cloud load balancer (ALB, Azure LB, GCP LB)
- Kubernetes Ingress

## Backup and Recovery

### Create Backup

```bash
# Full backup
./docker/scripts/backup.sh

# Backup location
ls -lh backups/

# Automatic backups (cron)
0 2 * * * /path/to/docker/scripts/backup.sh
```

### Restore Backup

```bash
# List backups
ls backups/

# Restore specific backup
./docker/scripts/restore.sh backups/rul_backup_20240101_020000.tar.gz
```

### What's Backed Up

- PostgreSQL databases (all)
- Redis data (RDB + AOF)
- Docker volumes
- Configuration files
- Environment files

## Troubleshooting

### Common Issues

#### Services Won't Start

```bash
# Check logs
docker-compose logs [service]

# Check Docker daemon
systemctl status docker

# Check disk space
df -h

# Check memory
free -h
```

#### Database Connection Issues

```bash
# Check PostgreSQL
docker-compose exec postgres pg_isready

# Check connectivity
docker-compose exec api ping postgres

# View PostgreSQL logs
docker-compose logs postgres
```

#### Port Conflicts

```bash
# Find process using port
sudo lsof -i :8000

# Kill process
sudo kill -9 [PID]

# Or change port in .env
API_PORT=8001
```

#### Out of Memory

```bash
# Check container memory
docker stats

# Increase Docker memory limit
# Docker Desktop > Settings > Resources > Memory

# Reduce resource limits in docker-compose.yml
```

### Debug Mode

```bash
# Run service in foreground
docker-compose up api

# Access container shell
docker-compose exec api bash

# Run commands in container
docker-compose exec api python -c "import sys; print(sys.version)"
```

### Reset Everything

```bash
# WARNING: This deletes all data!
docker-compose down -v
docker system prune -a --volumes
./docker/scripts/build_all.sh
docker-compose up -d
```

## Security Best Practices

### Image Security

1. **Use Official Base Images**
   ```dockerfile
   FROM python:3.10-slim  # Official, maintained
   ```

2. **Multi-Stage Builds**
   - Separate builder and runtime stages
   - Minimize final image size
   - Reduce attack surface

3. **Non-Root Users**
   ```dockerfile
   USER appuser  # Never run as root
   ```

4. **Security Scanning**
   ```bash
   trivy image rul-prediction-api:latest
   ```

### Runtime Security

1. **Resource Limits**
   - Set CPU and memory limits
   - Prevent resource exhaustion

2. **Network Isolation**
   - Use separate networks
   - Limit inter-service communication

3. **Secret Management**
   - Never commit secrets
   - Use Docker secrets or vault
   - Rotate secrets regularly

4. **TLS/SSL**
   - Enable HTTPS
   - Use valid certificates
   - Force SSL redirect

### Access Control

1. **Authentication**
   - Enable authentication on all services
   - Use strong passwords
   - Implement 2FA where possible

2. **Authorization**
   - Principle of least privilege
   - Role-based access control
   - API key management

3. **Network Security**
   - Firewall rules
   - VPN for admin access
   - IP whitelisting

## Production Deployment

### Pre-Deployment Checklist

- [ ] Update all CHANGE_ME values in .env.production
- [ ] Generate strong secrets
- [ ] Configure SSL/TLS certificates
- [ ] Set up monitoring and alerting
- [ ] Configure backup schedule
- [ ] Test disaster recovery
- [ ] Review security settings
- [ ] Load testing completed
- [ ] Documentation updated

### Deployment Steps

1. **Prepare Environment**
   ```bash
   cp .env.production .env
   vim .env  # Update all values
   ```

2. **Build Images**
   ```bash
   VERSION=1.0.0 ./docker/scripts/build_all.sh
   ```

3. **Push to Registry**
   ```bash
   DOCKER_REGISTRY=myregistry.azurecr.io \
   VERSION=1.0.0 \
   ./docker/scripts/push_to_registry.sh
   ```

4. **Deploy Stack**
   ```bash
   docker-compose up -d
   ```

5. **Verify Deployment**
   ```bash
   ./docker/scripts/health_check.sh
   ```

6. **Configure Monitoring**
   - Set up alert recipients
   - Test alert delivery
   - Create dashboards

7. **Enable Backups**
   ```bash
   # Add to crontab
   0 2 * * * /path/to/docker/scripts/backup.sh
   ```

### Kubernetes Deployment

For Kubernetes deployment, see:
- [Kubernetes Deployment Guide](kubernetes/README.md)
- [Helm Charts](kubernetes/helm/README.md)

### Cloud Providers

#### AWS ECS
```bash
# Push to ECR
./docker/scripts/push_to_registry.sh ecr

# Deploy with CloudFormation or Terraform
```

#### Azure AKS
```bash
# Push to ACR
./docker/scripts/push_to_registry.sh acr

# Deploy with kubectl
kubectl apply -f docker/kubernetes/
```

#### Google Cloud Run
```bash
# Push to GCR
./docker/scripts/push_to_registry.sh gcr

# Deploy with gcloud
gcloud run deploy
```

## Support and Contributing

### Getting Help

- **Issues**: Report bugs and issues on GitHub
- **Documentation**: Check the docs/ folder
- **Community**: Join our Discord/Slack

### Contributing

1. Fork the repository
2. Create feature branch
3. Make changes
4. Test thoroughly
5. Submit pull request

## License

Copyright (c) 2024 RUL Prediction Team. All rights reserved.
