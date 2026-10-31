import React, { useEffect, useState } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line
} from 'recharts';
import {
  DollarSign, ShoppingCart, Package, AlertTriangle,
  Wrench, CheckCircle, TrendingUp, Users, FileText
} from 'lucide-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

const SYSTEM_BACKEND_BASE_URL = process.env.REACT_APP_SYSTEM_BACKEND_URL || 'http://localhost:8080';

const PIE_COLORS = ['#3b82f6','#10b981','#f59e0b','#ef4444','#8b5cf6','#06b6d4'];

const KpiCard = ({ icon, label, value, sub, accent }) => (
  <div className="bg-white rounded-xl shadow p-5 flex items-center gap-4">
    <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${accent}`}>
      {icon}
    </div>
    <div>
      <p className="text-xs text-gray-500">{label}</p>
      <p className="text-xl font-bold text-gray-900">{value}</p>
      {sub && <p className="text-xs text-gray-400">{sub}</p>}
    </div>
  </div>
);

const SectionTitle = ({ title }) => (
  <h2 className="text-lg font-semibold text-gray-900 mb-4">{title}</h2>
);

export const ReportsPage = () => {
  const [tab, setTab] = useState('overview');
  const [summary, setSummary] = useState(null);
  const [salesByDay, setSalesByDay] = useState([]);
  const [repairAnalytics, setRepairAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const [summaryRes, salesDayRes, repairRes] = await Promise.all([
          fetch(`${SYSTEM_BACKEND_BASE_URL}/api/reports/summary`),
          fetch(`${SYSTEM_BACKEND_BASE_URL}/api/reports/sales-by-day`),
          fetch(`${SYSTEM_BACKEND_BASE_URL}/api/reports/repair-analytics`),
        ]);
        if (summaryRes.ok) setSummary(await summaryRes.json());
        if (salesDayRes.ok) setSalesByDay(await salesDayRes.json());
        if (repairRes.ok) setRepairAnalytics(await repairRes.json());
      } catch { /* ignore */ }
      setLoading(false);
    };
    load();
  }, []);

  const categoryPieData = summary?.categoryDistribution
    ? Object.entries(summary.categoryDistribution).map(([name, value]) => ({ name, value }))
    : [];

  const repairPieData = repairAnalytics?.statusDistribution || [];

  const fmt = (n) => {
    const num = Number(n || 0);
    return num >= 1000 ? `${(num / 1000).toFixed(1)}k RWF` : `${num.toFixed(2)} RWF`;
  };

  const fmtPDF = (n) => {
    const num = Number(n || 0);
    return `${num.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} RWF`;
  };

  const handleExportPDF = () => {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    const now = new Date();
    const dateStr = now.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
    const timeStr = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
    let y = 15;

    // Header
    doc.setFillColor(192, 57, 43);
    doc.rect(0, 0, pageWidth, 32, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(20);
    doc.setFont('helvetica', 'bold');
    doc.text('COREX LTD', 14, 15);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text('Business Analytics Report', 14, 23);
    doc.setFontSize(9);
    doc.text(`Generated: ${dateStr} at ${timeStr}`, pageWidth - 14, 15, { align: 'right' });
    doc.text(`Report Period: Last 7 Days`, pageWidth - 14, 23, { align: 'right' });
    y = 42;

    // Section helper
    const addSection = (title) => {
      if (y > 260) { doc.addPage(); y = 20; }
      doc.setFillColor(245, 245, 245);
      doc.rect(14, y - 5, pageWidth - 28, 9, 'F');
      doc.setTextColor(31, 41, 55);
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.text(title, 16, y + 1);
      y += 12;
    };

    const addKpi = (label, value) => {
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(10);
      doc.setTextColor(107, 114, 128);
      doc.text(label + ':', 18, y);
      doc.setTextColor(31, 41, 55);
      doc.setFont('helvetica', 'bold');
      doc.text(String(value), 80, y);
      y += 7;
    };

    // 1. Overview
    addSection('OVERVIEW');
    addKpi('Total Revenue', fmtPDF(summary?.totalRevenue));
    addKpi('Total Sales', String(summary?.totalSalesCount || 0));
    addKpi('Inventory Value', fmtPDF(summary?.inventoryValue));
    addKpi('Inventory Items', String(summary?.inventoryCount || 0));
    addKpi('Low Stock Alerts', String(summary?.lowStockCount || 0));
    addKpi('Repair Completion Rate', `${repairAnalytics?.completionRate || 0}%`);
    addKpi('Completed Repairs', `${repairAnalytics?.completed || 0} of ${repairAnalytics?.total || 0}`);
    y += 5;

    // 2. Sales by Day table
    addSection('DAILY SALES (LAST 7 DAYS)');
    if (salesByDay.length > 0) {
      autoTable(doc, {
        startY: y,
        head: [['Day', 'Revenue (RWF)', 'Sales Count']],
        body: salesByDay.map(d => [
          d.day || '-',
          fmtPDF(d.revenue || 0),
          String(d.count || 0)
        ]),
        theme: 'grid',
        headStyles: { fillColor: [59, 130, 246], textColor: 255, fontStyle: 'bold', fontSize: 9 },
        bodyStyles: { fontSize: 9 },
        alternateRowStyles: { fillColor: [249, 250, 251] },
        margin: { left: 14, right: 14 },
        tableWidth: 'auto',
      });
      y = doc.lastAutoTable.finalY + 10;
    } else {
      doc.setFont('helvetica', 'italic');
      doc.setFontSize(9);
      doc.setTextColor(156, 163, 175);
      doc.text('No sales data available', 18, y);
      y += 10;
    }

    // 3. Inventory by Category
    if (y > 240) { doc.addPage(); y = 20; }
    addSection('INVENTORY BY CATEGORY');
    if (categoryPieData.length > 0) {
      autoTable(doc, {
        startY: y,
        head: [['Category', 'Item Count']],
        body: categoryPieData.map(d => [d.name, String(d.value)]),
        theme: 'grid',
        headStyles: { fillColor: [16, 185, 129], textColor: 255, fontStyle: 'bold', fontSize: 9 },
        bodyStyles: { fontSize: 9 },
        alternateRowStyles: { fillColor: [249, 250, 251] },
        margin: { left: 14, right: 14 },
        tableWidth: 'auto',
      });
      y = doc.lastAutoTable.finalY + 10;
    } else {
      doc.setFont('helvetica', 'italic');
      doc.setFontSize(9);
      doc.setTextColor(156, 163, 175);
      doc.text('No inventory data available', 18, y);
      y += 10;
    }

    // 4. Repair Status
    if (y > 240) { doc.addPage(); y = 20; }
    addSection('REPAIR TASK STATUS');
    addKpi('Total Tasks', String(repairAnalytics?.total || 0));
    addKpi('Pending', String(repairAnalytics?.pending || 0));
    addKpi('Completed', String(repairAnalytics?.completed || 0));
    addKpi('Completion Rate', `${repairAnalytics?.completionRate || 0}%`);
    y += 3;

    if (repairPieData.length > 0) {
      autoTable(doc, {
        startY: y,
        head: [['Status', 'Count']],
        body: repairPieData.map(d => [d.name, String(d.value)]),
        theme: 'grid',
        headStyles: { fillColor: [139, 92, 246], textColor: 255, fontStyle: 'bold', fontSize: 9 },
        bodyStyles: { fontSize: 9 },
        alternateRowStyles: { fillColor: [249, 250, 251] },
        margin: { left: 14, right: 14 },
        tableWidth: 'auto',
      });
      y = doc.lastAutoTable.finalY + 10;
    }

    // Footer on every page
    const totalPages = doc.internal.getNumberOfPages();
    for (let i = 1; i <= totalPages; i++) {
      doc.setPage(i);
      doc.setFontSize(8);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(156, 163, 175);
      doc.text(
        `Corex Ltd — Confidential | Page ${i} of ${totalPages}`,
        pageWidth / 2, doc.internal.pageSize.getHeight() - 8,
        { align: 'center' }
      );
    }

    doc.save(`Corex_Report_${now.toISOString().split('T')[0]}.pdf`);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600" />
      </div>
    );
  }

  const tabs = [
    { key: 'overview',   label: 'Overview' },
    { key: 'sales',      label: 'Sales' },
    { key: 'inventory',  label: 'Inventory' },
    { key: 'repairs',    label: 'Repairs' },
  ];

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Reporting & Analytics</h1>
          <p className="text-sm text-gray-500 mt-0.5">Live operational data from all departments</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={handleExportPDF}
            className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white text-sm rounded-lg hover:bg-red-700"
          >
            <FileText className="w-4 h-4" /> Export PDF
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6">
        {tabs.map((t) => (
          <button key={t.key} onClick={() => setTab(t.key)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              tab === t.key ? 'bg-blue-600 text-white' : 'bg-white text-gray-700 border hover:bg-gray-50'
            }`}>
            {t.label}
          </button>
        ))}
      </div>

      {/* === OVERVIEW === */}
      {tab === 'overview' && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <KpiCard icon={<DollarSign className="w-6 h-6 text-green-600" />}
              label="Total Revenue" value={fmt(summary?.totalRevenue)}
              sub={`${summary?.totalSalesCount || 0} sales`}
              accent="bg-green-50" />
            <KpiCard icon={<Package className="w-6 h-6 text-blue-600" />}
              label="Inventory Value" value={fmt(summary?.inventoryValue)}
              sub={`${summary?.inventoryCount || 0} items`}
              accent="bg-blue-50" />
            <KpiCard icon={<AlertTriangle className="w-6 h-6 text-red-500" />}
              label="Low Stock Alerts" value={summary?.lowStockCount || 0}
              sub="items below reorder point"
              accent="bg-red-50" />
            <KpiCard icon={<Wrench className="w-6 h-6 text-purple-600" />}
              label="Repair Completion" value={`${repairAnalytics?.completionRate || 0}%`}
              sub={`${repairAnalytics?.completed || 0} of ${repairAnalytics?.total || 0} tasks`}
              accent="bg-purple-50" />
          </div>

          {/* Revenue chart + repair pie side by side */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white rounded-xl shadow p-5">
              <SectionTitle title="Revenue — Last 7 Days" />
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={salesByDay} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="day" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => `${v} RWF`} />
                  <Tooltip formatter={(v) => [`${Number(v).toLocaleString()} RWF`, 'Revenue']} />
                  <Bar dataKey="revenue" fill="#3b82f6" radius={[4,4,0,0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div className="bg-white rounded-xl shadow p-5">
              <SectionTitle title="Repair Task Status" />
              {repairPieData.some((d) => d.value > 0) ? (
                <ResponsiveContainer width="100%" height={220}>
                  <PieChart>
                    <Pie data={repairPieData} dataKey="value" nameKey="name"
                      cx="50%" cy="50%" outerRadius={80} label={({ name, percent }) =>
                        `${name} ${(percent * 100).toFixed(0)}%`}>
                      {repairPieData.map((_, i) => (
                        <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-48 text-gray-400 text-sm">
                  No repair task data yet
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* === SALES === */}
      {tab === 'sales' && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <KpiCard icon={<ShoppingCart className="w-6 h-6 text-green-600" />}
              label="Total Sales" value={summary?.totalSalesCount || 0}
              accent="bg-green-50" />
            <KpiCard icon={<DollarSign className="w-6 h-6 text-blue-600" />}
              label="Total Revenue" value={fmt(summary?.totalRevenue)}
              accent="bg-blue-50" />
            <KpiCard icon={<TrendingUp className="w-6 h-6 text-purple-600" />}
              label="Avg Sale Value" value={
                summary?.totalSalesCount
                  ? fmt(Number(summary.totalRevenue || 0) / summary.totalSalesCount)
                  : '0.00 RWF'
              }
              accent="bg-purple-50" />
          </div>

          <div className="bg-white rounded-xl shadow p-5">
            <SectionTitle title="Daily Revenue — Last 7 Days" />
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={salesByDay} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="day" />
                <YAxis tickFormatter={(v) => `${v} RWF`} />
                <Tooltip formatter={(v) => [`${Number(v).toLocaleString()} RWF`, 'Revenue']} />
                <Legend />
                <Bar dataKey="revenue" name="Revenue (RWF)" fill="#10b981" radius={[4,4,0,0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="bg-white rounded-xl shadow p-5">
            <SectionTitle title="Daily Sales Count — Last 7 Days" />
            <ResponsiveContainer width="100%" height={220}>
              <LineChart data={salesByDay} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="day" />
                <YAxis allowDecimals={false} />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="count" name="Sales Count"
                  stroke="#3b82f6" strokeWidth={2} dot={{ r: 4 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* === INVENTORY === */}
      {tab === 'inventory' && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <KpiCard icon={<Package className="w-6 h-6 text-blue-600" />}
              label="Total Items" value={summary?.inventoryCount || 0}
              accent="bg-blue-50" />
            <KpiCard icon={<DollarSign className="w-6 h-6 text-green-600" />}
              label="Stock Value" value={fmt(summary?.inventoryValue)}
              accent="bg-green-50" />
            <KpiCard icon={<AlertTriangle className="w-6 h-6 text-red-500" />}
              label="Low Stock Items" value={summary?.lowStockCount || 0}
              accent="bg-red-50" />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white rounded-xl shadow p-5">
              <SectionTitle title="Items by Category" />
              {categoryPieData.length > 0 ? (
                <ResponsiveContainer width="100%" height={260}>
                  <PieChart>
                    <Pie data={categoryPieData} dataKey="value" nameKey="name"
                      cx="50%" cy="50%" outerRadius={90}
                      label={({ name, value }) => `${name}: ${value}`}>
                      {categoryPieData.map((_, i) => (
                        <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-48 text-gray-400 text-sm">
                  No inventory data yet
                </div>
              )}
            </div>

            <div className="bg-white rounded-xl shadow p-5">
              <SectionTitle title="Category Distribution" />
              {categoryPieData.length > 0 ? (
                <ResponsiveContainer width="100%" height={260}>
                  <BarChart data={categoryPieData} layout="vertical"
                    margin={{ top: 5, right: 20, left: 60, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis type="number" allowDecimals={false} />
                    <YAxis type="category" dataKey="name" tick={{ fontSize: 11 }} />
                    <Tooltip />
                    <Bar dataKey="value" name="Items" fill="#3b82f6" radius={[0,4,4,0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-48 text-gray-400 text-sm">
                  No inventory data yet
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* === REPAIRS === */}
      {tab === 'repairs' && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <KpiCard icon={<Wrench className="w-6 h-6 text-gray-600" />}
              label="Total Tasks" value={repairAnalytics?.total || 0}
              accent="bg-gray-100" />
            <KpiCard icon={<AlertTriangle className="w-6 h-6 text-yellow-600" />}
              label="Pending" value={repairAnalytics?.pending || 0}
              accent="bg-yellow-50" />
            <KpiCard icon={<CheckCircle className="w-6 h-6 text-green-600" />}
              label="Completed" value={repairAnalytics?.completed || 0}
              accent="bg-green-50" />
            <KpiCard icon={<TrendingUp className="w-6 h-6 text-blue-600" />}
              label="Completion Rate" value={`${repairAnalytics?.completionRate || 0}%`}
              accent="bg-blue-50" />
          </div>

          <div className="bg-white rounded-xl shadow p-5">
            <SectionTitle title="Repair Task Status Breakdown" />
            {repairPieData.some((d) => d.value > 0) ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <ResponsiveContainer width="100%" height={260}>
                  <PieChart>
                    <Pie data={repairPieData} dataKey="value" nameKey="name"
                      cx="50%" cy="50%" outerRadius={90}
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                      {repairPieData.map((_, i) => (
                        <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
                <ResponsiveContainer width="100%" height={260}>
                  <BarChart data={repairPieData} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                    <YAxis allowDecimals={false} />
                    <Tooltip />
                    <Bar dataKey="value" fill="#8b5cf6" radius={[4,4,0,0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="flex items-center justify-center h-48 text-gray-400 text-sm">
                No repair task data yet — log your first repair to see analytics.
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
