import numpy as np
from sklearn.ensemble import IsolationForest
from typing import List

class IsolationForestDetector:
    """Isolation Forest for anomaly detection in entity positions"""
    
    def __init__(self, contamination: float = 0.1, random_state: int = 42):
        self.contamination = contamination
        self.random_state = random_state
        self.model = None
    
    def fit_predict(self, points: np.ndarray) -> np.ndarray:
        """
        Fit and predict anomaly scores
        points: (n_samples, 2) array of [lat, lon]
        returns: array of anomaly scores (lower = more anomalous)
        """
        if len(points) < 2:
            return np.zeros(len(points))
        
        self.model = IsolationForest(
            contamination=self.contamination,
            random_state=self.random_state
        )
        
        scores = self.model.fit_predict(points)
        return scores
