#!/bin/bash
# Backup Grafana Dashboards and Configuration
# This script backs up Grafana dashboards, datasources, and configuration

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
MONITORING_DIR="$(dirname "$SCRIPT_DIR")"
BACKUP_DIR="${MONITORING_DIR}/backups"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="${BACKUP_DIR}/grafana_backup_${TIMESTAMP}.tar.gz"

# Grafana connection details
GRAFANA_URL="${GRAFANA_URL:-http://localhost:3000}"
GRAFANA_USER="${GRAFANA_USER:-admin}"
GRAFANA_PASSWORD="${GRAFANA_PASSWORD:-admin123}"

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m'

print_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

# Create backup directory
create_backup_dir() {
    mkdir -p "${BACKUP_DIR}/temp"
    print_info "Created backup directory: ${BACKUP_DIR}"
}

# Backup dashboards via API
backup_dashboards() {
    print_info "Backing up Grafana dashboards..."

    local temp_dir="${BACKUP_DIR}/temp/dashboards"
    mkdir -p "$temp_dir"

    # Get all dashboard UIDs
    local dashboards=$(curl -s -u "${GRAFANA_USER}:${GRAFANA_PASSWORD}" \
        "${GRAFANA_URL}/api/search?type=dash-db" | \
        jq -r '.[].uid')

    if [ -z "$dashboards" ]; then
        print_warning "No dashboards found"
        return
    fi

    local count=0
    for uid in $dashboards; do
        local dashboard=$(curl -s -u "${GRAFANA_USER}:${GRAFANA_PASSWORD}" \
            "${GRAFANA_URL}/api/dashboards/uid/${uid}")

        local title=$(echo "$dashboard" | jq -r '.meta.slug')
        echo "$dashboard" | jq '.dashboard' > "${temp_dir}/${title}.json"

        ((count++))
    done

    print_info "Backed up ${count} dashboards"
}

# Backup datasources
backup_datasources() {
    print_info "Backing up Grafana datasources..."

    local temp_dir="${BACKUP_DIR}/temp/datasources"
    mkdir -p "$temp_dir"

    curl -s -u "${GRAFANA_USER}:${GRAFANA_PASSWORD}" \
        "${GRAFANA_URL}/api/datasources" > "${temp_dir}/datasources.json"

    local count=$(cat "${temp_dir}/datasources.json" | jq length)
    print_info "Backed up ${count} datasources"
}

# Backup alert rules
backup_alerts() {
    print_info "Backing up alert rules..."

    local temp_dir="${BACKUP_DIR}/temp/alerts"
    mkdir -p "$temp_dir"

    curl -s -u "${GRAFANA_USER}:${GRAFANA_PASSWORD}" \
        "${GRAFANA_URL}/api/alert-notifications" > "${temp_dir}/alert-notifications.json"

    curl -s -u "${GRAFANA_USER}:${GRAFANA_PASSWORD}" \
        "${GRAFANA_URL}/api/alerts" > "${temp_dir}/alerts.json"

    print_info "Backed up alert rules"
}

# Backup organizations
backup_organizations() {
    print_info "Backing up organizations..."

    local temp_dir="${BACKUP_DIR}/temp/organizations"
    mkdir -p "$temp_dir"

    curl -s -u "${GRAFANA_USER}:${GRAFANA_PASSWORD}" \
        "${GRAFANA_URL}/api/orgs" > "${temp_dir}/organizations.json"

    print_info "Backed up organizations"
}

# Backup users
backup_users() {
    print_info "Backing up users..."

    local temp_dir="${BACKUP_DIR}/temp/users"
    mkdir -p "$temp_dir"

    curl -s -u "${GRAFANA_USER}:${GRAFANA_PASSWORD}" \
        "${GRAFANA_URL}/api/users" > "${temp_dir}/users.json"

    print_info "Backed up users"
}

# Backup Grafana database (if using SQLite)
backup_database() {
    print_info "Backing up Grafana database..."

    local temp_dir="${BACKUP_DIR}/temp/database"
    mkdir -p "$temp_dir"

    # Check if running in Docker
    if docker ps | grep -q "rul-grafana"; then
        docker exec rul-grafana sh -c 'tar czf - /var/lib/grafana/grafana.db' > \
            "${temp_dir}/grafana.db.tar.gz"
        print_info "Backed up Grafana database from Docker container"
    elif [ -f "/var/lib/grafana/grafana.db" ]; then
        cp /var/lib/grafana/grafana.db "${temp_dir}/grafana.db"
        print_info "Backed up Grafana database from filesystem"
    else
        print_warning "Grafana database not found (may be using external database)"
    fi
}

# Backup provisioning files
backup_provisioning() {
    print_info "Backing up provisioning files..."

    local temp_dir="${BACKUP_DIR}/temp/provisioning"
    mkdir -p "$temp_dir"

    if [ -d "${MONITORING_DIR}/grafana/provisioning" ]; then
        cp -r "${MONITORING_DIR}/grafana/provisioning" "$temp_dir/"
        print_info "Backed up provisioning files"
    else
        print_warning "Provisioning directory not found"
    fi
}

# Create metadata
create_metadata() {
    print_info "Creating backup metadata..."

    local temp_dir="${BACKUP_DIR}/temp"
    cat > "${temp_dir}/metadata.json" <<EOF
{
    "timestamp": "${TIMESTAMP}",
    "backup_date": "$(date -Iseconds)",
    "grafana_url": "${GRAFANA_URL}",
    "grafana_version": "$(curl -s ${GRAFANA_URL}/api/health | jq -r '.version')",
    "hostname": "$(hostname)",
    "backup_type": "full"
}
EOF
}

# Compress backup
compress_backup() {
    print_info "Compressing backup..."

    cd "${BACKUP_DIR}"
    tar -czf "${BACKUP_FILE}" -C temp .

    # Remove temporary directory
    rm -rf "${BACKUP_DIR}/temp"

    local size=$(du -h "${BACKUP_FILE}" | cut -f1)
    print_info "Backup created: ${BACKUP_FILE} (${size})"
}

# Cleanup old backups
cleanup_old_backups() {
    local retention_days="${BACKUP_RETENTION_DAYS:-30}"

    print_info "Cleaning up backups older than ${retention_days} days..."

    find "${BACKUP_DIR}" -name "grafana_backup_*.tar.gz" -mtime +${retention_days} -delete

    local remaining=$(find "${BACKUP_DIR}" -name "grafana_backup_*.tar.gz" | wc -l)
    print_info "Remaining backups: ${remaining}"
}

# Upload to remote storage (optional)
upload_to_remote() {
    if [ -n "$S3_BUCKET" ]; then
        print_info "Uploading backup to S3..."
        aws s3 cp "${BACKUP_FILE}" "s3://${S3_BUCKET}/grafana-backups/"
        print_info "Backup uploaded to S3"
    fi

    if [ -n "$REMOTE_HOST" ]; then
        print_info "Uploading backup to remote host..."
        scp "${BACKUP_FILE}" "${REMOTE_HOST}:${REMOTE_PATH:-/backups/grafana/}"
        print_info "Backup uploaded to remote host"
    fi
}

# Main backup function
main() {
    echo "=========================================="
    echo "Grafana Backup Script"
    echo "=========================================="

    # Check if Grafana is accessible
    if ! curl -s -f "${GRAFANA_URL}/api/health" > /dev/null; then
        print_error "Cannot connect to Grafana at ${GRAFANA_URL}"
        exit 1
    fi

    create_backup_dir
    backup_dashboards
    backup_datasources
    backup_alerts
    backup_organizations
    backup_users
    backup_database
    backup_provisioning
    create_metadata
    compress_backup
    cleanup_old_backups
    upload_to_remote

    echo ""
    print_info "Backup completed successfully!"
    print_info "Backup file: ${BACKUP_FILE}"
    echo ""
}

# Run main function
main "$@"
