import React, { useState } from 'react';
import { Brain, Loader } from 'lucide-react';
import { toast } from 'react-hot-toast';
import DeviceInputPanel from './components/DeviceInputPanel';
import AIRecommendationsPanel from './components/AIRecommendationsPanel';

/**
 * Module 2: AI Technician Assistant Page
 * Provides intelligent repair assistance using historical data
 */
const AITechnicianAssistantPage = () => {
  const [deviceInfo, setDeviceInfo] = useState({
    deviceType: '',
    brand: '',
    model: '',
    symptoms: '',
    inspectionNotes: '',
  });

  const [analysisResult, setAnalysisResult] = useState(null);
  const [loading, setLoading] = useState(false);

  const API_BASE = process.env.REACT_APP_SYSTEM_BACKEND_URL || 'http://localhost:8080';

  const handleAnalyze = async () => {
    // Validation
    if (!deviceInfo.deviceType.trim()) {
      toast.error('Device type is required');
      return;
    }
    if (!deviceInfo.symptoms.trim()) {
      toast.error('Symptoms description is required');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`${API_BASE}/api/technician-assistance/analyze`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          deviceType: deviceInfo.deviceType,
          brand: deviceInfo.brand || null,
          model: deviceInfo.model || null,
          symptoms: deviceInfo.symptoms,
          inspectionNotes: deviceInfo.inspectionNotes || null,
          maxSimilarCases: 10,
          minSimilarityScore: 0.3,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setAnalysisResult(data);
        toast.success('Analysis completed successfully');
      } else {
        const error = await response.text();
        toast.error(error || 'Analysis failed');
      }
    } catch (error) {
      console.error('Error during analysis:', error);
      toast.error('Failed to connect to AI service');
    } finally {
      setLoading(false);
    }
  };

  const handleClear = () => {
    setDeviceInfo({
      deviceType: '',
      brand: '',
      model: '',
      symptoms: '',
      inspectionNotes: '',
    });
    setAnalysisResult(null);
  };

  return (
    <div className="min-h-screen bg-gray-50 -m-6">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 p-6 pl-0 shadow-sm">
        <div className="flex items-center gap-3 mb-2">
          <Brain className="w-10 h-10 text-gray-700" />
          <div>
            <h1 className="text-3xl font-bold text-gray-900">AI Repair Assistant</h1>
            <p className="text-gray-600">
              See how we fixed similar issues before • Real solutions from your team
            </p>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex gap-6 p-6">
        {/* Left Panel - Device Input (Much wider to fill space) */}
        <div className="w-[32rem] flex-shrink-0">
          <DeviceInputPanel
            deviceInfo={deviceInfo}
            onChange={setDeviceInfo}
            onAnalyze={handleAnalyze}
            onClear={handleClear}
            loading={loading}
          />
        </div>

        {/* Right Panel - AI Recommendations (Takes remaining space) */}
        <div className="flex-1">
          {loading ? (
            <div className="bg-white rounded-lg shadow-lg p-12 flex flex-col items-center justify-center">
              <Loader className="w-12 h-12 text-blue-600 animate-spin mb-4" />
              <p className="text-gray-600 text-lg">Analyzing repair case...</p>
              <p className="text-gray-500 text-sm mt-2">
                Searching historical data and generating recommendations
              </p>
            </div>
          ) : analysisResult ? (
            <AIRecommendationsPanel result={analysisResult} />
          ) : (
            <div className="bg-white rounded-lg shadow-lg p-12 text-center">
              <Brain className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-2xl font-semibold text-gray-700 mb-3">
                Ready to Help
              </h3>
              <p className="text-gray-600 mb-6 text-lg">
                Enter device symptoms to see similar repairs
              </p>
              <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-5 text-left max-w-md mx-auto">
                <h4 className="font-bold text-blue-900 mb-3 text-lg">What you'll get:</h4>
                <ul className="text-sm text-blue-800 space-y-2">
                  <li className="flex items-start gap-2">
                    <span className="text-blue-600 font-bold">✓</span>
                    <span>Real cases from your repair history</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-blue-600 font-bold">✓</span>
                    <span>Solutions that actually worked</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-blue-600 font-bold">✓</span>
                    <span>Parts used and repair time</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-blue-600 font-bold">✓</span>
                    <span>Learn from experienced technicians</span>
                  </li>
                </ul>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Disclaimer - Simplified */}
      {analysisResult && (
        <div className="mx-6 mb-6 bg-yellow-50 border-l-4 border-yellow-400 rounded-r-lg p-4">
          <h4 className="font-bold text-yellow-900 mb-2 flex items-center gap-2">
            <span>⚠️</span> Important Note
          </h4>
          <p className="text-sm text-yellow-800">
            These are predictions based on past repairs. Always perform proper diagnostics before starting work.
          </p>
        </div>
      )}
    </div>
  );
};

export default AITechnicianAssistantPage;
