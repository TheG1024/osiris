import sys
sys.path.insert(0, '.')

import numpy as np
from anomaly import IsolationForestDetector

def test_anomaly_detector_runs():
    detector = IsolationForestDetector(contamination=0.1)
    points = np.array([[40.7, -74.0], [41.0, -75.0], [50.0, -100.0]])
    scores = detector.fit_predict(points)
    
    assert len(scores) == 3
    assert all(isinstance(s, (int, np.integer)) for s in scores)

def test_anomaly_empty():
    detector = IsolationForestDetector()
    points = np.array([])
    scores = detector.fit_predict(points)
    
    assert len(scores) == 0
