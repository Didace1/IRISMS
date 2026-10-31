import React, { useState } from 'react';
import { AlertCircle, ChevronDown, ChevronUp, TrendingUp } from 'lucide-react';

/**
 * Card displaying probable fault predictions
 */
const ProbableFaultsCard = ({ faults }) => {
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

  const getProbabilityColor = (probability) => {
    if (probability >= 0.7) return 'text-red-600';
    if (probability >= 0.4) return 'text-yellow-600';
    return 'text-blue-600';
  };

  return (
    <div className="bg-white rounded-lg shadow-lg overflow-hidden">
      {/* Header */}
      <div
        className="bg-gradient-to-r from-red-500 to-orange-500 text-white p-4 cursor-pointer"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <AlertCircle className="w-6 h-6" />
            <div>
              <h3 className="text-lg font-bold">Probable Faults</h3>
              <p className="text-sm text-red-100">
                Statistical predictions based on historical data
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="bg-white/20 px-3 py-1 rounded-full text-sm font-semibold">
              {faults.length} {faults.length === 1 ? 'Fault' : 'Faults'}
            </span>
            {expanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
          </div>
        </div>
      </div>

      {/* Content */}
      {expanded && (
        <div className="p-4 space-y-3">
          {faults.map((fault, index) => (
            <div
              key={index}
              className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
            >
              {/* Fault Header */}
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-semibold text-gray-900 text-lg">
                      {fault.faultCategory}
                    </span>
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-semibold ${getConfidenceColor(
                        fault.confidenceLevel
                      )}`}
                    >
                      {fault.confidenceLevel} Confidence
                    </span>
                  </div>
                  <p className="text-gray-700">{fault.faultDescription}</p>
                </div>
                <div className="text-right ml-4">
                  <div className={`text-2xl font-bold ${getProbabilityColor(fault.probability)}`}>
                    {(fault.probability * 100).toFixed(1)}%
                  </div>
                  <div className="text-xs text-gray-500">Probability</div>
                </div>
              </div>

              {/* Reasoning */}
              {fault.reasoning && (
                <div className="bg-blue-50 border border-blue-200 rounded p-3 mb-3">
                  <p className="text-sm text-blue-900">
                    <strong>Reasoning:</strong> {fault.reasoning}
                  </p>
                </div>
              )}

              {/* Statistics */}
              <div className="flex items-center gap-4 text-sm">
                <div className="flex items-center gap-2 text-gray-600">
                  <TrendingUp className="w-4 h-4" />
                  <span>
                    Based on <strong>{fault.basedOnCases}</strong> similar{' '}
                    {fault.basedOnCases === 1 ? 'case' : 'cases'}
                  </span>
                </div>
              </div>
            </div>
          ))}

          {/* Disclaimer */}
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mt-4">
            <p className="text-xs text-yellow-800">
              <strong>Note:</strong> These are probable faults based on statistical analysis of
              historical data. Always perform thorough diagnostic testing to confirm the actual
              fault.
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProbableFaultsCard;
