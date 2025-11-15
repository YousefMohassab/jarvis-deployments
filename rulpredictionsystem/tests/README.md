# RUL Prediction System - Test Suite Documentation

Comprehensive testing documentation for the Remaining Useful Life (RUL) Prediction System.

## Table of Contents

- [Overview](#overview)
- [Test Structure](#test-structure)
- [Running Tests](#running-tests)
- [Test Categories](#test-categories)
- [Writing Tests](#writing-tests)
- [Coverage Requirements](#coverage-requirements)
- [CI/CD Integration](#cicd-integration)
- [Troubleshooting](#troubleshooting)

## Overview

This test suite provides comprehensive coverage for the RUL Prediction System, including:

- **800+ test cases** across all modules
- **>80% code coverage** requirement
- **Unit, Integration, E2E, and Performance tests**
- **Automated CI/CD pipeline** with GitHub Actions
- **Test fixtures and factories** for easy test data generation

### Test Statistics

| Category | Tests | Coverage Target |
|----------|-------|----------------|
| Unit Tests | 500+ | >85% |
| Integration Tests | 200+ | >75% |
| E2E Tests | 50+ | >70% |
| Performance Tests | 50+ | N/A |

## Test Structure

```
tests/
├── __init__.py
├── conftest.py              # Shared fixtures and configuration
├── pytest.ini               # Pytest configuration
├── requirements-test.txt    # Test dependencies
│
├── unit/                    # Unit tests (fast, isolated)
│   ├── test_preprocessing.py
│   ├── test_features.py
│   ├── test_model.py
│   ├── test_prediction_engine.py
│   └── test_utils.py
│
├── integration/             # Integration tests (services)
│   ├── test_api.py
│   ├── test_database.py
│   ├── test_airflow_dags.py
│   └── test_monitoring.py
│
├── e2e/                     # End-to-end tests (full workflow)
│   ├── test_complete_workflow.py
│   └── test_system_health.py
│
├── performance/             # Performance and load tests
│   ├── test_api_load.py
│   └── test_model_inference.py
│
├── fixtures/                # Test data and fixtures
│   ├── sample_bearing_data.csv
│   ├── sample_features.json
│   └── sample_predictions.json
│
└── scripts/                 # Test utility scripts
    ├── run_all_tests.sh
    └── setup_test_env.sh
```

## Running Tests

### Quick Start

```bash
# Setup test environment
./tests/scripts/setup_test_env.sh

# Run all tests
pytest tests/

# Or use the comprehensive script
./tests/scripts/run_all_tests.sh
```

### Run Specific Test Categories

```bash
# Unit tests only
pytest tests/unit/ -m "unit"

# Integration tests
pytest tests/integration/ -m "integration"

# E2E tests
pytest tests/e2e/ -m "e2e"

# Performance tests
pytest tests/performance/ -m "performance"
```

### Run Tests with Coverage

```bash
# Generate coverage report
pytest tests/ --cov=src --cov-report=html --cov-report=term

# View HTML report
open htmlcov/index.html
```

### Run Tests in Parallel

```bash
# Use all CPU cores
pytest tests/ -n auto

# Specify number of workers
pytest tests/ -n 4
```

### Run Specific Tests

```bash
# Run single test file
pytest tests/unit/test_preprocessing.py

# Run single test class
pytest tests/unit/test_preprocessing.py::TestDataLoader

# Run single test method
pytest tests/unit/test_preprocessing.py::TestDataLoader::test_load_csv_success
```

### Advanced Options

```bash
# Verbose output
pytest tests/ -vv

# Show print statements
pytest tests/ -s

# Stop on first failure
pytest tests/ -x

# Run last failed tests
pytest tests/ --lf

# Show slowest tests
pytest tests/ --durations=10

# Generate XML report (for CI)
pytest tests/ --junitxml=test-results.xml
```

## Test Categories

### 1. Unit Tests

**Purpose:** Test individual functions and classes in isolation

**Characteristics:**
- Fast execution (<1s per test)
- No external dependencies
- Mock all external services
- High code coverage

**Example:**

```python
@pytest.mark.unit
def test_rms_calculation(sample_vibration_signal):
    """Test RMS calculation"""
    signal = sample_vibration_signal
    rms = np.sqrt(np.mean(signal ** 2))
    assert rms > 0
    assert not np.isnan(rms)
```

### 2. Integration Tests

**Purpose:** Test component interactions and service integrations

**Characteristics:**
- Require external services (database, API)
- Test actual integrations
- Use test databases/containers
- Slower than unit tests

**Example:**

```python
@pytest.mark.integration
@pytest.mark.api
def test_predict_endpoint(api_client, sample_request):
    """Test prediction endpoint"""
    response = api_client.post("/api/v1/predict", json=sample_request)
    assert response.status_code == 200
    assert "predicted_rul" in response.json()
```

### 3. End-to-End Tests

**Purpose:** Test complete user workflows

**Characteristics:**
- Test full system flow
- Involve multiple components
- Most realistic scenarios
- Slowest tests

**Example:**

```python
@pytest.mark.e2e
def test_complete_prediction_workflow(sample_data):
    """Test data → prediction → storage flow"""
    # 1. Load data
    data = load_bearing_data(sample_data)
    # 2. Preprocess
    processed = preprocess(data)
    # 3. Extract features
    features = extract_features(processed)
    # 4. Predict
    prediction = model.predict(features)
    # 5. Store
    store_prediction(prediction)
    assert prediction['rul'] > 0
```

### 4. Performance Tests

**Purpose:** Test system performance and scalability

**Characteristics:**
- Measure response times
- Test throughput
- Load testing
- Resource usage monitoring

**Example:**

```python
@pytest.mark.performance
def test_inference_latency(benchmark):
    """Test model inference latency"""
    result = benchmark(model.predict, test_data)
    assert benchmark.stats.mean < 0.1  # <100ms
```

## Writing Tests

### Test Naming Convention

```python
# Pattern: test_<what>_<when>_<expected>

def test_predict_when_valid_data_then_returns_rul():
    """Test prediction returns RUL for valid data"""
    pass

def test_load_csv_when_file_missing_then_raises_error():
    """Test CSV loading raises error for missing file"""
    pass
```

### Using Fixtures

```python
# Use fixtures from conftest.py
def test_with_fixtures(sample_vibration_signal, temp_dir):
    """Test using shared fixtures"""
    # sample_vibration_signal and temp_dir are automatically provided
    assert len(sample_vibration_signal) > 0
    assert temp_dir.exists()
```

### Parametrized Tests

```python
@pytest.mark.parametrize("input,expected", [
    (100, "good"),
    (50, "warning"),
    (15, "critical"),
])
def test_health_status(input, expected):
    """Test health status for different RUL values"""
    status = calculate_health_status(input)
    assert status == expected
```

### Mocking External Dependencies

```python
from unittest.mock import Mock, patch

def test_with_mock():
    """Test with mocked dependency"""
    mock_model = Mock()
    mock_model.predict.return_value = [100.0]

    result = predict_with_model(mock_model, data)
    assert result[0] == 100.0
    assert mock_model.predict.called
```

### Async Tests

```python
@pytest.mark.asyncio
async def test_async_endpoint(async_api_client):
    """Test async API endpoint"""
    response = await async_api_client.get("/api/v1/bearings")
    assert response.status_code == 200
```

## Coverage Requirements

### Minimum Coverage Targets

- **Overall:** 80%
- **Critical modules:** 90%
  - preprocessing
  - features
  - models
  - prediction_engine
- **API endpoints:** 85%
- **Database operations:** 85%
- **Utility functions:** 75%

### Excluded from Coverage

- Test files
- Configuration files
- Migrations
- External dependencies
- Debug code
- `if __name__ == "__main__"`

### Checking Coverage

```bash
# Generate coverage report
pytest tests/ --cov=src --cov-report=term-missing

# Fail if coverage below threshold
pytest tests/ --cov=src --cov-fail-under=80

# Generate HTML report
pytest tests/ --cov=src --cov-report=html
open htmlcov/index.html
```

## CI/CD Integration

### GitHub Actions Workflow

The test suite runs automatically on:

- **Push to main/develop branches**
- **Pull requests**
- **Daily schedule (2 AM UTC)**

### Workflow Steps

1. **Lint and Code Quality**
   - flake8 linting
   - black formatting check
   - isort import sorting
   - mypy type checking

2. **Security Scanning**
   - bandit security scan
   - safety dependency check

3. **Unit Tests**
   - Run on Python 3.9, 3.10, 3.11
   - Generate coverage report
   - Upload to Codecov

4. **Integration Tests**
   - Start PostgreSQL service
   - Run integration tests
   - Upload results

5. **E2E Tests**
   - Run end-to-end scenarios
   - Upload results

6. **Performance Tests**
   - Run performance benchmarks
   - Compare against baseline

### Running CI Locally

```bash
# Install act (GitHub Actions local runner)
brew install act  # macOS
# or: sudo apt install act  # Linux

# Run workflow locally
act -j unit-tests
```

## Troubleshooting

### Common Issues

#### 1. Tests Failing Locally But Passing in CI

**Solution:**
```bash
# Clean pytest cache
pytest --cache-clear

# Remove __pycache__ directories
find . -type d -name __pycache__ -exec rm -rf {} +

# Recreate virtualenv
deactivate
rm -rf venv
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt -r tests/requirements-test.txt
```

#### 2. Import Errors

**Solution:**
```bash
# Add project root to PYTHONPATH
export PYTHONPATH="${PYTHONPATH}:$(pwd)"

# Or install in development mode
pip install -e .
```

#### 3. Database Connection Errors

**Solution:**
```bash
# Check database is running
docker ps | grep postgres

# Start test database
docker-compose up -d postgres

# Run with correct DATABASE_URL
export DATABASE_URL="postgresql://user:pass@localhost:5432/test_db"
pytest tests/integration/
```

#### 4. Slow Tests

**Solution:**
```bash
# Run tests in parallel
pytest tests/ -n auto

# Skip slow tests
pytest tests/ -m "not slow"

# Identify slow tests
pytest tests/ --durations=20
```

#### 5. Flaky Tests

**Solution:**
```bash
# Rerun failed tests
pytest tests/ --reruns 3

# Identify flaky tests
pytest tests/ --count=10  # requires pytest-repeat
```

### Debug Mode

```bash
# Drop into pdb on failure
pytest tests/ --pdb

# Show local variables on failure
pytest tests/ -l

# Full traceback
pytest tests/ --tb=long
```

## Best Practices

### 1. Test Independence

- Each test should be independent
- Use fixtures for setup/teardown
- Clean up resources after tests

### 2. Test Data

- Use fixtures and factories
- Don't commit large test files
- Generate test data programmatically

### 3. Assertions

- Use specific assertions
- Include descriptive messages
- Test both positive and negative cases

### 4. Performance

- Keep unit tests fast (<1s)
- Mock expensive operations
- Use appropriate test markers

### 5. Maintainability

- Follow naming conventions
- Add docstrings to tests
- Keep tests simple and readable
- Update tests with code changes

## Resources

- [Pytest Documentation](https://docs.pytest.org/)
- [Coverage.py Documentation](https://coverage.readthedocs.io/)
- [GitHub Actions Documentation](https://docs.github.com/en/actions)
- [Testing Best Practices](https://docs.python-guide.org/writing/tests/)

## Support

For issues or questions:

1. Check this documentation
2. Search existing issues
3. Create new issue with:
   - Test output
   - Environment details
   - Steps to reproduce

---

**Last Updated:** 2025-01-14
**Version:** 1.0.0
**Maintainers:** RUL Prediction Team
