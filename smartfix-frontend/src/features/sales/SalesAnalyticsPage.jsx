// src/features/sales/SalesAnalyticsPage.jsx
import React, { useEffect, useState, useMemo } from 'react';
import {
  DollarSign, TrendingUp, ShoppingCart, Users, ArrowUpRight,
  ArrowDownRight, Package, Calendar, Filter
} from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend, AreaChart, Area, LineChart, Line
} from 'recharts';
import { PageHeader } from '../../shared/components/Common/PageHeader';
import { LoadingState } from '../../shared/components/Common/LoadingState';

const SYSTEM_BACKEND_BASE_URL = process.env.REACT_APP_SYSTEM_BACKEND_URL || 'http://localhost:8080';
const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#14b8a6', '#f97316'];

export const SalesAnalyticsPage = () => {
  const [sales, setSales] = useState([]);
  const [inventory, setInventory] = useState([]);
  const [repairTasks, setRepairTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState('30'); // days

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [salesRes, inventoryRes, repairRes] = await Promise.all([
          fetch(`${SYSTEM_BACKEND_BASE_URL}/api/sales`),
          fetch(`${SYSTEM_BACKEND_BASE_URL}/api/inventory`),
          fetch(`${SYSTEM_BACKEND_BASE_URL}/api/repair-tasks`)
        ]);
        if (salesRes.ok) setSales(await salesRes.json());
        if (inventoryRes.ok) setInventory(await inventoryRes.json());
        if (repairRes.ok) setRepairTasks(await repairRes.json());
      } catch {
        // silent
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  // Filter sales by date range
  const filteredSales = useMemo(() => {
    const now = new Date();
    const cutoff = new Date();
    cutoff.setDate(now.getDate() - parseInt(dateRange));
    return sales.filter(s => {
      if (!s.createdAt) return false;
      return new Date(s.createdAt) >= cutoff;
    });
  }, [sales, dateRange]);

  // Key metrics
  const todayStr = new Date().toISOString().split('T')[0];
  const todaySales = sales.filter(s => s.createdAt && s.createdAt.substring(0, 10) === todayStr);
  const todayRevenue = todaySales.reduce((sum, s) => sum + Number(s.total || 0), 0);

  const yesterdayStr = (() => { const d = new Date(); d.setDate(d.getDate() - 1); return d.toISOString().split('T')[0]; })();
  const yesterdaySales = sales.filter(s => s.createdAt && s.createdAt.substring(0, 10) === yesterdayStr);
  const yesterdayRevenue = yesterdaySales.reduce((sum, s) => sum + Number(s.total || 0), 0);

  const totalRevenue = filteredSales.reduce((sum, s) => sum + Number(s.total || 0), 0);
  const avgOrderValue = filteredSales.length > 0 ? totalRevenue / filteredSales.length : 0;
  const revenueChange = yesterdayRevenue > 0 ? ((todayRevenue - yesterdayRevenue) / yesterdayRevenue * 100) : 0;

  // Daily revenue chart
  const dailyRevenueData = useMemo(() => {
    const days = Math.min(parseInt(dateRange), 30);
    const result = [];
    for (let i = days - 1; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().split('T')[0];
      const label = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      const daySales = sales.filter(s => s.createdAt && s.createdAt.substring(0, 10) === dateStr);
      const revenue = daySales.reduce((sum, s) => sum + Number(s.total || 0), 0);
      result.push({ name: label, revenue: Math.round(revenue * 100) / 100, orders: daySales.length });
    }
    return result;
  }, [sales, dateRange]);

  // Monthly trend (6 months)
  const monthlyTrend = useMemo(() => {
    const months = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date();
      d.setMonth(d.getMonth() - i);
      const monthKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      const label = d.toLocaleDateString('en-US', { month: 'short', year: '2-digit' });
      const monthSales = sales.filter(s => s.createdAt && s.createdAt.substring(0, 7) === monthKey);
      const revenue = monthSales.reduce((sum, s) => sum + Number(s.total || 0), 0);
      months.push({ name: label, revenue: Math.round(revenue * 100) / 100, orders: monthSales.length });
    }
    return months;
  }, [sales]);

  // Sales by category
  const categoryData = useMemo(() => {
    const map = {};
    filteredSales.forEach(s => {
      const items = s.items || [];
      items.forEach(item => {
        const cat = item.inventoryItem?.category?.name || item.category?.name || item.category || 'Other';
        if (!map[cat]) map[cat] = { revenue: 0, count: 0 };
        map[cat].revenue += Number(item.unitPrice || item.price || 0) * Number(item.quantity || 1);
        map[cat].count += Number(item.quantity || 1);
      });
    });
    return Object.entries(map)
      .map(([name, data]) => ({ name, value: Math.round(data.revenue * 100) / 100, count: data.count }))
      .sort((a, b) => b.value - a.value);
  }, [filteredSales]);

  // Top selling products
  const topProducts = useMemo(() => {
    const map = {};
    filteredSales.forEach(s => {
      const items = s.items || [];
      items.forEach(item => {
        const name = item.inventoryItem?.name || item.name || item.productName || 'Unknown';
        if (!map[name]) map[name] = { revenue: 0, quantity: 0 };
        map[name].revenue += Number(item.unitPrice || item.price || 0) * Number(item.quantity || 1);
        map[name].quantity += Number(item.quantity || 1);
      });
    });
    return Object.entries(map)
      .map(([name, data]) => ({ name, revenue: Math.round(data.revenue * 100) / 100, quantity: data.quantity }))
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 8);
  }, [filteredSales]);

  // Hourly distribution (today)
  const hourlyData = useMemo(() => {
    const hours = Array.from({ length: 24 }, (_, i) => ({
      name: `${String(i).padStart(2, '0')}:00`,
      sales: 0, revenue: 0
    }));
    todaySales.forEach(s => {
      const hour = new Date(s.createdAt).getHours();
      hours[hour].sales++;
      hours[hour].revenue += Number(s.total || 0);
    });
    // Only return business hours (7am-9pm)
    return hours.slice(7, 22);
  }, [todaySales]);

  // Repair revenue
  const completedRepairs = repairTasks.filter(t => t.status === 'COMPLETED');
  const repairRevenue = completedRepairs.reduce((sum, t) => sum + Number(t.totalCost || t.estimatedCost || 0), 0);

  if (loading) {
    return (
      <div className="p-6 bg-gray-50 min-h-screen">
        <LoadingState message="Loading sales analytics..." />
      </div>
    );
  }

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="flex items-center justify-between mb-6">
        <PageHeader
          title="Sales Analytics"
          subtitle="Revenue insights, trends, and performance metrics"
        />
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-gray-400" />
          <select
            value={dateRange}
            onChange={e => setDateRange(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
          >
            <option value="7">Last 7 days</option>
            <option value="14">Last 14 days</option>
            <option value="30">Last 30 days</option>
            <option value="90">Last 90 days</option>
            <option value="365">Last year</option>
          </select>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-gray-500 uppercase">Today's Revenue</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">${todayRevenue.toFixed(2)}</p>
              <div className="flex items-center gap-1 mt-1">
                {revenueChange >= 0 ? (
                  <ArrowUpRight className="w-3 h-3 text-green-500" />
                ) : (
                  <ArrowDownRight className="w-3 h-3 text-red-500" />
                )}
                <span className={`text-xs font-medium ${revenueChange >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {Math.abs(revenueChange).toFixed(1)}% vs yesterday
                </span>
              </div>
            </div>
            <div className="w-12 h-12 rounded-xl bg-green-50 flex items-center justify-center">
              <DollarSign className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-gray-500 uppercase">Period Revenue</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">${totalRevenue.toFixed(2)}</p>
              <p className="text-xs text-gray-400 mt-1">{filteredSales.length} transactions</p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-blue-50 flex items-center justify-center">
              <TrendingUp className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-gray-500 uppercase">Avg Order Value</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">${avgOrderValue.toFixed(2)}</p>
              <p className="text-xs text-gray-400 mt-1">Per transaction</p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-purple-50 flex items-center justify-center">
              <ShoppingCart className="w-6 h-6 text-purple-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-gray-500 uppercase">Repair Revenue</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">${repairRevenue.toFixed(2)}</p>
              <p className="text-xs text-gray-400 mt-1">{completedRepairs.length} completed</p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-orange-50 flex items-center justify-center">
              <Package className="w-6 h-6 text-orange-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Revenue Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Daily Revenue */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
          <h3 className="text-sm font-bold text-gray-700 uppercase mb-4 flex items-center gap-2">
            <Calendar className="w-4 h-4" /> Daily Revenue
          </h3>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={dailyRevenueData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="name" tick={{ fontSize: 11 }} interval={Math.max(0, Math.floor(dailyRevenueData.length / 8))} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip
                formatter={(value, name) => [
                  name === 'revenue' ? `$${value.toFixed(2)}` : value,
                  name === 'revenue' ? 'Revenue' : 'Orders'
                ]}
                contentStyle={{ borderRadius: '8px', border: '1px solid #e5e7eb' }}
              />
              <Bar dataKey="revenue" fill="#3b82f6" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Monthly Trend */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
          <h3 className="text-sm font-bold text-gray-700 uppercase mb-4 flex items-center gap-2">
            <TrendingUp className="w-4 h-4" /> Monthly Revenue Trend
          </h3>
          <ResponsiveContainer width="100%" height={280}>
            <AreaChart data={monthlyTrend}>
              <defs>
                <linearGradient id="salesGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="name" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip
                formatter={(value, name) => [
                  name === 'revenue' ? `$${value.toFixed(2)}` : value,
                  name === 'revenue' ? 'Revenue' : 'Orders'
                ]}
                contentStyle={{ borderRadius: '8px', border: '1px solid #e5e7eb' }}
              />
              <Area type="monotone" dataKey="revenue" stroke="#3b82f6" strokeWidth={2} fillOpacity={1} fill="url(#salesGradient)" />
              <Line type="monotone" dataKey="orders" stroke="#10b981" strokeWidth={2} dot={{ r: 3 }} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Category & Top Products */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Revenue by Category */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
          <h3 className="text-sm font-bold text-gray-700 uppercase mb-4">Revenue by Category</h3>
          {categoryData.length > 0 ? (
            <ResponsiveContainer width="100%" height={280}>
              <PieChart>
                <Pie
                  data={categoryData}
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={95}
                  paddingAngle={3}
                  dataKey="value"
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                >
                  {categoryData.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => [`$${value.toFixed(2)}`, 'Revenue']} />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-sm text-gray-400 text-center py-16">No category data available</p>
          )}
        </div>

        {/* Top Selling Products */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
          <h3 className="text-sm font-bold text-gray-700 uppercase mb-4">Top Selling Products</h3>
          {topProducts.length > 0 ? (
            <div className="space-y-3">
              {topProducts.map((product, i) => {
                const maxRevenue = topProducts[0]?.revenue || 1;
                const pct = (product.revenue / maxRevenue) * 100;
                return (
                  <div key={product.name} className="flex items-center gap-3">
                    <span className="w-6 text-xs font-bold text-gray-400 text-right">#{i + 1}</span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <p className="text-sm font-medium text-gray-900 truncate">{product.name}</p>
                        <span className="text-sm font-bold text-gray-700 ml-2">${product.revenue.toFixed(2)}</span>
                      </div>
                      <div className="w-full bg-gray-100 rounded-full h-2">
                        <div
                          className="h-2 rounded-full transition-all duration-500"
                          style={{ width: `${pct}%`, backgroundColor: COLORS[i % COLORS.length] }}
                        />
                      </div>
                      <p className="text-xs text-gray-400 mt-0.5">{product.quantity} units sold</p>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-sm text-gray-400 text-center py-16">No product data available</p>
          )}
        </div>
      </div>

      {/* Hourly Sales + Recent Transactions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Today's Hourly Distribution */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
          <h3 className="text-sm font-bold text-gray-700 uppercase mb-4">Today's Sales by Hour</h3>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={hourlyData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="name" tick={{ fontSize: 10 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip
                formatter={(value, name) => [
                  name === 'revenue' ? `$${Number(value).toFixed(2)}` : value,
                  name === 'revenue' ? 'Revenue' : 'Sales'
                ]}
                contentStyle={{ borderRadius: '8px', border: '1px solid #e5e7eb' }}
              />
              <Bar dataKey="sales" fill="#8b5cf6" radius={[3, 3, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Recent Transactions Table */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
          <h3 className="text-sm font-bold text-gray-700 uppercase mb-4">Recent Transactions</h3>
          <div className="overflow-y-auto max-h-[260px]">
            <table className="min-w-full">
              <thead className="bg-gray-50 sticky top-0">
                <tr>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Ref</th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Items</th>
                  <th className="px-3 py-2 text-right text-xs font-medium text-gray-500 uppercase">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {sales.slice(-10).reverse().map((sale, i) => (
                  <tr key={sale.id || i} className="hover:bg-gray-50">
                    <td className="px-3 py-2 text-xs text-gray-600 whitespace-nowrap">
                      {sale.createdAt ? new Date(sale.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : '-'}
                    </td>
                    <td className="px-3 py-2 text-xs font-mono text-gray-500">
                      {sale.customerRef || sale.id || '-'}
                    </td>
                    <td className="px-3 py-2 text-xs text-gray-700">
                      {(sale.items || []).length} item{(sale.items || []).length !== 1 ? 's' : ''}
                    </td>
                    <td className="px-3 py-2 text-xs font-semibold text-gray-900 text-right">
                      ${Number(sale.total || 0).toFixed(2)}
                    </td>
                  </tr>
                ))}
                {sales.length === 0 && (
                  <tr>
                    <td colSpan={4} className="px-3 py-8 text-center text-sm text-gray-400">No transactions yet</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};
