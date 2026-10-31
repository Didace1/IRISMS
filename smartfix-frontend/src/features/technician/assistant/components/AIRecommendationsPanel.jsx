import React from 'react';
import { TrendingUp } from 'lucide-react';
import ProbableFaultsCard from './ProbableFaultsCard';
import ComponentPredictionsCard from './ComponentPredictionsCard';
import RepairRecommendationsCard from './RepairRecommendationsCard';
import RiskWarningsCard from './RiskWarningsCard';
import SimilarCasesCard from './SimilarCasesCard';
import RepairPatternsCard from './RepairPatternsCard';
import AnalyticsCharts from './AnalyticsCharts';

/**
 * Main panel displaying all AI analysis results
 */
const AIRecommendationsPanel = ({ result }) => {
  if (!result) return null;

  const {
    probableFaults = [],
    componentPredictions = [],
    repairRecommendations = [],
    riskWarnings = [],
    similarCases = [],
    detectedPatterns = [],
    analytics,
    confidenceNote,
  } = result;

  return (
    <div className="space-y-6">
      {/* Header with Confidence Note */}
      {confidenceNote && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <TrendingUp className="w-5 h-5 text-blue-600 mt-0.5" />
            <div>
              <h3 className="font-semibold text-blue-900 mb-1">Analysis Confidence</h3>
              <p className="text-sm text-blue-800 whitespace-pre-line">{confidenceNote}</p>
            </div>
          </div>
        </div>
      )}

      {/* Risk Warnings - Show First if Present */}
      {riskWarnings.length > 0 && <RiskWarningsCard warnings={riskWarnings} />}

      {/* Similar Cases - MAIN FEATURE: Show what we fixed before */}
      {similarCases.length > 0 && <SimilarCasesCard cases={similarCases} />}

      {/* Repair Recommendations - Based on successful past repairs */}
      {repairRecommendations.length > 0 && (
        <RepairRecommendationsCard recommendations={repairRecommendations} />
      )}

      {/* Probable Faults - Statistical predictions */}
      {probableFaults.length > 0 && <ProbableFaultsCard faults={probableFaults} />}

      {/* Component Predictions */}
      {componentPredictions.length > 0 && (
        <ComponentPredictionsCard predictions={componentPredictions} />
      )}

      {/* Detected Patterns */}
      {detectedPatterns.length > 0 && <RepairPatternsCard patterns={detectedPatterns} />}

      {/* Analytics Summary */}
      {analytics && <AnalyticsCharts analytics={analytics} />}

      {/* No Results Message */}
      {probableFaults.length === 0 &&
        componentPredictions.length === 0 &&
        repairRecommendations.length === 0 &&
        similarCases.length === 0 && (
          <div className="bg-white rounded-lg shadow-lg p-8 text-center">
            <p className="text-gray-600 mb-2">No similar cases found in historical data</p>
            <p className="text-sm text-gray-500">
              This might be a new type of issue. Try adjusting the device information or symptoms description, 
              or consult with a senior technician.
            </p>
          </div>
        )}
    </div>
  );
};

export default AIRecommendationsPanel;
