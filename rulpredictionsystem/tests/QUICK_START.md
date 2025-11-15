# RUL Prediction System - Test Suite Quick Start

## 🚀 Get Started in 3 Steps

### 1. Setup Environment (2 minutes)

```bash
cd /home/yousef/workspace/storage/UZ2CcrTd13NrEAm81F1qLWHyAiD2/projects/rul-prediction-system
./tests/scripts/setup_test_env.sh
```

### 2. Run Tests (5 minutes)

```bash
# Run all tests
pytest tests/ -v

# Or use the comprehensive script
./tests/scripts/run_all_tests.sh
```

### 3. View Results

```bash
# View coverage report
open htmlcov/index.html

# Or terminal report
pytest tests/ --cov=src --cov-report=term-missing
```

## 📊 Test Categories

| Category | Command | Test Count |
|----------|---------|------------|
| **Unit** | `pytest tests/unit/ -m "unit"` | 500+ |
| **Integration** | `pytest tests/integration/ -m "integration"` | 200+ |
| **E2E** | `pytest tests/e2e/ -m "e2e"` | 50+ |
| **Performance** | `pytest tests/performance/ -m "performance"` | 50+ |

## 🎯 Common Commands

```bash
# Fast unit tests only
pytest tests/unit/ -m "unit and not slow"

# With coverage
pytest tests/ --cov=src --cov-report=html

# Parallel execution
pytest tests/ -n auto

# Verbose output
pytest tests/ -vv

# Stop on first failure
pytest tests/ -x
```

## 📁 Test Structure

```
tests/
├── unit/              # 500+ fast, isolated tests
├── integration/       # 200+ service integration tests
├── e2e/              # 50+ end-to-end workflow tests
├── performance/      # 50+ load and speed tests
├── fixtures/         # Sample test data
├── scripts/          # Test runner scripts
└── README.md         # Full documentation
```

## ✅ Coverage Requirements

- **Overall:** >80%
- **Critical Modules:** >90%
- **Enforced in CI/CD**

## 🔧 Troubleshooting

**Import errors?**
```bash
export PYTHONPATH="${PYTHONPATH}:$(pwd)"
```

**Slow tests?**
```bash
pytest tests/ -n auto -m "not slow"
```

**Clean cache?**
```bash
pytest --cache-clear
find . -type d -name __pycache__ -exec rm -rf {} +
```

## 📚 Documentation

- **Full Guide:** `/tests/README.md`
- **Delivery Summary:** `/tests/TEST_SUITE_DELIVERY.md`
- **CI/CD Workflow:** `/.github/workflows/tests.yml`

## 💡 Need Help?

1. Read `/tests/README.md`
2. Check existing issues
3. Create new issue with details

---

**Happy Testing! 🎉**
