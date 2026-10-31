import React, { useState, useEffect } from 'react';
import { Search, RotateCcw, Loader } from 'lucide-react';

/**
 * Panel for inputting device information and symptoms
 */
const DeviceInputPanel = ({
  deviceInfo,
  onChange,
  onAnalyze,
  onClear,
  loading,
}) => {
  const [categories, setCategories] = useState([]);
  const [loadingCategories, setLoadingCategories] = useState(true);

  const API_BASE = process.env.REACT_APP_SYSTEM_BACKEND_URL || 'http://localhost:8080';

  useEffect(() => {
    loadCategories();
  }, []);

  const loadCategories = async () => {
    try {
      const response = await fetch(`${API_BASE}/api/categories`);
      if (response.ok) {
        const data = await response.json();
        setCategories(data);
      } else {
        console.error('Failed to load categories');
      }
    } catch (error) {
      console.error('Error loading categories:', error);
    } finally {
      setLoadingCategories(false);
    }
  };

  const handleChange = (field, value) => {
    onChange({ ...deviceInfo, [field]: value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onAnalyze();
  };

  return (
    <div className="bg-white rounded-lg shadow-lg p-6 sticky top-6">
      <h2 className="text-xl font-bold text-gray-900 mb-4">Device Information</h2>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Device Type */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Device Type *
          </label>
          {loadingCategories ? (
            <div className="w-full px-3 py-2 border rounded-lg bg-gray-50 flex items-center gap-2">
              <Loader className="w-4 h-4 animate-spin text-blue-600" />
              <span className="text-sm text-gray-500">Loading categories...</span>
            </div>
          ) : (
            <select
              value={deviceInfo.deviceType}
              onChange={(e) => handleChange('deviceType', e.target.value)}
              required
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 bg-white"
            >
              <option value="">Select device type</option>
              {categories.map((category) => (
                <option key={category.id} value={category.name}>
                  {category.name}
                </option>
              ))}
            </select>
          )}
        </div>

        {/* Brand */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Brand</label>
          <input
            type="text"
            value={deviceInfo.brand}
            onChange={(e) => handleChange('brand', e.target.value)}
            placeholder="e.g., Apple, Samsung, Dell"
            className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Model */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Model</label>
          <input
            type="text"
            value={deviceInfo.model}
            onChange={(e) => handleChange('model', e.target.value)}
            placeholder="e.g., iPhone 13, XPS 15"
            className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Symptoms */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Symptoms Description *
          </label>
          <textarea
            value={deviceInfo.symptoms}
            onChange={(e) => handleChange('symptoms', e.target.value)}
            placeholder="Describe the reported symptoms in detail..."
            required
            rows="5"
            className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
          />
          <p className="text-xs text-gray-500 mt-1">
            Be specific: include error messages, behaviors, when it occurs, etc.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2">
          <button
            type="submit"
            disabled={loading}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed font-medium"
          >
            <Search className="w-5 h-5" />
            {loading ? 'Analyzing...' : 'Analyze'}
          </button>
          <button
            type="button"
            onClick={onClear}
            disabled={loading}
            className="px-4 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50"
            title="Clear"
          >
            <RotateCcw className="w-5 h-5 text-gray-600" />
          </button>
        </div>
      </form>

      {/* Tips */}
      <div className="mt-6 p-4 bg-gray-50 rounded-lg">
        <h3 className="text-sm font-semibold text-gray-900 mb-2">💡 Tips for Better Results</h3>
        <ul className="text-xs text-gray-600 space-y-1">
          <li>• Be specific about symptoms</li>
          <li>• Include error messages if any</li>
          <li>• Mention when the issue occurs</li>
          <li>• Describe any patterns observed</li>
          <li>• Note any recent changes or events</li>
        </ul>
      </div>
    </div>
  );
};

export default DeviceInputPanel;
