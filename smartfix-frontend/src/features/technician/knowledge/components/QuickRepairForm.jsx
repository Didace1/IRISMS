import React, { useState, useEffect } from 'react';
import { X, Plus, Trash2, Save, Zap, AlertCircle } from 'lucide-react';

/**
 * Fast, streamlined repair recording form
 * Designed for 1-2 minute completion time
 */
const QuickRepairForm = ({ caseData, onSubmit, onClose }) => {
  const [formData, setFormData] = useState({
    repairTicketId: Date.now(), // Auto-generated
    deviceType: '',
    brand: '',
    model: '',
    symptomsText: '',
    inspectionNotes: '',
    diagnosisText: '',
    repairSolution: '',
    returnedAfterRepair: false,
    technicianNotes: '',
    repairStatus: 'COMPLETED',
    repairDate: new Date().toISOString(),
    components: [],
  });

  const [componentInput, setComponentInput] = useState('');
  const [showAdvanced, setShowAdvanced] = useState(false);

  // Common device types for quick selection
  const deviceTypes = ['Laptop', 'Smartphone', 'Tablet', 'Desktop', 'Smartwatch', 'Other'];
  
  // Common brands
  const brands = ['Apple', 'Samsung', 'HP', 'Dell', 'Lenovo', 'Asus', 'Acer', 'Huawei', 'Xiaomi', 'Other'];

  // Common components for quick add
  const commonComponents = [
    'Battery', 'Screen', 'Charging Port', 'Motherboard', 'Camera',
    'Speaker', 'Microphone', 'Power Button', 'Volume Button', 'Back Cover',
    'SIM Tray', 'Headphone Jack', 'USB Port', 'Keyboard', 'Trackpad',
    'RAM', 'Hard Drive', 'SSD', 'Cooling Fan', 'Thermal Paste'
  ];

  useEffect(() => {
    if (caseData) {
      setFormData({
        ...caseData,
        repairDate: caseData.repairDate || new Date().toISOString(),
        components: caseData.parts?.map(p => p.partName) || [],
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

  const addComponent = (component) => {
    if (component && !formData.components.includes(component)) {
      setFormData((prev) => ({
        ...prev,
        components: [...prev.components, component],
      }));
      setComponentInput('');
    }
  };

  const removeComponent = (component) => {
    setFormData((prev) => ({
      ...prev,
      components: prev.components.filter((c) => c !== component),
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    // Validation
    if (!formData.deviceType) {
      alert('Device type is required');
      return;
    }
    if (!formData.symptomsText) {
      alert('Symptoms description is required');
      return;
    }

    // Convert components to parts format
    const submitData = {
      ...formData,
      parts: formData.components.map(comp => ({
        partName: comp,
        partType: 'REPLACED',
        quantity: 1,
        wasReplacement: true,
      })),
    };

    onSubmit(submitData);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full my-8 max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white p-6 rounded-t-2xl">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white bg-opacity-20 rounded-lg flex items-center justify-center">
                <Zap className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-2xl font-bold">
                  {caseData ? 'Update Repair' : 'Quick Repair Record'}
                </h2>
                <p className="text-blue-100 text-sm">Complete in 1-2 minutes</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-white hover:bg-white hover:bg-opacity-20 rounded-lg p-2 transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6 overflow-y-auto flex-1">
          {/* Device Information - Compact Grid */}
          <div className="bg-gray-50 rounded-xl p-5 space-y-4">
            <h3 className="font-semibold text-gray-900 flex items-center gap-2">
              <span className="w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm">1</span>
              Device Information
            </h3>
            
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Device Type *
                </label>
                <select
                  name="deviceType"
                  value={formData.deviceType}
                  onChange={handleChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">Select...</option>
                  {deviceTypes.map((type) => (
                    <option key={type} value={type}>{type}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Brand</label>
                <select
                  name="brand"
                  value={formData.brand}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">Select...</option>
                  {brands.map((brand) => (
                    <option key={brand} value={brand}>{brand}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Model</label>
                <input
                  type="text"
                  name="model"
                  value={formData.model}
                  onChange={handleChange}
                  placeholder="e.g., iPhone 13"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
          </div>

          {/* Symptoms - Most Important */}
          <div className="bg-blue-50 border-2 border-blue-200 rounded-xl p-5 space-y-3">
            <div className="flex items-start gap-2">
              <span className="w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm flex-shrink-0 mt-0.5">2</span>
              <div className="flex-1">
                <h3 className="font-semibold text-gray-900 mb-1">Symptoms *</h3>
                <p className="text-xs text-blue-700 mb-3">
                  This is the most important field for AI analysis
                </p>
                <textarea
                  name="symptomsText"
                  value={formData.symptomsText}
                  onChange={handleChange}
                  required
                  rows="3"
                  placeholder="Example: Laptop overheating and shutting down after 10 minutes. Battery drains quickly while charging."
                  className="w-full px-4 py-3 border border-blue-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                />
              </div>
            </div>
          </div>

          {/* Diagnosis */}
          <div className="bg-gray-50 rounded-xl p-5 space-y-3">
            <h3 className="font-semibold text-gray-900 flex items-center gap-2">
              <span className="w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm">3</span>
              Diagnosis
            </h3>
            <textarea
              name="diagnosisText"
              value={formData.diagnosisText}
              onChange={handleChange}
              rows="2"
              placeholder="What was wrong with the device?"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
            />
          </div>

          {/* Components - Tag-based */}
          <div className="bg-gray-50 rounded-xl p-5 space-y-3">
            <h3 className="font-semibold text-gray-900 flex items-center gap-2">
              <span className="w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm">4</span>
              Components Replaced
            </h3>
            
            {/* Selected Components */}
            {formData.components.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-3">
                {formData.components.map((comp) => (
                  <span
                    key={comp}
                    className="inline-flex items-center gap-1 px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-medium"
                  >
                    {comp}
                    <button
                      type="button"
                      onClick={() => removeComponent(comp)}
                      className="hover:bg-blue-200 rounded-full p-0.5"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}
              </div>
            )}

            {/* Quick Add Buttons */}
            <div className="flex flex-wrap gap-2 mb-3">
              {commonComponents.slice(0, 8).map((comp) => (
                <button
                  key={comp}
                  type="button"
                  onClick={() => addComponent(comp)}
                  disabled={formData.components.includes(comp)}
                  className={`px-3 py-1 text-sm rounded-lg transition-colors ${
                    formData.components.includes(comp)
                      ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                      : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  {comp}
                </button>
              ))}
            </div>

            {/* Custom Component Input */}
            <div className="flex gap-2">
              <input
                type="text"
                value={componentInput}
                onChange={(e) => setComponentInput(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    addComponent(componentInput);
                  }
                }}
                placeholder="Type custom component..."
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <button
                type="button"
                onClick={() => addComponent(componentInput)}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <Plus className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Repair Solution */}
          <div className="bg-gray-50 rounded-xl p-5 space-y-3">
            <h3 className="font-semibold text-gray-900 flex items-center gap-2">
              <span className="w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm">5</span>
              Repair Solution
            </h3>
            <textarea
              name="repairSolution"
              value={formData.repairSolution}
              onChange={handleChange}
              rows="2"
              placeholder="What did you do to fix it?"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
            />
          </div>

          {/* Outcome */}
          <div className="bg-gray-50 rounded-xl p-5 space-y-3">
            <h3 className="font-semibold text-gray-900 flex items-center gap-2">
              <span className="w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm">6</span>
              Outcome
            </h3>
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                name="returnedAfterRepair"
                checked={formData.returnedAfterRepair}
                onChange={handleChange}
                className="w-5 h-5 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
              />
              <span className="text-gray-700 font-medium">Device was returned after repair</span>
            </label>
          </div>

          {/* Advanced Section - Collapsible */}
          <div className="border-t border-gray-200 pt-4">
            <button
              type="button"
              onClick={() => setShowAdvanced(!showAdvanced)}
              className="text-sm text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1"
            >
              {showAdvanced ? '− Hide' : '+ Show'} Advanced Fields (Optional)
            </button>

            {showAdvanced && (
              <div className="mt-4 space-y-4">
                {/* Inspection Notes */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Inspection Notes
                  </label>
                  <textarea
                    name="inspectionNotes"
                    value={formData.inspectionNotes}
                    onChange={handleChange}
                    rows="2"
                    placeholder="Initial inspection findings..."
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                  />
                </div>

                {/* Technician Notes */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Technician Notes
                  </label>
                  <textarea
                    name="technicianNotes"
                    value={formData.technicianNotes}
                    onChange={handleChange}
                    rows="2"
                    placeholder="Tips, warnings, or insights for other technicians..."
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Info Banner */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-blue-800">
              <p className="font-medium mb-1">This data powers AI recommendations</p>
              <p className="text-blue-700">
                The more detailed your symptoms and diagnosis, the better the AI can help other technicians.
              </p>
            </div>
          </div>
        </form>

        {/* Footer */}
        <div className="flex items-center justify-between gap-3 p-6 border-t bg-gray-50 rounded-b-2xl flex-shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-6 py-2.5 border border-gray-300 rounded-lg hover:bg-gray-100 transition-colors font-medium"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            className="flex items-center gap-2 px-8 py-2.5 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg hover:from-blue-700 hover:to-blue-800 shadow-lg hover:shadow-xl transition-all font-medium"
          >
            <Save className="w-5 h-5" />
            {caseData ? 'Update' : 'Save'} Repair
          </button>
        </div>
      </div>
    </div>
  );
};

export default QuickRepairForm;
