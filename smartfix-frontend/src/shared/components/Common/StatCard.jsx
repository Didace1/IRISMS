import React from 'react';

const ACCENT_TO_BG = {
  'text-blue-600':   'bg-blue-50 text-blue-500',
  'text-red-600':    'bg-red-50 text-red-500',
  'text-green-600':  'bg-green-50 text-green-500',
  'text-orange-600': 'bg-orange-50 text-orange-500',
  'text-yellow-600': 'bg-yellow-50 text-yellow-500',
  'text-purple-600': 'bg-purple-50 text-purple-500',
  'text-pink-600':   'bg-pink-50 text-pink-500',
  'text-indigo-600': 'bg-indigo-50 text-indigo-500',
};

const ACCENT_TO_BORDER = {
  'text-blue-600':   'border-blue-400',
  'text-red-600':    'border-red-400',
  'text-green-600':  'border-green-400',
  'text-orange-600': 'border-orange-400',
  'text-yellow-600': 'border-yellow-400',
  'text-purple-600': 'border-purple-400',
  'text-pink-600':   'border-pink-400',
  'text-indigo-600': 'border-indigo-400',
};

export const StatCard = ({ label, value, accent = 'text-blue-600', icon, subtitle }) => {
  const iconBg = ACCENT_TO_BG[accent] || 'bg-gray-100 text-gray-500';
  const borderColor = ACCENT_TO_BORDER[accent] || 'border-gray-300';

  return (
    <div className={`bg-white rounded-xl shadow-sm border border-gray-100 border-l-4 ${borderColor} p-6 hover:shadow-lg transition-shadow duration-200`}>
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-2">{label}</p>
          <p className={`text-4xl font-bold ${accent} leading-none`}>{value}</p>
          {subtitle && <p className="text-sm text-gray-500 mt-2 font-medium">{subtitle}</p>}
        </div>
        {icon && (
          <div className={`ml-4 flex-shrink-0 w-14 h-14 rounded-xl flex items-center justify-center ${iconBg}`}>
            {React.cloneElement(icon, { className: 'w-7 h-7' })}
          </div>
        )}
      </div>
    </div>
  );
};
