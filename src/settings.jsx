/* eslint-disable no-empty */
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from './AuthContext.jsx';
import { getTranslation } from './translations.js';
import { ChevronLeft, Download, Trash, Lock, Mail, X, Eye, EyeOff } from 'lucide-react';
import { clearWatchHistory } from './watchhistory.jsx';

const timeAgo = (iso, lang = 'English') => {
  if (!iso) return getTranslation('Unknown', lang);
  try {
    const t = new Date(iso).getTime();
    const now = Date.now();
    const diff = Math.max(0, now - t);
    const mins = Math.floor(diff / 60000);
    const hours = Math.floor(mins / 60);
    const days = Math.floor(hours / 24);
    const months = Math.floor(days / 30);
    if (months > 0) return `${months} month${months > 1 ? 's' : ''} ago`;
    if (days > 0) return `${days} day${days > 1 ? 's' : ''} ago`;
    if (hours > 0) return `${hours} hour${hours > 1 ? 's' : ''} ago`;
    return `${mins} minute${mins !== 1 ? 's' : ''} ago`;
  } catch { return getTranslation('Unknown', lang); }
};

const Settings = () => {
  const auth = useAuth();
  const navigate = useNavigate();
  const [selectedLanguage] = useState(() => {
    try { return localStorage.getItem('regaarder_language') || 'English'; } catch (e) { return 'English'; }
  });
  const BACKEND = (window && window.__BACKEND_URL__) || 'https://pwin.onrender.com';

  const user = (() => { try { return auth.user || JSON.parse(localStorage.getItem('regaarder_user') || '{}'); } catch { return {}; } })();
  const token = (() => { try { return localStorage.getItem('regaarder_token'); } catch { return null; } })();

  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [showDeleteDataModal, setShowDeleteDataModal] = useState(false);
  const [deleteBusy, setDeleteBusy] = useState(false);
  const [deleteError, setDeleteError] = useState('');
  const [deleteSuccess, setDeleteSuccess] = useState(false);
  const [deleteConfirmPassword, setDeleteConfirmPassword] = useState('');
  const [showDeleteConfirmPassword, setShowDeleteConfirmPassword] = useState(false);

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [newEmail, setNewEmail] = useState(user.email || '');
  const [emailPassword, setEmailPassword] = useState('');

  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [showEmailPassword, setShowEmailPassword] = useState(false);

  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');


  const handleExport = async () => {
    try {
      const userStr = localStorage.getItem('regaarder_user');
      const data = userStr ? JSON.parse(userStr) : {};
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'regaarder-export.json';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      setTimeout(() => { try { URL.revokeObjectURL(url); } catch (e) { } }, 150);
    } catch (e) { }
  };

  // open the delete-data confirmation modal
  const handleDeleteData = () => {
    setDeleteError('');
    setDeleteSuccess(false);
    setShowDeleteDataModal(true);
  };

  // keys we will explicitly clear on the client when deleting data
  const CLIENT_KEYS_TO_CLEAR = [
    'watchHistory', // cleared via helper
    'miniPlayerData',
    'requested_badge_seen',
    'requests_swipe_entrance_shown',
    'pinned_requests_v1',
    'publishedItems',
    'videoplayer_index',
    'videoplayer_source',
    'handleHintShownQuickOptions',
    'watchIncognito',
    'hasSeenRequests',
    'fab_dismissed',
    'welcome_selected_role',
    'requests_search_query',
    'regaarder_push_enabled',
    'regaarder_push_token',
    'regaarder_push_history',
  ];

  const confirmDeleteData = async () => {
    setDeleteError('');
    setDeleteBusy(true);
    try {
      // server-side cleanup (if API available)
      if (token) {
        const res = await fetch(`${BACKEND}/me/data`, {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
          body: JSON.stringify({ currentPassword: deleteConfirmPassword })
        });
        if (!res.ok) {
          const json = await res.json().catch(() => ({}));
          // surface backend validation errors (e.g. wrong password)
          throw new Error(json.error || 'Failed to delete data on server');
        }
      }

      // clear well-known client-side keys (keep account token/user/language)
      try {
        // clear watch history through its helper
        try { clearWatchHistory(); } catch (e) { }

        CLIENT_KEYS_TO_CLEAR.forEach((k) => {
          try { localStorage.removeItem(k); } catch (e) { }
        });
      } catch (e) { }

      setDeleteSuccess(true);
      setShowDeleteDataModal(false);
    } catch (e) {
      setDeleteError(e.message || 'Error');
    } finally { setDeleteBusy(false); }
  };

  const handleDelete = async () => {
    const ok = window.confirm(getTranslation('Permanently delete your account?', selectedLanguage));
    if (!ok) return;
    try {
      localStorage.removeItem('regaarder_user');
      localStorage.removeItem('regaarder_token');
      if (auth && auth.logout) auth.logout();
      navigate('/home');
    } catch (e) { }
  };

  const submitPassword = async () => {
    setError('');
    if (!currentPassword || !newPassword || newPassword !== confirmPassword) {
      setError('Please fill all fields correctly');
      return;
    }
    setBusy(true);
    try {
      const res = await fetch(`${BACKEND}/me/password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
        body: JSON.stringify({ currentPassword, newPassword })
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Failed');
      try { localStorage.setItem('regaarder_user', JSON.stringify(json.user)); } catch { }
      if (auth && auth.login) auth.login({ ...json.user, token });
      setShowPasswordModal(false);
      setCurrentPassword(''); setNewPassword(''); setConfirmPassword('');
    } catch (e) { setError(e.message || 'Error'); } finally { setBusy(false); }
  };

  const submitEmail = async () => {
    setError('');
    if (!newEmail || !emailPassword) { setError('Please fill all fields'); return; }
    setBusy(true);
    try {
      const res = await fetch(`${BACKEND}/me/email`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
        body: JSON.stringify({ newEmail, currentPassword: emailPassword })
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Failed');
      try { localStorage.setItem('regaarder_user', JSON.stringify(json.user)); } catch { }
      if (auth && auth.login) auth.login({ ...json.user, token });
      setShowEmailModal(false);
      setEmailPassword('');
    } catch (e) { setError(e.message || 'Error'); } finally { setBusy(false); }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center">
      <div className="w-full max-w-xl min-h-screen flex flex-col" style={{ paddingBottom: 'calc(80px + env(safe-area-inset-bottom))' }}>
        <header
          className="bg-white border-b border-gray-100 p-4 sticky top-0 z-20"
          style={{ paddingTop: 'calc(16px + env(safe-area-inset-top, 0px))' }}
        >
          <div className="flex items-center space-x-4">
            <ChevronLeft className="w-6 h-6 cursor-pointer transition active:scale-90" style={{ color: 'var(--color-gold)' }} onClick={() => {
              const redirectTo = localStorage.getItem('redirectBackTo');
              localStorage.removeItem('redirectBackTo');
              navigate(redirectTo === 'creatorDashboard' ? '/creatordashboard' : '/home');
            }} />
            <h1 className="text-xl font-semibold text-gray-800">{getTranslation('Settings', selectedLanguage)}</h1>
          </div>
        </header>

        <main className="flex-grow p-4">
          <div className="text-gray-900 text-lg font-semibold mb-3">{getTranslation('Data & Account', selectedLanguage)}</div>

          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden w-full max-w-md mx-auto mb-6">
            <button
              className="w-full flex items-center justify-between px-4 py-4 hover:bg-gray-50 transition-colors"
              onClick={handleExport}
            >
              <div className="flex items-center space-x-3">
                <Download className="w-6 h-6" style={{ color: 'var(--color-gold)' }} />
                <div className="text-left">
                  <div className="text-base font-medium text-gray-800">{getTranslation('Export Your Data', selectedLanguage)}</div>
                  <div className="text-sm text-gray-500">{getTranslation('Download all your information', selectedLanguage)}</div>
                </div>
              </div>
            </button>
            <div className="h-px bg-gray-200 mx-4" />
            <button
              className="w-full flex items-center justify-between px-4 py-4 hover:bg-gray-50 transition-colors"
              onClick={handleDeleteData}
            >
              <div className="flex items-center space-x-3">
                <Trash className="w-6 h-6" style={{ color: 'var(--color-gold)' }} />
                <div className="text-left">
                  <div className="text-base font-medium" style={{ color: 'var(--color-gold)' }}>{getTranslation('Delete Your Data', selectedLanguage)}</div>
                  <div className="text-sm text-gray-500">{getTranslation('Delete all your data but keep your account', selectedLanguage)}</div>
                </div>
              </div>
            </button>
            <div className="h-px bg-gray-200 mx-4" />
            <button
              className="w-full flex items-center justify-between px-4 py-4 hover:bg-gray-50 transition-colors"
              onClick={handleDelete}
            >
              <div className="flex items-center space-x-3">
                <Trash className="w-6 h-6" style={{ color: 'var(--color-gold)' }} />
                <div className="text-left">
                  <div className="text-base font-medium" style={{ color: 'var(--color-gold)' }}>{getTranslation('Delete Account', selectedLanguage)}</div>
                  <div className="text-sm" style={{ color: 'var(--color-gold)' }}>{getTranslation('Permanently delete your account', selectedLanguage)}</div>
                </div>
              </div>
            </button>
          </div>

          {/* Password card */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden w-full max-w-md mx-auto mb-4">
            <div className="w-full flex items-center justify-between px-4 py-4">
              <div className="flex items-center space-x-3">
                <Lock className="w-6 h-6" style={{ color: 'var(--color-gold)' }} />
                <div className="text-left">
                  <div className="text-base font-medium text-gray-800">{getTranslation('Password', selectedLanguage)}</div>
                  <div className="text-sm text-gray-500">{getTranslation('Last changed', selectedLanguage)} {timeAgo(user.passwordChangedAt, selectedLanguage)}</div>
                </div>
              </div>
              <button className="px-3 py-1.5 rounded-lg bg-gray-100 text-gray-800 text-sm font-semibold" onClick={() => { setError(''); setShowPasswordModal(true); }}>
                {getTranslation('Change', selectedLanguage)}
              </button>
            </div>
          </div>

          {/* Email card */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden w-full max-w-md mx-auto">
            <div className="w-full flex items-center justify-between px-4 py-4">
              <div className="flex items-center space-x-3">
                <Mail className="w-6 h-6" style={{ color: 'var(--color-gold)' }} />
                <div className="text-left">
                  <div className="text-base font-medium text-gray-800">{getTranslation('Email', selectedLanguage)}</div>
                  <div className="text-sm text-gray-500">{user.email || '—'}</div>
                </div>
              </div>
              <button className="px-3 py-1.5 rounded-lg bg-gray-100 text-gray-800 text-sm font-semibold" onClick={() => { setError(''); setShowEmailModal(true); }}>
                {getTranslation('Change', selectedLanguage)}
              </button>
            </div>
          </div>

          {/* Error banner */}
          {error && (
            <div className="max-w-md mx-auto mt-3 bg-red-50 text-red-700 text-sm rounded-lg px-4 py-2">{error}</div>
          )}
          {deleteSuccess && (
            <div className="max-w-md mx-auto mt-3 bg-green-50 text-green-700 text-sm rounded-lg px-4 py-2">{getTranslation('Your data has been deleted', selectedLanguage)}</div>
          )}
        </main>
      </div>

      {/* Password modal */}
      {showPasswordModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4" style={{ backgroundColor: 'rgba(0,0,0,0.6)' }} onClick={() => setShowPasswordModal(false)}>
          <div className="bg-white rounded-2xl w-full max-w-md p-6" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-2"><Lock className="w-5 h-5" style={{ color: 'var(--color-gold)' }} /><div className="text-lg font-semibold">{getTranslation('Change Password', selectedLanguage)}</div></div>
              <button onClick={() => setShowPasswordModal(false)} className="p-2 text-gray-500"><X className="w-4 h-4" /></button>
            </div>
            <div className="space-y-3">
              <div className="relative">
                <input
                  type={showCurrentPassword ? 'text' : 'password'}
                  placeholder={getTranslation('Current password', selectedLanguage)}
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  className="w-full pr-10 p-3 bg-gray-100 rounded-lg"
                />
                <button type="button" onClick={() => setShowCurrentPassword(s => !s)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 p-1">
                  {showCurrentPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>

              <div className="relative">
                <input
                  type={showNewPassword ? 'text' : 'password'}
                  placeholder={getTranslation('New password', selectedLanguage)}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full pr-10 p-3 bg-gray-100 rounded-lg"
                />
                <button type="button" onClick={() => setShowNewPassword(s => !s)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 p-1">
                  {showNewPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>

              <div className="relative">
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  placeholder={getTranslation('Confirm new password', selectedLanguage)}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full pr-10 p-3 bg-gray-100 rounded-lg"
                />
                <button type="button" onClick={() => setShowConfirmPassword(s => !s)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 p-1">
                  {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>
            <button disabled={busy} onClick={submitPassword} className={`mt-4 w-full py-3 rounded-lg text-black font-semibold ${busy ? 'opacity-60' : ''}`} style={{ backgroundColor: 'var(--color-gold)' }}>{busy ? getTranslation('Saving...', selectedLanguage) : getTranslation('Save', selectedLanguage)}</button>
          </div>
        </div>
      )}

      {/* Email modal */}
      {showEmailModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4" style={{ backgroundColor: 'rgba(0,0,0,0.6)' }} onClick={() => setShowEmailModal(false)}>
          <div className="bg-white rounded-2xl w-full max-w-md p-6" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-2"><Mail className="w-5 h-5" style={{ color: 'var(--color-gold)' }} /><div className="text-lg font-semibold">{getTranslation('Change Email', selectedLanguage)}</div></div>
              <button onClick={() => setShowEmailModal(false)} className="p-2 text-gray-500"><X className="w-4 h-4" /></button>
            </div>
            <div className="space-y-3">
              <input type="email" placeholder={getTranslation('New email', selectedLanguage)} value={newEmail} onChange={(e) => setNewEmail(e.target.value)} className="w-full p-3 bg-gray-100 rounded-lg" />

              <div className="relative">
                <input
                  type={showEmailPassword ? 'text' : 'password'}
                  placeholder={getTranslation('Current password', selectedLanguage)}
                  value={emailPassword}
                  onChange={(e) => setEmailPassword(e.target.value)}
                  className="w-full pr-10 p-3 bg-gray-100 rounded-lg"
                />
                <button type="button" onClick={() => setShowEmailPassword(s => !s)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 p-1">
                  {showEmailPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>
            <button disabled={busy} onClick={submitEmail} className={`mt-4 w-full py-3 rounded-lg text-black font-semibold ${busy ? 'opacity-60' : ''}`} style={{ backgroundColor: 'var(--color-gold)' }}>{busy ? getTranslation('Saving...', selectedLanguage) : getTranslation('Save', selectedLanguage)}</button>
          </div>
        </div>
      )}
      {/* Delete Data confirmation modal */}
      {showDeleteDataModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4" style={{ backgroundColor: 'rgba(0,0,0,0.6)' }} onClick={() => setShowDeleteDataModal(false)}>
          <div className="bg-white rounded-2xl w-full max-w-md p-6" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <div className="text-lg font-semibold">{getTranslation('Delete Your Data', selectedLanguage)}</div>
              <button onClick={() => setShowDeleteDataModal(false)} className="p-2 text-gray-500"><X className="w-4 h-4" /></button>
            </div>
            <div className="text-sm text-gray-700 mb-4">{getTranslation('Delete all your data but keep your account', selectedLanguage)}</div>
            <div className="mb-3 text-sm text-gray-600">{getTranslation('Please re-enter your password to confirm deleting your data', selectedLanguage)}</div>
            <div className="mb-3">
              <div className="relative">
                <input
                  type={showDeleteConfirmPassword ? 'text' : 'password'}
                  placeholder={getTranslation('Current password', selectedLanguage)}
                  value={deleteConfirmPassword}
                  onChange={(e) => setDeleteConfirmPassword(e.target.value)}
                  className="w-full pr-10 p-3 bg-gray-100 rounded-lg"
                />
                <button type="button" onClick={() => setShowDeleteConfirmPassword(s => !s)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 p-1">
                  {showDeleteConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>
            {deleteError && <div className="text-sm text-red-600 mb-3">{deleteError}</div>}
            <div className="flex space-x-3">
              <button onClick={() => { setShowDeleteDataModal(false); setDeleteConfirmPassword(''); }} className="flex-1 py-2 rounded-lg border border-gray-200">{getTranslation('Cancel', selectedLanguage)}</button>
              <button disabled={deleteBusy || !deleteConfirmPassword} onClick={confirmDeleteData} className={`flex-1 py-2 rounded-lg text-white ${deleteBusy || !deleteConfirmPassword ? 'opacity-60' : ''}`} style={{ backgroundColor: 'var(--color-gold)' }}>
                {deleteBusy ? getTranslation('Deleting...', selectedLanguage) : getTranslation('Delete My Data', selectedLanguage)}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Settings;
