import React, { useState, useEffect } from 'react';
import { Brain, TrendingUp, Package, ArrowRight, Loader } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const AIRecommendationsWidget = () => {
  const [recommendations, setRecommendations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [userName, setUserName] = useState('User');
  const navigate = useNavigate();

  const AI_BACKEND_BASE_URL = process.env.REACT_APP_AI_BACKEND_URL || 'http://localhost:8000';

  // Get user name from localStorage
  useEffect(() => {
    try {
      const userStr = localStorage.getItem('user');
      if (userStr) {
        const user = JSON.parse(userStr);
        // Use fullName, or fallback to firstName, username, or 'User'
        const name = user.fullName || user.firstName || user.username || 'User';
        setUserName(name);
      }
    } catch (err) {
      console.error('Error parsing user data:', err);
    }
  }, []);

  useEffect(() => {
    const fetchTopRecommendations = async () => {
      try {
        const response = await fetch(`${AI_BACKEND_BASE_URL}/api/inventory-recommendations`);
        
        if (!response.ok) {
          throw new Error('Failed to fetch recommendations');
        }
        
        const data = await response.json();
        // Get top 3 recommendations
        setRecommendations(data.data?.recommendations?.slice(0, 3) || []);
        setError(null);
      } catch (err) {
        setError(err.message);
        console.error('Error fetching recommendations:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchTopRecommendations();
  }, []);

  const getPriorityColor = (score) => {
    if (score >= 4) return 'text-red-600';
    if (score >= 3) return 'text-orange-600';
    if (score >= 2) return 'text-yellow-600';
    return 'text-green-600';
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="flex items-center gap-3 mb-4">
          <Brain className="w-6 h-6 text-purple-600" />
          <h3 className="text-lg font-semibold text-gray-900">AI Recommendations</h3>
        </div>
        <div className="flex items-center justify-center py-8">
          <Loader className="w-6 h-6 text-gray-400 animate-spin" />
          <span className="ml-2 text-gray-600">Loading recommendations...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="flex items-center gap-3 mb-4">
          <Brain className="w-6 h-6 text-purple-600" />
          <h3 className="text-lg font-semibold text-gray-900">AI Recommendations</h3>
        </div>
        <div className="text-center py-4">
          <p className="text-gray-600 text-sm">Unable to load recommendations</p>
          <button
            onClick={() => window.location.reload()}
            className="text-blue-600 hover:text-blue-700 text-sm mt-2"
          >
            Try again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      {/* Personalized Greeting */}
      <div className="mb-4 pb-3 border-b border-gray-100">
        <p className="text-gray-700 font-medium">
          Hello {userName}! 👋
        </p>
        <p className="text-sm text-gray-600 mt-1">
          We have stock recommendations for you
        </p>
      </div>

      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <Brain className="w-6 h-6 text-purple-600" />
          <h3 className="text-lg font-semibold text-gray-900">AI Recommendations</h3>
        </div>
        <button
          onClick={() => navigate('/inventory/ai-recommendations')}
          className="text-blue-600 hover:text-blue-700 text-sm font-medium flex items-center gap-1"
        >
          View All
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>

      {recommendations.length === 0 ? (
        <div className="text-center py-6">
          <Package className="w-8 h-8 text-gray-300 mx-auto mb-2" />
          <p className="text-gray-600 text-sm">No recommendations available</p>
          <p className="text-gray-500 text-xs mt-1">Check back after some sales data is collected</p>
        </div>
      ) : (
        <div className="space-y-4">
          {recommendations.map((device, index) => (
            <div key={index} className="border border-gray-100 rounded-lg p-4 hover:bg-gray-50 transition-colors">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h4 className="font-medium text-gray-900 text-sm">{device.device}</h4>
                    <span className={`text-xs font-medium ${getPriorityColor(device.recommendation_score)}`}>
                      {device.recommendation_score}/5.0
                    </span>
                  </div>
                  <p className="text-xs text-gray-600 mb-2">{device.brand} • {device.category?.name || device.category || 'N/A'}</p>
                  <p className="text-xs text-gray-700 line-clamp-2">{device.reason}</p>
                  <div className="flex items-center gap-3 mt-2">
                    <div className="flex items-center gap-1">
                      <TrendingUp className="w-3 h-3 text-green-500" />
                      <span className="text-xs text-gray-600 capitalize">{device.market_demand} demand</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Package className="w-3 h-3 text-blue-500" />
                      <span className="text-xs text-gray-600">Qty: {device.recommended_quantity}</span>
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => navigate('/inventory/ai-recommendations')}
                  className="bg-blue-600 text-white px-3 py-1 rounded text-xs hover:bg-blue-700 transition-colors ml-3"
                >
                  View
                </button>
              </div>
            </div>
          ))}
          
          <div className="pt-2 border-t border-gray-100">
            <button
              onClick={() => navigate('/inventory/ai-recommendations')}
              className="w-full bg-gradient-to-r from-purple-600 to-blue-600 text-white py-2 px-4 rounded-lg hover:from-purple-700 hover:to-blue-700 transition-colors text-sm font-medium flex items-center justify-center gap-2"
            >
              <Brain className="w-4 h-4" />
              Get Full AI Analysis
            </button>
          </div>
        </div>
      )}
    </div>
  );
};