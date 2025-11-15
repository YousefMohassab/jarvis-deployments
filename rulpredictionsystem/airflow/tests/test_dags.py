"""
Unit Tests for Airflow DAGs

This module contains unit tests for validating DAG structure,
dependencies, and task configurations.

Usage:
    pytest tests/test_dags.py -v
"""

import os
import sys
import pytest
from datetime import datetime, timedelta

# Add project paths
AIRFLOW_HOME = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, os.path.join(AIRFLOW_HOME, 'dags'))
sys.path.insert(0, os.path.join(AIRFLOW_HOME, 'operators'))
sys.path.insert(0, os.path.join(AIRFLOW_HOME, 'plugins'))

from airflow.models import DagBag


class TestDAGIntegrity:
    """Test DAG integrity and structure"""

    @pytest.fixture(scope="class")
    def dagbag(self):
        """Load all DAGs"""
        dags_folder = os.path.join(AIRFLOW_HOME, 'dags')
        return DagBag(dag_folder=dags_folder, include_examples=False)

    def test_no_import_errors(self, dagbag):
        """Test that all DAGs import without errors"""
        assert len(dagbag.import_errors) == 0, \
            f"DAG import errors: {dagbag.import_errors}"

    def test_dags_loaded(self, dagbag):
        """Test that expected DAGs are loaded"""
        expected_dags = [
            'rul_training_pipeline',
            'model_evaluation_dag',
        ]

        for dag_id in expected_dags:
            assert dag_id in dagbag.dags, \
                f"DAG '{dag_id}' not found in DagBag"

    def test_dag_tags(self, dagbag):
        """Test that DAGs have appropriate tags"""
        for dag_id, dag in dagbag.dags.items():
            assert len(dag.tags) > 0, \
                f"DAG '{dag_id}' has no tags"

    def test_dag_owners(self, dagbag):
        """Test that DAGs have owners defined"""
        for dag_id, dag in dagbag.dags.items():
            assert dag.default_args.get('owner') is not None, \
                f"DAG '{dag_id}' has no owner defined"

    def test_dag_retries(self, dagbag):
        """Test that DAGs have retry logic configured"""
        for dag_id, dag in dagbag.dags.items():
            retries = dag.default_args.get('retries', 0)
            assert retries > 0, \
                f"DAG '{dag_id}' has no retry logic configured"

    def test_dag_email_on_failure(self, dagbag):
        """Test that DAGs have email alerts on failure"""
        for dag_id, dag in dagbag.dags.items():
            email_on_failure = dag.default_args.get('email_on_failure', False)
            assert email_on_failure is True, \
                f"DAG '{dag_id}' does not have email_on_failure enabled"


class TestRULTrainingPipeline:
    """Test RUL Training Pipeline DAG"""

    @pytest.fixture(scope="class")
    def dag(self):
        """Load RUL Training Pipeline DAG"""
        from rul_training_pipeline import dag
        return dag

    def test_dag_id(self, dag):
        """Test DAG ID"""
        assert dag.dag_id == 'rul_training_pipeline'

    def test_schedule_interval(self, dag):
        """Test schedule interval"""
        assert dag.schedule_interval == '0 2 * * *', \
            "Schedule should be daily at 2 AM"

    def test_max_active_runs(self, dag):
        """Test max active runs"""
        assert dag.max_active_runs == 1, \
            "Only one active run should be allowed"

    def test_catchup(self, dag):
        """Test catchup is disabled"""
        assert dag.catchup is False, \
            "Catchup should be disabled"

    def test_task_count(self, dag):
        """Test expected number of tasks"""
        task_count = len(dag.tasks)
        assert task_count >= 10, \
            f"Expected at least 10 tasks, found {task_count}"

    def test_required_tasks_exist(self, dag):
        """Test that required tasks exist"""
        required_tasks = [
            'check_prerequisites',
            'prepare_training_config',
            'generate_training_report',
            'cleanup_temp_files',
        ]

        task_ids = [task.task_id for task in dag.tasks]

        for required_task in required_tasks:
            assert required_task in task_ids, \
                f"Required task '{required_task}' not found in DAG"

    def test_task_dependencies(self, dag):
        """Test task dependencies are correct"""
        # Get task by ID
        task_dict = {task.task_id: task for task in dag.tasks}

        # Check prerequisites comes first
        prereq_task = task_dict.get('check_prerequisites')
        assert prereq_task is not None

        # Check that it has no upstream dependencies
        assert len(prereq_task.upstream_task_ids) == 0, \
            "Prerequisites task should have no upstream dependencies"

    def test_task_timeout(self, dag):
        """Test tasks have execution timeout"""
        for task in dag.tasks:
            assert task.execution_timeout is not None or \
                   dag.default_args.get('execution_timeout') is not None, \
                   f"Task '{task.task_id}' has no execution timeout"

    def test_sla(self, dag):
        """Test SLA is configured"""
        sla = dag.default_args.get('sla')
        assert sla is not None, "DAG should have SLA configured"
        assert isinstance(sla, timedelta), "SLA should be a timedelta"


class TestModelEvaluationDAG:
    """Test Model Evaluation DAG"""

    @pytest.fixture(scope="class")
    def dag(self):
        """Load Model Evaluation DAG"""
        from model_evaluation_dag import dag
        return dag

    def test_dag_id(self, dag):
        """Test DAG ID"""
        assert dag.dag_id == 'model_evaluation_dag'

    def test_schedule_interval(self, dag):
        """Test schedule interval"""
        assert dag.schedule_interval == '0 4 * * *', \
            "Schedule should be daily at 4 AM"

    def test_branching_logic(self, dag):
        """Test branching operator exists"""
        task_ids = [task.task_id for task in dag.tasks]
        assert 'decide_promotion' in task_ids, \
            "Branching task 'decide_promotion' not found"

    def test_promotion_paths(self, dag):
        """Test promotion decision paths exist"""
        task_ids = [task.task_id for task in dag.tasks]

        promotion_tasks = [
            'promote_model_automatically',
            'request_manual_approval',
            'reject_promotion',
        ]

        for task_id in promotion_tasks:
            assert task_id in task_ids, \
                f"Promotion path task '{task_id}' not found"


class TestCustomOperators:
    """Test custom operators"""

    def test_data_validation_operator_import(self):
        """Test DataValidationOperator can be imported"""
        from custom_operators import DataValidationOperator
        assert DataValidationOperator is not None

    def test_preprocessing_operator_import(self):
        """Test PreprocessingOperator can be imported"""
        from custom_operators import PreprocessingOperator
        assert PreprocessingOperator is not None

    def test_feature_extraction_operator_import(self):
        """Test FeatureExtractionOperator can be imported"""
        from custom_operators import FeatureExtractionOperator
        assert FeatureExtractionOperator is not None

    def test_model_training_operator_import(self):
        """Test ModelTrainingOperator can be imported"""
        from custom_operators import ModelTrainingOperator
        assert ModelTrainingOperator is not None

    def test_model_evaluation_operator_import(self):
        """Test ModelEvaluationOperator can be imported"""
        from custom_operators import ModelEvaluationOperator
        assert ModelEvaluationOperator is not None

    def test_model_deployment_operator_import(self):
        """Test ModelDeploymentOperator can be imported"""
        from custom_operators import ModelDeploymentOperator
        assert ModelDeploymentOperator is not None


class TestUtilityFunctions:
    """Test utility functions"""

    def test_model_utils_import(self):
        """Test model_utils can be imported"""
        from plugins import model_utils
        assert model_utils is not None

    def test_calculate_metrics_function(self):
        """Test calculate_metrics function exists"""
        from plugins.model_utils import calculate_metrics
        assert callable(calculate_metrics)

    def test_compare_models_function(self):
        """Test compare_models function exists"""
        from plugins.model_utils import compare_models
        assert callable(compare_models)

    def test_promote_model_function(self):
        """Test promote_model function exists"""
        from plugins.model_utils import promote_model
        assert callable(promote_model)


class TestDAGConfiguration:
    """Test DAG configuration"""

    @pytest.fixture(scope="class")
    def dagbag(self):
        """Load all DAGs"""
        dags_folder = os.path.join(AIRFLOW_HOME, 'dags')
        return DagBag(dag_folder=dags_folder, include_examples=False)

    def test_dag_default_args(self, dagbag):
        """Test DAGs have proper default args"""
        required_default_args = [
            'owner',
            'start_date',
            'email_on_failure',
            'retries',
        ]

        for dag_id, dag in dagbag.dags.items():
            for arg in required_default_args:
                assert arg in dag.default_args, \
                    f"DAG '{dag_id}' missing default arg '{arg}'"

    def test_dag_start_date(self, dagbag):
        """Test DAGs have valid start dates"""
        for dag_id, dag in dagbag.dags.items():
            start_date = dag.default_args.get('start_date')
            assert start_date is not None, \
                f"DAG '{dag_id}' has no start_date"
            assert isinstance(start_date, datetime), \
                f"DAG '{dag_id}' start_date is not a datetime object"

    def test_dag_email_config(self, dagbag):
        """Test DAGs have email configuration"""
        for dag_id, dag in dagbag.dags.items():
            email = dag.default_args.get('email')
            assert email is not None, \
                f"DAG '{dag_id}' has no email configured"
            assert isinstance(email, (list, str)), \
                f"DAG '{dag_id}' email should be a string or list"


if __name__ == '__main__':
    pytest.main([__file__, '-v'])
