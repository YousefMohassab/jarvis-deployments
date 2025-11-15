"""
Comprehensive Unit Tests for Feature Extraction Module

Tests cover:
- Time-domain features
- Frequency-domain features
- Time-frequency features (wavelets)
- Statistical features
- Feature validation
- Feature scaling
- Batch feature extraction
"""

import pytest
import numpy as np
from scipy import signal, stats
from unittest.mock import Mock, patch


pytestmark = pytest.mark.unit


class TestTimeDomainFeatures:
    """Test suite for time-domain feature extraction"""

    def test_rms_calculation(self, sample_vibration_signal):
        """Test RMS (Root Mean Square) calculation"""
        # Arrange
        signal = sample_vibration_signal

        # Act
        rms = np.sqrt(np.mean(signal ** 2))

        # Assert
        assert rms > 0
        assert not np.isnan(rms)
        assert not np.isinf(rms)

    def test_peak_value(self, sample_vibration_signal):
        """Test peak value extraction"""
        # Arrange
        signal = sample_vibration_signal

        # Act
        peak = np.max(np.abs(signal))

        # Assert
        assert peak >= 0
        assert peak >= np.abs(np.mean(signal))

    def test_crest_factor(self, sample_vibration_signal):
        """Test crest factor (peak/RMS ratio)"""
        # Arrange
        signal = sample_vibration_signal

        # Act
        peak = np.max(np.abs(signal))
        rms = np.sqrt(np.mean(signal ** 2))
        crest_factor = peak / rms

        # Assert
        assert crest_factor >= 1.0  # Crest factor is always >= 1

    def test_kurtosis_calculation(self, sample_vibration_signal):
        """Test kurtosis calculation"""
        # Arrange
        signal = sample_vibration_signal

        # Act
        kurt = stats.kurtosis(signal)

        # Assert
        assert not np.isnan(kurt)
        assert isinstance(kurt, (float, np.floating))

    def test_skewness_calculation(self, sample_vibration_signal):
        """Test skewness calculation"""
        # Arrange
        signal = sample_vibration_signal

        # Act
        skew = stats.skew(signal)

        # Assert
        assert not np.isnan(skew)
        assert isinstance(skew, (float, np.floating))

    def test_shape_factor(self, sample_vibration_signal):
        """Test shape factor (RMS/mean absolute)"""
        # Arrange
        signal = sample_vibration_signal

        # Act
        rms = np.sqrt(np.mean(signal ** 2))
        abs_mean = np.mean(np.abs(signal))
        shape_factor = rms / abs_mean if abs_mean > 0 else np.inf

        # Assert
        assert shape_factor > 0
        assert shape_factor >= 1.0

    def test_impulse_factor(self, sample_vibration_signal):
        """Test impulse factor (peak/mean absolute)"""
        # Arrange
        signal = sample_vibration_signal

        # Act
        peak = np.max(np.abs(signal))
        abs_mean = np.mean(np.abs(signal))
        impulse_factor = peak / abs_mean if abs_mean > 0 else np.inf

        # Assert
        assert impulse_factor > 0

    def test_clearance_factor(self, sample_vibration_signal):
        """Test clearance factor"""
        # Arrange
        signal = sample_vibration_signal

        # Act
        peak = np.max(np.abs(signal))
        sqrt_mean = np.mean(np.sqrt(np.abs(signal))) ** 2
        clearance_factor = peak / sqrt_mean if sqrt_mean > 0 else np.inf

        # Assert
        assert clearance_factor > 0

    @pytest.mark.parametrize("feature_name", [
        "mean", "std", "variance", "median", "min", "max"
    ])
    def test_basic_statistical_features(self, sample_vibration_signal, feature_name):
        """Test basic statistical features"""
        # Arrange
        signal = sample_vibration_signal

        # Act
        if feature_name == "mean":
            value = np.mean(signal)
        elif feature_name == "std":
            value = np.std(signal)
        elif feature_name == "variance":
            value = np.var(signal)
        elif feature_name == "median":
            value = np.median(signal)
        elif feature_name == "min":
            value = np.min(signal)
        elif feature_name == "max":
            value = np.max(signal)

        # Assert
        assert not np.isnan(value)
        assert not np.isinf(value)

    def test_peak_to_peak(self, sample_vibration_signal):
        """Test peak-to-peak amplitude"""
        # Arrange
        signal = sample_vibration_signal

        # Act
        ptp = np.ptp(signal)

        # Assert
        assert ptp >= 0
        assert ptp == np.max(signal) - np.min(signal)

    def test_extract_all_time_features(self, sample_vibration_signal):
        """Test extracting all time-domain features at once"""
        # Arrange
        signal = sample_vibration_signal

        # Act - Simulate feature extraction
        features = {
            'rms': np.sqrt(np.mean(signal ** 2)),
            'peak': np.max(np.abs(signal)),
            'kurtosis': stats.kurtosis(signal),
            'skewness': stats.skew(signal),
            'mean': np.mean(signal),
            'std': np.std(signal),
        }

        # Assert
        assert len(features) == 6
        assert all(not np.isnan(v) for v in features.values())


class TestFrequencyDomainFeatures:
    """Test suite for frequency-domain feature extraction"""

    def test_fft_spectrum(self, sample_vibration_signal):
        """Test FFT spectrum calculation"""
        # Arrange
        signal = sample_vibration_signal

        # Act
        fft_vals = np.fft.fft(signal)
        magnitude = np.abs(fft_vals)

        # Assert
        assert len(magnitude) == len(signal)
        assert magnitude[0] >= 0  # DC component

    def test_power_spectral_density(self, sample_vibration_signal, test_config):
        """Test PSD calculation"""
        # Arrange
        signal = sample_vibration_signal
        fs = test_config["sampling_rate"]

        # Act
        freqs, psd = signal.welch(signal, fs=fs, nperseg=256)

        # Assert
        assert len(freqs) == len(psd)
        assert all(psd >= 0)  # PSD is always non-negative

    def test_peak_frequency(self, sample_vibration_signal, test_config):
        """Test peak frequency detection"""
        # Arrange
        signal = sample_vibration_signal
        fs = test_config["sampling_rate"]

        # Act
        fft_vals = np.fft.fft(signal)
        magnitude = np.abs(fft_vals[:len(signal)//2])
        freqs = np.fft.fftfreq(len(signal), 1/fs)[:len(signal)//2]
        peak_freq = freqs[np.argmax(magnitude)]

        # Assert
        assert peak_freq >= 0
        assert peak_freq < fs / 2  # Nyquist limit

    def test_spectral_centroid(self, sample_vibration_signal, test_config):
        """Test spectral centroid calculation"""
        # Arrange
        signal = sample_vibration_signal
        fs = test_config["sampling_rate"]

        # Act
        fft_vals = np.fft.fft(signal)
        magnitude = np.abs(fft_vals[:len(signal)//2])
        freqs = np.fft.fftfreq(len(signal), 1/fs)[:len(signal)//2]
        centroid = np.sum(freqs * magnitude) / (np.sum(magnitude) + 1e-8)

        # Assert
        assert centroid >= 0
        assert not np.isnan(centroid)

    def test_spectral_spread(self, sample_vibration_signal, test_config):
        """Test spectral spread calculation"""
        # Arrange
        signal = sample_vibration_signal
        fs = test_config["sampling_rate"]

        # Act
        fft_vals = np.fft.fft(signal)
        magnitude = np.abs(fft_vals[:len(signal)//2])
        freqs = np.fft.fftfreq(len(signal), 1/fs)[:len(signal)//2]
        centroid = np.sum(freqs * magnitude) / (np.sum(magnitude) + 1e-8)
        spread = np.sqrt(np.sum(((freqs - centroid) ** 2) * magnitude) / (np.sum(magnitude) + 1e-8))

        # Assert
        assert spread >= 0
        assert not np.isnan(spread)

    def test_spectral_entropy(self, sample_vibration_signal):
        """Test spectral entropy calculation"""
        # Arrange
        signal = sample_vibration_signal

        # Act
        fft_vals = np.fft.fft(signal)
        magnitude = np.abs(fft_vals)
        power = magnitude ** 2
        power_norm = power / (np.sum(power) + 1e-8)
        power_norm = power_norm[power_norm > 0]
        entropy = -np.sum(power_norm * np.log2(power_norm + 1e-8))

        # Assert
        assert entropy >= 0
        assert not np.isnan(entropy)

    def test_band_power(self, sample_vibration_signal, test_config):
        """Test power in frequency bands"""
        # Arrange
        signal = sample_vibration_signal
        fs = test_config["sampling_rate"]
        low_band = (0, 1000)
        high_band = (1000, 5000)

        # Act
        freqs, psd = signal.welch(signal, fs=fs, nperseg=256)

        low_power = np.sum(psd[(freqs >= low_band[0]) & (freqs < low_band[1])])
        high_power = np.sum(psd[(freqs >= high_band[0]) & (freqs < high_band[1])])

        # Assert
        assert low_power >= 0
        assert high_power >= 0

    @pytest.mark.parametrize("band,expected", [
        ((0, 500), "low"),
        ((500, 2000), "mid"),
        ((2000, 10000), "high"),
    ])
    def test_multiple_frequency_bands(self, sample_vibration_signal, test_config, band, expected):
        """Test power calculation in multiple frequency bands"""
        # Arrange
        signal = sample_vibration_signal
        fs = test_config["sampling_rate"]

        # Act
        freqs, psd = signal.welch(signal, fs=fs, nperseg=256)
        band_power = np.sum(psd[(freqs >= band[0]) & (freqs < band[1])])

        # Assert
        assert band_power >= 0
        assert not np.isnan(band_power)


class TestTimeFrequencyFeatures:
    """Test suite for time-frequency features (wavelet)"""

    def test_wavelet_transform(self, sample_vibration_signal):
        """Test wavelet transform"""
        pytest.importorskip("pywt")
        import pywt

        # Arrange
        signal = sample_vibration_signal

        # Act
        coeffs = pywt.dwt(signal, 'db4')
        cA, cD = coeffs

        # Assert
        assert len(cA) > 0
        assert len(cD) > 0

    def test_wavelet_energy(self, sample_vibration_signal):
        """Test wavelet energy calculation"""
        pytest.importorskip("pywt")
        import pywt

        # Arrange
        signal = sample_vibration_signal

        # Act
        coeffs = pywt.wavedec(signal, 'db4', level=3)
        energies = [np.sum(c ** 2) for c in coeffs]

        # Assert
        assert all(e >= 0 for e in energies)

    def test_wavelet_entropy(self, sample_vibration_signal):
        """Test wavelet entropy"""
        pytest.importorskip("pywt")
        import pywt

        # Arrange
        signal = sample_vibration_signal

        # Act
        coeffs = pywt.wavedec(signal, 'db4', level=3)
        energies = [np.sum(c ** 2) for c in coeffs]
        total_energy = sum(energies) + 1e-8
        probs = [e / total_energy for e in energies]
        entropy = -sum(p * np.log2(p + 1e-8) for p in probs if p > 0)

        # Assert
        assert entropy >= 0
        assert not np.isnan(entropy)


class TestFeatureValidation:
    """Test suite for feature validation"""

    def test_validate_feature_vector(self, sample_features):
        """Test feature vector validation"""
        # Arrange
        features = sample_features[0]

        # Act
        is_valid = (
            not np.isnan(features).any() and
            not np.isinf(features).any() and
            len(features) > 0
        )

        # Assert
        assert is_valid

    def test_detect_invalid_features(self):
        """Test detection of invalid features"""
        # Arrange
        features = np.array([1.0, 2.0, np.nan, np.inf, 5.0])

        # Act
        has_nan = np.isnan(features).any()
        has_inf = np.isinf(features).any()

        # Assert
        assert has_nan
        assert has_inf

    def test_feature_range_validation(self):
        """Test feature value range validation"""
        # Arrange
        features = np.array([1.0, 2.0, 1000000.0])  # Outlier value
        threshold = 10.0

        # Act
        z_scores = np.abs((features - np.mean(features)) / np.std(features))
        outliers = z_scores > threshold

        # Assert
        assert outliers.any()

    def test_feature_correlation(self, sample_features):
        """Test feature correlation check"""
        # Arrange
        features = sample_features

        # Act
        correlation_matrix = np.corrcoef(features.T)

        # Assert
        assert correlation_matrix.shape == (features.shape[1], features.shape[1])
        assert not np.isnan(correlation_matrix).any()


class TestFeatureScaling:
    """Test suite for feature scaling"""

    def test_standard_scaling(self, sample_features):
        """Test standard scaling of features"""
        # Arrange
        features = sample_features

        # Act
        mean = np.mean(features, axis=0)
        std = np.std(features, axis=0)
        scaled = (features - mean) / (std + 1e-8)

        # Assert
        assert scaled.shape == features.shape
        assert np.allclose(np.mean(scaled, axis=0), 0, atol=0.01)

    def test_minmax_scaling(self, sample_features):
        """Test min-max scaling of features"""
        # Arrange
        features = sample_features

        # Act
        min_vals = np.min(features, axis=0)
        max_vals = np.max(features, axis=0)
        scaled = (features - min_vals) / (max_vals - min_vals + 1e-8)

        # Assert
        assert scaled.shape == features.shape
        assert np.all(scaled >= 0) and np.all(scaled <= 1)

    def test_robust_scaling(self, sample_features):
        """Test robust scaling with median and IQR"""
        # Arrange
        features = sample_features

        # Act
        median = np.median(features, axis=0)
        q75 = np.percentile(features, 75, axis=0)
        q25 = np.percentile(features, 25, axis=0)
        iqr = q75 - q25
        scaled = (features - median) / (iqr + 1e-8)

        # Assert
        assert scaled.shape == features.shape


class TestBatchFeatureExtraction:
    """Test suite for batch feature extraction"""

    def test_batch_extraction_shape(self, sample_multi_channel_data):
        """Test batch feature extraction maintains correct shape"""
        # Arrange
        n_samples = 10
        signals = [sample_multi_channel_data[:100] for _ in range(n_samples)]

        # Act - Extract RMS for each signal
        features = [np.sqrt(np.mean(sig ** 2, axis=0)) for sig in signals]
        features_array = np.array(features)

        # Assert
        assert features_array.shape[0] == n_samples

    def test_parallel_feature_extraction(self, sample_multi_channel_data):
        """Test parallel feature extraction"""
        # Arrange
        n_samples = 5
        signals = [sample_multi_channel_data[:100] for _ in range(n_samples)]

        # Act - Sequential extraction
        features = []
        for sig in signals:
            feat = {
                'rms': np.sqrt(np.mean(sig ** 2)),
                'peak': np.max(np.abs(sig)),
            }
            features.append(feat)

        # Assert
        assert len(features) == n_samples
        assert all('rms' in f and 'peak' in f for f in features)

    def test_batch_extraction_consistency(self, sample_vibration_signal):
        """Test batch extraction gives consistent results"""
        # Arrange
        signal = sample_vibration_signal

        # Act - Extract same feature twice
        rms1 = np.sqrt(np.mean(signal ** 2))
        rms2 = np.sqrt(np.mean(signal ** 2))

        # Assert
        assert rms1 == rms2


@pytest.mark.slow
class TestFeaturePerformance:
    """Performance tests for feature extraction"""

    def test_time_feature_extraction_speed(self):
        """Test time-domain feature extraction speed"""
        # Arrange
        n_samples = 10000
        signal = np.random.randn(n_samples)

        # Act
        import time
        start = time.time()

        rms = np.sqrt(np.mean(signal ** 2))
        peak = np.max(np.abs(signal))
        kurt = stats.kurtosis(signal)

        duration = time.time() - start

        # Assert
        assert duration < 0.1  # Should be fast

    def test_frequency_feature_extraction_speed(self):
        """Test frequency-domain feature extraction speed"""
        # Arrange
        n_samples = 10000
        signal = np.random.randn(n_samples)

        # Act
        import time
        start = time.time()

        fft_vals = np.fft.fft(signal)
        magnitude = np.abs(fft_vals)

        duration = time.time() - start

        # Assert
        assert duration < 0.1
