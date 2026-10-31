import React, { useEffect, useMemo, useState } from 'react';
import { ClipboardList, Clock3, UserCheck, Wrench, Plus, CheckCircle2 } from 'lucide-react';
import { useSelector } from 'react-redux';
import { PageHeader } from '../../shared/components/Common/PageHeader';
import { StatCard } from '../../shared/components/Common/StatCard';
import { EmptyState } from '../../shared/components/Common/EmptyState';
import toast from 'react-hot-toast';

const SYSTEM_BACKEND_BASE_URL = process.env.REACT_APP_SYSTEM_BACKEND_URL || 'http://localhost:8080';
const SALE_SERVICE_LOG_KEY = 'sales_device_service_log';

const STATUS_COLORS = {
  PENDING: 'bg-yellow-100 text-yellow-800',
  ASSIGNED: 'bg-blue-100 text-blue-800',
  IN_PROGRESS: 'bg-orange-100 text-orange-800',
  COMPLETED: 'bg-green-100 text-green-800',
  ESCALATED: 'bg-red-100 text-red-800'
};

export const SalesRepairPage = () => {
  const [repairTasks, setRepairTasks] = useState([]);
  const [technicians, setTechnicians] = useState([]);
  const [loading, setLoading] = useState(true);
  const { user } = useSelector((state) => state.auth);
  const [showNewTaskForm, setShowNewTaskForm] = useState(false);
  const [newTask, setNewTask] = useState({
    deviceType: '',
    deviceBrand: '',
    deviceModel: '',
    repairNote: '',
    technicianId: ''
  });

  const loadRepairTasks = async () => {
    try {
      const response = await fetch(`${SYSTEM_BACKEND_BASE_URL}/api/repair-tasks`);
      if (response.ok) {
        const data = await response.json();
        setRepairTasks(data);
      }
    } catch {
      // backend unreachable — rely on local data
    }
  };

  const loadTechnicians = async () => {
    try {
      const response = await fetch(`${SYSTEM_BACKEND_BASE_URL}/api/technicians`);
      if (response.ok) {
        const data = await response.json();
        setTechnicians(data);
      }
    } catch {
      setTechnicians([]);
    }
  };

  useEffect(() => {
    const init = async () => {
      setLoading(true);
      await Promise.all([loadRepairTasks(), loadTechnicians()]);
      setLoading(false);
    };
    init();
  }, []);

  const handleCreateTask = async (intake) => {
    const payload = {
      deviceType: intake?.serviceContext?.deviceType || intake?.deviceType || '',
      deviceBrand: intake?.serviceContext?.deviceBrand || intake?.deviceBrand || '',
      deviceModel: intake?.serviceContext?.deviceModel || intake?.deviceModel || '',
      repairNote: intake?.serviceContext?.repairNote || intake?.repairNote || '',
      technicianId: intake?.technicianId ? Number(intake.technicianId) : null
    };

    try {
      const response = await fetch(`${SYSTEM_BACKEND_BASE_URL}/api/repair-tasks`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'X-User-Id': user?.id?.toString() || ''
        },
        body: JSON.stringify(payload)
      });
      if (response.ok) {
        toast.success('Repair task created');
        await loadRepairTasks();
      } else {
        toast.error('Failed to create repair task');
      }
    } catch {
      toast.error('Backend not reachable');
    }
  };

  const handleCreateManualTask = async () => {
    if (!newTask.deviceType.trim()) {
      toast.error('Please enter device type');
      return;
    }
    const payload = {
      deviceType: newTask.deviceType,
      deviceBrand: newTask.deviceBrand,
      deviceModel: newTask.deviceModel,
      repairNote: newTask.repairNote,
      technicianId: newTask.technicianId ? Number(newTask.technicianId) : null
    };
    try {
      const res = await fetch(`${SYSTEM_BACKEND_BASE_URL}/api/repair-tasks`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'X-User-Id': user?.id?.toString() || ''
        },
        body: JSON.stringify(payload)
      });
      if (res.ok) {
        toast.success('Repair task created' + (payload.technicianId ? ' and technician assigned' : ''));
        setShowNewTaskForm(false);
        setNewTask({
          deviceType: '',
          deviceBrand: '',
          deviceModel: '',
          repairNote: '',
          technicianId: ''
        });
        await loadRepairTasks();
      } else {
        toast.error('Failed to create repair task');
      }
    } catch {
      toast.error('Backend not reachable');
    }
  };



  const handleAssignTechnician = async (taskId, technicianId) => {
    if (!technicianId) return;
    try {
      const response = await fetch(`${SYSTEM_BACKEND_BASE_URL}/api/repair-tasks/${taskId}/reassign`, {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          'X-User-Id': user?.id?.toString() || ''
        },
        body: JSON.stringify({ newTechnicianId: Number(technicianId) })
      });
      if (response.ok) {
        toast.success('Technician assigned successfully');
        await loadRepairTasks();
      } else {
        const err = await response.json();
        toast.error(err?.message || 'Assignment failed');
      }
    } catch {
      toast.error('Backend not reachable');
    }
  };

  const handleUpdateStatus = async (taskId, status) => {
    try {
      const response = await fetch(`${SYSTEM_BACKEND_BASE_URL}/api/repair-tasks/${taskId}/status`, {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          'X-User-Id': user?.id?.toString() || ''
        },
        body: JSON.stringify({ status })
      });
      if (response.ok) {
        toast.success(`Status updated to ${status}`);
        await loadRepairTasks();
      }
    } catch {
      toast.error('Backend not reachable');
    }
  };

  const handleCloseTask = async (taskId) => {
    try {
      const response = await fetch(`${SYSTEM_BACKEND_BASE_URL}/api/repair-tasks/${taskId}/feedback`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'X-User-Id': user?.id?.toString() || ''
        },
        body: JSON.stringify({ satisfied: false, comments: "Task closed by Sales Rep without further repair." })
      });
      if (response.ok) {
        toast.success('Task closed successfully');
        await loadRepairTasks();
      } else {
        const err = await response.json();
        toast.error(err?.message || 'Failed to close task');
      }
    } catch {
      toast.error('Backend not reachable');
    }
  };

  const pendingCount = repairTasks.filter((t) => t.status === 'PENDING').length;
  const assignedCount = repairTasks.filter((t) => t.status === 'ASSIGNED' || t.status === 'IN_PROGRESS').length;
  const completedCount = repairTasks.filter((t) => t.status === 'COMPLETED').length;

  const technicianWorkload = useMemo(() => {
    const map = {};
    repairTasks.forEach((t) => {
      if (t.assignedTechnicianId && t.status !== 'COMPLETED') {
        const id = t.assignedTechnicianId;
        map[id] = (map[id] || 0) + 1;
      }
    });
    return map;
  }, [repairTasks]);

  const techLabel = (tech) => {
    const active = technicianWorkload[tech.id] || 0;
    const badge = active === 0 ? 'No tasks' : `${active} task${active > 1 ? 's' : ''}`;
    return `${tech.fullName} — ${tech.specialization || 'General'} (${badge})`;
  };



  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <PageHeader
        title="Sales Repair Intake"
        subtitle="Create repair tasks and assign them to technicians"
      />

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
        <StatCard label="Total Tasks" value={repairTasks.length} accent="text-blue-600" icon={<ClipboardList className="w-8 h-8" />} />
        <StatCard label="Pending" value={pendingCount} accent="text-yellow-600" icon={<Clock3 className="w-8 h-8" />} />
        <StatCard label="Assigned / In Progress" value={assignedCount} accent="text-orange-600" icon={<UserCheck className="w-8 h-8" />} />
        <StatCard label="Completed" value={completedCount} accent="text-green-600" icon={<CheckCircle2 className="w-8 h-8" />} />
      </div>



      {/* New task form */}
      <div className="mb-6">
        <button
          type="button"
          onClick={() => setShowNewTaskForm(!showNewTaskForm)}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 inline-flex items-center gap-2 text-sm"
        >
          <Plus className="w-4 h-4" />
          New Repair Task
        </button>

        {showNewTaskForm && (
          <div className="mt-3 bg-white rounded-lg shadow p-5 border max-w-xl">
            <h3 className="font-semibold text-gray-900 mb-4">Create Repair Task</h3>
            <div className="space-y-3">
              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Device Type *</label>
                  <input
                    type="text"
                    placeholder="e.g. Laptop"
                    value={newTask.deviceType}
                    onChange={(e) => setNewTask({ ...newTask, deviceType: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Device Brand</label>
                  <input
                    type="text"
                    placeholder="e.g. HP, Apple"
                    value={newTask.deviceBrand}
                    onChange={(e) => setNewTask({ ...newTask, deviceBrand: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Device Model</label>
                  <input
                    type="text"
                    placeholder="e.g. EliteBook"
                    value={newTask.deviceModel}
                    onChange={(e) => setNewTask({ ...newTask, deviceModel: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg text-sm"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Repair Note</label>
                <input
                  type="text"
                  placeholder="Describe the issue..."
                  value={newTask.repairNote}
                  onChange={(e) => setNewTask({ ...newTask, repairNote: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Assign Technician</label>
                <select
                  value={newTask.technicianId}
                  onChange={(e) => setNewTask({ ...newTask, technicianId: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg text-sm"
                >
                  <option value="">Select technician (optional)</option>
                  {[...technicians]
                    .sort((a, b) => (technicianWorkload[a.id] || 0) - (technicianWorkload[b.id] || 0))
                    .map((tech) => (
                      <option key={tech.id} value={tech.id}>{techLabel(tech)}</option>
                    ))}
                </select>
                {technicians.length > 0 && (
                  <p className="text-xs text-gray-400 mt-1">Technicians sorted by fewest active tasks first</p>
                )}
              </div>
              <div className="flex gap-2 pt-1">
                <button
                  type="button"
                  onClick={handleCreateManualTask}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm font-medium"
                >
                  Create Task
                </button>
                <button
                  type="button"
                  onClick={() => setShowNewTaskForm(false)}
                  className="px-4 py-2 border rounded-lg text-sm text-gray-600 hover:bg-gray-50"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Repair tasks list */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-bold mb-4">Repair Tasks</h2>

        {loading ? (
          <p className="text-gray-500">Loading...</p>
        ) : repairTasks.length === 0 ? (
          <EmptyState
            title="No repair tasks yet"
            description="Create a repair task from a checkout intake or manually using the button above."
          />
        ) : (
          <div className="space-y-4">
            {[...repairTasks]
              .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
              .map((task) => (
                <div key={task.id} className="border rounded-lg p-4 bg-gray-50">
                  <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-3">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${STATUS_COLORS[task.status] || 'bg-gray-100 text-gray-700'}`}>
                          {task.status}
                        </span>
                        <span className="text-xs text-gray-400">#{task.id}</span>
                      </div>
                      <p className="font-semibold text-gray-900">
                        {task.deviceType || 'Unknown Device'}
                        {task.deviceBrand ? ` — ${task.deviceBrand}` : ''}
                        {task.deviceModel ? ` ${task.deviceModel}` : ''}
                      </p>
                      <p className="text-xs text-gray-500">
                        Created: {new Date(task.createdAt).toLocaleString()}
                      </p>
                    </div>

                    <div className="space-y-2 min-w-[220px]">
                      {task.assignedTechnicianId ? (
                        <div className="text-sm bg-blue-50 rounded-lg p-2 border border-blue-200">
                          <p className="text-xs font-semibold text-blue-800">Assigned to:</p>
                          <p className="font-medium text-blue-900">{task.assignedTechnicianName}</p>
                          <p className="text-xs text-blue-700">
                            {technicians.find(t => t.id === task.assignedTechnicianId)?.specialization || ''}
                          </p>
                          {task.assignedAt && (
                            <p className="text-xs text-blue-600 mt-1">
                              on {new Date(task.assignedAt).toLocaleString()}
                            </p>
                          )}
                        </div>
                      ) : (
                        <div className="text-sm bg-yellow-50 rounded-lg p-2 border border-yellow-200">
                          <p className="text-xs font-semibold text-yellow-800">Status:</p>
                          <p className="font-medium text-yellow-900">Pending</p>
                        </div>
                      )}


                      {task.status === 'IN_PROGRESS' && (
                        <p className="text-xs text-orange-600 font-medium mt-1">⏳ Awaiting technician completion</p>
                      )}
                      {task.status === 'ESCALATED' && (
                        <div className="mt-1 space-y-2">
                          <div className="bg-red-50 border border-red-200 rounded-lg px-3 py-2">
                            <p className="text-xs font-semibold text-red-700">⚠️ Technician could not complete</p>
                            {task.escalationNote && (
                              <p className="text-xs text-red-600 mt-0.5">{task.escalationNote}</p>
                            )}
                          </div>
                          <div className="flex items-end gap-2">
                            <div className="flex-1">
                              <label className="block text-xs font-medium text-gray-600 mb-1">Reassign (optional)</label>
                              <select
                                defaultValue=""
                                onChange={(e) => handleAssignTechnician(task.id, e.target.value)}
                                className="w-full px-2 py-1.5 border rounded-lg text-sm"
                              >
                                <option value="" disabled>Select technician...</option>
                                {[...technicians]
                                  .sort((a, b) => (technicianWorkload[a.id] || 0) - (technicianWorkload[b.id] || 0))
                                  .map((tech) => (
                                    <option key={tech.id} value={tech.id}>{techLabel(tech)}</option>
                                  ))}
                              </select>
                            </div>
                            <button
                              onClick={() => handleCloseTask(task.id)}
                              className="px-3 py-1.5 bg-gray-600 text-white text-sm font-medium rounded-lg hover:bg-gray-700 whitespace-nowrap"
                            >
                              Close Task
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                </div>
              ))}
          </div>
        )}
      </div>
    </div>
  );
};
