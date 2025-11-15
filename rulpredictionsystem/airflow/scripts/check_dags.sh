#!/bin/bash

# ====================================================================================================
# DAG Validation Script
# ====================================================================================================
#
# This script checks all DAG files for syntax errors and import issues.
#
# Usage:
#   ./check_dags.sh
#
# ====================================================================================================

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

# Get script directory
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
AIRFLOW_HOME="$(dirname "$SCRIPT_DIR")"
DAGS_DIR="$AIRFLOW_HOME/dags"

echo -e "${GREEN}=====================================================================================================${NC}"
echo -e "${GREEN}DAG Validation${NC}"
echo -e "${GREEN}=====================================================================================================${NC}"
echo ""

# Check if DAGs directory exists
if [ ! -d "$DAGS_DIR" ]; then
    echo -e "${RED}Error: DAGs directory not found: $DAGS_DIR${NC}"
    exit 1
fi

# Set environment variables
export AIRFLOW_HOME="$AIRFLOW_HOME"
export PYTHONPATH="$AIRFLOW_HOME/dags:$AIRFLOW_HOME/operators:$AIRFLOW_HOME/plugins:$PYTHONPATH"

# Counter
TOTAL=0
PASSED=0
FAILED=0

# Check each DAG file
for dag_file in "$DAGS_DIR"/*.py; do
    if [ -f "$dag_file" ]; then
        TOTAL=$((TOTAL + 1))
        dag_name=$(basename "$dag_file")

        echo -n "Checking $dag_name... "

        # Try to import the DAG file
        if python3 "$dag_file" &>/dev/null; then
            echo -e "${GREEN}✓ PASSED${NC}"
            PASSED=$((PASSED + 1))
        else
            echo -e "${RED}✗ FAILED${NC}"
            FAILED=$((FAILED + 1))

            # Show error details
            echo -e "${YELLOW}Error details:${NC}"
            python3 "$dag_file" 2>&1 | head -20
            echo ""
        fi
    fi
done

echo ""
echo -e "${GREEN}=====================================================================================================${NC}"
echo -e "Summary:"
echo -e "  Total DAGs: $TOTAL"
echo -e "  Passed: ${GREEN}$PASSED${NC}"
echo -e "  Failed: ${RED}$FAILED${NC}"
echo -e "${GREEN}=====================================================================================================${NC}"

# Exit with error if any DAG failed
if [ $FAILED -gt 0 ]; then
    exit 1
fi

exit 0
