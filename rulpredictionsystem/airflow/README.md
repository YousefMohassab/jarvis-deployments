# Apache Airflow Pipeline for RUL Prediction System

Production-grade Apache Airflow pipeline for orchestrating the Remaining Useful Life (RUL) prediction model training workflow.

## Table of Contents

- [Overview](#overview)
- [Architecture](#architecture)
- [Prerequisites](#prerequisites)
- [Installation](#installation)
- [Configuration](#configuration)
- [DAGs](#dags)
- [Custom Operators](#custom-operators)
- [Usage](#usage)
- [Monitoring](#monitoring)
- [Troubleshooting](#troubleshooting)
- [Development](#development)
- [Production Deployment](#production-deployment)

## Overview

This Airflow pipeline orchestrates the complete machine learning workflow for RUL prediction:

1. **Data Validation** - Validate raw bearing sensor data
2. **Data Preprocessing** - Clean, normalize, and transform data
3. **Feature Extraction** - Extract time-domain and frequency-domain features
4. **Model Training** - Train CNN-LSTM model for RUL prediction
5. **Model Evaluation** - Evaluate model performance against production baseline
6. **Model Deployment** - Deploy model to production with automated rollback
7. **Monitoring & Alerting** - Track metrics and send notifications

### Key Features

- Automated daily training pipeline
- Comprehensive error handling and retry logic
- Idempotent task execution
- Data lineage tracking via XCom
- Email/Slack notifications for failures and successes
- Model versioning and rollback capabilities
- Automated model promotion based on performance thresholds
- Parallel task execution for improved performance
- SLA monitoring and alerting

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                     Airflow Scheduler                           │
│  (Orchestrates DAGs, triggers tasks based on schedule)          │
└────────────────┬────────────────────────────────────────────────┘
                 │
        ┌────────┴─────────┐
        │                  │
┌───────▼────────┐  ┌──────▼───────┐
│   PostgreSQL   │  │   Webserver  │
│   (Metadata)   │  │   (UI: 8080) │
└────────────────┘  └──────────────┘
        │
┌───────▼────────────────────────────────────────────────────┐
│                    DAG Execution                            │
├─────────────────────────────────────────────────────────────┤
│  1. Check Prerequisites                                     │
│  2. Data Validation  ──────> 3. Data Preprocessing         │
│  4. Feature Extraction ────> 5. Model Training             │
│  6. Model Evaluation  ─────> 7. Model Deployment           │
│  8. Generate Reports  ─────> 9. Cleanup & Notifications    │
└─────────────────────────────────────────────────────────────┘
```

## Prerequisites

### System Requirements

- **OS**: Linux, macOS, or Windows with WSL
- **Python**: 3.8 or higher
- **Memory**: Minimum 4GB RAM (8GB+ recommended)
- **Disk Space**: Minimum 10GB free space
- **CPU**: 2+ cores recommended

### Software Dependencies

- Python 3.8+
- PostgreSQL 12+ (or SQLite for development)
- Redis 6+ (if using CeleryExecutor)
- Docker & Docker Compose (optional, for containerized deployment)

## Installation

### Option 1: Local Installation

```bash
# 1. Navigate to the airflow directory
cd /path/to/rul-prediction-system/airflow

# 2. Run the initialization script
./scripts/init_airflow.sh

# 3. The script will:
#    - Install dependencies from requirements.txt
#    - Initialize the Airflow database
#    - Create an admin user (default: admin/admin)
#    - Set up connections and variables
#    - Validate the installation
```

### Option 2: Docker Compose Installation

```bash
# 1. Navigate to the airflow directory
cd /path/to/rul-prediction-system/airflow

# 2. Set environment variables (optional)
export AIRFLOW_UID=$(id -u)

# 3. Start services
docker-compose up -d

# 4. Check service status
docker-compose ps

# 5. View logs
docker-compose logs -f
```

### Option 3: Manual Installation

```bash
# 1. Set environment variables
export AIRFLOW_HOME=/path/to/rul-prediction-system/airflow
export RUL_PROJECT_ROOT=/path/to/rul-prediction-system

# 2. Install Airflow
pip install apache-airflow==2.7.3

# 3. Install dependencies
pip install -r requirements.txt

# 4. Initialize database
airflow db init

# 5. Create admin user
airflow users create \
    --username admin \
    --password admin \
    --firstname Admin \
    --lastname User \
    --role Admin \
    --email admin@example.com
```

## Configuration

### Airflow Configuration

Edit `config/airflow.cfg` to customize:

- **Executor**: LocalExecutor (default), CeleryExecutor, or KubernetesExecutor
- **Database**: PostgreSQL connection string
- **Parallelism**: Number of concurrent tasks
- **Email**: SMTP settings for notifications
- **Logging**: Log level and output format

### Environment Variables

Create a `.env` file in the airflow directory:

```bash
# Airflow Configuration
AIRFLOW_HOME=/path/to/airflow
RUL_PROJECT_ROOT=/path/to/rul-prediction-system

# Database
AIRFLOW__DATABASE__SQL_ALCHEMY_CONN=postgresql+psycopg2://airflow:airflow@localhost:5432/airflow

# Email Notifications
AIRFLOW__SMTP__SMTP_HOST=smtp.gmail.com
AIRFLOW__SMTP__SMTP_USER=your-email@gmail.com
AIRFLOW__SMTP__SMTP_PASSWORD=your-app-password
AIRFLOW__SMTP__SMTP_PORT=587

# Slack Notifications (optional)
SLACK_WEBHOOK_URL=https://hooks.slack.com/services/YOUR/WEBHOOK/URL
```

### Airflow Variables

Set variables via UI or CLI:

```bash
# Set via CLI
airflow variables set training_epochs 100
airflow variables set learning_rate 0.001
airflow variables set alert_email admin@example.com
airflow variables set success_email team@example.com

# Set via UI
# Navigate to Admin > Variables in the Airflow UI
```

## DAGs

### 1. RUL Training Pipeline (`rul_training_pipeline`)

Main training pipeline that runs daily at 2 AM.

**Schedule**: `0 2 * * *` (Daily at 2 AM)

**Tasks**:
1. Check prerequisites (disk space, data availability)
2. Prepare training configuration
3. Data validation group
   - Validate data quality
   - Validate schema
4. Data preprocessing group
   - Preprocess data (normalization, outlier removal)
   - Verify preprocessing
5. Feature engineering group
   - Extract features (time-domain, frequency-domain)
   - Verify features
6. Model training group
   - Backup previous model
   - Train CNN-LSTM model
   - Validate training
7. Model evaluation group
   - Evaluate model performance
   - Compare with baseline
8. Model deployment group
   - Deploy model to staging
   - Verify deployment
9. Generate training report
10. Cleanup temporary files
11. Send success notification

**SLA**: 8 hours

**Retries**: 2 (with 5-minute delay)

### 2. Model Evaluation DAG (`model_evaluation_dag`)

Compares newly trained models against production models and automatically promotes better-performing models.

**Schedule**: `0 4 * * *` (Daily at 4 AM, after training)

**Tasks**:
1. Check if new model is available
2. Load test data
3. Evaluation group
   - Evaluate staging model
   - Evaluate production model
4. Compare model performance
5. Decide promotion (branching logic)
   - Promote automatically (if significant improvement)
   - Request manual approval (if marginal improvement)
   - Reject promotion (if no improvement)
6. Log evaluation results
7. Send notification

**Performance Thresholds**:
- MAE improvement: 5%
- RMSE improvement: 5%
- Minimum R² score: 0.85
- Maximum MAE: 10.0

## Custom Operators

### DataValidationOperator

Validates raw bearing data before processing.

**Parameters**:
- `raw_data_dir`: Directory containing raw data
- `validation_rules`: Dictionary of validation rules
  - `min_samples`: Minimum number of samples required
  - `max_missing_ratio`: Maximum allowed missing data ratio
  - `required_columns`: List of required column names
  - `check_duplicates`: Whether to check for duplicates

**Example**:
```python
validate_data = DataValidationOperator(
    task_id='validate_data',
    raw_data_dir='/data/raw',
    validation_rules={
        'min_samples': 1000,
        'max_missing_ratio': 0.1,
        'required_columns': ['vibration_x', 'vibration_y', 'temperature'],
        'check_duplicates': True,
    }
)
```

### PreprocessingOperator

Preprocesses raw bearing data.

**Parameters**:
- `raw_data_dir`: Input directory
- `processed_data_dir`: Output directory
- `preprocessing_params`: Dictionary of preprocessing parameters
  - `normalize`: Whether to normalize data
  - `remove_outliers`: Whether to remove outliers
  - `outlier_method`: Method for outlier detection ('iqr', 'zscore')
  - `fill_missing`: Method for filling missing values

**Example**:
```python
preprocess_data = PreprocessingOperator(
    task_id='preprocess_data',
    raw_data_dir='/data/raw',
    processed_data_dir='/data/processed',
    preprocessing_params={
        'normalize': True,
        'remove_outliers': True,
        'outlier_method': 'iqr',
        'fill_missing': 'interpolate',
    }
)
```

### FeatureExtractionOperator

Extracts features from preprocessed data.

**Parameters**:
- `processed_data_dir`: Input directory
- `features_dir`: Output directory
- `feature_params`: Dictionary of feature extraction parameters

### ModelTrainingOperator

Trains the CNN-LSTM model.

**Parameters**:
- `features_dir`: Directory containing features
- `models_dir`: Directory to save models
- `training_config`: Training configuration (epochs, batch size, etc.)

### ModelEvaluationOperator

Evaluates trained model performance.

**Parameters**:
- `models_dir`: Directory containing models
- `features_dir`: Directory containing test features
- `evaluation_metrics`: List of metrics to calculate

### ModelDeploymentOperator

Deploys trained model to production.

**Parameters**:
- `models_dir`: Source directory (staging)
- `production_dir`: Target directory (production)
- `deployment_config`: Deployment configuration

## Usage

### Starting Airflow

**Using Helper Scripts**:
```bash
# Start Airflow (webserver + scheduler)
./start_airflow.sh

# Stop Airflow
./stop_airflow.sh
```

**Manual Start**:
```bash
# Terminal 1: Start webserver
airflow webserver --port 8080

# Terminal 2: Start scheduler
airflow scheduler
```

**Using Docker Compose**:
```bash
# Start all services
docker-compose up -d

# Stop all services
docker-compose down

# View logs
docker-compose logs -f airflow-scheduler
```

### Accessing the UI

Open browser and navigate to: `http://localhost:8080`

**Default credentials**:
- Username: `admin`
- Password: `admin`

### Running DAGs

**Via UI**:
1. Navigate to DAGs page
2. Toggle DAG on/off
3. Click "Trigger DAG" to run manually

**Via CLI**:
```bash
# Trigger DAG manually
airflow dags trigger rul_training_pipeline

# Trigger with specific execution date
airflow dags trigger rul_training_pipeline -e 2024-01-01

# List all DAGs
airflow dags list

# Show DAG details
airflow dags show rul_training_pipeline

# Test a specific task
airflow tasks test rul_training_pipeline check_prerequisites 2024-01-01
```

### Viewing Logs

**Via UI**:
1. Click on a task instance
2. Click "Log" button

**Via CLI**:
```bash
# View task logs
airflow tasks logs rul_training_pipeline check_prerequisites 2024-01-01

# View scheduler logs
tail -f $AIRFLOW_HOME/logs/scheduler/latest/*.log
```

**Via Docker**:
```bash
# View scheduler logs
docker-compose logs -f airflow-scheduler

# View webserver logs
docker-compose logs -f airflow-webserver
```

## Monitoring

### Built-in Monitoring

- **DAG Runs**: Monitor DAG execution status in the UI
- **Task Instance History**: View task execution history and durations
- **Gantt Chart**: Visualize task execution timeline
- **Tree View**: View DAG structure and task dependencies
- **Graph View**: Interactive DAG visualization

### Metrics & Alerting

**Email Notifications**:
- Configured via `email_on_failure`, `email_on_retry`, `email_on_success`
- SMTP settings in `airflow.cfg`

**Slack Notifications**:
- Configure `SLACK_WEBHOOK_URL` environment variable
- Notifications sent on model promotion, failures, etc.

**Custom Metrics**:
- Logged via `log_pipeline_metrics()` utility function
- Can be exported to Prometheus, CloudWatch, etc.

### Health Checks

```bash
# Check Airflow health
airflow db check

# Check scheduler health
airflow jobs check --job-type SchedulerJob

# Check database migrations
airflow db check-migrations
```

## Troubleshooting

### Common Issues

**1. DAGs not appearing in UI**

```bash
# Check DAG parsing errors
airflow dags list-import-errors

# Validate DAG file
python /path/to/dag_file.py

# Check DAG folder path
airflow config get-value core dags_folder
```

**2. Tasks stuck in "running" state**

```bash
# Check for zombie tasks
airflow tasks clear --yes --dag-id rul_training_pipeline

# Restart scheduler
pkill -f "airflow scheduler"
airflow scheduler
```

**3. Database connection errors**

```bash
# Check database connection
airflow db check

# Reset database (WARNING: deletes all data)
airflow db reset
```

**4. Import errors**

```bash
# Check Python path
echo $PYTHONPATH

# Add project to Python path
export PYTHONPATH=/path/to/rul-prediction-system:$PYTHONPATH

# Install missing dependencies
pip install -r requirements.txt
```

**5. Permission errors**

```bash
# Fix ownership
chown -R $USER:$USER $AIRFLOW_HOME

# Fix permissions
chmod -R 755 $AIRFLOW_HOME
```

### Debug Mode

Enable debug logging:

```bash
# In airflow.cfg
logging_level = DEBUG

# Or via environment variable
export AIRFLOW__LOGGING__LOGGING_LEVEL=DEBUG
```

## Development

### Creating Custom Operators

```python
from airflow.models import BaseOperator
from airflow.utils.decorators import apply_defaults

class CustomOperator(BaseOperator):
    @apply_defaults
    def __init__(self, param1, param2, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.param1 = param1
        self.param2 = param2

    def execute(self, context):
        # Implementation
        pass
```

### Testing DAGs

```bash
# Test DAG structure
python -m pytest tests/dags/

# Test task execution
airflow tasks test dag_id task_id execution_date

# Test DAG end-to-end
airflow dags test dag_id execution_date
```

### Best Practices

1. **Idempotency**: Tasks should produce the same result when run multiple times
2. **Error Handling**: Use try-except blocks and raise `AirflowException` on failures
3. **XCom**: Use for small data exchange between tasks
4. **Task Groups**: Group related tasks for better organization
5. **SLAs**: Set realistic SLAs and monitor them
6. **Documentation**: Add docstrings to DAGs and tasks
7. **Testing**: Write unit tests for custom operators
8. **Monitoring**: Log important metrics and events

## Production Deployment

### Checklist

- [ ] Use PostgreSQL instead of SQLite
- [ ] Configure CeleryExecutor or KubernetesExecutor for distributed execution
- [ ] Set up external logging (S3, GCS, or ELK)
- [ ] Configure authentication (LDAP, OAuth)
- [ ] Enable RBAC for access control
- [ ] Set up monitoring (Prometheus, Grafana)
- [ ] Configure alerting (PagerDuty, Slack)
- [ ] Implement backup strategy for database
- [ ] Use secrets backend (AWS Secrets Manager, Vault)
- [ ] Set up SSL/TLS for webserver
- [ ] Configure resource limits (CPU, memory)
- [ ] Implement log rotation
- [ ] Set up CI/CD pipeline for DAG deployment

### Docker Production Deployment

```bash
# Build custom Airflow image
docker build -t rul-airflow:latest .

# Deploy with docker-compose
docker-compose -f docker-compose.prod.yml up -d

# Scale workers
docker-compose -f docker-compose.prod.yml up -d --scale airflow-worker=4
```

### Kubernetes Deployment

```bash
# Install Airflow with Helm
helm repo add apache-airflow https://airflow.apache.org
helm install airflow apache-airflow/airflow --namespace airflow

# Configure values.yaml for production
helm upgrade airflow apache-airflow/airflow -f values.yaml
```

## Resources

- [Apache Airflow Documentation](https://airflow.apache.org/docs/)
- [Airflow Best Practices](https://airflow.apache.org/docs/apache-airflow/stable/best-practices.html)
- [Airflow REST API](https://airflow.apache.org/docs/apache-airflow/stable/stable-rest-api-ref.html)
- [Airflow Slack Community](https://apache-airflow-slack.herokuapp.com/)

## Support

For issues and questions:
- Check the logs: `$AIRFLOW_HOME/logs/`
- Review DAG import errors: Admin > Import Errors
- Consult the documentation above
- Contact the ML team: ml-team@example.com

## License

Copyright 2024 RUL Prediction System
