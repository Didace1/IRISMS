# smartfix/AI_BACKEND/ml_v3/time_series_forecaster.py
"""
Production-Grade Time-Series Forecasting Engine
Uses Prophet for proper temporal modeling with trend + seasonality
"""

import numpy as np
import pandas as pd
from datetime import datetime, timedelta
from typing import Dict, List, Tuple, Any, Optional
from pathlib import Path
import pickle
import json

try:
    from prophet import Prophet
    from prophet.diagnostics import cross_validation, performance_metrics
    PROPHET_AVAILABLE = True
except ImportError:
    PROPHET_AVAILABLE = False
    print("WARNING: Prophet not installed. Install with: pip install prophet")

try:
    from statsmodels.tsa.seasonal import seasonal_decompose
    from statsmodels.tsa.holtwinters import ExponentialSmoothing
    STATSMODELS_AVAILABLE = True
except ImportError:
    STATSMODELS_AVAILABLE = False
    print("WARNING: statsmodels not installed. Install with: pip install statsmodels")


class TimeSeriesForecaster:
    """
    Production-grade time-series forecasting using Prophet
    
    Features:
    - Proper temporal dependency modeling
    - Trend + seasonality decomposition
    - Prediction intervals (uncertainty quantification)
    - Anomaly detection
    - Cross-validation for model evaluation
    """
    
    def __init__(self, model_dir: Path):
        self.model_dir = model_dir
        self.model_dir.mkdir(parents=True, exist_ok=True)
        self.models = {}  # product_id -> Prophet model
        self.model_metadata = {}  # product_id -> metadata
        
    def prepare_prophet_data(
        self, 
        sales_history: List[Dict[str, Any]], 
        product_id: int
    ) -> Optional[pd.DataFrame]:
        """
        Convert sales history to Prophet format (ds, y)
        
        Prophet requires:
        - ds: datetime column
        - y: numeric value to forecast
        """
        # Filter sales for this product
        product_sales = [
            s for s in sales_history 
            if s.get('product_id') == product_id
        ]
        
        if len(product_sales) < 14:  # Need at least 2 weeks
            return None
        
        # Create dataframe
        df = pd.DataFrame(product_sales)
        df['sale_date'] = pd.to_datetime(df['sale_date'])
        
        # Aggregate by day
        daily_sales = df.groupby('sale_date')['quantity'].sum().reset_index()
        daily_sales.columns = ['ds', 'y']
        
        # Fill missing dates with 0
        date_range = pd.date_range(
            start=daily_sales['ds'].min(),
            end=daily_sales['ds'].max(),
            freq='D'
        )
        
        full_df = pd.DataFrame({'ds': date_range})
        full_df = full_df.merge(daily_sales, on='ds', how='left')
        full_df['y'] = full_df['y'].fillna(0)
        
        return full_df
    
    def _adaptive_prophet_config(self, df: pd.DataFrame) -> Dict[str, Any]:
        """
        Adaptive Prophet configuration based on data history
        
        Rules:
        - Short history (<30 days): Minimal seasonality
        - Medium history (30-180 days): Weekly seasonality only
        - Long history (>180 days): Weekly + yearly seasonality
        """
        days_of_history = (df['ds'].max() - df['ds'].min()).days
        
        if days_of_history < 30:
            # Short history: Conservative settings
            return {
                'growth': 'linear',
                'seasonality_mode': 'additive',
                'daily_seasonality': False,
                'weekly_seasonality': False,  # Not enough data
                'yearly_seasonality': False,
                'changepoint_prior_scale': 0.01,  # Less flexible
                'seasonality_prior_scale': 1.0,
                'interval_width': 0.80,  # Wider intervals (less confident)
                'history_category': 'short'
            }
        elif days_of_history < 180:
            # Medium history: Weekly seasonality
            return {
                'growth': 'linear',
                'seasonality_mode': 'multiplicative',
                'daily_seasonality': False,
                'weekly_seasonality': True,
                'yearly_seasonality': False,
                'changepoint_prior_scale': 0.05,
                'seasonality_prior_scale': 10.0,
                'interval_width': 0.90,
                'history_category': 'medium'
            }
        else:
            # Long history: Full seasonality
            return {
                'growth': 'linear',
                'seasonality_mode': 'multiplicative',
                'daily_seasonality': False,
                'weekly_seasonality': True,
                'yearly_seasonality': True,  # Enable yearly
                'changepoint_prior_scale': 0.05,
                'seasonality_prior_scale': 10.0,
                'interval_width': 0.95,
                'history_category': 'long'
            }
    
    def train_prophet_model(
        self, 
        sales_history: List[Dict[str, Any]], 
        product_id: int,
        product_name: str
    ) -> Dict[str, Any]:
        """
        Train Prophet model with adaptive configuration
        
        Automatically adjusts seasonality based on data history
        """
        if not PROPHET_AVAILABLE:
            return {
                'status': 'error',
                'message': 'Prophet not installed'
            }
        
        # Prepare data
        df = self.prepare_prophet_data(sales_history, product_id)
        
        if df is None or len(df) < 14:
            return {
                'status': 'insufficient_data',
                'samples': len(df) if df is not None else 0,
                'required': 14
            }
        
        try:
            # Get adaptive configuration
            config = self._adaptive_prophet_config(df)
            
            # Initialize Prophet with adaptive settings
            model = Prophet(
                growth=config['growth'],
                seasonality_mode=config['seasonality_mode'],
                daily_seasonality=config['daily_seasonality'],
                weekly_seasonality=config['weekly_seasonality'],
                yearly_seasonality=config['yearly_seasonality'],
                changepoint_prior_scale=config['changepoint_prior_scale'],
                seasonality_prior_scale=config['seasonality_prior_scale'],
                interval_width=config['interval_width'],
                uncertainty_samples=1000
            )
            
            # Fit model
            model.fit(df)
            
            # Store model
            self.models[product_id] = model
            
            # Calculate training metrics
            train_predictions = model.predict(df)
            mae = np.mean(np.abs(df['y'] - train_predictions['yhat']))
            mape = np.mean(np.abs((df['y'] - train_predictions['yhat']) / (df['y'] + 1))) * 100
            
            # Store metadata
            self.model_metadata[product_id] = {
                'product_name': product_name,
                'trained_at': datetime.now().isoformat(),
                'training_samples': len(df),
                'training_period_days': (df['ds'].max() - df['ds'].min()).days,
                'mae': round(mae, 2),
                'mape': round(mape, 2),
                'model_type': 'Prophet',
                'history_category': config['history_category'],
                'seasonality_config': {
                    'weekly': config['weekly_seasonality'],
                    'yearly': config['yearly_seasonality']
                }
            }
            
            return {
                'status': 'trained',
                'samples': len(df),
                'mae': round(mae, 2),
                'mape': round(mape, 2),
                'model_type': 'Prophet',
                'history_category': config['history_category']
            }
            
        except Exception as e:
            return {
                'status': 'error',
                'message': str(e)
            }
    
    def forecast_with_intervals(
        self, 
        product_id: int, 
        days_ahead: int = 30
    ) -> Dict[str, Any]:
        """
        Generate forecast with prediction intervals
        
        Returns:
        - Point forecast (yhat)
        - Lower bound (yhat_lower) - 95% CI
        - Upper bound (yhat_upper) - 95% CI
        - Trend component
        - Seasonality component
        """
        if product_id not in self.models:
            return {
                'status': 'error',
                'message': 'Model not trained for this product'
            }
        
        model = self.models[product_id]
        
        # Create future dataframe
        future = model.make_future_dataframe(periods=days_ahead, freq='D')
        
        # Generate forecast
        forecast = model.predict(future)
        
        # Extract future predictions only
        future_forecast = forecast.tail(days_ahead)
        
        # Calculate total demand with bounds
        total_demand = future_forecast['yhat'].sum()
        min_demand = future_forecast['yhat_lower'].sum()
        max_demand = future_forecast['yhat_upper'].sum()
        
        # Ensure non-negative
        total_demand = max(0, total_demand)
        min_demand = max(0, min_demand)
        max_demand = max(0, max_demand)
        
        # Extract components
        trend = future_forecast['trend'].mean()
        
        # Calculate confidence based on interval width
        interval_width = max_demand - min_demand
        relative_uncertainty = interval_width / (total_demand + 1)
        confidence = max(0, min(100, 100 * (1 - relative_uncertainty)))
        
        # Detect trend direction
        trend_slope = (future_forecast['trend'].iloc[-1] - future_forecast['trend'].iloc[0]) / days_ahead
        if trend_slope > 0.01:
            trend_direction = 'increasing'
        elif trend_slope < -0.01:
            trend_direction = 'decreasing'
        else:
            trend_direction = 'stable'
        
        return {
            'status': 'success',
            'prediction': {
                'point_forecast': round(total_demand, 1),
                'min_demand': round(min_demand, 1),
                'max_demand': round(max_demand, 1),
                'confidence_interval': '95%'
            },
            'trend': {
                'direction': trend_direction,
                'slope': round(trend_slope, 4),
                'value': round(trend, 2)
            },
            'daily_forecast': [
                {
                    'date': row['ds'].strftime('%Y-%m-%d'),
                    'forecast': round(max(0, row['yhat']), 2),
                    'lower': round(max(0, row['yhat_lower']), 2),
                    'upper': round(max(0, row['yhat_upper']), 2)
                }
                for _, row in future_forecast.head(7).iterrows()
            ],
            'confidence': round(confidence, 0),
            'model_type': 'Prophet'
        }
    
    def detect_anomalies(
        self, 
        sales_history: List[Dict[str, Any]], 
        product_id: int
    ) -> List[Dict[str, Any]]:
        """
        Detect anomalies in historical sales using Prophet
        
        Anomalies are data points outside prediction intervals
        """
        if product_id not in self.models:
            return []
        
        df = self.prepare_prophet_data(sales_history, product_id)
        if df is None:
            return []
        
        model = self.models[product_id]
        forecast = model.predict(df)
        
        # Identify anomalies (outside 95% CI)
        anomalies = []
        for i, row in df.iterrows():
            actual = row['y']
            predicted = forecast.iloc[i]['yhat']
            lower = forecast.iloc[i]['yhat_lower']
            upper = forecast.iloc[i]['yhat_upper']
            
            if actual < lower or actual > upper:
                anomalies.append({
                    'date': row['ds'].strftime('%Y-%m-%d'),
                    'actual': round(actual, 2),
                    'expected': round(predicted, 2),
                    'lower_bound': round(lower, 2),
                    'upper_bound': round(upper, 2),
                    'severity': 'high' if (actual < lower * 0.5 or actual > upper * 1.5) else 'moderate'
                })
        
        return anomalies
    
    def decompose_seasonality(
        self, 
        sales_history: List[Dict[str, Any]], 
        product_id: int
    ) -> Dict[str, Any]:
        """
        Decompose time series into trend + seasonality + residual
        """
        if not STATSMODELS_AVAILABLE:
            return {'status': 'error', 'message': 'statsmodels not installed'}
        
        df = self.prepare_prophet_data(sales_history, product_id)
        if df is None or len(df) < 14:
            return {'status': 'insufficient_data'}
        
        try:
            # Perform seasonal decomposition
            decomposition = seasonal_decompose(
                df.set_index('ds')['y'],
                model='multiplicative',
                period=7,  # weekly seasonality
                extrapolate_trend='freq'
            )
            
            return {
                'status': 'success',
                'has_seasonality': True,
                'trend_strength': round(float(np.std(decomposition.trend.dropna())), 2),
                'seasonal_strength': round(float(np.std(decomposition.seasonal.dropna())), 2),
                'residual_strength': round(float(np.std(decomposition.resid.dropna())), 2)
            }
            
        except Exception as e:
            return {'status': 'error', 'message': str(e)}
    
    def cross_validate_model(
        self, 
        product_id: int,
        initial_days: int = 30,
        horizon_days: int = 7
    ) -> Dict[str, Any]:
        """
        Perform time-series cross-validation
        
        Evaluates model performance on held-out data
        """
        if not PROPHET_AVAILABLE or product_id not in self.models:
            return {'status': 'error'}
        
        try:
            model = self.models[product_id]
            
            # Perform cross-validation
            df_cv = cross_validation(
                model,
                initial=f'{initial_days} days',
                horizon=f'{horizon_days} days',
                period=f'{horizon_days} days'
            )
            
            # Calculate performance metrics
            df_p = performance_metrics(df_cv)
            
            return {
                'status': 'success',
                'mae': round(df_p['mae'].mean(), 2),
                'mape': round(df_p['mape'].mean() * 100, 2),
                'rmse': round(df_p['rmse'].mean(), 2),
                'coverage': round(df_p['coverage'].mean(), 2)
            }
            
        except Exception as e:
            return {'status': 'error', 'message': str(e)}
    
    def save_models(self):
        """Persist trained Prophet models"""
        for product_id, model in self.models.items():
            model_file = self.model_dir / f'prophet_model_{product_id}.pkl'
            with open(model_file, 'wb') as f:
                pickle.dump(model, f)
        
        # Save metadata
        metadata_file = self.model_dir / 'prophet_metadata.json'
        with open(metadata_file, 'w') as f:
            json.dump(self.model_metadata, f, indent=2)
    
    def load_models(self):
        """Load trained Prophet models"""
        metadata_file = self.model_dir / 'prophet_metadata.json'
        if metadata_file.exists():
            with open(metadata_file, 'r') as f:
                self.model_metadata = json.load(f)
        
        for product_id in self.model_metadata.keys():
            model_file = self.model_dir / f'prophet_model_{product_id}.pkl'
            if model_file.exists():
                with open(model_file, 'rb') as f:
                    self.models[int(product_id)] = pickle.load(f)
