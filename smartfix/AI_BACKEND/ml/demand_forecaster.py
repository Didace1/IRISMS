# smartfix/AI_BACKEND/ml/demand_forecaster.py
"""
Demand Forecasting Engine using Machine Learning
Predicts future demand for inventory items using time-series analysis
"""

import numpy as np
import pandas as pd
from datetime import datetime, timedelta
from typing import Dict, List, Tuple, Any
from collections import defaultdict
import pickle
from pathlib import Path

try:
    from sklearn.ensemble import RandomForestRegressor
    from sklearn.linear_model import LinearRegression
    from sklearn.preprocessing import StandardScaler
    SKLEARN_AVAILABLE = True
except ImportError:
    SKLEARN_AVAILABLE = False
    print("Warning: scikit-learn not available. Using fallback methods.")


class DemandForecaster:
    """
    ML-based demand forecasting for inventory items
    Uses Random Forest for robust predictions with limited data
    """
    
    def __init__(self, model_dir: Path):
        self.model_dir = model_dir
        self.model_dir.mkdir(parents=True, exist_ok=True)
        self.models = {}  # product_id -> model
        self.scalers = {}  # product_id -> scaler
        self.feature_importance = {}
        
    def prepare_time_series_features(
        self, 
        sales_history: List[Dict[str, Any]], 
        product_id: int
    ) -> Tuple[np.ndarray, np.ndarray]:
        """
        Convert sales history into time-series features for ML
        
        Features:
        - Day of week (0-6)
        - Week of month (1-5)
        - Days since first sale
        - 7-day moving average
        - 14-day moving average
        - 7-day trend (slope)
        - Recent velocity (last 7 days)
        """
        # Filter sales for this product
        product_sales = [s for s in sales_history if s.get('product_id') == product_id]
        
        if len(product_sales) < 7:
            # Not enough data for ML - return None
            return None, None
        
        # Create daily sales dataframe
        df = pd.DataFrame(product_sales)
        df['sale_date'] = pd.to_datetime(df['sale_date'])
        df = df.sort_values('sale_date')
        
        # Aggregate by day
        daily_sales = df.groupby('sale_date')['quantity'].sum().reset_index()
        daily_sales.columns = ['date', 'quantity']
        
        # Fill missing dates with 0
        date_range = pd.date_range(
            start=daily_sales['date'].min(),
            end=daily_sales['date'].max(),
            freq='D'
        )
        daily_sales = daily_sales.set_index('date').reindex(date_range, fill_value=0).reset_index()
        daily_sales.columns = ['date', 'quantity']
        
        # Extract features
        daily_sales['day_of_week'] = daily_sales['date'].dt.dayofweek
        daily_sales['week_of_month'] = (daily_sales['date'].dt.day - 1) // 7 + 1
        daily_sales['days_since_start'] = (daily_sales['date'] - daily_sales['date'].min()).dt.days
        
        # Moving averages
        daily_sales['ma_7'] = daily_sales['quantity'].rolling(window=7, min_periods=1).mean()
        daily_sales['ma_14'] = daily_sales['quantity'].rolling(window=14, min_periods=1).mean()
        
        # Trend (7-day slope)
        def calculate_slope(series):
            if len(series) < 2:
                return 0
            x = np.arange(len(series))
            y = series.values
            if np.std(y) == 0:
                return 0
            slope = np.polyfit(x, y, 1)[0]
            return slope
        
        daily_sales['trend_7'] = daily_sales['quantity'].rolling(window=7, min_periods=2).apply(calculate_slope, raw=False)
        
        # Recent velocity
        daily_sales['velocity_7'] = daily_sales['quantity'].rolling(window=7, min_periods=1).sum() / 7
        
        # Fill NaN values
        daily_sales = daily_sales.fillna(0)
        
        # Prepare X (features) and y (target)
        feature_cols = ['day_of_week', 'week_of_month', 'days_since_start', 
                       'ma_7', 'ma_14', 'trend_7', 'velocity_7']
        
        X = daily_sales[feature_cols].values
        y = daily_sales['quantity'].values
        
        return X, y
    
    def train_model(
        self, 
        sales_history: List[Dict[str, Any]], 
        product_id: int
    ) -> Dict[str, Any]:
        """
        Train a Random Forest model for a specific product
        """
        if not SKLEARN_AVAILABLE:
            return {'status': 'skipped', 'reason': 'sklearn not available'}
        
        X, y = self.prepare_time_series_features(sales_history, product_id)
        
        if X is None or len(X) < 7:
            return {'status': 'insufficient_data', 'samples': len(X) if X is not None else 0}
        
        # Scale features
        scaler = StandardScaler()
        X_scaled = scaler.fit_transform(X)
        
        # Train Random Forest
        model = RandomForestRegressor(
            n_estimators=50,
            max_depth=5,
            min_samples_split=2,
            min_samples_leaf=1,
            random_state=42,
            n_jobs=-1
        )
        
        model.fit(X_scaled, y)
        
        # Store model and scaler
        self.models[product_id] = model
        self.scalers[product_id] = scaler
        
        # Feature importance
        feature_names = ['day_of_week', 'week_of_month', 'days_since_start', 
                        'ma_7', 'ma_14', 'trend_7', 'velocity_7']
        importance = dict(zip(feature_names, model.feature_importances_))
        self.feature_importance[product_id] = importance
        
        # Calculate training score
        train_score = model.score(X_scaled, y)
        
        return {
            'status': 'trained',
            'samples': len(X),
            'train_score': round(train_score, 3),
            'feature_importance': {k: round(v, 3) for k, v in importance.items()}
        }
    
    def predict_demand(
        self, 
        product_id: int, 
        days_ahead: int = 30,
        current_features: Dict[str, float] = None
    ) -> Dict[str, Any]:
        """
        Predict future demand for a product
        
        Returns:
        - predicted_demand: Total units expected in next N days
        - daily_forecast: Day-by-day predictions
        - confidence: Confidence score (0-100)
        """
        if product_id not in self.models:
            # Fallback: Use simple moving average
            return self._fallback_prediction(product_id, days_ahead, current_features)
        
        model = self.models[product_id]
        scaler = self.scalers[product_id]
        
        # Prepare features for future dates
        predictions = []
        
        for day in range(days_ahead):
            future_date = datetime.now() + timedelta(days=day)
            
            # Create feature vector
            features = [
                future_date.weekday(),  # day_of_week
                (future_date.day - 1) // 7 + 1,  # week_of_month
                current_features.get('days_since_start', 60) + day,  # days_since_start
                current_features.get('ma_7', 0),  # ma_7
                current_features.get('ma_14', 0),  # ma_14
                current_features.get('trend_7', 0),  # trend_7
                current_features.get('velocity_7', 0)  # velocity_7
            ]
            
            # Scale and predict
            features_scaled = scaler.transform([features])
            pred = model.predict(features_scaled)[0]
            pred = max(0, pred)  # No negative predictions
            
            predictions.append({
                'day': day + 1,
                'date': future_date.strftime('%Y-%m-%d'),
                'predicted_quantity': round(pred, 2)
            })
        
        total_demand = sum(p['predicted_quantity'] for p in predictions)
        
        # Calculate confidence based on model score and data quality
        train_score = self.models[product_id].score(
            scaler.transform(self.models[product_id].feature_importances_.reshape(1, -1)),
            [0]  # Dummy target
        ) if hasattr(self.models[product_id], 'feature_importances_') else 0.7
        
        confidence = min(100, int(train_score * 100))
        
        return {
            'predicted_demand_total': round(total_demand, 1),
            'daily_forecast': predictions[:7],  # Return first 7 days
            'confidence': confidence,
            'method': 'random_forest'
        }
    
    def _fallback_prediction(
        self, 
        product_id: int, 
        days_ahead: int,
        current_features: Dict[str, float]
    ) -> Dict[str, Any]:
        """
        Fallback prediction using simple moving average
        """
        velocity = current_features.get('velocity_7', 0) if current_features else 0
        trend = current_features.get('trend_7', 0) if current_features else 0
        
        # Simple linear projection with trend
        predictions = []
        for day in range(min(days_ahead, 7)):
            future_date = datetime.now() + timedelta(days=day)
            pred = velocity + (trend * day)
            pred = max(0, pred)
            
            predictions.append({
                'day': day + 1,
                'date': future_date.strftime('%Y-%m-%d'),
                'predicted_quantity': round(pred, 2)
            })
        
        total_demand = velocity * days_ahead + (trend * days_ahead * (days_ahead - 1) / 2)
        total_demand = max(0, total_demand)
        
        return {
            'predicted_demand_total': round(total_demand, 1),
            'daily_forecast': predictions,
            'confidence': 50,  # Lower confidence for fallback
            'method': 'moving_average_fallback'
        }
    
    def save_models(self):
        """Persist trained models to disk"""
        model_file = self.model_dir / 'demand_models.pkl'
        
        with open(model_file, 'wb') as f:
            pickle.dump({
                'models': self.models,
                'scalers': self.scalers,
                'feature_importance': self.feature_importance,
                'trained_at': datetime.now().isoformat()
            }, f)
    
    def load_models(self):
        """Load trained models from disk"""
        model_file = self.model_dir / 'demand_models.pkl'
        
        if not model_file.exists():
            return False
        
        try:
            with open(model_file, 'rb') as f:
                data = pickle.load(f)
                self.models = data.get('models', {})
                self.scalers = data.get('scalers', {})
                self.feature_importance = data.get('feature_importance', {})
            return True
        except Exception as e:
            print(f"Error loading models: {e}")
            return False
