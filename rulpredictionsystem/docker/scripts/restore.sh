#!/bin/bash
# ============================================================================
# Restore Script
# Restores volumes, databases, and configurations from backup
# ============================================================================

set -e  # Exit on error
set -u  # Exit on undefined variable

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Check arguments
if [ $# -eq 0 ]; then
    echo -e "${RED}Error: No backup file specified${NC}"
    echo "Usage: $0 <backup_file.tar.gz>"
    echo "Example: $0 backups/rul_backup_20240101_020000.tar.gz"
    exit 1
fi

BACKUP_FILE=$1

# Verify backup file exists
if [ ! -f "$BACKUP_FILE" ]; then
    echo -e "${RED}Error: Backup file not found: $BACKUP_FILE${NC}"
    exit 1
fi

echo -e "${BLUE}============================================================================${NC}"
echo -e "${BLUE}RUL Prediction System - Restore${NC}"
echo -e "${BLUE}============================================================================${NC}"
echo "Timestamp: $(date '+%Y-%m-%d %H:%M:%S')"
echo "Backup file: $BACKUP_FILE"
echo ""

# Warning
echo -e "${YELLOW}WARNING: This will replace all current data!${NC}"
echo -e "${YELLOW}Make sure you have a backup of current state if needed.${NC}"
echo ""
read -p "Continue with restore? (yes/no): " -r
if [[ ! $REPLY =~ ^[Yy][Ee][Ss]$ ]]; then
    echo "Restore cancelled."
    exit 0
fi

# Create temporary directory
TEMP_DIR=$(mktemp -d)
echo -e "${YELLOW}Extracting backup to ${TEMP_DIR}...${NC}"

# Extract backup
tar xzf "$BACKUP_FILE" -C "$TEMP_DIR"

# Find backup directory
BACKUP_DIR=$(find "$TEMP_DIR" -type d -name "rul_backup_*" | head -n 1)

if [ -z "$BACKUP_DIR" ]; then
    echo -e "${RED}Error: Invalid backup file${NC}"
    rm -rf "$TEMP_DIR"
    exit 1
fi

echo -e "${GREEN}✓ Backup extracted${NC}\n"

# Function to stop services
stop_services() {
    echo -e "${YELLOW}Stopping services...${NC}"
    docker-compose down
    echo -e "${GREEN}✓ Services stopped${NC}\n"
}

# Function to restore PostgreSQL
restore_postgres() {
    echo -e "${YELLOW}Restoring PostgreSQL databases...${NC}"

    # Start only PostgreSQL
    docker-compose up -d postgres
    sleep 10

    # Restore main database
    if [ -f "${BACKUP_DIR}/postgres_rul_prediction.sql.gz" ]; then
        echo "  Restoring rul_prediction database..."
        gunzip -c "${BACKUP_DIR}/postgres_rul_prediction.sql.gz" | \
            docker exec -i rul-postgres psql -U postgres -d rul_prediction
    fi

    # Restore Airflow database
    if [ -f "${BACKUP_DIR}/postgres_airflow.sql.gz" ]; then
        echo "  Restoring airflow database..."
        gunzip -c "${BACKUP_DIR}/postgres_airflow.sql.gz" | \
            docker exec -i rul-postgres psql -U postgres -d airflow
    fi

    echo -e "${GREEN}✓ PostgreSQL restore completed${NC}\n"
}

# Function to restore Redis
restore_redis() {
    echo -e "${YELLOW}Restoring Redis data...${NC}"

    # Start only Redis
    docker-compose up -d redis
    sleep 5

    # Stop Redis to replace files
    docker-compose stop redis

    # Copy dump file
    if [ -f "${BACKUP_DIR}/redis_dump.rdb" ]; then
        echo "  Restoring RDB dump..."
        docker cp "${BACKUP_DIR}/redis_dump.rdb" rul-redis:/data/dump.rdb
    fi

    # Copy AOF file if exists
    if [ -f "${BACKUP_DIR}/redis_appendonly.aof" ]; then
        echo "  Restoring AOF file..."
        docker cp "${BACKUP_DIR}/redis_appendonly.aof" rul-redis:/data/appendonly.aof
    fi

    # Restart Redis
    docker-compose start redis
    sleep 5

    echo -e "${GREEN}✓ Redis restore completed${NC}\n"
}

# Function to restore volumes
restore_volumes() {
    echo -e "${YELLOW}Restoring Docker volumes...${NC}"

    volumes=(
        "postgres_data"
        "redis_data"
        "airflow_logs"
        "prometheus_data"
        "grafana_data"
        "model_artifacts"
    )

    for volume in "${volumes[@]}"; do
        backup_file="${BACKUP_DIR}/${volume}.tar.gz"

        if [ -f "$backup_file" ]; then
            echo "  Restoring ${volume}..."

            full_volume_name="rul-prediction-system_${volume}"

            # Remove existing volume
            docker volume rm "${full_volume_name}" 2>/dev/null || true

            # Create new volume
            docker volume create "${full_volume_name}"

            # Restore data
            docker run --rm \
                -v "${full_volume_name}:/data" \
                -v "${BACKUP_DIR}:/backup" \
                alpine \
                sh -c "cd /data && tar xzf /backup/${volume}.tar.gz"

            echo -e "  ${GREEN}✓ ${volume} restored${NC}"
        else
            echo -e "  ${YELLOW}⚠ ${volume} not found in backup, skipping${NC}"
        fi
    done

    echo -e "${GREEN}✓ Volume restore completed${NC}\n"
}

# Function to restore configurations
restore_configs() {
    echo -e "${YELLOW}Restoring configuration files...${NC}"

    if [ -d "${BACKUP_DIR}/configs" ]; then
        # Backup current configs
        if [ -d "configs_backup_$(date +%Y%m%d_%H%M%S)" ]; then
            mkdir -p "configs_backup_$(date +%Y%m%d_%H%M%S)"
            cp -r docker .env* docker-compose*.yml "configs_backup_$(date +%Y%m%d_%H%M%S)/" 2>/dev/null || true
        fi

        # Restore configs (ask user for confirmation on .env files)
        echo ""
        echo -e "${YELLOW}Found environment files in backup.${NC}"
        read -p "Restore .env files? (yes/no): " -r
        if [[ $REPLY =~ ^[Yy][Ee][Ss]$ ]]; then
            cp -r "${BACKUP_DIR}/configs/.env"* . 2>/dev/null || true
            echo -e "${GREEN}✓ Environment files restored${NC}"
        else
            echo "Skipping environment files."
        fi

        echo -e "${GREEN}✓ Configuration restore completed${NC}\n"
    else
        echo -e "${YELLOW}⚠ No configuration files in backup${NC}\n"
    fi
}

# Function to verify restore
verify_restore() {
    echo -e "${YELLOW}Verifying restore...${NC}"

    # Start all services
    docker-compose up -d

    # Wait for services to start
    echo "Waiting for services to start..."
    sleep 30

    # Check service health
    healthy=0
    total=0

    services=("postgres" "redis" "api" "dashboard")

    for service in "${services[@]}"; do
        ((total++))
        container="rul-${service}"

        if docker ps --format "{{.Names}}" | grep -q "^${container}$"; then
            ((healthy++))
            echo -e "  ${GREEN}✓ ${service} is running${NC}"
        else
            echo -e "  ${RED}✗ ${service} is not running${NC}"
        fi
    done

    echo ""
    echo "Services running: ${healthy}/${total}"

    if [ $healthy -eq $total ]; then
        echo -e "${GREEN}✓ All services are healthy${NC}"
    else
        echo -e "${YELLOW}⚠ Some services are not running${NC}"
        echo "Check logs: ./docker/scripts/logs.sh"
    fi
}

# Main restore process
echo -e "${YELLOW}Starting restore process...${NC}\n"

stop_services

restore_postgres

restore_redis

restore_volumes

restore_configs

verify_restore

# Cleanup
echo -e "${YELLOW}Cleaning up...${NC}"
rm -rf "$TEMP_DIR"
echo -e "${GREEN}✓ Cleanup completed${NC}\n"

# Summary
echo -e "${BLUE}============================================================================${NC}"
echo -e "${BLUE}Restore Summary${NC}"
echo -e "${BLUE}============================================================================${NC}"

echo "Restored from: $BACKUP_FILE"
echo "Timestamp: $(date '+%Y-%m-%d %H:%M:%S')"
echo ""
echo -e "${GREEN}✓ Restore completed successfully!${NC}"
echo ""
echo "Next steps:"
echo "  1. Check service health: ./docker/scripts/health_check.sh"
echo "  2. Verify data: Access dashboard at http://localhost"
echo "  3. Check logs: ./docker/scripts/logs.sh"

# Exit code
exit 0
