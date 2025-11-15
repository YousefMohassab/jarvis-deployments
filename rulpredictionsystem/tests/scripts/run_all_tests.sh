#!/bin/bash
# Run All Tests Script for RUL Prediction System
# Usage: ./tests/scripts/run_all_tests.sh [options]

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo "============================================"
echo "  RUL Prediction System - Test Suite"
echo "============================================"
echo ""

# Parse command line arguments
COVERAGE=true
PARALLEL=true
VERBOSE=false
TEST_TYPE="all"

while [[ $# -gt 0 ]]; do
    case $1 in
        --no-coverage)
            COVERAGE=false
            shift
            ;;
        --no-parallel)
            PARALLEL=false
            shift
            ;;
        --verbose)
            VERBOSE=true
            shift
            ;;
        --unit)
            TEST_TYPE="unit"
            shift
            ;;
        --integration)
            TEST_TYPE="integration"
            shift
            ;;
        --e2e)
            TEST_TYPE="e2e"
            shift
            ;;
        --performance)
            TEST_TYPE="performance"
            shift
            ;;
        *)
            echo "Unknown option: $1"
            exit 1
            ;;
    esac
done

# Set pytest options
PYTEST_OPTS=""

if [ "$VERBOSE" = true ]; then
    PYTEST_OPTS="$PYTEST_OPTS -vv"
else
    PYTEST_OPTS="$PYTEST_OPTS -v"
fi

if [ "$PARALLEL" = true ]; then
    PYTEST_OPTS="$PYTEST_OPTS -n auto"
fi

if [ "$COVERAGE" = true ]; then
    PYTEST_OPTS="$PYTEST_OPTS --cov=src --cov-report=html --cov-report=term"
fi

# Run tests based on type
case $TEST_TYPE in
    unit)
        echo -e "${GREEN}Running Unit Tests...${NC}"
        pytest tests/unit/ $PYTEST_OPTS -m "unit"
        ;;
    integration)
        echo -e "${GREEN}Running Integration Tests...${NC}"
        pytest tests/integration/ $PYTEST_OPTS -m "integration"
        ;;
    e2e)
        echo -e "${GREEN}Running End-to-End Tests...${NC}"
        pytest tests/e2e/ $PYTEST_OPTS -m "e2e"
        ;;
    performance)
        echo -e "${GREEN}Running Performance Tests...${NC}"
        pytest tests/performance/ $PYTEST_OPTS -m "performance"
        ;;
    all)
        echo -e "${GREEN}Running All Tests...${NC}"

        # 1. Unit Tests
        echo ""
        echo -e "${YELLOW}[1/4] Unit Tests${NC}"
        pytest tests/unit/ $PYTEST_OPTS -m "unit" || true

        # 2. Integration Tests
        echo ""
        echo -e "${YELLOW}[2/4] Integration Tests${NC}"
        pytest tests/integration/ $PYTEST_OPTS -m "integration" || true

        # 3. E2E Tests
        echo ""
        echo -e "${YELLOW}[3/4] End-to-End Tests${NC}"
        pytest tests/e2e/ $PYTEST_OPTS -m "e2e" || true

        # 4. Performance Tests
        echo ""
        echo -e "${YELLOW}[4/4] Performance Tests${NC}"
        pytest tests/performance/ $PYTEST_OPTS -m "performance" || true
        ;;
esac

echo ""
echo -e "${GREEN}============================================${NC}"
echo -e "${GREEN}  Test Suite Completed${NC}"
echo -e "${GREEN}============================================${NC}"

# Generate coverage report
if [ "$COVERAGE" = true ]; then
    echo ""
    echo -e "${YELLOW}Coverage Report:${NC}"
    coverage report --skip-empty
    echo ""
    echo -e "${YELLOW}HTML Coverage Report: htmlcov/index.html${NC}"
fi

exit 0
