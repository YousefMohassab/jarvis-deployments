# ============================================================================
# RUL Prediction Training - Production Dockerfile
# GPU-enabled container for model training
# ============================================================================

# ============================================================================
# Stage 1: Builder
# ============================================================================
FROM nvidia/cuda:12.2.0-cudnn8-devel-ubuntu22.04 AS builder

LABEL maintainer="RUL Prediction Team"
LABEL stage="builder"

# Set environment variables
ENV DEBIAN_FRONTEND=noninteractive \
    PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1

# Install Python and build dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    python3.10 \
    python3.10-dev \
    python3-pip \
    python3.10-venv \
    gcc \
    g++ \
    make \
    git \
    wget \
    && rm -rf /var/lib/apt/lists/*

# Create virtual environment
RUN python3.10 -m venv /opt/venv
ENV PATH="/opt/venv/bin:$PATH"

# Upgrade pip
RUN pip install --upgrade pip setuptools wheel

# Copy and install requirements
COPY requirements-training.txt /tmp/requirements-training.txt
RUN pip install --no-cache-dir -r /tmp/requirements-training.txt

# ============================================================================
# Stage 2: Runtime with GPU support
# ============================================================================
FROM nvidia/cuda:12.2.0-cudnn8-runtime-ubuntu22.04 AS runtime

LABEL maintainer="RUL Prediction Team"
LABEL version="1.0.0"
LABEL description="GPU-enabled model training container"

# Set environment variables
ENV DEBIAN_FRONTEND=noninteractive \
    PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1 \
    PATH="/opt/venv/bin:$PATH" \
    APP_HOME=/app \
    APP_USER=mluser \
    APP_UID=1000 \
    APP_GID=1000 \
    CUDA_VISIBLE_DEVICES=0

# Install runtime dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    python3.10 \
    python3-distutils \
    libgomp1 \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Copy virtual environment from builder
COPY --from=builder /opt/venv /opt/venv

# Create non-root user
RUN groupadd -g ${APP_GID} ${APP_USER} && \
    useradd -u ${APP_UID} -g ${APP_GID} -s /bin/bash -m ${APP_USER}

# Create directories
RUN mkdir -p ${APP_HOME}/scripts \
             ${APP_HOME}/data \
             ${APP_HOME}/models \
             ${APP_HOME}/logs \
             ${APP_HOME}/checkpoints \
             ${APP_HOME}/tensorboard && \
    chown -R ${APP_USER}:${APP_USER} ${APP_HOME}

# Set working directory
WORKDIR ${APP_HOME}

# Copy training scripts
COPY --chown=${APP_USER}:${APP_USER} ./training/scripts ${APP_HOME}/scripts
COPY --chown=${APP_USER}:${APP_USER} ./training/config ${APP_HOME}/config

# Switch to non-root user
USER ${APP_USER}

# Expose TensorBoard port
EXPOSE 6006

# Health check
HEALTHCHECK --interval=60s --timeout=10s --start-period=60s --retries=3 \
    CMD python3 -c "import tensorflow as tf; print(tf.__version__)" || exit 1

# Default command
CMD ["python3", "scripts/train.py"]
