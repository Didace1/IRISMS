# smartfix/AI_BACKEND/ml_v3/production_engine.py
"""
Production-Grade Forecasting Engine
Orchestrates Prophet + Global Model + Adaptive Optimization
"""

import math
from datetime import datetime
from typing import Dict, List, Any
from pathlib import Path

from .time_series_forecaster import TimeSeriesForecaster
from .global_forecaster import GlobalForecaster
from .adaptive_optimizer import AdaptiveOptimizer


class ProductionEngine:
    """
    Production-grade forecasting system
    
    Architecture:
    1. Prophet for products with sufficient history (>14 days)
    2. Global LightGBM for cold-start and scalability
    3. Adaptive optimizer for weight learning
    4. Proper uncertainty quantification
    """
    
    def __init__(self, model_dir: Path):
        self.model_dir = model_dir
        self.prophet_forecaster = TimeSeriesForecaster(model_dir / 'prophet')
        self.global_forecaster = GlobalForecaster(model_dir / 'global')
        self.optimizer = AdaptiveOptimizer(model_dir / 'optimizer')
        
        # Load existing models
        self.prophet_forecaster.load_models()
        self.global_forecaster.load_model()
    
    def train_models(
        self,
        sales_data: List[Dict[str, Any]],
        inventory_data: List[Dict[str, Any]]
    ) -> Dict[str, Any]:
        """
        Train both Prophet and Global models
        """
        # Normalize sales data
        normalized_sales = self._normalize_sales(sales_data)
        
        # Train global model (always)
        global_result = self.global_forecaster.train_global_model(
            normalized_sales,
            inventory_data
        )
        
        # Train Prophet models for products with sufficient data
        prophet_results = {}
        product_sales_count = {}
        
        for item in inventory_data:
            product_id = item.get('id')
            if not product_id:
                continue
            
            product_name = item.get('name', 'Unknown')
            
            # Count sales for this product
            product_sales = [s for s in normalized_sales if s.get('product_id') == product_id]
            product_sales_count[product_id] = len(product_sales)
            
            if len(product_sales) >= 14:  # Sufficient for Prophet
                result = self.prophet_forecaster.train_prophet_model(
                    normalized_sales,
                    product_id,
                    product_name
                )
                prophet_results[product_id] = result
        
        # Save models
        self.prophet_forecaster.save_models()
        self.global_forecaster.save_model()
        
        return {
            'global_model': global_result,
            'prophet_models': {
                'trained': len([r for r in prophet_results.values() if r.get('status') == 'trained']),
                'insufficient_data': len([r for r in prophet_results.values() if r.get('status') == 'insufficient_data']),
                'total_products': len(inventory_data)
            },
            'training_strategy': 'Prophet for mature products, Global for all'
        }
    
    def generate_forecast(
        self,
        product_id: int,
        product_data: Dict[str, Any],
        sales_history: List[Dict[str, Any]],
        days_ahead: int = 30
    ) -> Dict[str, Any]:
        """
        Generate forecast with uncertainty using best available model
        
        Strategy:
        1. Try Prophet if model exists (better for time-series)
        2. Fall back to Global model (handles cold-start)
        3. Always include prediction intervals
        """
        # Try Prophet first
        if product_id in self.prophet_forecaster.models:
            forecast = self.prophet_forecaster.forecast_with_intervals(
                product_id,
                days_ahead
            )
            
            if forecast.get('status') == 'success':
                # Add anomaly detection
                anomalies = self.prophet_forecaster.detect_anomalies(
                    sales_history,
                    product_id
                )
                
                forecast['anomalies_detected'] = len(anomalies)
                forecast['recent_anomalies'] = anomalies[-3:] if anomalies else []
                
                return forecast
        
        # Fall back to Global model
        # Extract recent sales for lag features
        product_sales = [s for s in sales_history if s.get('product_id') == product_id]
        recent_sales = [s.get('quantity', 0) for s in sorted(product_sales, key=lambda x: x.get('sale_date', ''))[-30:]]
        
        forecast = self.global_forecaster.forecast_with_uncertainty(
            product_id,
            product_data,
            days_ahead,
            recent_sales
        )
        
        return forecast
    
    def generate_recommendation(
        self,
        inventory_item: Dict[str, Any],
        forecast: Dict[str, Any],
        sales_history: List[Dict[str, Any]]
    ) -> Dict[str, Any]:
        """
        Generate smart recommendation using optimized weights
        """
        # Extract data
        product_id = inventory_item.get('id')
        product_name = inventory_item.get('name', 'Unknown')
        current_stock = inventory_item.get('quantity', 0)
        reorder_point = inventory_item.get('reorderPoint', 0)
        price = inventory_item.get('price', 0)
        purchase_cost = inventory_item.get('purchaseCost', 0)
        
        prediction = forecast.get('prediction', {})
        point_forecast = prediction.get('point_forecast', 0)
        min_demand = prediction.get('min_demand', 0)
        max_demand = prediction.get('max_demand', 0)
        
        trend_info = forecast.get('trend', {})
        trend_direction = trend_info.get('direction', 'stable')
        
        # Calculate metrics
        profit_margin = (price - purchase_cost) / price if price > 0 else 0
        
        # Calculate stock gap
        safety_stock = max(reorder_point, math.ceil(point_forecast / 30 * 7))
        target_stock = math.ceil(point_forecast + safety_stock)
        stock_gap = target_stock - current_stock
        
        # Coverage days
        daily_demand = point_forecast / 30
        coverage_days = current_stock / daily_demand if daily_demand > 0 else 999
        
        # Get optimized weights
        weights = self.optimizer.get_current_weights()
        
        # Calculate feature scores (normalized 0-1)
        forecast_score = min(1.0, point_forecast / 50)
        gap_score = min(1.0, max(0, stock_gap) / target_stock) if target_stock > 0 else 0
        trend_score = self._trend_to_score(trend_direction)
        margin_score = profit_margin
        
        # Calculate priority using optimized weights
        priority_score = (
            weights['forecast_demand'] * forecast_score +
            weights['stock_gap'] * gap_score +
            weights['trend'] * trend_score +
            weights['margin'] * margin_score
        )
        
        # Determine recommendation
        recommendation_type, suggested_quantity = self._determine_recommendation(
            current_stock,
            point_forecast,
            min_demand,
            max_demand,
            stock_gap,
            trend_direction,
            coverage_days
        )
        
        # Generate reason
        reason = self._generate_reason(
            recommendation_type,
            trend_direction,
            stock_gap,
            coverage_days,
            point_forecast,
            forecast.get('model_type', 'Unknown')
        )
        
        # Extract brand and category
        brand = self._extract_brand(product_name)
        category = inventory_item.get('category', {})
        if isinstance(category, dict):
            category_name = category.get('name', 'Unknown')
        else:
            category_name = str(category) if category else 'Unknown'
        
        # Record for optimization
        self.optimizer.record_prediction(
            product_id=product_id,
            product_name=product_name,
            features={
                'forecast_demand': forecast_score,
                'stock_gap': gap_score,
                'trend_score': trend_score,
                'margin': margin_score
            },
            recommendation=recommendation_type,
            suggested_quantity=suggested_quantity
        )
        
        return {
            'product': product_name,
            'brand': brand,
            'category': category_name,
            'prediction': {
                '30_day_demand': point_forecast,
                'min_demand': min_demand,
                'max_demand': max_demand,
                'confidence_interval': prediction.get('confidence_interval', '95%')
            },
            'trend': trend_direction,
            'recommendation': recommendation_type,
            'suggested_quantity': suggested_quantity,
            'confidence': forecast.get('confidence', 50),
            'reason': reason,
            'model_type': forecast.get('model_type', 'Unknown'),
            'current_stock': current_stock,
            'target_stock': target_stock,
            'coverage_days': round(coverage_days, 1),
            '_priority_score': priority_score
        }
    
    def _normalize_sales(self, sales_data: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """Normalize sales data"""
        normalized = []
        
        for sale in sales_data:
            sale_date = sale.get('createdAt')
            if not sale_date:
                continue
            
            if isinstance(sale_date, str):
                try:
                    sale_date = datetime.fromisoformat(sale_date.replace('Z', '+00:00'))
                except:
                    continue
            
            for item in sale.get('items', []):
                inv = item.get('inventoryItem')
                if not inv:
                    continue
                
                normalized.append({
                    'product_id': inv.get('id'),
                    'name': inv.get('name', 'Unknown'),
                    'quantity': item.get('quantity', 0),
                    'unit_price': item.get('unitPrice', 0),
                    'sale_date': sale_date
                })
        
        return normalized
    
    def _trend_to_score(self, direction: str) -> float:
        """Convert trend to score"""
        if direction == 'increasing':
            return 1.0
        elif direction == 'decreasing':
            return 0.0
        else:
            return 0.5
    
    def _determine_recommendation(
        self,
        current_stock: int,
        point_forecast: float,
        min_demand: float,
        max_demand: float,
        stock_gap: int,
        trend_direction: str,
        coverage_days: float
    ) -> tuple:
        """Determine recommendation type"""
        # Critical shortage
        if current_stock == 0 or coverage_days < 7:
            return 'REORDER', max(stock_gap, math.ceil(max_demand))
        
        # Low stock with increasing trend
        if stock_gap > 0 and trend_direction == 'increasing':
            return 'REORDER', math.ceil(max_demand - current_stock)
        
        # Low coverage
        if coverage_days < 21:
            return 'REORDER', max(0, stock_gap)
        
        # Excess stock with decreasing trend
        if coverage_days > 60 and trend_direction == 'decreasing':
            excess = current_stock - math.ceil(point_forecast * 1.5)
            return 'REDUCE_STOCK', max(0, excess)
        
        return 'HOLD', 0
    
    def _generate_reason(
        self,
        recommendation_type: str,
        trend_direction: str,
        stock_gap: int,
        coverage_days: float,
        predicted_demand: float,
        model_type: str
    ) -> str:
        """Generate explanation"""
        reasons = []
        
        if trend_direction == 'increasing':
            reasons.append("increasing demand trend detected")
        elif trend_direction == 'decreasing':
            reasons.append("decreasing demand trend detected")
        
        if stock_gap > 0:
            reasons.append(f"stock below target by {stock_gap} units")
        elif coverage_days < 14:
            reasons.append(f"only {coverage_days:.0f} days of stock remaining")
        
        reasons.append(f"predicted demand: {predicted_demand:.0f} units (30 days)")
        reasons.append(f"forecast model: {model_type}")
        
        return "Based on " + ", ".join(reasons) + "."
    
    def _extract_brand(self, product_name: str) -> str:
        """Extract brand"""
        known_brands = ["Apple", "Samsung", "Dell", "HP", "Lenovo", "Asus"]
        upper_name = (product_name or "").upper()
        for brand in known_brands:
            if brand.upper() in upper_name:
                return brand
        return "Generic"
    
    def validate_and_learn(self, actual_sales: List[Dict[str, Any]]) -> Dict[str, Any]:
        """Trigger optimization"""
        return self.optimizer.validate_and_optimize(actual_sales)
    
    def get_performance_metrics(self) -> Dict[str, Any]:
        """Get system performance"""
        return self.optimizer.get_performance_summary()
