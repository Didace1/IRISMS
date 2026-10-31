# smartfix/AI_BACKEND/api/inventory_v3.py
"""
Production-Grade Inventory AI API - Version 3.0
Real time-series forecasting with Prophet + Global Model + Adaptive Optimization
"""

from fastapi import APIRouter, HTTPException, BackgroundTasks
from datetime import datetime
from pathlib import Path
import requests
import os
from typing import List, Dict, Any

try:
    from ml_v3.production_engine import ProductionEngine
    V3_AVAILABLE = True
except ImportError as _v3_err:
    V3_AVAILABLE = False
    print(f"WARNING: V3 ML engine not available ({_v3_err}). Install prophet, lightgbm, statsmodels, scipy.")

router = APIRouter()

# System Backend URL
SYSTEM_BACKEND_URL = (
    os.getenv("SYSTEM_BACKEND_URL")
    or os.getenv("JAVA_BACKEND_URL")
    or "http://localhost:8080"
)

# Initialize Production Engine (only if dependencies are available)
MODEL_DIR = Path(__file__).resolve().parent.parent / "models_v3"
production_engine = ProductionEngine(MODEL_DIR) if V3_AVAILABLE else None


def fetch_sales_from_backend() -> List[Dict]:
    """Fetch sales data"""
    try:
        response = requests.get(f'{SYSTEM_BACKEND_URL}/api/sales', timeout=10)
        if response.status_code == 200:
            return response.json()
        return []
    except Exception as e:
        print(f"Error fetching sales: {e}")
        return []


def fetch_inventory_from_backend() -> List[Dict]:
    """Fetch inventory data"""
    try:
        response = requests.get(f'{SYSTEM_BACKEND_URL}/api/inventory', timeout=10)
        if response.status_code == 200:
            return response.json()
        return []
    except Exception as e:
        print(f"Error fetching inventory: {e}")
        return []


@router.post("/v3/train")
async def train_models(background_tasks: BackgroundTasks):
    """
    🎓 Train Production Models
    """
    if not V3_AVAILABLE:
        return {
            "success": False,
            "version": "3.0",
            "message": "V3 ML engine not available. Run: pip install prophet lightgbm statsmodels scipy"
        }
    try:
        sales_data = fetch_sales_from_backend()
        inventory_data = fetch_inventory_from_backend()
        
        if not inventory_data:
            return {
                "success": False,
                "message": "No inventory data available"
            }
        
        # Train models
        result = production_engine.train_models(sales_data, inventory_data)
        
        return {
            "success": True,
            "message": "Models trained successfully",
            "training_results": result,
            "timestamp": datetime.now().isoformat()
        }
        
    except Exception as e:
        print(f"Error training models: {e}")
        import traceback
        traceback.print_exc()
        raise HTTPException(
            status_code=500,
            detail={'success': False, 'error': str(e)}
        )


@router.get("/v3/inventory-recommendations")
async def get_production_recommendations():
    """
    🚀 Production-Grade AI Recommendations (V3)
    """
    if not V3_AVAILABLE:
        return {
            "success": False,
            "version": "3.0",
            "message": "V3 ML engine not available. Run: pip install prophet lightgbm statsmodels scipy"
        }
    try:
        sales_data = fetch_sales_from_backend()
        inventory_data = fetch_inventory_from_backend()
        
        if not inventory_data:
            return {
                "success": True,
                "version": "3.0",
                "data": {
                    "recommendations": [],
                    "insights": ["No inventory data available"],
                    "system_status": {
                        "engine": "production",
                        "backend_connected": False
                    }
                }
            }
        
        # Normalize sales
        normalized_sales = production_engine._normalize_sales(sales_data)
        
        # Generate recommendations
        recommendations = []
        
        for item in inventory_data[:10]:  # Top 10 for now
            product_id = item.get('id')
            if not product_id:
                continue
            
            # Generate forecast
            forecast = production_engine.generate_forecast(
                product_id,
                item,
                normalized_sales,
                days_ahead=30
            )
            
            if forecast.get('status') != 'success':
                continue
            
            # Generate recommendation
            recommendation = production_engine.generate_recommendation(
                item,
                forecast,
                normalized_sales
            )
            
            recommendations.append(recommendation)
        
        # Sort by priority
        recommendations.sort(
            key=lambda x: (x['confidence'], x.get('_priority_score', 0)),
            reverse=True
        )
        
        # Generate insights
        insights = generate_insights_v3(recommendations)
        
        # Get performance
        performance = production_engine.get_performance_metrics()
        
        return {
            "success": True,
            "version": "3.0",
            "data": {
                "recommendations": recommendations,
                "insights": insights,
                "analysis_date": datetime.now().isoformat(),
                "total_recommendations": len(recommendations),
                "system_status": {
                    "engine": "production",
                    "forecasting": "Prophet + LightGBM",
                    "optimization": "scipy_minimize",
                    "backend_connected": True,
                    "message": "Production-grade time-series forecasting active"
                },
                "performance_metrics": performance
            }
        }
        
    except Exception as e:
        print(f"Error generating recommendations: {e}")
        import traceback
        traceback.print_exc()
        raise HTTPException(
            status_code=500,
            detail={'success': False, 'error': str(e)}
        )


@router.post("/v3/validate")
async def validate_and_optimize():
    """
    🔁 Validate Predictions & Optimize Weights
    """
    if not V3_AVAILABLE:
        return {"success": False, "version": "3.0", "message": "V3 ML engine not available."}
    try:
        sales_data = fetch_sales_from_backend()
        
        if not sales_data:
            return {
                "success": False,
                "message": "No sales data for validation"
            }
        
        # Trigger optimization
        result = production_engine.validate_and_learn(sales_data)
        
        return {
            "success": True,
            "message": "Validation and optimization complete",
            "optimization_results": result,
            "timestamp": datetime.now().isoformat()
        }
        
    except Exception as e:
        print(f"Error in validation: {e}")
        raise HTTPException(
            status_code=500,
            detail={'success': False, 'error': str(e)}
        )


@router.get("/v3/performance")
async def get_performance():
    """
    📊 Get System Performance Metrics
    """
    if not V3_AVAILABLE:
        return {"success": False, "version": "3.0", "message": "V3 ML engine not available."}
    try:
        metrics = production_engine.get_performance_metrics()
        
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


@router.get("/v3/test")
async def test_system():
    """
    Test V3 system status
    """
    if not V3_AVAILABLE:
        return {
            "status": "unavailable",
            "version": "3.0",
            "message": "V3 ML engine not available. Run: pip install prophet lightgbm statsmodels scipy"
        }
    sales = fetch_sales_from_backend()
    inventory = fetch_inventory_from_backend()
    performance = production_engine.get_performance_metrics()
    
    return {
        "status": "online",
        "version": "3.0",
        "engine": "production",
        "features": {
            "time_series_forecasting": "Prophet (Facebook)",
            "global_model": "LightGBM",
            "optimization": "scipy.optimize.minimize",
            "uncertainty_quantification": "Prediction Intervals (95% CI)",
            "anomaly_detection": "Prophet-based",
            "adaptive_learning": "Real optimization (not rule-based)"
        },
        "data_status": {
            "sales_available": len(sales),
            "inventory_available": len(inventory),
            "backend_connected": len(inventory) > 0
        },
        "performance": performance,
        "timestamp": datetime.now().isoformat()
    }


def generate_insights_v3(recommendations: List[Dict[str, Any]]) -> List[str]:
    """Generate insights from V3 recommendations"""
    insights = []
    
    if not recommendations:
        insights.append("📊 No actionable recommendations. Inventory levels optimal.")
        return insights
    
    # Reorder insights
    reorder = [r for r in recommendations if r['recommendation'] == 'REORDER']
    if reorder:
        high_conf = [r for r in reorder if r['confidence'] >= 80]
        if high_conf:
            insights.append(
                f"🎯 {len(high_conf)} high-confidence reorder recommendations (Prophet forecasts)."
            )
    
    # Trend insights
    increasing = [r for r in recommendations if r['trend'] == 'increasing']
    if increasing:
        insights.append(
            f"📈 {len(increasing)} products showing increasing demand trends."
        )
    
    # Uncertainty insights
    avg_conf = sum(r['confidence'] for r in recommendations) / len(recommendations)
    insights.append(
        f"🧠 Average forecast confidence: {avg_conf:.0f}% (95% prediction intervals)."
    )
    
    # Model usage
    prophet_count = len([r for r in recommendations if 'Prophet' in r.get('model_type', '')])
    if prophet_count > 0:
        insights.append(
            f"⚡ {prophet_count} forecasts using Prophet time-series models."
        )
    
    return insights
