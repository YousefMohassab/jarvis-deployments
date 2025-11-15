"""
Airflow Plugins Package

This package contains utility functions and plugins for the RUL prediction pipeline.
"""

from .model_utils import (
    load_model,
    save_model,
    calculate_metrics,
    compare_models,
    promote_model,
    backup_previous_model,
    generate_evaluation_report,
    cleanup_temp_files,
    check_disk_space,
    log_pipeline_metrics,
    send_slack_notification,
)

__all__ = [
    'load_model',
    'save_model',
    'calculate_metrics',
    'compare_models',
    'promote_model',
    'backup_previous_model',
    'generate_evaluation_report',
    'cleanup_temp_files',
    'check_disk_space',
    'log_pipeline_metrics',
    'send_slack_notification',
]

__version__ = '1.0.0'
