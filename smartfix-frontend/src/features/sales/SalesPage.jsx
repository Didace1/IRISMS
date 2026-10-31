// src/features/sales/SalesPage.jsx
import React, { useEffect, useMemo, useState } from 'react';
import { ShoppingCart, Search, Plus, Minus, Trash2, Printer, Banknote, TrendingUp, UserRound, Wrench, Share2, Mail, MessageCircle, Copy, FileText } from 'lucide-react';
import toast from 'react-hot-toast';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { PageHeader } from '../../shared/components/Common/PageHeader';
import { StatCard } from '../../shared/components/Common/StatCard';
import { EmptyState } from '../../shared/components/Common/EmptyState';
import { LoadingState } from '../../shared/components/Common/LoadingState';
import { DEVICE_MODELS_BY_CATEGORY } from '../../constants/deviceModels';
import { formatCurrency, formatNumber } from '../../shared/utils/formatters';

const SALE_SERVICE_LOG_KEY = 'sales_device_service_log';
const DEVICE_TYPE_OPTIONS = ['Laptop', 'Desktop', 'Phone', 'Tablet', 'Other'];
const SALES_CATEGORY_OPTIONS = ['Laptop', 'Desktop', 'Smartwatch', 'Phone', 'Spare Part'];
const QUICK_CATEGORY_FILTERS = ['all', 'laptop', 'desktop', 'smartwatch', 'phone', 'spare part'];

const generateCustomerRef = () => `WALKIN-${Date.now().toString().slice(-6)}`;
const generatePickupCode = () => String(Math.floor(1000 + Math.random() * 9000));

export const SalesPage = () => {
  const SYSTEM_BACKEND_BASE_URL = process.env.REACT_APP_SYSTEM_BACKEND_URL || 'http://localhost:8080';
  const [cart, setCart] = useState([]);
  const [products, setProducts] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedModel, setSelectedModel] = useState('');
  const [customerInfo, setCustomerInfo] = useState({ name: '' });
  const [anonymousCustomer, setAnonymousCustomer] = useState(false);
  const [customerRef, setCustomerRef] = useState(generateCustomerRef());
  const [pickupCode, setPickupCode] = useState(generatePickupCode());
  const [serviceContext, setServiceContext] = useState({
    deviceType: '',
    deviceModel: '',
    repairNeeded: false,
    repairNote: ''
  });
  const [sales, setSales] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isCheckingOut, setIsCheckingOut] = useState(false);
  const [lastReceipt, setLastReceipt] = useState(null);
  const [receiptDeliveryMode, setReceiptDeliveryMode] = useState('print');
  const [socialShareChannel, setSocialShareChannel] = useState('whatsapp');
  const [customerWillingToProceed, setCustomerWillingToProceed] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [showReceiptModal, setShowReceiptModal] = useState(false);
  const PRODUCTS_PER_PAGE = 6;

  useEffect(() => {
    loadProducts();
    loadTodaySales();
    // Load cart from BrowseProducts page if it exists
    const savedCart = localStorage.getItem('browse_cart');
    if (savedCart) {
      try {
        const parsedCart = JSON.parse(savedCart);
        if (parsedCart.length > 0) {
          setCart(parsedCart);
          toast.success(`Loaded ${parsedCart.length} item(s) from Browse Products`);
          // Clear the localStorage after loading
          localStorage.removeItem('browse_cart');
        }
      } catch (e) {
        console.error('Failed to load cart from localStorage', e);
      }
    }
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
      toast.error('System backend not reachable for products');
    } finally {
      setLoading(false);
    }
  };

  const loadTodaySales = async () => {
    try {
      const response = await fetch(`${SYSTEM_BACKEND_BASE_URL}/api/sales/today`);
      const data = await response.json();
      if (response.ok) {
        setSales(data.map((sale) => ({
          ...sale,
          customer: sale.customer,
          date: new Date(sale.date)
        })));
      }
    } catch {
      // Keep quiet to avoid blocking POS.
    }
  };

  const addToCart = (product) => {
    const existingItem = cart.find(item => item.id === product.id);
    if (existingItem) {
      if (existingItem.quantity < product.stock) {
        setCart(cart.map(item =>
          item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
        ));
      } else {
        toast.error('Not enough stock');
      }
    } else {
      setCart([...cart, { ...product, quantity: 1 }]);
    }
  };

  const removeFromCart = (id) => {
    setCart(cart.filter(item => item.id !== id));
  };

  const updateQuantity = (id, newQuantity) => {
    const product = products.find(p => p.id === id);
    if (!product) return;

    const normalizedQuantity = Number(newQuantity);
    if (!Number.isFinite(normalizedQuantity)) return;

    if (normalizedQuantity > 0 && normalizedQuantity <= product.stock) {
      setCart(cart.map(item =>
        item.id === id ? { ...item, quantity: normalizedQuantity } : item
      ));
    } else if (normalizedQuantity > product.stock) {
      toast.error(`Only ${product.stock} items available in stock`);
    }
  };

  const adjustCartQuantity = (id, direction) => {
    const existing = cart.find((item) => item.id === id);
    if (!existing) return;

    const nextQuantity = direction === 'increment'
      ? existing.quantity + 1
      : existing.quantity - 1;

    if (nextQuantity <= 0) {
      removeFromCart(id);
      return;
    }

    updateQuantity(id, nextQuantity);
  };

  const saveLocalServiceLog = (checkoutTotal) => {
    const hasServiceContext = serviceContext.deviceType || serviceContext.deviceModel || serviceContext.repairNote;
    if (!hasServiceContext) return;

    const existingLogs = JSON.parse(localStorage.getItem(SALE_SERVICE_LOG_KEY) || '[]');
    const saleLog = {
      id: `sale-${Date.now()}`,
      createdAt: new Date().toISOString(),
      customer: {
        mode: 'identified',
        ...customerInfo
      },
      serviceContext,
      items: cart.map((item) => ({
        id: item.id,
        name: item.name,
        category: item.category,
        quantity: item.quantity,
        unitPrice: item.price
      })),
      total: checkoutTotal
    };

    const nextLogs = [saleLog, ...existingLogs].slice(0, 100);
    localStorage.setItem(SALE_SERVICE_LOG_KEY, JSON.stringify(nextLogs));
  };

  const calculateTotal = () => {
    return cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  };

  const isSparePartCategory = (category) => {
    const normalized = String(category || '').toLowerCase();
    return normalized.includes('spare') || normalized.includes('part') || normalized.includes('battery') || normalized.includes('screen');
  };

  const mapProductToSalesCategory = (product) => {
    const name = String(product?.name || '').toLowerCase();
    const category = String(product?.category?.name || product?.category || '').toLowerCase();
    const combined = `${name} ${category}`;

    if (isSparePartCategory(category) || isSparePartCategory(name)) return 'Spare Part';
    if (combined.includes('smartwatch') || combined.includes('watch')) return 'Smartwatch';
    if (combined.includes('desktop') || combined.includes('cpu')) return 'Desktop';
    if (combined.includes('phone') || combined.includes('iphone') || combined.includes('android') || combined.includes('smartphone')) return 'Phone';
    if (combined.includes('laptop') || combined.includes('notebook') || combined.includes('macbook')) return 'Laptop';
    return 'Other';
  };

  const availableCategories = useMemo(
    () => SALES_CATEGORY_OPTIONS,
    [products]
  );

  const availableModels = useMemo(() => {
    if (!selectedCategory) return [];
    const inventoryModels = products
      .filter((product) => mapProductToSalesCategory(product) === selectedCategory)
      .map((product) => product.name)
      .filter(Boolean)
      .sort((a, b) => a.localeCompare(b));

    const predefinedModels = DEVICE_MODELS_BY_CATEGORY[selectedCategory] || [];

    return Array.from(new Set([...predefinedModels, ...inventoryModels]));
  }, [products, selectedCategory]);

  const buildReceiptText = (receipt) => {
    if (!receipt) return '';

    const lines = [
      'COREX RECEIPT',
      `Receipt ID: ${receipt.saleId}`,
      `Date: ${new Date(receipt.createdAt).toLocaleString()}`,
      `Customer: ${receipt.customerName}`,
      receipt.customerRef ? `Customer Ref: ${receipt.customerRef}` : null,
      receipt.pickupCode ? `Pickup Code: ${receipt.pickupCode}` : null,
      `Device: ${receipt.deviceType || 'N/A'} ${receipt.deviceModel ? `(${receipt.deviceModel})` : ''}`,
      '',
      'Items:'
    ].filter(Boolean);

    receipt.items.forEach((item) => {
      lines.push(`- ${item.name} x ${item.quantity} @ ${formatCurrency(item.unitPrice)}`);
    });

    lines.push('', `TOTAL: ${formatCurrency(receipt.total)}`);
    lines.push('Thank you for choosing Corex.');
    return lines.join('\n');
  };

  const handlePrintReceipt = (receiptOverride = null) => {
    const receipt = receiptOverride || lastReceipt;
    if (!receipt) return;

    const printWindow = window.open('', '_blank', 'width=800,height=700');
    if (!printWindow) {
      toast.error('Please allow popups to print receipt.');
      return;
    }

    const itemRows = receipt.items
      .map((item) => `<tr><td>${item.name}</td><td>${item.quantity}</td><td>${formatCurrency(item.unitPrice)}</td></tr>`)
      .join('');

    printWindow.document.write(`
      <html>
        <head>
          <title>Corex Receipt</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 24px; }
            h2 { margin: 0 0 8px; }
            p { margin: 4px 0; }
            table { width: 100%; border-collapse: collapse; margin-top: 12px; }
            th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
            .total { margin-top: 12px; font-size: 18px; font-weight: bold; }
          </style>
        </head>
        <body>
          <h2>Corex Receipt</h2>
          <p><strong>Receipt ID:</strong> ${receipt.saleId}</p>
          <p><strong>Date:</strong> ${new Date(receipt.createdAt).toLocaleString()}</p>
          <p><strong>Customer:</strong> ${receipt.customerName}</p>
          ${receipt.customerRef ? `<p><strong>Customer Ref:</strong> ${receipt.customerRef}</p>` : ''}
          ${receipt.pickupCode ? `<p><strong>Pickup Code:</strong> ${receipt.pickupCode}</p>` : ''}
          <p><strong>Device:</strong> ${receipt.deviceType || 'N/A'} ${receipt.deviceModel ? `(${receipt.deviceModel})` : ''}</p>
          <table>
            <thead>
              <tr><th>Item</th><th>Qty</th><th>Unit Price</th></tr>
            </thead>
            <tbody>${itemRows}</tbody>
          </table>
          <p class="total">Total: ${formatCurrency(receipt.total)}</p>
          <p>Thank you for choosing Corex.</p>
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.focus();
    printWindow.print();
  };

  const handleCopyReceipt = async (receiptOverride = null) => {
    const receipt = receiptOverride || lastReceipt;
    if (!receipt) return;
    try {
      await navigator.clipboard.writeText(buildReceiptText(receipt));
      toast.success('Receipt copied.');
    } catch {
      toast.error('Could not copy receipt.');
    }
  };

  const handleShareWhatsApp = (receiptOverride = null) => {
    const receipt = receiptOverride || lastReceipt;
    if (!receipt) return;
    const receiptText = buildReceiptText(receipt);
    const url = `https://wa.me/?text=${encodeURIComponent(receiptText)}`;
    window.open(url, '_blank');
  };

  const handleShareEmail = (receiptOverride = null) => {
    const receipt = receiptOverride || lastReceipt;
    if (!receipt) return;
    const subject = `Corex Receipt ${receipt.saleId}`;
    const body = buildReceiptText(receipt);
    window.location.href = `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  };

  const handleNativeShare = async (receiptOverride = null) => {
    const receipt = receiptOverride || lastReceipt;
    if (!receipt || !navigator.share) {
      toast.error('Share is not supported on this browser.');
      return;
    }

    try {
      await navigator.share({
        title: `Corex Receipt ${receipt.saleId}`,
        text: buildReceiptText(receipt)
      });
    } catch {
    }
  };

  const handleInstagramShare = async (receiptOverride = null) => {
    await handleCopyReceipt(receiptOverride);
    window.open('https://www.instagram.com/direct/inbox/', '_blank');
    toast.success('Paste copied receipt in Instagram DM.');
  };

  const handleGeneratePDF = (receiptOverride = null) => {
    const receipt = receiptOverride || lastReceipt;
    if (!receipt) return;

    try {
      const doc = new jsPDF();
      const pageWidth = doc.internal.pageSize.getWidth();
      const margin = 20;
      
      // Header
      doc.setFontSize(20);
      doc.setFont(undefined, 'bold');
      doc.text('COREX RECEIPT', pageWidth / 2, 30, { align: 'center' });
      
      // Company info
      doc.setFontSize(10);
      doc.setFont(undefined, 'normal');
      doc.text('Corex Device Repair & Sales', pageWidth / 2, 40, { align: 'center' });
      doc.text('Professional Device Repair Services', pageWidth / 2, 45, { align: 'center' });
      
      // Receipt details
      doc.setFontSize(12);
      doc.setFont(undefined, 'bold');
      let yPos = 60;
      
      doc.text(`Receipt ID: ${receipt.saleId}`, margin, yPos);
      yPos += 8;
      doc.text(`Date: ${new Date(receipt.createdAt).toLocaleString()}`, margin, yPos);
      yPos += 8;
      doc.text(`Customer: ${receipt.customerName}`, margin, yPos);
      yPos += 8;
      
      if (receipt.customerRef) {
        doc.text(`Customer Ref: ${receipt.customerRef}`, margin, yPos);
        yPos += 8;
      }
      
      if (receipt.pickupCode) {
        doc.text(`Pickup Code: ${receipt.pickupCode}`, margin, yPos);
        yPos += 8;
      }
      
      doc.text(`Device: ${receipt.deviceType || 'N/A'} ${receipt.deviceModel ? `(${receipt.deviceModel})` : ''}`, margin, yPos);
      yPos += 15;
      
      // Items table
      const tableData = receipt.items.map(item => [
        item.name,
        item.quantity.toString(),
        formatCurrency(item.unitPrice),
        formatCurrency(item.quantity * item.unitPrice)
      ]);
      
      autoTable(doc, {
        startY: yPos,
        head: [['Item', 'Qty', 'Unit Price', 'Total']],
        body: tableData,
        theme: 'grid',
        headStyles: { fillColor: [59, 130, 246] }, // Blue header
        styles: { fontSize: 10 },
        columnStyles: {
          0: { cellWidth: 80 },
          1: { cellWidth: 20, halign: 'center' },
          2: { cellWidth: 35, halign: 'right' },
          3: { cellWidth: 35, halign: 'right' }
        }
      });
      
      // Total
      const finalY = doc.lastAutoTable.finalY + 10;
      doc.setFontSize(14);
      doc.setFont(undefined, 'bold');
      doc.text(`TOTAL: ${formatCurrency(receipt.total)}`, pageWidth - margin, finalY, { align: 'right' });
      
      // Footer
      doc.setFontSize(10);
      doc.setFont(undefined, 'normal');
      doc.text('Thank you for choosing Corex!', pageWidth / 2, finalY + 20, { align: 'center' });
      doc.text('For support, contact us at support@corex.com', pageWidth / 2, finalY + 25, { align: 'center' });
      
      // Save the PDF
      const fileName = `Corex_Receipt_${receipt.saleId}_${new Date().toISOString().slice(0, 10)}.pdf`;
      doc.save(fileName);
      
      toast.success('PDF receipt generated and downloaded!');
    } catch (error) {
      console.error('PDF generation error:', error);
      toast.error('Failed to generate PDF receipt');
    }
  };

  const deliverReceiptByCustomerChoice = async (receipt) => {
    if (!receipt) return;

    if (receiptDeliveryMode === 'print') {
      handlePrintReceipt(receipt);
      return;
    }

    if (socialShareChannel === 'email') {
      handleShareEmail(receipt);
      return;
    }

    if (socialShareChannel === 'instagram') {
      await handleInstagramShare(receipt);
      return;
    }

    if (socialShareChannel === 'native') {
      await handleNativeShare(receipt);
      return;
    }

    handleShareWhatsApp(receipt);
  };

  const handleCheckout = async () => {
    if (cart.length === 0) {
      toast.error('Cart is empty');
      return;
    }

    // Always require customer name - no anonymous sales allowed
    if (!customerInfo.name.trim()) {
      toast.error('Customer name is required for all sales');
      return;
    }


    try {
      setIsCheckingOut(true);
      const checkoutTotal = calculateTotal();
      const response = await fetch(`${SYSTEM_BACKEND_BASE_URL}/api/sales/checkout`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customerInfo: {
            name: customerInfo.name,
            email: '',
            phone: ''
          },
          cartItems: cart.map((item) => ({ id: item.id, quantity: item.quantity })),
          anonymousCustomer: false, // Always require customer name
          customerRef: null,
          pickupCode: null
        })
      });
      const data = await response.json();
      if (!response.ok) {
        toast.error(data?.message || 'Sale failed');
        return;
      }

      const receiptSnapshot = {
        saleId: data?.id || `local-${Date.now()}`,
        createdAt: new Date().toISOString(),
        customerName: customerInfo.name,
        customerEmail: '',
        customerPhone: '',
        customerRef: null,
        pickupCode: null,
        deviceType: serviceContext.deviceType,
        deviceModel: serviceContext.deviceModel,
        items: cart.map((item) => ({
          id: item.id,
          name: item.name,
          quantity: item.quantity,
          unitPrice: item.price
        })),
        total: checkoutTotal
      };

      setLastReceipt(receiptSnapshot);
      saveLocalServiceLog(checkoutTotal);
      setShowReceiptModal(true);
      setCart([]);
      setCustomerInfo({ name: '' });
      setAnonymousCustomer(false); // Always require customer name
      setCustomerRef('');
      setPickupCode('');
      setCustomerWillingToProceed(false);
      setServiceContext({
        deviceType: '',
        deviceModel: '',
        repairNeeded: false,
        repairNote: ''
      });
      await loadProducts();
      await loadTodaySales();
      toast.success('Sale completed successfully');
    } catch {
      toast.error('System backend not reachable for checkout');
    } finally {
      setIsCheckingOut(false);
    }
  };

  const filteredProducts = useMemo(() => {
    const normalizedSearch = searchTerm.trim().toLowerCase();
    const normalizedQuickFilter = String(categoryFilter || '').toLowerCase();

    const activeCategory = selectedCategory || (normalizedQuickFilter === 'all' ? '' : normalizedQuickFilter);

    return products.filter((product) => {
      const productName = String(product.name || '').toLowerCase();
      const productCategory = String(product.category?.name || product.category || '').toLowerCase();
      const businessCategory = mapProductToSalesCategory(product).toLowerCase();

      const matchesSearch =
        normalizedSearch.length === 0 ||
        productName.includes(normalizedSearch) ||
        productCategory.includes(normalizedSearch);

      const matchesCategory =
        !activeCategory ||
        businessCategory === String(activeCategory).toLowerCase();

      const matchesModel =
        !selectedModel ||
        String(product.name || '') === selectedModel;

      return matchesSearch && matchesCategory && matchesModel;
    });
  }, [products, searchTerm, categoryFilter, selectedCategory, selectedModel]);

  const sparePartsCount = useMemo(
    () => filteredProducts.filter((product) => isSparePartCategory(product.category?.name || product.category)).length,
    [filteredProducts]
  );

  const todaySales = sales.filter(s => s.date.toDateString() === new Date().toDateString());
  const todayRevenue = todaySales.reduce((sum, sale) => sum + sale.total, 0);
  const cartItemCount = cart.reduce((sum, item) => sum + item.quantity, 0);
  const uniqueCustomersToday = new Set(todaySales.map((sale) => sale.customer)).size;

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <PageHeader
        title="Sales & Customer Intake"
        subtitle="Record device sales clearly and capture customer repair needs"
      />

      {/* Sales Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
        <StatCard label="Today's Sales" value={todaySales.length} accent="text-green-600" icon={<ShoppingCart className="w-8 h-8" />} />
        <StatCard label="Today's Revenue" value={formatCurrency(todayRevenue)} accent="text-green-600" icon={<Banknote className="w-8 h-8" />} />
        <StatCard label="Cart Total" value={formatCurrency(calculateTotal())} accent="text-green-600" icon={<Printer className="w-8 h-8" />} />
        <StatCard label="Unique Customers" value={uniqueCustomersToday} accent="text-green-600" icon={<TrendingUp className="w-8 h-8" />} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Product Browsing Section */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-lg shadow-lg p-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">All Products</h2>
                <p className="text-gray-600 mt-1">Click "Add to Cart" to add items</p>
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
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                {filteredProducts.map((product) => {
                  const isInCart = cart.some(item => item.id === product.id);
                  const cartItem = cart.find(item => item.id === product.id);
                  const isOutOfStock = product.stock === 0;

                  return (
                    <div
                      key={product.id}
                      className={`bg-white border-2 rounded-lg p-5 transition-all hover:shadow-lg ${
                        isInCart ? 'border-green-500 bg-green-50' : 'border-gray-200'
                      } ${isOutOfStock ? 'opacity-60' : ''}`}
                    >
                      {/* Product Header */}
                      <div className="mb-4">
                        <div className="flex items-start justify-between mb-2">
                          <h3 className="font-bold text-gray-900 text-lg leading-tight flex-1">
                            {product.name}
                          </h3>
                          {isInCart && (
                            <span className="ml-2 flex-shrink-0 bg-green-500 text-white text-xs font-bold px-2 py-1 rounded-full">
                              In Cart
                            </span>
                          )}
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

                      {/* Cart Info (if in cart) */}
                      {isInCart && cartItem && (
                        <div className="mb-4 p-3 bg-green-100 border border-green-300 rounded-lg">
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-green-800 font-medium">In cart:</span>
                            <span className="text-green-900 font-bold">{cartItem.quantity} units</span>
                          </div>
                        </div>
                      )}

                      {/* Add to Cart Button */}
                      <button
                        onClick={() => addToCart(product)}
                        disabled={isOutOfStock}
                        className={`w-full py-3 rounded-lg font-semibold transition-colors flex items-center justify-center gap-2 ${
                          isOutOfStock
                            ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                            : isInCart
                            ? 'bg-green-600 text-white hover:bg-green-700'
                            : 'bg-blue-600 text-white hover:bg-blue-700'
                        }`}
                      >
                        <Plus className="w-5 h-5" />
                        {isOutOfStock ? 'Out of Stock' : isInCart ? 'Add More' : 'Add to Cart'}
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Cart Section */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
              <ShoppingCart className="w-5 h-5" />
              Customer Cart
            </h2>

            {/* Cart Items */}
            <div className="max-h-80 overflow-y-auto mb-4">
              {cart.length === 0 ? (
                <EmptyState title="Cart is empty" description="Add products to start checkout." />
              ) : (
                cart.map(item => (
                  <div key={item.id} className="flex items-center justify-between py-2 border-b">
                    <div className="flex-1">
                      <p className="font-medium text-sm">{item.name}</p>
                      <p className="text-xs text-gray-500">{formatCurrency(item.price)} x {formatNumber(item.quantity)}</p>
                    </div>
                    <div className="flex items-center space-x-2">
                      <button
                        type="button"
                        onClick={() => adjustCartQuantity(item.id, 'decrement')}
                        className="w-7 h-7 border rounded flex items-center justify-center hover:bg-gray-100"
                      >
                        <Minus className="w-3 h-3" />
                      </button>
                      <span className="w-6 text-center text-sm font-semibold">{item.quantity}</span>
                      <button
                        type="button"
                        onClick={() => adjustCartQuantity(item.id, 'increment')}
                        className="w-7 h-7 border rounded flex items-center justify-center hover:bg-gray-100"
                      >
                        <Plus className="w-3 h-3" />
                      </button>
                      <button
                        onClick={() => removeFromCart(item.id)}
                        className="text-red-600 hover:text-red-800"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Customer Information */}
            {cart.length > 0 && (
              <div className="border-t pt-4 mb-4">
                <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                  <UserRound className="w-4 h-4" />
                  Customer Name *
                </h3>
                <div>
                  <input
                    type="text"
                    value={customerInfo.name}
                    onChange={(e) => setCustomerInfo({ ...customerInfo, name: e.target.value })}
                    placeholder="Enter customer name"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    required
                  />
                </div>
              </div>
            )}

            {/* Total & Checkout */}
            {cart.length > 0 && (
              <div className="border-t pt-4">
                <div className="flex justify-between mb-2 text-sm text-gray-600">
                  <span>Items:</span>
                  <span>{cartItemCount}</span>
                </div>
                <div className="flex justify-between mb-4">
                  <span className="font-bold">Total:</span>
                  <span className="text-xl font-bold text-blue-600">{formatCurrency(calculateTotal())}</span>
                </div>
                <button
                  onClick={handleCheckout}
                  disabled={isCheckingOut}
                  className="w-full bg-green-600 text-white py-2 rounded-lg hover:bg-green-700 disabled:bg-gray-400"
                >
                  {isCheckingOut ? 'Completing Sale...' : 'Add Sale & Generate Receipt'}
                </button>
              </div>
            )}

          </div>
        </div>
      </div>

      {/* Receipt Delivery Modal */}
      {showReceiptModal && lastReceipt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md mx-4 p-6">
            <h2 className="text-lg font-bold text-gray-900 mb-1">Sale Completed!</h2>
            <p className="text-sm text-gray-600 mb-4">How would you like to deliver the receipt?</p>

            <div className="bg-gray-50 rounded-lg p-3 mb-4 text-xs text-gray-700 space-y-1">
              <p>Receipt ID: <span className="font-semibold">{lastReceipt.saleId}</span></p>
              <p>Customer: <span className="font-semibold">{lastReceipt.customerName}</span></p>
              {lastReceipt.customerRef && <p>Ref: <span className="font-semibold">{lastReceipt.customerRef}</span></p>}
              {lastReceipt.pickupCode && <p>Pickup Code: <span className="font-semibold">{lastReceipt.pickupCode}</span></p>}
              <p>Total: <span className="font-semibold text-blue-600">{formatCurrency(lastReceipt.total)}</span></p>
            </div>

            <p className="text-xs font-semibold text-gray-700 mb-2">Print Hard Copy</p>
            <button
              type="button"
              onClick={() => { handlePrintReceipt(); setShowReceiptModal(false); }}
              className="w-full mb-2 px-4 py-2 rounded-lg bg-gray-800 text-white text-sm hover:bg-gray-900 inline-flex items-center justify-center gap-2"
            >
              <Printer className="w-4 h-4" />
              Print Receipt
            </button>

            <button
              type="button"
              onClick={() => { handleGeneratePDF(); setShowReceiptModal(false); }}
              className="w-full mb-4 px-4 py-2 rounded-lg bg-red-600 text-white text-sm hover:bg-red-700 inline-flex items-center justify-center gap-2"
            >
              <FileText className="w-4 h-4" />
              Download PDF Receipt
            </button>

            <p className="text-xs font-semibold text-gray-700 mb-2">Share Digitally</p>
            <div className="grid grid-cols-2 gap-2 mb-4">
              <button
                type="button"
                onClick={() => { handleShareWhatsApp(); setShowReceiptModal(false); }}
                className="px-3 py-2 rounded-lg bg-green-600 text-white text-sm hover:bg-green-700 inline-flex items-center justify-center gap-1"
              >
                <MessageCircle className="w-4 h-4" />
                WhatsApp
              </button>
              <button
                type="button"
                onClick={() => { handleShareEmail(); setShowReceiptModal(false); }}
                className="px-3 py-2 rounded-lg bg-blue-600 text-white text-sm hover:bg-blue-700 inline-flex items-center justify-center gap-1"
              >
                <Mail className="w-4 h-4" />
                Email
              </button>
              <button
                type="button"
                onClick={() => { handleNativeShare(); setShowReceiptModal(false); }}
                className="px-3 py-2 rounded-lg bg-purple-600 text-white text-sm hover:bg-purple-700 inline-flex items-center justify-center gap-1"
              >
                <Share2 className="w-4 h-4" />
                Share
              </button>
              <button
                type="button"
                onClick={() => { handleInstagramShare(); setShowReceiptModal(false); }}
                className="px-3 py-2 rounded-lg bg-pink-600 text-white text-sm hover:bg-pink-700 inline-flex items-center justify-center gap-1"
              >
                <Copy className="w-4 h-4" />
                Instagram
              </button>
              <button
                type="button"
                onClick={() => { handleCopyReceipt(); setShowReceiptModal(false); }}
                className="col-span-2 px-3 py-2 rounded-lg bg-gray-200 text-gray-800 text-sm hover:bg-gray-300 inline-flex items-center justify-center gap-1"
              >
                <Copy className="w-4 h-4" />
                Copy Text
              </button>
            </div>

            <button
              type="button"
              onClick={() => setShowReceiptModal(false)}
              className="w-full px-4 py-2 rounded-lg border text-sm text-gray-600 hover:bg-gray-50"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
};