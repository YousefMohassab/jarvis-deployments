#!/bin/bash

# ====================================================================================================
# Airflow Initialization Script
# ====================================================================================================
#
# This script initializes Apache Airflow for the RUL Prediction System:
# - Sets up environment variables
# - Initializes Airflow database
# - Creates admin user
# - Sets up connections and variables
# - Configures plugins and operators
#
# Usage:
#   ./init_airflow.sh [--reset]
#
# Options:
#   --reset: Reset the database (WARNING: This will delete all data)
#
# ====================================================================================================

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Script directory
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
AIRFLOW_HOME="$(dirname "$SCRIPT_DIR")"
PROJECT_ROOT="$(dirname "$AIRFLOW_HOME")"

# Configuration
AIRFLOW_VERSION="2.7.3"
PYTHON_VERSION="3.10"
ADMIN_USERNAME="${AIRFLOW_ADMIN_USERNAME:-admin}"
ADMIN_PASSWORD="${AIRFLOW_ADMIN_PASSWORD:-admin}"
ADMIN_EMAIL="${AIRFLOW_ADMIN_EMAIL:-admin@example.com}"

echo -e "${BLUE}=====================================================================================================${NC}"
echo -e "${BLUE}Airflow Initialization Script - RUL Prediction System${NC}"
echo -e "${BLUE}=====================================================================================================${NC}"
echo ""

# Parse arguments
RESET_DB=false
while [[ $# -gt 0 ]]; do
    case $1 in
        --reset)
            RESET_DB=true
            shift
            ;;
        *)
            echo -e "${RED}Unknown option: $1${NC}"
            exit 1
            ;;
    esac
done

# ====================================================================================================
# Step 1: Check Prerequisites
# ====================================================================================================

echo -e "${GREEN}[1/8] Checking prerequisites...${NC}"

# Check Python version
if ! command -v python3 &> /dev/null; then
    echo -e "${RED}Error: Python 3 is not installed${NC}"
    exit 1
fi

PYTHON_VER=$(python3 --version | cut -d' ' -f2 | cut -d'.' -f1,2)
echo "  - Python version: $PYTHON_VER"

# Check required directories
echo "  - Project root: $PROJECT_ROOT"
echo "  - Airflow home: $AIRFLOW_HOME"

# Create required directories
mkdir -p "$AIRFLOW_HOME"/{logs,dags,plugins,operators,config}
mkdir -p "$PROJECT_ROOT"/{data,models}
mkdir -p "$PROJECT_ROOT/data"/{raw,processed,features,test}
mkdir -p "$PROJECT_ROOT/models"/{staging,production,backups}

echo -e "${GREEN}  Prerequisites check completed!${NC}\n"

# ====================================================================================================
# Step 2: Set Environment Variables
# ====================================================================================================

echo -e "${GREEN}[2/8] Setting environment variables...${NC}"

export AIRFLOW_HOME="$AIRFLOW_HOME"
export RUL_PROJECT_ROOT="$PROJECT_ROOT"
export PYTHONPATH="$PROJECT_ROOT:$AIRFLOW_HOME/dags:$AIRFLOW_HOME/plugins:$PYTHONPATH"

# Set Airflow environment variables
export AIRFLOW__CORE__DAGS_FOLDER="$AIRFLOW_HOME/dags"
export AIRFLOW__CORE__BASE_LOG_FOLDER="$AIRFLOW_HOME/logs"
export AIRFLOW__CORE__EXECUTOR="LocalExecutor"
export AIRFLOW__CORE__LOAD_EXAMPLES="False"
export AIRFLOW__CORE__LOAD_DEFAULT_CONNECTIONS="True"
export AIRFLOW__DATABASE__SQL_ALCHEMY_CONN="sqlite:///$AIRFLOW_HOME/airflow.db"

echo "  - AIRFLOW_HOME: $AIRFLOW_HOME"
echo "  - RUL_PROJECT_ROOT: $RUL_PROJECT_ROOT"
echo -e "${GREEN}  Environment variables set!${NC}\n"

# ====================================================================================================
# Step 3: Install Dependencies
# ====================================================================================================

echo -e "${GREEN}[3/8] Installing dependencies...${NC}"

if [ -f "$AIRFLOW_HOME/requirements.txt" ]; then
    echo "  Installing Python packages..."
    pip install -q --upgrade pip
    pip install -q -r "$AIRFLOW_HOME/requirements.txt"
    echo -e "${GREEN}  Dependencies installed!${NC}\n"
else
    echo -e "${YELLOW}  Warning: requirements.txt not found${NC}\n"
fi

# ====================================================================================================
# Step 4: Initialize Airflow Database
# ====================================================================================================

echo -e "${GREEN}[4/8] Initializing Airflow database...${NC}"

if [ "$RESET_DB" = true ]; then
    echo -e "${YELLOW}  Resetting database (deleting all data)...${NC}"
    rm -f "$AIRFLOW_HOME/airflow.db"
fi

# Initialize the database
echo "  Running airflow db init..."
airflow db init

# Upgrade database to latest schema
echo "  Running airflow db upgrade..."
airflow db upgrade

echo -e "${GREEN}  Database initialized!${NC}\n"

# ====================================================================================================
# Step 5: Create Admin User
# ====================================================================================================

echo -e "${GREEN}[5/8] Creating admin user...${NC}"

# Check if user already exists
if airflow users list | grep -q "$ADMIN_USERNAME"; then
    echo -e "${YELLOW}  User '$ADMIN_USERNAME' already exists${NC}"
else
    echo "  Creating user '$ADMIN_USERNAME'..."
    airflow users create \
        --username "$ADMIN_USERNAME" \
        --password "$ADMIN_PASSWORD" \
        --firstname Admin \
        --lastname User \
        --role Admin \
        --email "$ADMIN_EMAIL"
    echo -e "${GREEN}  Admin user created!${NC}"
fi

echo ""

# ====================================================================================================
# Step 6: Set Airflow Variables
# ====================================================================================================

echo -e "${GREEN}[6/8] Setting Airflow variables...${NC}"

# Set project-specific variables
airflow variables set project_root "$PROJECT_ROOT"
airflow variables set data_dir "$PROJECT_ROOT/data"
airflow variables set models_dir "$PROJECT_ROOT/models"
airflow variables set alert_email "admin@example.com"
airflow variables set success_email "team@example.com"
airflow variables set training_epochs "100"
airflow variables set learning_rate "0.001"

echo "  Variables set:"
echo "    - project_root: $PROJECT_ROOT"
echo "    - data_dir: $PROJECT_ROOT/data"
echo "    - models_dir: $PROJECT_ROOT/models"
echo "    - training_epochs: 100"
echo "    - learning_rate: 0.001"

echo -e "${GREEN}  Variables configured!${NC}\n"

# ====================================================================================================
# Step 7: Set Airflow Connections
# ====================================================================================================

echo -e "${GREEN}[7/8] Setting Airflow connections...${NC}"

# Add database connection
airflow connections add 'postgres_default' \
    --conn-type 'postgres' \
    --conn-host 'localhost' \
    --conn-schema 'rul_prediction' \
    --conn-login 'airflow' \
    --conn-password 'airflow' \
    --conn-port 5432 \
    2>/dev/null || echo "  Connection 'postgres_default' already exists"

# Add HTTP connection for API
airflow connections add 'rul_api' \
    --conn-type 'http' \
    --conn-host 'localhost' \
    --conn-port 8000 \
    2>/dev/null || echo "  Connection 'rul_api' already exists"

echo -e "${GREEN}  Connections configured!${NC}\n"

# ====================================================================================================
# Step 8: Validate Installation
# ====================================================================================================

echo -e "${GREEN}[8/8] Validating installation...${NC}"

# Check Airflow version
INSTALLED_VERSION=$(airflow version)
echo "  - Airflow version: $INSTALLED_VERSION"

# Check database connection
if airflow db check; then
    echo "  - Database connection: OK"
else
    echo -e "${RED}  - Database connection: FAILED${NC}"
    exit 1
fi

# List DAGs
echo "  - Checking DAGs..."
DAG_COUNT=$(airflow dags list 2>/dev/null | wc -l)
echo "    Found $DAG_COUNT DAG(s)"

# Validate DAG files
echo "  - Validating DAG files..."
for dag_file in "$AIRFLOW_HOME/dags"/*.py; do
    if [ -f "$dag_file" ]; then
        dag_name=$(basename "$dag_file")
        if python3 "$dag_file" &>/dev/null; then
            echo "    ✓ $dag_name"
        else
            echo -e "    ${YELLOW}⚠ $dag_name (has issues)${NC}"
        fi
    fi
done

echo -e "${GREEN}  Validation completed!${NC}\n"

# ====================================================================================================
# Summary
# ====================================================================================================

echo -e "${BLUE}=====================================================================================================${NC}"
echo -e "${GREEN}Airflow initialization completed successfully!${NC}"
echo -e "${BLUE}=====================================================================================================${NC}"
echo ""
echo "Next steps:"
echo "  1. Start Airflow webserver:"
echo "     airflow webserver --port 8080"
echo ""
echo "  2. Start Airflow scheduler (in a separate terminal):"
echo "     airflow scheduler"
echo ""
echo "  3. Access Airflow UI:"
echo "     http://localhost:8080"
echo ""
echo "  4. Login credentials:"
echo "     Username: $ADMIN_USERNAME"
echo "     Password: $ADMIN_PASSWORD"
echo ""
echo "Alternative - Start with Docker Compose:"
echo "  cd $AIRFLOW_HOME"
echo "  docker-compose up -d"
echo ""
echo -e "${BLUE}=====================================================================================================${NC}"

# Create a .env file for Docker Compose
cat > "$AIRFLOW_HOME/.env" <<EOF
# Airflow Environment Variables
AIRFLOW_UID=$(id -u)
AIRFLOW_PROJ_DIR=$AIRFLOW_HOME
RUL_PROJECT_ROOT=$PROJECT_ROOT

# Admin credentials
_AIRFLOW_WWW_USER_USERNAME=$ADMIN_USERNAME
_AIRFLOW_WWW_USER_PASSWORD=$ADMIN_PASSWORD

# Email configuration (configure for production)
SMTP_HOST=smtp.gmail.com
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=your-app-password
SMTP_PORT=587

# Additional Python packages
_PIP_ADDITIONAL_REQUIREMENTS=
EOF

echo -e "${GREEN}.env file created at: $AIRFLOW_HOME/.env${NC}"
echo ""

# Create helper scripts
cat > "$AIRFLOW_HOME/start_airflow.sh" <<'EOF'
#!/bin/bash
# Start Airflow webserver and scheduler

AIRFLOW_HOME="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
cd "$AIRFLOW_HOME"

echo "Starting Airflow..."
echo "Webserver: http://localhost:8080"
echo ""

# Start webserver in background
airflow webserver --port 8080 &
WEBSERVER_PID=$!

# Start scheduler
airflow scheduler &
SCHEDULER_PID=$!

echo "Airflow started!"
echo "Webserver PID: $WEBSERVER_PID"
echo "Scheduler PID: $SCHEDULER_PID"
echo ""
echo "To stop Airflow, run: ./stop_airflow.sh"

# Wait for both processes
wait $WEBSERVER_PID $SCHEDULER_PID
EOF

cat > "$AIRFLOW_HOME/stop_airflow.sh" <<'EOF'
#!/bin/bash
# Stop Airflow services

echo "Stopping Airflow..."

pkill -f "airflow webserver"
pkill -f "airflow scheduler"

echo "Airflow stopped!"
EOF

chmod +x "$AIRFLOW_HOME/start_airflow.sh"
chmod +x "$AIRFLOW_HOME/stop_airflow.sh"

echo -e "${GREEN}Helper scripts created:${NC}"
echo "  - start_airflow.sh: Start Airflow services"
echo "  - stop_airflow.sh: Stop Airflow services"
echo ""

exit 0
