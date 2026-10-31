import React from 'react';
import { X, Edit, Calendar, Clock, User, AlertCircle, CheckCircle, Package } from 'lucide-react';

/**
 * Modal for viewing detailed repair case information
 */
const CaseDetailModal = ({ caseData, onClose, onEdit }) => {
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
  };

  const InfoSection = ({ title, children }) => (
    <div className="mb-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-3 border-b pb-2">{title}</h3>
      {children}
    </div>
  );

  const InfoRow = ({ label, value, icon: Icon }) => (
    <div className="flex items-start gap-3 mb-3">
      {Icon && <Icon className="w-5 h-5 text-gray-400 mt-0.5" />}
      <div className="flex-1">
        <div className="text-sm font-medium text-gray-500">{label}</div>
        <div className="text-sm text-gray-900 mt-1">{value || 'N/A'}</div>
      </div>
    </div>
  );

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b bg-gray-50">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">
              Repair Case #{caseData.caseId}
            </h2>
            <p className="text-sm text-gray-600 mt-1">
              {caseData.deviceType} - {caseData.brand} {caseData.model}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={onEdit}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              <Edit className="w-4 h-4" />
              Edit
            </button>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto flex-1">
          {/* Status Banner */}
          <div className={`p-4 rounded-lg mb-6 ${
            caseData.returnedAfterRepair 
              ? 'bg-red-50 border border-red-200' 
              : 'bg-green-50 border border-green-200'
          }`}>
            <div className="flex items-center gap-3">
              {caseData.returnedAfterRepair ? (
                <>
                  <AlertCircle className="w-6 h-6 text-red-600" />
                  <div>
                    <div className="font-semibold text-red-900">Device Returned After Repair</div>
                    <div className="text-sm text-red-700 mt-1">{caseData.returnReason}</div>
                  </div>
                </>
              ) : (
                <>
                  <CheckCircle className="w-6 h-6 text-green-600" />
                  <div className="font-semibold text-green-900">Repair Successful</div>
                </>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Left Column */}
            <div>
              {/* Device Information */}
              <InfoSection title="Device Information">
                <InfoRow label="Device Type" value={caseData.deviceType} />
                <InfoRow label="Brand" value={caseData.brand} />
                <InfoRow label="Model" value={caseData.model} />
                <InfoRow label="Serial Number" value={caseData.serialNumber} />
              </InfoSection>

              {/* Symptoms & Diagnosis */}
              <InfoSection title="Symptoms & Diagnosis">
                <div className="mb-4">
                  <div className="text-sm font-medium text-gray-500 mb-2">Reported Symptoms</div>
                  <div className="text-sm text-gray-900 bg-gray-50 p-3 rounded-lg">
                    {caseData.symptomsText}
                  </div>
                </div>

                {caseData.inspectionNotes && (
                  <div className="mb-4">
                    <div className="text-sm font-medium text-gray-500 mb-2">Inspection Notes</div>
                    <div className="text-sm text-gray-900 bg-gray-50 p-3 rounded-lg">
                      {caseData.inspectionNotes}
                    </div>
                  </div>
                )}

                {caseData.diagnosticObservations && (
                  <div className="mb-4">
                    <div className="text-sm font-medium text-gray-500 mb-2">
                      Diagnostic Observations
                    </div>
                    <div className="text-sm text-gray-900 bg-gray-50 p-3 rounded-lg">
                      {caseData.diagnosticObservations}
                    </div>
                  </div>
                )}

                {caseData.diagnosisText && (
                  <div className="mb-4">
                    <div className="text-sm font-medium text-gray-500 mb-2">Final Diagnosis</div>
                    <div className="text-sm text-gray-900 bg-blue-50 p-3 rounded-lg border border-blue-200">
                      {caseData.diagnosisText}
                    </div>
                  </div>
                )}

                <InfoRow label="Fault Category" value={caseData.faultCategory?.replace('_', ' ')} />
                <InfoRow label="Predicted Fault" value={caseData.predictedFault} />
              </InfoSection>
            </div>

            {/* Right Column */}
            <div>
              {/* Repair Solution */}
              <InfoSection title="Repair Solution">
                {caseData.solutionSummary && (
                  <div className="mb-4">
                    <div className="text-sm font-medium text-gray-500 mb-2">Solution Summary</div>
                    <div className="text-sm text-gray-900 bg-green-50 p-3 rounded-lg border border-green-200">
                      {caseData.solutionSummary}
                    </div>
                  </div>
                )}

                {caseData.repairSolution && (
                  <div className="mb-4">
                    <div className="text-sm font-medium text-gray-500 mb-2">Repair Solution</div>
                    <div className="text-sm text-gray-900 bg-gray-50 p-3 rounded-lg">
                      {caseData.repairSolution}
                    </div>
                  </div>
                )}

                {caseData.repairProcedure && (
                  <div className="mb-4">
                    <div className="text-sm font-medium text-gray-500 mb-2">Repair Procedure</div>
                    <div className="text-sm text-gray-900 bg-gray-50 p-3 rounded-lg">
                      {caseData.repairProcedure}
                    </div>
                  </div>
                )}
              </InfoSection>

              {/* Parts Replaced */}
              {caseData.parts && caseData.parts.length > 0 && (
                <InfoSection title="Parts Replaced">
                  <div className="space-y-2">
                    {caseData.parts.map((part, index) => (
                      <div
                        key={index}
                        className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg"
                      >
                        <Package className="w-5 h-5 text-gray-400" />
                        <div className="flex-1">
                          <div className="text-sm font-medium text-gray-900">
                            {part.partName}
                          </div>
                          {part.partType && (
                            <div className="text-xs text-gray-500">{part.partType}</div>
                          )}
                        </div>
                        <div className="text-sm text-gray-600">Qty: {part.quantity}</div>
                      </div>
                    ))}
                  </div>
                </InfoSection>
              )}

              {/* Repair Metadata */}
              <InfoSection title="Repair Information">
                <InfoRow
                  label="Repair Status"
                  value={
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      caseData.repairStatus === 'COMPLETED'
                        ? 'bg-green-100 text-green-800'
                        : caseData.repairStatus === 'IN_PROGRESS'
                        ? 'bg-blue-100 text-blue-800'
                        : 'bg-yellow-100 text-yellow-800'
                    }`}>
                      {caseData.repairStatus?.replace('_', ' ')}
                    </span>
                  }
                />
                <InfoRow
                  label="Repair Duration"
                  value={caseData.repairDurationMinutes ? `${caseData.repairDurationMinutes} minutes` : 'N/A'}
                  icon={Clock}
                />
                <InfoRow
                  label="Repair Date"
                  value={formatDate(caseData.repairDate)}
                  icon={Calendar}
                />
                <InfoRow
                  label="Technician"
                  value={caseData.technicianName}
                  icon={User}
                />
              </InfoSection>

              {/* Technician Notes */}
              {caseData.technicianNotes && (
                <InfoSection title="Technician Notes">
                  <div className="text-sm text-gray-900 bg-yellow-50 p-3 rounded-lg border border-yellow-200">
                    {caseData.technicianNotes}
                  </div>
                </InfoSection>
              )}
            </div>
          </div>

          {/* Timestamps */}
          <div className="mt-6 pt-6 border-t">
            <div className="grid grid-cols-2 gap-4 text-xs text-gray-500">
              <div>
                <span className="font-medium">Created:</span> {formatDate(caseData.createdAt)}
              </div>
              <div>
                <span className="font-medium">Last Updated:</span> {formatDate(caseData.updatedAt)}
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 p-6 border-t bg-gray-50">
          <button
            onClick={onClose}
            className="px-6 py-2 border rounded-lg hover:bg-gray-100"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default CaseDetailModal;
