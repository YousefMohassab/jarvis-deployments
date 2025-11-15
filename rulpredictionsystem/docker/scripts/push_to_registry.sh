#!/bin/bash
# ============================================================================
# Push Docker Images to Registry
# Supports Docker Hub, AWS ECR, Azure ACR, and GCR
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
REGISTRY_TYPE=${REGISTRY_TYPE:-"dockerhub"}  # dockerhub, ecr, acr, gcr

# Images to push
IMAGES=(
    "rul-prediction-api"
    "rul-prediction-dashboard"
    "rul-prediction-training"
    "rul-prediction-airflow"
    "rul-prediction-prometheus"
    "rul-prediction-grafana"
)

echo -e "${GREEN}============================================================================${NC}"
echo -e "${GREEN}Pushing Images to Registry${NC}"
echo -e "${GREEN}============================================================================${NC}"
echo "Registry: ${REGISTRY}"
echo "Registry Type: ${REGISTRY_TYPE}"
echo "Version: ${VERSION}"
echo ""

# Login to registry
login_to_registry() {
    case "${REGISTRY_TYPE}" in
        dockerhub)
            echo -e "${YELLOW}Logging in to Docker Hub...${NC}"
            docker login -u "${DOCKER_USERNAME}" -p "${DOCKER_PASSWORD}"
            ;;
        ecr)
            echo -e "${YELLOW}Logging in to AWS ECR...${NC}"
            AWS_REGION=${AWS_REGION:-us-east-1}
            aws ecr get-login-password --region "${AWS_REGION}" | \
                docker login --username AWS --password-stdin "${REGISTRY}"
            ;;
        acr)
            echo -e "${YELLOW}Logging in to Azure ACR...${NC}"
            az acr login --name "${REGISTRY}"
            ;;
        gcr)
            echo -e "${YELLOW}Logging in to Google GCR...${NC}"
            gcloud auth configure-docker
            ;;
        *)
            echo -e "${RED}Unknown registry type: ${REGISTRY_TYPE}${NC}"
            exit 1
            ;;
    esac

    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✓ Successfully logged in to registry${NC}\n"
    else
        echo -e "${RED}✗ Failed to login to registry${NC}"
        exit 1
    fi
}

# Tag and push image
push_image() {
    local image=$1

    if [ -z "$REGISTRY" ]; then
        echo -e "${RED}Error: DOCKER_REGISTRY not set${NC}"
        exit 1
    fi

    local source_image="${image}:${VERSION}"
    local target_image="${REGISTRY}/${image}:${VERSION}"
    local latest_image="${REGISTRY}/${image}:latest"

    echo -e "${YELLOW}Pushing ${image}...${NC}"

    # Tag with version
    docker tag "${source_image}" "${target_image}"
    docker push "${target_image}"

    if [ $? -ne 0 ]; then
        echo -e "${RED}✗ Failed to push ${target_image}${NC}"
        return 1
    fi

    # Tag as latest
    docker tag "${source_image}" "${latest_image}"
    docker push "${latest_image}"

    if [ $? -ne 0 ]; then
        echo -e "${RED}✗ Failed to push ${latest_image}${NC}"
        return 1
    fi

    # Tag with git SHA if available
    if command -v git &> /dev/null; then
        VCS_REF=$(git rev-parse --short HEAD 2>/dev/null || echo "")
        if [ -n "$VCS_REF" ]; then
            local sha_image="${REGISTRY}/${image}:${VCS_REF}"
            docker tag "${source_image}" "${sha_image}"
            docker push "${sha_image}"
        fi
    fi

    echo -e "${GREEN}✓ ${image} pushed successfully${NC}\n"
}

# Login to registry
login_to_registry

# Push all images
for image in "${IMAGES[@]}"; do
    push_image "${image}"
done

echo -e "${GREEN}============================================================================${NC}"
echo -e "${GREEN}All images pushed successfully!${NC}"
echo -e "${GREEN}============================================================================${NC}"

# List pushed images
echo -e "\n${YELLOW}Pushed images:${NC}"
for image in "${IMAGES[@]}"; do
    echo "  - ${REGISTRY}/${image}:${VERSION}"
    echo "  - ${REGISTRY}/${image}:latest"
done

# Create manifest (for multi-arch if needed)
if [ "${CREATE_MANIFEST:-false}" = "true" ]; then
    echo -e "\n${YELLOW}Creating manifests for multi-architecture support...${NC}"
    for image in "${IMAGES[@]}"; do
        docker manifest create "${REGISTRY}/${image}:${VERSION}" \
            "${REGISTRY}/${image}:${VERSION}-amd64" \
            "${REGISTRY}/${image}:${VERSION}-arm64" || true
        docker manifest push "${REGISTRY}/${image}:${VERSION}" || true
    done
fi

echo -e "\n${GREEN}Push process completed!${NC}"
