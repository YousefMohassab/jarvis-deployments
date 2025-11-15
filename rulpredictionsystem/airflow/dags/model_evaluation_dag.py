"""
Model Evaluation and Promotion DAG

This DAG compares newly trained models against production models and
automatically promotes better performing models to production.

Features:
- Load and compare multiple model versions
- Calculate comprehensive performance metrics
- Generate comparison reports
- Automated model promotion with approval gates
- A/B testing support

Author: RUL Prediction System
Version: 1.0.0
"""

import os
import sys
import json
from datetime import datetime, timedelta
from typing import Dict, Any, List

from airflow import DAG
from airflow.operators.python import PythonOperator, BranchPythonOperator
from airflow.operators.bash import BashOperator
from airflow.operators.email import EmailOperator
from airflow.utils.task_group import TaskGroup
from airflow.models import Variable
from airflow.utils.trigger_rule import TriggerRule
from airflow.exceptions import AirflowException
from airflow.sensors.filesystem import FileSensor

# Add custom paths
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..'))

from plugins.model_utils import (
    load_model,
    calculate_metrics,
    compare_models,
    promote_model,
    generate_evaluation_report,
    send_slack_notification
)

# Configuration
PROJECT_ROOT = os.getenv(
    'RUL_PROJECT_ROOT',
    '/home/yousef/workspace/storage/UZ2CcrTd13NrEAm81F1qLWHyAiD2/projects/rul-prediction-system'
)

MODELS_DIR = os.path.join(PROJECT_ROOT, 'models')
PRODUCTION_MODEL_DIR = os.path.join(MODELS_DIR, 'production')
STAGING_MODEL_DIR = os.path.join(MODELS_DIR, 'staging')
EVALUATION_DIR = os.path.join(PROJECT_ROOT, 'airflow', 'logs', 'evaluations')
TEST_DATA_DIR = os.path.join(PROJECT_ROOT, 'data', 'test')

# Email configuration
ALERT_EMAIL = Variable.get('alert_email', default_var='admin@example.com')
APPROVAL_EMAIL = Variable.get('approval_email', default_var='ml-team@example.com')

# Performance thresholds for automatic promotion
PERFORMANCE_THRESHOLDS = {
    'mae_improvement': 0.05,  # 5% improvement required
    'rmse_improvement': 0.05,
    'r2_improvement': 0.02,
    'min_r2_score': 0.85,
    'max_mae': 10.0,
}

# Default arguments
default_args = {
    'owner': 'rul-team',
    'depends_on_past': False,
    'start_date': datetime(2024, 1, 1),
    'email': [ALERT_EMAIL],
    'email_on_failure': True,
    'email_on_retry': False,
    'retries': 1,
    'retry_delay': timedelta(minutes=5),
}


# Task functions
def check_new_model_available(**context) -> bool:
    """
    Check if a new model is available for evaluation.
    """
    print("Checking for new models to evaluate...")

    staging_path = os.path.join(STAGING_MODEL_DIR, 'model.h5')

    if not os.path.exists(staging_path):
        print("No new model found in staging directory")
        return False

    # Check model modification time
    staging_mtime = os.path.getmtime(staging_path)
    staging_time = datetime.fromtimestamp(staging_mtime)

    # Check if model is newer than last evaluation
    last_eval_file = os.path.join(EVALUATION_DIR, 'last_evaluation.json')

    if os.path.exists(last_eval_file):
        with open(last_eval_file, 'r') as f:
            last_eval = json.load(f)
            last_eval_time = datetime.fromisoformat(last_eval['timestamp'])

            if staging_time <= last_eval_time:
                print(f"Model already evaluated at {last_eval_time}")
                return False

    print(f"New model found, modified at {staging_time}")

    # Push model info to XCom
    context['task_instance'].xcom_push(
        key='new_model_info',
        value={
            'path': staging_path,
            'modified_time': staging_time.isoformat(),
            'size_mb': os.path.getsize(staging_path) / (1024 * 1024)
        }
    )

    return True


def load_test_data(**context) -> Dict[str, Any]:
    """
    Load and prepare test data for model evaluation.
    """
    print("Loading test data...")

    import numpy as np
    import pandas as pd

    # Load test data
    test_features_path = os.path.join(TEST_DATA_DIR, 'test_features.npy')
    test_labels_path = os.path.join(TEST_DATA_DIR, 'test_labels.npy')

    if not os.path.exists(test_features_path) or not os.path.exists(test_labels_path):
        raise AirflowException(f"Test data not found in {TEST_DATA_DIR}")

    X_test = np.load(test_features_path)
    y_test = np.load(test_labels_path)

    print(f"Test data loaded: X_test shape={X_test.shape}, y_test shape={y_test.shape}")

    # Save data info to XCom
    test_data_info = {
        'n_samples': len(X_test),
        'n_features': X_test.shape[1] if len(X_test.shape) > 1 else 1,
        'test_features_path': test_features_path,
        'test_labels_path': test_labels_path,
    }

    context['task_instance'].xcom_push(key='test_data_info', value=test_data_info)

    return test_data_info


def evaluate_staging_model(**context) -> Dict[str, Any]:
    """
    Evaluate the staging model on test data.
    """
    print("Evaluating staging model...")

    import numpy as np

    # Pull test data info
    test_data_info = context['task_instance'].xcom_pull(
        task_ids='load_test_data',
        key='test_data_info'
    )

    # Load test data
    X_test = np.load(test_data_info['test_features_path'])
    y_test = np.load(test_data_info['test_labels_path'])

    # Load staging model
    staging_model_path = os.path.join(STAGING_MODEL_DIR, 'model.h5')
    staging_model = load_model(staging_model_path)

    # Make predictions
    print("Making predictions on test data...")
    y_pred = staging_model.predict(X_test)

    # Calculate metrics
    print("Calculating performance metrics...")
    metrics = calculate_metrics(y_test, y_pred)

    # Add additional information
    staging_results = {
        'model_path': staging_model_path,
        'model_name': 'staging_model',
        'metrics': metrics,
        'n_test_samples': len(X_test),
        'evaluation_timestamp': datetime.now().isoformat(),
    }

    print(f"Staging model metrics: {json.dumps(metrics, indent=2)}")

    # Push to XCom
    context['task_instance'].xcom_push(
        key='staging_results',
        value=staging_results
    )

    return staging_results


def evaluate_production_model(**context) -> Dict[str, Any]:
    """
    Evaluate the current production model on test data.
    """
    print("Evaluating production model...")

    import numpy as np

    # Pull test data info
    test_data_info = context['task_instance'].xcom_pull(
        task_ids='load_test_data',
        key='test_data_info'
    )

    # Load test data
    X_test = np.load(test_data_info['test_features_path'])
    y_test = np.load(test_data_info['test_labels_path'])

    # Load production model
    production_model_path = os.path.join(PRODUCTION_MODEL_DIR, 'model.h5')

    if not os.path.exists(production_model_path):
        print("No production model found, using baseline metrics")
        return {
            'model_path': None,
            'model_name': 'baseline',
            'metrics': {
                'mae': float('inf'),
                'rmse': float('inf'),
                'r2': -1.0,
                'mape': float('inf'),
            },
            'evaluation_timestamp': datetime.now().isoformat(),
        }

    production_model = load_model(production_model_path)

    # Make predictions
    print("Making predictions on test data...")
    y_pred = production_model.predict(X_test)

    # Calculate metrics
    print("Calculating performance metrics...")
    metrics = calculate_metrics(y_test, y_pred)

    # Add additional information
    production_results = {
        'model_path': production_model_path,
        'model_name': 'production_model',
        'metrics': metrics,
        'n_test_samples': len(X_test),
        'evaluation_timestamp': datetime.now().isoformat(),
    }

    print(f"Production model metrics: {json.dumps(metrics, indent=2)}")

    # Push to XCom
    context['task_instance'].xcom_push(
        key='production_results',
        value=production_results
    )

    return production_results


def compare_model_performance(**context) -> Dict[str, Any]:
    """
    Compare staging and production model performance.
    """
    print("Comparing model performance...")

    # Pull evaluation results
    staging_results = context['task_instance'].xcom_pull(
        task_ids='evaluation_group.evaluate_staging_model',
        key='staging_results'
    )

    production_results = context['task_instance'].xcom_pull(
        task_ids='evaluation_group.evaluate_production_model',
        key='production_results'
    )

    # Compare models
    comparison = compare_models(
        staging_results['metrics'],
        production_results['metrics'],
        PERFORMANCE_THRESHOLDS
    )

    # Add context
    comparison_results = {
        'staging_metrics': staging_results['metrics'],
        'production_metrics': production_results['metrics'],
        'improvements': comparison['improvements'],
        'should_promote': comparison['should_promote'],
        'promotion_reasons': comparison['reasons'],
        'comparison_timestamp': datetime.now().isoformat(),
    }

    print(f"Comparison results: {json.dumps(comparison_results, indent=2)}")

    # Generate comparison report
    report_path = generate_evaluation_report(
        comparison_results,
        output_dir=EVALUATION_DIR
    )

    comparison_results['report_path'] = report_path

    # Push to XCom
    context['task_instance'].xcom_push(
        key='comparison_results',
        value=comparison_results
    )

    return comparison_results


def decide_promotion(**context) -> str:
    """
    Decide whether to promote the model automatically or require approval.
    """
    print("Deciding on model promotion...")

    # Pull comparison results
    comparison_results = context['task_instance'].xcom_pull(
        task_ids='compare_models',
        key='comparison_results'
    )

    should_promote = comparison_results['should_promote']
    improvements = comparison_results['improvements']

    # Check if significant improvements
    significant_improvement = (
        improvements.get('mae_improvement_pct', 0) > 10 or
        improvements.get('rmse_improvement_pct', 0) > 10
    )

    print(f"Should promote: {should_promote}")
    print(f"Significant improvement: {significant_improvement}")

    if should_promote and significant_improvement:
        print("Model meets criteria for automatic promotion")
        return 'promote_model_automatically'
    elif should_promote:
        print("Model improvements marginal, requiring manual approval")
        return 'request_manual_approval'
    else:
        print("Model does not meet promotion criteria")
        return 'reject_promotion'


def promote_model_automatically(**context) -> Dict[str, Any]:
    """
    Automatically promote staging model to production.
    """
    print("Promoting model to production...")

    # Pull comparison results
    comparison_results = context['task_instance'].xcom_pull(
        task_ids='compare_models',
        key='comparison_results'
    )

    # Promote model
    promotion_result = promote_model(
        source_dir=STAGING_MODEL_DIR,
        target_dir=PRODUCTION_MODEL_DIR,
        backup=True,
        update_metadata=True,
        comparison_results=comparison_results
    )

    print(f"Model promoted successfully: {promotion_result}")

    # Send notification
    send_slack_notification(
        message=f"New model automatically promoted to production!\n"
                f"MAE improvement: {comparison_results['improvements'].get('mae_improvement_pct', 0):.2f}%\n"
                f"RMSE improvement: {comparison_results['improvements'].get('rmse_improvement_pct', 0):.2f}%"
    )

    return promotion_result


def request_manual_approval(**context) -> Dict[str, Any]:
    """
    Request manual approval for model promotion.
    """
    print("Requesting manual approval for model promotion...")

    # Pull comparison results
    comparison_results = context['task_instance'].xcom_pull(
        task_ids='compare_models',
        key='comparison_results'
    )

    # Create approval request
    approval_request = {
        'status': 'pending_approval',
        'requested_at': datetime.now().isoformat(),
        'comparison_results': comparison_results,
        'report_path': comparison_results.get('report_path'),
    }

    # Save approval request
    approval_file = os.path.join(EVALUATION_DIR, 'pending_approval.json')
    with open(approval_file, 'w') as f:
        json.dump(approval_request, f, indent=2)

    print(f"Approval request saved to: {approval_file}")

    # Send notification
    send_slack_notification(
        message=f"Model promotion requires manual approval.\n"
                f"Please review the evaluation report: {comparison_results.get('report_path')}"
    )

    return approval_request


def reject_promotion(**context) -> Dict[str, Any]:
    """
    Reject model promotion and log reasons.
    """
    print("Model promotion rejected...")

    # Pull comparison results
    comparison_results = context['task_instance'].xcom_pull(
        task_ids='compare_models',
        key='comparison_results'
    )

    rejection_info = {
        'status': 'rejected',
        'rejected_at': datetime.now().isoformat(),
        'reasons': [
            reason for reason in comparison_results.get('promotion_reasons', [])
            if 'does not meet' in reason.lower() or 'worse' in reason.lower()
        ],
        'comparison_results': comparison_results,
    }

    print(f"Rejection reasons: {rejection_info['reasons']}")

    # Send notification
    send_slack_notification(
        message=f"Model promotion rejected.\n"
                f"New model does not meet performance thresholds."
    )

    return rejection_info


def log_evaluation_results(**context) -> None:
    """
    Log evaluation results for tracking and monitoring.
    """
    print("Logging evaluation results...")

    # Pull all results
    comparison_results = context['task_instance'].xcom_pull(
        task_ids='compare_models',
        key='comparison_results'
    )

    # Save to evaluation history
    history_file = os.path.join(EVALUATION_DIR, 'evaluation_history.jsonl')

    evaluation_record = {
        'execution_date': str(context['execution_date']),
        'dag_run_id': context['run_id'],
        'comparison_results': comparison_results,
        'timestamp': datetime.now().isoformat(),
    }

    with open(history_file, 'a') as f:
        f.write(json.dumps(evaluation_record) + '\n')

    # Update last evaluation timestamp
    last_eval_file = os.path.join(EVALUATION_DIR, 'last_evaluation.json')
    with open(last_eval_file, 'w') as f:
        json.dump({'timestamp': datetime.now().isoformat()}, f)

    print(f"Evaluation results logged to: {history_file}")


# Create the DAG
dag = DAG(
    'model_evaluation_dag',
    default_args=default_args,
    description='Model evaluation and promotion pipeline',
    schedule_interval='0 4 * * *',  # Daily at 4 AM (after training)
    catchup=False,
    max_active_runs=1,
    tags=['rul', 'evaluation', 'ml', 'deployment'],
)

with dag:

    # Task 1: Check if new model is available
    task_check_model = PythonOperator(
        task_id='check_new_model',
        python_callable=check_new_model_available,
        provide_context=True,
    )

    # Task 2: Load test data
    task_load_test_data = PythonOperator(
        task_id='load_test_data',
        python_callable=load_test_data,
        provide_context=True,
    )

    # Task Group 3: Model Evaluation
    with TaskGroup(group_id='evaluation_group') as evaluation_group:

        evaluate_staging = PythonOperator(
            task_id='evaluate_staging_model',
            python_callable=evaluate_staging_model,
            provide_context=True,
        )

        evaluate_production = PythonOperator(
            task_id='evaluate_production_model',
            python_callable=evaluate_production_model,
            provide_context=True,
        )

        [evaluate_staging, evaluate_production]

    # Task 4: Compare models
    task_compare_models = PythonOperator(
        task_id='compare_models',
        python_callable=compare_model_performance,
        provide_context=True,
    )

    # Task 5: Decide on promotion
    task_decide_promotion = BranchPythonOperator(
        task_id='decide_promotion',
        python_callable=decide_promotion,
        provide_context=True,
    )

    # Task 6a: Automatic promotion
    task_promote_auto = PythonOperator(
        task_id='promote_model_automatically',
        python_callable=promote_model_automatically,
        provide_context=True,
    )

    # Task 6b: Manual approval
    task_request_approval = PythonOperator(
        task_id='request_manual_approval',
        python_callable=request_manual_approval,
        provide_context=True,
    )

    # Task 6c: Reject promotion
    task_reject_promotion = PythonOperator(
        task_id='reject_promotion',
        python_callable=reject_promotion,
        provide_context=True,
    )

    # Task 7: Log results
    task_log_results = PythonOperator(
        task_id='log_evaluation_results',
        python_callable=log_evaluation_results,
        provide_context=True,
        trigger_rule=TriggerRule.ALL_DONE,
    )

    # Task 8: Send notification
    task_send_notification = EmailOperator(
        task_id='send_notification',
        to=[ALERT_EMAIL],
        subject='Model Evaluation Complete - {{ ds }}',
        html_content="""
        <h3>Model Evaluation Results</h3>
        <p>Execution Date: {{ ds }}</p>
        <p>Check the evaluation report for details.</p>
        """,
        trigger_rule=TriggerRule.ALL_DONE,
    )

    # Define task dependencies
    task_check_model >> task_load_test_data
    task_load_test_data >> evaluation_group
    evaluation_group >> task_compare_models
    task_compare_models >> task_decide_promotion
    task_decide_promotion >> [task_promote_auto, task_request_approval, task_reject_promotion]
    [task_promote_auto, task_request_approval, task_reject_promotion] >> task_log_results
    task_log_results >> task_send_notification


if __name__ == '__main__':
    print("Model Evaluation DAG")
    print(f"Project Root: {PROJECT_ROOT}")
    print(f"DAG ID: model_evaluation_dag")
    dag.test()
