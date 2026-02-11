import React from 'react';

// Ultra-lightweight skeleton loader - optimized for instant render
// Shows only essential structure to maintain layout
export const PageLoadingSkeleton = () => {
  return (
    <div className="min-h-screen bg-white pb-32">
      {/* Minimal header skeleton - fast to render */}
      <div className="sticky top-0 bg-white border-b border-gray-100 z-20">
        <div className="p-4 h-12 bg-gradient-to-r from-gray-100 to-gray-50 rounded animate-pulse"></div>
      </div>

      {/* Fast content skeleton - 2 cards only instead of 3 */}
      <div className="max-w-2xl mx-auto p-4 space-y-3">
        {[1, 2].map((i) => (
          <div key={i} className="bg-gray-50 rounded-lg p-3 space-y-2">
            {/* Minimal avatar + title */}
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-gray-200 rounded-full animate-pulse flex-shrink-0"></div>
              <div className="h-3 bg-gray-200 rounded w-1/4 animate-pulse"></div>
            </div>
            {/* Content line */}
            <div className="h-3 bg-gray-100 rounded w-3/4 animate-pulse"></div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default PageLoadingSkeleton;

