// src/features/inventory/CustomerRequestsPage.jsx
import React, { useState, useEffect } from 'react';
import { Package, TrendingUp, Users, Calendar, AlertCircle, Plus } from 'lucide-react';
import toast from 'react-hot-toast';
import { PageHeader } from '../../shared/components/Common/PageHeader';
import { StatCard } from '../../shared/components/Common/StatCard';
import { LoadingState } from '../../shared/components/Common/LoadingState';
import { EmptyState } from '../../shared/components/Common/EmptyState';
import { RecordCustomerRequestModal } from '../sales/components/RecordCustomerRequestModal';

export const CustomerRequestsPage = () => {
  const SYSTEM_BACKEND_BASE_URL = process.env.REACT_APP_SYSTEM_BACKEND_URL || 'http://localhost:8080';
  const AI_BACKEND_BASE_URL = process.env.REACT_APP_AI_BACKEND_URL || 'http://localhost:8000';
  
  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState(null);
  const [requests, setRequests] = useState([]);
  const [showRequestModal, setShowRequestModal] = useState(false);
  const [userName, setUserName] = useState('User');

  // Get user name from localStorage
  useEffect(() => {
    try {
      const userStr = localStorage.getItem('user');
      if (userStr) {
        const user = JSON.parse(userStr);
        const name = user.fullName || user.firstName || user.username || 'User';
        setUserName(name);
      }
    } catch (err) {
      console.error('Error parsing user data:', err);
    }
  }, []);

  useEffect(() => {
    loadCustomerRequests();
  }, []);

  const loadCustomerRequests = async () => {
    try {
      setLoading(true);
      
      // Fetch summary from AI backend
      const summaryResponse = await fetch(`${AI_BACKEND_BASE_URL}/api/customer-demand-summary`);
      if (summaryResponse.ok) {
        const summaryData = await summaryResponse.json();
        setSummary(summaryData.summary);
        setRequests(summaryData.top_requested || []);
      }
    } catch (error) {
      console.error('Error loading customer requests:', error);
      toast.error('Failed to load customer requests');
    } finally {
      setLoading(false);
    }
  };

  const handleRequestSuccess = async () => {
    toast.success('Customer request recorded! Refreshing list...');
    await loadCustomerRequests();
  };

  const getPriorityBadge = (count) => {
    if (count >= 10) {
      return <span className="px-3 py-1.5 text-sm font-semibold bg-red-100 text-red-800 rounded-full">Very High</span>;
    } else if (count >= 7) {
      return <span className="px-3 py-1.5 text-sm font-semibold bg-orange-100 text-orange-800 rounded-full">High</span>;
    } else if (count >= 5) {
      return <span className="px-3 py-1.5 text-sm font-semibold bg-yellow-100 text-yellow-800 rounded-full">Medium</span>;
    } else {
      return <span className="px-3 py-1.5 text-sm font-semibold bg-gray-100 text-gray-800 rounded-full">Low</span>;
    }
  };

  if (loading) {
    return <LoadingState message="Loading customer requests..." />;
  }

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      {/* Personalized Greeting */}
      <div className="mb-6 bg-gradient-to-r from-purple-600 to-blue-600 rounded-lg shadow-lg p-6 text-white">
        <h1 className="text-2xl font-bold mb-2">
          Hello {userName}! 👋
        </h1>
        <p className="text-lg opacity-90">
          Here are the customer requests from your sales team
        </p>
      </div>

      <div className="flex items-center justify-between mb-6">
        <PageHeader
          title="Customer Product Requests"
          subtitle="Track products customers are asking for that aren't in stock"
        />
        <button
          onClick={() => setShowRequestModal(true)}
          className="flex items-center space-x-2 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors shadow-md text-base font-semibold"
        >
          <Plus className="w-5 h-5" />
          <span>Record Request</span>
        </button>
      </div>

      {/* Info Banner */}
      <div className="mb-6 bg-blue-50 border border-blue-200 rounded-lg p-5 flex items-start space-x-3">
        <AlertCircle className="w-6 h-6 text-blue-600 flex-shrink-0 mt-0.5" />
        <div className="text-base text-blue-800">
          <p className="font-semibold mb-2 text-lg">How it works</p>
          <p className="leading-relaxed">
            Sales staff records products that customers request but aren't in stock. When 5+ customers request the same product,
            AI automatically recommends it with HIGH priority in your AI Recommendations dashboard.
          </p>
        </div>
      </div>

      {/* Summary Stats */}
      {summary && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
          <StatCard
            label="Total Products Requested"
            value={summary.total_products_requested || 0}
            accent="text-purple-600"
            icon={<Package className="w-8 h-8" />}
          />
          <StatCard
            label="Total Requests"
            value={summary.total_requests || 0}
            accent="text-blue-600"
            icon={<Users className="w-8 h-8" />}
          />
          <StatCard
            label="High Demand (10+)"
            value={summary.high_demand_products || 0}
            accent="text-red-600"
            icon={<TrendingUp className="w-8 h-8" />}
          />
          <StatCard
            label="Medium Demand (5-9)"
            value={summary.medium_demand_products || 0}
            accent="text-orange-600"
            icon={<TrendingUp className="w-8 h-8" />}
          />
        </div>
      )}

      {/* Requests Table */}
      <div className="bg-white rounded-lg shadow">
        <div className="p-6 border-b">
          <h2 className="text-2xl font-bold text-gray-900 flex items-center space-x-2">
            <TrendingUp className="w-7 h-7 text-purple-600" />
            <span>Trending Customer Requests</span>
          </h2>
          <p className="text-base text-gray-600 mt-2">
            Products sorted by number of customer requests
          </p>
        </div>

        {requests.length === 0 ? (
          <div className="p-12">
            <EmptyState
              title="No customer requests yet"
              description="When sales staff records customer requests for out-of-stock products, they will appear here."
            />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700 uppercase tracking-wider">
                    Product Name
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700 uppercase tracking-wider">
                    Brand
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700 uppercase tracking-wider">
                    Requests
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700 uppercase tracking-wider">
                    Priority
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700 uppercase tracking-wider">
                    First Request
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700 uppercase tracking-wider">
                    Latest Request
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700 uppercase tracking-wider">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {requests.map((request, index) => {
                  const meetsThreshold = request.requestCount >= 5;
                  return (
                    <tr key={index} className={meetsThreshold ? 'bg-yellow-50' : ''}>
                      <td className="px-6 py-5 whitespace-nowrap">
                        <div className="flex items-center">
                          <Package className="w-6 h-6 text-gray-400 mr-3" />
                          <div>
                            <div className="text-base font-semibold text-gray-900">
                              {request.productName}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-5 whitespace-nowrap">
                        <div className="text-base text-gray-900">{request.brand || 'N/A'}</div>
                      </td>
                      <td className="px-6 py-5 whitespace-nowrap">
                        <div className="flex items-center">
                          <Users className="w-5 h-5 text-gray-400 mr-2" />
                          <span className="text-base font-bold text-gray-900">
                            {request.requestCount}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-5 whitespace-nowrap">
                        {getPriorityBadge(request.requestCount)}
                      </td>
                      <td className="px-6 py-5 whitespace-nowrap">
                        <div className="flex items-center text-base text-gray-600">
                          <Calendar className="w-5 h-5 mr-2" />
                          {request.firstRequest ? new Date(request.firstRequest).toLocaleDateString() : 'N/A'}
                        </div>
                      </td>
                      <td className="px-6 py-5 whitespace-nowrap">
                        <div className="flex items-center text-base text-gray-600">
                          <Calendar className="w-5 h-5 mr-2" />
                          {request.lastRequest ? new Date(request.lastRequest).toLocaleDateString() : 'N/A'}
                        </div>
                      </td>
                      <td className="px-6 py-5 whitespace-nowrap">
                        {meetsThreshold ? (
                          <span className="px-3 py-1.5 text-sm font-semibold bg-green-100 text-green-800 rounded-full flex items-center w-fit">
                            <TrendingUp className="w-4 h-4 mr-1" />
                            AI Recommended
                          </span>
                        ) : (
                          <span className="px-3 py-1.5 text-sm font-semibold bg-gray-100 text-gray-600 rounded-full">
                            Monitoring
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Legend */}
      {requests.length > 0 && (
        <div className="mt-6 bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-bold text-gray-900 mb-4">Priority Levels</h3>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-base">
            <div className="flex items-center space-x-3">
              <span className="px-3 py-1.5 text-sm font-semibold bg-red-100 text-red-800 rounded-full">Very High</span>
              <span className="text-gray-700 font-medium">10+ requests</span>
            </div>
            <div className="flex items-center space-x-3">
              <span className="px-3 py-1.5 text-sm font-semibold bg-orange-100 text-orange-800 rounded-full">High</span>
              <span className="text-gray-700 font-medium">7-9 requests</span>
            </div>
            <div className="flex items-center space-x-3">
              <span className="px-3 py-1.5 text-sm font-semibold bg-yellow-100 text-yellow-800 rounded-full">Medium</span>
              <span className="text-gray-700 font-medium">5-6 requests</span>
            </div>
            <div className="flex items-center space-x-3">
              <span className="px-3 py-1.5 text-sm font-semibold bg-gray-100 text-gray-800 rounded-full">Low</span>
              <span className="text-gray-700 font-medium">1-4 requests</span>
            </div>
          </div>
          <p className="text-sm text-gray-600 mt-4 font-medium">
            * Products with 5+ requests are automatically recommended by AI with HIGH priority
          </p>
        </div>
      )}

      {/* Record Customer Request Modal */}
      <RecordCustomerRequestModal
        isOpen={showRequestModal}
        onClose={() => setShowRequestModal(false)}
        onSuccess={handleRequestSuccess}
      />
    </div>
  );
};
