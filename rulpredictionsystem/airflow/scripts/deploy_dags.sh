#!/bin/bash

# ====================================================================================================
# DAG Deployment Script
# ====================================================================================================
#
# This script deploys DAGs to the Airflow DAGs directory with validation.
#
# Usage:
#   ./deploy_dags.sh [source_dir] [--validate] [--backup]
#
# Options:
#   source_dir: Directory containing DAG files to deploy (default: current directory)
#   --validate: Validate DAGs before deployment
#   --backup: Create backup of existing DAGs
#
# ====================================================================================================

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Script directory
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
AIRFLOW_HOME="$(dirname "$SCRIPT_DIR")"
DAGS_DIR="$AIRFLOW_HOME/dags"

# Default options
SOURCE_DIR="${1:-$PWD}"
VALIDATE=false
BACKUP=false

# Parse arguments
for arg in "$@"; do
    case $arg in
        --validate)
            VALIDATE=true
            shift
            ;;
        --backup)
            BACKUP=true
            shift
            ;;
    esac
done

echo -e "${BLUE}=====================================================================================================${NC}"
echo -e "${BLUE}DAG Deployment${NC}"
echo -e "${BLUE}=====================================================================================================${NC}"
echo ""

# Check if source directory exists
if [ ! -d "$SOURCE_DIR" ]; then
    echo -e "${RED}Error: Source directory not found: $SOURCE_DIR${NC}"
    exit 1
fi

# Check if DAGs directory exists
if [ ! -d "$DAGS_DIR" ]; then
    echo -e "${RED}Error: DAGs directory not found: $DAGS_DIR${NC}"
    exit 1
fi

# Create backup if requested
if [ "$BACKUP" = true ]; then
    BACKUP_DIR="$AIRFLOW_HOME/backups/dags_$(date +%Y%m%d_%H%M%S)"
    echo -e "${GREEN}Creating backup...${NC}"
    mkdir -p "$BACKUP_DIR"
    cp -r "$DAGS_DIR"/*.py "$BACKUP_DIR" 2>/dev/null || true
    echo "  Backup created at: $BACKUP_DIR"
    echo ""
fi

# Validate DAGs if requested
if [ "$VALIDATE" = true ]; then
    echo -e "${GREEN}Validating DAGs...${NC}"

    export PYTHONPATH="$AIRFLOW_HOME/dags:$AIRFLOW_HOME/operators:$AIRFLOW_HOME/plugins:$PYTHONPATH"

    for dag_file in "$SOURCE_DIR"/*.py; do
        if [ -f "$dag_file" ]; then
            dag_name=$(basename "$dag_file")
            echo -n "  Validating $dag_name... "

            if python3 "$dag_file" &>/dev/null; then
                echo -e "${GREEN}✓${NC}"
            else
                echo -e "${RED}✗ FAILED${NC}"
                echo -e "${RED}Validation failed for $dag_name. Aborting deployment.${NC}"
                exit 1
            fi
        fi
    done

    echo ""
fi

# Deploy DAGs
echo -e "${GREEN}Deploying DAGs...${NC}"

DEPLOYED=0

for dag_file in "$SOURCE_DIR"/*.py; do
    if [ -f "$dag_file" ]; then
        dag_name=$(basename "$dag_file")
        echo -n "  Deploying $dag_name... "

        cp "$dag_file" "$DAGS_DIR/"

        echo -e "${GREEN}✓${NC}"
        DEPLOYED=$((DEPLOYED + 1))
    fi
done

echo ""
echo -e "${GREEN}=====================================================================================================${NC}"
echo -e "${GREEN}Deployment completed!${NC}"
echo -e "${GREEN}=====================================================================================================${NC}"
echo ""
echo "Summary:"
echo "  Deployed $DEPLOYED DAG(s) to $DAGS_DIR"
echo ""

if [ "$BACKUP" = true ]; then
    echo "Backup location: $BACKUP_DIR"
    echo ""
fi

echo "Next steps:"
echo "  1. Check Airflow UI to verify DAGs are loaded"
echo "  2. Run: airflow dags list"
echo "  3. Check for import errors: airflow dags list-import-errors"
echo ""

exit 0
