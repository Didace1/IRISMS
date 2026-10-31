import React, { useState } from 'react';
import { TrendingUp, ChevronDown, ChevronUp, Target } from 'lucide-react';

/**
 * Card displaying detected repair patterns
 */
const RepairPatternsCard = ({ patterns }) => {
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

  const getSuccessRateColor = (rate) => {
    const rateNum = typeof rate === 'number' ? rate : parseFloat(rate);
    if (rateNum >= 80) return 'text-green-600';
    if (rateNum >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  return (
    <div className="bg-white rounded-lg shadow-lg overflow-hidden">
      {/* Header */}
      <div
        className="bg-gradient-to-r from-cyan-500 to-blue-500 text-white p-4 cursor-pointer"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <TrendingUp className="w-6 h-6" />
            <div>
              <h3 className="text-lg font-bold">Detected Repair Patterns</h3>
              <p className="text-sm text-cyan-100">Recurring patterns in repair history</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="bg-white/20 px-3 py-1 rounded-full text-sm font-semibold">
              {patterns.length} {patterns.length === 1 ? 'Pattern' : 'Patterns'}
            </span>
            {expanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
          </div>
        </div>
      </div>

      {/* Content */}
      {expanded && (
        <div className="p-4 space-y-3">
          {patterns.map((pattern, index) => {
            const successRate = typeof pattern.successRate === 'number' 
              ? pattern.successRate 
              : parseFloat(pattern.successRate);
            const returnRate = typeof pattern.returnRate === 'number'
              ? pattern.returnRate
              : parseFloat(pattern.returnRate);

            return (
              <div
                key={index}
                className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
              >
                {/* Pattern Header */}
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <Target className="w-5 h-5 text-cyan-600" />
                      <span className="font-semibold text-gray-900 text-lg">
                        {pattern.patternDescription}
                      </span>
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-semibold ${getConfidenceColor(
                          pattern.confidenceLevel
                        )}`}
                      >
                        {pattern.confidenceLevel} Confidence
                      </span>
                    </div>
                    {pattern.faultCategory && (
                      <div className="text-sm text-gray-600 mb-2">
                        <strong>Fault Category:</strong> {pattern.faultCategory}
                      </div>
                    )}
                  </div>
                  <div className="text-right ml-4">
                    <div className="text-2xl font-bold text-cyan-600">
                      {pattern.occurrenceCount}
                    </div>
                    <div className="text-xs text-gray-500">Occurrences</div>
                  </div>
                </div>

                {/* Common Solution */}
                {pattern.commonSolution && (
                  <div className="bg-blue-50 border border-blue-200 rounded p-3 mb-3">
                    <h4 className="font-semibold text-blue-900 mb-1">Common Solution</h4>
                    <p className="text-sm text-blue-800">{pattern.commonSolution}</p>
                  </div>
                )}

                {/* Statistics Grid */}
                <div className="grid grid-cols-2 gap-3 mb-3">
                  <div className="bg-gray-50 rounded p-3">
                    <div className={`text-2xl font-bold ${getSuccessRateColor(successRate)}`}>
                      {successRate.toFixed(1)}%
                    </div>
                    <div className="text-xs text-gray-600">Success Rate</div>
                  </div>
                  <div className="bg-gray-50 rounded p-3">
                    <div className="text-2xl font-bold text-gray-900">
                      {returnRate.toFixed(1)}%
                    </div>
                    <div className="text-xs text-gray-600">Return Rate</div>
                  </div>
                </div>

                {/* Recommendation */}
                {pattern.recommendation && (
                  <div className="bg-green-50 border border-green-200 rounded p-3">
                    <p className="text-sm text-green-900">
                      <strong>Recommendation:</strong> {pattern.recommendation}
                    </p>
                  </div>
                )}
              </div>
            );
          })}

          {/* Info Note */}
          <div className="bg-cyan-50 border border-cyan-200 rounded-lg p-3 mt-4">
            <p className="text-xs text-cyan-800">
              <strong>Pattern Analysis:</strong> These patterns are identified from recurring
              combinations of faults and solutions in historical data. Higher occurrence counts
              indicate more established patterns.
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default RepairPatternsCard;
