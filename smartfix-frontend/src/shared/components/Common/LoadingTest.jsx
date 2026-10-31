import React from 'react';
import { ThreeDotsLoader } from './ThreeDotsLoader';

export const LoadingTest = () => {
  return (
    <div className="p-8 bg-gray-50 min-h-screen">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">4-Second Loading Animation Test</h1>
        
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold mb-4">AI Analysis Loading (4 seconds)</h2>
          <p className="text-gray-600 mb-6">Watch 3 dots animation - it now runs for 4 seconds per cycle:</p>
          
          <ThreeDotsLoader 
            message="AI is analyzing symptoms..." 
            size="large" 
            animation="bounce" 
          />
          
          <div className="mt-8 p-4 bg-blue-50 rounded-lg">
            <h3 className="font-semibold text-blue-900 mb-2">Animation Details:</h3>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>Duration: 4 seconds per cycle</li>
              <li>Animation: Smooth bounce effect</li>
              <li>Dots: 3 blue dots with staggered timing</li>
              <li>Delays: 0s, -0.46s, -0.92s for smooth sequence</li>
            </ul>
          </div>
          
          <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 bg-gray-50 rounded-lg">
              <h4 className="font-medium text-gray-900 mb-2">Bounce Animation</h4>
              <ThreeDotsLoader 
                message="Bouncing..." 
                size="normal" 
                animation="bounce" 
              />
            </div>
            
            <div className="p-4 bg-gray-50 rounded-lg">
              <h4 className="font-medium text-gray-900 mb-2">Fade Animation</h4>
              <ThreeDotsLoader 
                message="Fading..." 
                size="normal" 
                animation="fade" 
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoadingTest;
