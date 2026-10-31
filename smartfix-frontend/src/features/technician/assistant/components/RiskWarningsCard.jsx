import React, { useState } from 'react';
import { AlertTriangle, ChevronDown, ChevronUp, Shield } from 'lucide-react';

/**
 * Card displaying risk warnings
 */
const RiskWarningsCard = ({ warnings }) => {
  const [expanded, setExpanded] = useState(true);

  const getSeverityColor = (severity) => {
    switch (severity?.toLowerCase()) {
      case 'critical':
        return 'bg-red-100 border-red-300 text-red-900';
      case 'high':
        return 'bg-orange-100 border-orange-300 text-orange-900';
      case 'medium':
        return 'bg-yellow-100 border-yellow-300 text-yellow-900';
      case 'low':
        return 'bg-blue-100 border-blue-300 text-blue-900';
      default:
        return 'bg-gray-100 border-gray-300 text-gray-900';
    }
  };

  const getSeverityIcon = (severity) => {
    switch (severity?.toLowerCase()) {
      case 'critical':
      case 'high':
        return <AlertTriangle className="w-5 h-5" />;
      default:
        return <Shield className="w-5 h-5" />;
    }
  };

  const getWarningTypeLabel = (type) => {
    switch (type?.toLowerCase()) {
      case 'high_return_rate':
        return 'High Return Rate';
      case 'incomplete_repair':
        return 'Incomplete Repair Risk';
      case 'recurring_failure':
        return 'Recurring Failure Pattern';
      case 'low_success_rate':
        return 'Low Success Rate';
      default:
        return type;
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-lg overflow-hidden border-2 border-red-200">
      {/* Header */}
      <div
        className="bg-gradient-to-r from-red-600 to-orange-600 text-white p-4 cursor-pointer"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <AlertTriangle className="w-6 h-6" />
            <div>
              <h3 className="text-lg font-bold">⚠️ Risk Warnings</h3>
              <p className="text-sm text-red-100">Important alerts about potential issues</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="bg-white/20 px-3 py-1 rounded-full text-sm font-semibold">
              {warnings.length} {warnings.length === 1 ? 'Warning' : 'Warnings'}
            </span>
            {expanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
          </div>
        </div>
      </div>

      {/* Content */}
      {expanded && (
        <div className="p-4 space-y-3">
          {warnings.map((warning, index) => (
            <div
              key={index}
              className={`border-2 rounded-lg p-4 ${getSeverityColor(warning.severity)}`}
            >
              {/* Warning Header */}
              <div className="flex items-start gap-3 mb-3">
                <div className="flex-shrink-0 mt-1">{getSeverityIcon(warning.severity)}</div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-bold text-lg">
                      {getWarningTypeLabel(warning.warningType)}
                    </span>
                    <span className="px-2 py-1 bg-white/50 rounded-full text-xs font-semibold uppercase">
                      {warning.severity} Severity
                    </span>
                  </div>
                  <p className="font-semibold mb-2">{warning.message}</p>
                </div>
              </div>

              {/* Statistics */}
              {(warning.returnRate !== undefined || warning.affectedCases !== undefined) && (
                <div className="flex gap-4 mb-3">
                  {warning.returnRate !== undefined && (
                    <div className="bg-white/50 rounded px-3 py-2">
                      <div className="text-2xl font-bold">
                        {(warning.returnRate * 100).toFixed(1)}%
                      </div>
                      <div className="text-xs">Return Rate</div>
                    </div>
                  )}
                  {warning.affectedCases !== undefined && (
                    <div className="bg-white/50 rounded px-3 py-2">
                      <div className="text-2xl font-bold">{warning.affectedCases}</div>
                      <div className="text-xs">Affected Cases</div>
                    </div>
                  )}
                </div>
              )}

              {/* Reasoning */}
              {warning.reasoning && (
                <div className="bg-white/50 rounded p-3 mb-3">
                  <p className="text-sm">
                    <strong>Analysis:</strong> {warning.reasoning}
                  </p>
                </div>
              )}

              {/* Recommendation */}
              {warning.recommendation && (
                <div className="bg-white/70 border-2 border-current rounded p-3">
                  <p className="text-sm font-semibold">
                    <strong>Recommended Action:</strong> {warning.recommendation}
                  </p>
                </div>
              )}
            </div>
          ))}

          {/* Important Notice */}
          <div className="bg-red-50 border-2 border-red-300 rounded-lg p-4 mt-4">
            <h4 className="font-bold text-red-900 mb-2 flex items-center gap-2">
              <AlertTriangle className="w-5 h-5" />
              Critical Notice
            </h4>
            <p className="text-sm text-red-800">
              These warnings indicate patterns associated with higher failure rates or customer
              returns. Exercise extra caution and consider alternative approaches. Document all
              diagnostic steps thoroughly.
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default RiskWarningsCard;
