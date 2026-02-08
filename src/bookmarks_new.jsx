/* eslint-disable no-empty */
import React from 'react';
import { Bookmark, MoreHorizontal, Search, History, Home, FileText, Pencil } from 'lucide-react';
import SharedBottomBar from './components/SharedBottomBar.jsx';

const GOLD_COLOR = '#CB8B04';

const BACKEND_URL = typeof window !== 'undefined'
  ? (window.__BACKEND_URL__ || 'https://pwin.onrender.com')
  : 'https://pwin.onrender.com';

const formatSeconds = (s) => {
  try { const n = Math.max(0, Math.floor(Number(s)||0)); const m = Math.floor(n/60); const sec = String(n%60).padStart(2,'0'); return `${m}:${sec}`; } catch { return '0:00'; }
};

export default function BookmarksPage() {
  const [query, setQuery] = React.useState('');
  const [segments, setSegments] = React.useState([]);
  const [videos, setVideos] = React.useState([]);
  const [requests, setRequests] = React.useState([]);
  const [videoMeta, setVideoMeta] = React.useState({});
  const [swipeStates, setSwipeStates] = React.useState({});

  const fetchAll = React.useCallback(async () => {
    try {
      const token = localStorage.getItem('regaarder_token');
      const res = await fetch(`${BACKEND_URL}/bookmarks`, { headers: token ? { Authorization: `Bearer ${token}` } : {} }).then(r=>r.json()).catch(()=>null);
      if (res && res.success) {
        setSegments(Array.isArray(res.segments) ? res.segments : []);
        setVideos(Array.isArray(res.videos) ? res.videos : []);
        setRequests(Array.isArray(res.requests) ? res.requests : []);
      }
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
    fetch(`${BACKEND_URL}/bookmark`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
      body: JSON.stringify({ requestId: item.requestId, action: 'remove' })
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
      <div className="w-full flex flex-col bg-white overflow-hidden">
        <header
          className="p-4 border-b border-gray-100 space-y-3"
          style={{ paddingTop: 'calc(16px + env(safe-area-inset-top, 0px))' }}
        >
          <div className="flex items-center justify-between">
            <h1 className="text-xl font-semibold text-gray-900 flex items-center gap-2"><Bookmark className="w-5 h-5 text-gray-500" strokeWidth={1.5} /><span>Bookmarks</span></h1>
            <button className="p-2 text-gray-600 hover:text-gray-900" aria-label="More"><MoreHorizontal className="w-5 h-5" /></button>
          </div>
          <div className="flex items-center justify-between">
            <div className="flex items-center bg-gray-50 border border-gray-200 rounded-md px-2 py-2 w-full max-w-md">
              <Search className="w-4 h-4 text-gray-500" />
              <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search" className="bg-transparent outline-none text-sm ml-2 w-full" />
            </div>
            <p className="text-sm text-gray-500 ml-4 whitespace-nowrap">{segments.length + videos.length + requests.length} items</p>
          </div>
        </header>

        <main className="flex-grow flex flex-col items-center justify-start p-6 space-y-8">
          <section className="w-full">
            <div className="text-sm font-semibold text-gray-700 mb-2">Timestamped Segments</div>
            {segments.length === 0 ? (
              <div className="flex items-center gap-2 text-gray-500"><History className="w-4 h-4" /><span>No timestamped segments yet</span></div>
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

          <section className="w-full">
            <div className="text-sm font-semibold text-gray-700 mb-2">Videos to Watch</div>
            {videos.length === 0 ? (
              <div className="text-gray-500">No video bookmarks</div>
            ) : (
              <div className="space-y-3">
                {videos.filter(v => matchQuery(v.title) || matchQuery(v.videoUrl)).map((v) => (
                  <div 
                    key={v.id} 
                    className="w-full bg-white rounded-xl shadow-sm border border-gray-100 p-2 flex items-center space-x-3 select-none relative overflow-hidden"
                    style={{ transform: `translateX(${swipeStates[v.id] || 0}px)`, transition: (swipeStates[v.id] || 0) === 0 ? 'transform 0.3s ease' : 'none' }}
                    onTouchStart={(e) => { setSwipeStates(prev => ({ ...prev, [`${v.id}_startX`]: e.touches[0].clientX })); }}
                    onTouchMove={(e) => { const sx = swipeStates[`${v.id}_startX`] || 0; const dx = e.touches[0].clientX - sx; if (dx < 0) setSwipeStates(prev => ({ ...prev, [v.id]: dx })); }}
                    onTouchEnd={(e) => { const dx = swipeStates[v.id] || 0; if (dx < -80) { deleteVideo(v.id); } setSwipeStates(prev => ({ ...prev, [v.id]: 0 })); }}
                    onClick={() => openVideoAt(v.videoUrl, 0, v.title || (videoMeta[String(v.videoUrl)]?.title) || '')}
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

          <section className="w-full">
            <div className="text-sm font-semibold text-gray-700 mb-2">Request Bookmarks</div>
            {requests.length === 0 ? (
              <div className="text-gray-500">No request bookmarks</div>
            ) : (
              <div className="space-y-3">
                {requests.filter(r => matchQuery(r.title) || matchQuery(r.requestId)).map((r) => (
                  <div 
                    key={r.id} 
                    className="w-full bg-white rounded-xl shadow-sm border border-gray-100 p-2 flex items-center space-x-3 select-none relative overflow-hidden"
                    style={{ transform: `translateX(${swipeStates[r.id] || 0}px)`, transition: (swipeStates[r.id] || 0) === 0 ? 'transform 0.3s ease' : 'none' }}
                    onTouchStart={(e) => { setSwipeStates(prev => ({ ...prev, [`${r.id}_startX`]: e.touches[0].clientX })); }}
                    onTouchMove={(e) => { const sx = swipeStates[`${r.id}_startX`] || 0; const dx = e.touches[0].clientX - sx; if (dx < 0) setSwipeStates(prev => ({ ...prev, [r.id]: dx })); }}
                    onTouchEnd={(e) => { const dx = swipeStates[r.id] || 0; if (dx < -80) { deleteRequest(r.id); } setSwipeStates(prev => ({ ...prev, [r.id]: 0 })); }}
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

          <div className="w-full px-4 py-3 bg-[#F5F5DC] text-gray-700 rounded-xl flex items-start space-x-2" style={{ borderColor: 'var(--color-gold-light)', borderWidth: '1px', borderStyle: 'solid', boxShadow: '0 6px 16px rgba(203,139,4,0.06)' }}>
            <svg className="w-4 h-4 mt-0.5 flex-shrink-0" style={{ color: 'var(--color-gold)' }} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" /></svg>
            <p className="text-xs leading-relaxed font-medium">
              Swipe left to delete bookmark
            </p>
          </div>
        </main>
        <SharedBottomBar selectedLanguage={(typeof window !== 'undefined') ? (localStorage.getItem('regaarder_language') || 'English') : 'English'} />
      </div>
    </div>
  );
}
};
