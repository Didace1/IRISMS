// src/features/dashboard/components/InventoryDashboard.jsx
import React, { useEffect, useState } from 'react';
import { Package, AlertCircle, TrendingUp, PlusCircle, Eye, Tag } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { StatCard } from '../../../shared/components/Common/StatCard';
import { formatNumber, formatCurrency } from '../../../shared/utils/formatters';
import { AIRecommendationsWidget } from '../../inventory/components/AIRecommendationsWidget';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  Legend,
  ComposedChart,
  Area
} from 'recharts';

export const InventoryDashboard = ({ stats }) => {
  const SYSTEM_BACKEND_BASE_URL = process.env.REACT_APP_SYSTEM_BACKEND_URL || 'http://localhost:8080';
  const navigate = useNavigate();
  const [periodDays, setPeriodDays] = useState(30);
  const [inventory, setInventory] = useState([]);
  const [categoryStats, setCategoryStats] = useState([]);
  const [analytics, setAnalytics] = useState({
    stockTrend: [],
    stockFlowTrend: [],
    valueTrend: [],
    categoryDistribution: [],
    categoryValue: [],
    lowStockTop: []
  });

  useEffect(() => {
    const loadInventory = async () => {
      try {
        console.log('Loading inventory from:', `${SYSTEM_BACKEND_BASE_URL}/api/inventory`);
        const response = await fetch(`${SYSTEM_BACKEND_BASE_URL}/api/inventory`);
        const data = await response.json();
        if (response.ok) {
          console.log('Inventory data loaded:', data.length, 'items');
          setInventory(data);
          
          // Calculate category statistics from real database data
          const categoryMap = {};
          data.forEach(item => {
            const category = item.category?.name || item.category || 'Uncategorized';
            if (!categoryMap[category]) {
              categoryMap[category] = {
                name: category,
                count: 0,
                totalQuantity: 0,
                totalValue: 0
              };
            }
            categoryMap[category].count += 1;
            categoryMap[category].totalQuantity += item.quantity || 0;
            categoryMap[category].totalValue += (item.quantity || 0) * (item.price || 0);
          });
          
          const categoryStatsArray = Object.values(categoryMap).sort((a, b) => b.count - a.count);
          console.log('Category statistics calculated:', categoryStatsArray);
          setCategoryStats(categoryStatsArray);
        } else {
          console.error('Failed to load inventory:', response.status, data);
        }
      } catch (error) {
        console.error('Error loading inventory from database:', error);
      }
    };

    const loadAnalytics = async () => {
      try {
        const response = await fetch(`${SYSTEM_BACKEND_BASE_URL}/api/inventory/analytics?periodDays=${periodDays}`);
        const data = await response.json();
        if (response.ok) {
          setAnalytics({
            stockTrend: data.stockTrend || [],
            stockFlowTrend: data.stockFlowTrend || [],
            valueTrend: (data.valueTrend || []).map((item) => ({ ...item, netValueChange: Number(item.netValueChange || 0) })),
            categoryDistribution: data.categoryDistribution || [],
            categoryValue: (data.categoryValue || []).map((item) => ({ ...item, value: Number(item.value || 0) })),
            lowStockTop: data.lowStockTop || []
          });
        }
      } catch {
      }
    };

    loadInventory();
    loadAnalytics();
  }, [SYSTEM_BACKEND_BASE_URL, periodDays]);

  return (
    <div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 mb-6">
        <StatCard label="Total Stock Items"   value={formatNumber(stats.totalParts)}   accent="text-green-600"   icon={<Package className="w-5 h-5" />} />
        <StatCard label="Total Quantity"      value={formatNumber(inventory.reduce((sum, item) => sum + (item.quantity || 0), 0))} accent="text-green-600" icon={<Package className="w-5 h-5" />} />
        <StatCard label="Low Stock Alerts"    value={formatNumber(stats.lowStockItems)} accent="text-green-600"    icon={<AlertCircle className="w-5 h-5" />} subtitle={stats.lowStockItems > 0 ? 'Needs attention' : 'All good'} />
        <StatCard label="Total Stock Value"   value={formatCurrency(stats.totalValue)} accent="text-green-600"  icon={<TrendingUp className="w-5 h-5" />} />
      </div>

      {/* Stock Count by Categories */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6 mb-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Stock Count by Categories</h2>
            <p className="text-sm text-gray-500">Overview of inventory items grouped by category</p>
          </div>
          <Tag className="w-6 h-6 text-indigo-500" />
        </div>
        
        {categoryStats.length === 0 ? (
          <div className="text-center py-8">
            <Package className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500">No inventory items found</p>
            <p className="text-sm text-gray-400">Add some items to see category statistics</p>
            <div className="mt-4 p-3 bg-gray-50 rounded-lg text-left">
              <p className="text-xs text-gray-600 mb-1">Debug Info:</p>
              <p className="text-xs text-gray-500">API URL: {SYSTEM_BACKEND_BASE_URL}/api/inventory</p>
              <p className="text-xs text-gray-500">Items loaded: {inventory.length}</p>
              <p className="text-xs text-gray-500">Check browser console for more details</p>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {categoryStats.slice(0, 5).map((category, index) => {
              return (
                <div 
                  key={category.name} 
                  className="bg-white border-2 border-green-500 rounded-xl p-5 hover:shadow-xl transition-all duration-200 cursor-pointer hover:scale-105 transform"
                  onClick={() => navigate(`/inventory?category=${encodeURIComponent(category.name)}`)}
                >
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-bold text-gray-600 truncate text-lg">{category.name}</h3>
                    <div className="w-3 h-3 rounded-full bg-white border-2 border-green-500"></div>
                  </div>
                  
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-500 font-medium">Items:</span>
                      <span className="font-bold text-gray-600 text-lg">{formatNumber(category.count)}</span>
                    </div>
                    
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-500 font-medium">Qty:</span>
                      <span className="font-bold text-gray-600 text-lg">{formatNumber(category.totalQuantity)}</span>
                    </div>
                    
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-500 font-medium">Value:</span>
                      <span className="font-bold text-gray-600 text-base">{formatCurrency(category.totalValue)}</span>
                    </div>
                  </div>
                </div>
              );
            })}
            
            {/* Show "View All" card if there are more than 5 categories */}
            {categoryStats.length > 5 && (
              <div 
                className="bg-gradient-to-br from-gray-100 to-gray-200 border border-gray-300 rounded-lg p-3 hover:shadow-lg transition-all duration-200 cursor-pointer hover:scale-105 transform flex flex-col items-center justify-center text-center"
                onClick={() => navigate('/inventory')}
              >
                <Package className="w-6 h-6 text-gray-600 mb-2" />
                <span className="text-sm font-semibold text-gray-700">+{categoryStats.length - 5} More</span>
                <span className="text-xs text-gray-600">View All Categories</span>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Category Insights */}
      {categoryStats.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          {/* Largest Category by Items */}
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 flex items-center gap-4">
            <div className="w-11 h-11 rounded-xl bg-blue-50 flex items-center justify-center flex-shrink-0">
              <Package className="w-5 h-5 text-blue-500" />
            </div>
            <div>
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Most Items</p>
              <p className="text-lg font-bold text-gray-900 mt-0.5">{categoryStats[0]?.name || '—'}</p>
              <p className="text-xs text-gray-400 mt-0.5">
                {formatNumber(categoryStats[0]?.count || 0)} items • {formatNumber(categoryStats[0]?.totalQuantity || 0)} total qty
              </p>
            </div>
          </div>

          {/* Highest Value Category */}
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 flex items-center gap-4">
            <div className="w-11 h-11 rounded-xl bg-green-50 flex items-center justify-center flex-shrink-0">
              <TrendingUp className="w-5 h-5 text-green-500" />
            </div>
            <div>
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Highest Value</p>
              <p className="text-lg font-bold text-gray-900 mt-0.5">
                {categoryStats.sort((a, b) => b.totalValue - a.totalValue)[0]?.name || '—'}
              </p>
              <p className="text-xs text-gray-400 mt-0.5">
                {formatCurrency(categoryStats.sort((a, b) => b.totalValue - a.totalValue)[0]?.totalValue || 0)} • {formatNumber(categoryStats.sort((a, b) => b.totalValue - a.totalValue)[0]?.totalQuantity || 0)} total qty
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Analytics Section */}
      <div className="mt-8 space-y-6">
        <div className="bg-white rounded-lg shadow p-4 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Inventory Analytics</h2>
            <p className="text-sm text-gray-500">Real trend insights from stock data</p>
          </div>
          <select
            value={periodDays}
            onChange={(e) => setPeriodDays(Number(e.target.value))}
            className="px-3 py-2 border rounded-lg"
          >
            <option value={7}>Last 7 days</option>
            <option value={30}>Last 1 month</option>
            <option value={90}>Last 3 months</option>
            <option value={180}>Last 6 months</option>
            <option value={365}>Last 1 year</option>
          </select>
        </div>

        {/* Row 1: Stock Movement & Stock Value */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white rounded-lg shadow p-4">
            <h3 className="text-sm font-semibold text-gray-700 mb-3">Stock Movement Trend</h3>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={analytics.stockTrend}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                  <YAxis />
                  <Tooltip />
                  <Line type="monotone" dataKey="stock" stroke="#2563eb" strokeWidth={2} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-4">
            <h3 className="text-sm font-semibold text-gray-700 mb-3">Stock Value by Category</h3>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={analytics.categoryValue}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="value" fill="#16a34a" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Row 2: Stock Flow & Value Change */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white rounded-lg shadow p-4">
            <h3 className="text-sm font-semibold text-gray-700 mb-3">Stock-In vs Stock-Out</h3>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={analytics.stockFlowTrend}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="stockIn" fill="#22c55e" name="Stock In" />
                  <Bar dataKey="stockOut" fill="#ef4444" name="Stock Out" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-4">
            <h3 className="text-sm font-semibold text-gray-700 mb-3">Inventory Value Change</h3>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={analytics.valueTrend}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                  <YAxis />
                  <Tooltip />
                  <Area type="monotone" dataKey="netValueChange" fill="#93c5fd" stroke="#2563eb" name="Net Value Change" />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Row 3: Low Stock Items (Full Width) */}
        <div className="bg-white rounded-lg shadow p-4">
          <h3 className="text-sm font-semibold text-gray-700 mb-3">Top Low Stock Items</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {(analytics.lowStockTop || []).length === 0 ? (
              <p className="text-sm text-gray-500 col-span-full text-center py-8">No low stock items in selected period.</p>
            ) : (
              analytics.lowStockTop.map((item) => (
                <div key={`${item.name}-${item.category?.name || item.category || 'unknown'}`} className="p-3 border rounded-lg bg-gray-50 hover:shadow-md transition-shadow">
                  <p className="font-medium text-gray-900 truncate">{item.name}</p>
                  <p className="text-xs text-gray-500 mt-1">{item.category?.name || item.category || 'N/A'}</p>
                  <p className="text-sm text-red-600 mt-2 font-semibold">Qty: {formatNumber(item.quantity)} <span className="text-gray-500 font-normal">(Reorder: {formatNumber(item.reorderPoint)})</span></p>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Stock actions directly under charts */}
        {/* Removed - buttons hidden */}
      </div>

      {/* AI + QR below stock actions */}
      <div className="mt-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <AIRecommendationsWidget />
        </div>
      </div>
    </div>
  );
};
