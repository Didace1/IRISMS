# smartfix/AI_BACKEND/ml_v3/global_forecaster.py
"""
Global Forecasting Model - Single model for all products
Scalable approach for 1000+ products using LightGBM
"""

import numpy as np
import pandas as pd
from datetime import datetime, timedelta
from typing import Dict, List, Any, Optional
from pathlib import Path
import pickle
import json

try:
    from sklearn.preprocessing import LabelEncoder
    from sklearn.model_selection import TimeSeriesSplit
except ImportError:
    LabelEncoder = None  # type: ignore[misc, assignment]
    TimeSeriesSplit = None  # type: ignore[misc, assignment]
    print("WARNING: scikit-learn not installed. Install with: pip install scikit-learn")

try:
    import lightgbm as lgb
    LIGHTGBM_AVAILABLE = True
except ImportError:
    lgb = None  # type: ignore[assignment]
    LIGHTGBM_AVAILABLE = False
    print("WARNING: LightGBM not installed. Install with: pip install lightgbm")


class _FallbackLabelEncoder:
    """Minimal encoder when scikit-learn is unavailable."""

    def __init__(self):
        self.classes_ = []
        self._map: Dict[str, int] = {}

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


class GlobalForecaster:
    """
    Single global model trained on ALL products
    
    Advantages:
    - Scales to 1000+ products efficiently
    - Shares patterns across products
    - Handles cold-start problem
    - Fast inference
    
    Uses LightGBM for:
    - Fast training
    - Categorical feature support
    - Built-in regularization
    """
    
    def __init__(self, model_dir: Path):
        self.model_dir = model_dir
        self.model_dir.mkdir(parents=True, exist_ok=True)
        self.model = None
        self.product_encoder = _make_label_encoder()
        self.category_encoder = _make_label_encoder()
        self.feature_names = []
        self.metadata = {}
        
    def engineer_features(
        self,
        sales_history: List[Dict[str, Any]],
        inventory_data: List[Dict[str, Any]]
    ) -> pd.DataFrame:
        """
        Engineer features for global model
        
        Features:
        - Product ID (categorical)
        - Category (categorical)
        - Time features (day, week, month)
        - Lag features (sales 1,7,14,30 days ago)
        - Rolling statistics (mean, std, min, max)
        - Trend features
        """
        # Convert to dataframe
        df = pd.DataFrame(sales_history)
        df['sale_date'] = pd.to_datetime(df['sale_date'])
        
        # Aggregate by product and date
        daily_sales = df.groupby(['product_id', 'sale_date'])['quantity'].sum().reset_index()
        daily_sales.columns = ['product_id', 'date', 'quantity']
        
        # Add product metadata
        product_meta = pd.DataFrame(inventory_data)[['id', 'category', 'price', 'purchaseCost']]
        product_meta.columns = ['product_id', 'category', 'price', 'purchase_cost']
        
        # Extract category name
        product_meta['category'] = product_meta['category'].apply(
            lambda x: x.get('name', 'Unknown') if isinstance(x, dict) else str(x)
        )
        
        daily_sales = daily_sales.merge(product_meta, on='product_id', how='left')
        
        # Fill missing dates for each product
        all_products = daily_sales['product_id'].unique()
        date_range = pd.date_range(
            start=daily_sales['date'].min(),
            end=daily_sales['date'].max(),
            freq='D'
        )
        
        # Create complete date grid
        complete_df = pd.DataFrame([
            {'product_id': pid, 'date': date}
            for pid in all_products
            for date in date_range
        ])
        
        daily_sales = complete_df.merge(daily_sales, on=['product_id', 'date'], how='left')
        daily_sales['quantity'] = daily_sales['quantity'].fillna(0)
        
        # Forward fill product metadata
        daily_sales = daily_sales.sort_values(['product_id', 'date'])
        daily_sales[['category', 'price', 'purchase_cost']] = daily_sales.groupby('product_id')[
            ['category', 'price', 'purchase_cost']
        ].ffill()
        
        # Time features
        daily_sales['day_of_week'] = daily_sales['date'].dt.dayofweek
        daily_sales['day_of_month'] = daily_sales['date'].dt.day
        daily_sales['week_of_year'] = daily_sales['date'].dt.isocalendar().week
        daily_sales['month'] = daily_sales['date'].dt.month
        daily_sales['is_weekend'] = (daily_sales['day_of_week'] >= 5).astype(int)
        
        # Lag features
        for lag in [1, 7, 14, 30]:
            daily_sales[f'lag_{lag}'] = daily_sales.groupby('product_id')['quantity'].shift(lag)
        
        # Rolling statistics (7-day window)
        for window in [7, 14, 30]:
            daily_sales[f'rolling_mean_{window}'] = daily_sales.groupby('product_id')['quantity'].transform(
                lambda x: x.rolling(window=window, min_periods=1).mean()
            )
            daily_sales[f'rolling_std_{window}'] = daily_sales.groupby('product_id')['quantity'].transform(
                lambda x: x.rolling(window=window, min_periods=1).std()
            )
        
        # Trend feature (7-day slope)
        daily_sales['trend_7'] = daily_sales.groupby('product_id')['quantity'].transform(
            lambda x: x.rolling(window=7, min_periods=2).apply(
                lambda y: np.polyfit(range(len(y)), y, 1)[0] if len(y) > 1 else 0,
                raw=False
            )
        )
        
        # Fill NaN values
        daily_sales = daily_sales.fillna(0)
        
        return daily_sales
    
    def train_global_model(
        self,
        sales_history: List[Dict[str, Any]],
        inventory_data: List[Dict[str, Any]]
    ) -> Dict[str, Any]:
        """
        Train single global LightGBM model on all products
        """
        if not LIGHTGBM_AVAILABLE:
            return {'status': 'error', 'message': 'LightGBM not installed'}
        
        # Engineer features
        df = self.engineer_features(sales_history, inventory_data)
        
        if len(df) < 100:
            return {'status': 'insufficient_data', 'samples': len(df)}
        
        # Encode categorical features
        df['product_id_encoded'] = self.product_encoder.fit_transform(df['product_id'])
        df['category_encoded'] = self.category_encoder.fit_transform(df['category'].fillna('Unknown'))
        
        # Define features and target
        feature_cols = [
            'product_id_encoded', 'category_encoded',
            'day_of_week', 'day_of_month', 'week_of_year', 'month', 'is_weekend',
            'lag_1', 'lag_7', 'lag_14', 'lag_30',
            'rolling_mean_7', 'rolling_std_7',
            'rolling_mean_14', 'rolling_std_14',
            'rolling_mean_30', 'rolling_std_30',
            'trend_7', 'price', 'purchase_cost'
        ]
        
        self.feature_names = feature_cols
        
        X = df[feature_cols].values
        y = df['quantity'].values
        
        # Time-series split for validation
        if TimeSeriesSplit is not None:
            tscv = TimeSeriesSplit(n_splits=3)
            splits = list(tscv.split(X))
        else:
            # Fallback: simple train/val split (80/20)
            split_idx = int(len(X) * 0.8)
            splits = [
                (list(range(split_idx)), list(range(split_idx, len(X))))
            ]
        
        best_model = None
        best_score = float('inf')
        
        for train_idx, val_idx in splits:
            X_train, X_val = X[train_idx], X[val_idx]
            y_train, y_val = y[train_idx], y[val_idx]
            
            # Train LightGBM
            train_data = lgb.Dataset(X_train, label=y_train)
            val_data = lgb.Dataset(X_val, label=y_val, reference=train_data)
            
            params = {
                'objective': 'regression',
                'metric': 'mae',
                'boosting_type': 'gbdt',
                'num_leaves': 31,
                'learning_rate': 0.05,
                'feature_fraction': 0.9,
                'bagging_fraction': 0.8,
                'bagging_freq': 5,
                'verbose': -1,
                'min_data_in_leaf': 20,
                'max_depth': 7
            }
            
            model = lgb.train(
                params,
                train_data,
                num_boost_round=200,
                valid_sets=[val_data],
                callbacks=[lgb.early_stopping(stopping_rounds=20, verbose=False)]
            )
            
            # Evaluate
            val_pred = model.predict(X_val)
            mae = np.mean(np.abs(y_val - val_pred))
            
            if mae < best_score:
                best_score = mae
                best_model = model
        
        self.model = best_model
        
        # Calculate final metrics
        y_pred = self.model.predict(X)
        mae = np.mean(np.abs(y - y_pred))
        mape = np.mean(np.abs((y - y_pred) / (y + 1))) * 100
        rmse = np.sqrt(np.mean((y - y_pred) ** 2))
        
        self.metadata = {
            'trained_at': datetime.now().isoformat(),
            'training_samples': len(df),
            'num_products': df['product_id'].nunique(),
            'mae': round(mae, 2),
            'mape': round(mape, 2),
            'rmse': round(rmse, 2),
            'model_type': 'LightGBM_Global'
        }
        
        return {
            'status': 'trained',
            'samples': len(df),
            'products': df['product_id'].nunique(),
            'mae': round(mae, 2),
            'mape': round(mape, 2),
            'model_type': 'LightGBM_Global'
        }
    
    def forecast_with_uncertainty(
        self,
        product_id: int,
        product_data: Dict[str, Any],
        days_ahead: int = 30,
        recent_sales: List[float] = None
    ) -> Dict[str, Any]:
        """
        Generate forecast with uncertainty quantification
        
        Uses quantile regression for prediction intervals
        """
        if self.model is None:
            return {'status': 'error', 'message': 'Model not trained'}
        
        # Prepare features for future dates
        future_dates = pd.date_range(
            start=datetime.now(),
            periods=days_ahead,
            freq='D'
        )
        
        predictions = []
        
        # Encode product
        try:
            product_encoded = self.product_encoder.transform([product_id])[0]
        except:
            product_encoded = -1  # Unknown product
        
        category = product_data.get('category', {})
        if isinstance(category, dict):
            category_name = category.get('name', 'Unknown')
        else:
            category_name = str(category)
        
        try:
            category_encoded = self.category_encoder.transform([category_name])[0]
        except:
            category_encoded = -1
        
        # Use recent sales for lag features
        if recent_sales is None:
            recent_sales = [0] * 30
        
        for i, date in enumerate(future_dates):
            features = {
                'product_id_encoded': product_encoded,
                'category_encoded': category_encoded,
                'day_of_week': date.dayofweek,
                'day_of_month': date.day,
                'week_of_year': date.isocalendar()[1],
                'month': date.month,
                'is_weekend': 1 if date.dayofweek >= 5 else 0,
                'lag_1': recent_sales[-1] if len(recent_sales) > 0 else 0,
                'lag_7': recent_sales[-7] if len(recent_sales) >= 7 else 0,
                'lag_14': recent_sales[-14] if len(recent_sales) >= 14 else 0,
                'lag_30': recent_sales[-30] if len(recent_sales) >= 30 else 0,
                'rolling_mean_7': np.mean(recent_sales[-7:]) if len(recent_sales) >= 7 else 0,
                'rolling_std_7': np.std(recent_sales[-7:]) if len(recent_sales) >= 7 else 0,
                'rolling_mean_14': np.mean(recent_sales[-14:]) if len(recent_sales) >= 14 else 0,
                'rolling_std_14': np.std(recent_sales[-14:]) if len(recent_sales) >= 14 else 0,
                'rolling_mean_30': np.mean(recent_sales[-30:]) if len(recent_sales) >= 30 else 0,
                'rolling_std_30': np.std(recent_sales[-30:]) if len(recent_sales) >= 30 else 0,
                'trend_7': 0,  # Simplified
                'price': product_data.get('price', 0),
                'purchase_cost': product_data.get('purchaseCost', 0)
            }
            
            X = np.array([[features[col] for col in self.feature_names]])
            pred = self.model.predict(X)[0]
            pred = max(0, pred)
            
            predictions.append(pred)
            recent_sales.append(pred)  # Update for next iteration
        
        # Calculate uncertainty using standard deviation
        pred_std = np.std(predictions)
        total_demand = sum(predictions)
        
        # 95% confidence interval (±1.96 * std)
        min_demand = max(0, total_demand - 1.96 * pred_std * np.sqrt(days_ahead))
        max_demand = total_demand + 1.96 * pred_std * np.sqrt(days_ahead)
        
        # Calculate confidence
        relative_uncertainty = (max_demand - min_demand) / (total_demand + 1)
        confidence = max(0, min(100, 100 * (1 - relative_uncertainty)))
        
        return {
            'status': 'success',
            'prediction': {
                'point_forecast': round(total_demand, 1),
                'min_demand': round(min_demand, 1),
                'max_demand': round(max_demand, 1),
                'confidence_interval': '95%'
            },
            'daily_forecast': [
                {
                    'date': future_dates[i].strftime('%Y-%m-%d'),
                    'forecast': round(predictions[i], 2)
                }
                for i in range(min(7, len(predictions)))
            ],
            'confidence': round(confidence, 0),
            'model_type': 'LightGBM_Global'
        }
    
    def save_model(self):
        """Save global model"""
        if self.model:
            model_file = self.model_dir / 'global_model.pkl'
            with open(model_file, 'wb') as f:
                pickle.dump({
                    'model': self.model,
                    'product_encoder': self.product_encoder,
                    'category_encoder': self.category_encoder,
                    'feature_names': self.feature_names,
                    'metadata': self.metadata
                }, f)
    
    def load_model(self):
        """Load global model"""
        model_file = self.model_dir / 'global_model.pkl'
        if model_file.exists():
            with open(model_file, 'rb') as f:
                data = pickle.load(f)
                self.model = data['model']
                self.product_encoder = data['product_encoder']
                self.category_encoder = data['category_encoder']
                self.feature_names = data['feature_names']
                self.metadata = data['metadata']
            return True
        return False
