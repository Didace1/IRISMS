import React from 'react';
import { ThreeDotsLoader } from './ThreeDotsLoader';
import { LoadingState } from './LoadingState';

export const LoadingDemo = () => {
  return (
    <div className="p-8 bg-gray-50 min-h-screen">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Loading Animation Demo</h1>
        
        <div className="space-y-8">
          {/* Small Normal Bounce */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold mb-4">Small Normal Bounce</h2>
            <ThreeDotsLoader 
              message="Loading data..." 
              size="normal" 
              animation="bounce" 
            />
          </div>

          {/* Large Bounce */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold mb-4">Large Bounce (AI Analysis)</h2>
            <ThreeDotsLoader 
              message="AI is analyzing symptoms..." 
              size="large" 
              animation="bounce" 
            />
          </div>

          {/* Small Fade */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold mb-4">Small Fade Animation</h2>
            <ThreeDotsLoader 
              message="Processing..." 
              size="normal" 
              animation="fade" 
            />
          </div>

          {/* Loading State Component */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold mb-4">Loading State Component</h2>
            <LoadingState message="Loading inventory items..." />
          </div>

          {/* Custom Message */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold mb-4">Custom Messages</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <ThreeDotsLoader 
                message="Connecting to AI backend..." 
                size="normal" 
                animation="bounce" 
              />
              <ThreeDotsLoader 
                message="Analyzing device symptoms..." 
                size="normal" 
                animation="fade" 
              />
              <ThreeDotsLoader 
                message="Generating repair recommendations..." 
                size="large" 
                animation="bounce" 
              />
              <ThreeDotsLoader 
                message="Validating user input..." 
                size="normal" 
                animation="bounce" 
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoadingDemo;
