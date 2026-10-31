# smartfix/AI_BACKEND/ml_v3/quantile_forecaster.py
"""
Quantile Regression LightGBM for Statistically Valid Prediction Intervals
Produces lower/upper bounds without assumptions about error distribution
"""

import numpy as np
import pandas as pd
from typing import Dict, List, Any, Tuple
from pathlib import Path
import pickle

try:
    from sklearn.preprocessing import LabelEncoder
except ImportError:
    LabelEncoder = None  # type: ignore[misc, assignment]

try:
    import lightgbm as lgb
    LIGHTGBM_AVAILABLE = True
except ImportError:
    lgb = None  # type: ignore[assignment]
    LIGHTGBM_AVAILABLE = False


class _FallbackLabelEncoder:
    def __init__(self):
        self.classes_ = []
        self._map = {}

    def fit_transform(self, y):
        self.fit(y)
        return self.transform(y)

    def fit(self, y):
        self._map.clear()
        self.classes_ = []
        for v in y:
            key = str(v)
            if key not in self._map:
                self._map[key] = len(self.classes_)
                self.classes_.append(key)
        return self

    def transform(self, y):
        return np.array([self._map[str(v)] for v in y])


def _make_label_encoder():
    if LabelEncoder is not None:
        return LabelEncoder()
    return _FallbackLabelEncoder()


class QuantileForecaster:
    """
    Quantile Regression for Prediction Intervals
    
    Trains 3 models:
    - Lower quantile (q=0.05) for 5th percentile
    - Median (q=0.50) for point forecast
    - Upper quantile (q=0.95) for 95th percentile
    
    This provides statistically valid 90% prediction intervals
    """
    
    def __init__(self, model_dir: Path):
        self.model_dir = model_dir
        self.model_dir.mkdir(parents=True, exist_ok=True)
        
        # Three models for quantile regression
        self.model_lower = None  # 5th percentile
        self.model_median = None  # 50th percentile (point forecast)
        self.model_upper = None  # 95th percentile
        
        self.product_encoder = _make_label_encoder()
        self.category_encoder = _make_label_encoder()
        self.feature_names = []
        self.metadata = {}
    
    def train_quantile_models(
        self,
        X: np.ndarray,
        y: np.ndarray,
        feature_names: List[str]
    ) -> Dict[str, Any]:
        """
        Train three quantile regression models
        
        Uses LightGBM's quantile objective for each quantile
        """
        if not LIGHTGBM_AVAILABLE:
            return {'status': 'error', 'message': 'LightGBM not available'}
        
        self.feature_names = feature_names
        
        # Split for validation
        split_idx = int(len(X) * 0.8)
        X_train, X_val = X[:split_idx], X[split_idx:]
        y_train, y_val = y[:split_idx], y[split_idx:]
        
        results = {}
        
        # Train lower quantile (5th percentile)
        train_data_lower = lgb.Dataset(X_train, label=y_train)
        val_data_lower = lgb.Dataset(X_val, label=y_val, reference=train_data_lower)
        
        params_lower = {
            'objective': 'quantile',
            'alpha': 0.05,  # 5th percentile
            'metric': 'quantile',
            'boosting_type': 'gbdt',
            'num_leaves': 31,
            'learning_rate': 0.05,
            'feature_fraction': 0.9,
            'bagging_fraction': 0.8,
            'bagging_freq': 5,
            'verbose': -1
        }
        
        self.model_lower = lgb.train(
            params_lower,
            train_data_lower,
            num_boost_round=200,
            valid_sets=[val_data_lower],
            callbacks=[lgb.early_stopping(stopping_rounds=20, verbose=False)]
        )
        
        # Train median (50th percentile)
        params_median = params_lower.copy()
        params_median['alpha'] = 0.50
        
        train_data_median = lgb.Dataset(X_train, label=y_train)
        val_data_median = lgb.Dataset(X_val, label=y_val, reference=train_data_median)
        
        self.model_median = lgb.train(
            params_median,
            train_data_median,
            num_boost_round=200,
            valid_sets=[val_data_median],
            callbacks=[lgb.early_stopping(stopping_rounds=20, verbose=False)]
        )
        
        # Train upper quantile (95th percentile)
        params_upper = params_lower.copy()
        params_upper['alpha'] = 0.95
        
        train_data_upper = lgb.Dataset(X_train, label=y_train)
        val_data_upper = lgb.Dataset(X_val, label=y_val, reference=train_data_upper)
        
        self.model_upper = lgb.train(
            params_upper,
            train_data_upper,
            num_boost_round=200,
            valid_sets=[val_data_upper],
            callbacks=[lgb.early_stopping(stopping_rounds=20, verbose=False)]
        )
        
        # Validate on test set
        pred_lower = self.model_lower.predict(X_val)
        pred_median = self.model_median.predict(X_val)
        pred_upper = self.model_upper.predict(X_val)
        
        # Calculate coverage (% of actuals within intervals)
        coverage = np.mean((y_val >= pred_lower) & (y_val <= pred_upper))
        
        # Calculate interval width
        avg_interval_width = np.mean(pred_upper - pred_lower)
        
        # Point forecast accuracy
        mae = np.mean(np.abs(y_val - pred_median))
        
        self.metadata = {
            'trained_at': pd.Timestamp.now().isoformat(),
            'samples': len(X),
            'coverage': round(coverage * 100, 2),
            'avg_interval_width': round(avg_interval_width, 2),
            'mae': round(mae, 2),
            'model_type': 'Quantile_LightGBM'
        }
        
        return {
            'status': 'trained',
            'coverage': round(coverage * 100, 2),
            'mae': round(mae, 2),
            'interval_width': round(avg_interval_width, 2)
        }
    
    def predict_with_intervals(
        self,
        X: np.ndarray
    ) -> Dict[str, np.ndarray]:
        """
        Generate predictions with statistically valid intervals
        
        Returns:
        - lower: 5th percentile predictions
        - median: 50th percentile (point forecast)
        - upper: 95th percentile predictions
        """
        if self.model_median is None:
            raise ValueError("Models not trained")
        
        pred_lower = self.model_lower.predict(X)
        pred_median = self.model_median.predict(X)
        pred_upper = self.model_upper.predict(X)
        
        # Ensure non-negative and proper ordering
        pred_lower = np.maximum(0, pred_lower)
        pred_median = np.maximum(pred_lower, pred_median)
        pred_upper = np.maximum(pred_median, pred_upper)
        
        return {
            'lower': pred_lower,
            'median': pred_median,
            'upper': pred_upper
        }
    
    def get_feature_importance(self) -> Dict[str, float]:
        """
        Get feature importance from median model
        """
        if self.model_median is None:
            return {}
        
        importance = self.model_median.feature_importance(importance_type='gain')
        
        return {
            name: float(imp)
            for name, imp in zip(self.feature_names, importance)
        }
    
    def save_models(self):
        """Save quantile models"""
        model_file = self.model_dir / 'quantile_models.pkl'
        with open(model_file, 'wb') as f:
            pickle.dump({
                'model_lower': self.model_lower,
                'model_median': self.model_median,
                'model_upper': self.model_upper,
                'product_encoder': self.product_encoder,
                'category_encoder': self.category_encoder,
                'feature_names': self.feature_names,
                'metadata': self.metadata
            }, f)
    
    def load_models(self):
        """Load quantile models"""
        model_file = self.model_dir / 'quantile_models.pkl'
        if model_file.exists():
            with open(model_file, 'rb') as f:
                data = pickle.load(f)
                self.model_lower = data['model_lower']
                self.model_median = data['model_median']
                self.model_upper = data['model_upper']
                self.product_encoder = data['product_encoder']
                self.category_encoder = data['category_encoder']
                self.feature_names = data['feature_names']
                self.metadata = data['metadata']
            return True
        return False
