// Navigation utility for converting old window.location.href calls to React Router navigation
import { useNavigate } from 'react-router-dom';

// Custom hook for navigation
export const useAppNavigate = () => {
  const navigate = useNavigate();
  
  const navigateTo = (path) => {
    // Remove .jsx extension if present
    const cleanPath = path.replace(/\.jsx$/, '');
    navigate(cleanPath);
  };
  
  return navigateTo;
};

// Helper function to convert href paths to route paths
export const convertPath = (path) => {
  if (!path) return '/';
  
  // Handle query strings
  const [pathname, search] = path.split('?');
  const cleanPath = pathname.replace(/\.jsx$/, '');
  
  return search ? `${cleanPath}?${search}` : cleanPath;
};

// Global navigation helper (for non-hook contexts)
export const globalNavigate = (path) => {
  const cleanPath = convertPath(path);
  window.history.pushState({}, '', cleanPath);
  window.dispatchEvent(new PopStateEvent('popstate'));
};
