#!/usr/bin/env python3
"""
Synthetic Data Generator for Predictive Asset Health Platform
Generates realistic sensor data with configurable failure modes for testing and demo
"""

import json
import time
import random
import numpy as np
from datetime import datetime, timedelta
from typing import Dict, List, Optional, Tuple
from dataclasses import dataclass
from confluent_kafka import Producer
import argparse
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

@dataclass
class AssetConfig:
    asset_id: str
    plant: str
    asset_class: str
    vendor: str
    failure_mode: Optional[str] = None
    failure_start_hours: Optional[float] = None
    failure_severity: float = 1.0

class FailureMode:
    """Base class for failure mode simulation"""
    
    def __init__(self, severity: float = 1.0):
        self.severity = severity
    
    def apply(self, timestamp: float, base_values: Dict[str, float]) -> Dict[str, float]:
        """Apply failure mode effects to sensor readings"""
        return base_values

class BearingWearFailure(FailureMode):
    """Simulates progressive bearing wear leading to failure"""
    
    def apply(self, timestamp: float, base_values: Dict[str, float]) -> Dict[str, float]:
        # Progressive degradation over time
        hours_since_start = timestamp / 3600
        degradation_factor = min(1.0, hours_since_start / 240)  # 10 days to full degradation
        
        modified = base_values.copy()
        
        # Increase vibration RMS (bearing wear signature)
        if 'vibration_vel_mm_s' in modified:
            modified['vibration_vel_mm_s'] += (5 + 10 * degradation_factor) * self.severity
        
        # Increase bearing temperature
        if 'bearing_temp_c' in modified:
            modified['bearing_temp_c'] += (10 + 20 * degradation_factor) * self.severity
        
        # Add high-frequency content (1-3 kHz range indicators)
        # Simulated through increased RMS at certain frequencies
        
        return modified

class MisalignmentFailure(FailureMode):
    """Simulates shaft misalignment"""
    
    def apply(self, timestamp: float, base_values: Dict[str, float]) -> Dict[str, float]:
        modified = base_values.copy()
        
        # Increase vibration at 1X and 2X running speed
        if 'vibration_vel_mm_s' in modified:
            # Add 1X and 2X harmonics (simulated as overall increase)
            modified['vibration_vel_mm_s'] += 3 * self.severity
        
        # Slight temperature increase from friction
        if 'bearing_temp_c' in modified:
            modified['bearing_temp_c'] += 5 * self.severity
        
        return modified

class CavitationFailure(FailureMode):
    """Simulates pump cavitation"""
    
    def apply(self, timestamp: float, base_values: Dict[str, float]) -> Dict[str, float]:
        modified = base_values.copy()
        
        # Reduce discharge pressure
        if 'discharge_pressure_bar' in modified:
            modified['discharge_pressure_bar'] *= (1 - 0.3 * self.severity)
        
        # Increase vibration (cavitation noise)
        if 'vibration_vel_mm_s' in modified:
            # Add random spikes for cavitation bubbles
            cavitation_noise = random.uniform(0, 5) * self.severity
            modified['vibration_vel_mm_s'] += cavitation_noise
        
        # Erratic current draw
        if 'motor_current_a' in modified:
            current_variation = random.uniform(-5, 5) * self.severity
            modified['motor_current_a'] += current_variation
        
        return modified

class SyntheticDataGenerator:
    """Generates synthetic sensor data for asset health monitoring"""
    
    def __init__(self, kafka_config: Dict[str, str]):
        self.producer = Producer(kafka_config)
        
        # Failure mode mapping
        self.failure_modes = {
            'bearing_wear': BearingWearFailure,
            'misalignment': MisalignmentFailure,
            'cavitation': CavitationFailure
        }
        
        # Base sensor configurations by asset class
        self.sensor_configs = {
            'pump': {
                'vibration_vel_mm_s': {'base': 5.0, 'noise': 0.5, 'range': (0, 50)},
                'bearing_temp_c': {'base': 60.0, 'noise': 2.0, 'range': (20, 120)},
                'motor_current_a': {'base': 75.0, 'noise': 3.0, 'range': (0, 150)},
                'discharge_pressure_bar': {'base': 15.0, 'noise': 1.0, 'range': (0, 30)},
                'ambient_temp_c': {'base': 25.0, 'noise': 2.0, 'range': (10, 40)}
            },
            'compressor': {
                'vibration_vel_mm_s': {'base': 8.0, 'noise': 1.0, 'range': (0, 50)},
                'bearing_temp_c': {'base': 80.0, 'noise': 3.0, 'range': (30, 130)},
                'motor_current_a': {'base': 90.0, 'noise': 5.0, 'range': (0, 200)},
                'discharge_pressure_bar': {'base': 25.0, 'noise': 2.0, 'range': (0, 50)},
                'ambient_temp_c': {'base': 25.0, 'noise': 2.0, 'range': (10, 40)}
            },
            'motor': {
                'vibration_vel_mm_s': {'base': 3.0, 'noise': 0.3, 'range': (0, 30)},
                'bearing_temp_c': {'base': 70.0, 'noise': 2.0, 'range': (25, 110)},
                'motor_current_a': {'base': 60.0, 'noise': 3.0, 'range': (0, 120)},
                'ambient_temp_c': {'base': 25.0, 'noise': 2.0, 'range': (10, 40)}
            },
            'fan': {
                'vibration_vel_mm_s': {'base': 4.0, 'noise': 0.5, 'range': (0, 25)},
                'bearing_temp_c': {'base': 50.0, 'noise': 2.0, 'range': (20, 90)},
                'motor_current_a': {'base': 45.0, 'noise': 2.0, 'range': (0, 100)},
                'ambient_temp_c': {'base': 25.0, 'noise': 2.0, 'range': (10, 40)}
            }
        }
    
    def generate_base_values(self, asset_class: str, timestamp: float) -> Dict[str, float]:
        """Generate base sensor values for an asset class"""
        config = self.sensor_configs.get(asset_class.lower(), self.sensor_configs['pump'])
        values = {}
        
        # Add some daily and weekly cycles
        hour_of_day = (timestamp % (24 * 3600)) / 3600
        day_of_week = (timestamp % (7 * 24 * 3600)) / (24 * 3600)
        
        daily_factor = 1 + 0.1 * np.sin(2 * np.pi * hour_of_day / 24)  # Daily cycle
        weekly_factor = 1 + 0.05 * np.sin(2 * np.pi * day_of_week / 7)  # Weekly cycle
        
        for sensor, params in config.items():
            # Base value with cycles
            base_value = params['base'] * daily_factor * weekly_factor
            
            # Add random noise
            noise = random.gauss(0, params['noise'])
            value = base_value + noise
            
            # Clamp to realistic range
            value = max(params['range'][0], min(params['range'][1], value))
            values[sensor] = value
        
        return values
    
    def generate_asset_data(self, asset: AssetConfig, start_time: datetime, 
                          duration_hours: int, interval_seconds: int = 5) -> List[Dict]:
        """Generate sensor data for a single asset"""
        data_points = []
        failure_mode = None
        
        # Initialize failure mode if specified
        if asset.failure_mode and asset.failure_start_hours:
            failure_class = self.failure_modes.get(asset.failure_mode)
            if failure_class:
                failure_mode = failure_class(asset.failure_severity)
        
        total_points = (duration_hours * 3600) // interval_seconds
        
        for i in range(total_points):
            timestamp = start_time + timedelta(seconds=i * interval_seconds)
            unix_timestamp = timestamp.timestamp()
            
            # Generate base values
            base_values = self.generate_base_values(asset.asset_class, unix_timestamp)
            
            # Apply failure mode if active
            if (failure_mode and asset.failure_start_hours and 
                i * interval_seconds >= asset.failure_start_hours * 3600):
                # Time since failure started
                failure_duration = unix_timestamp - (start_time.timestamp() + asset.failure_start_hours * 3600)
                base_values = failure_mode.apply(failure_duration, base_values)
            
            # Create data points for each sensor
            for sensor, value in base_values.items():
                # Determine quality (occasionally inject bad data)
                quality = 'GOOD'
                if random.random() < 0.01:  # 1% bad data
                    quality = random.choice(['BAD', 'NO_DATA', 'SUSPECT'])
                    if quality == 'NO_DATA':
                        value = None
                
                data_point = {
                    'ts': int(unix_timestamp * 1000),  # Milliseconds
                    'asset_id': asset.asset_id,
                    'tag': sensor,
                    'value': value,
                    'q': quality
                }
                data_points.append(data_point)
            
            # Log progress periodically
            if i % (total_points // 10) == 0:
                logger.info(f"Generated {i}/{total_points} data points for {asset.asset_id}")
        
        return data_points
    
    def publish_to_kafka(self, data_points: List[Dict], topic: str = 'facilis.raw.timeseries'):
        """Publish data points to Kafka"""
        logger.info(f"Publishing {len(data_points)} data points to Kafka topic: {topic}")
        
        for i, data_point in enumerate(data_points):
            try:
                self.producer.produce(
                    topic=topic,
                    key=data_point['asset_id'],
                    value=json.dumps(data_point)
                )
                
                # Flush every 1000 messages
                if i % 1000 == 0:
                    self.producer.flush()
                    
            except Exception as e:
                logger.error(f"Failed to publish data point: {e}")
        
        # Final flush
        self.producer.flush()
        logger.info(f"Published {len(data_points)} data points successfully")

def create_demo_assets() -> List[AssetConfig]:
    """Create demo asset configurations with various failure modes"""
    assets = [
        # Healthy assets
        AssetConfig('PLANT1_PUMP_SULZER_001', 'PLANT1', 'PUMP', 'SULZER'),
        AssetConfig('PLANT1_PUMP_SULZER_002', 'PLANT1', 'PUMP', 'SULZER'),
        AssetConfig('PLANT2_PUMP_GRUNDFOS_001', 'PLANT2', 'PUMP', 'GRUNDFOS'),
        AssetConfig('PLANT2_COMPRESSOR_ATLAS_001', 'PLANT2', 'COMPRESSOR', 'ATLAS'),
        AssetConfig('PLANT3_MOTOR_ABB_001', 'PLANT3', 'MOTOR', 'ABB'),
        AssetConfig('PLANT3_MOTOR_ABB_002', 'PLANT3', 'MOTOR', 'ABB'),
        AssetConfig('PLANT1_FAN_EBMPAPST_001', 'PLANT1', 'FAN', 'EBMPAPST'),
        AssetConfig('PLANT2_FAN_EBMPAPST_001', 'PLANT2', 'FAN', 'EBMPAPST'),
        
        # Assets with developing failures
        AssetConfig('PLANT1_PUMP_SULZER_003', 'PLANT1', 'PUMP', 'SULZER', 
                   'bearing_wear', 120, 0.8),  # Bearing wear starting at 120h
        AssetConfig('PLANT2_COMPRESSOR_ATLAS_002', 'PLANT2', 'COMPRESSOR', 'ATLAS',
                   'misalignment', 72, 0.6),   # Misalignment starting at 72h
        AssetConfig('PLANT1_PUMP_GRUNDFOS_002', 'PLANT1', 'PUMP', 'GRUNDFOS',
                   'cavitation', 48, 0.7),     # Cavitation starting at 48h
        AssetConfig('PLANT3_MOTOR_SIEMENS_001', 'PLANT3', 'MOTOR', 'SIEMENS',
                   'bearing_wear', 168, 0.9),  # Severe bearing wear at 168h
        
        # Additional healthy assets for fleet size
        AssetConfig('PLANT3_PUMP_KSB_001', 'PLANT3', 'PUMP', 'KSB'),
        AssetConfig('PLANT1_COMPRESSOR_INGERSOLL_001', 'PLANT1', 'COMPRESSOR', 'INGERSOLL'),
        AssetConfig('PLANT2_MOTOR_WEG_001', 'PLANT2', 'MOTOR', 'WEG')
    ]
    
    return assets

def main():
    parser = argparse.ArgumentParser(description='Generate synthetic asset health data')
    parser.add_argument('--kafka-bootstrap', default='localhost:9092',
                       help='Kafka bootstrap servers')
    parser.add_argument('--duration-hours', type=int, default=168,
                       help='Duration to generate data for (hours)')
    parser.add_argument('--interval-seconds', type=int, default=5,
                       help='Interval between data points (seconds)')
    parser.add_argument('--topic', default='facilis.raw.timeseries',
                       help='Kafka topic to publish to')
    parser.add_argument('--real-time', action='store_true',
                       help='Publish data in real-time (respects interval)')
    parser.add_argument('--output-file', help='Save data to JSON file instead of Kafka')
    
    args = parser.parse_args()
    
    # Configure Kafka
    kafka_config = {
        'bootstrap.servers': args.kafka_bootstrap,
        'acks': 'all',
        'retries': 3,
        'compression.type': 'snappy'
    }
    
    # Create data generator
    generator = SyntheticDataGenerator(kafka_config)
    
    # Create demo assets
    assets = create_demo_assets()
    logger.info(f"Created {len(assets)} demo assets")
    
    # Generate data
    start_time = datetime.now() - timedelta(hours=args.duration_hours)
    all_data_points = []
    
    for asset in assets:
        logger.info(f"Generating data for {asset.asset_id} "
                   f"({'with ' + asset.failure_mode if asset.failure_mode else 'healthy'})")
        
        asset_data = generator.generate_asset_data(
            asset, start_time, args.duration_hours, args.interval_seconds
        )
        all_data_points.extend(asset_data)
    
    logger.info(f"Generated {len(all_data_points)} total data points")
    
    # Output data
    if args.output_file:
        # Save to file
        with open(args.output_file, 'w') as f:
            json.dump(all_data_points, f, indent=2)
        logger.info(f"Saved data to {args.output_file}")
    else:
        # Publish to Kafka
        if args.real_time:
            # Sort by timestamp and publish in real-time
            all_data_points.sort(key=lambda x: x['ts'])
            logger.info("Publishing data in real-time mode...")
            
            last_ts = None
            for data_point in all_data_points:
                if last_ts:
                    sleep_time = (data_point['ts'] - last_ts) / 1000
                    if sleep_time > 0:
                        time.sleep(min(sleep_time, 60))  # Cap sleep at 1 minute
                
                generator.producer.produce(
                    topic=args.topic,
                    key=data_point['asset_id'],
                    value=json.dumps(data_point)
                )
                last_ts = data_point['ts']
        else:
            # Batch publish
            generator.publish_to_kafka(all_data_points, args.topic)

if __name__ == "__main__":
    main()