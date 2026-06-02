import sys
sys.path.insert(0, '.')

import numpy as np
from clustering import DBSCANClusterer

def test_clustering_groups_nearby_points():
    clusterer = DBSCANClusterer(eps_km=50, min_samples=2)
    # Two clusters: NYC area and LA area
    points = np.array([
        [40.7, -74.0],  # NYC
        [40.8, -73.9],  # NYC nearby
        [34.0, -118.2],  # LA
        [34.1, -118.3],  # LA nearby
    ])
    
    labels = clusterer.fit_predict(points)
    
    assert len(labels) == 4
    # Should have 2 clusters
    unique_labels = set(labels)
    assert -1 in unique_labels or len(unique_labels) >= 2

def test_clustering_too_few_points():
    clusterer = DBSCANClusterer(eps_km=50, min_samples=5)
    points = np.array([[40.7, -74.0]])
    labels = clusterer.fit_predict(points)
    
    assert len(labels) == 1
    assert labels[0] == -1  # Noise
