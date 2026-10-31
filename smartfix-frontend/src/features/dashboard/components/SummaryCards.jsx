import React from 'react';
import { Wrench, CheckCircle, DollarSign, Clock, Package, AlertCircle } from 'lucide-react';
import { formatCurrency } from '../../../shared/utils/formatters';

export const SummaryCards = ({ stats, userRole }) => {
  const cards = [
    {
      title: 'Pending Repairs',
      value: stats?.pendingRepairs || 0,
      icon: <Wrench className="w-6 h-6 text-white" />,
      color: 'bg-blue-500'
    },
    {
      title: 'Completed Today',
      value: stats?.completedToday || 0,
      icon: <CheckCircle className="w-6 h-6 text-white" />,
      color: 'bg-green-500'
    },
    {
      title: 'Revenue Today',
      value: formatCurrency(stats?.revenueToday || 0),
      icon: <DollarSign className="w-6 h-6 text-white" />,
      color: 'bg-purple-500'
    },
    {
      title: 'Active Tasks',
      value: stats?.myTasks || stats?.pendingRepairs || 0,
      icon: <Clock className="w-6 h-6 text-white" />,
      color: 'bg-orange-500'
    }
  ];

  const SummaryCard = ({ title, value, icon, color }) => (
    <div className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow">
      <div className="flex items-center justify-between mb-3">
        <div className={`p-3 rounded-full ${color}`}>{icon}</div>
      </div>
      <h3 className="text-2xl font-bold text-gray-900">{value}</h3>
      <p className="text-gray-600 text-sm mt-1">{title}</p>
    </div>
  );

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {cards.map((card, index) => (
        <SummaryCard key={index} {...card} />
      ))}
    </div>
  );
};