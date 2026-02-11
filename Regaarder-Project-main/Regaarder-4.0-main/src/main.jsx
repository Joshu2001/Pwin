import './fix_metamask_error.js';
import React from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import App from './App.jsx';
import { AuthProvider } from './AuthContext.jsx';
import { ThemeProvider } from './ThemeContext.jsx';
import ThemeModal from './ThemeModal.jsx';
import PlayerProvider from './PlayerProvider.jsx';

if (typeof window !== 'undefined' && !window.__BACKEND_URL__) {
  let storedBackend = null;
  try { storedBackend = window.localStorage.getItem('regaarder_backend_url'); } catch (e) { storedBackend = null; }
  const envBackend = import.meta.env.VITE_BACKEND_URL || import.meta.env.VITE_BACKEND || null;

  const normalizeBackend = (val) => {
    if (!val) return null;
    const v = String(val).trim();
    if (!v) return null;
    if (v.includes('pwin.onrender.com') || v.includes('localhost:4000')) {
      return 'https://regaarder-pwin.onrender.com';
    }
    return v;
  };

  const normalizedStored = normalizeBackend(storedBackend);
  const normalizedEnv = normalizeBackend(envBackend);

  if (normalizedStored) window.__BACKEND_URL__ = normalizedStored;
  else if (normalizedEnv) window.__BACKEND_URL__ = normalizedEnv;
  else window.__BACKEND_URL__ = 'https://regaarder-pwin.onrender.com';

  try { window.localStorage.setItem('regaarder_backend_url', window.__BACKEND_URL__); } catch (e) { }
}

if (typeof window !== 'undefined' && typeof window.fetch === 'function') {
  const nativeFetch = window.fetch.bind(window);
  window.fetch = (input, init) => {
    try {
      const base = window.__BACKEND_URL__
        || import.meta.env.VITE_BACKEND_URL
        || import.meta.env.VITE_BACKEND
        || 'https://regaarder-pwin.onrender.com';
      const rewrite = (url) => {
        if (typeof url !== 'string') return url;
        return url
          .replace('https://pwin.onrender.com', base)
          .replace('http://pwin.onrender.com', base)
          .replace('https://regaarder-pwin.onrender.com', base)
          .replace('http://regaarder-pwin.onrender.com', base);
      };

      if (typeof input === 'string') {
        return nativeFetch(rewrite(input), init);
      }

      if (input && typeof input.url === 'string') {
        const newUrl = rewrite(input.url);
        if (newUrl !== input.url) {
          const req = new Request(newUrl, input);
          return nativeFetch(req, init);
        }
      }
    } catch (e) { }

    return nativeFetch(input, init);
  };
}

const root = createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <ThemeProvider>
      <AuthProvider>
        <PlayerProvider>
          <App />
          <ThemeModal />
        </PlayerProvider>
      </AuthProvider>
    </ThemeProvider>
  </React.StrictMode>
);
