import React, { useState, useEffect } from 'react';
import { Brain } from 'lucide-react';

export const LoadingScreen = () => {
  const [messageIndex, setMessageIndex] = useState(0);
  
  const messages = [
    '📊 Analyzing sales data...',
    '🔍 Detecting market trends...',
    '💡 Generating recommendations...'
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      setMessageIndex((prev) => (prev + 1) % messages.length);
    }, 800);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
      <div className="text-center">
        {/* Animated Brain Icon */}
        <div className="relative mb-8">
          <Brain className="w-20 h-20 text-blue-500 mx-auto animate-pulse" />
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-24 h-24 border-4 border-blue-200 border-t-blue-500 rounded-full animate-spin"></div>
          </div>
        </div>

        {/* Title */}
        <h3 className="text-2xl font-bold text-gray-900 mb-4 animate-pulse">
          🤖 AI Analyzing...
        </h3>

        {/* Rotating Messages */}
        <div className="space-y-3 mb-8">
          {messages.map((message, index) => (
            <p
              key={index}
              className={`text-gray-600 transition-opacity duration-500 ${
                index === messageIndex ? 'opacity-100 font-medium' : 'opacity-40'
              }`}
            >
              {message}
            </p>
          ))}
        </div>

        {/* Bouncing Dots */}
        <div className="flex items-center justify-center gap-2">
          <div className="w-3 h-3 bg-blue-500 rounded-full animate-bounce"></div>
          <div className="w-3 h-3 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
          <div className="w-3 h-3 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></div>
        </div>
      </div>
    </div>
  );
};
