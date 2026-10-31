import React, { useEffect, useMemo, useState } from 'react';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { CheckCircle, Clock3, AlertTriangle, ClipboardList } from 'lucide-react';
import { PageHeader } from '../../shared/components/Common/PageHeader';
import { LoadingState } from '../../shared/components/Common/LoadingState';
import { EmptyState } from '../../shared/components/Common/EmptyState';
import { StatCard } from '../../shared/components/Common/StatCard';

const LOCAL_TASKS_KEY = 'technician_repair_tasks';

export const RepairTasksPage = () => {
  const SYSTEM_BACKEND_BASE_URL = process.env.REACT_APP_SYSTEM_BACKEND_URL || 'http://localhost:8080';
  const { user } = useSelector((state) => state.auth);
  const navigate = useNavigate();

  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [startingTaskId, setStartingTaskId] = useState(null);
  const [escalatingTaskId, setEscalatingTaskId] = useState(null);
  const [escalationNotes, setEscalationNotes] = useState({});
  const [completingTaskId, setCompletingTaskId] = useState(null);

  const loadTasks = async () => {
    try {
      const response = await fetch(`${SYSTEM_BACKEND_BASE_URL}/api/repair-tasks`);
      if (!response.ok) throw new Error();
      const data = await response.json();
      const normalized = Array.isArray(data) ? data : [];
      const myTasks = (user?.id && user?.role !== 'admin')
        ? normalized.filter((t) => t.assignedTechnicianId === user.id || t.assignedTechnician?.id === user.id)
        : normalized;
      setTasks(myTasks);
    } catch {
      setTasks(JSON.parse(localStorage.getItem(LOCAL_TASKS_KEY) || '[]'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadTasks(); }, [SYSTEM_BACKEND_BASE_URL, user?.id]);

  const normalize = (s) => String(s || '').toUpperCase();

  const pendingCount   = useMemo(() => tasks.filter((t) => ['PENDING','ASSIGNED'].includes(normalize(t.status))).length, [tasks]);
  const inProgressCount = useMemo(() => tasks.filter((t) => normalize(t.status) === 'IN_PROGRESS').length, [tasks]);
  const completedCount  = useMemo(() => tasks.filter((t) => normalize(t.status) === 'COMPLETED').length, [tasks]);
  const activeTasks     = useMemo(() => tasks.filter((t) => normalize(t.status) !== 'COMPLETED'), [tasks]);

  const handleStartWork = async (taskId) => {
    setStartingTaskId(taskId);
    try {
      const res = await fetch(`${SYSTEM_BACKEND_BASE_URL}/api/repair-tasks/${taskId}/start`, {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          'X-User-Id': user?.id?.toString() || ''
        }
      });
      if (!res.ok) throw new Error();
      toast.success('Task marked as In Progress.');
      await loadTasks();
    } catch {
      setTasks((prev) => prev.map((t) => String(t.id) === String(taskId) ? { ...t, status: 'IN_PROGRESS' } : t));
      toast.success('Task started (local mode).');
    } finally {
      setStartingTaskId(null);
    }
  };

  const handleEscalate = async (taskId) => {
    const note = (escalationNotes[taskId] || '').trim();
    if (!note) {
      toast.error('Please describe why the task cannot be completed.');
      return;
    }
    setEscalatingTaskId(taskId);
    try {
      const res = await fetch(`${SYSTEM_BACKEND_BASE_URL}/api/repair-tasks/${taskId}/escalate`, {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          'X-User-Id': user?.id?.toString() || ''
        },
        body: JSON.stringify({ escalationNote: note })
      });
      if (!res.ok) throw new Error();
      toast.success('Task escalated. Admin/manager has been notified.');
      setEscalationNotes((prev) => { const n = { ...prev }; delete n[taskId]; return n; });
      await loadTasks();
    } catch {
      toast.error('Failed to escalate. Please try again.');
    } finally {
      setEscalatingTaskId(null);
    }
  };

  const handleCompleteRepair = async (taskId) => {
    setCompletingTaskId(taskId);
    try {
      const res = await fetch(
        `${SYSTEM_BACKEND_BASE_URL}/api/repair-tasks/${taskId}/complete`,
        {
          method: 'PUT',
          headers: { 
            'Content-Type': 'application/json',
            'X-User-Id': user?.id?.toString() || ''
          },
          body: JSON.stringify({})
        }
      );
      
      if (!res.ok) throw new Error();
      
      toast.success('✅ Repair completed successfully!');
      await loadTasks();
      if (user?.role === 'admin') {
        navigate('/repair-history');
      } else {
        navigate('/my-repair-history');
      }
    } catch {
      toast.error('Failed to complete repair. Please try again.');
    } finally {
      setCompletingTaskId(null);
    }
  };

  const getPriorityBadge = (priority) => {
    const normalized = String(priority || 'normal').toLowerCase();
    if (normalized === 'urgent' || normalized === 'high') return 'bg-red-100 text-red-700';
    if (normalized === 'normal') return 'bg-amber-100 text-amber-700';
    return 'bg-gray-100 text-gray-700';
  };

  if (loading) {
    return <LoadingState message="Loading repair tasks..." />;
  }

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <PageHeader
        title="My Repair Tasks"
        subtitle="Track assigned repairs and approve completion"
      />

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
        <StatCard label="Pending" value={pendingCount} accent="text-red-600" icon={<AlertTriangle />} />
        <StatCard label="In Progress" value={inProgressCount} accent="text-blue-600" icon={<Clock3 />} />
        <StatCard label="Completed" value={completedCount} accent="text-green-600" icon={<CheckCircle />} />
        <StatCard label="Total Assigned" value={tasks.length} accent="text-purple-600" icon={<ClipboardList />} />
      </div>

      {activeTasks.length === 0 ? (
        <EmptyState
          title="No active repair tasks"
          description="You have no pending tasks right now."
        />
      ) : (
        <div className="space-y-4">
          {activeTasks.map((task) => (
            <div key={task.id} className="bg-white rounded-lg shadow p-5 border border-gray-100">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                <div>
                  <p className="font-semibold text-gray-900">
                    {task.deviceType || task.title || 'Repair Task'}
                    {task.deviceModel ? ` — ${task.deviceModel}` : ''}
                  </p>
                  {task.repairNote && (
                    <p className="text-sm text-gray-600 mt-1">{task.repairNote}</p>
                  )}
                  <div className="flex flex-col gap-1 mt-2">
                    {(task.createdBySalesRepName || task.createdBySalesRep) && (
                      <div className="text-xs text-gray-500">
                        🧑‍💼 Assigned by: {task.createdBySalesRepName || task.createdBySalesRep?.fullName}
                      </div>
                    )}
                    {(task.assignedTechnicianId || task.assignedTechnician) && user?.role === 'admin' && (
                      <div className="text-xs text-blue-600 font-medium">
                        🔧 Technician: {task.assignedTechnician?.fullName || task.assignedTechnicianName || 'Unknown'}
                      </div>
                    )}
                  </div>
                  <p className="text-xs text-gray-400 mt-1">Task #{task.id}</p>
                </div>

                <div className="flex flex-col gap-2 min-w-[190px]">
                  {String(task.priority || 'normal').toLowerCase() !== 'normal' && (
                    <span className={`inline-flex self-start px-2 py-1 rounded-full text-xs font-semibold ${getPriorityBadge(task.priority)}`}>
                      {String(task.priority || 'normal').toUpperCase()}
                    </span>
                  )}
                  <span className="text-xs text-gray-500">
                    Status: <span className="font-semibold">{String(task.status || '').replace('_', ' ')}</span>
                  </span>
                  {['PENDING','ASSIGNED'].includes(normalize(task.status)) && (
                    <button
                      type="button"
                      disabled={startingTaskId === task.id}
                      onClick={() => handleStartWork(task.id)}
                      className="mt-1 px-3 py-2 rounded-lg bg-orange-500 text-white text-sm font-medium hover:bg-orange-600 disabled:bg-gray-400"
                    >
                      {startingTaskId === task.id ? 'Starting...' : 'Start Work'}
                    </button>
                  )}
                  {normalize(task.status) === 'IN_PROGRESS' && (
                    <div className="flex flex-col gap-2">
                      <button
                        type="button"
                        disabled={completingTaskId === task.id}
                        onClick={() => handleCompleteRepair(task.id)}
                        className="px-3 py-2 rounded-lg bg-green-600 text-white text-sm font-medium hover:bg-green-700 disabled:bg-gray-400"
                      >
                        {completingTaskId === task.id ? 'Completing...' : 'Complete Repair'}
                      </button>

                      {escalationNotes[task.id] === undefined ? (
                        <button
                          type="button"
                          onClick={() => setEscalationNotes((prev) => ({ ...prev, [task.id]: '' }))}
                          className="px-3 py-2 rounded-lg bg-red-50 border border-red-300 text-red-700 text-sm font-medium hover:bg-red-100"
                        >
                          Cannot Complete
                        </button>
                      ) : (
                        <div className="space-y-1.5">
                          <p className="text-xs font-medium text-red-700">Reason task cannot be completed:</p>
                          <textarea
                            rows={3}
                            value={escalationNotes[task.id]}
                            onChange={(e) => setEscalationNotes((prev) => ({ ...prev, [task.id]: e.target.value }))}
                            placeholder="Describe the issue (e.g. requires specialised parts, beyond repair...)" 
                            className="w-full px-2 py-1.5 border border-red-300 rounded-lg text-xs resize-none focus:ring-2 focus:ring-red-400"
                          />
                          <div className="flex gap-1">
                            <button
                              type="button"
                              disabled={escalatingTaskId === task.id}
                              onClick={() => handleEscalate(task.id)}
                              className="flex-1 px-2 py-1.5 rounded-lg bg-red-600 text-white text-xs font-semibold hover:bg-red-700 disabled:bg-gray-400"
                            >
                              {escalatingTaskId === task.id ? 'Submitting...' : 'Submit Escalation'}
                            </button>
                            <button
                              type="button"
                              onClick={() => setEscalationNotes((prev) => { const n = { ...prev }; delete n[task.id]; return n; })}
                              className="px-2 py-1.5 rounded-lg border text-xs text-gray-600 hover:bg-gray-50"
                            >
                              Cancel
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
