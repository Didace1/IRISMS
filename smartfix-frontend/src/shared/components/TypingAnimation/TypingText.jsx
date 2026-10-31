import React, { useState, useEffect } from 'react';

/**
 * TypingText Component - Displays text with typing animation like ChatGPT
 * @param {string} text - The text to display with typing effect
 * @param {number} speed - Typing speed in milliseconds (default: 30)
 * @param {function} onComplete - Callback when typing animation completes
 * @param {string} className - Additional CSS classes
 */
export const TypingText = ({ 
  text, 
  speed = 30, 
  onComplete, 
  className = '' 
}) => {
  const [displayedText, setDisplayedText] = useState('');
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isComplete, setIsComplete] = useState(false);

  useEffect(() => {
    if (currentIndex < text.length) {
      const timeout = setTimeout(() => {
        setDisplayedText(prev => prev + text[currentIndex]);
        setCurrentIndex(prev => prev + 1);
      }, speed);

      return () => clearTimeout(timeout);
    } else if (!isComplete) {
      setIsComplete(true);
      if (onComplete) {
        onComplete();
      }
    }
  }, [currentIndex, text, speed, onComplete, isComplete]);

  // Reset when text changes
  useEffect(() => {
    setDisplayedText('');
    setCurrentIndex(0);
    setIsComplete(false);
  }, [text]);

  return (
    <span className={className}>
      {displayedText}
      {!isComplete && <span className="animate-pulse">|</span>}
    </span>
  );
};

/**
 * TypingParagraph Component - Displays paragraph with typing animation
 */
export const TypingParagraph = ({ 
  text, 
  speed = 30, 
  onComplete, 
  className = '' 
}) => {
  return (
    <p className={className}>
      <TypingText text={text} speed={speed} onComplete={onComplete} />
    </p>
  );
};

/**
 * TypingList Component - Displays list items one by one with typing animation
 */
export const TypingList = ({ 
  items, 
  speed = 30, 
  itemDelay = 500,
  className = '',
  itemClassName = ''
}) => {
  const [visibleItems, setVisibleItems] = useState([]);
  const [currentItemIndex, setCurrentItemIndex] = useState(0);

  const handleItemComplete = () => {
    setTimeout(() => {
      if (currentItemIndex < items.length - 1) {
        setCurrentItemIndex(prev => prev + 1);
      }
    }, itemDelay);
  };

  useEffect(() => {
    if (currentItemIndex < items.length) {
      setVisibleItems(items.slice(0, currentItemIndex + 1));
    }
  }, [currentItemIndex, items]);

  // Reset when items change
  useEffect(() => {
    setVisibleItems([]);
    setCurrentItemIndex(0);
  }, [items]);

  return (
    <div className={className}>
      {visibleItems.map((item, index) => (
        <div key={index} className={`flex items-start gap-3 ${itemClassName}`}>
          <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0"></div>
          {index === visibleItems.length - 1 ? (
            <TypingText 
              text={item} 
              speed={speed} 
              onComplete={handleItemComplete}
              className="text-gray-700"
            />
          ) : (
            <span className="text-gray-700">{item}</span>
          )}
        </div>
      ))}
    </div>
  );
};

/**
 * TypingCard Component - Displays card content with typing animation
 */
export const TypingCard = ({ 
  title,
  content,
  speed = 20,
  onComplete,
  className = ''
}) => {
  const [showContent, setShowContent] = useState(false);

  const handleTitleComplete = () => {
    setTimeout(() => {
      setShowContent(true);
    }, 300);
  };

  return (
    <div className={className}>
      <TypingText 
        text={title} 
        speed={speed} 
        onComplete={handleTitleComplete}
        className="font-semibold text-gray-900"
      />
      {showContent && (
        <div className="mt-2">
          <TypingText 
            text={content} 
            speed={speed} 
            onComplete={onComplete}
            className="text-gray-700"
          />
        </div>
      )}
    </div>
  );
};
