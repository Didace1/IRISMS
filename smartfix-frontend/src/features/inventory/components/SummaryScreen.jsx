import React from 'react';
import {
  CheckCircle,
  Package,
  DollarSign,
  FileText,
  RefreshCw,
  Home,
  AlertCircle,
  TrendingUp
} from 'lucide-react';
import { formatCurrency, formatNumber } from '../../../shared/utils/formatters';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

export const SummaryScreen = ({
  acceptedItems,
  skippedItems,
  recommendations,
  onStartNew
}) => {
  const calculateTotals = () => {
    // Calculate totals from ALL recommended items (not just accepted)
    const allRecommendedItems = [
      ...(recommendations?.recommendations?.high || []),
      ...(recommendations?.recommendations?.medium || []),
      ...(recommendations?.recommendations?.low || [])
    ];

    const totalQuantity = allRecommendedItems.reduce((sum, item) => sum + (item.recommended_quantity || 0), 0);
    
    // Use purchase_cost for investment calculation
    const totalValue = allRecommendedItems.reduce((sum, item) => {
      const purchaseCost = item.purchase_cost || 0;
      const quantity = item.recommended_quantity || 0;
      return sum + (purchaseCost * quantity);
    }, 0);

    const highPriorityCount = recommendations?.summary?.high_priority_count || 0;
    const mediumPriorityCount = recommendations?.summary?.medium_priority_count || 0;
    const lowPriorityCount = recommendations?.summary?.low_priority_count || 0;

    return {
      totalQuantity,
      totalValue,
      highPriorityCount,
      mediumPriorityCount,
      lowPriorityCount
    };
  };

  const totals = calculateTotals();

  const handleExportPDF = () => {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    
    // Header
    doc.setFillColor(37, 99, 235); // Blue color
    doc.rect(0, 0, pageWidth, 40, 'F');
    
    // Company Logo/Name
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(24);
    doc.setFont(undefined, 'bold');
    doc.text('COREX LTD', 14, 20);
    
    // Report Title
    doc.setFontSize(16);
    doc.text('AI Inventory Recommendations Report', 14, 32);
    
    // Date and Info
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
    doc.setFillColor(249, 250, 251);
    doc.rect(14, 58, pageWidth - 28, 40, 'F');
    doc.setDrawColor(229, 231, 235);
    doc.rect(14, 58, pageWidth - 28, 40, 'S');
    
    doc.setFontSize(11);
    doc.setFont(undefined, 'bold');
    doc.text('AI Analysis Summary:', 18, 66);
    
    doc.setFont(undefined, 'normal');
    doc.setFontSize(10);
    doc.text(`Total Items Recommended: ${recommendations?.summary?.total_count || 0}`, 18, 74);
    doc.text(`High Priority: ${totals.highPriorityCount} | Medium: ${totals.mediumPriorityCount} | Low: ${totals.lowPriorityCount}`, 18, 80);
    doc.text(`Total Recommended Quantity: ${formatNumber(totals.totalQuantity)} units`, 18, 86);
    doc.text(`Estimated Investment: ${formatCurrency(totals.totalValue)} RWF`, 18, 92);
    
    // Get all recommendations
    const allRecommendations = [
      ...(recommendations?.recommendations?.high || []).map(r => ({ ...r, priority: 'High' })),
      ...(recommendations?.recommendations?.medium || []).map(r => ({ ...r, priority: 'Medium' })),
      ...(recommendations?.recommendations?.low || []).map(r => ({ ...r, priority: 'Low' }))
    ];
    
    // Table Data
    const tableData = allRecommendations.map((item, index) => [
      index + 1,
      item.product_name || item.device,
      item.brand || 'N/A',
      item.category || 'N/A',
      item.recommended_quantity?.toString() || '0',
      item.recommendation_score?.toString() || 'N/A',
      item.priority,
      item.market_demand || 'N/A'
    ]);
    
    // Generate Table
    autoTable(doc, {
      startY: 105,
      head: [['#', 'Product', 'Brand', 'Category', 'Qty', 'AI Score', 'Priority', 'Demand']],
      body: tableData,
      theme: 'striped',
      headStyles: {
        fillColor: [37, 99, 235],
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
        1: { cellWidth: 40 },
        2: { cellWidth: 25 },
        3: { cellWidth: 25 },
        4: { cellWidth: 15, halign: 'center' },
        5: { cellWidth: 18, halign: 'center' },
        6: { cellWidth: 20, halign: 'center' },
        7: { cellWidth: 20, halign: 'center' }
      },
      margin: { left: 14, right: 14 },
      didDrawPage: (data) => {
        // Footer
        const footerY = pageHeight - 15;
        doc.setFontSize(8);
        doc.setTextColor(107, 114, 128);
        doc.text(
          `COREX LTD - AI-Powered Inventory Intelligence System`,
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
    
    // Add total summary box
    if (allRecommendations.length > 0) {
      const finalY = doc.lastAutoTable.finalY + 10;
      
      if (finalY < pageHeight - 40) {
        doc.setFillColor(37, 99, 235);
        doc.rect(14, finalY, pageWidth - 28, 25, 'F');
        
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(11);
        doc.setFont(undefined, 'bold');
        doc.text('Total Estimated Investment Required:', 18, finalY + 10);
        doc.text(`${formatCurrency(totals.totalValue)} RWF`, pageWidth - 18, finalY + 10, { align: 'right' });
        
        doc.setFontSize(9);
        doc.setFont(undefined, 'normal');
        doc.text(`${allRecommendations.length} items | ${formatNumber(totals.totalQuantity)} total units`, 18, finalY + 18);
        doc.text(`Recommended by AI based on 30-day sales analysis`, pageWidth - 18, finalY + 18, { align: 'right' });
      }
    }
    
    // Save PDF
    doc.save(`AI-Recommendations-${new Date().toISOString().split('T')[0]}.pdf`);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100 p-6">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-green-100 rounded-full mb-4">
            <CheckCircle className="w-10 h-10 text-green-600" />
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            📊 Recommendation Session Complete
          </h1>
          <p className="text-lg text-gray-600">
            Here's a summary of your ordering decisions
          </p>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {/* Items Recommended */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-3 bg-green-100 rounded-lg">
                <CheckCircle className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Items Recommended</p>
                <p className="text-3xl font-bold text-gray-900">{recommendations?.summary?.total_count || 0}</p>
              </div>
            </div>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">High Priority:</span>
                <span className="font-semibold text-red-600">{recommendations?.summary?.high_priority_count || 0}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Medium Priority:</span>
                <span className="font-semibold text-yellow-600">{recommendations?.summary?.medium_priority_count || 0}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Low Priority:</span>
                <span className="font-semibold text-green-600">{recommendations?.summary?.low_priority_count || 0}</span>
              </div>
            </div>
          </div>

          {/* Total Quantity */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-3 bg-blue-100 rounded-lg">
                <Package className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Total Order Quantity</p>
                <p className="text-3xl font-bold text-gray-900">{formatNumber(totals.totalQuantity)}</p>
              </div>
            </div>
            <p className="text-sm text-gray-600">units across all items</p>
          </div>

          {/* Estimated Investment */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-3 bg-purple-100 rounded-lg">
                <TrendingUp className="w-6 h-6 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Estimated Investment</p>
                <p className="text-2xl font-bold text-gray-900">{formatCurrency(totals.totalValue).replace('$', '')}</p>
              </div>
            </div>
            <p className="text-sm text-gray-600">approximate order value</p>
          </div>
        </div>

        {/* Accepted Items List */}
        {acceptedItems.length > 0 && (
          <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
            <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
              <FileText className="w-5 h-5 text-blue-500" />
              Accepted Items
            </h2>
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {acceptedItems.map((item, index) => (
                <div key={index} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                  <div className="flex-1">
                    <p className="font-semibold text-gray-900">{item.product_name}</p>
                    <p className="text-sm text-gray-600">{item.brand} • {item.category}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-green-600">{formatNumber(item.recommended_quantity)} units</p>
                    <p className="text-sm text-gray-600">Score: {item.recommendation_score}/5.0</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Skipped Items */}
        {skippedItems.length > 0 && (
          <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
            <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-yellow-500" />
              Skipped Items ({skippedItems.length})
            </h2>
            <p className="text-sm text-gray-600 mb-4">
              These items were skipped during review. You can review them later.
            </p>
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {skippedItems.map((item, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-yellow-50 rounded-lg">
                  <p className="text-sm font-medium text-gray-900">{item.product_name}</p>
                  <span className="text-xs text-gray-600">{item.brand}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4">
          <button
            onClick={handleExportPDF}
            className="flex-1 flex items-center justify-center gap-2 px-6 py-4 bg-red-600 text-white rounded-xl hover:bg-red-700 transition-all transform hover:scale-105 shadow-lg font-semibold"
          >
            <FileText className="w-5 h-5" />
            Export Report (PDF)
          </button>
          <button
            onClick={() => window.location.href = '/inventory'}
            className="flex-1 flex items-center justify-center gap-2 px-6 py-4 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-xl hover:from-green-700 hover:to-emerald-700 transition-all transform hover:scale-105 shadow-lg font-semibold"
          >
            <Home className="w-5 h-5" />
            Back to Dashboard
          </button>
        </div>

        {/* Footer Note */}
        <div className="text-center mt-8 text-sm text-gray-600">
          <p>💡 Recommendations are based on real sales data and AI analysis</p>
          <p className="mt-1">Generated on {new Date().toLocaleDateString()} at {new Date().toLocaleTimeString()}</p>
        </div>
      </div>
    </div>
  );
};
