# smartfix/AI_BACKEND/ml/__init__.py
"""
Machine Learning Module for SmartFix Inventory Intelligence
"""

from .demand_forecaster import DemandForecaster
from .trend_detector import TrendDetector
from .feedback_learner import FeedbackLearner
from .recommendation_engine import RecommendationEngine

__all__ = [
    'DemandForecaster',
    'TrendDetector',
    'FeedbackLearner',
    'RecommendationEngine'
]
