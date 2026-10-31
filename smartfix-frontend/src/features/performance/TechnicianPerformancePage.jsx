import React, { useState, useEffect } from 'react';
import {
  Trophy, TrendingUp, Clock, CheckCircle, XCircle,
  Users, Star, BarChart2, Award, RefreshCw, X,
  AlertCircle, ThumbsUp, Wrench, ChevronUp, ChevronDown,
  Database, Trash2
} from 'lucide-react';
import toast from 'react-hot-toast';
import { PageHeader } from '../../shared/components/Common/PageHeader';
import { LoadingState } from '../../shared/components/Common/LoadingState';

/**
 * Enhanced Technician Performance Dashboard (Admin View)
 * - KPI summary cards
 * - Visual leaderboard with progress bars & star ratings
 * - Technician detail modal
 * - Device type performance grid
 */
export const TechnicianPerformancePage = () => {
  const [dashboard, setDashboard] = useState(null);
  const [loading, setLoading] = useState(true);
  const [seeding, setSeeding] = useState(false);
  const [selectedTech, setSelectedTech] = useState(null);
  const [sortField, setSortField] = useState('rank');
  const [sortDir, setSortDir] = useState('asc');

  const API_BASE = process.env.REACT_APP_SYSTEM_BACKEND_URL || 'http://localhost:8080';

  useEffect(() => { loadDashboard(); }, []);

  const loadDashboard = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/performance/dashboard`);
      if (!res.ok) throw new Error('Failed to load dashboard');
      setDashboard(await res.json());
    } catch (err) {
      console.error(err);
      toast.error('Failed to load performance dashboard');
    } finally {
      setLoading(false);
    }
  };

  const handleSeed = async () => {
    setSeeding(true);
    try {
      const res = await fetch(`${API_BASE}/api/performance/seed-demo-data`, { method: 'POST' });
      const data = await res.json();
      if (data.status === 'success') {
        toast.success(data.message);
        await loadDashboard();
      } else if (data.status === 'skipped') {
        toast(data.message, { icon: 'ℹ️' });
      } else {
        toast.error(data.message || 'Seed failed');
      }
    } catch (err) {
      toast.error('Failed to seed data: ' + err.message);
    } finally {
      setSeeding(false);
    }
  };

  const handleClear = async () => {
    if (!window.confirm('Clear ALL repair case data? This cannot be undone.')) return;
    setSeeding(true);
    try {
      const res = await fetch(`${API_BASE}/api/performance/clear-demo-data`, { method: 'DELETE' });
      const data = await res.json();
      toast.success(data.message);
      await loadDashboard();
    } catch (err) {
      toast.error('Failed to clear data: ' + err.message);
    } finally {
      setSeeding(false);
    }
  };

  /* ─── helpers ─── */
  const getBadge = (level) => ({
    EXCELLENT:        { bg: 'bg-emerald-100', text: 'text-emerald-800', border: 'border-emerald-300', icon: '🏆', label: 'Excellent' },
    GOOD:             { bg: 'bg-blue-100',    text: 'text-blue-800',    border: 'border-blue-300',    icon: '⭐', label: 'Good' },
    AVERAGE:          { bg: 'bg-yellow-100',  text: 'text-yellow-800',  border: 'border-yellow-300',  icon: '👍', label: 'Average' },
    NEEDS_IMPROVEMENT:{ bg: 'bg-red-100',     text: 'text-red-800',     border: 'border-red-300',     icon: '📈', label: 'Needs Improvement' },
  }[level] || { bg: 'bg-gray-100', text: 'text-gray-700', border: 'border-gray-300', icon: '❓', label: level });

  const getRankEmoji = (r) => r === 1 ? '🥇' : r === 2 ? '🥈' : r === 3 ? '🥉' : `#${r}`;

  const getBarColor = (pct) =>
    pct >= 90 ? 'bg-emerald-500' : pct >= 75 ? 'bg-blue-500' : pct >= 60 ? 'bg-yellow-400' : 'bg-red-400';

  const stars = (pct) => {
    const filled = Math.round((pct / 100) * 5);
    return Array.from({ length: 5 }, (_, i) => (
      <Star key={i} className={`w-3.5 h-3.5 ${i < filled ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'}`} />
    ));
  };

  const handleSort = (field) => {
    if (sortField === field) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortField(field); setSortDir('desc'); }
  };

  const SortIcon = ({ field }) => sortField === field
    ? (sortDir === 'asc' ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />)
    : <ChevronDown className="w-3 h-3 text-gray-300" />;

  /* ─── loading / error ─── */
  if (loading) return <LoadingState message="Loading performance dashboard..." />;
  if (!dashboard) return (
    <div className="p-6">
      <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-800">
        Failed to load dashboard data.
        <button onClick={loadDashboard} className="ml-3 underline text-red-600">Retry</button>
      </div>
    </div>
  );

  const { overallStats, technicianLeaderboard = [], repairTrends = [], deviceTypeStats = [] } = dashboard;

  /* sorted leaderboard */
  const sorted = [...technicianLeaderboard].sort((a, b) => {
    const mul = sortDir === 'asc' ? 1 : -1;
    return (a[sortField] > b[sortField] ? 1 : -1) * mul;
  });

  /* ─── KPI cards ─── */
  const kpis = [
    { label: 'Total Repairs', value: overallStats.totalRepairsCompleted, sub: `${overallStats.repairsCompletedThisMonth} this month`, icon: CheckCircle, color: 'blue' },
    { label: 'Success Rate', value: `${overallStats.overallSuccessRate}%`, sub: 'Across all technicians', icon: TrendingUp, color: 'emerald' },
    { label: 'Customer Satisfaction', value: `${overallStats.overallCustomerSatisfactionRate}%`, sub: 'Satisfied customers', icon: ThumbsUp, color: 'purple' },
    { label: 'Avg Repair Time', value: `${overallStats.averageRepairTimeMinutes}m`, sub: 'Per repair job', icon: Clock, color: 'orange' },
  ];

  const colorMap = {
    blue:    { bg: 'bg-blue-50',    text: 'text-blue-600',    bar: 'bg-blue-500'    },
    emerald: { bg: 'bg-emerald-50', text: 'text-emerald-600', bar: 'bg-emerald-500' },
    purple:  { bg: 'bg-purple-50',  text: 'text-purple-600',  bar: 'bg-purple-500'  },
    orange:  { bg: 'bg-orange-50',  text: 'text-orange-600',  bar: 'bg-orange-500'  },
  };

  /* ─── render ─── */
  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="flex items-center justify-between mb-6">
        <PageHeader
          title="📊 Technician Performance"
          subtitle="Admin view — track success rates, rankings and repair times"
        />
      <div className="flex items-center gap-2">
        <button
          onClick={loadDashboard}
          className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-lg text-sm text-gray-600 hover:bg-gray-50 shadow-sm transition"
        >
          <RefreshCw className="w-4 h-4" /> Refresh
        </button>
      </div>
      </div>

      {/* ── KPI Cards ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {kpis.map(kpi => {
          const c = colorMap[kpi.color];
          return (
            <div key={kpi.label} className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">{kpi.label}</p>
                <div className={`w-8 h-8 rounded-lg ${c.bg} flex items-center justify-center`}>
                  <kpi.icon className={`w-4 h-4 ${c.text}`} />
                </div>
              </div>
              <p className={`text-3xl font-extrabold ${c.text}`}>{kpi.value}</p>
              <p className="text-xs text-gray-400">{kpi.sub}</p>
            </div>
          );
        })}
      </div>

        {/* Empty state */}
        {technicianLeaderboard.length === 0 && (
          <div className="bg-white rounded-2xl shadow-sm border-2 border-dashed border-indigo-200 mb-8 p-10 text-center">
            <div className="w-16 h-16 bg-indigo-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Database className="w-8 h-8 text-indigo-500" />
            </div>
            <h3 className="text-lg font-bold text-gray-900 mb-2">No Performance Data Yet</h3>
            <p className="text-gray-500 text-sm">The dashboard is empty because no repair cases have been completed yet.</p>
          </div>
        )}

      {/* ── Leaderboard ── */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 mb-8 overflow-hidden">
        <div className="bg-gradient-to-r from-indigo-600 to-purple-600 px-6 py-5 flex items-center gap-3">
          <Trophy className="w-7 h-7 text-white" />
          <div>
            <h2 className="text-lg font-bold text-white">🏆 Technician Leaderboard</h2>
            <p className="text-indigo-200 text-xs">Click a row to see full details</p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                {[
                  { label: 'Rank', field: 'rank' },
                  { label: 'Technician', field: 'technicianName' },
                  { label: 'Total Repairs', field: 'totalRepairs' },
                  { label: 'Success Rate', field: 'successRate' },
                  { label: 'Satisfaction', field: 'customerSatisfactionRate' },
                  { label: 'Avg Time', field: 'averageRepairTimeMinutes' },
                  { label: 'This Month', field: 'repairsThisMonth' },
                  { label: 'Level', field: 'performanceLevel' },
                ].map(col => (
                  <th
                    key={col.field}
                    onClick={() => handleSort(col.field)}
                    className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wide cursor-pointer hover:text-gray-900 select-none"
                  >
                    <span className="flex items-center gap-1">{col.label} <SortIcon field={col.field} /></span>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {sorted.map((tech) => {
                const badge = getBadge(tech.performanceLevel);
                const isTop3 = tech.rank <= 3;
                return (
                  <tr
                    key={tech.technicianId}
                    onClick={() => setSelectedTech(tech)}
                    className={`cursor-pointer transition-colors hover:bg-indigo-50 ${isTop3 ? 'bg-yellow-50' : ''}`}
                  >
                    {/* Rank */}
                    <td className="px-4 py-3 text-xl">{getRankEmoji(tech.rank)}</td>

                    {/* Name */}
                    <td className="px-4 py-3">
                      <p className="font-semibold text-gray-900">{tech.technicianName}</p>
                      <p className="text-xs text-gray-400">ID: {tech.technicianId}</p>
                    </td>

                    {/* Total repairs */}
                    <td className="px-4 py-3">
                      <p className="font-bold text-gray-800">{tech.totalRepairs}</p>
                      <p className="text-xs text-gray-400">{tech.successfulRepairs} successful</p>
                    </td>

                    {/* Success rate bar */}
                    <td className="px-4 py-3 min-w-[140px]">
                      <div className="flex items-center gap-2">
                        <div className="flex-1 bg-gray-200 rounded-full h-2">
                          <div
                            className={`h-2 rounded-full ${getBarColor(tech.successRate)}`}
                            style={{ width: `${tech.successRate}%` }}
                          />
                        </div>
                        <span className={`text-xs font-bold w-9 text-right ${
                          tech.successRate >= 90 ? 'text-emerald-600' :
                          tech.successRate >= 75 ? 'text-blue-600' :
                          tech.successRate >= 60 ? 'text-yellow-600' : 'text-red-500'
                        }`}>{tech.successRate}%</span>
                      </div>
                    </td>

                    {/* Customer satisfaction — stars */}
                    <td className="px-4 py-3">
                      <div className="flex gap-0.5 mb-0.5">{stars(tech.customerSatisfactionRate)}</div>
                      <p className="text-xs text-gray-500">{tech.customerSatisfactionRate}% ({tech.customerSatisfiedCount}/{tech.totalRepairs})</p>
                    </td>

                    {/* Avg time */}
                    <td className="px-4 py-3">
                      <span className="font-semibold text-gray-700">{tech.averageRepairTimeMinutes}m</span>
                    </td>

                    {/* This month */}
                    <td className="px-4 py-3">
                      <span className="font-bold text-gray-800">{tech.repairsThisMonth}</span>
                      <p className="text-xs text-gray-400">{tech.repairsThisWeek} this week</p>
                    </td>

                    {/* Badge */}
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold border ${badge.bg} ${badge.text} ${badge.border}`}>
                        {badge.icon} {badge.label}
                      </span>
                    </td>
                  </tr>
                );
              })}

              {technicianLeaderboard.length === 0 && (
                <tr><td colSpan={8} className="text-center py-12 text-gray-400">
                  No technician data yet. Complete repairs to see metrics.
                </td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── Device Type Grid ── */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 mb-8 overflow-hidden">
        <div className="bg-gradient-to-r from-teal-600 to-green-600 px-6 py-5">
          <h2 className="text-lg font-bold text-white">📱 Device Type Performance</h2>
          <p className="text-teal-100 text-xs">Success rates per device category</p>
        </div>
        <div className="p-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {deviceTypeStats.map(device => (
            <div key={device.deviceType} className="border border-gray-200 rounded-xl p-4 hover:shadow-md transition-shadow">
              <div className="flex items-center gap-2 mb-3">
                <Wrench className="w-4 h-4 text-teal-500" />
                <h3 className="font-semibold text-gray-900 text-sm">{device.deviceType}</h3>
              </div>
              <div className="space-y-3">
                <div>
                  <div className="flex justify-between text-xs text-gray-500 mb-1">
                    <span>Success Rate</span>
                    <span className={`font-bold ${device.successRate >= 80 ? 'text-emerald-600' : 'text-yellow-600'}`}>
                      {device.successRate}%
                    </span>
                  </div>
                  <div className="w-full bg-gray-100 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full ${device.successRate >= 80 ? 'bg-emerald-500' : 'bg-yellow-400'}`}
                      style={{ width: `${device.successRate}%` }}
                    />
                  </div>
                </div>
                <div className="flex justify-between text-xs text-gray-500">
                  <span>Total Repairs</span>
                  <span className="font-semibold text-gray-800">{device.totalRepairs}</span>
                </div>
                <div className="flex justify-between text-xs text-gray-500">
                  <span>Avg Repair Time</span>
                  <span className="font-semibold text-gray-800">{device.averageRepairTimeMinutes}m</span>
                </div>
              </div>
            </div>
          ))}
          {deviceTypeStats.length === 0 && (
            <div className="col-span-3 text-center py-10 text-gray-400">No device data available yet.</div>
          )}
        </div>
      </div>

      {/* ── Info Banner ── */}
      <div className="bg-indigo-50 border border-indigo-200 rounded-xl p-5 text-sm text-indigo-800 space-y-1">
        <p className="font-semibold text-indigo-900 mb-2">💡 How Performance is Calculated</p>
        <p>• <strong>Success Rate:</strong> Repairs marked "SUCCESS" ÷ total repairs</p>
        <p>• <strong>Customer Satisfaction:</strong> Customers not returning with same fault</p>
        <p>• <strong>Performance Level:</strong> Average of success rate + satisfaction score</p>
        <p>• <strong>Leaderboard Rank:</strong> Sorted by success rate, then total repairs</p>
      </div>

      {/* ── Detail Modal ── */}
      {selectedTech && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
          onClick={() => setSelectedTech(null)}
        >
          <div
            className="bg-white rounded-2xl shadow-2xl w-full max-w-lg p-6 relative"
            onClick={e => e.stopPropagation()}
          >
            <button
              onClick={() => setSelectedTech(null)}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Header */}
            <div className="flex items-center gap-4 mb-6">
              <div className="w-14 h-14 rounded-full bg-indigo-100 flex items-center justify-center text-2xl font-bold text-indigo-600">
                {selectedTech.technicianName?.charAt(0)}
              </div>
              <div>
                <h3 className="text-xl font-bold text-gray-900">{selectedTech.technicianName}</h3>
                <p className="text-sm text-gray-500">Technician ID: {selectedTech.technicianId}</p>
                <span className={`inline-flex items-center gap-1 mt-1 px-2.5 py-0.5 rounded-full text-xs font-semibold border ${getBadge(selectedTech.performanceLevel).bg} ${getBadge(selectedTech.performanceLevel).text} ${getBadge(selectedTech.performanceLevel).border}`}>
                  {getBadge(selectedTech.performanceLevel).icon} {getBadge(selectedTech.performanceLevel).label}
                </span>
              </div>
              <div className="ml-auto text-3xl">{getRankEmoji(selectedTech.rank)}</div>
            </div>

            {/* Metrics */}
            <div className="grid grid-cols-2 gap-4 mb-6">
              {[
                { label: 'Total Repairs', value: selectedTech.totalRepairs, sub: `${selectedTech.successfulRepairs} successful` },
                { label: 'This Month', value: selectedTech.repairsThisMonth, sub: `${selectedTech.repairsThisWeek} this week` },
                { label: 'Avg Repair Time', value: `${selectedTech.averageRepairTimeMinutes}m`, sub: 'per job' },
                { label: 'Satisfied Customers', value: `${selectedTech.customerSatisfiedCount}/${selectedTech.totalRepairs}`, sub: `${selectedTech.customerSatisfactionRate}% satisfaction` },
              ].map(m => (
                <div key={m.label} className="bg-gray-50 rounded-xl p-4">
                  <p className="text-xs text-gray-500 mb-1">{m.label}</p>
                  <p className="text-2xl font-bold text-gray-900">{m.value}</p>
                  <p className="text-xs text-gray-400">{m.sub}</p>
                </div>
              ))}
            </div>

            {/* Progress bars */}
            <div className="space-y-4">
              {[
                { label: 'Success Rate', value: selectedTech.successRate },
                { label: 'Customer Satisfaction', value: selectedTech.customerSatisfactionRate },
              ].map(bar => (
                <div key={bar.label}>
                  <div className="flex justify-between text-xs text-gray-500 mb-1">
                    <span>{bar.label}</span>
                    <span className="font-bold text-gray-700">{bar.value}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-3">
                    <div
                      className={`h-3 rounded-full transition-all duration-500 ${getBarColor(bar.value)}`}
                      style={{ width: `${bar.value}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
