"""
Model Metrics Exporter
Standalone exporter for ML model performance metrics
Runs as a separate service and exposes metrics on port 9090
"""

from prometheus_client import start_http_server, Gauge, Counter, Histogram, Info
import time
import logging
import json
import os
from datetime import datetime
import psycopg2
from psycopg2.extras import RealDictCursor
import numpy as np
from typing import Dict, Any
import schedule

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Model Performance Metrics
MODEL_ACCURACY = Gauge('model_prediction_accuracy', 'Current model accuracy')
MODEL_MAE = Gauge('model_mae', 'Mean Absolute Error')
MODEL_RMSE = Gauge('model_rmse', 'Root Mean Squared Error')
MODEL_MAPE = Gauge('model_mape', 'Mean Absolute Percentage Error')
MODEL_R2 = Gauge('model_r2_score', 'R² Score')
MODEL_PRECISION = Gauge('model_precision', 'Model Precision')
MODEL_RECALL = Gauge('model_recall', 'Model Recall')
MODEL_F1 = Gauge('model_f1_score', 'F1 Score')

# Training Metrics
MODEL_TRAINING_LOSS = Gauge('model_training_loss', 'Training loss from last epoch')
MODEL_VALIDATION_LOSS = Gauge('model_validation_loss', 'Validation loss from last epoch')
MODEL_LAST_TRAINING = Gauge('model_last_training_timestamp', 'Timestamp of last training')
MODEL_TRAINING_DURATION = Gauge('model_training_duration_seconds', 'Duration of last training')

# Prediction Metrics
PREDICTION_TOTAL = Counter('model_predictions_total', 'Total predictions', ['rul_category', 'confidence'])
PREDICTION_FAILED = Counter('model_predictions_failed_total', 'Failed predictions', ['error_type'])
INFERENCE_DURATION = Histogram(
    'model_inference_duration_seconds',
    'Inference duration',
    buckets=(0.01, 0.05, 0.1, 0.25, 0.5, 1.0, 2.0, 5.0)
)

# Feature Importance
FEATURE_IMPORTANCE = Gauge('model_feature_importance', 'Feature importance scores', ['feature'])

# Bearing Health
BEARING_HEALTH = Gauge('bearing_health_status', 'Bearing health status', ['bearing_id', 'status'])

# Model Info
MODEL_INFO = Info('model_info', 'Model metadata')

# Drift Detection
DATA_DRIFT = Gauge('model_data_drift_score', 'Data drift score')
CONCEPT_DRIFT = Gauge('model_concept_drift_score', 'Concept drift score')

# Business Metrics
BEARINGS_MONITORED = Gauge('bearings_monitored_total', 'Total number of bearings monitored')
CRITICAL_BEARINGS = Gauge('bearings_critical_total', 'Number of bearings in critical condition')
ALERTS_GENERATED = Counter('alerts_generated_total', 'Total alerts generated', ['severity'])


class ModelMetricsCollector:
    """Collects and exports ML model metrics"""

    def __init__(self):
        self.db_config = {
            'host': os.getenv('DB_HOST', 'localhost'),
            'port': os.getenv('DB_PORT', '5432'),
            'database': os.getenv('DB_NAME', 'rul_db'),
            'user': os.getenv('DB_USER', 'postgres'),
            'password': os.getenv('DB_PASSWORD', 'postgres')
        }
        self.model_path = os.getenv('MODEL_PATH', '/models/latest')
        self.metrics_interval = int(os.getenv('METRICS_INTERVAL', '60'))

    def connect_db(self):
        """Create database connection"""
        try:
            conn = psycopg2.connect(**self.db_config)
            return conn
        except Exception as e:
            logger.error(f"Database connection error: {e}")
            return None

    def collect_model_performance_metrics(self):
        """Collect model performance metrics from database"""
        try:
            conn = self.connect_db()
            if not conn:
                return

            with conn.cursor(cursor_factory=RealDictCursor) as cur:
                # Get latest model metrics
                cur.execute("""
                    SELECT
                        accuracy, mae, rmse, mape, r2_score,
                        precision, recall, f1_score,
                        training_loss, validation_loss,
                        training_timestamp, training_duration,
                        model_version, algorithm, feature_count
                    FROM model_metrics
                    ORDER BY training_timestamp DESC
                    LIMIT 1
                """)

                result = cur.fetchone()

                if result:
                    # Update metrics
                    MODEL_ACCURACY.set(result['accuracy'] or 0)
                    MODEL_MAE.set(result['mae'] or 0)
                    MODEL_RMSE.set(result['rmse'] or 0)
                    MODEL_MAPE.set(result['mape'] or 0)
                    MODEL_R2.set(result['r2_score'] or 0)
                    MODEL_PRECISION.set(result['precision'] or 0)
                    MODEL_RECALL.set(result['recall'] or 0)
                    MODEL_F1.set(result['f1_score'] or 0)

                    MODEL_TRAINING_LOSS.set(result['training_loss'] or 0)
                    MODEL_VALIDATION_LOSS.set(result['validation_loss'] or 0)

                    if result['training_timestamp']:
                        MODEL_LAST_TRAINING.set(result['training_timestamp'].timestamp())

                    if result['training_duration']:
                        MODEL_TRAINING_DURATION.set(result['training_duration'])

                    # Update model info
                    MODEL_INFO.info({
                        'version': result['model_version'] or 'unknown',
                        'algorithm': result['algorithm'] or 'unknown',
                        'features': str(result['feature_count'] or 0),
                        'training_date': str(result['training_timestamp'] or '')
                    })

                    logger.info("Model performance metrics updated")

            conn.close()

        except Exception as e:
            logger.error(f"Error collecting model performance metrics: {e}")

    def collect_feature_importance(self):
        """Collect feature importance scores"""
        try:
            conn = self.connect_db()
            if not conn:
                return

            with conn.cursor(cursor_factory=RealDictCursor) as cur:
                cur.execute("""
                    SELECT feature_name, importance_score
                    FROM feature_importance
                    WHERE model_version = (
                        SELECT model_version
                        FROM model_metrics
                        ORDER BY training_timestamp DESC
                        LIMIT 1
                    )
                    ORDER BY importance_score DESC
                    LIMIT 20
                """)

                results = cur.fetchall()

                for row in results:
                    FEATURE_IMPORTANCE.labels(
                        feature=row['feature_name']
                    ).set(row['importance_score'])

                logger.info(f"Updated {len(results)} feature importance scores")

            conn.close()

        except Exception as e:
            logger.error(f"Error collecting feature importance: {e}")

    def collect_prediction_metrics(self):
        """Collect prediction statistics"""
        try:
            conn = self.connect_db()
            if not conn:
                return

            with conn.cursor(cursor_factory=RealDictCursor) as cur:
                # Get predictions from last hour
                cur.execute("""
                    SELECT
                        CASE
                            WHEN predicted_rul < 50 THEN 'critical'
                            WHEN predicted_rul < 100 THEN 'warning'
                            ELSE 'normal'
                        END as rul_category,
                        confidence_level,
                        COUNT(*) as count
                    FROM predictions
                    WHERE prediction_timestamp > NOW() - INTERVAL '1 hour'
                    GROUP BY rul_category, confidence_level
                """)

                results = cur.fetchall()

                # Note: Counter metrics are cumulative, this is just for monitoring
                logger.info(f"Prediction distribution (last hour): {results}")

            conn.close()

        except Exception as e:
            logger.error(f"Error collecting prediction metrics: {e}")

    def collect_bearing_health(self):
        """Collect bearing health status"""
        try:
            conn = self.connect_db()
            if not conn:
                return

            with conn.cursor(cursor_factory=RealDictCursor) as cur:
                cur.execute("""
                    SELECT
                        bearing_id,
                        health_status,
                        COUNT(*) as count
                    FROM (
                        SELECT DISTINCT ON (bearing_id)
                            bearing_id,
                            CASE
                                WHEN predicted_rul < 50 THEN 'critical'
                                WHEN predicted_rul < 100 THEN 'degrading'
                                WHEN predicted_rul < 200 THEN 'healthy'
                                ELSE 'healthy'
                            END as health_status
                        FROM predictions
                        ORDER BY bearing_id, prediction_timestamp DESC
                    ) as latest_status
                    GROUP BY bearing_id, health_status
                """)

                results = cur.fetchall()

                # Reset all gauges
                BEARING_HEALTH._metrics.clear()

                for row in results:
                    BEARING_HEALTH.labels(
                        bearing_id=row['bearing_id'],
                        status=row['health_status']
                    ).set(row['count'])

                logger.info(f"Updated bearing health for {len(results)} statuses")

            conn.close()

        except Exception as e:
            logger.error(f"Error collecting bearing health: {e}")

    def collect_drift_metrics(self):
        """Collect data and concept drift scores"""
        try:
            conn = self.connect_db()
            if not conn:
                return

            with conn.cursor(cursor_factory=RealDictCursor) as cur:
                cur.execute("""
                    SELECT data_drift_score, concept_drift_score
                    FROM drift_monitoring
                    ORDER BY check_timestamp DESC
                    LIMIT 1
                """)

                result = cur.fetchone()

                if result:
                    DATA_DRIFT.set(result['data_drift_score'] or 0)
                    CONCEPT_DRIFT.set(result['concept_drift_score'] or 0)
                    logger.info("Drift metrics updated")

            conn.close()

        except Exception as e:
            logger.error(f"Error collecting drift metrics: {e}")

    def collect_business_metrics(self):
        """Collect business-level metrics"""
        try:
            conn = self.connect_db()
            if not conn:
                return

            with conn.cursor(cursor_factory=RealDictCursor) as cur:
                # Total bearings monitored
                cur.execute("""
                    SELECT COUNT(DISTINCT bearing_id) as total
                    FROM predictions
                    WHERE prediction_timestamp > NOW() - INTERVAL '24 hours'
                """)
                result = cur.fetchone()
                BEARINGS_MONITORED.set(result['total'] or 0)

                # Critical bearings
                cur.execute("""
                    SELECT COUNT(DISTINCT bearing_id) as total
                    FROM (
                        SELECT DISTINCT ON (bearing_id) bearing_id, predicted_rul
                        FROM predictions
                        ORDER BY bearing_id, prediction_timestamp DESC
                    ) as latest
                    WHERE predicted_rul < 50
                """)
                result = cur.fetchone()
                CRITICAL_BEARINGS.set(result['total'] or 0)

                logger.info("Business metrics updated")

            conn.close()

        except Exception as e:
            logger.error(f"Error collecting business metrics: {e}")

    def collect_all_metrics(self):
        """Collect all metrics"""
        logger.info("Starting metrics collection...")

        self.collect_model_performance_metrics()
        self.collect_feature_importance()
        self.collect_prediction_metrics()
        self.collect_bearing_health()
        self.collect_drift_metrics()
        self.collect_business_metrics()

        logger.info("Metrics collection completed")

    def run(self, port: int = 9090):
        """Start the metrics exporter"""
        logger.info(f"Starting Model Metrics Exporter on port {port}")

        # Start Prometheus HTTP server
        start_http_server(port)

        # Schedule metrics collection
        schedule.every(self.metrics_interval).seconds.do(self.collect_all_metrics)

        # Initial collection
        self.collect_all_metrics()

        # Keep running
        logger.info("Metrics exporter is running. Press Ctrl+C to stop.")
        try:
            while True:
                schedule.run_pending()
                time.sleep(1)
        except KeyboardInterrupt:
            logger.info("Shutting down metrics exporter...")


def main():
    """Main entry point"""
    collector = ModelMetricsCollector()
    port = int(os.getenv('EXPORTER_PORT', '9090'))
    collector.run(port=port)


if __name__ == '__main__':
    main()
