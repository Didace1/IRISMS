import React, { useState, useEffect } from 'react';
import { Brain, AlertCircle, TrendingUp, Package, ChevronRight, Send, LayoutList, Award } from 'lucide-react';

export const WelcomeScreen = ({ userName, summary, salesTrends, onStart }) => {
  const [userMessage, setUserMessage] = useState('');
  const [chatMessages, setChatMessages] = useState([]);
  const [isAiTyping, setIsAiTyping] = useState(true);

  // Simulate AI loading/thinking for 2 seconds
  useEffect(() => {
    const timer = setTimeout(() => {
      setChatMessages([
        {
          type: 'ai',
          text: `Hello ${userName}! 👋\n\nI can see you have recommendations across different priority levels.\n\nWhich priority would you like to start with?\n• High Priority\n• Medium Priority\n• Low Priority`
        }
      ]);
      setIsAiTyping(false);
    }, 2000);

    return () => clearTimeout(timer);
  }, [userName]);

  const handleSendMessage = () => {
    if (!userMessage.trim()) return;

    // Add user message
    const newMessages = [...chatMessages, { type: 'user', text: userMessage }];
    setChatMessages(newMessages);
    setUserMessage('');

    // Show AI typing indicator
    setIsAiTyping(true);

    // Detect priority from user input after 2 seconds
    setTimeout(() => {
      const lowerMessage = userMessage.toLowerCase();
      let detectedPriority = null;
      let aiResponse = '';

      if (lowerMessage.includes('all')) {
        detectedPriority = 'all';
        aiResponse = `Perfect! Opening the full overview with all ${summary?.total_count || 0} recommendations grouped by priority. 📋`;
      } else if (lowerMessage.includes('high') && summary?.high_priority_count > 0) {
        detectedPriority = 'high';
        aiResponse = `Great choice! Let's start with the ${summary.high_priority_count} High Priority items. These require urgent attention. 🔴`;
      } else if (lowerMessage.includes('medium') && summary?.medium_priority_count > 0) {
        detectedPriority = 'medium';
        aiResponse = `Perfect! Let's review the ${summary.medium_priority_count} Medium Priority items. These are important for your inventory. 🟡`;
      } else if (lowerMessage.includes('low') && summary?.low_priority_count > 0) {
        detectedPriority = 'low';
        aiResponse = `Understood! Let's go through the ${summary.low_priority_count} Low Priority items for preventive restocking. 🟢`;
      } else {
        aiResponse = `I didn't quite catch that. Please specify "high", "medium", "low", or "all". You have:\n• High Priority: ${summary?.high_priority_count || 0} items\n• Medium Priority: ${summary?.medium_priority_count || 0} items\n• Low Priority: ${summary?.low_priority_count || 0} items\n• All: ${summary?.total_count || 0} items`;
      }

      // Add AI response
      setChatMessages([...newMessages, { type: 'ai', text: aiResponse }]);
      setIsAiTyping(false);

      // If priority detected, start after a short delay
      if (detectedPriority) {
        setTimeout(() => {
          onStart(detectedPriority);
        }, 1500);
      }
    }, 2000);
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-6">
      <div className="max-w-2xl w-full">
        {/* Welcome Card */}
        <div className="bg-white rounded-2xl shadow-xl p-8 md:p-12">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 rounded-full mb-4">
              <Brain className="w-8 h-8 text-blue-600" />
            </div>
            <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-2">
              Hello {userName}! 👋
            </h1>
            <p className="text-lg text-gray-600">
              We have stock recommendations for you
            </p>
          </div>

          {/* Priority Summary */}
          <div className="space-y-4 mb-8">
            {/* Top Performing Brand */}
            {salesTrends?.top_brands && Object.keys(salesTrends.top_brands).length > 0 && (
              <div className="flex items-center justify-between p-4 bg-purple-50 border-2 border-purple-200 rounded-lg hover:shadow-md transition-shadow">
                <div className="flex items-center gap-3">
                  <div className="flex items-center justify-center w-10 h-10 bg-purple-100 rounded-full">
                    <Award className="w-5 h-5 text-purple-600" />
                  </div>
                  <div>
                    <p className="font-semibold text-purple-900">Top-performing brand: {Object.keys(salesTrends.top_brands)[0]}</p>
                    <p className="text-sm text-purple-700">{Object.values(salesTrends.top_brands)[0]} units sold</p>
                  </div>
                </div>
              </div>
            )}

            {/* High Priority */}
            {summary?.high_priority_count > 0 && (
              <div className="flex items-center justify-between p-4 bg-red-50 border-2 border-red-200 rounded-lg hover:shadow-md transition-shadow">
                <div className="flex items-center gap-3">
                  <div className="flex items-center justify-center w-10 h-10 bg-red-100 rounded-full">
                    <AlertCircle className="w-5 h-5 text-red-600" />
                  </div>
                  <div>
                    <p className="font-semibold text-red-900">High Priority</p>
                    <p className="text-sm text-red-700">Urgent action needed</p>
                  </div>
                </div>
                <div className="text-2xl font-bold text-red-600">
                  {summary.high_priority_count}
                </div>
              </div>
            )}

            {/* Medium Priority */}
            {summary?.medium_priority_count > 0 && (
              <div className="flex items-center justify-between p-4 bg-yellow-50 border-2 border-yellow-200 rounded-lg hover:shadow-md transition-shadow">
                <div className="flex items-center gap-3">
                  <div className="flex items-center justify-center w-10 h-10 bg-yellow-100 rounded-full">
                    <TrendingUp className="w-5 h-5 text-yellow-600" />
                  </div>
                  <div>
                    <p className="font-semibold text-yellow-900">Medium Priority</p>
                    <p className="text-sm text-yellow-700">Important items</p>
                  </div>
                </div>
                <div className="text-2xl font-bold text-yellow-600">
                  {summary.medium_priority_count}
                </div>
              </div>
            )}

            {/* Low Priority */}
            {summary?.low_priority_count > 0 && (
              <div className="flex items-center justify-between p-4 bg-green-50 border-2 border-green-200 rounded-lg hover:shadow-md transition-shadow">
                <div className="flex items-center gap-3">
                  <div className="flex items-center justify-center w-10 h-10 bg-green-100 rounded-full">
                    <Package className="w-5 h-5 text-green-600" />
                  </div>
                  <div>
                    <p className="font-semibold text-green-900">Low Priority</p>
                    <p className="text-sm text-green-700">Preventive restocking</p>
                  </div>
                </div>
                <div className="text-2xl font-bold text-green-600">
                  {summary.low_priority_count}
                </div>
              </div>
            )}

            {/* View All Button */}
            {summary?.total_count > 0 && (
              <button
                onClick={() => onStart('all')}
                className="w-full flex items-center justify-between p-4 bg-indigo-50 border-2 border-indigo-300 rounded-lg hover:bg-indigo-100 hover:shadow-md transition-all group"
              >
                <div className="flex items-center gap-3">
                  <div className="flex items-center justify-center w-10 h-10 bg-indigo-100 rounded-full group-hover:bg-indigo-200 transition-colors">
                    <LayoutList className="w-5 h-5 text-indigo-600" />
                  </div>
                  <div className="text-left">
                    <p className="font-semibold text-indigo-900">View All at Once</p>
                    <p className="text-sm text-indigo-700">See all recommendations in one overview</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-2xl font-bold text-indigo-600">{summary.total_count}</span>
                  <ChevronRight className="w-5 h-5 text-indigo-500 group-hover:translate-x-1 transition-transform" />
                </div>
              </button>
            )}

            {/* No Recommendations */}
            {summary?.total_count === 0 && (
              <div className="text-center py-8">
                <Package className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600 text-lg">
                  No recommendations at this time
                </p>
                <p className="text-gray-500 text-sm mt-2">
                  Your inventory levels are optimal
                </p>
              </div>
            )}
          </div>

          {/* Chat Interface */}
          {summary?.total_count > 0 && (
            <>
              <div className="text-center mb-4">
                <p className="text-lg text-gray-700 font-medium">
                  Which priority level would you like to start with?
                </p>
              </div>
              
              <div className="border-2 border-blue-200 rounded-xl overflow-hidden">
                {/* Chat Messages */}
                <div className="bg-gray-50 p-6 max-h-80 overflow-y-auto space-y-4">
                  {chatMessages.map((msg, index) => (
                    <div
                      key={index}
                      className={`flex ${msg.type === 'user' ? 'justify-end' : 'justify-start'}`}
                    >
                      <div
                        className={`max-w-[85%] p-4 rounded-lg ${
                          msg.type === 'user'
                            ? 'bg-blue-600 text-white'
                            : 'bg-white border-2 border-gray-200 text-gray-800'
                        }`}
                      >
                        {msg.type === 'ai' && (
                          <div className="flex items-center gap-2 mb-2">
                            <Brain className="w-5 h-5 text-blue-600" />
                            <span className="text-sm font-bold text-blue-600">AI Assistant</span>
                          </div>
                        )}
                        <p className="text-base leading-relaxed whitespace-pre-line font-medium">{msg.text}</p>
                      </div>
                    </div>
                  ))}
                  
                  {/* AI Typing Indicator */}
                  {isAiTyping && (
                    <div className="flex justify-start">
                      <div className="max-w-[85%] p-4 rounded-lg bg-white border-2 border-gray-200">
                        <div className="flex items-center gap-2 mb-2">
                          <Brain className="w-5 h-5 text-blue-600 animate-pulse" />
                          <span className="text-sm font-bold text-blue-600">AI Assistant</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="flex gap-1">
                            <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce"></div>
                            <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                            <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></div>
                          </div>
                          <span className="text-sm text-gray-600 font-medium">AI is thinking...</span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Chat Input */}
                <div className="bg-white p-5 border-t-2 border-blue-200">
                  <div className="flex gap-3">
                    <input
                      type="text"
                      value={userMessage}
                      onChange={(e) => setUserMessage(e.target.value)}
                      onKeyPress={handleKeyPress}
                      placeholder="Type 'high', 'medium', 'low', or 'all'..."
                      className="flex-1 px-5 py-4 text-base border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                    <button
                      onClick={handleSendMessage}
                      disabled={!userMessage.trim()}
                      className="px-7 py-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 font-semibold"
                    >
                      <Send className="w-6 h-6" />
                    </button>
                  </div>
                  <p className="text-sm text-gray-600 mt-3 font-medium">
                    💡 Example: "I want to start with high priority" or "show all"
                  </p>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Footer Info */}
        <div className="text-center mt-6 text-sm text-gray-600">
          <p>💡 Recommendations based on 30 days of sales data</p>
        </div>
      </div>
    </div>
  );
};
