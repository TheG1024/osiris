from fastapi import FastAPI, BackgroundTasks
from pydantic import BaseModel
from typing import List, Optional
import numpy as np

from kalman import KalmanFilter
from anomaly import IsolationForestDetector
from clustering import DBSCANClusterer

app = FastAPI(title="Osiris AI Engine", version="0.1.0")

class EntityPosition(BaseModel):
    id: str
    lat: float
    lon: float
    timestamp: int
    altitude: Optional[float] = None

class PredictionRequest(BaseModel):
    positions: List[EntityPosition]
    steps: int = 10
    interval_ms: int = 60000

class AnomalyRequest(BaseModel):
    entities: List[EntityPosition]
    contamination: float = 0.1

class ClusterRequest(BaseModel):
    entities: List[EntityPosition]
    eps_km: float = 50.0
    min_samples: int = 3

@app.get("/health")
async def health():
    return {"status": "healthy", "version": "0.1.0"}

@app.post("/predict/trajectory")
async def predict_trajectory(req: PredictionRequest):
    """Predict future trajectory using Kalman Filter"""
    kf = KalmanFilter()
    positions = [(p.lat, p.lon, p.timestamp) for p in req.positions]
    predictions = kf.predict(positions, steps=req.steps, interval=req.interval_ms)
    
    return {
        "entity_id": req.positions[-1].id if req.positions else None,
        "predictions": [
            {"lat": lat, "lon": lon, "timestamp": ts}
            for lat, lon, ts in predictions
        ]
    }

@app.post("/detect/anomaly")
async def detect_anomaly(req: AnomalyRequest):
    """Detect anomalies using Isolation Forest"""
    detector = IsolationForestDetector(contamination=req.contamination)
    points = np.array([[e.lat, e.lon] for e in req.entities])
    
    scores = detector.fit_predict(points)
    anomalies = [
        {"entity_id": e.id, "score": float(score), "is_anomaly": score < -0.5}
        for e, score in zip(req.entities, scores)
    ]
    
    return {"anomalies": anomalies}

@app.post("/cluster")
async def cluster_entities(req: ClusterRequest):
    """Cluster entities using DBSCAN"""
    clusterer = DBSCANClusterer(eps_km=req.eps_km, min_samples=req.min_samples)
    points = np.array([[e.lat, e.lon] for e in req.entities])
    
    labels = clusterer.fit_predict(points)
    
    clusters = {}
    for entity, label in zip(req.entities, labels):
        if label != -1:
            clusters.setdefault(int(label), []).append(entity.id)
    
    noise = [e.id for e, label in zip(req.entities, labels) if label == -1]
    
    return {"clusters": clusters, "noise": noise}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
