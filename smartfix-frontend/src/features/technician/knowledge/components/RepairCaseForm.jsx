import React, { useState, useEffect } from 'react';
import { X, Plus, Trash2 } from 'lucide-react';

/**
 * Form for creating/editing repair cases
 */
const RepairCaseForm = ({ caseData, onSubmit, onClose }) => {
  const [formData, setFormData] = useState({
    repairTicketId: '',
    deviceType: '',
    brand: '',
    model: '',
    serialNumber: '',
    symptomsText: '',
    inspectionNotes: '',
    diagnosticObservations: '',
    diagnosisText: '',
    predictedFault: '',
    faultCategory: '',
    repairSolution: '',
    repairProcedure: '',
    solutionSummary: '',
    repairStatus: 'COMPLETED',
    returnedAfterRepair: false,
    returnReason: '',
    repairDurationMinutes: '',
    technicianNotes: '',
    technicianId: null,
    repairDate: new Date().toISOString().slice(0, 16),
    parts: [],
  });

  const [newPart, setNewPart] = useState({
    partName: '',
    partType: '',
    quantity: 1,
    wasReplacement: true,
    replacementReason: '',
  });

  const faultCategories = [
    'BATTERY',
    'DISPLAY',
    'CHARGING',
    'MOTHERBOARD',
    'CAMERA',
    'AUDIO',
    'BUTTON',
    'CONNECTIVITY',
    'SOFTWARE',
    'WATER_DAMAGE',
    'PHYSICAL_DAMAGE',
    'OTHER',
  ];

  useEffect(() => {
    if (caseData) {
      setFormData({
        ...caseData,
        repairDate: caseData.repairDate
          ? new Date(caseData.repairDate).toISOString().slice(0, 16)
          : new Date().toISOString().slice(0, 16),
        parts: caseData.parts || [],
      });
    }
  }, [caseData]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleAddPart = () => {
    if (!newPart.partName.trim()) {
      alert('Part name is required');
      return;
    }

    setFormData((prev) => ({
      ...prev,
      parts: [...prev.parts, { ...newPart }],
    }));

    setNewPart({
      partName: '',
      partType: '',
      quantity: 1,
      wasReplacement: true,
      replacementReason: '',
    });
  };

  const handleRemovePart = (index) => {
    setFormData((prev) => ({
      ...prev,
      parts: prev.parts.filter((_, i) => i !== index),
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    // Validation
    if (!formData.repairTicketId) {
      alert('Repair Ticket ID is required');
      return;
    }
    if (!formData.deviceType) {
      alert('Device Type is required');
      return;
    }
    if (!formData.symptomsText) {
      alert('Symptoms description is required');
      return;
    }

    onSubmit(formData);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 overflow-y-auto">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full my-8">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-2xl font-bold text-gray-900">
            {caseData ? 'Edit Repair Case' : 'New Repair Case'}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6 max-h-[70vh] overflow-y-auto">
          {/* Basic Information */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Basic Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Repair Ticket ID *
                </label>
                <input
                  type="number"
                  name="repairTicketId"
                  value={formData.repairTicketId}
                  onChange={handleChange}
                  required
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Device Type *
                </label>
                <input
                  type="text"
                  name="deviceType"
                  value={formData.deviceType}
                  onChange={handleChange}
                  required
                  placeholder="e.g., Laptop, Smartphone"
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Brand</label>
                <input
                  type="text"
                  name="brand"
                  value={formData.brand}
                  onChange={handleChange}
                  placeholder="e.g., Apple, Dell"
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Model</label>
                <input
                  type="text"
                  name="model"
                  value={formData.model}
                  onChange={handleChange}
                  placeholder="e.g., iPhone 13, XPS 15"
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Serial Number
                </label>
                <input
                  type="text"
                  name="serialNumber"
                  value={formData.serialNumber}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Repair Status
                </label>
                <select
                  name="repairStatus"
                  value={formData.repairStatus}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="COMPLETED">Completed</option>
                  <option value="IN_PROGRESS">In Progress</option>
                  <option value="PENDING">Pending</option>
                </select>
              </div>
            </div>
          </div>

          {/* Symptoms & Diagnosis */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Symptoms & Diagnosis
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Symptoms Description *
                </label>
                <textarea
                  name="symptomsText"
                  value={formData.symptomsText}
                  onChange={handleChange}
                  required
                  rows="3"
                  placeholder="Describe the reported symptoms..."
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Inspection Notes
                </label>
                <textarea
                  name="inspectionNotes"
                  value={formData.inspectionNotes}
                  onChange={handleChange}
                  rows="3"
                  placeholder="Initial inspection findings..."
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Diagnostic Observations
                </label>
                <textarea
                  name="diagnosticObservations"
                  value={formData.diagnosticObservations}
                  onChange={handleChange}
                  rows="3"
                  placeholder="Detailed diagnostic observations..."
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Final Diagnosis
                </label>
                <textarea
                  name="diagnosisText"
                  value={formData.diagnosisText}
                  onChange={handleChange}
                  rows="2"
                  placeholder="Final diagnosis..."
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Fault Category
                  </label>
                  <select
                    name="faultCategory"
                    value={formData.faultCategory}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Select category...</option>
                    {faultCategories.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat.replace('_', ' ')}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Predicted Fault
                  </label>
                  <input
                    type="text"
                    name="predictedFault"
                    value={formData.predictedFault}
                    onChange={handleChange}
                    placeholder="e.g., Battery degradation"
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Repair Solution */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Repair Solution</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Repair Solution
                </label>
                <textarea
                  name="repairSolution"
                  value={formData.repairSolution}
                  onChange={handleChange}
                  rows="3"
                  placeholder="Describe the repair solution..."
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Repair Procedure
                </label>
                <textarea
                  name="repairProcedure"
                  value={formData.repairProcedure}
                  onChange={handleChange}
                  rows="3"
                  placeholder="Step-by-step repair procedure..."
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Solution Summary
                </label>
                <textarea
                  name="solutionSummary"
                  value={formData.solutionSummary}
                  onChange={handleChange}
                  rows="2"
                  placeholder="Brief summary of the solution..."
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          </div>

          {/* Parts Replaced */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Parts Replaced</h3>
            
            {/* Existing Parts */}
            {formData.parts.length > 0 && (
              <div className="mb-4 space-y-2">
                {formData.parts.map((part, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                  >
                    <div>
                      <span className="font-medium">{part.partName}</span>
                      {part.partType && (
                        <span className="text-sm text-gray-600 ml-2">({part.partType})</span>
                      )}
                      <span className="text-sm text-gray-600 ml-2">
                        Qty: {part.quantity}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleRemovePart(index)}
                      className="text-red-600 hover:text-red-800"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Add New Part */}
            <div className="border rounded-lg p-4 bg-gray-50">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-3">
                <input
                  type="text"
                  placeholder="Part name *"
                  value={newPart.partName}
                  onChange={(e) => setNewPart({ ...newPart, partName: e.target.value })}
                  className="px-3 py-2 border rounded-lg"
                />
                <input
                  type="text"
                  placeholder="Part type"
                  value={newPart.partType}
                  onChange={(e) => setNewPart({ ...newPart, partType: e.target.value })}
                  className="px-3 py-2 border rounded-lg"
                />
                <input
                  type="number"
                  placeholder="Quantity"
                  min="1"
                  value={newPart.quantity}
                  onChange={(e) =>
                    setNewPart({ ...newPart, quantity: parseInt(e.target.value) || 1 })
                  }
                  className="px-3 py-2 border rounded-lg"
                />
              </div>
              <button
                type="button"
                onClick={handleAddPart}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                <Plus className="w-4 h-4" />
                Add Part
              </button>
            </div>
          </div>

          {/* Additional Information */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Additional Information
            </h3>
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Repair Duration (minutes)
                  </label>
                  <input
                    type="number"
                    name="repairDurationMinutes"
                    value={formData.repairDurationMinutes}
                    onChange={handleChange}
                    min="0"
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Repair Date
                  </label>
                  <input
                    type="datetime-local"
                    name="repairDate"
                    value={formData.repairDate}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    name="returnedAfterRepair"
                    checked={formData.returnedAfterRepair}
                    onChange={handleChange}
                    className="w-4 h-4 text-blue-600"
                  />
                  <span className="text-sm font-medium text-gray-700">
                    Device was returned after repair
                  </span>
                </label>
              </div>

              {formData.returnedAfterRepair && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Return Reason
                  </label>
                  <textarea
                    name="returnReason"
                    value={formData.returnReason}
                    onChange={handleChange}
                    rows="2"
                    placeholder="Why was the device returned?"
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Technician Notes
                </label>
                <textarea
                  name="technicianNotes"
                  value={formData.technicianNotes}
                  onChange={handleChange}
                  rows="3"
                  placeholder="Additional notes..."
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          </div>
        </form>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 p-6 border-t bg-gray-50">
          <button
            type="button"
            onClick={onClose}
            className="px-6 py-2 border rounded-lg hover:bg-gray-100"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            {caseData ? 'Update Case' : 'Create Case'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default RepairCaseForm;
