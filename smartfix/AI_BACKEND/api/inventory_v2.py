# smartfix/AI_BACKEND/api/inventory_v2.py
"""
Upgraded Inventory AI API - Version 2.0
Professional-grade ML-powered inventory intelligence
"""

from fastapi import APIRouter, HTTPException
from datetime import datetime
from pathlib import Path
import requests
import os
from typing import List, Dict, Any

try:
    from ml.recommendation_engine import RecommendationEngine
    V2_AVAILABLE = True
except ImportError as _v2_err:
    V2_AVAILABLE = False
    print(f"WARNING: V2 ML engine not available ({_v2_err}). Install scikit-learn, numpy, pandas.")

router = APIRouter()

# System Backend URL
SYSTEM_BACKEND_URL = (
    os.getenv("SYSTEM_BACKEND_URL")
    or os.getenv("JAVA_BACKEND_URL")
    or "http://localhost:8080"
)

# Initialize ML Engine (only if dependencies are available)
MODEL_DIR = Path(__file__).resolve().parent.parent / "models"
recommendation_engine = RecommendationEngine(MODEL_DIR) if V2_AVAILABLE else None


def fetch_sales_from_backend() -> List[Dict]:
    """Fetch sales data from Java backend"""
    try:
        response = requests.get(f'{SYSTEM_BACKEND_URL}/api/sales', timeout=10)
        if response.status_code == 200:
            return response.json()
        return []
    except Exception as e:
        print(f"Error fetching sales: {e}")
        return []


def fetch_inventory_from_backend() -> List[Dict]:
    """Fetch inventory data from Java backend"""
    try:
        response = requests.get(f'{SYSTEM_BACKEND_URL}/api/inventory', timeout=10)
        if response.status_code == 200:
            return response.json()
        return []
    except Exception as e:
        print(f"Error fetching inventory: {e}")
        return []


@router.get("/v2/inventory-recommendations")
async def get_ml_recommendations():
    """
    🚀 UPGRADED AI Inventory Recommendations (V2)
    """
    if not V2_AVAILABLE:
        return {
            "success": False,
            "version": "2.0",
            "message": "V2 ML engine not available. Run: pip install scikit-learn numpy pandas"
        }
    try:
        # Fetch data
        sales_data = fetch_sales_from_backend()
        inventory_data = fetch_inventory_from_backend()
        
        if not inventory_data:
            return {
                "success": True,
                "version": "2.0",
                "data": {
                    "recommendations": [],
                    "insights": ["No inventory data available from system backend."],
                    "system_status": {
                        "ml_engine": "ready",
                        "java_backend_connected": False,
                        "message": "Inventory endpoint returned no data."
                    }
                }
            }
        
        # Generate ML-powered recommendations
        recommendations = recommendation_engine.generate_recommendations(
            sales_data=sales_data,
            inventory_data=inventory_data,
            top_n=10
        )
        
        # Generate insights
        insights = generate_insights_v2(recommendations, sales_data)
        
        # Get performance metrics
        performance = recommendation_engine.get_performance_metrics()
        
        return {
            "success": True,
            "version": "2.0",
            "data": {
                "recommendations": recommendations,
                "insights": insights,
                "analysis_date": datetime.now().isoformat(),
                "total_recommendations": len(recommendations),
                "system_status": {
                    "ml_engine": "active",
                    "java_backend_connected": True,
                    "sales_data_available": len(sales_data) > 0,
                    "inventory_data_available": len(inventory_data) > 0,
                    "forecasting_models_trained": True,
                    "adaptive_learning_enabled": True,
                    "message": "Using ML-powered forecasting with adaptive learning."
                },
                "performance_metrics": performance
            }
        }
        
    except Exception as e:
        print(f"Error generating ML recommendations: {e}")
        import traceback
        traceback.print_exc()
        raise HTTPException(
            status_code=500,
            detail={
                'success': False,
                'error': str(e),
                'message': 'Failed to generate ML recommendations. Ensure Java backend is running.'
            }
        )


@router.post("/v2/inventory-recommendations/validate")
async def validate_predictions():
    """
    🔁 Validate past predictions and trigger learning
    """
    if not V2_AVAILABLE:
        return {"success": False, "version": "2.0", "message": "V2 ML engine not available."}
    try:
        sales_data = fetch_sales_from_backend()
        
        if not sales_data:
            return {
                "success": False,
                "message": "No sales data available for validation"
            }
        
        # Trigger validation and learning
        validation_results = recommendation_engine.validate_and_learn(sales_data)
        
        return {
            "success": True,
            "message": "Predictions validated and weights adjusted",
            "validation_results": validation_results
        }
        
    except Exception as e:
        print(f"Error validating predictions: {e}")
        raise HTTPException(
            status_code=500,
            detail={'success': False, 'error': str(e)}
        )


@router.get("/v2/performance-metrics")
async def get_performance_metrics():
    """
    📊 Get ML system performance metrics
    """
    if not V2_AVAILABLE:
        return {"success": False, "version": "2.0", "message": "V2 ML engine not available."}
    try:
        metrics = recommendation_engine.get_performance_metrics()
        
        return {
            "success": True,
            "metrics": metrics,
            "timestamp": datetime.now().isoformat()
        }
        
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail={'success': False, 'error': str(e)}
        )


def generate_insights_v2(
    recommendations: List[Dict[str, Any]], 
    sales_data: List[Dict]
) -> List[str]:
    """
    Generate intelligent insights from ML recommendations
    """
    insights = []
    
    if not recommendations:
        insights.append("📊 No actionable recommendations at this time. Inventory levels are optimal.")
        return insights
    
    # Count recommendation types
    reorder_count = sum(1 for r in recommendations if r['recommendation'] == 'REORDER')
    hold_count = sum(1 for r in recommendations if r['recommendation'] == 'HOLD')
    reduce_count = sum(1 for r in recommendations if r['recommendation'] == 'REDUCE_STOCK')
    
    # Reorder insights
    if reorder_count > 0:
        high_confidence = [r for r in recommendations if r['recommendation'] == 'REORDER' and r['confidence'] >= 80]
        if high_confidence:
            insights.append(
                f"🎯 {len(high_confidence)} high-confidence reorder recommendations detected. "
                f"Prioritize: {', '.join([r['product'] for r in high_confidence[:3]])}."
            )
        else:
            insights.append(
                f"⚠️ {reorder_count} products need restocking based on ML demand forecasts."
            )
    
    # Trend insights
    increasing_trends = [r for r in recommendations if r['trend']['direction'] == 'increasing']
    if increasing_trends:
        top_growing = sorted(increasing_trends, key=lambda x: x['trend']['growth_rate'], reverse=True)[:2]
        growing_names = ', '.join([
            r['product'] + ' (+' + str(round(r['trend']['growth_rate'], 1)) + '%)'
            for r in top_growing
        ])
        insights.append(
            "📈 Strong growth detected: " + growing_names + ". Consider increasing stock levels."
        )
    
    decreasing_trends = [r for r in recommendations if r['trend']['direction'] == 'decreasing']
    if decreasing_trends:
        insights.append(
            f"📉 {len(decreasing_trends)} products showing declining demand. Review pricing and promotions."
        )
    
    # Coverage insights
    critical_coverage = [r for r in recommendations if r.get('coverage_days', 999) < 7]
    if critical_coverage:
        insights.append(
            f"🚨 Critical: {len(critical_coverage)} products have less than 7 days of stock remaining. "
            f"Immediate action required."
        )
    
    # Confidence insights
    avg_confidence = sum(r['confidence'] for r in recommendations) / len(recommendations)
    insights.append(
        f"🧠 ML model confidence: {avg_confidence:.0f}%. "
        f"{'High accuracy expected' if avg_confidence >= 75 else 'Moderate accuracy - monitor closely'}."
    )
    
    # Total predicted demand
    total_predicted = sum(r['predicted_demand_30_days'] for r in recommendations)
    insights.append(
        f"📊 Total predicted demand (30 days): {total_predicted:.0f} units across top recommendations."
    )
    
    return insights


@router.get("/v2/test")
async def test_ml_system():
    """
    Test ML system status
    """
    if not V2_AVAILABLE:
        return {"status": "unavailable", "version": "2.0", "message": "V2 ML engine not available. Run: pip install scikit-learn numpy pandas"}
    sales = fetch_sales_from_backend()
    inventory = fetch_inventory_from_backend()
    performance = recommendation_engine.get_performance_metrics()
    
    return {
        "status": "online",
        "version": "2.0",
        "ml_engine": "active",
        "features": {
            "demand_forecasting": "Random Forest",
            "trend_detection": "Moving Average + Growth Rate",
            "adaptive_learning": "Enabled",
            "confidence_scoring": "Enabled"
        },
        "data_status": {
            "sales_available": len(sales),
            "inventory_available": len(inventory),
            "backend_connected": len(inventory) > 0
        },
        "performance": performance,
        "timestamp": datetime.now().isoformat()
    }
