/* eslint-disable no-empty */
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { ListPlus, Lightbulb, MoreHorizontal, Home, FileText, Pencil, Bookmark, ChevronLeft } from 'lucide-react';
import { useAppNavigate } from './navigation.js';
import { useNavigate } from 'react-router-dom';
import { getTranslation } from './translations.js';
import { WEB_URL } from './config.js';
import SharedBottomBar from './components/SharedBottomBar.jsx';

// Storage helpers
const STORAGE_KEY = 'playlists_v1';

function load() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const j = raw ? JSON.parse(raw) : { lists: [] };
    if (Array.isArray(j)) return { lists: j }; // legacy
    return { lists: Array.isArray(j.lists) ? j.lists : [] };
  } catch { return { lists: [] }; }
}
function save(data) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify({ lists: data.lists || [] })); } catch {}
  try { window.dispatchEvent(new CustomEvent('playlists:updated')); } catch {}
}

export function getPlaylists() { return load().lists; }
export function setPlaylists(lists) { save({ lists }); }
export function ensurePlaylist(name) {
  const d = load();
  const trimmed = String(name || 'Playlist').trim() || 'Playlist';
  let p = d.lists.find(x => x.name.toLowerCase() === trimmed.toLowerCase());
  if (!p) { p = { id: `pl_${Date.now()}`, name: trimmed, items: [], createdAt: new Date().toISOString() }; d.lists.unshift(p); save(d); }
  return p;
}
export function createPlaylist(name) { return ensurePlaylist(name); }
export function renamePlaylist(id, name) {
  const d = load();
  const idx = d.lists.findIndex(x => x.id === id);
  if (idx >= 0) { d.lists[idx] = { ...d.lists[idx], name: String(name||'').trim() || d.lists[idx].name }; save(d); }
}
export function deletePlaylist(id) {
  const d = load();
  d.lists = d.lists.filter(x => x.id !== id);
  save(d);
}
export function addToPlaylist(playlistId, video) {
  if (!playlistId || !video) return;
  const d = load();
  const p = d.lists.find(x => x.id === playlistId);
  if (!p) return;
  const item = {
    id: String(video.id || video.videoId || video.url || video.src || Date.now()),
    url: video.url || video.src || video.videoUrl || null,
    title: video.title || '',
    thumbnail: video.imageUrl || video.thumbnail || '',
    author: video.author || '',
    requester: video.requester || '',
    addedAt: new Date().toISOString()
  };
  const exists = p.items.some(i => String(i.id) === String(item.id));
  if (!exists) p.items.unshift(item);
  save(d);
}
export function removeFromPlaylist(playlistId, itemId) {
  const d = load();
  const p = d.lists.find(x => x.id === playlistId);
  if (!p) return;
  p.items = (p.items || []).filter(i => String(i.id) !== String(itemId));
  save(d);
}

// Page component (Watch History-style)
export default function PlaylistPage() {
  const navigate = useNavigate();
  const appNavigate = useAppNavigate();
  const selectedLanguage = (typeof window !== 'undefined') ? window.localStorage.getItem('regaarder_language') || 'English' : 'English';
  const t = (key) => getTranslation(key, selectedLanguage);

  const [lists, setLists] = useState(getPlaylists());
  const [currentId, setCurrentId] = useState(() => (lists[0]?.id || null));
  const [query, setQuery] = useState('');

  useEffect(() => {
    const onUpdate = () => setLists(getPlaylists());
    window.addEventListener('playlists:updated', onUpdate);
    const iv = setInterval(onUpdate, 8000);
    return () => { window.removeEventListener('playlists:updated', onUpdate); clearInterval(iv); };
  }, []);

  const current = useMemo(() => lists.find(l => l.id === currentId) || lists[0] || null, [lists, currentId]);

  const [showCreate, setShowCreate] = useState(false);
  const [newName, setNewName] = useState('');
  const [nameErr, setNameErr] = useState('');
  const [editingId, setEditingId] = useState(null);
  const [editingName, setEditingName] = useState('');
  const longPressTimers = useRef({});
  const create = () => { setNewName(''); setNameErr(''); setShowCreate(true); };
  const confirmCreate = () => {
    const n = (newName || '').trim();
    if (!n) { setNameErr(t('Please enter a name')); return; }
    const exists = lists.some(l => l.name.toLowerCase() === n.toLowerCase());
    if (exists) { setNameErr(t('A playlist with this name already exists')); return; }
    const p = createPlaylist(n);
    const all = getPlaylists();
    setLists(all);
    setCurrentId(p.id);
    setShowCreate(false);
  };
  const cancelCreate = () => { setShowCreate(false); };
  const rename = () => {
    if (!current) return;
    const name = prompt(t('Rename playlist'), current.name);
    if (!name) return;
    renamePlaylist(current.id, name);
    setLists(getPlaylists());
  };
  const del = () => {
    if (!current) return;
    if (!confirm(t('Delete this playlist?'))) return;
    deletePlaylist(current.id);
    const all = getPlaylists();
    setLists(all);
    setCurrentId(all[0]?.id || null);
  };

  const filtered = (current?.items || []).filter(i => {
    const q = query.trim().toLowerCase();
    if (!q) return true;
    return (i.title||'').toLowerCase().includes(q) || (i.author||'').toLowerCase().includes(q) || (i.requester||'').toLowerCase().includes(q);
  });

  const openItem = (it) => {
    const url = it.url || it.id;
    if (!url) return;
    const params = new URLSearchParams({ src: url, title: it.title||'' });
    window.location.href = `/videoplayer?${params.toString()}`;
  };

  return (
    <div className="flex justify-center min-h-screen w-full bg-white relative">
      <div className="w-full flex flex-col bg-white overflow-hidden">
        <header
          className="bg-white border-b border-gray-100 p-4 sticky top-0 z-20"
          style={{ paddingTop: 'calc(16px + env(safe-area-inset-top, 0px))' }}
        >
          <div className="flex items-center space-x-4 justify-between">
            <div className="flex items-center space-x-4">
              <ChevronLeft
                className="w-6 h-6 text-gray-700 cursor-pointer transition hover:text-gray-900"
                onClick={() => {
                  try { if (typeof window !== 'undefined' && typeof window.setFooterTab === 'function') window.setFooterTab('home'); } catch (e) { }
                  try { navigate('/home', { replace: true }); } catch (e) { }
                }}
              />
              <h1 className="text-xl font-semibold text-gray-800">{t('Playlist')}</h1>
            </div>
            <button onClick={create} className="text-sm font-medium hover:opacity-80 transition" style={{ color: '#FFFFFF', backgroundColor: 'var(--color-gold)', padding: '6px 12px', borderRadius: '6px' }}>{t('New')}</button>
          </div>
        </header>
        <div className="p-4 space-y-3 border-b border-gray-100">
          <div className="flex items-center justify-between">
            <div className="flex items-center bg-gray-50 border border-gray-200 rounded-md px-2 py-2 w-full max-w-md">
              <svg className="w-4 h-4 text-gray-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>
              <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder={t('Search')} className="bg-transparent outline-none text-sm ml-2 w-full" />
            </div>
            <select value={current?.id || ''} onChange={(e)=>setCurrentId(e.target.value)} className="ml-4 px-2 py-2 border border-gray-200 rounded-md text-sm">
              {lists.map(l => <option key={l.id} value={l.id}>{l.name}</option>)}
            </select>
          </div>
        </div>

        <main className="flex-grow flex flex-col items-center justify-start p-6 space-y-6">
          {lists.length > 0 && (
            <div className="w-full grid grid-cols-2 gap-4">
              {lists.map((l) => {
                const thumb = (l.items && l.items[0] && (l.items[0].thumbnail || l.items[0].imageUrl)) || 'https://placehold.co/320x180/efefef/777?text=' + encodeURIComponent(t('Playlist'));
                const selected = l.id === (current?.id);
                return (
                  <button key={l.id} onClick={(e)=>{ if (e.currentTarget.dataset.longpressed === '1') { e.currentTarget.dataset.longpressed = '0'; return; } setCurrentId(l.id); }} className={`w-full text-left bg-white rounded-2xl border ${selected ? 'border-[var(--color-gold)]' : 'border-gray-200'} overflow-hidden hover:border-gray-300 transition`}
                    onMouseDown={(e)=>{ longPressTimers.current[l.id] = setTimeout(()=>{ try { e.currentTarget.dataset.longpressed = '1'; if (confirm(t('Delete this playlist?'))){ deletePlaylist(l.id); const all = getPlaylists(); setLists(all); setCurrentId(all[0]?.id || null); } } catch (err) {} }, 700); }}
                    onMouseUp={(e)=>{ clearTimeout(longPressTimers.current[l.id]); }}
                    onMouseLeave={(e)=>{ clearTimeout(longPressTimers.current[l.id]); }}
                    onTouchStart={(e)=>{ longPressTimers.current[l.id] = setTimeout(()=>{ try { e.currentTarget.dataset.longpressed = '1'; if (confirm(t('Delete this playlist?'))){ deletePlaylist(l.id); const all = getPlaylists(); setLists(all); setCurrentId(all[0]?.id || null); } } catch (err) {} }, 700); }}
                    onTouchEnd={(e)=>{ clearTimeout(longPressTimers.current[l.id]); }}
                  > 
                    <div className="w-full pb-[56%] relative">
                      <img src={thumb} alt={l.name} className="absolute inset-0 w-full h-full object-cover" onError={(e)=>{ e.currentTarget.src='https://placehold.co/320x180/efefef/777?text=' + encodeURIComponent(t('Playlist')); }} />
                    </div>
                    <div className="px-3 py-2 relative">
                      {editingId === l.id ? (
                        <input autoFocus value={editingName} onChange={(e)=>setEditingName(e.target.value)} onBlur={()=>{ try { renamePlaylist(l.id, (editingName||'').trim() || l.name); setLists(getPlaylists()); } catch (err) {} setEditingId(null); }} onKeyDown={(e)=>{ if (e.key === 'Enter') { e.currentTarget.blur(); } }} className="w-full text-base font-semibold text-gray-900 truncate outline-none" />
                      ) : (
                        <div className="text-base font-semibold text-gray-900 truncate">{l.name}</div>
                      )}
                      <button onClick={(e)=>{ e.stopPropagation(); setEditingId(l.id); setEditingName(l.name || ''); }} className="absolute top-2 right-2 p-1 text-gray-600 hover:text-gray-900"><Pencil className="w-4 h-4" /></button>
                      <div className="text-xs text-gray-500 flex items-center gap-1 mt-0.5">
                        <span>{t('Private')}</span>
                        <span>•</span>
                        <span>{(l.items||[]).length}</span>
                        <Bookmark className="w-3.5 h-3.5 ml-auto text-gray-400" />
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          )}

          {current ? (
            filtered.length > 0 ? (
              <div className="w-full space-y-4">
                {filtered.map((it) => (
                  <div key={`${current.id}:${it.id}`} className="w-full bg-white rounded-xl shadow-sm border border-gray-100 p-2 flex items-center space-x-3 select-none"
                    onClick={() => openItem(it)}
                    onTouchStart={(e) => { e.currentTarget.dataset.startX = e.touches[0].clientX; }}
                    onTouchMove={(e) => { const sx = parseFloat(e.currentTarget.dataset.startX || '0'); const dx = e.touches[0].clientX - sx; e.currentTarget.style.transform = `translateX(${dx}px)`; }}
                    onTouchEnd={(e) => { const sx = parseFloat(e.currentTarget.dataset.startX || '0'); const dx = e.changedTouches[0].clientX - sx; e.currentTarget.style.transform = ''; if (dx < -80) { removeFromPlaylist(current.id, it.id); setLists(getPlaylists()); } e.currentTarget.dataset.startX = '0'; }}
                  >
                    <img src={it.thumbnail || 'https://placehold.co/160x90/efefef/777?text=Video'} alt={it.title} className="w-40 h-24 object-cover rounded-md" onError={(e)=>{ e.currentTarget.src='https://placehold.co/160x90/efefef/777?text=Video'; }} />
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium text-gray-900 line-clamp-2">{it.title || it.url || it.id}</div>
                      <div className="text-xs text-gray-500 mt-0.5">{it.author}{it.author && it.requester ? ' • ' : ''}{it.requester}</div>
                      <div className="text-xs text-gray-500 mt-0.5">Added • {new Date(it.addedAt).toLocaleString()}</div>
                    </div>
                    <button className="p-2 text-gray-600 hover:text-gray-900" aria-label="Share" onClick={(e)=>{ e.stopPropagation(); const id = it.id || it.videoId; const link = id ? `${WEB_URL}/share/video/${encodeURIComponent(id)}` : (it.url ? `${WEB_URL}/videoplayer?src=${encodeURIComponent(it.url)}&title=${encodeURIComponent(it.title||'')}` : window.location.href); const payload = { title: it.title||'Watch this', text: it.title||'Watch this', url: link }; if (navigator.share) { navigator.share(payload).catch(()=>{}); } else { try { navigator.clipboard && navigator.clipboard.writeText(link); alert(t('Share link copied')); } catch {} } }}>
                      <MoreHorizontal className="w-5 h-5" />
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="w-full space-y-3">
                <div className="text-sm text-gray-600">{t('Playlist')} “{current.name}” {t('has no videos yet')}</div>
                <div className="w-full px-4 py-3 bg-[#F5F5DC] text-gray-700 rounded-xl flex items-start space-x-2" style={{ borderColor: 'var(--color-gold-light)', borderStyle: 'solid', boxShadow: '0 6px 16px rgba(203,138,0,0.06)' }}>
                  <Lightbulb className="w-4 h-4 mt-0.5 text-[var(--color-gold)] flex-shrink-0" />
                  <p className="text-xs leading-relaxed font-medium">{t('Use “Add to playlist” from a video’s options to start filling this list. Swipe left on items to remove.')}</p>
                </div>
              </div>
            )
          ) : (
            <div className="flex-grow flex flex-col items-center justify-center text-center space-y-4 pt-8">
              <ListPlus className="w-16 h-16 text-gray-400" strokeWidth={1} />
              <h2 className="text-lg font-semibold text-gray-700">{t('No playlists yet')}</h2>
              <p className="text-sm text-gray-500 max-w-xs">{t('Create your first playlist to organize favorite videos')}</p>
            </div>
          )}
        </main>

        <SharedBottomBar selectedLanguage={selectedLanguage} />
      </div>

      {showCreate && (
        <div className="fixed inset-0 z-[130] flex items-center justify-center px-4" style={{ backgroundColor: 'rgba(0,0,0,0.6)' }} onClick={cancelCreate}>
          <div className="bg-white rounded-2xl w-full max-w-md p-6" onClick={(e)=>e.stopPropagation()}>
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-lg font-semibold text-gray-900">{t('Create Playlist')}</h3>
              <button className="p-1 text-gray-500 hover:text-gray-700" onClick={cancelCreate}>✕</button>
            </div>
            <label className="text-sm text-gray-700">{t('Name')}</label>
            <input value={newName} onChange={(e)=>{ setNewName(e.target.value); setNameErr(''); }} placeholder={t('My Playlist')} className="mt-1 w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-md outline-none" />
            {nameErr && <div className="text-xs text-red-600 mt-1">{nameErr}</div>}
            <div className="mt-4 flex justify-end gap-2">
              <button className="px-3 py-2 text-sm text-gray-700" onClick={cancelCreate}>{t('Cancel')}</button>
              <button className="px-3 py-2 text-sm text-white rounded-md" style={{ backgroundColor: 'var(--color-gold)' }} onClick={confirmCreate}>{t('Create')}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Lightweight helper for adding via prompt from other places
export async function promptAddToPlaylist(video) {
  const selectedLanguage = (typeof window !== 'undefined') ? window.localStorage.getItem('regaarder_language') || 'English' : 'English';
  const t = (key) => getTranslation(key, selectedLanguage);
  try {
    const lists = getPlaylists();
    const names = lists.map(l => l.name);
    const msg = t('Add to playlist') + ':\n' + (names.length ? (t('Existing: ') + names.join(', ')) : t('No playlists yet'));
    const name = prompt(msg, names[0] || t('My Playlist'));
    if (!name) return false;
    const p = ensurePlaylist(name);
    addToPlaylist(p.id, video);
    return true;
  } catch { return false; }
}
