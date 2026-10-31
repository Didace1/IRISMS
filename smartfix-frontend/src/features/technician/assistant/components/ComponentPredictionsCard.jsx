import React, { useState } from 'react';
import { Cpu, ChevronDown, ChevronUp, AlertTriangle } from 'lucide-react';

/**
 * Card displaying component failure predictions
 */
const ComponentPredictionsCard = ({ predictions }) => {
  const [expanded, setExpanded] = useState(true);

  const getConfidenceColor = (level) => {
    switch (level?.toLowerCase()) {
      case 'high':
        return 'text-green-700 bg-green-100';
      case 'medium':
        return 'text-yellow-700 bg-yellow-100';
      case 'low':
        return 'text-orange-700 bg-orange-100';
      default:
        return 'text-gray-700 bg-gray-100';
    }
  };

  const getRiskLevel = (probability) => {
    if (probability >= 0.7) return { label: 'High Risk', color: 'text-red-600' };
    if (probability >= 0.4) return { label: 'Medium Risk', color: 'text-yellow-600' };
    return { label: 'Low Risk', color: 'text-green-600' };
  };

  return (
    <div className="bg-white rounded-lg shadow-lg overflow-hidden">
      {/* Header */}
      <div
        className="bg-gradient-to-r from-purple-500 to-pink-500 text-white p-4 cursor-pointer"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Cpu className="w-6 h-6" />
            <div>
              <h3 className="text-lg font-bold">Component Predictions</h3>
              <p className="text-sm text-purple-100">Likely failing components analysis</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="bg-white/20 px-3 py-1 rounded-full text-sm font-semibold">
              {predictions.length} {predictions.length === 1 ? 'Component' : 'Components'}
            </span>
            {expanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
          </div>
        </div>
      </div>

      {/* Content */}
      {expanded && (
        <div className="p-4 space-y-3">
          {predictions.map((prediction, index) => {
            const risk = getRiskLevel(prediction.failureProbability);
            return (
              <div
                key={index}
                className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
              >
                {/* Component Header */}
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-semibold text-gray-900 text-lg">
                        {prediction.componentName}
                      </span>
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-semibold ${getConfidenceColor(
                          prediction.confidenceLevel
                        )}`}
                      >
                        {prediction.confidenceLevel} Confidence
                      </span>
                    </div>
                  </div>
                  <div className="text-right ml-4">
                    <div className={`text-2xl font-bold ${risk.color}`}>
                      {(prediction.failureProbability * 100).toFixed(1)}%
                    </div>
                    <div className={`text-xs font-semibold ${risk.color}`}>{risk.label}</div>
                  </div>
                </div>

                {/* Statistics Grid */}
                <div className="grid grid-cols-3 gap-3 mb-3">
                  <div className="bg-gray-50 rounded p-2 text-center">
                    <div className="text-lg font-bold text-gray-900">
                      {prediction.historicalFailures}
                    </div>
                    <div className="text-xs text-gray-600">Failures</div>
                  </div>
                  <div className="bg-gray-50 rounded p-2 text-center">
                    <div className="text-lg font-bold text-gray-900">
                      {prediction.historicalReplacements}
                    </div>
                    <div className="text-xs text-gray-600">Replacements</div>
                  </div>
                  <div className="bg-gray-50 rounded p-2 text-center">
                    <div className="text-lg font-bold text-gray-900">
                      {(prediction.replacementRate * 100).toFixed(0)}%
                    </div>
                    <div className="text-xs text-gray-600">Replace Rate</div>
                  </div>
                </div>

                {/* Recommendation */}
                {prediction.recommendation && (
                  <div className="bg-blue-50 border border-blue-200 rounded p-3 flex items-start gap-2">
                    <AlertTriangle className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
                    <p className="text-sm text-blue-900">
                      <strong>Recommendation:</strong> {prediction.recommendation}
                    </p>
                  </div>
                )}
              </div>
            );
          })}

          {/* Disclaimer */}
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mt-4">
            <p className="text-xs text-yellow-800">
              <strong>Note:</strong> Component predictions are based on historical failure patterns.
              Inspect components thoroughly before replacement.
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default ComponentPredictionsCard;
