// src/features/repair-tasks/RepairAnalyticsPage.jsx
import React, { useEffect, useState, useMemo } from 'react';
import {
  Wrench, Clock, CheckCircle2, AlertTriangle, Users,
  TrendingUp, ArrowUpRight, ArrowDownRight, Filter, Laptop, Smartphone, Monitor
} from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend, AreaChart, Area, LineChart, Line
} from 'recharts';
import { PageHeader } from '../../shared/components/Common/PageHeader';
import { LoadingState } from '../../shared/components/Common/LoadingState';

const SYSTEM_BACKEND_BASE_URL = process.env.REACT_APP_SYSTEM_BACKEND_URL || 'http://localhost:8080';
const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#14b8a6', '#f97316'];
const STATUS_COLORS = { PENDING: '#eab308', ASSIGNED: '#3b82f6', IN_PROGRESS: '#f97316', COMPLETED: '#22c55e' };

export const RepairAnalyticsPage = () => {
  const [repairTasks, setRepairTasks] = useState([]);
  const [technicians, setTechnicians] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState('30');

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [repairRes, techRes] = await Promise.all([
          fetch(`${SYSTEM_BACKEND_BASE_URL}/api/repair-tasks`),
          fetch(`${SYSTEM_BACKEND_BASE_URL}/api/technicians`)
        ]);
        if (repairRes.ok) setRepairTasks(await repairRes.json());
        if (techRes.ok) setTechnicians(await techRes.json());
      } catch {
        // silent
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  // Filter by date range
  const filtered = useMemo(() => {
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - parseInt(dateRange));
    return repairTasks.filter(t => {
      if (!t.createdAt) return false;
      return new Date(t.createdAt) >= cutoff;
    });
  }, [repairTasks, dateRange]);

  // KPI metrics
  const total = filtered.length;
  const pending = filtered.filter(t => t.status === 'PENDING').length;
  const inProgress = filtered.filter(t => t.status === 'IN_PROGRESS' || t.status === 'ASSIGNED').length;
  const completed = filtered.filter(t => t.status === 'COMPLETED').length;
  const completionRate = total > 0 ? ((completed / total) * 100) : 0;

  // Avg turnaround time (completed tasks only, createdAt → assignedAt delta as proxy)
  const avgTurnaround = useMemo(() => {
    const completedTasks = filtered.filter(t => t.status === 'COMPLETED' && t.createdAt);
    if (completedTasks.length === 0) return 0;
    const totalHours = completedTasks.reduce((sum, t) => {
      const created = new Date(t.createdAt);
      const assigned = t.assignedAt ? new Date(t.assignedAt) : created;
      const diff = Math.max(assigned - created, 0) / (1000 * 60 * 60);
      return sum + diff;
    }, 0);
    return Math.round(totalHours / completedTasks.length);
  }, [filtered]);

  // Status distribution pie chart
  const statusData = useMemo(() => {
    const counts = { PENDING: 0, ASSIGNED: 0, IN_PROGRESS: 0, COMPLETED: 0 };
    filtered.forEach(t => { if (counts[t.status] !== undefined) counts[t.status]++; });
    return Object.entries(counts).map(([name, value]) => ({
      name: name.replace('_', ' '),
      value,
      fill: STATUS_COLORS[name]
    }));
  }, [filtered]);

  // Daily repair volume (line chart)
  const dailyVolume = useMemo(() => {
    const days = Math.min(parseInt(dateRange), 30);
    const result = [];
    for (let i = days - 1; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().split('T')[0];
      const label = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      const created = repairTasks.filter(t => t.createdAt && t.createdAt.substring(0, 10) === dateStr).length;
      const done = repairTasks.filter(t => t.status === 'COMPLETED' && t.assignedAt && t.assignedAt.substring(0, 10) === dateStr).length;
      result.push({ name: label, created, completed: done });
    }
    return result;
  }, [repairTasks, dateRange]);

  // Monthly trend (6 months)
  const monthlyTrend = useMemo(() => {
    const months = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date();
      d.setMonth(d.getMonth() - i);
      const monthKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      const label = d.toLocaleDateString('en-US', { month: 'short', year: '2-digit' });
      const created = repairTasks.filter(t => t.createdAt && t.createdAt.substring(0, 7) === monthKey).length;
      const done = repairTasks.filter(t => t.status === 'COMPLETED' && t.createdAt && t.createdAt.substring(0, 7) === monthKey).length;
      months.push({ name: label, created, completed: done });
    }
    return months;
  }, [repairTasks]);

  // Device type breakdown
  const deviceTypeData = useMemo(() => {
    const map = {};
    filtered.forEach(t => {
      const type = (t.deviceType || 'Unknown').charAt(0).toUpperCase() + (t.deviceType || 'unknown').slice(1).toLowerCase();
      map[type] = (map[type] || 0) + 1;
    });
    return Object.entries(map)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);
  }, [filtered]);

  // Device model ranking (top 8)
  const topModels = useMemo(() => {
    const map = {};
    filtered.forEach(t => {
      const model = t.deviceModel || 'Unknown';
      map[model] = (map[model] || 0) + 1;
    });
    return Object.entries(map)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 8);
  }, [filtered]);

  // Technician workload
  const techWorkload = useMemo(() => {
    const map = {};
    filtered.forEach(t => {
      const tech = t.assignedTechnician?.fullName || t.assignedTechnician?.name || null;
      if (!tech) return;
      if (!map[tech]) map[tech] = { assigned: 0, completed: 0 };
      map[tech].assigned++;
      if (t.status === 'COMPLETED') map[tech].completed++;
    });
    return Object.entries(map)
      .map(([name, data]) => ({ name, ...data, rate: data.assigned > 0 ? Math.round((data.completed / data.assigned) * 100) : 0 }))
      .sort((a, b) => b.assigned - a.assigned);
  }, [filtered]);

  // Recent repairs table
  const recentRepairs = useMemo(() => {
    return [...repairTasks]
      .sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0))
      .slice(0, 10);
  }, [repairTasks]);

  const statusBadge = (status) => {
    const styles = {
      PENDING: 'bg-yellow-100 text-yellow-700',
      ASSIGNED: 'bg-blue-100 text-blue-700',
      IN_PROGRESS: 'bg-orange-100 text-orange-700',
      COMPLETED: 'bg-green-100 text-green-700'
    };
    return (
      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${styles[status] || 'bg-gray-100 text-gray-600'}`}>
        {(status || '').replace('_', ' ')}
      </span>
    );
  };

  if (loading) {
    return (
      <div className="p-6 bg-gray-50 min-h-screen">
        <LoadingState message="Loading repair analytics..." />
      </div>
    );
  }

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="flex items-center justify-between mb-6">
        <PageHeader
          title="Repair Analytics"
          subtitle="Repair workflow insights, technician performance, and device trends"
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
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-gray-500 uppercase">Total Repairs</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">{total}</p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center">
              <Wrench className="w-5 h-5 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-gray-500 uppercase">Pending</p>
              <p className="text-2xl font-bold text-yellow-600 mt-1">{pending}</p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-yellow-50 flex items-center justify-center">
              <Clock className="w-5 h-5 text-yellow-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-gray-500 uppercase">In Progress</p>
              <p className="text-2xl font-bold text-orange-600 mt-1">{inProgress}</p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-orange-50 flex items-center justify-center">
              <AlertTriangle className="w-5 h-5 text-orange-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-gray-500 uppercase">Completed</p>
              <p className="text-2xl font-bold text-green-600 mt-1">{completed}</p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-green-50 flex items-center justify-center">
              <CheckCircle2 className="w-5 h-5 text-green-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-gray-500 uppercase">Completion Rate</p>
              <p className="text-2xl font-bold text-indigo-600 mt-1">{completionRate.toFixed(1)}%</p>
              <p className="text-xs text-gray-400 mt-0.5">~{avgTurnaround}h avg turnaround</p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-indigo-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Charts Row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Daily Repair Volume */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
          <h3 className="text-sm font-bold text-gray-700 uppercase mb-4">Daily Repair Volume</h3>
          <ResponsiveContainer width="100%" height={280}>
            <AreaChart data={dailyVolume}>
              <defs>
                <linearGradient id="createdGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.2} />
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="completedGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#22c55e" stopOpacity={0.2} />
                  <stop offset="95%" stopColor="#22c55e" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="name" tick={{ fontSize: 11 }} interval={Math.max(0, Math.floor(dailyVolume.length / 8))} />
              <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
              <Tooltip contentStyle={{ borderRadius: '8px', border: '1px solid #e5e7eb' }} />
              <Area type="monotone" dataKey="created" name="Created" stroke="#3b82f6" strokeWidth={2} fill="url(#createdGrad)" />
              <Area type="monotone" dataKey="completed" name="Completed" stroke="#22c55e" strokeWidth={2} fill="url(#completedGrad)" />
              <Legend wrapperStyle={{ fontSize: 12 }} />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Monthly Trend */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
          <h3 className="text-sm font-bold text-gray-700 uppercase mb-4">Monthly Repair Trend</h3>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={monthlyTrend}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="name" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
              <Tooltip contentStyle={{ borderRadius: '8px', border: '1px solid #e5e7eb' }} />
              <Bar dataKey="created" name="Created" fill="#3b82f6" radius={[4, 4, 0, 0]} />
              <Bar dataKey="completed" name="Completed" fill="#22c55e" radius={[4, 4, 0, 0]} />
              <Legend wrapperStyle={{ fontSize: 12 }} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Charts Row 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        {/* Status Distribution */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
          <h3 className="text-sm font-bold text-gray-700 uppercase mb-4">Status Distribution</h3>
          {total > 0 ? (
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={statusData}
                  cx="50%"
                  cy="50%"
                  innerRadius={45}
                  outerRadius={85}
                  paddingAngle={3}
                  dataKey="value"
                >
                  {statusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend wrapperStyle={{ fontSize: 12 }} />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-sm text-gray-400 text-center py-16">No repair data</p>
          )}
        </div>

        {/* Device Type Breakdown */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
          <h3 className="text-sm font-bold text-gray-700 uppercase mb-4">By Device Type</h3>
          {deviceTypeData.length > 0 ? (
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={deviceTypeData}
                  cx="50%"
                  cy="50%"
                  innerRadius={45}
                  outerRadius={85}
                  paddingAngle={3}
                  dataKey="value"
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                >
                  {deviceTypeData.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-sm text-gray-400 text-center py-16">No device data</p>
          )}
        </div>

        {/* Top Device Models */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
          <h3 className="text-sm font-bold text-gray-700 uppercase mb-4">Top Device Models</h3>
          {topModels.length > 0 ? (
            <div className="space-y-3">
              {topModels.map((model, i) => {
                const maxVal = topModels[0]?.value || 1;
                const pct = (model.value / maxVal) * 100;
                return (
                  <div key={model.name} className="flex items-center gap-3">
                    <span className="w-5 text-xs font-bold text-gray-400 text-right">#{i + 1}</span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <p className="text-sm font-medium text-gray-900 truncate">{model.name}</p>
                        <span className="text-xs font-bold text-gray-600 ml-2">{model.value}</span>
                      </div>
                      <div className="w-full bg-gray-100 rounded-full h-1.5">
                        <div
                          className="h-1.5 rounded-full"
                          style={{ width: `${pct}%`, backgroundColor: COLORS[i % COLORS.length] }}
                        />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-sm text-gray-400 text-center py-16">No model data</p>
          )}
        </div>
      </div>

      {/* Technician Workload + Recent Repairs */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Technician Performance */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
          <h3 className="text-sm font-bold text-gray-700 uppercase mb-4 flex items-center gap-2">
            <Users className="w-4 h-4" /> Technician Performance
          </h3>
          {techWorkload.length > 0 ? (
            <div className="overflow-y-auto max-h-[300px]">
              <table className="min-w-full">
                <thead className="bg-gray-50 sticky top-0">
                  <tr>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Technician</th>
                    <th className="px-3 py-2 text-center text-xs font-medium text-gray-500 uppercase">Assigned</th>
                    <th className="px-3 py-2 text-center text-xs font-medium text-gray-500 uppercase">Completed</th>
                    <th className="px-3 py-2 text-center text-xs font-medium text-gray-500 uppercase">Rate</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {techWorkload.map(tech => (
                    <tr key={tech.name} className="hover:bg-gray-50">
                      <td className="px-3 py-2.5 text-sm font-medium text-gray-900">{tech.name}</td>
                      <td className="px-3 py-2.5 text-sm text-center text-gray-700">{tech.assigned}</td>
                      <td className="px-3 py-2.5 text-sm text-center text-green-600 font-medium">{tech.completed}</td>
                      <td className="px-3 py-2.5 text-center">
                        <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                          tech.rate >= 80 ? 'bg-green-100 text-green-700' :
                          tech.rate >= 50 ? 'bg-yellow-100 text-yellow-700' :
                          'bg-red-100 text-red-700'
                        }`}>
                          {tech.rate}%
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-sm text-gray-400 text-center py-16">No technician assignments yet</p>
          )}
        </div>

        {/* Recent Repairs */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
          <h3 className="text-sm font-bold text-gray-700 uppercase mb-4">Recent Repairs</h3>
          <div className="overflow-y-auto max-h-[300px]">
            <table className="min-w-full">
              <thead className="bg-gray-50 sticky top-0">
                <tr>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Device</th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {recentRepairs.map((task, i) => (
                  <tr key={task.id || i} className="hover:bg-gray-50">
                    <td className="px-3 py-2.5 text-xs text-gray-600 whitespace-nowrap">
                      {task.createdAt ? new Date(task.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : '-'}
                    </td>
                    <td className="px-3 py-2.5">
                      <p className="text-sm font-medium text-gray-900 truncate">{task.deviceModel || task.deviceType || 'Unknown'}</p>
                      <p className="text-xs text-gray-400">{task.customerName || task.customerRef || '-'}</p>
                    </td>
                    <td className="px-3 py-2.5">{statusBadge(task.status)}</td>
                  </tr>
                ))}
                {recentRepairs.length === 0 && (
                  <tr>
                    <td colSpan={3} className="px-3 py-8 text-center text-sm text-gray-400">No repairs yet</td>
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
