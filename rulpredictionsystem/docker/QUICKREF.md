# Docker Infrastructure - Quick Reference Card

## One-Line Commands

```bash
# Quick Start Development
./docker/scripts/start.sh --env development --build

# Quick Start Production
./docker/scripts/start.sh --env production --pull

# Build All Images
./docker/scripts/build_all.sh

# Check System Health
./docker/scripts/health_check.sh

# View All Logs
./docker/scripts/logs.sh -f

# Backup Everything
./docker/scripts/backup.sh

# Stop All Services
docker-compose down
```

## Essential Docker Compose Commands

```bash
# Start services
docker-compose up -d

# Start with dev tools
docker-compose -f docker-compose.yml -f docker-compose.dev.yml up -d

# Stop services
docker-compose down

# Restart a service
docker-compose restart api

# View logs
docker-compose logs -f api

# Scale a service
docker-compose up -d --scale api=3

# Execute command in container
docker-compose exec api bash

# View running services
docker-compose ps

# Remove everything including volumes
docker-compose down -v
```

## Service Access (Defaults)

| Service | URL | Credentials |
|---------|-----|-------------|
| Dashboard | http://localhost | - |
| API | http://localhost:8000 | - |
| API Docs | http://localhost:8000/docs | - |
| Airflow | http://localhost:8080 | admin/admin |
| Flower | http://localhost:5555 | - |
| Grafana | http://localhost:3000 | admin/admin |
| Prometheus | http://localhost:9090 | - |
| PgAdmin (dev) | http://localhost:5050 | admin@admin.com/admin |
| Redis Commander (dev) | http://localhost:8081 | - |
| Jupyter (dev) | http://localhost:8888 | token in logs |

## Environment Variables

```bash
# Copy template
cp .env.example .env

# Development
cp .env.development .env

# Production
cp .env.production .env
# Then edit: vim .env
```

## Build Commands

```bash
# Build all
./docker/scripts/build_all.sh

# Build with version
VERSION=1.0.0 ./docker/scripts/build_all.sh

# Build single service
docker-compose build api

# Build with no cache
docker-compose build --no-cache api
```

## Registry Commands

```bash
# Push all images to Docker Hub
DOCKER_REGISTRY=username \
REGISTRY_TYPE=dockerhub \
VERSION=1.0.0 \
./docker/scripts/push_to_registry.sh

# Push to AWS ECR
DOCKER_REGISTRY=123456789.dkr.ecr.us-east-1.amazonaws.com \
REGISTRY_TYPE=ecr \
VERSION=1.0.0 \
./docker/scripts/push_to_registry.sh
```

## Monitoring Commands

```bash
# Check health of all services
./docker/scripts/health_check.sh

# View real-time resource usage
docker stats

# View logs from all services
./docker/scripts/logs.sh

# Follow logs from specific service
./docker/scripts/logs.sh -f api

# Search logs for errors
./docker/scripts/logs.sh search:error

# View last 500 lines
./docker/scripts/logs.sh -n 500 api
```

## Backup & Restore

```bash
# Create backup
./docker/scripts/backup.sh

# List backups
ls -lh backups/

# Restore from backup
./docker/scripts/restore.sh backups/rul_backup_20240101_020000.tar.gz
```

## Database Commands

```bash
# PostgreSQL shell
docker-compose exec postgres psql -U postgres -d rul_prediction

# PostgreSQL backup
docker-compose exec postgres pg_dump -U postgres rul_prediction > backup.sql

# PostgreSQL restore
cat backup.sql | docker-compose exec -T postgres psql -U postgres -d rul_prediction

# Redis CLI
docker-compose exec redis redis-cli

# Redis backup
docker-compose exec redis redis-cli SAVE
```

## Troubleshooting

```bash
# View service status
docker-compose ps

# View service logs
docker-compose logs [service]

# Access service shell
docker-compose exec [service] bash

# Inspect container
docker inspect rul-api

# View container processes
docker-compose top

# Restart unhealthy service
docker-compose restart [service]

# Remove and recreate service
docker-compose up -d --force-recreate [service]

# Full reset (WARNING: deletes all data!)
docker-compose down -v
docker system prune -a --volumes
```

## Network Commands

```bash
# List networks
docker network ls

# Inspect network
docker network inspect rul-prediction-system_backend

# Test connectivity
docker-compose exec api ping postgres
docker-compose exec api curl http://redis:6379
```

## Volume Commands

```bash
# List volumes
docker volume ls

# Inspect volume
docker volume inspect rul-prediction-system_postgres_data

# Backup volume
docker run --rm -v rul-prediction-system_postgres_data:/data \
  -v $(pwd)/backups:/backup \
  alpine tar czf /backup/postgres_data.tar.gz -C /data .

# Restore volume
docker run --rm -v rul-prediction-system_postgres_data:/data \
  -v $(pwd)/backups:/backup \
  alpine sh -c "cd /data && tar xzf /backup/postgres_data.tar.gz"

# Remove volume
docker volume rm rul-prediction-system_postgres_data
```

## SSL/TLS

```bash
# Generate self-signed certificate (dev)
./docker/scripts/generate_ssl.sh

# Use custom domain
DOMAIN=mydomain.com ./docker/scripts/generate_ssl.sh

# Production with Let's Encrypt
certbot --nginx -d your-domain.com
```

## Scaling

```bash
# Scale API to 5 instances
docker-compose up -d --scale api=5

# Scale Airflow workers to 10
docker-compose up -d --scale airflow-worker=10

# Scale down
docker-compose up -d --scale api=1
```

## Security

```bash
# Scan images with Trivy
trivy image rul-prediction-api:latest

# Check for vulnerabilities
docker scan rul-prediction-api:latest

# Generate secret key
openssl rand -base64 32

# Generate Airflow Fernet key
python -c "from cryptography.fernet import Fernet; print(Fernet.generate_key().decode())"
```

## Kubernetes

```bash
# Create namespace
kubectl create namespace rul-prediction

# Apply all manifests
kubectl apply -f docker/kubernetes/

# Check deployments
kubectl get deployments -n rul-prediction

# Check pods
kubectl get pods -n rul-prediction

# Check services
kubectl get services -n rul-prediction

# View logs
kubectl logs -f deployment/rul-api -n rul-prediction

# Delete all
kubectl delete namespace rul-prediction
```

## Resource Management

```bash
# View resource usage
docker stats --no-stream

# Set resource limits (in docker-compose.yml)
deploy:
  resources:
    limits:
      cpus: '2'
      memory: 2G

# Clean up unused resources
docker system prune -a
docker volume prune
docker network prune
```

## Debugging

```bash
# Run command in container
docker-compose exec api python -c "import sys; print(sys.version)"

# Copy files from container
docker cp rul-api:/app/logs/app.log ./

# Copy files to container
docker cp ./config.yaml rul-api:/app/config.yaml

# View container filesystem
docker-compose exec api ls -la /app

# Check environment variables
docker-compose exec api env

# Test API endpoint
curl http://localhost:8000/health
curl http://localhost:8000/metrics
```

## Performance Testing

```bash
# Load test with Apache Bench
ab -n 1000 -c 10 http://localhost:8000/health

# Load test with wrk
wrk -t12 -c400 -d30s http://localhost:8000/health

# Start Locust for load testing
docker-compose -f docker-compose.test.yml up locust
# Then open http://localhost:8089
```

## Common Issues & Fixes

| Issue | Solution |
|-------|----------|
| Port already in use | `sudo lsof -i :8000` then kill process |
| Out of disk space | `docker system prune -a --volumes` |
| Out of memory | Increase Docker memory limit |
| Service won't start | Check logs: `docker-compose logs [service]` |
| Can't connect to database | Verify: `docker-compose exec postgres pg_isready` |
| Slow build times | Use `--parallel` flag or check network |

## File Locations

```
/docker/                      # Docker infrastructure
  ├── api/Dockerfile         # API container
  ├── dashboard/Dockerfile   # Frontend container
  ├── training/Dockerfile    # Training container
  ├── airflow/Dockerfile     # Airflow container
  ├── scripts/              # Operational scripts
  ├── kubernetes/           # K8s manifests
  └── README.md            # Full documentation

/.env                        # Environment variables
/docker-compose.yml          # Main stack
/docker-compose.dev.yml      # Dev overrides
/docker-compose.test.yml     # Test environment
```

## Support & Documentation

- **Full Documentation**: `/docker/README.md`
- **Architecture Details**: `/docker/ARCHITECTURE.md`
- **Deployment Guide**: `/docker/DEPLOYMENT_SUMMARY.md`
- **This Quick Reference**: `/docker/QUICKREF.md`

## Emergency Commands

```bash
# Stop everything immediately
docker-compose down

# Emergency backup before troubleshooting
./docker/scripts/backup.sh

# Full system reset (CAUTION: loses all data!)
docker-compose down -v
docker system prune -a --volumes

# Restore from backup
./docker/scripts/restore.sh backups/latest.tar.gz
```

---

**Tip**: Add common commands as aliases in `~/.bashrc`:
```bash
alias dc='docker-compose'
alias dcup='docker-compose up -d'
alias dcdown='docker-compose down'
alias dclogs='docker-compose logs -f'
alias dcps='docker-compose ps'
```
