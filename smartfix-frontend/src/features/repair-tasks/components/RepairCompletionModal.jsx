import React, { useState } from 'react';
import { X, CheckCircle, XCircle, AlertTriangle, Lightbulb } from 'lucide-react';

/**
 * Modal for capturing repair completion information
 * Dual purpose: Performance tracking + AI learning
 */
export const RepairCompletionModal = ({ task, onClose, onSubmit, isSubmitting }) => {
  const [repairResult, setRepairResult] = useState('SUCCESS');
  const [solutionSummary, setSolutionSummary] = useState('');
  const [customerSatisfied, setCustomerSatisfied] = useState(true);
  const [detailedNotes, setDetailedNotes] = useState('');
  const [tipsForNextTime, setTipsForNextTime] = useState('');
  const [showOptional, setShowOptional] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (!solutionSummary.trim()) {
      alert('Please describe what you did to fix this issue');
      return;
    }

    const data = {
      repairResult,
      solutionSummary: solutionSummary.trim(),
      customerSatisfied,
      detailedNotes: detailedNotes.trim() || null,
      tipsForNextTime: tipsForNextTime.trim() || null,
    };

    onSubmit(data);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b px-6 py-4 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Complete Repair Task</h2>
            <p className="text-sm text-gray-500 mt-1">
              This information helps track your performance and teaches the AI
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
            disabled={isSubmitting}
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Auto-captured info */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h3 className="text-sm font-semibold text-blue-900 mb-2">📋 Auto-Captured Information</h3>
            <div className="space-y-1 text-sm text-blue-800">
              <p><span className="font-medium">Device:</span> {task.deviceType || 'N/A'} {task.deviceModel || ''}</p>
              <p><span className="font-medium">Issue:</span> {task.repairNote || 'No description'}</p>
              <p><span className="font-medium">Technician:</span> {task.assignedTechnician?.fullName || 'You'}</p>
              <p><span className="font-medium">Task #:</span> {task.id}</p>
            </div>
          </div>

          {/* Required Questions */}
          <div className="space-y-4">
            <h3 className="text-base font-semibold text-gray-900">❓ Required Questions (10 seconds)</h3>
            
            {/* Question 1: Repair Result */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                1. Repair Result: *
              </label>
              <div className="grid grid-cols-3 gap-3">
                <button
                  type="button"
                  onClick={() => setRepairResult('SUCCESS')}
                  className={`p-3 rounded-lg border-2 transition-all ${
                    repairResult === 'SUCCESS'
                      ? 'border-green-500 bg-green-50'
                      : 'border-gray-200 hover:border-green-300'
                  }`}
                >
                  <CheckCircle className={`w-6 h-6 mx-auto mb-1 ${
                    repairResult === 'SUCCESS' ? 'text-green-600' : 'text-gray-400'
                  }`} />
                  <span className="text-sm font-medium">Success</span>
                </button>
                
                <button
                  type="button"
                  onClick={() => setRepairResult('FAILED')}
                  className={`p-3 rounded-lg border-2 transition-all ${
                    repairResult === 'FAILED'
                      ? 'border-red-500 bg-red-50'
                      : 'border-gray-200 hover:border-red-300'
                  }`}
                >
                  <XCircle className={`w-6 h-6 mx-auto mb-1 ${
                    repairResult === 'FAILED' ? 'text-red-600' : 'text-gray-400'
                  }`} />
                  <span className="text-sm font-medium">Failed</span>
                </button>
                
                <button
                  type="button"
                  onClick={() => setRepairResult('PARTIAL')}
                  className={`p-3 rounded-lg border-2 transition-all ${
                    repairResult === 'PARTIAL'
                      ? 'border-amber-500 bg-amber-50'
                      : 'border-gray-200 hover:border-amber-300'
                  }`}
                >
                  <AlertTriangle className={`w-6 h-6 mx-auto mb-1 ${
                    repairResult === 'PARTIAL' ? 'text-amber-600' : 'text-gray-400'
                  }`} />
                  <span className="text-sm font-medium">Partial</span>
                </button>
              </div>
            </div>

            {/* Question 2: What did you do? */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                2. What did you do? (1 sentence) *
              </label>
              <input
                type="text"
                value={solutionSummary}
                onChange={(e) => setSolutionSummary(e.target.value)}
                placeholder="e.g., Replaced charging port and tested with customer's cable"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                required
                disabled={isSubmitting}
              />
            </div>

            {/* Question 3: Customer satisfied? */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                3. Customer satisfied? *
              </label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setCustomerSatisfied(true)}
                  className={`p-3 rounded-lg border-2 transition-all ${
                    customerSatisfied
                      ? 'border-green-500 bg-green-50'
                      : 'border-gray-200 hover:border-green-300'
                  }`}
                >
                  <span className="text-2xl mb-1 block">😊</span>
                  <span className="text-sm font-medium">Yes</span>
                </button>
                
                <button
                  type="button"
                  onClick={() => setCustomerSatisfied(false)}
                  className={`p-3 rounded-lg border-2 transition-all ${
                    !customerSatisfied
                      ? 'border-red-500 bg-red-50'
                      : 'border-gray-200 hover:border-red-300'
                  }`}
                >
                  <span className="text-2xl mb-1 block">😞</span>
                  <span className="text-sm font-medium">No</span>
                </button>
              </div>
            </div>
          </div>

          {/* Optional fields */}
          <div className="border-t pt-4">
            <button
              type="button"
              onClick={() => setShowOptional(!showOptional)}
              className="text-sm text-blue-600 hover:text-blue-800 font-medium flex items-center gap-2"
            >
              <Lightbulb className="w-4 h-4" />
              {showOptional ? 'Hide' : 'Show'} Optional Fields (Earn bonus points)
            </button>

            {showOptional && (
              <div className="mt-4 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Detailed Notes (Optional)
                  </label>
                  <textarea
                    value={detailedNotes}
                    onChange={(e) => setDetailedNotes(e.target.value)}
                    placeholder="Add any additional details about the repair..."
                    rows={3}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    disabled={isSubmitting}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Tips for Next Time (Optional)
                  </label>
                  <textarea
                    value={tipsForNextTime}
                    onChange={(e) => setTipsForNextTime(e.target.value)}
                    placeholder="e.g., Check warranty status first, Use specific screwdriver size..."
                    rows={2}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    disabled={isSubmitting}
                  />
                </div>
              </div>
            )}
          </div>

          {/* Submit button */}
          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="flex-1 px-4 py-3 border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-50 disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 px-4 py-3 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? 'Submitting...' : 'Submit & Close Task'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
