"""
Utility Functions for Model Management

This module provides utility functions for:
- Model loading and saving
- Metric calculation
- Model comparison
- Deployment helpers
- File cleanup
- Monitoring and logging

Author: RUL Prediction System
Version: 1.0.0
"""

import os
import json
import shutil
import logging
from typing import Dict, Any, List, Optional, Tuple
from datetime import datetime
import numpy as np
import pandas as pd

logger = logging.getLogger(__name__)


# ============================================================================
# Model Loading and Saving
# ============================================================================

def load_model(model_path: str) -> Any:
    """
    Load a trained model from disk.

    Args:
        model_path: Path to the model file

    Returns:
        Loaded model object

    Raises:
        FileNotFoundError: If model file doesn't exist
    """
    logger.info(f"Loading model from: {model_path}")

    if not os.path.exists(model_path):
        raise FileNotFoundError(f"Model file not found: {model_path}")

    try:
        # For TensorFlow/Keras models
        if model_path.endswith('.h5') or model_path.endswith('.keras'):
            import tensorflow as tf
            model = tf.keras.models.load_model(model_path)

        # For PyTorch models
        elif model_path.endswith('.pt') or model_path.endswith('.pth'):
            import torch
            model = torch.load(model_path)

        # For scikit-learn models
        elif model_path.endswith('.pkl'):
            import joblib
            model = joblib.load(model_path)

        else:
            raise ValueError(f"Unsupported model format: {model_path}")

        logger.info(f"Model loaded successfully")
        return model

    except Exception as e:
        logger.error(f"Error loading model: {str(e)}")
        raise


def save_model(model: Any, model_path: str, metadata: Optional[Dict] = None) -> None:
    """
    Save a trained model to disk.

    Args:
        model: Model object to save
        model_path: Path to save the model
        metadata: Optional metadata to save with the model
    """
    logger.info(f"Saving model to: {model_path}")

    # Ensure directory exists
    os.makedirs(os.path.dirname(model_path), exist_ok=True)

    try:
        # For TensorFlow/Keras models
        if hasattr(model, 'save'):
            model.save(model_path)

        # For PyTorch models
        elif hasattr(model, 'state_dict'):
            import torch
            torch.save(model.state_dict(), model_path)

        # For scikit-learn models
        else:
            import joblib
            joblib.dump(model, model_path)

        # Save metadata
        if metadata:
            metadata_path = model_path.replace('.h5', '_metadata.json')
            metadata_path = metadata_path.replace('.pt', '_metadata.json')
            metadata_path = metadata_path.replace('.pkl', '_metadata.json')

            with open(metadata_path, 'w') as f:
                json.dump(metadata, f, indent=2)

        logger.info(f"Model saved successfully")

    except Exception as e:
        logger.error(f"Error saving model: {str(e)}")
        raise


# ============================================================================
# Metric Calculation
# ============================================================================

def calculate_metrics(y_true: np.ndarray, y_pred: np.ndarray) -> Dict[str, float]:
    """
    Calculate comprehensive performance metrics.

    Args:
        y_true: Ground truth values
        y_pred: Predicted values

    Returns:
        Dictionary of metrics
    """
    from sklearn.metrics import (
        mean_absolute_error,
        mean_squared_error,
        r2_score,
        mean_absolute_percentage_error
    )

    # Flatten arrays if needed
    y_true = y_true.flatten()
    y_pred = y_pred.flatten()

    # Calculate metrics
    metrics = {
        'mae': float(mean_absolute_error(y_true, y_pred)),
        'rmse': float(np.sqrt(mean_squared_error(y_true, y_pred))),
        'mse': float(mean_squared_error(y_true, y_pred)),
        'r2': float(r2_score(y_true, y_pred)),
        'mape': float(mean_absolute_percentage_error(y_true, y_pred) * 100),
    }

    # Additional custom metrics
    metrics.update({
        'max_error': float(np.max(np.abs(y_true - y_pred))),
        'median_error': float(np.median(np.abs(y_true - y_pred))),
        'std_error': float(np.std(y_true - y_pred)),
    })

    logger.info(f"Calculated metrics: {metrics}")

    return metrics


def calculate_regression_metrics(
    y_true: np.ndarray,
    y_pred: np.ndarray,
    confidence_level: float = 0.95
) -> Dict[str, Any]:
    """
    Calculate detailed regression metrics with confidence intervals.

    Args:
        y_true: Ground truth values
        y_pred: Predicted values
        confidence_level: Confidence level for intervals

    Returns:
        Dictionary of detailed metrics
    """
    from scipy import stats

    # Basic metrics
    metrics = calculate_metrics(y_true, y_pred)

    # Calculate residuals
    residuals = y_true.flatten() - y_pred.flatten()

    # Confidence intervals
    n = len(residuals)
    t_value = stats.t.ppf((1 + confidence_level) / 2, n - 1)
    se = stats.sem(residuals)
    ci = t_value * se

    # Add detailed metrics
    metrics.update({
        'residual_mean': float(np.mean(residuals)),
        'residual_std': float(np.std(residuals)),
        'confidence_interval': float(ci),
        'within_10pct': float(np.mean(np.abs(residuals / y_true) < 0.1) * 100),
        'within_20pct': float(np.mean(np.abs(residuals / y_true) < 0.2) * 100),
    })

    return metrics


# ============================================================================
# Model Comparison
# ============================================================================

def compare_models(
    model1_metrics: Dict[str, float],
    model2_metrics: Dict[str, float],
    thresholds: Dict[str, float]
) -> Dict[str, Any]:
    """
    Compare two models based on their metrics.

    Args:
        model1_metrics: Metrics for first model (new/staging)
        model2_metrics: Metrics for second model (production)
        thresholds: Performance thresholds for promotion

    Returns:
        Comparison results with promotion recommendation
    """
    logger.info("Comparing model performance")

    # Calculate improvements
    improvements = {}

    # Lower is better metrics (MAE, RMSE, MAPE)
    for metric in ['mae', 'rmse', 'mape']:
        if metric in model1_metrics and metric in model2_metrics:
            improvement = (model2_metrics[metric] - model1_metrics[metric]) / model2_metrics[metric] * 100
            improvements[f'{metric}_improvement_pct'] = round(improvement, 2)

    # Higher is better metrics (R2)
    if 'r2' in model1_metrics and 'r2' in model2_metrics:
        improvement = (model1_metrics['r2'] - model2_metrics['r2']) / abs(model2_metrics['r2']) * 100
        improvements['r2_improvement_pct'] = round(improvement, 2)

    # Determine if model should be promoted
    should_promote = True
    reasons = []

    # Check MAE improvement
    if improvements.get('mae_improvement_pct', 0) < thresholds.get('mae_improvement', 0) * 100:
        should_promote = False
        reasons.append(
            f"MAE improvement ({improvements.get('mae_improvement_pct', 0):.2f}%) "
            f"does not meet threshold ({thresholds.get('mae_improvement', 0) * 100:.2f}%)"
        )

    # Check RMSE improvement
    if improvements.get('rmse_improvement_pct', 0) < thresholds.get('rmse_improvement', 0) * 100:
        should_promote = False
        reasons.append(
            f"RMSE improvement ({improvements.get('rmse_improvement_pct', 0):.2f}%) "
            f"does not meet threshold ({thresholds.get('rmse_improvement', 0) * 100:.2f}%)"
        )

    # Check minimum R2 score
    if model1_metrics.get('r2', 0) < thresholds.get('min_r2_score', 0.85):
        should_promote = False
        reasons.append(
            f"R2 score ({model1_metrics.get('r2', 0):.4f}) "
            f"does not meet minimum threshold ({thresholds.get('min_r2_score', 0.85):.4f})"
        )

    # Check maximum MAE
    if model1_metrics.get('mae', float('inf')) > thresholds.get('max_mae', 10.0):
        should_promote = False
        reasons.append(
            f"MAE ({model1_metrics.get('mae', 0):.4f}) "
            f"exceeds maximum threshold ({thresholds.get('max_mae', 10.0):.4f})"
        )

    # If model passes all checks, add positive reasons
    if should_promote:
        reasons.append(f"All performance thresholds met")
        reasons.append(f"MAE improved by {improvements.get('mae_improvement_pct', 0):.2f}%")
        reasons.append(f"RMSE improved by {improvements.get('rmse_improvement_pct', 0):.2f}%")

    comparison_results = {
        'should_promote': should_promote,
        'improvements': improvements,
        'reasons': reasons,
        'timestamp': datetime.now().isoformat(),
    }

    logger.info(f"Comparison results: {comparison_results}")

    return comparison_results


# ============================================================================
# Model Deployment
# ============================================================================

def promote_model(
    source_dir: str,
    target_dir: str,
    backup: bool = True,
    update_metadata: bool = True,
    comparison_results: Optional[Dict] = None
) -> Dict[str, Any]:
    """
    Promote a model from staging to production.

    Args:
        source_dir: Source directory (staging)
        target_dir: Target directory (production)
        backup: Whether to backup existing production model
        update_metadata: Whether to update model metadata
        comparison_results: Optional comparison results to include in metadata

    Returns:
        Promotion results
    """
    logger.info(f"Promoting model from {source_dir} to {target_dir}")

    # Ensure directories exist
    os.makedirs(target_dir, exist_ok=True)

    # Backup existing production model
    if backup:
        backup_dir = os.path.join(
            os.path.dirname(target_dir),
            f"backup_{datetime.now().strftime('%Y%m%d_%H%M%S')}"
        )

        if os.path.exists(target_dir) and os.listdir(target_dir):
            logger.info(f"Creating backup in {backup_dir}")
            shutil.copytree(target_dir, backup_dir)

    # Copy model files from staging to production
    model_files = ['model.h5', 'model.keras', 'model.pt', 'model.pkl']

    promoted_files = []

    for file_name in model_files:
        source_path = os.path.join(source_dir, file_name)
        target_path = os.path.join(target_dir, file_name)

        if os.path.exists(source_path):
            shutil.copy2(source_path, target_path)
            promoted_files.append(file_name)
            logger.info(f"Copied {file_name} to production")

    # Update metadata
    if update_metadata:
        metadata = {
            'promoted_at': datetime.now().isoformat(),
            'source_dir': source_dir,
            'promoted_files': promoted_files,
            'backup_created': backup,
        }

        if comparison_results:
            metadata['comparison_results'] = comparison_results

        metadata_path = os.path.join(target_dir, 'promotion_metadata.json')

        with open(metadata_path, 'w') as f:
            json.dump(metadata, f, indent=2)

    promotion_results = {
        'success': True,
        'promoted_files': promoted_files,
        'target_dir': target_dir,
        'timestamp': datetime.now().isoformat(),
    }

    logger.info(f"Model promoted successfully")

    return promotion_results


def backup_previous_model(models_dir: str, **kwargs) -> Dict[str, Any]:
    """
    Create backup of previous model before training new one.

    Args:
        models_dir: Models directory

    Returns:
        Backup information
    """
    logger.info("Backing up previous model")

    staging_dir = os.path.join(models_dir, 'staging')

    if not os.path.exists(staging_dir) or not os.listdir(staging_dir):
        logger.info("No previous model to backup")
        return {'backup_created': False, 'reason': 'No previous model found'}

    # Create backup directory
    backup_dir = os.path.join(
        models_dir,
        'backups',
        f"backup_{datetime.now().strftime('%Y%m%d_%H%M%S')}"
    )

    os.makedirs(backup_dir, exist_ok=True)

    # Copy files
    shutil.copytree(staging_dir, backup_dir, dirs_exist_ok=True)

    backup_info = {
        'backup_created': True,
        'backup_dir': backup_dir,
        'timestamp': datetime.now().isoformat(),
    }

    logger.info(f"Backup created at: {backup_dir}")

    return backup_info


# ============================================================================
# Report Generation
# ============================================================================

def generate_evaluation_report(
    comparison_results: Dict[str, Any],
    output_dir: str
) -> str:
    """
    Generate comprehensive evaluation report.

    Args:
        comparison_results: Model comparison results
        output_dir: Directory to save report

    Returns:
        Path to generated report
    """
    logger.info("Generating evaluation report")

    # Ensure output directory exists
    os.makedirs(output_dir, exist_ok=True)

    # Generate report
    report = {
        'title': 'Model Evaluation Report',
        'generated_at': datetime.now().isoformat(),
        'comparison_results': comparison_results,
    }

    # Save JSON report
    report_path = os.path.join(
        output_dir,
        f"evaluation_report_{datetime.now().strftime('%Y%m%d_%H%M%S')}.json"
    )

    with open(report_path, 'w') as f:
        json.dump(report, f, indent=2)

    # Generate HTML report
    html_report = _generate_html_report(report)
    html_path = report_path.replace('.json', '.html')

    with open(html_path, 'w') as f:
        f.write(html_report)

    logger.info(f"Report generated: {report_path}")

    return report_path


def _generate_html_report(report: Dict[str, Any]) -> str:
    """
    Generate HTML report from report data.
    """
    comparison = report['comparison_results']
    staging_metrics = comparison.get('staging_metrics', {})
    production_metrics = comparison.get('production_metrics', {})
    improvements = comparison.get('improvements', {})

    html = f"""
    <!DOCTYPE html>
    <html>
    <head>
        <title>Model Evaluation Report</title>
        <style>
            body {{ font-family: Arial, sans-serif; margin: 40px; }}
            h1 {{ color: #333; }}
            table {{ border-collapse: collapse; width: 100%; margin: 20px 0; }}
            th, td {{ border: 1px solid #ddd; padding: 12px; text-align: left; }}
            th {{ background-color: #4CAF50; color: white; }}
            .improvement {{ color: green; font-weight: bold; }}
            .degradation {{ color: red; font-weight: bold; }}
        </style>
    </head>
    <body>
        <h1>Model Evaluation Report</h1>
        <p>Generated: {report['generated_at']}</p>

        <h2>Model Comparison</h2>
        <table>
            <tr>
                <th>Metric</th>
                <th>Staging Model</th>
                <th>Production Model</th>
                <th>Improvement</th>
            </tr>
            <tr>
                <td>MAE</td>
                <td>{staging_metrics.get('mae', 'N/A')}</td>
                <td>{production_metrics.get('mae', 'N/A')}</td>
                <td class="{'improvement' if improvements.get('mae_improvement_pct', 0) > 0 else 'degradation'}">
                    {improvements.get('mae_improvement_pct', 0):.2f}%
                </td>
            </tr>
            <tr>
                <td>RMSE</td>
                <td>{staging_metrics.get('rmse', 'N/A')}</td>
                <td>{production_metrics.get('rmse', 'N/A')}</td>
                <td class="{'improvement' if improvements.get('rmse_improvement_pct', 0) > 0 else 'degradation'}">
                    {improvements.get('rmse_improvement_pct', 0):.2f}%
                </td>
            </tr>
            <tr>
                <td>R2 Score</td>
                <td>{staging_metrics.get('r2', 'N/A')}</td>
                <td>{production_metrics.get('r2', 'N/A')}</td>
                <td class="{'improvement' if improvements.get('r2_improvement_pct', 0) > 0 else 'degradation'}">
                    {improvements.get('r2_improvement_pct', 0):.2f}%
                </td>
            </tr>
        </table>

        <h2>Promotion Decision</h2>
        <p><strong>Should Promote:</strong> {comparison.get('should_promote', False)}</p>
        <h3>Reasons:</h3>
        <ul>
            {''.join(f'<li>{reason}</li>' for reason in comparison.get('reasons', []))}
        </ul>
    </body>
    </html>
    """

    return html


# ============================================================================
# Utility Functions
# ============================================================================

def cleanup_temp_files(temp_dirs: List[str], **kwargs) -> None:
    """
    Cleanup temporary files and directories.

    Args:
        temp_dirs: List of temporary directory patterns to clean
    """
    logger.info("Cleaning up temporary files")

    import glob

    for pattern in temp_dirs:
        for path in glob.glob(pattern):
            try:
                if os.path.isdir(path):
                    shutil.rmtree(path)
                else:
                    os.remove(path)
                logger.info(f"Removed: {path}")
            except Exception as e:
                logger.error(f"Error removing {path}: {str(e)}")


def check_disk_space(path: str) -> Dict[str, float]:
    """
    Check available disk space.

    Args:
        path: Path to check disk space

    Returns:
        Disk space information in GB
    """
    stat = os.statvfs(path)

    free_gb = (stat.f_bavail * stat.f_frsize) / (1024 ** 3)
    total_gb = (stat.f_blocks * stat.f_frsize) / (1024 ** 3)
    used_gb = total_gb - free_gb

    return {
        'total_gb': round(total_gb, 2),
        'used_gb': round(used_gb, 2),
        'free_gb': round(free_gb, 2),
        'used_percent': round((used_gb / total_gb) * 100, 2),
    }


def log_pipeline_metrics(
    dag_id: str,
    task_id: str,
    status: str,
    execution_date: Any,
    error: Optional[str] = None,
    duration: Optional[float] = None,
) -> None:
    """
    Log pipeline metrics for monitoring.

    Args:
        dag_id: DAG ID
        task_id: Task ID
        status: Task status (success/failed)
        execution_date: Execution date
        error: Error message if failed
        duration: Task duration in seconds
    """
    metrics = {
        'dag_id': dag_id,
        'task_id': task_id,
        'status': status,
        'execution_date': str(execution_date),
        'timestamp': datetime.now().isoformat(),
    }

    if error:
        metrics['error'] = error

    if duration:
        metrics['duration_seconds'] = duration

    logger.info(f"Pipeline metrics: {json.dumps(metrics)}")

    # In production, send to monitoring system (Prometheus, CloudWatch, etc.)


def send_slack_notification(message: str, webhook_url: Optional[str] = None) -> None:
    """
    Send notification to Slack.

    Args:
        message: Message to send
        webhook_url: Slack webhook URL
    """
    if not webhook_url:
        webhook_url = os.getenv('SLACK_WEBHOOK_URL')

    if not webhook_url:
        logger.warning("Slack webhook URL not configured, skipping notification")
        return

    try:
        import requests

        payload = {'text': message}
        response = requests.post(webhook_url, json=payload)

        if response.status_code == 200:
            logger.info("Slack notification sent successfully")
        else:
            logger.error(f"Failed to send Slack notification: {response.status_code}")

    except Exception as e:
        logger.error(f"Error sending Slack notification: {str(e)}")
