#!/bin/bash

# Smart Building Energy Management System - Project Verification Script
# This script verifies that all components are properly set up

set -e

PROJECT_ROOT="/home/facilis/workspace/storage/UZ2CcrTd13NrEAm81F1qLWHyAiD2/projects/smart-building-energy-mgmt"

echo "========================================="
echo "  Smart Building Energy Management"
echo "  Project Verification"
echo "========================================="
echo ""

# Color codes
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

success() {
    echo -e "${GREEN}✓${NC} $1"
}

error() {
    echo -e "${RED}✗${NC} $1"
}

warning() {
    echo -e "${YELLOW}⚠${NC} $1"
}

# Check if project directory exists
echo "Checking project structure..."
if [ -d "$PROJECT_ROOT" ]; then
    success "Project root directory exists"
else
    error "Project root directory not found"
    exit 1
fi

# Check frontend
echo ""
echo "Verifying Frontend..."
if [ -d "$PROJECT_ROOT/frontend" ]; then
    success "Frontend directory exists"

    # Check critical frontend files
    FRONTEND_FILES=(
        "package.json"
        "vite.config.js"
        "Dockerfile"
        "nginx.conf"
        "tailwind.config.js"
        "postcss.config.js"
        "index.html"
        ".env.example"
        "README.md"
    )

    for file in "${FRONTEND_FILES[@]}"; do
        if [ -f "$PROJECT_ROOT/frontend/$file" ]; then
            success "  $file"
        else
            error "  $file missing"
        fi
    done

    # Check if src directory exists
    if [ -d "$PROJECT_ROOT/frontend/src" ]; then
        success "  src/ directory exists"

        # Count components
        COMPONENT_COUNT=$(find "$PROJECT_ROOT/frontend/src" -name "*.jsx" -o -name "*.js" | wc -l)
        success "  Found $COMPONENT_COUNT JavaScript/JSX files"
    else
        error "  src/ directory missing"
    fi

    # Check if dist exists (production build)
    if [ -d "$PROJECT_ROOT/frontend/dist" ]; then
        success "  dist/ directory exists (production build present)"

        # Check if index.html exists in dist
        if [ -f "$PROJECT_ROOT/frontend/dist/index.html" ]; then
            success "    dist/index.html exists"

            # Check for relative paths
            if grep -q 'src="\./assets' "$PROJECT_ROOT/frontend/dist/index.html"; then
                success "    Uses relative paths (Coolify compatible)"
            else
                warning "    May not use relative paths"
            fi
        else
            warning "    dist/index.html missing (run npm run build)"
        fi
    else
        warning "  dist/ directory missing (run npm run build to create)"
    fi

else
    error "Frontend directory not found"
fi

# Check backend
echo ""
echo "Verifying Backend..."
if [ -d "$PROJECT_ROOT/backend" ]; then
    success "Backend directory exists"

    # Check critical backend files
    BACKEND_FILES=(
        "package.json"
        "server.js"
        "Dockerfile"
        "docker-compose.yml"
        ".env.example"
        "README.md"
    )

    for file in "${BACKEND_FILES[@]}"; do
        if [ -f "$PROJECT_ROOT/backend/$file" ]; then
            success "  $file"
        else
            error "  $file missing"
        fi
    done

    # Check if src directory exists
    if [ -d "$PROJECT_ROOT/backend/src" ]; then
        success "  src/ directory exists"

        # Check subdirectories
        BACKEND_DIRS=(
            "routes"
            "controllers"
            "models"
            "services"
            "middleware"
            "config"
            "workers"
            "utils"
        )

        for dir in "${BACKEND_DIRS[@]}"; do
            if [ -d "$PROJECT_ROOT/backend/src/$dir" ]; then
                FILE_COUNT=$(find "$PROJECT_ROOT/backend/src/$dir" -name "*.js" | wc -l)
                success "    src/$dir/ ($FILE_COUNT files)"
            else
                error "    src/$dir/ missing"
            fi
        done
    else
        error "  src/ directory missing"
    fi

else
    error "Backend directory not found"
fi

# Check documentation
echo ""
echo "Verifying Documentation..."
DOC_FILES=(
    "PROJECT_COMPLETE.md"
    "QUICKSTART.md"
    "ARCHITECTURE.md"
    "IMPLEMENTATION_GUIDE.md"
    "DATABASE_MIGRATIONS.sql"
    "API_DOCUMENTATION.md"
    "SYSTEM_FLOWS.md"
)

for file in "${DOC_FILES[@]}"; do
    if [ -f "$PROJECT_ROOT/$file" ]; then
        success "  $file"
    else
        error "  $file missing"
    fi
done

# Summary
echo ""
echo "========================================="
echo "  Verification Summary"
echo "========================================="

# Count total files
TOTAL_FILES=$(find "$PROJECT_ROOT" -type f | wc -l)
JS_FILES=$(find "$PROJECT_ROOT" -name "*.js" -o -name "*.jsx" | wc -l)
DOC_FILES=$(find "$PROJECT_ROOT" -name "*.md" | wc -l)

echo ""
echo "Project Statistics:"
echo "  Total files: $TOTAL_FILES"
echo "  JavaScript files: $JS_FILES"
echo "  Documentation files: $DOC_FILES"

echo ""
echo "Project Location:"
echo "  $PROJECT_ROOT"

echo ""
echo "Quick Start Commands:"
echo "  cd $PROJECT_ROOT"
echo "  cd backend && docker-compose up -d"
echo "  cd ../frontend && npm install && npm run dev"

echo ""
echo "Access URLs:"
echo "  Frontend: http://localhost:3000"
echo "  Backend: http://localhost:8000"
echo "  Health Check: http://localhost:8000/health"

echo ""
echo "Default Credentials:"
echo "  Email: admin@example.com"
echo "  Password: any password"

echo ""
echo "========================================="
echo "  Verification Complete!"
echo "========================================="
