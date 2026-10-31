// src/features/dashboard/components/SalesDashboard.jsx
import React, { useEffect, useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { DollarSign, TrendingUp, ShoppingCart, Package, Wrench, ShieldCheck, Users } from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend, AreaChart, Area
} from 'recharts';
import { formatCurrency } from '../../../shared/utils/formatters';

const SYSTEM_BACKEND_BASE_URL = process.env.REACT_APP_SYSTEM_BACKEND_URL || 'http://localhost:8080';

const CHART_COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

export const SalesDashboard = ({ stats }) => {
  const [sales, setSales] = useState([]);
  const [repairTasks, setRepairTasks] = useState([]);
  const [warranties, setWarranties] = useState([]);
  const [categoryData, setCategoryData] = useState({});

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [salesRes, repairRes, warrantyRes, reportRes] = await Promise.all([
          fetch(`${SYSTEM_BACKEND_BASE_URL}/api/sales`),
          fetch(`${SYSTEM_BACKEND_BASE_URL}/api/repair-tasks`),
          fetch(`${SYSTEM_BACKEND_BASE_URL}/api/warranties`),
          fetch(`${SYSTEM_BACKEND_BASE_URL}/api/reports/summary`)
        ]);
        if (salesRes.ok) setSales(await salesRes.json());
        if (repairRes.ok) setRepairTasks(await repairRes.json());
        if (warrantyRes.ok) setWarranties(await warrantyRes.json());
        if (reportRes.ok) {
          const report = await reportRes.json();
          setCategoryData(report.categoryDistribution || {});
        }
      } catch {
        // silent
      }
    };
    fetchData();
  }, []);

  // Weekly sales chart data (last 7 days)
  const weeklySalesData = useMemo(() => {
    const days = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().split('T')[0];
      const label = d.toLocaleDateString('en-US', { weekday: 'short' });
      const daySales = sales.filter((s) => {
        if (!s.createdAt) return false;
        return s.createdAt.substring(0, 10) === dateStr;
      });
      const revenue = daySales.reduce((sum, s) => sum + Number(s.total || 0), 0);
      days.push({ name: label, revenue: Math.round(revenue * 100) / 100, orders: daySales.length });
    }
    return days;
  }, [sales]);

  // Category distribution for pie chart
  const categoryChartData = useMemo(() => {
    return Object.entries(categoryData).map(([name, value]) => ({ name, value: Number(value) }));
  }, [categoryData]);

  // Repair task status breakdown
  const repairStatusData = useMemo(() => {
    const counts = { PENDING: 0, ASSIGNED: 0, IN_PROGRESS: 0, COMPLETED: 0 };
    repairTasks.forEach((t) => {
      if (counts[t.status] !== undefined) counts[t.status]++;
    });
    return Object.entries(counts).map(([name, value]) => ({ name: name.replace('_', ' '), value }));
  }, [repairTasks]);

  // Monthly revenue trend (last 6 months)
  const monthlyTrend = useMemo(() => {
    const months = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date();
      d.setMonth(d.getMonth() - i);
      const monthKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      const label = d.toLocaleDateString('en-US', { month: 'short' });
      const monthSales = sales.filter((s) => s.createdAt && s.createdAt.substring(0, 7) === monthKey);
      const revenue = monthSales.reduce((sum, s) => sum + Number(s.total || 0), 0);
      months.push({ name: label, revenue: Math.round(revenue * 100) / 100, orders: monthSales.length });
    }
    return months;
  }, [sales]);

  const todayStr = new Date().toISOString().split('T')[0];
  const todaySales = sales.filter((s) => s.createdAt && s.createdAt.substring(0, 10) === todayStr);
  const todayRevenue = todaySales.reduce((sum, s) => sum + Number(s.total || 0), 0);
  const totalRevenue = sales.reduce((sum, s) => sum + Number(s.total || 0), 0);
  const activeWarranties = warranties.filter((w) => w.status === 'ACTIVE').length;
  const pendingRepairs = repairTasks.filter((t) => t.status === 'PENDING').length;

  const dailyTarget = stats?.dailyTarget || 1500;
  const progress = Math.min((todayRevenue / dailyTarget) * 100, 100);

  return (
    <div>
      {/* Stat cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-xl shadow p-5 border-l-4 border-green-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-gray-500 uppercase">Today's Revenue</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">{formatCurrency(todayRevenue)}</p>
              <p className="text-xs text-gray-400 mt-1">{todaySales.length} transaction{todaySales.length !== 1 ? 's' : ''}</p>
            </div>
            <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center">
              <DollarSign className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow p-5 border-l-4 border-green-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-gray-500 uppercase">Total Revenue</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">{formatCurrency(totalRevenue)}</p>
              <p className="text-xs text-gray-400 mt-1">{sales.length} total sales</p>
            </div>
            <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center">
              <TrendingUp className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow p-5 border-l-4 border-green-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-gray-500 uppercase">Pending Repairs</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">{pendingRepairs}</p>
              <p className="text-xs text-gray-400 mt-1">{repairTasks.length} total tasks</p>
            </div>
            <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center">
              <Wrench className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow p-5 border-l-4 border-green-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-gray-500 uppercase">Active Warranties</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">{activeWarranties}</p>
              <p className="text-xs text-gray-400 mt-1">{warranties.length} total</p>
            </div>
            <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center">
              <ShieldCheck className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Weekly sales bar chart */}
        <div className="bg-white rounded-xl shadow p-5">
          <h3 className="text-sm font-bold text-gray-700 uppercase mb-4">This Week's Sales</h3>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={weeklySalesData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="name" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip
                formatter={(value, name) => [
                  name === 'revenue' ? formatCurrency(value) : value,
                  name === 'revenue' ? 'Revenue' : 'Orders'
                ]}
              />
              <Bar dataKey="revenue" fill="#3b82f6" radius={[4, 4, 0, 0]} />
              <Bar dataKey="orders" fill="#10b981" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Monthly revenue trend */}
        <div className="bg-white rounded-xl shadow p-5">
          <h3 className="text-sm font-bold text-gray-700 uppercase mb-4">Revenue Trend (6 Months)</h3>
          <ResponsiveContainer width="100%" height={250}>
            <AreaChart data={monthlyTrend}>
              <defs>
                <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="name" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip formatter={(value) => [formatCurrency(value), 'Revenue']} />
              <Area type="monotone" dataKey="revenue" stroke="#3b82f6" fillOpacity={1} fill="url(#colorRevenue)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Category distribution pie */}
        <div className="bg-white rounded-xl shadow p-5">
          <h3 className="text-sm font-bold text-gray-700 uppercase mb-4">Inventory by Category</h3>
          {categoryChartData.length > 0 ? (
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={categoryChartData}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={90}
                  paddingAngle={3}
                  dataKey="value"
                >
                  {categoryChartData.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend wrapperStyle={{ fontSize: 12 }} />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-sm text-gray-400 text-center py-10">No inventory data</p>
          )}
        </div>

        {/* Repair tasks breakdown */}
        <div className="bg-white rounded-xl shadow p-5">
          <h3 className="text-sm font-bold text-gray-700 uppercase mb-4">Repair Tasks Status</h3>
          {repairTasks.length > 0 ? (
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={repairStatusData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis type="number" tick={{ fontSize: 12 }} />
                <YAxis dataKey="name" type="category" tick={{ fontSize: 11 }} width={90} />
                <Tooltip />
                <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                  {repairStatusData.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={['#eab308', '#3b82f6', '#f97316', '#22c55e'][index]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-sm text-gray-400 text-center py-10">No repair tasks yet</p>
          )}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
        <Link to="/sales" className="p-4 bg-green-600 text-white rounded-xl hover:bg-green-700 flex items-center justify-center gap-2 font-medium text-sm shadow">
          <ShoppingCart className="w-5 h-5" />
          New Sale
        </Link>
        <Link to="/sales-repairs" className="p-4 bg-green-600 text-white rounded-xl hover:bg-green-700 flex items-center justify-center gap-2 font-medium text-sm shadow">
          <Wrench className="w-5 h-5" />
          Repair Intake
        </Link>
        <Link to="/customers" className="p-4 bg-green-600 text-white rounded-xl hover:bg-green-700 flex items-center justify-center gap-2 font-medium text-sm shadow">
          <ShieldCheck className="w-5 h-5" />
          Warranties
        </Link>
        <Link to="/sales-history" className="p-4 bg-green-600 text-white rounded-xl hover:bg-green-700 flex items-center justify-center gap-2 font-medium text-sm shadow">
          <Package className="w-5 h-5" />
          Sales History
        </Link>
      </div>
    </div>
  );
};