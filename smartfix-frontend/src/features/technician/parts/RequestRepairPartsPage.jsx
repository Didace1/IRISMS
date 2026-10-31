import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { useSelector } from 'react-redux';
import { Package, Send, Search, User } from 'lucide-react';
import { PageHeader } from '../../../shared/components/Common/PageHeader';
import { LoadingState } from '../../../shared/components/Common/LoadingState';

export const RequestRepairPartsPage = () => {
  const SYSTEM_BACKEND_BASE_URL = process.env.REACT_APP_SYSTEM_BACKEND_URL || 'http://localhost:8080';
  const { user } = useSelector((state) => state.auth);

  const [inventory, setInventory] = useState([]);
  const [salesmen, setSalesmen] = useState([]);
  const [selectedSalesman, setSelectedSalesman] = useState('');
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedParts, setSelectedParts] = useState({});

  useEffect(() => {
    const loadData = async () => {
      try {
        const [invRes, usersRes] = await Promise.all([
          fetch(`${SYSTEM_BACKEND_BASE_URL}/api/inventory`),
          fetch(`${SYSTEM_BACKEND_BASE_URL}/api/users`)
        ]);

        if (invRes.ok) {
          const data = await invRes.json();
          const items = Array.isArray(data) ? data : [];
          const spareParts = items.filter(item => {
            const categoryName = item.category?.name || item.category || '';
            return categoryName.includes('Spare Part');
          });
          setInventory(spareParts);
        }

        if (usersRes.ok) {
          const usersData = await usersRes.json();
          const salesUsers = (Array.isArray(usersData) ? usersData : []).filter(u => 
            u.role && u.role.toLowerCase() === 'sales'
          );
          setSalesmen(salesUsers);
        }
      } catch (error) {
        toast.error('Failed to load data');
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [SYSTEM_BACKEND_BASE_URL]);

  const filteredInventory = inventory.filter((item) => {
    const search = searchTerm.toLowerCase();
    return (
      item.name?.toLowerCase().includes(search) ||
      item.sku?.toLowerCase().includes(search) ||
      item.category?.name?.toLowerCase().includes(search)
    );
  });

  const handleQuantityChange = (itemId, quantity) => {
    if (quantity <= 0) {
      const updated = { ...selectedParts };
      delete updated[itemId];
      setSelectedParts(updated);
    } else {
      setSelectedParts({
        ...selectedParts,
        [itemId]: quantity
      });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!selectedSalesman) {
      toast.error('Please select a salesman to request parts from');
      return;
    }

    const salesmanObj = salesmen.find(s => s.id === parseInt(selectedSalesman));
    const salesmanName = salesmanObj ? salesmanObj.fullName : selectedSalesman;

    const partsToRequest = Object.entries(selectedParts)
      .filter(([, qty]) => qty > 0)
      .map(([id, quantity]) => {
        const item = inventory.find(i => i.id === parseInt(id));
        return {
          partName: item.name,
          deviceType: item.category?.name || 'Spare Part',
          deviceModel: item.model || 'Unknown',
          quantity: quantity,
          priority: 'MEDIUM',
          status: 'PENDING',
          requestedBy: user ? user.fullName : 'Technician',
          // Storing the selected salesman in supplier/notes so the backend knows who to route it to
          supplier: salesmanName,
          notes: `Requested from Salesman: ${salesmanName}`
        };
      });

    if (partsToRequest.length === 0) {
      toast.error('Please select at least one part');
      return;
    }

    setIsSubmitting(true);
    let successCount = 0;

    try {
      // The backend expects a single SparePartRequest object per call
      for (const payload of partsToRequest) {
        const response = await fetch(`${SYSTEM_BACKEND_BASE_URL}/api/spare-part-requests`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });

        if (response.ok) {
          successCount++;
        }
      }

      if (successCount === partsToRequest.length) {
        toast.success('Parts request submitted successfully to ' + salesmanName);
        setSelectedParts({});
        setSelectedSalesman('');
      } else if (successCount > 0) {
        toast.error(`Only submitted ${successCount} out of ${partsToRequest.length} requests`);
      } else {
        throw new Error('Failed to submit requests');
      }
    } catch (error) {
      console.error(error);
      toast.error('Failed to submit request. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const totalSelectedParts = Object.values(selectedParts).reduce((sum, qty) => sum + qty, 0);

  if (loading) {
    return <LoadingState message="Loading inventory and personnel..." />;
  }

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <PageHeader
        title="Request Repair Parts"
        subtitle="Select parts and assign the request to a salesman"
      />

      {/* Summary Card */}
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <Package className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Selected Parts</p>
              <p className="text-2xl font-bold text-gray-900">{totalSelectedParts}</p>
            </div>
          </div>
          <button
            onClick={handleSubmit}
            disabled={isSubmitting || totalSelectedParts === 0}
            className="flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            <Send className="w-5 h-5" />
            {isSubmitting ? 'Submitting...' : 'Submit Request'}
          </button>
        </div>
      </div>

      {/* Salesman Selection */}
      <div className="bg-white rounded-lg shadow p-4 mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Select Salesman to Request From *
        </label>
        <div className="relative">
          <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
          <select
            value={selectedSalesman}
            onChange={(e) => setSelectedSalesman(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none bg-white"
            required
          >
            <option value="">-- Choose a Salesman --</option>
            {salesmen.map((salesman) => (
              <option key={salesman.id} value={salesman.id}>
                {salesman.fullName}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Search Bar */}
      <div className="bg-white rounded-lg shadow p-4 mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search parts by name, SKU, or category..."
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
      </div>

      {/* Parts List */}
      <div className="bg-white rounded-lg shadow">
        <div className="p-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Available Parts</h2>
          <p className="text-sm text-gray-600">{filteredInventory.length} parts available</p>
        </div>
        
        <div className="divide-y divide-gray-200">
          {filteredInventory.length === 0 ? (
            <div className="p-8 text-center">
              <Package className="w-12 h-12 text-gray-400 mx-auto mb-3" />
              <p className="text-gray-600">No parts found</p>
            </div>
          ) : (
            filteredInventory.map((item) => (
              <div key={item.id} className="p-4 hover:bg-gray-50 transition-colors">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex-1">
                    <h3 className="font-medium text-gray-900">{item.name}</h3>
                    <div className="flex flex-wrap items-center gap-4 mt-1 text-sm text-gray-600">
                      <span>SKU: {item.sku || 'N/A'}</span>
                      <span>Category: {item.category?.name || 'N/A'}</span>
                      <span className={`font-medium ${item.quantity > item.reorderPoint ? 'text-green-600' : 'text-orange-600'}`}>
                        Stock: {item.quantity}
                      </span>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    <input
                      type="number"
                      min="0"
                      value={selectedParts[item.id] || 0}
                      onChange={(e) => handleQuantityChange(item.id, parseInt(e.target.value) || 0)}
                      className="w-20 px-3 py-2 border border-gray-300 rounded-lg text-center focus:ring-2 focus:ring-blue-500"
                      placeholder="0"
                    />
                    <button
                      onClick={() => handleQuantityChange(item.id, (selectedParts[item.id] || 0) + 1)}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 whitespace-nowrap"
                    >
                      Add
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
