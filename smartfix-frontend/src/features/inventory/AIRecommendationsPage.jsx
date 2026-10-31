import React, { useState, useEffect } from 'react';
import {
  Brain,
  ChevronRight,
  ChevronLeft,
  Check,
  SkipForward,
  Package,
  TrendingUp,
  AlertCircle,
  Award,
  Target,
  DollarSign,
  Calendar,
  FileText,
  LayoutList,
  ArrowLeft,
  CheckCircle,
  XCircle
} from 'lucide-react';
import { formatCurrency, formatNumber } from '../../shared/utils/formatters';

// Phase components
import { LoadingScreen } from './components/LoadingScreen';
import { WelcomeScreen } from './components/WelcomeScreen';
import { RecommendationCard } from './components/RecommendationCard';
import { PriorityTransition } from './components/PriorityTransition';
import { SummaryScreen } from './components/SummaryScreen';

export const AIRecommendationsPage = () => {
  // Phase management
  const [currentPhase, setCurrentPhase] = useState('loading'); // loading, welcome, recommendation, transition, summary
  const [currentPriority, setCurrentPriority] = useState('high');
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isLoadingNext, setIsLoadingNext] = useState(false);
  
  // Data
  const [recommendations, setRecommendations] = useState(null);
  const [userName, setUserName] = useState('');
  const [acceptedItems, setAcceptedItems] = useState([]);
  const [skippedItems, setSkippedItems] = useState([]);
  
  // Loading states
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const AI_BACKEND_BASE_URL = process.env.REACT_APP_AI_BACKEND_URL || 'http://localhost:8000';

  useEffect(() => {
    // Get user name from localStorage
    try {
      const userStr = localStorage.getItem('user');
      if (userStr) {
        const user = JSON.parse(userStr);
        const name = user.fullName || user.firstName || user.username || 'User';
        setUserName(name);
      }
    } catch (err) {
      console.error('Error parsing user data:', err);
      setUserName('User');
    }
    
    fetchGuidedRecommendations();
  }, []);

  const fetchGuidedRecommendations = async () => {
    try {
      setLoading(true);
      setCurrentPhase('loading');
      
      // Simulate minimum 2-second loading for professional feel
      const startTime = Date.now();
      
      const response = await fetch(`${AI_BACKEND_BASE_URL}/api/inventory-recommendations/guided`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch recommendations');
      }
      
      const data = await response.json();
      
      // Ensure minimum 2 seconds loading time
      const elapsed = Date.now() - startTime;
      if (elapsed < 2000) {
        await new Promise(resolve => setTimeout(resolve, 2000 - elapsed));
      }
      
      setRecommendations(data);
      setError(null);
      setLoading(false);
      setCurrentPhase('welcome');
      
    } catch (err) {
      setError(err.message);
      console.error('Error fetching guided recommendations:', err);
      setLoading(false);
      setCurrentPhase('error');
    }
  };

  const handleStartRecommendations = (selectedPriority = null) => {
    setCurrentPhase('recommendation');
    
    // Use selected priority from chat, or default to first available priority
    let startPriority = selectedPriority;
    if (!startPriority) {
      if (recommendations?.summary?.high_priority_count > 0) {
        startPriority = 'high';
      } else if (recommendations?.summary?.medium_priority_count > 0) {
        startPriority = 'medium';
      } else if (recommendations?.summary?.low_priority_count > 0) {
        startPriority = 'low';
      }
    }
    
    setCurrentPriority(startPriority || 'high');
    setCurrentIndex(0);
  };

  const getCurrentRecommendations = () => {
    if (!recommendations) return [];
    return recommendations.recommendations[currentPriority] || [];
  };

  const getCurrentRecommendation = () => {
    const recs = getCurrentRecommendations();
    return recs[currentIndex] || null;
  };

  const handleNext = () => {
    setIsLoadingNext(true);
    
    setTimeout(() => {
      const currentRecs = getCurrentRecommendations();
      
      if (currentIndex < currentRecs.length - 1) {
        // Move to next in current priority
        setCurrentIndex(currentIndex + 1);
      } else {
        // Move to next priority level
        if (currentPriority === 'high' && recommendations.summary.medium_priority_count > 0) {
          setCurrentPhase('transition');
          setNextPriority('medium');
        } else if (currentPriority === 'medium' && recommendations.summary.low_priority_count > 0) {
          setCurrentPhase('transition');
          setNextPriority('low');
        } else {
          // All done
          setCurrentPhase('summary');
        }
      }
      
      setIsLoadingNext(false);
    }, 2000);
  };

  const handlePrevious = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
    } else if (currentPriority === 'medium') {
      // Go back to high priority
      setCurrentPriority('high');
      const highRecs = recommendations.recommendations.high || [];
      setCurrentIndex(highRecs.length - 1);
    } else if (currentPriority === 'low') {
      // Go back to medium priority
      setCurrentPriority('medium');
      const mediumRecs = recommendations.recommendations.medium || [];
      setCurrentIndex(mediumRecs.length - 1);
    }
  };

  const handleSkip = () => {
    const current = getCurrentRecommendation();
    if (current) {
      setSkippedItems([...skippedItems, current]);
    }
    handleNext();
  };

  const handleAccept = () => {
    const current = getCurrentRecommendation();
    if (current) {
      setAcceptedItems([...acceptedItems, current]);
    }
    handleNext();
  };

  const handleContinueToNextPriority = (nextPriority) => {
    setCurrentPriority(nextPriority);
    setCurrentIndex(0);
    setCurrentPhase('recommendation');
  };

  const handleViewSummary = () => {
    setCurrentPhase('summary');
  };

  const handleStartNewAnalysis = () => {
    setAcceptedItems([]);
    setSkippedItems([]);
    setCurrentIndex(0);
    setCurrentPriority('high');
    fetchGuidedRecommendations();
  };

  const handleViewAll = () => {
    setCurrentPhase('all');
  };

  const handleAcceptInAll = (item) => {
    if (!acceptedItems.find(a => a.product_id === item.product_id)) {
      setAcceptedItems([...acceptedItems, item]);
    }
    // Remove from skipped if previously skipped
    setSkippedItems(skippedItems.filter(s => s.product_id !== item.product_id));
  };

  const handleSkipInAll = (item) => {
    if (!skippedItems.find(s => s.product_id === item.product_id)) {
      setSkippedItems([...skippedItems, item]);
    }
    // Remove from accepted if previously accepted
    setAcceptedItems(acceptedItems.filter(a => a.product_id !== item.product_id));
  };

  const getItemStatus = (item) => {
    if (acceptedItems.find(a => a.product_id === item.product_id)) return 'accepted';
    if (skippedItems.find(s => s.product_id === item.product_id)) return 'skipped';
    return 'pending';
  };

  const [nextPriority, setNextPriority] = useState('');

  const getTotalProgress = () => {
    if (!recommendations) return { current: 0, total: 0 };
    
    const high = recommendations.recommendations.high || [];
    const medium = recommendations.recommendations.medium || [];
    const low = recommendations.recommendations.low || [];
    
    let current = 0;
    if (currentPriority === 'high') {
      current = currentIndex + 1;
    } else if (currentPriority === 'medium') {
      current = high.length + currentIndex + 1;
    } else if (currentPriority === 'low') {
      current = high.length + medium.length + currentIndex + 1;
    }
    
    const total = high.length + medium.length + low.length;
    return { current, total };
  };

  const getPriorityIcon = (priority) => {
    switch (priority) {
      case 'high':
        return <AlertCircle className="w-5 h-5 text-red-500" />;
      case 'medium':
        return <TrendingUp className="w-5 h-5 text-yellow-500" />;
      case 'low':
        return <Package className="w-5 h-5 text-green-500" />;
      default:
        return null;
    }
  };

  const getPriorityLabel = (priority) => {
    return priority.charAt(0).toUpperCase() + priority.slice(1) + ' Priority';
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'high':
        return 'bg-red-50 border-red-200 text-red-700';
      case 'medium':
        return 'bg-yellow-50 border-yellow-200 text-yellow-700';
      case 'low':
        return 'bg-green-50 border-green-200 text-green-700';
      default:
        return 'bg-gray-50 border-gray-200 text-gray-700';
    }
  };

  // Keyboard navigation - removed
  // useEffect(() => {
  //   const handleKeyPress = (e) => {
  //     if (currentPhase !== 'recommendation') return;
  //     
  //     switch (e.key) {
  //       case 'ArrowRight':
  //       case 'Enter':
  //         handleNext();
  //         break;
  //       case 'ArrowLeft':
  //         handlePrevious();
  //         break;
  //       default:
  //         break;
  //     }
  //   };
  //
  //   window.addEventListener('keydown', handleKeyPress);
  //   return () => window.removeEventListener('keydown', handleKeyPress);
  // }, [currentPhase, currentIndex, currentPriority]);

  // Render phases
  if (currentPhase === 'loading') {
    return <LoadingScreen />;
  }

  if (currentPhase === 'error') {
    return (
      <div className="p-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center max-w-2xl mx-auto mt-20">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-red-900 mb-2">Error Loading Recommendations</h3>
          <p className="text-red-700 mb-4">{error}</p>
          <button
            onClick={fetchGuidedRecommendations}
            className="bg-red-600 text-white px-6 py-2 rounded-lg hover:bg-red-700 transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  if (currentPhase === 'welcome') {
    return (
      <WelcomeScreen
        userName={userName}
        summary={recommendations?.summary}
        salesTrends={recommendations?.sales_trends}
        onStart={(priority) => {
          if (priority === 'all') {
            handleViewAll();
          } else {
            handleStartRecommendations(priority);
          }
        }}
      />
    );
  }

  if (currentPhase === 'transition') {
    const completedPriority = currentPriority;
    const completedCount = getCurrentRecommendations().length;
    const acceptedCount = acceptedItems.filter(item => {
      const recs = recommendations.recommendations[completedPriority] || [];
      return recs.some(r => r.product_id === item.product_id);
    }).length;

    return (
      <PriorityTransition
        completedPriority={completedPriority}
        completedCount={completedCount}
        acceptedCount={acceptedCount}
        nextPriority={nextPriority}
        onContinue={() => handleContinueToNextPriority(nextPriority)}
        onViewSummary={handleViewSummary}
      />
    );
  }

  if (currentPhase === 'summary') {
    return (
      <SummaryScreen
        acceptedItems={acceptedItems}
        skippedItems={skippedItems}
        recommendations={recommendations}
        onStartNew={handleStartNewAnalysis}
      />
    );
  }

  if (currentPhase === 'all') {
    const allGroups = [
      { key: 'high', label: 'High Priority', color: 'red', icon: <AlertCircle className="w-5 h-5 text-red-500" />, items: recommendations?.recommendations?.high || [] },
      { key: 'medium', label: 'Medium Priority', color: 'yellow', icon: <TrendingUp className="w-5 h-5 text-yellow-500" />, items: recommendations?.recommendations?.medium || [] },
      { key: 'low', label: 'Low Priority', color: 'green', icon: <Package className="w-5 h-5 text-green-500" />, items: recommendations?.recommendations?.low || [] },
    ].filter(g => g.items.length > 0);

    const totalItems = allGroups.reduce((sum, g) => sum + g.items.length, 0);
    const reviewedCount = acceptedItems.length + skippedItems.length;

    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-5xl mx-auto">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <button
                onClick={() => setCurrentPhase('welcome')}
                className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <LayoutList className="w-6 h-6 text-indigo-600" />
              <h1 className="text-xl font-bold text-gray-900">All Recommendations</h1>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-sm text-gray-500">
                {reviewedCount} / {totalItems} reviewed
              </span>
              <button
                onClick={() => setCurrentPhase('summary')}
                className="flex items-center gap-2 px-5 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors text-sm font-medium"
              >
                <FileText className="w-4 h-4" />
                View Summary
              </button>
            </div>
          </div>

          {/* Progress bar */}
          <div className="mb-6">
            <div className="flex justify-between text-xs text-gray-500 mb-1">
              <span>{acceptedItems.length} accepted · {skippedItems.length} skipped</span>
              <span>{Math.round((reviewedCount / totalItems) * 100)}% reviewed</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-indigo-500 h-2 rounded-full transition-all duration-300"
                style={{ width: `${(reviewedCount / totalItems) * 100}%` }}
              />
            </div>
          </div>

          {/* Grouped sections */}
          <div className="space-y-8">
            {allGroups.map((group) => (
              <div key={group.key}>
                {/* Section header */}
                <div className={`flex items-center gap-2 mb-3 px-1`}>
                  {group.icon}
                  <h2 className="text-base font-bold text-gray-800">{group.label}</h2>
                  <span className={`ml-1 px-2 py-0.5 rounded-full text-xs font-semibold ${
                    group.color === 'red' ? 'bg-red-100 text-red-700' :
                    group.color === 'yellow' ? 'bg-yellow-100 text-yellow-700' :
                    'bg-green-100 text-green-700'
                  }`}>{group.items.length} items</span>
                </div>

                {/* Items table */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-gray-50 border-b border-gray-200">
                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wide">Product</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wide">Category</th>
                        <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 uppercase tracking-wide">Current Stock</th>
                        <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 uppercase tracking-wide">Order Qty</th>
                        <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 uppercase tracking-wide">AI Score</th>
                        <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600 uppercase tracking-wide">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {group.items.map((item) => {
                        const status = getItemStatus(item);
                        return (
                          <tr
                            key={item.product_id}
                            className={`transition-colors ${
                              status === 'accepted' ? 'bg-green-50' :
                              status === 'skipped' ? 'bg-gray-50 opacity-60' :
                              'hover:bg-gray-50'
                            }`}
                          >
                            <td className="px-4 py-3">
                              <div>
                                <p className="font-semibold text-gray-900">{item.product_name}</p>
                                <p className="text-xs text-gray-500">{item.brand}</p>
                              </div>
                            </td>
                            <td className="px-4 py-3 text-gray-600">{item.category}</td>
                            <td className="px-4 py-3 text-right font-medium text-gray-800">{item.current_stock}</td>
                            <td className="px-4 py-3 text-right">
                              <span className="font-bold text-green-700">{item.recommended_quantity}</span>
                            </td>
                            <td className="px-4 py-3 text-right">
                              <span className="font-bold text-blue-600">{item.recommendation_score}/5</span>
                            </td>
                            <td className="px-4 py-3">
                              <div className="flex items-center justify-center gap-2">
                                {status === 'accepted' ? (
                                  <span className="flex items-center gap-1 text-xs text-green-600 font-semibold">
                                    <CheckCircle className="w-4 h-4" /> Accepted
                                  </span>
                                ) : status === 'skipped' ? (
                                  <span className="flex items-center gap-1 text-xs text-gray-500 font-semibold">
                                    <XCircle className="w-4 h-4" /> Skipped
                                  </span>
                                ) : (
                                  <>
                                    <button
                                      onClick={() => handleAcceptInAll(item)}
                                      className="flex items-center gap-1 px-3 py-1.5 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-xs font-medium"
                                    >
                                      <CheckCircle className="w-3.5 h-3.5" /> Accept
                                    </button>
                                    <button
                                      onClick={() => handleSkipInAll(item)}
                                      className="flex items-center gap-1 px-3 py-1.5 border border-gray-300 text-gray-600 rounded-lg hover:bg-gray-100 transition-colors text-xs font-medium"
                                    >
                                      <XCircle className="w-3.5 h-3.5" /> Skip
                                    </button>
                                  </>
                                )}
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            ))}
          </div>

          {/* Bottom action */}
          <div className="mt-8 flex justify-end">
            <button
              onClick={() => setCurrentPhase('summary')}
              className="flex items-center gap-2 px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-medium"
            >
              <FileText className="w-5 h-5" />
              Done — View Summary
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Recommendation phase
  const currentRec = getCurrentRecommendation();
  const currentRecs = getCurrentRecommendations();
  const progress = getTotalProgress();
  const isFirst = currentIndex === 0 && currentPriority === 'high';

  if (!currentRec) {
    return (
      <div className="p-6">
        <div className="text-center mt-20">
          <Package className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600">No recommendations available</p>
          <button
            onClick={() => setCurrentPhase('welcome')}
            className="mt-4 text-blue-600 hover:text-blue-700"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      {/* Loading Overlay for Next Button */}
      {isLoadingNext && (
        <div className="fixed inset-0 bg-gray-900 bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-8 shadow-2xl text-center">
            <Brain className="w-16 h-16 text-blue-500 mx-auto mb-4 animate-pulse" />
            <h3 className="text-2xl font-bold text-gray-900 mb-2">Loading Next Recommendation...</h3>
            <div className="flex items-center justify-center gap-2 mt-4">
              <div className="w-3 h-3 bg-blue-500 rounded-full animate-bounce"></div>
              <div className="w-3 h-3 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
              <div className="w-3 h-3 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></div>
            </div>
          </div>
        </div>
      )}
      
      <div className="max-w-4xl mx-auto">
        {/* Progress Header */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-3">
              <Brain className="w-6 h-6 text-blue-600" />
              <h1 className="text-xl font-bold text-gray-900">AI Recommendations</h1>
            </div>
            <div className="text-sm text-gray-600">
              {progress.current} of {progress.total}
            </div>
          </div>
          
          {/* Progress Bar */}
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${(progress.current / progress.total) * 100}%` }}
            />
          </div>
          
          {/* Priority Badge */}
          <div className="mt-4 flex items-center gap-2">
            {getPriorityIcon(currentPriority)}
            <span className={`px-3 py-1 rounded-full text-sm font-medium border ${getPriorityColor(currentPriority)}`}>
              {getPriorityLabel(currentPriority)} ({currentIndex + 1} of {currentRecs.length})
            </span>
          </div>
        </div>

        {/* Recommendation Card */}
        <RecommendationCard recommendation={currentRec} />

        {/* Navigation Controls */}
        <div className="mt-6 flex items-center justify-between gap-4">
          <button
            onClick={handlePrevious}
            disabled={isFirst}
            className="flex items-center gap-2 px-6 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <ChevronLeft className="w-5 h-5" />
            Previous
          </button>

          <button
            onClick={handleNext}
            className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Next
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
};
