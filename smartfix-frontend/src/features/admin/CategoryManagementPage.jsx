import React, { useEffect, useState } from 'react';
import { Plus, Trash2, Tag, Package, RefreshCw, Edit2, X, Check } from 'lucide-react';
import toast from 'react-hot-toast';

const SYSTEM_BACKEND_BASE_URL = process.env.REACT_APP_SYSTEM_BACKEND_URL || 'http://localhost:8080';

const DEFAULT_SEED = [
  { name: 'Laptop',      description: 'Portable personal computers' },
  { name: 'Desktop',     description: 'Stationary desktop computers' },
  { name: 'Smartphone',  description: 'Mobile phones and smartphones' },
  { name: 'Smartwatch',  description: 'Wearable smart devices' },
  { name: 'Spare Parts', description: 'Components: batteries, screens, etc.' },
];

export const CategoryManagementPage = () => {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(null);
  const [editId, setEditId] = useState(null);
  const [editName, setEditName] = useState('');
  const [editDesc, setEditDesc] = useState('');
  const [showAdd, setShowAdd] = useState(false);
  const [newName, setNewName] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [confirmDelete, setConfirmDelete] = useState(null);

  const load = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${SYSTEM_BACKEND_BASE_URL}/api/categories`);
      const data = res.ok ? await res.json() : [];
      setCategories(Array.isArray(data) ? data : []);
    } catch {
      setCategories([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const handleAdd = async () => {
    if (!newName.trim()) { toast.error('Category name is required'); return; }
    setSaving(true);
    try {
      const res = await fetch(`${SYSTEM_BACKEND_BASE_URL}/api/categories`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newName.trim(), description: newDesc.trim() }),
      });
      if (res.status === 409) { toast.error('Category already exists'); return; }
      if (!res.ok) throw new Error();
      toast.success(`Category "${newName}" created`);
      setNewName(''); setNewDesc(''); setShowAdd(false);
      await load();
    } catch {
      toast.error('Failed to create category');
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = async (id) => {
    if (!editName.trim()) { toast.error('Name cannot be empty'); return; }
    setSaving(true);
    try {
      const res = await fetch(`${SYSTEM_BACKEND_BASE_URL}/api/categories/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: editName.trim(), description: editDesc.trim() }),
      });
      if (!res.ok) throw new Error();
      toast.success('Category updated');
      setEditId(null);
      await load();
    } catch {
      toast.error('Failed to update category');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (cat) => {
    setDeleting(cat.id);
    try {
      const res = await fetch(`${SYSTEM_BACKEND_BASE_URL}/api/categories/${cat.id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error();
      toast.success(`"${cat.name}" deleted`);
      setConfirmDelete(null);
      await load();
    } catch {
      toast.error('Failed to delete category');
    } finally {
      setDeleting(null);
    }
  };

  const seedDefaults = async () => {
    setSaving(true);
    let added = 0;
    for (const cat of DEFAULT_SEED) {
      try {
        const res = await fetch(`${SYSTEM_BACKEND_BASE_URL}/api/categories`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(cat),
        });
        if (res.ok) added++;
      } catch { /* skip */ }
    }
    setSaving(false);
    toast.success(`${added} default categories added`);
    await load();
  };

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Category Management</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            Manage product categories used across inventory, sales, and repairs
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={load}
            className="flex items-center gap-1.5 px-3 py-2 border rounded-lg text-sm text-gray-600 hover:bg-gray-100"
          >
            <RefreshCw className="w-4 h-4" /> Refresh
          </button>
          {categories.length === 0 && (
            <button
              onClick={seedDefaults}
              disabled={saving}
              className="flex items-center gap-1.5 px-3 py-2 border border-blue-300 text-blue-700 bg-blue-50 rounded-lg text-sm hover:bg-blue-100 disabled:opacity-50"
            >
              <Package className="w-4 h-4" /> Seed Defaults
            </button>
          )}
          <button
            onClick={() => { setShowAdd(true); setNewName(''); setNewDesc(''); }}
            className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700"
          >
            <Plus className="w-4 h-4" /> Add Category
          </button>
        </div>
      </div>

      {/* Add form */}
      {showAdd && (
        <div className="bg-white rounded-xl shadow border p-5 mb-6 max-w-lg">
          <h3 className="font-semibold text-gray-900 mb-3">New Category</h3>
          <div className="space-y-3">
            <input
              type="text"
              placeholder="Category name *"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-blue-400"
              onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
            />
            <input
              type="text"
              placeholder="Description (optional)"
              value={newDesc}
              onChange={(e) => setNewDesc(e.target.value)}
              className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-blue-400"
            />
            <div className="flex gap-2">
              <button
                onClick={handleAdd}
                disabled={saving}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700 disabled:opacity-50"
              >
                {saving ? 'Saving...' : 'Create'}
              </button>
              <button
                onClick={() => setShowAdd(false)}
                className="px-4 py-2 border rounded-lg text-sm text-gray-600 hover:bg-gray-50"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Category table */}
      <div className="bg-white rounded-xl shadow overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center h-40">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
          </div>
        ) : categories.length === 0 ? (
          <div className="text-center py-16 text-gray-400">
            <Tag className="w-12 h-12 mx-auto mb-3 opacity-40" />
            <p className="text-lg font-medium">No categories yet</p>
            <p className="text-sm mt-1">Click "Seed Defaults" to add standard categories, or create your own.</p>
          </div>
        ) : (
          <table className="min-w-full divide-y divide-gray-100">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Category</th>
                <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Description</th>
                <th className="px-5 py-3 text-center text-xs font-semibold text-gray-500 uppercase">Items</th>
                <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Created</th>
                <th className="px-5 py-3 text-right text-xs font-semibold text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {categories.map((cat) => (
                <tr key={cat.id} className="hover:bg-gray-50">
                  <td className="px-5 py-3">
                    {editId === cat.id ? (
                      <input
                        type="text"
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        className="px-2 py-1 border rounded text-sm w-36 focus:ring-2 focus:ring-blue-400"
                      />
                    ) : (
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                          <Tag className="w-4 h-4 text-blue-600" />
                        </div>
                        <span className="font-medium text-gray-900 text-sm">{cat.name}</span>
                      </div>
                    )}
                  </td>
                  <td className="px-5 py-3">
                    {editId === cat.id ? (
                      <input
                        type="text"
                        value={editDesc}
                        onChange={(e) => setEditDesc(e.target.value)}
                        className="px-2 py-1 border rounded text-sm w-48 focus:ring-2 focus:ring-blue-400"
                      />
                    ) : (
                      <span className="text-sm text-gray-500">{cat.description || '—'}</span>
                    )}
                  </td>
                  <td className="px-5 py-3 text-center">
                    <span className={`text-sm font-semibold ${cat.itemCount > 0 ? 'text-blue-600' : 'text-gray-400'}`}>
                      {cat.itemCount}
                    </span>
                  </td>
                  <td className="px-5 py-3 text-sm text-gray-400">
                    {cat.createdAt ? new Date(cat.createdAt).toLocaleDateString() : '—'}
                  </td>
                  <td className="px-5 py-3 text-right">
                    {editId === cat.id ? (
                      <div className="flex justify-end gap-1">
                        <button
                          onClick={() => handleEdit(cat.id)}
                          disabled={saving}
                          className="p-1.5 text-green-600 hover:bg-green-50 rounded-lg"
                          title="Save"
                        >
                          <Check className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => setEditId(null)}
                          className="p-1.5 text-gray-400 hover:bg-gray-100 rounded-lg"
                          title="Cancel"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ) : (
                      <div className="flex justify-end gap-1">
                        <button
                          onClick={() => { setEditId(cat.id); setEditName(cat.name); setEditDesc(cat.description || ''); }}
                          className="p-1.5 text-blue-500 hover:bg-blue-50 rounded-lg"
                          title="Edit"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => setConfirmDelete(cat)}
                          disabled={deleting === cat.id}
                          className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg disabled:opacity-40"
                          title="Delete"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Confirm Delete Modal */}
      {confirmDelete && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl p-6 w-full max-w-sm">
            <div className="flex items-center justify-center w-12 h-12 bg-red-100 rounded-full mb-4 mx-auto">
              <Trash2 className="w-6 h-6 text-red-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 text-center mb-1">Delete Category?</h3>
            <p className="text-sm text-gray-500 text-center mb-2">
              You are about to delete{' '}
              <span className="font-semibold text-gray-900">"{confirmDelete.name}"</span>.
            </p>
            {confirmDelete.itemCount > 0 && (
              <p className="text-xs text-orange-600 bg-orange-50 border border-orange-200 rounded-lg px-3 py-2 mb-4 text-center">
                Warning: {confirmDelete.itemCount} inventory item{confirmDelete.itemCount !== 1 ? 's' : ''} use this category.
              </p>
            )}
            <div className="flex gap-3 mt-4">
              <button
                onClick={() => setConfirmDelete(null)}
                className="flex-1 px-4 py-2 text-sm text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDelete(confirmDelete)}
                disabled={deleting === confirmDelete.id}
                className="flex-1 px-4 py-2 text-sm text-white bg-red-600 hover:bg-red-700 rounded-lg disabled:opacity-50"
              >
                {deleting === confirmDelete.id ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
