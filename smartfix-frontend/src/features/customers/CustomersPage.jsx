import React, { useEffect, useState } from 'react';
import { ShieldCheck, Plus, Search, CheckCircle2, AlertTriangle, Clock3 } from 'lucide-react';
import { PageHeader } from '../../shared/components/Common/PageHeader';
import { StatCard } from '../../shared/components/Common/StatCard';
import { EmptyState } from '../../shared/components/Common/EmptyState';
import toast from 'react-hot-toast';

const SYSTEM_BACKEND_BASE_URL = process.env.REACT_APP_SYSTEM_BACKEND_URL || 'http://localhost:8080';

const WARRANTY_STATUS_COLORS = {
  ACTIVE: 'bg-green-100 text-green-800',
  EXPIRED: 'bg-red-100 text-red-800',
  CLAIMED: 'bg-blue-100 text-blue-800'
};

export const CustomersPage = () => {
  const [activeTab, setActiveTab] = useState('warranty');
  const [warranties, setWarranties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [showNewWarranty, setShowNewWarranty] = useState(false);
  const [newWarranty, setNewWarranty] = useState({
    deviceType: '',
    deviceModel: '',
    serialNumber: '',
    customerName: '',
    warrantyMonths: 12,
    purchaseDate: new Date().toISOString().split('T')[0]
  });

  const loadWarranties = async () => {
    try {
      const response = await fetch(`${SYSTEM_BACKEND_BASE_URL}/api/warranties`);
      if (response.ok) {
        const data = await response.json();
        setWarranties(data);
      }
    } catch {
      setWarranties([]);
    }
  };

  useEffect(() => {
    const init = async () => {
      setLoading(true);
      await loadWarranties();
      setLoading(false);
    };
    init();
  }, []);

  const handleRegisterWarranty = async () => {
    if (!newWarranty.deviceType.trim()) {
      toast.error('Device type is required');
      return;
    }
    if (!newWarranty.serialNumber.trim()) {
      toast.error('Serial number is required');
      return;
    }
    if (!newWarranty.customerName.trim()) {
      toast.error('Customer name is required');
      return;
    }

    try {
      const response = await fetch(`${SYSTEM_BACKEND_BASE_URL}/api/warranties`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newWarranty)
      });
      if (response.ok) {
        toast.success('Warranty registered');
        setNewWarranty({
          deviceType: '',
          deviceModel: '',
          serialNumber: '',
          customerName: '',
          warrantyMonths: 12,
          purchaseDate: new Date().toISOString().split('T')[0]
        });
        setShowNewWarranty(false);
        await loadWarranties();
      } else {
        toast.error('Failed to register warranty');
      }
    } catch {
      toast.error('Backend not reachable');
    }
  };

  const handleWarrantyStatus = async (id, status) => {
    try {
      const response = await fetch(`${SYSTEM_BACKEND_BASE_URL}/api/warranties/${id}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status })
      });
      if (response.ok) {
        toast.success(`Warranty marked as ${status}`);
        await loadWarranties();
      }
    } catch {
      toast.error('Backend not reachable');
    }
  };

  const activeWarranties = warranties.filter((w) => w.status === 'ACTIVE').length;
  const expiredWarranties = warranties.filter((w) => w.status === 'EXPIRED').length;
  const claimedWarranties = warranties.filter((w) => w.status === 'CLAIMED').length;

  const filteredWarranties = warranties.filter((w) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      (w.serialNumber || '').toLowerCase().includes(q) ||
      (w.customerName || w.customerRef || '').toLowerCase().includes(q) ||
      (w.deviceType || '').toLowerCase().includes(q) ||
      (w.deviceModel || '').toLowerCase().includes(q)
    );
  });

  const getDaysRemaining = (expiryDate) => {
    const today = new Date();
    const expiry = new Date(expiryDate);
    const diff = Math.ceil((expiry - today) / (1000 * 60 * 60 * 24));
    return diff;
  };

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <PageHeader
        title="Warranty Tracking"
        subtitle="Track device warranties and warranty claims"
      />

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
        <StatCard label="Total Warranties" value={warranties.length} accent="text-blue-600" icon={<ShieldCheck className="w-8 h-8" />} />
        <StatCard label="Active" value={activeWarranties} accent="text-green-600" icon={<CheckCircle2 className="w-8 h-8" />} />
        <StatCard label="Expired" value={expiredWarranties} accent="text-red-600" icon={<AlertTriangle className="w-8 h-8" />} />
        <StatCard label="Claimed" value={claimedWarranties} accent="text-blue-600" icon={<Clock3 className="w-8 h-8" />} />
      </div>

      <div>
          {/* Actions */}
          <div className="flex flex-wrap items-center gap-3 mb-4">
            <button
              type="button"
              onClick={() => setShowNewWarranty(!showNewWarranty)}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 inline-flex items-center gap-2 text-sm"
            >
              <Plus className="w-4 h-4" />
              Register Warranty
            </button>
            <div className="flex items-center gap-2 flex-1 max-w-md">
              <Search className="w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search by serial number, customer name, device..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="flex-1 px-3 py-2 border rounded-lg text-sm"
              />
            </div>
          </div>

          {/* New warranty form */}
          {showNewWarranty && (
            <div className="bg-white rounded-lg shadow p-4 border mb-6 max-w-xl">
              <h3 className="font-semibold text-gray-900 mb-3">Register New Warranty</h3>
              <div className="space-y-2">
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="text"
                    placeholder="Device Type *"
                    value={newWarranty.deviceType}
                    onChange={(e) => setNewWarranty({ ...newWarranty, deviceType: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg text-sm"
                  />
                  <input
                    type="text"
                    placeholder="Device Model"
                    value={newWarranty.deviceModel}
                    onChange={(e) => setNewWarranty({ ...newWarranty, deviceModel: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg text-sm"
                  />
                </div>
                <input
                  type="text"
                  placeholder="Serial Number *"
                  value={newWarranty.serialNumber}
                  onChange={(e) => setNewWarranty({ ...newWarranty, serialNumber: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg text-sm"
                />
                <input
                  type="text"
                  placeholder="Customer Name *"
                  value={newWarranty.customerName}
                  onChange={(e) => setNewWarranty({ ...newWarranty, customerName: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg text-sm"
                />
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1">Purchase Date</label>
                    <input
                      type="date"
                      value={newWarranty.purchaseDate}
                      onChange={(e) => setNewWarranty({ ...newWarranty, purchaseDate: e.target.value })}
                      className="w-full px-3 py-2 border rounded-lg text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1">Warranty (months)</label>
                    <select
                      value={newWarranty.warrantyMonths}
                      onChange={(e) => setNewWarranty({ ...newWarranty, warrantyMonths: Number(e.target.value) })}
                      className="w-full px-3 py-2 border rounded-lg text-sm"
                    >
                      <option value={3}>3 months</option>
                      <option value={6}>6 months</option>
                      <option value={12}>12 months</option>
                      <option value={24}>24 months</option>
                      <option value={36}>36 months</option>
                    </select>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={handleRegisterWarranty}
                    className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm"
                  >
                    Register
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowNewWarranty(false)}
                    className="px-4 py-2 border rounded-lg text-sm text-gray-600 hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Warranty list */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-bold mb-4">Warranty Records</h2>

            {loading ? (
              <p className="text-gray-500">Loading...</p>
            ) : filteredWarranties.length === 0 ? (
              <EmptyState
                title="No warranties found"
                description="Register a warranty after completing a device sale."
              />
            ) : (
              <div className="space-y-3">
                {[...filteredWarranties]
                  .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
                  .map((w) => {
                    const daysLeft = getDaysRemaining(w.expiryDate);
                    return (
                      <div key={w.id} className="border rounded-lg p-4 bg-gray-50">
                        <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-3">
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${WARRANTY_STATUS_COLORS[w.status] || 'bg-gray-100 text-gray-700'}`}>
                                {w.status}
                              </span>
                              <span className="text-xs text-gray-400">#{w.id}</span>
                            </div>
                            <p className="font-semibold text-gray-900">
                              {w.deviceType}{w.deviceModel ? ` — ${w.deviceModel}` : ''}
                            </p>
                            <p className="text-sm text-gray-700">Serial: <span className="font-medium">{w.serialNumber || '-'}</span></p>
                            {(w.customerName || w.customerRef) && (
                              <p className="text-sm text-gray-700">Customer: <span className="font-medium">{w.customerName || w.customerRef}</span></p>
                            )}
                          </div>

                          <div className="text-sm space-y-1 md:text-right">
                            <p className="text-gray-600">Purchased: <span className="font-medium">{w.purchaseDate}</span></p>
                            <p className="text-gray-600">Expires: <span className="font-medium">{w.expiryDate}</span></p>
                            <p className={`font-semibold ${daysLeft > 30 ? 'text-green-600' : daysLeft > 0 ? 'text-orange-600' : 'text-red-600'}`}>
                              {daysLeft > 0 ? `${daysLeft} days remaining` : 'Expired'}
                            </p>
                            {w.status === 'ACTIVE' && (
                              <div className="flex gap-1 mt-1 md:justify-end">
                                <button
                                  type="button"
                                  onClick={() => handleWarrantyStatus(w.id, 'CLAIMED')}
                                  className="px-2 py-1 bg-blue-600 text-white text-xs rounded hover:bg-blue-700"
                                >
                                  Mark Claimed
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleWarrantyStatus(w.id, 'EXPIRED')}
                                  className="px-2 py-1 bg-red-500 text-white text-xs rounded hover:bg-red-600"
                                >
                                  Mark Expired
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
              </div>
            )}
          </div>
        </div>
    </div>
  );
};
