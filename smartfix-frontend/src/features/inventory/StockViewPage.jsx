// src/features/inventory/StockViewPage.jsx
import React, { useEffect, useMemo, useState } from 'react';
import { Search } from 'lucide-react';
import toast from 'react-hot-toast';
import { PageHeader } from '../../shared/components/Common/PageHeader';
import { LoadingState } from '../../shared/components/Common/LoadingState';
import { EmptyState } from '../../shared/components/Common/EmptyState';

export const StockViewPage = () => {
  const SYSTEM_BACKEND_BASE_URL = process.env.REACT_APP_SYSTEM_BACKEND_URL || 'http://localhost:8080';
  const [inventory, setInventory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [category, setCategory] = useState('');
  const [modelQuery, setModelQuery] = useState('');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const CANONICAL_ORDER = ['Laptop', 'Desktop', 'Smartwatch', 'Smartphone', 'Spare Parts'];
  const isSpare = (s) => {
    const t = String(s || '').toLowerCase();
    return t.includes('spare') || t.includes('part') || t.includes('battery') || t.includes('screen');
  };
  const mapCategory = (item) => {
    const name = String(item?.name || '').toLowerCase();
    const cat = String(item?.category?.name || item?.category || '').toLowerCase();
    const combined = `${name} ${cat}`;
    if (isSpare(name) || isSpare(cat)) return 'Spare Parts';
    if (combined.includes('smartwatch') || combined.includes('watch')) return 'Smartwatch';
    if (combined.includes('desktop') || combined.includes('cpu')) return 'Desktop';
    if (combined.includes('phone') || combined.includes('iphone') || combined.includes('android') || combined.includes('smartphone')) return 'Smartphone';
    if (combined.includes('laptop') || combined.includes('notebook') || combined.includes('macbook')) return 'Laptop';
    return 'Other';
  };

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch(`${SYSTEM_BACKEND_BASE_URL}/api/inventory`);
        const data = await res.json();
        if (res.ok) setInventory(data);
        else toast.error(data?.message || 'Failed to load inventory');
      } catch {
        toast.error('System backend not reachable for inventory');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [SYSTEM_BACKEND_BASE_URL]);

  const categories = useMemo(() => {
    const present = new Set(inventory.map(i => mapCategory(i)));
    return CANONICAL_ORDER.filter(c => present.has(c));
  }, [inventory]);

  const filtered = useMemo(() => {
    const q = modelQuery.trim().toLowerCase();
    return inventory.filter(i => (!category || mapCategory(i) === category) && (!q || (i.name || '').toLowerCase().includes(q)));
  }, [inventory, category, modelQuery]);

  const totalForCategory = useMemo(() => {
    if (!category) return null;
    return inventory.filter(i => mapCategory(i) === category).reduce((sum, i) => sum + (i.quantity || 0), 0);
  }, [inventory, category]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const currentPage = Math.min(page, totalPages);
  const start = (currentPage - 1) * pageSize;
  const pageItems = filtered.slice(start, start + pageSize);

  useEffect(() => { setPage(1); }, [category, modelQuery, pageSize]);

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <PageHeader title="View Stock" subtitle="Browse stock by category and model with pagination" />

      <div className="bg-white rounded-lg shadow p-4 mb-4 grid grid-cols-1 md:grid-cols-5 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
          <select value={category} onChange={(e) => setCategory(e.target.value)} className="w-full px-3 py-2 border rounded-lg">
            <option value="">All categories</option>
            {categories.map(c => (<option key={c} value={c}>{c}</option>))}
          </select>
        </div>
        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-1">Model</label>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              value={modelQuery}
              onChange={(e) => setModelQuery(e.target.value)}
              placeholder="Type model name"
              className="w-full pl-9 pr-3 py-2 border rounded-lg"
            />
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Page size</label>
          <select value={pageSize} onChange={(e) => setPageSize(parseInt(e.target.value))} className="w-full px-3 py-2 border rounded-lg">
            {[5,10,20,50].map(s => (<option key={s} value={s}>{s}</option>))}
          </select>
        </div>
        <div className="flex items-end">
          <button onClick={() => { setCategory(''); setModelQuery(''); setPageSize(10); }} className="px-4 py-2 bg-gray-100 rounded-lg border">Clear</button>
        </div>
      </div>

      {category && (
        <div className="mb-4 text-sm text-gray-700">
          Total in stock for <span className="font-semibold">{category}</span>: {totalForCategory ?? 0}
        </div>
      )}

      <div className="bg-white rounded-lg shadow overflow-hidden">
        {loading ? (
          <LoadingState message="Loading stock..." />
        ) : filtered.length === 0 ? (
          <div className="p-6"><EmptyState title="No items" description="Try a different category or model." /></div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">SKU</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Model</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Category</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Quantity</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Last Stocked</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {pageItems.map(item => (
                  <tr key={item.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-mono text-gray-900">{item.sku}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{item.name}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{mapCategory(item)}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{item.quantity}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{item.lastStockedAt ? new Date(item.lastStockedAt).toLocaleString() : '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="flex items-center justify-between mt-4">
        <div className="text-sm text-gray-600">Page {currentPage} of {totalPages} • {filtered.length} items</div>
        <div className="space-x-2">
          <button
            onClick={() => setPage(p => Math.max(1, p - 1))}
            disabled={currentPage === 1}
            className={`px-3 py-1 rounded border ${currentPage === 1 ? 'text-gray-400 bg-gray-100' : 'bg-white'}`}
          >Prev</button>
          <button
            onClick={() => setPage(p => Math.min(totalPages, p + 1))}
            disabled={currentPage === totalPages}
            className={`px-3 py-1 rounded border ${currentPage === totalPages ? 'text-gray-400 bg-gray-100' : 'bg-white'}`}
          >Next</button>
        </div>
      </div>
    </div>
  );
};
