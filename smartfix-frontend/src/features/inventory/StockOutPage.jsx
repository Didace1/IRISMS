import React, { useState, useEffect } from 'react';
import {
  AlertTriangle,
  Package,
  Search,
  Filter,
  RefreshCw,
  TrendingDown,
  Calendar,
  DollarSign,
  ShoppingCart,
  FileText
} from 'lucide-react';
import { formatCurrency, formatNumber } from '../../shared/utils/formatters';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

export const StockOutPage = () => {
  const [stockOutItems, setStockOutItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [categories, setCategories] = useState([]);

  const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:8080';

  useEffect(() => {
    fetchStockOutItems();
    fetchCategories();
  }, []);

  const fetchStockOutItems = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_BASE_URL}/api/inventory`);
      if (!response.ok) throw new Error('Failed to fetch inventory');
      
      const data = await response.json();
      
      // Filter items with quantity = 0
      const outOfStock = data.filter(item => item.quantity === 0);
      setStockOutItems(outOfStock);
    } catch (error) {
      console.error('Error fetching stock out items:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/categories`);
      if (!response.ok) throw new Error('Failed to fetch categories');
      const data = await response.json();
      setCategories(data);
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  };

  const filteredItems = stockOutItems.filter(item => {
    const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (item.brand && item.brand.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesCategory = selectedCategory === 'all' || 
                           (item.category && item.category.name === selectedCategory);
    return matchesSearch && matchesCategory;
  });

  const calculateTotalValue = () => {
    return filteredItems.reduce((sum, item) => sum + (item.price * item.reorderPoint), 0);
  };

  const handleExportPDF = () => {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    
    // Header
    doc.setFillColor(220, 38, 38); // Red color
    doc.rect(0, 0, pageWidth, 40, 'F');
    
    // Company Logo/Name
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(24);
    doc.setFont(undefined, 'bold');
    doc.text('COREX LTD', 14, 20);
    
    // Report Title
    doc.setFontSize(16);
    doc.text('Stock Out Items Report', 14, 32);
    
    // Date and Summary Info
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(10);
    doc.setFont(undefined, 'normal');
    const currentDate = new Date().toLocaleString('en-US', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
    doc.text(`Generated: ${currentDate}`, 14, 50);
    
    // Summary Box
    doc.setFillColor(249, 250, 251); // Light gray background
    doc.rect(14, 58, pageWidth - 28, 30, 'F');
    doc.setDrawColor(229, 231, 235);
    doc.rect(14, 58, pageWidth - 28, 30, 'S');
    
    doc.setFontSize(11);
    doc.setFont(undefined, 'bold');
    doc.text('Report Summary:', 18, 66);
    
    doc.setFont(undefined, 'normal');
    doc.setFontSize(10);
    doc.text(`Total Out of Stock Items: ${filteredItems.length}`, 18, 74);
    doc.text(`Estimated Restock Value: ${formatCurrency(calculateTotalValue())} RWF`, 18, 80);
    doc.text(`Categories Affected: ${new Set(filteredItems.map(item => item.category?.name).filter(Boolean)).size}`, 18, 86);
    
    // Table Data
    const tableData = filteredItems.map((item, index) => [
      index + 1,
      item.name,
      item.brand || 'N/A',
      item.category?.name || 'N/A',
      item.sku || 'N/A',
      item.reorderPoint.toString(),
      formatCurrency(item.price),
      item.supplier || 'N/A'
    ]);
    
    // Generate Table using autoTable
    autoTable(doc, {
      startY: 95,
      head: [['#', 'Item Name', 'Brand', 'Category', 'SKU', 'Reorder Pt', 'Price (RWF)', 'Supplier']],
      body: tableData,
      theme: 'striped',
      headStyles: {
        fillColor: [37, 99, 235], // Blue color
        textColor: [255, 255, 255],
        fontStyle: 'bold',
        fontSize: 9
      },
      bodyStyles: {
        fontSize: 8,
        textColor: [31, 41, 55]
      },
      alternateRowStyles: {
        fillColor: [249, 250, 251]
      },
      columnStyles: {
        0: { cellWidth: 10, halign: 'center' },
        1: { cellWidth: 35 },
        2: { cellWidth: 25 },
        3: { cellWidth: 25 },
        4: { cellWidth: 25 },
        5: { cellWidth: 18, halign: 'center' },
        6: { cellWidth: 25, halign: 'right' },
        7: { cellWidth: 25 }
      },
      margin: { left: 14, right: 14 },
      didDrawPage: (data) => {
        // Footer
        const footerY = pageHeight - 15;
        doc.setFontSize(8);
        doc.setTextColor(107, 114, 128);
        doc.text(
          `COREX LTD - Intelligent Repair, Inventory and Sales Management System`,
          pageWidth / 2,
          footerY,
          { align: 'center' }
        );
        doc.text(
          `Page ${doc.internal.getCurrentPageInfo().pageNumber}`,
          pageWidth - 14,
          footerY,
          { align: 'right' }
        );
      }
    });
    
    // Add total if items exist
    if (filteredItems.length > 0) {
      const finalY = doc.lastAutoTable.finalY + 10;
      
      if (finalY < pageHeight - 30) {
        doc.setFillColor(37, 99, 235);
        doc.rect(14, finalY, pageWidth - 28, 20, 'F');
        
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(11);
        doc.setFont(undefined, 'bold');
        doc.text('Total Estimated Restock Investment:', 18, finalY + 8);
        doc.text(`${formatCurrency(calculateTotalValue())} RWF`, pageWidth - 18, finalY + 8, { align: 'right' });
        
        doc.setFontSize(9);
        doc.setFont(undefined, 'normal');
        doc.text(`${filteredItems.length} items require immediate restocking`, 18, finalY + 15);
      }
    }
    
    // Save PDF
    doc.save(`Stock-Out-Report-${new Date().toISOString().split('T')[0]}.pdf`);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <RefreshCw className="w-12 h-12 text-blue-500 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Loading stock out items...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
              <AlertTriangle className="w-8 h-8 text-red-500" />
              Stock Out Items
            </h1>
            <p className="text-gray-600 mt-1">Items currently out of stock that need immediate attention</p>
          </div>
          <button
            onClick={fetchStockOutItems}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
            Refresh
          </button>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          <div className="bg-white rounded-xl shadow-md p-6 border-l-4 border-red-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Total Out of Stock</p>
                <p className="text-3xl font-bold text-gray-900">{filteredItems.length}</p>
              </div>
              <div className="p-3 bg-red-100 rounded-lg">
                <Package className="w-8 h-8 text-red-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-md p-6 border-l-4 border-yellow-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Estimated Restock Value</p>
                <p className="text-2xl font-bold text-gray-900">{formatCurrency(calculateTotalValue())} RWF</p>
              </div>
              <div className="p-3 bg-yellow-100 rounded-lg">
                <DollarSign className="w-8 h-8 text-yellow-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-md p-6 border-l-4 border-orange-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Categories Affected</p>
                <p className="text-3xl font-bold text-gray-900">
                  {new Set(filteredItems.map(item => item.category?.name).filter(Boolean)).size}
                </p>
              </div>
              <div className="p-3 bg-orange-100 rounded-lg">
                <TrendingDown className="w-8 h-8 text-orange-600" />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Filters and Search */}
      <div className="bg-white rounded-xl shadow-md p-6 mb-6">
        <div className="flex flex-col md:flex-row gap-4">
          {/* Search */}
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search by item name or brand..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          {/* Category Filter */}
          <div className="md:w-64">
            <div className="relative">
              <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none"
              >
                <option value="all">All Categories</option>
                {categories.map(category => (
                  <option key={category.id} value={category.name}>
                    {category.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Export PDF Button */}
          <button
            onClick={handleExportPDF}
            className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
          >
            <FileText className="w-4 h-4" />
            Export PDF
          </button>
        </div>
      </div>

      {/* Stock Out Items List */}
      {filteredItems.length === 0 ? (
        <div className="bg-white rounded-xl shadow-md p-12 text-center">
          <Package className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-900 mb-2">
            {searchTerm || selectedCategory !== 'all' ? 'No items found' : 'Great! No stock out items'}
          </h3>
          <p className="text-gray-600">
            {searchTerm || selectedCategory !== 'all' 
              ? 'Try adjusting your search or filter criteria'
              : 'All items are currently in stock'}
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-md overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Item Details</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Category</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">SKU</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Reorder Point</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Price</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Supplier</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredItems.map((item) => (
                  <tr key={item.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
                          <AlertTriangle className="w-6 h-6 text-red-600" />
                        </div>
                        <div>
                          <p className="font-semibold text-gray-900">{item.name}</p>
                          {item.brand && (
                            <p className="text-sm text-gray-600">{item.brand}</p>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-medium">
                        {item.category?.name || 'N/A'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-gray-900 font-mono text-sm">
                      {item.sku || 'N/A'}
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-gray-900 font-semibold">{item.reorderPoint} units</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-gray-900 font-semibold">{formatCurrency(item.price)} RWF</span>
                    </td>
                    <td className="px-6 py-4 text-gray-600">
                      {item.supplier || 'N/A'}
                    </td>
                    <td className="px-6 py-4">
                      <button
                        onClick={() => window.location.href = `/inventory?restock=${item.id}`}
                        className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
                      >
                        <ShoppingCart className="w-4 h-4" />
                        Restock
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Footer Info */}
      <div className="mt-6 text-center text-sm text-gray-600">
        <p>💡 Showing {filteredItems.length} out of stock item{filteredItems.length !== 1 ? 's' : ''}</p>
        <p className="mt-1">Last updated: {new Date().toLocaleString()}</p>
      </div>
    </div>
  );
};
