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

  const RAILWAY_URL = 'https://pwin-copy-production.up.railway.app';
  const normalizeBackend = (val) => {
    if (!val) return null;
    const v = String(val).trim();
    if (!v) return null;
    // Redirect all old Render/Railway URLs and localhost to correct Railway
    if (v.includes('pwin.onrender.com') || v.includes('regaarder-pwin.onrender.com') || v.includes('web-production-b6cfe.up.railway.app') || v.includes('localhost:4000')) {
      return RAILWAY_URL;
    }
    return v;
  };

  const normalizedStored = normalizeBackend(storedBackend);
  const normalizedEnv = normalizeBackend(envBackend);

  if (normalizedStored) window.__BACKEND_URL__ = normalizedStored;
  else if (normalizedEnv) window.__BACKEND_URL__ = normalizedEnv;
  else window.__BACKEND_URL__ = RAILWAY_URL;

  try { window.localStorage.setItem('regaarder_backend_url', window.__BACKEND_URL__); } catch (e) { }
}

if (typeof window !== 'undefined' && typeof window.fetch === 'function') {
  const nativeFetch = window.fetch.bind(window);

  const readHeader = (headers, name) => {
    if (!headers) return '';
    const needle = String(name || '').toLowerCase();
    try {
      if (typeof Headers !== 'undefined' && headers instanceof Headers) {
        return headers.get(name) || headers.get(needle) || '';
      }
    } catch (e) { }
    if (Array.isArray(headers)) {
      const found = headers.find((pair) => Array.isArray(pair) && String(pair[0] || '').toLowerCase() === needle);
      return found ? String(found[1] || '') : '';
    }
    if (typeof headers === 'object') {
      const key = Object.keys(headers).find((k) => String(k || '').toLowerCase() === needle);
      return key ? String(headers[key] || '') : '';
    }
    return '';
  };

  const getAuthorizationHeader = (input, init) => {
    const fromInit = readHeader(init && init.headers, 'authorization');
    if (fromInit) return fromInit;
    try {
      if (input && typeof Request !== 'undefined' && input instanceof Request) {
        return readHeader(input.headers, 'authorization');
      }
    } catch (e) { }
    return '';
  };

  const handleUnauthorized = () => {
    try {
      localStorage.removeItem('regaarder_token');
      localStorage.removeItem('regaarder_user');
      localStorage.setItem('notifications', JSON.stringify([]));
      localStorage.setItem('notifications_center_cache', JSON.stringify([]));
      localStorage.setItem('notifications_count', '0');
      window.dispatchEvent(new CustomEvent('notifications:updated', { detail: { count: 0 } }));
      window.dispatchEvent(new CustomEvent('auth:unauthorized'));
    } catch (e) { }
  };

  window.fetch = (input, init) => {
    const authHeader = getAuthorizationHeader(input, init);
    try {
      const base = window.__BACKEND_URL__
        || import.meta.env.VITE_BACKEND_URL
        || import.meta.env.VITE_BACKEND
        || 'https://pwin-copy-production.up.railway.app';
      const rewrite = (url) => {
        if (typeof url !== 'string') return url;
        return url
          .replace('https://pwin.onrender.com', base)
          .replace('http://pwin.onrender.com', base)
          .replace('https://regaarder-pwin.onrender.com', base)
          .replace('http://regaarder-pwin.onrender.com', base)
          .replace('https://web-production-b6cfe.up.railway.app', base);
      };

      if (typeof input === 'string') {
        return nativeFetch(rewrite(input), init).then((res) => {
          if (res && res.status === 401 && /^\s*Bearer\s+/i.test(authHeader || '')) {
            handleUnauthorized();
          }
          return res;
        });
      }

      if (input && typeof input.url === 'string') {
        const newUrl = rewrite(input.url);
        if (newUrl !== input.url) {
          const req = new Request(newUrl, input);
          return nativeFetch(req, init).then((res) => {
            if (res && res.status === 401 && /^\s*Bearer\s+/i.test(authHeader || '')) {
              handleUnauthorized();
            }
            return res;
          });
        }
      }
    } catch (e) { }

    return nativeFetch(input, init).then((res) => {
      if (res && res.status === 401 && /^\s*Bearer\s+/i.test(authHeader || '')) {
        handleUnauthorized();
      }
      return res;
    });
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
