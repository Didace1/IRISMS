import React, { useState } from 'react';
import { BarChart3, ChevronDown, ChevronUp, TrendingUp, Clock, AlertCircle } from 'lucide-react';

/**
 * Component displaying analytics summary and trends
 */
const AnalyticsCharts = ({ analytics }) => {
  const [expanded, setExpanded] = useState(false);

  if (!analytics) return null;

  const {
    totalHistoricalCases = 0,
    similarCasesFound = 0,
    patternsDetected = 0,
    averageSuccessRate = 0,
    averageReturnRate = 0,
    averageRepairDuration = 0,
    repairTrends = [],
  } = analytics;

  const getSuccessRateColor = (rate) => {
    if (rate >= 80) return 'text-green-600 bg-green-100';
    if (rate >= 60) return 'text-yellow-600 bg-yellow-100';
    return 'text-red-600 bg-red-100';
  };

  return (
    <div className="bg-white rounded-lg shadow-lg overflow-hidden">
      {/* Header */}
      <div
        className="bg-gradient-to-r from-gray-700 to-gray-900 text-white p-4 cursor-pointer"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <BarChart3 className="w-6 h-6" />
            <div>
              <h3 className="text-lg font-bold">Analytics Summary</h3>
              <p className="text-sm text-gray-300">Historical data insights and trends</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {expanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
          </div>
        </div>
      </div>

      {/* Content */}
      {expanded && (
        <div className="p-4 space-y-4">
          {/* Key Metrics Grid */}
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {/* Total Cases */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <BarChart3 className="w-5 h-5 text-blue-600" />
                <span className="text-sm font-semibold text-blue-900">Total Cases</span>
              </div>
              <div className="text-3xl font-bold text-blue-600">{totalHistoricalCases}</div>
              <div className="text-xs text-blue-700 mt-1">In database</div>
            </div>

            {/* Similar Cases */}
            <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <TrendingUp className="w-5 h-5 text-purple-600" />
                <span className="text-sm font-semibold text-purple-900">Similar Cases</span>
              </div>
              <div className="text-3xl font-bold text-purple-600">{similarCasesFound}</div>
              <div className="text-xs text-purple-700 mt-1">Matching criteria</div>
            </div>

            {/* Patterns Detected */}
            <div className="bg-cyan-50 border border-cyan-200 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <AlertCircle className="w-5 h-5 text-cyan-600" />
                <span className="text-sm font-semibold text-cyan-900">Patterns</span>
              </div>
              <div className="text-3xl font-bold text-cyan-600">{patternsDetected}</div>
              <div className="text-xs text-cyan-700 mt-1">Identified</div>
            </div>

            {/* Average Success Rate */}
            <div
              className={`border-2 rounded-lg p-4 ${getSuccessRateColor(averageSuccessRate * 100)}`}
            >
              <div className="flex items-center gap-2 mb-2">
                <span className="text-sm font-semibold">Success Rate</span>
              </div>
              <div className="text-3xl font-bold">{(averageSuccessRate * 100).toFixed(1)}%</div>
              <div className="text-xs mt-1">Average</div>
            </div>

            {/* Average Return Rate */}
            <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-sm font-semibold text-orange-900">Return Rate</span>
              </div>
              <div className="text-3xl font-bold text-orange-600">
                {(averageReturnRate * 100).toFixed(1)}%
              </div>
              <div className="text-xs text-orange-700 mt-1">Average</div>
            </div>

            {/* Average Duration */}
            <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <Clock className="w-5 h-5 text-indigo-600" />
                <span className="text-sm font-semibold text-indigo-900">Avg Duration</span>
              </div>
              <div className="text-3xl font-bold text-indigo-600">{averageRepairDuration}</div>
              <div className="text-xs text-indigo-700 mt-1">Minutes</div>
            </div>
          </div>

          {/* Repair Trends */}
          {repairTrends && repairTrends.length > 0 && (
            <div className="border border-gray-200 rounded-lg p-4">
              <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-gray-600" />
                Repair Trends Over Time
              </h4>
              <div className="space-y-2">
                {repairTrends.map((trend, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-3 bg-gray-50 rounded hover:bg-gray-100"
                  >
                    <div className="flex-1">
                      <span className="font-semibold text-gray-900">{trend.period}</span>
                    </div>
                    <div className="flex items-center gap-4 text-sm">
                      <div className="text-center">
                        <div className="font-bold text-gray-900">{trend.caseCount}</div>
                        <div className="text-xs text-gray-600">Cases</div>
                      </div>
                      <div className="text-center">
                        <div
                          className={`font-bold ${
                            trend.successRate >= 80
                              ? 'text-green-600'
                              : trend.successRate >= 60
                              ? 'text-yellow-600'
                              : 'text-red-600'
                          }`}
                        >
                          {(trend.successRate * 100).toFixed(0)}%
                        </div>
                        <div className="text-xs text-gray-600">Success</div>
                      </div>
                      <div className="text-center">
                        <div className="font-bold text-orange-600">
                          {(trend.returnRate * 100).toFixed(0)}%
                        </div>
                        <div className="text-xs text-gray-600">Return</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Data Quality Indicator */}
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
            <h4 className="font-semibold text-gray-900 mb-2">Data Quality Assessment</h4>
            <div className="space-y-2 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-gray-700">Sample Size:</span>
                <span
                  className={`font-semibold ${
                    totalHistoricalCases >= 50
                      ? 'text-green-600'
                      : totalHistoricalCases >= 20
                      ? 'text-yellow-600'
                      : 'text-red-600'
                  }`}
                >
                  {totalHistoricalCases >= 50
                    ? 'Excellent'
                    : totalHistoricalCases >= 20
                    ? 'Good'
                    : 'Limited'}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-700">Match Quality:</span>
                <span
                  className={`font-semibold ${
                    similarCasesFound >= 10
                      ? 'text-green-600'
                      : similarCasesFound >= 5
                      ? 'text-yellow-600'
                      : 'text-red-600'
                  }`}
                >
                  {similarCasesFound >= 10
                    ? 'High'
                    : similarCasesFound >= 5
                    ? 'Medium'
                    : 'Low'}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-700">Pattern Confidence:</span>
                <span
                  className={`font-semibold ${
                    patternsDetected >= 3
                      ? 'text-green-600'
                      : patternsDetected >= 1
                      ? 'text-yellow-600'
                      : 'text-gray-600'
                  }`}
                >
                  {patternsDetected >= 3
                    ? 'Strong'
                    : patternsDetected >= 1
                    ? 'Moderate'
                    : 'Weak'}
                </span>
              </div>
            </div>
          </div>

          {/* Info Note */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
            <p className="text-xs text-blue-800">
              <strong>Analytics Note:</strong> These metrics are calculated from all matching
              historical cases. Larger sample sizes provide more reliable predictions. Success and
              return rates help assess the reliability of recommended approaches.
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default AnalyticsCharts;
