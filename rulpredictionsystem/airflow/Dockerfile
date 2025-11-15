# ====================================================================================================
# Custom Airflow Docker Image for RUL Prediction System
# ====================================================================================================
#
# This Dockerfile creates a custom Airflow image with all required dependencies
# for the RUL prediction pipeline.
#
# Build:
#   docker build -t rul-airflow:latest .
#
# Run:
#   docker-compose up -d
#
# ====================================================================================================

FROM apache/airflow:2.7.3-python3.10

USER root

# ====================================================================================================
# System Dependencies
# ====================================================================================================

RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    libpq-dev \
    libgomp1 \
    libsndfile1 \
    ffmpeg \
    git \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

# ====================================================================================================
# Python Dependencies
# ====================================================================================================

USER airflow

# Copy requirements file
COPY requirements.txt /tmp/requirements.txt

# Install Python packages
RUN pip install --no-cache-dir --upgrade pip && \
    pip install --no-cache-dir -r /tmp/requirements.txt

# ====================================================================================================
# Copy Project Files
# ====================================================================================================

# Copy DAGs
COPY --chown=airflow:root dags/ ${AIRFLOW_HOME}/dags/

# Copy custom operators
COPY --chown=airflow:root operators/ ${AIRFLOW_HOME}/operators/

# Copy plugins
COPY --chown=airflow:root plugins/ ${AIRFLOW_HOME}/plugins/

# Copy configuration
COPY --chown=airflow:root config/ ${AIRFLOW_HOME}/config/

# ====================================================================================================
# Environment Variables
# ====================================================================================================

ENV PYTHONPATH="${AIRFLOW_HOME}/dags:${AIRFLOW_HOME}/operators:${AIRFLOW_HOME}/plugins:${PYTHONPATH}"
ENV RUL_PROJECT_ROOT="/opt/airflow/rul-prediction-system"

# ====================================================================================================
# Health Check
# ====================================================================================================

HEALTHCHECK --interval=30s --timeout=10s --start-period=30s --retries=3 \
    CMD airflow jobs check --job-type SchedulerJob --hostname "$${HOSTNAME}" || exit 1

# ====================================================================================================
# Labels
# ====================================================================================================

LABEL maintainer="RUL Prediction Team <ml-team@example.com>"
LABEL version="1.0.0"
LABEL description="Custom Airflow image for RUL prediction pipeline"

USER airflow

WORKDIR ${AIRFLOW_HOME}
