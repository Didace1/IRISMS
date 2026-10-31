import React, { useState } from 'react';
import { Wrench, ChevronDown, ChevronUp, Clock, CheckCircle, Package } from 'lucide-react';

/**
 * Card displaying repair recommendations
 */
const RepairRecommendationsCard = ({ recommendations }) => {
  const [expanded, setExpanded] = useState(true);
  const [selectedRec, setSelectedRec] = useState(null);

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

  const getPriorityColor = (priority) => {
    if (priority === 1) return 'bg-red-100 text-red-700 border-red-300';
    if (priority === 2) return 'bg-yellow-100 text-yellow-700 border-yellow-300';
    return 'bg-blue-100 text-blue-700 border-blue-300';
  };

  const getPriorityLabel = (priority) => {
    if (priority === 1) return 'High Priority';
    if (priority === 2) return 'Medium Priority';
    return 'Low Priority';
  };

  return (
    <div className="bg-white rounded-lg shadow-lg overflow-hidden">
      {/* Header */}
      <div
        className="bg-gradient-to-r from-green-500 to-teal-500 text-white p-4 cursor-pointer"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Wrench className="w-6 h-6" />
            <div>
              <h3 className="text-lg font-bold">Repair Recommendations</h3>
              <p className="text-sm text-green-100">Suggested repair approaches with success rates</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="bg-white/20 px-3 py-1 rounded-full text-sm font-semibold">
              {recommendations.length} {recommendations.length === 1 ? 'Option' : 'Options'}
            </span>
            {expanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
          </div>
        </div>
      </div>

      {/* Content */}
      {expanded && (
        <div className="p-4 space-y-3">
          {recommendations.map((rec, index) => (
            <div
              key={index}
              className="border border-gray-200 rounded-lg overflow-hidden hover:shadow-md transition-shadow"
            >
              {/* Recommendation Header */}
              <div
                className="p-4 cursor-pointer bg-gray-50 hover:bg-gray-100"
                onClick={() => setSelectedRec(selectedRec === index ? null : index)}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="font-semibold text-gray-900 text-lg">
                        {rec.repairAction}
                      </span>
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-semibold border ${getPriorityColor(
                          rec.priority
                        )}`}
                      >
                        {getPriorityLabel(rec.priority)}
                      </span>
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-semibold ${getConfidenceColor(
                          rec.confidenceLevel
                        )}`}
                      >
                        {rec.confidenceLevel} Confidence
                      </span>
                    </div>
                    <p className="text-gray-700 text-sm">{rec.description}</p>
                  </div>
                  <div className="text-right ml-4">
                    <div className="text-2xl font-bold text-green-600">
                      {(rec.successRate * 100).toFixed(0)}%
                    </div>
                    <div className="text-xs text-gray-500">Success Rate</div>
                  </div>
                </div>

                {/* Quick Stats */}
                <div className="flex items-center gap-4 mt-3 text-sm text-gray-600">
                  <div className="flex items-center gap-1">
                    <CheckCircle className="w-4 h-4" />
                    <span>{rec.basedOnCases} cases</span>
                  </div>
                  {rec.averageDuration && (
                    <div className="flex items-center gap-1">
                      <Clock className="w-4 h-4" />
                      <span>~{rec.averageDuration} min</span>
                    </div>
                  )}
                  {rec.requiredParts && rec.requiredParts.length > 0 && (
                    <div className="flex items-center gap-1">
                      <Package className="w-4 h-4" />
                      <span>{rec.requiredParts.length} parts needed</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Expanded Details */}
              {selectedRec === index && (
                <div className="p-4 border-t border-gray-200 bg-white space-y-3">
                  {/* Required Parts */}
                  {rec.requiredParts && rec.requiredParts.length > 0 && (
                    <div>
                      <h4 className="font-semibold text-gray-900 mb-2 flex items-center gap-2">
                        <Package className="w-4 h-4" />
                        Required Parts
                      </h4>
                      <div className="flex flex-wrap gap-2">
                        {rec.requiredParts.map((part, idx) => (
                          <span
                            key={idx}
                            className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm"
                          >
                            {part}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Procedure */}
                  {rec.procedure && (
                    <div>
                      <h4 className="font-semibold text-gray-900 mb-2">Procedure</h4>
                      <div className="bg-gray-50 rounded p-3">
                        <p className="text-sm text-gray-700 whitespace-pre-line">
                          {rec.procedure}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}

          {/* Disclaimer */}
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mt-4">
            <p className="text-xs text-yellow-800">
              <strong>Note:</strong> Success rates are based on historical data. Actual results may
              vary. Follow proper repair procedures and safety guidelines.
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default RepairRecommendationsCard;
