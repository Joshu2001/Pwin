import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Home, FileText, Pencil, MoreHorizontal, Lightbulb, ChevronLeft } from 'lucide-react';
import { useAppNavigate } from './navigation.js';
import { useNavigate } from 'react-router-dom';
import { getTranslation } from './translations.js';
import { WEB_URL } from './config.js';
import SharedBottomBar from './components/SharedBottomBar.jsx';

const selectedLanguage = typeof window !== 'undefined' ? (localStorage.getItem('regaarder_language') || 'English') : 'English';
const t = (key) => getTranslation(key, selectedLanguage);

// Local storage key for liked videos
const STORAGE_KEY = 'likedVideos';

const BACKEND_URL = typeof window !== 'undefined'
  ? (window.__BACKEND_URL__ || 'https://pwin.onrender.com')
  : 'https://pwin.onrender.com';

// Record a like or unlike event from the video player
export async function recordLike(event) {
  try {
    if (!event || !event.videoId) return;
    const raw = localStorage.getItem(STORAGE_KEY);
    const arr = raw ? JSON.parse(raw) : [];
    const idx = arr.findIndex((x) => x.videoId === event.videoId);
    if (event.liked) {
      const entry = {
        videoId: event.videoId,
        url: event.url || null,
        title: event.title || null,
        creatorName: event.creatorName || null,
        imageUrl: event.imageUrl || null,
        likedAt: event.timestamp || new Date().toISOString()
      };
      if (idx >= 0) arr[idx] = entry; else arr.unshift(entry);
    } else {
      if (idx >= 0) arr.splice(idx, 1);
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(arr.slice(0, 500))); // keep last 500
    // notify listeners for real-time updates
    try { window.dispatchEvent(new CustomEvent('likes:updated', { detail: { count: arr.length } })); } catch { }

    // Persist to backend
    try {
      const token = localStorage.getItem('regaarder_token');
      if (token) {
        await fetch(`${BACKEND_URL}/likes`, {
          method: event.liked ? 'POST' : 'DELETE',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
          body: JSON.stringify({ videoId: event.videoId })
        });
      }
    } catch (e) { console.warn('Failed to sync like to backend', e); }
  } catch { }
}

export function clearLikedVideos() {
  try { localStorage.removeItem(STORAGE_KEY); } catch { }
  try { window.dispatchEvent(new CustomEvent('likes:updated', { detail: { count: 0 } })); } catch { }
}

function loadLikedVideos() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const arr = raw ? JSON.parse(raw) : [];
    // sort newest first
    return arr.sort((a, b) => String(b.likedAt).localeCompare(String(a.likedAt)));
  } catch {
    return [];
  }
}

function formatDate(iso) {
  const d = new Date(iso);
  return d.toLocaleString();
}

export default function LikedVideos() {
  const navigate = useNavigate();
  const appNavigate = useAppNavigate();
  const [items, setItems] = useState(() => loadLikedVideos());
  const [videoIndex, setVideoIndex] = useState({});
  const [query, setQuery] = useState('');
  const [dark, setDark] = useState(() => {
    try { return localStorage.getItem('darkMode') === 'true'; } catch { return false; }
  });
  const listRef = useRef(null);
  const dragRef = useRef({});
  const [swipeTranslate, setSwipeTranslate] = useState({});
  const setTranslate = (id, val) => setSwipeTranslate((prev) => ({ ...prev, [id]: val }));

  const removeLiked = (videoId) => {
    try { recordLike({ videoId, liked: false }); } catch { }
    setItems(loadLikedVideos());
    setSwipeTranslate((prev) => { const n = { ...prev }; delete n[videoId]; return n; });
    try { window.dispatchEvent(new CustomEvent('likes:updated', { detail: { count: loadLikedVideos().length } })); } catch { }
  };

  useEffect(() => {
    const onUpdate = () => setItems(loadLikedVideos());
    window.addEventListener('likes:updated', onUpdate);
    const t = setInterval(onUpdate, 5000);
    return () => { window.removeEventListener('likes:updated', onUpdate); clearInterval(t); };
  }, []);

  // Fetch published videos so we can show thumbnails for liked entries in real-time
  useEffect(() => {
    let mounted = true;
    const fetchIndex = async () => {
      try {
        const res = await fetch(`${BACKEND_URL}/videos`).catch(() => null);
        const json = res && res.ok ? await res.json() : null;
        const vids = (json && json.videos) || [];
        const idx = {};
        const byTitle = {};
        vids.forEach(v => {
          if (!v) return;
          if (v.id) idx[v.id] = v;
          if (v.videoUrl) idx[v.videoUrl] = v;
          if (v.url) idx[v.url] = v;
          const t = (v.title || '').toLowerCase().trim();
          if (t) byTitle[t] = v;
        });
        if (mounted) setVideoIndex({ byKey: idx, byTitle });
      } catch (e) {
        // ignore fetch errors, keep placeholder thumbnails
      }
    };
    fetchIndex();
    const iv = setInterval(fetchIndex, 10000); // refresh every 10s
    return () => { mounted = false; clearInterval(iv); };
  }, []);

  const filtered = useMemo(() => {
    const q = (query || '').trim().toLowerCase();
    if (!q) return items;
    return items.filter((x) =>
      (x.title || '').toLowerCase().includes(q) ||
      (x.creatorName || '').toLowerCase().includes(q) ||
      (x.url || '').toLowerCase().includes(q)
    );
  }, [items, query]);

  const onOpen = (it) => {
    const url = it.url || it.videoId;
    const title = it.title || '';
    try {
      const payload = { url, title, creatorName: it.creatorName };
      localStorage.setItem('miniPlayerData', JSON.stringify(payload));
    } catch { }
    try {
      const href = `/videoplayer?src=${encodeURIComponent(url || '')}&title=${encodeURIComponent(title || '')}`;
      window.location.href = href;
    } catch {
      navigate('/videoplayer');
    }
  };

  return (
    <div style={{ minHeight: '100vh', background: dark ? '#0e0e0e' : '#f9fafb' }}>
      <div className="max-w-4xl mx-auto">
        {/* Header with back button */}
        <div className="bg-white border-b" style={{ borderColor: dark ? '#1a1a1a' : '#e5e7eb' }}>
          <div
            className="px-4 py-4 sticky top-0 z-20 flex items-center space-x-4"
            style={{ paddingTop: 'calc(16px + env(safe-area-inset-top, 0px))' }}
          >
            <ChevronLeft
              className="w-6 h-6 cursor-pointer transition hover:opacity-75"
              style={{ color: dark ? '#fff' : '#374151' }}
              onClick={() => {
                try { if (typeof window !== 'undefined' && typeof window.setFooterTab === 'function') window.setFooterTab('home'); } catch (e) { }
                try { navigate('/home', { replace: true }); } catch (e) { }
              }}
            />
            <h1 className="text-xl font-semibold" style={{ color: dark ? '#fff' : '#111' }}>{t('Liked Videos')}</h1>
          </div>
        </div>

        {/* Clear All Button and Search */}
        <div className="px-4 py-4" style={{ borderBottom: `1px solid ${dark ? '#1a1a1a' : '#e5e7eb'}` }}>
          {items.length > 0 && (
            <div className="mb-4">
              <button
                onClick={() => { clearLikedVideos(); setItems([]); }}
                className="text-sm font-medium hover:opacity-80 transition duration-150"
                style={{ color: '#FFFFFF', backgroundColor: 'var(--color-gold)', padding: '6px 12px', borderRadius: '6px' }}
              >
                {t('Clear All')}
              </button>
            </div>
          )}

          <div className="flex gap-3 items-center">
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={t('Search liked videos')}
              className="flex-1 px-3 py-2 rounded-md"
              style={{ background: dark ? '#0b0b0b' : '#fff', color: dark ? '#fff' : '#111', border: '1px solid ' + (dark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)') }}
            />
            <span className="text-sm" style={{ color: dark ? '#9ca3af' : '#6b7280' }}>{filtered.length} {filtered.length === 1 ? t('video') : t('videos')}</span>
          </div>
        </div>

        {items.length > 0 && (
          <div className="mt-3 rounded-lg p-3 flex items-center gap-2 mx-4" style={{ background: dark ? 'rgba(250,204,21,0.08)' : '#FEF9C3', border: '1px solid ' + (dark ? 'rgba(250,204,21,0.25)' : '#FDE68A') }}>
            <Lightbulb className="w-4 h-4" style={{ color: '#ca8a04' }} />
            <div className="text-xs" style={{ color: dark ? '#fcd34d' : '#92400E' }}>{t('Swipe left to remove from Liked Videos')}</div>
          </div>
        )}

        <div className="px-4 py-6">
        <div className="mt-5 w-full space-y-4">
          {filtered.length === 0 && (
            <div className="text-sm" style={{ color: dark ? '#9ca3af' : '#6b7280' }}>{t('No likes yet. Tap the heart in the player to add videos here.')}</div>
          )}

          {filtered.map((it) => {
            const title = it.title || (it.url || it.videoId);
            const creator = it.creatorName || '';
            // Prefer lookup by id, then by stored url; fallback to placeholder
            // support multiple index shapes (previous code stored flat map)
            const byKey = videoIndex && videoIndex.byKey ? videoIndex.byKey : videoIndex;
            const byTitle = videoIndex && videoIndex.byTitle ? videoIndex.byTitle : {};
            const match = (it.videoId && byKey[it.videoId]) || (it.url && byKey[it.url]) || (title && byTitle[title.toLowerCase()]);
            const thumb = (it.imageUrl) || (match && (match.imageUrl || match.thumbnail || match.image)) || 'https://placehold.co/160x90/efefef/777?text=Video';
            return (
              <div
                key={it.videoId}
                className="w-full bg-white rounded-xl shadow-sm border border-gray-100 p-2 flex items-center space-x-3 select-none"
                onClick={(e) => {
                  const d = dragRef.current[it.videoId];
                  if (d && d.moved) return; // suppress open when swiping
                  onOpen(it);
                }}
                onPointerDown={(e) => {
                  const x = e.clientX ?? (e.touches && e.touches[0]?.clientX);
                  dragRef.current[it.videoId] = { dragging: true, startX: x, moved: false };
                }}
                onPointerMove={(e) => {
                  const st = dragRef.current[it.videoId];
                  if (!st || !st.dragging) return;
                  const x = e.clientX ?? (e.touches && e.touches[0]?.clientX);
                  if (typeof x !== 'number') return;
                  const dx = x - st.startX;
                  if (Math.abs(dx) > 3) st.moved = true;
                  const clamp = Math.min(0, dx); // only allow left swipe
                  setTranslate(it.videoId, Math.max(-240, clamp));
                }}
                onPointerUp={(e) => {
                  const st = dragRef.current[it.videoId];
                  if (!st) return;
                  const tx = swipeTranslate[it.videoId] || 0;
                  dragRef.current[it.videoId] = { dragging: false, startX: 0, moved: false };
                  if (tx <= -80) {
                    // animate out then remove
                    setTranslate(it.videoId, -320);
                    setTimeout(() => removeLiked(it.videoId), 120);
                  } else {
                    // snap back
                    setTranslate(it.videoId, 0);
                  }
                }}
                style={{
                  transform: `translateX(${(swipeTranslate[it.videoId] || 0)}px)`,
                  transition: (dragRef.current[it.videoId]?.dragging ? 'none' : 'transform 220ms ease'),
                  opacity: (swipeTranslate[it.videoId] || 0) < 0 ? 0.98 : 1,
                  touchAction: 'pan-y'
                }}
              >
                <img src={thumb} alt={title} className="w-40 h-24 object-cover rounded-md" onError={(e) => { e.currentTarget.src = 'https://placehold.co/160x90/efefef/777?text=Video'; }} />
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-gray-900 line-clamp-2">{title}</div>
                  {creator && <div className="text-xs text-gray-500 mt-0.5">@{creator}</div>}
                  <div className="text-xs text-gray-500 mt-0.5">{t('Liked')} • {formatDate(it.likedAt)}</div>
                </div>
                <button className="p-2 text-gray-600 hover:text-gray-900" aria-label="Share" onClick={(e) => {
                  e.stopPropagation();
                  const id = it.id || it.videoId;
                  const url = it.url || it.videoId;
                  const link = id ? `${WEB_URL}/share/video/${encodeURIComponent(id)}` : (url ? `${WEB_URL}/videoplayer?src=${encodeURIComponent(url)}&title=${encodeURIComponent(title || '')}` : window.location.href);
                  const sharePayload = { title, text: title, url: link };
                  if (navigator.share) { navigator.share(sharePayload).catch(() => { }); }
                  else { try { navigator.clipboard && navigator.clipboard.writeText(link); alert(t('Share link copied')); } catch { } }
                }}>
                  <MoreHorizontal className="w-5 h-5" />
                </button>
              </div>
            );
          })}
        </div>
        </div>
      </div>
      <SharedBottomBar selectedLanguage={selectedLanguage} />
      <style>{`
        @keyframes toastSlideDown {
          from { opacity: 0; transform: translateY(-20px) scale(0.95); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
      `}</style>
    </div>
  );
}

// BottomBar: removed - now using SharedBottomBar
