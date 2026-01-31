import './fix_metamask_error.js';
import React from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import App from './App.jsx';
import { AuthProvider } from './AuthContext.jsx';
import { ThemeProvider } from './ThemeContext.jsx';
import ThemeModal from './ThemeModal.jsx';
import PlayerProvider from './PlayerProvider.jsx';

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
