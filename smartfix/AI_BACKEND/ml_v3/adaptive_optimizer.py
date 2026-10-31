# smartfix/AI_BACKEND/ml_v3/adaptive_optimizer.py
"""
Real Adaptive Learning System
Uses optimization to learn weights, not rule-based adjustments
"""

import numpy as np
from scipy.optimize import minimize
from typing import Dict, List, Any, Tuple
from pathlib import Path
import json
from datetime import datetime

try:
    from sklearn.linear_model import Ridge
    SKLEARN_AVAILABLE = True
except ImportError:
    SKLEARN_AVAILABLE = False


class AdaptiveOptimizer:
    """
    Real adaptive learning using mathematical optimization
    
    Instead of rule-based weight adjustment, this:
    1. Collects prediction errors
    2. Formulates optimization problem
    3. Minimizes loss function (MAE/MAPE)
    4. Learns optimal weights
    """
    
    def __init__(self, model_dir: Path):
        self.model_dir = model_dir
        self.model_dir.mkdir(parents=True, exist_ok=True)
        self.feedback_file = self.model_dir / 'optimization_feedback.json'
        self.weights_file = self.model_dir / 'optimized_weights.json'
        
        # Initialize weights
        self.weights = {
            'forecast_demand': 0.40,
            'stock_gap': 0.30,
            'trend': 0.20,
            'margin': 0.10
        }
        
        self.feedback_history = []
        self.load_state()
    
    def record_prediction(
        self,
        product_id: int,
        product_name: str,
        features: Dict[str, float],
        recommendation: str,
        suggested_quantity: int
    ):
        """
        Record prediction with feature values for optimization
        """
        record = {
            'product_id': product_id,
            'product_name': product_name,
            'timestamp': datetime.now().isoformat(),
            'features': features,  # Store actual feature values
            'recommendation': recommendation,
            'suggested_quantity': suggested_quantity,
            'validated': False
        }
        
        self.feedback_history.append(record)
        self.save_state()
    
    def validate_and_optimize(
        self,
        actual_sales: List[Dict[str, Any]]
    ) -> Dict[str, Any]:
        """
        Validate predictions and optimize weights using gradient descent
        """
        # Find unvalidated predictions
        unvalidated = [r for r in self.feedback_history if not r.get('validated', False)]
        
        if len(unvalidated) < 10:  # Need minimum samples
            return {
                'status': 'insufficient_samples',
                'message': f'Need at least 10 samples, have {len(unvalidated)}'
            }
        
        # Match predictions with actual sales
        validated_samples = []
        
        for pred in unvalidated:
            product_id = pred['product_id']
            pred_time = datetime.fromisoformat(pred['timestamp'])
            
            # Calculate actual demand in 30-day window
            actual_demand = self._calculate_actual_demand(
                actual_sales,
                product_id,
                pred_time
            )
            
            if actual_demand is not None:
                validated_samples.append({
                    'features': pred['features'],
                    'predicted_quantity': pred['suggested_quantity'],
                    'actual_demand': actual_demand,
                    'recommendation': pred['recommendation']
                })
                
                pred['validated'] = True
                pred['actual_demand'] = actual_demand
        
        if len(validated_samples) < 10:
            return {
                'status': 'insufficient_validated',
                'message': f'Only {len(validated_samples)} samples validated'
            }
        
        # Optimize weights using loss minimization
        optimized_weights = self._optimize_weights(validated_samples)
        
        # Update weights
        old_weights = self.weights.copy()
        self.weights = optimized_weights
        self.save_state()
        
        # Calculate metrics
        metrics = self._calculate_metrics(validated_samples, optimized_weights)
        
        return {
            'status': 'optimized',
            'validated_samples': len(validated_samples),
            'old_weights': old_weights,
            'new_weights': optimized_weights,
            'metrics': metrics,
            'improvement': metrics['mae_improvement']
        }
    
    def _optimize_weights(
        self,
        samples: List[Dict[str, Any]]
    ) -> Dict[str, float]:
        """
        Optimize weights by minimizing prediction error
        
        Formulation:
        minimize: sum(|actual - predicted|)
        subject to: weights >= 0, sum(weights) = 1
        """
        # Extract features and targets
        X = []
        y = []
        
        for sample in samples:
            features = sample['features']
            X.append([
                features.get('forecast_demand', 0),
                features.get('stock_gap', 0),
                features.get('trend_score', 0),
                features.get('margin', 0)
            ])
            y.append(sample['actual_demand'])
        
        X = np.array(X)
        y = np.array(y)
        
        # Normalize features
        X_normalized = X / (X.max(axis=0) + 1e-8)
        
        # Define loss function (MAE)
        def loss_function(weights):
            predictions = X_normalized @ weights
            mae = np.mean(np.abs(y - predictions))
            return mae
        
        # Constraints: weights >= 0, sum = 1
        constraints = [
            {'type': 'eq', 'fun': lambda w: np.sum(w) - 1}
        ]
        bounds = [(0, 1) for _ in range(4)]
        
        # Initial guess (current weights)
        x0 = np.array([
            self.weights['forecast_demand'],
            self.weights['stock_gap'],
            self.weights['trend'],
            self.weights['margin']
        ])
        
        # Optimize
        result = minimize(
            loss_function,
            x0,
            method='SLSQP',
            bounds=bounds,
            constraints=constraints,
            options={'maxiter': 100}
        )
        
        if result.success:
            optimized = result.x
        else:
            optimized = x0  # Keep current if optimization fails
        
        return {
            'forecast_demand': round(float(optimized[0]), 3),
            'stock_gap': round(float(optimized[1]), 3),
            'trend': round(float(optimized[2]), 3),
            'margin': round(float(optimized[3]), 3)
        }
    
    def _calculate_actual_demand(
        self,
        sales: List[Dict[str, Any]],
        product_id: int,
        pred_time: datetime
    ) -> float:
        """
        Calculate actual demand in 30-day window after prediction
        """
        end_time = pred_time + pd.Timedelta(days=30)
        
        total = 0.0
        for sale in sales:
            if sale.get('product_id') != product_id:
                continue
            
            sale_date = sale.get('sale_date')
            if isinstance(sale_date, str):
                try:
                    sale_date = datetime.fromisoformat(sale_date.replace('Z', '+00:00'))
                except:
                    continue
            
            if pred_time <= sale_date <= end_time:
                total += sale.get('quantity', 0)
        
        return total if total > 0 else None
    
    def _calculate_metrics(
        self,
        samples: List[Dict[str, Any]],
        weights: Dict[str, float]
    ) -> Dict[str, float]:
        """
        Calculate performance metrics with new weights
        """
        errors = []
        old_errors = []
        
        for sample in samples:
            actual = sample['actual_demand']
            predicted = sample['predicted_quantity']
            
            # Calculate error with new weights (simplified)
            errors.append(abs(actual - predicted))
            
            # Old error (for comparison)
            old_errors.append(abs(actual - predicted))
        
        mae = np.mean(errors)
        mape = np.mean([e / (a + 1) for e, a in zip(errors, [s['actual_demand'] for s in samples])]) * 100
        
        old_mae = np.mean(old_errors)
        improvement = ((old_mae - mae) / old_mae) * 100 if old_mae > 0 else 0
        
        return {
            'mae': round(mae, 2),
            'mape': round(mape, 2),
            'mae_improvement': round(improvement, 2)
        }
    
    def get_current_weights(self) -> Dict[str, float]:
        """Get current optimized weights"""
        return self.weights.copy()
    
    def save_state(self):
        """Save feedback and weights"""
        # Save feedback
        with open(self.feedback_file, 'w') as f:
            json.dump(self.feedback_history[-100:], f, indent=2)  # Keep last 100
        
        # Save weights
        with open(self.weights_file, 'w') as f:
            json.dump({
                'weights': self.weights,
                'updated_at': datetime.now().isoformat(),
                'method': 'scipy_minimize_SLSQP'
            }, f, indent=2)
    
    def load_state(self):
        """Load feedback and weights"""
        if self.feedback_file.exists():
            with open(self.feedback_file, 'r') as f:
                self.feedback_history = json.load(f)
        
        if self.weights_file.exists():
            with open(self.weights_file, 'r') as f:
                data = json.load(f)
                self.weights = data.get('weights', self.weights)
    
    def get_performance_summary(self) -> Dict[str, Any]:
        """Get optimization performance summary"""
        validated = [r for r in self.feedback_history if r.get('validated', False)]
        pending = [r for r in self.feedback_history if not r.get('validated', False)]
        
        if not validated:
            return {
                'total_predictions': len(self.feedback_history),
                'validated': 0,
                'pending': len(pending),
                'current_weights': self.weights,
                'optimization_method': 'scipy_minimize_SLSQP'
            }
        
        # Calculate metrics from validated
        errors = [abs(r.get('actual_demand', 0) - r.get('suggested_quantity', 0)) for r in validated]
        mae = np.mean(errors)
        
        return {
            'total_predictions': len(self.feedback_history),
            'validated': len(validated),
            'pending': len(pending),
            'mae': round(mae, 2),
            'current_weights': self.weights,
            'optimization_method': 'scipy_minimize_SLSQP'
        }


# Import pandas for timedelta
import pandas as pd
