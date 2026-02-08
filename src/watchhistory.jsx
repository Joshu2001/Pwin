/* eslint-disable no-empty */
import React from 'react';
import { History, Lightbulb, Home, FileText, MoreHorizontal, Pencil, CheckCircle, Search, ChevronLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { getTranslation } from './translations.js';
import { WEB_URL } from './config.js';
import SharedBottomBar from './components/SharedBottomBar.jsx';

// Get selected language
const selectedLanguage = typeof window !== 'undefined' ? (localStorage.getItem('regaarder_language') || 'English') : 'English';
const t = (key) => getTranslation(key, selectedLanguage);

// --- Watch History storage API ---
// This module exposes `recordWatchProgress`, `getWatchHistory`, and `clearWatchHistory`.
// Data is persisted to localStorage under `watchHistory` where available, with an
// in-memory fallback.

const STORAGE_KEY = 'watchHistory';
let _IN_MEMORY_HISTORY = null;

const loadHistory = () => {
  try {
    if (typeof window === 'undefined' || !window.localStorage) {
      return _IN_MEMORY_HISTORY || [];
    }
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    return JSON.parse(raw);
  } catch (e) {
    try { return _IN_MEMORY_HISTORY || []; } catch (e2) { return []; }
  }
};

const saveHistory = (list) => {
  try {
    if (typeof window === 'undefined' || !window.localStorage) {
      _IN_MEMORY_HISTORY = list;
      try { window && window.dispatchEvent && window.dispatchEvent(new CustomEvent('watchhistory:updated')); } catch { }
      return;
    }
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
    try { window && window.dispatchEvent && window.dispatchEvent(new CustomEvent('watchhistory:updated')); } catch { }
  } catch (e) {
    _IN_MEMORY_HISTORY = list;
    try { window && window.dispatchEvent && window.dispatchEvent(new CustomEvent('watchhistory:updated')); } catch { }
  }
};

/**
 * recordWatchProgress
 * @param {Object} payload
 * @param {string|number} payload.videoId
 * @param {string|number|null} payload.userId
 * @param {number} payload.lastWatchedTime - seconds into the video
 * @param {number} payload.duration - video duration in seconds
 * @param {string|Date} [payload.timestamp] - ISO string or Date
 * @param {boolean} [payload.isComplete]
 */
export function recordWatchProgress(payload = {}) {
  try {
    const { videoId, userId = null, lastWatchedTime = 0, duration = 0, isComplete = false } = payload;
    const timestamp = payload.timestamp ? (typeof payload.timestamp === 'string' ? payload.timestamp : new Date(payload.timestamp).toISOString()) : new Date().toISOString();
    if (!videoId) return false;

    const list = loadHistory();

    // Upsert locally by videoId (keep the latest timestamp)
    const idx = list.findIndex((i) => String(i.videoId) === String(videoId));
    const entry = {
      videoId,
      userId,
      lastWatchedTime: Number(lastWatchedTime) || 0,
      duration: Number(duration) || 0,
      timestamp,
      isComplete: Boolean(isComplete)
    };

    if (idx >= 0) { list[idx] = { ...list[idx], ...entry }; } else { list.unshift(entry); }
    if (list.length > 200) list.splice(200);
    saveHistory(list);

    // Also persist to backend when available
    try {
      const BACKEND = (window && window.__BACKEND_URL__) || 'https://pwin.onrender.com';
      const token = localStorage.getItem('regaarder_token');
      fetch(`${BACKEND}/watch/history`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
        body: JSON.stringify(entry)
      }).then(() => { try { window.dispatchEvent(new CustomEvent('watchhistory:updated')); } catch { } }).catch(() => { });
      // Also persist minimal playback position for cross-device resume
      try {
        const pb = { videoId: entry.videoId, currentTime: Math.floor(entry.lastWatchedTime || 0), anonId: localStorage.getItem('playback_anon') };
        fetch(`${BACKEND}/api/playback`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
          body: JSON.stringify(pb)
        }).catch(() => { });
      } catch { }
    } catch { }

    return true;
  } catch (e) {
    console.warn('recordWatchProgress failed', e);
    return false;
  }
}

export function getWatchHistory() {
  try {
    const BACKEND = (window && window.__BACKEND_URL__) || 'https://pwin.onrender.com';
    const token = localStorage.getItem('regaarder_token');
    // Fetch remote history (token optional)
    const res = window.fetch ? null : null;
    // Use synchronous fallback when fetch not available
    if (!window.fetch) return loadHistory();
    // Return local immediately; kick off remote refresh in background
    window.fetch(`${BACKEND}/watch/history`, { headers: token ? { Authorization: `Bearer ${token}` } : {} })
      .then(r => r.json())
      .then(j => { if (j && Array.isArray(j.history)) saveHistory(j.history); })
      .catch(() => { });
    return loadHistory();
  } catch { return loadHistory(); }
}

export function clearWatchHistory() {
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      window.localStorage.removeItem(STORAGE_KEY);
    }
    _IN_MEMORY_HISTORY = null;
    try {
      const BACKEND = (window && window.__BACKEND_URL__) || 'https://pwin.onrender.com';
      const token = localStorage.getItem('regaarder_token');
      window.fetch && window.fetch(`${BACKEND}/watch/history`, { method: 'DELETE', headers: token ? { Authorization: `Bearer ${token}` } : {} }).catch(() => { });
    } catch { }
  } catch (e) {
    _IN_MEMORY_HISTORY = null;
  }
}


// Main App Component
const App = () => {
  const navigate = useNavigate();
  // State for active navigation tab (initial state is 'Requests' from the last image)
  const [activeTab, setActiveTab] = React.useState('Requests');
  // State for controlling the visibility of the Toast notification
  const [showToast, setShowToast] = React.useState(false);

  // Gold color hex for branding
  const GOLD_COLOR = '#CB8B04';

  // Live watch history (updates when player saves progress)
  const [history, setHistory] = React.useState(() => getWatchHistory());
  React.useEffect(() => {
    const onUpdate = () => { try { setHistory(getWatchHistory()); } catch { } };
    try { window.addEventListener('watchhistory:updated', onUpdate); } catch { }
    const id = setInterval(onUpdate, 5000);
    return () => { try { window.removeEventListener('watchhistory:updated', onUpdate); } catch { } clearInterval(id); };
  }, []);

  // Enriched metadata from backend videos for thumbnails, titles, creator, requester, stats
  const [videoMetaIndex, setVideoMetaIndex] = React.useState({});
  const [query, setQuery] = React.useState('');
  React.useEffect(() => {
    (async () => {
      try {
        const BACKEND = (window && window.__BACKEND_URL__) || 'https://pwin.onrender.com';
        const resp = await fetch(`${BACKEND}/videos`).then(r => r.json()).catch(() => null);
        const arr = resp && resp.success && Array.isArray(resp.videos) ? resp.videos : [];
        const idx = {};
        arr.forEach(v => {
          if (v.id) idx[`id:${String(v.id)}`] = v;
          if (v.videoUrl) idx[`url:${String(v.videoUrl)}`] = v;
          if (v.url) idx[`url:${String(v.url)}`] = v;
          if (v.src) idx[`url:${String(v.src)}`] = v;
          if (v.title) idx[`title:${String(v.title)}`] = v; // fallback
        });
        setVideoMetaIndex(idx);
      } catch { }
    })();
  }, [history.length]);

  const getMetaFor = (item) => {
    try {
      return videoMetaIndex[`id:${String(item.videoId)}`]
        || videoMetaIndex[`url:${String(item.videoId)}`]
        || null;
    } catch { return null; }
  };

  const prominentStat = (m) => {
    try {
      const v = Number(m.views || 0);
      const c = Number(m.comments || 0);
      const s = Number(m.shares || 0);
      const max = Math.max(v, c, s);
      if (max === v && v > 0) return `${v} ${t('views')}`;
      if (max === c && c > 0) return `${c} ${t('comments')}`;
      if (max === s && s > 0) return `${s} ${t('shares')}`;
      return null;
    } catch { return null; }
  };

  const makeShareLink = (videoOrUrl, time = 0) => {
    try {
      const t = Math.max(0, Math.floor(time || 0));
      let id = null;
      let url = null;
      if (videoOrUrl && typeof videoOrUrl === 'object') {
        id = videoOrUrl.id || videoOrUrl.videoId || null;
        url = videoOrUrl.url || videoOrUrl.videoUrl || videoOrUrl.src || null;
      } else {
        url = videoOrUrl || null;
      }
      if (id) {
        return `${WEB_URL}/share/video/${encodeURIComponent(id)}${t ? `?t=${encodeURIComponent(t)}` : ''}`;
      }
      if (url) {
        return `${WEB_URL}/videoplayer?src=${encodeURIComponent(url)}${t ? `&t=${encodeURIComponent(t)}` : ''}`;
      }
      return WEB_URL;
    } catch { return WEB_URL; }
  };

  const shareEntry = async (h) => {
    try {
      const m = getMetaFor(h) || {};
      const urlResolved = await resolveUrl(h.videoId) || h.videoId;
      const link = urlResolved ? makeShareLink({ id: m.id, url: urlResolved }, h.lastWatchedTime) : window.location.href;
      const title = m.title || 'Watch this video';
      const text = `${title}${m.author ? ` • by ${m.author}` : ''}`;
      if (navigator.share) {
        await navigator.share({ title, text, url: link });
      } else {
        await (navigator.clipboard && navigator.clipboard.writeText(link));
        alert('Share link copied');
      }
    } catch (e) { console.warn('share failed', e); }
  };

  // Function to handle navigation clicks and state updates
  const handleNavClick = (label) => {
    setActiveTab(label);

    if (label === 'Home') {
      console.log(`Simulating navigation/redirect to the file: Regaarder.js`);
    }
  };

  // Format seconds to m:ss
  const formatSeconds = (s) => {
    try {
      const n = Math.max(0, Math.floor(Number(s) || 0));
      const m = Math.floor(n / 60);
      const sec = String(n % 60).padStart(2, '0');
      return `${m}:${sec}`;
    } catch { return '0:00'; }
  };

  // Resolve a playable URL for a given history entry id
  const resolveUrl = async (videoId) => {
    try {
      if (typeof videoId === 'string' && /^(https?:)?\/\//.test(videoId)) return videoId;
      const mod = await import('./home.jsx');
      const getVideoById = mod.getVideoById;
      const VIDEOS = mod.VIDEOS || mod.default?.VIDEOS || mod.homeVideos || mod.discoverItems || null;
      let info = null;
      if (typeof getVideoById === 'function') info = getVideoById(videoId);
      if (!info && Array.isArray(VIDEOS)) info = VIDEOS.find(v => String(v.id) === String(videoId));
      const url = info?.url || info?.videoUrl || info?.src || null;
      return url || null;
    } catch (e) { return null; }
  };

  // Delete a single history entry
  const deleteEntry = (videoId) => {
    try {
      const list = (history || []).filter(i => String(i.videoId) !== String(videoId));
      setHistory(list);
      saveHistory(list);
      // backend delete
      try {
        const BACKEND = (window && window.__BACKEND_URL__) || 'https://pwin.onrender.com';
        const token = localStorage.getItem('regaarder_token');
        window.fetch && window.fetch(`${BACKEND}/watch/history/${encodeURIComponent(videoId)}`, { method: 'DELETE', headers: token ? { Authorization: `Bearer ${token}` } : {} }).catch(() => { });
      } catch { }
    } catch { }
  };

  // "Clear All" (persist + toast)
  const handleClearAll = () => {
    try { clearWatchHistory(); } catch { }
    setHistory([]);
    setShowToast(true);
    setTimeout(() => { setShowToast(false); }, 3000);
  };

  return (
    // Outer container now uses min-h-screen and w-full for fullscreen behavior
    <div className="flex justify-center min-h-screen w-full bg-white relative">
      <div className="w-full flex flex-col bg-white overflow-x-hidden">

        {/* === 1. Header === */}
        <header
          className="bg-white border-b border-gray-100 p-4 sticky top-0 z-20"
          style={{ paddingTop: 'calc(16px + env(safe-area-inset-top, 0px))' }}
        >
          <div className="flex items-center space-x-4">
            <ChevronLeft
              className="w-6 h-6 text-gray-700 cursor-pointer transition hover:text-gray-900"
              onClick={() => {
                try { if (typeof window !== 'undefined' && typeof window.setFooterTab === 'function') window.setFooterTab('home'); } catch (e) { }
                try { navigate('/home', { replace: true }); } catch (e) { }
              }}
            />
            <h1 className="text-xl font-semibold text-gray-800">{t('Watch History')}</h1>
          </div>
        </header>

        {/* Clear All Button and Search Section */}
        <div className="p-4 space-y-3 border-b border-gray-100">
          <button onClick={handleClearAll} className={`text-sm font-medium hover:opacity-80 transition duration-150`} style={{ color: '#FFFFFF', backgroundColor: 'var(--color-gold)', padding: '6px 12px', borderRadius: '6px' }}>{t('Clear All')}</button>
          <div className="flex items-center justify-between">
            <div className="flex items-center bg-gray-50 border border-gray-200 rounded-md px-2 py-2 w-full max-w-md">
              <Search className="w-4 h-4 text-gray-500" />
              <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder={t('Search')} className="bg-transparent outline-none text-sm ml-2 w-full" />
            </div>
            <p className="text-sm text-gray-500 ml-4 whitespace-nowrap">{(history || []).length} {t('videos')}</p>
          </div>
        </div>

        {/* === 2. Scrollable Content Area === */}
        <main className="flex-grow flex flex-col items-center justify-start p-6 space-y-6" style={{ paddingBottom: 'calc(60px + env(safe-area-inset-bottom))' }}>

          {/* Content: show list when available, else empty state */}
          {(history && history.length > 0) ? (
            <div className="w-full space-y-4">
              {Object.entries(history.reduce((acc, item) => {
                const d = new Date(item.timestamp);
                const dayKey = d.toLocaleDateString('en-US', { weekday: 'long' });
                const day = t(dayKey);
                const key = `${dayKey}-${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`;
                (acc[key] = acc[key] || { label: day, date: d, items: [] }).items.push(item);
                return acc;
              }, {})).sort((a, b) => b[1].date - a[1].date).map(([key, group]) => (
                <div key={key} className="w-full">
                  <div className="text-sm font-semibold text-gray-700 mb-2">{group.label}</div>
                  {group.items
                    .filter(i => { const m = getMetaFor(i) || {}; const tVal = (m.title || String(i.videoId)); const creator = m.author || ''; const requester = m.requester || ''; const q = query.trim().toLowerCase(); return !q || tVal.toLowerCase().includes(q) || creator.toLowerCase().includes(q) || requester.toLowerCase().includes(q); })
                    .map((h) => {
                      const m = getMetaFor(h) || {};
                      const thumb = m.imageUrl || 'https://placehold.co/160x90/efefef/777?text=Video';
                      const title = m.title || String(h.videoId);
                      const creator = m.author || '';
                      const requester = m.requester || '';
                      const stat = prominentStat(m);
                      return (
                        <div key={`${h.videoId}-${h.timestamp}`} className="w-full bg-white rounded-xl shadow-sm border border-gray-100 p-2 flex items-center space-x-3 select-none"
                          onClick={async () => { try { const url = await resolveUrl(h.videoId) || h.videoId; if (url) window.location.href = `/videoplayer?video=${encodeURIComponent(url)}&t=${Math.floor(h.lastWatchedTime || 0)}`; } catch { } }}
                          onTouchStart={(e) => { e.currentTarget.dataset.startX = e.touches[0].clientX; }}
                          onTouchMove={(e) => { const sx = parseFloat(e.currentTarget.dataset.startX || '0'); const dx = e.touches[0].clientX - sx; e.currentTarget.style.transform = `translateX(${dx}px)`; }}
                          onTouchEnd={(e) => { const sx = parseFloat(e.currentTarget.dataset.startX || '0'); const dx = e.changedTouches[0].clientX - sx; e.currentTarget.style.transform = ''; if (dx < -80) deleteEntry(h.videoId); e.currentTarget.dataset.startX = '0'; }}
                        >
                          <img src={thumb} alt={title} className="w-40 h-24 object-cover rounded-md" onError={(e) => { e.currentTarget.src = 'https://placehold.co/160x90/efefef/777?text=Video'; }} />
                          <div className="flex-1 min-w-0">
                            <div className="text-sm font-medium text-gray-900 line-clamp-2">{title}</div>
                            <div className="text-xs text-gray-500 mt-0.5">{creator}{creator && requester ? ' • ' : ''}{requester}</div>
                            <div className="text-xs text-gray-500 mt-0.5">{t('Left at')} {formatSeconds(h.lastWatchedTime)} • {new Date(h.timestamp).toLocaleString()}</div>
                            {stat && <div className="text-xs text-gray-600 mt-0.5">{stat}</div>}
                          </div>
                          <button className="p-2 text-gray-600 hover:text-gray-900" aria-label="Share" onClick={(e) => { e.stopPropagation(); shareEntry(h); }}><MoreHorizontal className="w-5 h-5" /></button>
                        </div>
                      );
                    })}
                </div>
              ))}
            </div>
          ) : (
            <div className="flex-grow flex flex-col items-center justify-center text-center space-y-4 pt-8">
              <History className="w-16 h-16 text-gray-400" strokeWidth={1} />
              <h2 className="text-lg font-semibold text-gray-700">{t('No watch history')}</h2>
              <p className="text-sm text-gray-500 max-w-xs">{t('Videos you watch will appear here')}</p>
            </div>
          )}

          {/* Tip/Instruction - Moved below empty state */}
          <div className="w-full px-4 py-3 bg-[#F5F5DC] text-gray-700 rounded-xl flex items-start space-x-2" style={{ borderColor: 'var(--color-gold-light)', borderStyle: 'solid', boxShadow: '0 6px 16px rgba(var(--color-gold-rgb,203,138,0),0.06)' }}>
            <Lightbulb className="w-4 h-4 mt-0.5 text-[var(--color-gold)] flex-shrink-0" />
            <p className="text-xs leading-relaxed font-medium">
              {t('Swipe right to request similar video • Swipe left to delete')}
            </p>
          </div>
        </main>

        {/* === 3. Bottom Navigation Bar === */}
        <SharedBottomBar selectedLanguage={selectedLanguage} />

        {/* === 4. Toast Notification (Overlay) === */}
        {showToast && (
          <div
            className="fixed left-0 right-0 flex justify-center z-50"
            style={{ top: 'calc(12px + env(safe-area-inset-top, 0px))' }}
            onTouchStart={(e) => {
              e.currentTarget.dataset.dragStartX = e.touches[0].clientX;
            }}
            onTouchMove={(e) => {
              const startX = parseFloat(e.currentTarget.dataset.dragStartX || '0');
              const diff = e.touches[0].clientX - startX;
              const toast = e.currentTarget.querySelector('div');
              if (toast) toast.style.transform = `translateX(${diff}px)`;
            }}
            onTouchEnd={(e) => {
              const startX = parseFloat(e.currentTarget.dataset.dragStartX || '0');
              const endX = e.changedTouches[0].clientX;
              const diff = endX - startX;
              const toast = e.currentTarget.querySelector('div');
              if (Math.abs(diff) > 80) {
                setShowToast(false);
              } else if (toast) {
                toast.style.transform = 'translateX(0)';
              }
              e.currentTarget.dataset.dragStartX = '0';
            }}
          >
            <div
              className="bg-white p-3 mx-4 rounded-xl shadow-2xl flex items-center space-x-3 transition-all duration-300 max-w-sm w-full cursor-grab select-none"
              style={{
                borderLeft: '4px solid #4CAF50',
                animation: 'toastSlideDown 0.4s cubic-bezier(0.16, 1, 0.3, 1)',
              }}
            >
              <CheckCircle className="w-6 h-6 text-[#4CAF50] fill-[#4CAF50]/10" strokeWidth={2} />

              <span className="text-base font-medium text-gray-800">
                {t('Watch history cleared')}
              </span>
            </div>
          </div>
        )}

      </div>

      {/* Define Tailwind custom animation for the toast */}
      <style>{`
        @keyframes toastSlideDown {
          from {
            opacity: 0;
            transform: translateY(-20px) scale(0.95);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }
      `}</style>
    </div>
  );
};

// Helper Component for Navigation Items
const NavItem = ({ icon: Icon, label, active, onClick, activeColor }) => {
  // Gold color class for active state
  const activeColorClass = `text-[${activeColor}]`;
  const inactiveColorClass = 'text-gray-500';

  // Choose color based on active state
  const iconColor = active ? activeColorClass : inactiveColorClass;
  const labelColor = active
    ? `${activeColorClass} font-medium`
    : `${inactiveColorClass} font-normal`;
  const iconStroke = active ? '2' : '1.5';

  // Home navigation link
  const href = label === 'Home' ? 'Regaarder.js' : '#';

  return (
    <a
      href={href}
      onClick={(e) => {
        e.preventDefault();
        onClick(label);
      }}
      className="flex flex-col items-center p-2 space-y-1 transition duration-150 cursor-pointer"
    >
      <Icon
        className={`w-6 h-6 ${iconColor}`}
        strokeWidth={iconStroke}
      // Ensure no fill is applied when active
      />
      <span className={`text-xs ${labelColor}`} style={{ color: active ? activeColor : undefined }}>
        {label}
      </span>
    </a>
  );
};

export default App;
