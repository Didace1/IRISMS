import React from 'react';

export const PageHeader = ({ title, subtitle, rightSlot }) => (
  <div className="mb-8">
    <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
      <div className="flex items-start gap-4">
        <div className="w-1 self-stretch rounded-full bg-gradient-to-b from-red-500 to-red-300 flex-shrink-0" style={{ minHeight: '2.5rem' }} />
        <div>
          <h1 className="text-2xl font-bold text-gray-900 leading-tight">{title}</h1>
          {subtitle && <p className="text-sm text-gray-500 mt-1">{subtitle}</p>}
        </div>
      </div>
      {rightSlot && <div className="flex-shrink-0">{rightSlot}</div>}
    </div>
    <div className="mt-4 h-px bg-gradient-to-r from-gray-200 via-gray-100 to-transparent" />
  </div>
);
