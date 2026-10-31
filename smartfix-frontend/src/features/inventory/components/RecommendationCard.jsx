import React from 'react';
import {
  Package,
  TrendingUp,
  Award,
  Target,
  DollarSign,
  Calendar,
  AlertCircle,
  CheckCircle
} from 'lucide-react';
import { formatCurrency, formatNumber } from '../../../shared/utils/formatters';

export const RecommendationCard = ({ recommendation }) => {
  if (!recommendation) return null;

  const getPriorityColor = (score) => {
    if (score >= 4) return 'border-red-500 bg-red-50';
    if (score >= 3) return 'border-yellow-500 bg-yellow-50';
    return 'border-green-500 bg-green-50';
  };

  const getUrgencyBadge = (urgency) => {
    switch (urgency) {
      case 'critical':
        return <span className="px-3 py-1 bg-red-100 text-red-700 rounded-full text-xs font-semibold">🔴 CRITICAL</span>;
      case 'high':
        return <span className="px-3 py-1 bg-orange-100 text-orange-700 rounded-full text-xs font-semibold">🟠 HIGH</span>;
      case 'medium':
        return <span className="px-3 py-1 bg-yellow-100 text-yellow-700 rounded-full text-xs font-semibold">🟡 MEDIUM</span>;
      case 'low':
        return <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-semibold">🟢 LOW</span>;
      default:
        return null;
    }
  };

  const getDemandBadge = (demand) => {
    switch (demand) {
      case 'high':
        return <span className="text-red-600 font-semibold">High Demand</span>;
      case 'medium':
        return <span className="text-yellow-600 font-semibold">Medium Demand</span>;
      case 'low':
        return <span className="text-green-600 font-semibold">Low Demand</span>;
      default:
        return <span className="text-gray-600">Unknown</span>;
    }
  };

  const getMarginBadge = (margin) => {
    switch (margin) {
      case 'high':
        return <span className="text-green-600 font-semibold">High Margin</span>;
      case 'medium':
        return <span className="text-yellow-600 font-semibold">Medium Margin</span>;
      case 'low':
        return <span className="text-gray-600 font-semibold">Low Margin</span>;
      default:
        return <span className="text-gray-600">Unknown</span>;
    }
  };

  return (
    <div className={`bg-white rounded-xl shadow-lg border-l-8 ${getPriorityColor(recommendation.recommendation_score)} p-8 transition-all`}>
      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div className="flex-1">
          <h2 className="text-3xl font-bold text-gray-900 mb-2">
            {recommendation.product_name}
          </h2>
          <div className="flex items-center gap-3 flex-wrap">
            {getUrgencyBadge(recommendation.reason?.urgency)}
            <span className="text-gray-600">•</span>
            <span className="text-gray-700 font-medium">{recommendation.brand}</span>
            <span className="text-gray-600">•</span>
            <span className="text-gray-700">{recommendation.category}</span>
          </div>
        </div>
        <div className="text-right">
          <div className="flex items-center gap-2 justify-end mb-1">
            <Target className="w-5 h-5 text-blue-500" />
            <span className="text-sm text-gray-600">AI Score</span>
          </div>
          <div className="text-3xl font-bold text-blue-600">
            {recommendation.recommendation_score}/5.0
          </div>
          <div className="text-xs text-gray-500 mt-1">
            {recommendation.confidence?.level.replace('_', ' ')} confidence
          </div>
        </div>
      </div>

      {/* Recommended Quantity - Prominent */}
      <div className="bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-200 rounded-lg p-6 mb-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-green-700 font-medium mb-1">Recommended Order Quantity</p>
            <p className="text-4xl font-bold text-green-600">
              {formatNumber(recommendation.recommended_quantity)} units
            </p>
          </div>
          <Package className="w-16 h-16 text-green-500 opacity-50" />
        </div>
      </div>

      {/* Reason Section */}
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
          <AlertCircle className="w-5 h-5 text-blue-500" />
          Why This Recommendation?
        </h3>
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <p className="text-gray-800 font-medium mb-3">{recommendation.reason?.summary}</p>
          <ul className="space-y-2">
            {recommendation.reason?.details?.map((detail, index) => (
              <li key={index} className="flex items-start gap-2 text-gray-700">
                <CheckCircle className="w-4 h-4 text-blue-500 mt-0.5 flex-shrink-0" />
                <span>{detail}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        {/* Current Stock */}
        <div className="bg-gray-50 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <Package className="w-4 h-4 text-gray-500" />
            <p className="text-xs text-gray-600 font-medium">Current Stock</p>
          </div>
          <p className="text-2xl font-bold text-gray-900">{recommendation.current_stock}</p>
          <p className="text-xs text-gray-500 mt-1">
            {recommendation.metrics?.stock_coverage_days?.toFixed(1)} days coverage
          </p>
        </div>

        {/* Units Sold */}
        <div className="bg-gray-50 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp className="w-4 h-4 text-gray-500" />
            <p className="text-xs text-gray-600 font-medium">Units Sold</p>
          </div>
          <p className="text-2xl font-bold text-gray-900">{recommendation.metrics?.units_sold_30d || 0}</p>
          <p className="text-xs text-gray-500 mt-1">Last 30 days</p>
        </div>

        {/* Sales Velocity */}
        <div className="bg-gray-50 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <Calendar className="w-4 h-4 text-gray-500" />
            <p className="text-xs text-gray-600 font-medium">Velocity</p>
          </div>
          <p className="text-2xl font-bold text-gray-900">{recommendation.metrics?.daily_velocity}</p>
          <p className="text-xs text-gray-500 mt-1">units/day</p>
        </div>

        {/* Revenue */}
        <div className="bg-gray-50 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <DollarSign className="w-4 h-4 text-gray-500" />
            <p className="text-xs text-gray-600 font-medium">Revenue (30 days)</p>
          </div>
          <p className="text-lg font-bold text-gray-900">
            {formatCurrency(recommendation.metrics?.revenue_generated || 0)}
          </p>
          <p className="text-xs text-gray-500 mt-1">Total sales value</p>
        </div>
      </div>

      {/* Market Indicators */}
      <div className="flex items-center justify-start pt-4 border-t border-gray-200">
        <div className="flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-gray-400" />
          <span className="text-sm text-gray-600">Market Demand:</span>
          {getDemandBadge(recommendation.market_demand)}
        </div>
      </div>
    </div>
  );
};
