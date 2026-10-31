# smartfix/AI_BACKEND/ml_v3/drift_monitor.py
"""
Model Drift Detection and Monitoring
Detects when model performance degrades and triggers retraining
"""

import numpy as np
import pandas as pd
from typing import Dict, List, Any, Optional
from pathlib import Path
from datetime import datetime, timedelta
import json
from collections import deque

try:
    from scipy import stats
    SCIPY_AVAILABLE = True
except ImportError:
    SCIPY_AVAILABLE = False


class DriftMonitor:
    """
    Monitors model performance and detects drift
    
    Methods:
    1. Rolling MAPE tracking
    2. Statistical drift detection (Page-Hinkley test)
    3. Automatic retraining triggers
    """
    
    def __init__(self, model_dir: Path, window_size: int = 30):
        self.model_dir = model_dir
        self.model_dir.mkdir(parents=True, exist_ok=True)
        self.drift_file = self.model_dir / 'drift_history.json'
        
        self.window_size = window_size
        self.error_history = deque(maxlen=window_size)
        self.drift_history = []
        
        # Drift thresholds
        self.mape_threshold = 25.0  # Alert if MAPE > 25%
        self.degradation_threshold = 1.5  # Alert if MAPE increases by 50%
        
        # Page-Hinkley test parameters
        self.ph_lambda = 0.5  # Detection threshold
        self.ph_delta = 0.005  # Minimum amplitude of change
        self.ph_sum = 0
        self.ph_min = 0
        
        self.load_history()
    
    def record_prediction_error(
        self,
        product_id: int,
        predicted: float,
        actual: float,
        timestamp: datetime
    ):
        """
        Record prediction error for drift monitoring
        """
        error = abs(actual - predicted)
        mape = (error / (actual + 1)) * 100
        
        self.error_history.append({
            'product_id': product_id,
            'predicted': predicted,
            'actual': actual,
            'error': error,
            'mape': mape,
            'timestamp': timestamp.isoformat()
        })
        
        # Update Page-Hinkley statistic
        self._update_page_hinkley(mape)
    
    def _update_page_hinkley(self, value: float):
        """
        Update Page-Hinkley test statistic
        
        Detects changes in the mean of a sequence
        """
        # Normalize value (subtract expected mean)
        normalized = value - 20.0  # Assume baseline MAPE of 20%
        
        # Update cumulative sum
        self.ph_sum += normalized - self.ph_delta
        
        # Update minimum
        if self.ph_sum < self.ph_min:
            self.ph_min = self.ph_sum
    
    def detect_drift(self) -> Dict[str, Any]:
        """
        Detect model drift using multiple methods
        
        Returns drift status and recommendations
        """
        if len(self.error_history) < 10:
            return {
                'drift_detected': False,
                'reason': 'insufficient_data',
                'samples': len(self.error_history)
            }
        
        # Calculate rolling MAPE
        recent_mapes = [e['mape'] for e in self.error_history]
        rolling_mape = np.mean(recent_mapes)
        rolling_std = np.std(recent_mapes)
        
        # Method 1: Absolute threshold
        absolute_drift = rolling_mape > self.mape_threshold
        
        # Method 2: Degradation detection
        if len(self.error_history) >= self.window_size:
            first_half = recent_mapes[:self.window_size // 2]
            second_half = recent_mapes[self.window_size // 2:]
            
            first_mape = np.mean(first_half)
            second_mape = np.mean(second_half)
            
            degradation_ratio = second_mape / (first_mape + 1)
            degradation_drift = degradation_ratio > self.degradation_threshold
        else:
            degradation_drift = False
            degradation_ratio = 1.0
        
        # Method 3: Page-Hinkley test
        ph_drift = (self.ph_sum - self.ph_min) > self.ph_lambda
        
        # Overall drift decision
        drift_detected = absolute_drift or degradation_drift or ph_drift
        
        # Determine severity
        if rolling_mape > 30:
            severity = 'critical'
        elif rolling_mape > 25:
            severity = 'high'
        elif degradation_drift:
            severity = 'moderate'
        else:
            severity = 'low'
        
        result = {
            'drift_detected': drift_detected,
            'severity': severity if drift_detected else None,
            'rolling_mape': round(rolling_mape, 2),
            'rolling_std': round(rolling_std, 2),
            'degradation_ratio': round(degradation_ratio, 2),
            'page_hinkley_stat': round(self.ph_sum - self.ph_min, 4),
            'samples': len(self.error_history),
            'recommendation': self._get_recommendation(drift_detected, severity)
        }
        
        # Record drift event
        if drift_detected:
            self.drift_history.append({
                'timestamp': datetime.now().isoformat(),
                'severity': severity,
                'rolling_mape': rolling_mape,
                'degradation_ratio': degradation_ratio
            })
            self.save_history()
        
        return result
    
    def _get_recommendation(self, drift_detected: bool, severity: str) -> str:
        """
        Get recommendation based on drift status
        """
        if not drift_detected:
            return "No action needed. Model performance is stable."
        
        if severity == 'critical':
            return "URGENT: Retrain models immediately. Performance severely degraded."
        elif severity == 'high':
            return "WARNING: Schedule model retraining within 24 hours."
        elif severity == 'moderate':
            return "NOTICE: Consider retraining models this week."
        else:
            return "INFO: Monitor closely. Retraining may be needed soon."
    
    def should_retrain(self) -> bool:
        """
        Determine if automatic retraining should be triggered
        """
        drift_status = self.detect_drift()
        
        return (
            drift_status['drift_detected'] and
            drift_status['severity'] in ['critical', 'high']
        )
    
    def get_performance_trend(self) -> Dict[str, Any]:
        """
        Get performance trend over time
        """
        if len(self.error_history) < 5:
            return {'status': 'insufficient_data'}
        
        # Group by time windows
        df = pd.DataFrame(list(self.error_history))
        df['timestamp'] = pd.to_datetime(df['timestamp'])
        df = df.sort_values('timestamp')
        
        # Calculate trend
        mapes = df['mape'].values
        x = np.arange(len(mapes))
        
        if len(mapes) > 1:
            slope, intercept, r_value, p_value, std_err = stats.linregress(x, mapes)
            
            if slope > 0.1:
                trend = 'degrading'
            elif slope < -0.1:
                trend = 'improving'
            else:
                trend = 'stable'
        else:
            slope = 0
            trend = 'unknown'
        
        return {
            'trend': trend,
            'slope': round(slope, 4),
            'current_mape': round(mapes[-1], 2),
            'avg_mape': round(np.mean(mapes), 2),
            'min_mape': round(np.min(mapes), 2),
            'max_mape': round(np.max(mapes), 2)
        }
    
    def reset_drift_detection(self):
        """
        Reset drift detection after retraining
        """
        self.ph_sum = 0
        self.ph_min = 0
        self.error_history.clear()
    
    def save_history(self):
        """Save drift history"""
        with open(self.drift_file, 'w') as f:
            json.dump({
                'drift_events': self.drift_history[-50:],  # Keep last 50
                'last_updated': datetime.now().isoformat()
            }, f, indent=2)
    
    def load_history(self):
        """Load drift history"""
        if self.drift_file.exists():
            with open(self.drift_file, 'r') as f:
                data = json.load(f)
                self.drift_history = data.get('drift_events', [])
    
    def get_drift_summary(self) -> Dict[str, Any]:
        """
        Get summary of drift monitoring
        """
        drift_status = self.detect_drift()
        trend = self.get_performance_trend()
        
        return {
            'current_status': drift_status,
            'performance_trend': trend,
            'total_drift_events': len(self.drift_history),
            'recent_drift_events': self.drift_history[-5:] if self.drift_history else [],
            'monitoring_window': self.window_size,
            'samples_collected': len(self.error_history)
        }
