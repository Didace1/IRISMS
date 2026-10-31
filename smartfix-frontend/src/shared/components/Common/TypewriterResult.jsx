import React, { useEffect, useRef, useState } from 'react';

export const TypewriterResult = ({ 
  text, 
  speed = 50, // characters per second
  delay = 0,
  className = '',
  onComplete = null
}) => {
  const [displayedText, setDisplayedText] = useState('');
  const [isComplete, setIsComplete] = useState(false);
  const runIdRef = useRef(0);
  const timeoutsRef = useRef([]);

  useEffect(() => {
    const safeText = text === null || text === undefined ? '' : String(text);

    // Cancel any in-flight typing from the previous run
    runIdRef.current += 1;
    const runId = runIdRef.current;
    timeoutsRef.current.forEach((t) => clearTimeout(t));
    timeoutsRef.current = [];

    setDisplayedText('');
    setIsComplete(false);

    if (!safeText) return;

    let charIndex = 0;

    const typeNextChar = () => {
      if (runIdRef.current !== runId) return;
      if (charIndex < safeText.length) {
        // Capture char before incrementing so the correct character is added
        const char = safeText[charIndex];
        charIndex += 1;
        setDisplayedText((prev) => prev + char);
        if (charIndex >= safeText.length) {
          setIsComplete(true);
          if (onComplete) onComplete();
        } else {
          const t = setTimeout(typeNextChar, 1000 / speed);
          timeoutsRef.current.push(t);
        }
      }
    };

    const startDelay = 300 + (Number.isFinite(delay) ? delay : 0);
    const startT = setTimeout(typeNextChar, startDelay);
    timeoutsRef.current.push(startT);

    return () => {
      runIdRef.current += 1; // invalidate this run's callbacks on cleanup
      timeoutsRef.current.forEach((t) => clearTimeout(t));
      timeoutsRef.current = [];
    };

  }, [text, speed, delay]);

  return (
    <div className={className}>
      {displayedText}
      {!isComplete && displayedText.length > 0 && (
        <span className="inline-block w-2 h-4 bg-blue-500 ml-1 animate-pulse"></span>
      )}
    </div>
  );
};

export default TypewriterResult;
