import sys
sys.path.insert(0, '.')

from kalman import KalmanFilter

def test_kalman_predicts_trajectory():
    kf = KalmanFilter()
    positions = [
        (0.0, 0.0, 0),
        (0.1, 0.1, 60000),
        (0.2, 0.2, 120000),
    ]
    predictions = kf.predict(positions, steps=5, interval=60000)
    
    assert len(predictions) == 5
    assert predictions[0][0] > 0.2  # Should continue trajectory
    assert predictions[0][1] > 0.2

def test_kalman_empty_positions():
    kf = KalmanFilter()
    predictions = kf.predict([], steps=5)
    assert predictions == []

def test_kalman_single_position():
    kf = KalmanFilter()
    positions = [(0.0, 0.0, 0)]
    predictions = kf.predict(positions, steps=5)
    assert predictions == []
