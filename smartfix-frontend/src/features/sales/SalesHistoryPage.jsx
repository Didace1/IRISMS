// src/features/sales/SalesHistoryPage.jsx
import React, { useEffect, useState, useMemo } from 'react';
import {
  Search, Filter, ChevronDown, ChevronUp, DollarSign,
  ShoppingCart, TrendingUp, Calendar, FileText, Users
} from 'lucide-react';
import toast from 'react-hot-toast';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { PageHeader } from '../../shared/components/Common/PageHeader';
import { LoadingState } from '../../shared/components/Common/LoadingState';
import { EmptyState } from '../../shared/components/Common/EmptyState';
import { formatCurrency, formatNumber } from '../../shared/utils/formatters';

const SYSTEM_BACKEND_BASE_URL = process.env.REACT_APP_SYSTEM_BACKEND_URL || 'http://localhost:8080';

export const SalesHistoryPage = () => {
  const [sales, setSales] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [expandedSaleId, setExpandedSaleId] = useState(null);
  const [page, setPage] = useState(1);
  const pageSize = 15;

  useEffect(() => {
    const fetchSales = async () => {
      try {
        console.log('Fetching sales from:', `${SYSTEM_BACKEND_BASE_URL}/api/sales`);
        const res = await fetch(`${SYSTEM_BACKEND_BASE_URL}/api/sales`);
        console.log('Sales API response status:', res.status);
        
        if (res.ok) {
          const data = await res.json();
          console.log('Sales data received:', data);
          setSales(data);
          
          if (data.length === 0) {
            toast.success('Sales history loaded - no transactions yet');
          } else {
            toast.success(`Loaded ${data.length} sales records`);
          }
        } else {
          console.error('Sales API error:', res.status, res.statusText);
          toast.error(`Failed to load sales history (${res.status})`);
        }
      } catch (error) {
        console.error('Sales fetch error:', error);
        toast.error('System backend not reachable - make sure Spring Boot backend is running on port 8080');
      } finally {
        setLoading(false);
      }
    };
    fetchSales();
  }, []);

  // Sort newest first
  const sorted = useMemo(() => {
    return [...sales].sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
  }, [sales]);

  // Filter
  const filtered = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();
    return sorted.filter(sale => {
      // Text search
      if (q) {
        const haystack = [
          sale.customerName,
          sale.customerEmail,
          sale.customerPhone,
          sale.customerRef,
          String(sale.id),
          ...(sale.items || []).map(i => i.inventoryItem?.name || '')
        ].join(' ').toLowerCase();
        if (!haystack.includes(q)) return false;
      }
      // Date range
      if (dateFrom && sale.createdAt) {
        if (sale.createdAt.substring(0, 10) < dateFrom) return false;
      }
      if (dateTo && sale.createdAt) {
        if (sale.createdAt.substring(0, 10) > dateTo) return false;
      }
      return true;
    });
  }, [sorted, searchTerm, dateFrom, dateTo]);

  // Pagination
  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const currentPage = Math.min(page, totalPages);
  const pageItems = filtered.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  useEffect(() => { setPage(1); }, [searchTerm, dateFrom, dateTo]);

  // Summary stats
  const totalRevenue = filtered.reduce((sum, s) => sum + Number(s.total || 0), 0);
  const totalOrders = filtered.length;
  const avgOrder = totalOrders > 0 ? totalRevenue / totalOrders : 0;
  const uniqueCustomers = new Set(filtered.map(s => s.customerName || s.customerRef || s.id)).size;

  const formatDate = (dateStr) => {
    if (!dateStr) return '-';
    const d = new Date(dateStr);
    return isNaN(d.getTime()) ? '-' : d.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
  };

  const handleExportPDF = () => {
    const doc = new jsPDF();
    const pw = doc.internal.pageSize.getWidth();
    const now = new Date();
    const dateStr = now.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });

    // Header
    doc.setFillColor(192, 57, 43);
    doc.rect(0, 0, pw, 28, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(18);
    doc.setFont('helvetica', 'bold');
    doc.text('COREX LTD', 14, 14);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text('Sales History Report', 14, 22);
    doc.setFontSize(9);
    doc.text(`Generated: ${dateStr}`, pw - 14, 14, { align: 'right' });
    if (dateFrom || dateTo) {
      doc.text(`Period: ${dateFrom || 'Start'} to ${dateTo || 'Now'}`, pw - 14, 22, { align: 'right' });
    }

    let y = 38;

    // Summary
    doc.setTextColor(31, 41, 55);
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.text('Summary', 14, y);
    y += 8;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    const summaryItems = [
      ['Total Orders', formatNumber(totalOrders)],
      ['Total Revenue', formatCurrency(totalRevenue)],
      ['Average Order', formatCurrency(avgOrder)],
      ['Unique Customers', formatNumber(uniqueCustomers)],
    ];
    summaryItems.forEach(([label, value]) => {
      doc.setTextColor(107, 114, 128);
      doc.text(`${label}:`, 18, y);
      doc.setTextColor(31, 41, 55);
      doc.setFont('helvetica', 'bold');
      doc.text(value, 70, y);
      doc.setFont('helvetica', 'normal');
      y += 6;
    });
    y += 6;

    // Sales table
    autoTable(doc, {
      startY: y,
      head: [['#', 'Date', 'Customer', 'Items', 'Total (RWF)']],
      body: filtered.map((sale, i) => [
        String(i + 1),
        sale.createdAt ? new Date(sale.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '-',
        sale.customerName || sale.customerRef || '-',
        formatNumber((sale.items || []).length),
        formatCurrency(Number(sale.total || 0))
      ]),
      theme: 'grid',
      headStyles: { fillColor: [59, 130, 246], textColor: 255, fontStyle: 'bold', fontSize: 9 },
      bodyStyles: { fontSize: 8 },
      alternateRowStyles: { fillColor: [249, 250, 251] },
      margin: { left: 14, right: 14 },
    });

    // Footer
    const totalPgs = doc.internal.getNumberOfPages();
    for (let i = 1; i <= totalPgs; i++) {
      doc.setPage(i);
      doc.setFontSize(8);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(156, 163, 175);
      doc.text(
        `Corex Ltd — Sales History | Page ${i} of ${totalPgs}`,
        pw / 2, doc.internal.pageSize.getHeight() - 8,
        { align: 'center' }
      );
    }

    doc.save(`Sales_History_${now.toISOString().split('T')[0]}.pdf`);
    toast.success('PDF downloaded');
  };

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="flex items-center justify-between mb-6">
        <PageHeader title="Sales History" subtitle="View and search all past transactions" />
        <button
          onClick={handleExportPDF}
          className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white text-sm rounded-lg hover:bg-red-700"
        >
          <FileText className="w-4 h-4" /> Export PDF
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 border-l-4 border-l-blue-400 p-4">
          <p className="text-xs font-medium text-gray-500 uppercase">Total Orders</p>
          <p className="text-2xl font-bold text-blue-600 mt-1">{formatNumber(totalOrders)}</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 border-l-4 border-l-green-400 p-4">
          <p className="text-xs font-medium text-gray-500 uppercase">Total Revenue</p>
          <p className="text-2xl font-bold text-green-600 mt-1">{formatCurrency(totalRevenue)}</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 border-l-4 border-l-purple-400 p-4">
          <p className="text-xs font-medium text-gray-500 uppercase">Avg Order</p>
          <p className="text-2xl font-bold text-purple-600 mt-1">{formatCurrency(avgOrder)}</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 border-l-4 border-l-orange-400 p-4">
          <p className="text-xs font-medium text-gray-500 uppercase">Customers</p>
          <p className="text-2xl font-bold text-orange-600 mt-1">{formatNumber(uniqueCustomers)}</p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="md:col-span-2 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              placeholder="Search by customer, product, or sale ID..."
              className="w-full pl-10 pr-4 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">From</label>
            <input
              type="date"
              value={dateFrom}
              onChange={e => setDateFrom(e.target.value)}
              className="w-full px-3 py-2 border rounded-lg text-sm"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">To</label>
            <input
              type="date"
              value={dateTo}
              onChange={e => setDateTo(e.target.value)}
              className="w-full px-3 py-2 border rounded-lg text-sm"
            />
          </div>
        </div>
      </div>

      {/* Sales Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        {loading ? (
          <LoadingState message="Loading sales history..." />
        ) : filtered.length === 0 ? (
          <div className="p-6">
            <EmptyState title="No sales found" description="Try adjusting your search or date filters." />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase w-8"></th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Sale #</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date & Time</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Customer</th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Items</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {pageItems.map(sale => {
                  const isExpanded = expandedSaleId === sale.id;
                  const items = sale.items || [];
                  return (
                    <React.Fragment key={sale.id}>
                      <tr
                        onClick={() => setExpandedSaleId(isExpanded ? null : sale.id)}
                        className="hover:bg-gray-50 cursor-pointer transition-colors"
                      >
                        <td className="px-4 py-3 text-gray-400">
                          {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                        </td>
                        <td className="px-4 py-3 text-sm font-mono text-gray-700">#{sale.id}</td>
                        <td className="px-4 py-3 text-sm text-gray-600">{formatDate(sale.createdAt)}</td>
                        <td className="px-4 py-3">
                          <p className="text-sm font-medium text-gray-900">{sale.customerName || sale.customerRef || 'Walk-in'}</p>
                          {sale.customerEmail && (
                            <p className="text-xs text-gray-400">{sale.customerEmail}</p>
                          )}
                        </td>
                        <td className="px-4 py-3 text-sm text-center text-gray-700">{items.length}</td>
                        <td className="px-4 py-3 text-sm font-bold text-gray-900 text-right">
                          {formatCurrency(Number(sale.total || 0))}
                        </td>
                      </tr>
                      {isExpanded && items.length > 0 && (
                        <tr>
                          <td colSpan={6} className="px-4 py-0">
                            <div className="bg-gray-50 rounded-lg p-4 mb-3 mx-4">
                              <p className="text-xs font-semibold text-gray-500 uppercase mb-2">Items in this sale</p>
                              <table className="min-w-full">
                                <thead>
                                  <tr className="text-xs text-gray-400">
                                    <th className="text-left pb-1">Product</th>
                                    <th className="text-left pb-1">Category</th>
                                    <th className="text-center pb-1">Qty</th>
                                    <th className="text-right pb-1">Unit Price</th>
                                    <th className="text-right pb-1">Subtotal</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {items.map((item, idx) => {
                                    const name = item.inventoryItem?.name || item.name || 'Unknown';
                                    const category = item.inventoryItem?.category || '-';
                                    const qty = item.quantity || 0;
                                    const price = Number(item.unitPrice || 0);
                                    return (
                                      <tr key={idx} className="text-sm border-t border-gray-200">
                                        <td className="py-1.5 text-gray-900">{name}</td>
                                        <td className="py-1.5 text-gray-500">{category}</td>
                                        <td className="py-1.5 text-center text-gray-700">{formatNumber(qty)}</td>
                                        <td className="py-1.5 text-right text-gray-700">{formatCurrency(price)}</td>
                                        <td className="py-1.5 text-right font-medium text-gray-900">{formatCurrency(qty * price)}</td>
                                      </tr>
                                    );
                                  })}
                                </tbody>
                              </table>
                              {(sale.customerPhone) && (
                                <p className="text-xs text-gray-400 mt-2">Phone: {sale.customerPhone}</p>
                              )}
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Pagination */}
      {filtered.length > pageSize && (
        <div className="flex items-center justify-between mt-4">
          <p className="text-sm text-gray-500">
            Showing {formatNumber((currentPage - 1) * pageSize + 1)}–{formatNumber(Math.min(currentPage * pageSize, filtered.length))} of {formatNumber(filtered.length)} sales
          </p>
          <div className="flex gap-2">
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={currentPage <= 1}
              className={`px-3 py-1 rounded border text-sm ${currentPage <= 1 ? 'text-gray-400 bg-gray-100' : 'bg-white hover:bg-gray-50'}`}
            >Prev</button>
            <span className="px-3 py-1 text-sm text-gray-600">Page {currentPage} / {totalPages}</span>
            <button
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={currentPage >= totalPages}
              className={`px-3 py-1 rounded border text-sm ${currentPage >= totalPages ? 'text-gray-400 bg-gray-100' : 'bg-white hover:bg-gray-50'}`}
            >Next</button>
          </div>
        </div>
      )}
    </div>
  );
};
