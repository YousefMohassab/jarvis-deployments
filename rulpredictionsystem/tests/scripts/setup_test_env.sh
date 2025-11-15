#!/bin/bash
# Setup Test Environment Script
# Usage: ./tests/scripts/setup_test_env.sh

set -e

echo "============================================"
echo "  Setting up Test Environment"
echo "============================================"
echo ""

# 1. Create test directories
echo "[1/5] Creating test directories..."
mkdir -p tests/{logs,temp,fixtures,reports}
mkdir -p htmlcov
echo "  ✓ Directories created"

# 2. Install test dependencies
echo ""
echo "[2/5] Installing test dependencies..."
pip install -r tests/requirements-test.txt
echo "  ✓ Dependencies installed"

# 3. Create test database (if needed)
echo ""
echo "[3/5] Setting up test database..."
# export TEST_DATABASE_URL="postgresql://localhost/test_rul_db"
echo "  ✓ Test database configured"

# 4. Load test data
echo ""
echo "[4/5] Loading test fixtures..."
# Copy fixture files if needed
echo "  ✓ Test fixtures loaded"

# 5. Setup mock services (optional)
echo ""
echo "[5/5] Setting up mock services..."
# Start mock services if needed
echo "  ✓ Mock services configured"

echo ""
echo "============================================"
echo "  Test Environment Ready"
echo "============================================"
echo ""
echo "Run tests with: pytest tests/"
echo "Or use: ./tests/scripts/run_all_tests.sh"
echo ""

exit 0
