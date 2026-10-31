import React from 'react';
import { InventorySidebar } from '../Navigation/InventorySidebar';
import { InventoryTopBar } from '../Navigation/InventoryTopBar';

export const InventoryLayout = ({ children }) => {
  return (
    <div className="flex h-screen bg-gray-50">
      <InventorySidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <InventoryTopBar />
        <main className="flex-1 overflow-y-auto">
          <div className="p-6">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
};