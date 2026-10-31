// src/features/failure-prediction/FailurePredictionPage.jsx
import React, { useState, useEffect } from 'react';
import { AlertTriangle, Battery, Cpu, HardDrive, Thermometer, Activity } from 'lucide-react';

export const FailurePredictionPage = () => {
  const AI_BACKEND_BASE_URL = process.env.REACT_APP_AI_BACKEND_URL || 'http://localhost:5000';
  const [components, setComponents] = useState([]);
  const [selectedDevice, setSelectedDevice] = useState('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchPredictionItems = async () => {
      try {
        const response = await fetch(`${AI_BACKEND_BASE_URL}/api/predict/devices`);
        const data = await response.json();
        if (!response.ok) throw new Error(data?.detail || 'Prediction API unavailable');

        const mapped = (data?.items || []).map((item, index) => {
          const prediction = item?.prediction || {};
          const device = item?.device || {};
          const health = Math.max(5, Math.min(98, Math.round((1 - Number(prediction.failureProbability || 0.5)) * 100)));
          const remainingDays = Math.max(1, Number(prediction.remainingLife_months || 1) * 30);
          const risk = (prediction.riskLevel || 'low').toLowerCase();
          const componentName = prediction.component || 'Component';

          return {
            id: index + 1,
            name: componentName,
            type: componentName.toLowerCase().includes('battery') ? 'battery'
              : componentName.toLowerCase().includes('storage') || componentName.toLowerCase().includes('ssd') ? 'storage'
              : componentName.toLowerCase().includes('fan') ? 'fan'
              : componentName.toLowerCase().includes('cpu') ? 'cpu'
              : 'component',
            device: device.deviceLabel || `${device.brand || ''} ${device.model || ''}`.trim() || 'Unknown Device',
            health,
            risk,
            remainingDays,
            predictedFailure: `Likely ${componentName} degradation`,
            lastMaintenance: prediction.lastMaintenance || device.lastMaintenance || 'N/A'
          };
        });
        setComponents(mapped);
        setError('');
      } catch (apiError) {
        setComponents([]);
        setError(apiError.message || 'Unable to load failure prediction data');
      } finally {
        setLoading(false);
      }
    };

    fetchPredictionItems();
  }, []);

  const getRiskColor = (risk) => {
    switch(risk) {
      case 'critical': return 'bg-red-100 text-red-800 border-red-200';
      case 'high': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      default: return 'bg-green-100 text-green-800 border-green-200';
    }
  };

  const getHealthColor = (health) => {
    if (health >= 80) return 'text-green-600';
    if (health >= 50) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getIcon = (type) => {
    switch(type) {
      case 'battery': return <Battery className="w-5 h-5" />;
      case 'storage': return <HardDrive className="w-5 h-5" />;
      case 'cpu': return <Cpu className="w-5 h-5" />;
      case 'fan': return <Thermometer className="w-5 h-5" />;
      default: return <Activity className="w-5 h-5" />;
    }
  };

  const filteredComponents = selectedDevice === 'all' 
    ? components 
    : components.filter(c => c.device === selectedDevice);

  const devices = ['all', ...new Set(components.map(c => c.device))];
  const monitoredDevices = new Set(components.map(c => c.device)).size;

  if (loading) {
    return (
      <div className="flex justify-center items-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 bg-gray-50 min-h-screen">
        <div className="max-w-3xl mx-auto bg-white rounded-lg shadow p-6">
          <h1 className="text-3xl font-bold text-gray-900">Component Failure Prediction</h1>
          <p className="text-red-600 mt-4">{error}</p>
          <p className="text-gray-600 mt-2">Please check AI backend and try again.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Component Failure Prediction</h1>
        <p className="text-gray-600 mt-2">AI-powered predictive analytics for component health monitoring</p>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
        <div className="bg-white rounded-lg shadow p-6">
          <p className="text-gray-500 text-sm">Components at Risk</p>
          <p className="text-2xl font-bold text-red-600">{components.filter(c => c.risk === 'high' || c.risk === 'critical').length}</p>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <p className="text-gray-500 text-sm">Avg. Health Score</p>
          <p className="text-2xl font-bold text-blue-600">
            {Math.round(components.reduce((sum, c) => sum + c.health, 0) / components.length)}%
          </p>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <p className="text-gray-500 text-sm">Critical Alerts</p>
          <p className="text-2xl font-bold text-orange-600">{components.filter(c => c.risk === 'critical').length}</p>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <p className="text-gray-500 text-sm">Monitored Devices</p>
          <p className="text-2xl font-bold text-green-600">{monitoredDevices}</p>
        </div>
      </div>

      {/* Device Filter */}
      <div className="bg-white rounded-lg shadow p-4 mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">Filter by Device</label>
        <select
          value={selectedDevice}
          onChange={(e) => setSelectedDevice(e.target.value)}
          className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
        >
          {devices.map(device => (
            <option key={device} value={device}>
              {device === 'all' ? 'All Devices' : device}
            </option>
          ))}
        </select>
      </div>

      {/* Components Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredComponents.map(component => (
          <div key={component.id} className={`bg-white rounded-lg shadow-md p-6 border-l-4 ${
            component.risk === 'critical' ? 'border-l-red-500' :
            component.risk === 'high' ? 'border-l-orange-500' :
            component.risk === 'medium' ? 'border-l-yellow-500' :
            'border-l-green-500'
          }`}>
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center space-x-3">
                <div className={`p-2 rounded-lg ${getRiskColor(component.risk)}`}>
                  {getIcon(component.type)}
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">{component.name}</h3>
                  <p className="text-sm text-gray-500">{component.device}</p>
                </div>
              </div>
              <span className={`px-2 py-1 rounded-full text-xs font-medium ${getRiskColor(component.risk)}`}>
                {component.risk.toUpperCase()}
              </span>
            </div>

            {/* Health Bar */}
            <div className="mb-3">
              <div className="flex justify-between text-sm mb-1">
                <span className="text-gray-600">Health Score</span>
                <span className={`font-medium ${getHealthColor(component.health)}`}>{component.health}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className={`h-2 rounded-full transition-all ${
                    component.health >= 80 ? 'bg-green-500' :
                    component.health >= 50 ? 'bg-yellow-500' :
                    'bg-red-500'
                  }`}
                  style={{ width: `${component.health}%` }}
                />
              </div>
            </div>

            {/* Remaining Life */}
            <div className="mb-3">
              <div className="flex justify-between text-sm mb-1">
                <span className="text-gray-600">Remaining Life</span>
                <span className="font-medium">{component.remainingDays} days</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-blue-500 h-2 rounded-full"
                  style={{ width: `${(component.remainingDays / 365) * 100}%` }}
                />
              </div>
            </div>

            {/* Prediction */}
            <div className="bg-gray-50 rounded-lg p-3 mb-3">
              <div className="flex items-start space-x-2">
                <AlertTriangle className="w-4 h-4 text-yellow-500 mt-0.5" />
                <div>
                  <p className="text-xs text-gray-500">Predicted Issue</p>
                  <p className="text-sm font-medium text-gray-900">{component.predictedFailure}</p>
                </div>
              </div>
            </div>

            {/* Last Maintenance */}
            <p className="text-xs text-gray-400">Last maintenance: {component.lastMaintenance}</p>

            <button className="w-full mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
              View Details & Recommendations
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};