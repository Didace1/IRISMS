# smartfix/AI_BACKEND/api/inventory.py
from fastapi import APIRouter, HTTPException
from datetime import datetime, timedelta
from collections import Counter, defaultdict
import requests
import os
import json
import math
from pathlib import Path
from typing import List, Dict, Any, Optional

# Import customer demand analysis
from api.customer_demand import analyze_customer_demand

router = APIRouter()

# System Backend URL
SYSTEM_BACKEND_URL = (
    os.getenv("SYSTEM_BACKEND_URL")
    or os.getenv("JAVA_BACKEND_URL")
    or "http://localhost:8080"
)

MODEL_DIR = Path(__file__).resolve().parent.parent / "models"
MODEL_ARTIFACT = MODEL_DIR / "inventory_recommender_model.json"


def _to_float(value: Any, default: float = 0.0) -> float:
    try:
        return float(value)
    except (TypeError, ValueError):
        return default


def _to_int(value: Any, default: int = 0) -> int:
    try:
        return int(value)
    except (TypeError, ValueError):
        return default


def _parse_datetime(value: Any) -> Optional[datetime]:
    if not value:
        return None
    if isinstance(value, datetime):
        return value
    if isinstance(value, str):
        try:
            return datetime.fromisoformat(value.replace("Z", "+00:00"))
        except ValueError:
            return None
    return None


def _get_category_name(raw_category: Any) -> str:
    if isinstance(raw_category, dict):
        return str(raw_category.get("name") or "Unknown")
    if isinstance(raw_category, str) and raw_category.strip():
        return raw_category.strip()
    return "Unknown"


def _extract_brand(product_name: str) -> str:
    known_brands = ["Apple", "Samsung", "Dell", "HP", "Lenovo", "Asus", "Acer", "Microsoft", "Google", "Huawei"]
    upper_name = (product_name or "").upper()
    for brand in known_brands:
        if brand.upper() in upper_name:
            return brand
    return "Generic"


def fetch_sales_from_system_backend(days: int = 30) -> List[Dict]:
    """Fetch sales data from System Backend"""
    try:
        response = requests.get(f'{SYSTEM_BACKEND_URL}/api/sales', timeout=10)
        if response.status_code == 200:
            all_sales = response.json()
            
            # Filter by date range
            cutoff_date = datetime.now() - timedelta(days=days)
            recent_sales = []
            
            for sale in all_sales:
                if sale.get('createdAt'):
                    sale_date = _parse_datetime(sale.get("createdAt"))
                    if sale_date and sale_date >= cutoff_date:
                        recent_sales.append(sale)
            
            return recent_sales
        return []
    except Exception as e:
        print(f"Error fetching sales: {e}")
        return []


def fetch_inventory_from_system_backend() -> List[Dict]:
    """Fetch inventory data from System Backend"""
    try:
        response = requests.get(f'{SYSTEM_BACKEND_URL}/api/inventory', timeout=10)
        if response.status_code == 200:
            return response.json()
        return []
    except Exception as e:
        print(f"Error fetching inventory: {e}")
        return []


def _normalize_inventory_item(item: Dict[str, Any]) -> Dict[str, Any]:
    name = str(item.get("name") or "Unknown Device")
    category = _get_category_name(item.get("category"))
    price = _to_float(item.get("price"), 0.0)
    purchase_cost = _to_float(item.get("purchaseCost"), 0.0)
    
    # If purchase cost is 0, estimate it as 70% of selling price
    if purchase_cost == 0.0 and price > 0.0:
        purchase_cost = price * 0.70  # Assume 30% margin if no data
    
    return {
        "id": item.get("id"),
        "name": name,
        "brand": _extract_brand(name),
        "category": category,
        "quantity": _to_int(item.get("quantity"), 0),
        "reorder_point": _to_int(item.get("reorderPoint"), 0),
        "price": price,
        "purchase_cost": purchase_cost,
    }


def _normalize_sale_items(sales_data: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    normalized = []
    for sale in sales_data:
        sale_date = _parse_datetime(sale.get("createdAt"))
        for raw_item in sale.get("items", []):
            inv = raw_item.get("inventoryItem") if isinstance(raw_item, dict) else None
            if inv is None:
                continue
            name = str(inv.get("name") or "Unknown Device")
            category = _get_category_name(inv.get("category"))
            quantity = _to_int(raw_item.get("quantity"), 0)
            unit_price = _to_float(raw_item.get("unitPrice"), _to_float(inv.get("price"), 0.0))
            normalized.append(
                {
                    "product_id": inv.get("id"),
                    "name": name,
                    "brand": _extract_brand(name),
                    "category": category,
                    "quantity": max(quantity, 0),
                    "unit_price": unit_price,
                    "sale_date": sale_date,
                }
            )
    return normalized


def analyze_sales_trends(sales_data: List[Dict]) -> Dict[str, Any]:
    if not sales_data:
        return {
            "top_categories": {},
            "top_brands": {},
            "top_products": {},
            "total_recent_sales": 0,
            "total_revenue": 0,
            "avg_sale_value": 0,
        }

    categories = Counter()
    brands = Counter()
    products = Counter()
    total_revenue = 0.0
    parsed_items = _normalize_sale_items(sales_data)

    for item in parsed_items:
        categories[item["category"]] += item["quantity"]
        brands[item["brand"]] += item["quantity"]
        products[item["name"]] += item["quantity"]
        total_revenue += item["unit_price"] * item["quantity"]

    return {
        "top_categories": dict(categories.most_common(10)),
        "top_brands": dict(brands.most_common(10)),
        "top_products": dict(products.most_common(10)),
        "total_recent_sales": len(sales_data),
        "total_revenue": round(total_revenue, 2),
        "avg_sale_value": round(total_revenue / len(sales_data), 2) if sales_data else 0,
    }


def _train_recommendation_model(
    sales_data: List[Dict[str, Any]],
    inventory_data: List[Dict[str, Any]],
    days: int = 30,
) -> Dict[str, Any]:
    """Build trained profiles from real sales + inventory and persist them."""
    MODEL_DIR.mkdir(parents=True, exist_ok=True)

    inventory_items = [_normalize_inventory_item(item) for item in inventory_data]
    inventory_by_id = {item["id"]: item for item in inventory_items if item.get("id") is not None}
    sale_items = _normalize_sale_items(sales_data)

    product_units_sold = Counter()
    product_revenue = defaultdict(float)
    product_sale_days = defaultdict(set)

    for sale_item in sale_items:
        product_id = sale_item.get("product_id")
        if product_id is None:
            continue
        product_units_sold[product_id] += sale_item["quantity"]
        product_revenue[product_id] += sale_item["quantity"] * sale_item["unit_price"]
        if sale_item.get("sale_date"):
            product_sale_days[product_id].add(sale_item["sale_date"].date().isoformat())

    category_units = Counter()
    brand_units = Counter()
    for sale_item in sale_items:
        category_units[sale_item["category"]] += sale_item["quantity"]
        brand_units[sale_item["brand"]] += sale_item["quantity"]

    velocity_values = []
    margin_values = []
    profiles = []

    for item in inventory_items:
        pid = item["id"]
        sold_units = product_units_sold.get(pid, 0)
        daily_velocity = sold_units / max(days, 1)
        sale_frequency = len(product_sale_days.get(pid, set())) / max(days, 1)
        current_stock = item["quantity"]
        reorder_point = item["reorder_point"]
        selling_price = item["price"]
        purchase_cost = item["purchase_cost"]
        unit_margin = selling_price - purchase_cost
        margin_ratio = (unit_margin / selling_price) if selling_price > 0 else 0.0
        coverage_days = (current_stock / daily_velocity) if daily_velocity > 0 else 999.0

        # Target stock = 21-day forecast + safety stock (minimum reorder point)
        forecast_qty = daily_velocity * 21
        safety_stock = max(reorder_point, math.ceil(daily_velocity * 7))
        target_stock = max(0, math.ceil(forecast_qty + safety_stock))
        stock_gap = target_stock - current_stock

        velocity_values.append(daily_velocity)
        margin_values.append(margin_ratio)

        profiles.append(
            {
                "id": pid,
                "device": item["name"],
                "brand": item["brand"],
                "category": item["category"],
                "current_stock": current_stock,
                "reorder_point": reorder_point,
                "units_sold": sold_units,
                "revenue": round(product_revenue.get(pid, 0.0), 2),
                "daily_velocity": daily_velocity,
                "sale_frequency": sale_frequency,
                "margin_ratio": margin_ratio,
                "unit_margin": unit_margin,
                "coverage_days": coverage_days,
                "target_stock": target_stock,
                "stock_gap": stock_gap,
                "purchase_cost": purchase_cost,
            }
        )

    max_velocity = max(velocity_values) if velocity_values else 1.0
    max_margin = max(margin_values) if margin_values else 1.0
    
    # AI Model Weights (shown as percentages for clarity)
    weights = {
        "velocity": 0.45,        # 45% - Sales velocity (how fast items sell)
        "stock_gap": 0.35,       # 35% - Stock shortage (how much is needed)
        "sale_frequency": 0.15,  # 15% - Sale frequency (how often sold)
        "margin": 0.05,          # 5% - Profit margin (profitability)
    }
    
    # Weight percentages for display/documentation
    weight_percentages = {
        "velocity": "45%",
        "stock_gap": "35%",
        "sale_frequency": "15%",
        "margin": "5%",
    }

    # Fit recommendation score from normalized real-data features.
    for profile in profiles:
        velocity_component = profile["daily_velocity"] / max(max_velocity, 1e-6)
        gap_component = max(profile["stock_gap"], 0) / max(profile["target_stock"], 1)
        frequency_component = min(max(profile["sale_frequency"], 0.0), 1.0)
        margin_component = profile["margin_ratio"] / max(max_margin, 1e-6) if max_margin > 0 else 0.0

        fitted_score = (
            weights["velocity"] * velocity_component
            + weights["stock_gap"] * gap_component
            + weights["sale_frequency"] * frequency_component
            + weights["margin"] * margin_component
        )
        profile["fitted_score"] = fitted_score
        profile["recommendation_score"] = round(1.0 + min(fitted_score, 1.0) * 4.0, 1)  # 1..5
        profile["recommended_quantity"] = max(0, math.ceil(profile["stock_gap"]))

    artifact = {
        "trained_at": datetime.now().isoformat(),
        "window_days": days,
        "system_backend_url": SYSTEM_BACKEND_URL,
        "feature_weights": weights,
        "feature_weights_display": weight_percentages,  # Human-readable percentages
        "feature_scale": {"max_velocity": max_velocity, "max_margin": max_margin},
        "sales_summary": {
            "sales_rows": len(sales_data),
            "sale_items": len(sale_items),
            "categories": dict(category_units),
            "brands": dict(brand_units),
        },
        "profiles": profiles,
    }

    MODEL_ARTIFACT.write_text(json.dumps(artifact, indent=2), encoding="utf-8")
    return artifact


def identify_inventory_gaps(model_artifact: Dict[str, Any]) -> List[Dict[str, Any]]:
    gaps = []
    for profile in model_artifact.get("profiles", []):
        stock_gap = _to_int(profile.get("stock_gap"), 0)
        units_sold = _to_int(profile.get("units_sold"), 0)
        
        # Skip if no stock gap OR no sales history (can't recommend items never sold)
        if stock_gap <= 0 or units_sold == 0:
            continue
            
        priority = "high" if stock_gap >= 8 else "medium" if stock_gap >= 4 else "low"
        gap_type = "out_of_stock" if _to_int(profile.get("current_stock"), 0) == 0 else "low_stock"
        gaps.append(
            {
                "type": gap_type,
                "product": profile.get("device"),
                "category": profile.get("category"),
                "sales_volume": units_sold,
                "current_stock": _to_int(profile.get("current_stock"), 0),
                "priority": priority,
            }
        )
    return gaps


def _market_demand_from_profile(profile: Dict[str, Any]) -> str:
    velocity = _to_float(profile.get("daily_velocity"), 0.0)
    if velocity >= 1.0:
        return "high"
    if velocity >= 0.35:
        return "medium"
    return "low"


def _profit_margin_from_profile(profile: Dict[str, Any]) -> str:
    margin_ratio = _to_float(profile.get("margin_ratio"), 0.0)
    if margin_ratio >= 0.25:
        return "high"
    if margin_ratio >= 0.10:
        return "medium"
    return "low"


def generate_recommendation_reason(profile: Dict[str, Any]) -> str:
    reasons = []
    stock_gap = _to_int(profile.get("stock_gap"), 0)
    velocity = _to_float(profile.get("daily_velocity"), 0.0)
    current_stock = _to_int(profile.get("current_stock"), 0)
    units_sold = _to_int(profile.get("units_sold"), 0)

    if current_stock == 0:
        reasons.append("currently out of stock")
    elif stock_gap > 0:
        reasons.append(f"stock below target by {stock_gap} units")
    if velocity > 0:
        reasons.append(f"sales velocity is {velocity:.2f} units/day")
    if not reasons:
        reasons.append("insufficient stock coverage for projected demand")

    return "Recommended because " + ", ".join(reasons) + "."


def generate_insights(sales_trends: Dict, inventory_gaps: List[Dict], recommendations: List[Dict]) -> List[str]:
    insights = []
    
    # Top category insight
    top_categories = sales_trends.get('top_categories', {})
    if top_categories:
        top_category = list(top_categories.keys())[0]
        top_category_sales = top_categories[top_category]
        insights.append(
            f"📱 {top_category} is your best-selling category. "
            f"Consider expanding this inventory line."
        )
    

    # Inventory gaps insight
    high_priority_gaps = [g for g in inventory_gaps if g.get('priority') == 'high']
    if high_priority_gaps:
        insights.append(
            f"⚠️ You have {len(high_priority_gaps)} high-priority inventory gaps. "
            f"Address these immediately to avoid lost sales."
        )
    
    # Revenue insight
    total_revenue = sales_trends.get('total_revenue', 0)
    avg_sale = sales_trends.get('avg_sale_value', 0)
    if total_revenue > 0:
        insights.append(
            f"💰 Recent sales generated {total_revenue:,.0f} RWF with an average sale value of {avg_sale:,.0f} RWF. "
            f"Focus on mid-to-high value items for better margins."
        )
    
    # Recommendation insight
    if recommendations:
        top_rec = recommendations[0]
        insights.append(
            f"🎯 Top recommendation: {top_rec['device']} (Score: {top_rec['recommendation_score']}/5.0). "
            f"This device aligns perfectly with current market trends."
        )
    
    if recommendations:
        avg_score = round(sum(_to_float(r.get("recommendation_score"), 0.0) for r in recommendations) / len(recommendations), 2)
        insights.append(f"🧠 Model confidence average score is {avg_score}/5 across recommended items.")
    
    return insights


@router.get("/inventory-recommendations")
async def get_inventory_recommendations():
    """Main endpoint for trained real-data inventory recommendations."""
    try:
        sales_data = fetch_sales_from_system_backend(days=30)
        inventory_data = fetch_inventory_from_system_backend()

        if not inventory_data:
            return {
                "success": True,
                "data": {
                    "recommendations": [],
                    "sales_trends": analyze_sales_trends([]),
                    "inventory_gaps": [],
                    "insights": ["No inventory data available from system backend."],
                    "analysis_date": datetime.now().isoformat(),
                    "total_recommendations": 0,
                    "system_status": {
                        "java_backend_connected": False,
                        "sales_data_available": len(sales_data) > 0,
                        "inventory_data_available": False,
                        "message": "Inventory endpoint returned no data. Recommendations skipped.",
                    },
                },
            }

        # Train model from real data and persist artifact.
        model_artifact = _train_recommendation_model(sales_data, inventory_data, days=30)
        sales_trends = analyze_sales_trends(sales_data)
        inventory_gaps = identify_inventory_gaps(model_artifact)

        # Recommend only items where stock gap > 0 and there is actual demand.
        trained_profiles = model_artifact.get("profiles", [])
        real_recommendations = []
        for profile in trained_profiles:
            if _to_int(profile.get("recommended_quantity"), 0) <= 0:
                continue
            if _to_int(profile.get("units_sold"), 0) <= 0:
                continue
            real_recommendations.append(
                {
                    "device": profile.get("device"),
                    "brand": profile.get("brand"),
                    "category": profile.get("category"),
                    "market_demand": _market_demand_from_profile(profile),
                    "profit_margin": _profit_margin_from_profile(profile),
                    "recommendation_score": profile.get("recommendation_score"),
                    "recommended_quantity": profile.get("recommended_quantity"),
                    "reason": generate_recommendation_reason(profile),
                }
            )

        real_recommendations.sort(key=lambda x: (_to_float(x.get("recommendation_score"), 0.0), _to_int(x.get("recommended_quantity"), 0)), reverse=True)
        top_recommendations = real_recommendations[:10]
        insights = generate_insights(sales_trends, inventory_gaps, top_recommendations)

        system_status = {
            "java_backend_connected": True,
            "sales_data_available": len(sales_data) > 0,
            "inventory_data_available": len(inventory_data) > 0,
            "model_artifact": str(MODEL_ARTIFACT),
            "message": "Using trained model from real sales and inventory data.",
        }

        return {
            "success": True,
            "data": {
                "recommendations": top_recommendations,
                "sales_trends": sales_trends,
                "inventory_gaps": inventory_gaps,
                "insights": insights,
                "analysis_date": datetime.now().isoformat(),
                "total_recommendations": len(top_recommendations),
                "system_status": system_status,
            },
        }
    except Exception as e:
        print(f"Error generating recommendations: {e}")
        import traceback
        traceback.print_exc()
        raise HTTPException(
            status_code=500,
            detail={
                'success': False,
                'error': str(e),
                'message': 'Failed to generate inventory recommendations. Ensure Java backend is running and sales/inventory data is accessible.'
            }
        )


@router.post("/inventory-recommendations/refresh")
async def refresh_recommendations():
    """Force refresh of recommendations (retrain on latest data)."""
    return await get_inventory_recommendations()


@router.post("/inventory-recommendations/train")
async def train_recommendation_model():
    """Explicit model training endpoint to create persisted artifact."""
    try:
        sales_data = fetch_sales_from_system_backend(days=30)
        inventory_data = fetch_inventory_from_system_backend()
        if not inventory_data:
            raise HTTPException(status_code=400, detail="No inventory data available for training.")

        artifact = _train_recommendation_model(sales_data, inventory_data, days=30)
        return {
            "success": True,
            "message": "Model trained successfully from real system data.",
            "trained_at": artifact.get("trained_at"),
            "profiles": len(artifact.get("profiles", [])),
            "artifact_path": str(MODEL_ARTIFACT),
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/inventory-recommendations/guided")
async def get_guided_recommendations(user_id: int = None):
    """
    Enhanced endpoint for guided step-through recommendation flow
    Returns recommendations grouped by priority with detailed reasons
    Includes customer demand recommendations
    """
    try:
        sales_data = fetch_sales_from_system_backend(days=30)
        inventory_data = fetch_inventory_from_system_backend()
        
        # Fetch user data for personalization
        user_name = "User"
        if user_id:
            try:
                user_response = requests.get(f'{SYSTEM_BACKEND_URL}/api/users/{user_id}', timeout=5)
                if user_response.status_code == 200:
                    user_data = user_response.json()
                    user_name = user_data.get('fullName', 'User')
            except Exception as e:
                print(f"Error fetching user data: {e}")

        if not inventory_data:
            return {
                "success": True,
                "user": {"name": user_name},
                "summary": {
                    "high_priority_count": 0,
                    "medium_priority_count": 0,
                    "low_priority_count": 0,
                    "total_count": 0,
                    "customer_demand_count": 0
                },
                "recommendations": {
                    "high": [],
                    "medium": [],
                    "low": []
                },
                "message": "No inventory data available",
                "analysis_date": datetime.now().isoformat()
            }

        # Train model and generate recommendations
        model_artifact = _train_recommendation_model(sales_data, inventory_data, days=30)
        sales_trends = analyze_sales_trends(sales_data)
        
        # Generate detailed recommendations from sales data
        trained_profiles = model_artifact.get("profiles", [])
        all_recommendations = []
        
        for profile in trained_profiles:
            if _to_int(profile.get("recommended_quantity"), 0) <= 0:
                continue
            if _to_int(profile.get("units_sold"), 0) <= 0:
                continue
            
            # Generate detailed reason with bullet points
            reason_details = _generate_detailed_reason(profile, sales_trends)
            
            recommendation = {
                "product_id": profile.get("id"),
                "product_name": profile.get("device"),
                "brand": profile.get("brand"),
                "category": profile.get("category"),
                "current_stock": _to_int(profile.get("current_stock"), 0),
                "recommended_quantity": profile.get("recommended_quantity"),
                "recommendation_score": profile.get("recommendation_score"),
                "market_demand": _market_demand_from_profile(profile),
                "profit_margin": _profit_margin_from_profile(profile),
                "purchase_cost": _to_float(profile.get("purchase_cost"), 0.0),
                "reason": {
                    "summary": reason_details["summary"],
                    "details": reason_details["details"],
                    "urgency": reason_details["urgency"]
                },
                "metrics": {
                    "units_sold_30d": _to_int(profile.get("units_sold"), 0),
                    "daily_velocity": round(_to_float(profile.get("daily_velocity"), 0.0), 2),
                    "stock_coverage_days": round(_to_float(profile.get("coverage_days"), 0.0), 1),
                    "revenue_generated": round(_to_float(profile.get("revenue"), 0.0), 2),
                    "profit_margin_percent": round(_to_float(profile.get("margin_ratio"), 0.0) * 100, 1),
                    "absolute_profit_margin": round(_to_float(profile.get("unit_margin"), 0.0), 2)
                },
                "confidence": {
                    "score": profile.get("recommendation_score"),
                    "level": _get_confidence_level(profile.get("recommendation_score"))
                },
                "source": "sales_analysis"
            }
            all_recommendations.append(recommendation)
        
        # Add customer demand recommendations
        customer_demand_recs = analyze_customer_demand(threshold=5)
        customer_demand_count = 0
        
        for demand_rec in customer_demand_recs:
            # Format customer demand recommendation to match structure
            customer_demand_count += 1
            recommendation = {
                "product_id": None,  # New product, no ID yet
                "product_name": demand_rec.get("device"),
                "brand": demand_rec.get("brand"),
                "category": demand_rec.get("category"),
                "current_stock": 0,  # Not in inventory yet
                "recommended_quantity": demand_rec.get("recommended_quantity"),
                "recommendation_score": demand_rec.get("recommendation_score"),
                "market_demand": demand_rec.get("market_demand"),
                "profit_margin": demand_rec.get("profit_margin"),
                "purchase_cost": 0.0,  # Unknown for new products
                "reason": {
                    "summary": demand_rec.get("reason"),
                    "details": [
                        f"Requested by {demand_rec.get('request_count')} customers",
                        "Not currently in catalog or stock",
                        f"First request: {demand_rec.get('first_request', 'N/A')}",
                        f"Latest request: {demand_rec.get('last_request', 'N/A')}",
                        "High customer interest indicates future demand"
                    ],
                    "urgency": "high"
                },
                "metrics": {
                    "customer_requests": demand_rec.get("request_count"),
                    "first_request_date": demand_rec.get("first_request"),
                    "last_request_date": demand_rec.get("last_request")
                },
                "confidence": {
                    "score": demand_rec.get("recommendation_score"),
                    "level": _get_confidence_level(demand_rec.get("recommendation_score"))
                },
                "source": "customer_demand",
                "badge": "Customer Requested"
            }
            all_recommendations.append(recommendation)
        
        # Sort by score
        all_recommendations.sort(
            key=lambda x: (_to_float(x.get("recommendation_score"), 0.0), _to_int(x.get("recommended_quantity"), 0)),
            reverse=True
        )
        
        # Group by priority (customer demand always goes to high priority)
        high_priority = [r for r in all_recommendations if r['recommendation_score'] >= 4.0 or r.get('source') == 'customer_demand']
        medium_priority = [r for r in all_recommendations if 3.0 <= r['recommendation_score'] < 4.0 and r.get('source') != 'customer_demand']
        low_priority = [r for r in all_recommendations if r['recommendation_score'] < 3.0 and r.get('source') != 'customer_demand']
        
        return {
            "success": True,
            "user": {
                "name": user_name
            },
            "summary": {
                "high_priority_count": len(high_priority),
                "medium_priority_count": len(medium_priority),
                "low_priority_count": len(low_priority),
                "total_count": len(all_recommendations),
                "customer_demand_count": customer_demand_count
            },
            "recommendations": {
                "high": high_priority,
                "medium": medium_priority,
                "low": low_priority
            },
            "sales_trends": sales_trends,
            "analysis_date": datetime.now().isoformat()
        }
        
    except Exception as e:
        print(f"Error generating guided recommendations: {e}")
        import traceback
        traceback.print_exc()
        raise HTTPException(
            status_code=500,
            detail={
                'success': False,
                'error': str(e),
                'message': 'Failed to generate guided recommendations.'
            }
        )


def _generate_detailed_reason(profile: Dict[str, Any], sales_trends: Dict) -> Dict[str, Any]:
    """Generate detailed, data-driven reason with bullet points"""
    details = []
    stock_gap = _to_int(profile.get("stock_gap"), 0)
    velocity = _to_float(profile.get("daily_velocity"), 0.0)
    current_stock = _to_int(profile.get("current_stock"), 0)
    units_sold = _to_int(profile.get("units_sold"), 0)
    coverage_days = _to_float(profile.get("coverage_days"), 0.0)
    margin_ratio = _to_float(profile.get("margin_ratio"), 0.0)
    
    # Stock status
    if current_stock == 0:
        summary = "Critical: Currently out of stock with active demand"
        urgency = "critical"
        details.append("Currently out of stock")
    elif coverage_days < 3:
        summary = f"Urgent: Only {coverage_days:.1f} days of stock remaining"
        urgency = "high"
        details.append(f"Only {coverage_days:.1f} days of stock remaining")
    elif coverage_days < 7:
        summary = f"Low stock: {coverage_days:.1f} days coverage remaining"
        urgency = "medium"
        details.append(f"Stock coverage: {coverage_days:.1f} days")
    else:
        summary = "Preventive restocking recommended"
        urgency = "low"
        details.append(f"Current stock: {current_stock} units")
    
    # Sales performance
    if velocity > 0:
        details.append(f"Sales velocity: {velocity:.2f} units/day")
    
    # Stock gap
    if stock_gap > 0:
        details.append(f"Stock below target by {stock_gap} units")
    
    # Financial impact
    if margin_ratio > 0:
        margin_percent = margin_ratio * 100
        if margin_percent >= 25:
            details.append(f"High profit margin ({margin_percent:.0f}%)")
        elif margin_percent >= 10:
            details.append(f"Moderate profit margin ({margin_percent:.0f}%)")
    
    # Category ranking
    category = profile.get("category", "")
    top_categories = sales_trends.get("top_categories", {})
    
    if category in list(top_categories.keys())[:3]:
        details.append(f"Top-selling category: {category}")
    
    return {
        "summary": summary,
        "details": details,
        "urgency": urgency
    }


def _get_confidence_level(score: float) -> str:
    """Get confidence level from score"""
    score = _to_float(score, 0.0)
    if score >= 4.5:
        return "very_high"
    elif score >= 4.0:
        return "high"
    elif score >= 3.0:
        return "medium"
    else:
        return "low"


@router.get("/inventory-recommendations/demo")
async def get_demo_recommendations():
    """
    Demo endpoint with realistic mock data for supervisor presentation
    Shows how AI recommendations work without needing real sales data
    """
    from datetime import datetime
    
    mock_recommendations = {
        "success": True,
        "data": {
            "recommendations": [
                {
                    "device": "iPhone 13 Pro Battery",
                    "brand": "Apple",
                    "category": "Batteries",
                    "market_demand": "high",
                    "profit_margin": "high",
                    "recommendation_score": 4.8,
                    "recommended_quantity": 15,
                    "reason": "Recommended because strong increasing demand trend (+28.5%), stock below target by 15 units, predicted demand: 45 units in 30 days."
                },
                {
                    "device": "Samsung Galaxy S21 Display Assembly",
                    "brand": "Samsung",
                    "category": "Screens",
                    "market_demand": "high",
                    "profit_margin": "high",
                    "recommendation_score": 4.6,
                    "recommended_quantity": 12,
                    "reason": "Recommended because moderate increasing demand trend (+18.2%), stock below target by 12 units, predicted demand: 38 units in 30 days."
                },
                {
                    "device": "iPhone 12 Charging Port Flex Cable",
                    "brand": "Apple",
                    "category": "Charging Ports",
                    "market_demand": "high",
                    "profit_margin": "medium",
                    "recommendation_score": 4.4,
                    "recommended_quantity": 20,
                    "reason": "Recommended because strong increasing demand trend (+32.1%), only 8 days of stock remaining, predicted demand: 52 units in 30 days."
                },
                {
                    "device": "Dell Latitude Thermal Paste",
                    "brand": "Dell",
                    "category": "Cooling",
                    "market_demand": "medium",
                    "profit_margin": "medium",
                    "recommendation_score": 4.2,
                    "recommended_quantity": 25,
                    "reason": "Recommended because moderate increasing demand trend (+15.3%), stock below target by 25 units, predicted demand: 35 units in 30 days."
                },
                {
                    "device": "MacBook Pro M1 SSD 512GB",
                    "brand": "Apple",
                    "category": "Storage",
                    "market_demand": "high",
                    "profit_margin": "high",
                    "recommendation_score": 4.1,
                    "recommended_quantity": 8,
                    "reason": "Recommended because strong increasing demand trend (+25.7%), stock below target by 8 units, predicted demand: 22 units in 30 days."
                },
                {
                    "device": "HP EliteBook LVDS Cable",
                    "brand": "HP",
                    "category": "Display Cables",
                    "market_demand": "medium",
                    "profit_margin": "medium",
                    "recommendation_score": 3.9,
                    "recommended_quantity": 10,
                    "reason": "Recommended because moderate increasing demand trend (+12.8%), only 11 days of stock remaining, predicted demand: 18 units in 30 days."
                },
                {
                    "device": "Samsung Galaxy A52 Camera Module",
                    "brand": "Samsung",
                    "category": "Cameras",
                    "market_demand": "medium",
                    "profit_margin": "high",
                    "recommendation_score": 3.7,
                    "recommended_quantity": 6,
                    "reason": "Recommended because moderate increasing demand trend (+14.5%), stock below target by 6 units, predicted demand: 15 units in 30 days."
                },
                {
                    "device": "ThinkPad X1 Carbon Keyboard",
                    "brand": "Lenovo",
                    "category": "Keyboards",
                    "market_demand": "medium",
                    "profit_margin": "medium",
                    "recommendation_score": 3.5,
                    "recommended_quantity": 5,
                    "reason": "Recommended because stable demand trend (+5.2%), stock below target by 5 units, predicted demand: 12 units in 30 days."
                },
                {
                    "device": "iPad Air 4 Digitizer",
                    "brand": "Apple",
                    "category": "Screens",
                    "market_demand": "medium",
                    "profit_margin": "high",
                    "recommendation_score": 3.4,
                    "recommended_quantity": 4,
                    "reason": "Recommended because moderate increasing demand trend (+10.3%), stock below target by 4 units, predicted demand: 9 units in 30 days."
                },
                {
                    "device": "iPhone XR Earpiece Speaker",
                    "brand": "Apple",
                    "category": "Audio",
                    "market_demand": "low",
                    "profit_margin": "medium",
                    "recommendation_score": 3.2,
                    "recommended_quantity": 8,
                    "reason": "Recommended because stable demand trend (+3.8%), stock below target by 8 units, predicted demand: 14 units in 30 days."
                }
            ],
            "sales_trends": {
                "top_categories": {
                    "Batteries": 145,
                    "Screens": 128,
                    "Charging Ports": 98,
                    "Storage": 76,
                    "Cameras": 54
                },
                "top_brands": {
                    "Apple": 312,
                    "Samsung": 198,
                    "Dell": 87,
                    "HP": 65,
                    "Lenovo": 43
                },
                "top_products": {
                    "iPhone 13 Pro Battery": 45,
                    "Samsung Galaxy S21 Display": 38,
                    "iPhone 12 Charging Port": 32,
                    "MacBook Pro SSD": 28,
                    "Dell Thermal Paste": 25
                },
                "total_recent_sales": 156,
                "total_revenue": 45750000,
                "avg_sale_value": 293269
            },
            "inventory_gaps": [
                {
                    "type": "low_stock",
                    "product": "iPhone 13 Pro Battery",
                    "category": "Batteries",
                    "sales_volume": 45,
                    "current_stock": 5,
                    "priority": "high"
                },
                {
                    "type": "low_stock",
                    "product": "Samsung Galaxy S21 Display Assembly",
                    "category": "Screens",
                    "sales_volume": 38,
                    "current_stock": 3,
                    "priority": "high"
                },
                {
                    "type": "out_of_stock",
                    "product": "iPhone 12 Charging Port Flex Cable",
                    "category": "Charging Ports",
                    "sales_volume": 32,
                    "current_stock": 0,
                    "priority": "high"
                },
                {
                    "type": "low_stock",
                    "product": "Dell Latitude Thermal Paste",
                    "category": "Cooling",
                    "sales_volume": 25,
                    "current_stock": 2,
                    "priority": "medium"
                },
                {
                    "type": "low_stock",
                    "product": "MacBook Pro M1 SSD 512GB",
                    "category": "Storage",
                    "sales_volume": 22,
                    "current_stock": 1,
                    "priority": "medium"
                }
            ],
            "insights": [
                "📱 Batteries is your best-selling category. Consider expanding this inventory line.",
                "⚠️ You have 3 high-priority inventory gaps. Address these immediately to avoid lost sales.",
                "💰 Recent sales generated 45,750,000 RWF with an average sale value of 293,269 RWF. Focus on mid-to-high value items for better margins.",
                "🎯 Top recommendation: iPhone 13 Pro Battery (Score: 4.8/5.0). This device aligns perfectly with current market trends.",
                "🧠 Model confidence average score is 4.0/5 across recommended items.",
                "📈 Strong growth detected: iPhone 13 Pro Battery (+28.5%), iPhone 12 Charging Port (+32.1%), MacBook Pro SSD (+25.7%). Stock these items urgently."
            ],
            "analysis_date": datetime.now().isoformat(),
            "total_recommendations": 10,
            "system_status": {
                "java_backend_connected": True,
                "sales_data_available": True,
                "inventory_data_available": True,
                "model_artifact": "demo_mode",
                "message": "Demo mode: Using realistic mock data for presentation"
            }
        }
    }
    
    return mock_recommendations


@router.get("/test-connection")
async def test_system_backend_connection():
    """Test connection to System Backend"""
    results = {
        'system_backend_url': SYSTEM_BACKEND_URL,
        'sales_endpoint': f'{SYSTEM_BACKEND_URL}/api/sales',
        'inventory_endpoint': f'{SYSTEM_BACKEND_URL}/api/inventory',
        'tests': {}
    }
    
    # Test sales endpoint
    try:
        response = requests.get(f'{SYSTEM_BACKEND_URL}/api/sales', timeout=5)
        results['tests']['sales'] = {
            'status': 'success' if response.status_code == 200 else 'failed',
            'status_code': response.status_code,
            'data_count': len(response.json()) if response.status_code == 200 else 0
        }
    except Exception as e:
        results['tests']['sales'] = {
            'status': 'error',
            'error': str(e)
        }
    
    # Test inventory endpoint
    try:
        response = requests.get(f'{SYSTEM_BACKEND_URL}/api/inventory', timeout=5)
        results['tests']['inventory'] = {
            'status': 'success' if response.status_code == 200 else 'failed',
            'status_code': response.status_code,
            'data_count': len(response.json()) if response.status_code == 200 else 0
        }
    except Exception as e:
        results['tests']['inventory'] = {
            'status': 'error',
            'error': str(e)
        }
    
    # Overall status
    all_success = all(
        test.get('status') == 'success' 
        for test in results['tests'].values()
    )
    
    results['overall_status'] = 'connected' if all_success else 'disconnected'
    results['message'] = (
        'Successfully connected to System Backend' if all_success 
        else 'Cannot connect to System Backend. Make sure Java backend is running on port 8080.'
    )
    
    return results
