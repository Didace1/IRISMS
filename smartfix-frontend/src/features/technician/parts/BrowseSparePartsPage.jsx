import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { Package, Search, Filter, AlertCircle, CheckCircle } from 'lucide-react';
import { PageHeader } from '../../../shared/components/Common/PageHeader';
import { LoadingState } from '../../../shared/components/Common/LoadingState';

export const BrowseSparePartsPage = () => {
  const SYSTEM_BACKEND_BASE_URL = process.env.REACT_APP_SYSTEM_BACKEND_URL || 'http://localhost:8080';

  const [inventory, setInventory] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [stockFilter, setStockFilter] = useState('all'); // all, in-stock, low-stock, out-of-stock

  useEffect(() => {
    const loadData = async () => {
      try {
        const [inventoryResponse, categoriesResponse] = await Promise.all([
          fetch(`${SYSTEM_BACKEND_BASE_URL}/api/inventory`),
          fetch(`${SYSTEM_BACKEND_BASE_URL}/api/categories`)
        ]);

        if (inventoryResponse.ok) {
          const inventoryData = await inventoryResponse.json();
          // Filter to show only "Spare Parts" category items
          const sparePartItems = (Array.isArray(inventoryData) ? inventoryData : []).filter(item => {
            const categoryName = item.category?.name || '';
            return categoryName.includes('Spare Part');
          });
          setInventory(sparePartItems);
        }

        if (categoriesResponse.ok) {
          const categoriesData = await categoriesResponse.json();
          // Filter to show only "Spare Parts" category
          const sparePartCategories = (Array.isArray(categoriesData) ? categoriesData : []).filter(cat => {
            return cat.name?.includes('Spare Part');
          });
          setCategories(sparePartCategories);
        }
      } catch (error) {
        toast.error('Failed to load spare parts data');
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [SYSTEM_BACKEND_BASE_URL]);

  const getStockStatus = (item) => {
    if (item.quantity === 0) return 'out-of-stock';
    if (item.quantity <= item.reorderPoint) return 'low-stock';
    return 'in-stock';
  };

  const filteredInventory = inventory.filter((item) => {
    // Search filter
    const search = searchTerm.toLowerCase();
    const matchesSearch = 
      item.name?.toLowerCase().includes(search) ||
      item.sku?.toLowerCase().includes(search) ||
      item.category?.name?.toLowerCase().includes(search) ||
      item.description?.toLowerCase().includes(search);

    if (!matchesSearch) return false;

    // Category filter
    if (selectedCategory !== 'all' && item.category?.id !== parseInt(selectedCategory)) {
      return false;
    }

    // Stock filter
    if (stockFilter !== 'all') {
      const status = getStockStatus(item);
      if (stockFilter !== status) return false;
    }

    return true;
  });

  const getStockBadge = (item) => {
    const status = getStockStatus(item);
    
    if (status === 'out-of-stock') {
      return (
        <span className="inline-flex items-center gap-1 px-3 py-1 bg-red-100 text-red-700 rounded-full text-sm font-medium">
          <AlertCircle className="w-4 h-4" />
          Out of Stock
        </span>
      );
    }
    
    if (status === 'low-stock') {
      return (
        <span className="inline-flex items-center gap-1 px-3 py-1 bg-orange-100 text-orange-700 rounded-full text-sm font-medium">
          <AlertCircle className="w-4 h-4" />
          Low Stock ({item.quantity})
        </span>
      );
    }
    
    return (
      <span className="inline-flex items-center gap-1 px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm font-medium">
        <CheckCircle className="w-4 h-4" />
        In Stock ({item.quantity})
      </span>
    );
  };

  const stats = {
    total: inventory.length,
    inStock: inventory.filter(item => getStockStatus(item) === 'in-stock').length,
    lowStock: inventory.filter(item => getStockStatus(item) === 'low-stock').length,
    outOfStock: inventory.filter(item => getStockStatus(item) === 'out-of-stock').length
  };

  if (loading) {
    return <LoadingState message="Loading spare parts..." />;
  }

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <PageHeader
        title="Browse Spare Parts"
        subtitle="View available spare parts inventory"
      />

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Parts</p>
              <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
            </div>
            <Package className="w-8 h-8 text-blue-600" />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">In Stock</p>
              <p className="text-2xl font-bold text-green-600">{stats.inStock}</p>
            </div>
            <CheckCircle className="w-8 h-8 text-green-600" />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Low Stock</p>
              <p className="text-2xl font-bold text-orange-600">{stats.lowStock}</p>
            </div>
            <AlertCircle className="w-8 h-8 text-orange-600" />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Out of Stock</p>
              <p className="text-2xl font-bold text-red-600">{stats.outOfStock}</p>
            </div>
            <AlertCircle className="w-8 h-8 text-red-600" />
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow p-4 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search parts..."
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* Category Filter */}
          <div className="relative">
            <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none"
            >
              <option value="all">All Categories</option>
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.name}
                </option>
              ))}
            </select>
          </div>

          {/* Stock Filter */}
          <div className="relative">
            <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <select
              value={stockFilter}
              onChange={(e) => setStockFilter(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none"
            >
              <option value="all">All Stock Levels</option>
              <option value="in-stock">In Stock</option>
              <option value="low-stock">Low Stock</option>
              <option value="out-of-stock">Out of Stock</option>
            </select>
          </div>
        </div>
      </div>

      {/* Parts Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredInventory.length === 0 ? (
          <div className="col-span-full bg-white rounded-lg shadow p-12 text-center">
            <Package className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600 text-lg">No spare parts found</p>
            <p className="text-gray-500 text-sm mt-2">Try adjusting your filters</p>
          </div>
        ) : (
          filteredInventory.map((item) => (
            <div key={item.id} className="bg-white rounded-lg shadow hover:shadow-lg transition-shadow">
              <div className="p-6">
                {/* Header */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900 text-lg mb-1">{item.name}</h3>
                    <p className="text-sm text-gray-600">SKU: {item.sku || 'N/A'}</p>
                  </div>
                  <Package className="w-8 h-8 text-blue-600 flex-shrink-0" />
                </div>

                {/* Description */}
                {item.description && (
                  <p className="text-sm text-gray-600 mb-4 line-clamp-2">{item.description}</p>
                )}

                {/* Details */}
                <div className="space-y-2 mb-4">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Category:</span>
                    <span className="font-medium text-gray-900">{item.category?.name || 'N/A'}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Selling Price:</span>
                    <span className="font-medium text-gray-900">{item.price?.toLocaleString() || '0'} RWF</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Reorder Point:</span>
                    <span className="font-medium text-gray-900">{item.reorderPoint || 0}</span>
                  </div>
                </div>

                {/* Stock Status */}
                <div className="pt-4 border-t border-gray-200">
                  {getStockBadge(item)}
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Results Count */}
      {filteredInventory.length > 0 && (
        <div className="mt-6 text-center text-sm text-gray-600">
          Showing {filteredInventory.length} of {inventory.length} parts
        </div>
      )}
    </div>
  );
};
