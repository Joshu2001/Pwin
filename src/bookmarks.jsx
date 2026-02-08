/* eslint-disable no-empty */
import React from 'react';
import { Bookmark, MoreHorizontal, Search, History, Home, FileText, Pencil, ChevronLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { getTranslation } from './translations';

const GOLD_COLOR = '#CB8B04';

const BACKEND_URL = typeof window !== 'undefined'
  ? (window.__BACKEND_URL__ || 'https://pwin.onrender.com')
  : 'https://pwin.onrender.com';

const formatSeconds = (s) => {
  try { const n = Math.max(0, Math.floor(Number(s)||0)); const m = Math.floor(n/60); const sec = String(n%60).padStart(2,'0'); return `${m}:${sec}`; } catch { return '0:00'; }
};

export default function BookmarksPage() {
  const navigate = useNavigate();
  const [query, setQuery] = React.useState('');
  const [segments, setSegments] = React.useState([]);
  const [videos, setVideos] = React.useState([]);
  const [requests, setRequests] = React.useState([]);
  const [videoMeta, setVideoMeta] = React.useState({});
  const [swipeStates, setSwipeStates] = React.useState({}); // track offset per item id
  const [language, setLanguage] = React.useState(localStorage.getItem('regaarder_language') || 'English');

  const t = (key) => getTranslation(key, language);

  React.useEffect(() => {
      const handleLanguageChange = () => {
          setLanguage(localStorage.getItem('regaarder_language') || 'English');
      };
      window.addEventListener('storage', handleLanguageChange);
      const interval = setInterval(() => {
          const currentLang = localStorage.getItem('regaarder_language') || 'English';
          if (currentLang !== language) {
              setLanguage(currentLang);
          }
      }, 1000);
      return () => {
          window.removeEventListener('storage', handleLanguageChange);
          clearInterval(interval);
      };
  }, [language]);

  const fetchAll = React.useCallback(async () => {
    try {
      const token = localStorage.getItem('regaarder_token');
      console.log('Fetching bookmarks with token:', !!token);
      const res = await fetch(`${BACKEND_URL}/bookmarks`, { headers: token ? { Authorization: `Bearer ${token}` } : {} }).then(r=>r.json()).catch(()=>null);
      console.log('Bookmarks response:', res);
      if (res && res.success) {
        console.log('Segments:', res.segments?.length || 0, 'Videos:', res.videos?.length || 0, 'Requests:', res.requests?.length || 0);
        if (res.requests && res.requests.length > 0) {
          console.log('Request bookmarks:', res.requests.map(r => ({ id: r.id, requestId: r.requestId, title: r.title })));
        }
        setSegments(Array.isArray(res.segments) ? res.segments : []);
        setVideos(Array.isArray(res.videos) ? res.videos : []);
        setRequests(Array.isArray(res.requests) ? res.requests : []);
      }
      // Enrich with published videos metadata for thumbnails/titles
      try {
        const pub = await fetch(`${BACKEND_URL}/videos`).then(r=>r.json()).catch(()=>null);
        const list = (pub && pub.success && Array.isArray(pub.videos)) ? pub.videos : [];
        const map = {};
        list.forEach(v => {
          const key = v.videoUrl || v.url;
          if (key) map[String(key)] = { thumbnail: v.imageUrl || v.thumbnail || '', title: v.title || '' };
        });
        setVideoMeta(map);
      } catch {}
    } catch {}
  }, []);

  const deleteVideo = (id) => {
    const item = videos.find(v => v.id === id);
    if (!item) return;
    const token = localStorage.getItem('regaarder_token');
    fetch(`${BACKEND_URL}/bookmarks/videos`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
      body: JSON.stringify({ videoUrl: item.videoUrl })
    }).then(() => { setVideos(prev => prev.filter(v => v.id !== id)); }).catch(() => {});
  };

  const deleteRequest = (id) => {
    const item = requests.find(r => r.id === id);
    if (!item) return;
    const token = localStorage.getItem('regaarder_token');
    fetch(`${BACKEND_URL}/bookmarks/requests`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
      body: JSON.stringify({ requestId: item.requestId })
    }).then(() => { setRequests(prev => prev.filter(r => r.id !== id)); }).catch(() => {});
  };

  React.useEffect(() => { fetchAll(); const id = setInterval(fetchAll, 5000); return () => clearInterval(id); }, [fetchAll]);

  const openVideoAt = (url, t=0, title='') => {
    try { window.location.href = `/videoplayer?src=${encodeURIComponent(url)}&title=${encodeURIComponent(title||'')}&t=${Math.max(0, Math.floor(t||0))}`; } catch {}
  };

  const matchQuery = (text) => {
    const q = query.trim().toLowerCase();
    if (!q) return true;
    return String(text||'').toLowerCase().includes(q);
  };

  return (
    <div className="flex justify-center min-h-screen w-full bg-white relative">
      <div className="w-full flex flex-col bg-white overflow-auto">
        <header
          className="bg-white border-b border-gray-100 p-4 sticky top-0 z-20"
          style={{ paddingTop: 'calc(16px + env(safe-area-inset-top, 0px))' }}
        >
          <div className="flex items-center space-x-4">
            <ChevronLeft className="w-6 h-6 text-gray-700 cursor-pointer transition hover:text-gray-900" onClick={() => navigate(-1)} />
            <h1 className="text-xl font-semibold text-gray-800">{t('Bookmarks')}</h1>
          </div>
        </header>
        <div className="p-4 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center bg-gray-50 border border-gray-200 rounded-md px-2 py-2 w-full max-w-md">
              <Search className="w-4 h-4 text-gray-500" />
              <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder={t('Search')} className="bg-transparent outline-none text-sm ml-2 w-full" />
            </div>
            <p className="text-sm text-gray-500 ml-4 whitespace-nowrap">{segments.length + videos.length + requests.length} {t('items')}</p>
          </div>
        </div>

        <main className="flex-grow flex flex-col items-center justify-start p-6 space-y-8">
          {/* 1. Timestamped segments */}
          <section className="w-full">
            <div className="text-sm font-semibold text-gray-700 mb-2">{t('Timestamped Segments')}</div>
            {segments.length === 0 ? (
              <div className="flex items-center gap-2 text-gray-500"><History className="w-4 h-4" /><span>{t('No timestamped segments yet')}</span></div>
            ) : (
              <div className="space-y-3">
                {segments.filter(s => matchQuery(s.label) || matchQuery(s.videoUrl)).map((s) => (
                  <div key={s.id} className="w-full bg-white rounded-xl shadow-sm border border-gray-100 p-2 flex items-center space-x-3 select-none" onClick={() => openVideoAt(s.videoUrl, s.startTime, s.label || (videoMeta[String(s.videoUrl)]?.title) || '')}>
                    <div className="w-40 h-24 rounded-md bg-black/5" style={{ background: (videoMeta[String(s.videoUrl)]?.thumbnail ? `url(${videoMeta[String(s.videoUrl)].thumbnail}) center/cover no-repeat` : undefined) }} />
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium text-gray-900 line-clamp-2">{s.label || (videoMeta[String(s.videoUrl)]?.title) || s.videoUrl}</div>
                      <div className="text-xs text-gray-500 mt-0.5">Start {formatSeconds(s.startTime)} • End {formatSeconds(s.endTime)}</div>
                      {s.createdAt && <div className="text-xs text-gray-500 mt-0.5">{new Date(s.createdAt).toLocaleString()}</div>}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* 2. Videos to watch (normal bookmarks) */}
          <section className="w-full">
            <div className="text-sm font-semibold text-gray-700 mb-2">{t('Videos to Watch')}</div>
            {videos.length === 0 ? (
              <div className="text-gray-500">{t('No video bookmarks')}</div>
            ) : (
              <div className="space-y-3">
                {videos.filter(v => matchQuery(v.title) || matchQuery(v.videoUrl)).map((v) => (
                  <div 
                    key={v.id} 
                    className="w-full bg-white rounded-xl shadow-sm border border-gray-100 p-2 flex items-center space-x-3 select-none relative overflow-hidden"
                    style={{ transform: `translateX(${swipeStates[v.id] || 0}px)`, transition: (swipeStates[v.id] || 0) === 0 ? 'transform 0.3s ease' : 'none' }}
                    onTouchStart={(e) => { e.stopPropagation(); setSwipeStates(prev => ({ ...prev, [`${v.id}_startX`]: e.touches[0].clientX })); }}
                    onTouchMove={(e) => { e.stopPropagation(); const sx = swipeStates[`${v.id}_startX`] || 0; const dx = e.touches[0].clientX - sx; if (dx < 0) setSwipeStates(prev => ({ ...prev, [v.id]: dx })); }}
                    onTouchEnd={(e) => { e.stopPropagation(); const dx = swipeStates[v.id] || 0; if (dx < -80) { deleteVideo(v.id); } else { setSwipeStates(prev => ({ ...prev, [v.id]: 0 })); } }}
                    onClick={(e) => { if (Math.abs(swipeStates[v.id] || 0) < 5) openVideoAt(v.videoUrl, 0, v.title || (videoMeta[String(v.videoUrl)]?.title) || ''); }}
                  >
                    <div className="w-40 h-24 rounded-md bg-black/5" style={{ background: (videoMeta[String(v.videoUrl)]?.thumbnail ? `url(${videoMeta[String(v.videoUrl)].thumbnail}) center/cover no-repeat` : undefined) }} />
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium text-gray-900 line-clamp-2">{v.title || (videoMeta[String(v.videoUrl)]?.title) || v.videoUrl}</div>
                      {v.createdAt && <div className="text-xs text-gray-500 mt-0.5">{new Date(v.createdAt).toLocaleString()}</div>}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* 3. Request bookmarks */}
          <section className="w-full">
            <div className="text-sm font-semibold text-gray-700 mb-2">{t('Request Bookmarks')}</div>
            {requests.length === 0 ? (
              <div className="text-gray-500">{t('No request bookmarks')}</div>
            ) : (
              <div className="space-y-3">
                {requests.filter(r => matchQuery(r.title) || matchQuery(r.requestId)).map((r) => (
                  <div 
                    key={r.id} 
                    className="w-full bg-white rounded-xl shadow-sm border border-gray-100 p-2 flex items-center space-x-3 select-none relative overflow-hidden"
                    style={{ transform: `translateX(${swipeStates[r.id] || 0}px)`, transition: (swipeStates[r.id] || 0) === 0 ? 'transform 0.3s ease' : 'none' }}
                    onTouchStart={(e) => { e.stopPropagation(); setSwipeStates(prev => ({ ...prev, [`${r.id}_startX`]: e.touches[0].clientX })); }}
                    onTouchMove={(e) => { e.stopPropagation(); const sx = swipeStates[`${r.id}_startX`] || 0; const dx = e.touches[0].clientX - sx; if (dx < 0) setSwipeStates(prev => ({ ...prev, [r.id]: dx })); }}
                    onTouchEnd={(e) => { e.stopPropagation(); const dx = swipeStates[r.id] || 0; if (dx < -80) { deleteRequest(r.id); } else { setSwipeStates(prev => ({ ...prev, [r.id]: 0 })); } }}
                    onClick={() => { if (Math.abs(swipeStates[r.id] || 0) < 5) { try { localStorage.setItem('focus_request_hint', JSON.stringify({ title: r.title || '' })); } catch {} const q = encodeURIComponent(r.title || ''); const id = encodeURIComponent(r.requestId || ''); window.location.href = `/requests.jsx${id ? `?reqId=${id}` : ''}${q ? `${id ? '&' : '?'}q=${q}` : ''}`; } }}
                  >
                    <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center">R</div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium text-gray-900 line-clamp-2">{r.title || r.requestId}</div>
                      {r.createdAt && <div className="text-xs text-gray-500 mt-0.5">{new Date(r.createdAt).toLocaleString()}</div>}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* Tip bar */}
          <div className="w-full px-4 py-3 bg-[#F5F5DC] text-gray-700 rounded-xl flex items-start space-x-2" style={{ borderColor: 'var(--color-gold-light)', borderWidth: '1px', borderStyle: 'solid', boxShadow: '0 6px 16px rgba(203,139,4,0.06)' }}>
            <svg className="w-4 h-4 mt-0.5 flex-shrink-0" style={{ color: 'var(--color-gold)' }} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" /></svg>
            <p className="text-xs leading-relaxed font-medium">
              {t('Swipe left to delete bookmark')}
            </p>
          </div>
        </main>
        <BottomBar />
      </div>
    </div>
  );
}

// === Bottom Navigation Bar (EXACT copy from watchhistory.jsx) ===
const BottomBar = () => {
  const [activeTab, setActiveTab] = React.useState(null);
  const navigatedRef = React.useRef(false);
  const language = localStorage.getItem('regaarder_language') || 'English';
  const t = (key) => getTranslation(key, language);

  const tabs = [
    { name: 'Home', icon: Home },
    { name: 'Requests', icon: FileText },
    { name: 'Ideas', icon: Pencil },
    { name: 'More', icon: MoreHorizontal },
  ];

  const inactiveColor = 'rgb(107 114 128)';

  return (
    <div
      className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-lg z-50"
      style={{
        paddingTop: '10px',
        paddingBottom: 'calc(12px + env(safe-area-inset-bottom, 0px))',
        minHeight: '70px'
      }}
    >
      <div className="w-full flex justify-around items-center px-2">
        {tabs.map((tab) => {
          const isSelected = tab.name === activeTab;

          const activeColorStyle = isSelected
            ? { color: 'var(--color-gold)' }
            : { color: inactiveColor };

          const textWeight = isSelected ? 'font-semibold' : 'font-normal';

          const IconComp = tab.icon;

          const navigateToTab = (tabName) => {
            try {
              if (tabName === 'Home') {
                window.location.href = '/home.jsx';
                return;
              }
              if (tabName === 'Requests') {
                window.location.href = '/requests.jsx';
                return;
              }
              if (tabName === 'Ideas') {
                window.location.href = '/ideas';
                return;
              }
              if (tabName === 'More') {
                window.location.href = '/more.jsx';
                return;
              }
            } catch (e) {
              console.warn('Navigation failed', e);
            }
          };

          return (
            <div
              key={tab.name}
              className="relative flex flex-col items-center justify-center flex-1 focus:outline-none"
            >
              <button
                className="flex flex-col items-center w-full h-full justify-center"
                onMouseDown={() => {
                  setActiveTab(tab.name);
                  if (!navigatedRef.current) { navigatedRef.current = true; navigateToTab(tab.name); }
                }}
                onTouchStart={() => {
                  setActiveTab(tab.name);
                  if (!navigatedRef.current) { navigatedRef.current = true; navigateToTab(tab.name); }
                }}
                onClick={(e) => {
                  if (navigatedRef.current) { navigatedRef.current = false; e.preventDefault(); return; }
                  setActiveTab(tab.name);
                  navigateToTab(tab.name);
                }}
              >
                <div className="w-12 h-12 flex items-center justify-center rounded-xl transition-colors">
                  <IconComp
                    size={24}
                    strokeWidth={isSelected ? 2 : 1.5}
                    style={activeColorStyle}
                  />
                </div>
                <span className={`text-xs leading-tight mt-1 ${textWeight}`} style={activeColorStyle}>
                  {t(tab.name)}
                </span>
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
};
