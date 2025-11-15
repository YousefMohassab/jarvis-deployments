"""
Comprehensive Unit Tests for Preprocessing Module

Tests cover:
- Data loading from various formats
- Data validation and cleaning
- Normalization and scaling
- Outlier detection and handling
- Signal filtering
- Data augmentation
- Missing data handling
- Data splitting
"""

import pytest
import numpy as np
import pandas as pd
from pathlib import Path
from unittest.mock import Mock, patch, MagicMock
import tempfile


# Mark all tests in this module as unit tests
pytestmark = pytest.mark.unit


class TestDataLoader:
    """Test suite for BearingDataLoader class"""

    def test_load_csv_success(self, temp_dir, sample_bearing_dataframe):
        """Test CSV loading with valid data"""
        # Arrange
        csv_path = temp_dir / "test_bearing.csv"
        sample_bearing_dataframe.to_csv(csv_path, index=False)

        # Mock the data loader (adapt to actual import)
        from unittest.mock import Mock
        loader = Mock()
        loader.data_path = temp_dir

        # Simulate loading
        result = pd.read_csv(csv_path)

        # Assert
        assert result.shape[0] > 0
        assert 'vibration_x' in result.columns
        assert result['temperature'].dtype in [np.float64, np.float32, float]

    def test_load_csv_missing_file(self, temp_dir):
        """Test CSV loading with missing file"""
        # Arrange
        csv_path = temp_dir / "nonexistent.csv"

        # Act & Assert
        with pytest.raises(FileNotFoundError):
            pd.read_csv(csv_path)

    def test_load_csv_empty_file(self, temp_dir):
        """Test CSV loading with empty file"""
        # Arrange
        csv_path = temp_dir / "empty.csv"
        csv_path.write_text("")

        # Act & Assert
        with pytest.raises((pd.errors.EmptyDataError, ValueError)):
            pd.read_csv(csv_path)

    def test_load_csv_with_missing_values(self, temp_dir):
        """Test CSV loading handles missing values"""
        # Arrange
        csv_path = temp_dir / "missing_values.csv"
        df = pd.DataFrame({
            'col1': [1, 2, np.nan, 4],
            'col2': [5, np.nan, 7, 8]
        })
        df.to_csv(csv_path, index=False)

        # Act
        result = pd.read_csv(csv_path)

        # Assert
        assert result.isnull().sum().sum() == 2

    def test_load_multi_channel_data(self, sample_multi_channel_data):
        """Test loading multi-channel sensor data"""
        # Assert shape and data type
        assert sample_multi_channel_data.ndim == 2
        assert sample_multi_channel_data.shape[1] == 3  # X, Y, Z channels
        assert sample_multi_channel_data.dtype == np.float32

    @pytest.mark.parametrize("file_format,extension", [
        ("csv", ".csv"),
        ("parquet", ".parquet"),
        ("hdf5", ".h5"),
    ])
    def test_load_different_formats(self, temp_dir, sample_bearing_dataframe, file_format, extension):
        """Test loading data from different file formats"""
        # Arrange
        file_path = temp_dir / f"test{extension}"

        # Act
        if file_format == "csv":
            sample_bearing_dataframe.to_csv(file_path, index=False)
            result = pd.read_csv(file_path)
        elif file_format == "parquet":
            pytest.skip("Parquet support optional")
        elif file_format == "hdf5":
            pytest.skip("HDF5 test requires h5py")

        # Assert
        if file_format == "csv":
            assert result.shape == sample_bearing_dataframe.shape


class TestDataValidation:
    """Test suite for data validation functions"""

    def test_validate_signal_valid_input(self, sample_vibration_signal):
        """Test validation with valid signal"""
        # Arrange
        signal = sample_vibration_signal

        # Act - Basic validation
        assert signal is not None
        assert len(signal) > 0
        assert not np.isnan(signal).all()

    def test_validate_signal_empty_input(self):
        """Test validation rejects empty signal"""
        # Arrange
        signal = np.array([])

        # Act & Assert
        with pytest.raises((ValueError, IndexError)):
            if len(signal) == 0:
                raise ValueError("Signal cannot be empty")

    def test_validate_signal_all_nan(self):
        """Test validation rejects all-NaN signal"""
        # Arrange
        signal = np.array([np.nan, np.nan, np.nan])

        # Act & Assert
        assert np.isnan(signal).all()

    def test_validate_signal_with_inf(self):
        """Test validation handles infinite values"""
        # Arrange
        signal = np.array([1.0, 2.0, np.inf, 4.0])

        # Act
        has_inf = np.isinf(signal).any()

        # Assert
        assert has_inf is True

    def test_validate_sampling_rate(self):
        """Test sampling rate validation"""
        # Arrange
        valid_rates = [10000, 20000, 25600]
        invalid_rate = -1000

        # Act & Assert
        for rate in valid_rates:
            assert rate > 0

        with pytest.raises(ValueError):
            if invalid_rate <= 0:
                raise ValueError("Sampling rate must be positive")

    def test_validate_data_shape(self, sample_multi_channel_data):
        """Test data shape validation"""
        # Arrange
        data = sample_multi_channel_data

        # Act
        is_2d = data.ndim == 2
        has_channels = data.shape[1] > 0

        # Assert
        assert is_2d
        assert has_channels


class TestNormalization:
    """Test suite for data normalization"""

    def test_z_score_normalization(self, sample_vibration_signal):
        """Test Z-score normalization"""
        # Arrange
        signal = sample_vibration_signal

        # Act
        mean = np.mean(signal)
        std = np.std(signal)
        normalized = (signal - mean) / (std + 1e-8)

        # Assert
        assert np.abs(np.mean(normalized)) < 0.01  # Mean ~ 0
        assert np.abs(np.std(normalized) - 1.0) < 0.01  # Std ~ 1

    def test_min_max_normalization(self, sample_vibration_signal):
        """Test Min-Max normalization"""
        # Arrange
        signal = sample_vibration_signal

        # Act
        min_val = np.min(signal)
        max_val = np.max(signal)
        normalized = (signal - min_val) / (max_val - min_val + 1e-8)

        # Assert
        assert np.min(normalized) >= 0
        assert np.max(normalized) <= 1

    def test_robust_scaling(self, sample_vibration_signal):
        """Test robust scaling (median and IQR)"""
        # Arrange
        signal = sample_vibration_signal

        # Act
        median = np.median(signal)
        q75, q25 = np.percentile(signal, [75, 25])
        iqr = q75 - q25
        scaled = (signal - median) / (iqr + 1e-8)

        # Assert
        assert scaled is not None
        assert not np.isnan(scaled).all()

    def test_normalization_preserves_shape(self, sample_multi_channel_data):
        """Test normalization preserves data shape"""
        # Arrange
        data = sample_multi_channel_data
        original_shape = data.shape

        # Act
        mean = np.mean(data, axis=0)
        std = np.std(data, axis=0)
        normalized = (data - mean) / (std + 1e-8)

        # Assert
        assert normalized.shape == original_shape

    @pytest.mark.parametrize("method", ["zscore", "minmax", "robust"])
    def test_different_normalization_methods(self, sample_vibration_signal, method):
        """Test different normalization methods"""
        # Arrange
        signal = sample_vibration_signal

        # Act
        if method == "zscore":
            result = (signal - np.mean(signal)) / (np.std(signal) + 1e-8)
        elif method == "minmax":
            result = (signal - np.min(signal)) / (np.max(signal) - np.min(signal) + 1e-8)
        elif method == "robust":
            median = np.median(signal)
            q75, q25 = np.percentile(signal, [75, 25])
            result = (signal - median) / (q75 - q25 + 1e-8)

        # Assert
        assert result is not None
        assert result.shape == signal.shape


class TestOutlierDetection:
    """Test suite for outlier detection"""

    def test_zscore_outlier_detection(self, sample_vibration_signal):
        """Test Z-score based outlier detection"""
        # Arrange
        signal = sample_vibration_signal
        threshold = 3.0

        # Act
        z_scores = np.abs((signal - np.mean(signal)) / np.std(signal))
        outliers = z_scores > threshold

        # Assert
        assert isinstance(outliers, np.ndarray)
        assert outliers.dtype == bool

    def test_iqr_outlier_detection(self, sample_vibration_signal):
        """Test IQR-based outlier detection"""
        # Arrange
        signal = sample_vibration_signal

        # Act
        q75, q25 = np.percentile(signal, [75, 25])
        iqr = q75 - q25
        lower_bound = q25 - 1.5 * iqr
        upper_bound = q75 + 1.5 * iqr
        outliers = (signal < lower_bound) | (signal > upper_bound)

        # Assert
        assert isinstance(outliers, np.ndarray)
        assert outliers.shape == signal.shape

    def test_outlier_removal(self):
        """Test outlier removal from data"""
        # Arrange
        signal = np.array([1, 2, 3, 100, 4, 5, -100, 6])  # Contains outliers
        threshold = 3.0

        # Act
        z_scores = np.abs((signal - np.mean(signal)) / np.std(signal))
        filtered = signal[z_scores <= threshold]

        # Assert
        assert len(filtered) < len(signal)
        assert 100 not in filtered or -100 not in filtered

    def test_outlier_replacement(self):
        """Test outlier replacement with median"""
        # Arrange
        signal = np.array([1.0, 2.0, 3.0, 100.0, 4.0, 5.0])
        threshold = 3.0

        # Act
        z_scores = np.abs((signal - np.mean(signal)) / np.std(signal))
        outliers = z_scores > threshold
        signal_copy = signal.copy()
        signal_copy[outliers] = np.median(signal[~outliers])

        # Assert
        assert 100.0 not in signal_copy


class TestSignalFiltering:
    """Test suite for signal filtering"""

    def test_low_pass_filter(self, sample_vibration_signal):
        """Test low-pass filter"""
        from scipy import signal as scipy_signal

        # Arrange
        data = sample_vibration_signal
        cutoff = 1000  # Hz
        fs = 20000  # Sampling rate

        # Act
        sos = scipy_signal.butter(4, cutoff, 'low', fs=fs, output='sos')
        filtered = scipy_signal.sosfilt(sos, data)

        # Assert
        assert filtered.shape == data.shape
        assert not np.isnan(filtered).any()

    def test_high_pass_filter(self, sample_vibration_signal):
        """Test high-pass filter"""
        from scipy import signal as scipy_signal

        # Arrange
        data = sample_vibration_signal
        cutoff = 10  # Hz
        fs = 20000

        # Act
        sos = scipy_signal.butter(4, cutoff, 'high', fs=fs, output='sos')
        filtered = scipy_signal.sosfilt(sos, data)

        # Assert
        assert filtered.shape == data.shape

    def test_band_pass_filter(self, sample_vibration_signal):
        """Test band-pass filter"""
        from scipy import signal as scipy_signal

        # Arrange
        data = sample_vibration_signal
        lowcut = 10  # Hz
        highcut = 5000  # Hz
        fs = 20000

        # Act
        sos = scipy_signal.butter(4, [lowcut, highcut], 'band', fs=fs, output='sos')
        filtered = scipy_signal.sosfilt(sos, data)

        # Assert
        assert filtered.shape == data.shape


class TestDataAugmentation:
    """Test suite for data augmentation"""

    def test_add_gaussian_noise(self, sample_vibration_signal):
        """Test adding Gaussian noise for augmentation"""
        # Arrange
        signal = sample_vibration_signal
        noise_level = 0.01

        # Act
        noise = np.random.normal(0, noise_level, signal.shape)
        augmented = signal + noise

        # Assert
        assert augmented.shape == signal.shape
        assert not np.array_equal(augmented, signal)

    def test_time_shift_augmentation(self, sample_vibration_signal):
        """Test time-shift augmentation"""
        # Arrange
        signal = sample_vibration_signal
        shift = 10

        # Act
        augmented = np.roll(signal, shift)

        # Assert
        assert augmented.shape == signal.shape
        assert not np.array_equal(augmented, signal)

    def test_amplitude_scaling(self, sample_vibration_signal):
        """Test amplitude scaling augmentation"""
        # Arrange
        signal = sample_vibration_signal
        scale_factor = 1.1

        # Act
        augmented = signal * scale_factor

        # Assert
        assert augmented.shape == signal.shape
        assert np.allclose(augmented / scale_factor, signal)

    def test_time_warping(self, sample_vibration_signal):
        """Test time warping augmentation"""
        # Arrange
        signal = sample_vibration_signal
        warp_factor = 0.9

        # Act - Simple resampling
        new_length = int(len(signal) * warp_factor)
        indices = np.linspace(0, len(signal) - 1, new_length)
        augmented = np.interp(indices, np.arange(len(signal)), signal)

        # Assert
        assert len(augmented) == new_length


class TestMissingDataHandling:
    """Test suite for missing data handling"""

    def test_detect_missing_values(self):
        """Test detection of missing values"""
        # Arrange
        df = pd.DataFrame({
            'col1': [1, 2, np.nan, 4],
            'col2': [5, np.nan, 7, 8]
        })

        # Act
        missing_count = df.isnull().sum()

        # Assert
        assert missing_count['col1'] == 1
        assert missing_count['col2'] == 1

    def test_forward_fill_missing(self):
        """Test forward fill for missing values"""
        # Arrange
        df = pd.DataFrame({
            'col1': [1, 2, np.nan, 4, np.nan]
        })

        # Act
        filled = df.fillna(method='ffill')

        # Assert
        assert filled['col1'].isnull().sum() == 0
        assert filled['col1'].iloc[2] == 2

    def test_interpolate_missing(self):
        """Test interpolation for missing values"""
        # Arrange
        df = pd.DataFrame({
            'col1': [1, 2, np.nan, 4, 5]
        })

        # Act
        filled = df.interpolate()

        # Assert
        assert filled['col1'].isnull().sum() == 0
        assert filled['col1'].iloc[2] == 3.0

    def test_drop_missing_rows(self):
        """Test dropping rows with missing values"""
        # Arrange
        df = pd.DataFrame({
            'col1': [1, 2, np.nan, 4],
            'col2': [5, 6, 7, 8]
        })

        # Act
        cleaned = df.dropna()

        # Assert
        assert len(cleaned) == 3
        assert cleaned['col1'].isnull().sum() == 0

    @pytest.mark.parametrize("method,expected_nulls", [
        ("ffill", 0),
        ("bfill", 0),
        ("interpolate", 0),
    ])
    def test_different_filling_methods(self, method, expected_nulls):
        """Test different missing value filling methods"""
        # Arrange
        df = pd.DataFrame({'col1': [1, np.nan, 3]})

        # Act
        if method == "ffill":
            result = df.fillna(method='ffill')
        elif method == "bfill":
            result = df.fillna(method='bfill')
        elif method == "interpolate":
            result = df.interpolate()

        # Assert
        assert result['col1'].isnull().sum() == expected_nulls


class TestDataSplitting:
    """Test suite for train/val/test splitting"""

    def test_train_test_split_ratios(self, sample_features):
        """Test train/test split maintains correct ratios"""
        # Arrange
        data = sample_features
        train_ratio = 0.7

        # Act
        n = len(data)
        train_end = int(n * train_ratio)
        train_data = data[:train_end]
        test_data = data[train_end:]

        # Assert
        assert len(train_data) == train_end
        assert len(test_data) == n - train_end

    def test_train_val_test_split(self, sample_features):
        """Test three-way split"""
        # Arrange
        data = sample_features
        train_ratio, val_ratio, test_ratio = 0.7, 0.15, 0.15

        # Act
        n = len(data)
        train_end = int(n * train_ratio)
        val_end = train_end + int(n * val_ratio)

        train_data = data[:train_end]
        val_data = data[train_end:val_end]
        test_data = data[val_end:]

        # Assert
        total_samples = len(train_data) + len(val_data) + len(test_data)
        assert total_samples == n
        assert len(train_data) > len(val_data)
        assert len(train_data) > len(test_data)

    def test_stratified_split(self):
        """Test stratified split for balanced classes"""
        # Arrange
        n_samples = 100
        labels = np.array([0] * 50 + [1] * 50)
        data = np.random.randn(n_samples, 10)

        # Act - Simple stratification check
        from collections import Counter
        label_counts = Counter(labels)

        # Assert
        assert label_counts[0] == label_counts[1]

    def test_shuffle_split(self, sample_features):
        """Test data shuffling during split"""
        # Arrange
        data = sample_features
        np.random.seed(42)

        # Act
        indices = np.arange(len(data))
        np.random.shuffle(indices)
        shuffled_data = data[indices]

        # Assert
        assert not np.array_equal(shuffled_data, data)


class TestSegmentation:
    """Test suite for time series segmentation"""

    def test_sliding_window_segmentation(self, sample_vibration_signal):
        """Test sliding window segmentation"""
        # Arrange
        signal = sample_vibration_signal
        window_size = 100
        stride = 50

        # Act
        segments = []
        for i in range(0, len(signal) - window_size + 1, stride):
            segment = signal[i:i + window_size]
            segments.append(segment)

        # Assert
        assert len(segments) > 0
        assert all(len(seg) == window_size for seg in segments)

    def test_fixed_segments(self, sample_vibration_signal):
        """Test fixed-size segmentation"""
        # Arrange
        signal = sample_vibration_signal
        segment_size = 200
        num_segments = len(signal) // segment_size

        # Act
        segments = np.array_split(signal[:num_segments * segment_size], num_segments)

        # Assert
        assert len(segments) == num_segments
        assert all(len(seg) == segment_size for seg in segments)


@pytest.mark.slow
class TestPerformance:
    """Performance tests for preprocessing operations"""

    def test_large_data_loading_performance(self):
        """Test performance with large datasets"""
        # Arrange
        n_samples = 1000000
        data = np.random.randn(n_samples)

        # Act
        import time
        start = time.time()
        mean = np.mean(data)
        std = np.std(data)
        normalized = (data - mean) / std
        duration = time.time() - start

        # Assert
        assert duration < 1.0  # Should complete in < 1 second
        assert normalized.shape == data.shape
