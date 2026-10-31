// src/features/sales/BrowseProductsPage.jsx
import React, { useEffect, useMemo, useState } from 'react';
import { Search } from 'lucide-react';
import toast from 'react-hot-toast';
import { PageHeader } from '../../shared/components/Common/PageHeader';
import { EmptyState } from '../../shared/components/Common/EmptyState';
import { LoadingState } from '../../shared/components/Common/LoadingState';
import { formatCurrency } from '../../shared/utils/formatters';

const QUICK_CATEGORY_FILTERS = ['all', 'laptop', 'desktop', 'smartwatch', 'phone', 'spare part'];

export const BrowseProductsPage = () => {
  const SYSTEM_BACKEND_BASE_URL = process.env.REACT_APP_SYSTEM_BACKEND_URL || 'http://localhost:8080';
  const [products, setProducts] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    loadProducts();
  }, []);

  const loadProducts = async () => {
    try {
      const response = await fetch(`${SYSTEM_BACKEND_BASE_URL}/api/sales/products`);
      const data = await response.json();
      if (response.ok) {
        setProducts(data.map((item) => ({
          id: item.id,
          name: item.name,
          price: Number(item.price),
          category: item.category?.name || item.category || 'N/A',
          stock: item.quantity
        })));
      }
    } catch {
      toast.error('Failed to load products');
    } finally {
      setLoading(false);
    }
  };

  const isSparePartCategory = (category) => {
    const normalized = String(category || '').toLowerCase();
    return normalized.includes('spare') || normalized.includes('part') || normalized.includes('battery') || normalized.includes('screen');
  };

  const mapProductToSalesCategory = (product) => {
    const name = String(product?.name || '').toLowerCase();
    const category = String(product?.category || '').toLowerCase();
    const combined = `${name} ${category}`;

    if (isSparePartCategory(category) || isSparePartCategory(name)) return 'Spare Part';
    if (combined.includes('smartwatch') || combined.includes('watch')) return 'Smartwatch';
    if (combined.includes('desktop') || combined.includes('cpu')) return 'Desktop';
    if (combined.includes('phone') || combined.includes('iphone') || combined.includes('android') || combined.includes('smartphone')) return 'Phone';
    if (combined.includes('laptop') || combined.includes('notebook') || combined.includes('macbook')) return 'Laptop';
    return 'Other';
  };



  const filteredProducts = useMemo(() => {
    const normalizedSearch = searchTerm.trim().toLowerCase();
    const normalizedQuickFilter = String(categoryFilter || '').toLowerCase();

    return products.filter((product) => {
      const productName = String(product.name || '').toLowerCase();
      const productCategory = String(product.category || '').toLowerCase();
      const businessCategory = mapProductToSalesCategory(product).toLowerCase();

      const matchesSearch =
        normalizedSearch.length === 0 ||
        productName.includes(normalizedSearch) ||
        productCategory.includes(normalizedSearch);

      const matchesCategory =
        normalizedQuickFilter === 'all' ||
        businessCategory === normalizedQuickFilter;

      return matchesSearch && matchesCategory;
    });
  }, [products, searchTerm, categoryFilter]);

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <PageHeader
        title="Browse Products"
        subtitle="Browse all available products in the system"
      />

      {/* Product Browsing Section */}
      <div className="bg-white rounded-lg shadow-lg p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">All Products</h2>
          </div>
          <div className="text-sm text-gray-600">
            <span className="font-semibold">{filteredProducts.length}</span> products available
          </div>
        </div>

        {/* Search and Filter Bar */}
        <div className="mb-6 space-y-4">
          {/* Search Input */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search products by name or category..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          {/* Category Filter Buttons */}
          <div className="flex flex-wrap gap-2">
            {QUICK_CATEGORY_FILTERS.map((category) => (
              <button
                key={category}
                onClick={() => setCategoryFilter(category)}
                className={`px-4 py-2 rounded-lg font-medium text-sm transition-colors ${
                  categoryFilter === category
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {category.charAt(0).toUpperCase() + category.slice(1)}
              </button>
            ))}
          </div>
        </div>

        {/* Products Grid */}
        {loading ? (
          <LoadingState message="Loading products..." />
        ) : filteredProducts.length === 0 ? (
          <EmptyState 
            title="No products found" 
            description="Try adjusting your search or filters" 
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredProducts.map((product) => {
              const isOutOfStock = product.stock === 0;

              return (
                <div
                  key={product.id}
                  className={`bg-white border-2 rounded-lg p-5 transition-all hover:shadow-lg border-gray-200 ${isOutOfStock ? 'opacity-60' : ''}`}
                >
                  {/* Product Header */}
                  <div className="mb-4">
                    <div className="flex items-start justify-between mb-2">
                      <h3 className="font-bold text-gray-900 text-lg leading-tight flex-1">
                        {product.name}
                      </h3>
                    </div>
                    <p className="text-sm text-gray-600 mb-1">
                      <span className="font-medium">Category:</span> {product.category}
                    </p>
                  </div>

                  {/* Price and Stock */}
                  <div className="mb-4 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Price:</span>
                      <span className="text-xl font-bold text-blue-600">
                        {formatCurrency(product.price)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Stock:</span>
                      <span className={`text-sm font-semibold ${
                        product.stock === 0 ? 'text-red-600' : 
                        product.stock < 5 ? 'text-orange-600' : 
                        'text-green-600'
                      }`}>
                        {product.stock} units
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
