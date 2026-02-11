import React, { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';

// Wrapper component that provides smooth transitions between routes
export const RouteTransition = ({ children }) => {
  const location = useLocation();
  const [displayKey, setDisplayKey] = useState(location.pathname);
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    // Check if path actually changed
    if (displayKey !== location.pathname) {
      setIsVisible(false);
      
      // Use requestAnimationFrame for next frame update
      const frameId = requestAnimationFrame(() => {
        setDisplayKey(location.pathname);
        // Immediately make visible again
        setIsVisible(true);
      });

      return () => cancelAnimationFrame(frameId);
    }
  }, [location.pathname, displayKey]);

  return (
    <div 
      className="page-transition page-container" 
      style={{ 
        opacity: isVisible ? 1 : 0,
        transition: 'opacity 200ms ease-in-out'
      }}
    >
      {children}
    </div>
  );
};

export default RouteTransition;

