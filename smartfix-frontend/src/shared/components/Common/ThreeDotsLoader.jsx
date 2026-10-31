import React from 'react';
import './ThreeDotsLoader.css';

export const ThreeDotsLoader = ({ 
  message = 'Loading...', 
  size = 'normal',
  animation = 'bounce',
  className = '',
  useFaultDiagnosisTiming = false
}) => {
  const sizeClass = size === 'large' ? 'loading-dots-large' : '';
  const animationClass = animation === 'fade' ? 'loading-dots-fade' : '';
  const faultDiagnosisClass = useFaultDiagnosisTiming ? 'loading-dots-fault-diagnosis' : '';
  
  return (
    <div className={`text-center ${className}`}>
      <div className={`loading-dots ${sizeClass} ${animationClass} ${faultDiagnosisClass}`}>
        <div className="dot"></div>
        <div className="dot"></div>
        <div className="dot"></div>
      </div>
      {message && (
        <p className="mt-3 text-sm text-gray-500">{message}</p>
      )}
    </div>
  );
};

export default ThreeDotsLoader;
