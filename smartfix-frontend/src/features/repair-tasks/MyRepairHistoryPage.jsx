import React, { useEffect, useState, useMemo } from 'react';
import { useSelector } from 'react-redux';
import {
  Search, ChevronDown, ChevronUp, Wrench,
  Clock, CheckCircle, AlertTriangle, User,
  FileText, ClipboardList
} from 'lucide-react';
import toast from 'react-hot-toast';
import { PageHeader } from '../../shared/components/Common/PageHeader';
import { LoadingState } from '../../shared/components/Common/LoadingState';
import { EmptyState } from '../../shared/components/Common/EmptyState';

const SYSTEM_BACKEND_BASE_URL = process.env.REACT_APP_SYSTEM_BACKEND_URL || 'http://localhost:8080';

const formatDate = (d) => {
  if (!d) return 'N/A';
  return new Date(d).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
};

export const MyRepairHistoryPage = () => {
  const { user } = useSelector((state) => state.auth);

  const [allTasks, setAllTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [expandedTaskId, setExpandedTaskId] = useState(null);
  const [page, setPage] = useState(1);
  const pageSize = 15;

  useEffect(() => {
    const fetchTasks = async () => {
      try {
        const res = await fetch(`${SYSTEM_BACKEND_BASE_URL}/api/repair-tasks`);
        if (res.ok) {
          const data = await res.json();
          // Only keep tasks assigned to this technician
          const mine = (Array.isArray(data) ? data : []).filter(
            (t) => t.assignedTechnicianId === user?.id || t.assignedTechnician?.id === user?.id
          );
          setAllTasks(mine);
        } else {
          toast.error('Failed to load repair history');
        }
      } catch {
        toast.error('Cannot connect to server');
      } finally {
        setLoading(false);
      }
    };
    if (user?.id) fetchTasks();
  }, [user?.id]);

  const sorted = useMemo(
    () => [...allTasks].sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0)),
    [allTasks]
  );

  const filtered = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();
    return sorted.filter((task) => {
      if (q) {
        const haystack = [
          task.customerName, task.deviceType, task.deviceModel,
          task.repairNote, task.repairAction, String(task.id)
        ].join(' ').toLowerCase();
        if (!haystack.includes(q)) return false;
      }
      if (statusFilter !== 'all') {
        if (String(task.status || '').toLowerCase() !== statusFilter) return false;
      }
      return true;
    });
  }, [sorted, searchTerm, statusFilter]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const currentPage = Math.min(page, totalPages);
  const pageItems = filtered.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  useEffect(() => setPage(1), [searchTerm, statusFilter]);

  const completedCount  = allTasks.filter(t => String(t.status||'').toUpperCase() === 'COMPLETED').length;
  const inProgressCount = allTasks.filter(t => String(t.status||'').toUpperCase() === 'IN_PROGRESS').length;
  const escalatedCount  = allTasks.filter(t => String(t.status||'').toUpperCase() === 'ESCALATED').length;

  const getStatusBadge = (status) => {
    const n = String(status || '').toUpperCase();
    switch (n) {
      case 'PENDING':
      case 'ASSIGNED':   return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'IN_PROGRESS':return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'COMPLETED':  return 'bg-green-100 text-green-800 border-green-200';
      case 'ESCALATED':  return 'bg-red-100 text-red-800 border-red-200';
      default:           return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusIcon = (status) => {
    const n = String(status || '').toUpperCase();
    if (['PENDING','ASSIGNED'].includes(n)) return <Clock className="w-3 h-3" />;
    if (n === 'IN_PROGRESS') return <Wrench className="w-3 h-3" />;
    if (n === 'COMPLETED') return <CheckCircle className="w-3 h-3" />;
    if (n === 'ESCALATED') return <AlertTriangle className="w-3 h-3" />;
    return <ClipboardList className="w-3 h-3" />;
  };

  if (loading) return <LoadingState message="Loading your repair history..." />;

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <PageHeader
        title="My Repair History"
        subtitle="All repair tasks that have been assigned to you"
      />

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-xl shadow-sm border-l-4 border-l-blue-400 p-4">
          <p className="text-xs font-medium text-gray-500 uppercase">Total Tasks</p>
          <p className="text-2xl font-bold text-blue-600 mt-1">{allTasks.length}</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm border-l-4 border-l-green-400 p-4">
          <p className="text-xs font-medium text-gray-500 uppercase">Completed</p>
          <p className="text-2xl font-bold text-green-600 mt-1">{completedCount}</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm border-l-4 border-l-purple-400 p-4">
          <p className="text-xs font-medium text-gray-500 uppercase">In Progress</p>
          <p className="text-2xl font-bold text-purple-600 mt-1">{inProgressCount}</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm border-l-4 border-l-red-400 p-4">
          <p className="text-xs font-medium text-gray-500 uppercase">Escalated</p>
          <p className="text-2xl font-bold text-red-600 mt-1">{escalatedCount}</p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="md:col-span-2 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by customer, device, repair notes..."
              className="w-full pl-10 pr-4 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
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
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        {filtered.length === 0 ? (
          <div className="p-6">
            <EmptyState title="No tasks found" description="No repair tasks match your search." />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase w-8"></th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Task #</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Customer</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Device</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Assigned By (Salesman)</th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {pageItems.map((task) => {
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
                          {task.customerPhone && (
                            <p className="text-xs text-gray-400">{task.customerPhone}</p>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <p className="text-sm font-medium text-gray-900">{task.deviceType || 'Unknown'}</p>
                          {task.deviceModel && (
                            <p className="text-xs text-gray-500">{task.deviceModel}</p>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          {(task.createdBySalesRepName || task.createdBySalesRep) ? (
                            <div className="flex items-center gap-1.5 mt-1 sm:mt-0 bg-blue-50/80 px-2 py-0.5 rounded border border-blue-100">
                              <User className="w-3.5 h-3.5 text-blue-600" />
                              <span className="text-xs font-medium text-blue-900">
                                {task.createdBySalesRepName || task.createdBySalesRep?.fullName}
                              </span>
                            </div>
                          ) : (
                            <span className="text-sm text-gray-400">Admin / Direct</span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-center">
                          <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium border ${getStatusBadge(task.status)}`}>
                            {getStatusIcon(task.status)}
                            {String(task.status || 'PENDING').replace('_', ' ')}
                          </span>
                        </td>
                      </tr>

                      {/* Expanded row */}
                      {isExpanded && (
                        <tr>
                          <td colSpan={7} className="px-4 py-0">
                            <div className="bg-gray-50 rounded-lg p-4 mb-3 mx-4">
                              <p className="text-xs font-semibold text-gray-500 uppercase mb-3">Task Details</p>
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                  <h4 className="text-sm font-medium text-gray-900 mb-2">Customer</h4>
                                  <div className="space-y-1 text-sm text-gray-600">
                                    <p><span className="font-medium">Name:</span> {task.customerName || 'N/A'}</p>
                                    {task.customerEmail && <p><span className="font-medium">Email:</span> {task.customerEmail}</p>}
                                    {task.customerPhone && <p><span className="font-medium">Phone:</span> {task.customerPhone}</p>}
                                  </div>
                                </div>
                                <div>
                                  <h4 className="text-sm font-medium text-gray-900 mb-2">Timeline</h4>
                                  <div className="space-y-1 text-sm text-gray-600">
                                    <p><span className="font-medium">Created:</span> {formatDate(task.createdAt)}</p>
                                    {task.assignedAt && <p><span className="font-medium">Assigned:</span> {formatDate(task.assignedAt)}</p>}
                                    {task.startedAt && <p><span className="font-medium">Started:</span> {formatDate(task.startedAt)}</p>}
                                    {task.completedAt && <p><span className="font-medium">Completed:</span> {formatDate(task.completedAt)}</p>}
                                    {task.repairDurationMinutes && <p><span className="font-medium">Duration:</span> {task.repairDurationMinutes} mins</p>}
                                  </div>
                                </div>
                              </div>
                              {task.repairNote && (
                                <div className="mt-4">
                                  <h4 className="text-sm font-medium text-gray-900 mb-1">Repair Notes (from Salesman)</h4>
                                  <p className="text-sm text-gray-600 bg-white p-3 rounded border">{task.repairNote}</p>
                                </div>
                              )}
                              {task.repairAction && (
                                <div className="mt-4">
                                  <h4 className="text-sm font-medium text-gray-900 mb-1">Actions Taken</h4>
                                  <p className="text-sm text-gray-600 bg-white p-3 rounded border">{task.repairAction}</p>
                                </div>
                              )}
                              {task.repairResult && (
                                <div className="mt-4">
                                  <h4 className="text-sm font-medium text-gray-900 mb-1">Repair Result</h4>
                                  <p className="text-sm text-gray-600 bg-white p-3 rounded border">{task.repairResult}</p>
                                </div>
                              )}
                              {task.escalationNote && (
                                <div className="mt-4">
                                  <h4 className="text-sm font-medium text-red-700 mb-1">Escalation Notes</h4>
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
            Showing {(currentPage - 1) * pageSize + 1}–{Math.min(currentPage * pageSize, filtered.length)} of {filtered.length} tasks
          </p>
          <div className="flex gap-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={currentPage <= 1}
              className={`px-3 py-1 rounded border text-sm ${currentPage <= 1 ? 'text-gray-400 bg-gray-100' : 'bg-white hover:bg-gray-50'}`}
            >Prev</button>
            <span className="px-3 py-1 text-sm text-gray-600">Page {currentPage} / {totalPages}</span>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage >= totalPages}
              className={`px-3 py-1 rounded border text-sm ${currentPage >= totalPages ? 'text-gray-400 bg-gray-100' : 'bg-white hover:bg-gray-50'}`}
            >Next</button>
          </div>
        </div>
      )}
    </div>
  );
};
