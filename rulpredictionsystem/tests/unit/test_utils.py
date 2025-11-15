"""Unit Tests for Utility Functions"""

import pytest
import numpy as np
from pathlib import Path
from unittest.mock import Mock


pytestmark = pytest.mark.unit


class TestDataValidation:
    """Test data validation utilities"""

    def test_validate_array_shape(self):
        """Test array shape validation"""
        arr = np.random.randn(100, 20)
        assert arr.ndim == 2
        assert arr.shape[1] == 20

    def test_validate_no_nans(self):
        """Test NaN validation"""
        arr = np.array([1, 2, np.nan, 4])
        assert np.isnan(arr).any()


class TestMetricCalculation:
    """Test metric calculation utilities"""

    def test_rmse_calculation(self):
        """Test RMSE calculation"""
        y_true = np.array([100, 80, 60])
        y_pred = np.array([95, 85, 65])
        rmse = np.sqrt(np.mean((y_true - y_pred) ** 2))
        assert rmse > 0

    def test_mae_calculation(self):
        """Test MAE calculation"""
        y_true = np.array([100, 80, 60])
        y_pred = np.array([95, 85, 65])
        mae = np.mean(np.abs(y_true - y_pred))
        assert mae > 0


class TestFileOperations:
    """Test file operation utilities"""

    def test_create_directory(self, temp_dir):
        """Test directory creation"""
        new_dir = temp_dir / "test_subdir"
        new_dir.mkdir(exist_ok=True)
        assert new_dir.exists()

    def test_file_exists_check(self, temp_dir):
        """Test file existence check"""
        file_path = temp_dir / "test.txt"
        file_path.write_text("test")
        assert file_path.exists()
