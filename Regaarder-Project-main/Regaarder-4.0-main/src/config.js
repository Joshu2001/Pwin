/**
 * Backend Configuration
 * Handles environment-specific API endpoint detection
 */

const getBackendUrl = () => {
  // If window.__BACKEND_URL__ is set (from environment or config), use it
  if (typeof window !== 'undefined' && window.__BACKEND_URL__) {
    return window.__BACKEND_URL__;
  }

  const envBackend = (typeof import.meta !== 'undefined' && import.meta.env)
    ? (import.meta.env.VITE_BACKEND_URL || import.meta.env.VITE_BACKEND)
    : null;

  if (envBackend) return envBackend;

  // Default to deployed backend
  if (typeof window !== 'undefined') {
    return 'https://pwin-copy-production.up.railway.app';
  }

  // Fallback
  return 'https://pwin-copy-production.up.railway.app';
};

/**
 * Production Web URL for sharing
 */
export const WEB_URL = 'https://regaarder.com';

/**
 * Get the backend base URL for API calls
 * Safe to use in components and modules
 */
export const BACKEND_URL = getBackendUrl();

/**
 * For use in initialization or where you need a function
 */
export const getBackendBaseUrl = getBackendUrl;

export default {
  BACKEND_URL,
  getBackendBaseUrl
};
