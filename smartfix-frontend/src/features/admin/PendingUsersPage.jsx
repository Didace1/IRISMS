// src/features/admin/PendingUsersPage.jsx
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, UserCheck, UserX, Clock, User, Mail, Phone, Briefcase, RefreshCw } from 'lucide-react';
import toast from 'react-hot-toast';
import {
  useGetPendingUsersQuery,
  useApproveUserMutation,
  useRejectUserMutation,
} from '../auth/services/authApi';

const ROLE_LABELS = {
  technician: { label: 'Repair Technician', color: 'bg-green-100 text-green-700' },
  inventory: { label: 'Inventor', color: 'bg-blue-100 text-blue-700' },
  sales: { label: 'Sales Staff', color: 'bg-purple-100 text-purple-700' },
  admin: { label: 'Administrator', color: 'bg-orange-100 text-orange-700' },
  manager: { label: 'Manager', color: 'bg-yellow-100 text-yellow-700' },
};

export const PendingUsersPage = () => {
  const navigate = useNavigate();
  const { data: pendingUsers = [], isLoading, refetch } = useGetPendingUsersQuery();
  const [approveUser, { isLoading: approving }] = useApproveUserMutation();
  const [rejectUser, { isLoading: rejecting }] = useRejectUserMutation();
  const [confirmReject, setConfirmReject] = React.useState(null);

  const handleApprove = async (user) => {
    try {
      await approveUser(user.id).unwrap();
      toast.success(`${user.fullName}'s account has been approved.`);
    } catch {
      toast.error('Failed to approve account. Please try again.');
    }
  };

  const handleReject = async (user) => {
    try {
      await rejectUser(user.id).unwrap();
      toast.success(`${user.fullName}'s registration has been rejected and removed.`);
      setConfirmReject(null);
    } catch {
      toast.error('Failed to reject account. Please try again.');
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <button
        onClick={() => navigate('/dashboard')}
        className="flex items-center gap-2 text-blue-600 hover:text-blue-700 mb-6 text-sm font-medium"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Dashboard
      </button>

      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-yellow-100 rounded-lg flex items-center justify-center">
            <Clock className="w-5 h-5 text-yellow-600" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900">Pending Account Approvals</h1>
            <p className="text-sm text-gray-500">Review and approve or reject new user registrations</p>
          </div>
        </div>
        <button
          onClick={refetch}
          className="flex items-center gap-2 px-3 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg transition"
        >
          <RefreshCw className="w-4 h-4" />
          Refresh
        </button>
      </div>

      {isLoading ? (
        <div className="text-center py-20 text-gray-400">Loading pending accounts...</div>
      ) : pendingUsers.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm py-20 text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mb-4">
            <UserCheck className="w-8 h-8 text-green-600" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900">All clear!</h3>
          <p className="text-sm text-gray-500 mt-1">No pending account approvals at this time.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {pendingUsers.map((user) => {
            const role = ROLE_LABELS[user.role] || { label: user.role, color: 'bg-gray-100 text-gray-700' };
            return (
              <div
                key={user.id}
                className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 flex flex-col sm:flex-row sm:items-center gap-4"
              >
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                    <User className="w-5 h-5 text-blue-600" />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-sm font-semibold text-gray-900">{user.fullName}</p>
                      <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${role.color}`}>
                        {role.label}
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-x-4 gap-y-0.5 mt-1">
                      <span className="flex items-center gap-1 text-xs text-gray-500">
                        <Mail className="w-3 h-3" />{user.email}
                      </span>
                      {user.phone && (
                        <span className="flex items-center gap-1 text-xs text-gray-500">
                          <Phone className="w-3 h-3" />{user.phone}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 flex-shrink-0">
                  <button
                    onClick={() => handleApprove(user)}
                    disabled={approving || rejecting}
                    className="flex items-center gap-1.5 px-4 py-2 bg-green-600 text-white text-sm font-medium rounded-lg hover:bg-green-700 transition disabled:opacity-50"
                  >
                    <UserCheck className="w-4 h-4" />
                    Approve
                  </button>
                  <button
                    onClick={() => setConfirmReject(user)}
                    disabled={approving || rejecting}
                    className="flex items-center gap-1.5 px-4 py-2 bg-red-50 text-red-600 text-sm font-medium rounded-lg hover:bg-red-100 transition disabled:opacity-50 border border-red-200"
                  >
                    <UserX className="w-4 h-4" />
                    Reject
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {confirmReject && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl p-6 w-full max-w-sm">
            <div className="flex items-center justify-center w-12 h-12 bg-red-100 rounded-full mb-4 mx-auto">
              <UserX className="w-6 h-6 text-red-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 text-center mb-2">Reject Registration?</h3>
            <p className="text-sm text-gray-500 text-center mb-6">
              This will permanently delete <span className="font-semibold text-gray-900">{confirmReject.fullName}</span>'s
              registration. This action cannot be undone.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setConfirmReject(null)}
                className="flex-1 px-4 py-2 text-sm text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition"
              >
                Cancel
              </button>
              <button
                onClick={() => handleReject(confirmReject)}
                disabled={rejecting}
                className="flex-1 px-4 py-2 text-sm text-white bg-red-600 hover:bg-red-700 rounded-lg transition disabled:opacity-50"
              >
                {rejecting ? 'Rejecting...' : 'Yes, Reject'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
