// Design System Showcase Component
// This file demonstrates all the UI components from the design guide
// Use this as a reference when building new features

import React, { useState } from 'react';
import { 
  CheckCircle, 
  AlertCircle, 
  Info, 
  XCircle,
  Loader,
  Wrench,
  Package,
  TrendingUp,
  Users
} from 'lucide-react';

export const DesignShowcase = () => {
  const [loading, setLoading] = useState(false);

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto">
        
        {/* Header */}
        <div className="mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            SmartFix Design System
          </h1>
          <p className="text-lg text-gray-600">
            Component library and design patterns
          </p>
        </div>

        {/* Buttons Section */}
        <section className="mb-12">
          <h2 className="text-2xl font-semibold text-gray-900 mb-6">Buttons</h2>
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
            <div className="flex flex-wrap gap-4">
              
              {/* Primary Button */}
              <button className="px-6 py-3 bg-blue-600 text-white rounded-lg 
                               hover:bg-blue-700 active:bg-blue-800 
                               transition-colors duration-200 
                               font-medium shadow-sm hover:shadow-md">
                Primary Button
              </button>

              {/* Secondary Button */}
              <button className="px-6 py-3 bg-white text-gray-700 border-2 border-gray-300 
                               rounded-lg hover:bg-gray-50 active:bg-gray-100 
                               transition-colors duration-200 font-medium">
                Secondary Button
              </button>

              {/* AI Button */}
              <button className="px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 
                               text-white rounded-lg hover:from-purple-700 hover:to-pink-700 
                               transition-all duration-200 font-medium shadow-lg 
                               hover:shadow-xl transform hover:-translate-y-0.5">
                🤖 AI Diagnose
              </button>

              {/* Success Button */}
              <button className="px-6 py-3 bg-green-600 text-white rounded-lg 
                               hover:bg-green-700 transition-colors duration-200 
                               font-medium">
                Success Action
              </button>

              {/* Danger Button */}
              <button className="px-6 py-3 bg-red-600 text-white rounded-lg 
                               hover:bg-red-700 transition-colors duration-200 
                               font-medium">
                Delete
              </button>

              {/* Disabled Button */}
              <button className="px-6 py-3 bg-gray-300 text-gray-500 rounded-lg 
                               cursor-not-allowed font-medium" disabled>
                Disabled
              </button>
            </div>
          </div>
        </section>

        {/* Cards Section */}
        <section className="mb-12">
          <h2 className="text-2xl font-semibold text-gray-900 mb-6">Cards</h2>
          
          {/* Stat Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
            
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Total Repairs</p>
                  <p className="text-3xl font-bold text-gray-900">1,234</p>
                  <p className="text-sm text-green-600 mt-1 flex items-center">
                    <TrendingUp className="w-4 h-4 mr-1" />
                    12% from last month
                  </p>
                </div>
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                  <Wrench className="w-6 h-6 text-blue-600" />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Low Stock Items</p>
                  <p className="text-3xl font-bold text-gray-900">23</p>
                  <p className="text-sm text-red-600 mt-1">Needs attention</p>
                </div>
                <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
                  <Package className="w-6 h-6 text-red-600" />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Active Technicians</p>
                  <p className="text-3xl font-bold text-gray-900">8</p>
                  <p className="text-sm text-gray-600 mt-1">Currently working</p>
                </div>
                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                  <Users className="w-6 h-6 text-green-600" />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Revenue</p>
                  <p className="text-3xl font-bold text-gray-900">45.2K RWF</p>
                  <p className="text-sm text-green-600 mt-1 flex items-center">
                    <TrendingUp className="w-4 h-4 mr-1" />
                    8% increase
                  </p>
                </div>
                <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                  <span className="text-2xl">💰</span>
                </div>
              </div>
            </div>
          </div>

          {/* AI Result Card */}
          <div className="bg-gradient-to-br from-purple-50 to-pink-50 
                          rounded-xl border-2 border-purple-200 p-6 mb-6">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 bg-purple-600 rounded-lg flex items-center justify-center flex-shrink-0">
                <span className="text-white text-xl">🤖</span>
              </div>
              <div className="flex-1">
                <h4 className="font-semibold text-gray-900 mb-2">AI Diagnosis Result</h4>
                <p className="text-gray-700 mb-3">Battery Failure Detected</p>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-600">Confidence:</span>
                  <div className="flex-1 bg-white rounded-full h-2 max-w-xs">
                    <div className="bg-purple-600 h-2 rounded-full transition-all duration-500" 
                         style={{width: '95%'}}></div>
                  </div>
                  <span className="text-sm font-semibold text-purple-600">95%</span>
                </div>
              </div>
            </div>
          </div>

          {/* Standard Card */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Standard Card</h3>
            <p className="text-gray-600">
              This is a standard card component with a title and description. 
              Use it for general content display.
            </p>
          </div>
        </section>

        {/* Alerts Section */}
        <section className="mb-12">
          <h2 className="text-2xl font-semibold text-gray-900 mb-6">Alerts & Notifications</h2>
          <div className="space-y-4">
            
            {/* Success Alert */}
            <div className="bg-green-50 border-l-4 border-green-500 p-4 rounded-r-lg">
              <div className="flex items-start">
                <CheckCircle className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-green-800">Success!</h3>
                  <p className="text-sm text-green-700 mt-1">
                    Repair completed successfully and customer has been notified.
                  </p>
                </div>
              </div>
            </div>

            {/* Error Alert */}
            <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-r-lg">
              <div className="flex items-start">
                <XCircle className="w-5 h-5 text-red-500 mt-0.5 flex-shrink-0" />
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-red-800">Error</h3>
                  <p className="text-sm text-red-700 mt-1">
                    Unable to process diagnosis. Please check your input and try again.
                  </p>
                </div>
              </div>
            </div>

            {/* Warning Alert */}
            <div className="bg-yellow-50 border-l-4 border-yellow-500 p-4 rounded-r-lg">
              <div className="flex items-start">
                <AlertCircle className="w-5 h-5 text-yellow-500 mt-0.5 flex-shrink-0" />
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-yellow-800">Warning</h3>
                  <p className="text-sm text-yellow-700 mt-1">
                    Stock level is low. Only 5 units remaining for this part.
                  </p>
                </div>
              </div>
            </div>

            {/* Info Alert */}
            <div className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded-r-lg">
              <div className="flex items-start">
                <Info className="w-5 h-5 text-blue-500 mt-0.5 flex-shrink-0" />
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-blue-800">Information</h3>
                  <p className="text-sm text-blue-700 mt-1">
                    System maintenance scheduled for tonight at 2:00 AM.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Badges Section */}
        <section className="mb-12">
          <h2 className="text-2xl font-semibold text-gray-900 mb-6">Badges & Status</h2>
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
            <div className="flex flex-wrap gap-3">
              <span className="px-3 py-1 text-xs font-medium bg-green-100 text-green-800 rounded-full">
                Completed
              </span>
              <span className="px-3 py-1 text-xs font-medium bg-yellow-100 text-yellow-800 rounded-full">
                In Progress
              </span>
              <span className="px-3 py-1 text-xs font-medium bg-red-100 text-red-800 rounded-full">
                Failed
              </span>
              <span className="px-3 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded-full">
                Pending
              </span>
              <span className="px-3 py-1 text-xs font-medium bg-purple-100 text-purple-800 rounded-full">
                AI Analyzed
              </span>
              <span className="px-3 py-1 text-xs font-medium bg-gray-100 text-gray-800 rounded-full">
                Cancelled
              </span>
            </div>
          </div>
        </section>

        {/* Forms Section */}
        <section className="mb-12">
          <h2 className="text-2xl font-semibold text-gray-900 mb-6">Form Elements</h2>
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
            
            {/* Input Field */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Device Model
              </label>
              <input 
                type="text"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg 
                         focus:ring-2 focus:ring-blue-500 focus:border-transparent 
                         transition-all duration-200"
                placeholder="Enter device model"
              />
            </div>

            {/* Select Dropdown */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Brand
              </label>
              <select className="w-full px-4 py-3 border border-gray-300 rounded-lg 
                               focus:ring-2 focus:ring-blue-500 focus:border-transparent 
                               transition-all duration-200 bg-white">
                <option>Select brand</option>
                <option>Apple</option>
                <option>Dell</option>
                <option>HP</option>
                <option>Lenovo</option>
                <option>Asus</option>
              </select>
            </div>

            {/* Textarea */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Symptoms Description
              </label>
              <textarea 
                rows="4"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg 
                         focus:ring-2 focus:ring-blue-500 focus:border-transparent 
                         transition-all duration-200 resize-none"
                placeholder="Describe the issue in detail..."
              />
            </div>

            {/* Checkbox */}
            <div className="mb-6">
              <label className="flex items-center">
                <input 
                  type="checkbox" 
                  className="w-4 h-4 text-blue-600 border-gray-300 rounded 
                           focus:ring-2 focus:ring-blue-500"
                />
                <span className="ml-2 text-sm text-gray-700">
                  Send notification to customer
                </span>
              </label>
            </div>

            {/* Radio Buttons */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Priority Level
              </label>
              <div className="space-y-2">
                <label className="flex items-center">
                  <input 
                    type="radio" 
                    name="priority" 
                    className="w-4 h-4 text-blue-600 border-gray-300 
                             focus:ring-2 focus:ring-blue-500"
                  />
                  <span className="ml-2 text-sm text-gray-700">Low</span>
                </label>
                <label className="flex items-center">
                  <input 
                    type="radio" 
                    name="priority" 
                    className="w-4 h-4 text-blue-600 border-gray-300 
                             focus:ring-2 focus:ring-blue-500"
                    defaultChecked
                  />
                  <span className="ml-2 text-sm text-gray-700">Medium</span>
                </label>
                <label className="flex items-center">
                  <input 
                    type="radio" 
                    name="priority" 
                    className="w-4 h-4 text-blue-600 border-gray-300 
                             focus:ring-2 focus:ring-blue-500"
                  />
                  <span className="ml-2 text-sm text-gray-700">High</span>
                </label>
              </div>
            </div>
          </div>
        </section>

        {/* Loading States Section */}
        <section className="mb-12">
          <h2 className="text-2xl font-semibold text-gray-900 mb-6">Loading States</h2>
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
            
            {/* Spinner */}
            <div className="mb-8">
              <h3 className="text-sm font-medium text-gray-700 mb-4">Spinner</h3>
              <div className="flex items-center justify-center p-8 bg-gray-50 rounded-lg">
                <div className="animate-spin rounded-full h-12 w-12 border-4 border-gray-200 border-t-blue-600"></div>
              </div>
            </div>

            {/* Skeleton Loader */}
            <div>
              <h3 className="text-sm font-medium text-gray-700 mb-4">Skeleton Loader</h3>
              <div className="animate-pulse space-y-3">
                <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                <div className="h-4 bg-gray-200 rounded w-5/6"></div>
              </div>
            </div>
          </div>
        </section>

        {/* Table Section */}
        <section className="mb-12">
          <h2 className="text-2xl font-semibold text-gray-900 mb-6">Data Table</h2>
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Device
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Customer
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                <tr className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4 text-sm text-gray-900">iPhone 13 Pro</td>
                  <td className="px-6 py-4 text-sm text-gray-600">John Doe</td>
                  <td className="px-6 py-4">
                    <span className="px-3 py-1 text-xs font-medium bg-green-100 text-green-800 rounded-full">
                      Completed
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <button className="text-blue-600 hover:text-blue-800 text-sm font-medium">
                      View Details
                    </button>
                  </td>
                </tr>
                <tr className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4 text-sm text-gray-900">Dell XPS 15</td>
                  <td className="px-6 py-4 text-sm text-gray-600">Jane Smith</td>
                  <td className="px-6 py-4">
                    <span className="px-3 py-1 text-xs font-medium bg-yellow-100 text-yellow-800 rounded-full">
                      In Progress
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <button className="text-blue-600 hover:text-blue-800 text-sm font-medium">
                      View Details
                    </button>
                  </td>
                </tr>
                <tr className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4 text-sm text-gray-900">MacBook Pro</td>
                  <td className="px-6 py-4 text-sm text-gray-600">Bob Johnson</td>
                  <td className="px-6 py-4">
                    <span className="px-3 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded-full">
                      Pending
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <button className="text-blue-600 hover:text-blue-800 text-sm font-medium">
                      View Details
                    </button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

      </div>
    </div>
  );
};

export default DesignShowcase;
