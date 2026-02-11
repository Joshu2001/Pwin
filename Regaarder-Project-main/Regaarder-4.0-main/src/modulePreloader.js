/**
 * Module Prefetching Utility
 * Preloads components when user hovers over navigation links
 * Creates instant-feeling page switches by loading in background
 */

const preloadedModules = new Set();

/**
 * Preload a component module dynamically
 * Used on link hover to start loading before user clicks
 */
export const preloadComponent = async (importFn) => {
  try {
    // Use a unique identifier for each module
    const moduleId = importFn.toString();
    
    // Skip if already preloading/loaded
    if (preloadedModules.has(moduleId)) {
      return;
    }
    
    preloadedModules.add(moduleId);
    
    // Start loading in background
    await importFn();
  } catch (error) {
    console.warn('Failed to preload module:', error);
    // Remove from cache so it can be retried
    preloadedModules.delete(importFn.toString());
  }
};

/**
 * Create hover handler for navigation links
 * Call on link onMouseEnter to start preloading
 */
export const createNavHoverHandler = (componentImportFn) => {
  return () => preloadComponent(componentImportFn);
};
