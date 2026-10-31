import React from 'react';

export const ModulePlaceholderPage = ({ title, description, bullets = [] }) => {
  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="max-w-4xl mx-auto bg-white rounded-lg shadow p-6">
        <h1 className="text-3xl font-bold text-gray-900">{title}</h1>
        <p className="text-gray-600 mt-2">{description}</p>

        <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-100">
          <p className="text-sm text-blue-900 font-medium">Defense-safe module page</p>
          <p className="text-sm text-blue-800 mt-1">
            This route is active and can be demonstrated while core workflows keep running.
          </p>
        </div>

        {bullets.length > 0 && (
          <div className="mt-6">
            <h2 className="text-lg font-semibold text-gray-800">Current Capabilities</h2>
            <ul className="mt-3 space-y-2">
              {bullets.map((item) => (
                <li key={item} className="text-gray-700 text-sm">
                  - {item}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
};
