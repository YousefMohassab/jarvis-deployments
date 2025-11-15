"""
FastAPI Metrics Exporter
Instruments FastAPI application with Prometheus metrics
"""

from prometheus_client import Counter, Histogram, Gauge, Info
from prometheus_client import make_asgi_app, generate_latest, CONTENT_TYPE_LATEST
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request
from starlette.responses import Response
import time
from typing import Callable
import logging

logger = logging.getLogger(__name__)

# Request metrics
REQUEST_COUNT = Counter(
    'fastapi_requests_total',
    'Total number of requests',
    ['method', 'endpoint', 'status']
)

REQUEST_DURATION = Histogram(
    'fastapi_request_duration_seconds',
    'Request duration in seconds',
    ['method', 'endpoint'],
    buckets=(0.01, 0.025, 0.05, 0.075, 0.1, 0.25, 0.5, 0.75, 1.0, 2.5, 5.0, 7.5, 10.0)
)

REQUEST_IN_PROGRESS = Gauge(
    'fastapi_requests_in_progress',
    'Number of requests in progress',
    ['method', 'endpoint']
)

REQUEST_SIZE = Histogram(
    'fastapi_request_size_bytes',
    'Request size in bytes',
    ['method', 'endpoint'],
    buckets=(100, 1000, 10000, 100000, 1000000, 10000000)
)

RESPONSE_SIZE = Histogram(
    'fastapi_response_size_bytes',
    'Response size in bytes',
    ['method', 'endpoint'],
    buckets=(100, 1000, 10000, 100000, 1000000, 10000000)
)

# Connection metrics
ACTIVE_CONNECTIONS = Gauge(
    'fastapi_active_connections',
    'Number of active connections'
)

WEBSOCKET_CONNECTIONS = Gauge(
    'fastapi_websocket_connections',
    'Number of active WebSocket connections'
)

# Rate limiting metrics
RATE_LIMIT_EXCEEDED = Counter(
    'fastapi_rate_limit_exceeded_total',
    'Total number of rate limit exceeded errors',
    ['endpoint']
)

# ML Prediction metrics
PREDICTION_COUNT = Counter(
    'model_predictions_total',
    'Total number of predictions',
    ['model_version', 'rul_category', 'confidence']
)

PREDICTION_DURATION = Histogram(
    'model_inference_duration_seconds',
    'Model inference duration in seconds',
    ['model_version'],
    buckets=(0.01, 0.05, 0.1, 0.25, 0.5, 1.0, 2.0, 5.0)
)

PREDICTION_FAILED = Counter(
    'model_predictions_failed_total',
    'Total number of failed predictions',
    ['model_version', 'error_type']
)

# Model performance metrics
MODEL_ACCURACY = Gauge(
    'model_prediction_accuracy',
    'Model prediction accuracy'
)

MODEL_MAE = Gauge(
    'model_mae',
    'Model Mean Absolute Error'
)

MODEL_RMSE = Gauge(
    'model_rmse',
    'Model Root Mean Squared Error'
)

MODEL_R2 = Gauge(
    'model_r2_score',
    'Model R² Score'
)

MODEL_PRECISION = Gauge(
    'model_precision',
    'Model Precision'
)

MODEL_RECALL = Gauge(
    'model_recall',
    'Model Recall'
)

MODEL_F1 = Gauge(
    'model_f1_score',
    'Model F1 Score'
)

# Model info
MODEL_INFO = Info(
    'model_info',
    'Information about the ML model'
)

MODEL_LAST_TRAINING = Gauge(
    'model_last_training_timestamp',
    'Timestamp of last model training'
)

# Bearing health metrics
BEARING_HEALTH_STATUS = Gauge(
    'bearing_health_status',
    'Bearing health status',
    ['bearing_id', 'status']
)

# Data drift metrics
DATA_DRIFT_SCORE = Gauge(
    'model_data_drift_score',
    'Data drift score'
)

CONCEPT_DRIFT_SCORE = Gauge(
    'model_concept_drift_score',
    'Concept drift score'
)


class PrometheusMiddleware(BaseHTTPMiddleware):
    """Middleware to collect metrics for each request"""

    async def dispatch(self, request: Request, call_next: Callable) -> Response:
        # Skip metrics endpoint
        if request.url.path == "/metrics":
            return await call_next(request)

        method = request.method
        path = request.url.path

        # Extract endpoint pattern (remove IDs)
        endpoint = self._extract_endpoint(path)

        # Track active connections
        ACTIVE_CONNECTIONS.inc()

        # Track requests in progress
        REQUEST_IN_PROGRESS.labels(method=method, endpoint=endpoint).inc()

        # Track request size
        if "content-length" in request.headers:
            request_size = int(request.headers["content-length"])
            REQUEST_SIZE.labels(method=method, endpoint=endpoint).observe(request_size)

        start_time = time.time()

        try:
            response = await call_next(request)

            # Calculate duration
            duration = time.time() - start_time

            # Record metrics
            REQUEST_COUNT.labels(
                method=method,
                endpoint=endpoint,
                status=response.status_code
            ).inc()

            REQUEST_DURATION.labels(
                method=method,
                endpoint=endpoint
            ).observe(duration)

            # Track response size
            if "content-length" in response.headers:
                response_size = int(response.headers["content-length"])
                RESPONSE_SIZE.labels(method=method, endpoint=endpoint).observe(response_size)

            return response

        except Exception as e:
            # Record error
            REQUEST_COUNT.labels(
                method=method,
                endpoint=endpoint,
                status=500
            ).inc()

            logger.error(f"Error processing request: {e}")
            raise

        finally:
            # Cleanup
            REQUEST_IN_PROGRESS.labels(method=method, endpoint=endpoint).dec()
            ACTIVE_CONNECTIONS.dec()

    def _extract_endpoint(self, path: str) -> str:
        """Extract endpoint pattern from path"""
        # Remove UUID patterns
        import re
        path = re.sub(r'/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}', '/{id}', path)
        # Remove numeric IDs
        path = re.sub(r'/\d+', '/{id}', path)
        return path


def track_prediction(
    model_version: str,
    rul_value: float,
    confidence: str,
    duration: float,
    success: bool = True,
    error_type: str = None
):
    """Track ML prediction metrics"""

    # Categorize RUL
    if rul_value < 50:
        rul_category = "critical"
    elif rul_value < 100:
        rul_category = "warning"
    else:
        rul_category = "normal"

    if success:
        PREDICTION_COUNT.labels(
            model_version=model_version,
            rul_category=rul_category,
            confidence=confidence
        ).inc()

        PREDICTION_DURATION.labels(
            model_version=model_version
        ).observe(duration)
    else:
        PREDICTION_FAILED.labels(
            model_version=model_version,
            error_type=error_type or "unknown"
        ).inc()


def update_model_metrics(
    accuracy: float = None,
    mae: float = None,
    rmse: float = None,
    r2_score: float = None,
    precision: float = None,
    recall: float = None,
    f1_score: float = None
):
    """Update model performance metrics"""
    if accuracy is not None:
        MODEL_ACCURACY.set(accuracy)
    if mae is not None:
        MODEL_MAE.set(mae)
    if rmse is not None:
        MODEL_RMSE.set(rmse)
    if r2_score is not None:
        MODEL_R2.set(r2_score)
    if precision is not None:
        MODEL_PRECISION.set(precision)
    if recall is not None:
        MODEL_RECALL.set(recall)
    if f1_score is not None:
        MODEL_F1.set(f1_score)


def update_model_info(
    version: str,
    algorithm: str,
    features: int,
    training_date: str
):
    """Update model information"""
    MODEL_INFO.info({
        'version': version,
        'algorithm': algorithm,
        'features': str(features),
        'training_date': training_date
    })


def update_bearing_health(bearing_id: str, status: str, value: float = 1.0):
    """Update bearing health status"""
    BEARING_HEALTH_STATUS.labels(
        bearing_id=bearing_id,
        status=status
    ).set(value)


def update_drift_scores(data_drift: float = None, concept_drift: float = None):
    """Update drift detection scores"""
    if data_drift is not None:
        DATA_DRIFT_SCORE.set(data_drift)
    if concept_drift is not None:
        CONCEPT_DRIFT_SCORE.set(concept_drift)


def setup_metrics_endpoint(app):
    """Setup metrics endpoint for FastAPI app"""
    from starlette.responses import Response

    @app.get("/metrics")
    async def metrics():
        """Expose Prometheus metrics"""
        return Response(
            content=generate_latest(),
            media_type=CONTENT_TYPE_LATEST
        )

    return app


# Example usage in FastAPI app:
"""
from fastapi import FastAPI
from monitoring.exporters.fastapi_exporter import (
    PrometheusMiddleware,
    setup_metrics_endpoint,
    track_prediction,
    update_model_metrics
)

app = FastAPI()

# Add Prometheus middleware
app.add_middleware(PrometheusMiddleware)

# Setup metrics endpoint
setup_metrics_endpoint(app)

@app.post("/predict")
async def predict(data: dict):
    start_time = time.time()
    try:
        # Your prediction logic
        result = model.predict(data)
        duration = time.time() - start_time

        track_prediction(
            model_version="1.0.0",
            rul_value=result['rul'],
            confidence=result['confidence'],
            duration=duration,
            success=True
        )

        return result
    except Exception as e:
        duration = time.time() - start_time
        track_prediction(
            model_version="1.0.0",
            rul_value=0,
            confidence="low",
            duration=duration,
            success=False,
            error_type=str(type(e).__name__)
        )
        raise
"""
