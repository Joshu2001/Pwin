import { createContext, useContext, useState, useEffect } from 'react';

const LanguageContext = createContext();

/**
 * LanguageProvider - Global language management context
 * Provides language state across the entire application
 * Persists language selection to localStorage
 */
export const LanguageProvider = ({ children }) => {
  const [selectedLanguage, setSelectedLanguage] = useState(() => {
    try {
      return localStorage.getItem('regaarder_language') || 'English';
    } catch (e) {
      return 'English';
    }
  });

  // Update localStorage whenever language changes
  useEffect(() => {
    try {
      localStorage.setItem('regaarder_language', selectedLanguage);
    } catch (e) {
      console.warn('Could not save language to localStorage', e);
    }
  }, [selectedLanguage]);

  // Listen for storage changes in other tabs/windows
  useEffect(() => {
    const handleStorageChange = (e) => {
      if (e.key === 'regaarder_language' && e.newValue) {
        setSelectedLanguage(e.newValue);
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  const value = {
    selectedLanguage,
    setSelectedLanguage,
    changeLanguage: (lang) => setSelectedLanguage(lang),
  };

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
};

/**
 * useLanguage - Hook to use language context in components
 * @returns {Object} { selectedLanguage, setSelectedLanguage, changeLanguage }
 */
export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};

export default LanguageContext;
