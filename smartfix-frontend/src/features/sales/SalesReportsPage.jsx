// src/features/sales/SalesReportsPage.jsx
import React, { useEffect, useState, useMemo } from 'react';
import {
  DollarSign, TrendingUp, ShoppingCart, Package, Calendar, 
  Download, FileText, BarChart3, PieChart as PieChartIcon,
  ArrowUpRight, ArrowDownRight, Users, Clock, CheckCircle
} from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend, LineChart, Line, AreaChart, Area
} from 'recharts';
import { PageHeader } from '../../shared/components/Common/PageHeader';
import { LoadingState } from '../../shared/components/Common/LoadingState';
import { formatCurrency, formatNumber } from '../../shared/utils/formatters';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

const SYSTEM_BACKEND_BASE_URL = process.env.REACT_APP_SYSTEM_BACKEND_URL || 'http://localhost:8080';
const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#14b8a6', '#f97316'];

export const SalesReportsPage = () => {
  const [sales, setSales] = useState([]);
  const [reportSummary, setReportSummary] = useState(null);
  const [salesByDay, setSalesByDay] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState('30'); // days
  const [reportType, setReportType] = useState('overview'); // overview, daily, products, customers

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [salesRes, summaryRes, dailyRes] = await Promise.all([
          fetch(`${SYSTEM_BACKEND_BASE_URL}/api/sales`),
          fetch(`${SYSTEM_BACKEND_BASE_URL}/api/reports/summary`),
          fetch(`${SYSTEM_BACKEND_BASE_URL}/api/reports/sales-by-day`)
        ]);
        
        if (salesRes.ok) setSales(await salesRes.json());
        if (summaryRes.ok) setReportSummary(await summaryRes.json());
        if (dailyRes.ok) setSalesByDay(await dailyRes.json());
      } catch (error) {
        console.error('Error fetching report data:', error);
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

  // Calculate metrics
  const totalRevenue = filteredSales.reduce((sum, s) => sum + Number(s.total || 0), 0);
  const totalTransactions = filteredSales.length;
  const avgOrderValue = totalTransactions > 0 ? totalRevenue / totalTransactions : 0;
  const totalItemsSold = filteredSales.reduce((sum, s) => {
    return sum + (s.items || []).reduce((itemSum, item) => itemSum + Number(item.quantity || 0), 0);
  }, 0);

  // Today vs Yesterday comparison
  const todayStr = new Date().toISOString().split('T')[0];
  const yesterdayStr = (() => { 
    const d = new Date(); 
    d.setDate(d.getDate() - 1); 
    return d.toISOString().split('T')[0]; 
  })();
  
  const todaySales = sales.filter(s => s.createdAt && s.createdAt.substring(0, 10) === todayStr);
  const yesterdaySales = sales.filter(s => s.createdAt && s.createdAt.substring(0, 10) === yesterdayStr);
  
  const todayRevenue = todaySales.reduce((sum, s) => sum + Number(s.total || 0), 0);
  const yesterdayRevenue = yesterdaySales.reduce((sum, s) => sum + Number(s.total || 0), 0);
  const revenueChange = yesterdayRevenue > 0 ? ((todayRevenue - yesterdayRevenue) / yesterdayRevenue * 100) : 0;

  // Sales by category
  const categoryData = useMemo(() => {
    const map = {};
    filteredSales.forEach(s => {
      const items = s.items || [];
      items.forEach(item => {
        const cat = item.category?.name || item.category || 'Other';
        if (!map[cat]) map[cat] = { revenue: 0, count: 0 };
        map[cat].revenue += Number(item.price || 0) * Number(item.quantity || 1);
        map[cat].count += Number(item.quantity || 1);
      });
    });
    return Object.entries(map)
      .map(([name, data]) => ({ 
        name, 
        value: Math.round(data.revenue * 100) / 100, 
        count: data.count 
      }))
      .sort((a, b) => b.value - a.value);
  }, [filteredSales]);

  // Top products
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
      .map(([name, data]) => ({ 
        name, 
        revenue: Math.round(data.revenue * 100) / 100, 
        quantity: data.quantity 
      }))
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 10);
  }, [filteredSales]);

  // Top customers
  const topCustomers = useMemo(() => {
    const map = {};
    filteredSales.forEach(s => {
      const customer = s.customerName || 'Unknown';
      if (!map[customer]) map[customer] = { revenue: 0, orders: 0 };
      map[customer].revenue += Number(s.total || 0);
      map[customer].orders += 1;
    });
    return Object.entries(map)
      .map(([name, data]) => ({ 
        name, 
        revenue: Math.round(data.revenue * 100) / 100, 
        orders: data.orders 
      }))
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 10);
  }, [filteredSales]);

  // Daily trend
  const dailyTrend = useMemo(() => {
    const days = Math.min(parseInt(dateRange), 30);
    const result = [];
    for (let i = days - 1; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().split('T')[0];
      const label = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      const daySales = sales.filter(s => s.createdAt && s.createdAt.substring(0, 10) === dateStr);
      const revenue = daySales.reduce((sum, s) => sum + Number(s.total || 0), 0);
      result.push({ 
        name: label, 
        revenue: Math.round(revenue * 100) / 100, 
        orders: daySales.length 
      });
    }
    return result;
  }, [sales, dateRange]);

  // Export to PDF based on report type
  const exportToPDF = () => {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const currentDate = new Date().toLocaleDateString();
    
    // Common header with COREX LTD branding
    doc.setFillColor(37, 99, 235);
    doc.rect(0, 0, pageWidth, 35, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(20);
    doc.setFont(undefined, 'bold');
    doc.text('COREX LTD', 14, 15);
    doc.setFontSize(12);
    
    let reportTitle = '';
    let fileName = '';
    
    switch (reportType) {
      case 'overview':
        reportTitle = 'Sales Overview Report';
        fileName = 'sales-overview';
        break;
      case 'daily':
        reportTitle = 'Daily Sales Performance Report';
        fileName = 'daily-sales';
        break;
      case 'products':
        reportTitle = 'Products Sales Report';
        fileName = 'products-sales';
        break;
      case 'customers':
        reportTitle = 'Customer Sales Report';
        fileName = 'customers-sales';
        break;
      default:
        reportTitle = 'Sales Report';
        fileName = 'sales-report';
    }
    
    doc.text(reportTitle, 14, 25);
    doc.setFontSize(9);
    doc.text(`Period: Last ${dateRange} Days | Generated: ${currentDate}`, 14, 31);
    
    doc.setTextColor(0, 0, 0);
    doc.setFont(undefined, 'normal');
    
    let startY = 45;
    
    // Summary Box
    doc.setFillColor(249, 250, 251);
    doc.rect(14, 40, pageWidth - 28, 25, 'F');
    doc.setDrawColor(229, 231, 235);
    doc.rect(14, 40, pageWidth - 28, 25, 'S');
    
    doc.setFontSize(10);
    doc.setFont(undefined, 'bold');
    doc.text('Summary:', 18, 48);
    doc.setFont(undefined, 'normal');
    doc.setFontSize(9);
    doc.text(`Total Revenue: ${formatCurrency(totalRevenue)}`, 18, 54);
    doc.text(`Transactions: ${formatNumber(totalTransactions)}`, 18, 60);
    doc.text(`Avg Order: ${formatCurrency(avgOrderValue)}`, 100, 54);
    doc.text(`Items Sold: ${formatNumber(totalItemsSold)}`, 100, 60);
    
    startY = 70;
    
    // Generate different content based on report type
    if (reportType === 'overview') {
      // Revenue Trend Summary
      doc.setFontSize(11);
      doc.setFont(undefined, 'bold');
      doc.text('Revenue Trend', 14, startY);
      startY += 8;
      
      const trendHeaders = [['Date', 'Orders', 'Revenue', 'Avg Order']];
      const trendRows = dailyTrend.slice(-10).map(day => [
        day.name,
        formatNumber(day.orders),
        formatCurrency(day.revenue),
        day.orders > 0 ? formatCurrency(day.revenue / day.orders) : formatCurrency(0)
      ]);
      
      autoTable(doc, {
        head: trendHeaders,
        body: trendRows,
        startY: startY,
        styles: { fontSize: 8 },
        headStyles: { fillColor: [37, 99, 235], textColor: [255, 255, 255], fontStyle: 'bold' },
        columnStyles: {
          0: { cellWidth: 45 },
          1: { cellWidth: 35, halign: 'right' },
          2: { cellWidth: 45, halign: 'right' },
          3: { cellWidth: 45, halign: 'right' }
        },
        alternateRowStyles: { fillColor: [249, 250, 251] }
      });
      
      startY = doc.lastAutoTable.finalY + 15;
      
      // Category Breakdown
      if (startY < pageHeight - 60 && categoryData.length > 0) {
        doc.setFontSize(11);
        doc.setFont(undefined, 'bold');
        doc.text('Revenue by Category', 14, startY);
        startY += 8;
        
        const categoryHeaders = [['Category', 'Units Sold', 'Revenue', 'Percentage']];
        const categoryRows = categoryData.slice(0, 8).map(cat => [
          cat.name,
          formatNumber(cat.count),
          formatCurrency(cat.value),
          `${((cat.value / totalRevenue) * 100).toFixed(1)}%`
        ]);
        
        autoTable(doc, {
          head: categoryHeaders,
          body: categoryRows,
          startY: startY,
          styles: { fontSize: 8 },
          headStyles: { fillColor: [139, 92, 246], textColor: [255, 255, 255], fontStyle: 'bold' },
          columnStyles: {
            0: { cellWidth: 60 },
            1: { cellWidth: 35, halign: 'right' },
            2: { cellWidth: 45, halign: 'right' },
            3: { cellWidth: 30, halign: 'right' }
          },
          alternateRowStyles: { fillColor: [243, 232, 255] }
        });
      }
      
    } else if (reportType === 'daily') {
      // Daily Sales Performance
      doc.setFontSize(11);
      doc.setFont(undefined, 'bold');
      doc.text('Daily Sales Performance', 14, startY);
      startY += 8;
      
      const headers = [['Date', 'Orders', 'Revenue', 'Avg Order', 'Growth']];
      const rows = dailyTrend.map((day, index) => {
        const prevDay = index > 0 ? dailyTrend[index - 1] : null;
        const growth = prevDay && prevDay.revenue > 0 
          ? `${(((day.revenue - prevDay.revenue) / prevDay.revenue) * 100).toFixed(1)}%`
          : '-';
        
        return [
          day.name,
          formatNumber(day.orders),
          formatCurrency(day.revenue),
          day.orders > 0 ? formatCurrency(day.revenue / day.orders) : formatCurrency(0),
          growth
        ];
      });
      
      autoTable(doc, {
        head: headers,
        body: rows,
        startY: startY,
        styles: { fontSize: 8 },
        headStyles: { fillColor: [37, 99, 235], textColor: [255, 255, 255], fontStyle: 'bold' },
        columnStyles: {
          0: { cellWidth: 40 },
          1: { cellWidth: 30, halign: 'right' },
          2: { cellWidth: 40, halign: 'right' },
          3: { cellWidth: 40, halign: 'right' },
          4: { cellWidth: 30, halign: 'right' }
        },
        alternateRowStyles: { fillColor: [249, 250, 251] }
      });
      
    } else if (reportType === 'products') {
      // Top Selling Products
      doc.setFontSize(11);
      doc.setFont(undefined, 'bold');
      doc.text('Top Selling Products', 14, startY);
      startY += 8;
      
      if (topProducts.length > 0) {
        const headers = [['Rank', 'Product', 'Units Sold', 'Revenue', 'Avg Price']];
        const rows = topProducts.map((product, index) => [
          `#${index + 1}`,
          product.name,
          formatNumber(product.quantity),
          formatCurrency(product.revenue),
          formatCurrency(product.revenue / product.quantity)
        ]);
        
        autoTable(doc, {
          head: headers,
          body: rows,
          startY: startY,
          styles: { fontSize: 8 },
          headStyles: { fillColor: [249, 115, 22], textColor: [255, 255, 255], fontStyle: 'bold' },
          columnStyles: {
            0: { cellWidth: 20, halign: 'center', fontStyle: 'bold' },
            1: { cellWidth: 70 },
            2: { cellWidth: 30, halign: 'right' },
            3: { cellWidth: 35, halign: 'right' },
            4: { cellWidth: 30, halign: 'right' }
          },
          alternateRowStyles: { fillColor: [255, 237, 213] }
        });
      } else {
        doc.setFontSize(9);
        doc.setFont(undefined, 'normal');
        doc.setTextColor(107, 114, 128);
        doc.text('No product sales data available for this period', 14, startY);
      }
      
    } else if (reportType === 'customers') {
      // Top Customers
      doc.setFontSize(11);
      doc.setFont(undefined, 'bold');
      doc.text('Top Customers', 14, startY);
      startY += 8;
      
      if (topCustomers.length > 0) {
        const headers = [['Rank', 'Customer', 'Orders', 'Total Revenue', 'Avg Order']];
        const rows = topCustomers.map((customer, index) => [
          `#${index + 1}`,
          customer.name,
          formatNumber(customer.orders),
          formatCurrency(customer.revenue),
          formatCurrency(customer.revenue / customer.orders)
        ]);
        
        autoTable(doc, {
          head: headers,
          body: rows,
          startY: startY,
          styles: { fontSize: 8 },
          headStyles: { fillColor: [139, 92, 246], textColor: [255, 255, 255], fontStyle: 'bold' },
          columnStyles: {
            0: { cellWidth: 20, halign: 'center', fontStyle: 'bold' },
            1: { cellWidth: 65 },
            2: { cellWidth: 25, halign: 'right' },
            3: { cellWidth: 40, halign: 'right' },
            4: { cellWidth: 35, halign: 'right' }
          },
          alternateRowStyles: { fillColor: [243, 232, 255] }
        });
      } else {
        doc.setFontSize(9);
        doc.setFont(undefined, 'normal');
        doc.setTextColor(107, 114, 128);
        doc.text('No customer sales data available for this period', 14, startY);
      }
    }
    
    // Footer
    const finalY = doc.lastAutoTable ? doc.lastAutoTable.finalY : startY;
    if (finalY < pageHeight - 25) {
      doc.setFontSize(8);
      doc.setTextColor(107, 114, 128);
      doc.text(
        'COREX LTD - Intelligent Repair, Inventory and Sales Management System',
        pageWidth / 2,
        pageHeight - 15,
        { align: 'center' }
      );
    }
    
    doc.save(`${fileName}-${new Date().toISOString().split('T')[0]}.pdf`);
  };

  if (loading) {
    return (
      <div className="p-6 bg-gray-50 min-h-screen">
        <LoadingState message="Loading sales reports..." />
      </div>
    );
  }

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <PageHeader
          title="Sales Reports & Analytics"
          subtitle="Comprehensive sales performance insights and detailed reports"
        />
        <div className="flex items-center gap-3">
          <select
            value={dateRange}
            onChange={e => setDateRange(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
          >
            <option value="7">Last 7 days</option>
            <option value="14">Last 14 days</option>
            <option value="30">Last 30 days</option>
            <option value="90">Last 90 days</option>
            <option value="365">Last year</option>
          </select>
          <button
            onClick={exportToPDF}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Download className="w-4 h-4" />
            Export PDF
          </button>
        </div>
      </div>

      {/* Report Type Tabs */}
      <div className="mb-6 bg-white rounded-xl shadow-sm border border-gray-100 p-1 inline-flex">
        {[
          { id: 'overview', label: 'Overview', icon: BarChart3 },
          { id: 'daily', label: 'Daily Trends', icon: Calendar },
          { id: 'products', label: 'Products', icon: Package },
          { id: 'customers', label: 'Customers', icon: Users }
        ].map(tab => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setReportType(tab.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                reportType === tab.id
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              <Icon className="w-4 h-4" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-gray-500 uppercase">Total Revenue</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">{formatCurrency(totalRevenue)}</p>
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
              <p className="text-xs font-medium text-gray-500 uppercase">Transactions</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">{formatNumber(totalTransactions)}</p>
              <p className="text-xs text-gray-400 mt-1">Total sales orders</p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-blue-50 flex items-center justify-center">
              <ShoppingCart className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-gray-500 uppercase">Avg Order Value</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">{formatCurrency(avgOrderValue)}</p>
              <p className="text-xs text-gray-400 mt-1">Per transaction</p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-purple-50 flex items-center justify-center">
              <TrendingUp className="w-6 h-6 text-purple-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-gray-500 uppercase">Items Sold</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">{formatNumber(totalItemsSold)}</p>
              <p className="text-xs text-gray-400 mt-1">Total units</p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-orange-50 flex items-center justify-center">
              <Package className="w-6 h-6 text-orange-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Report Content Based on Selected Tab */}
      {reportType === 'overview' && (
        <>
          {/* Revenue Trend */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-blue-600" />
              Revenue Trend
            </h3>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={dailyTrend}>
                <defs>
                  <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip
                  formatter={(value, name) => [
                    name === 'revenue' ? formatCurrency(value) : value,
                    name === 'revenue' ? 'Revenue' : 'Orders'
                  ]}
                  contentStyle={{ borderRadius: '8px', border: '1px solid #e5e7eb' }}
                />
                <Area 
                  type="monotone" 
                  dataKey="revenue" 
                  stroke="#3b82f6" 
                  strokeWidth={2} 
                  fillOpacity={1} 
                  fill="url(#revenueGradient)" 
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          {/* Category & Top Products */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Revenue by Category */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                <PieChartIcon className="w-5 h-5 text-purple-600" />
                Revenue by Category
              </h3>
              {categoryData.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={categoryData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={100}
                      paddingAngle={3}
                      dataKey="value"
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    >
                      {categoryData.map((_, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value) => [formatCurrency(value), 'Revenue']} />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <p className="text-sm text-gray-400 text-center py-16">No category data available</p>
              )}
            </div>

            {/* Quick Stats */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-green-600" />
                Quick Stats
              </h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-blue-50 rounded-lg">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Today's Sales</p>
                    <p className="text-2xl font-bold text-blue-600">{todaySales.length}</p>
                  </div>
                  <ShoppingCart className="w-8 h-8 text-blue-600" />
                </div>
                <div className="flex items-center justify-between p-4 bg-green-50 rounded-lg">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Today's Revenue</p>
                    <p className="text-2xl font-bold text-green-600">{formatCurrency(todayRevenue)}</p>
                  </div>
                  <DollarSign className="w-8 h-8 text-green-600" />
                </div>
                <div className="flex items-center justify-between p-4 bg-purple-50 rounded-lg">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Unique Customers</p>
                    <p className="text-2xl font-bold text-purple-600">
                      {new Set(filteredSales.map(s => s.customerName)).size}
                    </p>
                  </div>
                  <Users className="w-8 h-8 text-purple-600" />
                </div>
              </div>
            </div>
          </div>
        </>
      )}

      {reportType === 'daily' && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
            <Calendar className="w-5 h-5 text-blue-600" />
            Daily Sales Performance
          </h3>
          <ResponsiveContainer width="100%" height={400}>
            <BarChart data={dailyTrend}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="name" tick={{ fontSize: 11 }} />
              <YAxis yAxisId="left" tick={{ fontSize: 11 }} />
              <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 11 }} />
              <Tooltip
                formatter={(value, name) => [
                  name === 'revenue' ? formatCurrency(value) : value,
                  name === 'revenue' ? 'Revenue' : 'Orders'
                ]}
                contentStyle={{ borderRadius: '8px', border: '1px solid #e5e7eb' }}
              />
              <Legend />
              <Bar yAxisId="left" dataKey="revenue" fill="#3b82f6" radius={[4, 4, 0, 0]} name="Revenue" />
              <Bar yAxisId="right" dataKey="orders" fill="#10b981" radius={[4, 4, 0, 0]} name="Orders" />
            </BarChart>
          </ResponsiveContainer>
          
          {/* Daily Table */}
          <div className="mt-6 overflow-x-auto">
            <table className="min-w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Orders</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Revenue</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Avg Order</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {dailyTrend.map((day, i) => (
                  <tr key={i} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm text-gray-900">{day.name}</td>
                    <td className="px-4 py-3 text-sm text-gray-700 text-right">{day.orders}</td>
                    <td className="px-4 py-3 text-sm font-semibold text-gray-900 text-right">
                      {formatCurrency(day.revenue)}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-700 text-right">
                      {day.orders > 0 ? formatCurrency(day.revenue / day.orders) : formatCurrency(0)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {reportType === 'products' && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
            <Package className="w-5 h-5 text-orange-600" />
            Top Selling Products
          </h3>
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Rank</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Product</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Units Sold</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Revenue</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Avg Price</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {topProducts.map((product, i) => (
                  <tr key={i} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm font-bold text-gray-400">#{i + 1}</td>
                    <td className="px-4 py-3 text-sm font-medium text-gray-900">{product.name}</td>
                    <td className="px-4 py-3 text-sm text-gray-700 text-right">{formatNumber(product.quantity)}</td>
                    <td className="px-4 py-3 text-sm font-semibold text-gray-900 text-right">
                      {formatCurrency(product.revenue)}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-700 text-right">
                      {formatCurrency(product.revenue / product.quantity)}
                    </td>
                  </tr>
                ))}
                {topProducts.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-4 py-8 text-center text-sm text-gray-400">
                      No product data available
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {reportType === 'customers' && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
            <Users className="w-5 h-5 text-purple-600" />
            Top Customers
          </h3>
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Rank</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Customer</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Orders</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Total Revenue</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Avg Order</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {topCustomers.map((customer, i) => (
                  <tr key={i} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm font-bold text-gray-400">#{i + 1}</td>
                    <td className="px-4 py-3 text-sm font-medium text-gray-900">{customer.name}</td>
                    <td className="px-4 py-3 text-sm text-gray-700 text-right">{customer.orders}</td>
                    <td className="px-4 py-3 text-sm font-semibold text-gray-900 text-right">
                      {formatCurrency(customer.revenue)}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-700 text-right">
                      {formatCurrency(customer.revenue / customer.orders)}
                    </td>
                  </tr>
                ))}
                {topCustomers.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-4 py-8 text-center text-sm text-gray-400">
                      No customer data available
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
