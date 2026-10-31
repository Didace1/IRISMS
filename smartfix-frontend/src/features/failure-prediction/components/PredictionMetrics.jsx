// src/features/failure-prediction/components/PredictionMetrics.jsx
import React from 'react';
import { TrendingUp, TrendingDown, Activity, Target } from 'lucide-react';

export const PredictionMetrics = ({ metrics }) => {
  const metricCards = [
    {
      title: 'Prediction Accuracy',
      value: `${metrics.accuracy}%`,
      change: metrics.accuracyChange,
      icon: Target,
      color: 'blue'
    },
    {
      title: 'Components at Risk',
      value: metrics.componentsAtRisk,
      change: metrics.riskChange,
      icon: AlertTriangle,
      color: 'red'
    },
    {
      title: 'Avg. Remaining Life',
      value: `${metrics.avgRemainingLife} days`,
      change: metrics.lifeChange,
      icon: Activity,
      color: 'green'
    },
    {
      title: 'Preventive Actions',
      value: metrics.preventiveActions,
      change: metrics.actionsChange,
      icon: TrendingUp,
      color: 'purple'
    }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {metricCards.map((metric, index) => {
        const Icon = metric.icon;
        const isPositive = metric.change > 0;
        const isTarget = metric.title === 'Prediction Accuracy';
        
        return (
          <div key={index} className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between mb-4">
              <div className={`p-2 rounded-lg bg-${metric.color}-100`}>
                <Icon className={`w-5 h-5 text-${metric.color}-600`} />
              </div>
              {metric.change !== undefined && (
                <div className={`flex items-center ${isPositive ? 'text-green-600' : 'text-red-600'}`}>
                  {isPositive ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
                  <span className="text-sm ml-1">{Math.abs(metric.change)}%</span>
                </div>
              )}
            </div>
            <h3 className="text-2xl font-bold text-gray-900">{metric.value}</h3>
            <p className="text-sm text-gray-600 mt-1">{metric.title}</p>
          </div>
        );
      })}
    </div>
  );
};