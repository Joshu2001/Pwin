/**
 * Backend Configuration
 * Handles environment-specific API endpoint detection
 */

const getBackendUrl = () => {
  // If window.__BACKEND_URL__ is set (from environment or config), use it
  if (typeof window !== 'undefined' && window.__BACKEND_URL__) {
    return window.__BACKEND_URL__;
  }

  // Development: localhost with port 4000
  if (typeof window !== 'undefined' && window.location.hostname === 'localhost') {
    return 'http://localhost:4000';
  }

  // APK/Mobile: Use the device's actual IP with port 4000
  if (typeof window !== 'undefined') {
    const protocol = window.location.protocol; // http: or https:
    const hostname = window.location.hostname; // 192.168.x.x or actual domain
    return `${protocol}//${hostname}:4000`;
  }

  // Fallback
  return 'http://localhost:4000';
};

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
