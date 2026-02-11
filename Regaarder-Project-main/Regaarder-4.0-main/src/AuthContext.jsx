import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import AuthModal from './AuthModal.jsx';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const drawerCloseCallbackRef = useRef(null); // Store drawer close callback

  const login = (profile = { id: 'user-1', name: 'You' }) => {
    setUser(profile);
    try { 
      localStorage.setItem('regaarder_user', JSON.stringify(profile)); 
      if (profile.token) localStorage.setItem('regaarder_token', profile.token); 
    } catch (e) {}
    setShowAuthModal(false);
  };
  useEffect(() => {
    try {
      const token = localStorage.getItem('regaarder_token');
      if (token) {
        const raw = localStorage.getItem('regaarder_user');
        if (raw) setUser(JSON.parse(raw));
      } else {
        // ensure we don't leave a stale user object in storage
        localStorage.removeItem('regaarder_user');
      }
    } catch (e) {}
  }, []);

  // Logout clears both in-memory and persisted session data so the user stays logged out
  const logout = () => {
    setUser(null);
    try {
      localStorage.removeItem('regaarder_user');
      localStorage.removeItem('regaarder_token');
    } catch (e) {}
  };
  const logoutAndClear = logout;
  const openAuthModal = () => {
    // Close drawer if callback is set
    if (drawerCloseCallbackRef.current) {
      drawerCloseCallbackRef.current();
    }
    setShowAuthModal(true);
  };
  const closeAuthModal = () => setShowAuthModal(false);
  
  const setDrawerCloseCallback = (callback) => {
    drawerCloseCallbackRef.current = callback;
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, openAuthModal, closeAuthModal, setDrawerCloseCallback }}>
      {children}
      {showAuthModal && (
        <AuthModal onClose={closeAuthModal} onLogin={(profile) => login(profile)} />
      )}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    console.error('useAuth must be used within AuthProvider');
    return {
      user: null,
      login: () => {},
      logout: () => {},
      openAuthModal: () => {},
      closeAuthModal: () => {}
    };
  }
  return ctx;
}

export default AuthContext;
