# smartfix/AI_BACKEND/api/customer_demand.py
from fastapi import APIRouter, HTTPException
from datetime import datetime
from collections import Counter
import requests
import os
from typing import List, Dict, Any

router = APIRouter()

# System Backend URL
SYSTEM_BACKEND_URL = (
    os.getenv("SYSTEM_BACKEND_URL")
    or os.getenv("JAVA_BACKEND_URL")
    or "http://localhost:8080"
)


def fetch_customer_requests() -> List[Dict]:
    """Fetch customer product requests from Java backend"""
    try:
        response = requests.get(f'{SYSTEM_BACKEND_URL}/api/customer-requests/statistics', timeout=10)
        if response.status_code == 200:
            data = response.json()
            return data.get('statistics', [])
        return []
    except Exception as e:
        print(f"Error fetching customer requests: {e}")
        return []


def analyze_customer_demand(threshold: int = 5) -> List[Dict[str, Any]]:
    """
    Analyze customer demand and generate recommendations for products
    that have been requested above the threshold
    """
    requests_data = fetch_customer_requests()
    
    recommendations = []
    
    for request_stat in requests_data:
        request_count = request_stat.get('requestCount', 0)
        
        # Only recommend if threshold is met
        if request_count >= threshold:
            product_name = request_stat.get('productName', 'Unknown Product')
            brand = request_stat.get('brand', '')
            
            # Calculate priority based on request count
            if request_count >= 10:
                priority = "high"
                recommendation_score = 4.8
            elif request_count >= 7:
                priority = "high"
                recommendation_score = 4.5
            else:  # >= 5
                priority = "high"
                recommendation_score = 4.2
            
            # Generate reason
            reason = (
                f"This device was requested by {request_count} customers while we don't have it "
                f"in our catalog and stock. It seems to be needed by many people in the future."
            )
            
            recommendation = {
                "device": product_name,
                "brand": brand if brand else "Generic",
                "category": "Customer Requested",
                "market_demand": "high",
                "profit_margin": "unknown",
                "recommendation_score": recommendation_score,
                "recommended_quantity": max(request_count, 5),  # At least 5 units
                "reason": reason,
                "request_count": request_count,
                "first_request": request_stat.get('firstRequest'),
                "last_request": request_stat.get('lastRequest'),
                "source": "customer_demand"
            }
            
            recommendations.append(recommendation)
    
    # Sort by request count (highest first)
    recommendations.sort(key=lambda x: x['request_count'], reverse=True)
    
    return recommendations


@router.get("/customer-demand-analysis")
async def get_customer_demand_analysis(threshold: int = 5):
    """
    Analyze customer demand and return products that should be added to inventory
    based on customer requests
    """
    try:
        recommendations = analyze_customer_demand(threshold)
        
        return {
            "success": True,
            "threshold": threshold,
            "total_recommendations": len(recommendations),
            "recommendations": recommendations,
            "analysis_date": datetime.now().isoformat(),
            "message": f"Found {len(recommendations)} products requested by {threshold}+ customers"
        }
    except Exception as e:
        print(f"Error in customer demand analysis: {e}")
        import traceback
        traceback.print_exc()
        raise HTTPException(
            status_code=500,
            detail={
                'success': False,
                'error': str(e),
                'message': 'Failed to analyze customer demand'
            }
        )


@router.get("/customer-demand-summary")
async def get_customer_demand_summary():
    """Get a summary of customer demand statistics"""
    try:
        requests_data = fetch_customer_requests()
        
        total_requests = sum(r.get('requestCount', 0) for r in requests_data)
        total_products = len(requests_data)
        
        # Products by request count ranges
        high_demand = len([r for r in requests_data if r.get('requestCount', 0) >= 10])
        medium_demand = len([r for r in requests_data if 5 <= r.get('requestCount', 0) < 10])
        low_demand = len([r for r in requests_data if r.get('requestCount', 0) < 5])
        
        return {
            "success": True,
            "summary": {
                "total_products_requested": total_products,
                "total_requests": total_requests,
                "high_demand_products": high_demand,  # 10+ requests
                "medium_demand_products": medium_demand,  # 5-9 requests
                "low_demand_products": low_demand,  # < 5 requests
            },
            "top_requested": requests_data[:10] if requests_data else []
        }
    except Exception as e:
        print(f"Error getting customer demand summary: {e}")
        raise HTTPException(
            status_code=500,
            detail={
                'success': False,
                'error': str(e),
                'message': 'Failed to get customer demand summary'
            }
        )
