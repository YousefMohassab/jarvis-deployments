"""
Pytest Configuration and Shared Fixtures for RUL Prediction System

This module provides comprehensive fixtures for:
- Test data generation
- Database setup/teardown
- API client fixtures
- Model fixtures
- Mock services
- Temp file handling
"""

import os
import sys
import json
import tempfile
import shutil
from pathlib import Path
from typing import Dict, Any, List, Generator
from datetime import datetime, timedelta

import pytest
import numpy as np
import pandas as pd
from faker import Faker
from unittest.mock import Mock, AsyncMock, MagicMock
import torch

# Add project root to path
PROJECT_ROOT = Path(__file__).parent.parent
sys.path.insert(0, str(PROJECT_ROOT))


# ==================== Configuration Fixtures ====================

@pytest.fixture(scope="session")
def project_root() -> Path:
    """Project root directory"""
    return PROJECT_ROOT


@pytest.fixture(scope="session")
def test_config() -> Dict[str, Any]:
    """Test configuration dictionary"""
    return {
        "sampling_rate": 20000,
        "num_samples": 1000,
        "num_features": 20,
        "sequence_length": 50,
        "batch_size": 32,
        "num_classes": 1,
        "test_db_name": "test_rul_db",
        "api_base_url": "http://testserver",
    }


@pytest.fixture(scope="function")
def temp_dir() -> Generator[Path, None, None]:
    """Create temporary directory for test files"""
    temp_path = Path(tempfile.mkdtemp())
    yield temp_path
    # Cleanup
    if temp_path.exists():
        shutil.rmtree(temp_path)


@pytest.fixture(scope="function")
def fake() -> Faker:
    """Faker instance for generating fake data"""
    return Faker()


# ==================== Data Fixtures ====================

@pytest.fixture
def sample_vibration_signal(test_config: Dict) -> np.ndarray:
    """
    Generate synthetic vibration signal for testing

    Returns:
        1D numpy array of vibration data
    """
    np.random.seed(42)
    n_samples = test_config["num_samples"]

    # Create signal with multiple components
    t = np.linspace(0, 1, n_samples)

    # Base frequency components
    signal = (
        np.sin(2 * np.pi * 50 * t) +  # 50 Hz component
        0.5 * np.sin(2 * np.pi * 120 * t) +  # 120 Hz component
        0.3 * np.sin(2 * np.pi * 240 * t) +  # 240 Hz bearing fault
        0.1 * np.random.randn(n_samples)  # Noise
    )

    return signal.astype(np.float32)


@pytest.fixture
def sample_multi_channel_data(test_config: Dict) -> np.ndarray:
    """
    Generate multi-channel sensor data

    Returns:
        2D numpy array (n_samples, n_channels)
    """
    np.random.seed(42)
    n_samples = test_config["num_samples"]
    n_channels = 3  # X, Y, Z axes

    data = np.random.randn(n_samples, n_channels).astype(np.float32)

    # Add trend to simulate degradation
    for i in range(n_channels):
        trend = np.linspace(0, 0.5, n_samples)
        data[:, i] += trend

    return data


@pytest.fixture
def sample_bearing_dataframe(test_config: Dict) -> pd.DataFrame:
    """
    Generate sample bearing data as DataFrame

    Returns:
        DataFrame with bearing sensor data
    """
    np.random.seed(42)
    n_samples = test_config["num_samples"]

    df = pd.DataFrame({
        'timestamp': pd.date_range(start='2024-01-01', periods=n_samples, freq='1min'),
        'vibration_x': np.random.randn(n_samples),
        'vibration_y': np.random.randn(n_samples),
        'vibration_z': np.random.randn(n_samples),
        'temperature': 60 + np.random.randn(n_samples) * 5,
        'rpm': 1800 + np.random.randn(n_samples) * 50,
    })

    return df


@pytest.fixture
def sample_features(test_config: Dict) -> np.ndarray:
    """
    Generate sample feature matrix

    Returns:
        2D numpy array (n_samples, n_features)
    """
    np.random.seed(42)
    n_samples = 100
    n_features = test_config["num_features"]

    return np.random.randn(n_samples, n_features).astype(np.float32)


@pytest.fixture
def sample_sequence_data(test_config: Dict) -> np.ndarray:
    """
    Generate sample sequence data for LSTM/RNN models

    Returns:
        3D numpy array (n_samples, sequence_length, n_features)
    """
    np.random.seed(42)
    n_samples = 50
    seq_len = test_config["sequence_length"]
    n_features = test_config["num_features"]

    return np.random.randn(n_samples, seq_len, n_features).astype(np.float32)


@pytest.fixture
def sample_rul_labels() -> np.ndarray:
    """
    Generate sample RUL (Remaining Useful Life) labels

    Returns:
        1D numpy array of RUL values
    """
    np.random.seed(42)
    # RUL values from 0 to 200 cycles
    return np.random.uniform(0, 200, 50).astype(np.float32)


@pytest.fixture
def sample_bearing_data_file(temp_dir: Path, sample_bearing_dataframe: pd.DataFrame) -> Path:
    """
    Create sample bearing data CSV file

    Returns:
        Path to CSV file
    """
    file_path = temp_dir / "bearing_data.csv"
    sample_bearing_dataframe.to_csv(file_path, index=False)
    return file_path


# ==================== Model Fixtures ====================

@pytest.fixture
def mock_lstm_model():
    """Mock LSTM model for testing"""
    model = Mock()
    model.predict = Mock(return_value=np.array([100.0, 80.0, 60.0]))
    model.predict_with_uncertainty = Mock(
        return_value=(np.array([100.0, 80.0, 60.0]), np.array([10.0, 8.0, 6.0]))
    )
    model.is_trained = True
    model.config = {"hidden_dim": 128, "num_layers": 3}
    model.training_history = {"best_score": 0.85}
    return model


@pytest.fixture
def mock_random_forest_model():
    """Mock Random Forest model for testing"""
    model = Mock()
    model.predict = Mock(return_value=np.array([95.0, 75.0, 55.0]))
    model.is_trained = True
    model.config = {"n_estimators": 100}
    return model


@pytest.fixture
def mock_ensemble_model():
    """Mock Ensemble model for testing"""
    model = Mock()
    model.predict = Mock(return_value=np.array([97.5, 77.5, 57.5]))
    model.predict_with_voting = Mock(return_value=np.array([97.5, 77.5, 57.5]))
    model.models = []
    model.is_trained = True
    return model


@pytest.fixture
def sample_model_config() -> Dict[str, Any]:
    """Sample model configuration"""
    return {
        "input_dim": 20,
        "hidden_dim": 128,
        "num_layers": 3,
        "output_dim": 1,
        "dropout": 0.3,
        "bidirectional": True,
        "use_attention": True,
    }


@pytest.fixture
def sample_training_config() -> Dict[str, Any]:
    """Sample training configuration"""
    return {
        "epochs": 10,
        "batch_size": 32,
        "learning_rate": 0.001,
        "optimizer": "adam",
        "scheduler": "reduce_on_plateau",
        "early_stopping_patience": 5,
        "gradient_clip_value": 1.0,
    }


# ==================== Database Fixtures ====================

@pytest.fixture(scope="function")
def mock_database_session():
    """Mock database session for testing"""
    session = Mock()
    session.query = Mock()
    session.add = Mock()
    session.commit = Mock()
    session.rollback = Mock()
    session.close = Mock()
    session.refresh = Mock()
    return session


@pytest.fixture
def sample_bearing_record(fake: Faker) -> Dict[str, Any]:
    """Sample bearing database record"""
    return {
        "id": fake.uuid4(),
        "bearing_id": f"BRG-{fake.random_int(1000, 9999)}",
        "location": fake.city(),
        "equipment_type": fake.random_element(["Motor", "Pump", "Fan", "Compressor"]),
        "installation_date": fake.date_between(start_date="-2y", end_date="today"),
        "status": fake.random_element(["healthy", "warning", "critical"]),
        "last_maintenance": fake.date_between(start_date="-6m", end_date="today"),
        "created_at": datetime.now(),
        "updated_at": datetime.now(),
    }


@pytest.fixture
def sample_prediction_record(fake: Faker) -> Dict[str, Any]:
    """Sample prediction database record"""
    return {
        "id": fake.uuid4(),
        "bearing_id": f"BRG-{fake.random_int(1000, 9999)}",
        "predicted_rul": fake.random_int(0, 200),
        "confidence": fake.random.uniform(0.7, 0.99),
        "model_version": "v1.0.0",
        "features": {"rms": 1.5, "kurtosis": 3.2, "peak": 5.8},
        "created_at": datetime.now(),
    }


# ==================== API Fixtures ====================

@pytest.fixture
def api_client():
    """FastAPI test client"""
    from fastapi.testclient import TestClient
    try:
        from src.api.main import app
        return TestClient(app)
    except ImportError:
        pytest.skip("API module not available")


@pytest.fixture
async def async_api_client():
    """Async FastAPI test client"""
    from httpx import AsyncClient
    try:
        from src.api.main import app
        async with AsyncClient(app=app, base_url="http://testserver") as client:
            yield client
    except ImportError:
        pytest.skip("API module not available")


@pytest.fixture
def mock_api_key() -> str:
    """Mock API key for authentication"""
    return "test_api_key_12345"


@pytest.fixture
def api_headers(mock_api_key: str) -> Dict[str, str]:
    """API request headers with authentication"""
    return {
        "Authorization": f"Bearer {mock_api_key}",
        "Content-Type": "application/json",
    }


@pytest.fixture
def sample_prediction_request() -> Dict[str, Any]:
    """Sample prediction API request"""
    return {
        "bearing_id": "BRG-1001",
        "sensor_data": {
            "vibration_x": [1.2, 1.3, 1.1, 1.4],
            "vibration_y": [0.8, 0.9, 0.7, 0.85],
            "vibration_z": [1.0, 1.1, 0.9, 1.05],
            "temperature": 65.5,
            "rpm": 1800,
        },
        "model_version": "v1.0.0",
    }


# ==================== Preprocessing Fixtures ====================

@pytest.fixture
def mock_data_loader():
    """Mock data loader for testing"""
    from unittest.mock import Mock
    loader = Mock()
    loader.load_csv = Mock(return_value=pd.DataFrame())
    loader.load_hdf5 = Mock(return_value=np.array([]))
    loader.load_binary = Mock(return_value=np.array([]))
    return loader


@pytest.fixture
def mock_normalizer():
    """Mock normalizer for testing"""
    normalizer = Mock()
    normalizer.fit = Mock()
    normalizer.transform = Mock(return_value=np.array([]))
    normalizer.inverse_transform = Mock(return_value=np.array([]))
    return normalizer


# ==================== Feature Extraction Fixtures ====================

@pytest.fixture
def sample_time_features() -> Dict[str, float]:
    """Sample time-domain features"""
    return {
        "rms": 1.234,
        "peak": 5.678,
        "crest_factor": 4.5,
        "kurtosis": 3.2,
        "skewness": 0.1,
        "mean": 0.05,
        "std": 1.1,
    }


@pytest.fixture
def sample_frequency_features() -> Dict[str, float]:
    """Sample frequency-domain features"""
    return {
        "peak_frequency": 120.5,
        "spectral_centroid": 150.3,
        "spectral_spread": 45.2,
        "spectral_entropy": 0.85,
        "band_power_low": 2.3,
        "band_power_high": 1.8,
    }


# ==================== Prediction Engine Fixtures ====================

@pytest.fixture
def mock_prediction_engine():
    """Mock prediction engine for testing"""
    engine = Mock()
    engine.predict = Mock(return_value={
        "predicted_rul": 100.0,
        "confidence": 0.95,
        "uncertainty": 8.5,
        "health_status": "good",
        "recommendation": "Continue normal operation",
    })
    engine.batch_predict = Mock(return_value=[])
    return engine


# ==================== Monitoring Fixtures ====================

@pytest.fixture
def mock_prometheus_registry():
    """Mock Prometheus registry for testing"""
    from unittest.mock import Mock
    registry = Mock()
    return registry


@pytest.fixture
def mock_alert_manager():
    """Mock alert manager for testing"""
    manager = AsyncMock()
    manager.send_alert = AsyncMock(return_value=True)
    manager.check_thresholds = AsyncMock(return_value=[])
    return manager


# ==================== Airflow Fixtures ====================

@pytest.fixture
def mock_airflow_dag():
    """Mock Airflow DAG for testing"""
    dag = Mock()
    dag.dag_id = "test_dag"
    dag.schedule_interval = "@daily"
    dag.tasks = []
    return dag


@pytest.fixture
def mock_airflow_task():
    """Mock Airflow task for testing"""
    task = Mock()
    task.task_id = "test_task"
    task.execute = Mock(return_value=True)
    return task


# ==================== Utility Fixtures ====================

@pytest.fixture
def mock_logger():
    """Mock logger for testing"""
    logger = Mock()
    logger.info = Mock()
    logger.debug = Mock()
    logger.warning = Mock()
    logger.error = Mock()
    logger.critical = Mock()
    return logger


@pytest.fixture
def sample_config_file(temp_dir: Path) -> Path:
    """Create sample configuration file"""
    config = {
        "model": {
            "type": "lstm",
            "hidden_dim": 128,
            "num_layers": 3,
        },
        "training": {
            "epochs": 100,
            "batch_size": 32,
            "learning_rate": 0.001,
        },
        "database": {
            "host": "localhost",
            "port": 5432,
            "name": "test_db",
        }
    }

    config_path = temp_dir / "config.json"
    with open(config_path, 'w') as f:
        json.dump(config, f, indent=2)

    return config_path


# ==================== Torch Fixtures ====================

@pytest.fixture
def torch_device() -> str:
    """Get torch device (CPU for testing)"""
    return "cpu"


@pytest.fixture
def sample_torch_tensor(test_config: Dict) -> torch.Tensor:
    """Sample PyTorch tensor"""
    torch.manual_seed(42)
    n_samples = 10
    seq_len = test_config["sequence_length"]
    n_features = test_config["num_features"]

    return torch.randn(n_samples, seq_len, n_features)


# ==================== Performance Testing Fixtures ====================

@pytest.fixture
def performance_threshold() -> Dict[str, float]:
    """Performance thresholds for tests"""
    return {
        "max_inference_time_ms": 100,
        "max_preprocessing_time_ms": 500,
        "max_feature_extraction_time_ms": 200,
        "min_throughput_samples_per_sec": 100,
    }


# ==================== Test Data Factories ====================

class BearingDataFactory:
    """Factory for generating bearing test data"""

    @staticmethod
    def create_sensor_data(n_samples: int = 1000, n_channels: int = 3) -> np.ndarray:
        """Create synthetic sensor data"""
        np.random.seed(42)
        return np.random.randn(n_samples, n_channels).astype(np.float32)

    @staticmethod
    def create_degradation_data(n_samples: int = 1000) -> np.ndarray:
        """Create data with degradation trend"""
        np.random.seed(42)
        trend = np.linspace(0, 1, n_samples)
        noise = np.random.randn(n_samples) * 0.1
        return (trend + noise).astype(np.float32)


@pytest.fixture
def bearing_data_factory() -> BearingDataFactory:
    """Bearing data factory fixture"""
    return BearingDataFactory()


# ==================== Pytest Hooks ====================

def pytest_configure(config):
    """Configure pytest with custom settings"""
    # Create logs directory
    log_dir = Path("tests/logs")
    log_dir.mkdir(exist_ok=True)

    # Set environment variables for testing
    os.environ["TESTING"] = "1"
    os.environ["LOG_LEVEL"] = "DEBUG"


def pytest_collection_modifyitems(config, items):
    """Modify test collection"""
    for item in items:
        # Add marker based on test path
        if "unit" in str(item.fspath):
            item.add_marker(pytest.mark.unit)
        elif "integration" in str(item.fspath):
            item.add_marker(pytest.mark.integration)
        elif "e2e" in str(item.fspath):
            item.add_marker(pytest.mark.e2e)
        elif "performance" in str(item.fspath):
            item.add_marker(pytest.mark.performance)


# ==================== Session Fixtures ====================

@pytest.fixture(scope="session", autouse=True)
def setup_test_environment():
    """Setup test environment (runs once per session)"""
    # Set random seeds for reproducibility
    np.random.seed(42)
    torch.manual_seed(42)

    # Create necessary directories
    Path("tests/logs").mkdir(exist_ok=True)
    Path("tests/temp").mkdir(exist_ok=True)
    Path("tests/fixtures").mkdir(exist_ok=True)

    yield

    # Cleanup after all tests
    # (cleanup code here if needed)
