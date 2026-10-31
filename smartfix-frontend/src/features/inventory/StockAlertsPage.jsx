// src/features/inventory/StockAlertsPage.jsx
import React, { useEffect, useState } from 'react';
import { AlertTriangle, Package, Tag, TrendingDown } from 'lucide-react';
import toast from 'react-hot-toast';
import { PageHeader } from '../../shared/components/Common/PageHeader';
import { formatNumber, formatCurrency } from '../../shared/utils/formatters';

export const StockAlertsPage = () => {
  const SYSTEM_BACKEND_BASE_URL = process.env.REACT_APP_SYSTEM_BACKEND_URL || 'http://localhost:8080';
  const [inventory, setInventory] = useState([]);
  const [categoryAlerts, setCategoryAlerts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadInventory = async () => {
      try {
        const res = await fetch(`${SYSTEM_BACKEND_BASE_URL}/api/inventory`);
        const data = await res.json();
        if (res.ok) {
          setInventory(data);
          
          // Group low stock items by category
          const lowStockItems = data.filter(item => (item.quantity || 0) <= (item.reorderPoint || 0));
          
          const categoryMap = {};
          lowStockItems.forEach(item => {
            const category = item.category?.name || item.category || 'Uncategorized';
            if (!categoryMap[category]) {
              categoryMap[category] = {
                name: category,
                items: [],
                totalItems: 0,
                totalValue: 0
              };
            }
            categoryMap[category].items.push(item);
            categoryMap[category].totalItems += 1;
            categoryMap[category].totalValue += (item.quantity || 0) * (item.price || 0);
          });
          
          const categoryAlertsArray = Object.values(categoryMap).sort((a, b) => b.totalItems - a.totalItems);
          setCategoryAlerts(categoryAlertsArray);
        } else {
          toast.error(data?.message || 'Failed to load inventory');
        }
      } catch {
        toast.error('System backend not reachable for inventory');
      } finally {
        setLoading(false);
      }
    };
    loadInventory();
  }, [SYSTEM_BACKEND_BASE_URL]);

  const totalLowStockItems = categoryAlerts.reduce((sum, cat) => sum + cat.totalItems, 0);
  const totalAffectedValue = categoryAlerts.reduce((sum, cat) => sum + cat.totalValue, 0);

  if (loading) {
    return (
      <div className="p-6 bg-gray-50 min-h-screen">
        <PageHeader title="Stock Alerts" subtitle="Loading inventory data..." />
        <div className="bg-white rounded-lg shadow p-6">
          <p className="text-gray-600">Loading stock alerts...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <PageHeader 
        title="Stock Alerts by Category" 
        subtitle="Low stock items organized by category for efficient management"
      />

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <AlertTriangle className="w-8 h-8 text-red-500 mr-3" />
            <div>
              <p className="text-sm text-gray-600">Total Low Stock Items</p>
              <p className="text-2xl font-bold text-red-600">{formatNumber(totalLowStockItems)}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <Tag className="w-8 h-8 text-orange-500 mr-3" />
            <div>
              <p className="text-sm text-gray-600">Affected Categories</p>
              <p className="text-2xl font-bold text-orange-600">{formatNumber(categoryAlerts.length)}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <TrendingDown className="w-8 h-8 text-purple-500 mr-3" />
            <div>
              <p className="text-sm text-gray-600">Affected Stock Value</p>
              <p className="text-2xl font-bold text-purple-600">{formatCurrency(totalAffectedValue)}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Category Alerts */}
      {categoryAlerts.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-8 text-center">
          <Package className="w-16 h-16 text-green-300 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-green-800 mb-2">All Stock Levels Good!</h2>
          <p className="text-green-600">No items are currently below their reorder points.</p>
        </div>
      ) : (
        <div className="space-y-6">
          {categoryAlerts.map((category, index) => (
            <div key={category.name} className="bg-white rounded-lg shadow">
              {/* Category Header */}
              <div className="bg-red-50 border-l-4 border-red-400 p-4 rounded-t-lg">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <AlertTriangle className="w-5 h-5 text-red-500 mr-2" />
                    <h3 className="text-lg font-semibold text-red-800">{category.name}</h3>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-red-600">{formatNumber(category.totalItems)} items low stock</p>
                    <p className="text-xs text-red-500">Value: {formatCurrency(category.totalValue)}</p>
                  </div>
                </div>
              </div>
              
              {/* Items List */}
              <div className="p-4">
                <div className="grid gap-3">
                  {category.items.map((item) => (
                    <div key={item.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border">
                      <div className="flex-1">
                        <h4 className="font-medium text-gray-900">{item.name}</h4>
                        <p className="text-sm text-gray-600">SKU: {item.sku || 'N/A'}</p>
                      </div>
                      
                      <div className="flex items-center space-x-6 text-sm">
                        <div className="text-center">
                          <p className="text-gray-500">Current Stock</p>
                          <p className="font-semibold text-red-600">{formatNumber(item.quantity || 0)}</p>
                        </div>
                        
                        <div className="text-center">
                          <p className="text-gray-500">Reorder Point</p>
                          <p className="font-semibold text-gray-700">{formatNumber(item.reorderPoint || 0)}</p>
                        </div>
                        
                        <div className="text-center">
                          <p className="text-gray-500">Unit Price</p>
                          <p className="font-semibold text-green-600">{formatCurrency(item.price || 0)}</p>
                        </div>
                        
                        <div className="text-center">
                          <p className="text-gray-500">Stock Value</p>
                          <p className="font-semibold text-purple-600">
                            {formatCurrency((item.quantity || 0) * (item.price || 0))}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
