// src/features/failure-prediction/components/ComponentHealthCard.jsx
import React from 'react';
import { Battery, Cpu, HardDrive, Monitor, Fan, Zap, AlertTriangle, CheckCircle } from 'lucide-react';

const getComponentIcon = (componentType) => {
  const icons = {
    battery: Battery,
    screen: Monitor,
    motherboard: Cpu,
    ram: Cpu,
    storage: HardDrive,
    fan: Fan,
    power_supply: Zap,
    default: Cpu
  };
  return icons[componentType] || icons.default;
};

const getRiskColor = (riskLevel) => {
  const colors = {
    low: 'text-green-600 bg-green-50 border-green-200',
    medium: 'text-yellow-600 bg-yellow-50 border-yellow-200',
    high: 'text-orange-600 bg-orange-50 border-orange-200',
    critical: 'text-red-600 bg-red-50 border-red-200'
  };
  return colors[riskLevel] || colors.low;
};

const getRiskBadge = (riskLevel) => {
  const badges = {
    low: 'bg-green-100 text-green-800',
    medium: 'bg-yellow-100 text-yellow-800',
    high: 'bg-orange-100 text-orange-800',
    critical: 'bg-red-100 text-red-800'
  };
  return badges[riskLevel] || badges.low;
};

export const ComponentHealthCard = ({ component, onViewDetails }) => {
  const Icon = getComponentIcon(component.type);
  const riskColor = getRiskColor(component.riskLevel);
  const riskBadge = getRiskBadge(component.riskLevel);

  return (
    <div className={`bg-white rounded-lg shadow-md p-6 border-l-4 ${
      component.riskLevel === 'critical' ? 'border-l-red-500' :
      component.riskLevel === 'high' ? 'border-l-orange-500' :
      component.riskLevel === 'medium' ? 'border-l-yellow-500' :
      'border-l-green-500'
    }`}>
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center space-x-3">
          <div className={`p-2 rounded-lg ${riskColor}`}>
            <Icon className="w-6 h-6" />
          </div>
          <div>
            <h3 className="font-semibold text-gray-900">{component.name}</h3>
            <p className="text-sm text-gray-500">{component.deviceModel}</p>
          </div>
        </div>
        <span className={`px-2 py-1 rounded-full text-xs font-medium ${riskBadge}`}>
          {component.riskLevel.toUpperCase()} RISK
        </span>
      </div>

      <div className="space-y-3">
        <div>
          <div className="flex justify-between text-sm mb-1">
            <span className="text-gray-600">Health Score</span>
            <span className="font-medium">{component.healthScore}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className={`h-2 rounded-full transition-all ${
                component.healthScore >= 70 ? 'bg-green-500' :
                component.healthScore >= 40 ? 'bg-yellow-500' :
                'bg-red-500'
              }`}
              style={{ width: `${component.healthScore}%` }}
            />
          </div>
        </div>

        <div>
          <div className="flex justify-between text-sm mb-1">
            <span className="text-gray-600">Remaining Life</span>
            <span className="font-medium">{component.remainingLife} days</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className="bg-blue-500 h-2 rounded-full transition-all"
              style={{ width: `${(component.remainingLife / component.expectedLife) * 100}%` }}
            />
          </div>
        </div>

        <div className="pt-2">
          <p className="text-sm text-gray-600">
            <span className="font-medium">Failure Probability:</span> {component.failureProbability}%
          </p>
          {component.predictedIssue && (
            <p className="text-sm text-gray-600 mt-1">
              <span className="font-medium">Predicted Issue:</span> {component.predictedIssue}
            </p>
          )}
        </div>

        <button
          onClick={() => onViewDetails(component)}
          className="w-full mt-2 px-4 py-2 text-sm bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
        >
          View Details & Recommendations
        </button>
      </div>
    </div>
  );
};