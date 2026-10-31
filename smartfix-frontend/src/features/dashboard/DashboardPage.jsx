// src/features/dashboard/DashboardPage.jsx
import React, { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { SummaryCards } from './components/SummaryCards';

import { AdminDashboard } from './components/AdminDashboard';
import { TechnicianDashboard } from './components/TechnicianDashboard';
import { InventoryDashboard } from './components/InventoryDashboard';
import { SalesDashboard } from './components/SalesDashboard';
import { PageHeader } from '../../shared/components/Common/PageHeader';

export const DashboardPage = () => {
  const SYSTEM_BACKEND_BASE_URL = process.env.REACT_APP_SYSTEM_BACKEND_URL || 'http://localhost:8080';
  const { user } = useSelector((state) => state.auth);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  const roleSubtitle = {
    admin: 'System Administrator Dashboard',
    technician: 'Repair Technician Dashboard',
    inventory: 'Inventory Management Dashboard',
    sales: 'Sales Dashboard'
  };

  useEffect(() => {
    const loadDashboard = async () => {
      if (!user) return;
      try {
        const token = localStorage.getItem('token');
        const headers = token ? { 'Authorization': `Bearer ${token}` } : {};
        if (user?.id) {
          headers['X-User-Id'] = user.id.toString();
        }
        
        const [summaryRes, reportRes, techRes] = await Promise.all([
          fetch(`${SYSTEM_BACKEND_BASE_URL}/api/dashboard/summary`, { headers }),
          fetch(`${SYSTEM_BACKEND_BASE_URL}/api/reports/summary`, { headers }),
          fetch(`${SYSTEM_BACKEND_BASE_URL}/api/technicians`, { headers })
        ]);
        const summary = await summaryRes.json();
        const reports = await reportRes.json();
        const technicians = techRes.ok ? await techRes.json() : [];

        const roleStats = {
          pendingRepairs:   Number(summary.pendingRepairs   || 0),
          activeRepairs:    Number(summary.activeRepairs    || 0),
          completedRepairs: Number(summary.completedRepairs || 0),
          totalRepairs:     Number(summary.totalRepairs     || 0),
          completedToday: Number(summary.completedToday || 0),
          revenueToday: Number(summary.revenueToday || 0),
          myTasks: Number(summary.myTasks || 0),
          activeUsers: Number(summary.users || 0),
          systemUptime: summary.systemUptime || 'N/A',
          monthlyRevenue: Number(reports.totalRevenue || 0),
          technicianUtilization: Number(summary.technicianUtilization || 0),
          customerSatisfaction: Number(summary.customerSatisfaction || 0),
          costReduction: Number(summary.costReduction || 0),
          totalParts: Number(summary.inventoryItems || 0),
          lowStockItems: Number(summary.lowStockItems || 0),
          totalValue: Number(reports.inventoryValue || 0),
          pendingOrders: Number(summary.pendingOrders || 0),
          topCategory: Object.keys(reports.categoryDistribution || {})[0] || 'N/A',
          salesToday: Number(summary.revenueToday || 0),
          dailyTarget: Number(summary.dailyTarget || 0),
          weeklySales: Number(summary.weeklySales || 0),
          customerCount: Number(summary.salesToday || 0),
          conversionRate: Number(summary.conversionRate || 0),
          topProduct: summary.topProduct || 'N/A',
          successRate: Number(summary.successRate || 0),
          urgentTasks: Number(summary.lowStockItems || 0),
          nextTask: summary.nextTask || 'N/A'
        };
        setStats(roleStats);
      } catch {
        setStats({
          pendingRepairs: 0,
          completedToday: 0,
          revenueToday: 0,
          myTasks: 0
        });
      } finally {
        setLoading(false);
      }
    };

    loadDashboard();
  }, [user]);

  const renderRoleSpecificDashboard = () => {
    if (!stats) return null;
    
    switch (user?.role) {
      case 'admin':
        return <AdminDashboard stats={stats} />;
      case 'technician':
        return <TechnicianDashboard stats={stats} />;
      case 'inventory':
        return <InventoryDashboard stats={stats} />;
      case 'sales':
        return <SalesDashboard stats={stats} />;
      default:
        return <SummaryCards stats={stats} userRole={user?.role} />;
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <PageHeader
        title={`Welcome back, ${user?.fullName || 'User'}`}
        subtitle={roleSubtitle[user?.role] || `${user?.role?.charAt(0).toUpperCase() + user?.role?.slice(1)} Dashboard`}
      />

      {/* Role-specific dashboard content */}
      {renderRoleSpecificDashboard()}
      
    </div>
  );
};