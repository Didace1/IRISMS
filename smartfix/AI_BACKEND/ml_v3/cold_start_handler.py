# smartfix/AI_BACKEND/ml_v3/cold_start_handler.py
"""
Cold-Start Handler for New Products
Uses category priors and similarity-based initialization
"""

import numpy as np
import pandas as pd
from typing import Dict, List, Any, Optional
from pathlib import Path
import json

try:
    from sklearn.metrics.pairwise import cosine_similarity
    from sklearn.preprocessing import StandardScaler
    SKLEARN_AVAILABLE = True
except ImportError:
    SKLEARN_AVAILABLE = False


class ColdStartHandler:
    """
    Handles forecasting for new products with little/no history
    
    Strategies:
    1. Category-level priors (average demand by category)
    2. Similarity-based initialization (find similar products)
    3. Price-based scaling
    4. Hierarchical forecasting
    """
    
    def __init__(self, model_dir: Path):
        self.model_dir = model_dir
        self.model_dir.mkdir(parents=True, exist_ok=True)
        self.priors_file = self.model_dir / 'category_priors.json'
        
        self.category_priors = {}
        self.product_features = {}
        self.scaler = StandardScaler()
        
        self.load_priors()
    
    def compute_category_priors(
        self,
        sales_history: List[Dict[str, Any]],
        inventory_data: List[Dict[str, Any]]
    ):
        """
        Compute category-level demand statistics
        
        For each category, calculate:
        - Average daily demand
        - Demand volatility
        - Typical price range
        - Seasonality patterns
        """
        # Aggregate sales by product and category
        df = pd.DataFrame(sales_history)
        
        if df.empty:
            return
        
        df['sale_date'] = pd.to_datetime(df['sale_date'])
        
        # Map products to categories
        product_category_map = {}
        for item in inventory_data:
            product_id = item.get('id')
            category = item.get('category', {})
            if isinstance(category, dict):
                category_name = category.get('name', 'Unknown')
            else:
                category_name = str(category) if category else 'Unknown'
            
            product_category_map[product_id] = category_name
        
        df['category'] = df['product_id'].map(product_category_map)
        
        # Calculate category statistics
        category_stats = {}
        
        for category in df['category'].unique():
            if pd.isna(category):
                continue
            
            cat_data = df[df['category'] == category]
            
            # Daily demand statistics
            daily_demand = cat_data.groupby('sale_date')['quantity'].sum()
            
            # Price statistics
            cat_products = [
                item for item in inventory_data
                if product_category_map.get(item.get('id')) == category
            ]
            prices = [item.get('price', 0) for item in cat_products]
            
            category_stats[category] = {
                'avg_daily_demand': float(daily_demand.mean()),
                'demand_std': float(daily_demand.std()),
                'demand_median': float(daily_demand.median()),
                'avg_price': float(np.mean(prices)) if prices else 0,
                'price_std': float(np.std(prices)) if prices else 0,
                'total_products': len(cat_products),
                'total_sales': int(cat_data['quantity'].sum())
            }
        
        self.category_priors = category_stats
        self.save_priors()
    
    def get_cold_start_forecast(
        self,
        product_data: Dict[str, Any],
        days_ahead: int = 30
    ) -> Dict[str, Any]:
        """
        Generate forecast for new product using category priors
        
        Uses:
        1. Category average demand
        2. Price-based scaling
        3. Conservative uncertainty bounds
        """
        category = product_data.get('category', {})
        if isinstance(category, dict):
            category_name = category.get('name', 'Unknown')
        else:
            category_name = str(category) if category else 'Unknown'
        
        product_price = product_data.get('price', 0)
        
        # Get category prior
        prior = self.category_priors.get(category_name)
        
        if not prior:
            # Fallback: Use global average
            if self.category_priors:
                all_demands = [p['avg_daily_demand'] for p in self.category_priors.values()]
                avg_demand = np.mean(all_demands)
                demand_std = np.std(all_demands)
            else:
                avg_demand = 1.0  # Conservative default
                demand_std = 0.5
        else:
            avg_demand = prior['avg_daily_demand']
            demand_std = prior['demand_std']
            
            # Scale by price if available
            if prior['avg_price'] > 0 and product_price > 0:
                price_ratio = product_price / prior['avg_price']
                # Assume inverse relationship (higher price = lower demand)
                price_scaling = 1.0 / (1.0 + 0.5 * (price_ratio - 1.0))
                avg_demand *= price_scaling
        
        # Generate forecast
        daily_forecast = avg_demand
        total_forecast = daily_forecast * days_ahead
        
        # Conservative uncertainty bounds (wider for cold-start)
        uncertainty_factor = 2.0  # 2x standard deviation
        lower_bound = max(0, total_forecast - uncertainty_factor * demand_std * np.sqrt(days_ahead))
        upper_bound = total_forecast + uncertainty_factor * demand_std * np.sqrt(days_ahead)
        
        # Calculate confidence (lower for cold-start)
        confidence = 40  # Base confidence for cold-start
        if prior and prior['total_products'] > 5:
            confidence = 55  # Higher if category has many products
        
        return {
            'status': 'cold_start',
            'prediction': {
                'point_forecast': round(total_forecast, 1),
                'min_demand': round(lower_bound, 1),
                'max_demand': round(upper_bound, 1),
                'confidence_interval': '95%'
            },
            'confidence': confidence,
            'method': 'category_prior',
            'category': category_name,
            'prior_info': {
                'category_avg_demand': round(avg_demand, 2),
                'category_products': prior['total_products'] if prior else 0
            }
        }
    
    def find_similar_products(
        self,
        product_data: Dict[str, Any],
        inventory_data: List[Dict[str, Any]],
        sales_history: List[Dict[str, Any]],
        top_k: int = 3
    ) -> List[Dict[str, Any]]:
        """
        Find similar products based on features
        
        Similarity based on:
        - Category
        - Price range
        - Product attributes
        """
        if not SKLEARN_AVAILABLE:
            return []
        
        # Extract features for target product
        target_category = product_data.get('category', {})
        if isinstance(target_category, dict):
            target_category_name = target_category.get('name', 'Unknown')
        else:
            target_category_name = str(target_category) if target_category else 'Unknown'
        
        target_price = product_data.get('price', 0)
        
        # Find products in same category
        similar_products = []
        
        for item in inventory_data:
            if item.get('id') == product_data.get('id'):
                continue  # Skip self
            
            item_category = item.get('category', {})
            if isinstance(item_category, dict):
                item_category_name = item_category.get('name', 'Unknown')
            else:
                item_category_name = str(item_category) if item_category else 'Unknown'
            
            # Same category
            if item_category_name != target_category_name:
                continue
            
            item_price = item.get('price', 0)
            
            # Calculate price similarity
            if target_price > 0 and item_price > 0:
                price_ratio = min(target_price, item_price) / max(target_price, item_price)
            else:
                price_ratio = 0.5
            
            # Calculate sales volume
            item_sales = [
                s for s in sales_history
                if s.get('product_id') == item.get('id')
            ]
            total_sales = sum(s.get('quantity', 0) for s in item_sales)
            
            similar_products.append({
                'product_id': item.get('id'),
                'product_name': item.get('name'),
                'similarity_score': price_ratio,
                'total_sales': total_sales,
                'price': item_price
            })
        
        # Sort by similarity and sales volume
        similar_products.sort(
            key=lambda x: (x['similarity_score'], x['total_sales']),
            reverse=True
        )
        
        return similar_products[:top_k]
    
    def save_priors(self):
        """Save category priors"""
        with open(self.priors_file, 'w') as f:
            json.dump({
                'category_priors': self.category_priors,
                'updated_at': pd.Timestamp.now().isoformat()
            }, f, indent=2)
    
    def load_priors(self):
        """Load category priors"""
        if self.priors_file.exists():
            with open(self.priors_file, 'r') as f:
                data = json.load(f)
                self.category_priors = data.get('category_priors', {})
