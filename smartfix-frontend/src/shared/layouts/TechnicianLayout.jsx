import React from 'react';
import { TechnicianSidebar } from '../components/Navigation/TechnicianSidebar';
import { TechnicianTopBar } from '../components/Navigation/TechnicianTopBar';

export const TechnicianLayout = ({ children }) => {
  return (
    <div className="flex h-screen bg-gray-50">
      <TechnicianSidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <TechnicianTopBar />
        <main className="flex-1 overflow-y-auto">
          <div className="p-6">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
};
