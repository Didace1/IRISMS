// src/features/repair-tasks/RepairHistoryPage.jsx
import React, { useEffect, useState, useMemo } from 'react';
import {
  Search, Filter, ChevronDown, ChevronUp, Wrench,
  Clock, CheckCircle, AlertTriangle, User, Calendar,
  FileText, Users, TrendingUp, ClipboardList
} from 'lucide-react';
import toast from 'react-hot-toast';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { PageHeader } from '../../shared/components/Common/PageHeader';
import { LoadingState } from '../../shared/components/Common/LoadingState';
import { EmptyState } from '../../shared/components/Common/EmptyState';
import { formatCurrency, formatNumber, formatDate } from '../../shared/utils/formatters';

const SYSTEM_BACKEND_BASE_URL = process.env.REACT_APP_SYSTEM_BACKEND_URL || 'http://localhost:8080';

export const RepairHistoryPage = () => {
  const [repairTasks, setRepairTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [expandedTaskId, setExpandedTaskId] = useState(null);
  const [page, setPage] = useState(1);
  const pageSize = 15;

  useEffect(() => {
    const fetchRepairTasks = async () => {
      try {
        console.log('Fetching repair tasks from:', `${SYSTEM_BACKEND_BASE_URL}/api/repair-tasks`);
        const res = await fetch(`${SYSTEM_BACKEND_BASE_URL}/api/repair-tasks`);
        console.log('Repair tasks API response status:', res.status);
        
        if (res.ok) {
          const data = await res.json();
          console.log('Repair tasks data received:', data);
          setRepairTasks(data);
          
          if (data.length === 0) {
            toast.success('Repair history loaded - no repair tasks yet');
          } else {
            toast.success(`Loaded ${data.length} repair task records`);
          }
        } else {
          console.error('Repair tasks API error:', res.status, res.statusText);
          toast.error(`Failed to load repair history (${res.status})`);
        }
      } catch (error) {
        console.error('Repair tasks fetch error:', error);
        toast.error('System backend not reachable - make sure Spring Boot backend is running on port 8080');
      } finally {
        setLoading(false);
      }
    };
    fetchRepairTasks();
  }, []);

  // Sort newest first
  const sorted = useMemo(() => {
    return [...repairTasks].sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
  }, [repairTasks]);

  // Filter
  const filtered = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();
    return sorted.filter(task => {
      // Text search
      if (q) {
        const haystack = [
          task.customerName,
          task.customerEmail,
          task.customerPhone,
          task.customerRef,
          task.deviceType,
          task.deviceModel,
          task.repairNote,
          task.assignedTechnician?.fullName,
          String(task.id)
        ].join(' ').toLowerCase();
        if (!haystack.includes(q)) return false;
      }
      
      // Status filter
      if (statusFilter !== 'all') {
        const taskStatus = String(task.status || '').toLowerCase();
        if (taskStatus !== statusFilter.toLowerCase()) return false;
      }
      
      // Date range
      if (dateFrom && task.createdAt) {
        if (task.createdAt.substring(0, 10) < dateFrom) return false;
      }
      if (dateTo && task.createdAt) {
        if (task.createdAt.substring(0, 10) > dateTo) return false;
      }
      return true;
    });
  }, [sorted, searchTerm, statusFilter, dateFrom, dateTo]);

  // Pagination
  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const currentPage = Math.min(page, totalPages);
  const pageItems = filtered.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  useEffect(() => { setPage(1); }, [searchTerm, statusFilter, dateFrom, dateTo]);

  // Summary stats
  const totalTasks = filtered.length;
  const pendingTasks = filtered.filter(t => ['PENDING', 'ASSIGNED'].includes(String(t.status || '').toUpperCase())).length;
  const inProgressTasks = filtered.filter(t => String(t.status || '').toUpperCase() === 'IN_PROGRESS').length;
  const completedTasks = filtered.filter(t => String(t.status || '').toUpperCase() === 'COMPLETED').length;
  const escalatedTasks = filtered.filter(t => String(t.status || '').toUpperCase() === 'ESCALATED').length;
  const uniqueTechnicians = new Set(filtered.map(t => t.assignedTechnician?.id).filter(Boolean)).size;

  const getStatusBadge = (status) => {
    const normalized = String(status || '').toUpperCase();
    switch (normalized) {
      case 'PENDING':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'ASSIGNED':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'IN_PROGRESS':
        return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'COMPLETED':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'ESCALATED':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusIcon = (status) => {
    const normalized = String(status || '').toUpperCase();
    switch (normalized) {
      case 'PENDING':
      case 'ASSIGNED':
        return <Clock className="w-4 h-4" />;
      case 'IN_PROGRESS':
        return <Wrench className="w-4 h-4" />;
      case 'COMPLETED':
        return <CheckCircle className="w-4 h-4" />;
      case 'ESCALATED':
        return <AlertTriangle className="w-4 h-4" />;
      default:
        return <ClipboardList className="w-4 h-4" />;
    }
  };

  const handleExportPDF = () => {
    const doc = new jsPDF();
    const pw = doc.internal.pageSize.getWidth();
    const now = new Date();
    const dateStr = now.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });

    // Header
    doc.setFillColor(59, 130, 246);
    doc.rect(0, 0, pw, 28, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(18);
    doc.setFont('helvetica', 'bold');
    doc.text('SMARTFIX REPAIR HISTORY', 14, 14);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text('Comprehensive Repair Tasks Report', 14, 22);
    doc.setFontSize(9);
    doc.text(`Generated: ${dateStr}`, pw - 14, 14, { align: 'right' });
    if (dateFrom || dateTo) {
      doc.text(`Period: ${dateFrom || 'Start'} to ${dateTo || 'Now'}`, pw - 14, 22, { align: 'right' });
    }

    let y = 38;

    // Summary
    doc.setTextColor(31, 41, 55);
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.text('Summary', 14, y);
    y += 8;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    const summaryItems = [
      ['Total Tasks', formatNumber(totalTasks)],
      ['Pending/Assigned', formatNumber(pendingTasks)],
      ['In Progress', formatNumber(inProgressTasks)],
      ['Completed', formatNumber(completedTasks)],
      ['Escalated', formatNumber(escalatedTasks)],
      ['Active Technicians', formatNumber(uniqueTechnicians)],
    ];
    summaryItems.forEach(([label, value]) => {
      doc.setTextColor(107, 114, 128);
      doc.text(`${label}:`, 18, y);
      doc.setTextColor(31, 41, 55);
      doc.setFont('helvetica', 'bold');
      doc.text(value, 70, y);
      doc.setFont('helvetica', 'normal');
      y += 6;
    });
    y += 6;

    // Tasks table
    autoTable(doc, {
      startY: y,
      head: [['#', 'Date', 'Customer', 'Device', 'Technician', 'Status']],
      body: filtered.map((task, i) => [
        String(i + 1),
        task.createdAt ? new Date(task.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '-',
        task.customerName || '-',
        `${task.deviceType || 'Unknown'} ${task.deviceModel ? `(${task.deviceModel})` : ''}`.trim(),
        task.assignedTechnician?.fullName || 'Unassigned',
        String(task.status || 'PENDING').replace('_', ' ')
      ]),
      theme: 'grid',
      headStyles: { fillColor: [59, 130, 246], textColor: 255, fontStyle: 'bold', fontSize: 9 },
      bodyStyles: { fontSize: 8 },
      alternateRowStyles: { fillColor: [249, 250, 251] },
      margin: { left: 14, right: 14 },
    });

    // Footer
    const totalPgs = doc.internal.getNumberOfPages();
    for (let i = 1; i <= totalPgs; i++) {
      doc.setPage(i);
      doc.setFontSize(8);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(156, 163, 175);
      doc.text(
        `SmartFix — Repair History | Page ${i} of ${totalPgs}`,
        pw / 2, doc.internal.pageSize.getHeight() - 8,
        { align: 'center' }
      );
    }

    doc.save(`Repair_History_${now.toISOString().split('T')[0]}.pdf`);
    toast.success('PDF downloaded');
  };

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="flex items-center justify-between mb-6">
        <PageHeader title="Repair Task History" subtitle="Complete overview of all repair tasks and their status" />
        <button
          onClick={handleExportPDF}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700"
        >
          <FileText className="w-4 h-4" /> Export PDF
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-6 gap-4 mb-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 border-l-4 border-l-blue-400 p-4">
          <p className="text-xs font-medium text-gray-500 uppercase">Total Tasks</p>
          <p className="text-2xl font-bold text-blue-600 mt-1">{formatNumber(totalTasks)}</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 border-l-4 border-l-yellow-400 p-4">
          <p className="text-xs font-medium text-gray-500 uppercase">Pending</p>
          <p className="text-2xl font-bold text-yellow-600 mt-1">{formatNumber(pendingTasks)}</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 border-l-4 border-l-purple-400 p-4">
          <p className="text-xs font-medium text-gray-500 uppercase">In Progress</p>
          <p className="text-2xl font-bold text-purple-600 mt-1">{formatNumber(inProgressTasks)}</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 border-l-4 border-l-green-400 p-4">
          <p className="text-xs font-medium text-gray-500 uppercase">Completed</p>
          <p className="text-2xl font-bold text-green-600 mt-1">{formatNumber(completedTasks)}</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 border-l-4 border-l-red-400 p-4">
          <p className="text-xs font-medium text-gray-500 uppercase">Escalated</p>
          <p className="text-2xl font-bold text-red-600 mt-1">{formatNumber(escalatedTasks)}</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 border-l-4 border-l-indigo-400 p-4">
          <p className="text-xs font-medium text-gray-500 uppercase">Technicians</p>
          <p className="text-2xl font-bold text-indigo-600 mt-1">{formatNumber(uniqueTechnicians)}</p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <div className="md:col-span-2 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              placeholder="Search by customer, device, technician, or task ID..."
              className="w-full pl-10 pr-4 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Status</label>
            <select
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value)}
              className="w-full px-3 py-2 border rounded-lg text-sm"
            >
              <option value="all">All Status</option>
              <option value="pending">Pending</option>
              <option value="assigned">Assigned</option>
              <option value="in_progress">In Progress</option>
              <option value="completed">Completed</option>
              <option value="escalated">Escalated</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">From</label>
            <input
              type="date"
              value={dateFrom}
              onChange={e => setDateFrom(e.target.value)}
              className="w-full px-3 py-2 border rounded-lg text-sm"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">To</label>
            <input
              type="date"
              value={dateTo}
              onChange={e => setDateTo(e.target.value)}
              className="w-full px-3 py-2 border rounded-lg text-sm"
            />
          </div>
        </div>
      </div>

      {/* Repair Tasks Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        {loading ? (
          <LoadingState message="Loading repair task history..." />
        ) : filtered.length === 0 ? (
          <div className="p-6">
            <EmptyState title="No repair tasks found" description="Try adjusting your search or filters." />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase w-8"></th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Task #</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date Created</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Customer</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Device</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Technician</th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {pageItems.map(task => {
                  const isExpanded = expandedTaskId === task.id;
                  return (
                    <React.Fragment key={task.id}>
                      <tr
                        onClick={() => setExpandedTaskId(isExpanded ? null : task.id)}
                        className="hover:bg-gray-50 cursor-pointer transition-colors"
                      >
                        <td className="px-4 py-3 text-gray-400">
                          {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                        </td>
                        <td className="px-4 py-3 text-sm font-mono text-gray-700">#{task.id}</td>
                        <td className="px-4 py-3 text-sm text-gray-600">{formatDate(task.createdAt)}</td>
                        <td className="px-4 py-3">
                          <p className="text-sm font-medium text-gray-900">{task.customerName || 'Walk-in'}</p>
                          {task.customerRef && (
                            <p className="text-xs text-gray-400">Ref: {task.customerRef}</p>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <p className="text-sm font-medium text-gray-900">{task.deviceType || 'Unknown Device'}</p>
                          {task.deviceModel && (
                            <p className="text-xs text-gray-500">{task.deviceModel}</p>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          {task.assignedTechnician ? (
                            <div className="flex items-center gap-2">
                              <User className="w-4 h-4 text-gray-400" />
                              <span className="text-sm text-gray-900">{task.assignedTechnician.fullName}</span>
                            </div>
                          ) : (
                            <span className="text-sm text-gray-400">Unassigned</span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-center">
                          <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium border ${getStatusBadge(task.status)}`}>
                            {getStatusIcon(task.status)}
                            {String(task.status || 'PENDING').replace('_', ' ')}
                          </span>
                        </td>
                      </tr>
                      {isExpanded && (
                        <tr>
                          <td colSpan={7} className="px-4 py-0">
                            <div className="bg-gray-50 rounded-lg p-4 mb-3 mx-4">
                              <p className="text-xs font-semibold text-gray-500 uppercase mb-3">Task Details</p>
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                  <h4 className="text-sm font-medium text-gray-900 mb-2">Customer Information</h4>
                                  <div className="space-y-1 text-sm text-gray-600">
                                    <p><span className="font-medium">Name:</span> {task.customerName || 'N/A'}</p>
                                    {task.customerEmail && <p><span className="font-medium">Email:</span> {task.customerEmail}</p>}
                                    {task.customerPhone && <p><span className="font-medium">Phone:</span> {task.customerPhone}</p>}
                                    {task.customerRef && <p><span className="font-medium">Reference:</span> {task.customerRef}</p>}
                                  </div>
                                </div>
                                <div>
                                  <h4 className="text-sm font-medium text-gray-900 mb-2">Task Information</h4>
                                  <div className="space-y-1 text-sm text-gray-600">
                                    <p><span className="font-medium">Created:</span> {formatDate(task.createdAt)}</p>
                                    {task.assignedAt && <p><span className="font-medium">Assigned:</span> {formatDate(task.assignedAt)}</p>}
                                    <p><span className="font-medium">Status:</span> {String(task.status || 'PENDING').replace('_', ' ')}</p>
                                  </div>
                                </div>
                              </div>
                              {task.repairNote && (
                                <div className="mt-4">
                                  <h4 className="text-sm font-medium text-gray-900 mb-2">Repair Notes</h4>
                                  <p className="text-sm text-gray-600 bg-white p-3 rounded border">{task.repairNote}</p>
                                </div>
                              )}
                              {task.escalationNote && (
                                <div className="mt-4">
                                  <h4 className="text-sm font-medium text-red-700 mb-2">Escalation Notes</h4>
                                  <p className="text-sm text-red-600 bg-red-50 p-3 rounded border border-red-200">{task.escalationNote}</p>
                                </div>
                              )}
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Pagination */}
      {filtered.length > pageSize && (
        <div className="flex items-center justify-between mt-4">
          <p className="text-sm text-gray-500">
            Showing {formatNumber((currentPage - 1) * pageSize + 1)}–{formatNumber(Math.min(currentPage * pageSize, filtered.length))} of {formatNumber(filtered.length)} tasks
          </p>
          <div className="flex gap-2">
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={currentPage <= 1}
              className={`px-3 py-1 rounded border text-sm ${currentPage <= 1 ? 'text-gray-400 bg-gray-100' : 'bg-white hover:bg-gray-50'}`}
            >Prev</button>
            <span className="px-3 py-1 text-sm text-gray-600">Page {currentPage} / {totalPages}</span>
            <button
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={currentPage >= totalPages}
              className={`px-3 py-1 rounded border text-sm ${currentPage >= totalPages ? 'text-gray-400 bg-gray-100' : 'bg-white hover:bg-gray-50'}`}
            >Next</button>
          </div>
        </div>
      )}
    </div>
  );
};