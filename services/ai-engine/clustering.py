import numpy as np
from sklearn.cluster import DBSCAN
from typing import List
from math import radians, sin, cos, sqrt, atan2

def haversine_distance(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """Calculate distance in km between two points"""
    R = 6371  # Earth radius in km
    
    lat1, lon1, lat2, lon2 = map(radians, [lat1, lon1, lat2, lon2])
    dlat = lat2 - lat1
    dlon = lon2 - lon1
    
    a = sin(dlat/2)**2 + cos(lat1) * cos(lat2) * sin(dlon/2)**2
    c = 2 * atan2(sqrt(a), sqrt(1-a))
    
    return R * c


class DBSCANClusterer:
    """DBSCAN clustering for entity positions using haversine distance"""
    
    def __init__(self, eps_km: float = 50.0, min_samples: int = 3):
        self.eps_km = eps_km
        self.min_samples = min_samples
    
    def fit_predict(self, points: np.ndarray) -> np.ndarray:
        """
        Cluster points using DBSCAN
        points: (n_samples, 2) array of [lat, lon]
        returns: cluster labels (-1 = noise)
        """
        if len(points) < self.min_samples:
            return np.array([-1] * len(points))
        
        # Convert to radians for haversine
        points_rad = np.radians(points)
        
        # eps must be in radians for haversine
        eps_rad = self.eps_km / 6371.0
        
        clusterer = DBSCAN(
            eps=eps_rad,
            min_samples=self.min_samples,
            metric='haversine'
        )
        
        labels = clusterer.fit_predict(points_rad)
        return labels
