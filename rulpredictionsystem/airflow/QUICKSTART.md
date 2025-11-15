# Airflow Quick Start Guide

Get your RUL prediction pipeline up and running in 5 minutes!

## Prerequisites

- Python 3.8+
- 4GB+ RAM
- 10GB+ free disk space

## Quick Start (Docker)

The fastest way to get started:

```bash
# 1. Navigate to airflow directory
cd /path/to/rul-prediction-system/airflow

# 2. Start Airflow with Docker Compose
docker-compose up -d

# 3. Wait for services to be healthy (~1 minute)
docker-compose ps

# 4. Open browser
open http://localhost:8080

# 5. Login with default credentials
# Username: admin
# Password: admin
```

That's it! Your Airflow instance is running.

## Quick Start (Local)

For local development without Docker:

```bash
# 1. Navigate to airflow directory
cd /path/to/rul-prediction-system/airflow

# 2. Run initialization script
./scripts/init_airflow.sh

# 3. Start Airflow services
./start_airflow.sh

# 4. Open browser
open http://localhost:8080

# 5. Login with default credentials
# Username: admin
# Password: admin
```

## First Steps

### 1. Verify DAGs are Loaded

Navigate to the DAGs page in the UI. You should see:

- `rul_training_pipeline` - Main training pipeline
- `model_evaluation_dag` - Model evaluation and promotion

### 2. Enable a DAG

Click the toggle switch next to a DAG name to enable it.

### 3. Trigger a Manual Run

Click the "Trigger DAG" button (play icon) to start a manual run.

### 4. Monitor Execution

Click on the DAG run to see:
- Task execution status
- Task logs
- Gantt chart
- Graph view

## Common Commands

```bash
# List all DAGs
airflow dags list

# Trigger a DAG manually
airflow dags trigger rul_training_pipeline

# Check DAG status
airflow dags state rul_training_pipeline

# View task logs
airflow tasks logs rul_training_pipeline check_prerequisites 2024-01-01

# Pause a DAG
airflow dags pause rul_training_pipeline

# Unpause a DAG
airflow dags unpause rul_training_pipeline

# List DAG runs
airflow dags list-runs -d rul_training_pipeline

# Clear failed tasks (to retry)
airflow tasks clear --yes rul_training_pipeline

# Stop services
./stop_airflow.sh
# or
docker-compose down
```

## Configuration

### Set Airflow Variables

Via CLI:
```bash
airflow variables set training_epochs 100
airflow variables set learning_rate 0.001
```

Via UI:
1. Go to Admin > Variables
2. Click "+" to add new variable
3. Enter key and value
4. Click Save

### Configure Email Notifications

Edit `.env` file:
```bash
AIRFLOW__SMTP__SMTP_HOST=smtp.gmail.com
AIRFLOW__SMTP__SMTP_USER=your-email@gmail.com
AIRFLOW__SMTP__SMTP_PASSWORD=your-app-password
```

Restart Airflow to apply changes.

## Troubleshooting

### DAGs not appearing?

```bash
# Check import errors
airflow dags list-import-errors

# Validate DAG files
./scripts/check_dags.sh

# Check logs
tail -f logs/scheduler/latest/*.log
```

### Tasks stuck in "running"?

```bash
# Clear task state
airflow tasks clear --yes rul_training_pipeline

# Restart scheduler
pkill -f "airflow scheduler"
airflow scheduler
```

### Database issues?

```bash
# Check database connection
airflow db check

# Upgrade database schema
airflow db upgrade
```

## Next Steps

1. **Configure Data Sources**
   - Place raw data in `../data/raw/`
   - Configure data validation rules

2. **Configure Email Alerts**
   - Set up SMTP credentials
   - Configure alert recipients

3. **Review DAG Schedules**
   - Adjust schedules based on your needs
   - Set up dependencies between DAGs

4. **Monitor Performance**
   - Check task durations
   - Optimize resource allocation
   - Set up external monitoring (Prometheus, Grafana)

5. **Production Setup**
   - Switch to PostgreSQL database
   - Configure CeleryExecutor for distributed execution
   - Set up external logging (S3, GCS)
   - Enable authentication and RBAC
   - Configure SSL/TLS

## Resources

- **Full Documentation**: See [README.md](README.md)
- **Airflow Docs**: https://airflow.apache.org/docs/
- **Support**: ml-team@example.com

## Getting Help

If you encounter issues:

1. Check the logs: `logs/scheduler/` and `logs/dag_id/task_id/`
2. Review import errors: Admin > Import Errors in UI
3. Consult the README.md for detailed troubleshooting
4. Contact the ML team

---

**Happy orchestrating!** 🚀
