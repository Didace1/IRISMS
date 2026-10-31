// src/features/dashboard/components/AdminDashboard.jsx
import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Users, Package, DollarSign, TrendingUp, Shield,
  AlertTriangle, Wrench, UserCheck, ShoppingCart,
  ChevronRight, Clock, Trophy, Star, BarChart2
} from 'lucide-react';
import { useGetPendingUsersQuery } from '../../../features/auth/services/authApi';
import { formatCurrency } from '../../../shared/utils/formatters';

export const AdminDashboard = ({ stats }) => {
  const navigate = useNavigate();
  const { data: pendingUsers = [] } = useGetPendingUsersQuery();
  const pendingCount = pendingUsers.length;

  const statCards = [
    {
      label: 'Active Users', value: stats.activeUsers ?? 0,
      icon: Users, textColor: 'text-purple-600', bg: 'bg-purple-50', border: 'border-purple-200'
    },
    {
      label: 'Revenue Today', value: formatCurrency(stats.revenueToday ?? 0),
      icon: DollarSign, textColor: 'text-blue-600', bg: 'bg-blue-50', border: 'border-blue-200'
    },
    {
      label: 'Monthly Revenue', value: formatCurrency(stats.monthlyRevenue ?? 0),
      icon: TrendingUp, textColor: 'text-indigo-600', bg: 'bg-indigo-50', border: 'border-indigo-200'
    },
    {
      label: 'Inventory Items', value: stats.totalParts ?? 0,
      icon: Package, textColor: 'text-orange-600', bg: 'bg-orange-50', border: 'border-orange-200'
    },
    {
      label: 'Low Stock Alerts', value: stats.lowStockItems ?? 0,
      icon: AlertTriangle,
      textColor: (stats.lowStockItems ?? 0) > 0 ? 'text-red-600' : 'text-gray-500',
      bg: (stats.lowStockItems ?? 0) > 0 ? 'bg-red-50' : 'bg-gray-50',
      border: (stats.lowStockItems ?? 0) > 0 ? 'border-red-200' : 'border-gray-200'
    },
    {
      label: 'Pending Approvals', value: pendingCount,
      icon: Clock,
      textColor: pendingCount > 0 ? 'text-yellow-600' : 'text-gray-500',
      bg: pendingCount > 0 ? 'bg-yellow-50' : 'bg-gray-50',
      border: pendingCount > 0 ? 'border-yellow-200' : 'border-gray-200',
      onClick: () => navigate('/admin/pending-users')
    },
    {
      label: 'Pending Repairs', value: stats.pendingRepairs ?? 0,
      icon: Wrench,
      textColor: (stats.pendingRepairs ?? 0) > 0 ? 'text-orange-600' : 'text-gray-500',
      bg: (stats.pendingRepairs ?? 0) > 0 ? 'bg-orange-50' : 'bg-gray-50',
      border: (stats.pendingRepairs ?? 0) > 0 ? 'border-orange-200' : 'border-gray-200',
      onClick: () => navigate('/my-repair-tasks')
    },
    {
      label: 'Completed Repairs', value: stats.completedRepairs ?? 0,
      icon: UserCheck,
      textColor: 'text-green-600', bg: 'bg-green-50', border: 'border-green-200'
    },
    {
      label: 'Technician Performance',
      value: `${stats.successRate ?? 0}%`,
      icon: Trophy,
      textColor: (stats.successRate ?? 0) >= 80 ? 'text-yellow-600' : 'text-red-500',
      bg: (stats.successRate ?? 0) >= 80 ? 'bg-yellow-50' : 'bg-red-50',
      border: (stats.successRate ?? 0) >= 80 ? 'border-yellow-200' : 'border-red-200',
      onClick: () => navigate('/performance')
    },
  ];

  const modules = [
    {
      title: 'Repair Tasks',
      description: 'Manage repair jobs, analytics and spare parts requests',
      icon: Wrench,
      iconColor: 'text-indigo-600',
      iconBg: 'bg-indigo-50',
      actions: [
        { label: 'My Repair Tasks', path: '/my-repair-tasks' },
        { label: 'Repair Analytics', path: '/repair-analytics' },
        { label: 'Spare Part Requests', path: '/request-spare-parts' },
      ]
    },
    {
      title: 'Inventory',
      description: 'Stock management, recommendations and inventory reporting',
      icon: Package,
      iconColor: 'text-orange-600',
      iconBg: 'bg-orange-50',
      actions: [
        { label: 'View Inventory', path: '/inventory' },
        { label: 'Stock Alerts', path: '/inventory/stock-alerts' },
        { label: 'View Stock', path: '/inventory/view' },
        { label: 'AI Recommendations', path: '/inventory/ai-recommendations' },
        { label: 'Inventory Reports', path: '/inventory/reports' },
      ]
    },
    {
      title: 'Sales & Customers',
      description: 'Sales records, analytics, repair orders and customer management',
      icon: ShoppingCart,
      iconColor: 'text-green-600',
      iconBg: 'bg-green-50',
      actions: [
        { label: 'Sales', path: '/sales' },
        { label: 'Sales History', path: '/sales-history' },
        { label: 'Sales Analytics', path: '/sales-analytics' },
        { label: 'Repair Tasks', path: '/sales-repairs' },
        { label: 'Warranty Tracking', path: '/customers' },
      ]
    },
    {
      title: 'Management',
      description: 'Technician oversight and business reporting',
      icon: UserCheck,
      iconColor: 'text-purple-600',
      iconBg: 'bg-purple-50',
      actions: [
        { label: 'Technicians', path: '/technicians' },
        { label: 'Reports', path: '/reports' },
        { label: 'Categories', path: '/admin/categories' },
      ]
    },
    {
      title: 'Performance Tracking',
      description: 'Track technician success rates, rankings & repair times',
      icon: Trophy,
      iconColor: 'text-yellow-600',
      iconBg: 'bg-yellow-50',
      highlight: true,
      actions: [
        { label: '🏆 Technician Leaderboard', path: '/performance' },
        { label: '📊 Success Rate Analytics', path: '/performance' },
        { label: '📱 Device Type Performance', path: '/performance' },
      ]
    },
    {
      title: 'User Approvals',
      description: `${pendingCount} account${pendingCount !== 1 ? 's' : ''} awaiting approval`,
      icon: Clock,
      iconColor: pendingCount > 0 ? 'text-yellow-600' : 'text-gray-400',
      iconBg: pendingCount > 0 ? 'bg-yellow-50' : 'bg-gray-50',
      actions: [
        { label: pendingCount > 0 ? `Review ${pendingCount} Pending Account${pendingCount !== 1 ? 's' : ''}` : 'No Pending Accounts', path: '/admin/pending-users' },
      ]
    },
    {
      title: 'System Health',
      description: 'Performance metrics and security overview',
      icon: Shield,
      iconColor: 'text-teal-600',
      iconBg: 'bg-teal-50',
      actions: [],
      badges: [
        { label: 'Security Score', value: '98%', color: 'text-teal-600' },
        { label: 'Uptime', value: stats.systemUptime ?? '99.9%', color: 'text-green-600' },
        { label: 'Tech Utilization', value: `${stats.technicianUtilization ?? 0}%`, color: 'text-blue-600' },
      ]
    },
  ];

  return (
    <div className="space-y-6">
      {pendingCount > 0 && (
        <button
          onClick={() => navigate('/admin/pending-users')}
          className="w-full flex items-center gap-3 bg-yellow-50 border border-yellow-200 rounded-xl px-4 py-3 text-left hover:bg-yellow-100 transition"
        >
          <Clock className="w-5 h-5 text-yellow-600 flex-shrink-0" />
          <div>
            <p className="text-sm font-semibold text-yellow-800">
              {pendingCount} account{pendingCount !== 1 ? 's' : ''} pending your approval
            </p>
            <p className="text-xs text-yellow-600">Click to review and approve new user registrations</p>
          </div>
          <ChevronRight className="w-4 h-4 text-yellow-500 ml-auto" />
        </button>
      )}

      {/* Stats Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
        {statCards.map((card) => (
          <div
            key={card.label}
            onClick={card.onClick}
            className={`bg-white rounded-xl border ${card.border} p-4 flex flex-col gap-2 shadow-sm ${card.onClick ? 'cursor-pointer hover:shadow-md transition-shadow' : ''}`}
          >
            <div className={`w-9 h-9 rounded-lg ${card.bg} flex items-center justify-center`}>
              <card.icon className={`w-5 h-5 ${card.textColor}`} />
            </div>
            <p className="text-xs text-gray-500 font-medium leading-tight">{card.label}</p>
            <p className={`text-xl font-bold ${card.textColor}`}>{card.value}</p>
          </div>
        ))}
      </div>

      {/* Module Cards */}
      <div>
        <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">System Modules</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {modules.map((mod) => (
            <div
              key={mod.title}
              className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm hover:shadow-md transition-shadow"
            >
              <div className="flex items-center gap-3 mb-4">
                <div className={`w-10 h-10 rounded-lg ${mod.iconBg} flex items-center justify-center flex-shrink-0`}>
                  <mod.icon className={`w-5 h-5 ${mod.iconColor}`} />
                </div>
                <div className="min-w-0">
                  <h3 className="text-sm font-semibold text-gray-900">{mod.title}</h3>
                  <p className="text-xs text-gray-500 leading-tight">{mod.description}</p>
                </div>
              </div>

              {mod.badges && (
                <div className="flex flex-wrap gap-2 mb-3">
                  {mod.badges.map((b) => (
                    <div key={b.label} className="flex items-center gap-1 bg-gray-50 rounded-md px-2 py-1">
                      <span className="text-xs text-gray-500">{b.label}:</span>
                      <span className={`text-xs font-bold ${b.color}`}>{b.value}</span>
                    </div>
                  ))}
                </div>
              )}

              {mod.actions.length > 0 ? (
                <div className="space-y-1">
                  {mod.actions.map((action) => (
                    <button
                      key={action.label}
                      onClick={() => navigate(action.path)}
                      className="w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm text-gray-700 bg-gray-50 hover:bg-gray-100 transition-colors"
                    >
                      <span>{action.label}</span>
                      <ChevronRight className="w-3 h-3 text-gray-400" />
                    </button>
                  ))}
                </div>
              ) : (
                !mod.badges && (
                  <p className="text-xs text-gray-400 italic">No actions available</p>
                )
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
