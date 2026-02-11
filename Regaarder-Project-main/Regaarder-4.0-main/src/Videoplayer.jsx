import React, { useEffect, useRef, useState, useCallback, useContext, useLayoutEffect } from 'react';
import { useSearchParams, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from './AuthContext.jsx';
import { useTheme } from './ThemeContext.jsx';
import { getTranslation } from './translations.js';
import { resolveMediaUrl } from './utils/media.js';
import * as eventBus from './eventbus.js';
import { PlayerContext } from './PlayerProvider.jsx';
import { WEB_URL } from './config.js';
import FeedbackModal from './FeedbackModal.jsx'; // Feedback Modal
import { Compass, Star, TrendingUp, Clock, Globe, BookOpen, Music, Dumbbell, Video } from 'lucide-react';

// CTA Overlay Component with Timing
const CTAOverlay = ({ cta }) => {
	const [isVisible, setIsVisible] = useState(false);

	useEffect(() => {
		const delay = (cta.overlayCtaDelay || 0) * 1000;
		const duration = (cta.overlayCtaDuration || 3) * 1000;

		const showTimer = setTimeout(() => {
			setIsVisible(true);
		}, delay);

		const hideTimer = setTimeout(() => {
			setIsVisible(false);
		}, delay + duration);

		return () => {
			clearTimeout(showTimer);
			clearTimeout(hideTimer);
		};
	}, [cta.overlayCtaDelay, cta.overlayCtaDuration]);

	if (!isVisible) return null;

	return (
		<div
			style={{
				width: '100%',
				padding: '12px 16px',
				background: 'rgba(0,0,0,0.8)',
				display: 'flex',
				flexDirection: 'column',
				alignItems: 'center',
				gap: 8,
				animation: 'fadeIn 0.3s ease-in'
			}}
		>
			<style>{`
				@keyframes fadeIn {
					from { opacity: 0; }
					to { opacity: 1; }
				}
				@keyframes pulse-chevron {
					0%, 100% { transform: translateY(0px); opacity: 0.6; }
					50% { transform: translateY(8px); opacity: 1; }
				}
				.pulse-chevron {
					animation: pulse-chevron 1.5s ease-in-out infinite;
				}
			`}</style>

			{/* Pulsing Chevron Down */}
			<div className="pulse-chevron" style={{ fontSize: 24, color: cta.overlayCtaColor || '#4B9EFF' }}>
				v
			</div>

			{/* CTA Content */}
			{cta.overlayCtaType === 'text' ? (
				<button
					onClick={(e) => {
						e.stopPropagation();
						if (cta.link) {
							window.open(cta.link, '_blank');
						}
					}}
					style={{
						width: '100%',
						padding: '12px 16px',
						background: cta.overlayCtaColor || '#4B9EFF',
						color: '#fff',
						border: 'none',
						borderRadius: 8,
						fontSize: 14,
						fontWeight: 700,
						cursor: 'pointer',
						transition: 'all 0.2s ease'
					}}
					onMouseEnter={(e) => {
						e.currentTarget.style.transform = 'translateY(-2px)';
						e.currentTarget.style.boxShadow = '0 4px 12px rgba(75, 158, 255, 0.3)';
					}}
					onMouseLeave={(e) => {
						e.currentTarget.style.transform = 'translateY(0)';
						e.currentTarget.style.boxShadow = 'none';
					}}
				>
					{cta.overlayCtaText}
				</button>
			) : cta.overlayCtaType === 'image' ? (
				<img
					src={cta.overlayCtaMedia}
					alt="CTA"
					onClick={() => {
						if (cta.link) window.open(cta.link, '_blank');
					}}
					style={{ width: '100%', maxHeight: '120px', objectFit: 'contain', borderRadius: 8, cursor: 'pointer' }}
				/>
			) : cta.overlayCtaType === 'gif' ? (
				<img
					src={cta.overlayCtaMedia}
					alt="CTA GIF"
					onClick={() => {
						if (cta.link) window.open(cta.link, '_blank');
					}}
					style={{ width: '100%', maxHeight: '120px', objectFit: 'contain', borderRadius: 8, cursor: 'pointer' }}
				/>
			) : cta.overlayCtaType === 'video' ? (
				<video
					src={cta.overlayCtaMedia}
					autoPlay
					loop
					onClick={() => {
						if (cta.link) window.open(cta.link, '_blank');
					}}
					style={{ width: '100%', maxHeight: '120px', objectFit: 'contain', borderRadius: 8, cursor: 'pointer', background: '#000' }}
				/>
			) : null}
		</div>
	);
};

// Video Ad Overlay Component with Preloading State and Exit Transitions
const VideoAdOverlay = ({ ad, forceLandscapeCss, onDismiss }) => {
	const [videoReady, setVideoReady] = useState(false);
	const [hasError, setHasError] = useState(false);
	const [isClosing, setIsClosing] = useState(false);
	const [shouldRender, setShouldRender] = useState(true);
	const retryCountRef = useRef(0);
	const adVideoRef = useRef(null);
	const adYtIframeRef = useRef(null);

	// Determine transition effect
	const transitionEffect = ad.overlayExitTransition || 'fade';
	const effectList = ['fade', 'dissolve', 'blinds', 'wilt'];
	const selectedEffect = transitionEffect === 'random' 
		? effectList[Math.floor(Math.random() * effectList.length)]
		: transitionEffect;

	useEffect(() => {
		setVideoReady(false);
		setHasError(false);
		setIsClosing(false);
		setShouldRender(true);
	}, [ad.overlayVideoUrl]);

	// ── Auto-dismiss after configured duration (prevents YouTube end screen, enforces staff-set duration) ──
	useEffect(() => {
		if (!videoReady || isClosing) return;
		const durationMs = (ad.duration || 10) * 1000;
		const timer = setTimeout(() => {
			// Stop YouTube ad playback before closing (prevents end screen flash)
			if (adYtIframeRef.current) {
				try {
					adYtIframeRef.current.contentWindow.postMessage(
						JSON.stringify({ event: 'command', func: 'pauseVideo' }), '*'
					);
				} catch {}
			}
			// Stop direct video ad playback
			if (adVideoRef.current) {
				try { adVideoRef.current.pause(); } catch {}
			}
			handleClose();
		}, durationMs);
		return () => clearTimeout(timer);
	}, [videoReady, ad.duration, isClosing]);

	const isYouTube = (url) => url && (url.includes('youtube.com') || url.includes('youtu.be'));
	const getYouTubeId = (url) => {
		let id = '';
		if (url.includes('youtu.be/')) {
			id = url.split('youtu.be/')[1].split('?')[0];
		} else if (url.includes('youtube.com')) {
			try { id = new URL(url).searchParams.get('v') || ''; } catch { }
		}
		return id;
	};

	const handleClose = () => {
		setIsClosing(true);
		// Notify parent so ad is removed from visibleAds (unblocks controls)
		if (onDismiss) onDismiss(ad.id);
		// Remove component after transition completes
		setTimeout(() => setShouldRender(false), 600);
	};

	if (!shouldRender) return null;

	const renderBadge = (isPlayerContext) => {
		if (ad.overlayBadgeType === 'none') return null;
		if (isPlayerContext && !ad.overlayBadgePosition?.includes('-player')) return null;
		if (!isPlayerContext && ad.overlayBadgePosition?.includes('-player')) return null;

		const badgePos = ad.overlayBadgePosition || (isPlayerContext ? 'top-left-player' : 'top-left-video');

		let badgeStyle = {
			position: 'absolute',
			zIndex: 601,
			pointerEvents: 'none'
		};

		if (badgePos.includes('top')) badgeStyle.top = 'calc(env(safe-area-inset-top, 20px) + 12px)';
		if (badgePos.includes('bottom')) badgeStyle.bottom = 12;
		if (badgePos.includes('left')) badgeStyle.left = 12;
		if (badgePos.includes('right')) badgeStyle.right = 12;

		return (
			<div style={badgeStyle}>
				{ad.overlayBadgeType === 'sponsoredBy' && ad.overlayBadgeLogo ? (
					<div style={{
						display: 'flex',
						alignItems: 'center',
						gap: 8,
						background: ad.overlayBadgeColor || '#000',
						padding: '6px 12px',
						borderRadius: 6,
						color: '#fff',
						fontSize: 12,
						fontWeight: 600,
						opacity: 0.95
					}}>
						<span>Sponsored by</span>
						<img src={ad.overlayBadgeLogo} alt="sponsor" style={{
							height: 20,
							maxWidth: 80,
							objectFit: 'contain'
						}} />
					</div>
				) : (
					<div style={{
						background: ad.overlayBadgeColor || '#ff0000',
						padding: '6px 12px',
						borderRadius: 6,
						color: '#fff',
						fontSize: 12,
						fontWeight: 700,
						letterSpacing: '0.5px',
						opacity: 0.95,
						minWidth: 45,
						textAlign: 'center'
					}}>
						AD
					</div>
				)}
			</div>
		);
	};

	const getExitAnimation = () => {
		const baseStyles = {
			transition: 'all 0.5s cubic-bezier(0.4, 0, 1, 1)',
			transformOrigin: 'center center'
		};

		if (!isClosing) return { ...baseStyles, opacity: 1, transform: 'scale(1)' };

		switch (selectedEffect) {
			case 'fade':
				return { ...baseStyles, opacity: 0 };
			case 'dissolve':
				return { ...baseStyles, opacity: 0, transform: 'scale(0.95)' };
			case 'blinds':
				return { ...baseStyles, opacity: 0, transform: 'scaleY(0)', transformOrigin: 'top center' };
			case 'wilt':
				return { ...baseStyles, opacity: 0, transform: 'rotateX(90deg) scaleY(0)', transformOrigin: 'center center' };
			default:
				return { ...baseStyles, opacity: 0 };
		}
	};

	return (
		<div
			style={{
				position: 'fixed',
				inset: forceLandscapeCss ? 'auto' : 0,
				top: forceLandscapeCss ? '50%' : 0,
				left: forceLandscapeCss ? '50%' : 0,
				transform: forceLandscapeCss ? 'translate(-50%, -50%) rotate(90deg)' : 'none',
				width: forceLandscapeCss ? '100vh' : '100vw',
				height: forceLandscapeCss ? '100vw' : '100vh',
				zIndex: 600,
				background: '#000',
				display: 'flex',
				flexDirection: 'column',
				alignItems: 'center',
				justifyContent: 'center',
				pointerEvents: 'auto',
				opacity: isClosing ? 0 : 1,
				transition: 'opacity 0.5s cubic-bezier(0.4, 0, 1, 1)'
			}}
			onClick={() => {
				if (ad.link) window.open(ad.link, '_blank');
			}}
		>
			{/* Inner content - fade in only when video is ready to play (hides YouTube logo/controls during load) */}
			<div style={{
				opacity: videoReady ? 1 : 0,
				visibility: videoReady ? 'visible' : 'hidden',
				transition: 'opacity 0.4s ease-out, visibility 0s linear ' + (videoReady ? '0s' : '0.4s'),
				width: '100%',
				height: '100%',
				display: 'flex',
				flexDirection: 'column',
				position: 'relative',
				pointerEvents: videoReady ? 'auto' : 'none',
				...getExitAnimation()
			}}>
				{/* Player Context Badge */}
				{renderBadge(true)}

				<div style={{ flex: 1, width: '100%', overflow: 'hidden', position: 'relative' }}>
					
					{/* Video Wrapper — fills entire container for full-width playback */}
					<div style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }}>
						
						{/* Video Context Badge */}
						{renderBadge(false)}

						{/* Video Content */}
						{ad.overlayVideoUrl && !hasError ? (() => {
							const youtubeId = getYouTubeId(ad.overlayVideoUrl);
							if (isYouTube(ad.overlayVideoUrl) && youtubeId) {
								return (
									<div style={{ position: 'relative', width: '100%', height: '100%' }}>
										<iframe
											ref={adYtIframeRef}
											width="100%"
											height="100%"
											src={`https://www.youtube-nocookie.com/embed/${youtubeId}?autoplay=1&mute=1&controls=0&modestbranding=1&showinfo=0&rel=0&iv_load_policy=3&fs=0&disablekb=1&playsinline=1&enablejsapi=1&origin=${encodeURIComponent(window.location.origin)}&loop=1&playlist=${youtubeId}`}
											frameBorder="0"
											allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; autoplay"
											style={{ background: '#000', width: '100%', height: '100%', border: 'none', display: 'block', pointerEvents: 'none', transform: 'scale(1.3)', transformOrigin: 'center center' }}
											onLoad={() => {
												// Unmute YouTube ad after autoplay starts (must start muted for autoplay policy)
												const tryUnmute = () => {
													try {
														const iw = adYtIframeRef.current && adYtIframeRef.current.contentWindow;
														if (iw) {
															iw.postMessage(JSON.stringify({ event: 'command', func: 'unMute' }), '*');
															iw.postMessage(JSON.stringify({ event: 'command', func: 'setVolume', args: [100] }), '*');
														}
													} catch {}
												};
												setTimeout(tryUnmute, 500);
												setTimeout(tryUnmute, 1500);
												setTimeout(tryUnmute, 2500);
												// Longer delay so YouTube fully auto-plays & hides its own UI/branding before we reveal
												setTimeout(() => setVideoReady(true), 2500);
											}}
										/>
										{/* Transparent overlay blocks all clicks — prevents pausing the ad */}
										<div style={{ position: 'absolute', inset: 0, zIndex: 3 }} />
									</div>
								);
							} else {
								return (
									<video
										ref={adVideoRef}
										src={ad.overlayVideoUrl}
										autoPlay
										muted={false}
										playsInline
										crossOrigin="anonymous"
										onCanPlay={() => setVideoReady(true)}
										onLoadedData={() => setVideoReady(true)}
										onEnded={() => handleClose()}
										onError={(e) => {
											console.error('Ad video failed to load (attempt ' + (retryCountRef.current + 1) + ')', e);
											if (retryCountRef.current < 2) {
												retryCountRef.current += 1;
												// Retry after a delay (server may be waking up)
												setTimeout(() => {
													try {
														const v = adVideoRef.current;
														if (v) {
															v.src = ad.overlayVideoUrl + (ad.overlayVideoUrl.includes('?') ? '&' : '?') + '_r=' + retryCountRef.current;
															v.load();
														}
													} catch (err) { console.warn('Ad video retry failed', err); }
												}, 1500 * retryCountRef.current);
											} else {
												setHasError(true);
												setVideoReady(true);
											}
										}}
										style={{
											position: 'absolute',
											inset: 0,
											width: '100%',
											height: '100%',
											objectFit: 'contain',
											background: '#000',
											display: 'block',
											pointerEvents: 'none'
										}}
									/>
								);
							}
						})() : (
							<div
								ref={(el) => { if (el && !videoReady) setVideoReady(true); }}
								style={{
									position: 'absolute',
									inset: 0,
									display: 'flex',
									flexDirection: 'column',
									alignItems: 'center',
									justifyContent: 'center',
									width: '100%',
									height: '100%',
									background: ad.overlayAdBgColor || '#1a1a1a',
									padding: 20
								}}
							>
								{/* Branded ad content */}
								{ad.overlayAdEmoji && <div style={{ fontSize: 56, marginBottom: 16 }}>{ad.overlayAdEmoji}</div>}
								{ad.overlayAdCompanyName && <div style={{ fontSize: 20, fontWeight: 700, color: ad.overlayAdTextColor || '#fff', marginBottom: 12, textAlign: 'center' }}>{ad.overlayAdCompanyName}</div>}
								<div style={{ fontSize: 16, lineHeight: 1.6, fontWeight: 600, color: ad.overlayAdTextColor || '#fff', textAlign: 'center' }}>
									<div style={{ marginBottom: 8 }}>{ad.overlayAdText || 'Advertisement'}</div>
								</div>
								{ad.overlayBtnText && (
									<button
										style={{ marginTop: 16, padding: '10px 28px', background: 'rgba(255,255,255,0.2)', color: ad.overlayAdTextColor || '#fff', border: '1px solid rgba(255,255,255,0.3)', borderRadius: 8, fontSize: 14, fontWeight: 600, cursor: 'pointer' }}
										onClick={() => { if (ad.link) window.open(ad.link, '_blank'); }}
									>
										{ad.overlayBtnText}
									</button>
								)}
							</div>
						)}
					</div>
				</div>

				{/* Optional CTA with Timing Support - stays inside overlay, within fade container */}
				{(ad.overlayCtaText || ad.overlayCtaMedia) && <CTAOverlay cta={ad} />}
			</div>
		</div>
	);
};

const VideoPlayer = () => {
	const navigate = useNavigate();
	const location = useLocation();

	// FIX: Ensure selectedLanguage updates dynamically when changed elsewhere in the app.
	const [selectedLanguage, setSelectedLanguage] = useState(
		(typeof window !== 'undefined' ? (localStorage.getItem('regaarder_language') || 'English') : 'English')
	);

	useEffect(() => {
		const handleStorageChange = () => {
			const current = localStorage.getItem('regaarder_language') || 'English';
			setSelectedLanguage(current);
		};

		// Poll specifically for this legacy component style
		const interval = setInterval(handleStorageChange, 1000);
		return () => clearInterval(interval);
	}, []);

	const [error, setError] = useState(null);
	const [videoInfo, setVideoInfo] = useState(null);
	const videoRef = useRef(null);
	const containerRef = useRef(null);
	const [videoMountTick, setVideoMountTick] = useState(0);
	const [isInPiPMode, setIsInPiPMode] = useState(false);
	const player = useContext(PlayerContext) || {};
	const globalVideoRef = player.videoRef;
	const setSource = player.setSource;
	const playerPlay = player.play;

	// Playlist/navigation refs so the separate videoplayer route can navigate the same list as home
	const currentSourceRef = useRef([]); // array of ids or urls
	const currentIndexRef = useRef(-1);
	const [currentIndex, setCurrentIndex] = useState(-1);
	const lastWheelTimeRef = useRef(0);

	useEffect(() => {
		let cancelled = false;
		(async () => {
			try {
				const params = new URLSearchParams(window.location.search);
				const id = params.get('id');
				const title = params.get('title');
				const channel = params.get('channel');
				const subtitle = params.get('subtitle');
				// accept many possible query keys for the video source (compat with various callers)
				const src = params.get('src') || params.get('video') || params.get('url') || params.get('videoUrl') || params.get('v');

				let info = null;

				// Prefer router state payload when expanding from mini-player or from home navigation
				try {
					if (location && location.state) {
						const payload = location.state.miniPlayerData || location.state.video || null;
						if (payload) {
							info = payload.video || payload || null;
							if (info && !info.src) info.src = info.videoUrl || info.url || src || null;
						}
					}
				} catch (e) {
					// ignore
				}

				try {
					const mod = await import('./home.jsx');
					const getVideoById = mod.getVideoById;
					const VIDEOS = mod.VIDEOS || mod.default?.VIDEOS || null;
					if (!info && id && typeof getVideoById === 'function') info = getVideoById(id);
					// If not found by id, try to construct from params. Accept src even when title is missing.
					if (!info) {
						if (title || src) {
							info = { id: id || (src ? 'custom' : null), title: title || '', channel, subtitle, src: src || null };
						}
					}
					// Last fallback: first video in shared list
					if (!info && Array.isArray(VIDEOS) && VIDEOS.length) info = VIDEOS[0];
				} catch (e) {
					// if dynamic import fails, fallback to params or existing info
					if (!info && title) info = { id: id || 'custom', title, channel, subtitle, src: src || null };
				}

				if (cancelled) return;
				if (!info) {
					setError('No video information available.');
					return;
				}
				// normalize source fields and set the main video info
				if (info && !info.src) info.src = info.videoUrl || info.url || info.src || null;
				setVideoInfo(info);
				// try to initialize playlist/index from localStorage (set by home when opening player)
				try {
					const raw = localStorage.getItem('videoplayer_source');
					const rawIdx = localStorage.getItem('videoplayer_index');
					if (raw) {
						const list = JSON.parse(raw);
						if (Array.isArray(list) && list.length) {
							currentSourceRef.current = list; // Update the correct ref

							// Always try to match the current video to the list first to ensure sync
							const key = info.id || info.src || info.url || info.videoUrl || info.title;
							let idx = list.findIndex(x => String(x) === String(key) || String(x) === String(info.url) || String(x) === String(info.src) || (typeof x === 'object' && (String(x.id) === String(key) || String(x.url) === String(key))));

							// If explicit index provided and valid, prioritize it but verify it matches
							if (rawIdx != null && rawIdx !== undefined && !isNaN(parseInt(rawIdx, 10))) {
								const storedIdx = parseInt(rawIdx, 10);
								if (storedIdx >= 0 && storedIdx < list.length) {
									// If the video at storedIdx matches our current video, trust it
									// Otherwise trust the found idx (user might have deep linked to a different video while old state persisted)
									const itemAtIdx = list[storedIdx];
									const itemKey = typeof itemAtIdx === 'object' ? (itemAtIdx.id || itemAtIdx.url) : itemAtIdx;

									// Loose matching
									if (idx === -1 || String(itemKey) === String(key) || String(itemKey) === String(info.url)) {
										idx = storedIdx;
									}
								}
							}

							if (idx !== -1) {
								currentIndexRef.current = idx;
								setCurrentIndex(idx);
							} else {
								// If not found in list, maybe prepend it? Or just reset to 0?
								// For now, if not in list, we can't navigate previous/next effectively in that list.
								currentIndexRef.current = 0;
								setCurrentIndex(0);
							}
						}
					}
				} catch (e) { }

				// end of videoInfo init
			} catch (err) {
				console.error('videoplayer parse error', err);
				setError('Failed to parse video parameters.');
			}
		})();
		return () => { cancelled = true; };
	}, []);

	useEffect(() => {
		if (!videoInfo) return;
		const v = (globalVideoRef && globalVideoRef.current) || null;
		// mount global video element into our container so it's visible in this route
		try {
			if (containerRef.current && v) {
				try { containerRef.current.innerHTML = ''; } catch { }
				try { containerRef.current.appendChild(v); } catch { }
				try { v.style.display = 'block'; v.className = 'w-full rounded-lg bg-black'; } catch { }
				try { videoRef.current = v; } catch { }
				try { setVideoMountTick((t) => t + 1); } catch { }
			}
		} catch (e) { }

		// set source (auto-play disabled per user request)
		try {
			if (typeof setSource === 'function' && videoInfo.src) {
				// try resume time from localStorage fallback
				let startTime = 0;
				try {
					const key = 'playback:' + (videoInfo.id || videoInfo.src || videoInfo.url || videoInfo.title || '');
					const raw = localStorage.getItem(key);
					if (raw) {
						const parsed = JSON.parse(raw);
						if (parsed && parsed.currentTime) startTime = parsed.currentTime;
					}
				} catch { }
				setSource(videoInfo.src, startTime, false);
				// ensure local state has a URL so autoplay effects can kick in
				try {
					const resolvedSrc = resolveMediaUrl(videoInfo.src);
					if (resolvedSrc && videoUrl !== resolvedSrc) setVideoUrl(resolvedSrc);
				} catch { }
			} else if (v && videoInfo.src) {
				if (v.src !== (videoInfo.src ? resolveMediaUrl(videoInfo.src) : videoInfo.src)) { v.src = videoInfo.src ? resolveMediaUrl(videoInfo.src) : videoInfo.src; try { v.load(); } catch { } }
				try { v.currentTime = 0; } catch { }
				// AUTO-PLAY DISABLED: User must click play
			}
		} catch (e) { }
		}, [videoInfo, globalVideoRef, setSource, videoUrl]);

	// Attach important event listeners to the global video element (previously inline JSX handlers)
	useEffect(() => {
		const v = (globalVideoRef && globalVideoRef.current) || videoRef.current;
		if (!v) return;

		const onLoaded = () => {
			try {
				const w = v.videoWidth || 16;
				const h = v.videoHeight || 9;
				const aspect = (w && h) ? (w / h) : (16 / 9);
				try { setDuration(v.duration || 0); } catch { }
				try { setNaturalAspect(aspect); } catch { }
				try { setOrientation(aspect < 1 ? 'portrait' : 'landscape'); } catch { }
			} catch { }
		};
		const onTime = () => {
			try { if (v.duration && !draggingRef.current) setProgress(v.currentTime / v.duration); } catch { }
		};
		const onSeeking = () => {
			try { console.debug('video seeking', v && v.currentTime); } catch { }
		};
		const onSeeked = () => { try { console.debug('video seeked', v && v.currentTime); } catch { } };
		const onPlay = () => { try { setIsPlaying(true); handlePlayRecord(); } catch { } };
		const onPause = () => { try { setIsPlaying(false); } catch { } };
		const onEnded = () => { try { setIsPlaying(false); setShowSuggestionCard(true); } catch { } };

		v.addEventListener('loadedmetadata', onLoaded);
		v.addEventListener('timeupdate', onTime);
		v.addEventListener('seeking', onSeeking);
		v.addEventListener('seeked', onSeeked);
		v.addEventListener('play', onPlay);
		v.addEventListener('pause', onPause);
		v.addEventListener('ended', onEnded);

		return () => {
			try { v.removeEventListener('loadedmetadata', onLoaded); } catch { }
			try { v.removeEventListener('timeupdate', onTime); } catch { }
			try { v.removeEventListener('seeking', onSeeking); } catch { }
			try { v.removeEventListener('seeked', onSeeked); } catch { }
			try { v.removeEventListener('play', onPlay); } catch { }
			try { v.removeEventListener('pause', onPause); } catch { }
			try { v.removeEventListener('ended', onEnded); } catch { }
		};
	}, [globalVideoRef]);

	/* ── PiP lifecycle: tell Android that auto-PiP is allowed while videoplayer is mounted ── */
	useEffect(() => {
		// Direct bridge (most reliable)
		if (window.NativePiP && typeof window.NativePiP.setPipAllowed === 'function') {
			try { window.NativePiP.setPipAllowed(true); } catch { }
		}
		// Capacitor fallback
		const Cap = window.Capacitor || (typeof Capacitor !== 'undefined' ? Capacitor : null);
		if (Cap && Cap.Plugins && Cap.Plugins.PiPMode) {
			try { Cap.Plugins.PiPMode.setPipAllowed({ allowed: true }); } catch { }
		}
		return () => {
			if (window.NativePiP && typeof window.NativePiP.setPipAllowed === 'function') {
				try { window.NativePiP.setPipAllowed(false); } catch { }
			}
			if (Cap && Cap.Plugins && Cap.Plugins.PiPMode) {
				try { Cap.Plugins.PiPMode.setPipAllowed({ allowed: false }); } catch { }
			}
		};
	}, []);

	/* ── Native Picture-in-Picture event listeners ── */
	useEffect(() => {
		const v = (globalVideoRef && globalVideoRef.current) || videoRef.current;
		if (!v) return;

		const onEnterPiP = () => {
			console.log('[PiP] Entered browser Picture-in-Picture');
			try { setIsInPiPMode(true); setControlsVisible(false); } catch { }
		};

		const onLeavePiP = () => {
			console.log('[PiP] Left browser Picture-in-Picture');
			try { setIsInPiPMode(false); setControlsVisible(true); } catch { }
		};

		// Browser PiP events (Chrome, Safari, Edge)
		v.addEventListener('enterpictureinpicture', onEnterPiP);
		v.addEventListener('leavepictureinpicture', onLeavePiP);

		// Android Capacitor PiP event (dispatched by MainActivity)
		const onAndroidPiP = (e) => {
			const isInPip = !!(e && e.detail && e.detail.pip);
			console.log('[PiP] Android pipModeChanged:', isInPip);
			try {
				setIsInPiPMode(isInPip);
				setControlsVisible(!isInPip);
			} catch { }
		};
		window.addEventListener('pipModeChanged', onAndroidPiP);

		return () => {
			try { v.removeEventListener('enterpictureinpicture', onEnterPiP); } catch { }
			try { v.removeEventListener('leavepictureinpicture', onLeavePiP); } catch { }
			try { window.removeEventListener('pipModeChanged', onAndroidPiP); } catch { }
		};
	}, [globalVideoRef]);

	// Allow vertical scroll (wheel) to navigate through the playlist persisted by the homepage.
	useEffect(() => {
		const handler = async (e) => {
			try {
				const now = Date.now();
				if (now - lastWheelTimeRef.current < 650) return; // throttle
				// deltaY < 0 => user scrolled up -> show next (below) video in homepage order
				// deltaY > 0 => scrolled down -> show previous (above)
				const dir = e.deltaY < 0 ? 1 : -1;
				const list = currentPlaylistRef.current || [];
				if (!list || !list.length) return;
				let idx = currentIndexRef.current;
				if (typeof idx !== 'number') idx = -1;
				const next = idx + dir;
				if (next < 0 || next >= list.length) return;
				lastWheelTimeRef.current = now;

				// Try to resolve item to a video object using home.jsx exports
				const targetId = list[next];
				try {
					const mod = await import('./home.jsx');
					const getVideoById = mod.getVideoById;
					const VIDEOS = mod.VIDEOS || mod.default?.VIDEOS || mod.homeVideos || mod.discoverItems || null;
					let info = null;
					if (typeof getVideoById === 'function') info = getVideoById(targetId);
					if (!info && Array.isArray(VIDEOS)) info = VIDEOS.find(v => (v.id && String(v.id) === String(targetId)) || (v.url && String(v.url) === String(targetId)) || (v.src && String(v.src) === String(targetId)));
					if (!info) {
						// if targetId looks like a URL, create minimal info
						if (typeof targetId === 'string' && /^(https?:)?\/\//.test(targetId)) {
							info = { id: targetId, title: 'Video', src: targetId };
						}
					}
					if (info) {
						currentIndexRef.current = next;
						setVideoInfo(info);
						// update the video element source if present
						try {
							const v = videoRef.current;
							if (v) {
								if (info.src || info.url) {
									v.src = resolveMediaUrl(info.src || info.url);
									v.currentTime = 0;
									// AUTO-PLAY DISABLED: User must click play
								}
							}
						} catch (err) { }
						// persist index
						try { localStorage.setItem('videoplayer_index', String(next)); } catch (e) { }
					}
				} catch (err) {
					// ignore import errors
				}
			} catch (err) { }
		};
		window.addEventListener('wheel', handler, { passive: true });
		return () => window.removeEventListener('wheel', handler);
	}, []);


	if (error) {
		return (
			<div className="p-6">
				<div className="p-4 bg-red-50 text-red-700 rounded-md" style={{border: 'none', display: 'none'}}>
					<strong>Error:</strong> {error}
				</div>
			</div>
		);
	}

	if (!videoInfo) {
		return (
			<div className="p-6">
				<div className="text-gray-600">Loading video...</div>
			</div>
		);
	}

	// YouTube URL detection for desktop player
	const desktopIsYouTube = videoInfo && videoInfo.src && (videoInfo.src.includes('youtube.com') || videoInfo.src.includes('youtu.be'));
	const desktopYtId = (() => {
		if (!desktopIsYouTube || !videoInfo?.src) return '';
		const url = videoInfo.src;
		if (url.includes('youtu.be/')) return url.split('youtu.be/')[1].split(/[?&#]/)[0];
		if (url.includes('youtube.com')) { try { return new URL(url).searchParams.get('v') || ''; } catch { return ''; } }
		return '';
	})();

	return (
		<div className="min-h-screen bg-white p-6">
			<div className="max-w-4xl mx-auto">
				<h1 className="text-2xl font-semibold text-gray-800 mb-2">{videoInfo.title}</h1>
				{videoInfo.channel && <p className="text-sm text-gray-500 mb-4">{videoInfo.channel}</p>}

				{desktopIsYouTube && desktopYtId ? (
					<div className="w-full rounded-lg bg-black relative" style={{ aspectRatio: '16/9', overflow: 'hidden' }}>
						<iframe
							src={`https://www.youtube-nocookie.com/embed/${desktopYtId}?autoplay=1&controls=0&modestbranding=1&showinfo=0&rel=0&iv_load_policy=3&fs=0&disablekb=1&playsinline=1&enablejsapi=1&origin=${encodeURIComponent(window.location.origin)}`}
							className="w-full h-full border-0"
							allow="accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture"
							style={{ width: '100%', height: '100%', pointerEvents: 'none', transform: 'scale(1.3)', transformOrigin: 'center center' }}
							title="Video player"
						/>
						<div style={{ position: 'absolute', inset: 0, zIndex: 3 }} />
						{/* Edge gradient masks — hide YouTube branding */}
						<div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: '10%', background: 'linear-gradient(to top, #000 15%, transparent 100%)', zIndex: 4, pointerEvents: 'none' }} />
						<div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '6%', background: 'linear-gradient(to bottom, #000 5%, transparent 100%)', zIndex: 4, pointerEvents: 'none' }} />
					</div>
				) : videoInfo.src ? (
					<div ref={containerRef} className="w-full rounded-lg bg-black" />
				) : (
					<div className="p-6 bg-[var(--color-gold-cream)] rounded-md text-[var(--color-gold)]" style={{ borderColor: 'var(--color-gold-light)', borderStyle: 'solid' }}>
						No playable source provided for this video.
					</div>
				)}
			</div>
		</div>
	);
};

export { VideoPlayer };
// QR code generator (client-side)
// NOTE: we no longer statically import the `qrcode` npm package to avoid bundler resolution errors.
// Runtime QR generation will prefer a globally-provided QR library (injected via CDN) or
// fall back to the server API at api.qrserver.com. If you prefer local generation via npm,
// run `npm install qrcode` and switch back to the static import.

const ChevronRight = ({ size = 20 }) => (
	<svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
		<path d="M9 18l6-6-6-6" />
	</svg>
);

const ChevronDown = ({ size = 20 }) => (
	<svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
		<path d="M6 9l6 6 6-6" />
	</svg>
);

// Small right-pointing move icon used in onboarding text
const MoveRight = ({ size = 14, stroke = 'currentColor' }) => (
	<svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={stroke} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ display: 'inline-block', verticalAlign: 'text-bottom', margin: '0 6px' }} aria-hidden="true">
		<path d="M5 12h14" />
		<path d="M13 6l6 6-6 6" />
	</svg>
);

const Lock = ({ active = false, size = 24, inCircle = false, color = undefined }) => {
	// Prefer an explicitly supplied color; otherwise keep previous blue-on-active fallback.
	const defaultActiveColor = "#60a5fa";
	const strokeColor = color ?? ((inCircle || active) ? defaultActiveColor : "#fff");
	// slightly increase stroke width when rendering larger
	const strokeW = size > 32 ? 2.6 : 2;
	return (
		<svg width={size} height={size} fill="none" viewBox="0 0 24 24" aria-hidden="true" style={{ display: "block" }}>
			<rect x="5" y="11" width="14" height="8" rx="2" stroke={strokeColor} strokeWidth={strokeW} />
			<path d="M7 11V8a5 5 0 0110 0v3" stroke={strokeColor} strokeWidth={strokeW} />
		</svg>
	);
};

// Replace previous LockOpen implementation with the supplied SVG (JSX)
// new LockOpen accepts size and color (defaults to white) and maps strokeWidth
const LockOpen = ({ size = 24, color = "#fff" }) => {
	const strokeW = size > 32 ? 2.6 : 2;
	return (
		<svg
			width={size}
			height={size}
			viewBox="0 0 24 24"
			fill="none"
			stroke={color}
			strokeWidth={strokeW}
			strokeLinecap="round"
			strokeLinejoin="round"
			aria-hidden="true"
			style={{ display: "block" }}
		>
			<rect width="18" height="11" x="3" y="11" rx="2" ry="2" />
			<path d="M7 11V7a5 5 0 0 1 9.9-1" />
		</svg>
	);
};

const Captions = () => (
	<svg width="24" height="24" fill="none" viewBox="0 0 24 24" style={{ color: "currentColor" }}>
		<rect x="3" y="5" width="18" height="14" rx="2" stroke="currentColor" strokeWidth="2" />
		<path d="M7 15h2M11 15h2M15 15h2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
		<path d="M7 11h10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
	</svg>
);

const PictureInPicture2 = () => (
	<svg width="24" height="24" viewBox="0 0 24 24" fill="none" style={{ color: "currentColor" }}>
		<rect x="2" y="3" width="20" height="14" rx="2" stroke="currentColor" strokeWidth="2" />
		<rect x="12" y="11" width="8" height="6" rx="1" fill="black" stroke="currentColor" strokeWidth="2" />
	</svg>
);

const Ellipsis = () => (
	<svg width="24" height="24" viewBox="0 0 24 24" fill="none" style={{ color: "currentColor" }}>
		<circle cx="5" cy="12" r="2" fill="currentColor" />
		<circle cx="12" cy="12" r="2" fill="currentColor" />
		<circle cx="19" cy="12" r="2" fill="currentColor" />
	</svg>
);

const Users = ({ size = 18 }) => (
	<svg width={size} height={size} viewBox="0 0 24 24" fill="none">
		<path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
		<circle cx="8.5" cy="7" r="4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
		<path d="M20 8v6M23 11h-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
	</svg>
);

// Single user with plus icon (matches the requested glyph)
const UserPlusIcon = ({ size = 22, color = '#fff' }) => (
	<svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
		<circle cx="12" cy="7" r="4" />
		<path d="M16 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
		<path d="M19 8v6" />
		<path d="M22 11h-6" />
	</svg>
);

const Bookmark = () => (
	<svg width="24" height="24" viewBox="0 0 24 24" fill="none">
		<path d="M5 5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v16l-7-3.5L5 21V5z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
	</svg>
);

// Add filled Bookmark + new icons
const BookmarkFilled = () => (
	<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
		<path d="M5 5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v16l-7-3.5L5 21V5z" fill="currentColor" />
	</svg>
);

const MessageSquare = () => (
	<svg width="24" height="24" viewBox="0 0 24 24" fill="none">
		<path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
	</svg>
);

const Heart = ({ filled = false }) => (
	<svg width="24" height="24" viewBox="0 0 24 24" style={{ color: "currentColor" }} fill="none">
		<path
			d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"
			stroke={filled ? "none" : "currentColor"}
			fill={filled ? "currentColor" : "none"}
			strokeWidth="2"
			strokeLinecap="round"
			strokeLinejoin="round"
		/>
	</svg>
);

// HeartOff: explicit outline heart used for the quick-action dislike toggle
const HeartOff = ({ size = 24, color = 'currentColor' }) => (
	<svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-heart-off-icon lucide-heart-off" aria-hidden="true" style={{ display: 'block' }}>
		<path d="M10.5 4.893a5.5 5.5 0 0 1 1.091.931.56.56 0 0 0 .818 0A5.49 5.49 0 0 1 22 9.5c0 1.872-1.002 3.356-2.187 4.655" />
		<path d="m16.967 16.967-3.459 3.346a2 2 0 0 1-3 .019L5 15c-1.5-1.5-3-3.2-3-5.5a5.5 5.5 0 0 1 2.747-4.761" />
		<path d="m2 2 20 20" />
	</svg>
);

const ThumbDown = () => (
	<svg width="24" height="24" viewBox="0 0 24 24" fill="none">
		<path d="M10 14H5a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2h5l1-4 6 8v6a2 2 0 0 1-2 2h-4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
	</svg>
);

const Maximize = () => (
	<svg width="24" height="24" viewBox="0 0 24 24" fill="none">
		<path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
	</svg>
);

// Rounded Play Icon
const PlayIcon = ({ width = 56, height = 56 }) => (
	<svg width={width} height={height} viewBox="0 0 24 24" fill="#000" xmlns="http://www.w3.org/2000/svg">
		<path d="M5 3.868v16.264c0 .878.966 1.41 1.71.948l13.011-8.132a1.12 1.12 0 0 0 0-1.896L6.71 2.92C5.966 2.458 5 2.99 5 3.868z" />
	</svg>
);

// NEW: Pause icon for overlay when playing
const PauseIcon = ({ width = 56, height = 56 }) => (
	<svg width={width} height={height} viewBox="0 0 24 24" fill="#000" xmlns="http://www.w3.org/2000/svg">
		<rect x="6" y="4" width="4" height="16" rx="1" />
		<rect x="14" y="4" width="4" height="16" rx="1" />
	</svg>
);

// Tip (dollar) icon
const TipIcon = () => (
	<svg width="24" height="24" viewBox="0 0 24 24" fill="none">
		<circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="1.5" />
		<path d="M12 8v8M10 9.5h4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
	</svg>
);

// Add small rewind/forward icons (place near other small icons)
const RewindIcon = () => (
	<svg width="18" height="18" viewBox="0 0 24 24" fill="none" className="mr-2">
		<path d="M11.5 12L20 18V6L11.5 12Z" transform="scale(-1 1) translate(-31 0)" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" fill="none" />
		<path d="M6 6v12" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
	</svg>
);
const ForwardIcon = () => (
	<svg width="18" height="18" viewBox="0 0 24 24" fill="none" className="ml-2">
		<path d="M11.5 12L20 18V6L11.5 12Z" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" fill="none" />
		<path d="M6 6v12" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
	</svg>
);

const DollarSign = () => (
	<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
		<line x1="12" x2="12" y1="2" y2="22" />
		<path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
	</svg>
);

const EyeOff = () => (
	<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
		<path d="M10.733 5.076a10.744 10.744 0 0 1 11.205 6.575 1 1 0 0 1 0 .696 10.747 10.747 0 0 1-1.444 2.49" />
		<path d="M14.084 14.158a3 3 0 0 1-4.242-4.242" />
		<path d="M17.479 17.499a10.75 10.75 0 0 1-15.417-5.151 1 1 0 0 1 0-.696 10.75 10.75 0 0 1 4.446-5.143" />
		<path d="M2 2l20 20" />
	</svg>
);

const Repeat = () => (
	<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
		<path d="m17 2 4 4-4 4" />
		<path d="M3 11v-1a4 4 0 0 1 4-4h14" />
		<path d="m7 22-4-4 4-4" />
		<path d="M21 13v1a4 4 0 0 1-4 4H3" />
	</svg>
);

const PenLine = () => (
	<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
		<path d="M13 21h8" />
		<path d="M21.174 6.812a1 1 0 0 0-3.986-3.987L3.842 16.174a2 2 0 0 0-.5.83l-1.321 4.352a.5.5 0 0 0 .623.622l4.353-1.32a2 2 0 0 0 .83-.497z" />
	</svg>
);

// add Share / quick-action SVGs
const CopyIcon = () => (
	<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
		<path d="M8 7h10v10H8z" />
		<path d="M16 7v-2a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v8" />
	</svg>
);
const ShareViaIcon = () => (
	<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
		<path d="M4 12v7a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-7" />
		<path d="M16 6l-4-4-4 4" />
		<path d="M12 2v11" />
	</svg>
);
const QrIcon = () => (
	<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#6b7280" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
		<rect x="3" y="3" width="6" height="6" />
		<rect x="15" y="3" width="6" height="6" />
		<rect x="3" y="15" width="6" height="6" />
		<path d="M15 15h2v2h-2zM19 19h2v2h-2zM15 19h2v2h-2z" />
	</svg>
);
const DownloadIcon = () => (
	<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#6b7280" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
		<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
		<path d="M7 10l5 5 5-5" />
		<path d="M12 15V3" />
	</svg>
);

// Social icons (simple colored circles with glyph)
const SocialButton = ({ bg, children, label, onClick }) => (
	<button aria-label={label} onClick={onClick} className="flex flex-col items-center text-xs" type="button">
		<div style={{ background: bg }} className="w-12 h-12 rounded-full flex items-center justify-center mb-2">
			{children}
		</div>
		<div className="text-gray-300 text-xs">{label}</div>
	</button>
);

// Add missing ShareIcon used by the Options dialog
const ShareIcon = () => (
	<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
		<path d="M4 12v7a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-7" />
		<path d="M12 2v14" />
		<path d="M8 6l4-4 4 4" />
	</svg>
);

// Helper: parse a time string like "M:SS" or "H:MM:SS" into total seconds
const parseTimeToSeconds = (timeStr) => {
	if (!timeStr) return 0;
	const parts = String(timeStr).split(':').map(p => parseInt(p) || 0);
	if (parts.length === 3) return parts[0] * 3600 + parts[1] * 60 + parts[2]; // H:MM:SS
	if (parts.length === 2) return parts[0] * 60 + parts[1]; // M:SS
	if (parts.length === 1) return parts[0]; // just seconds
	return 0;
};

// Helper: extract YouTube video ID from URL
const extractYouTubeId = (url) => {
	if (!url) return '';
	if (url.includes('youtu.be/')) return url.split('youtu.be/')[1].split(/[?&#]/)[0];
	if (url.includes('youtube.com')) { try { return new URL(url).searchParams.get('v') || ''; } catch { return ''; } }
	return '';
};

// VideoCard component with dynamic duration and thumbnail loading
const VideoCard = ({ item, idx, filtered, onVideoClick, setToastMessage, toastTimerRef, sharePopoverFor, setSharePopoverFor, accentColor, accentText, makeShareLink, copyToClipboard, setShowShareModal, videoRef }) => {
	const [loadedDuration, setLoadedDuration] = useState(0);
	const [thumbnail, setThumbnail] = useState(item.thumbnail || item.imageUrl);

	// Helper: detect YouTube URLs
	const isYTUrl = (url) => url && (url.includes('youtube.com') || url.includes('youtu.be'));

	// Load video metadata from item's URL (skip for YouTube URLs — native <video> can't play them)
	useEffect(() => {
		let cancelled = false;
		
		const videoUrl = item.url || item.videoUrl;
		if (!videoUrl) return;

		// YouTube URLs can't be loaded by <video> element — parse duration from item.time / item.duration
		if (isYTUrl(videoUrl)) {
			// Try parsing item.time string ("M:SS" or "H:MM:SS")
			const fromTime = parseTimeToSeconds(item.time);
			// Also try item.duration if it's already a number
			const fromDuration = (typeof item.duration === 'number' && item.duration > 0) ? item.duration : 0;
			const parsed = fromDuration || fromTime;
			if (parsed > 0) {
				setLoadedDuration(parsed);
			}

			// Set YouTube thumbnail if none provided
			const ytId = extractYouTubeId(videoUrl);
			if (ytId && !thumbnail) {
				setThumbnail(`https://img.youtube.com/vi/${ytId}/mqdefault.jpg`);
			}

			// Try fetching duration from YouTube noembed if we don't have it yet
			if (parsed <= 0 && ytId) {
				fetch(`https://noembed.com/embed?url=https://www.youtube.com/watch?v=${ytId}`)
					.then(r => r.json())
					.then(data => {
						if (!cancelled && data && data.duration) {
							const secs = parseTimeToSeconds(String(data.duration));
							if (secs > 0) setLoadedDuration(secs);
						}
					})
					.catch(() => { /* ignore */ });
			}
			return;
		}

		try {
			const video = document.createElement('video');
			video.preload = 'metadata';
			video.crossOrigin = 'anonymous';
			
			const handleLoadedMetadata = () => {
				if (!cancelled && video.duration && !isNaN(video.duration)) {
					setLoadedDuration(Math.round(video.duration));
				}
			};

			video.addEventListener('loadedmetadata', handleLoadedMetadata, { once: true });
			video.src = resolveMediaUrl(videoUrl);
			video.load();

			// Timeout after 5 seconds
			const timeoutId = setTimeout(() => {
				if (!cancelled) {
					video.pause();
					video.src = '';
				}
			}, 5000);

			return () => {
				cancelled = true;
				clearTimeout(timeoutId);
				video.pause();
				video.src = '';
			};
		} catch (e) {
			// ignore errors
		}
	}, [item.url, item.videoUrl]);

	return (
		<div key={item.id} onClick={onVideoClick}
			role="button" tabIndex={0} style={{ display: "flex", gap: 12, alignItems: "flex-start", background: "#fff", padding: 10, borderRadius: 12, border: "1px solid rgba(0,0,0,0.04)", cursor: 'pointer', transition: 'all 200ms ease' }} onMouseEnter={(e) => e.currentTarget.style.background = '#f9f9f9'} onMouseLeave={(e) => e.currentTarget.style.background = '#fff'}>
			<div className="w-28 h-16 rounded-md relative overflow-hidden flex-shrink-0" style={{ background: thumbnail ? `url(${encodeURI(thumbnail)}) center/cover no-repeat` : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', backgroundColor: '#667eea' }}>
				<div className="absolute right-2 bottom-1 bg-black/70 text-white text-xs px-2 py-0.5 rounded">{(() => { const raw = item.duration || loadedDuration || 0; const s = (typeof raw === 'number' && raw > 0) ? raw : parseTimeToSeconds(item.time); return `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, '0')}` })()}</div>
			</div>
			<div style={{ flex: 1 }}>
				<div style={{ fontWeight: 700, lineHeight: '1.3' }}>{item.title}</div>
				<div style={{ fontSize: 12, color: '#6b7280', marginTop: 6 }}>{item.creator} {item.tags && item.tags[0] ? <span style={{ background: '#e6f2ff', color: '#2563eb', padding: '2px 6px', borderRadius: 8, marginLeft: 8, fontSize: 11 }}>{item.tags[0]}</span> : null}</div>
			</div>
		</div>
	);
};

// BottomAdPreviewBar Component - renders animated bottom ad with text rotation
function BottomAdPreviewBar({ profileName, profileAvatar, textItems, textInterval, textAnimation, cardAnimation, cardEffect, link, borderColor, cardExitAnimation, duration }) {
	const [currentTextIndex, setCurrentTextIndex] = useState(0);
	const [isCardVisible, setIsCardVisible] = useState(true);

	// Debug: log the ad data
	useEffect(() => {
		console.log('BottomAdPreviewBar received:', {
			profileName,
			textItems,
			textItemsLength: textItems?.length,
			textAnimation,
			cardAnimation,
			cardEffect,
			borderColor,
			cardExitAnimation,
			duration
		});
	}, [profileName, textItems, textAnimation, cardAnimation, cardEffect, borderColor, cardExitAnimation, duration]);

	// Rotate text items at specified interval
	useEffect(() => {
		if (!textItems || textItems.length === 0) return;
		if (textItems.length === 1) return; // No rotation if only one item

		const interval = setInterval(() => {
			setCurrentTextIndex(prev => (prev + 1) % textItems.length);
		}, textInterval || 5000);

		return () => clearInterval(interval);
	}, [textItems, textInterval]);

	const getTextAnimation = () => {
		const animations = {
			fade: 'fadeInText 0.5s ease-in-out',
			slideLeft: 'slideLeftText 0.5s ease-in-out',
			slideRight: 'slideRightText 0.5s ease-in-out',
			bounce: 'bounceText 0.5s ease-in-out',
			scale: 'scaleText 0.5s ease-in-out'
		};
		return animations[textAnimation] || animations.fade;
	};

	const getCardAnimation = () => {
		const animations = {
			fade: 'fadeInCard 0.5s ease-in-out',
			lineFirst: 'linefirstCard 0.6s ease-in-out',
			slideDown: 'slideDownCard 0.5s ease-in-out',
			bounceIn: 'bounceInCard 0.6s ease-in-out',
			scaleUp: 'scaleUpCard 0.5s ease-in-out'
		};
		
		let baseAnimation = animations[cardAnimation] || animations.fade;
		
		// If card effect exists and is not 'none', chain it after card entry (0.5s delay)
		if (cardEffect && cardEffect !== 'none') {
			const effectDurations = {
				pulse: '2s',
				shake: '2s',
				glow: '2s',
				float: '2s',
				rotate: '2s'
			};
			const effectDuration = effectDurations[cardEffect] || '2s';
			baseAnimation = `${baseAnimation}, ${cardEffect} ${effectDuration} ease-in-out 0.5s infinite`;
		}
		
		// Add exit animation if specified - use actual duration, default to 30s
		if (cardExitAnimation && cardExitAnimation !== 'none') {
			const exitAnimations = {
				fadeOut: 'fadeOut',
				slideOut: 'slideOut',
				scaleDown: 'scaleDown',
				bounceOut: 'bounceOut',
				rotateOut: 'rotateOut'
			};
			const exitAnimName = exitAnimations[cardExitAnimation] || 'fadeOut';
			const adDuration = duration || 30; // Use actual ad duration, default 30s
			baseAnimation = `${baseAnimation}, ${exitAnimName} 0.5s ease-in-out ${adDuration}s forwards`;
		}
		
		return baseAnimation;
	};

	const textAnimationStyle = getTextAnimation();
	const cardAnimationStyle = getCardAnimation();
	
	// Handle textItems in multiple formats: array of strings or array of objects with text property
	let currentText = '';
	if (textItems && textItems.length > 0) {
		const item = textItems[currentTextIndex];
		if (typeof item === 'string') {
			currentText = item;
		} else if (item && typeof item === 'object') {
			currentText = item.text || item.content || '';
		}
	}

	return (
		<div
			style={{
				animation: cardAnimationStyle,
				display: 'flex',
				alignItems: 'center',
				gap: '12px',
				backgroundColor: 'rgba(255, 255, 255, 0.12)',
				borderRadius: '8px',
				padding: '12px 14px',
				minWidth: '280px',
				flex: '0 0 auto',
				borderTop: `2px solid ${borderColor || 'rgba(255, 255, 255, 0.2)'}`,
				border: '1.5px solid rgba(255, 255, 255, 0.25)',
				cursor: link ? 'pointer' : 'default',
				transition: 'all 200ms ease',
				opacity: 1,
				position: 'relative'
			}}
			onClick={() => {
				if (link) window.open(link, '_blank');
			}}
		>
			{/* Ad Avatar/Logo */}
			<div
				style={{
					width: '52px',
					height: '52px',
					borderRadius: '6px',
					backgroundColor: '#333',
					flexShrink: 0,
					border: '1px solid rgba(255, 255, 255, 0.1)',
					overflow: 'hidden',
					display: 'flex',
					alignItems: 'center',
					justifyContent: 'center',
				}}
			>
				{profileAvatar ? (
					<img
						src={profileAvatar}
						alt=""
						style={{
							width: '100%',
							height: '100%',
							objectFit: 'cover',
							display: 'block',
						}}
						onError={(e) => { e.target.style.display = 'none'; }}
					/>
				) : (
					<span style={{ fontSize: '20px', opacity: 0.5 }}>📷</span>
				)}
			</div>

			{/* Ad Content */}
			<div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: '6px' }}>
				{/* Ad Name */}
				<div
					style={{
						fontSize: '13px',
						fontWeight: '600',
						color: '#ffffff',
						whiteSpace: 'nowrap',
						overflow: 'hidden',
						textOverflow: 'ellipsis'
					}}
				>
					{profileName || 'Sponsored'}
				</div>
				{/* Ad Text with animation */}
				<div
					key={currentTextIndex}
					style={{
						fontSize: '12px',
						color: 'rgba(255, 255, 255, 0.75)',
						whiteSpace: 'nowrap',
						overflow: 'hidden',
						textOverflow: 'ellipsis',
						lineHeight: '1.2',
						animation: textAnimationStyle,
						minHeight: '16px'
					}}
				>
					{currentText || 'Check out our offer'}
				</div>
			</div>

			{/* CTA Arrow */}
			<div
				style={{
					color: 'rgba(255, 255, 255, 0.7)',
					fontSize: '18px',
					flexShrink: 0,
					display: 'flex',
					alignItems: 'center'
				}}
			>
				→
			</div>
		</div>
	);
}

// --- Main Component ---

export default function MobileVideoPlayer({ discoverItems = null, initialVideo: initialVideoProp = null, onChevronDown = null } = {}) {

	const selectedLanguage = typeof window !== 'undefined' ? (localStorage.getItem('regaarder_language') || 'English') : 'English';
	const auth = useAuth();

	const { accentColor: themeAccentColor } = useTheme(); // Get theme accent color
	const [searchParams] = useSearchParams();
	const location = useLocation();

	// Merge initialVideo from prop OR from location.state (web route navigation)
	const initialVideo = initialVideoProp || (location && location.state && location.state.video) || null;
	
	// Helper function to get max allowed quality based on subscription tier
	const getMaxAllowedQuality = () => {
		try {
			// Check if user has pro subscription
			if (auth && auth.user && auth.user.subscription) {
				const sub = auth.user.subscription;
				// Check for "1440p" or "2160p" quality addons
				const hasHighQuality = auth.user.alaCarteAddons?.includes('Video Quality - Up to 2160p (4K)');
				const has1440p = auth.user.alaCarteAddons?.includes('Video Quality - Up to 1440p');
				
				// Pro users get 1080p by default
				if (sub.tier === 'pro' || sub.tier === 'Pro' || sub.tier === 'Pro Creator') {
					if (hasHighQuality) return '2160p'; // 4K addon
					if (has1440p) return '1440p'; // 1440p addon
					return '1080p'; // Pro default
				}
			}
			// Free/Starter users limited to 360p, but addons can upgrade
			const has1440p = auth?.user?.alaCarteAddons?.includes('Video Quality - Up to 1440p');
			const has4k = auth?.user?.alaCarteAddons?.includes('Video Quality - Up to 2160p (4K)');
			
			if (has4k) return '2160p';
			if (has1440p) return '1440p';
			return '360p'; // Free/Starter default
		} catch (e) {
			return '360p'; // Fallback to 360p for safety
		}
	};

	// Helper function to check if user has a paid plan
	const hasPaidPlan = () => {
		try {
			if (!auth || !auth.user) return false;
			// Check if user has any paid subscription tier
			if (auth.user.subscription) {
				const sub = auth.user.subscription;
				const paidTiers = ['pro', 'Pro', 'Pro Creator', 'premium', 'Premium', 'creator', 'Creator'];
				return paidTiers.includes(sub.tier) || (sub.isActive && sub.tier && sub.tier !== 'free' && sub.tier !== 'Free');
			}
			// Also check if user has userPlan from subscriptions page
			if (auth.user.userPlan && auth.user.userPlan.tier) {
				const paidTiers = ['pro', 'Pro', 'Pro Creator', 'premium', 'Premium', 'creator', 'Creator'];
				return paidTiers.includes(auth.user.userPlan.tier) || (auth.user.userPlan.isActive && auth.user.userPlan.tier !== 'free' && auth.user.userPlan.tier !== 'Free');
			}
			return false;
		} catch (e) {
			return false;
		}
	};
	
	const containerRef = useRef(null);
	const [showMenu, setShowMenu] = useState(false);
	const [showQualityDropdown, setShowQualityDropdown] = useState(false);
	const [locked, setLocked] = useState(false); // NEW: lock toggle state
	const [showLockToast, setShowLockToast] = useState(false); // transient toast
	const [showLockVisual, setShowLockVisual] = useState(false); // transient visual inside circle
	// pulsating state used for lock button animation (was referenced but not declared)
	const [pulsating, setPulsating] = useState(false);

	// Brighten lock briefly when user taps while locked (non-blocking hint)
	const [brightLock, setBrightLock] = useState(false);
	const brightLockTimerRef = useRef(null);

	// Local video info state (was missing causing ReferenceError)
	const [videoInfo, setVideoInfo] = useState(initialVideo || null);

	// Feedback modal is disabled - not showing to users

	// Initialize videoUrl immediately from initialVideo prop (avoid blank first frame)
	const [videoUrl, setVideoUrl] = useState(() => {
		if (initialVideo) {
			const u = initialVideo.videoUrl || initialVideo.url || initialVideo.src || '';
			if (!u) return '';
			// Don't run resolveMediaUrl on YouTube URLs — they are external
			if (u.includes('youtube.com') || u.includes('youtu.be')) return u;
			return resolveMediaUrl(u);
		}
		return '';
	});
	// YouTube URL detection helpers (reused from OverlayAdPlayer)
	const isYouTubeUrl = (url) => url && (url.includes('youtube.com') || url.includes('youtu.be'));
	const getYouTubeVideoId = (url) => {
		if (!url) return '';
		if (url.includes('youtu.be/')) return url.split('youtu.be/')[1].split(/[?&#]/)[0];
		if (url.includes('youtube.com')) { try { return new URL(url).searchParams.get('v') || ''; } catch { return ''; } }
		return '';
	};

	// Track whether the current video is a YouTube embed
	const [isYouTubeVideo, setIsYouTubeVideo] = useState(() => {
		if (initialVideo) {
			const u = initialVideo.videoUrl || initialVideo.url || initialVideo.src || '';
			return isYouTubeUrl(u);
		}
		return false;
	});
	const [youTubeId, setYouTubeId] = useState(() => {
		if (initialVideo) {
			const u = initialVideo.videoUrl || initialVideo.url || initialVideo.src || '';
			return getYouTubeVideoId(u);
		}
		return '';
	});
	const ytIframeRef = useRef(null);
	const [ytLoaded, setYtLoaded] = useState(false); // true once YouTube reports playerState=1 (playing)

	// Track current video metadata so dialogs (Report, Share, etc.) reflect the active media
	const [videoTitle, setVideoTitle] = useState(() => (initialVideo && initialVideo.title) || "");
	const [creatorName, setCreatorName] = useState(() => (initialVideo && initialVideo.author) || "");
	const [notes, setNotes] = useState([]);
	const [noteText, setNoteText] = useState("");
	const [linkNoteTimestamp, setLinkNoteTimestamp] = useState(true);

	// Load video from localStorage quick_load (set by home.jsx when clicking a video card)
	useEffect(() => {
		try {
			const quickLoadData = localStorage.getItem('videoplayer_quick_load');
			if (quickLoadData) {
				const data = JSON.parse(quickLoadData);
				if (data.url) {
					// Check if the URL is a YouTube link
					if (isYouTubeUrl(data.url)) {
						setIsYouTubeVideo(true);
						setYouTubeId(getYouTubeVideoId(data.url));
						setVideoUrl(data.url); // keep raw URL for reference
					} else {
						setIsYouTubeVideo(false);
						setYouTubeId('');
						setVideoUrl(resolveMediaUrl(data.url));
					}
					if (data.title) setVideoTitle(data.title);
					if (data.creator) setCreatorName(data.creator);
					if (data.creatorName) setCreatorName(data.creatorName);
					// Parse duration from quick_load data.time if available
					if (data.time) {
						const parts = (data.time || '').split(':');
						if (parts.length === 2) {
							const secs = (parseInt(parts[0]) || 0) * 60 + (parseInt(parts[1]) || 0);
							if (secs > 0) setDuration(secs);
						}
					}
				}
				// Clear after loading so it doesn't persist
				localStorage.removeItem('videoplayer_quick_load');
			}
		} catch (err) {
			console.error('Failed to load quick video data:', err);
		}
	}, []);

	// Persistent preference helpers (define early so usePref can be used below)
	const prefKey = (k) => `vx:pref:${k}`;
	const readPref = (key, defaultVal) => {
		try {
			const raw = localStorage.getItem(prefKey(key));
			if (raw === null) return defaultVal;
			return JSON.parse(raw);
		} catch (e) { return defaultVal; }
	};

	// NOTE: confetti removed — celebration visual was removed to simplify UI.
	const writePref = (key, value) => { try { localStorage.setItem(prefKey(key), JSON.stringify(value)); } catch (e) { } };
	const usePref = (key, defaultVal) => {
		const k = key;
		const [val, setVal] = useState(() => readPref(k, defaultVal));
		useEffect(() => { writePref(k, val); }, [k, val]);
		return [val, setVal];
	};

	// NEW: error toast when trying to interact while locked
	const [showLockedError, setShowLockedError] = useState(false);
	const lockedErrorTimerRef = useRef(null);

	// timer ref for the transient lock-button pulsation (4s)
	const pulseTimerRef = useRef(null);

	// NEW: state for heart/like button
	const [liked, setLiked] = useState(false);
	const [disliked, setDisliked] = useState(false); // Make sure this is declared if not already
	const tapTimerRef = useRef(null); // NEW: ref for double-tap timer

	// Heart explosion particles state for double-tap like animation
	const [heartExplosions, setHeartExplosions] = useState([]);

	// Sync Like/Dislike state from backend on video load
	useEffect(() => {
		if (!videoInfo) return;
		const vidId = videoInfo.id || videoInfo.src || videoInfo.url || videoTitle || null;
		if (!vidId) return;

		const checkState = async () => {
			try {
				// Check local storage for likes (fast cache)
				try {
					const raw = localStorage.getItem('likedVideos');
					if (raw) {
						const arr = JSON.parse(raw);
						if (arr.some(x => String(x.videoId) === String(vidId))) setLiked(true);
					}
				} catch { }

				const token = localStorage.getItem('regaarder_token');
				if (!token) return;
				const BACKEND = (window && window.__BACKEND_URL__) || `${window.location.protocol}//${window.location.hostname}:4000`;

				// Fetch like/dislike status
				const res = await fetch(`${BACKEND}/likes/status?videoId=${encodeURIComponent(vidId)}`, {
					headers: { 'Authorization': `Bearer ${token}` }
				});
				if (res.ok) {
					const data = await res.json();
					if (typeof data.liked === 'boolean') setLiked(data.liked);
					if (typeof data.disliked === 'boolean') setDisliked(data.disliked);
				}
			} catch (e) { }
		};
		checkState();
	}, [videoInfo, videoTitle]);

	// Handle lock/unlock button press -> perform explicit lock/unlock flows
	const handleLockPress = (e) => {
		// prevent the tap from bubbling to the video area (safe when called without an event)
		try { e?.stopPropagation?.(); } catch { }

		if (locked) {
			// UNLOCK: reverse locking effects immediately
			setLocked(false);
			setShowLockedError(false);
			// clear any pending locked-error timer
			if (lockedErrorTimerRef.current) {
				clearTimeout(lockedErrorTimerRef.current);
				lockedErrorTimerRef.current = null;
			}
			// clear any pending pulse timer
			if (pulseTimerRef.current) {
				clearTimeout(pulseTimerRef.current);
				pulseTimerRef.current = null;
			}
			// stop pulsation and visual states (useEffect also ensures these)
			setPulsating(false);
			setShowLockToast(false);
			setShowLockVisual(false);
			// bring controls back (do not auto-hide)
			setControlsVisible(true);
		} else {
			// LOCK: enable locked state (existing useEffect shows toast/visual)
			setLocked(true);
			// make controls visible immediately (do not auto-hide)
			setControlsVisible(true);
		}
	};

	// --- existing state ---
	const [controlsVisible, setControlsVisible] = useState(true);
	// center play/pause overlay visibility (fades independently)
	const [centerVisible, setCenterVisible] = useState(true);
	const centerHideTimerRef = useRef(null);
	const seekBy = (sec) => {
		// YouTube videos: use postMessage seekTo command
		if (isYouTubeVideo && ytIframeRef.current && duration > 0) {
			try {
				const curTime = progress * duration;
				const next = Math.max(0, Math.min(duration, curTime + sec));
				ytIframeRef.current.contentWindow.postMessage(JSON.stringify({ event: 'command', func: 'seekTo', args: [next, true] }), '*');
				setProgress(next / duration);
				// Update interpolation refs so smooth tracking resumes from new position
				ytLastKnownTime.current = next;
				ytLastKnownTimestamp.current = Date.now();
			} catch { /* noop */ }
			return;
		}
		const v = videoRef.current;
		if (v && typeof v.currentTime === "number" && v.duration) {
			const next = Math.max(0, Math.min(v.duration, (v.currentTime || 0) + sec));
			try { v.currentTime = next; } catch { /* noop */ }
		}
	};
	const [progress, setProgress] = useState(0.05); // 0..1
	const barRef = useRef(null);
	const draggingRef = useRef(false);
	const [progressDragging, setProgressDragging] = useState(false);
	const videoRef = useRef(null);
	const [videoMountTick, setVideoMountTick] = useState(0);
	const [isPlaying, setIsPlaying] = useState(false);
	const [isInPiPMode, setIsInPiPMode] = useState(false);
	const [duration, setDuration] = useState(0);
	const handleVideoEndedRef = useRef(null); // kept in sync below so YT message listener can call it

	// For YouTube videos, initialize duration from video metadata since <video> onLoadedMetadata won't fire
	useEffect(() => {
		if (isYouTubeVideo && duration === 0) {
			// Try initialVideo.duration (numeric seconds) first
			if (initialVideo && initialVideo.duration && initialVideo.duration > 0) {
				setDuration(initialVideo.duration);
			}
			// Try initialVideo.time (string "M:SS") as fallback
			else if (initialVideo && initialVideo.time) {
				const parts = (initialVideo.time || '').split(':');
				if (parts.length === 2) {
					const secs = (parseInt(parts[0]) || 0) * 60 + (parseInt(parts[1]) || 0);
					if (secs > 0) setDuration(secs);
				}
			}
		}
	}, [isYouTubeVideo, initialVideo]);

	// YouTube IFrame API: listen for postMessage events to extract duration, currentTime, and play state
	useEffect(() => {
		if (!isYouTubeVideo || !youTubeId) return;

		// Reset loading cover for new YouTube video
		setYtLoaded(false);

		// Fallback: mark as playing/loaded after delay in case postMessage doesn't fire
		const fallbackTimer = setTimeout(() => { setIsPlaying(true); setYtLoaded(true); }, 2000);

		const handleYTMessage = (e) => {
			try {
				// YouTube sends stringified JSON via postMessage
				if (typeof e.data !== 'string') return;
				const data = JSON.parse(e.data);

				// infoDelivery events carry currentTime, duration, playerState, etc.
				if (data.event === 'infoDelivery' && data.info) {
					const info = data.info;
					// Extract duration — always accept a valid duration from YouTube
					if (info.duration && info.duration > 0) {
						setDuration(prev => {
							if (prev !== info.duration) {
								// Cache YouTube duration in localStorage so home feed cards can display it
								try { if (youTubeId) localStorage.setItem(`yt_dur_${youTubeId}`, String(Math.floor(info.duration))); } catch { }
								return info.duration;
							}
							return prev;
						});
					}
					// Track currentTime for progress bar + feed interpolation refs
					if (typeof info.currentTime === 'number' && info.currentTime >= 0) {
						const dur = info.duration || duration;
						ytLastKnownTime.current = info.currentTime;
						ytLastKnownTimestamp.current = Date.now();
						if (dur > 0 && !draggingRef.current) {
							setProgress(info.currentTime / dur);
						}
					}
					// Track player state (1=playing, 2=paused, 0=ended)
					if (typeof info.playerState === 'number') {
						if (info.playerState === 1) { setIsPlaying(true); setYtLoaded(true); }
						else if (info.playerState === 2) setIsPlaying(false);
						else if (info.playerState === 0 && !hadOverlayAdRef.current) {
							// YouTube video ended
							try {
								const cw = ytIframeRef.current && ytIframeRef.current.contentWindow;
								if (cw) {
									cw.postMessage(JSON.stringify({ event: 'command', func: 'seekTo', args: [0, true] }), '*');
									// If loop is on, restart; otherwise pause
									const shouldLoop = !!JSON.parse(localStorage.getItem('loopVideo') || 'false');
									if (shouldLoop) {
										cw.postMessage(JSON.stringify({ event: 'command', func: 'playVideo' }), '*');
										setIsPlaying(true);
									} else {
										cw.postMessage(JSON.stringify({ event: 'command', func: 'pauseVideo' }), '*');
										setIsPlaying(false);
										if (typeof handleVideoEndedRef.current === 'function') handleVideoEndedRef.current();
									}
								}
							} catch { setIsPlaying(false); }
						}
					}
				}

				// onStateChange event also carries player state
				if (data.event === 'onStateChange' && typeof data.info === 'number') {
					if (data.info === 1) { setIsPlaying(true); setYtLoaded(true); }
					else if (data.info === 2) setIsPlaying(false);
					else if (data.info === 0 && !hadOverlayAdRef.current) {
						// YouTube video ended (onStateChange variant)
						try {
							const cw = ytIframeRef.current && ytIframeRef.current.contentWindow;
							if (cw) {
								cw.postMessage(JSON.stringify({ event: 'command', func: 'seekTo', args: [0, true] }), '*');
								const shouldLoop = !!JSON.parse(localStorage.getItem('loopVideo') || 'false');
								if (shouldLoop) {
									cw.postMessage(JSON.stringify({ event: 'command', func: 'playVideo' }), '*');
									setIsPlaying(true);
								} else {
									cw.postMessage(JSON.stringify({ event: 'command', func: 'pauseVideo' }), '*');
									setIsPlaying(false);
									if (typeof handleVideoEndedRef.current === 'function') handleVideoEndedRef.current();
								}
							}
						} catch { setIsPlaying(false); }
					}
				}
			} catch { /* ignore non-YouTube messages */ }
		};

		window.addEventListener('message', handleYTMessage);

		// Tell YouTube iframe we are listening (triggers infoDelivery events)
		const sendListening = () => {
			try {
				if (ytIframeRef.current && ytIframeRef.current.contentWindow) {
					ytIframeRef.current.contentWindow.postMessage(JSON.stringify({ event: 'listening' }), '*');
				}
			} catch { }
		};
		// Unmute and set full volume so device volume controls work
		const sendUnmute = () => {
			try {
				// Skip if overlay ad is active — ad has its own audio
				if (hadOverlayAdRef.current) return;
				if (ytIframeRef.current && ytIframeRef.current.contentWindow) {
					ytIframeRef.current.contentWindow.postMessage(JSON.stringify({ event: 'command', func: 'unMute' }), '*');
					ytIframeRef.current.contentWindow.postMessage(JSON.stringify({ event: 'command', func: 'setVolume', args: [100] }), '*');
				}
			} catch { }
		};
		// Explicit playVideo command to guarantee playback starts (backup for autoplay)
		const sendPlay = () => {
			try {
				// Skip if overlay ad is active — main video should stay paused
				if (hadOverlayAdRef.current) return;
				if (ytIframeRef.current && ytIframeRef.current.contentWindow) {
					ytIframeRef.current.contentWindow.postMessage(JSON.stringify({ event: 'command', func: 'playVideo' }), '*');
				}
			} catch { }
		};
		// Send multiple times as iframe takes a moment to initialize
		const t1 = setTimeout(sendListening, 500);
		const t2 = setTimeout(sendListening, 1500);
		const t3 = setTimeout(sendListening, 3000);
		// Keep sending 'listening' periodically so YouTube continues to deliver infoDelivery events
		const listeningInterval = setInterval(sendListening, 1000);
		// Play + unmute after iframe is likely ready
		const t4 = setTimeout(() => { sendPlay(); sendUnmute(); }, 800);
		const t5 = setTimeout(() => { sendPlay(); sendUnmute(); }, 2000);
		const t6 = setTimeout(() => { sendPlay(); sendUnmute(); }, 3500);

		// If we have a start time from URL param, seek YouTube iframe via postMessage as backup
		const seekTimers = [];
		if (ytStartTime > 0) {
			const sendSeek = () => {
				try {
					if (ytIframeRef.current && ytIframeRef.current.contentWindow) {
						ytIframeRef.current.contentWindow.postMessage(
							JSON.stringify({ event: 'command', func: 'seekTo', args: [ytStartTime, true] }), '*'
						);
						// Also set progress and interpolation refs
						ytLastKnownTime.current = ytStartTime;
						ytLastKnownTimestamp.current = Date.now();
						setProgress(duration > 0 ? ytStartTime / duration : 0);
					}
				} catch { }
			};
			seekTimers.push(setTimeout(sendSeek, 1200));
			seekTimers.push(setTimeout(sendSeek, 2500));
			seekTimers.push(setTimeout(sendSeek, 4000));
		}

		return () => {
			clearTimeout(fallbackTimer);
			clearTimeout(t1);
			clearTimeout(t2);
			clearTimeout(t3);
			clearInterval(listeningInterval);
			clearTimeout(t4);
			clearTimeout(t5);
			clearTimeout(t6);
			seekTimers.forEach(t => clearTimeout(t));
			window.removeEventListener('message', handleYTMessage);
		};
	}, [isYouTubeVideo, youTubeId]);

	// YouTube progress interpolation: smoothly increment progress between infoDelivery events
	const ytLastKnownTime = useRef(0);
	const ytLastKnownTimestamp = useRef(Date.now());
	const ytIsPlayingRef = useRef(false);

	// Keep playing ref in sync
	useEffect(() => { ytIsPlayingRef.current = isPlaying; }, [isPlaying]);

	useEffect(() => {
		if (!isYouTubeVideo || !youTubeId) return;
		const interpolate = () => {
			if (!ytIsPlayingRef.current || draggingRef.current || duration <= 0) return;
			const now = Date.now();
			const elapsed = (now - ytLastKnownTimestamp.current) / 1000;
			const estimated = ytLastKnownTime.current + elapsed;
			if (estimated >= 0 && estimated <= duration) {
				setProgress(estimated / duration);
			}
		};
		const iv = setInterval(interpolate, 250);
		return () => clearInterval(iv);
	}, [isYouTubeVideo, youTubeId, duration]);

	// Safety watchdog: if videoUrl is a YouTube URL but isYouTubeVideo is false, auto-correct
	useEffect(() => {
		if (videoUrl && isYouTubeUrl(videoUrl) && !isYouTubeVideo) {
			setIsYouTubeVideo(true);
			const id = getYouTubeVideoId(videoUrl);
			if (id) setYouTubeId(id);
		}
	}, [videoUrl, isYouTubeVideo]);

	// Force video element to load when videoUrl changes (Android WebView may not
	// auto-load when React updates the src attribute via re-render)
	useEffect(() => {
		if (!videoUrl || isYouTubeVideo) return;
		const v = videoRef.current;
		if (!v) return;
		// Give React one frame to commit the new src attribute to the DOM
		const t = setTimeout(() => {
			try {
				if (v.readyState === 0 && videoUrl) {
					v.load();
				}
			} catch { }
		}, 50);
		return () => clearTimeout(t);
	}, [videoUrl, isYouTubeVideo]);

	// NEW: Video overlays (links/images) that appear at specific times
	const [videoOverlays, setVideoOverlays] = useState([]);
	const [visibleOverlays, setVisibleOverlays] = useState([]);

	// Ensure autoplay retries after the video element is mounted
	useLayoutEffect(() => {
		try {
			if (videoRef.current) setVideoMountTick((t) => t + 1);
		} catch { }
	}, []);

	// Bump mount tick on source changes so autoplay hooks re-run
	useEffect(() => {
		try {
			if (videoRef.current) setVideoMountTick((t) => t + 1);
		} catch { }
	}, [videoUrl]);

	// NEW: Video ads (bottom panel ads that appear at specific times)
	// Initialize with test ads so they show immediately
	const defaultTestAds = [
		{
			id: 'test-ad-1',
			type: 'bottom',
			profileName: 'Tesla Motors',
			profileAvatar: 'https://upload.wikimedia.org/wikipedia/commons/thumb/b/bb/Tesla_T_symbol.svg/200px-Tesla_T_symbol.svg.png',
			text: 'Order your New car now!',
			link: 'https://www.tesla.com',
			startTime: 0,
			duration: 99999
		},
		{
			id: 'test-ad-2',
			type: 'bottom',
			profileName: 'Nike',
			profileAvatar: 'https://upload.wikimedia.org/wikipedia/commons/thumb/a/a6/Logo_NIKE.svg/200px-Logo_NIKE.svg.png',
			text: 'Just Do It - Shop Now',
			link: 'https://www.nike.com',
			startTime: 0,
			duration: 99999
		},
		{
			id: 'test-ad-video-1',
			type: 'video',
			videoAdTitle: 'Premium Tech Gadget',
			videoAdCtaText: 'Discover Now',
			videoAdCtaColor: '#0b74de',
			videoAdLink: 'https://example.com',
			startTime: 5,
			duration: 30
		},
		{
			id: 'test-ad-default2-1',
			type: 'default2',
			default2Title: 'Exclusive Deal',
			default2Description: 'Get 50% off today only',
			default2BgColor: '#ffffff',
			default2TextColor: '#111827',
			default2LineColor: '#d946ef',
			default2Logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/2/2f/Google_2015_logo.svg/100px-Google_2015_logo.svg.png',
			default2Link: 'https://example.com',
			startTime: 10,
			duration: 30
		},
		{
			id: 'test-ad-overlay-1',
			type: 'overlay',
			overlayAdCompanyName: 'Breaking News',
			overlayAdEmoji: '🔥',
			overlayAdBgColor: '#E41E24',
			overlayAdTextColor: '#ffffff',
			overlayAdPosition: 'bottom',
			overlayTextAnimation: 'marquee',
			overlayAdOpacity: 0.95,
			overlayAdText: 'Live Updates: 🎬 Check out our latest announcement now!',
			link: 'https://example.com',
			startTime: 15,
			duration: 30
		}
	];
	const [videoAds, setVideoAds] = useState([]);
	const [visibleAds, setVisibleAds] = useState([]);
	const dismissedAdIdsRef = useRef(new Set());
	const adTimersRef = useRef(new Set()); // tracks ads that already have auto-dismiss timers

	// Called by VideoAdOverlay when user closes an ad — removes it from visibleAds
	// and prevents the timeupdate handler from re-adding it
	const handleAdDismiss = useCallback((adId) => {
		dismissedAdIdsRef.current.add(adId);
		setVisibleAds(prev => prev.filter(a => a.id !== adId));
	}, []);

	// ── Pause & mute main video while overlay ads are active, resume after ──
	const wasPlayingBeforeAdRef = useRef(false);
	const wasMainMutedBeforeAdRef = useRef(false);
	const hadOverlayAdRef = useRef(false);
	useEffect(() => {
		const hasOverlayAd = visibleAds && visibleAds.some(a => a.type === 'overlay');
		if (hasOverlayAd && !hadOverlayAdRef.current) {
			// Overlay ad just appeared — pause & mute main video
			hadOverlayAdRef.current = true;
			wasPlayingBeforeAdRef.current = isPlaying;
			// Pause + mute YouTube
			if (isYouTubeVideo && ytIframeRef.current) {
				try {
					ytIframeRef.current.contentWindow.postMessage(JSON.stringify({ event: 'command', func: 'pauseVideo' }), '*');
					ytIframeRef.current.contentWindow.postMessage(JSON.stringify({ event: 'command', func: 'mute' }), '*');
				} catch {}
			}
			// Pause + mute HTML5 video
			const v = videoRef.current;
			if (v) {
				wasMainMutedBeforeAdRef.current = v.muted;
				v.muted = true;
				try { v.pause(); } catch {}
			}
			setIsPlaying(false);
		} else if (!hasOverlayAd && hadOverlayAdRef.current) {
			// All overlay ads dismissed — always resume with sound
			hadOverlayAdRef.current = false;
			if (isYouTubeVideo && ytIframeRef.current) {
				// YouTube needs multiple attempts — iframe may need time after being paused
				const resumeYT = () => {
					try {
						if (ytIframeRef.current && ytIframeRef.current.contentWindow) {
							ytIframeRef.current.contentWindow.postMessage(JSON.stringify({ event: 'command', func: 'unMute' }), '*');
							ytIframeRef.current.contentWindow.postMessage(JSON.stringify({ event: 'command', func: 'setVolume', args: [100] }), '*');
							ytIframeRef.current.contentWindow.postMessage(JSON.stringify({ event: 'command', func: 'playVideo' }), '*');
						}
					} catch {}
				};
				resumeYT();
				setTimeout(resumeYT, 300);
				setTimeout(resumeYT, 800);
				setTimeout(resumeYT, 1500);
				setIsPlaying(true);
			}
			const v = videoRef.current;
			if (v) {
				v.muted = false;
				try { v.play(); } catch {}
				setIsPlaying(true);
			}
		}
	}, [visibleAds, isYouTubeVideo]);


	// NEW: orientation + natural aspect
	const [orientation, setOrientation] = useState("landscape"); // "landscape" (16:9 default) or "portrait" (9:16)
	const [naturalAspect, setNaturalAspect] = useState(16 / 9);
	// Fallback CSS rotate when browser won't rotate
	const [forceLandscapeCss, setForceLandscapeCss] = useState(false);
	const [isFullscreen, setIsFullscreen] = useState(false);

	// Discover panel search query (persisted so home<>discover can sync)
	const [discoverQuery, setDiscoverQuery] = usePref('discover:query', '');
	// Discover selected chip (filters list) — persisted for cross-page sync
	const [selectedChip, setSelectedChip] = usePref('discover:selectedChip', 'All Videos');



	// If `home.jsx` exports discover items, we'll load them dynamically at runtime
	const [discoverItemsData, setDiscoverItemsData] = useState(null);
	useEffect(() => {
		if (discoverItems) return; // prop takes precedence
		let cancelled = false;
		
		// First, try to load from localStorage (set by home.jsx when navigating to videoplayer)
		try {
			const stored = localStorage.getItem('discoverAllVideos');
			if (stored && stored.trim()) {
				const parsed = JSON.parse(stored);
				if (Array.isArray(parsed) && parsed.length > 0) {
					if (!cancelled) setDiscoverItemsData(parsed);
					return;
				}
			}
		} catch (e) {
			// ignore if parsing fails
		}
		
		// Fallback: try dynamic import; if `home.jsx` isn't present this will fail silently
		import('./home').then((m) => {
			if (cancelled) return;
			const exported = m.default || m.homeVideos || m.VIDEOS || m.discoverItems || null;
			if (Array.isArray(exported)) setDiscoverItemsData(exported);
		}).catch(() => {
			// ignore if not found
		});
		return () => { cancelled = true; };
	}, [discoverItems]);

	// keep track of the current visible source and index so swipes navigate the same list
	const currentSourceRef = useRef([]);
	const [currentIndex, setCurrentIndex] = useState(-1);
	// Playlist refs for this component
	const playlistIdsRef = currentSourceRef;
	const playlistIndexRef = useRef(-1);
	const lastWheelTimeRef = useRef(0);
	// Initialize playlist from localStorage (set by home.jsx when opening the player)
	useEffect(() => {
		try {
			const raw = localStorage.getItem('videoplayer_source');
			const rawIdx = localStorage.getItem('videoplayer_index');
			if (raw) {
				const arr = JSON.parse(raw);
				if (Array.isArray(arr) && arr.length) {
					playlistIdsRef.current = arr;
					if (rawIdx != null && rawIdx !== undefined && !isNaN(parseInt(rawIdx, 10))) {
						playlistIndexRef.current = parseInt(rawIdx, 10);
						setCurrentIndex(playlistIndexRef.current);
					} else {
						// try to infer index from current videoUrl if available
						try {
							const key = (initialVideo && (initialVideo.id || initialVideo.url || initialVideo.videoUrl)) || searchParams.get('id') || null;
							if (key) {
								const found = arr.findIndex(x => String(x) === String(key));
								if (found !== -1) {
									playlistIndexRef.current = found;
									setCurrentIndex(found);
								}
							}
						} catch (e) { }
					}
				}
			}
		} catch (e) { }
	}, [initialVideo, searchParams]);

	// Wheel handler to navigate playlist (up = next, down = prev)
	useEffect(() => {
		const handler = (e) => {
			try {
				const now = Date.now();
				if (now - lastWheelTimeRef.current < 650) return;
				const dir = e.deltaY < 0 ? 1 : -1;
				const list = playlistIdsRef.current || [];
				try { console.debug && console.debug('wheel nav: list length', (list && list.length) || 0); } catch { }
				if (!list || !list.length) return;
				let idx = playlistIndexRef.current;
				if (typeof idx !== 'number') idx = -1;
				const nextIdx = idx + dir;
				if (nextIdx < 0 || nextIdx >= list.length) return;
				lastWheelTimeRef.current = now;
				const target = list[nextIdx];
				// try to resolve target to a full item from discoverItemsData or dynamic home
				let info = null;
				try {
					// check discoverItems prop and discovered data
					const candidates = (discoverItems && discoverItems.length) ? discoverItems : (discoverItemsData || []);
					if (Array.isArray(candidates)) {
						info = candidates.find(v => (v.id && String(v.id) === String(target)) || (v.url && String(v.url) === String(target)) || (v.videoUrl && String(v.videoUrl) === String(target)));
					}
					if (!info) {
						// try dynamic import of home
						import('./home.jsx').then((mod) => {
							const VIDEOS = mod.default || mod.VIDEOS || mod.homeVideos || mod.discoverItems || null;
							if (Array.isArray(VIDEOS)) {
								const found = VIDEOS.find(v => (v.id && String(v.id) === String(target)) || (v.url && String(v.url) === String(target)) || (v.videoUrl && String(v.videoUrl) === String(target)));
								if (found) {
									info = found;
								}
							}
						}).catch(() => { });
					}
				} catch (err) {
					// ignore
				}
				if (info) {
					playlistIndexRef.current = nextIdx;
					setCurrentIndex(nextIdx);
					try { setVideoTitle(info.title || 'Video'); } catch { }
					try { setCreatorName(info.creator || info.channel || ''); } catch { }
					try {
						const newUrl = info.url || info.videoUrl || info.src || '';
						if (isYouTubeUrl(newUrl)) {
							setIsYouTubeVideo(true);
							setYouTubeId(getYouTubeVideoId(newUrl));
							setVideoUrl(newUrl);
						} else {
							setIsYouTubeVideo(false);
							setYouTubeId('');
							setVideoUrl(resolveMediaUrl(newUrl));
						}
						// Parse duration from video info time field
						if (info.time) {
							const parts = (info.time || '').split(':');
							if (parts.length === 2) {
								const secs = (parseInt(parts[0]) || 0) * 60 + (parseInt(parts[1]) || 0);
								if (secs > 0) setDuration(secs);
							}
						}
					} catch { }
					try { setControlsVisible(true); showCenterTemporarily(1600); } catch { }
					try { showSwipeToast('Next video'); } catch { }
				} else {
					// fallback: if target looks like URL, just play it
					if (typeof target === 'string' && /^(https?:)?\/\//.test(target)) {
						playlistIndexRef.current = nextIdx;
						setCurrentIndex(nextIdx);
						try {
							if (isYouTubeUrl(target)) {
								setIsYouTubeVideo(true);
								setYouTubeId(getYouTubeVideoId(target));
								setVideoUrl(target);
							} else {
								setIsYouTubeVideo(false);
								setYouTubeId('');
								setVideoUrl(resolveMediaUrl(target));
							}
							setVideoTitle('Video'); setCreatorName('');
						} catch { }
					}
				}
			} catch (err) { }
		};
		window.addEventListener('wheel', handler, { passive: true });
		return () => window.removeEventListener('wheel', handler);
	}, [discoverItemsData, discoverItems]);
	// playlist refs declared earlier to avoid redeclaration
	useEffect(() => {
		const onChip = (e) => {
			try {
				const v = e && e.detail ? e.detail : null;
				if (typeof v === 'string' && v !== selectedChip) setSelectedChip(v);
			} catch { }
		};
		const onQuery = (e) => {
			try {
				const v = e && e.detail ? e.detail : null;
				if (typeof v === 'string' && v !== discoverQuery) setDiscoverQuery(v);
			} catch { }
		};
		window.addEventListener('discover:chip', onChip);
		window.addEventListener('discover:query', onQuery);
		return () => {
			window.removeEventListener('discover:chip', onChip);
			window.removeEventListener('discover:query', onQuery);
		};
	}, [selectedChip, discoverQuery, setSelectedChip, setDiscoverQuery]);

	// Broadcast changes so other pages/components (e.g., `home.jsx`) can stay in sync
	useEffect(() => {
		try { window.dispatchEvent(new CustomEvent('discover:chip', { detail: selectedChip })); } catch { }
	}, [selectedChip]);
	useEffect(() => {
		try { window.dispatchEvent(new CustomEvent('discover:query', { detail: discoverQuery })); } catch { }
	}, [discoverQuery]);
	// whether discover is showing live items from home.jsx or using placeholders
	const isDiscoverLive = Boolean((discoverItems && discoverItems.length) || (discoverItemsData && discoverItemsData.length));

	// NEW: preview canvas + refs/state
	const canvasRef = useRef(null);
	// NEW: offscreen canvas for sampling dominant color
	const colorCanvasRef = useRef(null);
	// dominant ambient color sampled from the video (used for gradients above/below)
	const [dominantColor, setDominantColor] = useState('#000000');
	const seekInFlightRef = useRef(false);
	const [previewVisible, setPreviewVisible] = useState(false);
	const [previewLeft, setPreviewLeft] = useState(0);
	const [previewTop, setPreviewTop] = useState(0);
	const [previewSize, setPreviewSize] = useState({ w: 160, h: 90 }); // default 16:9 preview

	// NEW: preview video element used only for seeking/drawing previews (keeps main video visible)
	const previewVideoRef = useRef(null);

	// compute progress from clientX
	const updateProgressFromPointer = (clientX) => {
		const el = barRef.current;
		if (!el) return;
		const rect = el.getBoundingClientRect();
		const p = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
		setProgress(p);

		// update preview position above the thumb
		const previewW = previewSize.w;
		const previewH = previewSize.h;
		const thumbCenterX = rect.left + p * rect.width;
		const top = rect.top - previewH - 10; // 10px gap above bar
		setPreviewLeft(Math.max(8, thumbCenterX - previewW / 2)); // keep some left padding
		setPreviewTop(Math.max(8, top));

		// seek the preview video (not the main video) so the main player remains visible
		const pv = previewVideoRef.current;
		if (pv && duration > 0) {
			try {
				seekInFlightRef.current = true;
				pv.currentTime = p * duration;
			} catch {
				// noop
			}
		}
	};

	// Draw current video frame to the preview canvas (use previewVideoRef)
	const drawPreviewFrame = () => {
		const pv = previewVideoRef.current;
		const c = canvasRef.current;
		if (!pv || !c) return;
		const ctx = c.getContext("2d");
		const { w, h } = previewSize;
		c.width = w;
		c.height = h;

		const vw = pv.videoWidth || w;
		const vh = pv.videoHeight || h;
		const scale = Math.min(w / vw, h / vh);
		const dw = vw * scale;
		const dh = vh * scale;
		const dx = (w - dw) / 2;
		const dy = (h - dh) / 2;

		ctx.fillStyle = "#000";
		ctx.fillRect(0, 0, w, h);
		try {
			ctx.drawImage(pv, 0, 0, vw, vh, dx, dy, dw, dh);
		} catch {
			// noop
		}
	};

	// Listen for preview video 'seeked' to draw a frame (was previously attached to main video)
	useEffect(() => {
		const pv = previewVideoRef.current;
		if (!pv) return;
		const onSeeked = () => {
			if (previewVisible && seekInFlightRef.current) {
				drawPreviewFrame();
				seekInFlightRef.current = false;
			}
		};
		pv.addEventListener("seeked", onSeeked);
		return () => pv.removeEventListener("seeked", onSeeked);
	}, [previewVisible, previewSize]);

	// Ensure preview video uses the same source only when preview is visible to avoid decoding two videos simultaneously
	useEffect(() => {
		try {
			const pv = previewVideoRef.current;
			if (!pv) return;
			if (previewVisible && (typeof videoUrl !== 'undefined') && videoUrl) {
				if (pv.src !== videoUrl) {
					pv.src = videoUrl;
					try { pv.load(); } catch { }
				}
			} else {
				try { pv.pause(); } catch { }
				try { pv.removeAttribute && pv.removeAttribute('src'); pv.load && pv.load(); } catch { }
			}
		} catch (e) { }
	}, [previewVisible, videoUrl]);

	// --- Dominant color sampling for ambient gradients ---
	// Lightweight quantization: downscale frame to small canvas and bucket colors
	const sampleDominantColorFromVideo = useCallback(() => {
		try {
			const v = videoRef.current;
			if (!v || v.readyState < 2) return; // HAVE_CURRENT_DATA
			// create canvas once
			if (!colorCanvasRef.current) colorCanvasRef.current = document.createElement('canvas');
			const c = colorCanvasRef.current;
			const W = 32;
			const H = 32;
			c.width = W;
			c.height = H;
			const ctx = c.getContext('2d', { willReadFrequently: true });
			// draw current frame scaled down
			try {
				ctx.drawImage(v, 0, 0, W, H);
			} catch (e) {
				// some browsers may throw if cross-origin video; bail silently
				return;
			}
			const data = ctx.getImageData(0, 0, W, H).data;
			const counts = new Map();
			let maxCount = 0;
			let bestKey = null;
			for (let i = 0; i < data.length; i += 4) {
				const r = data[i];
				const g = data[i + 1];
				const b = data[i + 2];
				const a = data[i + 3];
				if (a < 40) continue; // ignore mostly-transparent pixels
				// reduce color resolution to 5 bits per channel (quantize)
				const rq = r >> 3;
				const gq = g >> 3;
				const bq = b >> 3;
				const key = (rq << 10) | (gq << 5) | bq;
				const cur = (counts.get(key) || 0) + 1;
				counts.set(key, cur);
				if (cur > maxCount) { maxCount = cur; bestKey = key; }
			}
			if (bestKey == null) return;
			// expand quantized color back to 8-bit per channel (center of bucket)
			const rq = (bestKey >> 10) & 0x1f;
			const gq = (bestKey >> 5) & 0x1f;
			const bq = bestKey & 0x1f;
			const r = (rq << 3) | (rq >> 2);
			const g = (gq << 3) | (gq >> 2);
			const b = (bq << 3) | (bq >> 2);
			const toHex = (n) => n.toString(16).padStart(2, '0');
			const hex = `#${toHex(r)}${toHex(g)}${toHex(b)}`;
			setDominantColor(hex);
		} catch (err) {
			// ignore errors (e.g., cross-origin draws)
		}
	}, [videoRef]);

	// sample periodically while playing and also on metadata load
	useEffect(() => {
		let id = null;
		if (isPlaying) {
			// sample every ~1200ms while playing
			sampleDominantColorFromVideo();
			id = setInterval(sampleDominantColorFromVideo, 1200);
		}
		return () => { if (id) clearInterval(id); };
	}, [isPlaying, sampleDominantColorFromVideo]);

	// Handle global pointer move/up while dragging — update progress and onPointerUp commit to main video
	useEffect(() => {
		const onPointerMove = (e) => {
			if (!draggingRef.current) return;
			const clientX = e.clientX || (e.touches && e.touches[0]?.clientX);
			if (clientX) {
				updateProgressFromPointer(clientX);
			}
		};
		const onPointerUp = () => {
			if (!draggingRef.current) return;
			draggingRef.current = false;
			setProgressDragging(false);

			// hide preview after small delay so user sees final frame briefly
			setTimeout(() => setPreviewVisible(false), 200);

			// Commit final time to the main video once dragging finishes
			// YouTube videos: use postMessage seekTo command
			if (isYouTubeVideo && ytIframeRef.current && duration > 0) {
				try {
					const seekTime = progress * duration;
					ytIframeRef.current.contentWindow.postMessage(JSON.stringify({ event: 'command', func: 'seekTo', args: [seekTime, true] }), '*');
				} catch { /* noop */ }
			} else {
				const mv = videoRef.current;
				if (mv && duration > 0) {
					try {
						mv.currentTime = progress * duration;
					} catch {
						// noop
					}
				}
			}
		};
		window.addEventListener("pointermove", onPointerMove);
		window.addEventListener("pointerup", onPointerUp);
		return () => {
			window.removeEventListener("pointermove", onPointerMove);
			window.removeEventListener("pointerup", onPointerUp);
		};
	}, [duration, previewSize, progress]);

	// NEW: share modal state + helpers
	const [showShareModal, setShowShareModal] = useState(false);
	// Report modal state (declare near other modal flags)
	const [showReportModal, setShowReportModal] = useState(false);
	const [reportCategory, setReportCategory] = useState("");
	const [reportText, setReportText] = useState("");
	const REPORT_MAX = 500;
	// Make dialogs resizable/draggable: Options, Captions, Share
	// Make Options sheet initially shorter so its visible area ends earlier
	// (matches the requested "cutoff" visual where the sheet doesn't fill as much of the viewport).
	const [optionsHeight, setOptionsHeight] = useState(window.innerHeight * 0.62);
	const optionsMinRef = useRef(window.innerHeight * 0.32);
	const optionsMaxRef = useRef(window.innerHeight * 0.95);
	const optionsDragRef = useRef({ dragging: false, startY: 0, startHeight: 0 });

	// Match the Options sheet size so Captions appears the same initially
	const [captionsHeight, setCaptionsHeight] = useState(window.innerHeight * 0.62);
	const captionsMinRef = useRef(window.innerHeight * 0.32);
	const captionsMaxRef = useRef(window.innerHeight * 0.95);
	const captionsDragRef = useRef({ dragging: false, startY: 0, startHeight: 0 });

	const [shareHeight, setShareHeight] = useState(window.innerHeight * 0.7);
	const shareMinRef = useRef(window.innerHeight * 0.3);
	const shareMaxRef = useRef(window.innerHeight * 0.95);
	const shareDragRef = useRef({ dragging: false, startY: 0, startHeight: 0 });

	// Tip Creator drag state (allow user to resize the Tip modal like other sheets)
	// Persist height across sessions using usePref
	const [tipHeight, setTipHeight] = usePref('tipHeight', window.innerHeight * 0.58);
	const tipMinRef = useRef(window.innerHeight * 0.28);
	const tipMaxRef = useRef(window.innerHeight * 0.95);
	const tipDragRef = useRef({ dragging: false, startY: 0, startHeight: 0 });

	// Options drag handlers
	const onOptionsHandlePointerDown = (e) => {
		e.preventDefault();
		const clientY = e.clientY ?? (e.touches && e.touches[0]?.clientY);
		optionsDragRef.current.dragging = true;
		optionsDragRef.current.startY = clientY;
		optionsDragRef.current.startHeight = optionsHeight;
		window.addEventListener("pointermove", onOptionsHandlePointerMove);
		window.addEventListener("pointerup", onOptionsHandlePointerUp);
	};
	const onOptionsHandlePointerMove = (e) => {
		if (!optionsDragRef.current.dragging) return;
		const clientY = e.clientY ?? (e.touches && e.touches[0]?.clientY);
		if (typeof clientY !== "number") return;
		const dy = optionsDragRef.current.startY - clientY; // upward increases height
		let next = optionsDragRef.current.startHeight + dy;
		next = Math.max(optionsMinRef.current, Math.min(optionsMaxRef.current, next));
		setOptionsHeight(next);
	};
	const onOptionsHandlePointerUp = (e) => {
		if (!optionsDragRef.current.dragging) return;
		optionsDragRef.current.dragging = false;
		window.removeEventListener("pointermove", onOptionsHandlePointerMove);
		window.removeEventListener("pointerup", onOptionsHandlePointerUp);
	};

	// Captions drag handlers
	const onCaptionsHandlePointerDown = (e) => {
		e.preventDefault();
		const clientY = e.clientY ?? (e.touches && e.touches[0]?.clientY);
		captionsDragRef.current.dragging = true;
		captionsDragRef.current.startY = clientY;
		captionsDragRef.current.startHeight = captionsHeight;
		window.addEventListener("pointermove", onCaptionsHandlePointerMove);
		window.addEventListener("pointerup", onCaptionsHandlePointerUp);
	};
	const onCaptionsHandlePointerMove = (e) => {
		if (!captionsDragRef.current.dragging) return;
		const clientY = e.clientY ?? (e.touches && e.touches[0]?.clientY);
		if (typeof clientY !== "number") return;
		const dy = captionsDragRef.current.startY - clientY;
		let next = captionsDragRef.current.startHeight + dy;
		next = Math.max(captionsMinRef.current, Math.min(captionsMaxRef.current, next));
		setCaptionsHeight(next);
	};
	const onCaptionsHandlePointerUp = (e) => {
		if (!captionsDragRef.current.dragging) return;
		captionsDragRef.current.dragging = false;
		window.removeEventListener("pointermove", onCaptionsHandlePointerMove);
		window.removeEventListener("pointerup", onCaptionsHandlePointerUp);
	};

	// Share drag handlers
	const onShareHandlePointerDown = (e) => {
		e.preventDefault();
		const clientY = e.clientY ?? (e.touches && e.touches[0]?.clientY);
		shareDragRef.current.dragging = true;
		shareDragRef.current.startY = clientY;
		shareDragRef.current.startHeight = shareHeight;
		window.addEventListener("pointermove", onShareHandlePointerMove);
		window.addEventListener("pointerup", onShareHandlePointerUp);
	};
	const onShareHandlePointerMove = (e) => {
		if (!shareDragRef.current.dragging) return;
		const clientY = e.clientY ?? (e.touches && e.touches[0]?.clientY);
		if (typeof clientY !== "number") return;
		const dy = shareDragRef.current.startY - clientY;
		let next = shareDragRef.current.startHeight + dy;
		next = Math.max(shareMinRef.current, Math.min(shareMaxRef.current, next));
		setShareHeight(next);
	};
	const onShareHandlePointerUp = (e) => {
		if (!shareDragRef.current.dragging) return;
		shareDragRef.current.dragging = false;
		window.removeEventListener("pointermove", onShareHandlePointerMove);
		window.removeEventListener("pointerup", onShareHandlePointerUp);
	};

	// Tip drag handlers (mirror pattern used for Options/Captions/Share)
	const onTipHandlePointerDown = (e) => {
		e.preventDefault();
		const clientY = e.clientY ?? (e.touches && e.touches[0]?.clientY);
		tipDragRef.current.dragging = true;
		tipDragRef.current.startY = clientY;
		tipDragRef.current.startHeight = tipHeight;
		window.addEventListener("pointermove", onTipHandlePointerMove);
		window.addEventListener("pointerup", onTipHandlePointerUp);
	};
	const onTipHandlePointerMove = (e) => {
		if (!tipDragRef.current.dragging) return;
		const clientY = e.clientY ?? (e.touches && e.touches[0]?.clientY);
		if (typeof clientY !== "number") return;
		const dy = tipDragRef.current.startY - clientY;
		let next = tipDragRef.current.startHeight + dy;
		next = Math.max(tipMinRef.current, Math.min(tipMaxRef.current, next));
		setTipHeight(next);
	};
	const onTipHandlePointerUp = (e) => {
		if (!tipDragRef.current.dragging) return;
		tipDragRef.current.dragging = false;
		window.removeEventListener("pointermove", onTipHandlePointerMove);
		window.removeEventListener("pointerup", onTipHandlePointerUp);
	};

	// Cleanup any lingering listeners on unmount
	useEffect(() => {
		return () => {
			window.removeEventListener("pointermove", onOptionsHandlePointerMove);
			window.removeEventListener("pointerup", onOptionsHandlePointerUp);
			window.removeEventListener("pointermove", onCaptionsHandlePointerMove);
			window.removeEventListener("pointerup", onCaptionsHandlePointerUp);
			window.removeEventListener("pointermove", onShareHandlePointerMove);
			window.removeEventListener("pointerup", onShareHandlePointerUp);
			window.removeEventListener("pointermove", onTipHandlePointerMove);
			window.removeEventListener("pointerup", onTipHandlePointerUp);
		};
	}, []);

	// Modal button press feedback: add/remove `data-pressed` on pointerdown/up for buttons inside `.modal-dialog`.
	useEffect(() => {
		const onPointerDown = (e) => {
			try {
				const btn = e.target && e.target.closest && e.target.closest('button');
				if (!btn) return;
				if (!btn.closest('.modal-dialog')) return;
				btn.setAttribute('data-pressed', 'true');
			} catch { }
		};

		const clearPressed = () => {
			try {
				document.querySelectorAll('.modal-dialog button[data-pressed]').forEach((b) => b.removeAttribute('data-pressed'));
			} catch { }
		};

		window.addEventListener('pointerdown', onPointerDown, { passive: true });
		window.addEventListener('pointerup', clearPressed);
		window.addEventListener('pointercancel', clearPressed);

		return () => {
			window.removeEventListener('pointerdown', onPointerDown);
			window.removeEventListener('pointerup', clearPressed);
			window.removeEventListener('pointercancel', clearPressed);
		};
	}, []);




	// If parent passes an initialVideo object, initialize player state from it
	useEffect(() => {
		if (!initialVideo) return;
		try {
			const rawUrl = initialVideo.videoUrl || initialVideo.url || initialVideo.src || '';
			if (rawUrl) {
				if (isYouTubeUrl(rawUrl)) {
					setVideoUrl(rawUrl); // keep YouTube URLs as-is
					setIsYouTubeVideo(true);
					setYouTubeId(getYouTubeVideoId(rawUrl));
				} else {
					setVideoUrl(resolveMediaUrl(rawUrl));
					setIsYouTubeVideo(false);
					setYouTubeId('');
				}
			}
			if (initialVideo.title) setVideoTitle(initialVideo.title);
			if (initialVideo.author) setCreatorName(initialVideo.author);
			// If the opener provided a seek time (restore from mini-player), preserve it
			try { if (initialVideo.seekTo != null) pendingDeepLinkTimeRef.current = initialVideo.seekTo; } catch { }
		} catch (e) { }
	}, [initialVideo]);

	// Read URL parameters and set video info if no initialVideo prop OR if videoUrl is still empty
	useEffect(() => {
		const src = searchParams.get('src');
		const title = searchParams.get('title');
		const channel = searchParams.get('channel');

		// If initialVideo already provided videoUrl, skip URL param loading
		if (initialVideo && videoUrl) return;

		if (src && !videoUrl) {
			if (isYouTubeUrl(src)) {
				setVideoUrl(src);
				setIsYouTubeVideo(true);
				setYouTubeId(getYouTubeVideoId(src));
			} else {
				setVideoUrl(resolveMediaUrl(src));
				setIsYouTubeVideo(false);
				setYouTubeId('');
			}
		}
		if (title && !videoTitle) {
			setVideoTitle(title);
		}
		if (channel && !creatorName) {
			setCreatorName(channel);
		}
	}, [searchParams, initialVideo, videoUrl]);

	// Load overlays from videoInfo when it changes
	useEffect(() => {
		if (videoInfo && videoInfo.overlays && Array.isArray(videoInfo.overlays)) {
			setVideoOverlays(videoInfo.overlays);
		} else {
			setVideoOverlays([]);
		}
	}, [videoInfo]);

	// Update visible overlays based on current playback time
	useEffect(() => {
		if (!videoRef.current || videoOverlays.length === 0) {
			setVisibleOverlays([]);
			return;
		}

		const currentTime = videoRef.current.currentTime;
		const visible = videoOverlays.filter(ov => {
			const startTime = ov.timeSec;
			const endTime = ov.timeSec + (ov.durationSec || 3);
			return currentTime >= startTime && currentTime < endTime;
		});

		setVisibleOverlays(visible);
	}, [videoOverlays]);

	// Update visible overlays on timeupdate
	useEffect(() => {
		const v = videoRef.current;
		if (!v) return;

		const handleTimeUpdate = () => {
			const currentTime = v.currentTime;
			const visible = videoOverlays.filter(ov => {
				const startTime = ov.timeSec;
				const endTime = ov.timeSec + (ov.durationSec || 3);
				return currentTime >= startTime && currentTime < endTime;
			});
			setVisibleOverlays(visible);
		};

		v.addEventListener('timeupdate', handleTimeUpdate);
		return () => v.removeEventListener('timeupdate', handleTimeUpdate);
	}, [videoOverlays]);

	// Load ads from videoInfo when it changes
	useEffect(() => {
		let allAds = [];
		
		// Debug: trace videoInfo and its ads property
		console.log('[ADS] videoInfo:', videoInfo ? { id: videoInfo.id, title: videoInfo.title, hasAds: !!videoInfo.ads, adsType: typeof videoInfo.ads, adsKeys: videoInfo.ads ? Object.keys(videoInfo.ads) : 'N/A' } : 'null');
		
		// Normalize ad fields: map backend short names (logo, title, link, etc.) to expected default2 prefixed names
		const normalizeAd = (ad) => {
			if (!ad || ad.type !== 'default2') return ad;
			return {
				...ad,
				default2Title: ad.default2Title || ad.title || '',
				default2Description: ad.default2Description || ad.description || '',
				default2Logo: ad.default2Logo || ad.logo || ad.image || '',
				default2Image: ad.default2Image || ad.image || ad.logo || '',
				default2Link: ad.default2Link || ad.link || '',
				default2BgColor: ad.default2BgColor || ad.bgColor || '#ffffff',
				default2TextColor: ad.default2TextColor || ad.textColor || '#111827',
				default2LineColor: ad.default2LineColor || ad.lineColor || '#d946ef',
			};
		};
		
		// Load from nested structure: ads.bottom and ads.overlays
		if (videoInfo && videoInfo.ads) {
			if (Array.isArray(videoInfo.ads.bottom)) {
				allAds = [...allAds, ...videoInfo.ads.bottom.map(normalizeAd)];
			}
			if (Array.isArray(videoInfo.ads.overlays)) {
				// Note: overlays might be rendered differently, but we can handle them as ads too
				const overlayAds = videoInfo.ads.overlays.map(o => ({
					...o,
					type: o.type || 'overlay'
				}));
				allAds = [...allAds, ...overlayAds];
			}
		}
		
		// Also check for flat ads array (legacy format)
		if (videoInfo && Array.isArray(videoInfo.ads) && videoInfo.ads.length > 0 && !videoInfo.ads[0].type) {
			allAds = [...allAds, ...videoInfo.ads.map(normalizeAd)];
		}
		
		// Debug: log when ads are loaded
		console.log('Loaded ads:', allAds.length, allAds);
		
		setVideoAds(allAds);

		// Optimize: Immediately show ads with start time 0 to prevent homepage glitch
		const instantAds = allAds.filter(ad => (ad.startTime || 0) === 0);
		if (instantAds.length > 0) {
			console.log('Immediate ad display for:', instantAds);
			setVisibleAds(instantAds);
		}
	}, [videoInfo]);

	// Update visible ads based on current playback time
	useEffect(() => {
		// Wait for videoRef to be available before checking ads
		if (!videoRef.current) {
			return;
		}

		const currentTime = videoRef.current.currentTime;
		const dismissed = dismissedAdIdsRef.current;
		const visible = videoAds.filter(ad => {
			if (dismissed.has(ad.id)) return false;
			const startTime = ad.startTime || 0;
			const endTime = startTime + (ad.duration || 3);
			return currentTime >= startTime && currentTime < endTime;
		});

		if (visible.length > 0) {
			setVisibleAds(visible);
		}
	}, [videoAds]);

	// Update visible ads on timeupdate
	useEffect(() => {
		const v = videoRef.current;
		if (!v) return;

		const handleTimeUpdate = () => {
			const currentTime = v.currentTime;
			const dismissed = dismissedAdIdsRef.current;
			const visible = videoAds.filter(ad => {
				if (dismissed.has(ad.id)) return false; // skip dismissed ads
				const startTime = ad.startTime || 0;
				const endTime = startTime + (ad.duration || 3);
				return currentTime >= startTime && currentTime < endTime;
			});
			
			setVisibleAds(visible);
		};

		v.addEventListener('timeupdate', handleTimeUpdate);
		return () => v.removeEventListener('timeupdate', handleTimeUpdate);
	}, [videoAds]);

	// ── Trigger ads for YouTube main videos (YouTube iframes don't fire HTML5 timeupdate events) ──
	useEffect(() => {
		if (!isYouTubeVideo || videoAds.length === 0) return;

		const checkYTAds = () => {
			if (hadOverlayAdRef.current) return; // don't trigger new ads while one is showing
			const currentTime = ytLastKnownTime.current;
			const dismissed = dismissedAdIdsRef.current;
			const visible = videoAds.filter(ad => {
				if (dismissed.has(ad.id)) return false;
				const startTime = ad.startTime || 0;
				if (startTime === 0) return false; // instant ads handled by the load effect
				const endTime = startTime + (ad.duration || 3);
				return currentTime >= startTime && currentTime < endTime;
			});
			if (visible.length > 0) {
				setVisibleAds(visible);
			}
		};

		const iv = setInterval(checkYTAds, 500);
		return () => clearInterval(iv);
	}, [isYouTubeVideo, videoAds]);

	// Auto-dismiss default2 ads after their duration using a real timer
	// (not dependent on video playback time, which may not advance if video is paused)
	useEffect(() => {
		visibleAds
			.filter(ad => ad.type === 'default2' && ad.id && !adTimersRef.current.has(ad.id))
			.forEach(ad => {
				adTimersRef.current.add(ad.id);
				const duration = ((ad.duration || 10) * 1000); // default 10 seconds
				setTimeout(() => {
					if (!dismissedAdIdsRef.current.has(ad.id)) {
						handleAdDismiss(ad.id);
					}
				}, duration);
			});
	}, [visibleAds, handleAdDismiss]);

	// AUTO-PLAY DISABLED: Users must manually click play to start video
	// (previously attempted autoplay when initialVideo was provided)
	// Tip Creator modal state
	const [showTipModal, setShowTipModal] = useState(false);
	const [tipAmount, setTipAmount] = useState(0);
	const TIP_PRESETS = [1, 5, 10, 25];
	const [copied, setCopied] = useState(false);
	// global toast + haptic helpers for Share modal actions
	const [toastMessage, setToastMessage] = useState("");
	const toastTimerRef = useRef(null);

	// Show "Next video" / "Previous video" toast only for first-time users
	const swipeToastShownRef = useRef(false);
	const showSwipeToast = useCallback((msg) => {
		// Check if user has already seen swipe toasts
		const key = 'vx:swipe-toast-seen';
		try {
			if (localStorage.getItem(key)) {
				swipeToastShownRef.current = true;
			}
		} catch {}
		if (swipeToastShownRef.current) return; // don't show again
		// Mark as shown permanently
		swipeToastShownRef.current = true;
		try { localStorage.setItem(key, '1'); } catch {}
		setToastMessage(msg);
		if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
		toastTimerRef.current = setTimeout(() => setToastMessage(''), 1600);
	}, []);
	const shareContentRef = useRef(null);
	const qrRef = useRef(null);

	// Add copy helper used by the Share dialog
	const copyToClipboard = async (text) => {
		try {
			if (navigator.clipboard && navigator.clipboard.writeText) {
				await navigator.clipboard.writeText(text);
			} else {
				// fallback for older browsers
				const ta = document.createElement("textarea");
				ta.value = text;
				ta.setAttribute("readonly", "");
				ta.style.position = "absolute";
				ta.style.left = "-9999px";
				document.body.appendChild(ta);
				ta.select();
				document.execCommand("copy");
				document.body.removeChild(ta);
			}
			setCopied(true);
			setTimeout(() => setCopied(false), 1500);
			// vibration disabled per user preference
			setToastMessage('Link copied');
			if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
			toastTimerRef.current = setTimeout(() => setToastMessage(''), 1600);
		} catch {
			// noop on failure
		}
	};

	// --- Notes helpers: load/save notes per-video (localStorage-backed) ---
	const notesStorageKey = (u) => `notes:${u}`;

	const loadNotesFor = (u) => {
		try {
			const raw = localStorage.getItem(notesStorageKey(u));
			return raw ? JSON.parse(raw) : [];
		} catch {
			return [];
		}
	};

	const saveNotesFor = (u, arr) => {
		try { localStorage.setItem(notesStorageKey(u), JSON.stringify(arr)); } catch { }
	};

	// --- Bookmarks helpers: load/save bookmarks per-video (localStorage-backed) ---
	const bookmarksStorageKey = (u) => `bookmarks:${u}`;

	const loadBookmarksFor = (u) => {
		try {
			const raw = localStorage.getItem(bookmarksStorageKey(u));
			return raw ? JSON.parse(raw) : [];
		} catch {
			return [];
		}
	};

	const saveBookmarksFor = (u, arr) => {
		try { localStorage.setItem(bookmarksStorageKey(u), JSON.stringify(arr)); } catch { }
	};

	// Enumerate all bookmarked videos across localStorage (returns [{ url, bookmarks: [...] }])
	const loadAllBookmarkedVideos = () => {
		const out = [];
		try {
			for (let i = 0; i < localStorage.length; i++) {
				const key = localStorage.key(i);
				if (!key) continue;
				if (key.startsWith('bookmarks:')) {
					const url = key.slice('bookmarks:'.length);
					try {
						const raw = localStorage.getItem(key);
						const arr = raw ? JSON.parse(raw) : [];
						if (arr && arr.length) {
							out.push({ url, bookmarks: arr });
						}
					} catch { }
				}
			}
		} catch (e) { }
		return out;
	};

	// Bookmark modal state
	const [showBookmarkModal, setShowBookmarkModal] = useState(false);
	const [bookmarkLabel, setBookmarkLabel] = useState('');
	const [bookmarkTime, setBookmarkTime] = useState(0);
	const [bookmarkStartTime, setBookmarkStartTime] = useState(0);
	const [bookmarkEndTime, setBookmarkEndTime] = useState(0);
	const [bookmarkShareSegment, setBookmarkShareSegment] = useState(false);

	// current video's bookmarks (for rendering markers on the progress bar)
	const [currentVideoBookmarks, setCurrentVideoBookmarks] = useState([]);

	// pending deep link time (when app opened with ?video=...&t=...)
	const pendingDeepLinkTimeRef = useRef(null);
	// YouTube start time from URL param 't' — used in the iframe &start= parameter
	const [ytStartTime, setYtStartTime] = useState(() => {
		try {
			const sp = new URLSearchParams(window.location.search || '');
			const t = sp.get('t');
			if (t != null) { const n = parseInt(t, 10); if (!isNaN(n) && n > 0) return n; }
		} catch {}
		// Check initialVideo.seekTo (from MiniPlayer expand — no URL params in overlay mode)
		try { if (initialVideo && initialVideo.seekTo > 0) return Math.floor(initialVideo.seekTo); } catch {}
		return 0;
	});

	// which bookmark's share popover is open (key format: `${url}::${bookmarkId}`)
	const [sharePopoverFor, setSharePopoverFor] = useState(null);

	// click-away handler for share popovers: close when clicking outside
	useEffect(() => {
		function handleDocClick(e) {
			try {
				const key = sharePopoverFor;
				if (!key) return;
				const target = e.target;
				// if clicked on anchor with matching data-share-anchor, do nothing
				if (target && target.closest && target.closest(`[data-share-anchor="${key}"]`)) return;
				// if clicked inside the popover, ignore
				if (target && target.closest && target.closest(`[data-share-key="${key}"]`)) return;
				setSharePopoverFor(null);
			} catch { }
		}
		document.addEventListener('click', handleDocClick);
		return () => document.removeEventListener('click', handleDocClick);
	}, [sharePopoverFor]);

	const makeShareLink = (url, time) => {
		try {
			const loc = window.location ? `${window.location.origin}${window.location.pathname}` : '';
			return `${loc}?video=${encodeURIComponent(url)}&t=${Math.max(0, Math.floor(time || 0))}`;
		} catch { return url; }
	};

	// Quick centered bookmark modal (triggered from quick-action card)
	const [showQuickBookmarkModal, setShowQuickBookmarkModal] = useState(false);

	// Transient pulse animation for bookmark feedback (fills and fades)
	const [quickBookmarkPulse, setQuickBookmarkPulse] = useState({ show: false, x: 0, y: 0 });
	const [quickBookmarkPulseActive, setQuickBookmarkPulseActive] = useState(false);
	const quickBookmarkPulseTimerRef = useRef(null);
	const quickBookmarkPulseActiveTimerRef = useRef(null);




	const openBookmarkModalAtCurrent = () => {
		try {
			const v = videoRef.current;
			const t = v ? Math.floor(v.currentTime || 0) : Math.floor(progress * duration || 0);
			setBookmarkTime(t);
			setBookmarkStartTime(Math.max(0, t - 5)); // Default 5 sec before current
			setBookmarkEndTime(Math.min(duration, t + 15)); // Default 15 sec after current
			setBookmarkLabel('');
			setBookmarkShareSegment(false);
			setShowBookmarkModal(true);
		} catch { }
	};

	const saveBookmark = () => {
		try {
			const b = { 
				id: Date.now(), 
				time: bookmarkTime, 
				label: (bookmarkLabel || '').trim(),
				startTime: bookmarkStartTime,
				endTime: bookmarkEndTime,
				shareSegment: bookmarkShareSegment
			};
			const list = loadBookmarksFor(videoUrl);
			const next = [b, ...list];
			saveBookmarksFor(videoUrl, next);
			// refresh in-memory list for the current video
			try { setCurrentVideoBookmarks(next); } catch { }
			setShowBookmarkModal(false);
			setBookmarkLabel('');
			setToastMessage('Bookmark saved');
			if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
			toastTimerRef.current = setTimeout(() => setToastMessage(''), 1400);
		} catch { }
	};

	// Save bookmark from the quick-centered modal and show transient filled-pulse
	const saveQuickBookmark = () => {
		try {
			const b = { id: Date.now(), time: bookmarkTime, label: (bookmarkLabel || '').trim() };
			const list = loadBookmarksFor(videoUrl);
			const next = [b, ...list];
			saveBookmarksFor(videoUrl, next);
			// refresh in-memory list for the current video
			try { setCurrentVideoBookmarks(next); } catch { }
			setShowQuickBookmarkModal(false);
			setBookmarkLabel('');
			setToastMessage('Moment Bookmarked');
			if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
			toastTimerRef.current = setTimeout(() => setToastMessage(''), 1400);

			// Ensure segment bookmarks are enabled so backend syncing can occur
			try { localStorage.setItem('vx:pref:segmentBookmarksEnabled', JSON.stringify(true)); } catch { }
			// Persist to backend as a segment (start==end when saving a single moment)
			try {
				const BACKEND = (window && window.__BACKEND_URL__) || `${window.location.protocol}//${window.location.hostname}:4000`;
				const token = localStorage.getItem('regaarder_token');
				fetch(`${BACKEND}/bookmarks/segments`, {
					method: 'POST',
					headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
					body: JSON.stringify({ videoUrl, label: (bookmarkLabel || '').trim(), startTime: Math.floor(bookmarkTime || 0), endTime: Math.floor(bookmarkTime || 0) })
				}).catch(() => { });
			} catch { }

			// Trigger pulse animation near the quick-card position
			try {
				setQuickBookmarkPulse({ show: true, x: quickCardPos.x, y: quickCardPos.y });
				// confetti removed — replaced by a pulse and toast
				// start active phase (animate) shortly after render
				if (quickBookmarkPulseActiveTimerRef.current) clearTimeout(quickBookmarkPulseActiveTimerRef.current);
				quickBookmarkPulseActiveTimerRef.current = setTimeout(() => setQuickBookmarkPulseActive(true), 30);
				// hide pulse after animation
				if (quickBookmarkPulseTimerRef.current) clearTimeout(quickBookmarkPulseTimerRef.current);
				quickBookmarkPulseTimerRef.current = setTimeout(() => {
					setQuickBookmarkPulse({ show: false, x: 0, y: 0 });
					setQuickBookmarkPulseActive(false);
					quickBookmarkPulseTimerRef.current = null;
				}, 900);
			} catch { }
		} catch { }
	};



	// Parse deep-link query on mount (e.g., ?video=<url>&t=<seconds>)
	useEffect(() => {
		try {
			const sp = new URLSearchParams(window.location.search || '');
			const v = sp.get('video');
			const t = sp.get('t');
			if (v) {
				try { setVideoUrl(resolveMediaUrl(decodeURIComponent(v))); } catch { setVideoUrl(resolveMediaUrl(v)); }
				if (t != null) {
					const n = parseInt(t, 10);
					if (!Number.isNaN(n)) pendingDeepLinkTimeRef.current = n;
				}
			}
		} catch { }
	}, []);

	// When videoUrl changes, also handle any pending deep-link seek/play
	useEffect(() => {
		try {
			if (!videoUrl) {
				setCurrentVideoBookmarks([]);
				return;
			}
			const list = loadBookmarksFor(videoUrl) || [];
			setCurrentVideoBookmarks(list);
			if (pendingDeepLinkTimeRef.current != null) {
				const time = pendingDeepLinkTimeRef.current;
				pendingDeepLinkTimeRef.current = null;
				setTimeout(() => {
					try {
						// For YouTube videos, seek via postMessage instead of video element
						if (isYouTubeVideo && ytIframeRef.current && ytIframeRef.current.contentWindow) {
							ytIframeRef.current.contentWindow.postMessage(
								JSON.stringify({ event: 'command', func: 'seekTo', args: [time, true] }), '*'
							);
							setYtStartTime(time);
							ytLastKnownTime.current = time;
							ytLastKnownTimestamp.current = Date.now();
							if (duration > 0) setProgress(time / duration);
							return;
						}
						const v = videoRef.current;
						if (v) {
							try { v.src = resolveMediaUrl(videoUrl); } catch { }
							try { v.currentTime = Math.max(0, time); } catch { }
							// AUTO-PLAY DISABLED: Do not auto-play, respect user's autoPlayEnabled setting
							try { setControlsVisible(true); showCenterTemporarily(2000); } catch { }
						}
					} catch { }
				}, 180);
			}
		} catch { }
	}, [videoUrl]);

	// Helper: keep quick card visible for a short moment after an action
	const scheduleHideQuickCard = (delay = 1800) => {
		if (quickCardTimerRef.current) { clearTimeout(quickCardTimerRef.current); quickCardTimerRef.current = null; }
		quickCardTimerRef.current = setTimeout(() => {
			setShowQuickCard(false);
			quickCardTimerRef.current = null;
		}, delay);
	};

	// Quick-action handlers for the floating long-press card
	const onQuickLike = (e) => {
		e?.stopPropagation?.();
		if (!auth.user) { auth.openAuthModal(); return; }
		setLiked((s) => {
			const next = !s;
			// if we're liking, ensure dislike is cleared and synced to backend
			if (next) {
				setDisliked(false);
				try {
					const token = localStorage.getItem('regaarder_token');
					if (token) {
						const BACKEND = (window && window.__BACKEND_URL__) || `${window.location.protocol}//${window.location.hostname}:4000`;
						fetch(`${BACKEND}/dislikes`, {
							method: 'DELETE',
							headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
							body: JSON.stringify({ videoId: videoUrl || videoTitle || null })
						}).catch(() => { });
					}
				} catch (e) { }
			}
			// persist like/unlike to backend
			try {
				const token = localStorage.getItem('regaarder_token');
				if (token) {
					const BACKEND = (window && window.__BACKEND_URL__) || `${window.location.protocol}//${window.location.hostname}:4000`;
					fetch(`${BACKEND}/likes`, {
						method: next ? 'POST' : 'DELETE',
						headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
						body: JSON.stringify({ videoId: videoUrl || videoTitle || null })
					}).catch(() => { });
				}
			} catch (e) { }
			// persist like (or unlike) for real-time Liked Videos updates when not incognito
			try {
				if (!incognitoMode) {
					import('./likedvideos').then((m) => {
						if (m && typeof m.recordLike === 'function') {
							m.recordLike({
								videoId: videoUrl || videoTitle || null,
								url: videoUrl || null,
								title: videoTitle || null,
								creatorName,
								imageUrl: (() => {
									// Try to resolve a thumbnail from discover items or dynamic home list
									try {
										const candidates = (discoverItems && Array.isArray(discoverItems) ? discoverItems : (discoverItemsData || []));
										if (Array.isArray(candidates) && candidates.length) {
											const found = candidates.find(v => (v.url && String(v.url) === String(videoUrl)) || (v.videoUrl && String(v.videoUrl) === String(videoUrl)) || (v.title && String(v.title) === String(videoTitle)));
											if (found) return found.thumbnail || found.imageUrl || null;
										}
									} catch { }
									// dynamic import as a fallback
									try {
										// avoid blocking: return null and allow likedvideos to fetch /videos
										/* no-op */
									} catch { }
									return null;
								})(),
								liked: next,
								timestamp: new Date().toISOString()
							});
						}
					});
				}
			} catch { }
			return next;
		});
		if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
		setToastMessage(getTranslation('Liked', selectedLanguage));
		toastTimerRef.current = setTimeout(() => setToastMessage(''), 1200);
		// keep card visible briefly so user can see feedback
		scheduleHideQuickCard(1800);
	};

	const onQuickDislike = (e) => {
		e?.stopPropagation?.();
		if (!auth.user) { auth.openAuthModal(); return; }
		setDisliked((s) => {
			const next = !s;
			// if we're disliking, ensure like is cleared
			if (next) setLiked(false);

			// Persist dislike to backend
			try {
				const token = localStorage.getItem('regaarder_token');
				if (token) {
					const BACKEND = (window && window.__BACKEND_URL__) || `${window.location.protocol}//${window.location.hostname}:4000`;
					fetch(`${BACKEND}/dislikes`, {
						method: next ? 'POST' : 'DELETE',
						headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
						body: JSON.stringify({ videoId: videoUrl || videoTitle || null })
					}).catch(() => { });
				}
			} catch (e) { }

			// when user dislikes, remove from liked list (if not incognito)
			try {
				if (!incognitoMode && next) {
					import('./likedvideos').then((m) => {
						if (m && typeof m.recordLike === 'function') {
							m.recordLike({
								videoId: videoUrl || videoTitle || null,
								url: videoUrl || null,
								title: videoTitle || null,
								creatorName,
								liked: false,
								timestamp: new Date().toISOString()
							});
						}
					});
				}
			} catch { }
			return next;
		});
		if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
		setToastMessage(getTranslation('Video Disliked', selectedLanguage));
		toastTimerRef.current = setTimeout(() => setToastMessage(''), 1200);
		// keep card visible briefly so user can see feedback
		scheduleHideQuickCard(1800);
	};

	const onQuickBookmark = (e) => {
		e?.stopPropagation?.();
		try {
			openBookmarkModalAtCurrent();
		} catch { }
	};

	const formatTime = (secs) => {
		const s = Math.max(0, Math.floor(secs || 0));
		return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
	};

	// Perform share with feedback
	const performShare = async (u) => {
		// Always prefer the branded Regaarder share URL
		const shareUrl = (typeof getShareUrl === 'function') ? getShareUrl() : (u || '');
		if (!shareUrl) return;
		try {
			if (navigator.share) {
				await navigator.share({ title: videoTitle || 'Watch on Regaarder', text: videoTitle ? `${videoTitle} — Watch on Regaarder` : 'Watch on Regaarder', url: shareUrl });
				setToastMessage(getTranslation('Shared', selectedLanguage));
			} else {
				await copyToClipboard(shareUrl);
				setToastMessage(getTranslation('Link copied', selectedLanguage));
			}
		} catch (err) {
			// fallback: copy and notify
			try { await copyToClipboard(shareUrl); } catch { }
			setToastMessage(getTranslation('Link copied', selectedLanguage));
		}
		if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
		toastTimerRef.current = setTimeout(() => setToastMessage(''), 1600);
	};

	// Perform watch-together action: provide haptic feedback and navigate
	const performWatchTogether = (e) => {
		try { e?.stopPropagation?.(); } catch { }
		try { if (navigator.vibrate) navigator.vibrate(12); } catch { }
		// small delay to allow vibration to trigger on some devices
		setTimeout(() => {
			try { window.location.href = './watchtogether.jsx'; } catch { }
		}, 50);
	};

	// Share dialog helpers: QR preview, download, and social share actions
	const [showQrPreview, setShowQrPreview] = useState(false);
	const [qrImageSrc, setQrImageSrc] = useState("");

	const openQrFor = async (u) => {
		if (!u) return;
		try {
			// Prefer a globally available QR generator (injected via CDN or provided by the host app).
			if (typeof window !== 'undefined' && window.QRCode && typeof window.QRCode.toDataURL === 'function') {
				const dataUrl = await window.QRCode.toDataURL(u, { width: 360 });
				setQrImageSrc(dataUrl);
			} else if (typeof window !== 'undefined' && typeof window.kjua === 'function') {
				// kjua returns an element (canvas or svg). Convert to data URL.
				const el = window.kjua({ text: u, fill: '#000', back: '#fff', size: 360 });
				if (el && el.tagName === 'CANVAS') {
					setQrImageSrc(el.toDataURL('image/png'));
				} else if (el) {
					const svg = new XMLSerializer().serializeToString(el);
					const svg64 = btoa(unescape(encodeURIComponent(svg)));
					setQrImageSrc('data:image/svg+xml;base64,' + svg64);
				} else {
					throw new Error('kjua returned no element');
				}
			} else {
				// No local generator available — use the public QR API as a safe runtime fallback
				const src = `https://api.qrserver.com/v1/create-qr-code/?size=360x360&data=${encodeURIComponent(u)}`;
				setQrImageSrc(src);
			}
			setShowQrPreview(true);
			setTimeout(() => {
				try {
					if (qrRef.current) qrRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
					else if (shareContentRef.current) shareContentRef.current.scrollTop = shareContentRef.current.scrollHeight;
					// vibration disabled per user preference
				} catch { }
			}, 90);
		} catch (err) {
			// final fallback to server-generated QR
			const src = `https://api.qrserver.com/v1/create-qr-code/?size=360x360&data=${encodeURIComponent(u)}`;
			setQrImageSrc(src);
			setShowQrPreview(true);
			setTimeout(() => {
				try { if (qrRef.current) qrRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' }); } catch { }
			}, 90);
		}
	};

	const downloadQr = () => {
		if (!qrImageSrc) return;
		const a = document.createElement('a');
		a.href = qrImageSrc;
		a.download = 'video-qr.png';
		document.body.appendChild(a);
		a.click();
		a.remove();
	};

	// handleDownloadVideo removed here to avoid duplicate declarations;
	// a single implementation lives later in the file (uses UI state and fallbacks).

	const shareToFacebook = (u) => window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(u)}`, '_blank', 'noopener');
	const shareToTwitter = (u, text = 'Watch this video') => window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(u)}`, '_blank', 'noopener');
	const shareToEmail = (u) => { window.location.href = `mailto:?subject=${encodeURIComponent('Watch video')}&body=${encodeURIComponent(u)}`; };
	const shareToInstagram = (u) => { copyToClipboard(u); alert('Link copied — open Instagram and paste it into a new post or story.'); };

	// Bookmarked state for the current video (backend-persisted per user)
	const [bookmarked, setBookmarked] = useState(false);
	const BACKEND_URL = typeof window !== 'undefined'
		? (window.__BACKEND_URL__ || `${window.location.protocol}//${window.location.hostname}:4000`)
		: 'http://localhost:4000';
	// Refresh bookmark state when video changes
	useEffect(() => {
		try {
			if (!videoUrl) { setBookmarked(false); return; }
			const token = localStorage.getItem('regaarder_token');
			fetch(`${BACKEND_URL}/bookmarks`, { headers: token ? { Authorization: `Bearer ${token}` } : {} })
				.then(r => r.json()).then(data => {
					if (data && data.success) {
						const isBookmarked = Array.isArray(data.videos) && data.videos.some(v => String(v.videoUrl) === String(videoUrl));
						setBookmarked(!!isBookmarked);
					}
				}).catch(() => { });
		} catch { }
	}, [videoUrl]);

	// NEW: captions modal state & settings
	const [showCaptions, setShowCaptions] = useState(false);
	const [captionsEnabled, setCaptionsEnabled] = usePref('captionsEnabled', false);
	const [captionLanguage, setCaptionLanguage] = usePref('captionLanguage', "English");
	const [captionFontSize, setCaptionFontSize] = usePref('captionFontSize', 16); // px
	const [captionPosition, setCaptionPosition] = usePref('captionPosition', "Bottom");
	const [captionTextColor, setCaptionTextColor] = usePref('captionTextColor', "#FFFFFF");
	const [captionBgOpacity, setCaptionBgOpacity] = usePref('captionBgOpacity', "100% Black");
	// NEW: editable preview text for captions preview
	const [captionPreviewText, setCaptionPreviewText] = useState(
		getTranslation("Example subtitle text", (typeof window !== 'undefined' ? (localStorage.getItem('regaarder_language') || 'English') : 'English'))
	);

	// One-time handle hint visibility (shown once per dialog using localStorage)
	const [optionsHandleHintVisible, setOptionsHandleHintVisible] = useState(false);
	const [captionsHandleHintVisible, setCaptionsHandleHintVisible] = useState(false);
	const [shareHandleHintVisible, setShareHandleHintVisible] = useState(false);
	const [tipHandleHintVisible, setTipHandleHintVisible] = useState(false);
	const [reportHandleHintVisible, setReportHandleHintVisible] = useState(false);
	const [notesHandleHintVisible, setNotesHandleHintVisible] = useState(false);
	// One-time quick-options hint (shown once after user watches >2s)
	const [quickOptionsHintVisible, setQuickOptionsHintVisible] = useState(false);

	// Suggestion card state (appears after full video end)
	const [showSuggestionCard, setShowSuggestionCard] = useState(false);
	const [suggestionText, setSuggestionText] = useState("I’d like a video about …");
	// Controls a brief exit animation so the card can animate out before unmounting
	const [suggestionExiting, setSuggestionExiting] = useState(false);

	// Progressive expansion + goal-gradient progress
	const [suggestionFocused, setSuggestionFocused] = useState(false);
	const SUGGESTION_GOAL = 120; // characters used to compute the progress fill
	const suggestionExpanded = suggestionFocused || ((suggestionText || '').length > 0);
	const suggestionProgress = Math.min(((suggestionText || '').length) / SUGGESTION_GOAL, 1);
	const suggestionTextareaHeight = suggestionExpanded ? 140 : 36; // px

	const closeSuggestionCard = (delay = 360) => {
		setSuggestionExiting(true);
		setTimeout(() => {
			setSuggestionExiting(false);
			setShowSuggestionCard(false);
		}, delay);
	};
	const [suggestionSending, setSuggestionSending] = useState(false);

	const sendSuggestionToCreator = async () => {
		if (!auth.user) { auth.openAuthModal(); return; }
		try {
			setSuggestionSending(true);
			const payload = {
				requestId: null,
				text: (suggestionText || '').trim(),
				videoTitle: videoTitle || null,
				videoUrl: videoUrl || null,
				targetCreatorHandle: creatorName || null
			};
			let sent = false;
			try {
				const token = localStorage.getItem('regaarder_token');
				if (token && payload.text) {
					const res = await fetch(`${window.location.protocol}//${window.location.hostname}:4000/suggestion`, {
						method: 'POST',
						headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
						body: JSON.stringify(payload)
					});
					const data = await res.json().catch(() => ({}));
					sent = res.ok && data && data.success;
				}
			} catch { }
			// Fallback: local storage if backend fails
			if (!sent) {
				try {
					const key = 'creatorSuggestions';
					const raw = localStorage.getItem(key);
					const arr = raw ? JSON.parse(raw) : [];
					arr.unshift({ id: Date.now(), ...payload, timestamp: new Date().toISOString() });
					localStorage.setItem(key, JSON.stringify(arr.slice(0, 200)));
				} catch { }
			}
			setSuggestionSending(false);
			try { closeSuggestionCard(360); } catch { setShowSuggestionCard(false); }
			try { setToastMessage('Suggestion sent — thanks!'); } catch { }
			return true;
		} catch (err) {
			setSuggestionSending(false);
			try { setToastMessage('Failed to send suggestion'); } catch { }
			return false;
		}
	};


	// demonstrating swipe-down (previous) then swipe-left (discover).
	const [gestureHintVisible, setGestureHintVisible] = useState(false);
	const gestureStateRef = useRef({ startX: 0, startY: 0 });
	const [gestureStep, setGestureStep] = useState(0); // 0=down,1=up,2=left
	const prevGestureHintVisibleRef = useRef(false);

	useEffect(() => {
		try {
			if (!localStorage.getItem('vx:hint:gesture')) {
				// show the gesture hint (we'll mark it persisted once the user interacts)
				setGestureHintVisible(true);
				setGestureStep(0);
			}
		} catch { }
	}, []);

	useEffect(() => {
		if (!showMenu) return;
		try {
			const key = 'handleHintShownOptions';
			if (!localStorage.getItem(key)) {
				setOptionsHandleHintVisible(true);
				setTimeout(() => setOptionsHandleHintVisible(false), 3400);
				localStorage.setItem(key, '1');
			}
		} catch { }
	}, [showMenu]);

	useEffect(() => {
		if (!showCaptions) return;
		try {
			const key = 'handleHintShownCaptions';
			if (!localStorage.getItem(key)) {
				setCaptionsHandleHintVisible(true);
				setTimeout(() => setCaptionsHandleHintVisible(false), 3400);
				localStorage.setItem(key, '1');
			}
		} catch { }
	}, [showCaptions]);

	useEffect(() => {
		if (!showShareModal) return;
		try {
			const key = 'handleHintShownShare';
			if (!localStorage.getItem(key)) {
				setShareHandleHintVisible(true);
				setTimeout(() => setShareHandleHintVisible(false), 3400);
				localStorage.setItem(key, '1');
			}
		} catch { }
	}, [showShareModal]);

	useEffect(() => {
		if (!showTipModal) return;
		try {
			const key = 'handleHintShownTip';
			if (!localStorage.getItem(key)) {
				setTipHandleHintVisible(true);
				setTimeout(() => setTipHandleHintVisible(false), 3400);
				localStorage.setItem(key, '1');
			}
		} catch { }
	}, [showTipModal]);

	useEffect(() => {
		if (!showReportModal) return;
		try {
			const key = 'handleHintShownReport';
			if (!localStorage.getItem(key)) {
				setReportHandleHintVisible(true);
				setTimeout(() => setReportHandleHintVisible(false), 3400);
				localStorage.setItem(key, '1');
			}
		} catch { }
	}, [showReportModal]);

	const [showCommentsModal, setShowCommentsModal] = useState(false);
	const [showNotesModal, setShowNotesModal] = useState(false);

	useEffect(() => {
		if (!showNotesModal) return;
		try {
			const key = 'handleHintShownNotes';
			if (!localStorage.getItem(key)) {
				setNotesHandleHintVisible(true);
				setTimeout(() => setNotesHandleHintVisible(false), 3400);
				localStorage.setItem(key, '1');
			}
		} catch { }
	}, [showNotesModal]);

	// Show a one-time quick-options hint immediately after the gesture onboarding finishes.
	useEffect(() => {
		try {
			const key = 'handleHintShownQuickOptions';
			if (localStorage.getItem(key)) return; // already shown
			// track previous visibility so we only fire when the gesture hint transitions from visible -> hidden
			const prevRef = { current: null };
			// use a small ref outside render to track previous value
			let prev = null;
			try { prev = prevGestureHintVisibleRef.current; } catch { }
			// if gesture was visible and now it's hidden, show the quick-options hint
			if (prev === true && !gestureHintVisible) {
				// show the hint and keep it visible until the user performs the long-press
				setQuickOptionsHintVisible(true);
			}
			// update tracking ref
			try { prevGestureHintVisibleRef.current = gestureHintVisible; } catch { }
		} catch { }
	}, [gestureHintVisible]);



	// NEW: progress bar color state & presets (persisted)
	// Default to theme accent color, allowing user to override with quick presets
	const [progressColor, setProgressColor] = usePref('progressColor', themeAccentColor || "#9333ea");
	// Loop + playback controls (persisted)
	const [loopVideo, setLoopVideo] = usePref('loopVideo', false);
	// Auto-play toggle (persisted, default ON)
	const [autoPlayEnabled, setAutoPlayEnabled] = usePref('autoPlayEnabled', true);
	const colorPresets = ['#ca8a04', '#a95bf3', '#dc2626', '#db2777', '#9333ea', '#c084fc', '#0891b2', '#059669', '#65a30d', '#84cc16', '#eab308', '#f59e0b'];

	// Unified autoplay effect: ensure video starts playing (muted for autoplay policy compliance)
	useEffect(() => {
		const v = videoRef.current;
		if (!v || !videoUrl || !autoPlayEnabled) return;
		// Skip for YouTube — iframe handles its own playback
		if (isYouTubeVideo) return;

		let cancelled = false;

		const tryPlay = async () => {
			if (cancelled) return;
			// Skip while overlay ad is active — video should stay paused during ads
			if (hadOverlayAdRef.current) return;
			const el = videoRef.current;
			if (!el) return;
			try {
				el.muted = true;
				el.playsInline = true;
				el.autoplay = true;
				el.preload = 'auto';

				// CRITICAL: On Android WebView, changing the React `src` prop may not
				// trigger the video element to start loading. Force load() when the
				// element hasn't started loading yet (readyState 0 = HAVE_NOTHING).
				if (el.readyState === 0) {
					const resolved = resolveMediaUrl(videoUrl);
					if (resolved) {
						if (el.src !== resolved) {
							try { el.src = resolved; } catch { }
						}
						try { el.load(); } catch { }
					}
				}

				const p = el.play();
				if (p && typeof p.then === 'function') {
					await p;
					if (!cancelled) {
						setIsPlaying(true);
						// Unmute after play succeeds — Android WebView often allows unmuting
						// once playback is already running (even without user gesture).
						try { el.muted = false; el.volume = 1.0; } catch { }
					}
				}
			} catch { /* autoplay blocked — ok, user will tap to play */ }
		};

		const onCanPlay = () => { tryPlay(); };
		const onVisibility = () => {
			if (document.visibilityState === 'visible') tryPlay();
		};

		try { v.addEventListener('canplay', onCanPlay); } catch { }
		try { v.addEventListener('loadeddata', onCanPlay); } catch { }
		try { document.addEventListener('visibilitychange', onVisibility); } catch { }

		// Try immediately if ready, else stagger retries so Android WebView has time to commit src
		if (v.readyState >= 2) {
			tryPlay();
		} else {
			setTimeout(() => { tryPlay(); }, 150);
			setTimeout(() => { tryPlay(); }, 600);
			setTimeout(() => { tryPlay(); }, 1500);
		}

		return () => {
			cancelled = true;
			try { v.removeEventListener('canplay', onCanPlay); } catch { }
			try { v.removeEventListener('loadeddata', onCanPlay); } catch { }
			try { document.removeEventListener('visibilitychange', onVisibility); } catch { }
		};
	}, [videoUrl, autoPlayEnabled, videoMountTick, isYouTubeVideo]);

	// Persist progressColor to backend preference
	useEffect(() => {
		const savePref = async () => {
			try {
				const token = localStorage.getItem('regaarder_token');
				if (!token) return;
				const BACKEND = (window && window.__BACKEND_URL__) || `${window.location.protocol}//${window.location.hostname}:4000`;
				await fetch(`${BACKEND}/users/preferences`, {
					method: 'PATCH',
					headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
					body: JSON.stringify({ preferences: { progressColor } })
				});
			} catch (e) { }
		};
		const t = setTimeout(savePref, 2000); // debounce 2s
		return () => clearTimeout(t);
	}, [progressColor]);

	// derive accent & contrast for UI elements from the progressColor
	const hexToRgba = (hex, a = 1) => {
		let h = hex.replace("#", "").trim();
		if (h.length === 3) h = h.split("").map(c => c + c).join("");
		const r = parseInt(h.substr(0, 2), 16);
		const g = parseInt(h.substr(2, 2), 16);
		const b = parseInt(h.substr(4, 2), 16);
		return `rgba(${r}, ${g}, ${b}, ${a})`;
	};
	const getContrastColor = (hex) => {
		let h = hex.replace("#", "").trim();
		if (h.length === 3) h = h.split("").map(c => c + c).join("");
		const r = parseInt(h.substr(0, 2), 16) / 255;
		const g = parseInt(h.substr(2, 2), 16) / 255;
		const b = parseInt(h.substr(4, 2), 16) / 255;
		const lum = 0.2126 * r + 0.7152 * g + 0.0722 * b;
		return lum > 0.6 ? "#000" : "#fff";
	};
	const accentColor = progressColor;
	// Bookmark accent (purple) used specifically for the Bookmark modal
	const bookmarkAccent = '#9333ea';
	// slightly reduce border alpha so accents feel dimmer
	const accentBorder = hexToRgba(progressColor, 0.06);
	const accentText = getContrastColor(progressColor);

	// New UI states for modal controls (persisted preferences)
	const [darkMode, setDarkMode] = usePref('darkMode', true);
	const [selectedQuality, setSelectedQuality] = usePref('selectedQuality', "480p");
	const [autoQualityEnabled, setAutoQualityEnabled] = useState(selectedQuality === "Auto");

	// map of quality -> source URL (can be extended/overridden)
	const qualitySources = useRef({});
	const autoQualityRef = useRef("480p"); // Track the currently selected auto quality

	// Detect network connection type and speed
	const getNetworkQuality = () => {
		try {
			const connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
			if (!connection) return "480p"; // Default fallback
			
			const effectiveType = connection.effectiveType; // "4g", "3g", "2g", "slow-2g"
			const downlink = connection.downlink; // Mbps
			
			// Determine quality based on effective type and downlink speed
			if (effectiveType === "4g" && downlink >= 10) return "1440p";
			if (effectiveType === "4g" && downlink >= 5) return "1080p";
			if (effectiveType === "4g" && downlink >= 2.5) return "720p";
			if (effectiveType === "3g" && downlink >= 2.5) return "720p";
			if (effectiveType === "3g" || downlink >= 1.5) return "480p";
			if (effectiveType === "2g" || downlink >= 0.5) return "360p";
			return "240p"; // Minimum quality for very slow networks
		} catch (e) {
			return "480p"; // Default fallback
		}
	};

	// Monitor network changes and auto-adjust quality
	useEffect(() => {
		if (selectedQuality !== "Auto") {
			setAutoQualityEnabled(false);
			return;
		}

		setAutoQualityEnabled(true);
		const v = videoRef.current;
		if (!v) return;

		// Initial quality based on network
		const initialQuality = getNetworkQuality();
		autoQualityRef.current = initialQuality;

		// Monitor network changes
		const connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
		const handleNetworkChange = () => {
			const newQuality = getNetworkQuality();
			if (newQuality !== autoQualityRef.current) {
				autoQualityRef.current = newQuality;
				// Switch quality only if not manually paused
				if (!v.paused) {
					try {
						const newSrc = getQualitySrc(newQuality);
						if (newSrc && (v.currentSrc || v.src || '').split('?')[0] !== newSrc.split('?')[0]) {
							const currentTime = v.currentTime || 0;
							v.pause();
							v.src = resolveMediaUrl(newSrc);
							v.load();
							v.currentTime = Math.max(0, Math.min(currentTime, v.duration || Infinity));
							v.play().catch(() => {});
						}
					} catch (err) {}
				}
			}
		};

		if (connection) {
			connection.addEventListener('change', handleNetworkChange);
			return () => connection.removeEventListener('change', handleNetworkChange);
		}
	}, [selectedQuality]);

	const getQualitySrc = (quality) => {
		// Get actual quality to use (convert "Auto" to current auto quality)
		const qualityToUse = quality === "Auto" ? autoQualityRef.current : quality;
		
		// priority: explicit mapping in qualitySources, otherwise try to derive from videoUrl
		if (qualitySources.current && qualitySources.current[qualityToUse]) return qualitySources.current[qualityToUse];
		const base = videoUrl && videoUrl.trim() ? videoUrl.trim() : "";
		try {
			// try replace resolution token like 480p/720p in filename
			if (/\b\d{3,4}p\b/.test(base)) {
				return base.replace(/\b\d{3,4}p\b/, qualityToUse);
			}
			// fallback: append query param so server (if aware) may serve variant
			const url = new URL(base, window.location.origin);
			url.searchParams.set('quality', qualityToUse);
			return url.toString();
		} catch (e) {
			// last resort: return base unchanged
			return base;
		}
	};

	// Map our quality labels to YouTube's playback quality identifiers
	const qualityToYouTubeQuality = (q) => {
		const map = { '144p': 'tiny', '240p': 'small', '360p': 'medium', '480p': 'large', '720p': 'hd720', '1080p': 'hd1080', '1440p': 'hd1440', '2160p': 'hd2160' };
		return map[q] || 'default';
	};

	// When selectedQuality changes, attempt to swap the video src while preserving time/play state
	useEffect(() => {
		try {
			// For YouTube videos: send setPlaybackQuality command via postMessage
			if (isYouTubeVideo && ytIframeRef.current && ytIframeRef.current.contentWindow) {
				const ytQuality = selectedQuality === 'Auto' ? 'default' : qualityToYouTubeQuality(selectedQuality);
				try {
					ytIframeRef.current.contentWindow.postMessage(JSON.stringify({ event: 'command', func: 'setPlaybackQuality', args: [ytQuality] }), '*');
				} catch { }
				return;
			}

			const v = videoRef.current;
			if (!v) return;
			
			// If Auto is selected, skip this effect and let the auto quality effect handle it
			if (selectedQuality === "Auto") return;
			
			const newSrc = getQualitySrc(selectedQuality);
			if (!newSrc) return;
			// if the src is already the same, nothing to do
			if ((v.currentSrc || v.src || '').split('?')[0] === newSrc.split('?')[0]) return;
			const wasPlaying = !v.paused && !v.ended;
			const currentTime = v.currentTime || 0;
			v.pause();
			v.src = resolveMediaUrl(newSrc);
			// try to restore time and play
			v.load();
			v.currentTime = Math.max(0, Math.min(currentTime, v.duration || Infinity));
			if (wasPlaying) {
				const p = v.play();
				if (p && p.catch) p.catch(() => { });
			}
		} catch (err) {
			// noop
		}
	}, [selectedQuality, isYouTubeVideo]);
	const [playbackSpeed, setPlaybackSpeed] = usePref('playbackSpeed', 1);

	// Incognito mode: when true, don't persist watch history or likes (persisted)
	const [incognitoMode, setIncognitoMode] = usePref('incognitoMode', false);
	// confirmation state when disabling incognito
	const [showIncognitoConfirm, setShowIncognitoConfirm] = useState(false);

	// helper to dispatch player-side events so other modules (watchhistory.jsx, likes.jsx)
	// can listen and decide whether to persist actions based on the `incognito` flag.
	const dispatchPlayerEvent = (name, detail = {}) => {
		try {
			window.dispatchEvent(new CustomEvent(name, { detail }));
		} catch (e) {
			// noop - some environments may restrict CustomEvent
		}
	};

	// called when playback starts; notifies listeners about a watch event
	const handlePlayRecord = useCallback(() => {
		const info = {
			videoUrl,
			videoTitle,
			creatorName,
			time: Date.now(),
			incognito: incognitoMode
		};
		dispatchPlayerEvent('player:watch', info);
		// if not incognito, also set a toast so user knows their watch is recorded
		if (!incognitoMode) {
			// do not show a toast when watch history is recorded
		}
	}, [videoUrl, videoTitle, creatorName, incognitoMode]);

	// (incognito pref is now managed via usePref/localStorage)

	// apply playback speed to video element AND YouTube iframe when it changes
	useEffect(() => {
		try {
			if (videoRef.current) videoRef.current.playbackRate = playbackSpeed;
		} catch { }
		// Also apply to YouTube iframe via postMessage
		try {
			if (ytIframeRef.current && ytIframeRef.current.contentWindow) {
				ytIframeRef.current.contentWindow.postMessage(JSON.stringify({ event: 'command', func: 'setPlaybackRate', args: [playbackSpeed] }), '*');
			}
		} catch { }
	}, [playbackSpeed]);

	// keep loop property in sync with state
	useEffect(() => {
		try { if (videoRef.current) videoRef.current.loop = loopVideo; } catch { }
	}, [loopVideo]);

	// Ensure the player restarts when it ends if loopVideo is enabled.
	// Some environments or transforms can interfere with the native `loop` attribute,
	// so we add an explicit 'ended' handler as a robust fallback.
	useEffect(() => {
		const v = videoRef.current;
		if (!v) return;
		const onEnded = async () => {
			if (loopVideo) {
				try {
					v.currentTime = 0;
					await v.play();
					setIsPlaying(true);
				} catch (e) {
					// ignore play errors (autoplay policies etc.)
				}
			}
		};
		v.addEventListener('ended', onEnded);
		return () => v.removeEventListener('ended', onEnded);
	}, [loopVideo]);

	// Watch-history integration: record progress from the main mobile player
	useEffect(() => {
		const v = videoRef.current;
		if (!v) return;
		if (incognitoMode) return;
		let mounted = true;
		const recordRef = { current: null };
		// dynamic import so missing module doesn't crash the bundle
		import('./watchhistory').then((m) => { if (mounted) recordRef.current = m.recordWatchProgress; }).catch(() => { });

		const saveProgress = (isComplete = false) => {
			try {
				const fn = recordRef.current;
				if (typeof fn !== 'function') return;
				fn({
					videoId: videoInfo?.id || videoUrl || videoTitle || null,
					userId: null,
					lastWatchedTime: Math.floor(v.currentTime || 0),
					duration: Math.floor(v.duration || 0),
					timestamp: new Date().toISOString(),
					isComplete: Boolean(isComplete)
				});
			} catch (e) { }
		};

		const onPause = () => saveProgress(false);
		const onEnded = () => saveProgress(true);

		v.addEventListener('pause', onPause);
		v.addEventListener('ended', onEnded);

		const interval = setInterval(() => { try { if (!v.paused && !v.ended) saveProgress(false); } catch { } }, 15000);

		const onPageHide = () => saveProgress(v.ended || false);
		window.addEventListener('pagehide', onPageHide);
		const onVis = () => { if (document.visibilityState === 'hidden') onPageHide(); };
		document.addEventListener('visibilitychange', onVis);

		return () => {
			mounted = false;
			try { v.removeEventListener('pause', onPause); v.removeEventListener('ended', onEnded); } catch { }
			try { window.removeEventListener('pagehide', onPageHide); document.removeEventListener('visibilitychange', onVis); } catch { }
			clearInterval(interval);
		};
	}, [videoUrl, videoTitle, incognitoMode]);
	const [doubleTap, setDoubleTap] = usePref('doubleTap', true);

	// New: show Watch Together button after a delay (3s)
	const [showWatchTogether, setShowWatchTogether] = useState(false); // Disabled - set to always false
	// transient fade state when hiding the inline Watch Together button
	const [watchFading, setWatchFading] = useState(false);
	// NEW: floating mode states for the Watch Together floating action
	const [isFloatingMode, setIsFloatingMode] = useState(false); // Disabled - set to always false
	const [floatVisible, setFloatVisible] = useState(false); // whether floating button is visible (true after floating starts)
	const [collapsed, setCollapsed] = useState(false); // collapsed -> show chevron
	const [collapsedSide, setCollapsedSide] = useState("left"); // where the chevron sits when collapsed
	const [floatPos, setFloatPos] = useState({ x: 20, y: 220 }); // default fixed position (px)
	const dragRef = useRef({ dragging: false, startX: 0, startY: 0, origX: 0, origY: 0, nextX: 0, nextY: 0 });
	const floatMovedRef = useRef(false); // true when floating button moved (to suppress click->navigate)

	const floatBtnRef = useRef(null);
	const rafRef = useRef(null);
	useEffect(() => {
		// Watch Together floating logic disabled
		/*
		const t = setTimeout(() => {
			// Switch to floating Watch Together icon after delay
			setIsFloatingMode(true);
			setFloatVisible(true);
			setShowWatchTogether(false);
		}, 3000);
		return () => clearTimeout(t);
		*/
	}, []);

	// When inline button appears, after 7s fade it out (skip when floating mode is active)
	useEffect(() => {
		if (!showWatchTogether || isFloatingMode) return;
		const t = setTimeout(() => {
			// start fade animation
			setWatchFading(true);
			// after animation completes, actually hide it
			const FADE_MS = 260;
			const t2 = setTimeout(() => {
				setShowWatchTogether(false);
				setWatchFading(false);
				// ensure no floating button appears
				setIsFloatingMode(false);
				setFloatVisible(false);
			}, FADE_MS);
			// cleanup inner timeout if needed
			return () => clearTimeout(t2);
		}, 7000); // 7s after appearing
		return () => clearTimeout(t);
	}, [showWatchTogether]);

	// Drag handlers for floating button
	const onFloatPointerDown = (e) => {
		e.preventDefault();
		const p = dragRef.current;
		floatMovedRef.current = false;
		p.dragging = true;
		// cancel any pending RAF
		if (rafRef.current) { cancelAnimationFrame(rafRef.current); rafRef.current = null; }
		const pointX = e.clientX ?? (e.touches && e.touches[0]?.clientX);
		const pointY = e.clientY ?? (e.touches && e.touches[0]?.clientY);
		p.startX = pointX;
		p.startY = pointY;
		p.origX = floatPos.x;
		p.origY = floatPos.y;
		p.nextX = floatPos.x;
		p.nextY = floatPos.y;
		// ensure immediate response: remove transition while dragging
		try { if (floatBtnRef.current) floatBtnRef.current.style.transition = 'none'; } catch { }
		// capture pointer for consistent moves
		if (e.target.setPointerCapture) try { e.target.setPointerCapture(e.pointerId); } catch { }
	};

	const onFloatPointerMove = (e) => {
		const p = dragRef.current;
		if (!p.dragging) return;
		const pointX = e.clientX ?? (e.touches && e.touches[0]?.clientX);
		const pointY = e.clientY ?? (e.touches && e.touches[0]?.clientY);
		if (typeof pointX !== "number" || typeof pointY !== "number") return;
		// mark as moved if the pointer travels more than a small threshold
		if (Math.abs(pointX - p.startX) > 3 || Math.abs(pointY - p.startY) > 3) floatMovedRef.current = true;
		const nx = p.origX + (pointX - p.startX);
		const ny = p.origY + (pointY - p.startY);
		// clamp to viewport with small margins
		const m = 6;
		const BUTTON_SIZE = 56; // match visual size of the floating button
		const clampX = Math.max(m, Math.min(window.innerWidth - BUTTON_SIZE - m, nx));
		const clampY = Math.max(m, Math.min(window.innerHeight - BUTTON_SIZE - m, ny));
		// store next values and schedule RAF to update DOM directly (bypass React state)
		p.nextX = clampX;
		p.nextY = clampY;
		if (!rafRef.current) {
			rafRef.current = requestAnimationFrame(() => {
				if (floatBtnRef.current) {
					floatBtnRef.current.style.left = `${p.nextX}px`;
					floatBtnRef.current.style.top = `${p.nextY}px`;
				}
				rafRef.current = null;
			});
		}

		// If user swipes beyond a dismiss distance while dragging, dismiss completely
		const dx = pointX - p.startX;
		const dy = pointY - p.startY;
		const DISMISS_DIST = 80; // px
		if (Math.abs(dx) >= DISMISS_DIST || Math.abs(dy) >= DISMISS_DIST) {
			p.dragging = false;
			try { e.target?.releasePointerCapture?.(e.pointerId); } catch { }
			setFloatVisible(false);
			setIsFloatingMode(false); // Dismiss completely
			// cancel any pending RAF
			if (rafRef.current) { cancelAnimationFrame(rafRef.current); rafRef.current = null; }
		}
	};

	const onFloatPointerUp = (e) => {
		const p = dragRef.current;
		if (!p.dragging) return;
		p.dragging = false;
		// release pointer capture
		if (e.target.releasePointerCapture) try { e.target.releasePointerCapture(e.pointerId); } catch { }

		// Commit final position to state so it persists
		setFloatPos({ x: p.nextX, y: p.nextY });

		// restore transition so the button snaps smoothly to final position
		try { if (floatBtnRef.current) floatBtnRef.current.style.transition = 'transform 220ms ease, left 220ms ease, top 220ms ease'; } catch { }
		// cancel any pending RAF
		if (rafRef.current) { cancelAnimationFrame(rafRef.current); rafRef.current = null; }
	};


	// show toast briefly when locking; hide automatically
	React.useEffect(() => {
		let tToast = null;
		let tVisual = null;
		if (locked) {
			setShowLockToast(true);
			setShowLockVisual(true);
			// pulse the lock button briefly to draw attention
			setPulsating(true);
			if (pulseTimerRef.current) { clearTimeout(pulseTimerRef.current); pulseTimerRef.current = null; }
			pulseTimerRef.current = setTimeout(() => {
				setPulsating(false);
				pulseTimerRef.current = null;
			}, 1400);
			// hide toast after 1200ms
			tToast = setTimeout(() => setShowLockToast(false), 1200);
			// hide visual a bit after toast (e.g., 150ms later)
			tVisual = setTimeout(() => setShowLockVisual(false), 1350);
		} else {
			// unlocked: hide immediately and clear any pending timers
			setShowLockToast(false);
			setShowLockVisual(false);
			setPulsating(false); // stop pulsation when unlocking
		}
		return () => {
			if (tToast) clearTimeout(tToast);
			if (tVisual) clearTimeout(tVisual);
		};
	}, [locked]);

	// Cleanup for locked error toast if unmounted
	useEffect(() => {
		return () => {
			if (lockedErrorTimerRef.current) {
				clearTimeout(lockedErrorTimerRef.current);
				lockedErrorTimerRef.current = null;
			}
			// clear any pending pulse timeout on unmount
			if (pulseTimerRef.current) {
				clearTimeout(pulseTimerRef.current);
				pulseTimerRef.current = null;
			}
			// clear center hide timer
			if (centerHideTimerRef.current) {
				clearTimeout(centerHideTimerRef.current);
				centerHideTimerRef.current = null;
			}
			// clear long-press / quick-card timers
			if (longPressTimerRef.current) {
				clearTimeout(longPressTimerRef.current);
				longPressTimerRef.current = null;
			}
			if (quickCardTimerRef.current) {
				clearTimeout(quickCardTimerRef.current);
				quickCardTimerRef.current = null;
			}
			// clear bright-lock timer
			if (brightLockTimerRef.current) {
				clearTimeout(brightLockTimerRef.current);
				brightLockTimerRef.current = null;
			}
		};
	}, []);

	// play/pause helper
	const togglePlay = async () => {
		// Block play/pause while an overlay ad is showing
		if (visibleAds && visibleAds.some(a => a.type === 'overlay')) return;

		// YouTube videos: use postMessage to control the iframe
		if (isYouTubeVideo && ytIframeRef.current) {
			try {
				// Always ensure unmuted on user interaction (satisfies autoplay policy)
				ytIframeRef.current.contentWindow.postMessage(JSON.stringify({ event: 'command', func: 'unMute' }), '*');
				ytIframeRef.current.contentWindow.postMessage(JSON.stringify({ event: 'command', func: 'setVolume', args: [100] }), '*');
				if (isPlaying) {
					ytIframeRef.current.contentWindow.postMessage(JSON.stringify({ event: 'command', func: 'pauseVideo' }), '*');
					setIsPlaying(false);
				} else {
					ytIframeRef.current.contentWindow.postMessage(JSON.stringify({ event: 'command', func: 'playVideo' }), '*');
					setIsPlaying(true);
				}
				try { showCenterTemporarily(); } catch { }
			} catch { }
			return;
		}

		const v = videoRef.current;
		if (!v) return;
		try {
			if (v.paused || v.ended) {
				// User tapped — this is a user gesture, so we can safely unmute
				v.muted = false;
				v.volume = 1.0;
				await v.play();
				setIsPlaying(true);
				// reveal center overlay briefly when playback starts
				try { showCenterTemporarily(); } catch { }
			} else {
				v.pause();
				setIsPlaying(false);
				// reveal center overlay briefly when playback pauses
				try { showCenterTemporarily(); } catch { }
			}
		} catch {
			// autoplay blocked or other error
		}
	};

	// Copy / Download helpers: visual feedback + haptic (vibration) on copy
	const [copiedLink, setCopiedLink] = useState(false);
	const copyTimerRef = useRef(null);
	/* Build a branded Regaarder share URL for this video */
	const getShareUrl = () => {
		const id = searchParams.get('id') || (videoInfo && (videoInfo.id || videoInfo.videoId)) || '';
		if (id && id !== 'custom') {
			return `${WEB_URL}/share/video/${encodeURIComponent(id)}`;
		}
		// Fallback: link to the videoplayer page with src param
		const src = videoUrl || '';
		if (src) return `${WEB_URL}/videoplayer?src=${encodeURIComponent(src)}`;
		return `${WEB_URL}/home`;
	};

	const copyLink = async () => {
		const shareUrl = getShareUrl();
		try {
			await navigator.clipboard.writeText(shareUrl);
			setCopiedLink(true);
			try { if (navigator.vibrate) navigator.vibrate(10); } catch { }
			if (copyTimerRef.current) clearTimeout(copyTimerRef.current);
			copyTimerRef.current = setTimeout(() => setCopiedLink(false), 1600);
		} catch (e) {
			// fallback: try execCommand (older browsers)
			try {
				const ta = document.createElement('textarea');
				ta.value = shareUrl;
				ta.style.position = 'fixed';
				ta.style.opacity = '0';
				document.body.appendChild(ta);
				ta.select();
				document.execCommand('copy');
				document.body.removeChild(ta);
				setCopiedLink(true);
				if (copyTimerRef.current) clearTimeout(copyTimerRef.current);
				copyTimerRef.current = setTimeout(() => setCopiedLink(false), 1600);
			} catch { }
		}
	};

	const [downloading, setDownloading] = useState(false);
	const isDownloadDisabled = isYouTubeVideo; // YouTube videos cannot be downloaded
	const handleDownloadVideo = async (e) => {
		try {
			e?.stopPropagation?.();
			if (!videoUrl) return;
			// Block download for YouTube — not possible due to CORS/terms
			if (isYouTubeVideo) {
				setToastMessage(getTranslation('Download not available for YouTube videos', selectedLanguage));
				if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
				toastTimerRef.current = setTimeout(() => setToastMessage(''), 2000);
				return;
			}
			setDownloading(true);
			// try a simple anchor download first
			try {
				const a = document.createElement('a');
				a.href = videoUrl;
				a.download = '';
				document.body.appendChild(a);
				a.click();
				a.remove();
				setTimeout(() => setDownloading(false), 600);
				return;
			} catch (err) {
				// fallback to fetch+blob
			}

			try {
				const resp = await fetch(videoUrl);
				const blob = await resp.blob();
				const url = URL.createObjectURL(blob);
				const a = document.createElement('a');
				a.href = url;
				a.download = 'video.mp4';
				document.body.appendChild(a);
				a.click();
				a.remove();
				URL.revokeObjectURL(url);
			} catch (err) {
				// ignore
			} finally {
				setDownloading(false);
			}
		} finally {
			// nothing
		}
	};

	// NEW: toggle fullscreen and lock to landscape when possible
	const toggleFullscreen = async () => {
		const v = videoRef.current;
		// For YouTube videos videoRef is null — still allow fullscreen via document
		if (!v && !isYouTubeVideo) return;

		// Helpers for prefixed APIs
		const requestFS = async (el) => {
			if (!el) return;
			// Standard
			if (el.requestFullscreen) return el.requestFullscreen();
			// WebKit (older Safari / iOS-like)
			if (el.webkitRequestFullscreen) return el.webkitRequestFullscreen();
			// Some iOS WebKit video method
			if (el.webkitEnterFullscreen) return el.webkitEnterFullscreen();
		};
		const exitFS = async () => {
			if (document.exitFullscreen) return document.exitFullscreen();
			if (document.webkitExitFullscreen) return document.webkitExitFullscreen();
		};

		try {
			// If already fullscreen -> exit
			if (document.fullscreenElement || document.webkitFullscreenElement) {
				await exitFS();
				setForceLandscapeCss(false);
				try { await screen.orientation?.unlock?.(); } catch { /* noop */ }
				return;
			}

			// Try to request fullscreen. Prefer the entire document to maximize screen real estate
			const target = document.documentElement || v;
			await requestFS(target);

			// Orientation lock should be requested after entering fullscreen.
			const doLock = async () => {
				try {
					// Try landscape-primary first, fall back to landscape
					try {
						await screen.orientation?.lock?.("landscape-primary");
					} catch {
						await screen.orientation?.lock?.("landscape");
					}
				} catch {
					// some browsers require fullscreen + user gesture or don't support lock
					// Force CSS fallback rotation
					setForceLandscapeCss(true);
				}
			};

			// Wait a bit for fullscreen to fully activate, then lock orientation
			await new Promise(resolve => setTimeout(resolve, 100));
			
			// Immediately try to lock
			await doLock();
			
			// Double-check and ensure landscape CSS is applied if orientation lock failed
			setTimeout(() => {
				const isPortraitViewport = (typeof window !== "undefined") && window.innerHeight > window.innerWidth;
				if (isPortraitViewport) {
					setForceLandscapeCss(true);
				}
			}, 300);

			// Also listen for fullscreen change in case orientation lock updates
			const handler = async () => {
				if (document.fullscreenElement || document.webkitFullscreenElement) {
					// Still in fullscreen, ensure landscape
					const isPortraitViewport = (typeof window !== "undefined") && window.innerHeight > window.innerWidth;
					if (isPortraitViewport) {
						setForceLandscapeCss(true);
					}
				}
				document.removeEventListener("fullscreenchange", handler);
				document.removeEventListener("webkitfullscreenchange", handler);
			};
			document.addEventListener("fullscreenchange", handler);
			document.addEventListener("webkitfullscreenchange", handler);
		} catch {
			// noop on errors (permissions, unsupported APIs)
		}
	};

	// Keep orientation state in sync with fullscreen state
	useEffect(() => {
		const onFullChange = () => {
			if (document.fullscreenElement || document.webkitFullscreenElement) {
				setIsFullscreen(true);
				// entering fullscreen: prefer landscape layout
				setOrientation("landscape");
				const isPortraitViewport = (typeof window !== "undefined") && window.innerHeight > window.innerWidth;
				setForceLandscapeCss(isPortraitViewport);
			} else {
				setIsFullscreen(false);
				// exiting fullscreen: restore based on natural aspect
				setOrientation(naturalAspect < 1 ? "portrait" : "landscape");
				setForceLandscapeCss(false);
				try { screen.orientation?.unlock?.(); } catch { /* noop */ }
			}
		};
		document.addEventListener("fullscreenchange", onFullChange);
		document.addEventListener("webkitfullscreenchange", onFullChange);

		// iOS Safari: mirror native fullscreen orientation behavior
		const v = videoRef.current;
		const onBeginFS = () => { setOrientation("landscape"); setForceLandscapeCss(false); };
		const onEndFS = () => { setOrientation(naturalAspect < 1 ? "portrait" : "landscape"); setForceLandscapeCss(false); };
		if (v && v.addEventListener) {
			try { v.addEventListener("webkitbeginfullscreen", onBeginFS); } catch { }
			try { v.addEventListener("webkitendfullscreen", onEndFS); } catch { }
		}

		// If the device rotates to landscape later, disable CSS fallback
		const orientCheck = () => {
			const t = screen.orientation?.type || "";
			if (t.startsWith("landscape")) setForceLandscapeCss(false);
		};
		window.addEventListener("orientationchange", orientCheck);

		return () => {
			document.removeEventListener("fullscreenchange", onFullChange);
			document.removeEventListener("webkitfullscreenchange", onFullChange);
			window.removeEventListener("orientationchange", orientCheck);
			if (v && v.removeEventListener) {
				try { v.removeEventListener("webkitbeginfullscreen", onBeginFS); } catch { }
				try { v.removeEventListener("webkitendfullscreen", onEndFS); } catch { }
			}
		};
	}, [naturalAspect]);

	// When user starts interacting with the progress bar, show preview but DO NOT pause the main video
	const handleProgressPointerDown = (e) => {
		// reveal center overlay while interacting with the progress bar
		try { showCenterTemporarily(); } catch { }
		draggingRef.current = true;
		setProgressDragging(true);
		const clientX = e.clientX || (e.touches && e.touches[0]?.clientX);

		// show preview
		setPreviewVisible(true);
		// set preview size according to orientation (portrait previews taller)
		if (orientation === "portrait") setPreviewSize({ w: 112, h: 200 }); // 9:16-ish small preview
		else setPreviewSize({ w: 180, h: 100 }); // 16:9 preview

		// ensure preview video is loaded (preload="metadata" below helps). Seek preview
		if (clientX) updateProgressFromPointer(clientX);
	};

	// --- Auto-hide / show-on-tap logic ---
	// Auto-hide behavior for the center play/pause overlay only.
	// The progress bar and other controls remain visible when `controlsVisible` is true.
	const showCenterTemporarily = (visibleFor = 2500) => {
		setControlsVisible(true);
		setCenterVisible(true);
		if (centerHideTimerRef.current) {
			clearTimeout(centerHideTimerRef.current);
			centerHideTimerRef.current = null;
		}
		centerHideTimerRef.current = setTimeout(() => {
			setCenterVisible(false);
			centerHideTimerRef.current = null;
		}, visibleFor);
	};

	// deprecated name kept for compatibility (calls new implementation)
	const showControlsTemporarily = (visibleFor = 7000) => showCenterTemporarily(visibleFor);

	// Ensure center overlay briefly appears when playback state changes
	useEffect(() => {
		try { showCenterTemporarily(1200); } catch { }
	}, [isPlaying]);

	// initial mount: ensure controls visible; do not auto-hide
	useEffect(() => {
		setControlsVisible(true);
	}, []);

	// Landscape / fullscreen: auto-hide ALL controls after 2 seconds of playing
	const landscapeHideTimerRef = useRef(null);
	useEffect(() => {
		// Only apply auto-hide in landscape/fullscreen mode while playing
		if (!(isFullscreen || forceLandscapeCss)) return;
		if (!isPlaying) {
			// If paused, show controls and cancel any pending hide
			setControlsVisible(true);
			if (landscapeHideTimerRef.current) { clearTimeout(landscapeHideTimerRef.current); landscapeHideTimerRef.current = null; }
			return;
		}
		// Playing in landscape: hide controls after 2 seconds
		if (landscapeHideTimerRef.current) clearTimeout(landscapeHideTimerRef.current);
		landscapeHideTimerRef.current = setTimeout(() => {
			setControlsVisible(false);
			setCenterVisible(false);
			landscapeHideTimerRef.current = null;
		}, 2000);
		return () => { if (landscapeHideTimerRef.current) { clearTimeout(landscapeHideTimerRef.current); landscapeHideTimerRef.current = null; } };
	}, [isFullscreen, forceLandscapeCss, isPlaying, controlsVisible]);

	// Android Immersive Mode: Hide status bar and navigation bar on mount for full-screen experience
	useLayoutEffect(() => {
		if (typeof window === 'undefined') return;
		
		try {
			// Try native Capacitor plugins for immersive mode (works on all Android versions)
			const Cap = window.Capacitor || (typeof Capacitor !== 'undefined' ? Capacitor : null);
			if (Cap && Cap.Plugins) {
				// ImmersiveMode plugin (custom)
				if (Cap.Plugins.ImmersiveMode) {
					try { Cap.Plugins.ImmersiveMode.setImmersive({ enabled: true }); } catch (e) {}
				}
				// StatusBar plugin
				if (Cap.Plugins.StatusBar) {
					try { Cap.Plugins.StatusBar.hide(); } catch (e) {}
					try { Cap.Plugins.StatusBar.setOverlaysWebView({ overlay: true }); } catch (e) {}
				}
				// NavigationBar / SystemBars plugin
				if (Cap.Plugins.NavigationBar) {
					try { Cap.Plugins.NavigationBar.hide(); } catch (e) {}
				}
				if (Cap.Plugins.SystemBars) {
					try { Cap.Plugins.SystemBars.hide?.({ bar: 'StatusBar' }); } catch (e) {}
					try { Cap.Plugins.SystemBars.hide?.({ bar: 'NavigationBar' }); } catch (e) {}
				}
			}

			// Apply viewport meta tag for immersive experience on Android
			let viewportMeta = document.querySelector('meta[name="viewport"]');
			if (!viewportMeta) {
				viewportMeta = document.createElement('meta');
				viewportMeta.name = 'viewport';
				document.head.appendChild(viewportMeta);
			}
			
			// Set viewport to cover all available space including safe areas
			viewportMeta.setAttribute('content', 'width=device-width, initial-scale=1.0, viewport-fit=cover, user-scalable=no, maximum-scale=1');
			
			// Try to hide the address bar and system UI
			if (document.documentElement.requestFullscreen) {
				// Modern fullscreen request (will trigger on user gesture if available)
				// Don't auto-trigger; let user tap fullscreen button instead
			}
			
			// Apply CSS to hide safe area padding on phones and make it truly immersive
			const style = document.createElement('style');
			style.textContent = `
				html, body {
					width: 100vw;
					height: 100vh;
					max-width: 100vw;
					overflow: hidden;
					margin: 0;
					padding: 0;
					border: 0;
					background: #000;
				}
			`;
			
			// Store style for cleanup
			const styleId = 'regaarder-immersive-style';
			let existingStyle = document.getElementById(styleId);
			if (existingStyle) existingStyle.remove();
			
			style.id = styleId;
			document.head.appendChild(style);
			
			// NOTE: Do NOT lock orientation to landscape on mount.
			// The player opens in portrait mode; landscape is handled by toggleFullscreen.
			
			// Hide scrollbars
			document.documentElement.style.overflow = 'hidden';
			document.body.style.overflow = 'hidden';
			
			return () => {
				// Cleanup on unmount
				try {
					const style = document.getElementById(styleId);
					if (style) style.remove();
				} catch (e) {}
				
				// Restore immersive mode (show bars again)
				try {
					const Cap = window.Capacitor || (typeof Capacitor !== 'undefined' ? Capacitor : null);
					if (Cap && Cap.Plugins) {
						if (Cap.Plugins.ImmersiveMode) try { Cap.Plugins.ImmersiveMode.setImmersive({ enabled: false }); } catch (e) {}
						if (Cap.Plugins.StatusBar) try { Cap.Plugins.StatusBar.show(); } catch (e) {}
						if (Cap.Plugins.NavigationBar) try { Cap.Plugins.NavigationBar.show(); } catch (e) {}
						if (Cap.Plugins.SystemBars) {
							try { Cap.Plugins.SystemBars.show?.({ bar: 'StatusBar' }); } catch (e) {}
							try { Cap.Plugins.SystemBars.show?.({ bar: 'NavigationBar' }); } catch (e) {}
						}
					}
				} catch (e) {}
				
				// Try to unlock orientation on unmount
				try {
					if (window.screen && window.screen.orientation && window.screen.orientation.unlock) {
						window.screen.orientation.unlock();
					}
				} catch (e) {}
				
				// Restore overflow
				document.documentElement.style.overflow = '';
				document.body.style.overflow = '';
			};
		} catch (e) {
			// Ignore errors if APIs not available
		}
	}, []);

	/* ── PiP lifecycle: tell Android that auto-PiP is allowed while videoplayer is mounted ── */
	useEffect(() => {
		// Direct bridge (most reliable)
		if (window.NativePiP && typeof window.NativePiP.setPipAllowed === 'function') {
			try { window.NativePiP.setPipAllowed(true); } catch { }
		}
		// Capacitor fallback
		const Cap = window.Capacitor || (typeof Capacitor !== 'undefined' ? Capacitor : null);
		if (Cap && Cap.Plugins && Cap.Plugins.PiPMode) {
			try { Cap.Plugins.PiPMode.setPipAllowed({ allowed: true }); } catch { }
		}
		return () => {
			if (window.NativePiP && typeof window.NativePiP.setPipAllowed === 'function') {
				try { window.NativePiP.setPipAllowed(false); } catch { }
			}
			if (Cap && Cap.Plugins && Cap.Plugins.PiPMode) {
				try { Cap.Plugins.PiPMode.setPipAllowed({ allowed: false }); } catch { }
			}
		};
	}, []);

	/* ── Native Picture-in-Picture event listeners ── */
	useEffect(() => {
		const v = videoRef.current;
		if (!v) return;

		const onEnterPiP = () => {
			console.log('[PiP] Mobile: Entered browser Picture-in-Picture');
			try { setIsInPiPMode(true); setControlsVisible(false); } catch { }
		};

		const onLeavePiP = () => {
			console.log('[PiP] Mobile: Left browser Picture-in-Picture');
			try { setIsInPiPMode(false); setControlsVisible(true); } catch { }
		};

		// Browser PiP events (Chrome, Safari, Edge)
		v.addEventListener('enterpictureinpicture', onEnterPiP);
		v.addEventListener('leavepictureinpicture', onLeavePiP);

		// Android Capacitor PiP event (dispatched by MainActivity)
		const onAndroidPiP = (e) => {
			const isInPip = !!(e && e.detail && e.detail.pip);
			console.log('[PiP] Mobile: Android pipModeChanged:', isInPip);
			try {
				setIsInPiPMode(isInPip);
				setControlsVisible(!isInPip);
			} catch { }
		};
		window.addEventListener('pipModeChanged', onAndroidPiP);

		// Native PiP play/pause action (sent by Android RemoteAction via MainActivity)
		// Java passes {detail:{play:true/false}} so we don't rely on stale React closures.
		const onPipTogglePlay = (e) => {
			try {
				// Block during overlay ads — ad has priority
				if (hadOverlayAdRef.current) return;
				const shouldPlay = !!(e && e.detail && e.detail.play);
				// YouTube: detect via ref (avoids stale isYouTubeVideo closure)
				if (ytIframeRef && ytIframeRef.current && ytIframeRef.current.contentWindow) {
					const iframe = ytIframeRef.current;
					if (shouldPlay) {
						// Front-run the unpause: flash a black cover BEFORE YouTube
						// shows its branding overlay, then remove it after 2s
						setPipYtFlash(true);
						// Let the cover paint first, THEN send the play command
						requestAnimationFrame(() => {
							requestAnimationFrame(() => {
								iframe.contentWindow.postMessage(JSON.stringify({ event: 'command', func: 'playVideo' }), '*');
								setIsPlaying(true);
								// Keep cover up for 2s — long enough for all YT branding to settle
								setTimeout(() => setPipYtFlash(false), 2000);
							});
						});
					} else {
						setIsPlaying(false);
						iframe.contentWindow.postMessage(JSON.stringify({ event: 'command', func: 'pauseVideo' }), '*');
					}
					return;
				}
				// Native video
				const vid = videoRef.current;
				if (vid) {
					if (shouldPlay) { vid.play(); } else { vid.pause(); }
					setIsPlaying(shouldPlay);
				}
			} catch { }
		};
		window.addEventListener('pipTogglePlay', onPipTogglePlay);

		return () => {
			try { v.removeEventListener('enterpictureinpicture', onEnterPiP); } catch { }
			try { v.removeEventListener('leavepictureinpicture', onLeavePiP); } catch { }
			try { window.removeEventListener('pipModeChanged', onAndroidPiP); } catch { }
			try { window.removeEventListener('pipTogglePlay', onPipTogglePlay); } catch { }
		};
	}, [videoMountTick]);

	// when lock toggles, keep controls visible (do not auto-hide)
	useEffect(() => {
		setControlsVisible(true);
	}, [locked]);

	// Keep UI visible while any modal is open; do not auto-hide when closed
	useEffect(() => {
		if (showMenu || showCaptions || showShareModal || showCommentsModal) {
			setControlsVisible(true);
		}
	}, [showMenu, showCaptions, showShareModal, showCommentsModal]);

	// NEW: tap handler (single tap shows controls; double tap likes center or seeks sides)
	// Heart explosion: spawn 15 hearts flying radially from tap point
	const triggerHeartExplosion = useCallback((clientX, clientY) => {
		const id = Date.now();
		const count = 15;
		const particles = [];
		for (let i = 0; i < count; i++) {
			const angle = (360 / count) * i + (Math.random() * 24 - 12); // spread evenly with jitter
			const rad = (angle * Math.PI) / 180;
			const distance = 80 + Math.random() * 120; // how far each heart flies
			const dx = Math.cos(rad) * distance;
			const dy = Math.sin(rad) * distance;
			const size = 16 + Math.random() * 14; // 16-30px
			const duration = 600 + Math.random() * 400; // 600-1000ms
			const delay = Math.random() * 80; // slight stagger
			particles.push({ dx, dy, size, duration, delay, angle: Math.random() * 40 - 20 });
		}
		const explosion = { id, x: clientX, y: clientY, particles };
		setHeartExplosions(prev => [...prev, explosion]);
		// Auto-remove after longest animation
		setTimeout(() => {
			setHeartExplosions(prev => prev.filter(e => e.id !== id));
		}, 1200);
	}, []);

	const handleVideoTap = (e) => {
		e.stopPropagation();
		// Block taps while an overlay ad is showing
		if (visibleAds && visibleAds.some(a => a.type === 'overlay')) return;
		if (locked) {
			// brief visual hint: brighten the lock so user sees where to tap to unlock
			try {
				setBrightLock(true);
				if (brightLockTimerRef.current) clearTimeout(brightLockTimerRef.current);
				brightLockTimerRef.current = setTimeout(() => { setBrightLock(false); brightLockTimerRef.current = null; }, 1100);
			} catch { }
			// show short error toast guiding the user
			try {
				setShowLockedError(true);
				if (lockedErrorTimerRef.current) clearTimeout(lockedErrorTimerRef.current);
				lockedErrorTimerRef.current = setTimeout(() => setShowLockedError(false), 1600);
			} catch { }
			return;
		}
		// reveal the center overlay briefly on any tap
		try { showCenterTemporarily(); } catch { }

		// get position info for center/side detection
		const rect = e.currentTarget.getBoundingClientRect();
		const x = e.clientX - rect.left;
		const centerX = rect.width / 2;
		const centerZone = rect.width * 0.3; // center 60% area

		if (tapTimerRef.current) {
			// double tap: cancel pending single-tap action
			clearTimeout(tapTimerRef.current);
			tapTimerRef.current = null;

			if (doubleTap) {
				// Double-tap anywhere → like the video + radial heart explosion
				setLiked(true);
				triggerHeartExplosion(e.clientX, e.clientY);
			}
		} else {
			// single tap -> after debounce decide action: center toggles play, sides show controls
			tapTimerRef.current = setTimeout(() => {
				try {
					if (Math.abs(x - centerX) < centerZone) {
						// center tap toggles playback
						togglePlay();
					} else {
						// non-center single tap shows controls and center overlay briefly
						showCenterTemporarily();
					}
				} catch { }
				tapTimerRef.current = null;
			}, 250);
		}
	};

	// --- ADDED: swipe-to-reveal carbon-copy panel (starts from middle area) ---
	const [isSwiping, setIsSwiping] = useState(false);
	const swipeStartRef = useRef({ x: 0, y: 0 });
	const prevSwipeTriggeredRef = useRef(false);
	const nextSwipeTriggeredRef = useRef(false);
	// long-press detection for bookmarking a moment
	const longPressTimerRef = useRef(null);
	const longPressTriggeredRef = useRef(false);
	const longPressStartRef = useRef({ x: 0, y: 0 });

	// Quick action card state shown on long-press (small translucent floating card)
	const [showQuickCard, setShowQuickCard] = useState(false);
	const [quickCardPos, setQuickCardPos] = useState({ x: 0, y: 0 });
	const quickCardTimerRef = useRef(null);
	const quickCardRef = useRef(null);

	// Hide quick card when clicking/tapping outside of it
	useEffect(() => {
		const onGlobalPointerDown = (e) => {
			try {
				if (!showQuickCard) return;
				if (e.target && e.target.closest && e.target.closest('.quick-action-card')) return;
				setShowQuickCard(false);
				if (quickCardTimerRef.current) { clearTimeout(quickCardTimerRef.current); quickCardTimerRef.current = null; }
			} catch { }
		};
		window.addEventListener('pointerdown', onGlobalPointerDown, { passive: true });
		return () => window.removeEventListener('pointerdown', onGlobalPointerDown);
	}, [showQuickCard]);
	const [swipeTranslate, setSwipeTranslate] = useState(0); // negative px while dragging left
	const [showCarbonCopy, setShowCarbonCopy] = useState(false);
	const panelWidthRef = useRef(Math.min(480, (typeof window !== "undefined" ? Math.round(window.innerWidth * 0.92) : 360)));

	useEffect(() => {
		const onResize = () => {
			if (typeof window !== "undefined") {
				panelWidthRef.current = Math.min(480, Math.round(window.innerWidth * 0.92));
			}
		};
		window.addEventListener("resize", onResize);
		return () => window.removeEventListener("resize", onResize);
	}, []);

	const resetSwipe = () => {
		setIsSwiping(false);
		setSwipeTranslate(0);
		prevSwipeTriggeredRef.current = false;
		nextSwipeTriggeredRef.current = false;
		try { /* noop */ } catch { }
	};

	// main center area pointer handlers (start only when pointerdown begins in the middle of the screen)
	const onCenterPointerDown = (e) => {
		// reveal center overlay when user touches the center area
		try { showCenterTemporarily(); } catch { }
		// prefer pointer events; also accept touch/mouse
		const clientX = e.clientX ?? (e.touches && e.touches[0]?.clientX);
		const clientY = e.clientY ?? (e.touches && e.touches[0]?.clientY);
		if (typeof clientX !== "number" || typeof clientY !== "number") return;

		const w = window.innerWidth;
		// only allow gestures that start near the center horizontally (30%..70%)
		if (clientX < w * 0.3 || clientX > w * 0.7) return;

		swipeStartRef.current = { x: clientX, y: clientY };
		// record tutorial start pos for gesture detection
		gestureStateRef.current = { startX: clientX, startY: clientY };
		setIsSwiping(true);
		setSwipeTranslate(0);

		// Start long-press timer to open Bookmark modal if user holds in place
		try {
			longPressTriggeredRef.current = false;
			longPressStartRef.current = { x: clientX, y: clientY };
			if (longPressTimerRef.current) { clearTimeout(longPressTimerRef.current); longPressTimerRef.current = null; }
			longPressTimerRef.current = setTimeout(() => {
				longPressTriggeredRef.current = true;
				// cancel swipe state so gestures don't conflict
				setIsSwiping(false);
				setSwipeTranslate(0);
				// advance tutorial step when user completes press & hold
				try {
					if (gestureHintVisible && gestureStep === 2) {
						setGestureStep(3);
						gestureStateRef.current = { startX: clientX, startY: clientY };
					}
				} catch { }
				// show a small quick-action translucent card (Like / Dislike / Bookmark)
				try {
					// hide the quick-options onboarding hint (user attempted the long-press)
					try { setQuickOptionsHintVisible(false); localStorage.setItem('handleHintShownQuickOptions', '1'); } catch { }
					setQuickCardPos({ x: clientX, y: clientY });
					setShowQuickCard(true);
					try { if (navigator.vibrate) navigator.vibrate(10); } catch { }
					if (quickCardTimerRef.current) { clearTimeout(quickCardTimerRef.current); quickCardTimerRef.current = null; }
					quickCardTimerRef.current = setTimeout(() => {
						setShowQuickCard(false);
						quickCardTimerRef.current = null;
					}, 3000);
				} catch (err) { }
			}, 550);
		} catch (err) { }

		// mark the gesture hint as shown once the user actually interacts
		try {
			if (gestureHintVisible && !localStorage.getItem('vx:hint:gesture')) {
				try { localStorage.setItem('vx:hint:gesture', '1'); } catch { }
			}
		} catch { }
		try { e.target?.setPointerCapture?.(e.pointerId); } catch { }
	};

	const onCenterPointerMove = (e) => {
		// If not swiping and not tracking long-press, ignore
		if (!isSwiping && !longPressTimerRef.current) return;
		const clientX = e.clientX ?? (e.touches && e.touches[0]?.clientX);
		const clientY = e.clientY ?? (e.touches && e.touches[0]?.clientY);
		if (typeof clientX !== "number" || typeof clientY !== "number") return;

		// If the user moves significantly, cancel a pending long-press
		try {
			if (longPressTimerRef.current) {
				const dxLP = clientX - (longPressStartRef.current.x || 0);
				const dyLP = clientY - (longPressStartRef.current.y || 0);
				const moveDist = Math.hypot(dxLP, dyLP);
				if (moveDist > 12) {
					clearTimeout(longPressTimerRef.current);
					longPressTimerRef.current = null;
				}
			}
		} catch (err) { }
		const dx = clientX - swipeStartRef.current.x;
		const dy = clientY - swipeStartRef.current.y;

		// If gesture hint is active, detect the sequence: swipe up, swipe down, press & hold, swipe left, then double-tap
		try {
			if (gestureHintVisible) {
				const g = gestureStateRef.current;
				// Stage 0: expect swipe UP to see next video
				if (gestureStep === 0 && (clientY - g.startY) < -80 && Math.abs(clientX - g.startX) < 140) {
					try {
						const next = {
							id: 'next-placeholder-1',
							url: 'https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4',
							title: 'Flowers for your grave',
							creator: 'Richard Castle',
							duration: 10,
							thumbnail: ''
						};
						setVideoTitle(next.title);
						setCreatorName(next.creator);
						setVideoUrl(resolveMediaUrl(next.url));
						setVideoInfo(null);
						setVideoAds([]);
						setVisibleAds([]);
						setVideoOverlays([]);
						setVisibleOverlays([]);
						dismissedAdIdsRef.current = new Set();
						adTimersRef.current = new Set();
						setControlsVisible(true);
						showCenterTemporarily(1600);
						showSwipeToast('Next video');
						setTimeout(async () => {
							try {
								const v = videoRef.current;
								if (v) {
									v.src = resolveMediaUrl(next.url);
									v.currentTime = 0;
									try { v.pause(); } catch { }
									setIsPlaying(false);
								}
							} catch (err) { }
						}, 120);
					} catch (err) { }
					// advance tutorial to next step (swipe DOWN)
					setGestureStep(1);
					gestureStateRef.current = { startX: clientX, startY: clientY };
					return;
				}
				// Stage 1: expect swipe DOWN to see previous video
				if (gestureStep === 1 && (clientY - g.startY) > 80 && Math.abs(clientX - g.startX) < 140) {
					try {
						const src = currentSourceRef.current || [];
						const idx = currentIndex;
						const prevIdx = (typeof idx === 'number' ? idx - 1 : -1);
						if (prevIdx >= 0 && src[prevIdx]) {
							const p = src[prevIdx];
							setVideoTitle(p.title || 'Video');
							setCreatorName(p.creator || '');
							setVideoUrl(resolveMediaUrl(p.url));
							setControlsVisible(true);
							showCenterTemporarily(1600);
							showSwipeToast('Previous video');
							setCurrentIndex(prevIdx);
							setTimeout(async () => {
								try {
									const v = videoRef.current;
									if (v) {
										if (p.url) v.src = resolveMediaUrl(p.url);
										v.currentTime = 0;
										try { v.pause(); } catch { }
										setIsPlaying(false);
									}
								} catch (err) { }
							}, 120);
						} else {
							setToastMessage('No previous video');
							if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
							toastTimerRef.current = setTimeout(() => setToastMessage(''), 1600);
						}
					} catch (err) { }
					// advance to press & hold
					setGestureStep(2);
					gestureStateRef.current = { startX: clientX, startY: clientY };
					return;
				}
				// Stage 3: expect swipe LEFT to discover more
				if (gestureStep === 3 && (clientX - g.startX) < -80 && Math.abs(clientY - g.startY) < 160) {
					try { setShowCarbonCopy(true); } catch { }
					setToastMessage('Discover opened');
					if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
					toastTimerRef.current = setTimeout(() => setToastMessage(''), 1400);
					// advance to double tap step (auto-advance after 2.5s)
					setGestureStep(4);
					setTimeout(() => {
						try { localStorage.setItem('vx:hint:gesture', '1'); } catch {}
						setGestureHintVisible(false);
						setGestureStep(0);
					}, 2800);
					return;
				}
			}
		} catch (err) { }

		// Detect upward swipe (next video) when vertical movement is large
		if (dy < -80 && Math.abs(dx) < 140 && !nextSwipeTriggeredRef.current) {
			nextSwipeTriggeredRef.current = true;
			const src = currentSourceRef.current || [];
			let idx = currentIndex;
			let nextIdx = (typeof idx === 'number' ? idx + 1 : 0);

			if (nextIdx < src.length && src[nextIdx]) {
				let next = src[nextIdx];
				// If it's a string ID, try to resolve it (legacy fallback), otherwise use object directly
				if (typeof next === 'string') {
					if (discoverItemsData) {
						const found = discoverItemsData.find(v => String(v.id) === String(next) || String(v.url) === String(next) || String(v.src) === String(next));
						if (found) next = found;
						else if (next.includes('/') || next.startsWith('http')) next = { url: next, title: 'Video', creator: '' };
					} else if (next.includes('/') || next.startsWith('http')) {
						next = { url: next, title: 'Video', creator: '' };
					}
				}

				if (next && (next.url || next.src || next.videoUrl)) {
					const nextUrl = next.url || next.src || next.videoUrl;
					setVideoTitle(next.title || 'Video');
					setCreatorName(next.creator || '');
					// Detect YouTube vs native video
					if (isYouTubeUrl(nextUrl)) {
						setIsYouTubeVideo(true);
						setYouTubeId(getYouTubeVideoId(nextUrl));
						setVideoUrl(nextUrl);
					} else {
						setIsYouTubeVideo(false);
						setYouTubeId('');
						setVideoUrl(resolveMediaUrl(nextUrl));
					}
					setDuration(0); setProgress(0);
					// Parse duration from video info
					if (next.time) {
						const parts = (next.time || '').split(':');
						if (parts.length === 2) {
							const secs = (parseInt(parts[0]) || 0) * 60 + (parseInt(parts[1]) || 0);
							if (secs > 0) setDuration(secs);
						}
					}
					// Reset ads/overlays from previous video
					setVideoInfo(next.id ? next : null);
					setVideoAds([]);
					setVisibleAds([]);
					setVideoOverlays([]);
					setVisibleOverlays([]);
					dismissedAdIdsRef.current = new Set();
					adTimersRef.current = new Set();
					setControlsVisible(true);
					showCenterTemporarily(1600);
					showSwipeToast('Next video');
					setCurrentIndex(nextIdx);
					// Only update native <video> element if this is NOT a YouTube video
					if (!isYouTubeUrl(nextUrl)) {
						setTimeout(async () => {
							try {
								const v = videoRef.current;
								if (v) {
									if (nextUrl) v.src = resolveMediaUrl(nextUrl);
									v.currentTime = 0;
									try { v.pause(); } catch { }
									setIsPlaying(false);
								}
							} catch (err) { }
						}, 120);
					} else {
						setIsPlaying(false);
					}
				} else {
					setToastMessage('No next video');
					if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
					toastTimerRef.current = setTimeout(() => setToastMessage(''), 1600);
				}
			} else {
				setToastMessage('No next video');
				if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
				toastTimerRef.current = setTimeout(() => setToastMessage(''), 1600);
			}
			resetSwipe();
			return;
		}

		// Detect downward swipe (previous video) when vertical movement is large
		if (dy > 80 && Math.abs(dx) < 140 && !prevSwipeTriggeredRef.current) {
			prevSwipeTriggeredRef.current = true;
			const src = currentSourceRef.current || [];
			let idx = currentIndex;
			let prevIdx = (typeof idx === 'number' ? idx - 1 : -1);

			if (prevIdx >= 0 && src[prevIdx]) {
				let prev = src[prevIdx];
				if (typeof prev === 'string') {
					if (discoverItemsData) {
						const found = discoverItemsData.find(v => String(v.id) === String(prev) || String(v.url) === String(prev) || String(v.src) === String(prev));
						if (found) prev = found;
						else if (prev.includes('/') || prev.startsWith('http')) prev = { url: prev, title: 'Video', creator: '' };
					} else if (prev.includes('/') || prev.startsWith('http')) {
						prev = { url: prev, title: 'Video', creator: '' };
					}
				}

				if (prev && (prev.url || prev.src || prev.videoUrl)) {
					const prevUrl = prev.url || prev.src || prev.videoUrl;
					setVideoTitle(prev.title || 'Video');
					setCreatorName(prev.creator || '');
					// Detect YouTube vs native video
					if (isYouTubeUrl(prevUrl)) {
						setIsYouTubeVideo(true);
						setYouTubeId(getYouTubeVideoId(prevUrl));
						setVideoUrl(prevUrl);
					} else {
						setIsYouTubeVideo(false);
						setYouTubeId('');
						setVideoUrl(resolveMediaUrl(prevUrl));
					}
					setDuration(0); setProgress(0);
					// Parse duration from video info
					if (prev.time) {
						const parts = (prev.time || '').split(':');
						if (parts.length === 2) {
							const secs = (parseInt(parts[0]) || 0) * 60 + (parseInt(parts[1]) || 0);
							if (secs > 0) setDuration(secs);
						}
					}
					// Reset ads/overlays from previous video
					setVideoInfo(prev.id ? prev : null);
					setVideoAds([]);
					setVisibleAds([]);
					setVideoOverlays([]);
					setVisibleOverlays([]);
					dismissedAdIdsRef.current = new Set();
					adTimersRef.current = new Set();
					setControlsVisible(true);
					showCenterTemporarily(1600);
					showSwipeToast('Previous video');
					setCurrentIndex(prevIdx);
					// Only update native <video> element if this is NOT a YouTube video
					if (!isYouTubeUrl(prevUrl)) {
						setTimeout(async () => {
							try {
								const v = videoRef.current;
								if (v) {
									if (prevUrl) v.src = resolveMediaUrl(prevUrl);
									v.currentTime = 0;
									try { v.pause(); } catch { }
									setIsPlaying(false);
								}
							} catch (err) { }
						}, 120);
					} else {
						setIsPlaying(false);
					}
				} else {
					setToastMessage('No previous video');
					if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
					toastTimerRef.current = setTimeout(() => setToastMessage(''), 1600);
				}
			} else {
				setToastMessage('No previous video');
				if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
				toastTimerRef.current = setTimeout(() => setToastMessage(''), 1600);
			}
			resetSwipe();
			return;
		}

		// if user moves vertically a lot, cancel swipe (allow scroll)
		if (Math.abs(dy) > 140 && Math.abs(dx) < 60) {
			resetSwipe();
			return;
		}

		// Only care about left swipes (dx negative). Limit to panel width.
		const maxLeft = -panelWidthRef.current;
		const translate = Math.max(maxLeft, Math.min(0, dx));
		setSwipeTranslate(translate);
	};

	const onCenterPointerUp = async (e) => {
		// If a long-press timer was running, clear it
		if (longPressTimerRef.current) {
			clearTimeout(longPressTimerRef.current);
			longPressTimerRef.current = null;
		}

		// If a long-press was triggered, swallow the up event to avoid tap/swipe actions
		if (longPressTriggeredRef.current) {
			longPressTriggeredRef.current = false;
			try { e.target?.releasePointerCapture?.(e.pointerId); } catch { }
			setIsSwiping(false);
			setSwipeTranslate(0);
			return;
		}

		if (!isSwiping) return;
		// detect vertical swipe down to show previous video
		try {
			const clientY = e.clientY ?? (e.changedTouches && e.changedTouches[0]?.clientY) ?? (e.touches && e.touches[0]?.clientY) ?? 0;
			const clientX = e.clientX ?? (e.changedTouches && e.changedTouches[0]?.clientX) ?? (e.touches && e.touches[0]?.clientX) ?? 0;
			const dy = clientY - (swipeStartRef.current.y || 0);
			const dx = clientX - (swipeStartRef.current.x || 0);
			// if user swiped down far enough (and not a large horizontal move), treat as "previous video"
			if (dy > 80 && Math.abs(dx) < 140) {
				// load previous video from playlist (no external fallback)
				const list = currentSourceRef.current || [];
				let idx = currentIndexRef.current;
				if (!Array.isArray(list) || list.length === 0 || typeof idx !== 'number' || idx <= 0) {
					setSwipeTranslate(0);
					setShowCarbonCopy(false);
					setIsSwiping(false);
					try { e.target?.releasePointerCapture?.(e.pointerId); } catch { }
					return;
				}
				const prevKey = list[idx - 1];
				try {
					const mod = await import('./home.jsx');
					const getVideoById = mod.getVideoById;
					const VIDEOS = mod.VIDEOS || mod.default?.VIDEOS || mod.homeVideos || mod.discoverItems || null;
					let prev = null;
					if (typeof getVideoById === 'function') prev = getVideoById(prevKey);
					if (!prev && Array.isArray(VIDEOS)) prev = VIDEOS.find(v => (v.id && String(v.id) === String(prevKey)) || (v.url && String(v.url) === String(prevKey)) || (v.src && String(v.src) === String(prevKey)));
					if (!prev && typeof prevKey === 'string' && /^(https?:)?\/\//.test(prevKey)) prev = { id: prevKey, title: 'Video', src: prevKey };
					if (prev) {
						const resolved = resolveMediaUrl(prev.src || prev.url || '');
						currentIndexRef.current = idx - 1;
						setVideoTitle(prev.title || 'Video');
						setCreatorName(prev.creator || prev.channel || '');
						setVideoUrl(resolveMediaUrl(resolved));
						// Reset ads/overlays from previous video
						setVideoInfo(prev.id ? prev : null);
						setVideoAds([]);
						setVisibleAds([]);
						setVideoOverlays([]);
						setVisibleOverlays([]);
						dismissedAdIdsRef.current = new Set();
						adTimersRef.current = new Set();
						setControlsVisible(true);
						showCenterTemporarily(1600);
						showSwipeToast('Previous video');
						setTimeout(async () => {
							try {
								const v = videoRef.current;
								if (v && resolved) {
									v.src = resolveMediaUrl(resolved);
									v.currentTime = 0;
									try { v.pause(); } catch { }
									setIsPlaying(false);
								}
							} catch (err) { }
						}, 120);
					}
				} catch (err) { }
				// snap panel closed and stop swiping
				setSwipeTranslate(0);
				setShowCarbonCopy(false);
				setIsSwiping(false);
				try { e.target?.releasePointerCapture?.(e.pointerId); } catch { }
				return;
			}
		} catch (err) { }
		const thresholdPx = Math.max(100, panelWidthRef.current * 0.25); // require ~25% or at least 100px
		// if dragged left beyond threshold -> open panel
		if (swipeTranslate <= -thresholdPx) {
			setShowCarbonCopy(true);
			setSwipeTranslate(-panelWidthRef.current);
		} else {
			// otherwise snap back closed
			setSwipeTranslate(0);
		}
		setIsSwiping(false);
		try { e.target?.releasePointerCapture?.(e.pointerId); } catch { }
	};

	// ---- ADD: panel-side pointer handlers (allow dragging the panel to the right to close) ----
	const panelPointerStartRef = useRef({ x: 0, y: 0 });
	const onPanelPointerDown = (e) => {
		const clientX = e.clientX ?? (e.touches && e.touches[0]?.clientX);
		const clientY = e.clientY ?? (e.touches && e.touches[0]?.clientY);
		if (typeof clientX !== "number") return;
		panelPointerStartRef.current = { x: clientX, y: clientY };
		// start swiping from the open position
		setIsSwiping(true);
		setSwipeTranslate(-panelWidthRef.current);
		try { e.target?.setPointerCapture?.(e.pointerId); } catch { }
	};
	const onPanelPointerMove = (e) => {
		if (!isSwiping) return;
		const clientX = e.clientX ?? (e.touches && e.touches[0]?.clientX);
		if (typeof clientX !== "number") return;
		const dx = clientX - panelPointerStartRef.current.x; // positive when dragging right -> close
		const w = panelWidthRef.current;
		let translate = -w + Math.max(0, dx); // -w .. 0
		translate = Math.min(0, Math.max(-w, translate));
		setSwipeTranslate(translate);
	};
	const onPanelPointerUp = (e) => {
		if (!isSwiping) return;
		const w = panelWidthRef.current;
		const closeThreshold = Math.max(100, w * 0.25);
		// if panel was dragged right enough -> close
		if (swipeTranslate > -w + closeThreshold) {
			// close
			setShowCarbonCopy(false);
			setSwipeTranslate(0);
		} else {
			// snap back open
			setShowCarbonCopy(true);
			setSwipeTranslate(-w);
		}
		setIsSwiping(false);
		try { e.target?.releasePointerCapture?.(e.pointerId); } catch { }
	};

	// When the right-side discover panel is open or being swiped, ensure the
	// underlying video element does not intercept pointer events. This lets
	// the panel's buttons/tabs remain interactive while the video keeps
	// playing in the background.
	useEffect(() => {
		try {
			const v = videoRef.current;
			if (!v) return;
			if (showCarbonCopy || isSwiping) {
				v.style.pointerEvents = 'none';
			} else {
				v.style.pointerEvents = '';
			}
		} catch (e) { }
	}, [showCarbonCopy, isSwiping]);

	// --- Video Ended / Autoplay Handler ---
	const handleVideoEnded = () => {
		setIsPlaying(false);
		
		// Pause video at the end
		try {
			const v = videoRef.current;
			if (v) v.pause();
		} catch (err) { }
		

		if (loopVideo) return; // loop logic handled by useEffect

		// Only auto-load next video if autoPlayEnabled is true
		if (!autoPlayEnabled) {
			setShowSuggestionCard(true);
			return;
		}

		const src = currentSourceRef.current || [];
		let idx = currentIndex;
		let nextIdx = (typeof idx === 'number' ? idx + 1 : 0);

		if (nextIdx < src.length && src[nextIdx]) {
			let next = src[nextIdx];
			// If it's a string ID, try to resolve it (legacy fallback), otherwise use object directly
			if (typeof next === 'string') {
				if (discoverItemsData) {
					const found = discoverItemsData.find(v => String(v.id) === String(next) || String(v.url) === String(next) || String(v.src) === String(next));
					if (found) next = found;
					else if (next.includes('/') || next.startsWith('http')) next = { url: next, title: 'Video', creator: '' };
				} else if (next.includes('/') || next.startsWith('http')) {
					next = { url: next, title: 'Video', creator: '' };
				}
			}

			if (next && (next.url || next.src || next.videoUrl)) {
				setVideoTitle(next.title || 'Video');
				setCreatorName(next.creator || '');
				setVideoUrl(resolveMediaUrl(next.url || next.src || next.videoUrl));
				// Reset videoInfo so ads/overlays from previous video are cleared
				setVideoInfo(next.id ? next : null);
				setVideoAds([]);
				setVisibleAds([]);
				setVideoOverlays([]);
				setVisibleOverlays([]);
				dismissedAdIdsRef.current = new Set();
				adTimersRef.current = new Set();
				setControlsVisible(true);
				showCenterTemporarily(1600);
				showSwipeToast('Next video');
				setCurrentIndex(nextIdx);
				setTimeout(async () => {
					try {
						const v = videoRef.current;
						if (v) {
							const u = next.url || next.src || next.videoUrl;
							if (u) v.src = resolveMediaUrl(u);
							v.currentTime = 0;
							// Auto-play is enabled, so try to play
							const p = v.play();
							if (p && p.catch) p.catch(() => { });
							setIsPlaying(true);
						}
					} catch (err) { }
				}, 120);
			} else {
				setShowSuggestionCard(true);
			}
		} else {
			setShowSuggestionCard(true);
		}
	};
	// Keep ref in sync so the YouTube message listener (set up earlier) can call the latest version
	handleVideoEndedRef.current = handleVideoEnded;

	// When rendered as overlay inside home.jsx (onChevronDown provided), use absolute positioning
	// to avoid double position:fixed which breaks Android WebView rendering.
	// When rendered as a route component (standalone), use position:fixed.
	const isOverlay = !!onChevronDown;

	// --- Render ---
	return (
		<div
			className={`bg-black w-full overflow-hidden flex flex-col pip-ready${isInPiPMode ? ' vx-pip-active' : ''}`}
			style={{
				boxSizing: "border-box",
				margin: 0,
				padding: 0,
				border: 0,
				position: isOverlay ? "absolute" : "fixed",
				top: 0,
				left: 0,
				right: 0,
				bottom: 0,
				width: "100%",
				height: "100%",
				maxWidth: "100vw",
				/* On Android: respect notches but don't add extra padding */
				paddingLeft: isInPiPMode ? 0 : "env(safe-area-inset-left, 0px)",
				paddingRight: isInPiPMode ? 0 : "env(safe-area-inset-right, 0px)",
				paddingTop: isInPiPMode ? 0 : "env(safe-area-inset-top, 0px)",
				paddingBottom: isInPiPMode ? 0 : "env(safe-area-inset-bottom, 0px)"
			}}
			onClick={(e) => {
				// If the user taps outside the video container (and not on a button), hide controls.
				try {
					// ignore clicks on interactive controls (buttons)
					if (e.target && e.target.closest && e.target.closest('button')) return;
					const insideVideo = e.target && e.target.closest && e.target.closest('.video-center');
					if (!insideVideo) {
						setControlsVisible(false);
					}
				} catch { }
			}}
		>
			{/* Inline styles for modal button feedback and ensuring modal buttons remain interactive */}
			<style>{`
					.modal-dialog button{ transition: transform .12s ease, filter .12s ease, box-shadow .12s ease, opacity .12s; cursor: pointer; }
					.modal-dialog button:active, .modal-dialog button[data-pressed="true"]{ transform: translateY(1px) scale(0.985); filter: brightness(0.94); opacity: 0.98; }
					.modal-dialog button{ pointer-events: auto !important; }
					/* slightly reduce active effect for toggles/switch inner elements */
					.modal-dialog button .w-5{ transition: transform .12s ease; }

					/* ── PiP mode: show ONLY the video, hide everything else ── */
					/* JS-triggered: applied before entering PiP via button tap */
					.vx-pip-active { padding: 0 !important; overflow: hidden !important; }
					.vx-pip-active > *:not(.vx-video-area):not(.vx-overlay-ads) { display: none !important; }
					.vx-pip-active .vx-video-area { position: absolute !important; inset: 0 !important; width: 100% !important; height: 100% !important; flex: none !important; margin: 0 !important; padding: 0 !important; border-radius: 0 !important; z-index: 1 !important; overflow: hidden !important; }
					/* Force ALL wrapper divs to fill 100% — transparent bg prevents black-layer stacking on YouTube */
					.vx-pip-active .vx-video-area div:not(.vx-pip-yt-cover) { position: absolute !important; inset: 0 !important; top: 0 !important; left: 0 !important; right: 0 !important; bottom: 0 !important; width: 100% !important; height: 100% !important; margin: 0 !important; padding: 0 !important; transform: none !important; border-radius: 0 !important; max-width: 100% !important; max-height: 100% !important; background: transparent !important; }
					.vx-pip-active .vx-video-area video { position: absolute !important; inset: 0 !important; width: 100% !important; height: 100% !important; object-fit: contain !important; border-radius: 0 !important; }
					/* YouTube iframe: no transform in PiP — scale causes white screen in tiny viewport. Branding is invisible at PiP size. */
					.vx-pip-active .vx-video-area iframe { position: absolute !important; inset: 0 !important; width: 100% !important; height: 100% !important; border-radius: 0 !important; transform: none !important; }
					.vx-pip-active .vx-video-area button { display: none !important; }
					.vx-pip-active .vx-video-area svg { display: none !important; }
					.vx-pip-active .vx-video-area span { display: none !important; }
					/* PiP unpause black flash cover — appears instantly, dissolves after YT branding settles */
					.vx-pip-yt-cover { position: absolute !important; inset: 0 !important; z-index: 10 !important; background: #000 !important; pointer-events: none !important; opacity: 1 !important; transition: opacity 0.35s ease-out !important; }
					.vx-pip-yt-cover.dissolve { opacity: 0 !important; }
					/* Auto-detect PiP via viewport size — works even when WebView is throttled */
					@media screen and (max-height: 300px) {
						.pip-ready { padding: 0 !important; overflow: hidden !important; }
						.pip-ready > *:not(.vx-video-area):not(.vx-overlay-ads) { display: none !important; }
						.pip-ready .vx-video-area { position: absolute !important; inset: 0 !important; width: 100% !important; height: 100% !important; flex: none !important; margin: 0 !important; padding: 0 !important; border-radius: 0 !important; z-index: 1 !important; overflow: hidden !important; }
						.pip-ready .vx-video-area div:not(.vx-pip-yt-cover) { position: absolute !important; inset: 0 !important; top: 0 !important; left: 0 !important; right: 0 !important; bottom: 0 !important; width: 100% !important; height: 100% !important; margin: 0 !important; padding: 0 !important; transform: none !important; border-radius: 0 !important; max-width: 100% !important; max-height: 100% !important; background: transparent !important; }
						.pip-ready .vx-video-area video { position: absolute !important; inset: 0 !important; width: 100% !important; height: 100% !important; object-fit: contain !important; border-radius: 0 !important; }
						/* YouTube iframe: no transform in PiP — scale causes white screen in tiny viewport */
						.pip-ready .vx-video-area iframe { position: absolute !important; inset: 0 !important; width: 100% !important; height: 100% !important; border-radius: 0 !important; transform: none !important; }
						.pip-ready .vx-video-area button { display: none !important; }
						.pip-ready .vx-video-area svg { display: none !important; }
						.pip-ready .vx-video-area span { display: none !important; }
					}
				`}</style>
			{/* Gesture hint CSS (keyframes) */}
			<style>{`
					/* single move animation (moves downward). Rotating the wrapper will change visual direction */
					@keyframes vx-gesture-move { 0% { transform: translateY(-4px) translateX(0) scale(0.98); opacity: .95 } 40% { transform: translateY(40px) translateX(0) scale(1); opacity: .98 } 70% { transform: translateY(40px) translateX(0) scale(1); opacity: .98 } 100% { transform: translateY(40px) translateX(0) scale(1); opacity: .0 } }
					@keyframes vx-pulse { 0% { transform: scale(1); opacity: 1 } 50% { transform: scale(1.04); opacity: 0.9 } 100% { transform: scale(1); opacity: 1 } }
					@keyframes vx-toast-in { 0% { transform: translateX(-50%) translateY(-10px); opacity: 0 } 100% { transform: translateX(-50%) translateY(0); opacity: 1 } }
					@keyframes vx-gesture-fadein { 0% { opacity: 0 } 100% { opacity: 1 } }
					@keyframes vx-gesture-textfade { 0% { opacity: 0; transform: translateY(8px) } 100% { opacity: 1; transform: translateY(0) } }
					@keyframes vx-gesture-press { 0% { transform: scale(1); opacity: 0.95 } 30% { transform: scale(0.88); opacity: 1 } 60% { transform: scale(0.88); opacity: 1 } 100% { transform: scale(1); opacity: 0.95 } }
					@keyframes vx-gesture-doubletap { 0% { transform: scale(1) } 15% { transform: scale(0.92) } 25% { transform: scale(1.02) } 45% { transform: scale(0.92) } 55% { transform: scale(1.06) } 70% { transform: scale(1) } 100% { transform: scale(1) } }
					@keyframes vx-gesture-ripple { 0% { transform: scale(0.6); opacity: 0.6 } 100% { transform: scale(1.4); opacity: 0 } }
					/* White pulsing dot for Watch Together floating button */
					@keyframes wt-pulse { 0% { transform: scale(1); opacity: 0.9 } 50% { transform: scale(1.6); opacity: 0.0 } 100% { transform: scale(1); opacity: 0.0 } }
					
					/* Heart Explosion - Radial firework animation for double-tap like */
					@keyframes heart-explode {
						0% { transform: translate(0, 0) scale(0.3) rotate(var(--heart-rot, 0deg)); opacity: 1; }
						20% { transform: translate(calc(var(--heart-dx) * 0.6), calc(var(--heart-dy) * 0.6)) scale(1.1) rotate(var(--heart-rot, 0deg)); opacity: 1; }
						60% { transform: translate(calc(var(--heart-dx) * 0.9), calc(var(--heart-dy) * 0.9)) scale(0.85) rotate(var(--heart-rot, 0deg)); opacity: 0.7; }
						100% { transform: translate(var(--heart-dx), var(--heart-dy)) scale(0.4) rotate(var(--heart-rot, 0deg)); opacity: 0; }
					}
					
					/* Bottom Ad Text Animations */
					@keyframes fadeInText { 0% { opacity: 0; } 100% { opacity: 1; } }
					@keyframes slideLeftText { 0% { transform: translateX(20px); opacity: 0; } 100% { transform: translateX(0); opacity: 1; } }
					@keyframes slideRightText { 0% { transform: translateX(-20px); opacity: 0; } 100% { transform: translateX(0); opacity: 1; } }
					@keyframes bounceText { 0% { transform: translateY(10px); opacity: 0; } 60% { transform: translateY(-5px); opacity: 1; } 100% { transform: translateY(0); opacity: 1; } }
					@keyframes scaleText { 0% { transform: scale(0.8); opacity: 0; } 100% { transform: scale(1); opacity: 1; } }
					
					/* Bottom Ad Card Animations */
					@keyframes fadeInCard { 0% { opacity: 0; } 100% { opacity: 1; } }
					@keyframes linefirstCard { 0% { background-image: linear-gradient(90deg, transparent 0%, transparent 100%); opacity: 0; } 30% { background-image: linear-gradient(90deg, rgba(255,255,255,0.3) 0%, rgba(255,255,255,0.1) 100%); opacity: 1; } 100% { background-image: linear-gradient(90deg, transparent 0%, transparent 100%); opacity: 1; } }
					@keyframes slideDownCard { 0% { transform: translateY(-20px); opacity: 0; } 100% { transform: translateY(0); opacity: 1; } }
					@keyframes bounceInCard { 0% { transform: scale(0.85); opacity: 0; } 50% { transform: scale(1.05); } 100% { transform: scale(1); opacity: 1; } }
					@keyframes scaleUpCard { 0% { transform: scale(0.8); opacity: 0; } 100% { transform: scale(1); opacity: 1; } }
					
					/* Card Effect Animations */
					@keyframes pulse { 0% { transform: scale(1); opacity: 1; } 50% { transform: scale(1.02); opacity: 0.95; } 100% { transform: scale(1); opacity: 1; } }
					@keyframes shake { 0% { transform: translateX(0); } 25% { transform: translateX(-2px); } 50% { transform: translateX(2px); } 75% { transform: translateX(-2px); } 100% { transform: translateX(0); } }
					@keyframes glow { 0% { box-shadow: 0 0 8px rgba(139, 92, 246, 0.3); } 50% { box-shadow: 0 0 20px rgba(139, 92, 246, 0.6); } 100% { box-shadow: 0 0 8px rgba(139, 92, 246, 0.3); } }
					@keyframes float { 0% { transform: translateY(0); } 50% { transform: translateY(-4px); } 100% { transform: translateY(0); } }
					@keyframes rotate { 0% { transform: rotate(0deg) scale(1); } 50% { transform: rotate(1deg) scale(1.01); } 100% { transform: rotate(0deg) scale(1); } }
					
					/* Bottom Ad Exit Animations */
					@keyframes fadeOut { 0% { opacity: 1; transform: scale(1); } 100% { opacity: 0; transform: scale(1); } }
					@keyframes slideOut { 0% { opacity: 1; transform: translateX(0); } 100% { opacity: 0; transform: translateX(100%); } }
					@keyframes scaleDown { 0% { opacity: 1; transform: scale(1); } 100% { opacity: 0; transform: scale(0.7); } }
					@keyframes bounceOut { 0% { opacity: 1; transform: translateY(0) scale(1); } 50% { opacity: 1; transform: translateY(-10px) scale(1.05); } 100% { opacity: 0; transform: translateY(-30px) scale(0.8); } }
					@keyframes rotateOut { 0% { opacity: 1; transform: rotate(0deg) scale(1); } 100% { opacity: 0; transform: rotate(15deg) scale(0.8); } }
				`}</style>

			{/* YouTube-style Gesture Tutorial Overlay */}
			{gestureHintVisible && (
				<div aria-hidden style={{
					position: 'fixed', inset: 0, zIndex: 1200,
					display: 'flex', alignItems: 'center', justifyContent: 'center',
					background: 'radial-gradient(ellipse at center, rgba(0,0,0,0.55) 0%, rgba(0,0,0,0.65) 100%)',
					pointerEvents: 'none',
					animation: 'vx-gesture-fadein 400ms ease-out'
				}}>
					<div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 20, maxWidth: 320, padding: '0 24px' }}>
						{/* Step indicator dots */}
						<div style={{ display: 'flex', gap: 6, marginBottom: 4 }}>
							{[0, 1, 2, 3, 4].map(i => (
								<div key={i} style={{
									width: gestureStep === i ? 20 : 6, height: 6,
									borderRadius: 3,
									background: gestureStep === i ? 'var(--color-gold, #ca8a04)' : 'rgba(255,255,255,0.25)',
									transition: 'all 300ms ease'
								}} />
							))}
						</div>

						{/* Animated hand icon */}
						<div style={{
							width: 96, height: 96, borderRadius: 24,
							background: 'rgba(255,255,255,0.06)',
							border: '1px solid rgba(255,255,255,0.08)',
							display: 'flex', alignItems: 'center', justifyContent: 'center',
							boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
							animation: 'vx-pulse 2000ms ease-in-out infinite'
						}}>
							{/* Step 0: Swipe UP — next video */}
							{gestureStep === 0 && (
								<div style={{ transform: 'rotate(180deg)' }}>
									<svg width="56" height="56" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.95)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ animation: 'vx-gesture-move 1400ms ease-in-out infinite', filter: 'drop-shadow(0 6px 12px rgba(0,0,0,0.35))' }}>
										<path d="M18 11V7a2 2 0 0 0-2-2h0a2 2 0 0 0-2 2v4" />
										<path d="M14 10V5a2 2 0 0 0-2-2h0a2 2 0 0 0-2 2v7" />
										<path d="M10 10V7a2 2 0 0 0-2-2h0a2 2 0 0 0-2 2v9a3 3 0 0 0 3 3h6a3 3 0 0 0 3-3v-1" />
									</svg>
								</div>
							)}
							{/* Step 1: Swipe DOWN — previous video */}
							{gestureStep === 1 && (
								<div style={{ transform: 'rotate(0deg)' }}>
									<svg width="56" height="56" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.95)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ animation: 'vx-gesture-move 1400ms ease-in-out infinite', filter: 'drop-shadow(0 6px 12px rgba(0,0,0,0.35))' }}>
										<path d="M18 11V7a2 2 0 0 0-2-2h0a2 2 0 0 0-2 2v4" />
										<path d="M14 10V5a2 2 0 0 0-2-2h0a2 2 0 0 0-2 2v7" />
										<path d="M10 10V7a2 2 0 0 0-2-2h0a2 2 0 0 0-2 2v9a3 3 0 0 0 3 3h6a3 3 0 0 0 3-3v-1" />
									</svg>
								</div>
							)}
							{/* Step 2: Press & hold — quick options */}
							{gestureStep === 2 && (
								<svg width="56" height="56" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.95)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ animation: 'vx-gesture-press 1600ms ease-in-out infinite', filter: 'drop-shadow(0 6px 12px rgba(0,0,0,0.35))' }}>
									<path d="M18 11V7a2 2 0 0 0-2-2h0a2 2 0 0 0-2 2v4" />
									<path d="M14 10V5a2 2 0 0 0-2-2h0a2 2 0 0 0-2 2v7" />
									<path d="M10 10V7a2 2 0 0 0-2-2h0a2 2 0 0 0-2 2v9a3 3 0 0 0 3 3h6a3 3 0 0 0 3-3v-1" />
								</svg>
							)}
							{/* Step 3: Swipe LEFT — discover */}
							{gestureStep === 3 && (
								<div style={{ transform: 'rotate(90deg)' }}>
									<svg width="56" height="56" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.95)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ animation: 'vx-gesture-move 1400ms ease-in-out infinite', filter: 'drop-shadow(0 6px 12px rgba(0,0,0,0.35))' }}>
										<path d="M18 11V7a2 2 0 0 0-2-2h0a2 2 0 0 0-2 2v4" />
										<path d="M14 10V5a2 2 0 0 0-2-2h0a2 2 0 0 0-2 2v7" />
										<path d="M10 10V7a2 2 0 0 0-2-2h0a2 2 0 0 0-2 2v9a3 3 0 0 0 3 3h6a3 3 0 0 0 3-3v-1" />
									</svg>
								</div>
							)}
							{/* Step 4: Double tap — like */}
							{gestureStep === 4 && (
								<svg width="56" height="56" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.95)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ animation: 'vx-gesture-doubletap 1200ms ease-in-out infinite', filter: 'drop-shadow(0 6px 12px rgba(0,0,0,0.35))' }}>
									<path d="M18 11V7a2 2 0 0 0-2-2h0a2 2 0 0 0-2 2v4" />
									<path d="M14 10V5a2 2 0 0 0-2-2h0a2 2 0 0 0-2 2v7" />
									<path d="M10 10V7a2 2 0 0 0-2-2h0a2 2 0 0 0-2 2v9a3 3 0 0 0 3 3h6a3 3 0 0 0 3-3v-1" />
								</svg>
							)}
						</div>

						{/* Instruction text */}
						<div style={{ textAlign: 'center' }}>
							<div style={{
								color: '#fff', fontSize: 20, fontWeight: 700, marginBottom: 6,
								fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial',
								animation: 'vx-gesture-textfade 400ms ease-out'
							}}>
								{gestureStep === 0 && 'Swipe Up'}
								{gestureStep === 1 && 'Swipe Down'}
								{gestureStep === 2 && 'Press & Hold'}
								{gestureStep === 3 && 'Swipe Left'}
								{gestureStep === 4 && 'Double Tap'}
							</div>
							<div style={{
								color: 'rgba(255,255,255,0.7)', fontSize: 14, fontWeight: 500, lineHeight: 1.4,
								fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial'
							}}>
								{gestureStep === 0 && 'to see the next video'}
								{gestureStep === 1 && 'to see the previous video'}
								{gestureStep === 2 && 'for quick options'}
								{gestureStep === 3 && 'to discover more'}
								{gestureStep === 4 && 'to like a video'}
							</div>
						</div>

						{/* Skip button */}
						<button
							onClick={() => {
								try { localStorage.setItem('vx:hint:gesture', '1'); } catch {}
								setGestureHintVisible(false);
								setGestureStep(0);
							}}
							style={{
								pointerEvents: 'auto', marginTop: 8,
								background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.15)',
								borderRadius: 20, padding: '8px 24px',
								color: 'rgba(255,255,255,0.7)', fontSize: 13, fontWeight: 600,
								cursor: 'pointer', transition: 'all 200ms'
							}}
						>
							Skip Tutorial
						</button>
					</div>
				</div>
			)}
			{/* 1. Top Icon Row */}
			{/* Hide top controls if fullscreen overlay or video player overlay is visible */}
			{!visibleAds.some(ad => ad.type === 'overlay' && (ad.overlayAdPosition === 'fullscreen' || ad.overlayAdPosition === 'videoPlayer')) && (
				<div
					// backdrop overlay for top controls (auto-hideable)
					className="w-full flex items-center justify-between"
				style={{
					// Use position:fixed when landscape OR when default2 ads are showing,
					// so the top bar renders ABOVE the fullscreen ad overlay (zIndex 500 > 50).
					position: (forceLandscapeCss || visibleAds.some(ad => ad.type === 'default2')) ? "fixed" : "relative",
					left: forceLandscapeCss ? "50%" : 0,
					right: forceLandscapeCss ? "auto" : 0,
					top: forceLandscapeCss ? "50%" : (visibleAds.some(ad => ad.type === 'default2') ? 0 : "auto"),
					width: forceLandscapeCss ? "100vh" : "100%",
					// Rotate 90deg and position at visual top (opposite of bottom bar)
					transform: forceLandscapeCss ? "translate(-50%, -50%) rotate(90deg) translateY(calc(-50vw + 50%))" : "none",
					transformOrigin: "center",
				
					paddingTop: "calc(env(safe-area-inset-top, 0px) + 14px)",
					paddingBottom: 8,
					paddingLeft: forceLandscapeCss ? 20 : 16,
					paddingRight: forceLandscapeCss ? 20 : 16,
					marginTop: 4,
					marginLeft: forceLandscapeCss ? "0" : "auto",
					marginRight: forceLandscapeCss ? "0" : "auto",
					zIndex: 500,
					boxSizing: "border-box",
					transition: "opacity 220ms ease, backdrop-filter 240ms ease, -webkit-backdrop-filter 240ms ease, background 240ms ease",
					// Always keep pointerEvents auto so chevron is always tappable
					opacity: (controlsVisible || locked || visibleAds.some(ad => ad.type === 'default2')) ? 1 : 0,
					pointerEvents: "auto",
					// Frosted glass / muted background to keep focus on video
					background: darkMode
						? "linear-gradient(180deg, rgba(0,0,0,0.36), rgba(0,0,0,0.28))"
						: "linear-gradient(180deg, rgba(255,255,255,0.72), rgba(255,255,255,0.6))",
					border: darkMode ? "1px solid rgba(255,255,255,0.02)" : "1px solid rgba(0,0,0,0.06)",
					// slightly stronger bottom divider to match the progress bar hairline
					borderBottom: darkMode ? "1px solid rgba(255,255,255,0.06)" : "1px solid rgba(0,0,0,0.12)",
					boxShadow: "none",
					backdropFilter: "none",
					WebkitBackdropFilter: "none"
				}}
			>
				<button
					className="p-1.5 rounded-full hover:bg-white/10"
					style={{ color: darkMode ? "#fff" : "#111" }}
					onClick={(e) => {
						try { e.stopPropagation(); } catch { }
						try { if (videoRef.current) videoRef.current.pause(); } catch { }
						try { setIsPlaying(false); } catch { }

						const v = videoRef.current;
						// For YouTube videos, videoRef has no currentTime — derive from progress*duration
						const currentTime = isYouTubeVideo ? Math.floor(progress * (duration || 0)) : (v ? v.currentTime : 0);
						const rawSrc = (v && (v.currentSrc || v.src)) || videoUrl || videoInfo?.src || videoInfo?.videoUrl || videoInfo?.url || searchParams.get('src') || '';
						const videoSrc = resolveMediaUrl(rawSrc) || rawSrc;
						const videoId = searchParams.get('id') || 'custom';
						const stored = {
							video: {
								id: videoId,
								title: videoTitle || null,
								src: videoSrc,
								url: videoSrc,
								videoUrl: videoSrc,
								thumbnail: videoInfo?.thumbnail || videoInfo?.imageUrl || '',
								imageUrl: videoInfo?.imageUrl || videoInfo?.thumbnail || '',
								author: creatorName || null,
								creator: creatorName || null,
								channel: creatorName || null
							},
							time: Math.floor(currentTime || 0),
							paused: false,
							title: videoTitle || null,
							creatorName: creatorName || null,
							duration: isYouTubeVideo ? Math.floor(duration || 0) : (v ? Math.floor(v.duration || 0) : 0)
						};

						// If onChevronDown callback provided (used when videoplayer is an overlay), use it
						// NOTE: Do NOT emit switchToHomeOnly or switchToHome here — the callback already
						// handles the MiniPlayer transition within the same Home component instance.
						// Emitting switchToHomeOnly causes App.jsx to replace the entire Routes tree with
						// a standalone Home, destroying component state (refs, MiniPlayer close guards, etc.)
						// and making all buttons unresponsive because the Routes tree is never restored.
						if (onChevronDown && typeof onChevronDown === 'function') {
							try { onChevronDown(stored); } catch { }
							try { if (typeof window !== 'undefined' && typeof window.setFooterTab === 'function') window.setFooterTab('home'); } catch { }
							return;
						}

						// Store mini player data in localStorage and go back to home
						// Use history.back() to return to the EXISTING home page instance
						// instead of pushing a new /home route (which wouldn't have miniplayer state)
						try { localStorage.setItem('miniPlayerData', JSON.stringify(stored)); } catch { }
						try { if (typeof eventBus !== 'undefined' && eventBus.emit) eventBus.emit('miniPlayerRequest', stored); } catch { }
						try { if (typeof eventBus !== 'undefined' && eventBus.emit) eventBus.emit('switchToHome', stored); } catch { }
						try { if (typeof window !== 'undefined' && typeof window.setFooterTab === 'function') window.setFooterTab('home'); } catch { }
						// Go back so we return to the existing home component (preserves state + miniplayer)
						try {
							if (window.history && window.history.length > 1) {
								window.history.back();
							} else {
								navigate('/home', { state: { miniPlayerData: stored }, replace: true });
							}
						} catch { try { navigate('/home', { state: { miniPlayerData: stored }, replace: true }); } catch { } }
					}}
				>
					<ChevronDown />
				</button>

					{/* Watch Together in Top Bar Left (Physical Top) */}
					{(!isFloatingMode && (showWatchTogether || watchFading) && !visibleAds.some(ad => ad.type === 'overlay' && (ad.overlayAdPosition === 'fullscreen' || ad.overlayAdPosition === 'videoPlayer'))) && (
						<button
							className="flex items-center text-white pl-3 pr-4 py-1.5 rounded-full text-sm font-medium"
							onClick={(e) => performWatchTogether(e)}
							style={{
								background: '#6b5bd1', 
								transition: 'opacity 260ms ease, transform 260ms ease',
								opacity: showWatchTogether ? 1 : 0,
								pointerEvents: showWatchTogether ? 'auto' : 'none',
								boxShadow: '0 8px 24px rgba(0,0,0,0.28)',
								marginLeft: 12
							}}
						>
							<Users size={18} />
							<span className="ml-2 whitespace-nowrap">Watch Together</span>
						</button>
					)}
				
				{/* Lock button: rendered inline with other top icons so spacing matches. */}

				<div className="flex items-center space-x-4" style={{ transition: 'opacity 220ms ease', pointerEvents: 'auto' }}>
				{/* Watch Together removed from here */}
					<div className="w-9 flex items-center justify-center" style={{ pointerEvents: 'auto' }}>
						{locked ? (
							<button
								onClick={handleLockPress}
								aria-pressed={locked}
								aria-label={locked ? "Unlock controls" : "Lock controls"}
								className={`w-9 h-9 p-1.5 flex items-center justify-center rounded-xl transition-shadow focus:outline-none ${pulsating ? 'animate-pulse' : ''}`}
								style={{
									color: brightLock ? accentColor : (locked ? "#9CA3AF" : (darkMode ? "#fff" : "#111")),
									background: locked ? "#1e2736" : "transparent",
									zIndex: 400,
									position: "relative",
									opacity: brightLock ? 1 : (locked ? 0.28 : 1)
								}}
							>
								<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-lock-icon lucide-lock">
									<rect width="18" height="11" x="3" y="11" rx="2" ry="2" />
									<path d="M7 11V7a5 5 0 0 1 10 0v4" />
								</svg>
							</button>
						) : (
							/* spacer to keep spacing consistent when not locked */
							<div className="w-9 h-9" />
						)}
					</div>
					{/* Captions button */}
					<button
						className={`p-1.5 rounded-full hover:bg-white/10`}
						aria-haspopup="dialog"
						aria-expanded={showCaptions}
						onClick={() => setShowCaptions(true)}
						style={{ opacity: locked ? 0.28 : 1, pointerEvents: locked ? 'none' : 'auto', color: darkMode ? (locked ? "#9CA3AF" : "#fff") : (locked ? "#9CA3AF" : "#111") }}
					>
						<Captions />
					</button>

					{/* Picture-in-Picture button – native PiP when supported, in-app mini player fallback */}
					<button
						className={`p-1.5 rounded-full hover:bg-white/10`}
						onClick={async (e) => {
							e.stopPropagation();
							const v = (globalVideoRef && globalVideoRef.current) || videoRef.current;

							/* ── 1. Direct native bridge (most reliable — bypasses Capacitor plugin layer) ── */
							try {
								if (window.NativePiP && typeof window.NativePiP.enterPiP === 'function') {
									// Pre-apply PiP CSS BEFORE entering native PiP.
									// Android throttles WebView rendering in PiP mode,
									// so CSS changes made AFTER entering PiP never paint.
									setIsInPiPMode(true);
									setControlsVisible(false);
									// Wait for React render + browser paint, then trigger native PiP
									requestAnimationFrame(() => {
										requestAnimationFrame(() => {
											try {
												window.NativePiP.enterPiP();
												console.log('[PiP] Called NativePiP.enterPiP (CSS pre-applied)');
											} catch (err) {
												console.warn('[PiP] NativePiP.enterPiP failed', err);
												setIsInPiPMode(false);
												setControlsVisible(true);
											}
										});
									});
									return;
								}
							} catch (nativeErr) {
								console.warn('[PiP] NativePiP bridge failed', nativeErr);
								setIsInPiPMode(false);
								setControlsVisible(true);
							}

							/* ── 2. Capacitor plugin bridge (backup) ── */
							try {
								const Cap = window.Capacitor || (typeof Capacitor !== 'undefined' ? Capacitor : null);
								if (Cap && Cap.Plugins && Cap.Plugins.PiPMode) {
									setIsInPiPMode(true);
									setControlsVisible(false);
									await Cap.Plugins.PiPMode.enterPiP({ width: 16, height: 9 });
									console.log('[PiP] Entered Android native PiP via Capacitor');
									return;
								}
							} catch (capErr) {
								console.warn('[PiP] Capacitor PiP failed', capErr);
								setIsInPiPMode(false);
								setControlsVisible(true);
							}

							/* ── 3. Try browser Picture-in-Picture API (desktop Chrome / Safari) ── */
							try {
								if (
									document.pictureInPictureEnabled &&
									v &&
									typeof v.requestPictureInPicture === 'function' &&
									!v.disablePictureInPicture
								) {
									if (document.pictureInPictureElement === v) {
										await document.exitPictureInPicture();
										return;
									}
									await v.requestPictureInPicture();
									console.log('[PiP] Entered browser Picture-in-Picture');
									return;
								}
							} catch (pipErr) {
								console.warn('[PiP] Browser PiP not available', pipErr);
							}

							/* ── 3. Fallback: in-app mini player ── */
							const currentTime = v ? v.currentTime : 0;
							try {
								const info = null;
								const videoSrc = (v && (v.currentSrc || v.src)) || videoUrl || '';
								const videoThumb = '';
								const videoId = searchParams.get('id') || 'custom';

								const stored = {
									video: {
										...(info || {}),
										id: videoId,
										title: videoTitle || (info && info.title) || null,
										src: videoSrc,
										url: videoSrc,
										videoUrl: videoSrc,
										thumbnail: videoThumb,
										imageUrl: videoThumb,
										author: creatorName || (info && info.author) || null,
										creator: creatorName || (info && info.creator) || null,
										channel: creatorName || (info && info.channel) || null
									},
									time: Math.floor(currentTime || 0),
									paused: false,
									title: videoTitle || null,
									creatorName: creatorName || null,
									duration: v ? Math.floor(v.duration || 0) : 0
								};
								console.log('[PiP] Falling back to in-app mini player ->', stored);
								try { localStorage.setItem('miniPlayerData', JSON.stringify(stored)); } catch (e2) { console.warn('localStorage set failed', e2); }
								try { if (typeof eventBus !== 'undefined' && eventBus.emit) eventBus.emit('miniPlayerRequest', stored); } catch (e2) { }

								const params = new URLSearchParams();
								params.set('mini', '1');
								if (stored.video && stored.video.id) params.set('id', stored.video.id);
								if (typeof stored.time === 'number') params.set('t', String(Math.floor(stored.time)));
								const url = `/home?${params.toString()}`;
								navigate(url, { state: { miniPlayerData: stored } });
							} catch (err) {
								console.error('Failed to store mini player data / navigate', err);
								try { navigate('/home'); } catch (e2) { }
							}
						}}
						style={{ opacity: locked ? 0.28 : 1, pointerEvents: locked ? 'none' : 'auto', color: darkMode ? (locked ? "#9CA3AF" : "#fff") : (locked ? "#9CA3AF" : "#111") }}
					>
						<PictureInPicture2 />
					</button>



					{/* Options button */}
					<button
						className={`p-1.5 rounded-full hover:bg-white/10`}
						aria-haspopup="dialog"
						aria-expanded={showMenu}
						onClick={() => setShowMenu(true)}
						style={{ opacity: locked ? 0.28 : 1, pointerEvents: locked ? 'none' : 'auto', color: darkMode ? (locked ? "#9CA3AF" : "#fff") : (locked ? "#9CA3AF" : "#111") }}
					>
						<Ellipsis />
					</button>
				</div>
				</div>
			)}

			{/* Always-visible back/chevron button — ensures user can ALWAYS navigate back even when controls are hidden */}
			<button
				style={{
					position: 'absolute',
					top: 'calc(env(safe-area-inset-top, 0px) + 18px)',
					left: 16,
					width: 44,
					height: 44,
					borderRadius: '50%',
					background: (controlsVisible || locked || visibleAds.some(ad => ad.type === 'default2'))
						? 'transparent' : 'rgba(0,0,0,0.45)',
					border: 'none',
					display: 'flex',
					alignItems: 'center',
					justifyContent: 'center',
					zIndex: 9999,
					pointerEvents: 'auto',
					cursor: 'pointer',
					opacity: (controlsVisible || locked || visibleAds.some(ad => ad.type === 'default2'))
						? 0 : 0.85,
					transition: 'opacity 220ms ease, background 220ms ease',
					touchAction: 'manipulation',
					WebkitTapHighlightColor: 'transparent',
					color: '#fff',
					padding: 0,
				}}
				onClick={(e) => {
					try { e.stopPropagation(); } catch { }
					try { if (videoRef.current) videoRef.current.pause(); } catch { }
					try { setIsPlaying(false); } catch { }
					const v = videoRef.current;
					// For YouTube videos, videoRef has no currentTime — derive from progress*duration
					const currentTime = isYouTubeVideo ? Math.floor(progress * (duration || 0)) : (v ? v.currentTime : 0);
					const rawSrc = (v && (v.currentSrc || v.src)) || videoUrl || '';
					const videoSrc = resolveMediaUrl(rawSrc) || rawSrc;
					const videoId = searchParams.get('id') || 'custom';
					const stored = {
						video: { id: videoId, title: videoTitle || null, src: videoSrc, url: videoSrc, videoUrl: videoSrc, thumbnail: '', imageUrl: '', author: creatorName || null, creator: creatorName || null, channel: creatorName || null },
						time: Math.floor(currentTime || 0), paused: false, title: videoTitle || null, creatorName: creatorName || null, duration: isYouTubeVideo ? Math.floor(duration || 0) : (v ? Math.floor(v.duration || 0) : 0)
					};
					if (onChevronDown && typeof onChevronDown === 'function') {
						try { onChevronDown(stored); } catch { }
						try { if (typeof window !== 'undefined' && typeof window.setFooterTab === 'function') window.setFooterTab('home'); } catch { }
						return;
					}
					try { localStorage.setItem('miniPlayerData', JSON.stringify(stored)); } catch { }
					try { if (typeof eventBus !== 'undefined' && eventBus.emit) eventBus.emit('miniPlayerRequest', stored); } catch { }
					try { if (typeof eventBus !== 'undefined' && eventBus.emit) eventBus.emit('switchToHome', stored); } catch { }
					try { if (typeof window !== 'undefined' && typeof window.setFooterTab === 'function') window.setFooterTab('home'); } catch { }
					try {
						if (window.history && window.history.length > 1) {
							window.history.back();
						} else {
							navigate('/home', { state: { miniPlayerData: stored }, replace: true });
						}
					} catch { try { navigate('/home', { state: { miniPlayerData: stored }, replace: true }); } catch { } }
				}}
				aria-label="Go back"
			>
				<ChevronDown size={24} />
			</button>

			{/* 2. Title & Metadata Section */}
			{/* Keep in normal flow so layout is preserved. Use visibility+opacity for show/hide. */}
			<div
					className="w-full mt-0 mb-0 px-4"
				style={{
					position: forceLandscapeCss ? "fixed" : "relative",
					left: forceLandscapeCss ? "50%" : "auto",
					top: forceLandscapeCss ? "50%" : "auto",
					width: forceLandscapeCss ? "100vh" : "100%",
					// Y points Left. -50vw moves center to Right Edge. +120px moves Left (Down). 
					transform: forceLandscapeCss ? "translate(-50%, -50%) rotate(90deg) translateY(calc(-50vw + 120px))" : "none",
					transformOrigin: "center",
					zIndex: 450, // slightly below top controls
					marginLeft: forceLandscapeCss ? "0" : "auto",
					marginRight: forceLandscapeCss ? "0" : "auto",

					visibility: controlsVisible ? "visible" : "hidden",
					opacity: controlsVisible ? 1 : 0,
					transition: "opacity 220ms ease, backdrop-filter 240ms ease, -webkit-backdrop-filter 240ms ease, background 240ms ease",
					// keep pointer events off when hidden
					pointerEvents: controlsVisible ? "auto" : "none"
				}}
			>
				{/* Title + Author + Badge */}
				{!visibleAds.some(ad => ad.type === 'overlay' && (ad.overlayAdPosition === 'fullscreen' || ad.overlayAdPosition === 'videoPlayer')) && (
					<>
						{/* Title with > arrow */}
						<div className="flex items-center gap-2">
							<h1 className="text-white text-base font-normal leading-snug tracking-wide" style={{ maxWidth: 'calc(100% - 36px)' }}>
								{videoTitle}
							</h1>
							<button className="text-gray-300 flex-shrink-0" style={{ marginTop: 1 }}>
								<ChevronRight size={18} />
							</button>
						</div>

						{/* Author & Badge Row */}
						<div className="flex items-center mt-0.5 space-x-2">
							<span className="text-gray-400 text-sm underline decoration-gray-500 underline-offset-2">
								{creatorName}
							</span>
							<span
								className="bg-[#1e2736] text-xs px-2 py-0.5 rounded-[6px] font-medium tracking-wide"
								style={{ color: accentColor }}
							>
								Requested
							</span>
						</div>
					</>
				)}

				{/* Floating watch-together button (appears after timeout) */}
				{isFloatingMode && !visibleAds.some(ad => ad.type === 'overlay' && (ad.overlayAdPosition === 'fullscreen' || ad.overlayAdPosition === 'videoPlayer')) && (
					<>
						{/* collapsed chevron (when user swiped it away) */}
						{collapsed && (
							<button
								aria-label="Show Watch Together"
								className="fixed flex items-center justify-center w-12 h-12 rounded-full text-white shadow-lg"
								style={{
									left: collapsedSide === "left" ? 8 : "auto",
									right: collapsedSide === "right" ? 8 : "auto",
									top: forceLandscapeCss ? Math.max(20, floatPos.y) : Math.max(80, floatPos.y),
									transition: "transform 220ms ease, opacity 220ms",
									// place under comments/modal overlay — keep lower than modals (use small zIndex)
									zIndex: showCommentsModal ? 30 : 20,
									background: '#6b5bd1',
									boxShadow: '0 10px 26px rgba(0,0,0,0.28)'
								}}
								onClick={(e) => performWatchTogether(e)}
							>
								{/* small chevron icon to restore */}
								<ChevronRight />
							</button>
						)}

						{/* draggable floating circle */}
						{floatVisible && !collapsed && !forceLandscapeCss && (
							<button
								ref={floatBtnRef}
								aria-label="Watch Together (floating)"
								className="fixed flex items-center justify-center rounded-full text-white shadow-xl backdrop-blur-md"
								style={{
									width: 56,
									height: 56,
									background: "linear-gradient(135deg, rgba(30, 41, 59, 0.85), rgba(15, 23, 42, 0.95))",
									border: "1px solid rgba(255,255,255,0.1)",
									left: forceLandscapeCss ? "50%" : floatPos.x,
									top: forceLandscapeCss ? "50%" : floatPos.y,
									transform: forceLandscapeCss ? "translate(-50%, -50%) rotate(90deg) translateY(calc(-50vw + 120px))" : "none",
									transition: dragRef.current.dragging ? "none" : "transform 220ms ease, left 220ms ease, top 220ms ease",
									// render beneath modals when open (ensure lower than modal z-indexes)
									zIndex: showCommentsModal ? 30 : 20,
									display: "flex",
									alignItems: "center",
									justifyContent: "center",
									boxShadow: "0 12px 28px rgba(0,0,0,0.35), inset 0 1px 0 rgba(255,255,255,0.15)"
								}}
								onPointerDown={onFloatPointerDown}
								onPointerMove={onFloatPointerMove}
								onPointerUp={onFloatPointerUp}
								onPointerCancel={onFloatPointerUp}
								onClick={(e) => {
									e.stopPropagation();
									// if the user dragged the button, suppress navigation
									if (floatMovedRef.current) { floatMovedRef.current = false; return; }
									performWatchTogether(e);
								}}
							>
								<Users size={22} strokeWidth={2} style={{ filter: "drop-shadow(0 2px 4px rgba(0,0,0,0.2))" }} />
							</button>
						)}
					</>
				)}
			</div>

			{/* 3. Center Video Area (Play Button) */}
			{/* UPDATED: use handleVideoTap for tap handling and enable center swipe gestures */}
			<div
				className="flex-1 flex items-center justify-center relative video-center vx-video-area"
				style={{
					minHeight: 0,
					touchAction: "none",
					width: "100%",
					overflow: "hidden",
				}} // capture both vertical & horizontal gestures for custom handling
				onClick={handleVideoTap}
				onPointerDown={onCenterPointerDown}
				onPointerMove={onCenterPointerMove}
				onPointerUp={onCenterPointerUp}
			>
				{/* --- actual video element behind the controls (updated) --- */}
				<div
					// Use flex centering to avoid transforms on the normal playback path
					style={{
						position: forceLandscapeCss ? "fixed" : "absolute",
						...(forceLandscapeCss ? { inset: 0 } : { top: 0, left: 0, right: 0, bottom: 140 }),
						width: forceLandscapeCss ? "100vw" : undefined,
						height: forceLandscapeCss ? "100vh" : undefined,
						zIndex: forceLandscapeCss ? 30 : 10,
						display: "flex",
						alignItems: "center",
						justifyContent: "center",
						overflow: "hidden",
						background: "#000",
					}}
				>
					<div
						ref={containerRef}
						aria-hidden={false}
						style={forceLandscapeCss ? {
							position: 'absolute',
							top: '50%',
							left: '50%',
							width: '100vh',
							height: '100vw',
							transform: 'translate(-50%, -50%) rotate(90deg)',
							transformOrigin: 'center center',
							overflow: 'hidden',
							background: '#000',
						} : {
							position: 'relative',
							width: "100%",
							height: "100%",
							maxWidth: "100vw",
							borderRadius: 0,
							display: "block",
							overflow: 'hidden',
							background: '#000',
						}}
					>
						{/* YouTube embed OR native <video> element */}
						{isYouTubeVideo && youTubeId ? (
							<>
								<iframe
									ref={ytIframeRef}
									src={`https://www.youtube-nocookie.com/embed/${youTubeId}?autoplay=1&mute=1&controls=0&modestbranding=1&showinfo=0&rel=0&iv_load_policy=3&fs=0&disablekb=1&playsinline=1&enablejsapi=1&origin=${encodeURIComponent(window.location.origin)}${ytStartTime > 0 ? `&start=${ytStartTime}` : ''}`}
									className="w-full h-full border-0"
									allow="accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture"
									allowFullScreen={false}
									style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', background: '#000', pointerEvents: 'none', transform: 'scale(1.3)', transformOrigin: 'center center' }}
									title="Video player"
								/>
								{/* Loading cover — hides YouTube's own loading spinner until video starts playing */}
								{!ytLoaded && (
									<div style={{ position: 'absolute', inset: 0, zIndex: 2, background: '#000', pointerEvents: 'none', transition: 'opacity 0.3s ease-out' }} />
								)}
								{/* Click-blocking overlay so taps go to our controls, not YouTube */}
								<div style={{ position: 'absolute', inset: 0, zIndex: 3 }} />
								{/* Edge gradient masks — hide YouTube watermark & title overlay (skip in landscape/fullscreen — already scaled) */}
								{!isFullscreen && <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: '12%', background: 'linear-gradient(to top, #000 15%, transparent 100%)', zIndex: 4, pointerEvents: 'none' }} />}
								{!isFullscreen && <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '8%', background: 'linear-gradient(to bottom, #000 5%, transparent 100%)', zIndex: 4, pointerEvents: 'none' }} />}
								{/* PiP unpause cover — briefly flashes black to front-run YouTube branding */}
								{isInPiPMode && pipYtFlash && <div className="vx-pip-yt-cover" />}
							</>
						) : (
							<video
								ref={videoRef}
								src={videoUrl}
								className="w-full h-full bg-black"
								autoPlay
								muted
								playsInline
								webkit-playsinline="true"
								x5-video-player-type="h5"
								x5-video-player-fullscreen="true"
								x5-video-orientation="portrait"
								preload="auto"
								fetchpriority="high"
								poster="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII="
								style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: (isFullscreen || forceLandscapeCss) ? 'cover' : 'contain', background: '#000' }}
								onLoadedMetadata={(e) => {
									try {
										const v = e.target;
										setDuration(v.duration || 0);
										setNaturalAspect((v.videoWidth && v.videoHeight) ? (v.videoWidth / v.videoHeight) : (16 / 9));
									} catch (err) { }
								}}
								onTimeUpdate={(e) => {
									try { if (!draggingRef.current) setProgress(e.target.currentTime / (e.target.duration || 1)); } catch (err) { }
								}}
								onEnded={handleVideoEnded}
								onPause={() => setIsPlaying(false)}
								onPlay={() => setIsPlaying(true)}
								onCanPlay={() => {
									// Triggered when enough data is loaded to play — auto-start
									try {
										const v = videoRef.current;
										if (v && v.paused && autoPlayEnabled) {
											v.play().catch(() => {});
										}
									} catch { }
								}}
								onError={(e) => {
									// Video failed to load — retry once after delay (handles cold backend / network blip)
									try {
										const v = e.target;
										if (v && videoUrl && !v._retried) {
											v._retried = true;
											setTimeout(() => {
												try {
													v.src = resolveMediaUrl(videoUrl);
													v.load();
												} catch { }
											}, 1500);
										}
									} catch { }
								}}
							/>
						)}
						{/* Video Overlay Layer - renders links and images at specific times */}
						<div
							style={{
								position: 'absolute',
								inset: 0,
								pointerEvents: 'none',
								zIndex: 25,
							}}
					>
						{visibleOverlays.map((ov) => (
							ov.type === 'link' ? (
								<a
									key={ov.id}
									href={ov.url}
									target="_blank"
									rel="noopener noreferrer"
									style={{
										position: 'absolute',
										left: `${ov.positionX ?? 5}%`,
										top: `${ov.positionY ?? 80}%`,
										padding: '8px 14px',
										borderRadius: '8px',
										backgroundColor: `${ov.linkColor}33`,
										border: `2px solid ${ov.linkColor}`,
										color: ov.linkColor,
										textDecoration: 'none',
										fontWeight: 'bold',
										fontSize: '14px',
										cursor: 'pointer',
										pointerEvents: 'auto',
										transition: 'all 200ms ease',
										transform: 'scale(1)',
										boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
										display: 'inline-block',
										whiteSpace: 'nowrap',
										maxWidth: 'calc(100% - 40px)',
										overflow: 'hidden',
										textOverflow: 'ellipsis',
									}}
									onMouseEnter={(e) => {
										e.target.style.transform = 'scale(1.05)';
										e.target.style.backgroundColor = `${ov.linkColor}44`;
									}}
									onMouseLeave={(e) => {
										e.target.style.transform = 'scale(1)';
										e.target.style.backgroundColor = `${ov.linkColor}33`;
									}}
								>
									🔗 {ov.linkText}
								</a>
							) : (
								<div
									key={ov.id}
									style={{
										position: 'absolute',
										left: `${ov.positionX ?? 5}%`,
										top: `${ov.positionY ?? 80}%`,
										borderRadius: '8px',
										overflow: 'hidden',
										boxShadow: '0 4px 12px rgba(0,0,0,0.4)',
										border: '2px solid rgba(255,255,255,0.3)',
										opacity: 0.95,
										pointerEvents: 'none',
									}}
								>
									<img
										src={ov.imageData}
										alt="Video overlay"
										style={{
											width: '160px',
											maxHeight: '160px',
											objectFit: 'cover',
											display: 'block',
										}}
									/>
								</div>
							)
						))}
						</div>
					</div>

					{/* Centered translucent play/pause overlay — also supports pointer tap */}
					{controlsVisible && centerVisible && !isPlaying && !(visibleAds && visibleAds.some(a => a.type === 'overlay')) && (
						<button
							className="transform active:scale-95 transition-transform"
							aria-label="Play"
							onClick={(e) => {
								e.stopPropagation();
								togglePlay();
							}}
							style={{
								position: "absolute",
								left: "50%",
								top: "50%",
								transform: "translate(-50%, -50%)",
								// make overlay ring subtler so video remains focus
								border: "1px solid rgba(255,255,255,0.08)",
								zIndex: 20,
								outline: "none",
								filter: "none",
								width: 88,
								height: 88,
								display: "flex",
								alignItems: "center",
								justifyContent: "center",
								borderRadius: 44,
								background: "rgba(0,0,0,0.32)",
								// slightly reduce shadow so the ring feels thinner
								boxShadow: "0 6px 14px rgba(0,0,0,0.36)",
								pointerEvents: centerVisible ? "auto" : "none",
								opacity: centerVisible ? 1 : 0,
								transition: 'opacity 360ms ease'
							}}
						>
							<PlayIcon width={56} height={56} />
						</button>
					)}

					{/* When playing, show pause button in same central position for quick pause */}
					{controlsVisible && centerVisible && isPlaying && !(visibleAds && visibleAds.some(a => a.type === 'overlay')) && (
						<button
							className="transform active:scale-95 transition-transform"
							aria-label="Pause"
							onClick={(e) => {
								e.stopPropagation();
								togglePlay();
							}}
							style={{
								position: "absolute",
								left: "50%",
								top: "50%",
								transform: forceLandscapeCss ? "translate(-50%, -50%) rotate(90deg)" : "translate(-50%, -50%)",
								// make overlay ring subtler so video remains focus
								border: "1px solid rgba(255,255,255,0.08)",
								zIndex: 20,
								outline: "none",
								filter: "none",
								width: 88,
								height: 88,
								display: "flex",
								alignItems: "center",
								justifyContent: "center",
								borderRadius: 44,
								background: "rgba(0,0,0,0.32)",
								boxShadow: "0 6px 14px rgba(0,0,0,0.36)",
								pointerEvents: centerVisible ? "auto" : "none",
								opacity: centerVisible ? 1 : 0,
								transition: 'opacity 360ms ease, transform 200ms ease'
							}}
						>
							<PauseIcon width={56} height={56} />
						</button>
					)}

				</div>

				{/* --- ADD: Screen Locked overlay + transient top toast --- */}
				{/* toast shows only briefly after locking */}
				{showLockToast && (
					<div
						className="fixed top-16 left-1/2 -translate-x-1/2 z-50 pointer-events-none"
						role="status"
						aria-live="polite"
					>
						<div className="flex items-start gap-3 bg-white text-black rounded-lg px-4 py-2 shadow-lg min-w-[220px] sm:min-w-[280px]">
							<div className="w-6 h-6 rounded-full bg-green-600 flex items-center justify-center text-white text-sm">✓</div>
							<div className="text-sm">
								<div className="font-medium">Screen locked</div>
								<div className="text-xs text-gray-600">Only play/pause available</div>
							</div>
						</div>
					</div>
				)}

				{showLockVisual && (
					<div className="fixed inset-0 z-40 flex items-center justify-center pointer-events-none">
						<div className="flex flex-col items-center gap-4">
							<div
								className="w-36 h-36 rounded-full flex items-center justify-center shadow-2xl"
								style={{ background: "#bb890aff" }} /* warm gold circle */
							>
								{/* Enlarge lock glyph inside the circle; use accent color so it matches progress color */}
								<Lock inCircle={false} size={80} color={accentColor} />
							</div>

							<div
								className="rounded-full px-4 py-2 bg-black/50 text-white border border-white/10 text-sm"
								style={{ minWidth: 140, textAlign: "center" }}
							>
								Screen Locked
							</div>
						</div>
					</div>
				)}

				{/* interaction overlay removed to allow center play/pause while locked; top/bottom controls are disabled via pointer-events */}

				{/* NEW: terse error toast when user taps while screen is locked */}
				{showLockedError && (
					<div
						aria-hidden="true"
						style={{
							position: "fixed",
							left: "50%",
							transform: "translateX(-50%)",
							// place above the bottom controls / progress bar; account for safe-area inset
							bottom: "calc(env(safe-area-inset-bottom, 20px) + 180px)",
							zIndex: 320,
							pointerEvents: "none"
						}}
					>
						<div className="bg-red-700 text-white rounded-md px-4 py-2 shadow-lg text-sm">
							Screen locked. Tap the lock icon to unlock.
						</div>
					</div>
				)}
			</div>

			{/* Heart Explosion Particles (double-tap like animation) */}
			{heartExplosions.map(exp => (
				<div key={exp.id} style={{ position: 'fixed', left: 0, top: 0, width: '100%', height: '100%', pointerEvents: 'none', zIndex: 9999 }}>
					{exp.particles.map((p, i) => (
						<div
							key={i}
							style={{
								position: 'absolute',
								left: exp.x,
								top: exp.y,
								'--heart-dx': `${p.dx}px`,
								'--heart-dy': `${p.dy}px`,
								'--heart-rot': `${p.angle}deg`,
								animation: `heart-explode ${p.duration}ms cubic-bezier(0.25, 0.46, 0.45, 0.94) ${p.delay}ms forwards`,
								willChange: 'transform, opacity',
								pointerEvents: 'none',
							}}
						>
							<svg width={p.size} height={p.size} viewBox="0 0 24 24" fill="#ff2d55" style={{ filter: 'drop-shadow(0 2px 6px rgba(255,45,85,0.5))' }}>
								<path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
							</svg>
						</div>
					))}
				</div>
			))}

			{/* 4. Bottom Controls */}
			{/* Hide bottom controls if fullscreen overlay or video player overlay is visible */}
			{!visibleAds.some(ad => ad.type === 'overlay' && (ad.overlayAdPosition === 'fullscreen' || ad.overlayAdPosition === 'videoPlayer')) && (
			<div
				className="w-full flex flex-col pb-2"
				style={{
					position: "fixed",
					zIndex: 500,
					// Landscape: Rotate 90deg, stick to visual bottom (physical left)
					left: forceLandscapeCss ? "50%" : 0,
					right: forceLandscapeCss ? "auto" : 0,
					top: forceLandscapeCss ? "50%" : "auto",
					bottom: forceLandscapeCss ? "auto" : "calc(env(safe-area-inset-bottom, 20px) + 38px)",
					width: forceLandscapeCss ? "100vh" : undefined,
					transform: forceLandscapeCss ? "translate(-50%, -50%) rotate(90deg) translateY(calc(50vw - 50%))" : "none",
					transformOrigin: "center",

					boxSizing: "border-box",
					paddingLeft: 20,
					paddingRight: 20,
					transition: "opacity 220ms ease, bottom 200ms ease",
					opacity: forceLandscapeCss ? (controlsVisible ? 1 : 0) : (locked ? 0.28 : (controlsVisible ? 1 : 0)),
					pointerEvents: forceLandscapeCss ? (controlsVisible ? "auto" : "none") : (locked ? "none" : (controlsVisible ? "auto" : "none")),
					// Frosted glass / muted footer to keep eyes on the video
					background: darkMode
						? "linear-gradient(180deg, rgba(0,0,0,0.30), rgba(0,0,0,0.22))"
						: "linear-gradient(180deg, rgba(255,255,255,0.72), rgba(255,255,255,0.6))",
					borderTop: darkMode ? "1px solid rgba(255,255,255,0.02)" : "1px solid rgba(0,0,0,0.06)",
					boxShadow: darkMode ? "inset 0 1px 0 rgba(255,255,255,0.01), 0 -6px 16px rgba(0,0,0,0.44)" : "inset 0 1px 0 rgba(255,255,255,0.6), 0 -6px 18px rgba(0,0,0,0.06)",
					backdropFilter: "blur(2px)",
					WebkitBackdropFilter: "blur(2px)"
				}}
			>
				{/* Interactive Progress Bar */}
				<div className="w-full py-4 flex items-center">
					<div
						ref={barRef}
						role="slider"
						aria-valuemin={0}
						aria-valuemax={100}
						aria-valuenow={Math.round(progress * 100)}
						onPointerDown={(e) => { handleProgressPointerDown(e); }}
						onClick={(e) => {
							// compute progress from click and immediately apply to main video (avoid stale progress state)
							const clientX = e.clientX || (e.touches && e.touches[0]?.clientX);
							const el = barRef.current;
							if (clientX && el) {
								const rect = el.getBoundingClientRect();
								const p = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
								setProgress(p);
								// update preview position as well
								updateProgressFromPointer(clientX);
								// YouTube videos: use postMessage seekTo command
								if (isYouTubeVideo && ytIframeRef.current && duration > 0) {
									try { ytIframeRef.current.contentWindow.postMessage(JSON.stringify({ event: 'command', func: 'seekTo', args: [p * duration, true] }), '*'); } catch { /* noop */ }
								} else {
									const v = videoRef.current;
									if (v && duration > 0) {
										try { v.currentTime = p * duration; } catch { /* noop */ }
									}
								}
							}
						}}
						className="relative w-full select-none touch-none cursor-pointer"
						// reduced overall container height to make bar more compact
						style={{ height: 20, display: "flex", alignItems: "center" }}
					>
						{/* Track Background (thinner) */}
						<div
							className="absolute left-0 right-0 rounded-full"
							style={{
								height: 8,
								// semi-translucent track with inset shadow for a subtle neumorphic effect
								background: darkMode ? "rgba(255,255,255,0.03)" : "rgba(0,0,0,0.06)",
								boxShadow: darkMode
									? "inset 0 1px 1px rgba(255,255,255,0.02), inset 0 -1px 2px rgba(0,0,0,0.35)"
									: "inset 0 1px 1px rgba(255,255,255,0.6), inset 0 -1px 2px rgba(0,0,0,0.08)",
								top: "50%",
								transform: "translateY(-50%)",
								overflow: "hidden",
								borderRadius: 999
							}}
						>
							{/* Fill uses progressColor */}
							<div
								style={{
									height: "100%",
									width: `${progress * 100}%`,
									background: progressColor,
									opacity: 1,
									borderRadius: 999,
									// soften fill shadow to reduce attention
									boxShadow: "0 2px 6px rgba(0,0,0,0.08)"
								}}
							/>

							{/* Bookmark markers for current video (non-interactive) */}
							{(currentVideoBookmarks || []).map((b) => {
								const pct = (duration > 0 ? Math.max(0, Math.min(1, (b.time || 0) / duration)) : 0) * 100;
								return (
									<div key={b.id} style={{ position: 'absolute', left: `${pct}%`, top: 0, bottom: 0, width: 3, transform: 'translateX(-50%)', background: bookmarkAccent, opacity: 0.98, pointerEvents: 'none', borderRadius: 2 }} />
								);
							})}
						</div>

						{/* Thumb Container (centered on the track; now interactive) */}
						<div
							className="absolute z-20 flex items-center justify-center"
							style={{
								// center the thumb over the track using percentage + translate
								left: `${progress * 100}%`,
								top: "50%",
								transform: "translate(-50%, -50%)",
								// slightly larger hit area for easier interaction
								width: 24,
								height: 24,
								pointerEvents: "auto",
								touchAction: "none"
							}}
							// Delegate pointer down to the same handler used by the progress bar
							onPointerDown={(e) => {
								// prevent the click from bubbling to parent video tap handler
								e.stopPropagation?.();
								// ensure capture where supported for consistent dragging
								try { e.target?.setPointerCapture?.(e.pointerId); } catch { }
								handleProgressPointerDown(e);
							}}
						>
							{/* The Glow (scaled with larger hit area) */}
							<div
								className="absolute"
								style={{
									width: 36,
									height: 36,
									borderRadius: "50%",
									background: progressColor,
									// slightly dim the glow so it doesn't draw attention away from video
									opacity: progressDragging ? 0.28 : 0.12,
									filter: "blur(6px)",
									top: "50%",
									left: "50%",
									transform: `translate(-50%, -50%) scale(${progressDragging ? 1.18 : 1})`,
									transition: 'transform 120ms ease, opacity 120ms ease'
								}}
							/>

							{/* The Squircle Thumb (interactive) */}
							<div
								style={{
									width: 12,
									height: 12,
									borderRadius: 4,
									background: progressColor,
									boxShadow: "0 2px 6px rgba(0,0,0,0.35)",
									position: "relative",
									zIndex: 2,
									transform: progressDragging ? 'scale(1.9)' : 'scale(1)',
									transition: 'transform 120ms cubic-bezier(.2,.9,.3,1)'
								}}
							/>
						</div>
					</div>
				</div>

				{/* preview canvas (frame-by-frame) */}
				<canvas
					ref={canvasRef}
					style={{
						position: "fixed",
						left: previewLeft,
						top: previewTop,
						width: previewSize.w,
						height: previewSize.h,
						display: previewVisible ? "block" : "none",
						borderRadius: 10,
						overflow: "hidden",
						zIndex: 90,
						boxShadow: "0 8px 24px rgba(0,0,0,0.6)",
						background: "#000"
					}}
					aria-hidden={!previewVisible}
				/>

				{/* place the preview video offscreen/hidden (used only for seeking + frame extraction) */}
				<video
					ref={previewVideoRef}
					src={''}
					preload="metadata"
					muted
					playsInline
					style={{ position: "absolute", left: -9999, width: 1, height: 1, opacity: 0, pointerEvents: "none" }}
					aria-hidden="true"
				/>

				{/* Footer Actions Row */}
				<div className="flex items-center justify-between text-white mt-1">
					<div className="flex items-center space-x-3">
						<span className="text-xs font-medium text-gray-200 tracking-wide">
							{(() => {
								const v = videoRef.current;
								// For YouTube videos, always compute current time from progress * duration
								const cur = (isYouTubeVideo || !v) ? Math.floor(progress * (duration || 0)) : Math.floor(v.currentTime || (progress * duration || 0));
								const total = Math.floor(duration || 0);
								const fmt = (s) => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, "0")}`;
								return `${fmt(cur)} / ${fmt(total || 0)}`;
							})()}
						</span>
						{/* match "Requested" badge colors: dark background + blue text */}
						<button
							onClick={() => setShowQualityDropdown(!showQualityDropdown)}
							className="text-[10px] px-1.5 py-0.5 rounded font-bold hover:opacity-80 transition-opacity relative"
							style={{
								background: "#1e2736",
								color: accentColor,
								border: `1px solid ${accentBorder}`,
								cursor: 'pointer'
							}}
						>
							{selectedQuality}
							{/* Quality Dropdown */}
							{showQualityDropdown && (
								<div
									className="absolute bottom-full right-0 mb-2 bg-[#0f1419] rounded-lg shadow-lg border border-gray-700 py-2 z-50"
									style={{
										minWidth: '120px',
										backgroundColor: '#0f1419',
										borderColor: 'rgba(255,255,255,0.08)'
									}}
									onClick={(e) => e.stopPropagation()}
								>
									<button
										onClick={() => {
											setSelectedQuality('Auto');
											setShowQualityDropdown(false);
										}}
										className="w-full px-4 py-2 text-left text-sm hover:bg-gray-800 transition-colors"
										style={{
											color: selectedQuality === 'Auto' ? accentColor : 'rgba(255,255,255,0.8)',
											backgroundColor: selectedQuality === 'Auto' ? 'rgba(255,255,255,0.06)' : 'transparent',
											fontWeight: selectedQuality === 'Auto' ? '600' : '400'
										}}
									>
										Auto
									</button>
									{['144p', '240p', '360p', '480p', '720p', '1080p', '1440p', '2160p'].map((q) => {
										const qualityOrder = ['144p', '240p', '360p', '480p', '720p', '1080p', '1440p', '2160p'];
										const maxAllowed = getMaxAllowedQuality();
										const maxIdx = qualityOrder.indexOf(maxAllowed);
										const qIdx = qualityOrder.indexOf(q);
										const isAllowed = qIdx <= maxIdx;
										const isLocked = !isAllowed;
										
										return (
											<button
												key={q}
												disabled={isLocked}
												onClick={() => {
													if (!isLocked) {
														setSelectedQuality(q);
														setShowQualityDropdown(false);
													}
												}}
												className="w-full px-4 py-2 text-left text-sm hover:bg-gray-800 transition-colors relative group"
												style={{
													color: isLocked ? 'rgba(255,255,255,0.4)' : (selectedQuality === q ? accentColor : 'rgba(255,255,255,0.8)'),
													backgroundColor: selectedQuality === q ? 'rgba(255,255,255,0.06)' : 'transparent',
													fontWeight: selectedQuality === q ? '600' : '400',
													cursor: isLocked ? 'not-allowed' : 'pointer',
													opacity: isLocked ? 0.6 : 1
												}}
												title={isLocked ? `Upgrade to unlock ${q}` : ''}
											>
												<span className="flex items-center justify-between w-full">
													<span>{q}</span>
													{isLocked && <span className="text-xs">🔒</span>}
												</span>
											</button>
										);
									})}
								</div>
							)}
						</button>
					</div>

					<div className="flex items-center space-x-6" style={{ alignItems: 'center' }}>
						{/* Comment button */}
						<button onClick={() => { setShowQualityDropdown(false); if (!auth.user) return auth.openAuthModal(); setShowCommentsModal(true); }} className="p-1.5 hover:opacity-80 transition-opacity">
							<MessageSquare />
						</button>
						{/* Notes button (replaces Like + Bookmark) */}
						<button
							onClick={() => {
								if (locked) return;
								setShowNotesModal(true);
							}}
							className="p-1.5 hover:opacity-80 transition-opacity"
							style={{ pointerEvents: locked ? "none" : "auto", color: darkMode ? '#fff' : '#111' }}
							aria-label="Notes"
						>
							<PenLine />
						</button>
						<button onClick={() => toggleFullscreen()} className="p-1.5 hover:opacity-80 transition-opacity"><Maximize /></button>
					</div>
				</div>
			</div>
			)}

{/* 5. Ad Rendering by Type - displays ads with their custom designs */}
		{visibleAds && visibleAds.length > 0 && (
			<div className="vx-overlay-ads">
				{/* Video Ads (9/16 aspect ratio overlay) */}
				{visibleAds
					.filter(ad => ad.type === 'video')
					.map((ad) => (
						<div
							key={ad.id || `video-ad-${Math.random()}`}
							onClick={() => {
								if (ad.videoAdLink) {
									window.open(ad.videoAdLink, '_blank');
								}
							}}
							style={{
								position: 'fixed',
								inset: forceLandscapeCss ? 'auto' : 0,
								top: forceLandscapeCss ? '50%' : 0,
								left: forceLandscapeCss ? '50%' : 0,
								width: forceLandscapeCss ? '100vh' : '100vw',
								height: forceLandscapeCss ? '100vw' : '100vh',
								transform: forceLandscapeCss ? 'translate(-50%, -50%) rotate(90deg)' : 'none',
								background: 'rgba(0, 0, 0, 0.95)',
								zIndex: 50,
								display: 'flex',
								alignItems: 'center',
								justifyContent: 'center',
								padding: 20,
								cursor: 'pointer'
							}}
						>
							<div
								style={{
									width: '100%',
									maxWidth: 400,
									background: '#000',
									borderRadius: 12,
									position: 'relative',
									display: 'flex',
									flexDirection: 'column',
									aspectRatio: 9/16,
									overflow: 'hidden',
									boxShadow: '0 20px 60px rgba(0, 0, 0, 0.8)'
								}}
								onClick={(e) => e.stopPropagation()}
							>
								{/* Video Playing Area with Overlay */}
								<div
									style={{
										flex: 1,
										background: 'linear-gradient(135deg, #111827 0%, #1f2937 100%)',
										display: 'flex',
										alignItems: 'center',
										justifyContent: 'center',
										color: '#6b7280',
										fontSize: 14,
										position: 'relative',
										overflow: 'hidden'
									}}
								>
									{/* Actual video if source URL available */}
									{(ad.videoAdSrc || ad.videoAdUrl || ad.overlayVideoUrl) ? (
										<video
											src={ad.videoAdSrc || ad.videoAdUrl || ad.overlayVideoUrl}
											autoPlay
											muted
											playsInline
											loop
											style={{
												position: 'absolute',
												inset: 0,
												width: '100%',
												height: '100%',
												objectFit: 'cover',
												background: '#000'
											}}
											onError={(e) => { e.target.style.display = 'none'; }}
										/>
									) : null}
									{/* Video Ad Overlay */}
									<div
										style={{
											position: 'absolute',
											inset: '40px 20px',
											background: `linear-gradient(135deg, ${ad.videoAdCtaColor || '#3b82f6'}${(ad.videoAdSrc || ad.videoAdUrl || ad.overlayVideoUrl) ? 'cc' : ''} 0%, ${ad.videoAdCtaColor ? `${ad.videoAdCtaColor}dd` : '#1e40af'} 100%)`,
											borderRadius: 12,
											display: 'flex',
											flexDirection: 'column',
											alignItems: 'center',
											justifyContent: 'center',
											padding: '20px',
											boxShadow: '0 8px 32px rgba(0, 0, 0, 0.5)',
											zIndex: 10,
											border: '2px solid rgba(255, 255, 255, 0.1)'
										}}
									>
										{/* Video Placeholder */}
										<div
											style={{
												width: '100%',
												height: '120px',
												background: 'rgba(0, 0, 0, 0.3)',
												borderRadius: 8,
												marginBottom: 16,
												display: 'flex',
												alignItems: 'center',
												justifyContent: 'center',
												color: '#90caf9',
												fontWeight: 600,
												fontSize: 14
											}}
										>
											🎬 Ad Video
										</div>

										{/* Title */}
										<div
											style={{
												color: 'white',
												fontSize: 16,
												fontWeight: 700,
												marginBottom: 12,
												textAlign: 'center'
											}}
										>
											{ad.videoAdTitle || 'Your Ad Title'}
										</div>

										{/* CTA Button */}
										<button
											style={{
												padding: '12px 24px',
												background: ad.videoAdCtaColor || '#0b74de',
												color: 'white',
												border: 'none',
												borderRadius: 8,
												fontSize: 14,
												fontWeight: 700,
												cursor: 'pointer',
												transition: 'all 0.2s ease',
												boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)'
											}}
											onMouseEnter={(e) => {
												e.target.style.transform = 'translateY(-2px)';
												e.target.style.boxShadow = '0 6px 16px rgba(0, 0, 0, 0.4)';
											}}
											onMouseLeave={(e) => {
												e.target.style.transform = 'translateY(0)';
												e.target.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.3)';
											}}
											onClick={() => {
												if (ad.videoAdLink) {
													window.open(ad.videoAdLink, '_blank');
												}
											}}
										>
											{ad.videoAdCtaText || 'Learn More'}
										</button>
									</div>
								</div>
								{/* Close/Skip button */}
								<button
									onClick={(e) => {
										e.stopPropagation();
										handleAdDismiss(ad.id);
									}}
									style={{
										position: 'absolute',
										top: 16,
										right: 16,
										width: 36,
										height: 36,
										borderRadius: '50%',
										background: 'rgba(0,0,0,0.6)',
										color: '#fff',
										border: 'none',
										fontSize: 20,
										cursor: 'pointer',
										display: 'flex',
										alignItems: 'center',
										justifyContent: 'center',
										zIndex: 20
									}}
								>
									✕
								</button>
							</div>
						</div>
					))}

				{/* Default 2 Ads (card-based with corner button + close) */}
				{visibleAds
					.filter(ad => ad.type === 'default2')
					.map((ad) => (
						<div
							key={ad.id || `default2-ad-${Math.random()}`}
							onClick={() => {
								if (ad.default2Link) {
									window.open(ad.default2Link, '_blank');
								}
							}}
							style={{
								position: 'fixed',
								inset: forceLandscapeCss ? 'auto' : 0,
								top: forceLandscapeCss ? '50%' : 0,
								left: forceLandscapeCss ? '50%' : 0,
								width: forceLandscapeCss ? '100vh' : '100vw',
								height: forceLandscapeCss ? '100vw' : '100vh',
								transform: forceLandscapeCss ? 'translate(-50%, -50%) rotate(90deg)' : 'none',
								background: 'rgba(0, 0, 0, 0.95)',
								zIndex: 50,
								display: 'flex',
								alignItems: 'center',
								justifyContent: 'center',
								padding: 20,
								cursor: 'pointer'
							}}
						>
							{/* Close (X) button — top-right of the overlay */}
							<button
								onClick={(e) => {
									e.stopPropagation();
									handleAdDismiss(ad.id);
								}}
								style={{
									position: 'absolute',
									top: 16,
									right: 16,
									width: 36,
									height: 36,
									borderRadius: '50%',
									background: 'rgba(255,255,255,0.15)',
									border: '1px solid rgba(255,255,255,0.3)',
									color: '#fff',
									fontSize: 20,
									fontWeight: 700,
									display: 'flex',
									alignItems: 'center',
									justifyContent: 'center',
									cursor: 'pointer',
									zIndex: 60,
									backdropFilter: 'blur(8px)',
									WebkitBackdropFilter: 'blur(8px)',
									transition: 'all 0.2s ease'
								}}
								aria-label="Close ad"
							>✕</button>
							<div
								style={{
									width: '100%',
									maxWidth: 400,
									maxHeight: '90vh',
									overflowY: 'auto',
									background: '#000',
									borderRadius: 12,
									position: 'relative',
									display: 'flex',
									flexDirection: 'column',
									aspectRatio: 9/16,
									boxShadow: '0 20px 60px rgba(0, 0, 0, 0.8)'
								}}
								onClick={(e) => e.stopPropagation()}
							>
								{/* Video Background Area */}
								<div
									style={{
										flex: 1,
										background: '#1a1a1a',
										display: 'flex',
										alignItems: 'center',
										justifyContent: 'center',
										color: '#6b7280',
										fontSize: 14,
										position: 'relative'
									}}
								>
									{(ad.default2Image || ad.default2Logo || ad.imageUrl || ad.thumbnail) ? (
										<img
											src={ad.default2Image || ad.default2Logo || ad.imageUrl || ad.thumbnail}
											alt={ad.default2Title || 'Ad'}
											style={{
												width: '100%',
												height: '100%',
												objectFit: 'cover'
											}}
										/>
									) : (
										<div>Video Content Area</div>
									)}
								</div>

								{/* Cards Container */}
								<div
									style={{
										background: '#000',
										padding: '16px',
										borderTop: `3px solid ${ad.default2LineColor || '#d946ef'}`
									}}
								>
									{[1, 2].map((i) => (
										<div
											key={i}
											style={{
												marginBottom: i === 1 ? 12 : 0,
												padding: '12px 14px',
												background: ad.default2BgColor || '#ffffff',
												border: `2px solid ${ad.default2LineColor || '#d946ef'}`,
												borderLeft: `3px solid ${ad.default2LineColor || '#d946ef'}`,
												borderRadius: 8,
												display: 'flex',
												alignItems: 'center',
												gap: 10,
												cursor: 'pointer',
												transition: 'all 0.2s ease',
												minHeight: '70px'
											}}
											onMouseEnter={(e) => {
												e.currentTarget.style.background = ad.default2BgColor || '#f5f5f5';
											}}
											onMouseLeave={(e) => {
												e.currentTarget.style.background = ad.default2BgColor || '#ffffff';
											}}
											onClick={() => {
												if (ad.default2Link) {
													window.open(ad.default2Link, '_blank');
												}
											}}
										>
											{/* Logo */}
											{ad.default2Logo && (
												<img
													src={ad.default2Logo}
													alt="logo"
													style={{
														width: 50,
														height: 50,
														borderRadius: 8,
														objectFit: 'cover',
														flexShrink: 0
													}}
													onError={(e) => e.target.style.display = 'none'}
												/>
											)}

											{/* Text Content */}
											<div style={{ flex: 1, minWidth: 0 }}>
												<div
													style={{
														fontSize: 13,
														fontWeight: 700,
														color: ad.default2TextColor || '#111827',
														marginBottom: 4
													}}
												>
													{ad.default2Title || 'Card Title'}
												</div>
												<div
													style={{
														fontSize: 12,
														color: ad.default2TextColor || '#6b7280'
													}}
												>
													{ad.default2Description || 'Card description'}
												</div>
											</div>

											{/* Arrow */}
											<div
												style={{
													fontSize: 20,
													color: ad.default2LineColor || '#d946ef',
													flexShrink: 0
												}}
											>
												→
											</div>
										</div>
									))}
								</div>
							</div>
						</div>
					))}

				{/* Overlay Ads (News Ticker) */}
				{visibleAds
					.filter(ad => ad.type === 'overlay')
					.map((ad) => {
						const position = ad.overlayAdPosition || 'bottom';
						const isBottom = position === 'bottom';
						const isTop = position === 'top';
						const isFullscreen = position === 'fullscreen';
						const isVideoOverlay = position === 'videoOverlay';
						const isVideoPlayer = position === 'videoPlayer';

						return isFullscreen ? (
							// Full Screen Banner
							<div
								key={ad.id || `overlay-ad-${Math.random()}`}
								style={{
									position: 'fixed',
									inset: forceLandscapeCss ? 'auto' : 0,
									top: forceLandscapeCss ? '50%' : 0,
									left: forceLandscapeCss ? '50%' : 0,
									width: forceLandscapeCss ? '100vh' : '100vw',
									height: forceLandscapeCss ? '100vw' : '100vh',
									transform: forceLandscapeCss ? 'translate(-50%, -50%) rotate(90deg)' : 'none',
									background: ad.overlayAdBgColor || '#E41E24',
									zIndex: 50,
									display: 'flex',
									flexDirection: 'column',
									alignItems: 'center',
									justifyContent: 'center',
									paddingTop: 'calc(env(safe-area-inset-top, 20px) + 40px)',
									paddingBottom: 'calc(env(safe-area-inset-bottom, 20px) + 40px)',
									paddingLeft: 40,
									paddingRight: 40,
									cursor: 'pointer',
									opacity: ad.overlayAdOpacity || 1,
									textAlign: 'center'
								}}
								onClick={() => {
									if (ad.link) {
										window.open(ad.link, '_blank');
									}
								}}
							>
								{/* Profile Picture Area */}
							<div
								style={{
									width: 120,
									height: 120,
									borderRadius: '12px',
									background: 'rgba(255,255,255,0.15)',
									display: 'flex',
									alignItems: 'center',
									justifyContent: 'center',
									marginBottom: 24,
									border: '2px solid rgba(255,255,255,0.3)',
									overflow: 'hidden'
								}}
							>
									{ad.overlayProfileUrl ? (
										<img src={ad.overlayProfileUrl} alt="Company" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
									) : (
										<span style={{ fontSize: 40, opacity: 0.6 }}>📷</span>
									)}
								</div>

								{/* Text Items */}
								<div
									style={{
										display: 'flex',
										flexDirection: 'column',
										gap: 16,
										alignItems: 'center',
										justifyContent: 'center',
										color: ad.overlayAdTextColor || '#fff',
										textAlign: 'center',
										maxWidth: '85%'
									}}
								>
									{ad.overlayAdTextItems && ad.overlayAdTextItems.length > 0 ? (
										ad.overlayAdTextItems.map((item, idx) => (
											<div
												key={idx}
												style={{
													fontSize: 28,
													fontWeight: 700,
													lineHeight: 1.3
												}}
											>
												{item.text}
											</div>
										))
									) : (
										<div style={{ fontSize: 28, fontWeight: 700, lineHeight: 1.3 }}>
											{ad.overlayAdText || 'Important Announcement'}
										</div>
									)}
								</div>

								{/* CTA Button */}
								<button
									style={{
										padding: '14px 40px',
										background: '#fff',
										color: ad.overlayAdBgColor || '#E41E24',
										border: 'none',
										borderRadius: 8,
										fontSize: 16,
										fontWeight: 700,
										cursor: 'pointer',
										marginTop: 16,
										transition: 'all 0.2s ease',
										boxShadow: '0 4px 12px rgba(0,0,0,0.15)'
									}}
									onMouseEnter={(e) => {
										e.target.style.transform = 'translateY(-2px)';
										e.target.style.boxShadow = '0 6px 16px rgba(0,0,0,0.2)';
									}}
									onMouseLeave={(e) => {
										e.target.style.transform = 'translateY(0)';
										e.target.style.boxShadow = '0 4px 12px rgba(0,0,0,0.15)';
									}}
									onClick={(e) => {
										e.stopPropagation();
										if (ad.link) {
											window.open(ad.link, '_blank');
										}
									}}
								>
									{ad.overlayBtnText || 'Learn More'}
								</button>
							</div>
						) : isVideoPlayer ? (
							<VideoAdOverlay key={ad.id || `video-player-ad-${Math.random()}`} ad={ad} forceLandscapeCss={forceLandscapeCss} onDismiss={handleAdDismiss} />
						) : (
							// Ticker Style (Top, Bottom, or Video Overlay)
							<div
								key={ad.id || `overlay-ticker-${Math.random()}`}
								style={{
									position: 'fixed',
									...(isTop && (forceLandscapeCss ? {
										top: '50%',
										left: '50%',
										right: 'auto',
										width: '100vh',
										transform: 'translate(-50%, -50%) rotate(90deg) translateY(calc(-50vw + 50%))'
									} : {
										top: 'env(safe-area-inset-top, 20px)',
										left: 0,
										right: 0
									})),
									...(isBottom && (forceLandscapeCss ? {
										top: '50%',
										left: '50%',
										right: 'auto',
										width: '100vh',
										transform: 'translate(-50%, -50%) rotate(90deg) translateY(calc(50vw - 50% - 100px))'
									} : {
										bottom: 'calc(env(safe-area-inset-bottom, 20px) + 100px)',
										left: 0,
										right: 0
									})),
									...(isVideoOverlay && (forceLandscapeCss ? {
										top: '50%',
										left: '50%',
										bottom: 'auto',
										right: 'auto',
										transform: 'translate(-50%, -50%) rotate(90deg)',
										maxWidth: '90vh'
									} : {
										bottom: '50%',
										left: '50%',
										transform: 'translateX(-50%)',
										maxWidth: '90%'
									})),
									zIndex: 40,
									background: ad.overlayAdBgColor || '#E41E24',
									color: ad.overlayAdTextColor || '#fff',
									padding: '12px 16px',
									display: 'flex',
									alignItems: 'center',
									gap: 12,
									overflow: 'hidden',
									opacity: ad.overlayAdOpacity || 1,
									boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)',
									borderRadius: isVideoOverlay ? 8 : 0,
									cursor: 'pointer'
								}}
								onClick={() => {
									if (ad.link) {
										window.open(ad.link, '_blank');
									}
								}}
							>
								{/* Emoji Badge */}
								<div
									style={{
										background: ad.overlayBrandBgColor || ad.overlayAdBgColor || '#E41E24',
										color: ad.overlayBrandTextColor || ad.overlayAdTextColor || '#fff',
										padding: '6px 10px',
										borderRadius: 6,
										fontWeight: 700,
										fontSize: 16,
										whiteSpace: 'nowrap',
										flexShrink: 0,
										opacity: ad.overlayTagOpacity || 1
									}}
								>
									{ad.overlayAdEmoji || '⚡'}
								</div>

								{/* Scrolling Text */}
								<div
									style={{
										flex: 1,
										overflow: 'hidden',
										whiteSpace: 'nowrap'
									}}
								>
									{ad.overlayTextAnimation === 'marquee' || !ad.overlayTextAnimation ? (
										<style>{`
											@keyframes marquee-${ad.id} {
												0% { transform: translateX(100%); }
												100% { transform: translateX(-100%); }
											}
										`}</style>
									) : null}
									<div
										style={{
											display: 'flex',
											gap: 40,
											animation: ad.overlayTextAnimation === 'marquee' || !ad.overlayTextAnimation ? `marquee-${ad.id} 20s linear infinite` : 'none',
											opacity: ad.overlayTextAnimation === 'fade' ? 'var(--fade-opacity, 1)' : 1,
											fontSize: 14,
											fontWeight: 600
										}}
									>
										{ad.overlayAdTextItems && ad.overlayAdTextItems.length > 0
											? ad.overlayAdTextItems.map((item, idx) => (
													<span key={idx} style={{ whiteSpace: 'nowrap' }}>
														{item.text}
													</span>
												))
											: <span>{ad.overlayAdText || 'Important Update'}</span>}
										{/* Repeat for seamless loop */}
										{ad.overlayAdTextItems && ad.overlayAdTextItems.length > 0
											? ad.overlayAdTextItems.map((item, idx) => (
													<span key={`repeat-${idx}`} style={{ whiteSpace: 'nowrap' }}>
														{item.text}
													</span>
												))
											: <span>{ad.overlayAdText || 'Important Update'}</span>}
									</div>
								</div>
							</div>
						);
					})}

				{/* Bottom Ads - Using BottomAdPreviewBar with text rotation and animations */}
				{visibleAds.filter(ad => !ad.type || ad.type === 'bottom').length > 0 && (
				<div
					style={{
						position: 'fixed',
						bottom: 'calc(env(safe-area-inset-bottom, 20px) + 150px)',
						left: 0,
						right: 0,
						zIndex: 38,
						backgroundColor: 'rgba(0, 0, 0, 0.95)',
						borderTop: `2px solid ${visibleAds.filter(ad => !ad.type || ad.type === 'bottom')[0]?.borderColor || 'rgba(255, 255, 255, 0.2)'}`,
						borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
						padding: '12px 16px',
						display: 'flex',
						alignItems: 'center',
						gap: '12px',
						maxHeight: '180px',
						overflowX: 'auto',
						overflowY: 'auto',
						scrollBehavior: 'smooth',
						boxShadow: '0 -4px 12px rgba(0, 0, 0, 0.5)'
					}}
				>
					{/* Get visible bottom ads + next upcoming ad in timeframe */}
					{(() => {
						const bottomAds = visibleAds.filter(ad => !ad.type || ad.type === 'bottom');
						
						// Show current ads (with full animations)
						const adsToShow = bottomAds.slice(0, 2); // Show max 2: current + preview
						
						return adsToShow.map((ad, idx) => (
							<BottomAdPreviewBar
								key={ad.id || `ad-${idx}`}
								profileName={ad.profileName || ad.name}
								profileAvatar={ad.profileAvatar || ad.avatar}
								textItems={ad.textItems || (ad.text ? [{ text: ad.text }] : [])}
								textInterval={ad.textInterval || 5000}
								textAnimation={ad.textAnimation || 'fade'}
								cardAnimation={ad.cardAnimation || 'fade'}
								cardEffect={ad.cardEffect || 'none'}
								cardExitAnimation={ad.cardExitAnimation || 'fadeOut'}
								borderColor={ad.borderColor || 'rgba(255, 255, 255, 0.2)'}
								duration={ad.duration || 30}
								link={ad.link}
							/>
						));
					})()}
				</div>
				)}
			</div>
			)}

			{/* Visit Link Button — renders at screen level, outside all ad containers */}
			{visibleAds.filter(ad => ad.type === 'default2' && ad.default2Link).map((ad) => (
				<button
					key={`visit-link-${ad.id || 'default2'}`}
					style={{
						position: 'fixed',
						bottom: 'calc(env(safe-area-inset-bottom, 20px) + 80px)',
						left: 0,
						margin: 0,
						marginLeft: 0,
						padding: '10px 18px',
						background: ad.default2BgColor || '#ffffff',
						color: ad.default2TextColor || '#111827',
						border: `2px solid ${ad.default2LineColor || '#d946ef'}`,
						borderLeft: 'none',
						borderRadius: '0 8px 8px 0',
						fontSize: 14,
						fontWeight: 700,
						cursor: 'pointer',
						boxShadow: `0 4px 16px ${ad.default2LineColor || '#d946ef'}55`,
						whiteSpace: 'nowrap',
						zIndex: 9999,
						pointerEvents: 'auto',
						transition: 'all 0.2s ease',
						letterSpacing: '0.3px',
						transform: 'translateX(0)',
					}}
					onClick={(e) => {
						e.stopPropagation();
						if (ad.default2Link) {
							window.open(ad.default2Link, '_blank');
						}
					}}
				>
					Visit Link
				</button>
			))}

			{/* Modal: Options dialog (carbon copy style) */}
			{showMenu && (
				<div
					className="fixed inset-0 z-[1200] bg-black/60 flex items-end sm:items-center justify-center"
					onClick={() => setShowMenu(false)}
					style={{ backdropFilter: "none", WebkitBackdropFilter: "none", transition: "backdrop-filter 240ms ease, -webkit-backdrop-filter 240ms ease, background 240ms ease" }}
				>
					{/* bottom sheet container (larger, comments-style) */}
					<div
						className="modal-dialog w-full max-w-md bg-[#0b0b0b] rounded-t-2xl p-4 shadow-xl backdrop-blur-sm flex flex-col mx-4"
						onClick={(e) => e.stopPropagation()}
						role="dialog"
						aria-modal="true"
						aria-label="Options"
						style={{
							background: "#fff",
							border: "1px solid #e5e7eb",
							position: "relative",
							height: optionsHeight,
							maxHeight: optionsMaxRef.current,
							overflow: "hidden",
							display: "flex",
							flexDirection: "column",
							marginBottom: 12,
							borderRadius: 24
						}}
					>
						{/* Grab handle for resizing */}
						<div className="w-full h-10 flex items-center justify-center" onPointerDown={onOptionsHandlePointerDown} onTouchStart={onOptionsHandlePointerDown} aria-label="Resize sheet" tabIndex={0} style={{ cursor: "ns-resize" }}>
							<div
								role="separator"
								aria-orientation="horizontal"
								className="w-12 h-1 bg-gray-300 rounded-full touch-none"
								onPointerDown={onOptionsHandlePointerDown}
								onTouchStart={onOptionsHandlePointerDown}
								style={{ cursor: "ns-resize" }}
							/>
						</div>

						{optionsHandleHintVisible && (
							<div className="absolute top-3 right-4 bg-black/70 text-white text-xs px-3 py-1 rounded">{getTranslation('Drag to resize', selectedLanguage)}</div>
						)}

						<h2 className="text-gray-900 text-lg font-semibold mb-3 px-2 text-center">{getTranslation('More Options', selectedLanguage)}</h2>

						<div className="space-y-2 overflow-auto" style={{ maxHeight: `calc(${optionsHeight}px - 64px)`, paddingRight: 6, paddingBottom: 64 }}>
							{/* Bookmark row (persists per user across devices) */}
							<button
								className="w-full flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-gray-100 transition-colors focus:outline-none"
								onClick={async () => {
									if (!auth.user) { auth.openAuthModal(); return; }
									try {
										const token = localStorage.getItem('regaarder_token');
										if (!bookmarked) {
											await fetch(`${BACKEND_URL}/bookmarks/videos`, {
												method: 'POST',
												headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
												body: JSON.stringify({ videoUrl, title: videoTitle })
											});
											setBookmarked(true);
											setToastMessage(getTranslation('Bookmarked', selectedLanguage));
										} else {
											await fetch(`${BACKEND_URL}/bookmarks/videos`, {
												method: 'DELETE',
												headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
												body: JSON.stringify({ videoUrl })
											});
											setBookmarked(false);
											setToastMessage(getTranslation('Removed bookmark', selectedLanguage));
										}
										if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
										toastTimerRef.current = setTimeout(() => setToastMessage(''), 1400);
									} catch { }
								}}
								aria-pressed={false}
								style={{
									background: "transparent",
									outline: 'none',
									boxShadow: 'none',
									border: 'none',
									WebkitTapHighlightColor: 'transparent'
								}}
								onPointerDown={(e) => { try { e.currentTarget.style.outline = 'none'; } catch { } }}
							>
								<div className="w-10 h-10 flex items-center justify-center text-gray-900">
									<Bookmark />
								</div>
								<span className="text-gray-900">{getTranslation('Bookmark', selectedLanguage)}</span>
							</button>

							{/* Bookmark Moment (New) */}
							<button
								className="w-full flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-gray-100 transition-colors"
								onClick={() => {
									setShowMenu(false);
									openBookmarkModalAtCurrent();
								}}
								style={{
									background: "transparent",
									outline: 'none',
									boxShadow: 'none',
									border: 'none',
									WebkitTapHighlightColor: 'transparent'
								}}
							>
								<div className="w-10 h-10 flex items-center justify-center text-gray-900" style={{ color: bookmarkAccent }}>
									<Bookmark />
								</div>
								<span className="text-gray-900">{getTranslation('Bookmark Moment', selectedLanguage)}</span>
							</button>

							{/* Share row (uniform icon wrapper) */}
							<button
								className="w-full flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-gray-100 transition-colors"
								onClick={() => {
									setShowMenu(false);
									setShowShareModal(true);
								}}
							>
								<div className="w-10 h-10 flex items-center justify-center text-gray-900">
									<ShareIcon />
								</div>
								<span className="text-gray-900">{getTranslation('Share', selectedLanguage)}</span>
							</button>

							{/* Tip Creator unified */}
							<button
								className="w-full flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-gray-100 transition-colors"
								onClick={() => { setShowMenu(false); setShowTipModal(true); }}
							>
								<div className="w-10 h-10 flex items-center justify-center rounded-full bg-black/10 text-gray-900">
									<DollarSign />
								</div>
								<div className="text-left">
									<div className="text-gray-900 font-medium leading-tight">{getTranslation('Tip Creator', selectedLanguage)}</div>
									<div className="text-xs text-gray-500">{getTranslation('Support', selectedLanguage) + " @" + creatorName}</div>
								</div>
							</button>

							{/* Watch Incognito unified */}
							<button
								className="w-full flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-gray-100 transition-colors"
								onClick={() => {
									// if turning ON -> immediately enable
									if (!incognitoMode) {
										const next = true;
										setIncognitoMode(next);
										try { localStorage.setItem('watchIncognito', '1'); } catch { }
										dispatchPlayerEvent('player:incognitoChanged', { incognito: true });
										setToastMessage(getTranslation('Incognito ON — actions won\'t be saved', selectedLanguage));
										if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
										toastTimerRef.current = setTimeout(() => setToastMessage(''), 1600);
										return;
									}

									// if turning OFF -> show confirmation popover to avoid accidental taps
									setShowIncognitoConfirm(true);
								}}
								aria-pressed={incognitoMode}
							>
								<div className="w-10 h-10 flex items-center justify-center text-gray-900">
									<EyeOff />
								</div>
								<span className="text-gray-900">{getTranslation('Watch Incognito', selectedLanguage)}</span>
								{/* inline state label */}
								<span style={{ marginLeft: 'auto' }}>
									<span className="text-xs px-2 py-0.5 rounded-full" style={incognitoMode ? { background: '#10b981', color: '#fff' } : { background: '#e5e7eb', color: '#374151' }}>
										{incognitoMode ? getTranslation('On', selectedLanguage) : getTranslation('Off', selectedLanguage)}
									</span>
								</span>
							</button>

							{/* Inline confirmation popover shown under the Watch Incognito row when disabling */}
							{showIncognitoConfirm && (
								<div style={{ padding: 12, background: '#fff', borderRadius: 12, marginTop: 8, border: '1px solid #e5e7eb', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}>
									<div style={{ fontWeight: 700, color: '#111', marginBottom: 6 }}>{getTranslation('Turn off Incognito?', selectedLanguage)}</div>
									<div style={{ fontSize: 13, color: '#6b7280', marginBottom: 10 }}>{getTranslation('Your watch history and likes will be saved.', selectedLanguage)}</div>
									<div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
										<button className="px-3 py-2 rounded-lg bg-transparent text-gray-900 border border-gray-300" onClick={() => setShowIncognitoConfirm(false)}>{getTranslation('Cancel', selectedLanguage)}</button>
										<button className="px-3 py-2 rounded-lg text-white" style={{ background: '#111' }} onClick={() => {
											setIncognitoMode(false);
											try { localStorage.setItem('watchIncognito', '0'); } catch { }
											dispatchPlayerEvent('player:incognitoChanged', { incognito: false });
											setToastMessage(getTranslation('Incognito OFF', selectedLanguage));
											if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
											toastTimerRef.current = setTimeout(() => setToastMessage(''), 1400);
											setShowIncognitoConfirm(false);
										}}>{getTranslation('Turn Off', selectedLanguage)}</button>
									</div>
								</div>
							)}

							{/* Loop Video unified */}
							<button
								className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${loopVideo ? 'bg-black/5' : 'hover:bg-gray-100'}`}
								onClick={() => {
									setLoopVideo((s) => {
										const next = !s;
										try { if (videoRef.current) videoRef.current.loop = next; } catch { }
										// vibration disabled per user preference
										setToastMessage(next ? getTranslation('Loop enabled', selectedLanguage) : getTranslation('Loop disabled', selectedLanguage));
										if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
										toastTimerRef.current = setTimeout(() => setToastMessage(''), 1400);
										return next;
									});
								}}
							>
								<div className="w-10 h-10 flex items-center justify-center text-gray-900">
									<Repeat />
								</div>
								<span className="text-gray-900">{getTranslation('Loop Video', selectedLanguage)}</span>
								<span style={{ marginLeft: 'auto' }}>
									<span className="text-xs px-2 py-0.5 rounded-full" style={loopVideo ? { background: '#10b981', color: '#fff' } : { background: '#e5e7eb', color: '#374151' }}>
										{loopVideo ? getTranslation('On', selectedLanguage) : getTranslation('Off', selectedLanguage)}
									</span>
								</span>
							</button>

							{/* Auto-Play unified */}
							<button
								className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${autoPlayEnabled ? 'bg-black/5' : 'hover:bg-gray-100'}`}
								onClick={() => {
									setAutoPlayEnabled((s) => {
										const next = !s;
										setToastMessage(next ? getTranslation('Auto-play enabled', selectedLanguage) : getTranslation('Auto-play disabled', selectedLanguage));
										if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
										toastTimerRef.current = setTimeout(() => setToastMessage(''), 1400);
										return next;
									});
								}}
							>
								<div className="w-10 h-10 flex items-center justify-center text-gray-900">
									<svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
										<path d="M8 5v14l11-7Z" />
									</svg>
								</div>
								<span className="text-gray-900">{getTranslation('Auto-play', selectedLanguage)}</span>
								<span style={{ marginLeft: 'auto' }}>
									<span className="text-xs px-2 py-0.5 rounded-full" style={autoPlayEnabled ? { background: '#10b981', color: '#fff' } : { background: '#e5e7eb', color: '#374151' }}>
										{autoPlayEnabled ? getTranslation('On', selectedLanguage) : getTranslation('Off', selectedLanguage)}
									</span>
								</span>
							</button>

							{/* Notes unified with Premium badge aligned right */}
							<button
								className="w-full flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-gray-100 transition-colors justify-between"
								onClick={() => { setShowMenu(false); setShowNotesModal(true); }}
							>
								<div className="flex items-center gap-3">
									<div className="w-10 h-10 flex items-center justify-center text-gray-900">
										<PenLine />
									</div>
									<span className="text-gray-900">{getTranslation("Notes", selectedLanguage)}</span>
								</div>
								<span className="text-xs bg-gray-200 px-2 py-0.5 rounded-full text-gray-700">{getTranslation("Premium", selectedLanguage)}</span>
							</button>

							<div className="border-t border-gray-200 my-3" />

							{/* Dark Mode unified container (still a toggle, not a button click) */}
							<div
								className="w-full flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-gray-100 transition-colors justify-between"
							>
								<div className="flex items-center gap-3">
									<div className="w-10 h-10 flex items-center justify-center">
										<svg width="20" height="20" viewBox="0 0 24 24" fill="none">
											<path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" stroke="#111" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
										</svg>
									</div>
									<div>
										<div className="text-gray-900 leading-tight">{getTranslation("Dark Mode", selectedLanguage)}</div>
										<div className="text-gray-500 text-xs">{getTranslation("Improve visibility", selectedLanguage)}</div>
									</div>
								</div>
								<button
									aria-pressed={darkMode}
									onClick={() => setDarkMode(s => !s)}
									className="bg-transparent border-0"
									style={{ marginLeft: 'auto' }}
								>
									<span className="text-xs px-2 py-0.5 rounded-full" style={darkMode ? { background: '#10b981', color: '#fff' } : { background: '#e5e7eb', color: '#374151' }}>
										{darkMode ? getTranslation("On", selectedLanguage) : getTranslation("Off", selectedLanguage)}
									</span>
								</button>
							</div>

							<div className="border-t border-gray-200 mt-1" />

							{/* Playback Speed */}
							<div className="px-2">
								<div className="flex items-center justify-between mb-3">
									<div className="text-gray-500 text-sm">{getTranslation("Playback Speed", selectedLanguage)}</div>
									<label className="flex items-center gap-2">
										<input
											type="checkbox"
											checked={true}
											readOnly
											className="hidden"
										/>
										{/* toggle visual (always on in screenshot) */}
										<div className="w-10 h-5 bg-gray-200 rounded-full p-0.5 flex items-center">
											<div className="w-4 h-4 bg-white shadow-sm rounded-full translate-x-3" />
										</div>
									</label>
								</div>

								<div>
									{/* Preset quick buttons (no floating check badge) */}
									<div className="flex gap-2 mb-3" style={{ overflowX: 'auto', paddingBottom: 4 }}>
										{[0.5, 0.75, 1, 1.25, 1.5, 1.75, 2].map((s) => {
											const sel = Math.abs(playbackSpeed - s) < 0.0001;
											return (
												<button
													key={s}
													onClick={() => setPlaybackSpeed(s)}
													aria-pressed={sel}
													className={`py-2 px-3 rounded-full text-sm font-medium ${sel ? "bg-[#111] text-white" : "bg-gray-100 text-gray-700"}`}
												>
													{s}x
												</button>
											);
										})}
									</div>

									{/* Continuous slider for fine-grain control */}
									<div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
										<input
											name="playbackSpeedRange"
											type="range"
											min={0.25}
											max={2}
											step={0.01}
											value={playbackSpeed}
											onChange={(e) => setPlaybackSpeed(Math.max(0.25, Math.min(2, Number(e.target.value))))}
											style={{ flex: 1 }}
											aria-label="Playback speed"
										/>

										<div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
											<input
												name="playbackSpeedNumber"
												type="number"
												value={playbackSpeed}
												min={0.25}
												max={2}
												step={0.01}
												onChange={(e) => {
													const v = Number(e.target.value);
													if (Number.isFinite(v)) setPlaybackSpeed(v);
												}}
												onBlur={(e) => {
													let v = Number(e.target.value);
													if (!Number.isFinite(v)) v = 1;
													v = Math.max(0.25, Math.min(2, Math.round(v * 100) / 100));
													setPlaybackSpeed(v);
												}}
												style={{ width: 72, padding: '6px 8px', borderRadius: 8, background: '#fff', color: '#111', border: '1px solid #e5e7eb' }}
												aria-label="Custom playback speed"
											/>
											<div className="text-gray-500">x</div>
										</div>
									</div>
								</div>
							</div>

							<div className="border-t border-gray-200 my-3" />

							{/* Double Tap to Seek */}
							<div className="px-2">
								<div className="flex items-center justify-between">
									<div>
										<div className="text-gray-900">{getTranslation("Double Tap to Seek", selectedLanguage)}</div>
										<div className="text-gray-500 text-xs">{getTranslation("Tap sides ±10s, center to like", selectedLanguage)}</div>
									</div>
									<button
										aria-pressed={doubleTap}
										onClick={() => setDoubleTap((s) => !s)}
										className="bg-transparent border-0"
										style={{ marginLeft: 'auto' }}
									>
										<span className="text-xs px-2 py-0.5 rounded-full" style={doubleTap ? { background: '#10b981', color: '#fff' } : { background: '#e5e7eb', color: '#374151' }}>
											{doubleTap ? getTranslation("On", selectedLanguage) : getTranslation("Off", selectedLanguage)}
										</span>
									</button>
								</div>
							</div>

							{/* --- NEW: large -10s / +10s buttons like the image --- */}
							<div className="px-2 pt-2">
								<div className="flex gap-2 mb-3">
									<button
										onClick={() => seekBy(-10)}
										className="flex-1 flex items-center justify-center gap-2 bg-gray-100 rounded-xl py-3 text-gray-900 text-sm"
									>
										<div className="inline-flex items-center">
											<RewindIcon />
											<span className="font-medium">-10s</span>
										</div>
									</button>

									<button
										onClick={() => seekBy(10)}
										className="flex-1 flex items-center justify-center gap-2 bg-gray-100 rounded-xl py-3 text-gray-900 text-sm"
									>
										<div className="inline-flex items-center">
											<span className="font-medium">+10s</span>
											<ForwardIcon />
										</div>
									</button>
								</div>

								<div className="border-t border-gray-200 mb-3" />

								{/* Progress Bar Color input */}
								<div className="text-gray-500 text-sm mb-2">{getTranslation("Progress Bar Color", selectedLanguage)}</div>
								<input
									name="progressColor"
									value={progressColor}
									onChange={(e) => setProgressColor(e.target.value)}
									className="w-full bg-white text-gray-900 border border-gray-200 rounded-xl px-3 py-2 placeholder-gray-400"
									placeholder={progressColor}
								/>
								<div className="text-gray-500 text-xs mt-1">{getTranslation("Current", selectedLanguage)}: {progressColor}</div>

								{/* Quick Presets */}
								<div className="text-gray-500 text-sm mt-3 mb-2">{getTranslation("Quick Presets", selectedLanguage)}</div>
								<div className="grid grid-cols-6 gap-2">
									{colorPresets.map((c) => (
										<button
											key={c}
											onClick={() => setProgressColor(c)}
											className={`w-full h-9 rounded-lg`}
											style={{
												background: c,
												boxShadow: progressColor.toLowerCase() === c.toLowerCase() ? "0 0 0 3px #fff inset, 0 0 0 2px #e5e7eb" : undefined,
												border: progressColor.toLowerCase() === c.toLowerCase() ? "2px solid #e5e7eb" : undefined
											}}
											aria-label={`Set color ${c}`}
										/>
									))}
								</div>

								<div className="border-t border-[#232323] my-3" />

								{/* Adaptive Streaming / Supported / Report */}
								<div className="text-gray-300 text-sm mb-1">{getTranslation("Adaptive Streaming (ABR)", selectedLanguage)}</div>
								<div className="text-sm mb-3" style={{ color: accentColor }}>✓ {getTranslation("Auto quality adjustment enabled", selectedLanguage)}</div>

								<div className="text-gray-400 text-sm mb-3">{getTranslation("Supported: MP4, MKV, AVI, WebM, MOV", selectedLanguage)}</div>

								<button onClick={(e) => { e.stopPropagation(); setShowMenu(false); setShowReportModal(true); }} className="text-left text-white text-sm opacity-90 underline">
									{getTranslation("Report an issue", selectedLanguage)}
								</button>
							</div>

							{/* bottom padding so last items can be scrolled into view like the image */}
							<div style={{ height: 28 }} />

							{/* Visual fade at the bottom to create a 'cutoff' look while content remains scrollable */}
							<div
								aria-hidden="true"
								style={{
									position: "absolute",
									left: 0,
									right: 0,
									bottom: 0,
									height: 64,
									pointerEvents: "none",
									background: "linear-gradient(180deg, rgba(0,0,0,0), rgba(0,0,0,0.92))"
								}}
							/>
						</div>
					</div>
				</div>
			)}



			{/* floating incognito badge removed: control now lives under More (Options) */}

			{/* Captions / Subtitle Settings Dialog (carbon copy style) */}
			{showCaptions && (
				<div
					className="fixed inset-0 z-[1200] flex items-end sm:items-center justify-center"
					onClick={() => setShowCaptions(false)}
					style={{ backgroundColor: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)', WebkitBackdropFilter: 'blur(4px)', transition: 'backdrop-filter 240ms ease, -webkit-backdrop-filter 240ms ease, background 240ms ease' }}
				>
					<div
						className="modal-dialog w-full max-w-md rounded-2xl p-4 shadow-xl backdrop-blur-sm flex flex-col mx-4"
						onClick={(e) => e.stopPropagation()}
						role="dialog"
						aria-modal="true"
						aria-label={getTranslation("Subtitle Settings", selectedLanguage)}
						style={{
							background: "#fff",
							border: "1px solid #e5e7eb",
							position: "relative",
							height: captionsHeight,
							maxHeight: captionsMaxRef.current,
							overflow: "hidden",
							marginBottom: 12
						}}
					>
						{/* Grab handle for captions sheet */}
						<div className="w-full h-10 flex items-center justify-center" onPointerDown={onCaptionsHandlePointerDown} onTouchStart={onCaptionsHandlePointerDown} aria-label="Resize sheet" tabIndex={0} style={{ cursor: "ns-resize" }}>
							<div
								role="separator"
								aria-orientation="horizontal"
								className="w-12 h-1 bg-gray-300 rounded-full touch-none"
								onPointerDown={onCaptionsHandlePointerDown}
								onTouchStart={onCaptionsHandlePointerDown}
								style={{ cursor: "ns-resize" }}
							/>
						</div>
						{captionsHandleHintVisible && (
							<div className="absolute top-3 right-4 bg-black/70 text-white text-xs px-3 py-1 rounded">{getTranslation("Drag to resize", selectedLanguage)}</div>
						)}
						{/* Centered title to match More Options */}
						<h2 className="text-gray-900 text-lg font-semibold mb-3 px-2 text-center">{getTranslation("Subtitle Settings", selectedLanguage)}</h2>
						{/* no explicit close button here — the sheet closes on backdrop click */}

						<div className="overflow-auto" style={{ maxHeight: `calc(${captionsHeight}px - 72px)`, paddingRight: 6 }}>
							{/* Enable Subtitles */}
							<div className="flex items-center justify-between px-2 py-3 bg-gray-100 rounded-xl mb-3">
								<div>
									<div className="text-gray-900">{getTranslation("Enable Subtitles", selectedLanguage)}</div>
								</div>
								<button
									onClick={() => setCaptionsEnabled((s) => !s)}
									aria-pressed={captionsEnabled}
									className={`w-12 h-6 rounded-full p-0.5 ${captionsEnabled ? "bg-[#3b82f6]" : "bg-gray-300"}`}
								>
									<div className={`w-5 h-5 bg-white rounded-full transform transition ${captionsEnabled ? "translate-x-6" : "translate-x-0"}`} />
								</button>
							</div>

							{/* Language */}
							<div className="px-2 mb-3">
								<div className="text-gray-700 text-sm mb-2">{getTranslation("Language", selectedLanguage)}</div>
								<select
									value={captionLanguage}
									onChange={(e) => setCaptionLanguage(e.target.value)}
									className="w-full bg-gray-100 text-gray-900 rounded-xl px-3 py-2 border-0 outline-none"
								>
									<option value="English">{getTranslation("English", selectedLanguage)}</option>
									<option value="Spanish">{getTranslation("Spanish", selectedLanguage)}</option>
									<option value="French">{getTranslation("French", selectedLanguage)}</option>
									<option value="German">{getTranslation("German", selectedLanguage)}</option>

									<option value="Portuguese">{getTranslation("Portuguese", selectedLanguage)}</option>

								</select>
							</div>

							{/* Font Size */}
							<div className="px-2 mb-3">
								<div className="flex items-center justify-between mb-2">
									<div className="text-gray-700 text-sm">{getTranslation("Font Size", selectedLanguage)}: {captionFontSize}px</div>
								</div>
								<input
									name="captionFontSizeRange"
									type="range"
									min="12"
									max="28"
									value={captionFontSize}
									onChange={(e) => setCaptionFontSize(Number(e.target.value))}
									className="w-full"
								/>
							</div>

							{/* Position */}
							<div className="px-2 mb-3">
								<div className="text-gray-700 text-sm mb-2">{getTranslation("Position", selectedLanguage)}</div>
								<select
									value={captionPosition}
									onChange={(e) => setCaptionPosition(e.target.value)}
									className="w-full bg-gray-100 text-gray-900 rounded-xl px-3 py-2 border-0 outline-none"
								>
									<option value="Bottom">{getTranslation("Bottom", selectedLanguage)}</option>
									<option value="Center">{getTranslation("Center", selectedLanguage)}</option>
									<option value="Top">{getTranslation("Top", selectedLanguage)}</option>
								</select>
							</div>

							{/* Text Color swatches */}
							<div className="px-2 mb-3">
								<div className="text-gray-700 text-sm mb-2">{getTranslation("Text Color", selectedLanguage)}</div>
								<div className="flex items-center gap-3">
									{["#FFFFFF", "#FDE047", "#34D399", "#06B6D4", "#F472B6"].map((c) => (
										<button
											key={c}
											onClick={() => setCaptionTextColor(c)}
											className={`w-8 h-8 rounded-full border ${captionTextColor === c ? "ring-2 ring-gray-900" : "ring-0"}`}
											style={{ background: c }}
											aria-label={`Set caption color ${c}`}
										/>
									))}
								</div>
							</div>

							{/* Background Opacity */}
							<div className="px-2 mb-4">
								<div className="text-gray-700 text-sm mb-2">{getTranslation("Background Opacity", selectedLanguage)}</div>
								<select
									value={captionBgOpacity}
									onChange={(e) => setCaptionBgOpacity(e.target.value)}
									className="w-full bg-gray-100 text-gray-900 rounded-xl px-3 py-2 border-0 outline-none"
								>
									<option value="100% Black">{getTranslation("100% Black", selectedLanguage)}</option>
									<option value="80% Black">{getTranslation("80% Black", selectedLanguage)}</option>
									<option value="60% Black">{getTranslation("60% Black", selectedLanguage)}</option>
									<option value="40% Black">{getTranslation("40% Black", selectedLanguage)}</option>
									<option value="0% (No Background)">{getTranslation("0% (No Background)", selectedLanguage)}</option>
								</select>
							</div>

							{/* Example preview row (small) */}
							<div className="px-2 mb-4">
								<div className="text-gray-500 text-xs mb-2">{getTranslation("Preview", selectedLanguage)}</div>
								<div
									className="w-full rounded-md px-3 py-2"
									style={{
										background: captionBgOpacity.includes("100") ? "rgba(0,0,0,1)" :
											captionBgOpacity.includes("80") ? "rgba(0,0,0,0.8)" :
												captionBgOpacity.includes("60") ? "rgba(0,0,0,0.6)" :
													captionBgOpacity.includes("40") ? "rgba(0,0,0,0.4)" : "transparent"
									}}
								>
									<div
										contentEditable
										suppressContentEditableWarning
										onInput={(e) => setCaptionPreviewText(e.currentTarget.textContent || "")}
										className="w-full outline-none"
										style={{
											color: captionTextColor,
											fontSize: captionFontSize,
											textAlign: captionPosition === "Bottom" ? "center" : captionPosition === "Top" ? "center" : "center",
											minHeight: 28,
											display: "flex",
											alignItems: "center",
											justifyContent: "center",
											whiteSpace: "pre-wrap",
											wordBreak: "break-word",
											cursor: "text"
										}}
										aria-label="Caption preview - editable"
									>
										{captionPreviewText}
									</div>
								</div>
							</div>

							{/* close / save hint */}
							<div className="px-2">
								<button
									onClick={() => setShowCaptions(false)}
									className="w-full bg-[#111] text-white py-2 rounded-xl"
								>
									{getTranslation("Done", selectedLanguage)}
								</button>
							</div>

							<div style={{ height: 20 }} />
						</div>
					</div>
				</div>
			)}

			{/* Share Video dialog (opened from Options -> Share) */}
			{showShareModal && (
				<div
					className="fixed inset-0 z-[1200] flex items-end sm:items-center justify-center"
					onClick={() => setShowShareModal(false)}
					style={{ backgroundColor: 'rgba(0,0,0,0.6)', backdropFilter: "none", WebkitBackdropFilter: "none", transition: "backdrop-filter 240ms ease, -webkit-backdrop-filter 240ms ease, background 240ms ease" }}
				>
					<div
						className="modal-dialog w-full max-w-md rounded-2xl p-4 shadow-xl backdrop-blur-sm flex flex-col mx-4"
						onClick={(e) => e.stopPropagation()}
						role="dialog"
						aria-modal="true"
						aria-label="Share Video"
						style={{
							background: "#fff",
							border: "1px solid #e5e7eb",
							position: "relative",
							height: shareHeight,
							maxHeight: shareMaxRef.current,
							overflow: "hidden",
							marginBottom: 12
						}}
					>
						{/* Grab handle for share sheet */}
						<div className="w-full h-10 flex items-center justify-center" onPointerDown={onShareHandlePointerDown} onTouchStart={onShareHandlePointerDown} aria-label="Resize sheet" tabIndex={0} style={{ cursor: "ns-resize" }}>
							<div
								role="separator"
								aria-orientation="horizontal"
								className="w-12 h-1 bg-gray-300 rounded-full touch-none"
								onPointerDown={onShareHandlePointerDown}
								onTouchStart={onShareHandlePointerDown}
								style={{ cursor: "ns-resize" }}
							/>
						</div>
						{shareHandleHintVisible && (
							<div className="absolute top-3 right-4 bg-black/70 text-white text-xs px-3 py-1 rounded">{getTranslation('Drag to resize', selectedLanguage)}</div>
						)}

						{/* dialog header (fixed) */}
						<div className="mb-2">
							<h3 className="text-gray-900 text-lg font-semibold text-center">{getTranslation('Share Video', selectedLanguage)}</h3>
						</div>

						<p className="text-gray-500 text-sm mb-4">{getTranslation('Share this video with your friends and followers', selectedLanguage)}</p>

						{/* Scrollable content area (fills remaining shell height) */}
						<div ref={shareContentRef} className="overflow-auto flex-1 pr-1" style={{ paddingRight: 6 }}>
							{/* Quick Actions */}
							<div className="text-gray-700 text-sm mb-3">{getTranslation('Quick Actions', selectedLanguage)}</div>

							<div className="space-y-2 mb-4">
								{/* copy / share / qr / download buttons */}
								<button
									className="w-full flex items-center gap-3 px-4 py-3 bg-gray-100 rounded-xl"
									onClick={() => { copyLink(); }}
									aria-pressed={copiedLink}
								>
									<div
										className="w-10 h-10 rounded-full flex items-center justify-center bg-white text-gray-900 shadow-sm"
									>
										<CopyIcon />
									</div>
									<div className="text-left">
										<div className="text-gray-900 font-medium">{copiedLink ? getTranslation('Copied', selectedLanguage) : getTranslation('Copy Link', selectedLanguage)}</div>
										<div className="text-gray-500 text-xs">{getTranslation('Copy video URL to clipboard', selectedLanguage)}</div>
									</div>
									<div className="ml-auto text-xs text-green-600">{copiedLink ? getTranslation("Copied", selectedLanguage) : ""}</div>
								</button>

								<button
									className="w-full flex items-center gap-3 px-4 py-3 bg-gray-100 rounded-xl"
									onClick={() => performShare()}
								>
									<div className="w-10 h-10 rounded-full flex items-center justify-center text-gray-900">
										<ShareViaIcon />
									</div>
									<div className="text-left">
										<div className="text-gray-900 font-medium">{getTranslation('Share via...', selectedLanguage)}</div>
										<div className="text-gray-500 text-xs">{getTranslation('Open system share menu', selectedLanguage)}</div>
									</div>
								</button>

								{/* QR preview inserted directly under the QR button so it expands into view */}
								{showQrPreview && (
									<div ref={qrRef} className="flex flex-col items-center mb-4 mt-2">
										<img src={qrImageSrc} alt="QR code" className="w-40 h-40 bg-white p-1 rounded-md" />
										<div className="flex items-center gap-2 mt-3">
											<button onClick={() => { try { navigator.clipboard?.writeText(qrImageSrc); /* vibration disabled per user preference */ setToastMessage(getTranslation('QR URL copied', selectedLanguage)); if (toastTimerRef.current) clearTimeout(toastTimerRef.current); toastTimerRef.current = setTimeout(() => setToastMessage(''), 1600); } catch { } }} className="px-3 py-1 bg-gray-100 rounded-md text-sm text-gray-900">{getTranslation('Copy QR URL', selectedLanguage)}</button>
											<button onClick={downloadQr} className="px-3 py-1 bg-gray-100 rounded-md text-sm text-gray-900">{getTranslation('Download QR', selectedLanguage)}</button>
											<button onClick={() => setShowQrPreview(false)} className="px-3 py-1 bg-gray-200 rounded-md text-sm text-gray-900">{getTranslation('Close', selectedLanguage)}</button>
										</div>
									</div>
								)}



								<button
									className="w-full flex items-center gap-3 px-4 py-3 bg-gray-100 rounded-xl"
									onClick={() => { openQrFor(getShareUrl()); }}
								>
									<div className="w-10 h-10 rounded-full flex items-center justify-center text-gray-900">
										<QrIcon />
									</div>
									<div className="text-left">
										<div className="text-gray-900 font-medium">{getTranslation('QR Code', selectedLanguage)}</div>
										<div className="text-gray-500 text-xs">{getTranslation('Generate QR code for sharing', selectedLanguage)}</div>
									</div>
								</button>

								<button
									className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl ${isDownloadDisabled ? 'opacity-40 cursor-not-allowed' : ''}`}
									onClick={(e) => { if (!downloading && !isDownloadDisabled) handleDownloadVideo(e); }}
									disabled={downloading || isDownloadDisabled}
									style={{ background: '#f3f4f6' }}
									aria-busy={downloading}
								>
									<div
										className="w-10 h-10 rounded-full flex items-center justify-center bg-white text-gray-900 shadow-sm"
									>
										<DownloadIcon />
									</div>
									<div className="text-left">
										<div className="text-gray-900 font-medium">{isDownloadDisabled ? getTranslation('Download unavailable', selectedLanguage) : (downloading ? 'Downloading...' : 'Download')}</div>
										<div className="text-gray-500 text-xs">{isDownloadDisabled ? getTranslation('YouTube videos cannot be downloaded', selectedLanguage) : (downloading ? 'Preparing file...' : 'Includes Regaarder watermark')}</div>
									</div>
								</button>
							</div>

							<div className="text-gray-700 text-sm mb-3">Share to Social Media</div>

							<div className="flex items-center justify-between mb-4">
								<SocialButton bg="#e6f0ff" label="Facebook" onClick={() => shareToFacebook(getShareUrl())}>
									{/* Fixed Facebook Icon */}
									<svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true" role="img">
										<path d="M22 12a10 10 0 1 0-11.5 9.86v-6.99H8.9v-2.87h1.6V9.41c0-1.57.93-2.45 2.36-2.45.68 0 1.39.12 1.39.12v1.53h-.78c-.77 0-1.01.48-1.01.98v1.17h1.72l-.28 2.87h-1.44v6.99A10 10 0 0 0 22 12z" fill="#1877F2" />
									</svg>
								</SocialButton>

								<SocialButton bg="#e6f9ff" label="Twitter" onClick={() => shareToTwitter(getShareUrl())}>
									<svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true" role="img">
										<path d="M23 3a10.9 10.9 0 0 1-3.14 1.53A4.48 4.48 0 0 0 22.43 1s-2 1-3 1a4.48 4.48 0 0 0-7.86 3v1A12.94 12.94 0 0 1 3 2s-4 9 5 13a13 13 0 0 1-7 2c9 5 20 0 20-11.5A4.5 4.5 0 0 0 23 3z" fill="#1DA1F2" />
									</svg>
								</SocialButton>

								<SocialButton bg="#ffe6f0" label="Instagram" onClick={() => shareToInstagram(getShareUrl())}>
									<svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true" role="img">
										<linearGradient id="igGrad" x1="0" x2="1" y1="0" y2="1">
											<stop offset="0%" stopColor="#f58529" />
											<stop offset="50%" stopColor="#dd2a7b" />
											<stop offset="100%" stopColor="#8134af" />
										</linearGradient>
										<rect x="3" y="3" width="18" height="18" rx="5" fill="url(#igGrad)" />
										<path d="M12 7.5a4.5 4.5 0 1 0 0 9 4.5 4.5 0 0 0 0-9z" fill="#fff" opacity="0.95" />
										<circle cx="17.5" cy="6.5" r="1" fill="#fff" opacity="0.95" />
									</svg>
								</SocialButton>

								<SocialButton bg="#f3f4f6" label="Email" onClick={() => shareToEmail(getShareUrl())}>
									<svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true" role="img">
										<path d="M3 5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5z" fill="#e5e7eb" />
										<path d="M4 7l8 6 8-6" stroke="#9ca3af" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" fill="none" />
									</svg>
								</SocialButton>
							</div>

							{/* Video URL row (fixed/unambiguous structure) */}
							<div className="text-gray-700 text-sm mb-2">Video URL</div>
							<div className="flex items-center gap-2 mb-3">
								<input
									name="videoUrl"
									value={getShareUrl()}
									readOnly
									className="flex-1 bg-gray-100 text-gray-900 rounded-xl px-3 py-2 text-sm border-0 outline-none"
									aria-label="Video URL"
								/>
								<button
									onClick={() => copyLink()}
									className="px-3 py-2 rounded-xl text-sm"
									style={{ background: copiedLink ? accentColor : '#1b1b1b', color: copiedLink ? accentText : '#fff' }}
								>
									{copiedLink ? 'Copied' : 'Copy'}
								</button>
							</div>

							{/* bottom padding so last items can be scrolled into view like other dialogs */}
							<div style={{ height: 20 }} />

							{/* Toast message for copy/share actions */}
							{toastMessage && (
								<div
									style={{ position: 'absolute', left: '50%', transform: 'translateX(-50%)', bottom: 20, zIndex: 520 }}
									onTouchStart={(e) => {
										e.currentTarget.dataset.dragStartX = e.touches[0].clientX;
									}}
									onTouchMove={(e) => {
										const startX = parseFloat(e.currentTarget.dataset.dragStartX || '0');
										const diff = e.touches[0].clientX - startX;
										e.currentTarget.style.transform = `translateX(calc(-50% + ${diff}px))`;
									}}
									onTouchEnd={(e) => {
										const startX = parseFloat(e.currentTarget.dataset.dragStartX || '0');
										const endX = e.changedTouches[0].clientX;
										const diff = endX - startX;
										if (Math.abs(diff) > 80) {
											setToastMessage('');
										} else {
											e.currentTarget.style.transform = 'translateX(-50%)';
										}
										e.currentTarget.dataset.dragStartX = '0';
									}}
								>
									<div className="bg-black/80 text-white text-sm px-4 py-2 rounded-md cursor-grab select-none" style={{ animation: 'toastSlideDown 0.4s cubic-bezier(0.16, 1, 0.3, 1)' }}>{toastMessage}</div>
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
							)}
						</div>
					</div>
				</div>
			)}

			{/* === ADD: Comments modal mount === */}

			{/* Tip Creator modal (activated from Options -> Tip Creator) */}
			{showTipModal && (
				<div className="fixed inset-0 flex items-end sm:items-center justify-center" onClick={() => setShowTipModal(false)} style={{ zIndex: 710, backgroundColor: 'rgba(0,0,0,0.6)', backdropFilter: "blur(4px)", WebkitBackdropFilter: "blur(4px)", transition: "backdrop-filter 240ms ease, -webkit-backdrop-filter 240ms ease, background 240ms ease" }}>
					<div
						className="modal-dialog w-full max-w-md rounded-t-2xl p-4 shadow-xl flex flex-col mx-0 sm:mx-4"
						onClick={(e) => e.stopPropagation()}
						role="dialog"
						aria-modal="true"
						aria-label="Tip the Creator"
						style={{ background: "linear-gradient(180deg, rgba(6,6,6,0.9), rgba(0,0,0,0.95))", border: "1px solid rgba(255,255,255,0.03)", position: 'relative', height: tipHeight, maxHeight: tipMaxRef.current, overflow: 'hidden' }}
					>
						{/* Grab handle + close */}
						<div className="w-full h-8 flex items-center justify-center" onPointerDown={onTipHandlePointerDown} onTouchStart={onTipHandlePointerDown} aria-label="Resize sheet" tabIndex={0} style={{ cursor: 'ns-resize' }}>
							<div className="w-12 h-1 bg-gray-600 rounded-full touch-none" onPointerDown={onTipHandlePointerDown} onTouchStart={onTipHandlePointerDown} style={{ cursor: 'ns-resize' }} />
							<button onClick={() => setShowTipModal(false)} className="absolute right-4 top-3 text-gray-300 p-1 rounded-full hover:bg-white/5">✕</button>
						</div>
						{tipHandleHintVisible && (
							<div className="absolute top-3 right-4 bg-black/70 text-white text-xs px-3 py-1 rounded">{getTranslation('Drag to resize', selectedLanguage)}</div>
						)}
						{/* Header */}
						<div className="flex items-start gap-3 mb-3">
							<div className="w-12 h-12 rounded-full flex items-center justify-center" style={{ background: accentColor, color: accentText }}>
								<div className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold" style={{ color: accentText }}>$</div>
							</div>
							<div>
								<div className="text-gray-300 text-sm">{getTranslation('Show your appreciation for', selectedLanguage)} @{creatorName}'s {getTranslation('amazing content', selectedLanguage)}</div>
							</div>
						</div>
						{/* Preset pills */}
						<div style={{ display: 'flex', gap: 10, marginBottom: 12 }}>
							{TIP_PRESETS.map((p) => (
								<button key={p} onClick={() => setTipAmount(p)} className="px-4 py-2 rounded-full border" style={{ background: '#0b0b0b', border: '1px solid rgba(255,255,255,0.04)', minWidth: 64, textAlign: 'center', color: '#fff' }}>$ {p}</button>
							))}
						</div>
						{/* Custom amount input */}
						<div style={{ marginBottom: 12 }}>
							<div className="text-white font-semibold mb-2">{getTranslation('Custom Amount', selectedLanguage)}</div>
							<div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
								<span style={{ padding: '10px 12px', background: '#0b0b0b', border: '1px solid rgba(255,255,255,0.04)', borderRadius: 8, color: '#fff' }}>$</span>
								<input
									name="tipAmount"
									type="number"
									min="0"
									step="0.01"
									value={tipAmount}
									onChange={(e) => setTipAmount(parseFloat(e.target.value || 0))}
									style={{ flex: 1, padding: '10px 12px', borderRadius: 8, border: '1px solid rgba(255,255,255,0.04)', background: '#0b0b0b', color: '#fff' }}
								/>
							</div>
						</div>
						{/* Tip benefits */}
						<div style={{ background: hexToRgba(accentColor, 0.12), padding: 12, borderRadius: 8, marginBottom: 12 }}>
							<div className="text-white text-sm font-medium mb-2">{getTranslation('Your tip helps:', selectedLanguage)}</div>
							<ul className="list-inside list-disc text-gray-200 text-sm" style={{ marginLeft: 16 }}>
								<li>{getTranslation('Support the creator directly', selectedLanguage)}</li>
								<li>{getTranslation('Encourage more great content', selectedLanguage)}</li>
								<li>{getTranslation('Show your appreciation', selectedLanguage)}</li>
							</ul>
						</div>
						{/* Footer actions */}
						<div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
							<button
								className="px-4 py-3 rounded-lg"
								style={{ background: accentColor, color: accentText, fontWeight: 700 }}
								onClick={() => {
									// vibration disabled per user preference
									setToastMessage(`${getTranslation('Tip sent', selectedLanguage)}: $${Number(tipAmount || 0).toFixed(2)}`);
									setShowTipModal(false);
									setTipAmount(0);
									if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
									toastTimerRef.current = setTimeout(() => setToastMessage(''), 1800);
								}}
							>
								{`$ ${getTranslation('Send', selectedLanguage)} ${Number(tipAmount || 0).toFixed(2)}`}
							</button>
							<button className="px-4 py-3 rounded-lg bg-transparent text-white border border-white/10" onClick={() => setShowTipModal(false)}>{getTranslation('Cancel', selectedLanguage)}</button>
						</div>
					</div>
				</div>
			)}


			{/* Bookmark This Moment modal */}
			{showBookmarkModal && (
			<div className="fixed inset-0 flex items-start sm:items-center justify-center pt-24 sm:pt-0" onClick={() => setShowBookmarkModal(false)} style={{ zIndex: 720, backgroundColor: 'rgba(0,0,0,0.6)', backdropFilter: "blur(4px)", WebkitBackdropFilter: "blur(4px)", transition: "backdrop-filter 240ms ease, -webkit-backdrop-filter 240ms ease, background 240ms ease" }}>
				<div
					className="w-full max-w-md rounded-2xl shadow-2xl flex flex-col mx-4 overflow-hidden"
					onClick={(e) => e.stopPropagation()}
					role="dialog"
					aria-modal="true"
					aria-label="Bookmark This Moment"
					style={{ background: 'linear-gradient(135deg, #fbfbfd 0%, #f9f9fc 100%)', border: '1px solid rgba(147,51,234,0.08)', position: 'relative', maxHeight: '85vh', animation: 'modalSlideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1)' }}
				>
					{/* Header */}
					<div className="px-5 py-5 border-b border-gray-100 flex items-start gap-4 bg-white/50 backdrop-blur-sm sticky top-0 z-10">
						<div className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: `${bookmarkAccent}12`, border: `1.5px solid ${bookmarkAccent}20` }}>
							<div className="w-6 h-6 flex items-center justify-center" style={{ color: bookmarkAccent, fontWeight: 700 }}>
								<Bookmark />
							</div>
						</div>
						<div style={{ flex: 1 }}>
							<div className="text-gray-900 text-xl font-bold tracking-tight">{getTranslation('Bookmark This Moment', selectedLanguage)}</div>
							<div className="text-gray-600 text-sm mt-0.5">{getTranslation('Save this timestamp at', selectedLanguage)} <span style={{ color: bookmarkAccent, fontWeight: 600 }}>{formatTime(bookmarkTime)}</span></div>
						</div>
					</div>

					{/* Scrollable Content */}
					<div className="px-5 py-6 space-y-6 overflow-y-auto custom-scrollbar">
						{/* Label Input */}
						<div>
							<label className="text-gray-900 font-semibold text-sm mb-2 block">{getTranslation('Label (optional)', selectedLanguage)}</label>
							<input
								name="bookmarkLabel"
								value={bookmarkLabel}
								onChange={(e) => setBookmarkLabel(e.target.value)}
								placeholder={getTranslation('Best scene, Important moment...', selectedLanguage)}
								className="w-full px-4 py-3 rounded-xl text-sm transition-all focus:outline-none focus:ring-2 bg-white border border-gray-200 text-gray-900 placeholder-gray-400"
								style={{ outlineColor: bookmarkAccent }}
								onFocus={(e) => e.target.style.borderColor = bookmarkAccent}
								onBlur={(e) => e.target.style.borderColor = '#e5e7eb'}
							/>
						</div>

						{/* Segment Selection */}
						<div>
							<div className="text-gray-900 font-semibold text-sm mb-3 flex items-center justify-between">
								<span>{getTranslation('Segment (optional)', selectedLanguage)}</span>
								<span className="text-xs text-gray-500 font-normal bg-gray-100 px-2 py-1 rounded-md">Previewing video frame</span>
							</div>
							
							{/* Visual Timeline */}
							<div className="mb-4 p-4 rounded-xl bg-gray-50/80 border border-gray-100">
								<div 
									className="relative h-14 bg-white rounded-lg overflow-hidden border cursor-pointer shadow-sm group"
									style={{ borderColor: `${bookmarkAccent}40` }}
									onClick={(e) => {
										const rect = e.currentTarget.getBoundingClientRect();
										const clickPos = (e.clientX - rect.left) / rect.width;
										const clickTime = Math.max(0, Math.min(duration, clickPos * duration));
										
										// Seek video to preview frame
										if (videoRef.current) {
											videoRef.current.currentTime = clickTime;
											// Pause if playing to verify frame
											// videoRef.current.pause(); 
											// setIsPlaying(false);
										}

										// If click is closer to start, move start time; otherwise move end time
										const distToStart = Math.abs(clickTime - bookmarkStartTime);
										const distToEnd = Math.abs(clickTime - bookmarkEndTime);
										
										if (distToStart < distToEnd) {
											setBookmarkStartTime(Math.min(clickTime, bookmarkEndTime));
										} else {
											setBookmarkEndTime(Math.max(clickTime, bookmarkStartTime));
										}
									}}
								>
									{/* Progress background */}
									<div className="absolute inset-0 flex">
										<div style={{ width: `${(bookmarkStartTime / duration) * 100}%`, background: '#f3f4f6' }} />
										<div style={{ width: `${((bookmarkEndTime - bookmarkStartTime) / duration) * 100}%`, background: `${bookmarkAccent}15` }} />
										<div style={{ flex: 1, background: '#f3f4f6' }} />
									</div>
									
									{/* Start marker */}
									<div 
										className="absolute top-0 h-full w-1 hover:w-1.5 transition-all z-10"
										style={{ left: `${(bookmarkStartTime / duration) * 100}%`, background: bookmarkAccent }}
									/>
									
									{/* End marker */}
									<div 
										className="absolute top-0 h-full w-1 hover:w-1.5 transition-all z-10"
										style={{ left: `${(bookmarkEndTime / duration) * 100}%`, background: bookmarkAccent }}
									/>
									
									{/* Detailed Time labels inside bar */}
									<div className="absolute inset-0 flex items-center justify-between px-3 text-[10px] font-bold pointer-events-none select-none" style={{ color: bookmarkAccent }}>
										<span className="bg-white/80 px-1 rounded">{formatTime(bookmarkStartTime)}</span>
										<span className="bg-white/80 px-1 rounded">{formatTime(bookmarkEndTime)}</span>
									</div>
								</div>
								<div className="text-center mt-2 text-[10px] text-gray-400">Click timeline to adjust & preview frame</div>
							</div>

							{/* Time inputs */}
							<div className="grid grid-cols-2 gap-4 mb-4">
								<div>
									<label className="text-xs font-semibold text-gray-500 mb-1.5 block uppercase tracking-wide">Start Time</label>
									<div className="relative">
										<input
											type="number"
											min="0"
											max={duration}
											step="0.1"
											value={bookmarkStartTime.toFixed(1)}
											onChange={(e) => {
												const val = Math.max(0, Math.min(duration, parseFloat(e.target.value) || 0));
												setBookmarkStartTime(val);
												if (videoRef.current) videoRef.current.currentTime = val;
											}}
											className="w-full px-3 py-2.5 rounded-lg text-sm bg-white border border-gray-200 text-center font-mono"
											style={{ color: '#111' }}
										/>
									</div>
								</div>
								<div>
									<label className="text-xs font-semibold text-gray-500 mb-1.5 block uppercase tracking-wide">End Time</label>
									<div className="relative">
										<input
											type="number"
											min="0"
											max={duration}
											step="0.1"
											value={bookmarkEndTime.toFixed(1)}
											onChange={(e) => {
												const val = Math.max(0, Math.min(duration, parseFloat(e.target.value) || 0));
												setBookmarkEndTime(val);
												if (videoRef.current) videoRef.current.currentTime = val;
											}}
											className="w-full px-3 py-2.5 rounded-lg text-sm bg-white border border-gray-200 text-center font-mono"
											style={{ color: '#111' }}
										/>
									</div>
								</div>
							</div>

							{/* Duration & Loop */}
							<div className="flex items-center gap-4">
								<div className="px-3 py-1.5 bg-gray-100 rounded-md text-xs font-medium text-gray-600">
									Duration: {formatTime(bookmarkEndTime - bookmarkStartTime)}
								</div>
								
								<label className="flex-1 flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-all border hover:border-purple-200" style={{ background: bookmarkShareSegment ? `${bookmarkAccent}08` : '#fff', border: `1px solid ${bookmarkShareSegment ? `${bookmarkAccent}40` : '#e5e7eb'}` }}>
									<input
										type="checkbox"
										checked={bookmarkShareSegment}
										onChange={(e) => setBookmarkShareSegment(e.target.checked)}
										className="w-4 h-4 rounded cursor-pointer"
										style={{ accentColor: bookmarkAccent }}
									/>
									<div>
										<div className="text-xs font-bold text-gray-800 uppercase tracking-wide">Loop Segment</div>
									</div>
								</label>
							</div>
						</div>
					</div>

					{/* Footer Actions */}
					<div className="px-5 py-5 border-t border-gray-200/50 bg-gray-50/50 flex flex-col gap-3 sm:flex-row sm:gap-3 sticky bottom-0 z-10 backdrop-blur-md">
						<button
							className="flex-1 px-4 py-3.5 rounded-xl w-full flex items-center justify-center font-bold text-sm transition-all hover:shadow-lg active:scale-95 shadow-md"
							style={{ background: bookmarkAccent, color: '#fff' }}
							onClick={saveBookmark}
						>
							<span style={{ display: 'inline-flex', alignItems: 'center', marginRight: 8 }}><Bookmark size={18} strokeWidth={2.5} /></span>
							{getTranslation('Save Bookmark', selectedLanguage)}
						</button>
						<button 
							className="flex-1 px-4 py-3.5 rounded-xl w-full font-bold text-sm transition-all hover:bg-gray-200 active:scale-95"
							style={{ background: '#fff', color: '#4b5563', border: '1px solid #e5e7eb' }} 
							onClick={() => setShowBookmarkModal(false)}
						>
							{getTranslation('Cancel', selectedLanguage)}
						</button>
					</div>
				</div>
			</div>
		)}

			{/* Quick-action floating card (shown on long-press) */}
			{showQuickCard && (
				<div
					ref={quickCardRef}
					className="pointer-events-auto quick-action-card"
					onPointerDown={(e) => e.stopPropagation()}
					style={{
						position: 'fixed',
						left: quickCardPos.x,
						top: quickCardPos.y,
						transform: 'translate(-50%, -120%)',
						zIndex: 950,
						minWidth: 280,
						padding: 10,
						borderRadius: 12,
						display: 'flex',
						alignItems: 'center',
						justifyContent: 'space-between',
						gap: 12,
						boxShadow: '0 10px 30px rgba(0,0,0,0.5)',
						backdropFilter: 'blur(2px)',
						WebkitBackdropFilter: 'blur(2px)',
						background: darkMode ? 'rgba(8,10,12,0.72)' : 'rgba(255,255,255,0.92)',
					}}
				>
					<button onClick={onQuickLike} aria-label="Like" className="p-1 rounded-lg" style={{ background: 'transparent', border: 'none', color: liked ? accentColor : (darkMode ? '#fff' : '#111') }}>
						<Heart filled={liked} />
					</button>
					<button onClick={onQuickDislike} aria-label="Dislike" className="p-1 rounded-lg" style={{ background: 'transparent', border: disliked ? '1px solid #ef4444' : 'none', borderRadius: 8, padding: 6, color: disliked ? '#ef4444' : (darkMode ? '#fff' : '#111') }}>
						<HeartOff />
					</button>
					<button onClick={() => {
						setShowQuickCard(false);
						if (quickCardTimerRef.current) clearTimeout(quickCardTimerRef.current);
						openBookmarkModalAtCurrent();
					}} aria-label="Bookmark Moment" className="p-1 rounded-lg" style={{ background: 'transparent', border: 'none', color: bookmarkAccent }}>
						<Bookmark />
					</button>
					{/* Lock toggle moved into quick actions when not locked */}
					<button
						onClick={(e) => {
							e.stopPropagation();
							// if not currently locked, this will lock the screen — show toaster
							if (!locked) {
								if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
								setToastMessage('Your screen is locked');
								toastTimerRef.current = setTimeout(() => setToastMessage(''), 1600);
							}
							try { handleLockPress(); } catch { }
							setShowQuickCard(false);
							if (quickCardTimerRef.current) { clearTimeout(quickCardTimerRef.current); quickCardTimerRef.current = null; }
						}}
						aria-label={locked ? "Unlock controls" : "Lock controls"}
						className="p-1 rounded-lg"
						style={{ background: 'transparent', border: 'none', color: locked ? accentColor : (darkMode ? '#fff' : '#111') }}
					>
						{/* Show Lock when already locked, otherwise LockOpen for activating */}
						{locked ? <Lock /> : <LockOpen />}
					</button>
				</div>
			)}

			{/* Quick-centered Bookmark modal (small centered popup triggered from quick-action) */}
			{showQuickBookmarkModal && (
				<div className="fixed inset-0 flex items-center justify-center" onClick={() => setShowQuickBookmarkModal(false)} style={{ zIndex: 2200, backgroundColor: 'rgba(0,0,0,0.6)', backdropFilter: "blur(4px)", WebkitBackdropFilter: "blur(4px)", transition: "backdrop-filter 240ms ease, -webkit-backdrop-filter 240ms ease, background 240ms ease" }}>
					<div className="bg-white rounded-xl p-4 shadow-2xl w-[90%] max-w-sm" onClick={(e) => e.stopPropagation()} style={{ color: '#111' }}>
						<div className="flex items-start gap-3 mb-3">
							<div className="w-11 h-11 rounded-xl flex items-center justify-center border" style={{ background: '#fbfbfd', borderColor: 'rgba(0,0,0,0.04)' }}>
								<div className="w-7 h-7 rounded-full flex items-center justify-center" style={{ color: bookmarkAccent, fontWeight: 700 }}>
									<Bookmark />
								</div>
							</div>
							<div style={{ flex: 1 }}>
								<div className="text-black text-lg font-semibold">Bookmark This Moment</div>
								<div className="text-sm text-gray-600">Save this timestamp at <strong>{formatTime(bookmarkTime)}</strong></div>
							</div>
						</div>
						<div className="mb-3">
							<input name="bookmarkLabel_quick" value={bookmarkLabel} onChange={(e) => setBookmarkLabel(e.target.value)} placeholder="Label (optional)" className="w-full px-3 py-2 rounded-md border" />
						</div>
						<div className="flex gap-3">
							<button className="flex-1 px-4 py-2 rounded-md" style={{ background: bookmarkAccent, color: '#fff', fontWeight: 700 }} onClick={saveQuickBookmark}>Save</button>
							<button className="flex-1 px-4 py-2 rounded-md" style={{ background: '#f3f4f6' }} onClick={() => setShowQuickBookmarkModal(false)}>Cancel</button>
						</div>
					</div>
				</div>
			)}

			{/* Transient filled bookmark pulse (appears near quick-card, fills and fades) */}
			{quickBookmarkPulse.show && (
				<div style={{ position: 'fixed', left: quickBookmarkPulse.x, top: quickBookmarkPulse.y, transform: 'translate(-50%, -120%)', zIndex: 2250 }} aria-hidden>
					<div style={{ transition: 'transform 900ms ease, opacity 900ms ease', transform: quickBookmarkPulseActive ? 'translate(-50%, -120%) scale(1.6)' : 'translate(-50%, -120%) scale(1)', opacity: quickBookmarkPulseActive ? 0 : 1 }}>
						<div className="w-12 h-12 rounded-lg flex items-center justify-center bg-transparent">
							<BookmarkFilled />
						</div>
					</div>
				</div>
			)}

			{/* Global toast (shows messages from handlers like quick-actions) */}
			{toastMessage && (
				<div
					role="status"
					aria-live="polite"
					style={{
						position: 'fixed',
						left: '50%',
						transform: 'translateX(-50%)',
						top: '18%',
						zIndex: 4000,
						pointerEvents: 'auto',
						willChange: 'transform, opacity',
						animation: 'toastSlideDown 0.4s cubic-bezier(0.16, 1, 0.3, 1)'
					}}
					onTouchStart={(e) => {
						e.currentTarget.dataset.dragStartX = e.touches[0].clientX;
					}}
					onTouchMove={(e) => {
						const startX = parseFloat(e.currentTarget.dataset.dragStartX || '0');
						const diff = e.touches[0].clientX - startX;
						e.currentTarget.style.transform = `translateX(calc(-50% + ${diff}px))`;
					}}
					onTouchEnd={(e) => {
						const startX = parseFloat(e.currentTarget.dataset.dragStartX || '0');
						const endX = e.changedTouches[0].clientX;
						const diff = endX - startX;
						if (Math.abs(diff) > 80) {
							setToastMessage('');
						} else {
							e.currentTarget.style.transform = 'translateX(-50%)';
						}
						e.currentTarget.dataset.dragStartX = '0';
					}}
				>
					<div className="bg-black/80 text-white text-sm px-4 py-2 rounded-md cursor-grab select-none" style={{ boxShadow: '0 8px 24px rgba(0,0,0,0.36)' }}>{toastMessage}</div>
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
			)}

			{/* Report An Issue modal (top-level, activated from Options -> Report an issue) */}
			{showReportModal && (
				<div className="fixed inset-0 flex items-end sm:items-center justify-center" onClick={() => setShowReportModal(false)} style={{ zIndex: 700, backgroundColor: 'rgba(0,0,0,0.6)', backdropFilter: "blur(4px)", WebkitBackdropFilter: "blur(4px)", transition: "backdrop-filter 240ms ease, -webkit-backdrop-filter 240ms ease, background 240ms ease" }}>
					<div
						className="modal-dialog w-full bg-white rounded-t-2xl p-4 shadow-xl flex flex-col mx-0 sm:mx-4"
						onClick={(e) => e.stopPropagation()}
						role="dialog"
						aria-modal="true"
						aria-label="Report an Issue"
						style={{ position: 'relative', maxHeight: window.innerHeight * 0.92, overflow: 'hidden' }}
					>
						{/* Grab handle */}
						<div className="w-full h-8 flex items-center justify-center">
							<div className="w-12 h-1 bg-gray-300 rounded-full touch-none" style={{ cursor: 'ns-resize' }} />
						</div>
						{reportHandleHintVisible && (
							<div className="absolute top-3 right-4 bg-black/70 text-white text-xs px-3 py-1 rounded">{getTranslation("Drag to resize", selectedLanguage)}</div>
						)}

						{/* Header */}
						<div className="flex items-start justify-between mb-3">
							<div className="flex items-start gap-3">
								{/* Warning icon (yellow triangle) */}
								<div className="w-10 h-10 rounded-full bg-yellow-50 flex items-center justify-center">
									<svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
										<path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" fill={accentColor} />
										<path d="M12 9v4" stroke="#111" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
										<circle cx="12" cy="17" r="1" fill="#111" />
									</svg>
								</div>
								<div>
									<h2 className="text-black text-xl font-semibold">{getTranslation("Report an Issue", selectedLanguage)}</h2>
									<div className="text-gray-500 text-sm">{getTranslation("Help us improve your experience by reporting any issues you encounter", selectedLanguage)}</div>
								</div>
							</div>
							<button onClick={() => setShowReportModal(false)} className="text-gray-600 p-1 rounded-full hover:bg-gray-100">✕</button>
						</div>

						{/* Content */}
						<div className="overflow-auto flex-1 pt-2" style={{ paddingRight: 6 }}>
							<div className="mb-3">
								<div className="text-black font-semibold mb-2">{getTranslation("Issue Category", selectedLanguage)}</div>
								<div style={{ position: 'relative' }}>
									<select value={reportCategory} onChange={(e) => setReportCategory(e.target.value)} className="w-full bg-white text-black rounded-xl px-3 py-2 border border-gray-200 appearance-none">
										<option value="" disabled>{getTranslation("Select an issue type", selectedLanguage)}</option>
										<option value="bug">{getTranslation("Bug", selectedLanguage)}</option>
										<option value="playback">{getTranslation("Playback Issue", selectedLanguage)}</option>
										<option value="inappropriate">{getTranslation("Inappropriate Content", selectedLanguage)}</option>
										<option value="other">{getTranslation("Other", selectedLanguage)}</option>
									</select>
									<div style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', color: '#6b7280' }}>
										<ChevronDown size={18} />
									</div>
								</div>
							</div>

							<div className="mb-3">
								<div className="text-black font-semibold mb-2">{getTranslation("Describe the issue", selectedLanguage)} <span className="text-gray-500 font-normal">{getTranslation("(Optional)", selectedLanguage)}</span></div>
								<textarea
									value={reportText}
									onChange={(e) => setReportText(e.target.value.slice(0, REPORT_MAX))}
									placeholder={getTranslation("Please provide details about the issue you're experiencing...", selectedLanguage)}
									className="w-full bg-white text-black border border-gray-200 rounded-xl px-3 py-3 h-28 resize-none outline-none"
									maxLength={REPORT_MAX}
								/>
								<div className="text-gray-500 text-xs mt-1">{reportText.length}/{REPORT_MAX} {getTranslation("characters", selectedLanguage)}</div>
							</div>

							<div className="mb-4 bg-gray-50 border border-gray-100 rounded-lg p-3 text-sm text-gray-800">
								<div className="text-gray-800 text-sm mb-2">{getTranslation("Report will include:", selectedLanguage)}</div>
								<ul className="list-inside list-disc space-y-1 text-gray-700">
									<li>{getTranslation("Video:", selectedLanguage)} {videoTitle}</li>
									<li>{getTranslation("Creator:", selectedLanguage)} {creatorName}</li>
									<li>{getTranslation("Timestamp:", selectedLanguage)} {(() => {
										try {
											const v = videoRef.current;
											const secs = v ? Math.floor(v.currentTime || 0) : Math.floor(progress * duration || 0);
											const m = Math.floor(secs / 60);
											const s = String(secs % 60).padStart(2, '0');
											return `${m}:${s}`;
										} catch { return '0:00'; }
									})()}</li>
								</ul>
							</div>

							{/* Buttons */}
							<div className="flex flex-col gap-3 mb-6">
								<button
									className="w-full px-4 py-3 rounded-lg font-medium"
									style={{ background: accentColor, color: accentText }}
									onClick={() => {
										// Submit to backend
										try {
											const token = localStorage.getItem('regaarder_token');
											const BACKEND = (window && window.__BACKEND_URL__) || `${window.location.protocol}//${window.location.hostname}:4000`;
											const v = videoRef.current;
											const secs = v ? Math.floor(v.currentTime || 0) : Math.floor(progress * duration || 0);

											fetch(`${BACKEND}/reports`, {
												method: 'POST',
												headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
												body: JSON.stringify({
													videoId: videoUrl || videoTitle || null,
													title: videoTitle,
													creator: creatorName,
													timestamp: secs,
													category: reportCategory,
													description: reportText
												})
											}).catch(() => { });
										} catch (e) { }

										setToastMessage(getTranslation('Report submitted', selectedLanguage));
										setShowReportModal(false);
										setReportCategory('');
										setReportText('');
										if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
										toastTimerRef.current = setTimeout(() => setToastMessage(''), 1800);
									}}
								>
									{getTranslation("Submit Report", selectedLanguage)}
								</button>
								<button className="w-full px-4 py-3 rounded-lg bg-transparent text-black border border-gray-200" onClick={() => setShowReportModal(false)}>{getTranslation("Cancel", selectedLanguage)}</button>
							</div>
						</div>
					</div>
				</div>
			)}
			{showCommentsModal && (
				<CommentsModal
					isOpen={showCommentsModal}
					onClose={() => setShowCommentsModal(false)}
					requestId={videoInfo?.id || videoTitle || 'unknown'}
					selectedLanguage={selectedLanguage}
				/>
			)}

			{/* Notes modal (per-video notes, optional timestamp links, emoji quick-picks) */}
			{showNotesModal && (
				<div className="fixed inset-0 flex items-end sm:items-center justify-center" onClick={() => setShowNotesModal(false)} style={{ zIndex: 700, backgroundColor: 'rgba(0,0,0,0.6)', backdropFilter: "blur(4px)", WebkitBackdropFilter: "blur(4px)", transition: "backdrop-filter 240ms ease, -webkit-backdrop-filter 240ms ease, background 240ms ease" }}>
					<div
						className="modal-dialog w-full max-w-md rounded-2xl p-4 shadow-xl flex flex-col mx-4"
						onClick={(e) => e.stopPropagation()}
						role="dialog"
						aria-modal="true"
						aria-label="Notes"
						style={{
							background: "#fff",
							border: "1px solid #e5e7eb",
							position: 'relative',
							maxHeight: window.innerHeight * 0.92,
							overflow: 'hidden',
							marginBottom: 12
						}}
					>
						<div className="w-full h-10 flex items-center justify-center">
							<div role="separator" className="w-12 h-1 bg-gray-300 rounded-full touch-none" style={{ cursor: 'ns-resize' }} />
						</div>
						{notesHandleHintVisible && (
							<div className="absolute top-3 right-4 bg-black/70 text-white text-xs px-3 py-1 rounded">{getTranslation('Drag to resize', selectedLanguage)}</div>
						)}
						<h2 className="text-gray-900 text-lg font-semibold mb-3 text-center">{getTranslation('Notes', selectedLanguage)}</h2>
						<div className="overflow-auto flex-1" style={{ paddingRight: 6 }}>
							{/* input area */}
							<div className="mb-3">
								<div className="text-gray-900 font-semibold mb-2">{getTranslation('New Note', selectedLanguage)}</div>
								<div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
									{/* emoji quick picks */}
									<div style={{ display: 'flex', gap: 6 }}>
										{['📌', '😀', '❤️', '🔥'].map((emo) => (
											<button key={emo} onClick={() => setNoteText((s) => s + emo)} className="px-2 py-1 rounded bg-gray-100 text-gray-900">{emo}</button>
										))}
									</div>
									{/* timestamp toggle */}
									<label style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 6 }}>
										<input name="attachTimestamp" type="checkbox" checked={linkNoteTimestamp} onChange={(e) => setLinkNoteTimestamp(e.target.checked)} className="w-4 h-4" />
										<span className="text-gray-500 text-xs">{getTranslation('Attach timestamp', selectedLanguage)}</span>
									</label>
								</div>
								<textarea value={noteText} onChange={(e) => setNoteText(e.target.value)} placeholder={getTranslation("Add notes... e.g. 'Interesting point', 'Check later'", selectedLanguage)} className="w-full bg-gray-50 text-gray-900 border border-gray-200 rounded-xl px-3 py-3 h-28 resize-none outline-none" />
								<div className="flex items-center justify-end gap-3 mt-3">
									<button className="px-4 py-2 rounded-lg bg-transparent text-gray-700 border border-gray-300" onClick={() => { setNoteText(''); setLinkNoteTimestamp(true); }}>{getTranslation('Reset', selectedLanguage)}</button>
									<button className="px-4 py-2 rounded-lg" style={{ background: '#111', color: '#fff' }} onClick={() => {
										const text = noteText.trim();
										if (!text) return;
										const time = linkNoteTimestamp && videoRef.current ? Math.floor(videoRef.current.currentTime || 0) : null;
										const n = { id: Date.now(), text, time };
										const next = [n, ...(notes || [])];
										setNotes(next);
										saveNotesFor(videoUrl, next);
										setNoteText('');
										setLinkNoteTimestamp(true);
									}}>
										{getTranslation('Add Note', selectedLanguage)}
									</button>
								</div>
							</div>

							{/* existing notes list */}
							<div>
								{(notes || []).length === 0 ? (
									<div className="text-gray-400 text-center py-8">{getTranslation('No notes yet.', selectedLanguage)}</div>
								) : (
									<div className="space-y-3">
										{notes.map((note) => (
											<div key={note.id} className="bg-gray-50 border border-gray-100 p-3 rounded-lg flex items-start justify-between">
												<div>
													<div className="text-gray-900" style={{ whiteSpace: 'pre-wrap' }}>{note.text}</div>
													{note.time != null && (
														<button className="text-sm text-gray-500 mt-2 hover:underline" onClick={() => {
															try { if (videoRef.current) { videoRef.current.currentTime = note.time; setControlsVisible(true); } } catch { }
														}}>{formatTime(note.time)}</button>
													)}
												</div>
												<div>
													<button className="text-sm text-gray-400 ml-3 hover:text-red-500" onClick={() => {
														const next = notes.filter(n => n.id !== note.id);
														setNotes(next);
														saveNotesFor(videoUrl, next);
													}}>{getTranslation('Delete', selectedLanguage)}</button>
												</div>
											</div>
										))}
									</div>
								)}
							</div>
						</div>
					</div>
				</div>
			)}

			{/* --- ADDED: Carbon-copy right-side panel (revealed by left-swipe from middle) --- */}
			<div
				aria-hidden={!showCarbonCopy && !isSwiping}
				style={{
					pointerEvents: (showCarbonCopy || isSwiping) ? "auto" : "none",
					position: "fixed",
					top: 0,
					right: 0,
					height: "100vh",
					width: panelWidthRef.current,
					maxWidth: "100%",
					zIndex: 1000
				}}
			>
				{/* overlay behind panel */}
				{(showCarbonCopy || (isSwiping && swipeTranslate !== 0)) && (
					<div
						onClick={(e) => {
							e.preventDefault();
							e.stopPropagation();
							setShowCarbonCopy(false);
							setSwipeTranslate(0);
						}}
						style={{
							position: "fixed",
							left: 0,
							top: 0,
							width: "100vw",
							height: "100vh",
							background: "rgba(0,0,0,0.36)",
							opacity: showCarbonCopy ? 1 : Math.min(0.6, Math.max(0, (-swipeTranslate) / panelWidthRef.current)),
							transition: isSwiping ? "none" : "opacity 220ms ease",
							zIndex: 999
						}}
					/>
				)}

				{/* Miniplayer restore / docking button removed per UX request */}

				{/* sliding panel */}
				<div
					onPointerDown={onPanelPointerDown}
					onPointerMove={onPanelPointerMove}
					onPointerUp={onPanelPointerUp}
					onPointerCancel={onPanelPointerUp}
					onClick={(e) => {
						e.preventDefault();
						e.stopPropagation();
						const target = e.target;
						if (target && typeof target.closest === 'function') {
							if (target.closest('button, input, textarea, select, a, [role="button"]')) return;
						}
						setShowCarbonCopy(false);
						setSwipeTranslate(0);
					}}
					style={{
						position: "absolute",
						right: 0,
						top: 0,
						height: "100%",
						width: panelWidthRef.current,
						background: "#fff",
						color: "#111",
						transform: `translateX(${Math.max(0, panelWidthRef.current + swipeTranslate)}px)`,
						// apply transition to the moving element (enable when not actively swiping)
						transition: isSwiping ? "none" : "transform 260ms cubic-bezier(.2,.9,.2,1)",
						boxShadow: "-20px 0 40px rgba(0,0,0,0.35)",
						borderLeft: "1px solid rgba(0,0,0,0.06)",
						overflowY: "auto",
						zIndex: 1000,
						display: "flex",
						flexDirection: "column",
						touchAction: "none" // help capture horizontal drags reliably
					}}
				>
					{/* header */}
				<div style={{ padding: 18, display: "flex", alignItems: "center", justifyContent: "space-between", borderBottom: "1px solid rgba(0,0,0,0.06)" }}>
					<div style={{ display: "flex", alignItems: "center", gap: 12 }}>
						<div className="w-9 h-9 rounded-md flex items-center justify-center bg-gray-100" style={{ color: "#111" }}><Compass size={20} strokeWidth={2.5} /></div>
						<div>
							<div style={{ fontSize: 18, fontWeight: 700 }}>Discover More</div>
							<div style={{ fontSize: 12, color: "#6b7280" }}>Search and explore related videos</div>
						</div>
					</div>
					<button
						aria-label="Close"
						onPointerDown={(e) => { e.preventDefault(); e.stopPropagation(); }}
						onPointerUp={(e) => { e.preventDefault(); e.stopPropagation(); }}
						onClick={(e) => {
							e.preventDefault();
							e.stopPropagation();
							setShowCarbonCopy(false);
							setSwipeTranslate(0);
						}}
						style={{ border: "none", background: "transparent", fontSize: 24, cursor: "pointer", color: "#6b7280", padding: "4px" }}
					>
						✕
					</button>
				</div>

				{/* search + tabs/chips */}
				<div style={{ padding: 14 }}>
					<div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
						<input name="discoverQuery" value={discoverQuery} onChange={(e) => setDiscoverQuery(e.target.value)} placeholder="Search videos..." style={{ flex: 1, padding: "10px 12px", borderRadius: 10, border: "1px solid #e6e6e6", outline: "none" }} />
					</div>
					{/* Navigation Tabs - Same as Home Page - Horizontally Scrollable */}
					<div style={{ marginTop: 12, display: "flex", gap: 8, overflowX: "auto", overflowY: "hidden", paddingBottom: 8, whiteSpace: "nowrap", scrollBehavior: "smooth" }}>
						{(() => {
							const tabs = [
								{ name: 'Recommended', icon: Star },
								{ name: 'Trending Now', icon: TrendingUp },
								{ name: 'New', icon: Clock },
								{ name: 'Travel', icon: Globe },
								{ name: 'Education', icon: BookOpen },
								{ name: 'Entertainment', icon: Video },
								{ name: 'Music', icon: Music },
								{ name: 'Sports', icon: Dumbbell },
								{ name: 'Bookmarks', icon: Bookmark },
								{ name: 'Liked', icon: Heart },
							];
							return tabs.map((tab) => {
								const isSelected = tab.name === selectedChip;
								const IconComponent = tab.icon;
								return (
									<button
										key={tab.name}
										onClick={() => setSelectedChip(tab.name)}
										style={{
											display: 'flex',
											alignItems: 'center',
											gap: 6,
											paddingLeft: 12,
											paddingRight: 12,
											paddingTop: 10,
											paddingBottom: 10,
											borderRadius: '8px',
											border: 'none',
											cursor: 'pointer',
											fontSize: 13,
											transition: 'all 150ms ease-in-out',
											background: isSelected ? accentColor : '#fff',
											color: isSelected ? accentText : '#4b5563',
											fontWeight: isSelected ? 700 : 500,
											boxShadow: isSelected 
												? `0 4px 10px rgba(0, 0, 0, 0.3), 0 0 10px ${accentColor}33, inset 0 1px 0 rgba(255, 255, 255, 0.6)`
												: `0 1px 3px rgba(0, 0, 0, 0.05), inset 0 1px 0 #ffffff`,
											flexShrink: 0,
											whiteSpace: 'nowrap'
										}}
									>
										<IconComponent size={16} strokeWidth={2.5} />
										{tab.name}
									</button>
								);
							});
						})()}
						</div>
					</div>

					{/* example list (from discover items or placeholders) */}
					<div style={{ padding: 12, display: "flex", flexDirection: "column", gap: 12, flex: 1, overflowY: "auto", minHeight: 0 }}>
						{(() => {
							// Video filtering based on selected tab
							const placeholders = [];
							const source = (typeof discoverItems !== 'undefined' && discoverItems && discoverItems.length) ? discoverItems : (discoverItemsData && discoverItemsData.length ? discoverItemsData : placeholders);
							const q = (discoverQuery || '').trim().toLowerCase();
							// Special-case: show saved bookmarks across videos
							if (selectedChip === 'Bookmarks') {
								const saved = loadAllBookmarkedVideos();
								if (!saved.length) {
									return (
										<div className="text-gray-400 text-center py-8">No bookmarks yet.</div>
									);
								}
								// Render each bookmark as a video-like card (use discover metadata when available)
								return saved.flatMap((svc) => {
									const meta = (source || []).find(it => it.url === svc.url) || {};
									return (svc.bookmarks || []).map((b) => {
										const thumb = meta.thumbnail || 'https://placehold.co/220x128/000000/ffffff?text=Video';
										const title = b.label || meta.title || svc.url;
										const creator = meta.creator || '';
										const dur = meta.duration || 0;
										const bkKey = `${svc.url}::${b.id}`;
										return (
											<div key={bkKey} role="button" tabIndex={0} onClick={() => {
												try {
													setShowCarbonCopy(false);
													if (svc.url) setVideoUrl(resolveMediaUrl(svc.url));
													setTimeout(() => {
														try {
															const v = videoRef.current;
															if (v) {
																if (svc.url) v.src = resolveMediaUrl(svc.url);
																try { v.currentTime = Math.max(0, Math.floor(b.time || 0)); } catch { }
																try { const p = v.play(); if (p && p.catch) p.catch(() => { }); setIsPlaying(true); } catch { }
																try { setControlsVisible(true); showCenterTemporarily(2000); } catch { }
															}
														} catch { }
													}, 180);
													try { setToastMessage('Playing from bookmarked moment'); if (toastTimerRef.current) clearTimeout(toastTimerRef.current); toastTimerRef.current = setTimeout(() => setToastMessage(''), 1400); } catch { }
												} catch { }
											}} style={{ display: 'flex', gap: 12, alignItems: 'flex-start', background: '#fff', padding: 10, borderRadius: 12, border: '1px solid rgba(0,0,0,0.04)', cursor: 'pointer', position: 'relative' }}>
												<div className="w-28 h-16 rounded-md relative overflow-hidden" style={{ background: `url(${thumb}) center/cover no-repeat` }}>
													<div className="absolute right-2 bottom-1 bg-black/70 text-white text-xs px-2 py-0.5 rounded">{formatTime(b.time || 0)}</div>
												</div>
												<div style={{ flex: 1 }}>
													<div style={{ fontWeight: 700 }}>{title}</div>
													<div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 6 }}>
														<div style={{ fontSize: 12, color: '#6b7280' }}>{creator}{dur ? <span style={{ background: '#e6f2ff', color: '#2563eb', padding: '2px 6px', borderRadius: 8, marginLeft: 8, fontSize: 11 }}>{(() => { const s = dur || 0; return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}` })()}</span> : null}</div>
														<div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
															<button aria-label="Share bookmarked moment" data-share-anchor={bkKey} onClick={(e) => {
																e.stopPropagation?.();
																// toggle popover for this bookmark
																try { setSharePopoverFor((s) => s === bkKey ? null : bkKey); } catch { }
															}} className="p-1.5 rounded-full hover:bg-gray-100" style={{ border: 'none', background: 'transparent', cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
																<ShareIcon />
															</button>
														</div>
													</div>
												</div>
												{/* Share popover (anchored to card) */}
												{sharePopoverFor === bkKey && (
													<div role="dialog" aria-label="Share bookmark" data-share-key={bkKey} className="min-w-[220px] sm:min-w-[260px] bg-white rounded-xl p-4 shadow-2xl" style={{ position: 'absolute', right: 12, top: 56, zIndex: 1100, border: '1px solid rgba(0,0,0,0.06)' }} onClick={(e) => e.stopPropagation()}>
														<div style={{ fontSize: 13, fontWeight: 700, marginBottom: 8 }}>Share bookmarked moment</div>
														<div style={{ fontSize: 12, color: '#6b7280', marginBottom: 8 }}>This link opens the video at the saved time.</div>
														<div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
															<button onClick={() => {
																try {
																	const link = makeShareLink(svc.url, b.time);
																	copyToClipboard(link);
																	setToastMessage('Link copied');
																	setSharePopoverFor(null);
																	if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
																	toastTimerRef.current = setTimeout(() => setToastMessage(''), 1600);
																} catch { }
															}} style={{ padding: '8px 10px', borderRadius: 8, border: '1px solid rgba(0,0,0,0.04)', background: '#fafafa', cursor: 'pointer', textAlign: 'left' }}>Copy link</button>
															<button onClick={() => { try { const link = makeShareLink(svc.url, b.time); try { window.location.href = `whatsapp://send?text=${encodeURIComponent(link)}`; } catch { } setTimeout(() => window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(link)}`, '_blank'), 600); setSharePopoverFor(null); } catch { } }} style={{ padding: '8px 10px', borderRadius: 8, border: '1px solid rgba(0,0,0,0.04)', background: '#fff', cursor: 'pointer', textAlign: 'left' }}>Send to WhatsApp</button>
															<button onClick={() => { try { const link = makeShareLink(svc.url, b.time); try { window.location.href = `twitter://post?message=${encodeURIComponent(link)}`; } catch { } setTimeout(() => window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(link)}`, '_blank'), 600); setSharePopoverFor(null); } catch { } }} style={{ padding: '8px 10px', borderRadius: 8, border: '1px solid rgba(0,0,0,0.04)', background: '#fff', cursor: 'pointer', textAlign: 'left' }}>Share to Twitter</button>
															<button onClick={() => { try { const link = makeShareLink(svc.url, b.time); try { window.location.href = `fb-messenger://share?link=${encodeURIComponent(link)}`; } catch { } setTimeout(() => window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(link)}`, '_blank'), 600); setSharePopoverFor(null); } catch { } }} style={{ padding: '8px 10px', borderRadius: 8, border: '1px solid rgba(0,0,0,0.04)', background: '#fff', cursor: 'pointer', textAlign: 'left' }}>Share to Facebook</button>
															<button onClick={() => { try { const link = makeShareLink(svc.url, b.time); try { window.location.href = `instagram://share?text=${encodeURIComponent(link)}`; } catch { } setTimeout(() => { copyToClipboard(link); setToastMessage('Link copied — share via Instagram'); if (toastTimerRef.current) clearTimeout(toastTimerRef.current); toastTimerRef.current = setTimeout(() => setToastMessage(''), 1600); }, 600); setSharePopoverFor(null); } catch { } }} style={{ padding: '8px 10px', borderRadius: 8, border: '1px solid rgba(0,0,0,0.04)', background: '#fff', cursor: 'pointer', textAlign: 'left' }}>Share to Instagram</button>
															<div style={{ display: 'flex', gap: 8, marginTop: 6 }}>
																<button onClick={() => { try { setShowShareModal(true); setSharePopoverFor(null); } catch { } }} style={{ flex: 1, padding: '8px 10px', borderRadius: 8, background: accentColor, color: accentText, border: 'none', cursor: 'pointer' }}>More...</button>
																<button onClick={() => setSharePopoverFor(null)} style={{ padding: '8px 10px', borderRadius: 8, background: '#f3f4f6', border: 'none', cursor: 'pointer' }}>Close</button>
															</div>
														</div>
													</div>
												)}
											</div>
										);
									});
								});
							}
							// Handle "Liked" chip - show all liked videos
							if (selectedChip === 'Liked') {
								try {
									const raw = localStorage.getItem('likedVideos');
									const likedVideos = raw ? JSON.parse(raw) : [];
									if (!likedVideos || !likedVideos.length) {
										return (
											<div className="text-gray-400 text-center py-8">No liked videos yet.</div>
										);
									}
									// Render each liked video
									return likedVideos.map((likedItem) => {
										const thumb = likedItem.imageUrl || 'https://placehold.co/220x128/000000/ffffff?text=Video';
										const title = likedItem.title || 'Untitled Video';
										const creator = likedItem.creatorName || 'Unknown Creator';
										const likeKey = `liked-${likedItem.videoId}`;
										return (
											<div key={likeKey} role="button" tabIndex={0} onClick={() => {
												try {
													setShowCarbonCopy(false);
													if (likedItem.url) setVideoUrl(resolveMediaUrl(likedItem.url));
													setVideoTitle(likedItem.title || 'Video');
													setCreatorName(likedItem.creatorName || '');
													setTimeout(() => {
														try {
															const v = videoRef.current;
															if (v) {
																if (likedItem.url) v.src = resolveMediaUrl(likedItem.url);
																v.currentTime = 0;
																try { const p = v.play(); if (p && p.catch) p.catch(() => { }); setIsPlaying(true); } catch { }
																try { setControlsVisible(true); showCenterTemporarily(2000); } catch { }
															}
														} catch { }
													}, 180);
													try { setToastMessage('Now playing'); if (toastTimerRef.current) clearTimeout(toastTimerRef.current); toastTimerRef.current = setTimeout(() => setToastMessage(''), 1400); } catch { }
												} catch { }
											}} style={{ display: 'flex', gap: 12, alignItems: 'flex-start', background: '#fff', padding: 10, borderRadius: 12, border: '1px solid rgba(0,0,0,0.04)', cursor: 'pointer', position: 'relative' }}>
												<div className="w-28 h-16 rounded-md relative overflow-hidden" style={{ background: `url(${thumb}) center/cover no-repeat`, minWidth: '112px' }}>
													<div className="absolute top-1 left-1 bg-red-600 text-white text-xs px-1.5 py-0.5 rounded" style={{ fontSize: '10px' }}>♥</div>
												</div>
												<div style={{ flex: 1 }}>
													<div style={{ fontWeight: 700 }}>{title}</div>
													<div style={{ fontSize: 12, color: '#6b7280', marginTop: 6 }}>{creator}</div>
												</div>
											</div>
										);
									});
								} catch (e) {
									return <div className="text-gray-400 text-center py-8">Error loading liked videos.</div>;
								}
							}
							
							// Filter videos based on selected tab
							const tabNames = ['Recommended', 'Trending Now', 'New', 'Travel', 'Education', 'Entertainment', 'Music', 'Sports'];
							let filteredByChip = source;
							
							if (selectedChip === 'Recommended') {
								// Show all videos for Recommended
								filteredByChip = source;
							} else if (selectedChip === 'Trending Now') {
								// Trending Now - show videos sorted by views/engagement (for now show all)
								filteredByChip = source.sort((a, b) => (parseInt(b.views) || 0) - (parseInt(a.views) || 0));
							} else if (selectedChip === 'New') {
								// New - show videos sorted by timestamp (newest first)
								filteredByChip = source.sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));
							} else if (tabNames.includes(selectedChip)) {
								// For other tabs, filter by category matching the tab name
								filteredByChip = source.filter(it => {
									const category = (it.category || '').toLowerCase();
									const tabLower = selectedChip.toLowerCase();
									return category.includes(tabLower) || (it.tags && it.tags.some(t => t.toLowerCase().includes(tabLower)));
								});
								// If no matches by category, show all videos (fallback)
								if (filteredByChip.length === 0) {
									filteredByChip = source;
								}
							}
							
							const filtered = q ? filteredByChip.filter(it => (it.title || '').toLowerCase().includes(q) || (it.creator || '').toLowerCase().includes(q)) : filteredByChip;
							
							if (filtered.length === 0) {
								return (
									<div className="text-gray-400 text-center py-8">No videos found for this category.</div>
								);
							}
							
							return filtered.map((item, idx) => (
							<VideoCard
								key={item.id}
								item={item}
								onVideoClick={async () => {
									try {
										try { currentSourceRef.current = filtered || []; setCurrentIndex(idx); } catch { }
										setVideoTitle(item.title || 'Video');
										setCreatorName(item.creator || '');
										// close discover panel
										try { setShowCarbonCopy(false); } catch { }
										// set URL and attempt playback
										if (item.url) setVideoUrl(resolveMediaUrl(item.url));
										// ensure controls/center overlay reveal
										try { setControlsVisible(true); showCenterTemporarily(2600); } catch { }
										// brief feedback
										try { setToastMessage('Now playing'); if (toastTimerRef.current) clearTimeout(toastTimerRef.current); toastTimerRef.current = setTimeout(() => setToastMessage(''), 1600); } catch { }
										// try to play immediately (may be blocked by autoplay policies)
										setTimeout(async () => {
											try {
												const v = videoRef.current;
												if (v) {
													if (item.url) v.src = resolveMediaUrl(item.url);
													v.currentTime = 0;
													await v.play();
													setIsPlaying(true);
													try { showCenterTemporarily(1600); } catch { }
												}
											} catch (e) { /* autoplay may be blocked; ignore */ }
										}, 120);
									} catch { }
								}}
								setToastMessage={setToastMessage}
								toastTimerRef={toastTimerRef}
							/>
						));
						})()}
						<div style={{ height: 8 }} />
					</div>
				</div>
			</div>

            {/* Requester Feedback Modal - DISABLED */}

		</div>
	);
}

// Mock user data
const MOCK_USER = {
	id: 1,
	name: "John Doe",
	avatarUrl: "https://placehold.co/40x40/CCCCCC/666666?text=JD",
};

// Comment item component
const CommentItem = ({ comment, onReply, selectedLanguage }) => {
	const isUserComment = comment.userId === MOCK_USER.id;
	const avatarUrl = isUserComment ? MOCK_USER.avatarUrl : 'https://placehold.co/40x40/CCCCCC/666666?text=G';

	const parts = comment.text.split(' ');
	const firstWord = parts[0];
	const isReplyText = firstWord?.startsWith?.('@');
	const replyTargetName = isReplyText ? firstWord.substring(1) : null;
	const commentBody = isReplyText ? parts.slice(1).join(' ') : comment.text;

	const handleReplyClick = () => onReply(comment);

	const [liked, setLiked] = useState(false);
	const [disliked, setDisliked] = useState(false);
	const [likesCount, setLikesCount] = useState(typeof comment.likes === 'number' ? comment.likes : 0);

	const abbrev = (n) => {
		if (n >= 1000000) return `${(n / 1000000).toFixed(1).replace(/\.0$/, '')}M`;
		if (n >= 1000) return `${(n / 1000).toFixed(1).replace(/\.0$/, '')}k`;
		return String(n);
	};

	const toggleLike = () => {
		setLiked((prev) => {
			const next = !prev;
			setLikesCount((c) => Math.max(0, c + (next ? 1 : -1)));
			if (next && disliked) setDisliked(false);
			return next;
		});
	};

	const toggleDislike = () => {
		setDisliked((prev) => {
			const next = !prev;
			if (next && liked) {
				setLiked(false);
				setLikesCount((c) => Math.max(0, c - 1));
			}
			return next;
		});
	};

	return (
		<div className={`flex space-x-3 py-3 border-b border-gray-50 last:border-b-0 ${isReplyText ? 'ml-6' : ''}`}>
			<div className="flex-shrink-0">
				<img
					src={avatarUrl}
					alt={comment.userName}
					className="w-8 h-8 rounded-full object-cover"
				/>
			</div>

			<div className="flex-grow min-w-0">
				<div className="bg-gray-100 rounded-xl p-3 inline-block max-w-full">
					<p className="text-sm font-semibold text-gray-800 break-words">{comment.userName}</p>
					<p className="text-sm text-gray-700 break-words">
						{isReplyText && (
							<span className="text-indigo-600 font-medium mr-1">@{replyTargetName}</span>
						)}
						{commentBody}
					</p>
				</div>

				<div className="flex items-center space-x-3 mt-1 ml-1 text-xs text-gray-500">
					<span className="font-medium">{getTranslation('Just now', selectedLanguage)}</span>

					<div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
						<button
							onClick={toggleLike}
							aria-pressed={liked}
							className="flex items-center gap-2 transition-colors"
							style={{
								background: liked ? 'rgba(239,68,68,0.06)' : 'transparent',
								padding: '6px 8px',
								borderRadius: 12,
								cursor: 'pointer',
								border: 'none'
							}}
						>
							{liked ? <HeartIcon size={14} /> : <HeartOutline size={14} />}
							<span style={{ fontSize: 12, color: '#374151' }}>{abbrev(likesCount)}</span>
						</button>

						<button
							onClick={toggleDislike}
							aria-pressed={disliked}
							className="flex items-center transition-colors"
							style={{ background: disliked ? '#f3f4f6' : 'transparent', padding: '6px 8px', borderRadius: 12, border: 'none', cursor: 'pointer' }}
							title="Dislike"
						>
							<HeartOff size={14} />
						</button>

						<button
							onClick={handleReplyClick}
							className="hover:text-gray-700 transition-colors"
							style={{ background: 'transparent', border: 'none', padding: 6, cursor: 'pointer' }}
						>
							{getTranslation('Reply', selectedLanguage)}
						</button>
					</div>
				</div>
			</div>
		</div>
	);
};


// --- Add/modify ThumbsUp to accept stroke (used by CommentItem) ---
const ThumbsUp = ({ className = "", stroke = "#6b7280" }) => (
	<svg className={className} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={stroke} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
		<path d="M14 9V5a3 3 0 0 0-3-3L8 7v9" />
		<path d="M7 21h10a2 2 0 0 0 2-2v-6a2 2 0 0 0-2-2h-6" />
	</svg>
);

// Heart icons for comment likes (filled + outline)
const HeartIcon = ({ size = 16, color = '#ef4444' }) => (
	<svg width={size} height={size} viewBox="0 0 24 24" fill={color} stroke="none" aria-hidden="true">
		<path d="M12 21s-7.5-4.35-9.2-6.02C1.45 12.9 2 9.7 4.5 8.1 6.12 6.95 8.13 7 9 8.1c.87-1.1 2.88-1.15 4.5.0 1.83 1.15 3.05 3.07 3.7 4.0 2.2 1.6 3.05 4.8- - -" fillRule="evenodd" />
	</svg>
);

const HeartOutline = ({ size = 16, stroke = '#ef4444' }) => (
	<svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={stroke} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
		<path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 1 0-7.78 7.78L12 21.23l8.84-8.84a5.5 5.5 0 0 0 0-7.78z" />
	</svg>
);


// Comments modal component
const CommentsModal = ({ isOpen, onClose, requestId, selectedLanguage }) => {
	const modalRef = useRef(null);
	const auth = useAuth();
	const contentRef = useRef(null);
	const inputRef = useRef(null);

	// initialize height relative to viewport
	const [currentHeight, setCurrentHeight] = useState(window.innerHeight * 0.9);
	const minHeight = window.innerHeight * 0.4;
	const maxHeight = window.innerHeight * 0.95;

	const [comments, setComments] = useState([]);
	const [inputValue, setInputValue] = useState('');
	const [replyingTo, setReplyingTo] = useState(null);
	const [loadingComments, setLoadingComments] = useState(false);
	const [commentsError, setCommentsError] = useState(null);

	// Load comments from backend when modal opens or requestId changes
	useEffect(() => {
		if (!isOpen || !requestId) return;
		let cancelled = false;
		const BACKEND = (window && window.__BACKEND_URL__) || 'http://localhost:4000';
		setLoadingComments(true);
		setCommentsError(null);
		fetch(`${BACKEND}/requests/${requestId}/comments`)
			.then(async (res) => {
				const body = await res.json().catch(() => ({}));
				if (!res.ok) throw new Error(body.error || 'Failed to load comments');
				if (!cancelled) setComments(Array.isArray(body.comments) ? body.comments : []);
			})
			.catch((err) => { if (!cancelled) setCommentsError(err.message || 'Network error'); })
			.finally(() => { if (!cancelled) setLoadingComments(false); });
		return () => { cancelled = true; };
	}, [isOpen, requestId]);

	// drag state for grab handle
	const dragState = useRef({ dragging: false, startY: 0, startHeight: 0 });

	const [commentsHandleHintVisible, setCommentsHandleHintVisible] = useState(false);
	useEffect(() => {
		if (!isOpen) return;
		try {
			// Show the resize hint each time the Comments modal opens (visible briefly)
			setCommentsHandleHintVisible(true);
			const t = setTimeout(() => setCommentsHandleHintVisible(false), 3400);
			return () => clearTimeout(t);
		} catch { }
	}, [isOpen]);

	// Focus input when modal opens
	useEffect(() => {
		if (!isOpen) return;
		// small timeout so the sheet mount/animation completes before focusing
		const t = setTimeout(() => {
			try {
				inputRef.current?.focus?.();
				// ensure input is visible inside the scrollable area on smaller screens
				inputRef.current?.scrollIntoView?.({ behavior: "smooth", block: "nearest" });
			} catch { }
		}, 50);
		return () => clearTimeout(t);
	}, [isOpen]);

	const handleReply = useCallback((comment) => {
		setReplyingTo(comment);
		setInputValue(`@${comment.userName} `);
		if (inputRef.current) {
			inputRef.current.focus();
		}
	}, []);

	const handleCancelReply = useCallback(() => {
		setReplyingTo(null);
		setInputValue('');
	}, []);

	const handleSendComment = async () => {
		if (!auth.user) { auth.openAuthModal(); return; }
		if (inputValue.trim() === '') return;

		const text = inputValue.trim();
		const BACKEND = (window && window.__BACKEND_URL__) || 'http://localhost:4000';
		const token = (() => { try { return localStorage.getItem('regaarder_token'); } catch { return null; } })();

		try {
			const res = await fetch(`${BACKEND}/requests/${requestId}/comments`, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
					...(token ? { Authorization: `Bearer ${token}` } : {}),
				},
				body: JSON.stringify({ text, parentId: replyingTo ? replyingTo.id : null }),
			});
			const body = await res.json().catch(() => ({}));
			if (!res.ok) throw new Error(body.error || 'Failed to post comment');
			// backend returns created comment
			const created = body.comment || null;
			if (created) {
				setComments((prev) => [...prev, created]);
			} else {
				// fallback: construct minimal local comment object
				const fallback = {
					id: `c_${Date.now()}`,
					requestId: requestId,
					userId: auth.user.id || 'anon',
					userName: auth.user.name || 'You',
					text,
					parentId: replyingTo ? replyingTo.id : null,
					createdAt: new Date().toISOString(),
				};
				setComments((prev) => [...prev, fallback]);
			}

			setInputValue('');
			setReplyingTo(null);
			
			// Dispatch event so profile stats refresh
			try {
				window.dispatchEvent(new CustomEvent('request:comment_added', { 
					detail: { requestId, comment: created || fallback } 
				}));
			} catch (e) {
				console.warn('Failed to dispatch comment event:', e);
			}
			
			setTimeout(() => {
				try { contentRef.current?.scrollTo({ top: contentRef.current.scrollHeight, behavior: 'smooth' }); } catch { }
			}, 80);
		} catch (err) {
			// show inline error briefly
			setCommentsError(err.message || 'Network error');
			setTimeout(() => setCommentsError(null), 3000);
		}
	};

	// Pointer handlers for the grab handle -> allow vertical drag resizing
	const onHandlePointerDown = (e) => {
		e.preventDefault();
		const clientY = e.clientY ?? (e.touches && e.touches[0]?.clientY);
		dragState.current.dragging = true;
		dragState.current.startY = clientY;
		dragState.current.startHeight = currentHeight;

		// attach listeners to window for consistent behaviour
		window.addEventListener("pointermove", onHandlePointerMove);
		window.addEventListener("pointerup", onHandlePointerUp);
	};

	const onHandlePointerMove = (e) => {
		if (!dragState.current.dragging) return;
		const clientY = e.clientY ?? (e.touches && e.touches[0]?.clientY);
		if (typeof clientY !== "number") return;
		const dy = dragState.current.startY - clientY; // dragging upward increases height
		let next = dragState.current.startHeight + dy;
		next = Math.max(minHeight, Math.min(maxHeight, next));
		setCurrentHeight(next);
	};

	const onHandlePointerUp = (e) => {
		if (!dragState.current.dragging) return;
		dragState.current.dragging = false;
		// cleanup
		window.removeEventListener("pointermove", onHandlePointerMove);
		window.removeEventListener("pointerup", onHandlePointerUp);

		// optional: if user drags the sheet down almost to zero, close it
		if (currentHeight < minHeight + 20) {
			onClose();
		}
	};

	// Clean up listeners if component unmounts while dragging
	useEffect(() => {
		return () => {
			window.removeEventListener("pointermove", onHandlePointerMove);
			window.removeEventListener("pointerup", onHandlePointerUp);
		};
	}, []);

	return isOpen ? (
		<div className="fixed inset-0 z-[1200] flex items-end sm:items-center justify-center" onClick={onClose} style={{ backgroundColor: 'rgba(0,0,0,0.6)', backdropFilter: "blur(4px)", WebkitBackdropFilter: "blur(4px)", transition: "backdrop-filter 240ms ease, -webkit-backdrop-filter 240ms ease, background 240ms ease" }}>
			<div
				ref={modalRef}
				className="modal-dialog w-full max-w-md bg-white rounded-t-2xl shadow-xl overflow-hidden flex flex-col"
				style={{ height: currentHeight }}
				onClick={(e) => e.stopPropagation()}
			>
				{/* Grab handle */}
				<div className="w-full h-10 flex items-center justify-center">
					<div
						role="separator"
						aria-orientation="horizontal"
						className="w-12 h-1 bg-gray-300 rounded-full touch-none"
						onPointerDown={onHandlePointerDown}
						onTouchStart={onHandlePointerDown}
						style={{ cursor: "ns-resize" }}
					/>
				</div>
				{commentsHandleHintVisible && (
					<div className="absolute top-3 right-4 bg-black/70 text-white text-xs px-3 py-1 rounded">{getTranslation('Drag to resize', selectedLanguage)}</div>
				)}

				{/* Header: comment icon + single title "Comments" */}
				<div className="px-4 py-3 border-b border-gray-200">
					<div className="flex items-center justify-between">
						<div className="flex items-center gap-3">
							<div className="w-8 h-8 rounded-full bg-[#f3f4f6] flex items-center justify-center">
								<CommentIcon size={16} stroke="#6b7280" />
							</div>
							<h2 className="text-lg font-medium text-gray-800">{getTranslation('Comments', selectedLanguage)}</h2>
						</div>
					</div>
				</div>

				{/* Comments list — when empty show large icon & centered messages */}
				<div ref={contentRef} className="flex-1 overflow-y-auto px-4 py-3 flex">
					{comments.length === 0 ? (
						<div className="flex-1 flex flex-col items-center justify-center text-center text-gray-500">
							<CommentIconLarge />
							<p className="mt-6 text-lg font-medium text-gray-700">{getTranslation('No comments yet', selectedLanguage)}</p>
							<p className="mt-2 text-sm text-gray-500">{getTranslation('Be the first to share your thoughts!', selectedLanguage)}</p>
						</div>
					) : (
						<div className="w-full">
							{comments.map(comment => (
								<CommentItem
									key={comment.id}
									comment={comment}
									onReply={handleReply}
									selectedLanguage={selectedLanguage}
								/>
							))}
						</div>
					)}
				</div>

				{/* Input area — sticky to bottom so it always sits at the bottom of the sheet */}
				<div className="px-4 py-3 border-t border-gray-200 bg-white sticky bottom-0" style={{ zIndex: 30 }}>
					{replyingTo && (
						<div className="flex items-center justify-between text-sm text-gray-500 mb-2">
							<span>{getTranslation('Replying to', selectedLanguage)} @{replyingTo.userName}</span>
							<button onClick={handleCancelReply} className="text-indigo-600 hover:underline">
								{getTranslation('Cancel', selectedLanguage)}
							</button>
						</div>
					)}
					<div className="flex items-center space-x-3">
						<input
							name="commentText"
							ref={inputRef}
							value={inputValue}
							onChange={(e) => setInputValue(e.target.value)}
							onKeyDown={(e) => {
								if (e.key === "Enter" && !e.shiftKey) {
									e.preventDefault();
									handleSendComment();
								}
							}}
							placeholder={getTranslation('Add a comment... (use @ to mention)', selectedLanguage)}
							className="flex-1 bg-gray-100 border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-800 outline-none focus:outline-none focus:ring-1 focus:ring-gray-300 focus:border-gray-300"
						/>
						<button
							onClick={handleSendComment}
							className="w-10 h-10 rounded-full bg-indigo-600 flex items-center justify-center shadow-md"
							aria-label="Send comment"
						>
							<SendIcon />
						</button>
					</div>
				</div>
			</div>
		</div>
	) : null;
};

// Add small Comment + Send icons used by the modal header / empty state / send button
const CommentIcon = ({ size = 20, stroke = "#9CA3AF" }) => (
	<svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={stroke} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
		<path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
	</svg>
);
const CommentIconLarge = ({ size = 96, stroke = "#E5E7EB" }) => (
	<svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={stroke} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
		<path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
	</svg>
);
const SendIcon = ({ size = 18, color = "#fff" }) => (
	<svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
		<path d="M22 2L11 13" />
		<path d="M22 2l-7 20  -2-7-7-2 20-11z" />
	</svg>
);
