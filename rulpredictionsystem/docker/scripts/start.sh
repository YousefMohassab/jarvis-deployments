#!/bin/bash
# ============================================================================
# Quick Start Script
# One-command setup and launch for the RUL prediction system
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
ENV=${ENV:-"development"}
BUILD=${BUILD:-"false"}
PULL=${PULL:-"false"}

# Script directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "${SCRIPT_DIR}/../.." && pwd)"

cd "${PROJECT_ROOT}"

echo -e "${BLUE}============================================================================${NC}"
echo -e "${BLUE}RUL Prediction System - Quick Start${NC}"
echo -e "${BLUE}============================================================================${NC}"
echo "Environment: ${ENV}"
echo "Project root: ${PROJECT_ROOT}"
echo ""

# Function to check prerequisites
check_prerequisites() {
    echo -e "${YELLOW}Checking prerequisites...${NC}"

    # Check Docker
    if ! command -v docker &> /dev/null; then
        echo -e "${RED}✗ Docker not found${NC}"
        echo "Install Docker: https://docs.docker.com/get-docker/"
        exit 1
    fi
    echo -e "${GREEN}✓ Docker found: $(docker --version)${NC}"

    # Check Docker Compose
    if ! command -v docker-compose &> /dev/null; then
        echo -e "${RED}✗ Docker Compose not found${NC}"
        echo "Install Docker Compose: https://docs.docker.com/compose/install/"
        exit 1
    fi
    echo -e "${GREEN}✓ Docker Compose found: $(docker-compose --version)${NC}"

    # Check Docker daemon
    if ! docker info &> /dev/null; then
        echo -e "${RED}✗ Docker daemon not running${NC}"
        echo "Start Docker daemon and try again"
        exit 1
    fi
    echo -e "${GREEN}✓ Docker daemon is running${NC}"

    echo ""
}

# Function to setup environment
setup_environment() {
    echo -e "${YELLOW}Setting up environment...${NC}"

    # Check if .env exists
    if [ ! -f .env ]; then
        echo -e "${YELLOW}⚠ .env file not found${NC}"

        if [ "${ENV}" = "development" ]; then
            echo "Creating .env from .env.development..."
            cp .env.development .env
        elif [ "${ENV}" = "production" ]; then
            if [ -f .env.production ]; then
                echo "Creating .env from .env.production..."
                cp .env.production .env
            else
                echo "Creating .env from .env.example..."
                cp .env.example .env
                echo -e "${YELLOW}⚠ Please update .env with your configuration${NC}"
            fi
        else
            echo "Creating .env from .env.example..."
            cp .env.example .env
        fi

        echo -e "${GREEN}✓ .env file created${NC}"
    else
        echo -e "${GREEN}✓ .env file exists${NC}"
    fi

    echo ""
}

# Function to build or pull images
prepare_images() {
    if [ "${BUILD}" = "true" ]; then
        echo -e "${YELLOW}Building images...${NC}"
        ./docker/scripts/build_all.sh
        echo -e "${GREEN}✓ Images built${NC}\n"
    elif [ "${PULL}" = "true" ]; then
        echo -e "${YELLOW}Pulling images...${NC}"
        docker-compose pull
        echo -e "${GREEN}✓ Images pulled${NC}\n"
    else
        echo -e "${YELLOW}Skipping image build/pull${NC}\n"
    fi
}

# Function to start services
start_services() {
    echo -e "${YELLOW}Starting services...${NC}"

    if [ "${ENV}" = "development" ]; then
        docker-compose -f docker-compose.yml -f docker-compose.dev.yml up -d
    else
        docker-compose up -d
    fi

    echo -e "${GREEN}✓ Services started${NC}\n"
}

# Function to wait for services
wait_for_services() {
    echo -e "${YELLOW}Waiting for services to be ready...${NC}"

    # Wait for database
    echo -n "  Waiting for PostgreSQL..."
    for i in {1..30}; do
        if docker-compose exec -T postgres pg_isready -U postgres &> /dev/null; then
            echo -e " ${GREEN}✓${NC}"
            break
        fi
        echo -n "."
        sleep 2
    done

    # Wait for Redis
    echo -n "  Waiting for Redis..."
    for i in {1..30}; do
        if docker-compose exec -T redis redis-cli ping &> /dev/null; then
            echo -e " ${GREEN}✓${NC}"
            break
        fi
        echo -n "."
        sleep 2
    done

    # Wait for API
    echo -n "  Waiting for API..."
    for i in {1..60}; do
        if curl -f http://localhost:8000/health &> /dev/null; then
            echo -e " ${GREEN}✓${NC}"
            break
        fi
        echo -n "."
        sleep 2
    done

    echo ""
}

# Function to display status
display_status() {
    echo -e "${BLUE}============================================================================${NC}"
    echo -e "${BLUE}Service Status${NC}"
    echo -e "${BLUE}============================================================================${NC}"

    docker-compose ps

    echo ""
}

# Function to display access info
display_access_info() {
    echo -e "${BLUE}============================================================================${NC}"
    echo -e "${BLUE}Access Information${NC}"
    echo -e "${BLUE}============================================================================${NC}"
    echo ""
    echo -e "${GREEN}Dashboard:${NC}         http://localhost:80"
    echo -e "${GREEN}API:${NC}               http://localhost:8000"
    echo -e "${GREEN}API Docs:${NC}          http://localhost:8000/docs"
    echo -e "${GREEN}API Health:${NC}        http://localhost:8000/health"
    echo -e "${GREEN}Airflow:${NC}           http://localhost:8080 (admin/admin)"
    echo -e "${GREEN}Flower:${NC}            http://localhost:5555"
    echo -e "${GREEN}Grafana:${NC}           http://localhost:3000 (admin/admin)"
    echo -e "${GREEN}Prometheus:${NC}        http://localhost:9090"

    if [ "${ENV}" = "development" ]; then
        echo ""
        echo -e "${YELLOW}Development Tools:${NC}"
        echo -e "${GREEN}PgAdmin:${NC}           http://localhost:5050"
        echo -e "${GREEN}Redis Commander:${NC}   http://localhost:8081"
        echo -e "${GREEN}Mailhog:${NC}           http://localhost:8025"
        echo -e "${GREEN}Jupyter:${NC}           http://localhost:8888"
    fi

    echo ""
}

# Function to display useful commands
display_commands() {
    echo -e "${BLUE}============================================================================${NC}"
    echo -e "${BLUE}Useful Commands${NC}"
    echo -e "${BLUE}============================================================================${NC}"
    echo ""
    echo "View logs:           ./docker/scripts/logs.sh -f"
    echo "Check health:        ./docker/scripts/health_check.sh"
    echo "Stop services:       docker-compose down"
    echo "Restart service:     docker-compose restart [service]"
    echo "View service logs:   docker-compose logs -f [service]"
    echo "Access shell:        docker-compose exec [service] bash"
    echo ""
}

# Main execution
main() {
    check_prerequisites
    setup_environment
    prepare_images
    start_services
    wait_for_services
    display_status
    display_access_info
    display_commands

    echo -e "${GREEN}✓ RUL Prediction System is ready!${NC}"
    echo ""
}

# Show usage
show_usage() {
    echo "Usage: $0 [OPTIONS]"
    echo ""
    echo "Options:"
    echo "  --env ENV           Environment (development/production) [default: development]"
    echo "  --build             Build images before starting"
    echo "  --pull              Pull images before starting"
    echo "  --help              Show this help message"
    echo ""
    echo "Examples:"
    echo "  $0                                  # Start with default settings"
    echo "  $0 --env development --build        # Build and start development"
    echo "  $0 --env production --pull          # Pull and start production"
}

# Parse arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        --env)
            ENV="$2"
            shift 2
            ;;
        --build)
            BUILD="true"
            shift
            ;;
        --pull)
            PULL="true"
            shift
            ;;
        --help)
            show_usage
            exit 0
            ;;
        *)
            echo "Unknown option: $1"
            show_usage
            exit 1
            ;;
    esac
done

# Run main
main
