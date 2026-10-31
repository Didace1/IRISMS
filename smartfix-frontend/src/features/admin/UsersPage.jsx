// src/features/admin/UsersPage.jsx
import React, { useState, useEffect } from 'react';
import { Search, Edit2, Trash2, UserCheck, UserX, Shield, Mail, Phone, Briefcase, Calendar } from 'lucide-react';
import toast from 'react-hot-toast';
import { PageHeader } from '../../shared/components/Common/PageHeader';
import { StatCard } from '../../shared/components/Common/StatCard';
import { LoadingState } from '../../shared/components/Common/LoadingState';
import { EmptyState } from '../../shared/components/Common/EmptyState';
import { formatDate } from '../../shared/utils/formatters';

export const UsersPage = () => {
  const SYSTEM_BACKEND_BASE_URL = process.env.REACT_APP_SYSTEM_BACKEND_URL || 'http://localhost:8080';
  const [users, setUsers] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [filterRole, setFilterRole] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingUser, setEditingUser] = useState(null);

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      const response = await fetch(`${SYSTEM_BACKEND_BASE_URL}/api/users`);
      const data = await response.json();
      if (response.ok) {
        setUsers(data);
      } else {
        toast.error('Failed to load users');
      }
    } catch (error) {
      toast.error('System backend not reachable');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleApproval = async (userId, currentStatus) => {
    try {
      const response = await fetch(`${SYSTEM_BACKEND_BASE_URL}/api/users/${userId}/toggle-approval`, {
        method: 'PUT',
      });
      if (response.ok) {
        toast.success(currentStatus ? 'User disabled' : 'User approved');
        loadUsers();
      } else {
        toast.error('Failed to update user status');
      }
    } catch (error) {
      toast.error('System backend not reachable');
    }
  };

  const handleDeleteUser = async (userId, userName) => {
    if (window.confirm(`Are you sure you want to delete ${userName}? This action cannot be undone.`)) {
      try {
        const response = await fetch(`${SYSTEM_BACKEND_BASE_URL}/api/users/${userId}`, {
          method: 'DELETE',
        });
        if (response.ok) {
          toast.success('User deleted successfully');
          loadUsers();
        } else {
          toast.error('Failed to delete user');
        }
      } catch (error) {
        toast.error('System backend not reachable');
      }
    }
  };

  const handleEditUser = (user) => {
    setEditingUser({ ...user });
    setShowEditModal(true);
  };

  const handleSaveEdit = async () => {
    try {
      const response = await fetch(`${SYSTEM_BACKEND_BASE_URL}/api/users/${editingUser.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editingUser),
      });
      if (response.ok) {
        toast.success('User updated successfully');
        setShowEditModal(false);
        setEditingUser(null);
        loadUsers();
      } else {
        toast.error('Failed to update user');
      }
    } catch (error) {
      toast.error('System backend not reachable');
    }
  };

  // Filter users
  const filteredUsers = users.filter(user => {
    const matchesSearch = 
      user.fullName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.employeeId?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesRole = filterRole === 'all' || user.role === filterRole;
    const matchesStatus = filterStatus === 'all' || 
      (filterStatus === 'approved' && user.approved) ||
      (filterStatus === 'pending' && !user.approved);
    
    return matchesSearch && matchesRole && matchesStatus;
  });

  // Calculate stats
  const totalUsers = users.length;
  const approvedUsers = users.filter(u => u.approved).length;
  const pendingUsers = users.filter(u => !u.approved).length;
  const adminCount = users.filter(u => u.role === 'admin').length;
  const technicianCount = users.filter(u => u.role === 'technician').length;
  const inventoryCount = users.filter(u => u.role === 'inventory').length;
  const salesCount = users.filter(u => u.role === 'sales').length;

  const getRoleBadgeColor = (role) => {
    const colors = {
      admin: 'bg-purple-100 text-purple-800',
      technician: 'bg-blue-100 text-blue-800',
      inventory: 'bg-green-100 text-green-800',
      sales: 'bg-orange-100 text-orange-800',
      manager: 'bg-gray-100 text-gray-800',
    };
    return colors[role] || 'bg-gray-100 text-gray-800';
  };

  const getRoleIcon = (role) => {
    const icons = {
      admin: '👨‍💼',
      technician: '🔧',
      inventory: '📦',
      sales: '💰',
      manager: '👔',
    };
    return icons[role] || '👤';
  };

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <PageHeader
        title="User Management"
        subtitle="Manage all system users and their permissions"
      />

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
        <StatCard label="Total Users" value={totalUsers} accent="text-blue-600" icon={<Shield className="w-5 h-5" />} />
        <StatCard label="Approved Users" value={approvedUsers} accent="text-green-600" icon={<UserCheck className="w-5 h-5" />} />
        <StatCard label="Pending Approval" value={pendingUsers} accent="text-yellow-600" icon={<UserX className="w-5 h-5" />} />
        <StatCard label="Administrators" value={adminCount} accent="text-purple-600" icon={<Shield className="w-5 h-5" />} />
      </div>

      {/* Role Distribution */}
      <div className="bg-white rounded-lg shadow p-4 mb-6">
        <h3 className="text-sm font-semibold text-gray-700 mb-3">Users by Role</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center p-3 bg-purple-50 rounded-lg">
            <p className="text-2xl font-bold text-purple-600">{adminCount}</p>
            <p className="text-xs text-gray-600">Admins</p>
          </div>
          <div className="text-center p-3 bg-blue-50 rounded-lg">
            <p className="text-2xl font-bold text-blue-600">{technicianCount}</p>
            <p className="text-xs text-gray-600">Technicians</p>
          </div>
          <div className="text-center p-3 bg-green-50 rounded-lg">
            <p className="text-2xl font-bold text-green-600">{inventoryCount}</p>
            <p className="text-xs text-gray-600">Inventory</p>
          </div>
          <div className="text-center p-3 bg-orange-50 rounded-lg">
            <p className="text-2xl font-bold text-orange-600">{salesCount}</p>
            <p className="text-xs text-gray-600">Sales</p>
          </div>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="bg-white rounded-lg shadow p-4 mb-6">
        <div className="flex flex-wrap gap-4">
          <div className="flex-1 relative min-w-[200px]">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search by name, email, or employee ID..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <select
            value={filterRole}
            onChange={(e) => setFilterRole(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All Roles</option>
            <option value="admin">Admin</option>
            <option value="technician">Technician</option>
            <option value="inventory">Inventory</option>
            <option value="sales">Sales</option>
            <option value="manager">Manager</option>
          </select>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All Status</option>
            <option value="approved">Approved</option>
            <option value="pending">Pending</option>
          </select>
        </div>
      </div>

      {/* Edit User Modal */}
      {showEditModal && editingUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6 max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-bold mb-4">Edit User</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                <input
                  type="text"
                  value={editingUser.fullName || ''}
                  onChange={(e) => setEditingUser({ ...editingUser, fullName: e.target.value })}
                  className="w-full px-4 py-2 border rounded-lg"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <input
                  type="email"
                  value={editingUser.email || ''}
                  onChange={(e) => setEditingUser({ ...editingUser, email: e.target.value })}
                  className="w-full px-4 py-2 border rounded-lg"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                <input
                  type="text"
                  value={editingUser.phone || ''}
                  onChange={(e) => setEditingUser({ ...editingUser, phone: e.target.value })}
                  className="w-full px-4 py-2 border rounded-lg"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
                <select
                  value={editingUser.role || ''}
                  onChange={(e) => setEditingUser({ ...editingUser, role: e.target.value })}
                  className="w-full px-4 py-2 border rounded-lg"
                >
                  <option value="admin">Admin</option>
                  <option value="technician">Technician</option>
                  <option value="inventory">Inventory</option>
                  <option value="sales">Sales</option>
                  <option value="manager">Manager</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Employee ID</label>
                <input
                  type="text"
                  value={editingUser.employeeId || ''}
                  onChange={(e) => setEditingUser({ ...editingUser, employeeId: e.target.value })}
                  className="w-full px-4 py-2 border rounded-lg"
                />
              </div>
              {editingUser.role === 'technician' && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Specialization</label>
                    <input
                      type="text"
                      value={editingUser.specialization || ''}
                      onChange={(e) => setEditingUser({ ...editingUser, specialization: e.target.value })}
                      className="w-full px-4 py-2 border rounded-lg"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Certifications</label>
                    <textarea
                      value={editingUser.certifications || ''}
                      onChange={(e) => setEditingUser({ ...editingUser, certifications: e.target.value })}
                      className="w-full px-4 py-2 border rounded-lg"
                      rows={3}
                    />
                  </div>
                </>
              )}
            </div>
            <div className="flex space-x-3 mt-6">
              <button
                onClick={handleSaveEdit}
                className="flex-1 bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700"
              >
                Save Changes
              </button>
              <button
                onClick={() => { setShowEditModal(false); setEditingUser(null); }}
                className="flex-1 bg-gray-300 text-gray-700 py-2 rounded-lg hover:bg-gray-400"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Users Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        {loading ? (
          <LoadingState message="Loading users..." />
        ) : filteredUsers.length === 0 ? (
          <div className="p-6">
            <EmptyState title="No users found" description="Try adjusting your search or filters." />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">User</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Contact</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Role</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Employee ID</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Joined</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredUsers.map((user) => (
                  <tr key={user.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-semibold">
                          {user.fullName?.charAt(0).toUpperCase() || '?'}
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">{user.fullName}</div>
                          {user.specialization && (
                            <div className="text-xs text-gray-500">{user.specialization}</div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900 flex items-center gap-1">
                        <Mail className="w-3 h-3 text-gray-400" />
                        {user.email}
                      </div>
                      {user.phone && (
                        <div className="text-xs text-gray-500 flex items-center gap-1 mt-1">
                          <Phone className="w-3 h-3 text-gray-400" />
                          {user.phone}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium ${getRoleBadgeColor(user.role)}`}>
                        <span>{getRoleIcon(user.role)}</span>
                        {user.role?.charAt(0).toUpperCase() + user.role?.slice(1)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900 flex items-center gap-1">
                        <Briefcase className="w-3 h-3 text-gray-400" />
                        {user.employeeId}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {user.approved ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                          <UserCheck className="w-3 h-3" />
                          Approved
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                          <UserX className="w-3 h-3" />
                          Pending
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <div className="flex items-center gap-1">
                        <Calendar className="w-3 h-3 text-gray-400" />
                        {formatDate(user.createdAt)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm space-x-2">
                      <button
                        onClick={() => handleEditUser(user)}
                        className="text-blue-600 hover:text-blue-800"
                        title="Edit user"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleToggleApproval(user.id, user.approved)}
                        className={user.approved ? 'text-yellow-600 hover:text-yellow-800' : 'text-green-600 hover:text-green-800'}
                        title={user.approved ? 'Disable user' : 'Approve user'}
                      >
                        {user.approved ? <UserX className="w-4 h-4" /> : <UserCheck className="w-4 h-4" />}
                      </button>
                      <button
                        onClick={() => handleDeleteUser(user.id, user.fullName)}
                        className="text-red-600 hover:text-red-800"
                        title="Delete user"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
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
