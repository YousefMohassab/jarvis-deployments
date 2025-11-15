#!/bin/bash
# Health Check Script for Monitoring Stack
# Comprehensive health checks for all monitoring components

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Counters
PASSED=0
FAILED=0
WARNING=0

# Print functions
print_header() {
    echo ""
    echo -e "${BLUE}========================================${NC}"
    echo -e "${BLUE}$1${NC}"
    echo -e "${BLUE}========================================${NC}"
}

print_check() {
    echo -e "${BLUE}[CHECK]${NC} $1"
}

print_pass() {
    echo -e "${GREEN}  ✓ PASS:${NC} $1"
    ((PASSED++))
}

print_fail() {
    echo -e "${RED}  ✗ FAIL:${NC} $1"
    ((FAILED++))
}

print_warn() {
    echo -e "${YELLOW}  ⚠ WARN:${NC} $1"
    ((WARNING++))
}

# Check if service is reachable
check_http() {
    local url=$1
    local name=$2

    if curl -s -f -o /dev/null "$url"; then
        print_pass "$name is reachable"
        return 0
    else
        print_fail "$name is not reachable at $url"
        return 1
    fi
}

# Check if port is open
check_port() {
    local host=$1
    local port=$2
    local name=$3

    if nc -z -w5 "$host" "$port" 2>/dev/null; then
        print_pass "$name port $port is open"
        return 0
    else
        print_fail "$name port $port is not open"
        return 1
    fi
}

# Check Docker container
check_container() {
    local container=$1
    local name=$2

    if docker ps --format '{{.Names}}' | grep -q "^${container}$"; then
        local status=$(docker inspect -f '{{.State.Status}}' "$container")
        if [ "$status" = "running" ]; then
            print_pass "$name container is running"
            return 0
        else
            print_fail "$name container status: $status"
            return 1
        fi
    else
        print_fail "$name container not found"
        return 1
    fi
}

# Check Prometheus
check_prometheus() {
    print_header "Prometheus Health Check"

    # Check container
    check_container "rul-prometheus" "Prometheus"

    # Check port
    check_port "localhost" "9090" "Prometheus"

    # Check health endpoint
    if check_http "http://localhost:9090/-/healthy" "Prometheus health endpoint"; then
        # Check targets
        print_check "Checking Prometheus targets..."
        local targets=$(curl -s http://localhost:9090/api/v1/targets | jq -r '.data.activeTargets[] | select(.health=="up") | .labels.job' | wc -l)
        local total=$(curl -s http://localhost:9090/api/v1/targets | jq -r '.data.activeTargets | length')

        if [ "$targets" -eq "$total" ]; then
            print_pass "All $total targets are up"
        else
            print_warn "$targets/$total targets are up"
        fi

        # Check rules
        print_check "Checking alert rules..."
        local rules=$(curl -s http://localhost:9090/api/v1/rules | jq -r '.data.groups | length')
        if [ "$rules" -gt 0 ]; then
            print_pass "$rules alert rule groups loaded"
        else
            print_warn "No alert rules loaded"
        fi
    fi
}

# Check Grafana
check_grafana() {
    print_header "Grafana Health Check"

    # Check container
    check_container "rul-grafana" "Grafana"

    # Check port
    check_port "localhost" "3000" "Grafana"

    # Check health endpoint
    if check_http "http://localhost:3000/api/health" "Grafana health endpoint"; then
        # Check database
        print_check "Checking Grafana database..."
        local db_status=$(curl -s http://localhost:3000/api/health | jq -r '.database')
        if [ "$db_status" = "ok" ]; then
            print_pass "Grafana database is healthy"
        else
            print_fail "Grafana database status: $db_status"
        fi

        # Check datasources
        print_check "Checking datasources..."
        local datasources=$(curl -s -u admin:admin123 http://localhost:3000/api/datasources 2>/dev/null | jq length)
        if [ "$datasources" -gt 0 ]; then
            print_pass "$datasources datasource(s) configured"
        else
            print_warn "No datasources configured"
        fi

        # Check dashboards
        print_check "Checking dashboards..."
        local dashboards=$(curl -s -u admin:admin123 http://localhost:3000/api/search?type=dash-db 2>/dev/null | jq length)
        if [ "$dashboards" -gt 0 ]; then
            print_pass "$dashboards dashboard(s) available"
        else
            print_warn "No dashboards found"
        fi
    fi
}

# Check AlertManager
check_alertmanager() {
    print_header "AlertManager Health Check"

    # Check container
    check_container "rul-alertmanager" "AlertManager"

    # Check port
    check_port "localhost" "9093" "AlertManager"

    # Check health endpoint
    if check_http "http://localhost:9093/-/healthy" "AlertManager health endpoint"; then
        # Check alerts
        print_check "Checking active alerts..."
        local alerts=$(curl -s http://localhost:9093/api/v1/alerts | jq '.data | length')
        if [ "$alerts" -eq 0 ]; then
            print_pass "No active alerts"
        else
            print_warn "$alerts active alert(s)"
        fi
    fi
}

# Check Node Exporter
check_node_exporter() {
    print_header "Node Exporter Health Check"

    # Check container
    check_container "rul-node-exporter" "Node Exporter"

    # Check port
    check_port "localhost" "9100" "Node Exporter"

    # Check metrics
    if check_http "http://localhost:9100/metrics" "Node Exporter metrics"; then
        print_check "Checking node metrics..."
        local metrics=$(curl -s http://localhost:9100/metrics | grep -c "^node_")
        if [ "$metrics" -gt 0 ]; then
            print_pass "$metrics node metrics available"
        else
            print_fail "No node metrics found"
        fi
    fi
}

# Check PostgreSQL Exporter
check_postgres_exporter() {
    print_header "PostgreSQL Exporter Health Check"

    # Check container
    check_container "rul-postgres-exporter" "PostgreSQL Exporter"

    # Check port
    check_port "localhost" "9187" "PostgreSQL Exporter"

    # Check metrics
    if check_http "http://localhost:9187/metrics" "PostgreSQL Exporter metrics"; then
        print_check "Checking PostgreSQL metrics..."
        local metrics=$(curl -s http://localhost:9187/metrics | grep -c "^pg_")
        if [ "$metrics" -gt 0 ]; then
            print_pass "$metrics PostgreSQL metrics available"
        else
            print_warn "No PostgreSQL metrics found (database may be unreachable)"
        fi
    fi
}

# Check Model Exporter
check_model_exporter() {
    print_header "Model Exporter Health Check"

    # Check container
    if check_container "rul-model-exporter" "Model Exporter"; then
        # Check port (same as Prometheus, check if accessible)
        if nc -z -w5 localhost 9091 2>/dev/null; then
            check_port "localhost" "9091" "Model Exporter"

            # Check metrics
            if curl -s -f -o /dev/null "http://localhost:9091/metrics"; then
                print_pass "Model Exporter metrics are available"

                print_check "Checking model metrics..."
                local metrics=$(curl -s http://localhost:9091/metrics | grep -c "^model_")
                if [ "$metrics" -gt 0 ]; then
                    print_pass "$metrics model metrics available"
                else
                    print_warn "No model metrics found"
                fi
            else
                print_fail "Model Exporter metrics not available"
            fi
        else
            print_warn "Model Exporter port not accessible (may be using port 9090)"
        fi
    fi
}

# Check system resources
check_system_resources() {
    print_header "System Resources Check"

    # Check disk space
    print_check "Checking disk space..."
    local disk_usage=$(df -h / | awk 'NR==2 {print $5}' | sed 's/%//')
    if [ "$disk_usage" -lt 80 ]; then
        print_pass "Disk usage: ${disk_usage}%"
    elif [ "$disk_usage" -lt 90 ]; then
        print_warn "Disk usage: ${disk_usage}% (consider cleanup)"
    else
        print_fail "Disk usage: ${disk_usage}% (critical)"
    fi

    # Check memory
    print_check "Checking memory..."
    local mem_usage=$(free | awk 'NR==2 {printf "%.0f", $3/$2 * 100}')
    if [ "$mem_usage" -lt 85 ]; then
        print_pass "Memory usage: ${mem_usage}%"
    elif [ "$mem_usage" -lt 95 ]; then
        print_warn "Memory usage: ${mem_usage}%"
    else
        print_fail "Memory usage: ${mem_usage}% (critical)"
    fi

    # Check Docker volumes
    print_check "Checking Docker volumes..."
    local volumes=$(docker volume ls --filter name=rul -q | wc -l)
    if [ "$volumes" -gt 0 ]; then
        print_pass "$volumes monitoring volume(s) exist"
    else
        print_warn "No monitoring volumes found"
    fi
}

# Check data retention
check_data_retention() {
    print_header "Data Retention Check"

    # Check Prometheus data size
    print_check "Checking Prometheus data size..."
    if docker exec rul-prometheus du -sh /prometheus 2>/dev/null; then
        print_pass "Prometheus data size checked"
    else
        print_warn "Cannot check Prometheus data size"
    fi

    # Check Grafana data
    print_check "Checking Grafana data..."
    if docker exec rul-grafana ls -lh /var/lib/grafana/grafana.db 2>/dev/null; then
        print_pass "Grafana database exists"
    else
        print_warn "Cannot check Grafana database"
    fi
}

# Summary
print_summary() {
    print_header "Health Check Summary"

    local total=$((PASSED + FAILED + WARNING))

    echo ""
    echo -e "Total Checks: ${BLUE}$total${NC}"
    echo -e "Passed:       ${GREEN}$PASSED${NC}"
    echo -e "Warnings:     ${YELLOW}$WARNING${NC}"
    echo -e "Failed:       ${RED}$FAILED${NC}"
    echo ""

    if [ $FAILED -eq 0 ] && [ $WARNING -eq 0 ]; then
        echo -e "${GREEN}✓ All checks passed!${NC}"
        return 0
    elif [ $FAILED -eq 0 ]; then
        echo -e "${YELLOW}⚠ Some checks have warnings${NC}"
        return 0
    else
        echo -e "${RED}✗ Some checks failed${NC}"
        return 1
    fi
}

# Main function
main() {
    echo ""
    echo -e "${BLUE}╔═══════════════════════════════════════════╗${NC}"
    echo -e "${BLUE}║   RUL Monitoring Stack Health Check      ║${NC}"
    echo -e "${BLUE}╚═══════════════════════════════════════════╝${NC}"

    # Run all checks
    check_prometheus
    check_grafana
    check_alertmanager
    check_node_exporter
    check_postgres_exporter
    check_model_exporter
    check_system_resources
    check_data_retention

    # Print summary
    print_summary
}

# Run main function
main "$@"
