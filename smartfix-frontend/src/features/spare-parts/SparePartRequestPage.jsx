import React, { useEffect, useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import { PackageSearch, Send, Wrench } from 'lucide-react';
import { PageHeader } from '../../shared/components/Common/PageHeader';
import { LoadingState } from '../../shared/components/Common/LoadingState';
import { EmptyState } from '../../shared/components/Common/EmptyState';
import { StatCard } from '../../shared/components/Common/StatCard';

export const SparePartRequestPage = () => {
  const SYSTEM_BACKEND_BASE_URL = process.env.REACT_APP_SYSTEM_BACKEND_URL || 'http://localhost:8080';

  const [inventory, setInventory] = useState([]);
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [partsSearchTerm, setPartsSearchTerm] = useState('');
  const [form, setForm] = useState({
    deviceType: '',
    model: '',
    selectedPartCounts: {}
  });

  const deviceTypes = ['Laptop', 'Desktop', 'Smartphone', 'Tablet', 'Monitor', 'Printer'];
  const modelsByType = {
    Laptop: ['Dell XPS 13', 'HP EliteBook 840', 'Lenovo ThinkPad T490', 'MacBook Pro 14', 'ASUS ZenBook 14'],
    Desktop: ['Dell OptiPlex 7090', 'HP ProDesk 600', 'Lenovo ThinkCentre M720', 'iMac 24', 'Custom Build'],
    Smartphone: ['iPhone 14', 'iPhone 13', 'Samsung Galaxy S23', 'Google Pixel 8', 'Xiaomi 13'],
    Tablet: ['iPad Pro 11', 'iPad Air', 'Samsung Galaxy Tab S9', 'Microsoft Surface Go', 'Lenovo Tab P11'],
    Monitor: ['Dell P2419H', 'HP E24 G4', 'LG 27UL500', 'Samsung Odyssey G5', 'AOC 24G2'],
    Printer: ['HP LaserJet Pro', 'Canon PIXMA G3411', 'Epson EcoTank L3250', 'Brother HL-L2350DW', 'Xerox B225']
  };

  useEffect(() => {
    const loadData = async () => {
      try {
        const [inventoryResponse, requestsResponse] = await Promise.all([
          fetch(`${SYSTEM_BACKEND_BASE_URL}/api/inventory`),
          fetch(`${SYSTEM_BACKEND_BASE_URL}/api/spare-part-requests`)
        ]);

        if (inventoryResponse.ok) {
          const inventoryData = await inventoryResponse.json();
          setInventory(Array.isArray(inventoryData) ? inventoryData : []);
        } else {
          throw new Error('Failed to load inventory');
        }

        if (requestsResponse.ok) {
          const requestsData = await requestsResponse.json();
          setRequests(Array.isArray(requestsData) ? requestsData : []);
        } else {
          const localRequests = JSON.parse(localStorage.getItem('spare_part_requests') || '[]');
          setRequests(localRequests);
        }
      } catch {
        const localRequests = JSON.parse(localStorage.getItem('spare_part_requests') || '[]');
        setRequests(localRequests);
        toast.error('Using local spare-part request mode (server endpoint unavailable).');
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [SYSTEM_BACKEND_BASE_URL]);

  const filteredInventory = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();
    if (!q) return inventory;
    return inventory.filter((item) =>
      String(item?.name || '').toLowerCase().includes(q) ||
      String(item?.category?.name || item?.category || '').toLowerCase().includes(q) ||
      String(item?.sku || '').toLowerCase().includes(q)
    );
  }, [inventory, searchTerm]);

  const filteredPartsForSelection = useMemo(() => {
    const q = partsSearchTerm.trim().toLowerCase();
    if (!q) return filteredInventory;
    return filteredInventory.filter((item) =>
      String(item?.name || '').toLowerCase().includes(q) ||
      String(item?.category?.name || item?.category || '').toLowerCase().includes(q) ||
      String(item?.sku || '').toLowerCase().includes(q)
    );
  }, [filteredInventory, partsSearchTerm]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    const selectedPartEntries = Object.entries(form.selectedPartCounts).filter(([, count]) => Number(count) > 0);
    if (!form.deviceType || !form.model || selectedPartEntries.length === 0) {
      toast.error('Please select device type, model, and spare parts needed.');
      return;
    }

    const selectedParts = selectedPartEntries
      .map(([id, count]) => {
        const item = filteredInventory.find((part) => String(part.id) === String(id)) ||
          inventory.find((part) => String(part.id) === String(id));
        if (!item) return null;
        return {
          inventoryId: item.id,
          partName: item.name,
          sku: item.sku || null,
          quantity: Number(count)
        };
      })
      .filter(Boolean);

    const payload = {
      deviceType: form.deviceType,
      model: form.model,
      requestedParts: selectedParts,
      status: 'pending',
      createdAt: new Date().toISOString()
    };

    setIsSubmitting(true);
    try {
      const response = await fetch(`${SYSTEM_BACKEND_BASE_URL}/api/spare-part-requests`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!response.ok) throw new Error('Endpoint unavailable');

      const created = await response.json();
      setRequests((prev) => [created, ...prev]);
      toast.success('Spare-part request sent to inventory team.');
    } catch {
      const localItem = { id: `local-${Date.now()}`, ...payload };
      const updated = [localItem, ...requests];
      setRequests(updated);
      localStorage.setItem('spare_part_requests', JSON.stringify(updated));
      toast.success('Spare-part request saved locally (sync later).');
    } finally {
      setIsSubmitting(false);
      setForm({ deviceType: '', model: '', selectedPartCounts: {} });
    }
  };

  const addPartSelection = (partId) => {
    setForm((prev) => {
      const id = String(partId);
      const currentCount = Number(prev.selectedPartCounts[id] || 0);
      return {
        ...prev,
        selectedPartCounts: {
          ...prev.selectedPartCounts,
          [id]: currentCount + 1
        }
      };
    });
  };

  const removePartSelection = (partId) => {
    setForm((prev) => {
      const id = String(partId);
      const currentCount = Number(prev.selectedPartCounts[id] || 0);
      const updatedCounts = { ...prev.selectedPartCounts };
      if (currentCount <= 1) {
        delete updatedCounts[id];
      } else {
        updatedCounts[id] = currentCount - 1;
      }
      return {
        ...prev,
        selectedPartCounts: updatedCounts
      };
    });
  };

  const selectedPartsSummary = useMemo(() => {
    const entries = Object.entries(form.selectedPartCounts).filter(([, count]) => Number(count) > 0);
    return entries
      .map(([id, count]) => {
        const item = inventory.find((part) => String(part.id) === String(id));
        if (!item) return null;
        return `${item.name}(${count})`;
      })
      .filter(Boolean);
  }, [form.selectedPartCounts, inventory]);

  if (loading) {
    return <LoadingState message="Loading inventory and requests..." />;
  }

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <PageHeader
        title="Spare Parts Request"
        subtitle="Technicians can request parts from inventory quickly"
      />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <StatCard label="Available Inventory Items" value={inventory.length} accent="text-blue-600" icon={<PackageSearch />} />
        <StatCard label="Your Requests" value={requests.length} accent="text-emerald-600" icon={<Send />} />
        <StatCard label="Pending Requests" value={requests.filter((item) => item?.status === 'pending').length} accent="text-amber-600" icon={<Wrench />} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Create Request</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Device Type</label>
              <select
                value={form.deviceType}
                onChange={(event) => setForm((prev) => ({ ...prev, deviceType: event.target.value, model: '' }))}
                className="w-full rounded-lg border border-gray-300 p-2"
                required
              >
                <option value="">Select device type</option>
                {deviceTypes.map((type) => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Device Model</label>
              <select
                value={form.model}
                onChange={(event) => setForm((prev) => ({ ...prev, model: event.target.value }))}
                className="w-full rounded-lg border border-gray-300 p-2"
                required
                disabled={!form.deviceType}
              >
                <option value="">Select model</option>
                {(modelsByType[form.deviceType] || []).map((model) => (
                  <option key={model} value={model}>
                    {model}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Spare Parts Needed</label>
              <input
                type="text"
                value={partsSearchTerm}
                onChange={(event) => setPartsSearchTerm(event.target.value)}
                placeholder="Search spare part in this box..."
                className="w-full rounded-lg border border-gray-300 p-2 text-sm mb-2"
              />
              <div className="max-h-44 overflow-y-auto rounded-lg border border-gray-300 p-2 space-y-2 bg-gray-50">
                {filteredPartsForSelection.length === 0 ? (
                  <p className="text-sm text-gray-500">No parts available for selection.</p>
                ) : (
                  filteredPartsForSelection.map((item) => {
                    const selectedCount = Number(form.selectedPartCounts[String(item.id)] || 0);
                    return (
                      <div key={item.id} className="flex items-center justify-between gap-3 text-sm text-gray-700">
                        <span>
                          <span className="font-medium text-gray-900">{item.name}</span>
                          <span className="text-gray-600"> (Stock: {item.quantity})</span>
                          {selectedCount > 0 && (
                            <span className="ml-2 text-xs font-semibold text-blue-700">x{selectedCount}</span>
                          )}
                        </span>
                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => removePartSelection(item.id)}
                            disabled={selectedCount === 0}
                            className="px-2 py-0.5 rounded bg-gray-200 text-gray-700 disabled:opacity-40"
                          >
                            -
                          </button>
                          <button
                            type="button"
                            onClick={() => addPartSelection(item.id)}
                            className="px-2 py-0.5 rounded bg-blue-600 text-white"
                          >
                            +
                          </button>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
              <div className="mt-2 rounded border border-dashed border-green-300 bg-green-50 p-2 min-h-[36px]">
                {selectedPartsSummary.length > 0 ? (
                  <p className="text-xs text-green-800">{selectedPartsSummary.join(' ')}</p>
                ) : (
                  <p className="text-xs text-gray-500">Selected parts will appear here.</p>
                )}
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 disabled:bg-gray-400"
            >
              {isSubmitting ? 'Submitting request...' : 'Submit Request to Inventory'}
            </button>
          </form>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Inventory Lookup</h2>
            <input
              type="text"
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              placeholder="Search part..."
              className="w-44 rounded-lg border border-gray-300 p-2 text-sm"
            />
          </div>

          {filteredInventory.length === 0 ? (
            <EmptyState
              title="No inventory items found"
              description="Try another search term or check inventory service."
            />
          ) : (
            <div className="max-h-[460px] overflow-y-auto space-y-2">
              {filteredInventory.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => addPartSelection(item.id)}
                  className="w-full text-left border border-gray-200 rounded-lg p-3 hover:border-blue-400 hover:bg-blue-50 transition-colors"
                >
                  <p className="font-medium text-gray-900">{item.name}</p>
                  <p className="text-sm text-gray-600">SKU: {item.sku || 'N/A'} | Category: {item.category?.name || item.category || 'N/A'}</p>
                  <p className="text-sm text-gray-600">Stock: {item.quantity} | Reorder point: {item.reorderPoint}</p>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
