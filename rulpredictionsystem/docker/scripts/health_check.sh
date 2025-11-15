#!/bin/bash
# ============================================================================
# Health Check Script
# Checks the health of all running services
# ============================================================================

set -u  # Exit on undefined variable

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
TIMEOUT=10
RETRY_COUNT=3

echo -e "${BLUE}============================================================================${NC}"
echo -e "${BLUE}RUL Prediction System - Health Check${NC}"
echo -e "${BLUE}============================================================================${NC}"
echo "Timestamp: $(date '+%Y-%m-%d %H:%M:%S')"
echo ""

# Function to check HTTP endpoint
check_http_endpoint() {
    local name=$1
    local url=$2
    local expected_status=${3:-200}

    echo -n "Checking ${name}... "

    for i in $(seq 1 $RETRY_COUNT); do
        response=$(curl -s -o /dev/null -w "%{http_code}" --max-time $TIMEOUT "$url" 2>/dev/null)

        if [ "$response" = "$expected_status" ]; then
            echo -e "${GREEN}✓ Healthy (HTTP ${response})${NC}"
            return 0
        fi

        if [ $i -lt $RETRY_COUNT ]; then
            sleep 2
        fi
    done

    echo -e "${RED}✗ Unhealthy (HTTP ${response})${NC}"
    return 1
}

# Function to check Docker container
check_container() {
    local container_name=$1

    echo -n "Checking ${container_name} container... "

    if docker ps --format "{{.Names}}" | grep -q "^${container_name}$"; then
        status=$(docker inspect --format='{{.State.Health.Status}}' "$container_name" 2>/dev/null)

        if [ "$status" = "healthy" ] || [ "$status" = "" ]; then
            echo -e "${GREEN}✓ Running${NC}"
            return 0
        else
            echo -e "${YELLOW}⚠ Running but unhealthy (${status})${NC}"
            return 1
        fi
    else
        echo -e "${RED}✗ Not running${NC}"
        return 1
    fi
}

# Function to check port
check_port() {
    local name=$1
    local host=$2
    local port=$3

    echo -n "Checking ${name} port ${port}... "

    if timeout 5 bash -c "cat < /dev/null > /dev/tcp/${host}/${port}" 2>/dev/null; then
        echo -e "${GREEN}✓ Open${NC}"
        return 0
    else
        echo -e "${RED}✗ Closed${NC}"
        return 1
    fi
}

# Initialize counters
total_checks=0
passed_checks=0

# Check containers
echo -e "${YELLOW}Container Status:${NC}"
for container in "rul-postgres" "rul-redis" "rul-api" "rul-dashboard" \
                 "rul-airflow-webserver" "rul-airflow-scheduler" "rul-airflow-worker" \
                 "rul-prometheus" "rul-grafana"; do
    check_container "$container" && ((passed_checks++)) || true
    ((total_checks++))
done

echo ""

# Check HTTP endpoints
echo -e "${YELLOW}HTTP Endpoints:${NC}"

# API
check_http_endpoint "API Health" "http://localhost:8000/health" && ((passed_checks++)) || true
((total_checks++))

check_http_endpoint "API Root" "http://localhost:8000/" && ((passed_checks++)) || true
((total_checks++))

check_http_endpoint "API Metrics" "http://localhost:8000/metrics" && ((passed_checks++)) || true
((total_checks++))

# Dashboard
check_http_endpoint "Dashboard" "http://localhost:80/" && ((passed_checks++)) || true
((total_checks++))

# Airflow
check_http_endpoint "Airflow Webserver" "http://localhost:8080/health" && ((passed_checks++)) || true
((total_checks++))

# Flower
check_http_endpoint "Flower" "http://localhost:5555/" && ((passed_checks++)) || true
((total_checks++))

# Prometheus
check_http_endpoint "Prometheus" "http://localhost:9090/-/healthy" && ((passed_checks++)) || true
((total_checks++))

# Grafana
check_http_endpoint "Grafana" "http://localhost:3000/api/health" && ((passed_checks++)) || true
((total_checks++))

echo ""

# Check database connectivity
echo -e "${YELLOW}Database Connectivity:${NC}"

# PostgreSQL
if docker exec rul-postgres pg_isready -U postgres &>/dev/null; then
    echo -e "PostgreSQL... ${GREEN}✓ Ready${NC}"
    ((passed_checks++))
else
    echo -e "PostgreSQL... ${RED}✗ Not ready${NC}"
fi
((total_checks++))

# Redis
if docker exec rul-redis redis-cli ping &>/dev/null; then
    echo -e "Redis... ${GREEN}✓ Ready${NC}"
    ((passed_checks++))
else
    echo -e "Redis... ${RED}✗ Not ready${NC}"
fi
((total_checks++))

echo ""

# Resource usage
echo -e "${YELLOW}Resource Usage:${NC}"
docker stats --no-stream --format "table {{.Container}}\t{{.CPUPerc}}\t{{.MemUsage}}\t{{.NetIO}}" | head -n 10

echo ""

# Summary
echo -e "${BLUE}============================================================================${NC}"
echo -e "${BLUE}Summary${NC}"
echo -e "${BLUE}============================================================================${NC}"

health_percentage=$((passed_checks * 100 / total_checks))

echo "Total checks: ${total_checks}"
echo "Passed: ${passed_checks}"
echo "Failed: $((total_checks - passed_checks))"
echo "Health: ${health_percentage}%"

echo ""

if [ $health_percentage -eq 100 ]; then
    echo -e "${GREEN}✓ All systems operational${NC}"
    exit 0
elif [ $health_percentage -ge 80 ]; then
    echo -e "${YELLOW}⚠ System degraded but operational${NC}"
    exit 0
else
    echo -e "${RED}✗ System unhealthy${NC}"
    exit 1
fi
