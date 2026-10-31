import React, { useState, useEffect } from 'react';
import { ThreeDotsLoader } from './ThreeDotsLoader';

export const LoadingDebug = () => {
  const [seconds, setSeconds] = useState(0);
  const [cycles, setCycles] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setSeconds(prev => prev + 0.1);
    }, 100);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    setCycles(Math.floor(seconds / 4));
  }, [seconds]);

  return (
    <div className="p-8 bg-gray-50 min-h-screen">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">4-Second Animation Debug</h1>
        
        <div className="bg-white rounded-lg shadow p-6">
          <div className="mb-6 p-4 bg-yellow-50 rounded-lg">
            <h3 className="font-semibold text-yellow-900 mb-2">Live Timer:</h3>
            <div className="text-2xl font-mono text-yellow-800">
              Time: {seconds.toFixed(1)}s | Cycles: {cycles}
            </div>
            <p className="text-sm text-yellow-700 mt-2">
              Watch the animation complete 1 full cycle every 4 seconds
            </p>
          </div>
          
          <div className="mb-6">
            <h2 className="text-lg font-semibold mb-4">Current Animation:</h2>
            <ThreeDotsLoader 
              message="Testing 4-second cycle..." 
              size="large" 
              animation="bounce" 
            />
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 bg-blue-50 rounded-lg">
              <h4 className="font-medium text-blue-900 mb-2">Expected Behavior:</h4>
              <ul className="text-sm text-blue-800 space-y-1">
                <li>• Each dot bounces once per cycle</li>
                <li>• Full cycle takes 4 seconds</li>
                <li>• Dots are staggered evenly</li>
                <li>• Animation should feel slower</li>
              </ul>
            </div>
            
            <div className="p-4 bg-red-50 rounded-lg">
              <h4 className="font-medium text-red-900 mb-2">If Not Working:</h4>
              <ul className="text-sm text-red-800 space-y-1">
                <li>• Browser cache issue - refresh page</li>
                <li>• CSS not updated - check dev tools</li>
                <li>• Animation still fast - clear cache</li>
                <li>• Try hard refresh (Ctrl+F5)</li>
              </ul>
            </div>
          </div>
          
          <div className="mt-6 p-4 bg-gray-100 rounded-lg">
            <h4 className="font-medium text-gray-900 mb-2">CSS Animation Values:</h4>
            <pre className="text-xs text-gray-700 font-mono">
{`animation: bounce 4s infinite ease-in-out both;
animation-delay: -0.92s, -0.46s, 0s;`}
            </pre>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoadingDebug;
