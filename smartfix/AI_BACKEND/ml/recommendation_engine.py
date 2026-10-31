# smartfix/AI_BACKEND/ml/recommendation_engine.py
"""
Smart Recommendation Engine
Combines ML forecasting, trend detection, and adaptive learning
to generate intelligent inventory recommendations
"""

import math
from datetime import datetime
from typing import Dict, List, Any
from pathlib import Path

from .demand_forecaster import DemandForecaster
from .trend_detector import TrendDetector
from .feedback_learner import FeedbackLearner


class RecommendationEngine:
    """
    Professional-grade AI Inventory Intelligence System
    
    Features:
    - ML-based demand forecasting
    - Trend detection and analysis
    - Adaptive weight learning
    - Confidence scoring
    - Smart recommendation logic
    """
    
    def __init__(self, model_dir: Path):
        self.model_dir = model_dir
        self.forecaster = DemandForecaster(model_dir)
        self.trend_detector = TrendDetector()
        self.feedback_learner = FeedbackLearner(model_dir / 'feedback')
        
        # Load existing models
        self.forecaster.load_models()
    
    def generate_recommendations(
        self,
        sales_data: List[Dict[str, Any]],
        inventory_data: List[Dict[str, Any]],
        top_n: int = 10
    ) -> List[Dict[str, Any]]:
        """
        Generate intelligent inventory recommendations
        
        Process:
        1. Train/update demand forecasting models
        2. Detect trends for each product
        3. Predict future demand
        4. Calculate recommendation scores using adaptive weights
        5. Generate actionable recommendations with confidence
        """
        # Normalize sales data
        normalized_sales = self._normalize_sales(sales_data)
        
        recommendations = []
        
        for item in inventory_data:
            product_id = item.get('id')
            if not product_id:
                continue
            
            # Train forecasting model for this product
            training_result = self.forecaster.train_model(normalized_sales, product_id)
            
            # Detect trend
            trend_analysis = self.trend_detector.analyze_trend(
                normalized_sales, 
                product_id
            )
            
            # Prepare features for prediction
            current_features = {
                'days_since_start': 60,
                'ma_7': trend_analysis['moving_averages'].get('ma_7', 0),
                'ma_14': trend_analysis['moving_averages'].get('ma_14', 0),
                'trend_7': trend_analysis.get('growth_rate', 0) / 100,
                'velocity_7': trend_analysis['moving_averages'].get('ma_7', 0)
            }
            
            # Predict future demand
            demand_forecast = self.forecaster.predict_demand(
                product_id,
                days_ahead=30,
                current_features=current_features
            )
            
            # Generate recommendation
            recommendation = self._generate_recommendation(
                item,
                demand_forecast,
                trend_analysis,
                training_result
            )
            
            if recommendation:
                recommendations.append(recommendation)
                
                # Record prediction for feedback loop
                self.feedback_learner.record_prediction(
                    product_id=product_id,
                    product_name=recommendation['product'],
                    predicted_demand=recommendation['predicted_demand_30_days'],
                    current_stock=recommendation['current_stock'],
                    recommendation=recommendation['recommendation'],
                    suggested_quantity=recommendation['suggested_quantity']
                )
        
        # Save trained models
        self.forecaster.save_models()
        
        # Sort by recommendation score (descending)
        recommendations.sort(
            key=lambda x: (
                x['confidence'],
                x.get('_priority_score', 0)
            ),
            reverse=True
        )
        
        return recommendations[:top_n]
    
    def _normalize_sales(self, sales_data: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """
        Normalize sales data for ML processing
        """
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
    
    def _generate_recommendation(
        self,
        inventory_item: Dict[str, Any],
        demand_forecast: Dict[str, Any],
        trend_analysis: Dict[str, Any],
        training_result: Dict[str, Any]
    ) -> Dict[str, Any]:
        """
        Generate smart recommendation with confidence score
        """
        # Extract data
        product_name = inventory_item.get('name', 'Unknown')
        current_stock = inventory_item.get('quantity', 0)
        reorder_point = inventory_item.get('reorderPoint', 0)
        price = inventory_item.get('price', 0)
        purchase_cost = inventory_item.get('purchaseCost', 0)
        
        predicted_demand = demand_forecast.get('predicted_demand_total', 0)
        forecast_confidence = demand_forecast.get('confidence', 50)
        
        trend_direction = trend_analysis.get('trend_direction', 'stable')
        trend_strength = trend_analysis.get('trend_strength', 'weak')
        growth_rate = trend_analysis.get('growth_rate', 0)
        
        # Calculate metrics
        profit_margin = (price - purchase_cost) / price if price > 0 else 0
        
        # Calculate stock gap
        safety_stock = max(reorder_point, math.ceil(predicted_demand / 30 * 7))  # 7-day buffer
        target_stock = math.ceil(predicted_demand + safety_stock)
        stock_gap = target_stock - current_stock
        
        # Calculate coverage days
        daily_demand = predicted_demand / 30
        coverage_days = current_stock / daily_demand if daily_demand > 0 else 999
        
        # Get adaptive weights
        weights = self.feedback_learner.get_current_weights()
        
        # Calculate priority score using adaptive weights
        demand_score = min(1.0, predicted_demand / 50)  # Normalize to 0-1
        gap_score = min(1.0, max(0, stock_gap) / target_stock) if target_stock > 0 else 0
        trend_score = self._trend_to_score(trend_direction, trend_strength, growth_rate)
        margin_score = profit_margin
        
        priority_score = (
            weights['predicted_demand'] * demand_score +
            weights['stock_gap'] * gap_score +
            weights['trend'] * trend_score +
            weights['margin'] * margin_score
        )
        
        # Determine recommendation type
        recommendation_type, suggested_quantity = self._determine_recommendation(
            current_stock,
            predicted_demand,
            stock_gap,
            trend_direction,
            coverage_days
        )
        
        # Calculate overall confidence
        confidence = self._calculate_confidence(
            forecast_confidence,
            trend_analysis.get('confidence', 50),
            training_result
        )
        
        # Generate explanation
        reason = self._generate_reason(
            recommendation_type,
            trend_direction,
            trend_strength,
            growth_rate,
            stock_gap,
            coverage_days,
            predicted_demand
        )
        
        # Extract brand and category
        brand = self._extract_brand(product_name)
        category = inventory_item.get('category', {})
        if isinstance(category, dict):
            category_name = category.get('name', 'Unknown')
        else:
            category_name = str(category) if category else 'Unknown'
        
        return {
            'product': product_name,
            'brand': brand,
            'category': category_name,
            'recommendation': recommendation_type,
            'suggested_quantity': suggested_quantity,
            'confidence': confidence,
            'reason': reason,
            'predicted_demand_30_days': round(predicted_demand, 1),
            'current_stock': current_stock,
            'target_stock': target_stock,
            'coverage_days': round(coverage_days, 1),
            'trend': {
                'direction': trend_direction,
                'strength': trend_strength,
                'growth_rate': growth_rate
            },
            'profit_margin': round(profit_margin * 100, 1),
            '_priority_score': priority_score  # Internal use
        }
    
    def _trend_to_score(
        self, 
        direction: str, 
        strength: str, 
        growth_rate: float
    ) -> float:
        """
        Convert trend to score (0-1)
        """
        if direction == 'increasing':
            if strength == 'strong':
                return 1.0
            elif strength == 'moderate':
                return 0.7
            else:
                return 0.5
        elif direction == 'decreasing':
            if strength == 'strong':
                return 0.0
            elif strength == 'moderate':
                return 0.3
            else:
                return 0.5
        else:  # stable
            return 0.5
    
    def _determine_recommendation(
        self,
        current_stock: int,
        predicted_demand: float,
        stock_gap: int,
        trend_direction: str,
        coverage_days: float
    ) -> tuple:
        """
        Determine recommendation type and quantity
        
        Logic:
        - REORDER: Stock below target or low coverage
        - HOLD: Stock adequate for demand
        - REDUCE_STOCK: Excess stock with decreasing trend
        """
        # Critical shortage
        if current_stock == 0 or coverage_days < 7:
            return 'REORDER', max(stock_gap, math.ceil(predicted_demand))
        
        # Low stock with increasing trend
        if stock_gap > 0 and trend_direction == 'increasing':
            return 'REORDER', stock_gap
        
        # Low stock coverage
        if coverage_days < 21:
            return 'REORDER', max(0, stock_gap)
        
        # Excess stock with decreasing trend
        if coverage_days > 60 and trend_direction == 'decreasing':
            excess = current_stock - math.ceil(predicted_demand * 1.5)
            return 'REDUCE_STOCK', max(0, excess)
        
        # Adequate stock
        return 'HOLD', 0
    
    def _calculate_confidence(
        self,
        forecast_confidence: int,
        trend_confidence: int,
        training_result: Dict[str, Any]
    ) -> int:
        """
        Calculate overall confidence score (0-100)
        """
        # Weighted average of confidences
        confidence = (
            forecast_confidence * 0.5 +
            trend_confidence * 0.3 +
            (training_result.get('train_score', 0.5) * 100) * 0.2
        )
        
        # Penalize if insufficient data
        if training_result.get('status') == 'insufficient_data':
            confidence *= 0.5
        
        return min(100, max(0, int(confidence)))
    
    def _generate_reason(
        self,
        recommendation_type: str,
        trend_direction: str,
        trend_strength: str,
        growth_rate: float,
        stock_gap: int,
        coverage_days: float,
        predicted_demand: float
    ) -> str:
        """
        Generate human-readable explanation
        """
        reasons = []
        
        # Trend
        if trend_direction == 'increasing':
            reasons.append(f"{trend_strength.capitalize()} increasing demand trend ({growth_rate:+.1f}%)")
        elif trend_direction == 'decreasing':
            reasons.append(f"{trend_strength.capitalize()} decreasing demand trend ({growth_rate:+.1f}%)")
        
        # Stock situation
        if stock_gap > 0:
            reasons.append(f"stock below target by {stock_gap} units")
        elif coverage_days < 14:
            reasons.append(f"only {coverage_days:.0f} days of stock remaining")
        elif coverage_days > 60:
            reasons.append(f"excess stock ({coverage_days:.0f} days coverage)")
        
        # Demand forecast
        if predicted_demand > 0:
            reasons.append(f"predicted demand: {predicted_demand:.0f} units in 30 days")
        
        if not reasons:
            reasons.append("maintaining optimal stock levels")
        
        return "Recommended because " + ", ".join(reasons) + "."
    
    def _extract_brand(self, product_name: str) -> str:
        """
        Extract brand from product name
        """
        known_brands = [
            "Apple", "Samsung", "Dell", "HP", "Lenovo", "Asus", 
            "Acer", "Microsoft", "Google", "Huawei", "Xiaomi", "Oppo"
        ]
        
        upper_name = (product_name or "").upper()
        for brand in known_brands:
            if brand.upper() in upper_name:
                return brand
        
        return "Generic"
    
    def validate_and_learn(self, actual_sales: List[Dict[str, Any]]) -> Dict[str, Any]:
        """
        Validate predictions and trigger learning
        """
        return self.feedback_learner.validate_predictions(actual_sales)
    
    def get_performance_metrics(self) -> Dict[str, Any]:
        """
        Get system performance metrics
        """
        return self.feedback_learner.get_performance_summary()
