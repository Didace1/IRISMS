import React, { useState } from 'react';
import { FileText, ChevronDown, ChevronUp, CheckCircle, XCircle, Clock, Calendar, Wrench, Package } from 'lucide-react';

/**
 * Card displaying similar historical repair cases - CLEAN VERSION
 */
const SimilarCasesCard = ({ cases }) => {
  const [expanded, setExpanded] = useState(true);
  const [selectedCase, setSelectedCase] = useState(null);

  const getSimilarityColor = (score) => {
    if (score >= 0.8) return 'text-green-600 bg-green-100 border-green-300';
    if (score >= 0.6) return 'text-blue-600 bg-blue-100 border-blue-300';
    if (score >= 0.4) return 'text-yellow-600 bg-yellow-100 border-yellow-300';
    return 'text-gray-600 bg-gray-100 border-gray-300';
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
  };

  const successCount = cases.filter(c => c.wasSuccessful).length;

  return (
    <div className="bg-white rounded-lg shadow-lg overflow-hidden border-2 border-blue-200">
      {/* Header - Simplified */}
      <div
        className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white p-5 cursor-pointer"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-white/20 p-2 rounded-lg">
              <FileText className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-xl font-bold">We Fixed This {successCount} Times!</h3>
              <p className="text-blue-100 text-sm">
                Real solutions from your team's repair history
              </p>
            </div>
          </div>
          {expanded ? <ChevronUp className="w-6 h-6" /> : <ChevronDown className="w-6 h-6" />}
        </div>
      </div>

      {/* Content */}
      {expanded && (
        <div className="p-5">
          {/* Success Banner - Simplified */}
          {successCount > 0 && (
            <div className="bg-green-50 border-l-4 border-green-500 rounded-r-lg p-4 mb-5">
              <div className="flex items-center gap-3">
                <CheckCircle className="w-6 h-6 text-green-600 flex-shrink-0" />
                <p className="text-green-900 font-semibold">
                  {successCount} successful {successCount === 1 ? 'repair' : 'repairs'} found • Learn from what worked
                </p>
              </div>
            </div>
          )}

          {/* Cases List - Clean Cards */}
          <div className="space-y-4">
            {cases.map((caseItem, index) => (
              <div
                key={index}
                className={`border-2 rounded-lg overflow-hidden transition-all ${
                  selectedCase === index 
                    ? 'border-blue-400 shadow-lg' 
                    : 'border-gray-200 hover:border-blue-300 hover:shadow-md'
                }`}
              >
                {/* Case Header - Compact */}
                <div
                  className="p-4 cursor-pointer bg-gradient-to-r from-gray-50 to-white"
                  onClick={() => setSelectedCase(selectedCase === index ? null : index)}
                >
                  <div className="flex items-start justify-between gap-4">
                    {/* Left: Device Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-2">
                        <h4 className="font-bold text-gray-900 text-lg truncate">
                          {caseItem.brand || caseItem.deviceType} {caseItem.model}
                        </h4>
                        {caseItem.wasSuccessful ? (
                          <span className="flex items-center gap-1 px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs font-semibold">
                            <CheckCircle className="w-3 h-3" />
                            Success
                          </span>
                        ) : (
                          <span className="flex items-center gap-1 px-2 py-1 bg-red-100 text-red-700 rounded-full text-xs font-semibold">
                            <XCircle className="w-3 h-3" />
                            Failed
                          </span>
                        )}
                      </div>
                      <p className="text-gray-700 text-sm line-clamp-2 mb-3">
                        <span className="font-semibold">Problem:</span> {caseItem.symptoms}
                      </p>
                      {caseItem.solution && (
                        <p className="text-green-700 text-sm font-medium line-clamp-1">
                          <span className="text-gray-600">Solution:</span> {caseItem.solution}
                        </p>
                      )}
                    </div>

                    {/* Right: Similarity Score */}
                    <div className="flex flex-col items-center gap-1">
                      <div className={`text-2xl font-bold px-4 py-2 rounded-lg border-2 ${getSimilarityColor(caseItem.similarityScore)}`}>
                        {(caseItem.similarityScore * 100).toFixed(0)}%
                      </div>
                      <span className="text-xs text-gray-500 font-medium">Match</span>
                    </div>
                  </div>

                  {/* Quick Stats */}
                  <div className="flex items-center gap-4 mt-3 pt-3 border-t border-gray-200">
                    <div className="flex items-center gap-1.5 text-gray-600">
                      <Calendar className="w-4 h-4" />
                      <span className="text-sm">{formatDate(caseItem.repairDate)}</span>
                    </div>
                    {caseItem.repairDuration && (
                      <div className="flex items-center gap-1.5 text-gray-600">
                        <Clock className="w-4 h-4" />
                        <span className="text-sm font-semibold">{caseItem.repairDuration} min</span>
                      </div>
                    )}
                    <div className="flex items-center gap-1.5 text-gray-500">
                      <span className="text-xs">Case #{caseItem.caseId}</span>
                    </div>
                    <div className="ml-auto">
                      <span className="text-xs text-blue-600 font-medium">
                        {selectedCase === index ? 'Hide details ▲' : 'Show details ▼'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Expanded Details - Clean Layout */}
                {selectedCase === index && (
                  <div className="p-5 bg-gray-50 border-t-2 border-gray-200 space-y-4">
                    {/* Diagnosis */}
                    {caseItem.diagnosis && (
                      <div className="bg-white rounded-lg p-4 border border-blue-200">
                        <div className="flex items-center gap-2 mb-2">
                          <Wrench className="w-5 h-5 text-blue-600" />
                          <h5 className="font-bold text-gray-900">Diagnosis</h5>
                        </div>
                        <p className="text-gray-700">{caseItem.diagnosis}</p>
                      </div>
                    )}

                    {/* Solution */}
                    {caseItem.solution && (
                      <div className="bg-white rounded-lg p-4 border border-green-200">
                        <div className="flex items-center gap-2 mb-2">
                          <CheckCircle className="w-5 h-5 text-green-600" />
                          <h5 className="font-bold text-gray-900">What We Did</h5>
                        </div>
                        <p className="text-gray-700">{caseItem.solution}</p>
                      </div>
                    )}

                    {/* Parts Used */}
                    {caseItem.partsReplaced && caseItem.partsReplaced.length > 0 && (
                      <div className="bg-white rounded-lg p-4 border border-purple-200">
                        <div className="flex items-center gap-2 mb-3">
                          <Package className="w-5 h-5 text-purple-600" />
                          <h5 className="font-bold text-gray-900">Parts Used</h5>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {caseItem.partsReplaced.map((part, idx) => (
                            <span
                              key={idx}
                              className="px-3 py-1.5 bg-purple-100 text-purple-800 rounded-lg text-sm font-medium"
                            >
                              {part}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Outcome Summary */}
                    <div className="flex items-center gap-3 pt-2">
                      <div className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-lg font-semibold ${
                        caseItem.wasSuccessful
                          ? 'bg-green-100 text-green-800 border-2 border-green-300'
                          : 'bg-red-100 text-red-800 border-2 border-red-300'
                      }`}>
                        {caseItem.wasSuccessful ? (
                          <>
                            <CheckCircle className="w-5 h-5" />
                            <span>Repair Successful</span>
                          </>
                        ) : (
                          <>
                            <XCircle className="w-5 h-5" />
                            <span>Repair Failed</span>
                          </>
                        )}
                      </div>
                      {caseItem.wasReturned && (
                        <div className="flex items-center gap-2 px-4 py-3 rounded-lg bg-orange-100 text-orange-800 border-2 border-orange-300 font-semibold">
                          <span>⚠️ Returned</span>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default SimilarCasesCard;
