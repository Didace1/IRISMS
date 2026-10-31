import React from 'react';

export const SimpleFourSecondLoader = ({ message = 'Loading...' }) => {
  const animationName = 'fd-bounce-4s';
  return (
    <div style={{ textAlign: 'center', padding: '20px' }}>
      <style>{`
        @keyframes ${animationName} {
          0% { transform: scale(0.3); opacity: 0.3; }
          25% { transform: scale(1.2); opacity: 1; }
          50% { transform: scale(0.3); opacity: 0.3; }
          75% { transform: scale(1.2); opacity: 1; }
          100% { transform: scale(0.3); opacity: 0.3; }
        }
      `}</style>
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        gap: '0.25rem',
        marginBottom: '10px'
      }}>
        <div style={{
          width: '0.75rem',
          height: '0.75rem',
          backgroundColor: '#3b82f6',
          borderRadius: '50%',
          animation: `${animationName} 4s infinite ease-in-out both`,
          animationDelay: '-2.66s'
        }}></div>
        
        <div style={{
          width: '0.75rem',
          height: '0.75rem',
          backgroundColor: '#3b82f6',
          borderRadius: '50%',
          animation: `${animationName} 4s infinite ease-in-out both`,
          animationDelay: '-1.33s'
        }}></div>
        
        <div style={{
          width: '0.75rem',
          height: '0.75rem',
          backgroundColor: '#3b82f6',
          borderRadius: '50%',
          animation: `${animationName} 4s infinite ease-in-out both`,
          animationDelay: '0s'
        }}></div>
      </div>
      
      <p style={{ marginTop: '10px', fontSize: '14px', color: '#6b7280' }}>
        {message}
      </p>
    </div>
  );
};

export default SimpleFourSecondLoader;
