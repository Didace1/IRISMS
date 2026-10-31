import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { Wrench, CheckCircle, Clock, TrendingUp, AlertCircle, ClipboardList, PlayCircle, Package } from 'lucide-react';

export const TechnicianDashboard = ({ stats }) => {
  const SYSTEM_BACKEND_BASE_URL = process.env.REACT_APP_SYSTEM_BACKEND_URL || 'http://localhost:8080';
  const { user } = useSelector((state) => state.auth);
  const [requests, setRequests] = useState([]);
  const [loadingRequests, setLoadingRequests] = useState(true);

  useEffect(() => {
    const fetchRequests = async () => {
      try {
        const response = await fetch(`${SYSTEM_BACKEND_BASE_URL}/api/spare-part-requests`);
        if (response.ok) {
          const data = await response.json();
          const myRequests = data.filter(req => req.requestedBy === (user?.fullName || user?.username));
          myRequests.sort((a, b) => new Date(b.requestDate || b.id) - new Date(a.requestDate || a.id));
          setRequests(myRequests.slice(0, 5)); // Show recent 5
        }
      } catch (error) {
        console.error('Failed to fetch requests', error);
      } finally {
        setLoadingRequests(false);
      }
    };
    if (user) {
      fetchRequests();
    }
  }, [user, SYSTEM_BACKEND_BASE_URL]);

  const assignedTasks = Number(stats?.myTasks || 0);
  const completedToday = Number(stats?.completedToday || 0);
  const pendingRepairs = Number(stats?.pendingRepairs || 0);
  const successRate = Number(stats?.successRate || 0);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg shadow p-8 border-l-4 border-blue-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-base font-medium">Assigned Tasks</p>
              <p className="text-4xl font-bold text-blue-600 mt-2">{assignedTasks}</p>
            </div>
            <ClipboardList className="w-12 h-12 text-blue-300" />
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-8 border-l-4 border-blue-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-base font-medium">Completed Today</p>
              <p className="text-4xl font-bold text-blue-600 mt-2">{completedToday}</p>
            </div>
            <CheckCircle className="w-12 h-12 text-blue-300" />
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-8 border-l-4 border-blue-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-base font-medium">Pending Repairs</p>
              <p className="text-4xl font-bold text-blue-600 mt-2">{pendingRepairs}</p>
            </div>
            <Wrench className="w-12 h-12 text-blue-300" />
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-8 border-l-4 border-blue-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-base font-medium">Success Rate</p>
              <p className="text-4xl font-bold text-blue-600 mt-2">{successRate}%</p>
            </div>
            <TrendingUp className="w-12 h-12 text-blue-300" />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white rounded-lg shadow p-8">
          <h3 className="text-xl font-semibold text-gray-900 mb-6">Technician Workflow</h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 rounded-lg bg-blue-50 border border-blue-100">
              <div className="flex items-center gap-4">
                <ClipboardList className="w-6 h-6 text-blue-600" />
                <span className="text-gray-800 text-base font-medium">Tasks assigned to you</span>
              </div>
              <span className="text-base font-semibold text-blue-700">{assignedTasks} assigned</span>
            </div>
            <div className="flex items-center justify-between p-4 rounded-lg bg-amber-50 border border-amber-100">
              <div className="flex items-center gap-4">
                <Wrench className="w-6 h-6 text-amber-600" />
                <span className="text-gray-800 text-base font-medium">Repair jobs waiting for completion</span>
              </div>
              <span className="text-base font-semibold text-amber-700">{pendingRepairs} pending</span>
            </div>
            <div className="flex items-center justify-between p-4 rounded-lg bg-green-50 border border-green-100">
              <div className="flex items-center gap-4">
                <CheckCircle className="w-6 h-6 text-green-600" />
                <span className="text-gray-800 text-base font-medium">Completed today</span>
              </div>
              <span className="text-base font-semibold text-green-700">{completedToday} done</span>
            </div>
            <div className="flex items-center justify-between p-4 rounded-lg bg-purple-50 border border-purple-100">
              <div className="flex items-center gap-4">
                <TrendingUp className="w-6 h-6 text-purple-600" />
                <span className="text-gray-800 text-base font-medium">Your success rate</span>
              </div>
              <span className="text-base font-semibold text-purple-700">{successRate}%</span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-8">
          <h3 className="text-xl font-semibold text-gray-900 mb-6">Current Focus</h3>
          <div className="space-y-4">
            <div className="p-4 rounded-lg bg-gray-50 border">
              <p className="text-sm text-gray-500 uppercase tracking-wide font-semibold">Next Task</p>
              <p className="text-base font-medium text-gray-800 mt-2">
                {stats?.nextTask || 'Review pending repair queue'}
              </p>
            </div>
            <div className="p-4 rounded-lg bg-gray-50 border">
              <p className="text-sm text-gray-500 uppercase tracking-wide font-semibold">Average Repair Time</p>
              <p className="text-base font-medium text-gray-800 mt-2">
                {stats?.avgRepairTime ? `${stats.avgRepairTime} mins` : 'N/A'}
              </p>
            </div>
            <div className="p-4 rounded-lg bg-gray-50 border">
              <p className="text-sm text-gray-500 uppercase tracking-wide font-semibold">Weekly Completed</p>
              <p className="text-base font-medium text-gray-800 mt-2">
                {stats?.weeklyCompleted || 0} tasks
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold mb-4">Quick Actions</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Link
            to="/my-repair-tasks"
            className="p-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 text-center font-medium"
          >
            Open My Tasks
          </Link>
          <Link
            to="/request-spare-parts"
            className="p-3 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 text-center font-medium"
          >
            Request Spare Parts
          </Link>
        </div>
      </div>
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <Package className="w-5 h-5 text-gray-500" />
          Recent Spare Part Requests
        </h3>
        {loadingRequests ? (
          <p className="text-sm text-gray-500">Loading requests...</p>
        ) : requests.length === 0 ? (
          <p className="text-sm text-gray-500">No spare part requests found.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="py-3 px-4 text-sm font-semibold text-gray-600">Part</th>
                  <th className="py-3 px-4 text-sm font-semibold text-gray-600">Quantity</th>
                  <th className="py-3 px-4 text-sm font-semibold text-gray-600">Status</th>
                  <th className="py-3 px-4 text-sm font-semibold text-gray-600">Processed By</th>
                </tr>
              </thead>
              <tbody>
                {requests.map(req => (
                  <tr key={req.id} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="py-3 px-4 text-sm text-gray-800">{req.partName}</td>
                    <td className="py-3 px-4 text-sm text-gray-600">{req.quantity}</td>
                    <td className="py-3 px-4 text-sm">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        req.status === 'APPROVED' ? 'bg-green-100 text-green-700' :
                        req.status === 'REJECTED' ? 'bg-red-100 text-red-700' :
                        'bg-yellow-100 text-yellow-700'
                      }`}>
                        {req.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-sm text-gray-600">
                      {req.approvedBy || req.rejectedBy || 'Pending'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

    </div>
  );
};