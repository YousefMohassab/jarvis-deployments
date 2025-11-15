#!/bin/bash
# ============================================================================
# Build All Docker Images
# This script builds all Docker images for the RUL prediction system
# ============================================================================

set -e  # Exit on error
set -u  # Exit on undefined variable

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
VERSION=${VERSION:-"latest"}
REGISTRY=${DOCKER_REGISTRY:-""}
BUILD_DATE=$(date -u +'%Y-%m-%dT%H:%M:%SZ')
VCS_REF=$(git rev-parse --short HEAD 2>/dev/null || echo "unknown")

# Project root directory
PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"

echo -e "${GREEN}============================================================================${NC}"
echo -e "${GREEN}Building RUL Prediction System Docker Images${NC}"
echo -e "${GREEN}============================================================================${NC}"
echo "Version: ${VERSION}"
echo "Build Date: ${BUILD_DATE}"
echo "VCS Ref: ${VCS_REF}"
echo "Project Root: ${PROJECT_ROOT}"
echo ""

# Function to build an image
build_image() {
    local name=$1
    local dockerfile=$2
    local context=$3
    local image_name=$4

    echo -e "${YELLOW}Building ${name}...${NC}"

    if [ -n "$REGISTRY" ]; then
        full_image_name="${REGISTRY}/${image_name}"
    else
        full_image_name="${image_name}"
    fi

    docker build \
        --file "${PROJECT_ROOT}/${dockerfile}" \
        --tag "${full_image_name}:${VERSION}" \
        --tag "${full_image_name}:latest" \
        --build-arg VERSION="${VERSION}" \
        --build-arg BUILD_DATE="${BUILD_DATE}" \
        --build-arg VCS_REF="${VCS_REF}" \
        "${PROJECT_ROOT}/${context}"

    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✓ ${name} built successfully${NC}\n"
    else
        echo -e "${RED}✗ Failed to build ${name}${NC}\n"
        exit 1
    fi
}

# Build API image
build_image "API Backend" \
    "docker/api/Dockerfile" \
    "." \
    "rul-prediction-api"

# Build Dashboard image
build_image "Dashboard Frontend" \
    "docker/dashboard/Dockerfile" \
    "." \
    "rul-prediction-dashboard"

# Build Training image
build_image "Training Container" \
    "docker/training/Dockerfile" \
    "." \
    "rul-prediction-training"

# Build Airflow image
build_image "Airflow" \
    "docker/airflow/Dockerfile" \
    "." \
    "rul-prediction-airflow"

# Build Prometheus image
build_image "Prometheus" \
    "docker/monitoring/Dockerfile.prometheus" \
    "." \
    "rul-prediction-prometheus"

# Build Grafana image
build_image "Grafana" \
    "docker/monitoring/Dockerfile.grafana" \
    "." \
    "rul-prediction-grafana"

echo -e "${GREEN}============================================================================${NC}"
echo -e "${GREEN}All images built successfully!${NC}"
echo -e "${GREEN}============================================================================${NC}"

# List built images
echo -e "\n${YELLOW}Built images:${NC}"
docker images | grep -E "rul-prediction|REPOSITORY"

# Image size summary
echo -e "\n${YELLOW}Image size summary:${NC}"
docker images --format "table {{.Repository}}\t{{.Tag}}\t{{.Size}}" | grep -E "rul-prediction|REPOSITORY"

# Optional: Run security scan with Trivy
if command -v trivy &> /dev/null; then
    echo -e "\n${YELLOW}Running security scans with Trivy...${NC}"

    for image in "rul-prediction-api" "rul-prediction-dashboard" "rul-prediction-training" "rul-prediction-airflow"; do
        echo -e "\n${YELLOW}Scanning ${image}:${VERSION}...${NC}"
        trivy image --severity HIGH,CRITICAL "${image}:${VERSION}"
    done
else
    echo -e "\n${YELLOW}Trivy not found. Skipping security scans.${NC}"
    echo "Install Trivy: https://github.com/aquasecurity/trivy"
fi

echo -e "\n${GREEN}Build process completed!${NC}"
