# smartfix/AI_BACKEND/ml/feedback_learner.py
"""
Feedback Learning System
Tracks prediction accuracy and adjusts model weights dynamically
"""

import json
from datetime import datetime, timedelta
from typing import Dict, List, Any
from pathlib import Path
from collections import defaultdict


class FeedbackLearner:
    """
    Implements continuous learning through feedback loop
    - Tracks predictions vs actual sales
    - Calculates accuracy metrics
    - Adjusts recommendation weights dynamically
    """
    
    def __init__(self, feedback_dir: Path):
        self.feedback_dir = feedback_dir
        self.feedback_dir.mkdir(parents=True, exist_ok=True)
        self.feedback_file = self.feedback_dir / 'prediction_feedback.json'
        self.weights_file = self.feedback_dir / 'adaptive_weights.json'
        
        # Initialize adaptive weights (start with defaults)
        self.weights = {
            'predicted_demand': 0.40,
            'stock_gap': 0.30,
            'trend': 0.20,
            'margin': 0.10
        }
        
        self.load_weights()
    
    def record_prediction(
        self, 
        product_id: int, 
        product_name: str,
        predicted_demand: float,
        current_stock: int,
        recommendation: str,
        suggested_quantity: int
    ):
        """
        Record a prediction for future validation
        """
        predictions = self._load_predictions()
        
        prediction_record = {
            'product_id': product_id,
            'product_name': product_name,
            'predicted_demand_30_days': predicted_demand,
            'current_stock': current_stock,
            'recommendation': recommendation,
            'suggested_quantity': suggested_quantity,
            'prediction_date': datetime.now().isoformat(),
            'validation_date': (datetime.now() + timedelta(days=30)).isoformat(),
            'validated': False
        }
        
        predictions.append(prediction_record)
        
        # Keep only last 100 predictions
        predictions = predictions[-100:]
        
        self._save_predictions(predictions)
    
    def validate_predictions(
        self, 
        actual_sales: List[Dict[str, Any]]
    ) -> Dict[str, Any]:
        """
        Validate past predictions against actual sales
        Calculate accuracy metrics and adjust weights
        """
        predictions = self._load_predictions()
        
        if not predictions:
            return {
                'validated_count': 0,
                'accuracy_metrics': {},
                'message': 'No predictions to validate'
            }
        
        # Find predictions ready for validation (30 days old)
        now = datetime.now()
        ready_for_validation = [
            p for p in predictions 
            if not p.get('validated', False) and 
            datetime.fromisoformat(p['validation_date']) <= now
        ]
        
        if not ready_for_validation:
            return {
                'validated_count': 0,
                'accuracy_metrics': {},
                'message': 'No predictions ready for validation yet'
            }
        
        # Validate each prediction
        validation_results = []
        
        for pred in ready_for_validation:
            product_id = pred['product_id']
            prediction_date = datetime.fromisoformat(pred['prediction_date'])
            validation_date = datetime.fromisoformat(pred['validation_date'])
            
            # Get actual sales in the 30-day window
            actual_demand = self._calculate_actual_demand(
                actual_sales, 
                product_id, 
                prediction_date, 
                validation_date
            )
            
            predicted_demand = pred['predicted_demand_30_days']
            
            # Calculate error metrics
            error = actual_demand - predicted_demand
            abs_error = abs(error)
            pct_error = (abs_error / actual_demand * 100) if actual_demand > 0 else 0
            
            # Determine if recommendation was correct
            was_correct = self._evaluate_recommendation(
                pred['recommendation'],
                pred['suggested_quantity'],
                actual_demand,
                pred['current_stock']
            )
            
            validation_results.append({
                'product_id': product_id,
                'product_name': pred['product_name'],
                'predicted': predicted_demand,
                'actual': actual_demand,
                'error': error,
                'abs_error': abs_error,
                'pct_error': round(pct_error, 2),
                'recommendation_correct': was_correct
            })
            
            # Mark as validated
            pred['validated'] = True
            pred['actual_demand'] = actual_demand
            pred['error'] = error
            pred['pct_error'] = pct_error
            pred['recommendation_correct'] = was_correct
        
        # Save updated predictions
        self._save_predictions(predictions)
        
        # Calculate aggregate metrics
        accuracy_metrics = self._calculate_accuracy_metrics(validation_results)
        
        # Adjust weights based on performance
        self._adjust_weights(accuracy_metrics)
        
        return {
            'validated_count': len(validation_results),
            'accuracy_metrics': accuracy_metrics,
            'validation_results': validation_results[:10],  # Return top 10
            'weights_adjusted': True,
            'current_weights': self.weights
        }
    
    def _calculate_actual_demand(
        self, 
        sales: List[Dict[str, Any]], 
        product_id: int,
        start_date: datetime,
        end_date: datetime
    ) -> float:
        """
        Calculate actual sales for a product in a date range
        """
        total = 0.0
        
        for sale in sales:
            if sale.get('product_id') != product_id:
                continue
            
            sale_date = sale.get('sale_date')
            if not sale_date:
                continue
            
            if isinstance(sale_date, str):
                try:
                    sale_date = datetime.fromisoformat(sale_date.replace('Z', '+00:00'))
                except:
                    continue
            
            if start_date <= sale_date <= end_date:
                total += sale.get('quantity', 0)
        
        return total
    
    def _evaluate_recommendation(
        self, 
        recommendation: str, 
        suggested_qty: int,
        actual_demand: float,
        initial_stock: int
    ) -> bool:
        """
        Evaluate if the recommendation was correct
        """
        if recommendation == 'REORDER':
            # Was reorder needed?
            return actual_demand > initial_stock
        elif recommendation == 'HOLD':
            # Was stock sufficient?
            return initial_stock >= actual_demand * 0.8
        elif recommendation == 'REDUCE_STOCK':
            # Was there excess stock?
            return initial_stock > actual_demand * 1.5
        
        return False
    
    def _calculate_accuracy_metrics(
        self, 
        results: List[Dict[str, Any]]
    ) -> Dict[str, Any]:
        """
        Calculate aggregate accuracy metrics
        """
        if not results:
            return {}
        
        # Mean Absolute Error (MAE)
        mae = sum(r['abs_error'] for r in results) / len(results)
        
        # Mean Absolute Percentage Error (MAPE)
        mape = sum(r['pct_error'] for r in results) / len(results)
        
        # Recommendation accuracy
        correct_recommendations = sum(1 for r in results if r['recommendation_correct'])
        recommendation_accuracy = (correct_recommendations / len(results)) * 100
        
        # Bias (over-prediction or under-prediction)
        bias = sum(r['error'] for r in results) / len(results)
        
        return {
            'mae': round(mae, 2),
            'mape': round(mape, 2),
            'recommendation_accuracy': round(recommendation_accuracy, 2),
            'bias': round(bias, 2),
            'total_validated': len(results),
            'correct_recommendations': correct_recommendations
        }
    
    def _adjust_weights(self, metrics: Dict[str, Any]):
        """
        Dynamically adjust weights based on performance
        """
        if not metrics:
            return
        
        mape = metrics.get('mape', 50)
        rec_accuracy = metrics.get('recommendation_accuracy', 50)
        
        # If predictions are accurate (low MAPE), increase predicted_demand weight
        if mape < 20:  # Less than 20% error
            self.weights['predicted_demand'] = min(0.50, self.weights['predicted_demand'] + 0.02)
            self.weights['stock_gap'] = max(0.20, self.weights['stock_gap'] - 0.01)
        elif mape > 40:  # More than 40% error
            self.weights['predicted_demand'] = max(0.30, self.weights['predicted_demand'] - 0.02)
            self.weights['stock_gap'] = min(0.40, self.weights['stock_gap'] + 0.01)
        
        # If recommendations are accurate, increase trend weight
        if rec_accuracy > 80:
            self.weights['trend'] = min(0.25, self.weights['trend'] + 0.01)
        elif rec_accuracy < 50:
            self.weights['trend'] = max(0.15, self.weights['trend'] - 0.01)
        
        # Normalize weights to sum to 1.0
        total = sum(self.weights.values())
        self.weights = {k: v / total for k, v in self.weights.items()}
        
        # Save adjusted weights
        self.save_weights()
    
    def get_current_weights(self) -> Dict[str, float]:
        """
        Get current adaptive weights
        """
        return self.weights.copy()
    
    def save_weights(self):
        """
        Save weights to disk
        """
        with open(self.weights_file, 'w') as f:
            json.dump({
                'weights': self.weights,
                'updated_at': datetime.now().isoformat()
            }, f, indent=2)
    
    def load_weights(self):
        """
        Load weights from disk
        """
        if not self.weights_file.exists():
            return
        
        try:
            with open(self.weights_file, 'r') as f:
                data = json.load(f)
                self.weights = data.get('weights', self.weights)
        except Exception as e:
            print(f"Error loading weights: {e}")
    
    def _load_predictions(self) -> List[Dict[str, Any]]:
        """
        Load predictions from disk
        """
        if not self.feedback_file.exists():
            return []
        
        try:
            with open(self.feedback_file, 'r') as f:
                return json.load(f)
        except Exception as e:
            print(f"Error loading predictions: {e}")
            return []
    
    def _save_predictions(self, predictions: List[Dict[str, Any]]):
        """
        Save predictions to disk
        """
        with open(self.feedback_file, 'w') as f:
            json.dump(predictions, f, indent=2)
    
    def get_performance_summary(self) -> Dict[str, Any]:
        """
        Get summary of system performance
        """
        predictions = self._load_predictions()
        
        validated = [p for p in predictions if p.get('validated', False)]
        pending = [p for p in predictions if not p.get('validated', False)]
        
        if not validated:
            return {
                'total_predictions': len(predictions),
                'validated': 0,
                'pending': len(pending),
                'message': 'No validated predictions yet'
            }
        
        # Calculate metrics from validated predictions
        mae = sum(abs(p.get('error', 0)) for p in validated) / len(validated)
        mape = sum(p.get('pct_error', 0) for p in validated) / len(validated)
        correct = sum(1 for p in validated if p.get('recommendation_correct', False))
        accuracy = (correct / len(validated)) * 100
        
        return {
            'total_predictions': len(predictions),
            'validated': len(validated),
            'pending': len(pending),
            'mae': round(mae, 2),
            'mape': round(mape, 2),
            'recommendation_accuracy': round(accuracy, 2),
            'current_weights': self.weights
        }
