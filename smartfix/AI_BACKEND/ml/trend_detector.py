# smartfix/AI_BACKEND/ml/trend_detector.py
"""
Trend Detection Engine
Analyzes sales patterns to detect increasing, decreasing, or stable demand trends
"""

import numpy as np
from datetime import datetime, timedelta
from typing import Dict, List, Any, Tuple
from collections import defaultdict


class TrendDetector:
    """
    Detects demand trends using statistical methods:
    - Moving averages (7-day, 14-day, 30-day)
    - Growth rate calculation
    - Trend classification
    """
    
    def __init__(self):
        self.trend_thresholds = {
            'strong_increase': 0.15,  # 15% growth
            'moderate_increase': 0.05,  # 5% growth
            'stable': 0.05,  # ±5%
            'moderate_decrease': -0.05,  # -5% decline
            'strong_decrease': -0.15  # -15% decline
        }
    
    def analyze_trend(
        self, 
        sales_history: List[Dict[str, Any]], 
        product_id: int,
        window_days: int = 60
    ) -> Dict[str, Any]:
        """
        Analyze sales trend for a specific product
        
        Returns:
        - trend_direction: 'increasing', 'decreasing', 'stable'
        - trend_strength: 'strong', 'moderate', 'weak'
        - growth_rate: Percentage change
        - moving_averages: 7-day, 14-day, 30-day
        - volatility: Standard deviation of daily sales
        """
        # Filter sales for this product
        product_sales = [
            s for s in sales_history 
            if s.get('product_id') == product_id
        ]
        
        if len(product_sales) < 7:
            return {
                'trend_direction': 'unknown',
                'trend_strength': 'insufficient_data',
                'growth_rate': 0.0,
                'moving_averages': {},
                'volatility': 0.0,
                'confidence': 0
            }
        
        # Create daily sales timeline
        daily_sales = self._aggregate_daily_sales(product_sales, window_days)
        
        if len(daily_sales) < 7:
            return {
                'trend_direction': 'stable',
                'trend_strength': 'weak',
                'growth_rate': 0.0,
                'moving_averages': {},
                'volatility': 0.0,
                'confidence': 30
            }
        
        # Calculate moving averages
        ma_7 = self._moving_average(daily_sales, 7)
        ma_14 = self._moving_average(daily_sales, 14)
        ma_30 = self._moving_average(daily_sales, 30)
        
        # Calculate growth rate (compare recent vs older period)
        growth_rate = self._calculate_growth_rate(daily_sales)
        
        # Calculate volatility
        volatility = np.std(list(daily_sales.values())) if daily_sales else 0.0
        
        # Determine trend direction and strength
        trend_direction, trend_strength = self._classify_trend(growth_rate)
        
        # Calculate confidence based on data quality
        confidence = self._calculate_trend_confidence(
            daily_sales, 
            volatility, 
            len(product_sales)
        )
        
        return {
            'trend_direction': trend_direction,
            'trend_strength': trend_strength,
            'growth_rate': round(growth_rate * 100, 2),  # As percentage
            'moving_averages': {
                'ma_7': round(ma_7, 2),
                'ma_14': round(ma_14, 2),
                'ma_30': round(ma_30, 2)
            },
            'volatility': round(volatility, 2),
            'confidence': confidence,
            'data_points': len(daily_sales)
        }
    
    def _aggregate_daily_sales(
        self, 
        sales: List[Dict[str, Any]], 
        window_days: int
    ) -> Dict[str, float]:
        """
        Aggregate sales by day
        """
        cutoff_date = datetime.now() - timedelta(days=window_days)
        daily_totals = defaultdict(float)
        
        for sale in sales:
            sale_date = sale.get('sale_date')
            if not sale_date:
                continue
            
            if isinstance(sale_date, str):
                try:
                    sale_date = datetime.fromisoformat(sale_date.replace('Z', '+00:00'))
                except:
                    continue
            
            if sale_date < cutoff_date:
                continue
            
            date_key = sale_date.strftime('%Y-%m-%d')
            quantity = sale.get('quantity', 0)
            daily_totals[date_key] += quantity
        
        return dict(daily_totals)
    
    def _moving_average(
        self, 
        daily_sales: Dict[str, float], 
        window: int
    ) -> float:
        """
        Calculate moving average for the most recent period
        """
        if not daily_sales:
            return 0.0
        
        # Get most recent days
        sorted_dates = sorted(daily_sales.keys(), reverse=True)
        recent_values = [daily_sales[date] for date in sorted_dates[:window]]
        
        if not recent_values:
            return 0.0
        
        return sum(recent_values) / len(recent_values)
    
    def _calculate_growth_rate(self, daily_sales: Dict[str, float]) -> float:
        """
        Calculate growth rate by comparing recent period vs older period
        """
        if len(daily_sales) < 14:
            return 0.0
        
        sorted_dates = sorted(daily_sales.keys())
        
        # Split into two periods
        mid_point = len(sorted_dates) // 2
        older_period = sorted_dates[:mid_point]
        recent_period = sorted_dates[mid_point:]
        
        # Calculate averages
        older_avg = sum(daily_sales[d] for d in older_period) / len(older_period)
        recent_avg = sum(daily_sales[d] for d in recent_period) / len(recent_period)
        
        # Calculate growth rate
        if older_avg == 0:
            return 1.0 if recent_avg > 0 else 0.0
        
        growth_rate = (recent_avg - older_avg) / older_avg
        
        return growth_rate
    
    def _classify_trend(self, growth_rate: float) -> Tuple[str, str]:
        """
        Classify trend direction and strength
        """
        if growth_rate >= self.trend_thresholds['strong_increase']:
            return 'increasing', 'strong'
        elif growth_rate >= self.trend_thresholds['moderate_increase']:
            return 'increasing', 'moderate'
        elif growth_rate <= self.trend_thresholds['strong_decrease']:
            return 'decreasing', 'strong'
        elif growth_rate <= self.trend_thresholds['moderate_decrease']:
            return 'decreasing', 'moderate'
        else:
            return 'stable', 'weak'
    
    def _calculate_trend_confidence(
        self, 
        daily_sales: Dict[str, float], 
        volatility: float,
        total_sales: int
    ) -> int:
        """
        Calculate confidence in trend detection (0-100)
        
        Factors:
        - Data points (more is better)
        - Volatility (lower is better)
        - Total sales volume (more is better)
        """
        # Data points score (0-40)
        data_score = min(40, len(daily_sales) * 0.67)
        
        # Volatility score (0-30) - lower volatility = higher confidence
        avg_sales = sum(daily_sales.values()) / len(daily_sales) if daily_sales else 1
        volatility_ratio = volatility / avg_sales if avg_sales > 0 else 1
        volatility_score = max(0, 30 - (volatility_ratio * 30))
        
        # Volume score (0-30)
        volume_score = min(30, total_sales * 0.5)
        
        confidence = int(data_score + volatility_score + volume_score)
        
        return min(100, max(0, confidence))
    
    def detect_seasonality(
        self, 
        sales_history: List[Dict[str, Any]], 
        product_id: int
    ) -> Dict[str, Any]:
        """
        Detect weekly seasonality patterns
        """
        product_sales = [
            s for s in sales_history 
            if s.get('product_id') == product_id
        ]
        
        if len(product_sales) < 14:
            return {
                'has_seasonality': False,
                'pattern': 'insufficient_data'
            }
        
        # Aggregate by day of week
        day_totals = defaultdict(list)
        
        for sale in product_sales:
            sale_date = sale.get('sale_date')
            if not sale_date:
                continue
            
            if isinstance(sale_date, str):
                try:
                    sale_date = datetime.fromisoformat(sale_date.replace('Z', '+00:00'))
                except:
                    continue
            
            day_of_week = sale_date.strftime('%A')
            quantity = sale.get('quantity', 0)
            day_totals[day_of_week].append(quantity)
        
        # Calculate average per day
        day_averages = {
            day: sum(quantities) / len(quantities)
            for day, quantities in day_totals.items()
        }
        
        if not day_averages:
            return {
                'has_seasonality': False,
                'pattern': 'no_data'
            }
        
        # Check if there's significant variation
        avg_all = sum(day_averages.values()) / len(day_averages)
        max_day = max(day_averages.values())
        min_day = min(day_averages.values())
        
        variation = (max_day - min_day) / avg_all if avg_all > 0 else 0
        
        has_seasonality = variation > 0.3  # 30% variation threshold
        
        # Find peak day
        peak_day = max(day_averages, key=day_averages.get)
        
        return {
            'has_seasonality': has_seasonality,
            'pattern': 'weekly' if has_seasonality else 'none',
            'peak_day': peak_day,
            'day_averages': {k: round(v, 2) for k, v in day_averages.items()},
            'variation_coefficient': round(variation, 2)
        }
