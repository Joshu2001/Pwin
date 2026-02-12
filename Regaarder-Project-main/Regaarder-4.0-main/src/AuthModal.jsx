import React, { useState } from 'react';
import { getTranslation } from './translations.js';

// Module-scoped FocusInput to avoid remounting on parent re-renders.
const FocusInput = ({ className, style, onFocus, onBlur, ...rest }) => {
  const [focused, setFocused] = useState(false);
  const focusStyle = focused
    ? { borderColor: 'var(--color-gold)', boxShadow: '0 6px 18px rgba(var(--color-gold-rgb, 203,138,0), 0.12)' }
    : {};
  return (
    <input
      {...rest}
      onFocus={(e) => {
        setFocused(true);
        onFocus && onFocus(e);
      }}
      onBlur={(e) => {
        setFocused(false);
        onBlur && onBlur(e);
      }}
      className={`${className || ''} transition-colors`}
      style={{ ...style, ...focusStyle }}
    />
  );
};
import { X, Eye, EyeOff, Lock } from 'lucide-react';

const AuthModal = ({ onClose, onLogin }) => {
  const [showPassword, setShowPassword] = useState(false);
  const [view, setView] = useState('login'); // 'login', 'signup', 'forgotPassword', 'resetCode', 'newPassword'
  const selectedLanguage = (typeof window !== 'undefined') ? window.localStorage.getItem('regaarder_language') || 'English' : 'English';

  // Forgot password state
  const [resetEmail, setResetEmail] = useState('');
  const [resetCode, setResetCode] = useState('');
  const [resetToken, setResetToken] = useState('');
  const [newPasswordValue, setNewPasswordValue] = useState('');
  const [resetLoading, setResetLoading] = useState(false);
  const [resetError, setResetError] = useState('');
  const [resetSuccess, setResetSuccess] = useState('');

  const [rememberMe, setRememberMe] = useState(() => {
    try { return localStorage.getItem('regaarder_remember') === 'true'; } catch { return false; }
  });
  const [email, setEmail] = useState(() => {
    try { return (localStorage.getItem('regaarder_remember') === 'true' && localStorage.getItem('regaarder_saved_email')) || ''; } catch { return ''; }
  });
  const [password, setPassword] = useState(() => {
    try { return (localStorage.getItem('regaarder_remember') === 'true' && localStorage.getItem('regaarder_saved_pass')) || ''; } catch { return ''; }
  });
  const [fullName, setFullName] = useState('');
  const [referralCode, setReferralCode] = useState(() => {
    try { return localStorage.getItem('regaarder_pending_referral') || ''; } catch { return ''; }
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  const validateEmail = (e) => {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(String(e).toLowerCase());
  };

  const validate = () => {
    const out = {};
    if (!validateEmail(email)) out.email = getTranslation('Enter a valid email address', selectedLanguage);
    if ((password || '').length < 8) out.password = getTranslation('Password must be at least 8 characters', selectedLanguage);
    if (view === 'signup' && (!fullName || fullName.trim().length === 0)) out.fullName = getTranslation('Please enter your full name', selectedLanguage);
    setErrors(out);
    return Object.keys(out).length === 0;
  };

  const handleLoginClick = () => {
    if (!validate()) return;
    setErrors((e) => ({ ...e, server: null }));
    setLoading(true);
    const BACKEND = (window && window.__BACKEND_URL__) || 'https://pwin.onrender.com';
    fetch(`${BACKEND}/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    })
      .then(async (res) => {
        const body = await res.json();
        if (!res.ok) throw new Error(body.error || getTranslation('Login failed', selectedLanguage));
        // Persist or clear saved credentials based on Remember Me
        try {
          if (rememberMe) {
            localStorage.setItem('regaarder_remember', 'true');
            localStorage.setItem('regaarder_saved_email', email);
            localStorage.setItem('regaarder_saved_pass', password);
          } else {
            localStorage.removeItem('regaarder_remember');
            localStorage.removeItem('regaarder_saved_email');
            localStorage.removeItem('regaarder_saved_pass');
          }
        } catch {}
        const profile = body.user ? { ...body.user, token: body.token } : { token: body.token };
        onLogin && onLogin(profile);
      })
      .catch((err) => setErrors((e) => ({ ...e, server: err.message })))
      .finally(() => setLoading(false));
  };

  const handleCreateAccount = () => {
    if (!validate()) return;
    setErrors((e) => ({ ...e, server: null }));
    setLoading(true);
    const BACKEND = (window && window.__BACKEND_URL__) || 'https://pwin.onrender.com';
    fetch(`${BACKEND}/signup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password, name: fullName, referralCode }),
    })
      .then(async (res) => {
        const body = await res.json();
        if (!res.ok) throw new Error(body.error || getTranslation('Signup failed', selectedLanguage));
        const profile = body.user ? { ...body.user, token: body.token } : { token: body.token };
        onLogin && onLogin(profile);
      })
      .catch((err) => setErrors((e) => ({ ...e, server: err.message || getTranslation('Network error', selectedLanguage) })))
      .finally(() => setLoading(false));
  };

  const canSubmit = () => {
    if (view === 'signup') return validateEmail(email) && password.length >= 8 && fullName.trim().length > 0;
    return validateEmail(email) && password.length >= 8;
  };

  return (
    <div 
      className="fixed inset-0 z-[999] flex items-center justify-center p-4"
      style={{ backgroundColor: 'rgba(0,0,0,0.6)' }}
      onClick={(e) => {
        // Close modal if clicked on the backdrop (not the modal itself)
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
    >
      <div 
        className="bg-white rounded-2xl w-full max-w-md p-6 relative shadow-2xl animate-in fade-in zoom-in duration-200 max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >

        {view === 'signup' ? (
          <>
            <h2 className="text-xl font-bold text-center text-gray-900 mb-1">{getTranslation('Create Account', selectedLanguage)}</h2>
            <p className="text-sm text-center text-gray-500 mb-6">{getTranslation('Join Regaarder to start requesting amazing videos', selectedLanguage)}</p>

            <div className="space-y-4">
              <div>
                <label className="block text-sm text-gray-500 mb-1.5">{getTranslation('Full Name', selectedLanguage)}</label>
                <FocusInput
                  type="text"
                  placeholder="Alex Morgan"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-gray-300 bg-gray-50 focus:outline-none transition-colors text-gray-700 placeholder-gray-400"
                />
                {errors.fullName && <div className="text-xs text-red-500 mt-1">{errors.fullName}</div>}
              </div>

              <div>
                <label className="block text-sm text-gray-500 mb-1.5">{getTranslation('Referral Code (optional)', selectedLanguage)}</label>
                <FocusInput
                  type="text"
                  placeholder="ABC123"
                  value={referralCode}
                  onChange={(e) => setReferralCode(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-gray-300 bg-gray-50 focus:outline-none transition-colors text-gray-700 placeholder-gray-400"
                />
              </div>

              <div>
                <label className="block text-sm text-gray-500 mb-1.5">{getTranslation('Email Address', selectedLanguage)}</label>
                <FocusInput
                  type="email"
                  placeholder="alex@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-gray-300 bg-gray-50 focus:outline-none transition-colors text-gray-700 placeholder-gray-400"
                />
                {errors.email && <div className="text-xs text-red-500 mt-1">{errors.email}</div>}
              </div>

              <div>
                <label className="block text-sm text-gray-500 mb-1.5">{getTranslation('Password', selectedLanguage)}</label>
                <div className="relative">
                  <FocusInput
                    type={showPassword ? 'text' : 'password'}
                    placeholder="•••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl border border-gray-300 bg-gray-50 focus:outline-none transition-colors text-gray-700 placeholder-gray-400"
                  />
                  <button
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    type="button"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              <button
                onClick={handleCreateAccount}
                disabled={!canSubmit() || loading}
                className={`w-full py-3.5 ${(!canSubmit() || loading) ? 'bg-gray-200 text-gray-400 cursor-not-allowed' : ''} font-medium rounded-xl shadow-sm transition-colors mt-2`}
                style={!canSubmit() || loading ? {} : { backgroundColor: 'var(--color-gold)', color: 'black', boxShadow: '0 6px 18px rgba(var(--color-gold-rgb, 203,138,0), 0.12)' }}
                type="button"
              >
                {loading ? getTranslation('Please wait...', selectedLanguage) : getTranslation('Create Account', selectedLanguage)}
              </button>
              {errors.server && <div className="text-xs text-red-500 mt-2">{errors.server}</div>}

              <p className="text-xs text-gray-500 mt-2 leading-relaxed">
                {getTranslation('By creating an account, you agree to our', selectedLanguage)} <a href="#" style={{ color: 'var(--color-gold)' }} className="hover:underline">{getTranslation('Terms of Service', selectedLanguage)}</a> {getTranslation('and', selectedLanguage)} <a href="#" style={{ color: 'var(--color-gold)' }} className="hover:underline">{getTranslation('Privacy Policy', selectedLanguage)}</a>.
              </p>

              <div className="relative py-2">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-200" />
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-4 bg-white text-gray-400">{getTranslation('or', selectedLanguage)}</span>
                </div>
              </div>

              <div className="text-center text-sm text-gray-500">
                {getTranslation('Already have an account?', selectedLanguage)} <button onClick={() => setView('login')} className="text-gray-700 font-medium hover:underline ml-1" type="button">{getTranslation('Log in', selectedLanguage)}</button>
              </div>
            </div>
          </>
        ) : view === 'forgotPassword' ? (
          <div className="text-center pt-2">
            <div className="flex justify-center mb-4">
              <Lock className="w-8 h-8 text-[var(--color-gold)]" />
            </div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">{getTranslation('Reset Password', selectedLanguage)}</h2>
            <p className="text-sm text-gray-500 mb-6">{getTranslation('Enter your email to receive a verification code', selectedLanguage)}</p>

            <div className="text-left space-y-4">
              <div>
                <label className="block text-sm text-gray-500 mb-1.5">{getTranslation('Email Address', selectedLanguage)}</label>
                <FocusInput
                  type="email"
                  placeholder="alex@example.com"
                  value={resetEmail}
                  onChange={(e) => { setResetEmail(e.target.value); setResetError(''); }}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 focus:outline-none transition-colors text-gray-700 placeholder-gray-400"
                />
              </div>

              {resetError && <div className="text-xs text-red-500">{resetError}</div>}

              <div className="pt-2 space-y-3">
                <button
                  onClick={async () => {
                    if (!resetEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(resetEmail)) {
                      setResetError(getTranslation('Enter a valid email address', selectedLanguage));
                      return;
                    }
                    setResetLoading(true); setResetError('');
                    try {
                      const BACKEND = (window && window.__BACKEND_URL__) || 'https://pwin-copy-production.up.railway.app';
                      const resp = await fetch(`${BACKEND}/forgot-password`, {
                        method: 'POST', headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ email: resetEmail })
                      });
                      const data = await resp.json();
                      if (!resp.ok) throw new Error(data.error || 'Failed');
                      setView('resetCode');
                    } catch (e) { setResetError(e.message || 'Network error'); }
                    finally { setResetLoading(false); }
                  }}
                  disabled={resetLoading}
                  className="w-full py-3.5 text-gray-800 font-medium rounded-xl shadow-sm transition-colors"
                  style={{ backgroundColor: 'rgba(var(--color-gold-rgb,203,138,0),0.18)', border: '1px solid rgba(var(--color-gold-rgb,203,138,0),0.12)' }}
                  type="button"
                >
                  {resetLoading ? getTranslation('Please wait...', selectedLanguage) : getTranslation('Send Code', selectedLanguage)}
                </button>
                <button onClick={() => { setView('login'); setResetError(''); }} className="w-full py-3.5 bg-white border border-gray-200 text-gray-500 font-medium rounded-xl hover:bg-gray-50 transition-colors" type="button">{getTranslation('Cancel', selectedLanguage)}</button>
              </div>
            </div>
          </div>
        ) : view === 'resetCode' ? (
          <div className="text-center pt-2">
            <div className="flex justify-center mb-4">
              <Lock className="w-8 h-8 text-[var(--color-gold)]" />
            </div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">{getTranslation('Enter Verification Code', selectedLanguage)}</h2>
            <p className="text-sm text-gray-500 mb-6">{getTranslation('Enter the 6-digit code sent to your email', selectedLanguage)}</p>

            <div className="text-left space-y-4">
              <div>
                <label className="block text-sm text-gray-500 mb-1.5">{getTranslation('Verification Code', selectedLanguage)}</label>
                <FocusInput
                  type="text"
                  placeholder="000000"
                  maxLength={6}
                  value={resetCode}
                  onChange={(e) => { setResetCode(e.target.value.replace(/\D/g, '').slice(0, 6)); setResetError(''); }}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 text-center text-xl tracking-widest focus:outline-none transition-colors text-gray-700 placeholder-gray-400"
                />
              </div>

              <div className="bg-[var(--color-neutral-light-bg,#FFF9E6)] p-4 rounded-xl border flex items-start space-x-3" style={{ borderColor: 'rgba(var(--color-gold-rgb,203,138,0),0.12)' }}>
                <Lock className="w-4 h-4 text-[var(--color-gold)] flex-shrink-0 mt-1" />
                <div className="text-sm text-gray-600">
                  <p className="mb-1">{getTranslation('A 6-digit code was sent to', selectedLanguage)} <span className="font-medium text-gray-800">{resetEmail}</span></p>
                  <button
                    onClick={async () => {
                      setResetLoading(true); setResetError('');
                      try {
                        const BACKEND = (window && window.__BACKEND_URL__) || 'https://pwin-copy-production.up.railway.app';
                        await fetch(`${BACKEND}/forgot-password`, {
                          method: 'POST', headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({ email: resetEmail })
                        });
                        setResetError(''); setResetSuccess(getTranslation('Code resent!', selectedLanguage));
                        setTimeout(() => setResetSuccess(''), 3000);
                      } catch (e) { setResetError('Failed to resend'); }
                      finally { setResetLoading(false); }
                    }}
                    style={{ color: 'var(--color-gold)' }}
                    className="hover:underline font-medium"
                    type="button"
                    disabled={resetLoading}
                  >
                    {getTranslation("Didn't receive it? Resend code", selectedLanguage)}
                  </button>
                </div>
              </div>

              {resetError && <div className="text-xs text-red-500">{resetError}</div>}
              {resetSuccess && <div className="text-xs text-green-600">{resetSuccess}</div>}

              <div className="pt-2 space-y-3">
                <button
                  onClick={async () => {
                    if (resetCode.length !== 6) { setResetError(getTranslation('Enter the 6-digit code', selectedLanguage)); return; }
                    setResetLoading(true); setResetError('');
                    try {
                      const BACKEND = (window && window.__BACKEND_URL__) || 'https://pwin-copy-production.up.railway.app';
                      const resp = await fetch(`${BACKEND}/verify-reset-code`, {
                        method: 'POST', headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ email: resetEmail, code: resetCode })
                      });
                      const data = await resp.json();
                      if (!resp.ok) throw new Error(data.error || 'Invalid code');
                      setResetToken(data.resetToken);
                      setView('newPassword');
                    } catch (e) { setResetError(e.message || 'Verification failed'); }
                    finally { setResetLoading(false); }
                  }}
                  disabled={resetLoading || resetCode.length !== 6}
                  className={`w-full py-3.5 font-medium rounded-xl shadow-sm transition-colors ${(resetLoading || resetCode.length !== 6) ? 'bg-gray-200 text-gray-400 cursor-not-allowed' : 'text-gray-800'}`}
                  style={(resetLoading || resetCode.length !== 6) ? {} : { backgroundColor: 'rgba(var(--color-gold-rgb,203,138,0),0.18)', border: '1px solid rgba(var(--color-gold-rgb,203,138,0),0.12)' }}
                  type="button"
                >
                  {resetLoading ? getTranslation('Please wait...', selectedLanguage) : getTranslation('Verify Code', selectedLanguage)}
                </button>
                <button onClick={() => { setView('forgotPassword'); setResetCode(''); setResetError(''); }} className="w-full py-3.5 bg-white border border-gray-200 text-gray-500 font-medium rounded-xl hover:bg-gray-50 transition-colors" type="button">{getTranslation('Back', selectedLanguage)}</button>
              </div>
            </div>
          </div>
        ) : view === 'newPassword' ? (
          <div className="text-center pt-2">
            <div className="flex justify-center mb-4">
              <Lock className="w-8 h-8 text-[var(--color-gold)]" />
            </div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">{getTranslation('Set New Password', selectedLanguage)}</h2>
            <p className="text-sm text-gray-500 mb-6">{getTranslation('Choose a strong password for your account', selectedLanguage)}</p>

            <div className="text-left space-y-4">
              <div>
                <label className="block text-sm text-gray-500 mb-1.5">{getTranslation('New Password', selectedLanguage)}</label>
                <div className="relative">
                  <FocusInput
                    type={showPassword ? 'text' : 'password'}
                    placeholder="•••••••"
                    value={newPasswordValue}
                    onChange={(e) => { setNewPasswordValue(e.target.value); setResetError(''); }}
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 focus:outline-none transition-colors text-gray-700 placeholder-gray-400"
                  />
                  <button onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600" type="button">
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
                {newPasswordValue.length > 0 && newPasswordValue.length < 8 && (
                  <div className="text-xs text-amber-500 mt-1">{getTranslation('Password must be at least 8 characters', selectedLanguage)}</div>
                )}
              </div>

              {resetError && <div className="text-xs text-red-500">{resetError}</div>}
              {resetSuccess && <div className="text-xs text-green-600">{resetSuccess}</div>}

              <div className="pt-2 space-y-3">
                <button
                  onClick={async () => {
                    if (newPasswordValue.length < 8) { setResetError(getTranslation('Password must be at least 8 characters', selectedLanguage)); return; }
                    setResetLoading(true); setResetError('');
                    try {
                      const BACKEND = (window && window.__BACKEND_URL__) || 'https://pwin-copy-production.up.railway.app';
                      const resp = await fetch(`${BACKEND}/reset-password`, {
                        method: 'POST', headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ email: resetEmail, resetToken, newPassword: newPasswordValue })
                      });
                      const data = await resp.json();
                      if (!resp.ok) throw new Error(data.error || 'Reset failed');
                      setResetSuccess(getTranslation('Password updated! You can now log in.', selectedLanguage));
                      setTimeout(() => { setView('login'); setResetEmail(''); setResetCode(''); setResetToken(''); setNewPasswordValue(''); setResetError(''); setResetSuccess(''); }, 2000);
                    } catch (e) { setResetError(e.message || 'Reset failed'); }
                    finally { setResetLoading(false); }
                  }}
                  disabled={resetLoading || newPasswordValue.length < 8}
                  className={`w-full py-3.5 font-medium rounded-xl shadow-sm transition-colors ${(resetLoading || newPasswordValue.length < 8) ? 'bg-gray-200 text-gray-400 cursor-not-allowed' : ''}`}
                  style={(resetLoading || newPasswordValue.length < 8) ? {} : { backgroundColor: 'var(--color-gold)', color: 'black', boxShadow: '0 6px 18px rgba(var(--color-gold-rgb, 203,138,0), 0.12)' }}
                  type="button"
                >
                  {resetLoading ? getTranslation('Please wait...', selectedLanguage) : getTranslation('Reset Password', selectedLanguage)}
                </button>
              </div>
            </div>
          </div>
        ) : (
          <>
            <h2 className="text-xl font-semibold text-center text-gray-900 mb-2">{getTranslation('Welcome Back', selectedLanguage)}</h2>
            <p className="text-sm text-center text-gray-500 mb-8 px-2 leading-relaxed">{getTranslation('Log in to access all features and manage your requests', selectedLanguage)}</p>

            <div className="space-y-5">
              <div>
                <label className="block text-sm text-gray-500 mb-1.5">{getTranslation('Email Address', selectedLanguage)}</label>
                <FocusInput
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-gray-300 bg-gray-50 focus:outline-none transition-colors text-gray-700"
                />
                {errors.email && <div className="text-xs text-red-500 mt-1">{errors.email}</div>}
              </div>

              <div>
                <label className="block text-sm text-gray-500 mb-1.5">{getTranslation('Password', selectedLanguage)}</label>
                <div className="relative">
                  <FocusInput
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl border border-gray-300 bg-gray-50 focus:outline-none transition-colors text-gray-700"
                  />
                  <button
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    type="button"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                  {errors.password && <div className="text-xs text-red-500 mt-1">{errors.password}</div>}
                </div>
              </div>

              <div className="flex items-center justify-between text-sm">
                <label className="flex items-center text-gray-500 cursor-pointer select-none">
                  <input type="checkbox" checked={rememberMe} onChange={(e) => setRememberMe(e.target.checked)} className="w-4 h-4 rounded border-gray-300 mr-2" style={{ accentColor: 'var(--color-gold)' }} />
                  {getTranslation('Remember me', selectedLanguage)}
                </label>
                <button onClick={() => setView('forgotPassword')} style={{ color: 'var(--color-gold)' }} className="hover:text-opacity-90 transition-colors" type="button">{getTranslation('Forgot password?', selectedLanguage)}</button>
              </div>

              <button
                onClick={handleLoginClick}
                disabled={!canSubmit() || loading}
                className={`w-full py-3.5 ${(!canSubmit() || loading) ? 'bg-gray-200 text-gray-400 cursor-not-allowed' : ''} font-medium rounded-xl shadow-sm transition-colors`}
                style={!canSubmit() || loading ? {} : { backgroundColor: 'var(--color-gold)', color: 'black', boxShadow: '0 6px 18px rgba(var(--color-gold-rgb, 203,138,0), 0.12)' }}
                type="button"
              >
                {loading ? getTranslation('Please wait...', selectedLanguage) : getTranslation('Log In', selectedLanguage)}
              </button>
              {errors.server && <div className="text-xs text-red-500 mt-2">{errors.server}</div>}

              <div className="relative py-2">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-200" />
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-4 bg-white text-gray-400">{getTranslation('or', selectedLanguage)}</span>
                </div>
              </div>

              <div className="text-center text-sm text-gray-500">
                {getTranslation("Don't have an account?", selectedLanguage)} <button onClick={() => setView('signup')} className="text-gray-700 font-medium hover:underline ml-1" type="button">{getTranslation('Sign up', selectedLanguage)}</button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default AuthModal;
