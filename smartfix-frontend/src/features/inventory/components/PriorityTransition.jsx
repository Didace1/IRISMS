import React from 'react';
import { CheckCircle, ChevronRight, FileText, AlertCircle, TrendingUp, Package } from 'lucide-react';

export const PriorityTransition = ({
  completedPriority,
  completedCount,
  acceptedCount,
  nextPriority,
  onContinue,
  onViewSummary
}) => {
  const getPriorityIcon = (priority) => {
    switch (priority) {
      case 'high':
        return <AlertCircle className="w-8 h-8 text-red-500" />;
      case 'medium':
        return <TrendingUp className="w-8 h-8 text-yellow-500" />;
      case 'low':
        return <Package className="w-8 h-8 text-green-500" />;
      default:
        return null;
    }
  };

  const getPriorityLabel = (priority) => {
    return priority.charAt(0).toUpperCase() + priority.slice(1) + ' Priority';
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'high':
        return 'from-red-50 to-red-100';
      case 'medium':
        return 'from-yellow-50 to-yellow-100';
      case 'low':
        return 'from-green-50 to-green-100';
      default:
        return 'from-gray-50 to-gray-100';
    }
  };

  return (
    <div className={`min-h-screen bg-gradient-to-br ${getPriorityColor(completedPriority)} flex items-center justify-center p-6`}>
      <div className="max-w-2xl w-full">
        <div className="bg-white rounded-2xl shadow-xl p-8 md:p-12">
          {/* Success Icon */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-green-100 rounded-full mb-4">
              <CheckCircle className="w-10 h-10 text-green-600" />
            </div>
            <h2 className="text-3xl font-bold text-gray-900 mb-2">
              ✅ {getPriorityLabel(completedPriority)} Complete!
            </h2>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-center">
            <button
              onClick={onContinue}
              className="px-8 py-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl hover:from-blue-700 hover:to-indigo-700 transition-all transform hover:scale-105 shadow-lg font-semibold flex items-center gap-2"
            >
              Continue to {getPriorityLabel(nextPriority)}
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
