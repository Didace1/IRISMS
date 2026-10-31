// src/features/inventory/InventoryPage.jsx
import React, { useState, useEffect } from 'react';
import { AlertCircle, Search, Plus, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { PageHeader } from '../../shared/components/Common/PageHeader';
import { StatCard } from '../../shared/components/Common/StatCard';
import { LoadingState } from '../../shared/components/Common/LoadingState';
import { EmptyState } from '../../shared/components/Common/EmptyState';
import { useLocation } from 'react-router-dom';
import { formatCurrency, formatNumber, formatDate } from '../../shared/utils/formatters';

export const InventoryPage = () => {
  const SYSTEM_BACKEND_BASE_URL = process.env.REACT_APP_SYSTEM_BACKEND_URL || 'http://localhost:8080';
  const [inventory, setInventory] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [showLowStockOnly, setShowLowStockOnly] = useState(false);
  const [dbCategories, setDbCategories] = useState([]);
  const location = useLocation();
  const [showAddStockModal, setShowAddStockModal] = useState(false);
  const [addQuantity, setAddQuantity] = useState(1);
  const [stockDate, setStockDate] = useState(new Date().toISOString().slice(0, 10));
  const [stockCategory, setStockCategory] = useState('');
  const [newItem, setNewItem] = useState({ name: '', category: '', quantity: 1, price: '', purchaseCost: '' });
  const [scannedProduct, setScannedProduct] = useState(null);
  const [showProductModal, setShowProductModal] = useState(false);

  useEffect(() => {
    loadInventory();
    loadCategories();
  }, []);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    if (params.get('lowStock') === '1') setShowLowStockOnly(true);
    if (params.get('category')) {
      const categoryFilter = params.get('category');
      setSearchTerm(categoryFilter); // Use search term to filter by category
    }
    if (params.get('addStock') === '1') {
      setShowAddStockModal(true);
      setStockDate(new Date().toISOString().slice(0, 10));
      setAddQuantity(1);
      setStockCategory('');
      setNewItem({ name: '', category: '', quantity: 1, price: '', purchaseCost: '' });
    }
  }, [location.search]);

  const loadInventory = async () => {
    try {
      const response = await fetch(`${SYSTEM_BACKEND_BASE_URL}/api/inventory`);
      const data = await response.json();
      if (response.ok) {
        setInventory(data);
      } else {
        toast.error(data?.message || 'Failed to load inventory');
      }
    } catch {
      toast.error('System backend not reachable for inventory');
    } finally {
      setLoading(false);
    }
  };

  const loadCategories = async () => {
    try {
      const response = await fetch(`${SYSTEM_BACKEND_BASE_URL}/api/categories`);
      const data = await response.json();
      if (response.ok) {
        setDbCategories((data || []).map((category) => category.name).filter(Boolean));
      }
    } catch {
      // Keep silent; we can still fallback to categories inferred from inventory.
    }
  };

  const handleNewItemSubmit = async () => {
    // Better validation that checks actual values
    const name = newItem.name?.trim();
    const category = newItem.category?.trim();
    const price = newItem.price?.toString().trim();
    
    if (!name) {
      toast.error('Item name is required');
      return;
    }
    
    if (!category) {
      toast.error('Category is required');
      return;
    }
    
    if (!price || parseFloat(price) <= 0) {
      toast.error('Valid selling price is required');
      return;
    }
    
    const payload = {
      name: name,
      category: category,
      quantity: parseInt(newItem.quantity) || 0,
      reorderPoint: parseInt(newItem.reorderPoint) || 3, // Low stock threshold set to 3
      price: parseFloat(price),
      purchaseCost: newItem.purchaseCost ? parseFloat(newItem.purchaseCost) : null,
      lastStockedAt: stockDate,
    };
    
    console.log('Submitting inventory item:', payload);
    
    try {
      const response = await fetch(`${SYSTEM_BACKEND_BASE_URL}/api/inventory`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      
      if (!response.ok) {
        // Try to get error message from response
        let errorMessage = 'Failed to create item';
        try {
          const errorData = await response.json();
          errorMessage = errorData?.message || errorData?.error || errorMessage;
        } catch (e) {
          // If response is not JSON, use status text
          errorMessage = response.statusText || errorMessage;
        }
        toast.error(errorMessage);
        return;
      }
      
      const data = await response.json();
      setInventory(prev => [...prev, data]);
      await loadCategories();
      toast.success(`${data.name} added to inventory`);
      setShowAddStockModal(false);
      setNewItem({ name: '', category: '', quantity: 1, price: '', purchaseCost: '' });
    } catch (error) {
      console.error('Error creating item:', error);
      toast.error('Backend not reachable');
    }
  };

  const handleDeleteItem = async (id) => {
    if (window.confirm('Are you sure you want to delete this item?')) {
      try {
        await fetch(`${SYSTEM_BACKEND_BASE_URL}/api/inventory/${id}`, { method: 'DELETE' });
        setInventory(inventory.filter(item => item.id !== id));
        toast.success('Item deleted');
      } catch {
        toast.error('Failed to delete item');
      }
    }
  };

  const handleProductScanned = (product) => {
    // Display scanned product details in modal
    setScannedProduct(product);
    setShowProductModal(true);
    toast.success(`Product scanned: ${product.name}`);
  };

  const closeProductModal = () => {
    setShowProductModal(false);
    setScannedProduct(null);
  };

  const baseList = showLowStockOnly
    ? inventory.filter(item => item.quantity <= 2)
    : inventory;
  const filteredInventory = baseList.filter(item =>
    item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (item.category?.name || item.category || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.sku.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const lowStockItems = inventory.filter(item => item.quantity <= 2);
  // Inventory valuation uses purchase cost when available, falling back to selling price
  const totalValue = inventory.reduce((sum, item) => sum + (item.quantity * (item.purchaseCost ?? item.price ?? 0)), 0);
  const categories = Array.from(new Set(dbCategories)).filter(Boolean);

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <PageHeader
        title="Inventory Management"
        subtitle="Track and manage your parts inventory"
      />

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
        <StatCard label="Total Items" value={formatNumber(inventory.length)} accent="text-blue-600" />
        <StatCard label="Total Value" value={formatCurrency(totalValue)} accent="text-green-600" />
        <StatCard label="Low Stock Items" value={formatNumber(lowStockItems.length)} accent="text-red-600" />
        <StatCard label="Categories" value={formatNumber(new Set(inventory.map(i => i.category?.name || i.category)).size)} accent="text-purple-600" />
      </div>

      {/* Low Stock Alert */}
      {lowStockItems.length > 0 && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
          <div className="flex items-start space-x-3">
            <AlertCircle className="w-5 h-5 text-yellow-600 mt-0.5" />
            <div>
              <h3 className="font-semibold text-yellow-800">Low Stock Alert</h3>
              <p className="text-sm text-yellow-700">
                The following items are below reorder point: {lowStockItems.map(i => i.name).join(', ')}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Scanned Product Details Modal */}
      {showProductModal && scannedProduct && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
            <h2 className="text-xl font-bold mb-4">Scanned Product Details</h2>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="font-medium text-gray-700">SKU:</span>
                <span className="text-gray-900 font-mono">{scannedProduct.sku}</span>
              </div>
              <div className="flex justify-between">
                <span className="font-medium text-gray-700">Name:</span>
                <span className="text-gray-900">{scannedProduct.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="font-medium text-gray-700">Category:</span>
                <span className="text-gray-900">{scannedProduct.category?.name || scannedProduct.category || 'N/A'}</span>
              </div>
              <div className="flex justify-between">
                <span className="font-medium text-gray-700">Quantity:</span>
                <span className={`font-semibold ${scannedProduct.quantity <= 2 ? 'text-red-600' : 'text-green-600'}`}>
                  {formatNumber(scannedProduct.quantity)}
                  {scannedProduct.quantity <= 2 && ' (Low Stock)'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="font-medium text-gray-700">Purchase Cost:</span>
                <span className="text-gray-900">{formatCurrency(scannedProduct.purchaseCost ?? 0)}</span>
              </div>
              <div className="flex justify-between">
                <span className="font-medium text-gray-700">Selling Price:</span>
                <span className="text-gray-900">{formatCurrency(scannedProduct.price)}</span>
              </div>
              <div className="flex justify-between">
                <span className="font-medium text-gray-700">Last Stocked:</span>
                <span className="text-gray-900">{formatDate(scannedProduct.lastStockedAt)}</span>
              </div>
            </div>
            <button
              onClick={closeProductModal}
              className="w-full mt-6 bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700"
            >
              Close
            </button>
          </div>
        </div>
      )}

      {/* Add New Stock Modal */}
      {showAddStockModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
            <h2 className="text-xl font-bold mb-4">Add New Stock</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Item Name *</label>
                <input
                  type="text"
                  value={newItem.name}
                  onChange={(e) => setNewItem({ ...newItem, name: e.target.value })}
                  className="w-full px-4 py-2 border rounded-lg"
                  placeholder="e.g. Samsung Galaxy S24"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Category *</label>
                <select
                  value={newItem.category}
                  onChange={(e) => setNewItem({ ...newItem, category: e.target.value })}
                  className="w-full px-4 py-2 border rounded-lg"
                >
                  <option value="">Select category</option>
                  {categories.length === 0 && (
                    <option value="" disabled>No categories found in database</option>
                  )}
                  {categories.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>
              <div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Quantity *</label>
                  <input
                    type="number"
                    value={newItem.quantity}
                    onChange={(e) => setNewItem({ ...newItem, quantity: e.target.value })}
                    className="w-full px-4 py-2 border rounded-lg"
                    min={0}
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Selling Price *</label>
                  <input
                    type="number"
                    value={newItem.price}
                    onChange={(e) => setNewItem({ ...newItem, price: e.target.value })}
                    className="w-full px-4 py-2 border rounded-lg"
                    placeholder="0.00"
                    min={0}
                    step="0.01"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Purchase Cost</label>
                  <input
                    type="number"
                    value={newItem.purchaseCost}
                    onChange={(e) => setNewItem({ ...newItem, purchaseCost: e.target.value })}
                    className="w-full px-4 py-2 border rounded-lg"
                    placeholder="0.00"
                    min={0}
                    step="0.01"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Stock Entry Date</label>
                <input
                  type="date"
                  value={stockDate}
                  onChange={(e) => setStockDate(e.target.value)}
                  className="w-full px-4 py-2 border rounded-lg"
                />
              </div>
            </div>
            <div className="flex space-x-3 mt-6">
              <button
                onClick={handleNewItemSubmit}
                className="flex-1 bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700"
              >
                Add New Stock
              </button>
              <button
                onClick={() => { setShowAddStockModal(false); setStockCategory(''); setNewItem({ name: '', category: '', quantity: 1, price: '', purchaseCost: '' }); }}
                className="flex-1 bg-gray-300 text-gray-700 py-2 rounded-lg hover:bg-gray-400"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Search and Add */}
      <div className="bg-white rounded-lg shadow p-4 mb-6">
        <div className="flex flex-wrap gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search by name, category, or SKU..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <button
            onClick={() => { setShowAddStockModal(true); setStockDate(new Date().toISOString().slice(0, 10)); setNewItem({ name: '', category: '', quantity: 1, price: '', purchaseCost: '' }); }}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add New Stock
          </button>
        </div>
      </div>

      {/* Inventory Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        {loading ? (
          <LoadingState message="Loading inventory..." />
        ) : filteredInventory.length === 0 ? (
          <div className="p-6">
            <EmptyState title="No inventory items found" description="Try a different search." />
          </div>
        ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">SKU</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Item Name</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Category</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Quantity</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Cost</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Selling Price</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Last Stocked</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredInventory.map((item) => (
                <tr key={item.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-mono text-gray-900">{item.sku}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{item.name}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{item.category?.name || item.category || 'N/A'}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`text-sm font-medium ${
                      item.quantity <= 2 ? 'text-red-600' : 'text-gray-900'
                    }`}>
                      {formatNumber(item.quantity)}
                    </span>
                    {item.quantity <= 2 && (
                      <span className="ml-2 text-xs text-red-500">(Low)</span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{formatCurrency(item.purchaseCost ?? 0)}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{formatCurrency(item.price)}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {formatDate(item.lastStockedAt)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <button onClick={() => handleDeleteItem(item.id)} className="text-red-600 hover:text-red-800">
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