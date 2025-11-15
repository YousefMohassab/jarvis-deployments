# ============================================================================
# Apache Airflow - Production Dockerfile
# Customized Airflow with Celery executor and custom operators
# ============================================================================

FROM apache/airflow:2.7.3-python3.10

LABEL maintainer="RUL Prediction Team"
LABEL version="2.7.3"
LABEL description="Apache Airflow with custom operators for RUL prediction"

# Switch to root to install system dependencies
USER root

# Install system dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    gcc \
    g++ \
    libpq-dev \
    curl \
    git \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

# Create necessary directories
RUN mkdir -p /opt/airflow/dags \
             /opt/airflow/logs \
             /opt/airflow/plugins \
             /opt/airflow/config \
             /opt/airflow/data \
             /opt/airflow/models && \
    chown -R airflow:root /opt/airflow

# Switch back to airflow user
USER airflow

# Set working directory
WORKDIR /opt/airflow

# Copy requirements file
COPY --chown=airflow:root airflow/requirements.txt /tmp/requirements.txt

# Install Python dependencies
RUN pip install --no-cache-dir --user -r /tmp/requirements.txt

# Copy custom operators and plugins
COPY --chown=airflow:root ./airflow/operators /opt/airflow/plugins/operators
COPY --chown=airflow:root ./airflow/plugins /opt/airflow/plugins

# Copy DAGs
COPY --chown=airflow:root ./airflow/dags /opt/airflow/dags

# Copy configuration files
COPY --chown=airflow:root ./airflow/config/airflow.cfg /opt/airflow/airflow.cfg

# Set environment variables
ENV AIRFLOW_HOME=/opt/airflow \
    AIRFLOW__CORE__DAGS_FOLDER=/opt/airflow/dags \
    AIRFLOW__CORE__PLUGINS_FOLDER=/opt/airflow/plugins \
    AIRFLOW__CORE__EXECUTOR=CeleryExecutor \
    AIRFLOW__DATABASE__SQL_ALCHEMY_CONN=postgresql+psycopg2://airflow:airflow@postgres:5432/airflow \
    AIRFLOW__CELERY__BROKER_URL=redis://redis:6379/0 \
    AIRFLOW__CELERY__RESULT_BACKEND=db+postgresql://airflow:airflow@postgres:5432/airflow \
    AIRFLOW__CORE__LOAD_EXAMPLES=False \
    AIRFLOW__WEBSERVER__EXPOSE_CONFIG=True \
    AIRFLOW__METRICS__STATSD_ON=True \
    AIRFLOW__METRICS__STATSD_HOST=statsd-exporter \
    AIRFLOW__METRICS__STATSD_PORT=9125

# Expose ports
# 8080: Webserver
# 8793: Worker logs
# 5555: Flower (Celery monitoring)
EXPOSE 8080 8793 5555

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=5 \
    CMD airflow jobs check --job-type SchedulerJob --hostname $(hostname) || \
        airflow jobs check --job-type LocalTaskJob --hostname $(hostname) || \
        curl -f http://localhost:8080/health || exit 1

# Default command (will be overridden by docker-compose)
CMD ["airflow", "webserver"]
