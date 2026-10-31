// src/shared/components/Common/CorexLogo.jsx
import React from 'react';

export const CorexLogo = ({ size = 'md', className = '' }) => {
  const sizeClasses = {
    sm: 'w-8 h-8',
    md: 'w-10 h-10',
    lg: 'w-12 h-12',
    xl: 'w-16 h-16'
  };

  return (
    <div className={`${sizeClasses[size]} ${className} flex items-center justify-center rounded-lg`} 
         style={{ backgroundColor: '#c0392b' }}>
      <span style={{ 
        fontFamily: 'Impact, Arial Black, sans-serif', 
        letterSpacing: '0.06em', 
        fontSize: size === 'sm' ? '0.7rem' : size === 'lg' ? '1.3rem' : size === 'xl' ? '1.5rem' : '1.1rem',
        color: '#fff', 
        fontWeight: 900 
      }}>
        COREX
      </span>
    </div>
  );
};