import numpy as np
from typing import List, Tuple

class KalmanFilter:
    """
    Kalman Filter for entity trajectory prediction
    State: [lat, lon, lat_velocity, lon_velocity]
    Measurement: [lat, lon]
    """
    
    def __init__(self, process_noise: float = 0.01, measurement_noise: float = 0.1):
        self.process_noise = process_noise
        self.measurement_noise = measurement_noise
        self.state = None
        self.covariance = None
    
    def predict(self, 
                positions: List[Tuple[float, float, int]], 
                steps: int = 10, 
                interval: int = 60000) -> List[Tuple[float, float, int]]:
        """
        Predict future positions
        positions: List of (lat, lon, timestamp_ms)
        steps: Number of prediction steps
        interval: Time interval between predictions in ms
        """
        if len(positions) < 2:
            return []
        
        # Initialize state from first positions
        lat0, lon0, t0 = positions[0]
        lat1, lon1, t1 = positions[-1]
        
        dt = (t1 - t0) / 1000.0  # seconds
        if dt == 0:
            dt = 1.0
        
        # State: [lat, lon, lat_vel, lon_vel]
        lat_vel = (lat1 - lat0) / dt
        lon_vel = (lon1 - lon0) / dt
        
        state = np.array([lat1, lon1, lat_vel, lon_vel])
        
        # State transition matrix
        F = np.array([
            [1, 0, dt, 0],
            [0, 1, 0, dt],
            [0, 0, 1, 0],
            [0, 0, 0, 1]
        ])
        
        # Measurement matrix
        H = np.array([
            [1, 0, 0, 0],
            [0, 1, 0, 0]
        ])
        
        # Process noise covariance
        Q = np.eye(4) * self.process_noise
        
        # Measurement noise covariance
        R = np.eye(2) * self.measurement_noise
        
        # Covariance
        P = np.eye(4)
        
        predictions = []
        last_timestamp = positions[-1][2]
        
        for i in range(steps):
            # Predict step
            state = F @ state
            P = F @ P @ F.T + Q
            
            # Extract predicted position
            pred_lat, pred_lon = state[0], state[1]
            pred_timestamp = last_timestamp + (i + 1) * interval
            
            predictions.append((pred_lat, pred_lon, pred_timestamp))
        
        return predictions
