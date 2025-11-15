#!/bin/bash
# ============================================================================
# Backup Script
# Backs up volumes, databases, and configurations
# ============================================================================

set -e  # Exit on error
set -u  # Exit on undefined variable

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
BACKUP_DIR=${BACKUP_DIR:-"./backups"}
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_NAME="rul_backup_${TIMESTAMP}"
RETENTION_DAYS=${RETENTION_DAYS:-30}

# Create backup directory
mkdir -p "${BACKUP_DIR}/${BACKUP_NAME}"

echo -e "${BLUE}============================================================================${NC}"
echo -e "${BLUE}RUL Prediction System - Backup${NC}"
echo -e "${BLUE}============================================================================${NC}"
echo "Timestamp: $(date '+%Y-%m-%d %H:%M:%S')"
echo "Backup directory: ${BACKUP_DIR}/${BACKUP_NAME}"
echo ""

# Function to backup PostgreSQL database
backup_postgres() {
    echo -e "${YELLOW}Backing up PostgreSQL database...${NC}"

    # Get database credentials
    POSTGRES_USER=${POSTGRES_USER:-postgres}
    POSTGRES_DB=${POSTGRES_DB:-rul_prediction}

    # Backup main database
    docker exec rul-postgres pg_dump -U "${POSTGRES_USER}" "${POSTGRES_DB}" | \
        gzip > "${BACKUP_DIR}/${BACKUP_NAME}/postgres_${POSTGRES_DB}.sql.gz"

    # Backup Airflow database
    docker exec rul-postgres pg_dump -U airflow airflow | \
        gzip > "${BACKUP_DIR}/${BACKUP_NAME}/postgres_airflow.sql.gz"

    # Backup all databases (including users and roles)
    docker exec rul-postgres pg_dumpall -U "${POSTGRES_USER}" | \
        gzip > "${BACKUP_DIR}/${BACKUP_NAME}/postgres_all.sql.gz"

    echo -e "${GREEN}✓ PostgreSQL backup completed${NC}"
}

# Function to backup Redis data
backup_redis() {
    echo -e "${YELLOW}Backing up Redis data...${NC}"

    # Trigger Redis save
    docker exec rul-redis redis-cli BGSAVE

    # Wait for save to complete
    sleep 5

    # Copy dump file
    docker cp rul-redis:/data/dump.rdb "${BACKUP_DIR}/${BACKUP_NAME}/redis_dump.rdb"

    # Copy AOF file if exists
    docker cp rul-redis:/data/appendonly.aof "${BACKUP_DIR}/${BACKUP_NAME}/redis_appendonly.aof" 2>/dev/null || true

    echo -e "${GREEN}✓ Redis backup completed${NC}"
}

# Function to backup Docker volumes
backup_volumes() {
    echo -e "${YELLOW}Backing up Docker volumes...${NC}"

    volumes=(
        "postgres_data"
        "redis_data"
        "airflow_logs"
        "prometheus_data"
        "grafana_data"
        "model_artifacts"
    )

    for volume in "${volumes[@]}"; do
        full_volume_name="rul-prediction-system_${volume}"

        if docker volume ls | grep -q "${full_volume_name}"; then
            echo "  Backing up ${volume}..."

            docker run --rm \
                -v "${full_volume_name}:/data" \
                -v "${BACKUP_DIR}/${BACKUP_NAME}:/backup" \
                alpine \
                tar czf "/backup/${volume}.tar.gz" -C /data .

            echo -e "  ${GREEN}✓ ${volume} backed up${NC}"
        else
            echo -e "  ${YELLOW}⚠ ${volume} not found, skipping${NC}"
        fi
    done

    echo -e "${GREEN}✓ Volume backups completed${NC}"
}

# Function to backup configuration files
backup_configs() {
    echo -e "${YELLOW}Backing up configuration files...${NC}"

    # Create config backup directory
    mkdir -p "${BACKUP_DIR}/${BACKUP_NAME}/configs"

    # Backup .env files
    cp .env* "${BACKUP_DIR}/${BACKUP_NAME}/configs/" 2>/dev/null || true

    # Backup docker-compose files
    cp docker-compose*.yml "${BACKUP_DIR}/${BACKUP_NAME}/configs/"

    # Backup nginx configs
    cp -r docker/nginx "${BACKUP_DIR}/${BACKUP_NAME}/configs/"

    # Backup Airflow configs
    cp -r airflow/config "${BACKUP_DIR}/${BACKUP_NAME}/configs/" 2>/dev/null || true

    # Backup monitoring configs
    cp -r monitoring/prometheus "${BACKUP_DIR}/${BACKUP_NAME}/configs/" 2>/dev/null || true
    cp -r monitoring/grafana "${BACKUP_DIR}/${BACKUP_NAME}/configs/" 2>/dev/null || true

    echo -e "${GREEN}✓ Configuration backup completed${NC}"
}

# Function to create backup manifest
create_manifest() {
    echo -e "${YELLOW}Creating backup manifest...${NC}"

    cat > "${BACKUP_DIR}/${BACKUP_NAME}/MANIFEST.txt" <<EOF
RUL Prediction System Backup
========================================
Timestamp: $(date '+%Y-%m-%d %H:%M:%S')
Backup Name: ${BACKUP_NAME}
Hostname: $(hostname)
Docker Version: $(docker --version)

Contents:
- PostgreSQL databases
- Redis data
- Docker volumes
- Configuration files

To restore this backup, use the restore.sh script:
  ./docker/scripts/restore.sh ${BACKUP_NAME}

========================================
EOF

    # Add file listing
    echo "Files in backup:" >> "${BACKUP_DIR}/${BACKUP_NAME}/MANIFEST.txt"
    du -sh "${BACKUP_DIR}/${BACKUP_NAME}"/* >> "${BACKUP_DIR}/${BACKUP_NAME}/MANIFEST.txt"

    echo -e "${GREEN}✓ Manifest created${NC}"
}

# Function to compress backup
compress_backup() {
    echo -e "${YELLOW}Compressing backup...${NC}"

    cd "${BACKUP_DIR}"
    tar czf "${BACKUP_NAME}.tar.gz" "${BACKUP_NAME}"
    rm -rf "${BACKUP_NAME}"

    echo -e "${GREEN}✓ Backup compressed${NC}"
}

# Function to upload to S3 (optional)
upload_to_s3() {
    if [ -n "${S3_BUCKET:-}" ]; then
        echo -e "${YELLOW}Uploading to S3...${NC}"

        aws s3 cp "${BACKUP_DIR}/${BACKUP_NAME}.tar.gz" \
            "s3://${S3_BUCKET}/backups/${BACKUP_NAME}.tar.gz"

        echo -e "${GREEN}✓ Backup uploaded to S3${NC}"
    fi
}

# Function to clean old backups
cleanup_old_backups() {
    echo -e "${YELLOW}Cleaning up old backups (older than ${RETENTION_DAYS} days)...${NC}"

    find "${BACKUP_DIR}" -name "rul_backup_*.tar.gz" -mtime +${RETENTION_DAYS} -delete

    # Count remaining backups
    backup_count=$(find "${BACKUP_DIR}" -name "rul_backup_*.tar.gz" | wc -l)

    echo -e "${GREEN}✓ Cleanup completed (${backup_count} backups remaining)${NC}"
}

# Main backup process
echo -e "${YELLOW}Starting backup process...${NC}\n"

backup_postgres
echo ""

backup_redis
echo ""

backup_volumes
echo ""

backup_configs
echo ""

create_manifest
echo ""

compress_backup
echo ""

upload_to_s3
echo ""

cleanup_old_backups
echo ""

# Summary
echo -e "${BLUE}============================================================================${NC}"
echo -e "${BLUE}Backup Summary${NC}"
echo -e "${BLUE}============================================================================${NC}"

backup_size=$(du -sh "${BACKUP_DIR}/${BACKUP_NAME}.tar.gz" | cut -f1)

echo "Backup file: ${BACKUP_DIR}/${BACKUP_NAME}.tar.gz"
echo "Backup size: ${backup_size}"
echo "Timestamp: ${TIMESTAMP}"

echo ""
echo -e "${GREEN}✓ Backup completed successfully!${NC}"

# Exit code
exit 0
