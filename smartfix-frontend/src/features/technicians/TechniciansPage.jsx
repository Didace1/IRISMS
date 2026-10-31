import React, { useEffect, useState, useMemo } from 'react';
import { useSelector } from 'react-redux';
import toast from 'react-hot-toast';
import {
  Users, Wrench, CheckCircle, AlertTriangle, Clock3,
  TrendingUp, X, ClipboardList, Star, Activity
} from 'lucide-react';

const SYSTEM_BACKEND_BASE_URL = process.env.REACT_APP_SYSTEM_BACKEND_URL || 'http://localhost:8080';

const initials = (name) =>
  (name || 'U').split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2);

const statusColor = (s) =>
  s === 'AVAILABLE' ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700';

const StatCard = ({ icon, label, value, accent }) => (
  <div className="bg-white rounded-xl shadow p-5 flex items-center gap-4">
    <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${accent} bg-opacity-10`}>
      {icon}
    </div>
    <div>
      <p className="text-sm text-gray-500">{label}</p>
      <p className="text-2xl font-bold text-gray-900">{value}</p>
    </div>
  </div>
);

export const TechniciansPage = () => {
  const { user } = useSelector((s) => s.auth);
  const isAdmin = user?.role === 'admin';

  const [technicians, setTechnicians] = useState([]);
  const [allTasks, setAllTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [assignModal, setAssignModal] = useState(null);
  const [assigning, setAssigning] = useState(false);
  const [viewModal, setViewModal] = useState(null);
  const [search, setSearch] = useState('');

  const loadData = async () => {
    try {
      const [techRes, taskRes] = await Promise.all([
        fetch(`${SYSTEM_BACKEND_BASE_URL}/api/technicians/workload`),
        fetch(`${SYSTEM_BACKEND_BASE_URL}/api/repair-tasks`),
      ]);
      const techs = techRes.ok ? await techRes.json() : [];
      const tasks = taskRes.ok ? await taskRes.json() : [];
      setTechnicians(Array.isArray(techs) ? techs : []);
      setAllTasks(Array.isArray(tasks) ? tasks : []);
    } catch {
      toast.error('Could not load technician data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadData(); }, []);

  const unassignedTasks = useMemo(
    () => allTasks.filter((t) => !t.assignedTechnician && ['PENDING'].includes((t.status || '').toUpperCase())),
    [allTasks]
  );

  const filtered = useMemo(() =>
    technicians.filter((t) => {
      const q = search.toLowerCase();
      return !q || (t.fullName || '').toLowerCase().includes(q) ||
        (t.specialization || '').toLowerCase().includes(q) ||
        (t.employeeId || '').toLowerCase().includes(q);
    }), [technicians, search]);

  const totalTasks    = technicians.reduce((a, t) => a + (t.totalTasks || 0), 0);
  const totalCompleted = technicians.reduce((a, t) => a + (t.completedTasks || 0), 0);
  const avgRate       = technicians.length
    ? Math.round(technicians.reduce((a, t) => a + (t.completionRate || 0), 0) / technicians.length)
    : 0;
  const busyCount     = technicians.filter((t) => t.status === 'BUSY').length;

  const handleAssignTask = async (taskId, techId) => {
    setAssigning(true);
    try {
      const res = await fetch(`${SYSTEM_BACKEND_BASE_URL}/api/repair-tasks/${taskId}/assign`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ technicianId: techId }),
      });
      if (!res.ok) throw new Error();
      toast.success('Task assigned successfully');
      setAssignModal(null);
      await loadData();
    } catch {
      toast.error('Failed to assign task');
    } finally {
      setAssigning(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600" />
      </div>
    );
  }

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Technician Management</h1>
        <p className="text-gray-500 text-sm mt-1">Monitor workload, performance, and task assignments</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <StatCard icon={<Users className="w-6 h-6 text-blue-600" />}   label="Total Technicians" value={technicians.length} accent="text-blue-600" />
        <StatCard icon={<Activity className="w-6 h-6 text-orange-500" />} label="Currently Busy"  value={busyCount}          accent="text-orange-500" />
        <StatCard icon={<CheckCircle className="w-6 h-6 text-green-600" />} label="Repairs Completed" value={totalCompleted} accent="text-green-600" />
        <StatCard icon={<TrendingUp className="w-6 h-6 text-purple-600" />} label="Avg Completion Rate" value={`${avgRate}%`} accent="text-purple-600" />
      </div>

      {/* Search + Assign button */}
      <div className="flex flex-wrap gap-3 items-center mb-5">
        <input
          type="text"
          placeholder="Search by name, specialization, employee ID..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="flex-1 min-w-[240px] px-4 py-2 border rounded-lg text-sm"
        />
        {isAdmin && unassignedTasks.length > 0 && (
          <span className="text-xs text-orange-600 font-medium bg-orange-50 border border-orange-200 px-3 py-1.5 rounded-lg">
            {unassignedTasks.length} unassigned task{unassignedTasks.length !== 1 ? 's' : ''} pending
          </span>
        )}
      </div>

      {/* Technician Cards */}
      {filtered.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <Users className="w-12 h-12 mx-auto mb-3 opacity-40" />
          <p className="text-lg font-medium">No technicians found</p>
          <p className="text-sm mt-1">Register technician accounts to see them here.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {filtered.map((tech) => (
            <div key={tech.id} className="bg-white rounded-xl shadow border border-gray-100 p-5">
              {/* Top row */}
              <div className="flex items-start gap-3 mb-4">
                <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-bold text-sm flex-shrink-0">
                  {initials(tech.fullName)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="font-semibold text-gray-900 text-sm">{tech.fullName}</p>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusColor(tech.status)}`}>
                      {tech.status}
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 mt-0.5 truncate">{tech.email}</p>
                  {tech.specialization && (
                    <p className="text-xs text-blue-600 mt-0.5 font-medium">{tech.specialization}</p>
                  )}
                  {tech.employeeId && (
                    <p className="text-xs text-gray-400">ID: {tech.employeeId}</p>
                  )}
                </div>
              </div>

              {/* Task Counts */}
              <div className="grid grid-cols-4 gap-1 text-center mb-4">
                {[
                  { label: 'Pending',     value: tech.pendingTasks,    color: 'text-yellow-600' },
                  { label: 'Active',      value: tech.inProgressTasks, color: 'text-blue-600'   },
                  { label: 'Done',        value: tech.completedTasks,  color: 'text-green-600'  },
                  { label: 'Escalated',   value: tech.escalatedTasks,  color: 'text-red-500'    },
                ].map(({ label, value, color }) => (
                  <div key={label} className="bg-gray-50 rounded-lg py-2">
                    <p className={`text-lg font-bold ${color}`}>{value || 0}</p>
                    <p className="text-xs text-gray-400">{label}</p>
                  </div>
                ))}
              </div>

              {/* Performance bar */}
              <div className="mb-4">
                <div className="flex justify-between text-xs text-gray-500 mb-1">
                  <span>Completion Rate</span>
                  <span className="font-semibold text-gray-700">{tech.completionRate || 0}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className={`h-2 rounded-full transition-all ${
                      (tech.completionRate || 0) >= 75 ? 'bg-green-500' :
                      (tech.completionRate || 0) >= 40 ? 'bg-yellow-500' : 'bg-red-400'
                    }`}
                    style={{ width: `${tech.completionRate || 0}%` }}
                  />
                </div>
              </div>

              {/* Certifications */}
              {tech.certifications && (
                <div className="mb-3">
                  <p className="text-xs text-gray-400 mb-1 flex items-center gap-1">
                    <Star className="w-3 h-3" /> Certifications
                  </p>
                  <p className="text-xs text-gray-600 line-clamp-2">{tech.certifications}</p>
                </div>
              )}

              {/* Actions */}
              <div className="flex gap-2 mt-2">
                <button
                  onClick={() => setViewModal(tech)}
                  className="flex-1 text-xs py-1.5 border rounded-lg text-gray-700 hover:bg-gray-50"
                >
                  View Tasks
                </button>
                {isAdmin && (
                  <button
                    onClick={() => setAssignModal(tech)}
                    className="flex-1 text-xs py-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                  >
                    Assign Task
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Assign Task Modal */}
      {assignModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-lg max-h-[80vh] flex flex-col">
            <div className="flex items-center justify-between px-5 py-4 border-b">
              <div>
                <h3 className="font-semibold text-gray-900">Assign Task to {assignModal.fullName}</h3>
                <p className="text-xs text-gray-500 mt-0.5">Select an unassigned repair task below</p>
              </div>
              <button onClick={() => setAssignModal(null)} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="overflow-y-auto flex-1 p-4">
              {unassignedTasks.length === 0 ? (
                <div className="text-center py-10 text-gray-400">
                  <ClipboardList className="w-10 h-10 mx-auto mb-2 opacity-40" />
                  <p>No unassigned tasks available</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {unassignedTasks.map((task) => (
                    <div key={task.id} className="border rounded-lg p-3 hover:bg-blue-50 cursor-pointer"
                      onClick={() => !assigning && handleAssignTask(task.id, assignModal.id)}>
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <p className="text-sm font-medium text-gray-900">
                            {task.deviceType || 'Device'}{task.deviceModel ? ` — ${task.deviceModel}` : ''}
                          </p>
                          {task.customerName && (
                            <p className="text-xs text-gray-500">Customer: {task.customerName}</p>
                          )}
                          {task.repairNote && (
                            <p className="text-xs text-gray-400 mt-0.5 line-clamp-2">{task.repairNote}</p>
                          )}
                          <p className="text-xs text-gray-400 mt-0.5">Task #{task.id}</p>
                        </div>
                        <span className="text-xs bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded-full whitespace-nowrap">
                          {task.status}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div className="px-5 py-3 border-t">
              <button onClick={() => setAssignModal(null)}
                className="w-full py-2 text-sm border rounded-lg text-gray-600 hover:bg-gray-50">
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* View Tasks Modal */}
      {viewModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-lg max-h-[80vh] flex flex-col">
            <div className="flex items-center justify-between px-5 py-4 border-b">
              <div>
                <h3 className="font-semibold text-gray-900">{viewModal.fullName}'s Tasks</h3>
                <p className="text-xs text-gray-500">{viewModal.totalTasks || 0} total assigned</p>
              </div>
              <button onClick={() => setViewModal(null)} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="overflow-y-auto flex-1 p-4">
              {allTasks.filter((t) => t.assignedTechnician?.id === viewModal.id).length === 0 ? (
                <div className="text-center py-10 text-gray-400">
                  <Wrench className="w-10 h-10 mx-auto mb-2 opacity-40" />
                  <p>No tasks assigned yet</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {allTasks.filter((t) => t.assignedTechnician?.id === viewModal.id).map((task) => (
                    <div key={task.id} className="border rounded-lg p-3 bg-gray-50">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <p className="text-sm font-medium text-gray-900">
                            {task.deviceType || 'Device'}{task.deviceModel ? ` — ${task.deviceModel}` : ''}
                          </p>
                          {task.repairNote && (
                            <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">{task.repairNote}</p>
                          )}
                          <p className="text-xs text-gray-400 mt-0.5">Task #{task.id}</p>
                        </div>
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium whitespace-nowrap ${
                          task.status === 'COMPLETED'   ? 'bg-green-100 text-green-700' :
                          task.status === 'IN_PROGRESS' ? 'bg-blue-100 text-blue-700'  :
                          task.status === 'ESCALATED'   ? 'bg-red-100 text-red-700'    :
                          'bg-yellow-100 text-yellow-700'
                        }`}>
                          {(task.status || '').replace('_', ' ')}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div className="px-5 py-3 border-t">
              <button onClick={() => setViewModal(null)}
                className="w-full py-2 text-sm border rounded-lg text-gray-600 hover:bg-gray-50">
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
