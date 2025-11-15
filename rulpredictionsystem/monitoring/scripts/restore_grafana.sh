#!/bin/bash
# Restore Grafana Dashboards and Configuration
# This script restores Grafana from a backup archive

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
MONITORING_DIR="$(dirname "$SCRIPT_DIR")"
BACKUP_DIR="${MONITORING_DIR}/backups"
RESTORE_DIR="${BACKUP_DIR}/restore"

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

# Usage information
usage() {
    cat << EOF
Usage: $0 [OPTIONS] BACKUP_FILE

Restore Grafana from a backup archive

Options:
    -h, --help              Show this help message
    -f, --force             Force restore without confirmation
    -d, --dashboards-only   Restore only dashboards
    -u, --url URL           Grafana URL (default: http://localhost:3000)
    -U, --user USER         Grafana admin user (default: admin)
    -P, --password PASS     Grafana admin password

Examples:
    $0 /path/to/grafana_backup_20231201_120000.tar.gz
    $0 -f -d backup.tar.gz
    $0 --url http://grafana:3000 backup.tar.gz

EOF
    exit 1
}

# Parse command line arguments
parse_args() {
    BACKUP_FILE=""
    FORCE=false
    DASHBOARDS_ONLY=false

    while [[ $# -gt 0 ]]; do
        case $1 in
            -h|--help)
                usage
                ;;
            -f|--force)
                FORCE=true
                shift
                ;;
            -d|--dashboards-only)
                DASHBOARDS_ONLY=true
                shift
                ;;
            -u|--url)
                GRAFANA_URL="$2"
                shift 2
                ;;
            -U|--user)
                GRAFANA_USER="$2"
                shift 2
                ;;
            -P|--password)
                GRAFANA_PASSWORD="$2"
                shift 2
                ;;
            *)
                BACKUP_FILE="$1"
                shift
                ;;
        esac
    done

    if [ -z "$BACKUP_FILE" ]; then
        print_error "No backup file specified"
        usage
    fi

    if [ ! -f "$BACKUP_FILE" ]; then
        print_error "Backup file not found: $BACKUP_FILE"
        exit 1
    fi
}

# Confirm restore
confirm_restore() {
    if [ "$FORCE" = true ]; then
        return
    fi

    echo ""
    print_warning "This will restore Grafana from backup."
    print_warning "Existing dashboards and configuration may be overwritten."
    echo ""
    read -p "Are you sure you want to continue? (yes/no): " confirm

    if [ "$confirm" != "yes" ]; then
        print_info "Restore cancelled"
        exit 0
    fi
}

# Extract backup
extract_backup() {
    print_info "Extracting backup archive..."

    rm -rf "$RESTORE_DIR"
    mkdir -p "$RESTORE_DIR"

    tar -xzf "$BACKUP_FILE" -C "$RESTORE_DIR"

    # Check metadata
    if [ -f "${RESTORE_DIR}/metadata.json" ]; then
        print_info "Backup metadata:"
        cat "${RESTORE_DIR}/metadata.json" | jq '.'
    fi

    print_info "Backup extracted to: ${RESTORE_DIR}"
}

# Restore datasources
restore_datasources() {
    if [ "$DASHBOARDS_ONLY" = true ]; then
        print_info "Skipping datasources (dashboards-only mode)"
        return
    fi

    print_info "Restoring datasources..."

    local datasources_file="${RESTORE_DIR}/datasources/datasources.json"

    if [ ! -f "$datasources_file" ]; then
        print_warning "No datasources file found"
        return
    fi

    local count=$(cat "$datasources_file" | jq length)

    for i in $(seq 0 $(($count - 1))); do
        local datasource=$(cat "$datasources_file" | jq ".[$i]")
        local name=$(echo "$datasource" | jq -r '.name')

        # Remove ID and version fields
        datasource=$(echo "$datasource" | jq 'del(.id, .version)')

        curl -s -X POST \
            -u "${GRAFANA_USER}:${GRAFANA_PASSWORD}" \
            -H "Content-Type: application/json" \
            -d "$datasource" \
            "${GRAFANA_URL}/api/datasources" > /dev/null

        print_info "Restored datasource: ${name}"
    done
}

# Restore dashboards
restore_dashboards() {
    print_info "Restoring dashboards..."

    local dashboards_dir="${RESTORE_DIR}/dashboards"

    if [ ! -d "$dashboards_dir" ]; then
        print_warning "No dashboards directory found"
        return
    fi

    local count=0
    for dashboard_file in "$dashboards_dir"/*.json; do
        if [ ! -f "$dashboard_file" ]; then
            continue
        fi

        local dashboard=$(cat "$dashboard_file")
        local title=$(echo "$dashboard" | jq -r '.title')

        # Prepare dashboard for import
        local import_payload=$(jq -n \
            --argjson dashboard "$dashboard" \
            '{dashboard: $dashboard, overwrite: true}')

        local response=$(curl -s -X POST \
            -u "${GRAFANA_USER}:${GRAFANA_PASSWORD}" \
            -H "Content-Type: application/json" \
            -d "$import_payload" \
            "${GRAFANA_URL}/api/dashboards/db")

        if echo "$response" | jq -e '.status == "success"' > /dev/null; then
            print_info "Restored dashboard: ${title}"
            ((count++))
        else
            print_error "Failed to restore dashboard: ${title}"
            echo "$response" | jq '.'
        fi
    done

    print_info "Restored ${count} dashboards"
}

# Restore alert notifications
restore_alerts() {
    if [ "$DASHBOARDS_ONLY" = true ]; then
        print_info "Skipping alerts (dashboards-only mode)"
        return
    fi

    print_info "Restoring alert notifications..."

    local alerts_file="${RESTORE_DIR}/alerts/alert-notifications.json"

    if [ ! -f "$alerts_file" ]; then
        print_warning "No alert notifications file found"
        return
    fi

    local count=$(cat "$alerts_file" | jq length)

    for i in $(seq 0 $(($count - 1))); do
        local notification=$(cat "$alerts_file" | jq ".[$i]")
        local name=$(echo "$notification" | jq -r '.name')

        # Remove ID field
        notification=$(echo "$notification" | jq 'del(.id)')

        curl -s -X POST \
            -u "${GRAFANA_USER}:${GRAFANA_PASSWORD}" \
            -H "Content-Type: application/json" \
            -d "$notification" \
            "${GRAFANA_URL}/api/alert-notifications" > /dev/null

        print_info "Restored alert notification: ${name}"
    done
}

# Restore database (if applicable)
restore_database() {
    if [ "$DASHBOARDS_ONLY" = true ]; then
        print_info "Skipping database (dashboards-only mode)"
        return
    fi

    print_info "Restoring Grafana database..."

    local db_archive="${RESTORE_DIR}/database/grafana.db.tar.gz"
    local db_file="${RESTORE_DIR}/database/grafana.db"

    if [ -f "$db_archive" ]; then
        print_warning "Database restore requires stopping Grafana"
        print_warning "This is not recommended for production systems"
        print_warning "Skipping database restore"
        return
    fi

    if [ ! -f "$db_file" ]; then
        print_warning "No database file found"
        return
    fi

    # Check if running in Docker
    if docker ps | grep -q "rul-grafana"; then
        print_warning "Cannot restore database while Grafana is running in Docker"
        print_warning "Please stop Grafana, restore database manually, and restart"
        return
    fi
}

# Restore provisioning files
restore_provisioning() {
    if [ "$DASHBOARDS_ONLY" = true ]; then
        print_info "Skipping provisioning (dashboards-only mode)"
        return
    fi

    print_info "Restoring provisioning files..."

    local prov_dir="${RESTORE_DIR}/provisioning"

    if [ ! -d "$prov_dir" ]; then
        print_warning "No provisioning directory found"
        return
    fi

    if [ -d "${MONITORING_DIR}/grafana/provisioning" ]; then
        # Backup current provisioning
        mv "${MONITORING_DIR}/grafana/provisioning" \
           "${MONITORING_DIR}/grafana/provisioning.backup.$(date +%s)"
    fi

    cp -r "$prov_dir/provisioning" "${MONITORING_DIR}/grafana/"

    print_info "Provisioning files restored"
    print_warning "You may need to restart Grafana for provisioning changes to take effect"
}

# Cleanup
cleanup() {
    print_info "Cleaning up temporary files..."
    rm -rf "$RESTORE_DIR"
}

# List available backups
list_backups() {
    echo "Available backups:"
    echo ""

    if [ ! -d "$BACKUP_DIR" ]; then
        echo "No backups found"
        return
    fi

    find "$BACKUP_DIR" -name "grafana_backup_*.tar.gz" -type f | while read backup; do
        local size=$(du -h "$backup" | cut -f1)
        local date=$(echo "$backup" | grep -oP '\d{8}_\d{6}')
        local formatted_date=$(date -d "${date:0:8} ${date:9:2}:${date:11:2}:${date:13:2}" "+%Y-%m-%d %H:%M:%S" 2>/dev/null || echo "$date")

        echo "  $backup"
        echo "    Date: $formatted_date"
        echo "    Size: $size"
        echo ""
    done
}

# Main restore function
main() {
    echo "=========================================="
    echo "Grafana Restore Script"
    echo "=========================================="

    # Check if Grafana is accessible
    if ! curl -s -f "${GRAFANA_URL}/api/health" > /dev/null; then
        print_error "Cannot connect to Grafana at ${GRAFANA_URL}"
        print_error "Please make sure Grafana is running"
        exit 1
    fi

    print_info "Connected to Grafana at ${GRAFANA_URL}"
    print_info "Grafana version: $(curl -s ${GRAFANA_URL}/api/health | jq -r '.version')"

    confirm_restore
    extract_backup
    restore_datasources
    restore_dashboards
    restore_alerts
    restore_database
    restore_provisioning
    cleanup

    echo ""
    print_info "Restore completed successfully!"
    echo ""
}

# Handle script arguments
if [ $# -eq 0 ] || [ "$1" = "-l" ] || [ "$1" = "--list" ]; then
    list_backups
    exit 0
fi

parse_args "$@"
main
