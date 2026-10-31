import React, { useState, useEffect, useRef } from 'react';
import { 
  MessageCircle, 
  X, 
  Send, 
  Bot, 
  User, 
  Minimize2, 
  Maximize2,
  Phone,
  Mail,
  MapPin
} from 'lucide-react';
import './Chatbot.css';

export const Chatbot = () => {
  const AI_BACKEND_BASE_URL = process.env.REACT_APP_AI_BACKEND_URL || 'http://localhost:8000';
  
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [suggestions, setSuggestions] = useState([]);
  const [sessionId] = useState(() => `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`);
  
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (isOpen && messages.length === 0) {
      // Load initial suggestions and welcome message
      loadInitialSuggestions();
      addBotMessage("Welcome to Corex Ltd! 👋\n\nWhat electronic devices are you looking for?\n\nI can help you find smartphones, laptops, tablets, smartwatches, and accessories from our current inventory.");
    }
  }, [isOpen]);

  const loadInitialSuggestions = async () => {
    try {
      const response = await fetch(`${AI_BACKEND_BASE_URL}/api/chatbot/suggestions`);
      const data = await response.json();
      if (data.suggestions) {
        setSuggestions(data.suggestions);
      }
    } catch (error) {
      console.error('Error loading suggestions:', error);
      setSuggestions([
        "What devices do you have?",
        "I need a repair service",
        "What are your prices?",
        "Where are you located?"
      ]);
    }
  };

  const addBotMessage = (message, newSuggestions = []) => {
    const botMessage = {
      id: Date.now(),
      type: 'bot',
      message: message,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };
    setMessages(prev => [...prev, botMessage]);
    if (newSuggestions.length > 0) {
      setSuggestions(newSuggestions);
    }
  };

  const addUserMessage = (message) => {
    const userMessage = {
      id: Date.now(),
      type: 'user',
      message: message,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };
    setMessages(prev => [...prev, userMessage]);
  };

  const sendMessage = async (message = inputMessage) => {
    if (!message.trim() || isLoading) return;

    const messageToSend = message.trim();
    addUserMessage(messageToSend);
    setInputMessage('');
    setIsLoading(true);

    try {
      const response = await fetch(`${AI_BACKEND_BASE_URL}/api/chatbot/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: messageToSend,
          sessionId: sessionId
        })
      });

      const data = await response.json();
      
      if (response.ok) {
        addBotMessage(data.response, data.suggestions || []);
      } else {
        addBotMessage("I'm sorry, I'm having trouble understanding that. Could you please rephrase your question?");
      }
    } catch (error) {
      console.error('Error sending message:', error);
      addBotMessage("I'm sorry, I'm experiencing technical difficulties. Please try again later or contact us directly.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSuggestionClick = (suggestion) => {
    sendMessage(suggestion);
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const toggleChat = () => {
    setIsOpen(!isOpen);
    if (!isOpen) {
      setIsMinimized(false);
    }
  };

  const toggleMinimize = () => {
    setIsMinimized(!isMinimized);
  };

  const formatMessage = (message) => {
    // Convert newlines to line breaks and format bullet points
    return message
      .split('\n')
      .map((line, index) => {
        if (line.trim().startsWith('•')) {
          return (
            <div key={index} className="ml-4 mb-1">
              <span className="text-red-600 font-bold">•</span>
              <span className="ml-2">{line.trim().substring(1)}</span>
            </div>
          );
        }
        return line.trim() ? <div key={index} className="mb-1">{line}</div> : <br key={index} />;
      });
  };

  return (
    <>
      {/* Chat Button */}
      {!isOpen && (
        <button
          onClick={toggleChat}
          className="fixed bottom-6 right-6 w-16 h-16 rounded-full shadow-lg hover:shadow-xl transition-all duration-300 z-50 flex items-center justify-center group chatbot-float-button chatbot-button-hover"
          style={{ backgroundColor: '#c0392b' }}
        >
          <MessageCircle className="w-8 h-8 text-white group-hover:scale-110 transition-transform" />
          <div className="absolute -top-2 -right-2 w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
            <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
          </div>
        </button>
      )}

      {/* Chat Window */}
      {isOpen && (
        <div className="fixed bottom-6 right-6 w-96 bg-white rounded-2xl shadow-2xl z-50 border border-gray-200 overflow-hidden chatbot-window-enter">
          {/* Header */}
          <div className="p-4 text-white flex items-center justify-between" style={{ backgroundColor: '#c0392b' }}>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
                <Bot className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-semibold">Corex Assistant</h3>
                <p className="text-sm text-red-100">Online • Ready to help</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={toggleMinimize}
                className="p-1 hover:bg-white/20 rounded transition-colors"
              >
                {isMinimized ? <Maximize2 className="w-4 h-4" /> : <Minimize2 className="w-4 h-4" />}
              </button>
              <button
                onClick={toggleChat}
                className="p-1 hover:bg-white/20 rounded transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Chat Content */}
          {!isMinimized && (
            <>
              {/* Messages */}
              <div className="h-96 overflow-y-auto p-4 space-y-4 bg-gray-50 chatbot-messages">
                {messages.map((msg) => (
                  <div
                    key={msg.id}
                    className={`flex gap-3 ${msg.type === 'user' ? 'justify-end' : 'justify-start'} chatbot-message-enter`}
                  >
                    {msg.type === 'bot' && (
                      <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0" style={{ backgroundColor: '#c0392b' }}>
                        <Bot className="w-4 h-4 text-white" />
                      </div>
                    )}
                    <div
                      className={`max-w-xs lg:max-w-md px-4 py-2 rounded-2xl ${
                        msg.type === 'user'
                          ? 'bg-red-600 text-white'
                          : 'bg-white text-gray-800 border border-gray-200'
                      }`}
                    >
                      <div className="text-sm">
                        {msg.type === 'bot' ? formatMessage(msg.message) : msg.message}
                      </div>
                      <div className={`text-xs mt-1 ${msg.type === 'user' ? 'text-red-100' : 'text-gray-500'}`}>
                        {msg.timestamp}
                      </div>
                    </div>
                    {msg.type === 'user' && (
                      <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center flex-shrink-0">
                        <User className="w-4 h-4 text-gray-600" />
                      </div>
                    )}
                  </div>
                ))}
                
                {/* Loading indicator */}
                {isLoading && (
                  <div className="flex gap-3 justify-start chatbot-message-enter">
                    <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0" style={{ backgroundColor: '#c0392b' }}>
                      <Bot className="w-4 h-4 text-white" />
                    </div>
                    <div className="bg-white text-gray-800 border border-gray-200 px-4 py-2 rounded-2xl">
                      <div className="flex space-x-1">
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                      </div>
                    </div>
                  </div>
                )}
                
                <div ref={messagesEndRef} />
              </div>

              {/* Suggestions */}
              {suggestions.length > 0 && (
                <div className="p-4 border-t border-gray-200 bg-white">
                  <p className="text-xs text-gray-500 mb-2">Quick suggestions:</p>
                  <div className="flex flex-wrap gap-2">
                    {suggestions.slice(0, 3).map((suggestion, index) => (
                      <button
                        key={index}
                        onClick={() => handleSuggestionClick(suggestion)}
                        className="text-xs px-3 py-1 bg-gray-100 hover:bg-red-50 hover:text-red-600 rounded-full transition-colors border border-gray-200 hover:border-red-200 chatbot-suggestion"
                        disabled={isLoading}
                      >
                        {suggestion}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Input */}
              <div className="p-4 border-t border-gray-200 bg-white">
                <div className="flex gap-2">
                  <input
                    ref={inputRef}
                    type="text"
                    value={inputMessage}
                    onChange={(e) => setInputMessage(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder="Type your message..."
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent text-sm"
                    disabled={isLoading}
                  />
                  <button
                    onClick={() => sendMessage()}
                    disabled={!inputMessage.trim() || isLoading}
                    className="px-4 py-2 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    style={{ backgroundColor: '#c0392b' }}
                  >
                    <Send className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Contact Info Footer */}
              <div className="px-4 py-2 bg-gray-50 border-t border-gray-200">
                <div className="flex items-center justify-center gap-4 text-xs text-gray-500">
                  <div className="flex items-center gap-1">
                    <Phone className="w-3 h-3" />
                    <span>+250 XXX XXX XXX</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <MapPin className="w-3 h-3" />
                    <span>Kigali, Rwanda</span>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      )}
    </>
  );
};