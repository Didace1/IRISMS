// src/features/dashboard/components/ManagerDashboard.jsx
import React from 'react';
import { TrendingUp, Users, DollarSign, Target, BarChart3, AlertTriangle } from 'lucide-react';
import { formatCurrency } from '../../../shared/utils/formatters';

export const ManagerDashboard = ({ stats }) => {
  return (
    <div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-sm">Monthly Revenue</p>
              <p className="text-2xl font-bold text-green-600">{formatCurrency(stats.monthlyRevenue)}</p>
            </div>
            <DollarSign className="w-8 h-8 text-green-300" />
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-sm">Tech Utilization</p>
              <p className="text-2xl font-bold text-blue-600">{stats.technicianUtilization}%</p>
            </div>
            <Users className="w-8 h-8 text-blue-300" />
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-sm">Customer Satisfaction</p>
              <p className="text-2xl font-bold text-purple-600">{stats.customerSatisfaction}/5</p>
            </div>
            <Target className="w-8 h-8 text-purple-300" />
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-sm">Cost Reduction</p>
              <p className="text-2xl font-bold text-orange-600">{stats.costReduction}%</p>
            </div>
            <TrendingUp className="w-8 h-8 text-orange-300" />
          </div>
        </div>
      </div>
      
      {/* Performance Metrics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold mb-4">Team Performance</h3>
          <div className="space-y-3">
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span>Repair Completion Rate</span>
                <span className="font-medium">85%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div className="bg-green-500 h-2 rounded-full" style={{ width: '85%' }}></div>
              </div>
            </div>
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span>First-Time Fix Rate</span>
                <span className="font-medium">78%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div className="bg-blue-500 h-2 rounded-full" style={{ width: '78%' }}></div>
              </div>
            </div>
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span>On-Time Delivery</span>
                <span className="font-medium">92%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div className="bg-purple-500 h-2 rounded-full" style={{ width: '92%' }}></div>
              </div>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold mb-4">Quick Actions</h3>
          <div className="space-y-3">
            <button className="w-full p-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center justify-between">
              <span>View Detailed Reports</span>
              <BarChart3 className="w-5 h-5" />
            </button>
            <button className="w-full p-3 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center justify-between">
              <span>Manage Team Schedule</span>
              <Users className="w-5 h-5" />
            </button>
            <button className="w-full p-3 bg-orange-600 text-white rounded-lg hover:bg-orange-700 flex items-center justify-between">
              <span>Review Inventory Alerts</span>
              <AlertTriangle className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};