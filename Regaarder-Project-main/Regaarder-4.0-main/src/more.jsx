/* eslint-disable no-empty */
import React, { useState, useEffect } from 'react';
import { useAuth } from './AuthContext.jsx';
import { useNavigate } from 'react-router-dom';
import { getTranslation } from './translations.js';
import { useLanguage } from './LanguageContext.jsx';
import { Home, Pencil, MoreHorizontal, ChevronLeft, User, ArrowRight, FileText, X, Eye, EyeOff, Video, CreditCard, Bell, Settings, LogOut, ChevronRight, Lock, Gift, Shield } from 'lucide-react';
import StaffLoginModal from './StaffLoginModal.jsx';
import SharedBottomBar from './components/SharedBottomBar.jsx';

// Theme is now provided globally via ThemeProvider; per-page custom CSS vars removed

// Small helper to read CSS variables (used for building a lightweight `customColors` map)
const getCssVar = (name, fallback) => {
  try {
    const val = getComputedStyle(document.documentElement).getPropertyValue(name);
    return val ? val.trim() : (fallback || '');
  } catch (e) { return fallback || ''; }
};

const customColors = {
  '--color-gold': getCssVar('--color-gold', '#CB8A00'),
  '--color-gold-light': getCssVar('--color-gold-light', 'rgba(203,138,0,0.4)'),
  '--color-neutral-light-bg': getCssVar('--color-neutral-light-bg', '#FFF9E6'),
};

// --- Footer component copied from Requests feed for parity ---
// BottomBar is now using SharedBottomBar from components/SharedBottomBar.jsx
const BottomBar = ({ selectedLanguage = 'English' }) => {
  return <SharedBottomBar selectedLanguage={selectedLanguage} activeTabOverride="More" />;
};

// (Login modal moved to global AuthProvider)

// --- Main More Page Component ---
const MorePage = () => {
  const auth = useAuth();
  // Use global language context
  const { selectedLanguage } = useLanguage();

  // State is used here to toggle between signed-in and signed-out views
  const [activeTab, setActiveTab] = useState('More');
  const [isCreatorMode, setIsCreatorMode] = useState(true);

  const handleAuthClick = () => {
    auth.openAuthModal();
  };

  const handleLogout = () => {
    auth.logout();
  };

  const SignInCard = () => (
    // Card is set to max-w-md to ensure texts have more horizontal space
    <div className="bg-white p-8 rounded-xl shadow-lg text-center mx-auto w-full max-w-md">
      <User className="w-14 h-14 text-gray-500 mx-auto mb-6" />

      <h2 className="text-xl font-semibold text-gray-800 mb-2">
        {getTranslation('Sign in to access more features', selectedLanguage)}
      </h2>
      <p className="text-sm text-gray-500 mb-8 leading-relaxed">
        {getTranslation('Create an account or log in to manage your settings', selectedLanguage)}
      </p>

      <button
        onClick={handleAuthClick}
        // Use global CSS variables for accent so ThemeProvider controls color
        className="w-full flex items-center justify-center space-x-2 py-3 px-4 text-black font-bold rounded-xl shadow-lg transition duration-150 transform hover:scale-[1.01] active:scale-95"
        style={{
          backgroundColor: 'var(--color-gold)',
          boxShadow: '0 6px 18px rgba(var(--color-gold-rgb, 203,138,0), 0.18)'
        }}
      >
        <span>{getTranslation('Log In / Sign Up', selectedLanguage)}</span>
        <ArrowRight className="w-5 h-5 ml-2" />
      </button>
    </div>
  );

  const SettingsList = () => {
    const navigate = useNavigate();
    const auth = useAuth();
    const [showCreatorGate, setShowCreatorGate] = useState(false);
    const [showStaffLogin, setShowStaffLogin] = useState(false);

    // Notification badge: read count from localStorage (kept by home.jsx) and poll periodically so the More page shows it
    const [notifCount, setNotifCount] = useState(() => {
      try { return parseInt(localStorage.getItem('notifications_count') || '0', 10) || 0; } catch (e) { return 0; }
    });

    React.useEffect(() => {
      let mounted = true;
      const read = () => {
        try {
          const v = parseInt(localStorage.getItem('notifications_count') || '0', 10) || 0;
          if (mounted) setNotifCount(v);
        } catch (e) { }
      };
      read();
      const iv = setInterval(read, 3000);
      const onStorage = (e) => { if (e.key === 'notifications_count') read(); };
      window.addEventListener('storage', onStorage);
      return () => { mounted = false; clearInterval(iv); window.removeEventListener('storage', onStorage); };
    }, []);

    const menuItems = [
      { icon: User, label: 'Profile Settings', href: '/settings' },
      { icon: User, label: 'User Profile', href: '/userprofile' },
      { icon: Video, label: 'Creator Profile', href: '/creatorprofile' },
      { icon: Gift, label: 'Earn Rewards', href: '/referrals' },
      { icon: CreditCard, label: 'Payment Methods', href: '#' },
      { icon: Bell, label: 'Notifications', href: '/notifications?from=more', badge: notifCount },
      { icon: Settings, label: 'Help & Support', href: '#' },
    ];

    return (
      <div className="w-full max-w-md space-y-3">
        {menuItems.map((item, index) => (
          <button
            key={index}
            onClick={() => {
              // Handle staff button
              if (item.isStaff) {
                return setShowStaffLogin(true);
              }
              // Allow Help & Support to be public; protect everything else
              if (item.label === 'Help & Support') {
                return navigate('/support');
              }
              if (item.label !== 'Help & Support' && !auth?.user) return auth.openAuthModal();
              // If the user is signed-in but hasn't completed creator onboarding, gate Creator Profile
              if (item.label === 'Creator Profile' && auth?.user && !auth.user.isCreator) {
                return setShowCreatorGate(true);
              }
              try { if (item.href && item.href !== '#') navigate(item.href); } catch (e) { /* noop */ }
            }}
            className="w-full bg-white p-4 rounded-2xl shadow-sm flex items-center justify-between group active:scale-[0.99] transition-transform border border-gray-100"
          >
            <div className="flex items-center space-x-4">
              <item.icon className="w-6 h-6" style={{ color: 'var(--color-gold)' }} />
              <span className="text-gray-700 font-medium text-base">{getTranslation(item.label, selectedLanguage)}</span>
            </div>
            <div className="flex items-center space-x-3">
              {item.badge && item.badge > 0 && (
                <span className="text-white text-xs font-bold w-6 h-6 flex items-center justify-center rounded-full" style={{ backgroundColor: 'var(--color-gold)' }}>
                  {item.badge}
                </span>
              )}
              <ChevronRight className="w-5 h-5 text-gray-300 group-hover:text-gray-500" />
            </div>
          </button>
        ))}

        {/* Switch Mode */}
        <button
          onClick={() => {
            if (!auth.user) return auth.openAuthModal();
            setIsCreatorMode(!isCreatorMode);
          }}
          className="w-full bg-white p-4 rounded-2xl shadow-sm flex items-center justify-between group active:scale-[0.99] transition-transform border border-gray-100 mt-3"
        >
          <div className="flex items-center space-x-4">
            {isCreatorMode ? (
              <Video className="w-6 h-6 text-green-600" />
            ) : (
              <User className="w-6 h-6" style={{ color: 'var(--color-gold)' }} />
            )}
            <span className="text-gray-700 font-medium text-base">
              {isCreatorMode ? getTranslation('Switch to User Mode', selectedLanguage) : getTranslation('Switch to Creator Mode', selectedLanguage)}
            </span>
          </div>
          <div className="flex items-center space-x-3">
            <span className={`text-xs font-bold px-3 py-1.5 rounded-lg transition-colors ${isCreatorMode
                ? 'bg-green-100 text-green-700'
                : ''
              }`}>
              {isCreatorMode ? getTranslation('Creator', selectedLanguage) : getTranslation('User', selectedLanguage)}
            </span>
            <ChevronRight className="w-5 h-5 text-gray-300 group-hover:text-gray-500" />
          </div>
        </button>

        {/* Log Out */}
        <div className="pt-4">
          <button
            onClick={handleLogout}
            className="w-full bg-white p-4 rounded-2xl shadow-sm flex items-center space-x-4 active:scale-[0.99] transition-transform border border-gray-100"
          >
            <LogOut className="w-6 h-6 text-red-500" />
            <span className="text-red-500 font-medium text-base">{getTranslation('Log Out', selectedLanguage)}</span>
          </button>
        </div>

        {/* Staff Login Modal */}
        <StaffLoginModal
          isOpen={showStaffLogin}
          onClose={() => setShowStaffLogin(false)}
          onLoginSuccess={(employee) => {
            setShowStaffLogin(false);
            navigate('/staff');
          }}
        />

        {/* Creator gating modal */}
        {showCreatorGate && (
          <div className="fixed inset-0 z-50 flex items-center justify-center px-4" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }} onClick={() => setShowCreatorGate(false)}>
            <div className="bg-white rounded-2xl w-full max-w-md p-6" onClick={(e) => e.stopPropagation()}>
              <h3 className="text-lg font-semibold text-gray-900">{getTranslation('Creator Profile', selectedLanguage)}</h3>
              <p className="text-sm text-gray-600 mt-3">{getTranslation('Creator profiles are available to verified creators. Want to become a creator?', selectedLanguage)}</p>
              <div className="mt-6 flex space-x-3">
                <button className="flex-1 py-3 rounded-xl bg-gray-100 font-medium" onClick={() => setShowCreatorGate(false)}>{getTranslation('Maybe later', selectedLanguage)}</button>
                <button className="flex-1 py-3 rounded-xl font-bold text-white" style={{ backgroundColor: 'var(--color-gold)' }} onClick={async () => {
                  setShowCreatorGate(false);
                  // Mark user as creator locally and attempt to persist to backend, then navigate to creator profile
                  try {
                    const token = localStorage.getItem('regaarder_token');
                    const BACKEND = (window && window.__BACKEND_URL__) || 'https://pwin.onrender.com';
                    // Try to persist minimal creator flag server-side
                    try {
                      await fetch(`${BACKEND}/creator/complete`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json', ...(token ? { 'Authorization': `Bearer ${token}` } : {}) },
                        body: JSON.stringify({ isCreator: true })
                      });
                    } catch (e) {
                      // Non-fatal: fall back to local update
                      console.warn('Persisting creator flag failed', e);
                    }

                    const current = auth && auth.user ? auth.user : JSON.parse(localStorage.getItem('regaarder_user') || '{}');
                    const updated = { ...(current || {}), isCreator: true };
                    try { localStorage.setItem('regaarder_user', JSON.stringify(updated)); } catch (e) { }
                    if (auth && auth.login) {
                      const tokenStored = localStorage.getItem('regaarder_token');
                      auth.login({ ...updated, token: tokenStored });
                    }
                  } catch (err) {
                    console.warn('Join Now flow error', err);
                  }
                  try { navigate('/creatorprofile'); } catch (e) { /* noop */ }
                }}>{getTranslation('Join Now', selectedLanguage)}</button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };


  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center">
      <div className="w-full max-w-xl flex flex-col flex-1" style={{ paddingBottom: 'calc(80px + env(safe-area-inset-bottom))' }}>
        <header
          className="bg-white border-b border-gray-100 p-4 sticky top-0 z-20 flex-shrink-0"
          style={{ paddingTop: 'calc(16px + env(safe-area-inset-top, 0px))', marginBottom: '4px' }}
        >
          <div className="flex items-center space-x-4">
            <ChevronLeft
              className="w-6 h-6 text-gray-700 cursor-pointer transition hover:text-gray-900"
              style={{ minWidth: 44, minHeight: 44, padding: 9 }}
              onClick={() => { try { navigate(-1); } catch(e) { navigate('/home'); } }}
            />
            <h1 className="text-2xl font-semibold text-gray-800">{getTranslation('More', selectedLanguage)}</h1>
          </div>
        </header>

        <p className="text-sm text-gray-500 px-4 pt-3 pb-2">
          {getTranslation('Settings and options', selectedLanguage)}
        </p>

        <main className="flex-1 overflow-y-auto flex flex-col items-center p-4">
          {/* Main content area scrolls content on small screens to ensure logout button is visible */}
          <div className="w-full flex flex-col pb-12">
            {auth.user ? <SettingsList /> : <SignInCard />}
          </div>
        </main>
      </div>

      <BottomBar selectedLanguage={selectedLanguage} />
    </div>
  );
};

export default MorePage;
