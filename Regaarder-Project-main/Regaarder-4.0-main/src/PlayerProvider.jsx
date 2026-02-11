import React, { createContext, useRef, useCallback, useEffect } from 'react';

export const PlayerContext = createContext(null);

export const PlayerProvider = ({ children }) => {
  const videoRef = useRef(null);

  useEffect(() => {
    // create a single, hidden video element mounted to body so it survives route/UI changes
    const v = document.createElement('video');
    v.preload = 'auto';
    v.controls = false;
    // default hidden until mounted into a visible container; ensure it will size correctly when shown
    v.style.display = 'none';
    v.style.width = '100%';
    v.style.height = '100%';
    v.style.objectFit = 'contain';
    v.playsInline = true;
    v.muted = true; // allow autoplay on mobile
    // do not forcibly set crossOrigin here; some sources fail when CORS headers are absent
    // v.crossOrigin = 'anonymous';
    v.style.background = 'transparent';
    document.body.appendChild(v);
    videoRef.current = v;

    const handlePlay = () => {};
    v.addEventListener('play', handlePlay);
    const onError = (ev) => {
      try { console.error('PlayerProvider: video element error', { code: v.error && v.error.code, message: v.error && v.error.message, src: v.currentSrc || v.src }); } catch (e) { console.error('PlayerProvider error handler failed', e); }
    };
    const onLoaded = () => {
      try { console.info('PlayerProvider: video loadedmetadata', { src: v.currentSrc || v.src, duration: v.duration }); } catch (e) {}
    };
    v.addEventListener('error', onError);
    v.addEventListener('loadedmetadata', onLoaded);

    return () => {
      try { v.pause(); } catch {}
      try { v.removeEventListener('play', handlePlay); } catch {}
      try { v.removeEventListener('error', onError); } catch {}
      try { v.removeEventListener('loadedmetadata', onLoaded); } catch {}
      try { v.remove(); } catch {}
    };
  }, []);

  const setSource = useCallback((src, startTime = 0, autoplay = true) => {
    const v = videoRef.current;
    if (!v) return;
    try { console.info('PlayerProvider.setSource called', { src, startTime, autoplay }); } catch {}

    if (v.src !== src) {
      try {
        v.src = src || '';
        console.info('PlayerProvider: assigned src ->', v.src);
      } catch (e) { console.warn('PlayerProvider: failed to assign src', e); }
      try { v.load(); } catch (e) { console.warn('PlayerProvider: load() failed', e); }
    }

    try { if (!isNaN(startTime) && startTime > 0) v.currentTime = startTime; } catch (e) { console.warn('PlayerProvider: seek failed', e); }

    try {
      v.style.display = 'block';
      v.style.width = '100%';
      v.style.height = 'auto';
      v.style.objectFit = 'contain';
    } catch (e) {}

    // add temporary diagnostics listeners
    const onMeta = () => {
      try { console.info('PlayerProvider: loadedmetadata', { src: v.currentSrc || v.src, videoWidth: v.videoWidth, videoHeight: v.videoHeight, readyState: v.readyState }); } catch (e) {}
    };
    const onErr = () => {
      try { console.error('PlayerProvider: media error', v.error, { src: v.currentSrc || v.src }); } catch (e) {}
    };
    try {
      v.removeEventListener('loadedmetadata', onMeta);
      v.removeEventListener('error', onErr);
      v.addEventListener('loadedmetadata', onMeta);
      v.addEventListener('error', onErr);
    } catch (e) {}

    if (autoplay) {
      const p = v.play();
      if (p && typeof p.catch === 'function') p.catch(() => {});
    }
    // ensure audio stays playing when UI switches; element is global
  }, []);

  const getState = useCallback(() => {
    const v = videoRef.current;
    if (!v) return { src: null, currentTime: 0, paused: true, duration: 0 };
    return { src: v.src || null, currentTime: v.currentTime || 0, paused: v.paused, duration: v.duration || 0 };
  }, []);

  const play = useCallback(() => { const v = videoRef.current; if (v) { const p = v.play(); if (p && p.catch) p.catch(()=>{}); } }, []);
  const pause = useCallback(() => { const v = videoRef.current; if (v) try { v.pause(); } catch {} }, []);

  return (
    <PlayerContext.Provider value={{ videoRef, setSource, getState, play, pause }}>
      {children}
    </PlayerContext.Provider>
  );
};

export default PlayerProvider;
