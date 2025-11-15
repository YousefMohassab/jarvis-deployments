"""
Example FastAPI Application with Monitoring Integration
This demonstrates how to integrate the monitoring stack with your FastAPI application
"""

from fastapi import FastAPI, HTTPException
from fastapi.responses import JSONResponse
import time
import random
from datetime import datetime
import sys
import os

# Add monitoring exporters to path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..'))

from exporters.fastapi_exporter import (
    PrometheusMiddleware,
    setup_metrics_endpoint,
    track_prediction,
    update_model_metrics,
    update_model_info,
    update_bearing_health,
    WEBSOCKET_CONNECTIONS
)

# Create FastAPI app
app = FastAPI(
    title="RUL Prediction API with Monitoring",
    description="Example API demonstrating monitoring integration",
    version="1.0.0"
)

# Add Prometheus middleware
app.add_middleware(PrometheusMiddleware)

# Setup metrics endpoint
setup_metrics_endpoint(app)

# Initialize model info
update_model_info(
    version="1.0.0",
    algorithm="Random Forest",
    features=50,
    training_date=datetime.now().isoformat()
)

# Simulated model
class MockModel:
    """Mock ML model for demonstration"""

    def __init__(self):
        self.version = "1.0.0"

    def predict(self, features: dict) -> dict:
        """Simulate prediction"""
        # Simulate inference time
        inference_time = random.uniform(0.05, 0.5)
        time.sleep(inference_time)

        # Simulate RUL prediction
        rul = random.uniform(0, 300)

        # Determine confidence
        if rul < 50:
            confidence = random.choice(["high", "medium"])
        elif rul < 150:
            confidence = random.choice(["high", "medium", "low"])
        else:
            confidence = "high"

        # Simulate occasional failures
        if random.random() < 0.02:  # 2% failure rate
            raise Exception("Model prediction failed")

        return {
            "rul": rul,
            "confidence": confidence,
            "inference_time": inference_time,
            "timestamp": datetime.now().isoformat()
        }


# Initialize model
model = MockModel()


@app.get("/")
async def root():
    """Root endpoint"""
    return {
        "service": "RUL Prediction API",
        "status": "healthy",
        "version": "1.0.0",
        "metrics_endpoint": "/metrics"
    }


@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "timestamp": datetime.now().isoformat(),
        "model_version": model.version
    }


@app.post("/predict")
async def predict(data: dict):
    """
    Predict RUL for given bearing data

    Example request:
    {
        "bearing_id": "B001",
        "features": {
            "temperature": 45.2,
            "vibration": 0.15,
            "speed": 1800
        }
    }
    """
    start_time = time.time()

    try:
        # Extract data
        bearing_id = data.get("bearing_id", "unknown")
        features = data.get("features", {})

        # Make prediction
        result = model.predict(features)
        duration = time.time() - start_time

        # Track metrics
        track_prediction(
            model_version=model.version,
            rul_value=result["rul"],
            confidence=result["confidence"],
            duration=duration,
            success=True
        )

        # Update bearing health
        if result["rul"] < 50:
            status = "critical"
        elif result["rul"] < 100:
            status = "degrading"
        else:
            status = "healthy"

        update_bearing_health(bearing_id, status)

        # Return response
        return {
            "bearing_id": bearing_id,
            "rul": round(result["rul"], 2),
            "confidence": result["confidence"],
            "status": status,
            "inference_time": round(duration, 3),
            "timestamp": result["timestamp"]
        }

    except Exception as e:
        duration = time.time() - start_time

        # Track failed prediction
        track_prediction(
            model_version=model.version,
            rul_value=0,
            confidence="low",
            duration=duration,
            success=False,
            error_type=type(e).__name__
        )

        raise HTTPException(status_code=500, detail=str(e))


@app.post("/batch_predict")
async def batch_predict(data: dict):
    """
    Batch prediction for multiple bearings

    Example request:
    {
        "bearings": [
            {"bearing_id": "B001", "features": {...}},
            {"bearing_id": "B002", "features": {...}}
        ]
    }
    """
    bearings = data.get("bearings", [])
    results = []

    for bearing_data in bearings:
        try:
            result = await predict(bearing_data)
            results.append(result)
        except HTTPException as e:
            results.append({
                "bearing_id": bearing_data.get("bearing_id", "unknown"),
                "error": str(e.detail)
            })

    return {
        "total": len(bearings),
        "successful": len([r for r in results if "error" not in r]),
        "failed": len([r for r in results if "error" in r]),
        "results": results
    }


@app.get("/model/info")
async def model_info():
    """Get model information"""
    return {
        "version": model.version,
        "algorithm": "Random Forest",
        "features": 50,
        "accuracy": 0.92,
        "mae": 15.3,
        "rmse": 22.1,
        "r2_score": 0.89
    }


@app.post("/model/update_metrics")
async def update_metrics(metrics: dict):
    """
    Update model performance metrics
    (This would typically be called after model evaluation)

    Example request:
    {
        "accuracy": 0.92,
        "mae": 15.3,
        "rmse": 22.1,
        "r2_score": 0.89,
        "precision": 0.91,
        "recall": 0.93,
        "f1_score": 0.92
    }
    """
    update_model_metrics(
        accuracy=metrics.get("accuracy"),
        mae=metrics.get("mae"),
        rmse=metrics.get("rmse"),
        r2_score=metrics.get("r2_score"),
        precision=metrics.get("precision"),
        recall=metrics.get("recall"),
        f1_score=metrics.get("f1_score")
    )

    return {"message": "Metrics updated successfully"}


@app.get("/simulate_load")
async def simulate_load(requests: int = 100):
    """
    Simulate load for testing monitoring
    Makes multiple predictions to generate metrics
    """
    results = []

    for i in range(requests):
        bearing_id = f"B{i:03d}"
        features = {
            "temperature": random.uniform(30, 60),
            "vibration": random.uniform(0.1, 0.5),
            "speed": random.uniform(1500, 2000)
        }

        try:
            result = await predict({
                "bearing_id": bearing_id,
                "features": features
            })
            results.append(result)
        except Exception as e:
            results.append({"bearing_id": bearing_id, "error": str(e)})

    return {
        "total_requests": requests,
        "successful": len([r for r in results if "error" not in r]),
        "failed": len([r for r in results if "error" in r]),
        "message": f"Generated {requests} predictions for monitoring"
    }


@app.websocket("/ws")
async def websocket_endpoint(websocket):
    """WebSocket endpoint for real-time predictions"""
    await websocket.accept()
    WEBSOCKET_CONNECTIONS.inc()

    try:
        while True:
            data = await websocket.receive_json()
            result = await predict(data)
            await websocket.send_json(result)
    except Exception:
        pass
    finally:
        WEBSOCKET_CONNECTIONS.dec()
        await websocket.close()


# Exception handler
@app.exception_handler(Exception)
async def global_exception_handler(request, exc):
    """Global exception handler"""
    return JSONResponse(
        status_code=500,
        content={
            "error": str(exc),
            "type": type(exc).__name__,
            "timestamp": datetime.now().isoformat()
        }
    )


if __name__ == "__main__":
    import uvicorn

    # Update initial model metrics
    update_model_metrics(
        accuracy=0.92,
        mae=15.3,
        rmse=22.1,
        r2_score=0.89,
        precision=0.91,
        recall=0.93,
        f1_score=0.92
    )

    # Run the application
    uvicorn.run(
        app,
        host="0.0.0.0",
        port=8000,
        log_level="info"
    )
