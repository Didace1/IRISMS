// src/shared/components/Layout/SalesLayout.jsx
import React from 'react';
import { SalesSidebar } from '../Navigation/SalesSidebar';
import { SalesTopBar } from '../Navigation/SalesTopBar';

export const SalesLayout = ({ children }) => {
  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <SalesSidebar />
      
      {/* Main Content Area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top Bar */}
        <SalesTopBar />
        
        {/* Page Content */}
        <main className="flex-1 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
};