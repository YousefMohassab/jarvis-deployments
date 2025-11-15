#!/bin/bash
# ============================================================================
# Logs Aggregation Script
# View and aggregate logs from all containers
# ============================================================================

set -u  # Exit on undefined variable

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
TAIL_LINES=${TAIL_LINES:-100}
FOLLOW=${FOLLOW:-false}

# Function to show usage
show_usage() {
    echo "Usage: $0 [OPTIONS] [SERVICE]"
    echo ""
    echo "Options:"
    echo "  -f, --follow         Follow log output"
    echo "  -n, --lines N        Number of lines to show (default: 100)"
    echo "  -h, --help           Show this help message"
    echo ""
    echo "Services:"
    echo "  all                  All services (default)"
    echo "  api                  API backend"
    echo "  dashboard            Dashboard frontend"
    echo "  postgres             PostgreSQL database"
    echo "  redis                Redis cache"
    echo "  airflow-webserver    Airflow webserver"
    echo "  airflow-scheduler    Airflow scheduler"
    echo "  airflow-worker       Airflow worker"
    echo "  flower               Flower (Celery monitor)"
    echo "  prometheus           Prometheus"
    echo "  grafana              Grafana"
    echo ""
    echo "Examples:"
    echo "  $0                   # Show last 100 lines from all services"
    echo "  $0 -f api            # Follow API logs"
    echo "  $0 -n 500 postgres   # Show last 500 lines from PostgreSQL"
    echo "  $0 --follow all      # Follow logs from all services"
}

# Parse arguments
SERVICE="all"

while [[ $# -gt 0 ]]; do
    case $1 in
        -f|--follow)
            FOLLOW=true
            shift
            ;;
        -n|--lines)
            TAIL_LINES="$2"
            shift 2
            ;;
        -h|--help)
            show_usage
            exit 0
            ;;
        *)
            SERVICE="$1"
            shift
            ;;
    esac
done

# Function to get container name from service name
get_container_name() {
    local service=$1
    case $service in
        api) echo "rul-api" ;;
        dashboard) echo "rul-dashboard" ;;
        postgres) echo "rul-postgres" ;;
        redis) echo "rul-redis" ;;
        airflow-webserver) echo "rul-airflow-webserver" ;;
        airflow-scheduler) echo "rul-airflow-scheduler" ;;
        airflow-worker) echo "rul-airflow-worker" ;;
        flower) echo "rul-flower" ;;
        prometheus) echo "rul-prometheus" ;;
        grafana) echo "rul-grafana" ;;
        *) echo "" ;;
    esac
}

# Function to show logs
show_logs() {
    local service=$1
    local container=$(get_container_name "$service")

    if [ -z "$container" ]; then
        echo -e "${RED}Unknown service: $service${NC}"
        return 1
    fi

    if ! docker ps --format "{{.Names}}" | grep -q "^${container}$"; then
        echo -e "${RED}Container $container is not running${NC}"
        return 1
    fi

    echo -e "${BLUE}============================================================================${NC}"
    echo -e "${BLUE}Logs from ${service} (${container})${NC}"
    echo -e "${BLUE}============================================================================${NC}"

    if [ "$FOLLOW" = true ]; then
        docker logs -f --tail "$TAIL_LINES" "$container"
    else
        docker logs --tail "$TAIL_LINES" "$container"
    fi
}

# Function to show all logs
show_all_logs() {
    if [ "$FOLLOW" = true ]; then
        # Follow mode - use docker-compose logs
        docker-compose logs -f --tail="$TAIL_LINES"
    else
        # Show logs from all services
        for service in api dashboard postgres redis airflow-webserver airflow-scheduler airflow-worker flower prometheus grafana; do
            container=$(get_container_name "$service")

            if docker ps --format "{{.Names}}" | grep -q "^${container}$"; then
                echo -e "${BLUE}============================================================================${NC}"
                echo -e "${BLUE}${service} (${container})${NC}"
                echo -e "${BLUE}============================================================================${NC}"
                docker logs --tail "$TAIL_LINES" "$container" 2>&1
                echo ""
            fi
        done
    fi
}

# Function to save logs to file
save_logs() {
    local output_dir="logs_$(date +%Y%m%d_%H%M%S)"
    mkdir -p "$output_dir"

    echo -e "${YELLOW}Saving logs to ${output_dir}...${NC}"

    for service in api dashboard postgres redis airflow-webserver airflow-scheduler airflow-worker flower prometheus grafana; do
        container=$(get_container_name "$service")

        if docker ps --format "{{.Names}}" | grep -q "^${container}$"; then
            echo "Saving ${service} logs..."
            docker logs "$container" > "${output_dir}/${service}.log" 2>&1
        fi
    done

    echo -e "${GREEN}✓ Logs saved to ${output_dir}${NC}"
}

# Function to search logs
search_logs() {
    local pattern=$1

    echo -e "${YELLOW}Searching for '${pattern}' in logs...${NC}"
    echo ""

    for service in api dashboard postgres redis airflow-webserver airflow-scheduler airflow-worker flower prometheus grafana; do
        container=$(get_container_name "$service")

        if docker ps --format "{{.Names}}" | grep -q "^${container}$"; then
            results=$(docker logs "$container" 2>&1 | grep -i "$pattern" | tail -n 10)

            if [ -n "$results" ]; then
                echo -e "${BLUE}${service}:${NC}"
                echo "$results"
                echo ""
            fi
        fi
    done
}

# Main logic
if [ "$SERVICE" = "all" ]; then
    show_all_logs
elif [ "$SERVICE" = "save" ]; then
    save_logs
elif [[ "$SERVICE" == search:* ]]; then
    pattern="${SERVICE#search:}"
    search_logs "$pattern"
else
    show_logs "$SERVICE"
fi

# Additional commands hint
if [ "$SERVICE" = "all" ] && [ "$FOLLOW" = false ]; then
    echo ""
    echo -e "${YELLOW}Tip: Use '$0 -f' to follow logs in real-time${NC}"
    echo -e "${YELLOW}Tip: Use '$0 save' to save all logs to files${NC}"
    echo -e "${YELLOW}Tip: Use '$0 search:error' to search for errors${NC}"
fi
