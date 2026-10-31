import React from 'react';

export const EmptyState = ({ title, description, action, onAction }) => (
  <div className="flex flex-col items-center justify-center py-14 px-6 bg-white rounded-xl border border-dashed border-gray-200">
    <div className="w-16 h-16 rounded-full bg-gray-50 flex items-center justify-center mb-4">
      <svg className="w-8 h-8 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
          d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0H4m8-4v8m-3-3l3 3 3-3" />
      </svg>
    </div>
    <p className="text-base font-semibold text-gray-700">{title}</p>
    {description && <p className="text-sm text-gray-400 mt-1 text-center max-w-xs">{description}</p>}
    {action && onAction && (
      <button
        onClick={onAction}
        className="mt-5 px-4 py-2 bg-red-600 text-white text-sm font-medium rounded-lg hover:bg-red-700 transition"
      >
        {action}
      </button>
    )}
  </div>
);
