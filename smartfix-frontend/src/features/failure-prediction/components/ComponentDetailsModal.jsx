// src/features/failure-prediction/components/ComponentDetailsModal.jsx
import React from 'react';
import { X, Calendar, Activity, AlertTriangle, Wrench, Clock } from 'lucide-react';

export const ComponentDetailsModal = ({ component, onClose }) => {
  const getRecommendations = () => {
    if (component.riskLevel === 'critical') {
      return [
        'Replace component immediately',
        'Backup all important data',
        'Schedule emergency maintenance',
        'Prepare replacement part'
      ];
    } else if (component.riskLevel === 'high') {
      return [
        'Plan replacement within 30 days',
        'Monitor component daily',
        'Order replacement part',
        'Schedule preventive maintenance'
      ];
    } else if (component.riskLevel === 'medium') {
      return [
        'Monitor component weekly',
        'Consider replacement within 90 days',
        'Run diagnostic tests',
        'Update maintenance schedule'
      ];
    } else {
      return [
        'Continue regular maintenance',
        'Monitor during routine checks',
        'No immediate action required',
        'Schedule next inspection in 60 days'
      ];
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b p-4 flex justify-between items-center">
          <h2 className="text-xl font-bold text-gray-900">Component Details</h2>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Basic Info */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm text-gray-500">Component Name</label>
              <p className="font-medium">{component.name}</p>
            </div>
            <div>
              <label className="text-sm text-gray-500">Device Model</label>
              <p className="font-medium">{component.deviceModel}</p>
            </div>
            <div>
              <label className="text-sm text-gray-500">Serial Number</label>
              <p className="font-medium">{component.serialNumber || 'N/A'}</p>
            </div>
            <div>
              <label className="text-sm text-gray-500">Risk Level</label>
              <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${
                component.riskLevel === 'critical' ? 'bg-red-100 text-red-800' :
                component.riskLevel === 'high' ? 'bg-orange-100 text-orange-800' :
                component.riskLevel === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                'bg-green-100 text-green-800'
              }`}>
                {component.riskLevel.toUpperCase()}
              </span>
            </div>
          </div>

          {/* Health Metrics */}
          <div className="border-t pt-4">
            <h3 className="font-semibold text-gray-900 mb-3">Health Metrics</h3>
            <div className="space-y-3">
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span>Health Score</span>
                  <span className="font-medium">{component.healthScore}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div className="bg-blue-500 h-2 rounded-full" style={{ width: `${component.healthScore}%` }} />
                </div>
              </div>
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span>Remaining Life</span>
                  <span className="font-medium">{component.remainingLife} days</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div className="bg-green-500 h-2 rounded-full" style={{ width: `${(component.remainingLife / component.expectedLife) * 100}%` }} />
                </div>
              </div>
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span>Failure Probability</span>
                  <span className="font-medium">{component.failureProbability}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div className={`h-2 rounded-full ${
                    component.failureProbability > 70 ? 'bg-red-500' :
                    component.failureProbability > 40 ? 'bg-yellow-500' :
                    'bg-green-500'
                  }`} style={{ width: `${component.failureProbability}%` }} />
                </div>
              </div>
            </div>
          </div>

          {/* Predictions */}
          {component.predictedIssue && (
            <div className="border-t pt-4">
              <h3 className="font-semibold text-gray-900 mb-2">Predicted Issue</h3>
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                <div className="flex items-start space-x-2">
                  <AlertTriangle className="w-5 h-5 text-yellow-600 mt-0.5" />
                  <p className="text-yellow-800">{component.predictedIssue}</p>
                </div>
              </div>
            </div>
          )}

          {/* Recommendations */}
          <div className="border-t pt-4">
            <h3 className="font-semibold text-gray-900 mb-3">Recommendations</h3>
            <div className="space-y-2">
              {getRecommendations().map((rec, index) => (
                <div key={index} className="flex items-start space-x-2">
                  <Wrench className="w-4 h-4 text-blue-500 mt-0.5" />
                  <span className="text-gray-700">{rec}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Maintenance History */}
          {component.maintenanceHistory && component.maintenanceHistory.length > 0 && (
            <div className="border-t pt-4">
              <h3 className="font-semibold text-gray-900 mb-3">Maintenance History</h3>
              <div className="space-y-2">
                {component.maintenanceHistory.map((record, index) => (
                  <div key={index} className="flex items-start space-x-2 text-sm">
                    <Calendar className="w-4 h-4 text-gray-400 mt-0.5" />
                    <div>
                      <span className="font-medium">{record.date}</span>
                      <span className="text-gray-600 ml-2">{record.action}</span>
                      {record.result && (
                        <span className="text-gray-500 ml-2">- Result: {record.result}</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="border-t pt-4 flex gap-3">
            <button className="flex-1 bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700">
              Schedule Maintenance
            </button>
            <button className="flex-1 bg-gray-100 text-gray-700 py-2 rounded-lg hover:bg-gray-200">
              View Similar Cases
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};