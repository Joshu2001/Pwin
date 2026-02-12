/* eslint-disable no-empty, no-unused-vars, no-undef */
import React, { useState, useRef, useEffect, useCallback } from 'react';
import ReactDOM from 'react-dom';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from './AuthContext.jsx';
import { PlayerContext } from './PlayerProvider.jsx';
import * as eventBus from './eventbus.js';
import Videoplayer from './Videoplayer.jsx';
import StaffLoginModal from './StaffLoginModal.jsx';
import SharedBottomBar from './components/SharedBottomBar.jsx';
import { LanguageSelector, RoleSelectionModal, UserWelcomeModal, CreatorWelcomeModal } from './components/FirstTimeUserWelcome.jsx';
import { useLanguage } from './LanguageContext.jsx';
import { Capacitor } from '@capacitor/core';
// Updated Lucide imports: Added Video, Sparkles, Pin, Bookmark, Info, EyeOff, Flag, LifeBuoy for support
import { X, Menu, Bell, Settings, Search, Star, TrendingUp, Trophy, Home, FileText, Lightbulb, MoreHorizontal, MoreVertical, Heart, ThumbsDown, HeartOff, Eye, MessageSquare, Share, Share2, Palette, Shield, Globe, Gift, DollarSign, Users, Monitor, BookOpen, History, Scissors, Zap, CreditCard, Crown, Tag, User, Folder, Shuffle, Camera, Pencil, ShoppingBag, Video, Sparkles, Pin, Bookmark, Info, EyeOff, Flag, Check, AlertCircle, AlertTriangle, Sun, Moon, ChevronDown, ChevronLeft, ChevronRight, ListPlus, Music, Clock, Dumbbell, LifeBuoy } from 'lucide-react';
import { useTheme } from './ThemeContext.jsx';
import { getTranslation } from './translations.js';
import { WEB_URL } from './config.js';
import { resolveMediaUrl } from './utils/media.js';

// Inject global CSS for smooth videoplayer transitions
if (typeof document !== 'undefined') {
    const styleId = 'videoplayer-transitions';
    if (!document.getElementById(styleId)) {
        const style = document.createElement('style');
        style.id = styleId;
        style.textContent = `
            @keyframes fadeInVideoplayer {
                from {
                    opacity: 0;
                }
                to {
                    opacity: 1;
                }
            }
            
            @keyframes fadeOutVideoplayer {
                from {
                    opacity: 1;
                }
                to {
                    opacity: 0;
                }
            }
            
            .fullscreen-videoplayer-entering {
                animation: fadeInVideoplayer 0.3s ease-in-out forwards;
            }
            
            .fullscreen-videoplayer-exiting {
                animation: fadeOutVideoplayer 0.3s ease-in-out forwards;
            }
        `;
        document.head.appendChild(style);
    }
}
// DollarSign is kept in the import list but no longer actively mapped in the Icon component
// Utility style for clamping long titles to 2 lines when Tailwind line-clamp plugin isn't available
const clamp2 = {
    display: '-webkit-box',
    WebkitLineClamp: 2,
    WebkitBoxOrient: 'vertical',
    overflow: 'hidden'
};

// Prevent white flash during video navigation/open
const showVideoLaunchMask = () => {
    try {
        if (typeof document === 'undefined') return;
        // Force-remove any existing mask first (prevents stale masks from blocking taps)
        try { const existing = document.getElementById('vp-launch-mask'); if (existing) existing.remove(); } catch {}
        const mask = document.createElement('div');
        mask.id = 'vp-launch-mask';
        mask.style.position = 'fixed';
        mask.style.inset = '0';
        mask.style.background = '#000';
        mask.style.zIndex = '99999';
        mask.style.transition = 'opacity 300ms ease';
        mask.style.opacity = '1';
        mask.style.pointerEvents = 'none'; // CRITICAL: Don't block taps while mask is visible
        document.body.appendChild(mask);
        // Auto-remove mask after player has time to render
        setTimeout(() => {
            try {
                const m = document.getElementById('vp-launch-mask');
                if (m) {
                    m.style.opacity = '0';
                    setTimeout(() => { try { m.remove(); } catch {} }, 350);
                }
            } catch {}
        }, 400);
        // SAFETY NET: Hard-remove after 2 seconds no matter what
        setTimeout(() => {
            try { const m = document.getElementById('vp-launch-mask'); if (m) m.remove(); } catch {}
        }, 2000);
    } catch (e) { }
};

const ImmersiveMode = (Capacitor && Capacitor.Plugins) ? Capacitor.Plugins.ImmersiveMode : null;
const SystemBars = (Capacitor && Capacitor.Plugins) ? Capacitor.Plugins.SystemBars : null;

// Helper to generate placeholder avatar showing a flag derived from name initials
const getPlaceholderAvatar = (name) => {
    const initials = (name || 'U').split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2);
    const normalized = initials.padEnd(2, 'U').substring(0, 2);
    const A_CODE = 'A'.charCodeAt(0);
    if (/^[A-Z]{2}$/.test(normalized)) {
        const hexes = Array.from(normalized).map(ch => {
            const cp = 0x1F1E6 + (ch.charCodeAt(0) - A_CODE);
            return cp.toString(16);
        }).join('-');
        // Twemoji PNG for colored flags
        return `https://twemoji.maxcdn.com/v/latest/72x72/${hexes}.png`;
    }
    // Fallback: small colored circle with globe emoji as SVG data URL
    const colors = ['f87171', '34d399', 'a78bfa', '60a5fa', 'fbbf24', 'ec4899', 'fb923c', '4ade80'];
    const colorIndex = (name || '') ? (String(name).charCodeAt(0) % colors.length) : 0;
    const svg = `<svg xmlns='http://www.w3.org/2000/svg' width='40' height='40'><rect width='40' height='40' fill='#${colors[colorIndex]}' rx='20' ry='20' /><text x='50%' y='50%' dominant-baseline='middle' text-anchor='middle' font-size='18' font-family='Segoe UI Emoji, Noto Color Emoji, Apple Color Emoji, sans-serif'>🌐</text></svg>`;
    return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
};

// --- Utility Components ---

// CUSTOM ICON: Languages (Replaces Lucide Globe)
const LanguagesCustomIcon = ({ className = '', size = 24, style = {} }) => (
    <svg
        xmlns="http://www.w3.org/2000/svg"
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className={className}
        style={style}
    >
        <path d="m5 8 6 6" />
        <path d="m4 14 6-6 2-3" />
        <path d="M2 5h12" />
        <path d="M7 2h1" />
        <path d="m22 22-5-10-5 10" />
        <path d="M14 18h6" />
    </svg>
);

// CUSTOM ICON: Activity (Replaces TrendingUp for 'Track Requests')
const ActivityCustomIcon = ({ className = '', size = 24, style = {} }) => (
    <svg
        xmlns="http://www.w3.org/2000/svg"
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className={className}
        style={style}
    >
        <path d="M22 12h-2.48a2 2 0 0 0-1.93 1.46l-2.35 8.36a.25.25 0 0 1-.48 0L9.24 2.18a.25.25 0 0 0-.48 0l-2.35 8.36A2 2 0 0 1 4.49 12H2" />
    </svg>
);

// CUSTOM ICON: Filled Heart (uses currentColor for fill)
const HeartFilled = ({ className = '', size = 20, style = {} }) => (
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="currentColor" className={className} style={style}>
        <path d="M12 21s-7.5-4.873-10-8.047C-0.1 8.98 4.12 4 8.5 6.5 10.7 7.9 12 10 12 10s1.3-2.1 3.5-3.5C19.88 4 24.1 8.98 22 12.953 19.5 16.127 12 21 12 21z" />
    </svg>
);


// Component for rendering Lucide icons by string name
const Icon = ({ name, size = 20, className = '', ...props }) => {
    const IconMap = {
        menu: Menu,
        bell: Bell,
        settings: Settings,
        search: Search,
        star: Star,
        chart: TrendingUp,
        cup: Trophy,
        home: Home,
        requests: FileText,
        ideas: Lightbulb,
        more: MoreHorizontal,
        moreVertical: MoreVertical,
        x: X,
        heart: Heart,
        thumbsDown: ThumbsDown,
        heartOff: HeartOff,
        heartFilled: HeartFilled,
        eye: Eye,
        message: MessageSquare,
        share: Share2,
        alertCircle: AlertCircle,
        alertTriangle: AlertTriangle,
        trendingUp: TrendingUp,
        pencil: Pencil,

        // --- Drawer Icons (Refined) ---
        profile: User,
        track: ActivityCustomIcon,
        subscriptions: CreditCard,
        referral: Gift,
        marketplace: ShoppingBag,
        bookmarks: BookOpen,
        history: History,
        editor: Scissors,
        creator: Camera,
        premium: Crown,
        language: LanguagesCustomIcon,
        theme: Palette,
        policies: Shield,
        shield: Shield,
        'dollar-sign': DollarSign,
        users: Users,
        folder: Folder,
        listPlus: ListPlus,
        zap: Zap,
        camera: Camera,
        crown: Crown,
        video: Video,
        sparkles: Sparkles,
        pin: Pin,
        bookmark: Bookmark,
        info: Info,
        eyeOff: EyeOff,
        flag: Flag,
        sun: Sun,
        moon: Moon,
        monitor: Monitor,
        check: Check,
        palette: Palette,
        chevronDown: ChevronDown,
        chevronLeft: ChevronLeft,
        chevronRight: ChevronRight,
        music: Music,
        clock: Clock,
        dumbbell: Dumbbell,
        globe: Globe,
        book: BookOpen,
        film: Video,
        tag: Tag,
    };
    const Component = IconMap[name];
    if (!Component) return null;
    return <Component size={size} className={className} {...props} />;
};

// --- Dialog Components ---

const DialogItem = ({ iconName, label, color = 'text-gray-800', onClick }) => (
    <button
        className="flex items-center w-full px-4 py-3 hover:bg-gray-50 transition duration-150"
        onClick={onClick}
    >
        <Icon
            name={iconName} // Fixed: Ensure iconName is passed to the Icon component
            size={20}
            className={`mr-4 ${color}`}
        />
        <span className={`text-base font-normal ${color}`}>{label}</span>
    </button>
);

const MoreActionsDialog = ({ position = null, onClose, onReportClick, onPinClick, onBookmarkClick, isBookmarked = false, isPinned = false, pinnedDays = null, onUnpinClick, onShareClick, onNotInterestedClick, onViewRequestClick, onAddToPlaylistClick, selectedLanguage = 'English' }) => {
    // Determine label for pin/unpin
    const pinLabel = isPinned ? `${getTranslation('Unpin', selectedLanguage)}${pinnedDays ? ` (${pinnedDays}${getTranslation('d left', selectedLanguage)})` : ''}` : getTranslation('Pin to top', selectedLanguage);
    const bookmarkLabel = isBookmarked ? getTranslation('Bookmarked', selectedLanguage) : getTranslation('Bookmark', selectedLanguage);

    const actions = [
        { icon: 'share', label: getTranslation('Share video', selectedLanguage), color: 'text-gray-800', action: onShareClick },
        { icon: 'pin', label: pinLabel, color: 'text-gray-800', action: isPinned ? onUnpinClick : onPinClick },
        { icon: 'bookmark', label: bookmarkLabel, color: isBookmarked ? 'text-gray-500' : 'text-gray-800', action: onBookmarkClick, isBookmark: true },
        { icon: 'listPlus', label: getTranslation('Add to playlist', selectedLanguage), color: 'text-gray-800', action: onAddToPlaylistClick },
        { icon: 'info', label: getTranslation('View request details', selectedLanguage), color: 'text-gray-800', action: onViewRequestClick },
    ];

    const destructiveActions = [
        { icon: 'eyeOff', label: getTranslation('Not interested', selectedLanguage), color: 'text-gray-800', action: onNotInterestedClick },
        { icon: 'flag', label: getTranslation('Report video', selectedLanguage), color: 'text-red-500', action: onReportClick },
    ];

    const handleActionClick = (action) => {
        action && action();
        onClose();
    };

    return (
        <div
            className="fixed inset-0 z-[9999] flex items-end justify-center px-4 pb-16"
            style={{ backgroundColor: 'rgba(0,0,0,0.6)' }}
            onClick={onClose}
        >
            <div
                className="more-actions-dialog bg-white rounded-2xl w-full max-w-md shadow-2xl overflow-hidden animate-slide-up"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
                    <h3 className="text-lg font-semibold text-gray-900">{getTranslation('Video Options', selectedLanguage)}</h3>
                </div>

                {/* Scrollable content */}
                <div className="max-h-[60vh] overflow-y-auto">
                    {actions.map((item, index) => (
                        <button
                            key={index}
                            className="flex items-center w-full px-4 py-3 hover:bg-gray-50 transition duration-150"
                            onClick={() => handleActionClick(item.action)}
                        >
                            {item.isBookmark && item.icon === 'bookmark' && isBookmarked ? (
                                <Icon name="bookmark" size={20} className="mr-4 text-gray-500" />
                            ) : (
                                <Icon name={item.icon} size={20} className={`mr-4 ${item.color}`} />
                            )}
                            <span className={`text-base font-normal ${item.color}`}>{item.label}</span>
                        </button>
                    ))}

                    <div className="h-px bg-gray-200 my-1 mx-4"></div>

                    {destructiveActions.map((item, index) => (
                        <button
                            key={index}
                            className="flex items-center w-full px-4 py-3 hover:bg-gray-50 transition duration-150"
                            onClick={() => handleActionClick(item.action)}
                        >
                            <Icon name={item.icon} size={20} className={`mr-4 ${item.color}`} />
                            <span className={`text-base font-normal ${item.color}`}>{item.label}</span>
                        </button>
                    ))}
                </div>
            </div>

            <style>{`
                @keyframes slide-up {
                    from {
                        opacity: 0;
                        transform: translateY(100%);
                    }
                    to {
                        opacity: 1;
                        transform: translateY(0);
                    }
                }
                .animate-slide-up {
                    animation: slide-up 0.3s ease-out;
                }
            `}</style>
        </div>
    );
};

// NEW COMPONENT: Share Dialog (styled to match app)
const ShareDialog = ({ onClose, link, onCopySuccess, selectedLanguage = 'English' }) => {
    const [isCopied, setIsCopied] = useState(false);
    const shareLink = link || window.location.href;

    const copyLink = async () => {
        const handleSuccess = () => {
            setIsCopied(true);
            if (onCopySuccess) onCopySuccess();
            // Reset after 2 seconds
            setTimeout(() => setIsCopied(false), 2000);
        };

        try {
            // Try modern API first
            if (navigator.clipboard && navigator.clipboard.writeText) {
                await navigator.clipboard.writeText(shareLink);
                handleSuccess();
            } else {
                throw new Error('Clipboard API unavailable');
            }
        } catch (e) {
            console.warn('Clipboard API failed, trying fallback', e);
            // Fallback for older browsers or restricted environments
            try {
                const textArea = document.createElement("textarea");
                textArea.value = shareLink;

                // Ensure it's not visible but part of DOM
                textArea.style.position = "fixed";
                textArea.style.left = "-9999px";
                textArea.style.top = "0";

                document.body.appendChild(textArea);
                textArea.focus();
                textArea.select();

                const successful = document.execCommand('copy');
                document.body.removeChild(textArea);

                if (successful) {
                    handleSuccess();
                } else {
                    console.error('Fallback copy failed');
                }
            } catch (err) {
                console.error('All copy methods failed', err);
            }
        }
    };

    // Try to open a native app using a deep link, then fallback to the web URL
    const openSocial = (appUrl, webUrl) => {
        // Give a quick haptic tick if available
        try {
            if (navigator.vibrate) navigator.vibrate(10);
        } catch (e) { }

        // Attempt to open the app via location change. If the app isn't installed,
        // the fallback will open the web URL after a short delay.
        const now = Date.now();
        let didOpen = false;

        // Listen for page visibility change as a heuristic that the app opened
        const visibilityHandler = () => {
            didOpen = true;
        };
        document.addEventListener('visibilitychange', visibilityHandler);

        // Try to navigate to the app scheme
        try {
            window.location.href = appUrl;
        } catch (e) {
            // Some browsers block setting href to unknown schemes; ignore
        }

        // After 700ms, if we didn't open the app, open the web fallback in a new tab
        setTimeout(() => {
            document.removeEventListener('visibilitychange', visibilityHandler);
            if (!didOpen) {
                try {
                    window.open(webUrl, '_blank');
                } catch (e) {
                    window.location.href = webUrl;
                }
            }
            // Close the modal regardless
            onClose();
        }, 700);
    };

    const SocialButton = ({ svg, label, onClick }) => {
        const [active, setActive] = useState(false);

        const handlePress = (e) => {
            e.preventDefault();
            // short visual "pressed" state
            setActive(true);
            try {
                if (navigator.vibrate) navigator.vibrate(10);
            } catch (e) { }
            // call the provided onClick (which should call openSocial)
            onClick && onClick();
            // release visual after a short delay so the user sees feedback
            setTimeout(() => setActive(false), 350);
        };

        return (
            <button
                onClick={handlePress}
                onKeyDown={(e) => { if (e.key === 'Enter') handlePress(e); }}
                className={`flex flex-col items-center justify-center w-24 h-24 bg-transparent border border-transparent rounded-lg transition-transform duration-150 ${active ? 'transform scale-95 bg-gray-100 shadow-sm' : 'hover:bg-gray-50'}`}
                aria-label={`Share to ${label}`}
            >
                <div className="w-10 h-10 mb-2" dangerouslySetInnerHTML={{ __html: svg }} />
                <div className="text-xs text-gray-700">{label}</div>
            </button>
        );
    };

    // Simple brand SVGs (monochrome) to match app style
    const IG = '<svg role="img" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><title>Instagram</title><path d="M7.0301.084c-1.2768.0602-2.1487.264-2.911.5634-.7888.3075-1.4575.72-2.1228 1.3877-.6652.6677-1.075 1.3368-1.3802 2.127-.2954.7638-.4956 1.6365-.552 2.914-.0564 1.2775-.0689 1.6882-.0626 4.947.0062 3.2586.0206 3.6671.0825 4.9473.061 1.2765.264 2.1482.5635 2.9107.308.7889.72 1.4573 1.388 2.1228.6679.6655 1.3365 1.0743 2.1285 1.38.7632.295 1.6361.4961 2.9134.552 1.2773.056 1.6884.069 4.9462.0627 3.2578-.0062 3.668-.0207 4.9478-.0814 1.28-.0607 2.147-.2652 2.9098-.5633.7889-.3086 1.4578-.72 2.1228-1.3881.665-.6682 1.0745-1.3378 1.3795-2.1284.2957-.7632.4966-1.636.552-2.9124.056-1.2809.0692-1.6898.063-4.948-.0063-3.2583-.021-3.6668-.0817-4.9465-.0607-1.2797-.264-2.1487-.5633-2.9117-.3084-.7889-.72-1.4568-1.3876-2.1228C21.2982 1.33 20.628.9208 19.8378.6165 19.074.321 18.2017.1197 16.9244.0645 15.6471.0093 15.236-.005 11.977.0014 8.718.0076 8.31.0215 7.0301.0839m.1402 21.6932c-1.17-.0509-1.8053-.2453-2.2287-.408-.5606-.216-.96-.4771-1.3819-.895-.422-.4178-.6811-.8186-.9-1.378-.1644-.4234-.3624-1.058-.4171-2.228-.0595-1.2645-.072-1.6442-.079-4.848-.007-3.2037.0053-3.583.0607-4.848.05-1.169.2456-1.805.408-2.2282.216-.5613.4762-.96.895-1.3816.4188-.4217.8184-.6814 1.3783-.9003.423-.1651 1.0575-.3614 2.227-.4171 1.2655-.06 1.6447-.072 4.848-.079 3.2033-.007 3.5835.005 4.8495.0608 1.169.0508 1.8053.2445 2.228.408.5608.216.96.4754 1.3816.895.4217.4194.6816.8176.9005 1.3787.1653.4217.3617 1.056.4169 2.2263.0602 1.2655.0739 1.645.0796 4.848.0058 3.203-.0055 3.5834-.061 4.848-.051 1.17-.245 1.8055-.408 2.2294-.216.5604-.4763.96-.8954 1.3814-.419.4215-.8181.6811-1.3783.9-.4224.1649-1.0577.3617-2.2262.4174-1.2656.0595-1.6448.072-4.8493.079-3.2045.007-3.5825-.006-4.848-.0608M16.953 5.5864A1.44 1.44 0 1 0 18.39 4.144a1.44 1.44 0 0 0-1.437 1.4424M5.8385 12.012c.0067 3.4032 2.7706 6.1557 6.173 6.1493 3.4026-.0065 6.157-2.7701 6.1506-6.1733-.0065-3.4032-2.771-6.1565-6.174-6.1498-3.403.0067-6.156 2.771-6.1496 6.1738M8 12.0077a4 4 0 1 1 4.008 3.9921A3.9996 3.9996 0 0 1 8 12.0077"/></svg>';
    // Replaced WhatsApp icon with the provided SVG
    const WA = '<svg role="img" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><title>WhatsApp</title><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/></svg>';
    const LI = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"><path d="M4.98 3.5A2.5 2.5 0 1 0 4.98 8.5 2.5 2.5 0 0 0 4.98 3.5zM3 9h4v12H3zM10 9h3.75v1.7h.05c.52-.99 1.8-2.03 3.7-2.03C21.3 8.67 22 10.6 22 13.8V21H18v-6.5c0-1.6-.03-3.7-2.25-3.7-2.25 0-2.6 1.76-2.6 3.6V21H10z"/></svg>';
    const FB = '<svg role="img" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><title>Facebook</title><path d="M9.101 23.691v-7.98H6.627v-3.667h2.474v-1.58c0-4.085 1.848-5.978 5.858-5.978.401 0 .955.042 1.468.103a8.68 8.68 0 0 1 1.141.195v3.325a8.623 8.623 0 0 0-.653-.036 26.805 26.805 0 0 0-.733-.009c-.707 0-1.259.096-1.675.309a1.686 1.686 0 0 0-.679.622c-.258.42-.374.995-.374 1.752v1.297h3.919l-.386 2.103-.287 1.564h-3.246v8.245C19.396 23.238 24 18.179 24 12.044c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.628 3.874 10.35 9.101 11.647Z"/></svg>';
    const XCOM = '<svg role="img" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><title>X</title><path d="M14.234 10.162 22.977 0h-2.072l-7.591 8.824L7.251 0H.258l9.168 13.343L.258 24H2.33l8.016-9.318L16.749 24h6.993zm-2.837 3.299-.929-1.329L3.076 1.56h3.182l5.965 8.532.929 1.329 7.754 11.09h-3.182z"/></svg>';
    const MS = '<svg role="img" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><title>Messenger</title><path d="M12 0C5.24 0 0 4.952 0 11.64c0 3.499 1.434 6.521 3.769 8.61a.96.96 0 0 1 .323.683l.065 2.135a.96.96 0 0 0 1.347.85l2.381-1.053a.96.96 0 0 1 .641-.046A13 13 0 0 0 12 23.28c6.76 0 12-4.952 12-11.64S18.76 0 12 0m6.806 7.44c.522-.03.971.567.63 1.094l-4.178 6.457a.707.707 0 0 1-.977.208l-3.87-2.504a.44.44 0 0 0-.49.007l-4.363 3.01c-.637.438-1.415-.317-.995-.966l4.179-6.457a.706.706 0 0 1 .977-.21l3.87 2.505c.15.097.344.094.491-.007l4.362-3.008a.7.7 0 0 1 .364-.13"/></svg>';

    return (
        <div className="fixed inset-0 z-[999] flex items-center justify-center px-4" style={{ backgroundColor: 'rgba(0,0,0,0.6)' }} onClick={onClose}>
            <div className="bg-white rounded-xl w-full max-w-md p-6" onClick={(e) => e.stopPropagation()}>
                <div className="flex items-center justify-between mb-4">
                    <h3 className="text-xl font-semibold">{getTranslation('Share', selectedLanguage)}</h3>
                    <button onClick={onClose} className="p-2 text-gray-500"><Icon name="x" size={20} /></button>
                </div>

                <div className="grid grid-cols-3 gap-4 justify-items-center mb-4">
                    {/* Instagram: app deep-link fallback to web profile */}
                    <SocialButton
                        svg={IG}
                        label={getTranslation("Instagram", selectedLanguage)}
                        onClick={() => openSocial(
                            `instagram://share?text=${encodeURIComponent(shareLink)}`,
                            `https://instagram.com/`
                        )}
                    />

                    {/* WhatsApp: open app with text, fallback to wa.me */}
                    <SocialButton
                        svg={WA}
                        label={getTranslation("WhatsApp", selectedLanguage)}
                        onClick={() => openSocial(
                            `whatsapp://send?text=${encodeURIComponent(shareLink)}`,
                            `https://wa.me/?text=${encodeURIComponent(shareLink)}`
                        )}
                    />

                    {/* LinkedIn: app deep-link then web share */}
                    <SocialButton
                        svg={LI}
                        label={getTranslation("LinkedIn", selectedLanguage)}
                        onClick={() => openSocial(
                            `linkedin://shareArticle?mini=true&url=${encodeURIComponent(shareLink)}`,
                            `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareLink)}`
                        )}
                    />

                    {/* Facebook: try app then web share dialog */}
                    <SocialButton
                        svg={FB}
                        label={getTranslation("Facebook", selectedLanguage)}
                        onClick={() => openSocial(
                            `fb://facewebmodal/f?href=${encodeURIComponent(shareLink)}`,
                            `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareLink)}`
                        )}
                    />

                    {/* X/Twitter: try app, fallback to web intent */}
                    <SocialButton
                        svg={XCOM}
                        label="X.com"
                        onClick={() => openSocial(
                            `twitter://post?message=${encodeURIComponent(shareLink)}`,
                            `https://twitter.com/intent/tweet?url=${encodeURIComponent(shareLink)}`
                        )}
                    />

                    {/* Messenger: try app then open web messenger */}
                    <SocialButton
                        svg={MS}
                        label={getTranslation("Messenger", selectedLanguage)}
                        onClick={() => openSocial(
                            `fb-messenger://share?link=${encodeURIComponent(shareLink)}`,
                            `https://www.messenger.com/`
                        )}
                    />
                </div>

                <button
                    onClick={copyLink}
                    className={`w-full py-3 rounded-lg border font-semibold transition-all duration-200 ${isCopied ? 'bg-green-50 border-green-200 text-green-700' : 'bg-gray-100 border-gray-200 text-gray-800'}`}
                >
                    {isCopied ? getTranslation('Link Copied', selectedLanguage) : getTranslation('Copy Link', selectedLanguage)}
                </button>
            </div>
        </div>
    );
};

// NEW COMPONENT: Language Selection Dialog
const LanguageDialog = ({ onClose, selectedLanguage, onSelectLanguage }) => {
    // Helper to get Twemoji flag URL
    const getFlagUrl = (countryCode) => {
        const codePoints = countryCode
            .toUpperCase()
            .split('')
            .map(char => 127397 + char.charCodeAt(0));
        return `https://twemoji.maxcdn.com/v/latest/72x72/${codePoints.map(c => c.toString(16)).join('-')}.png`;
    };

    const languages = [
        { code: 'English', flagUrl: getFlagUrl('US'), displayName: 'English' },
        { code: 'Chinese Traditional', flagUrl: getFlagUrl('TW'), displayName: '繁體中文' },
        { code: 'Vietnamese', flagUrl: getFlagUrl('VN'), displayName: 'Tiếng Việt' },
        { code: 'Filipino', flagUrl: getFlagUrl('PH'), displayName: 'Filipino' },
        { code: 'Español', flagUrl: getFlagUrl('MX'), displayName: 'Español' },
        { code: 'Estonian', flagUrl: getFlagUrl('EE'), displayName: 'Eesti' },
    ];

    // Use portal to render outside of any parent transforms/z-index contexts
    return ReactDOM.createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center px-4" style={{ backgroundColor: 'rgba(0,0,0,0.6)' }} onClick={onClose}>
            <div className="bg-white rounded-2xl w-full max-w-md p-6" onClick={(e) => e.stopPropagation()}>
                <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center">
                        <Icon name="language" size={22} className="mr-3" style={{ color: 'var(--color-gold)' }} />
                        <div>
                            <h3 className="text-xl font-semibold text-gray-900">{getTranslation('Choose Your Language', selectedLanguage)}</h3>
                            <div className="text-sm text-gray-600">{getTranslation('Select your preferred language for the app', selectedLanguage)}</div>
                        </div>
                    </div>
                </div>

                {/* Scrollable content area to match ThemeDialog size */}
                <div className="mt-4">
                    <div className="max-h-[60vh] overflow-y-auto space-y-3 pr-2">
                        {languages.map((lang) => {
                            const isSelected = selectedLanguage === lang.code;
                            return (
                                <button
                                    key={lang.code}
                                    onClick={() => onSelectLanguage(lang.code)}
                                    className={`w-full flex items-center justify-between p-4 rounded-lg transition-colors ${isSelected ? 'text-white' : 'bg-white hover:bg-gray-50'}`}
                                    style={isSelected ? { backgroundColor: 'var(--color-gold)' } : { border: '1px solid #F3F4F6' }}
                                >
                                    <div className="flex items-center">
                                        <div className="mr-4 flex-shrink-0">
                                            <img src={lang.flagUrl} alt={lang.displayName} className="w-8 h-8 object-contain" />
                                        </div>
                                        <div className="text-base font-medium text-left">{getTranslation(lang.code, selectedLanguage)}</div>
                                    </div>
                                    {isSelected && <Icon name="check" size={20} className="text-white" />}
                                </button>
                            );
                        })}
                    </div>

                    <div className="mt-6">
                        <button onClick={onClose} className="w-full py-3 rounded-lg bg-gray-100 text-gray-700 font-semibold">{getTranslation('Close', selectedLanguage)}</button>
                    </div>
                </div>
            </div>
        </div>,
        document.body
    );
};

// NEW COMPONENT: Creator Onboarding Dialog (updated — validation + step 2 feature cards)
const CreatorOnboardingDialog = ({ onClose, selectedLanguage = 'English' }) => {
    const TOTAL_STEPS = 7;
    const [step, setStep] = useState(1);
    const [completedSteps, setCompletedSteps] = useState(() => ({}));
    const [name, setName] = useState('');
    const [bio, setBio] = useState('');
    const [photo, setPhoto] = useState(null);
    const [photoFile, setPhotoFile] = useState(null);
    const [showError, setShowError] = useState(false);
    // Show inline agreement-required toast when TOS/Privacy not accepted on step 6
    const [showAgreementError, setShowAgreementError] = useState(false);
    const fileRef = useRef(null);

    // Step 5 state: intro video + social verification
    const [introUrl, setIntroUrl] = useState('');
    const [socialUrl, setSocialUrl] = useState('');
    const [has1kFollowers, setHas1kFollowers] = useState(false);
    const [isAmbassador, setIsAmbassador] = useState(false);

    // Step 6 state: policy agreements
    const [agreedTOS, setAgreedTOS] = useState(false);
    const [agreedPrivacy, setAgreedPrivacy] = useState(false);

    // Refs for fields we want to guide users to
    const nameRef = useRef(null);
    const bioRef = useRef(null);
    const introRef = useRef(null);
    const socialRef = useRef(null);
    const introFileRef = useRef(null);
    const introObjectUrlRef = useRef(null);
    const [introFile, setIntroFile] = useState(null);
    const [introObjectUrl, setIntroObjectUrl] = useState(null);
    const [showIntroError, setShowIntroError] = useState(false);
    const [uploadingIntro, setUploadingIntro] = useState(false);
    const auth = useAuth();
    const BACKEND = (window && window.__BACKEND_URL__) || 'https://regaarder-pwin.onrender.com';

    const features = [
        {
            id: 'paid',
            icon: 'dollar-sign',
            title: getTranslation('Get Paid Every 15 Days', selectedLanguage),
            desc: getTranslation('Bi-weekly payouts. Withdraw anytime. No minimum threshold.', selectedLanguage)
        },
        {
            id: 'demand',
            icon: 'users',
            title: getTranslation('Create What People Want', selectedLanguage),
            desc: getTranslation('Get paid to create videos your audience is actively requesting. No guessing.', selectedLanguage)
        },
        {
            id: 'support',
            icon: 'shield',
            title: getTranslation('Full Support System', selectedLanguage),
            desc: getTranslation('Get help with editing, scripting, thumbnails, and everything in between.', selectedLanguage)
        },
        {
            id: 'growth',
            icon: 'trendingUp',
            title: getTranslation('Grow Your Revenue', selectedLanguage),
            desc: getTranslation('Earn 1% more per creator you invite. Stack up to 80% revenue share!', selectedLanguage)
        }
    ];

    // Values for Step 3 (Our Values)
    const values = [
        { id: 'quality', title: getTranslation('Quality Over Quantity', selectedLanguage), desc: getTranslation('We value high-quality, well-researched content. Take your time to create something amazing.', selectedLanguage), icon: 'sparkles' },
        { id: 'deliver', title: getTranslation('Deliver More Than Expected', selectedLanguage), desc: getTranslation("User satisfaction is our aim. Exceed expectations and build lasting connections.", selectedLanguage), icon: 'heart' },
        { id: 'respect', title: getTranslation('Respect Short Attention Spans', selectedLanguage), desc: getTranslation('Deliver value quickly. Hook viewers in the first 10 seconds. Make every second count.', selectedLanguage), icon: 'zap' },
        { id: 'tailored', title: getTranslation('Tailored Experiences', selectedLanguage), desc: getTranslation('Every video is personalized to the requester. Make them feel special.', selectedLanguage), icon: 'video' },
        { id: 'regaardien', title: getTranslation("You're a Regaardien", selectedLanguage), desc: getTranslation("Not just a creator. You're an ambassador of a movement. The demand-driven future.", selectedLanguage), icon: 'crown' }
    ];

    const handleNext = () => {
        // Validation on step 1: require name
        if (step === 1) {
            if (name.trim() === '') {
                setShowError(true);
                // hide after 2.2s to match toast timings
                setTimeout(() => setShowError(false), 2200);
                return;
            }
            // mark step 1 completed
            setCompletedSteps(prev => ({ ...prev, 1: true }));
            setStep(2);
            // ensure scroll resets to top when moving to next step
            const container = document.querySelector('.creator-onboard-scroll');
            if (container) container.scrollTop = 0;
            return;
        }

        // Validation on step 5: require either an intro URL or an uploaded file
        if (step === 5) {
            if ((!introUrl || String(introUrl).trim() === '') && !introFile) {
                setShowIntroError(true);
                setTimeout(() => setShowIntroError(false), 2800);
                return;
            }
            setCompletedSteps(prev => ({ ...prev, 5: true }));
        }

        // Validation on step 6: require both policy checkboxes
        if (step === 6) {
            if (!agreedTOS || !agreedPrivacy) {
                setShowAgreementError(true);
                // auto-hide after 3s
                setTimeout(() => setShowAgreementError(false), 3000);
                return;
            }
            setCompletedSteps(prev => ({ ...prev, 6: true }));
            // proceed to next step
        }

        if (step < TOTAL_STEPS) setStep(step + 1);
        else {
            // final step: if there's an uploaded intro file, upload it to backend first
            const doFinish = async () => {
                let uploadedVideoUrl = null;
                if (introFile) {
                    setUploadingIntro(true);
                    try {
                        const form = new FormData();
                        form.append('video', introFile);
                        const token = localStorage.getItem('regaarder_token');
                        const res = await fetch(`${BACKEND}/creator/intro-video`, {
                            method: 'POST',
                            headers: token ? { 'Authorization': `Bearer ${token}` } : {},
                            body: form
                        });
                        const json = await res.json();
                        if (res.ok && json && json.url) {
                            uploadedVideoUrl = json.url;
                            // update local profile and auth context so creator profile shows the intro
                            try {
                                const current = (auth && auth.user) ? auth.user : JSON.parse(localStorage.getItem('regaarder_user') || '{}');
                                const updated = { ...(current || {}), introVideo: json.url };
                                try { localStorage.setItem('regaarder_user', JSON.stringify(updated)); } catch (e) { }
                                if (auth && auth.login) {
                                    const tokenStored = localStorage.getItem('regaarder_token');
                                    auth.login({ ...updated, token: tokenStored });
                                }
                                setIntroUrl(json.url);
                            } catch (e) { }
                        }
                    } catch (e) {
                        console.error('Upload failed', e);
                    } finally {
                        setUploadingIntro(false);
                        // Send onboarding info to staff with the newly uploaded video URL
                        sendOnboardingToStaff(uploadedVideoUrl);
                        onClose();
                    }
                } else {
                    // Send onboarding info to staff even without intro video
                    sendOnboardingToStaff();
                    onClose();
                }
            };
            doFinish();
        }
    };
    
    const sendOnboardingToStaff = async (videoUrl) => {
        try {
            const userData = auth?.user || JSON.parse(localStorage.getItem('regaarder_user') || '{}');
            const onboardingData = {
                userId: userData?.id,
                userName: userData?.name || name,
                userEmail: userData?.email,
                creatorName: name,
                bio: bio,
                introVideoUrl: videoUrl || introUrl,
                socialMediaHandle: socialHandle,
                socialFollowers: socialFollowers,
                completedAt: new Date().toISOString(),
                agreedTOS: agreedTOS,
                agreedPrivacy: agreedPrivacy
            };
            
            const token = localStorage.getItem('regaarder_token');
            const response = await fetch(`${BACKEND}/staff/onboarding-info`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    ...(token ? { 'Authorization': `Bearer ${token}` } : {})
                },
                body: JSON.stringify(onboardingData)
            });
            
            if (response.ok) {
                console.log('✓ Onboarding info sent to staff successfully');
            } else {
                console.error('Failed to send onboarding info:', response.status, response.statusText);
            }
        } catch (e) {
            console.error('Failed to send onboarding info to staff', e);
        }
    };
    const handleBack = () => {
        if (step > 1) setStep(step - 1);
        else onClose();
    };

    const handlePickPhoto = () => {
        fileRef.current && fileRef.current.click();
    };
    const handleFileChange = (e) => {
        const f = e.target.files && e.target.files[0];
        if (f) {
            const url = URL.createObjectURL(f);
            setPhoto(url);
            setPhotoFile(f);
        }
    };

    const handleIntroFilePick = () => {
        introFileRef.current && introFileRef.current.click();
    };

    const handleIntroFileChange = (e) => {
        const f = e.target.files && e.target.files[0];
        if (f) {
            // Store the old URL to revoke it after state update
            const oldUrl = introObjectUrlRef.current;
            const url = URL.createObjectURL(f);
            introObjectUrlRef.current = url;
            setIntroFile(f);
            setIntroObjectUrl(url);
            // also populate the introUrl field so preview/summary shows a value
            setIntroUrl(url);
            // Revoke old URL after a delay to ensure React has finished rendering
            if (oldUrl) {
                setTimeout(() => {
                    try { URL.revokeObjectURL(oldUrl); } catch (e) { }
                }, 100);
            }
        }
    };

    useEffect(() => {
        // Only revoke on unmount
        return () => {
            if (introObjectUrlRef.current) {
                try { URL.revokeObjectURL(introObjectUrlRef.current); } catch (e) { }
            }
        };
    }, []);

    // When step changes, trigger visual guidance for next unfilled field
    useEffect(() => {
        // helper to add class to a ref if empty
        const tryHighlight = (ref) => {
            if (!ref || !ref.current) return false;
            const el = ref.current;
            const val = el.value;
            if (!val || String(val).trim() === '') {
                el.classList.add('needs-input');
                // focus for accessibility
                try { el.focus(); } catch (e) { }
                return true;
            }
            return false;
        };

        // clear previous needs-input marks
        [nameRef, bioRef, introRef, socialRef].forEach(r => { try { r.current && r.current.classList.remove('needs-input'); } catch (e) { } });

        // small animate emphasis for highlighted words / labels
        const toUnderline = document.querySelectorAll('[data-guidance="underline"]');
        toUnderline.forEach(el => { el.classList.remove('active'); void el.offsetWidth; el.classList.add('active'); });

        const toEmphasize = document.querySelectorAll('[data-guidance="emphasis"]');
        toEmphasize.forEach(el => { el.classList.add('temporary-emphasis'); setTimeout(() => el.classList.add('fade'), 1400); setTimeout(() => el.classList.remove('temporary-emphasis', 'fade'), 2800); });

        // switch on step
        if (step === 1) {
            // highlight name if empty
            tryHighlight(nameRef);
        } else if (step === 2) {
            // highlight first feature or bio (none required) - highlight bio
            tryHighlight(bioRef);
        } else if (step === 5) {
            // request intro video
            if (!tryHighlight(introRef)) tryHighlight(socialRef);
        }
    }, [step]);

    return (
        <div className="fixed inset-0 z-[999] flex items-center justify-center px-4" style={{ backgroundColor: 'rgba(0,0,0,0.6)', backdropFilter: "blur(4px)", WebkitBackdropFilter: "blur(4px)", transition: "backdrop-filter 240ms ease, -webkit-backdrop-filter 240ms ease, background 240ms ease" }} onClick={(e) => { e.stopPropagation(); e.preventDefault(); onClose && onClose(); }}>
            <div className="rounded-2xl w-full max-w-md overflow-hidden relative flex flex-col" onClick={(e) => e.stopPropagation()} style={{ background: "linear-gradient(180deg, rgba(255,255,255,0.98), rgba(255,255,255,0.95))", border: "1px solid rgba(255,255,255,0.1)", boxShadow: "0 20px 60px rgba(0,0,0,0.08)", height: `${window.innerHeight * 0.58}px` }}>
                {/* Agreement required toast (centered, no red outline, title black) */}
                {showAgreementError && (
                    <div
                        className="fixed left-1/2 transform -translate-x-1/2 z-50 pointer-events-auto animate-in slide-in-from-top-4 duration-300 min-w-[360px] sm:min-w-[480px] max-w-[92%]"
                        style={{ top: 'calc(12px + env(safe-area-inset-top, 0px))' }}
                    >
                        <div className="flex items-center bg-white rounded-lg shadow-2xl px-6 py-3">
                            <div className="w-8 h-8 rounded-full bg-red-600 text-white flex items-center justify-center mr-3">
                                <Icon name="x" size={14} className="text-white" />
                            </div>
                            <div>
                                <div className="text-sm font-semibold text-black">{getTranslation('Agreement required', selectedLanguage)}</div>
                                <div className="text-xs text-gray-500">{getTranslation('Please accept our Terms of Service and Privacy Policy', selectedLanguage)}</div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Inline error toast (centered, no red outline, title black) */}
                {showError && (
                    <div
                        className="fixed left-1/2 transform -translate-x-1/2 z-50 pointer-events-auto animate-in slide-in-from-top-4 duration-300 min-w-[360px] sm:min-w-[480px] max-w-[92%]"
                        style={{ top: 'calc(12px + env(safe-area-inset-top, 0px))' }}
                    >
                        <div className="flex items-center bg-white rounded-lg shadow-2xl px-6 py-3">
                            <div className="w-8 h-8 rounded-full bg-red-600 text-white flex items-center justify-center mr-3">
                                <Icon name="x" size={14} className="text-white" />
                            </div>
                            <div>
                                <div className="text-sm font-semibold text-black">{getTranslation('Name required', selectedLanguage)}</div>
                                <div className="text-xs text-gray-500">{getTranslation('Please enter your creator name', selectedLanguage)}</div>
                            </div>
                        </div>
                    </div>
                )}

                {showIntroError && (
                    <div
                        className="fixed left-1/2 transform -translate-x-1/2 z-50 pointer-events-auto animate-in slide-in-from-top-4 duration-300 min-w-[360px] sm:min-w-[480px] max-w-[92%]"
                        style={{ top: 'calc(12px + env(safe-area-inset-top, 0px))' }}
                    >
                        <div className="flex items-center bg-white rounded-lg shadow-2xl px-6 py-3">
                            <div className="w-8 h-8 rounded-full bg-red-600 text-white flex items-center justify-center mr-3">
                                <Icon name="x" size={14} className="text-white" />
                            </div>
                            <div>
                                <div className="text-sm font-semibold text-black">{getTranslation('Intro required', selectedLanguage)}</div>
                                <div className="text-xs text-gray-500">{getTranslation('Please paste a video URL or upload a short intro', selectedLanguage)}</div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Header */}
                <div className="px-6 py-5 border-b border-gray-100 bg-white/40 backdrop-blur-sm">
                    <div className="flex items-center justify-start mb-4">
                        <div className="flex items-center space-x-4">
                            <div className="w-12 h-12 rounded-full flex items-center justify-center" style={{ background: 'linear-gradient(135deg, rgba(var(--color-gold-rgb,203,138,0),0.12), rgba(var(--color-gold-rgb,203,138,0),0.04))' }}>
                                <Icon name="crown" size={20} style={{ color: 'var(--color-gold)' }} />
                            </div>
                            <div>
                                <div className="text-base font-semibold text-gray-900">{getTranslation('Become a Regaardien', selectedLanguage)}</div>
                                <div className="text-xs text-gray-500 mt-0.5">{getTranslation('Step', selectedLanguage)} {step} {getTranslation('of', selectedLanguage)} {TOTAL_STEPS}</div>
                            </div>
                        </div>
                    </div>
                    <div className="h-1.5 bg-gray-200 rounded-full overflow-hidden">
                        <div className="h-full bg-[var(--color-gold)] transition-all" style={{ width: `${(step / TOTAL_STEPS) * 100}%` }} />
                    </div>
                </div>

                {/* Scrollable content */}
                <div className="px-6 py-8 overflow-y-auto creator-onboard-scroll flex-1 space-y-8" style={{ maxHeight: `calc(${window.innerHeight * 0.58}px - 160px)` }}>

                    {step === 1 && (
                        <div className="flex flex-col items-center text-center space-y-8">
                            <div className="w-20 h-20 rounded-2xl flex items-center justify-center" style={{ background: 'linear-gradient(180deg, rgba(var(--color-gold-rgb,203,138,0),0.12), rgba(var(--color-gold-rgb,203,138,0),0.03))', boxShadow: '0 8px 24px rgba(0,0,0,0.06)' }}>
                                <Icon name="star" size={36} style={{ color: 'var(--color-gold)' }} />
                            </div>

                            <div className="space-y-3">
                                <h2 className="text-2xl font-bold text-gray-900">{getTranslation("Let's Get Started!", selectedLanguage)}</h2>
                                <p className="text-base text-gray-600">{getTranslation('Set up your creator profile to join the Regaardiens', selectedLanguage)}</p>
                            </div>

                            <div className="w-full space-y-6">
                                <div>
                                    <div className="relative w-32 h-32 rounded-full mx-auto mb-4">
                                        <img src={photo || `https://placehold.co/160x160/efefef/aaaaaa?text=${getTranslation('Photo', selectedLanguage)}`} alt="avatar" className="w-full h-full object-cover rounded-full border-4" style={{ borderColor: 'var(--color-gold)' }} />
                                        <button onClick={handlePickPhoto} className="absolute -right-1 -bottom-1 bg-white rounded-full p-3 shadow-lg hover:shadow-xl transition-shadow">
                                            <Icon name="camera" size={20} style={{ color: 'var(--color-gold)' }} />
                                        </button>
                                        <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
                                    </div>
                                    <div className="text-sm text-gray-600">{getTranslation('Click the camera icon to change your profile picture', selectedLanguage)}</div>
                                </div>

                                <div className="pt-4 space-y-4">
                                    <div>
                                        <label className="text-sm font-semibold text-gray-700 block mb-3">{getTranslation('Creator Name', selectedLanguage)} <span className="text-red-500">*</span></label>
                                        <input ref={nameRef} value={name} onChange={(e) => setName(e.target.value)} placeholder={getTranslation('Enter your creator name', selectedLanguage)} className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:outline-none focus:border-[var(--color-gold)] text-base transition-colors" />
                                        <div className="text-xs text-gray-500 mt-2">{getTranslation('This is how your audience will know you', selectedLanguage)}</div>
                                    </div>

                                    <div>
                                        <label className="text-sm font-semibold text-gray-700 block mb-3">{getTranslation('Write a short bio', selectedLanguage)}</label>
                                        <textarea ref={bioRef} value={bio} onChange={(e) => setBio(e.target.value)} placeholder={getTranslation('Tell your audience who you are and what you create...', selectedLanguage)} maxLength={200} className="w-full p-3 rounded-xl border border-gray-200 bg-gray-50 text-base text-gray-700 h-28 resize-none focus:outline-none focus:border-[var(--color-gold)] focus:bg-white transition-colors" />
                                        <div className="text-xs text-gray-500 text-right mt-2">{bio.length}/200</div>
                                    </div>
                                </div>
                            </div>

                            <div className="pt-2 text-xs text-gray-500">{getTranslation('You can complete more steps after getting started.', selectedLanguage)}</div>
                        </div>
                    )}

                    {step === 2 && (
                        <div className="flex flex-col items-center text-center">
                            <div className="w-16 h-16 rounded-xl flex items-center justify-center mb-4" style={{ background: 'linear-gradient(180deg, rgba(var(--color-gold-rgb,203,138,0),0.12), rgba(var(--color-gold-rgb,203,138,0),0.03))', boxShadow: '0 8px 24px rgba(0,0,0,0.06)', color: 'var(--color-gold)' }}>
                                <Icon name="star" size={28} style={{ color: 'var(--color-gold)' }} />
                            </div>

                            <h2 className="text-xl font-bold text-gray-900 mb-2">{getTranslation('Why Join Regaarder?', selectedLanguage)}</h2>
                            <p className="text-sm text-gray-600 mb-6">{getTranslation("The world's first demand-driven creator platform", selectedLanguage)}</p>

                            <div className="w-full space-y-4 pb-6">
                                {features.map((f) => (
                                    <div key={f.id} className="relative bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
                                        {/* left gold accent */}
                                        <div className="absolute left-0 top-0 bottom-0 w-3 bg-[var(--color-gold)] rounded-l-xl" />
                                        <div className="p-4 pl-6 flex items-start space-x-4">
                                            <div className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: 'linear-gradient(135deg, rgba(var(--color-gold-rgb,203,138,0),0.12), rgba(var(--color-gold-rgb,203,138,0),0.03))', boxShadow: '0 6px 18px rgba(0,0,0,0.06)', color: 'var(--color-gold)' }}>
                                                {/* Fallback to simple icons for matching look */}
                                                {f.icon === 'dollar-sign' && <DollarSign size={20} strokeWidth={1.8} />}
                                                {f.icon === 'users' && <Icon name="users" size={20} />}
                                                {f.icon === 'shield' && <Icon name="shield" size={20} />}
                                                {f.icon === 'trendingUp' && <Icon name="trendingUp" size={20} />}
                                            </div>

                                            <div className="text-left">
                                                <div className="text-lg font-semibold leading-6 text-gray-900">{f.title}</div>
                                                <div className="text-sm text-gray-600 mt-1 leading-5">{f.desc}</div>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>

                        </div>
                    )}

                    {/* Step 3: Our Values (pixel-like cards + crown banner) */}
                    {step === 3 && (
                        <div className="flex flex-col items-center text-center">
                            <div className="w-16 h-16 rounded-xl flex items-center justify-center mb-4" style={{ background: 'linear-gradient(180deg, rgba(var(--color-gold-rgb,203,138,0),0.12), rgba(var(--color-gold-rgb,203,138,0),0.03))', boxShadow: '0 8px 24px rgba(0,0,0,0.06)' }}>
                                <Icon name="heart" size={28} style={{ color: 'var(--color-gold)' }} />
                            </div>

                            <h2 className="text-xl font-bold text-gray-900 mb-2">{getTranslation('Our Values', selectedLanguage)}</h2>
                            <p className="text-sm text-gray-600 mb-6">{getTranslation('What makes Regaardiens special', selectedLanguage)}</p>

                            <div className="w-full space-y-4 pb-6">
                                {values.map(v => (
                                    <div key={v.id} className="bg-gray-50 rounded-xl p-4">
                                        <div className="flex items-start">
                                            <div className="w-10 h-10 rounded-lg flex items-center justify-center mr-4 flex-shrink-0" style={{ background: 'linear-gradient(135deg, rgba(var(--color-gold-rgb,203,138,0),0.12), rgba(var(--color-gold-rgb,203,138,0),0.03))', boxShadow: '0 6px 18px rgba(0,0,0,0.06)', color: 'var(--color-gold)' }}>
                                                {v.icon === 'sparkles' && <Sparkles size={20} />}
                                                {v.icon === 'heart' && <Icon name="heartFilled" size={20} />}
                                                {v.icon === 'zap' && <Icon name="zap" size={20} />}
                                                {v.icon === 'video' && <Icon name="video" size={20} />}
                                                {v.icon === 'crown' && <Icon name="crown" size={20} />}
                                            </div>

                                            <div className="text-left">
                                                <div className="text-lg font-semibold leading-6 text-gray-900">{v.title}</div>
                                                <div className="text-sm text-gray-600 mt-1 leading-5">{v.desc}</div>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            <div className="w-full mt-2">
                                <div className="rounded-xl p-6 flex flex-col items-center" style={{ background: 'linear-gradient(180deg, rgba(var(--color-gold-rgb,203,138,0),0.08), rgba(var(--color-gold-rgb,203,138,0),0.02))' }}>
                                    <div className="text-4xl mb-3">👑</div>
                                    <div className="font-semibold text-[var(--color-gold)]">{getTranslation('Meet your fellow Regaardiens!', selectedLanguage)}</div>
                                    <div className="text-sm text-gray-600 mt-1">{getTranslation('A community of creators building the future together', selectedLanguage)}</div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Step 4: Grow With Your Network (Referral revenue UI) */}
                    {step === 4 && (
                        <div className="flex flex-col items-center text-center">
                            <div className="w-16 h-16 rounded-xl flex items-center justify-center mb-4" style={{ background: 'linear-gradient(180deg, rgba(var(--color-gold-rgb,203,138,0),0.12), rgba(var(--color-gold-rgb,203,138,0),0.03))', boxShadow: '0 8px 24px rgba(0,0,0,0.06)' }}>
                                <Icon name="chart" size={28} style={{ color: 'var(--color-gold)' }} />
                            </div>

                            <h2 className="text-xl font-bold text-gray-900 mb-2">{getTranslation('Grow With Your Network', selectedLanguage)}</h2>
                            <p className="text-sm text-gray-600 mb-6">{getTranslation('The more you invite, the more you earn', selectedLanguage)}</p>

                            <div className="w-full px-2">
                                <div className="rounded-xl border-2 border-[var(--color-gold)] p-6 mb-6 bg-white">
                                    <div className="flex flex-col items-center">
                                        <div className="mb-3" style={{ color: 'var(--color-gold)' }}>
                                            <Icon name="chart" size={56} style={{ color: 'var(--color-gold)' }} />
                                        </div>

                                        <div className="font-semibold text-lg text-gray-900 mb-2">{getTranslation('Referral Revenue Boost', selectedLanguage)}</div>
                                        <div className="text-sm text-gray-600 mb-4">{getTranslation('For each active creator you invite:', selectedLanguage)}</div>

                                        <div className="rounded-full px-6 py-3 inline-flex items-center shadow-sm mb-4" style={{ background: 'linear-gradient(90deg, rgba(var(--color-gold-rgb,203,138,0),0.12), rgba(var(--color-gold-rgb,203,138,0),0.03))', color: 'var(--color-gold)' }}>
                                            <Icon name="trendingUp" size={16} className="mr-2" />
                                            <div className="font-semibold">{getTranslation('+1% Revenue Share', selectedLanguage)}</div>
                                        </div>

                                        <div className="text-sm text-gray-600">{getTranslation('Stack up to', selectedLanguage)} <span className="font-semibold text-[var(--color-gold)]">{getTranslation('80% revenue share', selectedLanguage)}</span> {getTranslation('by building your network!', selectedLanguage)}</div>
                                    </div>
                                </div>

                                <div className="grid grid-cols-3 gap-3 mb-4">
                                    {[{ n: 10, share: '60%' }, { n: 20, share: '70%' }, { n: 30, share: '80%' }].map((c) => (
                                        <div key={c.n} className="bg-gray-50 rounded-xl p-4 text-center">
                                            <div className="text-2xl font-bold text-[var(--color-gold)]">{c.n}</div>
                                            <div className="text-sm text-gray-600">{getTranslation('Creators', selectedLanguage)}</div>
                                            <div className="text-sm font-semibold text-gray-800 mt-2">{c.share} {getTranslation('Share', selectedLanguage)}</div>
                                        </div>
                                    ))}
                                </div>

                                <div className="rounded-xl border border-[var(--color-gold-light-bg)] bg-[rgba(245,245,245,0.4)] p-4 text-left text-sm text-gray-700">
                                    <div className="font-semibold text-gray-900 mb-2">{getTranslation('How it works:', selectedLanguage)}</div>
                                    <div>{getTranslation('When creators you invite become active (publish their first video), your revenue share increases by 1%. The more successful creators you bring, the more you earn!', selectedLanguage)}</div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Step 5: Almost There! (Intro video + social verification) */}
                    {step === 5 && (
                        <div className="flex flex-col items-center text-center">
                            <div className="w-16 h-16 rounded-xl flex items-center justify-center mb-4" style={{ background: 'linear-gradient(180deg, rgba(var(--color-gold-rgb,203,138,0),0.12), rgba(var(--color-gold-rgb,203,138,0),0.03))', boxShadow: '0 8px 24px rgba(0,0,0,0.06)' }}>
                                <Icon name="video" size={28} style={{ color: 'var(--color-gold)' }} />
                            </div>

                            <h2 className="text-xl font-bold text-gray-900 mb-2">{getTranslation('Almost There!', selectedLanguage)}</h2>
                            <p className="text-sm text-gray-600 mb-6">{getTranslation("Let's verify you're ready to create", selectedLanguage)}</p>

                            <div className="w-full">
                                <label className="text-sm font-medium text-gray-700">{getTranslation('Intro Video URL', selectedLanguage)} <span className="text-red-500">*</span></label>
                                <div className="mt-2 flex items-start space-x-3">
                                    <div className="flex-1">
                                        <input
                                            ref={introRef}
                                            value={introUrl}
                                            onChange={(e) => setIntroUrl(e.target.value)}
                                            placeholder="https://youtube.com/watch?v=..."
                                            className="w-full p-3 rounded-xl bg-gray-100 text-base text-gray-700"
                                        />

                                        {introFile && (
                                            <div className="mt-2 text-xs text-gray-500">{getTranslation('Selected file:', selectedLanguage)} {introFile.name}</div>
                                        )}

                                        {/* Preview area: uploaded file or embeddable YouTube (compact) */}
                                        <div className="mt-3">
                                            {introObjectUrl ? (
                                                <video controls className="w-full rounded-lg bg-black" src={introObjectUrl} style={{ maxHeight: 160 }} />
                                            ) : (
                                                (() => {
                                                    // attempt to render YouTube preview if possible (compact height)
                                                    if (introUrl && /(?:youtube\.com|youtu\.be)/.test(introUrl)) {
                                                        try {
                                                            const matches = introUrl.match(/(?:v=|youtu\.be\/)([A-Za-z0-9_-]{6,})/);
                                                            const id = matches ? matches[1] : null;
                                                            if (id) {
                                                                return (
                                                                    <div className="w-full rounded-lg overflow-hidden bg-black" style={{ height: 160, position: 'relative' }}>
                                                                        {/* YouTube thumbnail image — no branding */}
                                                                        <img
                                                                            src={`https://img.youtube.com/vi/${id}/hqdefault.jpg`}
                                                                            alt="Video preview"
                                                                            style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }}
                                                                            onError={(e) => { e.target.src = `https://img.youtube.com/vi/${id}/mqdefault.jpg`; }}
                                                                        />
                                                                        <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.12)' }} />
                                                                        {/* Play icon */}
                                                                        <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', width: 44, height: 44, borderRadius: '50%', background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                                                            <svg width="20" height="20" viewBox="0 0 24 24" fill="white"><polygon points="6,3 20,12 6,21" /></svg>
                                                                        </div>
                                                                        <div style={{ position: 'absolute', bottom: 6, left: 6, background: 'rgba(0,0,0,0.65)', color: '#fff', fontSize: 10, fontWeight: 600, padding: '2px 7px', borderRadius: 4 }}>YouTube</div>
                                                                    </div>
                                                                );
                                                            }
                                                        } catch (e) { }
                                                    }
                                                    return null;
                                                })()
                                            )}
                                        </div>
                                    </div>
                                </div>

                                <div className="mt-4 rounded-xl border border-[var(--color-gold-light-bg)] p-4 text-sm text-gray-700 text-left" style={{ background: 'linear-gradient(180deg, rgba(var(--color-gold-rgb,203,138,0),0.06), rgba(255,255,255,0.0))' }}>
                                    <div className="font-semibold mb-2">{getTranslation('What to upload:', selectedLanguage)}</div>
                                    <ul className="list-disc ml-5 space-y-2 leading-relaxed text-sm">
                                        <li>{getTranslation('Link to your previous content (YouTube, TikTok, Instagram, etc.), or', selectedLanguage)}</li>
                                        <li>{getTranslation('Create a short intro explaining why you want to join Regaarder.', selectedLanguage)}</li>
                                        <li>{getTranslation('Showing your face is a plus but not required.', selectedLanguage)}</li>
                                        <li>{getTranslation('Keep it authentic and personalized!', selectedLanguage)}</li>
                                    </ul>
                                </div>

                                <div className="mt-6">
                                    <div className="text-sm font-medium text-gray-700 mb-2">{getTranslation('Social Media Verification', selectedLanguage)}</div>
                                    <input
                                        ref={socialRef}
                                        value={socialUrl}
                                        onChange={(e) => setSocialUrl(e.target.value)}
                                        placeholder="https://instagram.com/yourhandle or https..."
                                        className="w-full p-3 rounded-xl bg-gray-100 text-base text-gray-700"
                                    />

                                    <div className="mt-3 bg-gray-50 rounded-xl p-4 flex items-center">
                                        <input
                                            type="checkbox"
                                            checked={has1kFollowers}
                                            onChange={() => setHas1kFollowers(!has1kFollowers)}
                                            className="mr-3 w-4 h-4"
                                            style={{ accentColor: '#1e3a8a' }}
                                        />
                                        <div className="text-sm text-gray-700">{getTranslation('I have 1,000+ followers on at least one social platform', selectedLanguage)}</div>
                                    </div>

                                    <div className="flex items-center my-4">
                                        <div className="flex-1 h-px bg-gray-200"></div>
                                        <div className="mx-3 text-sm text-gray-400">{getTranslation('OR', selectedLanguage)}</div>
                                        <div className="flex-1 h-px bg-gray-200"></div>
                                    </div>

                                    <div className="rounded-xl border border-[var(--color-gold-light-bg)] bg-white p-4">
                                        <label className="flex items-start">
                                            <input
                                                type="checkbox"
                                                checked={isAmbassador}
                                                onChange={() => setIsAmbassador(!isAmbassador)}
                                                className="mt-1 mr-3 w-4 h-4"
                                                style={{ accentColor: '#1e3a8a' }}
                                            />
                                            <div className="text-left">
                                                <div className="font-semibold text-gray-900">{getTranslation('Become an Ambassador', selectedLanguage)}: <span className="font-normal text-gray-700">{getTranslation('I commit to inviting and onboarding at least 3 quality creators to join the Regaardien movement within my first 30 days', selectedLanguage)}</span></div>

                                                <div className="mt-3 flex items-center">
                                                    <button
                                                        className="rounded-lg px-3 py-1 text-xs mr-3 flex items-center space-x-2"
                                                        style={{
                                                            background: 'linear-gradient(90deg, rgba(var(--color-gold-rgb,203,138,0),0.14), rgba(var(--color-gold-rgb,203,138,0),0.04))',
                                                            color: 'var(--color-gold)',
                                                            boxShadow: '0 6px 18px rgba(203,138,0,0.08)',
                                                            border: '1px solid rgba(var(--color-gold-rgb,203,138,0),0.12)',
                                                            borderRadius: 12
                                                        }}
                                                        onClick={() => {
                                                            // gentle in-page reveal: scroll to top of onboarding as a small affordance
                                                            const container = document.querySelector('.creator-onboard-scroll');
                                                            if (container) container.scrollTo({ top: 0, behavior: 'smooth' });
                                                        }}
                                                    >
                                                        <Icon name="star" size={12} className="text-[var(--color-gold)]" />
                                                        <span>{getTranslation('Ambassador Perks', selectedLanguage)}</span>
                                                    </button>
                                                    <div className="text-sm text-gray-600">{getTranslation('Early access to new features + Priority support', selectedLanguage)}</div>
                                                </div>
                                            </div>
                                        </label>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Step 6: One Last Step! (Policies + summary) */}
                    {step === 6 && (
                        <div className="flex flex-col items-center text-center">
                            <div className="w-16 h-16 rounded-xl flex items-center justify-center mb-4" style={{ background: 'linear-gradient(180deg, rgba(var(--color-gold-rgb,203,138,0),0.12), rgba(var(--color-gold-rgb,203,138,0),0.03))', boxShadow: '0 8px 24px rgba(0,0,0,0.06)' }}>
                                <div className="w-14 h-14 rounded-full bg-white flex items-center justify-center" style={{ border: '1px solid #EDE7D7' }}>
                                    <Icon name="check" size={18} style={{ color: 'var(--color-gold)' }} />
                                </div>
                            </div>

                            <h2 className="text-xl font-bold text-gray-900 mb-2">{getTranslation('One Last Step!', selectedLanguage)}</h2>
                            <p className="text-sm text-gray-600 mb-6">{getTranslation('Review and accept our policies', selectedLanguage)}</p>

                            <div className="w-full px-2">
                                <div className="rounded-xl border border-gray-200 bg-white p-4 mb-4">
                                    <label className="flex items-start mb-3">
                                        <input type="checkbox" checked={agreedTOS} onChange={() => setAgreedTOS(!agreedTOS)} className="mr-3 mt-1 w-4 h-4" style={{ accentColor: '#1e3a8a' }} />
                                        <div className="text-left text-sm">
                                            {getTranslation('I have read and agree to the', selectedLanguage)} <a href="#" onClick={(e) => { e.preventDefault(); window.open('https://example.com/terms', '_blank') }} className="text-[var(--color-gold)] underline">{getTranslation('Terms of Service', selectedLanguage)}</a>
                                        </div>
                                    </label>

                                    <label className="flex items-start">
                                        <input type="checkbox" checked={agreedPrivacy} onChange={() => setAgreedPrivacy(!agreedPrivacy)} className="mr-3 mt-1 w-4 h-4" style={{ accentColor: '#1e3a8a' }} />
                                        <div className="text-left text-sm">
                                            {getTranslation('I have read and agree to the', selectedLanguage)} <a href="#" onClick={(e) => { e.preventDefault(); window.open('https://example.com/privacy', '_blank') }} className="text-[var(--color-gold)] underline">{getTranslation('Privacy Policy', selectedLanguage)}</a>
                                        </div>
                                    </label>
                                </div>

                                <div className="rounded-xl border-2 border-[var(--color-gold)] p-4 mb-4 bg-white">
                                    <div className="flex items-center">
                                        <div className="w-16 h-16 rounded-full overflow-hidden border-4" style={{ borderColor: 'var(--color-gold)' }}>
                                            <img src={photo || 'https://placehold.co/120x120/efefef/aaaaaa?text=Photo'} alt="avatar" className="w-full h-full object-cover" />
                                        </div>
                                        <div className="text-left ml-4">
                                            <div className="text-lg font-semibold text-gray-900">{name || getTranslation('Your Name', selectedLanguage)}</div>
                                            <div className="mt-1 inline-block text-xs rounded-full px-3 py-1" style={{ background: 'linear-gradient(90deg, rgba(var(--color-gold-rgb,203,138,0),0.12), rgba(var(--color-gold-rgb,203,138,0),0.03))', color: 'var(--color-gold)' }}>{getTranslation('Regaardien', selectedLanguage)}</div>
                                        </div>
                                    </div>

                                    <div className="mt-4 space-y-3 text-left text-sm text-gray-700">
                                        <div className="flex items-center"><Icon name="check" size={18} className="text-[var(--color-gold)] mr-3" /> {getTranslation('Intro video added', selectedLanguage)}</div>
                                        <div className="flex items-center"><Icon name="check" size={18} className="text-[var(--color-gold)] mr-3" /> {has1kFollowers ? getTranslation('1,000+ followers verified', selectedLanguage) : getTranslation('1,000+ followers verified', selectedLanguage)}</div>
                                        <div className="flex items-center"><Icon name="check" size={18} className="text-[var(--color-gold)] mr-3" /> {isAmbassador ? getTranslation('Ambassador commitment', selectedLanguage) : getTranslation('Ambassador commitment', selectedLanguage)}</div>
                                    </div>
                                </div>

                                <div className="rounded-xl p-6 text-center" style={{ background: 'linear-gradient(180deg, rgba(var(--color-gold-rgb,203,138,0),0.08), rgba(var(--color-gold-rgb,203,138,0),0.02))' }}>
                                    <div className="text-4xl mb-3">🎉</div>
                                    <div className="font-semibold text-gray-900">{getTranslation('Ready to Start Creating?', selectedLanguage)}</div>
                                    <div className="text-sm text-gray-600 mt-1">{getTranslation('Click "Next" to learn how to get your first requests!', selectedLanguage)}</div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Step 7: Get Your First Requests! (Marketing yourself) */}
                    {step === 7 && (
                        <div className="w-full text-left px-1">
                            {/* Header / hero */}
                            <div className="flex flex-col items-center text-center mb-4">
                                <div className="w-16 h-16 rounded-xl flex items-center justify-center mb-3" style={{ background: 'linear-gradient(180deg, rgba(var(--color-gold-rgb,203,138,0),0.12), rgba(var(--color-gold-rgb,203,138,0),0.03))', boxShadow: '0 8px 24px rgba(0,0,0,0.06)' }}>
                                    <Icon name="sparkles" size={32} style={{ color: 'var(--color-gold)' }} />
                                </div>
                                <h2 className="text-xl font-bold text-gray-900">{getTranslation('Get Your First Requests!', selectedLanguage)}</h2>
                                <p className="text-sm text-gray-600">{getTranslation('Learn how to market yourself and start earning', selectedLanguage)}</p>
                            </div>

                            {/* ADDED: You're the Marketer card (appears right under the hero) */}
                            <div className="rounded-xl border-2 border-[var(--color-gold)] p-4 mb-6 bg-white">
                                <div className="flex items-start">
                                    <div className="w-12 h-12 rounded-lg flex items-center justify-center mr-4" style={{ color: 'var(--color-gold)', background: 'linear-gradient(135deg, rgba(var(--color-gold-rgb,203,138,0),0.12), rgba(var(--color-gold-rgb,203,138,0),0.03))' }}>
                                        <Icon name="users" size={20} style={{ color: 'var(--color-gold)' }} />
                                    </div>

                                    <div className="text-left">
                                        <div className="font-semibold text-gray-900">{getTranslation("You're the Marketer!", selectedLanguage)}</div>
                                        <div className="text-sm text-gray-600 mt-1">{getTranslation('Creators drive their own success on Regaarder', selectedLanguage)}</div>
                                        <div className="text-sm text-gray-600 mt-3">
                                            {getTranslation('Unlike traditional platforms,', selectedLanguage)} <strong>{getTranslation('you', selectedLanguage)}</strong> {getTranslation('have full control over your marketing. Share your profile, engage your audience, and watch the requests roll in!', selectedLanguage)}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Numbered steps stack (will exceed container height and reveal on scroll) */}
                            <div className="space-y-6">
                                {/* 1 */}
                                <div className="flex items-start">
                                    <div className="w-8 h-8 rounded-full flex items-center justify-center mr-4 font-semibold" style={{ background: 'linear-gradient(90deg, rgba(var(--color-gold-rgb,203,138,0),0.12), rgba(var(--color-gold-rgb,203,138,0),0.03))', color: 'var(--color-gold)' }}>1</div>
                                    <div className="flex-1">
                                        <div className="flex items-center justify-between">
                                            <div className="font-semibold text-lg text-gray-900">{getTranslation('Go to Your Profile', selectedLanguage)}</div>
                                        </div>
                                        <div className="text-sm text-gray-600 mt-1">{getTranslation("Once you're in the dashboard, click on your profile settings", selectedLanguage)}</div>
                                    </div>
                                </div>

                                {/* 2 - Customize Your CTA with example boxes */}
                                <div className="flex items-start">
                                    <div className="w-8 h-8 rounded-full flex items-center justify-center mr-4 font-semibold" style={{ background: 'linear-gradient(90deg, rgba(var(--color-gold-rgb,203,138,0),0.12), rgba(var(--color-gold-rgb,203,138,0),0.03))', color: 'var(--color-gold)' }}>2</div>
                                    <div className="flex-1">
                                        <div className="font-semibold text-lg text-gray-900 flex items-center">
                                            <Icon name="pencil" size={18} className="mr-2" style={{ color: 'var(--color-gold)' }} />
                                            {getTranslation('Customize Your CTA', selectedLanguage)}
                                        </div>
                                        <div className="text-sm text-gray-600 mt-2 mb-3">{getTranslation('Create a compelling call-to-action that invites requests. Examples:', selectedLanguage)}</div>

                                        <div className="space-y-3">
                                            {[
                                                { title: getTranslation('Science Creator', selectedLanguage), text: getTranslation('"Which experiment do you want me to try next? Request it now!"', selectedLanguage) },
                                                { title: getTranslation('Documentary Maker', selectedLanguage), text: getTranslation('"Which topic should I cover next? Tell me your story idea!"', selectedLanguage) },
                                                { title: getTranslation('Cooking Creator', selectedLanguage), text: getTranslation('"What recipe should I make for you? Send your request!"', selectedLanguage) }
                                            ].map((ex, idx) => (
                                                <div key={idx} className="rounded-lg bg-gray-100 p-3">
                                                    <div className="text-[var(--color-gold)] font-semibold mb-1">{ex.title}</div>
                                                    <div className="text-sm text-gray-600">{ex.text}</div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>

                                {/* 3 - Share Your Profile Link */}
                                <div className="flex items-start">
                                    <div className="w-8 h-8 rounded-full flex items-center justify-center mr-4 font-semibold" style={{ background: 'linear-gradient(90deg, rgba(var(--color-gold-rgb,203,138,0),0.12), rgba(var(--color-gold-rgb,203,138,0),0.03))', color: 'var(--color-gold)' }}>3</div>
                                    <div className="flex-1">
                                        <div className="font-semibold text-lg text-gray-900 flex items-center">
                                            <Share2 size={20} strokeWidth={1.8} className="mr-2" style={{ color: 'var(--color-gold)' }} />
                                            {getTranslation('Share Your Profile Link', selectedLanguage)}
                                        </div>
                                        <div className="text-sm text-gray-600 mt-2 mb-2">{getTranslation('Copy your unique profile link and share it everywhere:', selectedLanguage)}</div>
                                        <ul className="list-disc ml-6 text-sm text-gray-600 space-y-1">
                                            <li>{getTranslation('Instagram stories & bio', selectedLanguage)}</li>
                                            <li>{getTranslation('YouTube video descriptions & community posts', selectedLanguage)}</li>
                                            <li>{getTranslation('TikTok bio & comments', selectedLanguage)}</li>
                                            <li>{getTranslation('Twitter/X posts & profile', selectedLanguage)}</li>
                                            <li>{getTranslation('Discord servers & communities', selectedLanguage)}</li>
                                        </ul>
                                    </div>
                                </div>

                                {/* 4 - Make It Personal (header visible when scrolled) */}
                                <div className="flex items-start">
                                    <div className="w-8 h-8 rounded-full flex items-center justify-center mr-4 font-semibold" style={{ background: 'linear-gradient(90deg, rgba(var(--color-gold-rgb,203,138,0),0.12), rgba(var(--color-gold-rgb,203,138,0),0.03))', color: 'var(--color-gold)' }}>4</div>
                                    <div className="flex-1">
                                        <div className="font-semibold text-lg text-gray-900 flex items-center">
                                            <Icon name="pencil" size={18} className="mr-2" style={{ color: 'var(--color-gold)' }} />
                                            {getTranslation('Make It Personal', selectedLanguage)}
                                        </div>
                                        <div className="text-sm text-gray-600 mt-2">{getTranslation('Use friendly language, show personality, and thank requesters, small touches increase conversions.', selectedLanguage)}</div>

                                        {/* NEW: Pro Tips card */}
                                        <div className="rounded-xl border border-[var(--color-gold-light-bg)] p-4 mt-4 text-sm text-gray-700" style={{ background: 'linear-gradient(180deg, rgba(var(--color-gold-rgb,203,138,0),0.04), rgba(255,255,255,0.0))' }}>
                                            <div className="font-semibold mb-2" style={{ color: 'var(--color-gold)' }}>{getTranslation('Pro Tips', selectedLanguage)}</div>
                                            <ul className="ml-3 space-y-2">
                                                <li className="flex items-start"><span className="text-[var(--color-gold)] mr-3">➜</span>{getTranslation('Post your link with a clear CTA in all your social media bios', selectedLanguage)}</li>
                                                <li className="flex items-start"><span className="text-[var(--color-gold)] mr-3">➜</span>{getTranslation('End your videos/posts with "What should I create next? Link in bio!"', selectedLanguage)}</li>
                                                <li className="flex items-start"><span className="text-[var(--color-gold)] mr-3">➜</span>{getTranslation('Create polls and direct people to request winners on Regaarder', selectedLanguage)}</li>
                                                <li className="flex items-start"><span className="text-[var(--color-gold)] mr-3">➜</span>{getTranslation('Engage authentically — respond to requests and thank your supporters', selectedLanguage)}</li>
                                            </ul>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                </div>

                {/* Footer fixed */}
                <div className="px-6 py-4 border-t border-gray-100 bg-white/50 backdrop-blur-sm flex items-center justify-between">
                    <button onClick={handleBack} className="text-gray-600 hover:text-gray-900 transition-colors font-medium text-sm">{getTranslation('Back', selectedLanguage)}</button>
                    <div className="flex items-center space-x-4">
                        <div className="flex items-center space-x-2">
                            {Array.from({ length: TOTAL_STEPS }).map((_, i) => (
                                <div key={i} className={`w-2 h-2 rounded-full transition-colors ${i + 1 === step ? 'bg-[var(--color-gold)]' : 'bg-gray-200'}`} />
                            ))}
                        </div>
                        <button
                            onClick={handleNext}
                            disabled={uploadingIntro}
                            className={`py-2.5 px-5 font-semibold rounded-lg transition-all ${step === TOTAL_STEPS ? 'rounded-lg' : 'rounded-lg'} ${uploadingIntro ? 'opacity-60 cursor-not-allowed' : ''}`}
                            style={step === TOTAL_STEPS ? { backgroundColor: 'var(--color-final, #7C3AED)', color: 'var(--color-final-text, #fff)' } : { backgroundColor: 'var(--color-accent-safe, var(--color-gold))', color: 'var(--color-accent-text, black)' }}
                        >
                            {uploadingIntro ? getTranslation('Uploading...', selectedLanguage) : (step < TOTAL_STEPS ? getTranslation('Next', selectedLanguage) : getTranslation('Complete Setup', selectedLanguage))}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

// --- SideDrawer Component Refinements ---

const DrawerItem = ({ iconName, label, rightText = null, isGold = false, isPurpleDot = false, onClick, className = '', collapsed = false, isActive = false }) => {
    const handleClick = (e) => {
        if (typeof onClick === 'function') {
            try {
                onClick(e);
            } catch (err) {
                console.warn('DrawerItem onClick failed', err);
            }
        }
    };

    // --- Badge Style Logic ---
    const isBadge = rightText === 'New' || rightText?.includes('invites') || rightText === 'Coming Soon';

    const badgeStyle = isBadge ? {
        backgroundColor: 'var(--color-gold-light-bg)',
        color: 'var(--color-gold)',
        padding: '4px 8px',
        borderRadius: '6px',
        fontWeight: 600,
        fontSize: '12px',
        boxShadow: '0 0 5px rgba(203, 138, 0, 0.06)',
        display: 'inline-block'
    } : {};
    // -------------------------

    // If the drawer is collapsed, render an icon-only square button (tooltip via title)
    if (collapsed) {
        return (
            <button
                title={label}
                className={`flex items-center justify-center w-full py-3 text-gray-800 transition duration-150 cursor-pointer hover:bg-gray-50 active:bg-gray-100 active:scale-95 ${isActive ? 'bg-[var(--color-gold-cream)]' : ''} ${className}`}
                onClick={handleClick}
                aria-label={label}
            >
                <Icon
                    name={iconName}
                    size={20}
                    className=""
                    style={{ color: isActive || isGold ? 'var(--color-gold)' : '#71717A' }}
                />
            </button>
        );
    }

    const baseClasses = `flex items-center justify-between w-full px-4 py-3 transition duration-150 ${className}`;
    const activeClasses = isActive ? 'bg-[var(--color-gold-cream)] text-[var(--color-gold)] border-l-4 border-[var(--color-gold)]' : 'hover:bg-gray-50';

    return (
        <button
            className={`${baseClasses} ${activeClasses} active:bg-gray-100 active:scale-95 cursor-pointer outline-none relative`}
            onClick={handleClick}
            type="button"
            aria-label={label}
        >
            <div className="flex items-center flex-grow min-w-0 pointer-events-none">
                <Icon
                    name={iconName}
                    size={20}
                    className="mr-4 flex-shrink-0"
                    style={{ color: isActive || isGold ? 'var(--color-gold)' : '#71717A' }}
                />
                <span className="text-base font-medium whitespace-nowrap overflow-hidden text-ellipsis">{label}</span>
            </div>
            <div className="flex items-center space-x-2 flex-shrink-0 ml-4 pointer-events-none">
                {rightText && (
                    <span
                        className={`text-sm ${isBadge ? '' : 'text-gray-600 font-semibold'}`}
                        style={badgeStyle}
                    >
                        {rightText}
                    </span>
                )}
                {isPurpleDot && (
                    <div
                        className="w-2 h-2 rounded-full"
                        style={{ backgroundColor: 'var(--color-purple)' }}
                    ></div>
                )}
                <Icon name="moreHorizontal" size={16} className="text-gray-400 rotate-90 ml-1 flex-shrink-0" />
            </div>
        </button>
    );
};


const CollapsibleSectionHeader = ({ title, isExpanded, onToggle, collapsed }) => {
    return (
        <button
            className="w-full flex items-center justify-between px-6 pt-3 pb-2 text-xs font-semibold text-gray-400 uppercase tracking-wider hover:text-gray-600 transition-colors"
            onClick={onToggle}
            style={{
                paddingBottom: '0.5rem'
            }}
        >
            {!collapsed && <span>{title}</span>}
            <Icon
                name="chevronDown"
                size={14}
                className="transition-transform duration-200"
                style={{
                    transform: isExpanded ? 'rotate(0deg)' : 'rotate(-90deg)',
                    color: 'var(--color-accent, #CA8A04)'
                }}
            />
        </button>
    );
};


const SideDrawer = ({ isDrawerOpen, onClose, onOpenTheme, onOpenLanguage, currentLanguageFlag, onOpenCreator, navigateTo, selectedLanguage = 'English' }) => {
    const auth = useAuth();
    const navigate = useNavigate();
    const [collapsed, setCollapsed] = useState(() => {
        try {
            return localStorage.getItem('sidebarCollapsed') === '1';
        } catch (e) {
            return false;
        }
    });
    const [showStaffLogin, setShowStaffLogin] = useState(false);

    // State for collapsible sections
    const [expandedSections, setExpandedSections] = useState(() => {
        try {
            const saved = localStorage.getItem('sidebarExpandedSections');
            return saved ? JSON.parse(saved) : { account: false, library: false, create: false, general: true };
        } catch (e) {
            return { account: false, library: false, create: false, general: true };
        }
    });

    const toggleCollapsed = () => {
        try {
            const next = !collapsed;
            localStorage.setItem('sidebarCollapsed', next ? '1' : '0');
            setCollapsed(next);
        } catch (e) {
            setCollapsed(prev => !prev);
        }
    };

    const toggleSection = (section) => {
        const newState = { ...expandedSections, [section]: !expandedSections[section] };
        setExpandedSections(newState);
        try {
            localStorage.setItem('sidebarExpandedSections', JSON.stringify(newState));
        } catch (e) {
            console.warn('Failed to save section state', e);
        }
    };

    const requireAuthNavigate = (path) => {
        try {
            if (!auth?.user) return auth.openAuthModal();
            // navigateTo already closes miniplayer, no need to do it here
            navigateTo(path);
        } catch (e) {
            console.warn('requireAuthNavigate failed', e);
        }
    };

    return (
        <>
        {/* 1. Backdrop (Fades in/out) - Full page, starts at top */}
        <div
            className={`fixed z-[70] transition-opacity duration-300 ${isDrawerOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}
            style={{ backgroundColor: 'rgba(0, 0, 0, 0.4)', top: 0, left: 0, right: 0, bottom: 0 }}
            onClick={(e) => {
                if (e.target === e.currentTarget) {
                    onClose();
                }
            }}
            role="button"
            tabIndex={-1}
            onKeyDown={(e) => {
                if (e.key === 'Escape') onClose();
            }}
        >
            {/* 2. Drawer Content (Slides in/out) - Full height with safe area */}
            <div
                className={`fixed top-0 left-0 ${collapsed ? 'w-24' : 'w-80'} bg-white shadow-2xl transform transition-all duration-300 ease-out flex flex-col`}
                style={{ 
                    transform: isDrawerOpen ? 'translateX(0)' : 'translateX(-100%)',
                    top: '0px',
                    bottom: '0px',
                    height: '100vh',
                    maxWidth: '100vw',
                    paddingTop: 'env(safe-area-inset-top, 0px)',
                    paddingBottom: 'env(safe-area-inset-bottom, 0px)',
                    zIndex: 71,
                    overflowX: 'hidden'
                }}
                onClick={(e) => e.stopPropagation()}
            >
                {/* Drawer Header (Fixed) - Aligned with TopHeader height and padding */}
                <div className="flex items-center justify-between px-4 border-b border-gray-100 flex-shrink-0 bg-white" style={{ paddingTop: 'calc(12px + env(safe-area-inset-top, 0px))', paddingBottom: '12px', minHeight: '48px' }}>
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                        {/* Logo - External Image - Matching TopHeader size */}
                        <div className="flex-shrink-0 w-7 h-7 flex items-center justify-center">
                            <img src="https://i.postimg.cc/vThDvtvK/regaarder-logos-14-removebg-preview-removebg-preview.png" alt="Regaarder" className="w-full h-full object-contain" />
                        </div>
                        {/* Text always visible */}
                        <h2 className="text-sm font-bold whitespace-nowrap" style={{ color: '#868784' }}>REGAARDER</h2>
                    </div>
                    <div className="flex-shrink-0">
                        <button className="min-w-[44px] min-h-[44px] w-11 h-11 flex items-center justify-center rounded-lg p-1 hover:bg-gray-100 transition-colors" onClick={toggleCollapsed} aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}>
                            <Icon name={collapsed ? 'chevronRight' : 'chevronLeft'} size={18} className="text-gray-600 pointer-events-none" />
                        </button>
                    </div>
                </div>

                {/* Drawer Body (Scrollable - takes up remaining height with footer margin) */}
                <div className="relative overflow-y-auto flex-grow pt-0" style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}>

                    {/* Scroll fade overlays to indicate more content */}
                    <div className="absolute top-0 left-0 right-0 h-6 pointer-events-none bg-gradient-to-b from-white/80 to-transparent" />
                    <div className="absolute bottom-0 left-0 right-0 h-6 pointer-events-none bg-gradient-to-t from-white/80 to-transparent" />

                    {/* Account Section */}
                    <CollapsibleSectionHeader
                        title={getTranslation('Account', selectedLanguage)}
                        isExpanded={expandedSections.account}
                        onToggle={() => toggleSection('account')}
                        collapsed={collapsed}
                    />
                    {expandedSections.account && (
                        <>
                            {/* Protect personal/account routes behind auth */}
                            <DrawerItem iconName="profile" label={getTranslation('Your Profile', selectedLanguage)} onClick={() => { try { requireAuthNavigate('/yourprofile'); } catch (e) { console.warn('Navigation to yourprofile failed', e); } }} collapsed={collapsed} />
                            <DrawerItem iconName="requests" label={getTranslation('Your Requests', selectedLanguage)} onClick={() => { try { requireAuthNavigate('/yourrequests'); } catch (e) { console.warn('Navigation to yourrequests failed', e); } }} collapsed={collapsed} />
                            {/* Track Your Requests removed from sidebar */}
                            <DrawerItem iconName="subscriptions" label={getTranslation('Subscriptions', selectedLanguage)} onClick={() => { try { requireAuthNavigate('/subscriptions'); } catch (e) { console.warn('Navigation to subscriptions failed', e); } }} collapsed={collapsed} />
                            <DrawerItem iconName="referral" label={getTranslation('Referral Rewards', selectedLanguage)} rightText={`3 ${getTranslation('invites', selectedLanguage)} ${getTranslation('left', selectedLanguage)}`} isGold={true} onClick={() => { try { requireAuthNavigate('/referralrewards'); } catch (e) { console.warn('Navigation to referralrewards failed', e); } }} collapsed={collapsed} />
                            {/* Marketplace hidden temporarily */}
                        </>
                    )}

                    {/* Library Section */}
                    <CollapsibleSectionHeader
                        title={getTranslation('Library', selectedLanguage)}
                        isExpanded={expandedSections.library}
                        onToggle={() => toggleSection('library')}
                        collapsed={collapsed}
                    />
                    {expandedSections.library && (
                        <>
                            {/* Library items require auth because they contain personal user data */}
                            <DrawerItem iconName="bookmarks" label={getTranslation('Bookmarks', selectedLanguage)} onClick={() => { try { requireAuthNavigate('/bookmarks'); } catch (e) { console.warn('Navigation to bookmarks failed', e); } }} collapsed={collapsed} />
                            {/* Uses the History icon via iconName="history" */}
                            <DrawerItem iconName="history" label={getTranslation('Watch History', selectedLanguage)} onClick={() => { try { requireAuthNavigate('/watchhistory'); } catch (e) { console.warn('Navigation to watchhistory failed', e); } }} collapsed={collapsed} />
                            <DrawerItem iconName="heart" label={getTranslation('Liked Videos', selectedLanguage)} onClick={() => { try { requireAuthNavigate('/likedvideos'); } catch (e) { console.warn('Navigation to likedvideos failed', e); } }} className="mt-2" collapsed={collapsed} />
                            <DrawerItem iconName="listPlus" label={getTranslation('Playlist', selectedLanguage)} onClick={() => { try { requireAuthNavigate('/playlist'); } catch (e) { console.warn('Navigation to playlist failed', e); } }} collapsed={collapsed} />
                            <DrawerItem iconName="users" label={getTranslation('Watch Together', selectedLanguage)} isPurpleDot={true} onClick={() => { try { requireAuthNavigate('/watchtogether'); } catch (e) { console.warn('Navigation to watchtogether failed', e); } }} collapsed={collapsed} />
                        </>
                    )}


                    {/* Create Section */}
                    <CollapsibleSectionHeader
                        title={getTranslation('Create', selectedLanguage)}
                        isExpanded={expandedSections.create}
                        onToggle={() => toggleSection('create')}
                        collapsed={collapsed}
                    />
                    {expandedSections.create && (
                        <>
                            {auth && auth.user && auth.user.isCreator ? (
                                <button
                                    className="w-full flex items-center p-2 rounded-xl transition-shadow duration-300"
                                    style={{
                                        backgroundColor: 'var(--color-gold-cream)',
                                        boxShadow: '0 2px 6px var(--color-gold-light), inset 0 1px 0 rgba(255, 255, 255, 0.5)'
                                    }}
                                    onClick={() => { try { requireAuthNavigate('/creatordashboard'); } catch (e) { console.warn('Navigation to creatordashboard failed', e); } }}
                                >
                                    <div className="w-9 h-9 rounded-full flex items-center justify-center mr-3" style={{ backgroundColor: 'var(--color-gold)' }}>
                                        <Icon name="monitor" size={18} className="text-black" />
                                    </div>
                                    <div className="flex-1 text-left">
                                        <p className="font-bold text-sm text-gray-800">{getTranslation('Creator Dashboard', selectedLanguage)}</p>
                                        <p className="text-xs text-gray-600">{getTranslation('Manage your creator settings', selectedLanguage)}</p>
                                    </div>
                                    <Icon name="sparkles" size={18} className="ml-2" style={{ color: 'var(--color-gold)' }} />
                                </button>
                            ) : (
                                <button
                                    className="w-full flex items-center p-2 rounded-xl transition-shadow duration-300"
                                    style={{
                                        backgroundColor: 'var(--color-gold-cream)',
                                        boxShadow: '0 2px 6px var(--color-gold-light), inset 0 1px 0 rgba(255, 255, 255, 0.5)'
                                    }}
                                    onClick={() => {
                                        if (!auth?.user) return auth.openAuthModal();
                                        onOpenCreator && onOpenCreator();
                                    }}
                                >
                                    <div className="w-9 h-9 rounded-full flex items-center justify-center mr-3" style={{ backgroundColor: 'var(--color-gold)' }}>
                                        <Icon name="video" size={18} className="text-black" />
                                    </div>
                                    <div className="flex-1 text-left">
                                        <p className="font-bold text-sm text-gray-800">{getTranslation('Become a Creator', selectedLanguage)}</p>
                                        <p className="text-xs text-gray-600">{getTranslation('Start earning from videos', selectedLanguage)}</p>
                                    </div>
                                    <Icon name="sparkles" size={18} className="ml-2" style={{ color: 'var(--color-gold)' }} />
                                </button>
                            )}

                            {/* --- Upgrade to Premium Card --- */}
                            <button
                                className="w-full flex items-center p-2 rounded-xl transition-shadow duration-300 mt-3"
                                style={{
                                    backgroundColor: 'var(--color-gold-cream)',
                                    boxShadow: '0 2px 6px var(--color-gold-light), inset 0 1px 0 rgba(255, 255, 255, 0.5)'
                                }}
                                onClick={() => { try { requireAuthNavigate('/sponsorship'); } catch (err) { console.warn('Navigation to sponsorship failed', err); } }}
                            >
                                <div
                                    className="w-9 h-9 rounded-full flex items-center justify-center mr-3"
                                    style={{ backgroundColor: 'var(--color-gold)' }}
                                >
                                    <Icon name="crown" size={18} className="text-black" />
                                </div>

                                <div className="flex-1 text-left">
                                    <p className="font-bold text-sm text-gray-800">{getTranslation('Upgrade to Premium', selectedLanguage)}</p>
                                    <p className="text-xs text-gray-600">{getTranslation('Unlock all features', selectedLanguage)}</p>
                                </div>

                                <Icon name="sparkles" size={18} className="ml-2" style={{ color: 'var(--color-gold)' }} />
                            </button>
                        </>
                    )}

                    {/* General Settings */}
                    <CollapsibleSectionHeader
                        title={getTranslation('General', selectedLanguage)}
                        isExpanded={expandedSections.general}
                        onToggle={() => toggleSection('general')}
                        collapsed={collapsed}
                    />
                    {expandedSections.general && (
                        <div className="pt-2 w-full">
                            <DrawerItem iconName="language" label={getTranslation('Language', selectedLanguage)} rightText={currentLanguageFlag || '🇺🇸'} isGold={true} onClick={() => onOpenLanguage && onOpenLanguage()} collapsed={collapsed} />
                            <DrawerItem iconName="theme" label={getTranslation('Theme', selectedLanguage)} rightText={getTranslation('Light', selectedLanguage)} isGold={true} onClick={onOpenTheme} collapsed={collapsed} />
                            {/* Advertise with Us now uses the Sparkles icon */}
                            <DrawerItem iconName="sparkles" label={getTranslation('Advertise with Us', selectedLanguage)} isGold={true} onClick={() => { try { navigateTo('/advertisewithus'); } catch (e) { console.warn('Navigation to advertisewithus failed', e); } }} collapsed={collapsed} />
                            <DrawerItem iconName="policies" label={getTranslation('Policies', selectedLanguage)} isGold={true} onClick={() => { try { navigateTo('/policies'); } catch (e) { console.warn('Navigation to policies failed', e); } }} collapsed={collapsed} />
                            <DrawerItem iconName="shield" label={getTranslation('Staff', selectedLanguage)} isGold={true} onClick={() => setShowStaffLogin(true)} collapsed={collapsed} />
                        </div>
                    )}
                </div>
            </div>
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
        </>
    );
};

// NEW COMPONENT: Report Video Dialog (Redesigned)
const ReportVideoDialog = ({ video, videoTitle, onClose, selectedLanguage = 'English' }) => {
    const [reportText, setReportText] = useState('');
    const [evidenceFiles, setEvidenceFiles] = useState([]);
    const [uploadingFile, setUploadingFile] = useState(false);
    const fileInputRef = React.useRef(null);

    const handleFileSelect = (e) => {
        const files = Array.from(e.target.files || []);
        if (files.length > 0) {
            setUploadingFile(true);
            const newFiles = files.map(file => ({
                file,
                name: file.name,
                size: file.size,
                type: file.type,
                id: Math.random().toString(36).substr(2, 9)
            }));
            setEvidenceFiles([...evidenceFiles, ...newFiles]);
            setUploadingFile(false);
        }
        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    const removeFile = (id) => {
        setEvidenceFiles(evidenceFiles.filter(f => f.id !== id));
    };

    const handleSubmit = async () => {
        const BACKEND = (window && window.__BACKEND_URL__) || 'https://regaarder-pwin.onrender.com';
        const token = localStorage.getItem('regaarder_token');
        let reporter = null;
        try { reporter = JSON.parse(localStorage.getItem('regaarder_user') || '{}'); } catch (e) { }

        // Use FormData for file uploads
        const formData = new FormData();
        formData.append('videoId', (video && (video.id || video.videoId)) || '');
        formData.append('title', (video && video.title) || videoTitle || '');
        formData.append('reason', String(reportText || '').trim());
        formData.append('reporterId', reporter && (reporter.id || reporter.email) || '');
        formData.append('reporterEmail', reporter && reporter.email || '');
        formData.append('time', new Date().toISOString());

        // Append evidence files
        evidenceFiles.forEach(fileObj => {
            formData.append('evidenceFiles', fileObj.file);
        });

        try {
            await fetch(`${BACKEND}/reports`, {
                method: 'POST',
                headers: token ? { Authorization: `Bearer ${token}` } : {},
                body: formData
            }).catch(() => { });

            // Best-effort email alert to admin; ignore failures
            const emailBody = {
                to: 'regaarder@gmail.com',
                subject: `New report: ${payload.title || payload.videoId || 'Video'}`,
                text: `A new report was submitted.\n\nVideo: ${payload.title || ''} (ID: ${payload.videoId || 'n/a'})\nReason: ${payload.reason || 'n/a'}\nReporter: ${payload.reporterEmail || payload.reporterId || 'anonymous'}\nTime: ${payload.time}`
            };
            try {
                await fetch(`${BACKEND}/email/send`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        ...(token ? { Authorization: `Bearer ${token}` } : {})
                    },
                    body: JSON.stringify(emailBody)
                });
            } catch (e) {
                // Fallback: open mail client without exposing details in UI
                try {
                    const subj = encodeURIComponent(emailBody.subject);
                    const body = encodeURIComponent(emailBody.text);
                    window.open(`mailto:regaarder@gmail.com?subject=${subj}&body=${body}`, '_blank');
                } catch (_) { }
            }
        } finally {
            onClose();
        }
    };

    return (
        <div
            className="fixed inset-0 z-[999] flex items-center justify-center px-4 backdrop-blur-sm"
            style={{ backgroundColor: 'rgba(0,0,0,0.7)' }}
            onClick={onClose}
        >
            <div className="bg-white rounded-2xl w-full max-w-md p-6" onClick={(e) => e.stopPropagation()}>
                <div className="flex items-center justify-between mb-4">
                    <h3 className="text-xl font-bold text-gray-900">{getTranslation('Report Video', selectedLanguage)}</h3>
                    <button onClick={onClose} className="p-1 text-gray-500 hover:text-gray-700">
                        <Icon name="x" size={24} />
                    </button>
                </div>

                <p className="text-sm text-gray-600 mb-4">{getTranslation('Why are you reporting this?', selectedLanguage)}</p>

                <textarea
                    value={reportText}
                    onChange={(e) => setReportText(e.target.value)}
                    placeholder={getTranslation('Tell us why this content is inappropriate...', selectedLanguage)}
                    className="w-full h-32 px-4 py-3 bg-gray-100 rounded-lg text-gray-800 placeholder-gray-500 resize-none focus:outline-none focus:ring-2 focus:ring-gray-300 mb-4"
                />

                {/* File Upload Section */}
                <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        {getTranslation('Add evidence (optional)', selectedLanguage)}
                    </label>
                    <input
                        ref={fileInputRef}
                        type="file"
                        multiple
                        accept="image/*,.pdf"
                        onChange={handleFileSelect}
                        className="hidden"
                    />
                    <button
                        onClick={() => fileInputRef.current?.click()}
                        disabled={uploadingFile}
                        className="w-full py-2 border-2 border-dashed border-gray-300 rounded-lg text-gray-600 hover:border-gray-400 transition-colors"
                    >
                        {uploadingFile ? '📤 Uploading...' : '📎 Add files'}
                    </button>
                </div>

                {/* File List */}
                {evidenceFiles.length > 0 && (
                    <div className="mb-4 max-h-32 overflow-y-auto">
                        {evidenceFiles.map(fileObj => (
                            <div key={fileObj.id} className="flex items-center justify-between bg-gray-50 p-2 rounded mb-2">
                                <div className="flex-1 min-w-0">
                                    <p className="text-xs font-medium text-gray-700 truncate">{fileObj.name}</p>
                                    <p className="text-xs text-gray-500">{(fileObj.size / 1024).toFixed(1)} KB</p>
                                </div>
                                <button
                                    onClick={() => removeFile(fileObj.id)}
                                    className="ml-2 text-gray-400 hover:text-red-500 transition-colors"
                                >
                                    ✕
                                </button>
                            </div>
                        ))}
                    </div>
                )}

                <button
                    onClick={handleSubmit}
                    disabled={!reportText.trim()}
                    className="w-full py-3 rounded-lg text-white font-semibold transition-colors hover:opacity-90 disabled:opacity-50"
                    style={{ backgroundColor: '#E57373' }}
                >
                    {getTranslation('Submit', selectedLanguage)}
                </button>
            </div>
        </div>
    );
};

// NEW COMPONENT: Profile Dialog
const ProfileDialog = ({ name, username, isCreator = false, onClose, profileData = null, creatorId = null, selectedLanguage = 'English' }) => {
    // Get current year for default joined date
    const currentYear = new Date().getFullYear();
    const navigate = useNavigate();
    const auth = useAuth();
    const [isFollowing, setIsFollowing] = useState(false);
    const [followActive, setFollowActive] = useState(false);
    const [requestActive, setRequestActive] = useState(false);
    const [loadedProfileData, setLoadedProfileData] = useState(null);
    const [resolvedCreatorId, setResolvedCreatorId] = useState(null);
    const BACKEND = (window && window.__BACKEND_URL__) || 'https://regaarder-pwin.onrender.com';

    // Normalize uploaded: prefix to full backend URL and fix http→https
    const normalizeProfileImageUrl = (url) => {
        if (!url) return null;
        let s = String(url);
        if (s.startsWith('uploaded:')) {
            const filename = s.split(':')[1] || s.slice('uploaded:'.length);
            return `${BACKEND}/uploads/${filename}`;
        }
        // Fix http → https for backend URLs
        if (s.startsWith('http://') && s.includes('onrender.com')) {
            s = s.replace('http://', 'https://');
        }
        return s;
    };

    // Fetch user profile data to get avatar if not already provided
    useEffect(() => {
        if (profileData && profileData.avatar) {
            setLoadedProfileData({ ...profileData, avatar: normalizeProfileImageUrl(profileData.avatar) });
            return;
        }

        const fetchUserProfile = async () => {
            try {
                const targetId = creatorId || username || name;
                if (!targetId) return;

                // Use /users/:id (which works reliably) instead of /users list
                const response = await fetch(`${BACKEND}/users/${encodeURIComponent(targetId)}`);
                if (!response.ok) {
                    setLoadedProfileData(profileData);
                    return;
                }
                const result = await response.json();
                const user = result.user || result;

                if (user && !user.isPlaceholder) {
                    // Store the resolved canonical ID for follow/unfollow
                    setResolvedCreatorId(user.id || user.email);
                    const rawImg = user.image || user.avatar || user.photoURL || user.profilePicture || null;
                    setLoadedProfileData({
                        ...profileData,
                        avatar: normalizeProfileImageUrl(rawImg),
                        bio: user.bio || user.description || (profileData && profileData.bio) || null,
                        stats: {
                            videos: user.videosCount || (user.videos && Array.isArray(user.videos) ? user.videos.length : 0) || (profileData && profileData.stats && profileData.stats.videos) || 0,
                            requests: user.requestsCompleted || user.fulfilled || (profileData && profileData.stats && profileData.stats.requests) || 0,
                            followers: user.followers || user.followers_count || 0,
                            following: user.followingCount || (Array.isArray(user.following) ? user.following.length : 0) || 0
                        },
                        joinedDate: user.joinedDate || user.createdAt || user.created_at || (profileData && profileData.joinedDate) || new Date().getFullYear()
                    });
                } else {
                    // If not found by first ID, try other identifiers
                    const alternateIds = [username, name, creatorId].filter(x => x && x !== targetId);
                    for (const altId of alternateIds) {
                        try {
                            const altRes = await fetch(`${BACKEND}/users/${encodeURIComponent(altId)}`);
                            if (altRes.ok) {
                                const altResult = await altRes.json();
                                const altUser = altResult.user || altResult;
                                if (altUser && !altUser.isPlaceholder) {
                                    setResolvedCreatorId(altUser.id || altUser.email);
                                    const rawImg2 = altUser.image || altUser.avatar || altUser.photoURL || null;
                                    setLoadedProfileData({
                                        ...profileData,
                                        avatar: normalizeProfileImageUrl(rawImg2),
                                        bio: altUser.bio || (profileData && profileData.bio) || null,
                                        stats: {
                                            videos: altUser.videosCount || 0,
                                            requests: altUser.requestsCompleted || 0,
                                            followers: altUser.followers || altUser.followers_count || 0,
                                            following: altUser.followingCount || (Array.isArray(altUser.following) ? altUser.following.length : 0) || 0
                                        },
                                        joinedDate: altUser.joinedDate || altUser.createdAt || altUser.created_at || new Date().getFullYear()
                                    });
                                    return; // Found it
                                }
                            }
                        } catch (e) { /* try next */ }
                    }
                    setLoadedProfileData(profileData);
                }
            } catch (err) {
                console.error('Error fetching user profile:', err);
                setLoadedProfileData(profileData);
            }
        };

        fetchUserProfile();
    }, [creatorId, username, name, profileData, BACKEND]);

    // Use real data if provided, otherwise use placeholder data
    const initialData = loadedProfileData || profileData || {
        avatar: null,
        bio: isCreator ? getTranslation('Creating engaging content for you', selectedLanguage) : getTranslation('Enjoying great content', selectedLanguage),
        stats: {
            videos: isCreator ? 24 : 0,
            requests: 12,
            followers: 1245,
            following: 180
        },
        verified: false,
        joinedDate: currentYear // Will show 2026 for new users
    };

    // Local state for follower count so it updates when following
    const [followerCount, setFollowerCount] = useState(initialData.stats.followers);

    // Check if already following this creator and get real follower count
    useEffect(() => {
        const checkFollowStatus = async () => {
            if (!creatorId && !username && !name) return;

            const targetId = creatorId || username || name;
            const token = localStorage.getItem('regaarder_token');

            try {
                // Resolve creator real ID using /users/:id (which works reliably)
                let resolvedCreator = null;
                const lookupIds = [targetId, username, name, creatorId].filter(Boolean);
                for (const lookupId of [...new Set(lookupIds)]) {
                    try {
                        const resp = await fetch(`${BACKEND}/users/${encodeURIComponent(lookupId)}`);
                        if (resp.ok) {
                            const data = await resp.json();
                            const u = data.user || data;
                            if (u && !u.isPlaceholder) {
                                resolvedCreator = u;
                                break;
                            }
                        }
                    } catch (e) { /* try next */ }
                }

                // 1) Check if we're following this creator using canonical creator.id
                if (resolvedCreator && resolvedCreator.id) {
                    // Also store resolved ID for follow/unfollow buttons
                    setResolvedCreatorId(resolvedCreator.id);
                    // Update follower count from resolved data
                    const realFollowers = resolvedCreator.followers || resolvedCreator.followers_count || 0;
                    if (realFollowers > 0) setFollowerCount(realFollowers);

                    try {
                        const followingResponse = await fetch(`${BACKEND}/following/${encodeURIComponent(resolvedCreator.id)}`, {
                            headers: {
                                'Authorization': token ? `Bearer ${token}` : ''
                            }
                        });
                        if (followingResponse.ok) {
                            const { isFollowing: followStatus } = await followingResponse.json();
                            setIsFollowing(!!followStatus);
                        } else {
                            // Fallback: check localStorage for local follow state
                            const followKey = `regaarder_following_${resolvedCreator.id}`;
                            if (localStorage.getItem(followKey) === '1') {
                                setIsFollowing(true);
                            }
                        }
                    } catch (e) {
                        console.warn('Error checking follow status:', e);
                        // Fallback: check localStorage for local follow state
                        try {
                            const followKey = `regaarder_following_${resolvedCreator.id}`;
                            if (localStorage.getItem(followKey) === '1') {
                                setIsFollowing(true);
                            }
                        } catch (le) { /* noop */ }
                    }
                } else {
                    // No resolved creator — check localStorage with raw targetId
                    try {
                        const followKey = `regaarder_following_${targetId}`;
                        if (localStorage.getItem(followKey) === '1') {
                            setIsFollowing(true);
                        }
                    } catch (le) { /* noop */ }
                }
            } catch (err) {
                console.error('Error checking follow status:', err);
            }
        };

        checkFollowStatus();
    }, [creatorId, username, name, BACKEND]);

    // Update data with current follower count — sanitize all fields to prevent
    // "Objects are not valid as a React child" crash when backend returns unexpected types
    const rawData = {
        ...initialData,
        stats: {
            ...initialData.stats,
            followers: followerCount
        }
    };
    const data = {
        ...rawData,
        bio: (rawData.bio && typeof rawData.bio === 'string') ? rawData.bio : (rawData.bio && typeof rawData.bio !== 'object' ? String(rawData.bio) : null),
        joinedDate: (typeof rawData.joinedDate === 'string' || typeof rawData.joinedDate === 'number') ? rawData.joinedDate : '',
        stats: {
            videos: Number(rawData.stats?.videos) || 0,
            requests: Number(rawData.stats?.requests) || 0,
            followers: Number(rawData.stats?.followers) || 0,
            following: Number(rawData.stats?.following) || 0,
        }
    };

    return (
        <div className="fixed inset-0 z-[999] flex items-center justify-center px-4" style={{ backgroundColor: 'rgba(0,0,0,0.6)' }} onClick={onClose}>
            <div className="bg-white rounded-2xl w-full max-w-md overflow-hidden shadow-2xl" onClick={(e) => e.stopPropagation()}>
                {/* Header with gradient background */}
                <div className="relative h-24" style={{ background: 'linear-gradient(135deg, rgba(203,138,0,0.1) 0%, rgba(203,138,0,0.05) 100%)' }}>
                </div>

                {/* Profile content */}
                <div className="px-6 pb-6 -mt-12">
                    {/* Avatar */}
                    <div className="relative inline-block">
                        <div
                            className="w-24 h-24 rounded-full border-4 border-white shadow-lg flex items-center justify-center overflow-hidden"
                            style={{ background: data.avatar ? 'transparent' : 'linear-gradient(135deg, #e5e7eb 0%, #f3f4f6 100%)' }}
                        >
                            {data.avatar ? (
                                <img src={data.avatar} alt={name} className="w-full h-full object-cover" />
                            ) : (
                                <Icon name="profile" size={48} className="text-gray-400" />
                            )}
                        </div>
                        {isCreator && data.verified && (
                            <div
                                className="absolute bottom-0 right-0 w-7 h-7 rounded-full border-2 border-white flex items-center justify-center shadow-md"
                                style={{ backgroundColor: 'var(--color-gold)' }}
                            >
                                <Icon name="check" size={14} className="text-white" />
                            </div>
                        )}
                    </div>

                    {/* Name and username */}
                    <div className="mt-4">
                        <div className="flex items-center gap-2">
                            <h3 className="text-2xl font-bold text-gray-900">{name}</h3>
                            {isCreator && (
                                <div
                                    className="px-2 py-0.5 rounded-full text-xs font-semibold text-white"
                                    style={{ backgroundColor: 'var(--color-gold)' }}
                                >
                                    {getTranslation('Creator', selectedLanguage)}
                                </div>
                            )}
                        </div>
                        <p className="text-sm text-gray-500 mt-1">@{username || name.replace(/\s+/g, '').toLowerCase()}</p>
                    </div>

                    {/* Bio */}
                    {data.bio && (
                        <p className="text-sm text-gray-600 mt-3 leading-relaxed">{data.bio}</p>
                    )}

                    {/* Stats */}
                    <div className="grid grid-cols-3 gap-4 mt-6 py-4 border-y border-gray-100">
                        {isCreator && (
                            <div className="text-center">
                                <div className="text-xl font-bold text-gray-900">{data.stats.videos}</div>
                                <div className="text-xs text-gray-500 mt-1">{getTranslation('Videos', selectedLanguage)}</div>
                            </div>
                        )}
                        <div className="text-center">
                            <div className="text-xl font-bold text-gray-900">{data.stats.requests}</div>
                            <div className="text-xs text-gray-500 mt-1">{isCreator ? getTranslation('Fulfilled', selectedLanguage) : getTranslation('Requested', selectedLanguage)}</div>
                        </div>
                        <div className="text-center">
                            <div className="text-xl font-bold text-gray-900">{data.stats.followers >= 1000 ? `${(data.stats.followers / 1000).toFixed(1)}k` : data.stats.followers}</div>
                            <div className="text-xs text-gray-500 mt-1">{getTranslation('Followers', selectedLanguage)}</div>
                        </div>
                    </div>

                    {/* Action buttons */}
                    <div className="mt-6 space-y-3 flex flex-col">
                        {isFollowing ? (
                            <button
                                onClick={async (e) => {
                                    e.stopPropagation();
                                    setFollowActive(true);

                                    try {
                                        // Call backend to unfollow — use resolvedCreatorId for reliable matching
                                        const token = localStorage.getItem('regaarder_token');
                                        const targetId = resolvedCreatorId || creatorId || username || name;

                                        const response = await fetch(`${BACKEND}/unfollow`, {
                                            method: 'POST',
                                            headers: {
                                                'Content-Type': 'application/json',
                                                'Authorization': token ? `Bearer ${token}` : ''
                                            },
                                            body: JSON.stringify({ creatorId: targetId })
                                        });

                                        if (response.ok) {
                                            setTimeout(() => {
                                                setIsFollowing(false);
                                                setFollowerCount(prev => Math.max(0, prev - 1));
                                                setFollowActive(false);
                                                try { localStorage.removeItem(`regaarder_following_${targetId}`); } catch (e) { /* noop */ }
                                            }, 150);
                                        } else {
                                            const errorData = await response.json().catch(() => ({}));
                                            console.error('Unfollow failed:', response.status, errorData);
                                            // Optimistic local unfollow
                                            setIsFollowing(false);
                                            setFollowerCount(prev => Math.max(0, prev - 1));
                                            setFollowActive(false);
                                            try { localStorage.removeItem(`regaarder_following_${targetId}`); } catch (e) { /* noop */ }
                                        }
                                    } catch (err) {
                                        console.error('Unfollow error:', err);
                                        // Optimistic local unfollow
                                        setIsFollowing(false);
                                        setFollowerCount(prev => Math.max(0, prev - 1));
                                        setFollowActive(false);
                                        try {
                                            const targetId = resolvedCreatorId || creatorId || username || name;
                                            localStorage.removeItem(`regaarder_following_${targetId}`);
                                        } catch (e) { /* noop */ }
                                    }
                                }}
                                className={`w-full py-3 rounded-xl font-semibold border-2 transition-all duration-150 hover:bg-gray-50`}
                                style={{
                                    borderColor: 'var(--color-gold)',
                                    color: 'var(--color-gold)',
                                    transform: followActive ? 'scale(0.95)' : 'scale(1)',
                                    opacity: followActive ? 0.9 : 1
                                }}
                            >
                                {getTranslation('Following', selectedLanguage)}
                            </button>
                        ) : (
                            <button
                                onClick={async (e) => {
                                    e.stopPropagation();
                                    setFollowActive(true);

                                    try {
                                        // Call backend to follow — use resolvedCreatorId for reliable matching
                                        const token = localStorage.getItem('regaarder_token');
                                        const targetId = resolvedCreatorId || creatorId || username || name;

                                        console.log('Following:', { targetId, resolvedCreatorId, creatorId, username, name });

                                        const response = await fetch(`${BACKEND}/follow`, {
                                            method: 'POST',
                                            headers: {
                                                'Content-Type': 'application/json',
                                                'Authorization': token ? `Bearer ${token}` : ''
                                            },
                                            body: JSON.stringify({ creatorId: targetId })
                                        });

                                        if (response.ok) {
                                            setTimeout(() => {
                                                setIsFollowing(true);
                                                setFollowerCount(prev => prev + 1);
                                                setFollowActive(false);
                                                // Persist follow state locally so it survives navigation
                                                try {
                                                    const followKey = `regaarder_following_${targetId}`;
                                                    localStorage.setItem(followKey, '1');
                                                } catch (e) { /* noop */ }
                                            }, 150);
                                        } else {
                                            // Backend failed — still persist locally for UX
                                            const errorData = await response.json().catch(() => ({}));
                                            console.error('Follow failed:', response.status, errorData);
                                            // Optimistic local follow so button feels responsive
                                            setIsFollowing(true);
                                            setFollowerCount(prev => prev + 1);
                                            setFollowActive(false);
                                            try {
                                                const followKey = `regaarder_following_${targetId}`;
                                                localStorage.setItem(followKey, '1');
                                            } catch (e) { /* noop */ }
                                        }
                                    } catch (err) {
                                        console.error('Follow error:', err);
                                        setFollowActive(false);
                                    }
                                }}
                                className={`w-full py-3 rounded-xl font-semibold text-white transition-all duration-150 hover:opacity-90 shadow-md`}
                                style={{
                                    backgroundColor: 'var(--color-gold)',
                                    boxShadow: '0 4px 12px rgba(203, 138, 0, 0.3)',
                                    transform: followActive ? 'scale(0.95)' : 'scale(1)',
                                    opacity: followActive ? 0.9 : 1
                                }}
                            >
                                {getTranslation('Follow', selectedLanguage)}
                            </button>
                        )}
                        {isCreator && (
                            <div className="px-3">
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        setRequestActive(true);
                                        setTimeout(() => {
                                            // Store creator data in localStorage for ideas page
                                            const creatorData = {
                                                id: resolvedCreatorId || creatorId || username || name,
                                                name: name,
                                                handle: username,
                                                displayName: name,
                                                photoURL: loadedProfileData?.avatar || null,
                                                image: loadedProfileData?.avatar || null
                                            };
                                            try {
                                                localStorage.setItem('ideas_selectedCreator_v1', JSON.stringify(creatorData));
                                            } catch (err) {
                                                console.error('Error saving creator to localStorage:', err);
                                            }
                                            onClose();
                                            navigate('/ideas');
                                        }, 150);
                                    }}
                                    className={`w-full py-3 rounded-xl border-2 font-semibold transition-all duration-150 hover:bg-gray-50`}
                                    style={{
                                        borderColor: 'var(--color-gold)',
                                        color: 'var(--color-gold)',
                                        transform: requestActive ? 'scale(0.95)' : 'scale(1)',
                                        opacity: requestActive ? 0.9 : 1
                                    }}
                                >
                                    {getTranslation('Request Video', selectedLanguage)}
                                </button>
                            </div>
                        )}
                    </div>

                    {/* Joined date */}
                    <div className="mt-6 text-center">
                        <p className="text-xs text-gray-400">{getTranslation('Member since', selectedLanguage)} {data.joinedDate}</p>
                    </div>

                    {/* View Full Profile link */}
                    {isCreator && (
                        <div className="mt-4 text-center">
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    const profileId = resolvedCreatorId || creatorId || username || name;
                                    const profileHandle = username || name;
                                    navigate(`/creatorprofile?id=${encodeURIComponent(profileId)}&handle=${encodeURIComponent(profileHandle)}&shared=true`);
                                }}
                                className="text-sm font-medium hover:underline transition-colors"
                                style={{ color: 'var(--color-gold)' }}
                            >
                                {getTranslation('View Full Profile', selectedLanguage)}
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

// NEW COMPONENT: Pin To Top Dialog
const PinToTopDialog = ({ onClose, onPin }) => (
    <div className="fixed inset-0 z-[999] flex items-center justify-center px-4" style={{ backgroundColor: 'rgba(0,0,0,0.6)' }} onClick={onClose}>
        <div className="bg-white rounded-xl w-full max-w-sm p-6" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Pin to Top</h3>
            <p className="text-sm text-gray-600 mb-4">Select duration to pin this video:</p>
            <div className="grid grid-cols-3 gap-3 mb-6">
                {[1, 7, 30].map((days) => (
                    <button key={days} className="flex flex-col items-center justify-center p-3 border border-gray-200 rounded-xl hover:border-yellow-500 hover:bg-yellow-50 transition-colors" onClick={() => { onPin(days); onClose(); }}>
                        <span className="text-xl font-bold text-gray-800">{days}</span>
                        <span className="text-xs text-gray-500">Days</span>
                    </button>
                ))}
            </div>
            <button onClick={onClose} className="w-full py-3 rounded-lg bg-gray-100 text-gray-600 font-semibold">Cancel</button>
        </div>
    </div>
);

// NEW COMPONENT: Playlist Picker Dialog
const PlaylistPickerDialog = ({ video, onClose, onAdded, selectedLanguage = 'English' }) => {
    const [lists, setLists] = useState([]);
    const [name, setName] = useState('');
    const [err, setErr] = useState('');

    useEffect(() => { (async () => { try { const mod = await import('./playlists.jsx'); setLists(mod.getPlaylists()); } catch (e) { } })(); }, []);

    const handleSelect = async (id) => {
        try { const mod = await import('./playlists.jsx'); mod.addToPlaylist(id, video); setLists(mod.getPlaylists()); onAdded && onAdded(); onClose(); } catch (e) { onClose(); }
    };
    const handleCreate = async () => {
        const n = String(name || '').trim();
        if (!n) { setErr(getTranslation('Please enter a name', selectedLanguage)); return; }
        try { const mod = await import('./playlists.jsx'); const p = mod.ensurePlaylist(n); mod.addToPlaylist(p.id, video); setLists(mod.getPlaylists()); onAdded && onAdded(); onClose(); } catch (e) { onClose(); }
    };

    return (
        <div className="fixed inset-0 z-[999] flex items-center justify-center px-4" style={{ backgroundColor: 'rgba(0,0,0,0.6)' }} onClick={onClose}>
            <div className="bg-white rounded-2xl w-full max-w-md p-6" onClick={(e) => e.stopPropagation()}>
                <div className="flex items-center justify-between mb-2">
                    <h3 className="text-lg font-semibold text-gray-900">{getTranslation('Add to Playlist', selectedLanguage)}</h3>
                    <button className="p-1 text-gray-500 hover:text-gray-700" onClick={onClose}>✕</button>
                </div>
                {lists.length > 0 ? (
                    <div className="grid grid-cols-3 gap-2 mb-3">
                        {lists.map((l) => {
                            const thumb = (l.items && l.items[0] && (l.items[0].thumbnail || l.items[0].imageUrl)) || 'https://placehold.co/160x90/efefef/777?text=Playlist';
                            return (
                                <button key={l.id} className="w-full text-left bg-white rounded-lg border border-gray-200 overflow-hidden hover:border-gray-300" onClick={() => handleSelect(l.id)}>
                                    <div className="w-full pb-[50%] relative">
                                        <img src={thumb} alt={l.name} className="absolute inset-0 w-full h-full object-cover" onError={(e) => { e.currentTarget.src = 'https://placehold.co/160x90/efefef/777?text=Playlist'; }} />
                                    </div>
                                    <div className="px-2 py-1">
                                        <div className="text-[11px] font-semibold text-gray-900 truncate">{l.name}</div>
                                        <div className="text-[10px] text-gray-500 flex items-center gap-1 mt-0.5">
                                            <span>{getTranslation('Private', selectedLanguage)}</span>
                                            <span>•</span>
                                            <span>{(l.items || []).length}</span>
                                            <Icon name="bookmark" size={12} className="ml-auto text-gray-400" />
                                        </div>
                                    </div>
                                </button>
                            );
                        })}
                    </div>
                ) : (
                    <div className="text-sm text-gray-600 mb-2">{getTranslation('No playlists yet. Create one below.', selectedLanguage)}</div>
                )}
                <label className="text-sm text-gray-700">{getTranslation('New playlist name', selectedLanguage)}</label>
                <input value={name} onChange={(e) => { setName(e.target.value); setErr(''); }} placeholder={getTranslation('My Playlist', selectedLanguage)} className="mt-1 w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-md outline-none" />
                {err && <div className="text-xs text-red-600 mt-1">{err}</div>}
                <div className="mt-4 flex justify-end gap-2">
                    <button className="px-3 py-2 text-sm text-gray-700" onClick={onClose}>{getTranslation('Cancel', selectedLanguage)}</button>
                    <button className="px-3 py-2 text-sm text-white rounded-md" style={{ backgroundColor: 'var(--color-gold)' }} onClick={handleCreate}>{getTranslation('Create', selectedLanguage)}</button>
                </div>
            </div>
        </div>
    );
};

// NEW COMPONENT: Theme Dialog
const ThemeDialog = ({ onClose, selectedTheme, onThemeChange, accentColor, onOpenColorPicker }) => {
    const selectedLanguage = (typeof window !== 'undefined') ? window.localStorage.getItem('regaarder_language') || 'English' : 'English';
    const themes = [
        { id: 'Light', icon: 'sun', title: getTranslation('Light', selectedLanguage), description: getTranslation('Bright and clear interface', selectedLanguage) },
        { id: 'Dark', icon: 'moon', title: getTranslation('Dark', selectedLanguage), description: getTranslation('Easy on the eyes in low light', selectedLanguage) },
        { id: 'System', icon: 'monitor', title: getTranslation('System', selectedLanguage), description: getTranslation('Matches your device settings', selectedLanguage) },
    ];

    const ThemeOption = ({ theme, isSelected, onClick }) => (
        <button
            onClick={onClick}
            className={`w-full flex items-center justify-between p-4 rounded-xl transition-all ${isSelected
                ? 'text-gray-900'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
            style={isSelected ? { backgroundColor: 'var(--color-gold)' } : {}}
        >
            <div className="flex items-center">
                <div
                    className={`w-12 h-12 rounded-full flex items-center justify-center mr-4 ${isSelected ? 'bg-white bg-opacity-30' : 'bg-white'
                        }`}
                >
                    <Icon
                        name={theme.icon === 'sun' ? 'sun' : theme.icon === 'moon' ? 'moon' : 'monitor'}
                        size={24}
                        className={isSelected ? 'text-gray-900' : 'text-gray-600'}
                    />
                </div>
                <div className="text-left">
                    <div className={`font-semibold ${isSelected ? 'text-gray-900' : 'text-gray-800'}`}>
                        {theme.title}
                    </div>
                    <div className={`text-sm ${isSelected ? 'text-gray-800' : 'text-gray-500'}`}>
                        {theme.description}
                    </div>
                </div>
            </div>
            {isSelected && (
                <Icon name="check" size={24} className="text-gray-900" />
            )}
        </button>
    );

    return (
        <div
            className="fixed inset-0 z-[999] flex items-center justify-center px-4"
            style={{ backgroundColor: 'rgba(0,0,0,0.6)' }}
            onClick={onClose}
        >
            <div className="bg-white rounded-2xl w-full max-w-md p-6" onClick={(e) => e.stopPropagation()}>
                {/* derive language at render time to avoid relying on an outer variable */}
                {(() => {
                    const selLang = (typeof window !== 'undefined') ? window.localStorage.getItem('regaarder_language') || 'English' : 'English'; return (
                        <>
                            <div className="flex items-center justify-between mb-2">
                                <div className="flex items-center">
                                    <Icon name="palette" size={24} className="mr-2" style={{ color: 'var(--color-gold)' }} />
                                    <h3 className="text-xl font-bold text-gray-900">{getTranslation('Choose Your Theme', selLang)}</h3>
                                </div>
                                <button onClick={onClose} className="p-1 text-gray-500 hover:text-gray-700">
                                    <Icon name="x" size={24} />
                                </button>
                            </div>

                            <p className="text-sm text-gray-600 mb-6">{getTranslation('Select how Regaarder looks on your device', selLang)}</p>

                            <div className="space-y-3 mb-6">
                                {themes.map((theme) => (
                                    <ThemeOption
                                        key={theme.id}
                                        theme={theme}
                                        isSelected={selectedTheme === theme.id}
                                        onClick={() => onThemeChange(theme.id)}
                                    />
                                ))}
                            </div>

                            <div className="border-t border-gray-200 pt-4 mb-4">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <div className="font-semibold text-gray-900">{getTranslation('Accent Color', selLang)}</div>
                                        <div className="text-sm text-gray-600">{getTranslation("Customize the app's highlight color", selLang)}</div>
                                    </div>
                                    <button
                                        onClick={onOpenColorPicker}
                                        className="w-12 h-12 rounded-lg hover:opacity-80 transition-opacity cursor-pointer"
                                        style={{ backgroundColor: accentColor }}
                                    ></button>
                                </div>
                            </div>
                        </>
                    )
                })()}

                <button
                    onClick={onClose}
                    className="w-full py-3 rounded-lg bg-gray-100 text-gray-700 font-semibold hover:bg-gray-200 transition-colors"
                >
                    {getTranslation('Close', selectedLanguage)}
                </button>
            </div>
        </div>
    );
};



// NEW COMPONENT: Accent Color Picker Dialog
const AccentColorDialog = ({ onClose, currentColor, onColorChange }) => {
    const [selectedColor, setSelectedColor] = useState(currentColor);
    const [hexInput, setHexInput] = useState(currentColor);
    const selectedLanguage = (typeof window !== 'undefined') ? window.localStorage.getItem('regaarder_language') || 'English' : 'English';

    const presetColors = [
        '#CB8A00', // Gold (default)
        '#FF5722', // Orange
        '#E53935', // Red
        '#E91E63', // Pink
        '#9C27B0', // Purple
        '#2196F3', // Blue
        '#00ACC1', // Cyan
        '#009688', // Teal
        '#689F38', // Light Green
        '#8BC34A', // Lime
        '#FDD835', // Yellow
        '#FF9800', // Amber
    ];

    const handleColorSelect = (color) => {
        setSelectedColor(color);
        setHexInput(color);
    };

    const handleHexChange = (e) => {
        const value = e.target.value;
        setHexInput(value);
        // Validate hex color
        if (/^#[0-9A-F]{6}$/i.test(value)) {
            setSelectedColor(value);
        }
    };

    const handleDone = () => {
        onColorChange(selectedColor);
        onClose();
    };

    const handleReset = () => {
        const defaultColor = '#CB8A00';
        setSelectedColor(defaultColor);
        setHexInput(defaultColor);
    };

    return (
        <div
            className="fixed inset-0 z-[999] flex items-center justify-center px-4"
            style={{ backgroundColor: 'rgba(0,0,0,0.6)' }}
            onClick={onClose}
        >
            <div className="bg-white rounded-2xl w-full max-w-md p-6" onClick={(e) => e.stopPropagation()}>
                <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center">
                        <Icon name="palette" size={24} className="mr-2" style={{ color: selectedColor }} />
                        <h3 className="text-xl font-bold text-gray-900">{getTranslation('Customize Accent Color', selectedLanguage)}</h3>
                    </div>
                    <button onClick={onClose} className="p-1 text-gray-500 hover:text-gray-700">
                        <Icon name="x" size={24} />
                    </button>
                </div>

                <p className="text-sm text-gray-600 mb-6">{getTranslation('Choose your preferred highlight color', selectedLanguage)}</p>

                {/* Pick a Color Section */}
                <div className="mb-6">
                    <h4 className="text-base font-semibold text-gray-900 mb-3">{getTranslation('Pick a Color', selectedLanguage)}</h4>
                    <div className="flex items-center gap-4">
                        <div
                            className="w-24 h-24 rounded-xl border-2 border-gray-200"
                            style={{ backgroundColor: selectedColor }}
                        ></div>
                        <div className="flex-1">
                            <input
                                type="text"
                                value={hexInput}
                                onChange={handleHexChange}
                                className="w-full px-4 py-3 bg-gray-100 rounded-lg text-gray-800 font-mono text-sm focus:outline-none focus:ring-2 focus:ring-gray-300"
                                placeholder="#ca8a04"
                            />
                            <p className="text-xs text-gray-500 mt-2">{getTranslation('Current', selectedLanguage)}: {selectedColor}</p>
                        </div>
                    </div>
                </div>

                {/* Quick Presets */}
                <div className="mb-6">
                    <h4 className="text-base font-semibold text-gray-900 mb-3">{getTranslation('Quick Presets', selectedLanguage)}</h4>
                    <div className="grid grid-cols-6 gap-3">
                        {presetColors.map((color) => (
                            <button
                                key={color}
                                onClick={() => handleColorSelect(color)}
                                className={`w-full aspect-square rounded-xl transition-all ${selectedColor === color ? 'ring-4 ring-gray-900 ring-offset-2' : 'hover:scale-110'
                                    }`}
                                style={{ backgroundColor: color }}
                            />
                        ))}
                    </div>
                </div>

                {/* Preview Section */}
                <div className="mb-6 bg-gray-100 rounded-xl p-4">
                    <h4 className="text-sm font-semibold text-gray-700 mb-3">{getTranslation('Preview', selectedLanguage)}</h4>
                    <div className="flex gap-3">
                        <button
                            className="flex-1 py-3 rounded-lg text-white font-semibold"
                            style={{ backgroundColor: selectedColor }}
                        >
                            {getTranslation('Primary Button', selectedLanguage)}
                        </button>
                        <button
                            className="flex-1 py-3 rounded-lg font-semibold"
                            style={{
                                backgroundColor: 'transparent',
                                border: `2px solid ${selectedColor}`,
                                color: selectedColor
                            }}
                        >
                            {getTranslation('Secondary Button', selectedLanguage)}
                        </button>
                    </div>
                </div>

                {/* Done Button */}
                <button
                    onClick={handleDone}
                    className="w-full py-3 rounded-lg text-white font-semibold mb-3 hover:opacity-90 transition-opacity"
                    style={{ backgroundColor: selectedColor }}
                >
                    {getTranslation('Done', selectedLanguage)}
                </button>

                {/* Reset to Default */}
                <button
                    onClick={handleReset}
                    className="w-full py-3 text-gray-500 font-semibold hover:text-gray-700 transition-colors"
                >
                    {getTranslation('Reset to Default', selectedLanguage)}
                </button>
            </div>
        </div>
    );
};

// NEW COMPONENT: Toast Notification (top-centered)
const Toast = ({ show, type = 'info', title, message, onClose }) => {
    const [swipeOffset, setSwipeOffset] = useState(0);
    const [isDismissing, setIsDismissing] = useState(false);
    const dragStartX = useRef(0);
    const toastRef = useRef(null);

    useEffect(() => {
        if (show) {
            const timer = setTimeout(() => {
                handleDismiss();
            }, 4000);
            return () => clearTimeout(timer);
        }
    }, [show]);

    if (!show) return null;

    const handleDismiss = () => {
        setIsDismissing(true);
        setTimeout(() => {
            onClose();
        }, 300);
    };

    const handleTouchStart = (e) => {
        dragStartX.current = e.touches[0].clientX;
    };

    const handleTouchMove = (e) => {
        const currentX = e.touches[0].clientX;
        const diff = currentX - dragStartX.current;
        setSwipeOffset(diff);
    };

    const handleTouchEnd = () => {
        if (Math.abs(swipeOffset) > 80) {
            handleDismiss();
        } else {
            setSwipeOffset(0);
        }
    };

    const handleMouseDown = (e) => {
        dragStartX.current = e.clientX;
        if (toastRef.current) toastRef.current.style.cursor = 'grabbing';
    };

    const handleMouseMove = (e) => {
        if (dragStartX.current === 0) return;
        const diff = e.clientX - dragStartX.current;
        setSwipeOffset(diff);
    };

    const handleMouseUp = () => {
        if (Math.abs(swipeOffset) > 80) {
            handleDismiss();
        } else {
            setSwipeOffset(0);
        }
        dragStartX.current = 0;
        if (toastRef.current) toastRef.current.style.cursor = 'grab';
    };

    const styles = {
        success: { border: 'bg-green-500', iconBg: 'bg-green-500', icon: Check },
        error: { border: 'bg-red-500', iconBg: 'bg-red-500', icon: X },
        info: { border: 'bg-blue-500', iconBg: 'bg-blue-500', icon: Info },
        warning: { border: 'bg-yellow-400', iconBg: 'bg-yellow-400', icon: AlertTriangle },
        warn: { border: 'bg-yellow-400', iconBg: 'bg-yellow-400', icon: AlertTriangle },
        ban: { border: 'bg-red-500', iconBg: 'bg-red-500', icon: X },
        shadowban: { border: 'bg-yellow-400', iconBg: 'bg-yellow-400', icon: AlertTriangle },
        delete: { border: 'bg-red-600', iconBg: 'bg-red-600', icon: AlertTriangle },
    };

    const currentStyle = styles[type] || styles.info;
    const IconComponent = currentStyle.icon;

    return (
        <div
            className="fixed left-1/2 transform -translate-x-1/2 z-[200] w-full max-w-md mx-auto px-4"
            style={{ top: 'calc(12px + env(safe-area-inset-top, 0px))' }}
        >
            <div
                ref={toastRef}
                className={`flex items-center bg-white rounded-lg shadow-lg overflow-hidden transition-all duration-300 cursor-grab select-none ${isDismissing ? 'opacity-0 scale-95 -translate-y-4' : 'opacity-100 scale-100'}`}
                style={{
                    transform: `translateX(${swipeOffset}px)`,
                    animation: isDismissing ? 'none' : 'toastSlideDown 0.4s cubic-bezier(0.16, 1, 0.3, 1)',
                }}
                onTouchStart={handleTouchStart}
                onTouchMove={handleTouchMove}
                onTouchEnd={handleTouchEnd}
                onMouseDown={handleMouseDown}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                onMouseLeave={handleMouseUp}
            >
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
                <div className={`w-1 ${currentStyle.border}`}></div>
                <div className="flex items-center p-3 w-full">
                    <div className={`flex-shrink-0 flex items-center justify-center w-8 h-8 rounded-full ${currentStyle.iconBg} text-white`}>
                        <IconComponent size={18} strokeWidth={3} />
                    </div>
                    <div className="ml-3 flex-1">
                        <div className="text-sm font-bold text-gray-800">{title}</div>
                        <div className="text-xs text-gray-600">{message}</div>
                    </div>
                </div>
            </div>
        </div>
    );
};

// Main App Component
const App = ({ overrideMiniPlayerData = null }) => {
    const navigate = useNavigate();
    const location = useLocation();
    const auth = useAuth();
    const { videoRef: globalVideoRef } = React.useContext(PlayerContext) || {};

    // State is lifted here to manage filtering based on search
    const [searchTerm, setSearchTerm] = useState('');
    const [isSearchActive, setIsSearchActive] = useState(false);
    const [isDrawerOpen, setIsDrawerOpen] = useState(false); // New state for the drawer

    // NEW: Beta wait modal state (Render free tier cold start)
    const [showBetaWaitModal, setShowBetaWaitModal] = useState(false);
    const [betaCountdown, setBetaCountdown] = useState(80);
    const [betaProgress, setBetaProgress] = useState(0);
    const [betaStepPhase, setBetaStepPhase] = useState(0);
    const betaTimerRef = useRef(null);
    const betaShowTimerRef = useRef(null);
    const betaStartRef = useRef(null);
    const formatWait = (seconds) => {
        const s = Math.max(0, Math.floor(Number(seconds) || 0));
        const m = Math.floor(s / 60);
        const sec = String(s % 60).padStart(2, '0');
        return `${m}:${sec}`;
    };
    const handleCloseBetaWait = () => {
        setShowBetaWaitModal(false);
        if (betaTimerRef.current) {
            clearInterval(betaTimerRef.current);
            betaTimerRef.current = null;
        }
        if (betaShowTimerRef.current) {
            clearTimeout(betaShowTimerRef.current);
            betaShowTimerRef.current = null;
        }
    };

    // Set drawer close callback in auth context so modals auto-close the drawer
    useEffect(() => {
        if (auth && auth.setDrawerCloseCallback) {
            auth.setDrawerCloseCallback(() => setIsDrawerOpen(false));
        }
    }, [auth]);

    // NEW: Creator onboarding state
    const [isCreatorOnboardingOpen, setIsCreatorOnboardingOpen] = useState(false);
    const handleOpenCreatorOnboarding = () => {
        // close sidebar/drawer when opening the onboarding modal
        setIsDrawerOpen(false);
        setIsCreatorOnboardingOpen(true);
    };
    const handleCloseCreatorOnboarding = () => setIsCreatorOnboardingOpen(false);

    // If the URL contains ?creatorOnboard=1 open the onboarding dialog (and strip the param)
    useEffect(() => {
        try {
            const params = new URLSearchParams(location.search);
            if (params.get('creatorOnboard')) {
                setIsDrawerOpen(false);
                setIsCreatorOnboardingOpen(true);
                // remove query param for cleanliness
                navigate(location.pathname, { replace: true });
            }
        } catch (e) { /* noop */ }
    }, [location.search]);

    // Auto-open signup modal when redirected from /join referral link
    useEffect(() => {
        try {
            if (location.state?.openSignup && !auth?.user) {
                auth.openAuthModal();
                // Clear the state so it doesn't re-trigger on re-render
                navigate(location.pathname, { replace: true, state: {} });
            }
        } catch (e) { /* noop */ }
    }, [location.state]);

    // NEW: Profile dialog state
    const [isProfileOpen, setIsProfileOpen] = useState(false);
    const [profileUser, setProfileUser] = useState(null);
    const [profileIsCreator, setProfileIsCreator] = useState(false);
    const [profileData, setProfileData] = useState(null);
    const [profileCreatorId, setProfileCreatorId] = useState(null);

    // NEW: Share dialog state
    const [isShareOpen, setIsShareOpen] = useState(false);
    const [isPlaylistPickerOpen, setIsPlaylistPickerOpen] = useState(false);
    const [playlistTargetVideo, setPlaylistTargetVideo] = useState(null);
    const [shareVideo, setShareVideo] = useState(null);

    // NEW: Mini player state
    const [showMiniPlayer, setShowMiniPlayer] = useState(false);
    const [miniPlayerData, setMiniPlayerData] = useState(null);
    const miniPlayerRef = useRef(null);
    const miniPlayerVideoRef = useRef(null);
    const [miniPlaying, setMiniPlaying] = useState(true);
    const [miniPlayerPos, setMiniPlayerPos] = useState({ right: 16, bottom: 100 });
    const miniDragRef = useRef({ isDragging: false, hasMoved: false, startX: 0, startY: 0, startRight: 16, startBottom: 100 });
    const miniPlayerClosedTimestampRef = useRef(0); // Track when miniplayer was explicitly closed
    const miniPlayerClosedRef = useRef(false); // Synchronous flag: true while miniplayer should stay closed (prevents timeupdate race)
    const skipNextSwitchToHomeRef = useRef(false); // Skip next switchToHome event if user just closed miniplayer

    // Hydrate closed-state refs from sessionStorage so a freshly-mounted Home instance
    // (e.g. after clearOverride restores the Routes tree) knows the player was recently closed
    useEffect(() => {
        try {
            const closedTs = sessionStorage.getItem('miniPlayerClosed');
            if (closedTs) {
                const ts = parseInt(closedTs, 10);
                if (!isNaN(ts) && Date.now() - ts < 10000) {
                    // Closed within last 10 seconds — keep guard active
                    miniPlayerClosedRef.current = true;
                    miniPlayerClosedTimestampRef.current = ts;
                } else {
                    // Stale — clean up
                    sessionStorage.removeItem('miniPlayerClosed');
                }
            }
        } catch (e) { }
    }, []);

    // Staff action notification modal state
    const [staffActionNotification, setStaffActionNotification] = useState(null);

    // NEW: First-time user welcome modals state
    const [showRoleSelection, setShowRoleSelection] = useState(false);
    const [showUserWelcome, setShowUserWelcome] = useState(false);
    const [showCreatorWelcome, setShowCreatorWelcome] = useState(false);

    // Check if first-time user on component mount
    useEffect(() => {
        try {
            const hasSeenWelcome = localStorage.getItem('regaarder_seen_welcome');
            if (!hasSeenWelcome) {
                setShowRoleSelection(true);
                localStorage.setItem('regaarder_seen_welcome', '1');
            }
        } catch (e) {
            console.warn('Failed to check welcome modal status', e);
        }
    }, []);

    // Show beta wait modal only if backend is cold (slow first response)
    useEffect(() => {
        try {
            if (sessionStorage.getItem('beta_wait_modal_seen') === '1') return;
        } catch (e) { }

        const BACKEND = (typeof window !== 'undefined' && window.__BACKEND_URL__) || 'https://regaarder-pwin.onrender.com';
        const totalSeconds = 80;
        const totalMs = totalSeconds * 1000;
        const showDelayMs = 1800;
        let resolved = false;

        const startCountdown = () => {
            try { sessionStorage.setItem('beta_wait_modal_seen', '1'); } catch (e) { }
            betaStartRef.current = Date.now();
            setBetaCountdown(totalSeconds);
            setBetaProgress(0);
            setBetaStepPhase(0);
            setShowBetaWaitModal(true);

            if (betaTimerRef.current) clearInterval(betaTimerRef.current);
            betaTimerRef.current = setInterval(() => {
                const elapsed = Date.now() - (betaStartRef.current || Date.now());
                const remaining = Math.max(0, Math.ceil((totalMs - elapsed) / 1000));
                const progress = Math.min(100, Math.round((elapsed / totalMs) * 100));
                setBetaCountdown(remaining);
                setBetaProgress(progress);

                // Phase mapping for dynamic steps
                if (progress < 20) setBetaStepPhase(0); // Step 1 loading
                else if (progress < 40) setBetaStepPhase(1); // Step 1 done
                else if (progress < 55) setBetaStepPhase(2); // Step 2 loading
                else if (progress < 75) setBetaStepPhase(3); // Step 2 done
                else if (progress < 90) setBetaStepPhase(4); // Step 3 loading
                else setBetaStepPhase(5); // Step 3 done

                if (elapsed >= totalMs) {
                    clearInterval(betaTimerRef.current);
                    betaTimerRef.current = null;
                    setShowBetaWaitModal(false);
                }
            }, 250);
        };

        betaShowTimerRef.current = setTimeout(() => {
            if (!resolved) startCountdown();
        }, showDelayMs);

        // Ping backend; if it responds quickly, skip modal
        const controller = typeof AbortController !== 'undefined' ? new AbortController() : null;
        fetch(`${BACKEND}/healthz`, { method: 'GET', cache: 'no-store', signal: controller ? controller.signal : undefined })
            .catch(() => { /* ignore errors */ })
            .finally(() => {
                resolved = true;
                if (betaShowTimerRef.current) {
                    clearTimeout(betaShowTimerRef.current);
                    betaShowTimerRef.current = null;
                }
                if (betaTimerRef.current) {
                    clearInterval(betaTimerRef.current);
                    betaTimerRef.current = null;
                }
                setShowBetaWaitModal(false);
            });

        return () => {
            if (controller) controller.abort();
            if (betaShowTimerRef.current) {
                clearTimeout(betaShowTimerRef.current);
                betaShowTimerRef.current = null;
            }
            if (betaTimerRef.current) {
                clearInterval(betaTimerRef.current);
                betaTimerRef.current = null;
            }
        };
    }, []);

    const handleRoleSelect = (role) => {
        if (role === 'user') {
            setShowRoleSelection(false);
            setShowUserWelcome(true);
        } else if (role === 'creator') {
            setShowRoleSelection(false);
            setShowCreatorWelcome(true);
        } else {
            setShowRoleSelection(false);
        }
    };

    const handleLanguageSelect = (lang) => {
        changeLanguage(lang);
    };

    // Navigation helper to convert .jsx paths to routes - DEFINED AFTER STATE
    const navigateTo = useCallback((path) => {
        if (!path) return;
        const cleanPath = path.replace(/\.jsx$/, '');
        
        // Only close miniplayer if navigating away from home
        const isHomePage = cleanPath === '/' || cleanPath === '/home';
        if (!isHomePage) {
            setShowMiniPlayer(false);
            setMiniPlayerData(null);
            try { localStorage.removeItem('miniPlayerData'); } catch (e) { }
        }
        
        // Restore the Routes tree if App.jsx had replaced it via switchToHomeOnly override
        try { eventBus.emit('clearOverride'); } catch (e) { }
        
        navigate(cleanPath);
    }, [navigate]);

    // NEW: Close miniplayer when navigating to different pages (run BEFORE restoration logic)
    useEffect(() => {
        // Only show miniplayer on home page (/home or /)
        // Close it when navigating to other pages like /requests, /ideas, etc.
        const isHomePage = location.pathname === '/' || location.pathname === '/home';
        if (!isHomePage) {
            setShowMiniPlayer(false);
            setMiniPlayerData(null);
            // Clear stored miniplayer data so it doesn't auto-restore when navigating back
            try { localStorage.removeItem('miniPlayerData'); } catch (e) { }
        }
    }, [location.pathname]);

    // NEW: Fullscreen videoplayer state (seamless overlay)
    const [showFullscreenPlayer, setShowFullscreenPlayer] = useState(false);
    const [fullscreenPlayerData, setFullscreenPlayerData] = useState(null);
    const [isTransitioningToMiniPlayer, setIsTransitioningToMiniPlayer] = useState(false);
    // Ref mirror of showFullscreenPlayer to avoid stale closures in callbacks/timeouts
    const showFullscreenPlayerRef = useRef(false);
    useEffect(() => { showFullscreenPlayerRef.current = showFullscreenPlayer; }, [showFullscreenPlayer]);

    // SAFETY NET: When MiniPlayer is showing and fullscreen overlay should be gone,
    // force-cleanup after a short delay. This catches any stale closure edge cases.
    useEffect(() => {
        if (showMiniPlayer && showFullscreenPlayer) {
            const safetyTimer = setTimeout(() => {
                if (showFullscreenPlayerRef.current) {
                    console.warn('[MiniPlayer safety] Force-closing lingering fullscreen overlay');
                    setShowFullscreenPlayer(false);
                    setFullscreenPlayerData(null);
                    setIsTransitioningToMiniPlayer(false);
                }
            }, 800);
            return () => clearTimeout(safetyTimer);
        }
    }, [showMiniPlayer, showFullscreenPlayer]);

    // SAFETY NET: When fullscreen player closes, aggressively clean body styles
    // that the Videoplayer may have injected (belt-and-suspenders with Videoplayer's own cleanup)
    useEffect(() => {
        if (!showFullscreenPlayer) {
            try {
                const immersiveStyle = document.getElementById('regaarder-immersive-style');
                if (immersiveStyle) immersiveStyle.remove();
            } catch (e) {}
            try {
                document.documentElement.style.overflow = '';
                document.body.style.overflow = '';
            } catch (e) {}
        }
    }, [showFullscreenPlayer]);

    // NEW: Toast state
    const [toast, setToast] = useState({ show: false, type: 'info', title: '', message: '' });

    // Poll for new notifications to show toaster
    useEffect(() => {
        let lastNotifCount = -1;
        // Function to check notifications
        const checkForNotifications = async () => {
            const token = localStorage.getItem('regaarder_token');
            if (!token) return;
            try {
                const BACKEND = (window && window.__BACKEND_URL__) || 'https://regaarder-pwin.onrender.com';
                const res = await fetch(`${BACKEND}/notifications`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                if (res.ok) {
                    const data = await res.json();
                    const list = data.notifications || [];
                    const count = list.length;

                    // Check for unread staff action notifications
                    const unreadStaffAction = list.find(n => n.type === 'staff_action' && n.requiresAcknowledgment && !n.read);
                    
                    // Show modal if there's an unread staff action (even on first load)
                    if (unreadStaffAction && !staffActionNotification) {
                        setStaffActionNotification(unreadStaffAction);
                    }

                    // If we have more notifications than before, assume the top one is new
                    // and show a toaster for it.
                    if (lastNotifCount !== -1 && count > lastNotifCount) {
                        const newest = list[0];
                        if (newest) {
                            // Check if this is an unread staff action notification
                            if (newest.type === 'staff_action' && newest.requiresAcknowledgment && !newest.read) {
                                // Show as modal popup in center of screen - NOT as toast
                                // NOTE: Do NOT remove from list - keep persisted until user manually deletes
                                setStaffActionNotification(newest);
                            } else {
                                setToast({
                                    show: true,
                                    type: 'info',
                                    title: 'New Notification',
                                    message: newest.text || 'You have a new update'
                                });
                                // Auto-hide after 4 seconds
                                setTimeout(() => setToast(prev => ({ ...prev, show: false })), 4000);
                            }
                        }
                    }
                    lastNotifCount = count;

                    // Update localStorage so badge in TopHeader updates
                    localStorage.setItem('notifications_count', String(count));
                    localStorage.setItem('notifications', JSON.stringify(list));
                    window.dispatchEvent(new Event('storage'));
                }
            } catch (e) {
                // silent fail on poll error 
            }
        };

        // Initial check
        checkForNotifications();

        // Poll every 8 seconds
        const interval = setInterval(checkForNotifications, 8000);
        return () => clearInterval(interval);
    }, []);

    // Theme is managed globally via ThemeProvider
    const theme = useTheme();

    // Use global language context
    const { selectedLanguage, changeLanguage } = useLanguage();

    // NEW: Language dialog state
    const [isLanguageDialogOpen, setIsLanguageDialogOpen] = useState(false);

    // NEW: Support Ticket navigation
    const handleOpenSupportTicket = () => {
        // Close drawer when opening support
        setIsDrawerOpen(false);
        navigate('/support');
    };

    // Listen for mini player events from videoplayer
    useEffect(() => {
        const handleMiniPlayerRequest = (data) => {
            // Show miniplayer if we're on home OR Home is rendered via override view
            const isHomePage = location.pathname === '/' || location.pathname === '/home' || !!overrideMiniPlayerData;
            if (isHomePage && data && data.video) {
                miniPlayerClosedRef.current = false; // Reset closed flag — intentional open
                setMiniPlayerData(data);
                setMiniPlaying(!(data.paused));
                setShowMiniPlayer(true);
            }
        };
        const unsubscribe = eventBus.on('miniPlayerRequest', handleMiniPlayerRequest);
        // Immediate switch listener: show mini-player instantly when videoplayer emits switchToHome
        const handleSwitchToHome = (data) => {
            // Skip if user just closed the miniplayer
            if (skipNextSwitchToHomeRef.current) {
                skipNextSwitchToHomeRef.current = false; // Reset flag
                return;
            }
            // Also skip if closed ref is set or recently closed (within 5 seconds)
            if (miniPlayerClosedRef.current) return;
            const timeSinceClosed = Date.now() - miniPlayerClosedTimestampRef.current;
            if (timeSinceClosed < 5000) return;
            
            // Always accept miniplayer data — even if not currently on /home,
            // we may be navigating back to home via history.back() from /videoplayer
            if (data && data.video) {
                setMiniPlayerData(data);
                setMiniPlaying(!(data.paused));
                setShowMiniPlayer(true);
            }
        };
        const unsubscribe2 = eventBus.on('switchToHome', handleSwitchToHome);
        return () => {
            unsubscribe();
            try { unsubscribe2(); } catch (e) { }
        };
    }, [location.pathname, overrideMiniPlayerData]);

    // Check for mini player data in multiple channels: override prop, location.state, URL params, localStorage
    useEffect(() => {
        // Only restore miniplayer on home page or when Home is rendered via override view
        const isHomePage = location.pathname === '/' || location.pathname === '/home' || !!overrideMiniPlayerData;
        if (!isHomePage) {
            return; // Don't restore miniplayer data on non-home pages
        }

        // Don't restore if miniplayer was just explicitly closed
        if (miniPlayerClosedRef.current) {
            return; // Closed flag is set, don't auto-restore
        }
        const timeSinceClosed = Date.now() - miniPlayerClosedTimestampRef.current;
        if (timeSinceClosed < 5000) {
            return; // Recently closed (within 5 seconds), don't auto-restore
        }
        // Guard against component remount resetting the ref: check sessionStorage too
        try {
            const closedTs = sessionStorage.getItem('miniPlayerClosed');
            if (closedTs && (Date.now() - Number(closedTs)) < 10000) {
                miniPlayerClosedRef.current = true; // Re-hydrate the ref from persisted state
                return; // Recently closed (within 10 seconds), don't auto-restore
            }
        } catch (e) { }

        try {
            if (overrideMiniPlayerData && overrideMiniPlayerData.video) {
                console.log('home: using overrideMiniPlayerData prop ->', overrideMiniPlayerData);
                setMiniPlayerData(overrideMiniPlayerData);
                setMiniPlaying(!(overrideMiniPlayerData.paused));
                setShowMiniPlayer(true);
                return;
            }
        } catch (e) { }
        try {
            // 1) React Router state (navigate(url, { state }))
            if (location && location.state && location.state.miniPlayerData) {
                const data = location.state.miniPlayerData;
                console.log('home: got miniPlayerData from location.state ->', data);
                if (data && data.video) {
                    setMiniPlayerData(data);
                    setMiniPlaying(!(data.paused));
                    setShowMiniPlayer(true);
                    try { localStorage.removeItem('miniPlayerData'); } catch (e) { }
                    return;
                }
            }

            // 2) URL params fallback (only if explicitly mini=1)
            try {
                const params = new URLSearchParams(window.location.search);
                if (params.get('mini') === '1') {
                    const id = params.get('id');
                    const t = params.get('t');
                    const data = { video: { id: id || 'custom', title: params.get('title') || 'Video' }, time: t ? parseInt(t, 10) : 0 };
                    console.log('home: got miniPlayerData from URL ->', data);
                    setMiniPlayerData(data);
                    setMiniPlaying(!(data.paused));
                    setShowMiniPlayer(true);
                    try { localStorage.removeItem('miniPlayerData'); } catch (e) { }
                    return;
                }
            } catch (e) { }
            // 3) localStorage as last fallback
            const storedData = localStorage.getItem('miniPlayerData');
            console.log('home: found stored miniPlayerData?', !!storedData);
            if (storedData) {
                const data = JSON.parse(storedData);
                console.log('home: parsed miniPlayerData ->', data);
                if (data && data.video) {
                    setMiniPlayerData(data);
                    setMiniPlaying(!(data.paused));
                    setShowMiniPlayer(true);
                    // Clear the stored data after using it
                    localStorage.removeItem('miniPlayerData');
                }
            }
        } catch (err) {
            console.error('Failed to retrieve mini player data', err);
        }
    }, [location, overrideMiniPlayerData]);

    // Sync mini-player video element with miniPlayerData: src, time, play/pause and persist time updates
    useEffect(() => {
        const v = miniPlayerVideoRef.current;
        if (!v) return;

        let loadedHandler = null;
        let timeUpdateHandler = null;

        try {
            // Resolve candidate src from payload
            const src = (miniPlayerData && miniPlayerData.video && (miniPlayerData.video.src || miniPlayerData.video.videoUrl || miniPlayerData.video.url)) || '';
            const resolvedSrc = resolveMediaUrl(src) || src;
            if (resolvedSrc && v.src !== resolvedSrc) {
                try { v.src = resolvedSrc; } catch (e) { /* best-effort */ }
                try { v.load(); } catch { }
            }

            const applyState = () => {
                try {
                    // Seek if a numeric time was provided
                    if (miniPlayerData && typeof miniPlayerData.time === 'number' && !Number.isNaN(miniPlayerData.time)) {
                        try { v.currentTime = Math.max(0, Math.floor(miniPlayerData.time)); } catch (e) { /* ignore seeking errors */ }
                    }

                    // Always play when switching to miniplayer - continue playback
                    try {
                        v.muted = true;
                        v.playsInline = true;
                        v.autoplay = true;
                        const p = v.play();
                        if (p && p.then) {
                            p.catch(() => { /* autoplay may be blocked */ });
                        }
                    } catch (e) { }
                } catch (err) { console.warn('miniPlayer applyState failed', err); }
            };

            if (v.readyState >= 2) {
                applyState();
            } else {
                loadedHandler = () => applyState();
                v.addEventListener('loadedmetadata', loadedHandler);
            }

            // Persist currentTime periodically so the full player can resume accurately
            // CRITICAL: Check miniPlayerClosedRef to prevent writing AFTER user closed the player
            timeUpdateHandler = () => {
                try {
                    if (miniPlayerClosedRef.current) return; // Player was closed, stop persisting
                    const current = Math.floor(v.currentTime || 0);
                    setMiniPlayerData(prev => {
                        if (!prev) return prev; // Don't resurrect null data
                        const next = { ...prev, time: current };
                        try {
                            if (!miniPlayerClosedRef.current) {
                                localStorage.setItem('miniPlayerData', JSON.stringify(next));
                            }
                        } catch (e) { }
                        return next;
                    });
                } catch (e) { }
            };
            v.addEventListener('timeupdate', timeUpdateHandler);
        } catch (e) {
            console.warn('Failed to sync mini player video', e);
        }

        return () => {
            try {
                if (loadedHandler && v.removeEventListener) v.removeEventListener('loadedmetadata', loadedHandler);
                if (timeUpdateHandler && v.removeEventListener) v.removeEventListener('timeupdate', timeUpdateHandler);
            } catch (e) { }
        };
    }, [showMiniPlayer, miniPlayerData]);

    // ThemeProvider handles CSS variable updates globally

    // Handler for "Not Interested"
    const handleNotInterested = (videoId) => {
        // Remove video from list
        setVideos(prev => prev.filter(v => v.id !== videoId));
        // Show toast
        setToast({
            show: true,
            type: 'success',
            title: 'Success',
            message: 'This video will be shown less to you'
        });
        // Hide toast after 3 seconds
        setTimeout(() => setToast(prev => ({ ...prev, show: false })), 3000);
    };

    // Handler for Copy Success
    const handleCopySuccess = () => {
        setToast({
            show: true,
            type: 'success',
            title: 'Success',
            message: 'Link has been copied'
        });
        setTimeout(() => setToast(prev => ({ ...prev, show: false })), 3000);
    };

    // Handler to open the Report Dialog, passed down to ContentCard
    const [isReportDialogOpen, setIsReportDialogOpen] = useState(false);
    const [videoToReport, setVideoToReport] = useState(null);

    const handleReportVideo = (video) => {
        setVideoToReport(video);
        setIsReportDialogOpen(true);
    };

    const handleCloseReportDialog = () => {
        setIsReportDialogOpen(false);
        setVideoToReport(null);
    };

    const handleOpenProfile = (name, isCreator = false, data = null, creatorId = null) => {
        setProfileUser(name);
        setProfileIsCreator(isCreator);
        setProfileData(data);
        setProfileCreatorId(creatorId);
        setIsProfileOpen(true);
    };

    const handleCloseProfile = () => {
        setIsProfileOpen(false);
        setProfileUser(null);
        setProfileIsCreator(false);
        setProfileData(null);
        setProfileCreatorId(null);
    };

    // NEW: Handler to open Share Dialog
    const handleOpenShare = (video) => {
        setShareVideo(video);
        setIsShareOpen(true);
    };

    const handleCloseShare = () => {
        setIsShareOpen(false);
        setShareVideo(null);
    };

    // Theme handlers use global ThemeProvider
    const handleOpenTheme = () => theme.openThemeModal();
    const handleOpenColorPicker = () => theme.openThemeModal();

    // NEW: language handlers
    const handleOpenLanguage = () => {
        console.log('handleOpenLanguage called, closing drawer and opening modal');
        setIsDrawerOpen(false);
        // Delay to ensure drawer fully closes and state updates
        setTimeout(() => {
            console.log('Opening language dialog');
            setIsLanguageDialogOpen(true);
        }, 300);
    };
    const handleCloseLanguage = () => {
        console.log('Closing language dialog');
        setIsLanguageDialogOpen(false);
    };
    const handleSelectLanguage = (lang) => {
        console.log('Language selected:', lang);
        changeLanguage(lang);
        setIsLanguageDialogOpen(false);
        // Optionally show a toast
        setToast({ show: true, type: 'success', title: getTranslation('Language Updated', lang), message: `${getTranslation(lang, lang)} ${getTranslation('selected', lang)}` });
        setTimeout(() => setToast(prev => ({ ...prev, show: false })), 2500);
    };

    // Handler to toggle bookmark on a video (persist to backend when bookmarking)
    const handleToggleBookmark = async (videoId) => {
        setVideos(prev => prev.map(v => v.id === videoId ? { ...v, bookmarked: !v.bookmarked } : v));
        try {
            const v = (videos || []).find(x => x.id === videoId);
            if (!v) return;
            const bookmarking = !v.bookmarked;
            if (!bookmarking) return; // only persist adds; removal not supported server-side
            const BACKEND = (window && window.__BACKEND_URL__) || 'https://regaarder-pwin.onrender.com';
            const token = localStorage.getItem('regaarder_token');
            await fetch(`${BACKEND}/bookmarks/videos`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
                body: JSON.stringify({ videoUrl: v.videoUrl || v.url || v.src || null, title: v.title || '' })
            }).catch(() => { });
        } catch { }
    };

    // Handler to unpin a video
    const handleUnpinVideo = async (videoId) => {
        setVideos(prev => prev.map((v) => (v.id === videoId ? { ...v, pinned: false, pinnedDays: null } : v)));
        try {
            const BACKEND = (window && window.__BACKEND_URL__) || 'https://regaarder-pwin.onrender.com';
            const token = localStorage.getItem('regaarder_token');
            await fetch(`${BACKEND}/videos/${encodeURIComponent(videoId)}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
                body: JSON.stringify({ pinned: false, pinnedDays: null })
            }).catch(() => { });
        } catch (e) { }
    };

    // Define the data for the video cards (empty - videos come from backend)
    const videoData = [];

    const [videos, setVideos] = useState(videoData);
    // fixed: valid array (no syntax errors)
    const extraVideoData = [
        {
            id: 1,
            title: "We are so back! Regaarder is live again",
            author: "Krypton T",
            requester: "OceanDreamer",
            time: "12:15",
            date: "1 month ago",
            imageUrl: "",
            pinned: true,
            pinnedDays: 30,
            bookmarked: false,
        },
        {
            id: 2,
            title: "The Future of Quantum Computing and Parallel Universes",
            author: "Dr. Eliza Reed",
            requester: "TechWhiz",
            time: "12:15",
            date: "3 weeks ago",
            bookmarked: false,
        },
        {
            id: 3,
            title: "How Ancient Roman Architecture Influenced Modern Cities",
            author: "UrbanPlannerX",
            requester: "HistoryBuff",
            time: "8:59",
            date: "2 days ago",
            imageUrl: "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wCEAAkGBxMTEhUTExMWFRUXGBYYFxcYGBodHRcaGRsgGxcYGhcYHSggHh0lHxkYITEhJSorLi4uFyAzODMtNygtLisBCgoKDg0OGxAQGy0lHyUwLy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLf/AABEIALEBHAMBIgACEQEDEQH/xAAcAAABBQEBAQAAAAAAAAAAAAAFAgMEBgcAAQj/xABJEAABAgMFBAYGBggEBgMAAAABAhEAAyEEBRIxQQYiUWETMnGBkaFCUrHB0fAUI3KSsuEHFRYkM2KC8WNzosIXNENT0uKDo9P/xAAaAQADAQEBAQAAAAAAAAAAAAABAgMABAUG/8QAKREAAgICAgEDBAIDAQAAAAAAAAECEQMSITEyBCJBBVFxkRNCYbHBgf/aAAwDAQACEQMRAD8A05SIaUmJikQ0pEdsZHkNENSIaUiJikQ0pMWjMWiIUwgpiUpENlMVTFIxTCcMSCmElEMmAZwx5hh1bDOkNGdwD+XbCzyRh5MeOOU+Io7BCVqA7eEQLZe0pCxLXNGIgnAnOgr5A0PCAk+/pqgpMpH0dYcvND7oFCD1a8K5Hu4sn1BLwX7OvH6BvmbLLOnMCpTISNVEeeggRatoZSAk70wH0k9VJ5nSoagMAhZpk5YmkzCvV1fVt6u9RuITzglIu0JJD4cRxFKHAJPaCdeAqSXjgyepyZO2ehj9Njh0iLa7xtMx0YhJILp6OoUDkDXE+bs2Ue2W6zix4cCillvUKPrFBqNes2ecHbLYcPVSE6H8y7nvPdEr9Xgtiq1WLMDRi3GJKLZbZIESLtSAAAVAZBt0a0Ap+Kpid9AJDVSGzAonJux+QGUFU2ZgKeGlDCzLS1d4Up+XPhlWCsYrmDLLdiSkPjBqWUXJcksXJ4DKGbRdBUHKQoka9cUBbGC+vrEQRkJQHISw3U5uSHLO9czlpEoyQWplxGnLgYLQNik2u5KGgBV6wrR8lpGINVjh74HqsMyS5lKXJCiCpaSVBSgcyoFmL1BjQZtlSoB0ihByDu+fLOI9ou9yClwfnUF9eykDkNoqVm2inJI6ZCOjLJKnZQLsHwuGPIDPOC1gvyTMS4WUMcJEzdr3lvAkwq03MA5UiupTRROT7oYs+qTnAW23WFkklMwMzKOHsLglBVnVwa5aQ8MsoPh0LPHGaqSstpSe3mPaxyEJIimSzPkK3Zi0qUlimZSWCA4WEElJ4U8YIWbahYwpnyXqUqmI6oUP5V+3Eezh34vqM4+XJw5Pp8JePBYSmEkRFu69ZU5+iWFMWar+CmUe3KJS1lxuuDmXy7sz3PHfj9fhn81+TgyehzQ+L/AkphJEPNwhJEdidnHQyRHkOkQkiCAaKY8aHcMJjGER0LjoxrNBWiGlIiWRDSkx8+pHquJDUiG1IiaUREtc9EvrqA5a+GcVUiet9DKkQ2ZcQrVfQAJQmgzUssB2jhziu3jtIgFOOYVhQcFHUAahKhRi1DXOC88YlI+mnLvgsc+1oTR3PAVgfbL1SkEqUlA7QS3Fte4RUrTec5Ywn6lBqFIY7rUDnIkk1AGQhiXdSlkKU6lu/SqdKlDhhDk0AGTeEc0/VyfC4OzH6OEeXyF5u0oVvSZapoHWJphAoThIc8W3coHTrTOnKwqXjQsB5aAUqSK0oK83fKJ0q6BVSqqoSwwhxUOEl+GZHZBORYWASAEp7m+6A3CtY5W3I60opUArPcpKcKgMIbDiZSgwYJxCjM2r50rBKRY0jmqlVFzlRnoO4a5waRZxRgSRTIgQuYyVBJoVmjAmo4lmEZQ+4NyNIs2pLd7luDueUShY0jLMVp2l/l4kol9n9vbD3R91Gh1BCOTZFEoNQ8qdvyPGETEhLqqqoomprSgJ05aRMCOfD2Qvz1ggsiy1YtCORB4fOUIWsEDkD6Jzy4RPOR3ePPXgI9Qg00jGQNlSEgDCAniw7/GJqkgZj5f84UsUGZr+WcLblGGRFmyx5ZN2NCFSxw8qNE7BSmfd8/3hISOMLQQbMSNU0cGgJy1yhufZ0kuU14sfhBVIyOXItSmRahz8obIBBZnprn3wrQbAFqu9gQHw5thLHtBSUwEtV3oUMOApBpkyeFZa6eBSMouk8jiKBgS1IgrUhYooGpBYijZ6wj4KJlMtd1YlHGnECGKUbhOW9hIctXqlXfDUi87RJwtMdKDhVLKSpZTpmAoFqMDprFum2VJcApL5hx7CWgauzYyQQFJbIglux/8AaUwEzURZW0iQtSZ0pUoJBKVEuFJGo9Idgd4LWO3ompC5awtJ1+ap7w8BZ11JcKFFB2xDGKuCz7wz4qyEDLVcxZR3usFJMtVEKyySAoZnPhF8fqJwftlX+iOXBDIvcrLqFj5+ad7R6RFPkXraEKQVKE1BYFCQ6kqYPv0JzzNKiJ9m2plMrpwZC0kApLqd9RhTiPgwj0MX1OS843+Dz8n0yL8HX5D+GPIaFsRgM0KBlhJUVfygO9PZCbDeMqcnFLmJWOIILdrZdhj0MXq8WTp/s8/L6TLj7X65HmjzDDjR5hjqOWkaKRCCIcjwiPnLPflAi2yzlaCkKKSciHceEZbfd8rkTFS1ywhaS5xY2KX6ySE7zjUHtBjWiID7RbNyLYhpqRiDYZgAxIYucL0r74z5BB6sxm13yFqxKmkomFO4oLKQAckgJGGuZbTlC7NeUhBmCrBnSnGzaNiSR3AawdtezK5MxSSk4mYqGBlpOR6vLyiF+z2W6oJBxAfVsC703YhKujti/lDcjaWQCCEM+RGIkdqihxU8s4mWfayQCpOBW7X0q92CseIuUuVOpyA7GXkNDuc4aGz5wpTvMnLfQG4EfVwnA3LJX7ZSAkHolEEsOtQcS6KB/ZCv20kglARkHDHdPYcLHsENS7hU5JK3VRR6RDkCrFpYJ8YR+zYACSF4SaDGlietQdFnuk+MNuDVD0rbiThxGUoDJsy44hnAyrzhdp20khx0Czhd0t1gTo/WhhdzZrde64KukRQJJxAnoqDj2R36jKQndXSqRjSWpmAJNM89Xjbs2qJcvbeSr0FjdJG7nqR2tCrPtzIVgGBSSp8xRBAdjz4P74HoufEcKQqtW6QZs4LmVVTJd86cocTcrmr75esxO8zJq8riwrxEDZm1RKRt/JFRJWQ4S+Fin7Q0H5x6P0hShieSs4SHocvWFKiIouN8ZxKB6qnmpB6zMSZNd5x4w4biKVJDLxMcIExNBQFvqWaopzjbs2iJh/SFLGL6lZIANK4gdU8WeE/8QZZwgWdZxJxZUyy0c8ojSrloQy2Q7kzUjC2bHogNatHv6ozcTAAQqq2AJoCAZIck8Hz4wu7G0iPnb6WEJWZEzrEB01DFnWX3dPE8IUn9ICXUDImONMIcu9UjEHHOkRDdAIfe3iQfrKkszLSZRNH1y74fXc4fArpApNBvlhQjrCWA1D4QN2HRHf8AEOXuDolsoUVhDAtko9JSE/t8N793mDAeqQCojPEBjyzhhN1y2xOrComuJVaYiQky8mDv5w4LpAWE7+LR1LqHzfCxDka8o27NqhatuyFI+pUAsbqikYX0S/SZ8uesML29XhUU2ZRKSMSCneAaqm6Sg/OFpumWw4BKVh5i8lOEkAJzL5Z17IWLpl8Q5ODrrzcJw6VcCBuw6oQdtF4kp6EspOJKgmisiUp+sOJWkMjbxQRiEg9YpUMB3Mqq36PTKH5t1IGL+UYlbyy3paKjhdCabrkuWeY7A1PWbPnG2ZqQhG2U0rWjoN5FQnDVYfrJBmZc4iftkvD0vQuCWVTqEFq79M9YkzLvTU4C6QFGsxwC5fruNaQqXc2pQ3esmn/ycoRsKSIs3aZfSJQZBZQ3VhJZRLZMoxAXtBMUVj6OoTEDFgIq1A4ZVO4iCwu1IyA09KZy/n5CFJuqX6o8Zujf4nIQFJDUApl+BSULXJxJXTHqguzFQ3j4xG6Z1rQZBx4X3sJKwMgKFh2mLHNupHAN9qZ75nMwj9XoGifGZ/8ApB3QNSnW1vo6pqZcwEYpX8U7uIthbC6gSqoDaiDew+xapZTaLQ6VCqJYLEc1kfh8eEWW5rqQFFeFLpYJAKy2Vd9RD5M0GsMe59P9MnD+Sfz0eJ9Q9W4y/jh8dsRhjsMLaIs+3y0FlKAMeq5Jds8hRcukaUsZfOkJSXDw1Om0pxOeu9lEmPmz6XsRHNCiIG36ieZJ+jlpoYpG7vcQcYbKulRDJiuJVr9mTVzlbgDHD1+BZ9M84GiXO9QN9oRXbbtJaTMWVkO6gdxOaes6sLAhsmMD17S2hJpgPETJdQ2Z3cPFsuECSXyUjdcFzab6g7lQhKZnqDvV+cUT9upjnelAihHRGnnHg/SAsKAKpZqKdEqvZC6X8B2L8RNo6U/ey84XOs0yYA+FJT1SFBwqjKBOoY+JgSu+JyqpljquDgLFRyS/ubwgTee2VpkioksA6mSSRU5hwRzDUhaSYeWi2JsSmw4U4HJYGrUOHEDk4BfVo5ElaQwIDJwcd0Ph9IVAOb1jP/8Aictm+q7ejW/42h67P0irXOQjcIUW6qhnzxMO2G1l9gWX6z2TfKwA4wkOR6uEggqbV3z56QkSmUlwCUOAHFXIUDnowiPd9vnKWp1SiC5AqlgkVdRScmipXtttaJUxQJlEAkUTiyoQ6VMfAQvF0NTqy5mxAulSQQSoq3mfEScwchiNOyHhIWcBBBKQpKt0MsKbETvZ7o8TGbTP0kzCDvgdkv4iDOx23U+0zDKGBTJxORhLA1JLnjoIbR/YGyLnPswCFuHKypyGBDhnzLMNYQgTJmLGwUFJCVBqYVO7O5fL2Q7OtM0yiXluAVUU1MnqGbwjMFfpDmgkYkZ+qrQ9sJVvhD9Lk0tVjck4j1gslIYuwSCneowS2ruXzhxctjiABDMRQZEkEMX9KMrR+kKakuJg8F+wqaC+zO3E+0zxLV0ZGE6EPlq58IP8cn8C7JFuk3UMIlKCSEqLkMDVGGu87sXfsiX0K0lCsQJCSmpTV2rQ50+dIgtJ3llaAGUodYBgkFwcOjt/cRnCf0jzhksN9hTfihEm+KGtLk0o2PD0e6D0QAFQQoMGc5GoB7UjvSLGCSSrCXxcnx43YBn9F88NIzb/AIh2glkr8AR74M7O7V2ycsoM1IAplVgCSaZ5fOpeOX2Nsi6ybIlaVqOFJWCg5BQFQSKOHj36AUsErAw4gKpqCXIIwNmHdvaYCW685qJcxYtClM6urhSEsCS6W1UB3iM/Vt/OctMmDNm+JJPnC630FujVTZFsp1JOJIQcsg7HLPeNecLCZgPWSO5VeZYCMpP6RbQaCartKUeZaLFszf8Aap6cUy0jCkEndILOGYoKR4vAeKQd4lvlSVqDnCNDunQtw+Xjz6Kr1kP9lR90VraS9Z1ml48aiQS+MHUnCKLbMENy5RSxtnaFZzF/dQPYICxthc67NZFjV64+6f8AxjjYSM1jwV/4xlCdr7T1UzTxfAg/7Xi17MXvPmIKlLxmjlTICfuMe9tIb+IX+Qt1jQoTGxUaownTKp7YnrpADZ5UwTsEx3IWqpUotioHOWvhBO/ZqwghAS+pUTQd1XNY9n0U9cFv4s8P12Pf1FL5oZtVvJOCXUnM6D546czQ+ybuSAyiSeIUoew+2sIQZaPqkl1qQSe8FifAsOUV2+CufOWqUd1JCDiURUAEsADSvtjnyTnmfP6OvFjhhVL9mnJty1LBKgUk0UHJQDqA7EQdn2+UlDqmJY0Gr9wipBRCeBgRb7SPpCkLkdIkhAC0KGIMCTuZ5q0fsjknNJWdsYNmjyrVLWApKwRkCDqdG48jD2KjmjRm8lCyRMkzAWIoGCknGwd+XnBJW1KkES5qxvOzhi3Ahgx00FDWBvFrhm0a7KvtHLSbZOO65UA/RAUYA6u/wivX5LSizqmKkFX1hSiYlRAThAJCpZSdFCrivYYsFsm9JPmL0KlEHjwghInYrvnyClBSoqJx4tAG6pB9EQ6ktlYKajwYleM7FvYMJ4g5jshlgvt0/IwXtl2kUIFBzf2wNmysBKMACiSkvVSVAswIpm/y0MpAo1mwWhpb4JrlLYkgHJ2I3s3avKMy29tJVaAnQJdq5qJJd6xr9jlskdnsyjHdsZSl26eoB99vAAe6NGKUwbe0ACXEm7EETpVf+ojL7QhPQq9UxMuezqM+TuljNl/iEXtCOzY5VnWJbsp2qWIfjq9aPGU3komcSdSXFMiaUfspG3ILJPfGQ3jZS1fY+gbU1+EcsvbMrF7RKzbLOUrUGp+cG9iEkWpLFiQoPWg1yz4NzgfaEFf2gWPODOxMs/TZWjBX4T8YtF3wJLhGk7QzSLLMW7lMtRZlDJL4Q/PTsjDgmN02wSfoE6v/AElvz3T890YepMDEqsaTtIbIgzser96QBRwoe96V00gMQYKbKn97ldqvwKipNmp3pKIs0xWYEtRIISBRIAqDQMkcqVjFFhmjdbXLezTg+cqYPFBEYcmUVAN4xDGqbHbtIkWOXhGI6nwi4bMywFpwl0kcgX1ObaxVklKt2hamufGkW7Z+UQUqIYUD01A4F9IDfuQf6ssO0IaxTVDECmUpzus+Fgd2ooNGHuxcpjdr/Q9gtCQM5Su+hbP4xiKrMvLD7IEVTZpO0iMRF7/R5MBQoEFTEsAAWcc6ePuim/Q18POLR+j1RTMmjkj3w6VsWTpWWfb9BVZSVJwDEl8qkqq7d3DWMyWWppx4xrW2EjHYprtQIV2MsE17IrV07Oom2a0KLrWiSuYgEZFBfdwqzo1QRXKJQ7oeT4tg3Z27xMKa4UOyqFyaE72E9nfF7tV3izWlcqVLdBCCmpGFwx3lO5cHlXTIV7Y+z7yDwUks4DilPLjF92oltPlKydBA5sr/ANopipxlf34I5W1kil1T/wCEWw2haJuJYAGAhwxZ2JPaW05Q4ubjVvKwpLsh95TZkjNqGv5GHJqwGVSgJrk4FH72iq3haN8LKldJhKcIoouSXU3VFTz7ICm9dfgeUI77/IRvO8gi0Y0gMhCQokslLOwJGZZRoH7oAic5JTLxuaqU4JLcE0AZqRITdqgErnVDpASKBOI+XtyqIXetitONpAVgAI3VAAEKOnFmL84zm/gCijSgWbtArFctdnXM6RQSSFTgk0NMM8V+4D3GLCg68Ip1o2rUiapQQCFLUCASDuAocKDFnlHdNKxFtrpHTX3D9+KRJs6JmF1Od4EhWEBShvcaAB30hVgvETpfSrAmyyTLIWEhQOZDHdXSHL0lS1IRLnMekG6C6SCwKt5Ab/SMjWIdou5KbKJctTJCzMdZ6wLuApO6SzhgXjnVN/Yq+gbJGZ7YN2FKfogdnHSK5neUA9OzwECZA3THkqzlMvEmYsBQYpd0l3Iop8OT7rVzBeOhySmiWjlB18AC2odaeBWkeJDwxtfcKhbCrGFJVMSQ6Ugs4zCEgP8AJq8TuiPTSgdZsvwKhBLaJJVagM2V+H+0Mm9qElxGwzYENJHYPjGN3zaj9KnMHeZM8lN89kbQgfVeHwjGrdJxT5pf01eZJ98UlKmTiuCNjJDtx84nbOqJtMhLHrgnur7ojrOFLa8Yl7Igm2Sq0dRPckxoO2GXCNgXRCoza+5G6ntjR5/8M9kUS+EUEJl8hsS4Kuuz0DCp1145xN2PR+/pH8i/Y0TfowwopoPZHmyktrdl6Cy/eI2GdyNljUbNA2qA/V1p/wAmZ+ExhKzyMb1tP/yM4f4Ux/unhGMGQnirwMUUqbFq0Cw3CCWzA/epNNT+ExyZCeJ8FQQuCUn6TLYl3OYPqnjFFNN0JJcM1Ncp5Kh/KoeUYNLmFgBwj6FTLeXThHz9ZkaEcIRcSkFcxRNsyMRFPzi93XKaSg/zJ9sVeySQyKAPy5CLddx+oHJSPxCJp+5fko/F/gs1qlPZ5gIzlqHiIw8LLvG+IQ8pQ4pIjAES1JPWy0MM+JMRcxR4uaqsGthV/Xq5p9h/OB6ylQLBiNPfE3YwNaP6T7vhBg7Zpr2mn3xJxWScBrKUw5gPDf6P7I6ZiXfFIUGbia66xNVLKpRHFJHiIG7FyTMwpCigkGo7HPsiW2mS2Fw/kxOID2VlBknUAGNA27nuuykDSY57cPyIomziShWE+i4PcW90XXaqyjobLOcuSlJ4dQ5DuziEuM8b/wA/6KPnGRbch5bAs4NRpzitjopE5MlQUZkwqwqalAHcku9ecWdYdHdFdt91dNOlrqlUpRUOBCmDVr6PtrHTSt2STdBS2TpaEPMO6G8RkBzzNK0hMm25lLYVMoOWoUiIG08hSrOR1iClmHE5CrtWBfSrCJYwqBCGLB9Tw7oaa6AjRwpzhcNh8zTN+cArqsFjVL6GapJmpXMxKqC61rUGJpkYn3nLeWQzupGLLq4gVeQMVmz3dMEyWtcshJnS5hLUwpDgk/1RCaT6OmNlxvW7VzFS1pWHlpmABmcrThcmuXdEa3ylS7NJlMoYEgKIdqADMUY1pAa/byJtIMuYRVKd05pwkq81JryiVOvJcyTIQvNUmVNXxxKy9hhIwfAXJcngLIPZD9pJTIQCfRSzjJhp4wxbABKPYY68bUGCPVCTyq4Yfd84ermg3UGCrHvWqQP8RB+6X90SpqsdpB1dRPh+cR7qV+9yjoCs+CFGHLIo9OTwCvbSK4/IhPx/ZZFUlCMdmJdai+Z8zGtWqc0rsD+UZTNFK8/b+UCXYI9Eeck5Bm1+EGdjJP7wilWUfd74CKd+EWTYoPaB9k+ZTBh2jT8WaLbQ0vuMUu8017oul7K3DFOt5dR7DAn2w4+hkWY9HLURQinPCA/4hDWzaP3w/YPtTFgmzAqTZ0AVQhb88WH4QGuBA+lqY+iPdEsF7opm8GWna0tYLQRn0Mz8JjCjaZnrHyjddsCPoE//ACZn4DGFkimeuhjrXbOdtpIQLTM9Y+AgrstPWbXJBUTvH8JgWnsOR010gnsz/wA3I+1/tMOlyK26N4lI+q7s4wLovrVDgojwMb9Zv4RjD7QgC0TP8yZ+IxJ+bGi/aibYk7sv50izWEfUK5KHksQCs0tko+0R7YO2I/VLHM+2Jx/6UfX/AIXWyDc/pjCLws5E2YOC1jwUY3S7HwJfhGQX7ZwJ82g/iL8yTD5OJk8fMCv4GL/Jgxs2lrQnv9hiGtMT7pU09B5xo9o0umavZg6YFbILwWhA4LUnxdPvgvZJgCRTOAN3qwWlXKbi/wBWKJZl7h8L9pCQMFqnpbKdNH/2Fout8VuuUr1JifxFP+4RT73Tht1oH+IT94BXvi1LmY7rmpfqLCm5ODr80iOde6D/AMoePMWiNJO5EGfbGJYOpKA+JwKcC1c4fsheX3QDmLCLS6iyVyy5JpwbyMdNe4kn7SfappVKxgJKgHFCoB2Lt7z74FWS0TZgdUx1AkFgAARoByibdc15aUMSQkejSlNWeBsm2GUqYls5hVkdQIrraJ27LPedvMuWWHX6V8+qEFTjm7eMLuna+XMWmVgUklQRxDs4FOyB98KEyRiUFFaUpfDmyykLZPY4H5wNu27kSVy7ViJda1BNCXUCmtBk5Mc0qm7o617eCw3zflkBUmajGQd4YXYByVcSA3jDt5plCYlMtLEAA5s2aQKtRz4xW5mz5mzVLM5LLdgKlseJQDGtA2mcGVOqeouCKM3IN45xoxSYJNtEi9FNK8IhXnaMRPEFveK98Tb1FEp4lPteBVtpyJLknMvT3Ro+VjS8aGbsB6ckeiiYT2MxPnEm7VPMV3eZ/KGbmLKnq4SiPvLT8IkXYoOSeIbuf4xaHZCb4Ct6KazzDwQryEZktO6BwjR9oV/u6qUAbxjO5wp3mJvsaPQPSC9Xi2bES/rieQ8z+UVo5xbNi3K1HUBLecPHtCyfBc74LS66j2RTbQXKuwxbL9mHoi57Pnvioz0tiPECEfI0eg3JTQckD3QNuBP73M7B7BBVVGam6IEXGCLSvsAgYlU0Nl8GWfbIfuM//JmfhMYharbL6JMvA0xKiVLCU1ByD5mNr2unA2GeCamTNI54Uk+6MCtfXPd7I6IpNkrJSEBQcP4CCezKCLVJ+17jEGwyt0Pq5+EE7lDWqT9tPviqIzb6NysBdBHIxjN4y/3qaD/3Jnkoxsl2MBGQ7QJa1zG/7i/MxCXmykfEmSCMKftn/cIJ2JX8T+r2PAiyUSPte8/GCNlXvL7/ADTCdMoX67P4YjLNqZbWqd9p/EAxqV1IODu90ZvtjLItUwccJ8gPdD5fIni8SsLTD9jLTUdoMIWRCpPXQYCsZ9GpyKpHgPB4D2ik+ZzY/wCkQVsdUDu9kDLzLWh+KQfMwM3kzYOhraKlumKBfEJSq85aR/tifYFgypwxJYyyC5YVy79O+BW0C3nyz60iX4hSgfZDl22ZMzFLUSApJDhnzBo+tH7oE1yh4dMM3Yp5XcIF3rOCZkpOGqsRxfZIDeK/KCFyH6tjnDN8yEkB88TJLOxNe0CkPJe5EoPhgq67d00tSilIIJS2IhmIPWHKOwgehJHcT5xJkzN4gAjj3jR+2GrTYukIJqwbjqTmA2sNQLBCL0nKs85SlelLCal6kk66MnTJ4JWmziaLNKWHddTm7YQVGudVx4i5ihGF91yd9RlO4AqFo0Ap2mGrfagCCZtndOWGctR8JcoV74SqK3YYmqQJxIbckLVQ5dIssP8AQaQxsXZsEpIOdSaNrSg5AQBNtWklhLDsCd9yA7Zq5nxi07MKdIJIfCPEh4HwFdki/wCaEsTx89G72gNKfo0PmQD4107Yc22mlKAxIOIZEg5PmITZ07iBUnClyS7lg9c4WHQZdirtmgdOHqQhuYCi/uibdQc9/wAIA2f/AJhXKWfNQ+EWG6chxxe9opEnMm7SMJCueEeYjOZxyPbGgbU0kjgVJHv9sUqZZQSAA/LtIDRIZAxYoTFu2HDlTZuPZFWtySlWEpAJDs7/ADlFq2AoJhOeNvBKfjFYdiSLNtJSUe4DxilqVRfYPfFs2lWOiPaPbFRlKThW54RJlUXCZLz5JA9sBrtWPpExnoQ/iWg3eSwAs00B9nviu3ApJnziwABTWg4/lGw8yNl8Q5tYprHOH+FMHili0YXauufnSNu2yW1knB/+ktvA5xiVpQcRLU+RF4fJP5JtgO53mCN0K/eZP20+2BVimMluZidd0z94lH+dH4oqjnl2btdqjh7oynaVvpczPrHzYxpl12gYM/OM42plj6SpVKqz16qfziL8mWXiKso3SeBT5t8YlyCekVXNvwxCQkBCq+ofwxJskwFfFwPZE38lEX66LUQgHMMKcooe3ix9KUQeshPvr5RbbomvLD6AZNFR22SFTkEapYucmUc/GHn5CQ8SrTXaFSvQPznDc01IrnCkmgPAmMA0m6rYyEnkKHXiPAxHv5f1stQ1B5ZEMPOGruDy5dQ4OpbIw9f5H1ZBBYnIvnX3Rsq5Di6BN9Thjk5OEEEAuQMTpfh1jDthWcSC+S0qrwfe8ngVetsWqYmWVOEAlIY7uLMu7VKeEErFMwZpcj0WFeVXGusJLpDx4bD90IZShWhUHPaWMN7ThSZRUksoKQcv5gDTsMe3fMZajQOEqAonCCkHCUgAAjKg0fWJN4yxMlrS4xKBqasdKOKOOPfFJrpko/NlRt81YnpwqoyS1a5jIZ5DSDaLSkjNuIxZeGUCpN2kkLV9IdBSGEhBUsANQonKZIpoakZ6LtyLQVkypExKNAqWoH8Kvb4ZRfSlZFzTdAm0SEqV1QNfkmsIRZpZSSQToG46VhmRPL4aBR1qfhEqdZVylJSesqoenlHJTOvZDGNLEmoY5fFu2LbcgYeGsNbNbOTFrSubJKUiofCcX2kHTXTveLL9BSSWQhFQCSkOSc86ag6wWrQFLkpu1gUvBLSHKlMB4ADxIicy0FsCqBnwmDSrLL6UNLxYVE0CSygAMxwPYNY9Mly7HIeis555QYQdGlOnZWLJZZilzJjMlkoqCCcycxzEFbBMYNUEH5ygrdVgnYlMXSS5SUlPIVUa93AQVs91S/SSCompf4Q9UhdrZVNq7QUS5Zd605UMVNdoIDpfFRiKaxpt+WEbowvwYYu3mIC/q4+oR2JPwhIQUjTm4mfpxFQUrEaNXy7nMWvZNJSF81k9xYe6CCboUVMJZrqUsPE0iy3Tc8uWkBYDns90O4qKEUtmA9pJToCg5qNPhFYs8hW8cORBIycd/fGj3lYZZTuEHkz8snB7xFZm3WsEKSlQd8QYseFPHPjEYxbLOSQ5elrG8kAMoYxrUaU7B4wB2bW86a+QUCk8iCW7oLTLsUAwlrHYFHtd0wYuW5RLS8wAYqscL1yyrlpTOHhDV2LOeyoG7UpSbLNDucCgA+pEZvY7CgyrSZoU4RKEoM9TNTiZVcO6+lXaNutF2SFoUlISkkEVAOfJVIoX6mmAqASpsnCVB2NNIMPlAn8GeIsqg4CSzln4aRJsFnV0sslJAC0fiEXb9TTPVV4K+ETbmuNSpyUqSQKmqKU5rYRayTXIZuxgih0eKDtAo/S1J0DHxSDnGvybpkIDYXPLLvYtFZ2t2cGJMyWHTRJAZ+R4nhXhEf7lf6lMk78tTVNAkONG5w5IkrC2KTkMq+yCci6ikuErB4tk8SZMrCN8FSiXJKVFgMvSGkFx7MpE+5i0tq5ezSK3tmjeQU1LLcjkRTzjS7suWWlIKgHNaYh+GkQto9npcxI6FKcZIZyp1chiavfpAl5I0emY0ovQpMRp2RA4/Psi/Ku1i2Agj5OsefqwE1Qo/wBJ9xiqSJts8uGYFyknx5E/2iRfUl07pcuPCvHtg9cez8spxtTIsZtORwloKW24ZakkJwgkFlYZg73/ALxLJ2Pj6MpvSyTEzRMIYFOHOpIrpSJcmdiFa0IOpy+EWK33baUKSFEBIL1cHg+ZBavDOHbNO6MgqS4GoY+QLwHF6jKS2KpshaSkKGVSG7g8WK0TyUHUEEEVrTIx0qRZjaFHo2xqxEtN6yjmQnIE++LMNn5OqeGkz2QZdCrtmb2LaRKSleBcshnMtbghmZSVhyK8YPI23LD69Qp6UqY790w+2BW1OzE2TNUqXKKpJqCgKITxBxVBfur3ACsKFGbkUl4eOSSXDBKEX2jVLxmyOhmIRIlhSkKSCCl3IpVnoecN7NWkSZasQRjWolRKhkKJArlr2kxJrHhKovSOfZkidfMvUSz2LHxMCrVeKVmrYabvSBqNyrkOUSVKPz/eEEmBqhkzpNvlhLAhND1VJ1binlCbNa5CCSEAk5lUwklsqmPcR5R4V9kBpfIylRJ/XSPVR898Oov6WK4UvyLecQel5CPDPHDyhdV9g7MnHahPqD73xjlbUBuqPvD4QNVP5CELn9kDVG3YSXtaWolI/qHspHiNpXNQhta19sDenPy0eid2/PdG0QVIJTNokCqUJJ+0H9kNnacv1E/fHwiD0n2vGPMY4K+e6F1Q2wSG0iRonx/KEzNqX9FBHNX9oHkp9Tx/tHdKn1I2qNsFJO1P+GD9lWXlCJm05J/h/wCr8oHqmJ9X2Q2qan1fIQNUDZhFO0py6Ju//wBYfRtUfU8C3ugN0o4eQ+MKEwfI/ODqjbMLTNq1ZlBA5q+MI/bJvRf+v+8D+k+fkx4ZvZA1Q1sInbAeoPv/ABENp2yA9ED+oe5MQOlj3F8tG1NbCA2olF8SEZknfHj1YSnaxIyCO4/nEIq7I8KuyBqg2wkna8ahJ/qEe/taj1U/fHwgTTj5CPMA4jwEbVAsKHaqUc0J++PhC0bSy9MI5FYgWlKeXgIXhTxHhAaQbYSXtSlskdyhp3w2vaaXmUp++PhA8oTx8oT0aeMFUCxjaO2ImqlzJYAU2Fe+kuAXT2NveMGUbSym/hgPxWPjEJMlJEIVITA4CEjtDKPop+9Hn66QfQln+qBnQp4x70SeMUSEYXVmY7SOjo6GcwkQjSOjoA4yuI0zSOjoVhPFQkR0dCmPZece/lHR0Yx6j3wpOsdHRhoizr3+6Ej3e6OjoDGOV8+cNjTujo6FMcMx86QnQx7HRjCDlC06R0dGMKGUInx0dGGQ8rT51MNojo6MEWr58ITHR0BmEx4rSPY6FZhRjhHR0AwmPdI6OjGFpjlx0dGGfQgZmFpjo6KCM//Z",
            pinned: false,
            pinnedDays: null,
            bookmarked: false,
        }
    ];

    // Tab selection state
    const [selectedTab, setSelectedTab] = useState('Recommended');

    // Fetch videos from backend on component mount or tab change
    useEffect(() => {
        setVideos([]); // Reset videos on tab change
        const fetchVideos = async () => {
            try {
                const BACKEND = (window && window.__BACKEND_URL__) || 'https://regaarder-pwin.onrender.com';
                console.log('Fetching videos from:', `${BACKEND}/videos`);

                // Fetch bookmarks to sync state
                const token = localStorage.getItem('regaarder_token');
                let bookmarkedVideoUrls = new Set();
                try {
                    const bookmarksRes = await fetch(`${BACKEND}/bookmarks`, {
                        headers: token ? { Authorization: `Bearer ${token}` } : {}
                    });
                    const bookmarksData = await bookmarksRes.json();
                    if (bookmarksData && bookmarksData.success && Array.isArray(bookmarksData.videos)) {
                        bookmarksData.videos.forEach(b => {
                            if (b.videoUrl) bookmarkedVideoUrls.add(String(b.videoUrl));
                        });
                    }
                } catch (e) {
                    console.warn('Failed to fetch bookmarks:', e);
                }

                const params = new URLSearchParams();
                if (selectedTab === 'Recommended') {
                    params.set('feed', 'recommended');
                } else if (selectedTab === 'Trending Now') {
                    params.set('feed', 'trending');
                } else if (selectedTab === 'New') {
                    params.set('feed', 'fresh');
                } else {
                    params.set('category', selectedTab);
                    params.set('feed', 'fresh');
                }

                const response = await fetch(`${BACKEND}/videos?${params.toString()}`);
                console.log('Fetch response:', response.status, response.ok);

                if (response.ok) {
                    const data = await response.json();
                    console.log('Fetched videos data:', data);

                    if (data.success && data.videos && data.videos.length > 0) {
                        console.log('Adding', data.videos.length, 'videos from backend');
                        // Ensure unique IDs and filter out blob URLs
                        // Also filter to show only public videos on the home page
                        let backendUrlObj = null;
                        try { backendUrlObj = new URL(BACKEND); } catch (e) { backendUrlObj = null; }
                        const backendHost = backendUrlObj ? backendUrlObj.host : (window && window.location ? window.location.host : '');
                        const backendProtocol = backendUrlObj ? backendUrlObj.protocol : (window && window.location ? window.location.protocol : 'https:');

                        const uniqueVideos = data.videos
                            .filter(video => {
                                // Exclude videos staff have hidden, deleted, or shadow-deleted so the
                                // homepage reflects staff actions and the change survives refresh.
                                if (video.hidden || video.deleted || video.shadowDeleted) return false;
                                // Only show public videos on home page
                                const isPublic = !video.appearance || video.appearance === 'public';
                                // Filter out videos with blob URLs as they're invalid across sessions
                                const hasValidImage = video.imageUrl && !video.imageUrl.startsWith('blob:');
                                const hasValidVideo = video.videoUrl && !video.videoUrl.startsWith('blob:');
                                return isPublic && (hasValidImage || hasValidVideo);
                            })
                            .map((video, index) => {
                                // Calculate relative time from timestamp
                                let relativeTime = 'Just now';
                                if (video.timestamp) {
                                    const now = Date.now();
                                    const diff = now - video.timestamp;
                                    const seconds = Math.floor(diff / 1000);
                                    const minutes = Math.floor(seconds / 60);
                                    const hours = Math.floor(minutes / 60);
                                    const days = Math.floor(hours / 24);
                                    const weeks = Math.floor(days / 7);
                                    const months = Math.floor(days / 30);

                                    if (seconds < 60) relativeTime = 'Just now';
                                    else if (minutes < 60) relativeTime = `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
                                    else if (hours < 24) relativeTime = `${hours} hour${hours > 1 ? 's' : ''} ago`;
                                    else if (days < 7) relativeTime = `${days} day${days > 1 ? 's' : ''} ago`;
                                    else if (weeks < 4) relativeTime = `${weeks} week${weeks > 1 ? 's' : ''} ago`;
                                    else relativeTime = `${months} month${months > 1 ? 's' : ''} ago`;
                                }

                                // Use a stable ID derived from backend id or timestamp (no random suffix)
                                const uniqueId = (video.id != null && video.id !== undefined) ? String(video.id) : (video.timestamp ? `ts-${video.timestamp}` : (video.videoUrl ? `url-${video.videoUrl}` : `idx-${index}`));
                                const normalizeMediaUrl = (rawUrl) => {
                                    if (!rawUrl || rawUrl.startsWith('blob:')) return null;
                                    try {
                                        const u = new URL(rawUrl, BACKEND);
                                        const host = (u.hostname || '').toLowerCase();
                                        const isLocalhost = host === 'localhost' || host === '127.0.0.1' || host === '0.0.0.0';
                                        if (backendProtocol) u.protocol = backendProtocol;
                                        if (backendHost) {
                                            const [bh, bp] = backendHost.split(':');
                                            if (isLocalhost || !u.host || u.protocol === 'capacitor:') {
                                                u.hostname = bh;
                                                if (bp) u.port = bp;
                                            }
                                        }
                                        return u.toString();
                                    } catch (e) {
                                        return rawUrl;
                                    }
                                };

                                const videoUrlRaw = (video.videoUrl || video.url || video.src) && !String(video.videoUrl || video.url || video.src).startsWith('blob:')
                                    ? (video.videoUrl || video.url || video.src)
                                    : null;
                                const videoUrl = normalizeMediaUrl(videoUrlRaw);

                                return {
                                    ...video,
                                    id: uniqueId,
                                    date: relativeTime,
                                    // Replace blob URLs with fallback placeholders
                                    imageUrl: (() => {
                                        const rawThumb = video.thumbnailUrl || video.thumbUrl || video.thumb || video.poster || video.cover || video.thumbnail || video.image;
                                        const url = (video.imageUrl && !video.imageUrl.startsWith('blob:'))
                                            ? video.imageUrl
                                            : (rawThumb || 'https://placehold.co/600x400/333333/ffffff?text=Video+Image+Unavailable');
                                        return normalizeMediaUrl(url) || url;
                                    })(),
                                    // Process author avatar if available
                                    authorAvatar: (() => {
                                        if (!video.authorAvatar) return null;
                                        return normalizeMediaUrl(video.authorAvatar) || video.authorAvatar;
                                    })(),
                                    // Process requester avatar if available
                                    requesterAvatar: (() => {
                                        if (!video.requesterAvatar) return null;
                                        return normalizeMediaUrl(video.requesterAvatar) || video.requesterAvatar;
                                    })(),
                                    videoUrl: videoUrl,
                                    // Ensure time field exists
                                    time: video.time || '0:00',
                                    // Parse time into duration in seconds for display
                                    duration: (() => {
                                        const timeStr = video.time || '0:00';
                                        const parts = timeStr.split(':');
                                        if (parts.length === 2) {
                                            const minutes = parseInt(parts[0]) || 0;
                                            const seconds = parseInt(parts[1]) || 0;
                                            return minutes * 60 + seconds;
                                        }
                                        return 0;
                                    })(),
                                    // Ensure requester field exists
                                    requester: video.requester || video.author || 'Unknown',
                                    // Sync bookmark state from backend
                                    bookmarked: videoUrl ? bookmarkedVideoUrls.has(String(videoUrl)) : false
                                };
                            });

                        // Only add if we have valid videos after filtering
                        if (uniqueVideos.length > 0) {
                            // Use a Set to track existing IDs and prevent duplicates
                            setVideos(prevVideos => {
                                const existingIds = new Set(prevVideos.map(v => v.id));
                                const newVideos = uniqueVideos.filter(v => !existingIds.has(v.id));
                                return [...newVideos, ...prevVideos];
                            });
                        }
                    } else {
                        console.log('No videos from backend');
                    }
                } else {
                    console.error('Failed to fetch videos:', response.status);
                }
            } catch (error) {
                console.error('Error fetching videos:', error);
            }
        };

        fetchVideos();

        // Refresh video stats every 60 seconds so view/like counts stay current
        const statsInterval = setInterval(async () => {
            try {
                const BACKEND = (window && window.__BACKEND_URL__) || 'https://pwin-copy-production.up.railway.app';
                const params = new URLSearchParams();
                if (selectedTab === 'Recommended') params.set('feed', 'recommended');
                else if (selectedTab === 'Trending Now') params.set('feed', 'trending');
                else if (selectedTab === 'New') params.set('feed', 'fresh');
                else { params.set('category', selectedTab); params.set('feed', 'fresh'); }

                const res = await fetch(`${BACKEND}/videos?${params.toString()}`);
                if (res.ok) {
                    const data = await res.json();
                    if (data.success && Array.isArray(data.videos)) {
                        setVideos(prev => prev.map(v => {
                            const updated = data.videos.find(bv => String(bv.id) === String(v.id));
                            if (updated) {
                                return {
                                    ...v,
                                    views: updated.views ?? v.views,
                                    likes: updated.likes ?? v.likes,
                                    comments: updated.comments ?? v.comments,
                                    bookmarks: updated.bookmarks ?? v.bookmarks
                                };
                            }
                            return v;
                        }));
                    }
                }
            } catch (e) {
                // Silent fail — stats refresh is best-effort
            }
        }, 60000);

        return () => clearInterval(statsInterval);
    }, [selectedTab]);

    // Filter the video data based on the search term
    const filteredVideos = videos.filter(video => {
        const term = searchTerm.toLowerCase();
        return (
            (video.title && video.title.toLowerCase().includes(term)) ||
            (video.author && video.author.toLowerCase().includes(term)) ||
            (video.requester && video.requester.toLowerCase().includes(term))
        );
    });



    // Helper to parse relative date strings like "2 days ago", "3 weeks ago", "1 month ago"
    const parseRelativeDate = (str) => {
        if (!str) return 0;
        const now = Date.now();
        const s = String(str).toLowerCase().trim();
        if (s.includes('just') || s.includes('now')) return now;
        const m = s.match(/(\d+)\s*(day|week|month|year)s?\s*ago/);
        if (m) {
            const n = parseInt(m[1], 10);
            const unit = m[2];
            const dayMs = 24 * 60 * 60 * 1000;
            if (unit === 'day') return now - n * dayMs;
            if (unit === 'week') return now - n * 7 * dayMs;
            if (unit === 'month') return now - n * 30 * dayMs;
            if (unit === 'year') return now - n * 365 * dayMs;
        }
        // Try to parse absolute date strings
        const parsed = Date.parse(str);
        if (!isNaN(parsed)) return parsed;
        return 0;
    };

    // Helper to format date string for display with translation
    const formatDate = (dateStr) => {
        if (!dateStr) return '';
        if (typeof dateStr !== 'string') return dateStr;

        const s = dateStr.trim();
        if (s.match(/just\s*now/i)) return getTranslation('Just now', selectedLanguage);

        const m = s.match(/(\d+)\s*(day|week|month|year|hour|minute)s?\s*ago/i);
        if (m) {
            const n = m[1];
            const unit = m[2].toLowerCase();
            return getTranslation(`{n} ${unit}s ago`, selectedLanguage).replace('{n}', n);
        }
        return dateStr;
    };

    // Helper to get video timestamp for sorting
    const getVideoTimestamp = (video) => {
        // Use timestamp field if available (from backend)
        if (video.timestamp && typeof video.timestamp === 'number') {
            return video.timestamp;
        }
        // Otherwise parse the date string
        return parseRelativeDate(video.date);
    };

    // Derive the list of videos to render based on the active tab
    let displayedVideos = filteredVideos.slice();
    if (selectedTab === 'New') {
        // Sort by timestamp (newest first)
        displayedVideos.sort((a, b) => getVideoTimestamp(b) - getVideoTimestamp(a));
    }

    const scrollableHeightStyle = {
        height: 'calc(100vh - 160px)',
    };

    // Handler for pinning a video
    const handlePinVideo = async (videoId, days) => {
        setVideos(prevVideos => {
            // Update pinned flag and days
            const updated = prevVideos.map(video =>
                video.id === videoId ? { ...video, pinned: true, pinnedDays: days } : video
            );

            // Move the pinned video to the top of the list
            const idx = updated.findIndex(v => v.id === videoId);
            if (idx > 0) {
                const [pinnedVideo] = updated.splice(idx, 1);
                updated.unshift(pinnedVideo);
            }

            return updated;
        });

        try {
            const BACKEND = (window && window.__BACKEND_URL__) || 'https://regaarder-pwin.onrender.com';
            const token = localStorage.getItem('regaarder_token');
            await fetch(`${BACKEND}/videos/${encodeURIComponent(videoId)}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
                body: JSON.stringify({ pinned: true, pinnedDays: days })
            }).catch(() => { });
        } catch (e) { }
    };

    // Helper: map selected language to flag emoji
    const languageToFlag = (lang) => {
        const map = {
            'English': '🇺🇸',
            'Español': '🇪🇸',
            'Spanish': '🇪🇸',
            'Français': '🇫🇷',
            'French': '🇫🇷',
            'Deutsch': '🇩🇪',
            'German': '🇩🇪',
            'Italiano': '🇮🇹',
            'Italian': '🇮🇹',
            'Português': '🇵🇹',
            'Portuguese': '🇵🇹',
            'Русский': '🇷🇺',
            'Russian': '🇷🇺',
            'Chinese Traditional': '🇹🇼',
        };
        return map[lang] || '🌐';
    };

    const selectedLanguageFlag = languageToFlag(selectedLanguage);

    return (
        // Main mobile container
        <div className="max-w-md mx-auto min-h-screen bg-gray-50 pb-40 font-sans shadow-2xl relative">
            {/* First-Time User Welcome Modals */}
            <RoleSelectionModal 
              isOpen={showRoleSelection} 
              onSelectRole={handleRoleSelect}
              selectedLanguage={selectedLanguage}
              onLanguageSelect={handleLanguageSelect}
            />
            <UserWelcomeModal 
              isOpen={showUserWelcome}
              onClose={() => setShowUserWelcome(false)}
              selectedLanguage={selectedLanguage}
            />
            <CreatorWelcomeModal 
              isOpen={showCreatorWelcome}
              onClose={() => setShowCreatorWelcome(false)}
              selectedLanguage={selectedLanguage}
            />

            {/* Staff Action Notification Modal */}
            {staffActionNotification && (
                <div
                    className="fixed inset-0 flex items-center justify-center z-50"
                    style={{ backgroundColor: 'rgba(0,0,0,0.64)', backdropFilter: 'blur(8px)', WebkitBackdropFilter: 'blur(8px)', transition: 'backdrop-filter 200ms ease, -webkit-backdrop-filter 200ms ease, background 200ms ease', cursor: 'pointer' }}
                    onClick={async () => {
                        // Get the ctaUrl if available
                        const ctaUrl = staffActionNotification.ctaUrl || (staffActionNotification.meta && staffActionNotification.meta.ctaUrl);
                        
                        // Mark notification as read on backend
                        try {
                            const token = localStorage.getItem('regaarder_token');
                            if (token && staffActionNotification.id) {
                                const BACKEND = (window && window.__BACKEND_URL__) || 'https://regaarder-pwin.onrender.com';
                                await fetch(`${BACKEND}/notifications/${staffActionNotification.id}/read`, {
                                    method: 'POST',
                                    headers: { 'Authorization': `Bearer ${token}` }
                                });
                            }
                        } catch (e) {
                            console.warn('Failed to mark notification as read', e);
                        }
                        
                        // Redirect to URL if available (for promotions)
                        if (ctaUrl && staffActionNotification.action === 'promotion') {
                            const url = ctaUrl.startsWith('http') ? ctaUrl : `https://${ctaUrl}`;
                            window.open(url, '_blank', 'noopener,noreferrer');
                        }
                        
                        // Close modal
                        setStaffActionNotification(null);
                    }}
                    role="dialog"
                    aria-modal="true"
                >
                    <div
                        className="bg-white rounded-lg p-6 max-w-sm mx-4 shadow-lg"
                        style={{ cursor: 'pointer' }}
                        onClick={(e) => {
                            // Don't stop propagation - let the click bubble to parent which handles everything
                        }}
                    >
                        <div className="text-center">
                            {/* Icon */}
                            <div style={{
                                width: '80px',
                                height: '80px',
                                borderRadius: '50%',
                                margin: '0 auto 16px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontSize: '36px',
                                backgroundColor:
                                    staffActionNotification.action === 'warn' ? '#fef3c7' :
                                    staffActionNotification.action === 'ban' ? '#fecaca' :
                                    staffActionNotification.action === 'shadowban' ? '#d1d5db' :
                                    staffActionNotification.action === 'delete' ? '#ddd6fe' :
                                    staffActionNotification.action === 'promotion' ? '#eef2ff' : '#f0fdf4'
                            }}>
                                {staffActionNotification.action === 'warn' && '⚠️'}
                                {staffActionNotification.action === 'ban' && '🚫'}
                                {staffActionNotification.action === 'shadowban' && '👁️'}
                                {staffActionNotification.action === 'delete' && '🗑️'}
                                {/* Use custom CTA icon when available for promotions */}
                                {staffActionNotification.action === 'promotion' && (
                                    (() => {
                                        const ico = staffActionNotification.ctaIcon || (staffActionNotification.meta && staffActionNotification.meta.ctaIcon) || 'gift';
                                        return (
                                            ico === 'gift' ? '🎁' :
                                            ico === 'star' ? '⭐' :
                                            ico === 'megaphone' ? '📢' :
                                            ico === 'heart' ? '❤️' :
                                            ico === 'fire' ? '🔥' :
                                            ico === 'check' ? '✅' :
                                            ico === 'arrow' ? '→' : '🎁'
                                        );
                                    })()
                                )}
                            </div>

                            {/* Title */}
                            <h3 style={{
                                margin: '0 0 12px',
                                fontSize: '18px',
                                fontWeight: '700',
                                color: '#1f2937'
                            }}>
                                {staffActionNotification.title}
                            </h3>

                            {/* Message */}
                            <p style={{
                                margin: '0 0 24px',
                                fontSize: '14px',
                                color: '#666',
                                lineHeight: '1.5',
                                whiteSpace: 'pre-wrap'
                            }}>
                                {staffActionNotification.message}
                            </p>

                            {/* CTA Button - Shows URL hint for promotions with URL */}
                            <div
                                style={{
                                    width: '100%',
                                    padding: '12px 16px',
                                    backgroundColor:
                                        staffActionNotification.action === 'promotion' ? (staffActionNotification.ctaColor || staffActionNotification.meta?.ctaColor || '#f59e0b') :
                                        staffActionNotification.action === 'warn' ? '#f59e0b' :
                                        staffActionNotification.action === 'ban' ? '#ef4444' :
                                        staffActionNotification.action === 'shadowban' ? '#6b7280' :
                                        staffActionNotification.action === 'delete' ? '#8b5cf6' : '#f59e0b',
                                    color: 'white',
                                    border: 'none',
                                    borderRadius: '6px',
                                    cursor: 'pointer',
                                    fontSize: '14px',
                                    fontWeight: '600',
                                    transition: 'background-color 0.2s',
                                    textAlign: 'center'
                                }}
                            >
                                {staffActionNotification.ctaText || (staffActionNotification.meta && staffActionNotification.meta.ctaText) || (staffActionNotification.action === 'shadowban' ? 'Learn More' : 'Acknowledge')}
                            </div>
                            
                            {/* Tap hint for promotions with URL */}
                            {staffActionNotification.action === 'promotion' && (staffActionNotification.ctaUrl || (staffActionNotification.meta && staffActionNotification.meta.ctaUrl)) && (
                                <p style={{
                                    margin: '12px 0 0',
                                    fontSize: '11px',
                                    color: '#9ca3af',
                                    textAlign: 'center'
                                }}>
                                    Tap anywhere to dismiss
                                </p>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {!showFullscreenPlayer && (
                <TopHeader setIsDrawerOpen={setIsDrawerOpen} navigate={navigate} selectedLanguage={selectedLanguage} onLanguageSelect={handleLanguageSelect} />
            )}
            {/* Main scrollable content area */}
            <div className="overflow-y-auto" style={scrollableHeightStyle}>
                <SearchBar searchTerm={searchTerm} setSearchTerm={setSearchTerm} onFocusChange={setIsSearchActive} selectedLanguage={selectedLanguage} videos={videos} navigate={navigate} />
                <TabPills activeTab={selectedTab} setActiveTab={setSelectedTab} selectedLanguage={selectedLanguage} />

                {/* Conditional Rendering: If search term is active and no results, show 404 screen */}
                {displayedVideos.length > 0 ? (
                    displayedVideos.map(video => (
                        <ContentCard
                            key={video.id}
                            video={video}
                            allVideos={videos}
                            onReportVideo={handleReportVideo}
                            onPinVideo={handlePinVideo}
                            onOpenProfile={handleOpenProfile}
                            onToggleBookmark={handleToggleBookmark} // <-- pass toggle handler
                            onUnpinVideo={handleUnpinVideo} // <-- pass unpin handler
                            onOpenShare={handleOpenShare} // <-- pass open share handler
                            onNotInterested={handleNotInterested} // <-- pass not interested handler
                            selectedLanguage={selectedLanguage} // pass current language
                            onAddToPlaylistStart={(v) => { setPlaylistTargetVideo(v); setIsPlaylistPickerOpen(true); }}
                            onVideoClick={async () => {
                                showVideoLaunchMask();
                                // Store all current videos in localStorage for discover modal to use
                                // Normalize the videos to ensure consistent property names
                                try {
                                    const normalizedVideos = videos.map(v => ({
                                        ...v,
                                        url: v.url || v.videoUrl,
                                        videoUrl: v.videoUrl || v.url,
                                        creator: v.creator || v.author,
                                        thumbnail: v.thumbnail || v.imageUrl,
                                    }));
                                    localStorage.setItem('discoverAllVideos', JSON.stringify(normalizedVideos));
                                } catch (e) { }

                                // Fetch the latest video data from backend to ensure ads are up-to-date
                                let freshVideo = video;
                                try {
                                    const BACKEND = (window && window.__BACKEND_URL__) || 'https://regaarder-pwin.onrender.com';
                                    const freshResponse = await fetch(`${BACKEND}/videos/${encodeURIComponent(video.id)}`);
                                    if (freshResponse.ok) {
                                        const freshData = await freshResponse.json();
                                        if (freshData && freshData.id) {
                                            freshVideo = freshData;
                                            console.log('Refreshed video data for ads:', freshVideo.id);
                                        }
                                    }
                                } catch (e) {
                                    console.warn('Could not refresh video data:', e);
                                    // Use stale video if fetch fails
                                }

                                // Overlays are now part of the video object from the backend
                                const overlays = freshVideo.overlays || [];

                                // Show fullscreen videoplayer as overlay (seamless transition)
                                const initialVideoData = {
                                    id: freshVideo.id || '',
                                    title: freshVideo.title || '',
                                    author: freshVideo.author || '',
                                    requester: freshVideo.requester || '',
                                    videoUrl: freshVideo.videoUrl || freshVideo.url || freshVideo.src || '',
                                    url: freshVideo.url || freshVideo.videoUrl || freshVideo.src || '',
                                    imageUrl: freshVideo.imageUrl || '',
                                    views: freshVideo.views || 0,
                                    likes: freshVideo.likes || 0,
                                    comments: freshVideo.comments || 0,
                                    duration: freshVideo.duration || 0,
                                    time: freshVideo.time || '',
                                    overlays: overlays,
                                    ads: freshVideo.ads || {},
                                };

                                // Web: navigate to /videoplayer route instead of overlay
                                try {
                                    const isNative = window?.Capacitor?.isNativePlatform?.() === true;
                                    if (!isNative) {
                                        try {
                                            localStorage.setItem('videoplayer_quick_load', JSON.stringify({
                                                url: initialVideoData.videoUrl || initialVideoData.url,
                                                title: initialVideoData.title || '',
                                                creator: initialVideoData.author || '',
                                                time: initialVideoData.time || ''
                                            }));
                                        } catch { }
                                        const params = new URLSearchParams();
                                        if (initialVideoData.videoUrl || initialVideoData.url) params.set('src', initialVideoData.videoUrl || initialVideoData.url);
                                        if (initialVideoData.title) params.set('title', initialVideoData.title);
                                        if (initialVideoData.author) params.set('channel', initialVideoData.author);
                                        // Use React Router navigate for in-app navigation (no reload)
                                        navigate(`/videoplayer?${params.toString()}`, { state: { video: initialVideoData } });
                                        return;
                                    }
                                } catch { }
                                
                                setFullscreenPlayerData({
                                    video: initialVideoData,
                                    initialVideo: initialVideoData,
                                    discoverItems: videos,
                                });
                                setShowFullscreenPlayer(true);
                                setIsTransitioningToMiniPlayer(false);

                                // Enable immersive mode on Android when opening the player
                                try {
                                    if (Capacitor && Capacitor.isNativePlatform && Capacitor.isNativePlatform()) {
                                        if (ImmersiveMode) ImmersiveMode.setImmersive({ enabled: true });
                                        const platform = Capacitor.getPlatform ? Capacitor.getPlatform() : null;
                                        if (platform === 'android' && SystemBars) {
                                            SystemBars.hide?.({ bar: 'StatusBar' });
                                            SystemBars.hide?.({ bar: 'NavigationBar' });
                                        }
                                        if (platform === 'ios' && SystemBars) {
                                            SystemBars.hide?.({ bar: 'StatusBar', animation: 'FADE' });
                                            SystemBars.hide?.({ bar: 'NavigationBar' });
                                        }
                                    }
                                } catch (e) { console.warn('Immersive mode error:', e); }
                            }} // <-- pass video click handler with video data
                        />
                    ))
                ) : (searchTerm.length > 0 && (
                    <div className="flex flex-col items-center justify-center text-center px-8 pt-0" style={{ marginTop: '-18px' }}>
                        <p
                            className="text-8xl font-light mb-4"
                            style={{
                                background: 'var(--gradient-404)',
                                WebkitBackgroundClip: 'text',
                                WebkitTextFillColor: 'transparent',
                                opacity: 0.9,
                            }}
                        >
                            404
                        </p>


                        <div className="mb-4 flex items-center justify-center">
                            <div aria-hidden="true" className="w-36 h-28 flex items-center justify-center">
                                {/* Decorative community SVG — friendly, optimistic */}
                                <svg viewBox="0 0 160 120" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
                                    <defs>
                                        <linearGradient id="g1" x1="0" x2="1">
                                            <stop offset="0" stopColor="rgba(34,197,94,0.12)" />
                                            <stop offset="1" stopColor="rgba(124,58,237,0.08)" />
                                        </linearGradient>
                                    </defs>
                                    <rect x="0" y="10" width="160" height="80" rx="20" fill="url(#g1)" />
                                    <g transform="translate(18,26)" fill="#ffffff" opacity="0.98">
                                        <circle cx="28" cy="24" r="10" fill="#d1fae5" />
                                        <circle cx="68" cy="24" r="10" fill="#ecfccb" />
                                        <circle cx="108" cy="24" r="10" fill="#eef2ff" />
                                        <path d="M18 60c8-10 22-16 40-16s32 6 40 16" fill="#ffffff" opacity="0.07" />
                                    </g>
                                    <g transform="translate(18,26)" fill="#0f172a" opacity="0.9">
                                        <circle cx="28" cy="24" r="4" />
                                        <circle cx="68" cy="24" r="4" />
                                        <circle cx="108" cy="24" r="4" />
                                    </g>
                                </svg>
                            </div>
                        </div>

                        <h2 className="text-xl font-medium text-gray-800 mb-2">
                            Not in the collection... yet
                        </h2>

                        <p className="text-sm text-gray-600 mb-12 max-w-xs leading-relaxed">
                            You're early. You discovered something missing and you can help complete the set.
                        </p>

                        <div className="w-full flex justify-center">
                            <button
                                className="w-full max-w-[260px] py-2 rounded-full text-base font-semibold text-black transition-shadow duration-300"
                                style={{
                                    background: 'linear-gradient(180deg, #fafbf9 0%, #f3f6f1 100%)',
                                    border: '1px solid rgba(0,0,0,0.06)',
                                    boxShadow: '0 10px 24px rgba(34,197,94,0.06), 0 2px 6px rgba(0,0,0,0.06)',
                                    backgroundImage: 'linear-gradient(90deg, rgba(34,197,94,0.06), rgba(124,58,237,0.04))'
                                }}
                                onMouseDown={(e) => {
                                    try { if (e && e.preventDefault) e.preventDefault(); } catch (err) { }
                                    try {
                                        const url = '/ideas' + (searchTerm ? `?q=${encodeURIComponent(searchTerm)}` : '');
                                        navigate(url);
                                    } catch (e) {
                                        console.warn('Redirect failed', e);
                                    }
                                }}
                                onTouchStart={(e) => {
                                    try { if (e && e.preventDefault) e.preventDefault(); } catch (err) { }
                                    try {
                                        const url = '/ideas' + (searchTerm ? `?q=${encodeURIComponent(searchTerm)}` : '');
                                        navigate(url);
                                    } catch (e) {
                                        console.warn('Redirect failed', e);
                                    }
                                }}
                                onClick={(e) => { if (e && e.preventDefault) e.preventDefault(); }}
                            >
                                Request This Video
                            </button>
                        </div>

                        <div className="mt-12 w-1/2 h-0.5 bg-gray-300 opacity-50 shadow-inner"></div>
                    </div>
                ))}
            </div>

            {!(isSearchActive || (searchTerm && searchTerm.length > 0)) && (
                <FloatingActionButton searchTerm={searchTerm} navigate={navigate} selectedLanguage={selectedLanguage} onOpenSupportTicket={handleOpenSupportTicket} showWelcomeModals={showRoleSelection || showUserWelcome || showCreatorWelcome} isDrawerOpen={isDrawerOpen} />
            )}
            <SideDrawer isDrawerOpen={isDrawerOpen} onClose={() => setIsDrawerOpen(false)} onOpenTheme={handleOpenTheme} onOpenLanguage={handleOpenLanguage} currentLanguageFlag={selectedLanguageFlag} onOpenCreator={handleOpenCreatorOnboarding} navigateTo={navigateTo} selectedLanguage={selectedLanguage} />
            <BottomBar selectedLanguage={selectedLanguage} />

            {/* Beta Wait Modal (cold-start friendly) */}
            {showBetaWaitModal && (
                <div className="fixed inset-0 z-[200] flex items-center justify-center">
                    <div className="absolute inset-0 bg-black/50" onClick={handleCloseBetaWait}></div>
                    <div className="relative w-[92%] max-w-md bg-white rounded-2xl shadow-2xl p-6">
                        <div className="flex items-start justify-between gap-3">
                            <div className="flex items-center gap-2">
                                <span className="text-[10px] uppercase tracking-widest px-2 py-1 rounded-full font-semibold" style={{ backgroundColor: 'rgba(124,58,237,0.12)', color: 'var(--color-final, #7C3AED)' }}>Beta</span>
                                <h2 className="text-lg font-semibold text-gray-900">Thanks for being early</h2>
                            </div>
                        </div>

                        <p className="text-sm text-gray-600 mt-2">
                            We’re warming up our beta servers so your first experience feels smooth and reliable. Your patience helps us improve for everyone.
                        </p>

                        <div className="mt-4 flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full border-2 border-t-transparent animate-spin" style={{ borderColor: 'var(--color-final, #7C3AED)', borderTopColor: 'transparent' }} aria-hidden="true"></div>
                            <div className="flex-1">
                                <div className="text-xs text-gray-500">Estimated wait</div>
                                <div className={`text-2xl font-semibold ${betaCountdown <= 20 ? 'text-emerald-600' : 'text-red-500'}`}>{formatWait(betaCountdown)}</div>
                            </div>
                        </div>

                        <div className="mt-4 h-2 bg-gray-200 rounded-full overflow-hidden">
                            <div
                                className="h-full transition-all duration-300"
                                style={{ width: `${betaProgress}%`, backgroundColor: 'var(--color-final, #7C3AED)' }}
                            ></div>
                        </div>

                        <div className="mt-4 space-y-2 text-sm text-gray-600">
                            <div className="flex items-center gap-2">
                                <span className={`w-5 h-5 rounded-full flex items-center justify-center text-xs ${betaStepPhase >= 1 ? 'bg-emerald-100 text-emerald-700' : betaStepPhase === 0 ? 'bg-purple-100 text-purple-700' : 'bg-gray-100 text-gray-500'}`}>
                                    {betaStepPhase >= 1 ? <Check size={12} /> : '1'}
                                </span>
                                <span>{betaStepPhase === 0 ? 'Waking servers…' : 'Waking servers for a steady experience'}</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <span className={`w-5 h-5 rounded-full flex items-center justify-center text-xs ${betaStepPhase >= 3 ? 'bg-emerald-100 text-emerald-700' : betaStepPhase === 2 ? 'bg-purple-100 text-purple-700' : 'bg-gray-100 text-gray-500'}`}>
                                    {betaStepPhase >= 3 ? <Check size={12} /> : '2'}
                                </span>
                                <span>{betaStepPhase === 2 ? 'Syncing content…' : 'Syncing content so everything loads cleanly'}</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <span className={`w-5 h-5 rounded-full flex items-center justify-center text-xs ${betaStepPhase >= 5 ? 'bg-emerald-100 text-emerald-700' : betaStepPhase === 4 ? 'bg-purple-100 text-purple-700' : 'bg-gray-100 text-gray-500'}`}>
                                    {betaStepPhase >= 5 ? <Check size={12} /> : '3'}
                                </span>
                                <span>{betaStepPhase === 4 ? 'Final polish…' : 'Final polish before you jump in'}</span>
                            </div>
                        </div>

                        <div className="mt-5 flex items-center justify-between">
                            <button onClick={handleCloseBetaWait} className="text-xs text-gray-500 underline">Enter anyway</button>
                            <div className="text-xs text-gray-500">Thank you for shaping the beta</div>
                        </div>
                    </div>
                </div>
            )}

            {/* Mini Player (Floating) - Extracted for performance */}
            {showMiniPlayer && miniPlayerData && (
                <MiniPlayer
                    data={miniPlayerData}
                    onClose={() => {
                        // CRITICAL: Set synchronous closed flag FIRST to stop timeupdate from re-writing localStorage
                        miniPlayerClosedRef.current = true;
                        // Set flag to prevent switchToHome event from immediately showing miniplayer again
                        skipNextSwitchToHomeRef.current = true;
                        // Mark when miniplayer was explicitly closed to prevent auto-restore
                        miniPlayerClosedTimestampRef.current = Date.now();
                        // Persist closed state in sessionStorage so it survives component remounts
                        try { sessionStorage.setItem('miniPlayerClosed', String(Date.now())); } catch (e) { }
                        // Synchronously nuke localStorage BEFORE React batches state updates
                        try { localStorage.removeItem('miniPlayerData'); } catch (e) { }
                        setShowMiniPlayer(false);
                        setMiniPlayerData(null);
                        // Double-remove after React flush in case timeupdate snuck one in
                        setTimeout(() => { try { localStorage.removeItem('miniPlayerData'); } catch (e) { } }, 50);
                        setTimeout(() => { try { localStorage.removeItem('miniPlayerData'); } catch (e) { } }, 200);
                        // Clean up any lingering vp-launch-mask that could block taps
                        try { const m = document.getElementById('vp-launch-mask'); if (m) m.remove(); } catch (e) { }
                        // Safety net: emit clearOverride to restore the Routes tree if App.jsx
                        // had previously replaced it via switchToHomeOnly
                        try { eventBus.emit('clearOverride'); } catch (e) { }
                    }}
                    onExpand={(currentTime) => {
                        // Expand mini-player back to fullscreen videoplayer
                        setShowMiniPlayer(false);
                        
                        // Reconstruct fullscreen player data from mini player data
                        if (miniPlayerData && miniPlayerData.video) {
                            // Use live currentTime from MiniPlayer if available, else fallback to stored time
                            const seekTime = (typeof currentTime === 'number' && currentTime > 0) ? currentTime : (miniPlayerData.time || 0);
                            setFullscreenPlayerData({
                                video: miniPlayerData.video,
                                initialVideo: {
                                    ...miniPlayerData.video,
                                    seekTo: seekTime,
                                    duration: miniPlayerData.duration || 0,
                                },
                                discoverItems: videos, // or use whatever video list is available
                            });
                            setShowFullscreenPlayer(true);
                        }
                    }}
                    onUpdateData={setMiniPlayerData}
                    navigate={navigate}
                    onMiniPlayerReady={() => {
                        // MiniPlayer is ready - now safe to close fullscreen player
                        // This creates a seamless handoff like YouTube
                        // Use ref to avoid stale closure issues
                        if (showFullscreenPlayerRef.current) {
                            setShowFullscreenPlayer(false);
                            setFullscreenPlayerData(null);
                            setIsTransitioningToMiniPlayer(false);
                        }
                    }}
                />
            )}

            {/* FULLSCREEN VIDEOPLAYER OVERLAY - Seamless Transition */}
            {showFullscreenPlayer && fullscreenPlayerData && (
                <div
                    className="fixed inset-0 z-[120] bg-black"
                >
                    <style>{`
                        @keyframes fadeInOverlay {
                            from { opacity: 0; }
                            to { opacity: 1; }
                        }
                        @keyframes fadeOutOverlay {
                            from { opacity: 1; }
                            to { opacity: 0; }
                        }
                        .fullscreen-videoplayer-overlay {
                            animation: fadeInOverlay 0.3s ease-in-out forwards;
                        }
                        .fullscreen-videoplayer-overlay.closing {
                            animation: fadeOutOverlay 0.3s ease-in-out forwards;
                        }
                    `}</style>
                    <Videoplayer
                        onChevronDown={(storedData) => {
                            // Transition to miniplayer
                            miniPlayerClosedRef.current = false; // Reset closed flag — intentional open via minimize
                            setIsTransitioningToMiniPlayer(true);
                            
                            // CRITICAL: Move global video element to document.body BEFORE unmounting Videoplayer
                            // This prevents it from being removed from DOM when Videoplayer unmounts
                            try {
                                const v = globalVideoRef && globalVideoRef.current;
                                if (v && v.parentNode) {
                                    // Temporarily move video to body so it survives Videoplayer unmount
                                    v.style.position = 'fixed';
                                    v.style.top = '-9999px';
                                    v.style.left = '-9999px';
                                    v.style.width = '1px';
                                    v.style.height = '1px';
                                    v.style.opacity = '0';
                                    document.body.appendChild(v);
                                }
                            } catch (e) { console.warn('Failed to preserve video element', e); }
                            
                            // Use the data passed from Videoplayer which includes current time and paused: false
                            // This ensures seamless playback continuation
                            if (storedData && storedData.video) {
                                // storedData from Videoplayer already has:
                                // - video: full video info
                                // - time: current playback time
                                // - paused: false (to keep playing)
                                const miniData = {
                                    ...storedData,
                                    paused: false // Ensure video keeps playing in miniplayer
                                };
                                
                                try {
                                    localStorage.setItem('miniPlayerData', JSON.stringify(miniData));
                                } catch (e) { }
                                
                                // Preload thumbnail before showing MiniPlayer (prevents empty flash)
                                const thumbUrl = storedData.video?.imageUrl || storedData.video?.thumbnail || '';
                                if (thumbUrl) {
                                    const img = new Image();
                                    img.onload = () => {
                                        setMiniPlayerData(miniData);
                                        setShowMiniPlayer(true);
                                    };
                                    img.onerror = () => {
                                        // Show anyway if thumbnail fails
                                        setMiniPlayerData(miniData);
                                        setShowMiniPlayer(true);
                                    };
                                    img.src = thumbUrl;
                                    // Fallback timeout in case image takes too long
                                    setTimeout(() => {
                                        if (!showMiniPlayer) {
                                            setMiniPlayerData(miniData);
                                            setShowMiniPlayer(true);
                                        }
                                    }, 300);
                                } else {
                                    setMiniPlayerData(miniData);
                                    setShowMiniPlayer(true);
                                }
                            } else if (fullscreenPlayerData && fullscreenPlayerData.video) {
                                // Fallback: build miniData from fullscreenPlayerData
                                let currentTime = 0;
                                try {
                                    const v = globalVideoRef && globalVideoRef.current;
                                    if (v) {
                                        currentTime = v.currentTime || 0;
                                    }
                                } catch (e) { }
                                const miniData = {
                                    video: fullscreenPlayerData.video,
                                    time: currentTime,
                                    paused: false // Keep playing
                                };
                                
                                try {
                                    localStorage.setItem('miniPlayerData', JSON.stringify(miniData));
                                } catch (e) { }
                                
                                // Preload thumbnail before showing MiniPlayer
                                const thumbUrl = fullscreenPlayerData.video?.imageUrl || fullscreenPlayerData.video?.thumbnail || '';
                                if (thumbUrl) {
                                    const img = new Image();
                                    img.onload = () => {
                                        setMiniPlayerData(miniData);
                                        setShowMiniPlayer(true);
                                    };
                                    img.onerror = () => {
                                        setMiniPlayerData(miniData);
                                        setShowMiniPlayer(true);
                                    };
                                    img.src = thumbUrl;
                                    setTimeout(() => {
                                        if (!showMiniPlayer) {
                                            setMiniPlayerData(miniData);
                                            setShowMiniPlayer(true);
                                        }
                                    }, 300);
                                } else {
                                    setMiniPlayerData(miniData);
                                    setShowMiniPlayer(true);
                                }
                            }

                            // Restore system UI when exiting to miniplayer
                            try {
                                if (Capacitor && Capacitor.isNativePlatform && Capacitor.isNativePlatform()) {
                                    ImmersiveMode.setImmersive({ enabled: false });
                                    const platform = Capacitor.getPlatform ? Capacitor.getPlatform() : null;
                                    if (platform === 'ios') {
                                        SystemBars?.show?.({ bar: 'StatusBar', animation: 'FADE' });
                                        SystemBars?.show?.({ bar: 'NavigationBar' });
                                    }
                                    if (platform === 'android') {
                                        SystemBars?.show?.({ bar: 'StatusBar' });
                                        SystemBars?.show?.({ bar: 'NavigationBar' });
                                    }
                                }
                            } catch (e) { }
                            
                            // DON'T close fullscreen player here - wait for MiniPlayer to signal ready
                            // This creates seamless handoff like YouTube (no empty flash)
                            // Fullscreen closes via onMiniPlayerReady callback
                            // Fallback timeout in case callback doesn't fire
                            // Uses ref to avoid stale closure issues
                            // Immediately close fullscreen overlay - don't wait for MiniPlayer ready
                            setShowFullscreenPlayer(false);
                            setFullscreenPlayerData(null);
                            setIsTransitioningToMiniPlayer(false);
                            // Always clean body styles on exit regardless
                            try {
                                const immersiveStyle = document.getElementById('regaarder-immersive-style');
                                if (immersiveStyle) immersiveStyle.remove();
                            } catch (e) {}
                            try {
                                document.documentElement.style.overflow = '';
                                document.body.style.overflow = '';
                                document.body.style.position = '';
                                document.body.style.width = '';
                                document.body.style.height = '';
                            } catch (e) {}
                        }}
                        data={fullscreenPlayerData}
                        initialVideo={fullscreenPlayerData?.initialVideo}
                        discoverItems={fullscreenPlayerData?.discoverItems || []}
                    />
                </div>
            )}

            {/* NEW: Global Report Video Dialog */}
            {isReportDialogOpen && videoToReport && (
                <ReportVideoDialog
                    video={videoToReport}
                    onClose={handleCloseReportDialog}
                    selectedLanguage={selectedLanguage}
                />
            )}

            {/* Render global profile dialog */}
            {isProfileOpen && profileUser && (
                <ProfileDialog
                    name={profileUser}
                    username={profileUser}
                    isCreator={profileIsCreator}
                    onClose={handleCloseProfile}
                    profileData={profileData}
                    creatorId={profileCreatorId}
                    selectedLanguage={selectedLanguage}
                />
            )}

            {/* Render global share dialog */}
            {isShareOpen && (
                <ShareDialog
                    onClose={handleCloseShare}
                    link={shareVideo ? (
                        (shareVideo.id || shareVideo.videoId)
                            ? `${WEB_URL}/share/video/${encodeURIComponent(shareVideo.id || shareVideo.videoId)}`
                            : `${WEB_URL}/videoplayer?src=${encodeURIComponent(shareVideo.url || shareVideo.videoUrl || shareVideo.src || '')}`
                    ) : `${WEB_URL}/home`}
                    onCopySuccess={handleCopySuccess}
                    selectedLanguage={selectedLanguage}
                />
            )}

            {/* Render playlist picker dialog */}
            {isPlaylistPickerOpen && playlistTargetVideo && (
                <PlaylistPickerDialog
                    video={playlistTargetVideo}
                    onClose={() => { setIsPlaylistPickerOpen(false); setPlaylistTargetVideo(null); }}
                    onAdded={() => { setToast({ show: true, type: 'success', title: 'Success', message: 'Added to playlist' }); setTimeout(() => setToast(prev => ({ ...prev, show: false })), 2000); }}
                    selectedLanguage={selectedLanguage}
                />
            )}

            {/* Theme modal is now global via ThemeProvider */}

            {/* NEW: Language Dialog */}
            {isLanguageDialogOpen && (
                <LanguageDialog onClose={handleCloseLanguage} selectedLanguage={selectedLanguage} onSelectLanguage={handleSelectLanguage} />
            )}

            {/* NEW: Creator Onboarding Dialog */}
            {isCreatorOnboardingOpen && (
                <CreatorOnboardingDialog onClose={handleCloseCreatorOnboarding} selectedLanguage={selectedLanguage} />
            )}

            {/* Toast Notification */}
            <Toast
                show={toast.show}
                type={toast.type}
                title={toast.title}
                message={toast.message}
                onClose={() => setToast(prev => ({ ...prev, show: false }))}
            />
        </div>
    );
};

// --- ContentCard Component (where the fix is applied) ---

const ContentCard = ({ video, onReportVideo, onPinVideo, onOpenProfile, onToggleBookmark, onUnpinVideo, onOpenShare, onNotInterested, onVideoClick, onAddToPlaylistStart, allVideos = [], selectedLanguage = 'English' }) => { // added tooltip props and allVideos

    // Helper to format date string for display with translation (local to card to avoid scoping issues)
    const formatDate = (dateStr) => {
        if (!dateStr) return '';
        if (typeof dateStr !== 'string') return dateStr;

        const s = dateStr.trim();
        if (s.match(/just\s*now/i)) return getTranslation('Just now', selectedLanguage);

        const m = s.match(/(\d+)\s*(day|week|month|year|hour|minute)s?\s*ago/i);
        if (m) {
            const n = m[1];
            const unit = m[2].toLowerCase();
            return getTranslation(`{n} ${unit}s ago`, selectedLanguage).replace('{n}', n);
        }
        return dateStr;
    };

    const isFirstCard = video.id === 1;
    const [cardState, setCardState] = useState('details');
    const [isTourActive, setIsTourActive] = useState(isFirstCard);
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [dialogPos, setDialogPos] = useState(null);
    const [isPinDialogOpen, setIsPinDialogOpen] = useState(false); // <--- NEW

    const touchStartX = useRef(0);
    const touchEndX = useRef(0);
    const SWIPE_THRESHOLD = 50;
    const timeoutsRef = useRef([]);
    // Ref for the entire card to manage dialog visibility based on clicks outside
    const cardRef = useRef(null);
    // Show the Requested badge only for first-time users (persisted in localStorage)
    const [requestedVisible, setRequestedVisible] = useState(() => {
        try {
            return !localStorage.getItem('requested_badge_seen');
        } catch (e) { return true; }
    });

    // Track if user has seen the "Swipe for stats" hint
    const [showSwipeHint, setShowSwipeHint] = useState(() => {
        try {
            return !localStorage.getItem('swipe_stats_seen');
        } catch (e) { return true; }
    });

    // Auto-hide the badge after a short timeout and mark as seen
    useEffect(() => {
        if (!requestedVisible) return;
        const t = setTimeout(() => {
            try { localStorage.setItem('requested_badge_seen', '1'); } catch (e) { }
            setRequestedVisible(false);
        }, 8000);
        return () => clearTimeout(t);
    }, [requestedVisible]);

    // YouTube duration: if video.time is "0:00" and we have a cached duration from a prior playback, use it
    const isYTCardUrl = (url) => url && (url.includes('youtube.com') || url.includes('youtu.be'));
    const getYTCardId = (url) => {
        if (!url) return '';
        if (url.includes('youtu.be/')) return url.split('youtu.be/')[1].split(/[?&#]/)[0];
        if (url.includes('youtube.com')) { try { return new URL(url).searchParams.get('v') || ''; } catch { return ''; } }
        return '';
    };
    const [displayTime, setDisplayTime] = useState(() => {
        const timeVal = video.time || '0:00';
        if (timeVal !== '0:00') return timeVal;
        // Check localStorage cache for YouTube durations
        const vUrl = video.videoUrl || video.url || video.src || '';
        if (isYTCardUrl(vUrl)) {
            const ytId = getYTCardId(vUrl);
            if (ytId) {
                try {
                    const cached = localStorage.getItem(`yt_dur_${ytId}`);
                    if (cached) {
                        const secs = parseInt(cached) || 0;
                        if (secs > 0) {
                            const m = Math.floor(secs / 60);
                            const s = secs % 60;
                            return `${m}:${String(s).padStart(2, '0')}`;
                        }
                    }
                } catch { }
            }
        }
        return timeVal;
    });

    const statsData = {
        likes: (video.stats && video.stats.likes) || video.likes || video.likeCount || '0',
        dislikes: (video.stats && video.stats.dislikes) || video.dislikes || video.dislikeCount || '0',
        views: (video.stats && video.stats.views) || video.views || video.viewCount || '0',
        comments: (video.stats && video.stats.comments) || video.comments || video.commentCount || '0',
        shares: (video.stats && video.stats.shares) || video.shares || video.shareCount || '0',
        retentionRate: (video.stats && video.stats.retentionRate) || video.retentionRate || '0',
        retentionPercentage: (video.stats && video.stats.retentionPercentage) || video.retentionPercentage || '0%'
    };

    // useEffect to handle the automatic stat tour for the first card
    useEffect(() => {
        if (!isFirstCard || !isTourActive) return;

        const states = ['likes']; // Only auto-swipe to the second page (likes)
        const delay = 3000;

        timeoutsRef.current.forEach(clearTimeout);
        timeoutsRef.current = [];

        states.forEach((state, index) => {
            const timeoutId = setTimeout(() => {
                setCardState(state);
                // Stop auto-tour after reaching 'likes' (second page)
                setIsTourActive(false);
            }, (index + 1) * delay);

            timeoutsRef.current.push(timeoutId);
        });

        return () => {
            timeoutsRef.current.forEach(clearTimeout);
            timeoutsRef.current = [];
        };
    }, [isFirstCard, isTourActive]);

    // useEffect for closing the dialog when clicking outside the dialog/button
    useEffect(() => {
        const handleClickOutside = (event) => {
            // Close dialog if open AND the click target is NOT within the card
            // Also allow clicks inside the dialog itself by checking for the .more-actions-dialog wrapper
            const clickedInsideDialog = event.target && event.target.closest && event.target.closest('.more-actions-dialog');
            if (isDialogOpen && cardRef.current && !cardRef.current.contains(event.target) && !clickedInsideDialog) {
                setIsDialogOpen(false);
            }
        };
        // Attach listener to the whole document
        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            // Cleanup listener
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [isDialogOpen]);

    const stopTour = () => {
        if (isTourActive) {
            timeoutsRef.current.forEach(clearTimeout);
            timeoutsRef.current = [];
            setIsTourActive(false);
        }
    };

    // Handler to pass to MoreActionsDialog
    const handleReportClick = () => {
        onReportVideo(video); // Calls the App-level handler
    };

    // Navigate to Requests page focused on this video's original request
    const navigateToRequests = useNavigate();
    const handleViewRequestDetails = () => {
        try {
            localStorage.setItem('focus_request_hint', JSON.stringify({ title: video.title || '', requester: video.requester || '' }));
        } catch (e) { }
        const reqId = video.requestId || video.originalRequestId || null;
        const path = reqId ? `/requests?reqId=${encodeURIComponent(reqId)}` : `/requests?q=${encodeURIComponent(video.title || '')}`;
        navigateToRequests(path);
    };

    // <--- NEW: Handler to open Pin Dialog
    const handlePinClick = () => {
        setIsPinDialogOpen(true);
    };

    // <--- NEW: Handler for actual pinning
    const handlePin = (days) => {
        onPinVideo(video.id, days);
    };

    const handleTouchStart = (e) => {
        if (isFirstCard) {
            stopTour();
        }
        // Prevents dialog from closing immediately on touch start
        if (isDialogOpen) return;

        touchStartX.current = e.touches[0].clientX;
        touchEndX.current = e.touches[0].clientX;
    };

    const handleTouchMove = (e) => {
        if (isDialogOpen) return;
        touchEndX.current = e.touches[0].clientX;
    };

    const handleTouchEnd = () => {
        if (isDialogOpen) return;

        const diff = touchStartX.current - touchEndX.current;

        if (Math.abs(diff) < SWIPE_THRESHOLD) return;

        if (diff > SWIPE_THRESHOLD) {
            if (cardState === 'details') {
                setCardState('likes');
                // Mark as seen when user swipes for the first time
                if (showSwipeHint) {
                    try {
                        localStorage.setItem('swipe_stats_seen', '1');
                        setShowSwipeHint(false);
                    } catch (e) { }
                }
            }
            else if (cardState === 'likes') setCardState('views');
            else if (cardState === 'views') setCardState('engagement');

        } else if (diff < -SWIPE_THRESHOLD) {
            if (cardState === 'likes') setCardState('details');
            else if (cardState === 'views') setCardState('likes');
            else if (cardState === 'engagement') setCardState('views');
        }
    };

    const renderContent = () => {
        switch (cardState) {
            case 'likes':
                return <LikesDislikesStats stats={statsData} selectedLanguage={selectedLanguage} />;
            case 'views':
                return <ViewsCommentsStats stats={statsData} selectedLanguage={selectedLanguage} />;
            case 'engagement':
                return <EngagementStats stats={statsData} selectedLanguage={selectedLanguage} />;
            case 'details':
            default:
                return (
                    // This div now uses 'relative' to contain the absolute positioned menu/button
                    <div className="p-4 relative">
                        <h3 className="text-base font-semibold text-gray-900 mb-3 leading-6" style={clamp2}>
                            {video.title}
                        </h3>
                        <p className="text-sm text-gray-700 mb-2 leading-5">
                            {getTranslation('by', selectedLanguage)}{' '}
                            <button
                                className="font-semibold underline hover:text-gray-900"
                                style={{ color: 'var(--color-gold)', background: 'transparent', padding: 0 }}
                                onClick={(e) => {
                                    e.stopPropagation();
                                    if (onOpenProfile) {
                                        // Calculate real stats for the creator
                                        const creatorVideos = allVideos.filter(v => v.author === video.author || v.authorId === video.authorId);
                                        const creatorRequests = creatorVideos.length; // Count of fulfilled requests (published videos)
                                        const creatorFollowers = 0; // TODO: Would need followers data from backend

                                        const creatorData = {
                                            avatar: video.authorAvatar || null,
                                            bio: 'Creating engaging content for you',
                                            stats: {
                                                videos: creatorVideos.length,
                                                requests: creatorRequests,
                                                followers: creatorFollowers
                                            },
                                            verified: false,
                                            joinedDate: new Date().getFullYear()
                                        };

                                        onOpenProfile(video.author, true, creatorData, video.authorId);
                                    }
                                }}
                            >
                                {video.author}
                            </button>
                        </p>
                        <div className="flex justify-between items-center mt-3">
                            <div className="text-xs text-gray-500">
                                {formatDate(video.date)} &middot; {getTranslation('Requested by', selectedLanguage)}
                                <button
                                    className="text-gray-600 font-medium underline hover:text-gray-800 cursor-pointer ml-1 bg-transparent p-0"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        if (onOpenProfile) {
                                            // Calculate real stats for the requester
                                            const requesterVideos = allVideos.filter(v => v.requester === video.requester);
                                            const requesterRequests = requesterVideos.length; // Count videos they requested
                                            const requesterFollowers = 0; // TODO: Would need followers data from backend

                                            const requesterData = {
                                                avatar: video.requesterAvatar || null,
                                                bio: 'Enjoying great content',
                                                stats: {
                                                    videos: 0, // Requesters don't create videos
                                                    requests: requesterRequests, // Count videos they requested
                                                    followers: requesterFollowers
                                                },
                                                verified: false,
                                                joinedDate: new Date().getFullYear()
                                            };

                                            onOpenProfile(video.requester, false, requesterData, video.requester);
                                        }
                                    }}
                                >
                                    {video.requester}
                                </button>
                            </div>
                            <div className="flex items-end space-x-2">
                                <div className="relative flex flex-col items-center">
                                    <button
                                        className="p-1 text-gray-400 hover:text-gray-600 relative z-40"
                                        onClick={(e) => {
                                            e.stopPropagation(); // Prevents card swipe logic when clicking button
                                            // Open the anchored MoreActionsDialog (compute trigger rect)
                                            try {
                                                const rect = e.currentTarget.getBoundingClientRect();
                                                setDialogPos(rect);
                                                setIsDialogOpen(true);
                                            } catch (err) {
                                                // Fallback: open non-anchored dialog
                                                setDialogPos(null);
                                                setIsDialogOpen(true);
                                            }
                                        }}
                                    >
                                        <Icon name="moreVertical" size={20} />
                                    </button>

                                    {/* Render anchored MoreActionsDialog when open */}
                                    {isDialogOpen && (
                                        <MoreActionsDialog
                                            position={dialogPos}
                                            onClose={() => setIsDialogOpen(false)}
                                            onReportClick={handleReportClick}
                                            onPinClick={handlePinClick}
                                            onBookmarkClick={() => onToggleBookmark && onToggleBookmark(video.id)}
                                            isBookmarked={video.bookmarked}
                                            isPinned={video.pinned}
                                            pinnedDays={video.pinnedDays}
                                            onUnpinClick={() => onUnpinVideo && onUnpinVideo(video.id)}
                                            onShareClick={() => { onOpenShare && onOpenShare(video); }}
                                            onNotInterestedClick={() => { onNotInterested && onNotInterested(video.id); }}
                                            onViewRequestClick={handleViewRequestDetails}
                                            onAddToPlaylistClick={() => { onAddToPlaylistStart && onAddToPlaylistStart({ id: video.id, url: video.videoUrl || video.url || video.src, title: video.title, imageUrl: video.imageUrl, author: video.author, requester: video.requester }); setIsDialogOpen(false); }}
                                            selectedLanguage={selectedLanguage}
                                        />
                                    )}

                                    {cardState === 'details' && showSwipeHint && (
                                        <p className="absolute bottom-[-16px] right-0 text-xs text-gray-400 whitespace-nowrap">
                                            &larr; {getTranslation('Swipe for stats', selectedLanguage)}
                                        </p>
                                    )}
                                </div>
                            </div>
                        </div>
                        <div className="h-3"></div>
                    </div>
                );
        }
    };

    const renderPaginationDots = () => {
        const pages = ['details', 'likes', 'views', 'engagement'];
        return (
            <div className="flex justify-center p-2 pt-0">
                {pages.map((page, index) => {
                    const isActive = page === cardState;
                    return (
                        <span
                            key={index}
                            className={`block w-2 h-2 mx-1 rounded-full transition-all duration-300 ${isActive ? 'w-3' : 'w-2'} ${isActive ? 'bg-gray-800' : 'bg-gray-300'}`}
                            style={isActive ? { backgroundColor: 'var(--color-gold)' } : {}}
                            onClick={() => {
                                stopTour();
                                // Mark as seen when user clicks pagination dots
                                if (showSwipeHint && page !== 'details') {
                                    try {
                                        localStorage.setItem('swipe_stats_seen', '1');
                                        setShowSwipeHint(false);
                                    } catch (e) { }
                                }
                                setCardState(page);
                            }}
                        ></span>
                    );
                })}
            </div>
        );
    };

    return (
        <>
            {/* FIX: Removed 'overflow-hidden' from the card wrapper class.
            It must be 'overflow-visible' by default for the dialog to not be clipped. */}
            <div
                ref={cardRef}
                className="mx-5 mb-5 bg-white rounded-xl shadow-lg transition-shadow duration-300 overflow-visible cursor-pointer"
                onClick={(e) => {
                    // Only navigate if clicking the card itself, not buttons or interactive elements
                    if (e.target === e.currentTarget || e.target.closest('.card-content')) {
                        try {
                            // persist the current playlist and index so the videoplayer can navigate sequentially
                            // Save complete objects (minimized) so the player has URLs/metadata without needing lookups
                            const list = Array.isArray(allVideos) && allVideos.length ? allVideos.map(v => ({
                                id: v.id,
                                title: v.title,
                                url: v.videoUrl || v.url || v.src,
                                creator: v.author || v.creator || '',
                                thumbnail: v.imageUrl || v.thumbnail
                            })) : [];
                            const idx = list.findIndex(x => String(x.id) === String(video.id) || String(x.url) === String(video.videoUrl || video.url));

                            try { localStorage.setItem('videoplayer_source', JSON.stringify(list)); } catch (e) { }
                            try { localStorage.setItem('videoplayer_index', String(Math.max(0, idx))); } catch (e) { }
                        } catch (e) { }
                        onVideoClick && onVideoClick();
                    }
                }}
                onTouchStart={handleTouchStart}
                onTouchMove={handleTouchMove}
                onTouchEnd={handleTouchEnd}
            >
                <div className="relative w-full pb-[75%] card-content">
                    <img
                        src={video.imageUrl}
                        alt={video.title}
                        className="absolute top-0 left-0 w-full h-full object-cover rounded-t-xl card-content"
                        onError={(e) => { e.target.onerror = null; e.target.src = "https://placehold.co/600x400/333333/ffffff?text=Video+Image+Unavailable" }}
                    />

                    {/* <--- NEW: Pin Badge (top-left) */}
                    {video.pinned && video.pinnedDays && (
                        <div
                            className="absolute top-3 left-3 flex items-center rounded-lg px-2 py-1 shadow-md"
                            style={{ backgroundColor: 'rgba(0, 0, 0, 0.7)' }}
                        >
                            <Icon name="pin" size={14} className="text-red-500 mr-1" />
                            <span className="text-sm font-bold text-white">{video.pinnedDays}d</span>
                        </div>
                    )}

                    <div className="relative">
                        {requestedVisible && (
                            <div className="absolute top-3 left-3">
                                <div
                                    className="relative flex items-center rounded-lg px-2 py-1 text-xs font-medium text-current"
                                    style={{ backgroundColor: 'var(--color-final, #7C3AED)', color: 'var(--color-final-text, #7C3AED)', opacity: 0.12 }}
                                >
                                    <Icon name="pencil" size={14} className="text-current mr-1" />
                                    Requested

                                </div>
                            </div>
                        )}

                    </div>

                    <div className="absolute bottom-3 right-3 bg-black bg-opacity-70 rounded-lg px-2 py-1">
                        <span className="text-sm font-bold text-white">{displayTime}</span>
                    </div>
                </div>

                {/* This content render is where the dialog button lives */}
                {renderContent()}

                {renderPaginationDots()}

            </div>

            {/* <--- NEW: Pin Dialog */}
            {isPinDialogOpen && (
                <PinToTopDialog
                    onClose={() => setIsPinDialogOpen(false)}
                    onPin={handlePin}
                />
            )}
        </>
    );
};

// --- Re-adding omitted components so the file is complete and runnable ---

const TopHeader = ({ setIsDrawerOpen, navigate, selectedLanguage, onLanguageSelect }) => {
    const [notifCount, setNotifCount] = useState(0);

    useEffect(() => {
        const readCount = () => {
            try {
                const v1 = window.localStorage.getItem('notifications_count');
                if (v1 != null) {
                    const n = parseInt(v1, 10);
                    if (!isNaN(n)) { setNotifCount(n); return; }
                }
                const v2 = window.localStorage.getItem('notifications');
                if (v2) {
                    try {
                        const arr = JSON.parse(v2);
                        if (Array.isArray(arr)) { setNotifCount(arr.length); return; }
                    } catch (e) { }
                }
            } catch (e) { }
            setNotifCount(0);
        };
        readCount();
        const onStorage = (e) => { if (e.key && (e.key === 'notifications_count' || e.key === 'notifications')) readCount(); };
        window.addEventListener('storage', onStorage);
        return () => window.removeEventListener('storage', onStorage);
    }, []);

    const goToNotifications = () => {
        try { localStorage.setItem('requested_badge_seen', '1'); } catch (e) { }
        navigate('/notifications?from=home');
    };

    const goToSettings = () => {
        navigate('/settings');
    };

    // Use sticky top-0 and z-[60] to ensure it stays on top of other elements on mobile
    return (
        <div className="sticky top-0 z-[60] flex items-center justify-between px-5 py-3 bg-white border-b border-gray-100 transition-all" style={{ paddingTop: 'calc(12px + env(safe-area-inset-top, 0px))', paddingBottom: '12px', minHeight: '48px', height: 'auto', marginBottom: '4px' }}>
            <div className="flex items-center space-x-3">
                <button 
                    type="button" 
                    className="min-w-[44px] min-h-[44px] w-11 h-11 flex items-center justify-center rounded-full p-2 hover:bg-gray-50 transition-all cursor-pointer active:scale-95" 
                    onClick={() => setIsDrawerOpen(true)}
                >
                    <Icon name="menu" size={20} className="text-gray-700 pointer-events-none" />
                </button>
            </div>
            <div className="flex items-center space-x-2">
                <button
                    type="button"
                    className="relative min-w-[44px] min-h-[44px] w-11 h-11 flex items-center justify-center rounded-full p-2 transition-all duration-150 cursor-pointer hover:bg-gray-50 active:bg-gray-100 active:scale-95"
                    onClick={goToNotifications}
                >
                    <Icon name="bell" size={20} className="text-gray-700 pointer-events-none" />
                    {notifCount > 0 && (
                        <div
                            className="absolute -top-0.5 -right-0.5 rounded-full w-4 h-4 flex items-center justify-center text-[9px] font-medium text-black shadow-sm pointer-events-none"
                            style={{ backgroundColor: 'var(--color-gold)' }}
                        >
                            {notifCount > 9 ? '9+' : String(notifCount)}
                        </div>
                    )}
                </button>
                <button
                    type="button"
                    className="min-w-[44px] min-h-[44px] w-11 h-11 flex items-center justify-center rounded-full p-2 transition-all duration-150 cursor-pointer hover:bg-gray-50 active:bg-gray-100 active:scale-95"
                    onClick={goToSettings}
                >
                    <Icon name="settings" size={20} className="text-gray-700 pointer-events-none" />
                </button>
            </div>
        </div>
    );
};

const SearchBar = ({ searchTerm, setSearchTerm, navigate, onFocusChange, selectedLanguage = 'English', videos = [] }) => {
    const [isFocused, setIsFocused] = useState(false);
    const [results, setResults] = useState([]);
    const [loading, setLoading] = useState(false);
    const [showDropdown, setShowDropdown] = useState(false);
    const [highlight, setHighlight] = useState(-1);
    const [dropdownStyle, setDropdownStyle] = useState({});
    const containerRef = useRef(null);
    const debounceRef = useRef(null);

    const SELECTED_CREATOR_KEY = 'ideas_selectedCreator_v1';

    const getBackendBase = () => (window && window.__BACKEND_URL__) || 'https://regaarder-pwin.onrender.com';

    // Extract unique creators from loaded video data (local fallback for search)
    const extractLocalCreators = (query) => {
        if (!query || !videos || !videos.length) return [];
        const q = query.toLowerCase();
        const creatorMap = new Map();
        videos.forEach(v => {
            const name = v.author || v.creator || v.channel || '';
            if (!name) return;
            const key = name.toLowerCase();
            if (key.includes(q) && !creatorMap.has(key)) {
                creatorMap.set(key, {
                    id: v.authorId || v.creatorId || v.userId || `local-${key}`,
                    name: name,
                    handle: v.authorHandle || v.creatorHandle || key.replace(/\s+/g, ''),
                    image: v.authorImage || v.creatorImage || v.authorAvatar || null,
                    avatar: v.authorImage || v.creatorImage || v.authorAvatar || null,
                    isCreator: true,
                    _localFallback: true,
                });
            }
            // Also check requester
            const req = v.requester || '';
            if (req) {
                const rkey = req.toLowerCase();
                if (rkey.includes(q) && !creatorMap.has(rkey)) {
                    creatorMap.set(rkey, {
                        id: v.requesterId || `local-${rkey}`,
                        name: req,
                        handle: rkey.replace(/\s+/g, ''),
                        isCreator: false,
                        _localFallback: true,
                    });
                }
            }
        });
        return Array.from(creatorMap.values());
    };
    const normalizeImageUrl = (url) => {
        if (!url) return null;
        try {
            const base = getBackendBase();
            let s = String(url || '');
            if (s.startsWith('uploaded:')) {
                const filename = s.split(':')[1] || s.slice('uploaded:'.length);
                return `${base}/uploads/${filename}`;
            }
            // Fix http → https for backend URLs
            if (s.startsWith('http://') && s.includes('onrender.com')) {
                s = s.replace('http://', 'https://');
            }
            return s;
        } catch (e) {
            return url;
        }
    };

    // Compute dropdown position using fixed positioning to avoid overflow clipping
    const updateDropdownPosition = () => {
        if (containerRef.current) {
            const rect = containerRef.current.getBoundingClientRect();
            setDropdownStyle({
                position: 'fixed',
                top: rect.bottom + 8,
                left: rect.left,
                width: rect.width,
                zIndex: 9999,
            });
        }
    };

    useEffect(() => {
        const handleClickOutside = (e) => {
            if (containerRef.current && !containerRef.current.contains(e.target)) {
                // Also check if click was on the fixed dropdown
                const dropdownEl = document.getElementById('creator-search-dropdown');
                if (dropdownEl && dropdownEl.contains(e.target)) return;
                setShowDropdown(false);
                setHighlight(-1);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleClear = () => {
        setSearchTerm('');
        setResults([]);
        setShowDropdown(false);
        if (onFocusChange) try { onFocusChange(false); } catch (e) { }
    };

    const performSearch = async (q) => {
        if (!q || q.trim().length === 0) {
            setResults([]);
            setShowDropdown(false);
            return;
        }
        setLoading(true);
        setShowDropdown(true);
        updateDropdownPosition();
        try {
            const base = getBackendBase();
            let allUsers = [];

            // Strategy 1: Try /creators endpoint (most reliable - extracts from videos + users)
            try {
                const controller = new AbortController();
                const timeout = setTimeout(() => controller.abort(), 10000);
                const creatorsUrl = `${base}/creators?q=${encodeURIComponent(q)}`;
                const creatorsRes = await fetch(creatorsUrl, { signal: controller.signal });
                clearTimeout(timeout);
                if (creatorsRes.ok) {
                    const creatorsData = await creatorsRes.json();
                    allUsers = creatorsData.creators || creatorsData.users || [];
                }
            } catch (e1) {
                if (e1.name === 'AbortError') console.warn('[search] /creators timed out');
                else console.warn('[search] /creators failed:', e1.message);
            }

            // Strategy 2: If /creators returned nothing, try /users
            if (allUsers.length === 0) {
                try {
                    const controller2 = new AbortController();
                    const timeout2 = setTimeout(() => controller2.abort(), 10000);
                    const url = `${base}/users?q=${encodeURIComponent(q)}&creatorsOnly=1`;
                    const res = await fetch(url, { signal: controller2.signal });
                    clearTimeout(timeout2);
                    if (res.ok) {
                        const data = await res.json();
                        allUsers = (data && data.users) || (Array.isArray(data) ? data : []);
                    }
                } catch (fetchErr) {
                    console.warn('[search] /users also failed:', fetchErr.message);
                }
            }

            // Strategy 3: If /users also returned nothing, try /users without creatorsOnly filter
            if (allUsers.length === 0) {
                try {
                    const controller3 = new AbortController();
                    const timeout3 = setTimeout(() => controller3.abort(), 10000);
                    const fallbackUrl = `${base}/users?q=${encodeURIComponent(q)}`;
                    const fallbackRes = await fetch(fallbackUrl, { signal: controller3.signal });
                    clearTimeout(timeout3);
                    if (fallbackRes.ok) {
                        const fallbackData = await fallbackRes.json();
                        allUsers = (fallbackData && fallbackData.users) || (Array.isArray(fallbackData) ? fallbackData : []);
                    }
                } catch (fallbackErr) {
                    console.warn('[search] /users fallback also failed:', fallbackErr.message);
                }
            }

            let normalized = allUsers.map((u) => {
                const img = normalizeImageUrl(u.image || u.avatar || u.photoURL || u.profilePicture || u.profileImage);
                return {
                    ...u,
                    // Handle both camelCase and snake_case field names
                    isCreator: u.isCreator === true || u.is_creator === true,
                    image: img || u.image || u.avatar || u.photoURL || null,
                    avatar: img || u.avatar || u.image || null,
                    photoURL: img || u.photoURL || u.image || null,
                    // Ensure price and followers are always carried through
                    price: u.price || u.pricePerRequest || null,
                    followers: u.followers || u.followers_count || u.followersCount || null,
                };
            });

            // Strategy 4: If API returned nothing, extract creators from locally loaded videos
            if (normalized.length === 0) {
                const localCreators = extractLocalCreators(q);
                if (localCreators.length > 0) {
                    // Enrich local creators with backend profile data
                    const enriched = await Promise.all(localCreators.map(async (c) => {
                        try {
                            const lookupId = c.id || c.name;
                            const res = await fetch(`${base}/users/${encodeURIComponent(lookupId)}`);
                            if (res.ok) {
                                const data = await res.json();
                                const u = data.user || data;
                                if (u && !u.isPlaceholder) {
                                    return {
                                        ...c,
                                        ...u,
                                        isCreator: true,
                                        image: normalizeImageUrl(u.image || u.avatar || u.profileImage || c.image),
                                        avatar: normalizeImageUrl(u.avatar || u.image || u.profileImage || c.avatar),
                                        photoURL: normalizeImageUrl(u.photoURL || u.image || u.profileImage || c.image),
                                        followers: u.followers || u.followers_count || 0,
                                        price: u.price || u.pricePerRequest || c.price || null,
                                    };
                                }
                            }
                        } catch (e) { /* use original */ }
                        return c;
                    }));
                    normalized = enriched;
                }
            }

            // Deduplicate by unique id to avoid React duplicate key warnings
            const seen = new Set();
            normalized = normalized.filter(u => {
                const key = u.id || u.email || u.name;
                if (seen.has(key)) return false;
                seen.add(key);
                return true;
            });
            setResults(normalized);
            setShowDropdown(true);
            setHighlight(-1);
            updateDropdownPosition();
        } catch (err) {
            console.warn('creator search error', err);
            // Even on error, try local fallback from video data
            const localCreators = extractLocalCreators(q);
            setResults(localCreators);
            setShowDropdown(true);
        } finally {
            setLoading(false);
        }
    };

    const onInputChange = (val) => {
        setSearchTerm(val);
        if (debounceRef.current) clearTimeout(debounceRef.current);
        debounceRef.current = setTimeout(() => performSearch(val), 250);
    };

    const selectCreator = (creator) => {
        try {
            const followers = creator.followersCount || creator.followers || creator.stats?.followers || creator.followers_count || null;
            const img = normalizeImageUrl(creator.image || creator.avatar || creator.profileImage || creator.photoURL || null);
            const creatorObj = {
                id: creator.id || creator.handle || creator.username || String(creator.name || '').replace(/^@+/, '').toLowerCase(),
                name: creator.handle ? `@${creator.handle}` : (creator.username ? `@${creator.username}` : (creator.name || '')),
                displayName: creator.name || creator.handle || creator.username || '',
                handle: creator.handle || creator.username,
                username: creator.username || creator.handle,
                email: creator.email || null,
                image: img,
                photoURL: img,
                profileImage: img,
                followers,
                price: creator.price || creator.pricePerRequest || 0
            };
            try {
                window.localStorage.setItem(SELECTED_CREATOR_KEY, JSON.stringify(creatorObj));
                // Dispatch event so ideas.jsx picks it up even if already mounted
                window.dispatchEvent(new Event('ideas:creator_selected'));
            } catch (e) { }
        } catch (e) { console.warn('persist creator failed', e); }
        if (onFocusChange) try { onFocusChange(false); } catch (e) { }
        // Switch to ideas tab using FooterTabSwitcher's global setter (same mechanism as SharedBottomBar)
        try { if (window.setFooterTab) window.setFooterTab('ideas'); } catch (e) { }
        // Also navigate via React Router for URL sync
        try { 
            if (navigate) navigate('/ideas');
            else window.location.href = '/ideas';
        } catch (e) { 
            window.location.href = '/ideas';
        }
    };

    const onKeyDown = (e) => {
        // Handle Enter key to navigate directly to @handle if entered
        if (e.key === 'Enter' && !showDropdown) {
            e.preventDefault();
            const term = searchTerm.trim();
            // Check if user typed @handle format
            if (term.startsWith('@')) {
                const handle = term.substring(1);
                if (handle.length > 0) {
                    // Navigate directly to creator profile with request modal
                    window.location.href = `/@${handle}?request=true`;
                    return;
                }
            }
        }
        if (!showDropdown) return;
        if (e.key === 'ArrowDown') {
            e.preventDefault();
            setHighlight((h) => Math.min(h + 1, results.length - 1));
        } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            setHighlight((h) => Math.max(h - 1, 0));
        } else if (e.key === 'Enter') {
            e.preventDefault();
            if (highlight >= 0 && results[highlight]) selectCreator(results[highlight]);
        } else if (e.key === 'Escape') {
            setShowDropdown(false);
            setHighlight(-1);
        }
    };

    const searchBarClasses = `
        mx-5 my-4 p-3 flex items-center bg-white rounded-xl transition-all duration-300 border border-gray-200 shadow-sm relative
        ${isFocused
            ? 'ring-2 ring-offset-2 ring-offset-gray-50 ring-gray-400 border-gray-400 shadow-xl'
            : ''
        }
    `;

    return (
        <div className={searchBarClasses} ref={containerRef}>
            <Icon name="search" size={20} className="text-gray-400 mr-2" />
            <input
                type="text"
                placeholder={getTranslation('Search creators or videos...', selectedLanguage)}
                className="flex-1 text-base placeholder-gray-400 text-gray-700 focus:outline-none bg-transparent"
                value={searchTerm}
                onChange={(e) => e.target.value.length < 80 ? onInputChange(e.target.value) : null}
                onFocus={() => { setIsFocused(true); if (onFocusChange) try { onFocusChange(true); } catch (e) { } if (results && results.length) { setShowDropdown(true); updateDropdownPosition(); } }}
                onBlur={() => { setIsFocused(false); }}
                onKeyDown={onKeyDown}
                aria-autocomplete="list"
            />
            {searchTerm && (
                <button
                    onClick={handleClear}
                    className="p-1 ml-2 transition duration-150"
                    onMouseDown={(e) => e.preventDefault()}
                    aria-label="Clear search"
                >
                    <Icon name="x" size={20} className="text-gray-400 hover:text-gray-700" />
                </button>
            )}

            {/* Dropdown — uses fixed positioning to escape overflow:auto clipping */}
            {showDropdown && (
                <div id="creator-search-dropdown" style={dropdownStyle}>
                    <div
                        className="bg-white rounded-xl shadow-xl border border-gray-100"
                        style={{ maxHeight: '50vh', overflowY: 'auto', overscrollBehavior: 'contain', WebkitOverflowScrolling: 'touch', width: '100%' }}
                    >
                        {loading && (
                            <div className="p-3 text-sm text-gray-500">Searching creators...</div>
                        )}
                        {!loading && results.length === 0 && (
                            <div className="p-3 text-sm text-gray-500">No creators found</div>
                        )}
                        {!loading && results.map((u, idx) => {
                            const handle = u.username || u.handle || '';
                            const followers = u.followersCount || u.followers || u.stats?.followers || u.followers_count || null;
                            const subtitle = handle
                                ? `@${handle}${followers ? ` • ${followers} followers` : ''}${u.price ? ` • $${u.price}` : ''}`
                                : (followers ? `${followers} followers${u.price ? ` • $${u.price}` : ''}` : (u.price ? `$${u.price}` : (u.tagline || u.category || (u.isCreator ? 'Creator' : 'User'))));
                            const displayImg = u.image || u.avatar || u.profileImage || u.photoURL || null;
                            return (
                            <button
                                key={u.id || u.email || idx}
                                onMouseDown={(e) => { e.preventDefault(); }}
                                onClick={() => selectCreator(u)}
                                className={`w-full text-left px-4 py-3 hover:bg-gray-50 flex items-center justify-between ${highlight === idx ? 'bg-gray-50' : ''}`}
                            >
                                <div className="flex items-center" style={{ flex: 1, minWidth: 0 }}>
                                    {displayImg ? (
                                        <img src={displayImg} alt={u.name} className="w-10 h-10 rounded-full object-cover mr-3" style={{ flexShrink: 0 }} onError={(e) => { e.target.onerror = null; e.target.src = ''; e.target.style.display = 'none'; if (e.target.nextSibling) e.target.nextSibling.style.display = 'flex'; }} />
                                    ) : null}
                                    {/* First-letter avatar fallback — always rendered, hidden when image loads */}
                                    <div style={{ width: 40, height: 40, borderRadius: '50%', backgroundColor: ['#f87171','#34d399','#a78bfa','#60a5fa','#fbbf24','#ec4899','#fb923c','#4ade80'][(u.name || 'U').charCodeAt(0) % 8], display: displayImg ? 'none' : 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginRight: 12, color: '#fff', fontSize: 18, fontWeight: 700, textTransform: 'uppercase' }}>
                                        {(u.name || 'U').charAt(0)}
                                    </div>
                                    <div className="flex flex-col text-sm" style={{ minWidth: 0 }}>
                                        <span className="font-semibold text-gray-900" style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{u.name || u.handle || 'Unknown'}</span>
                                        <span className="text-xs text-gray-500" style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{subtitle}</span>
                                    </div>
                                </div>
                                {u.price ? (
                                    <div style={{ fontSize: 15, fontWeight: 700, color: '#16a34a', marginLeft: 8, whiteSpace: 'nowrap', padding: '4px 10px', backgroundColor: '#f0fdf4', borderRadius: 8, border: '1px solid #bbf7d0' }}>
                                        ${u.price}
                                    </div>
                                ) : null}
                            </button>
                        );})}
                    </div>
                </div>
            )}
        </div>
    );
};

const TabPills = ({ activeTab, setActiveTab, selectedLanguage = 'English' }) => {
    // Use parent-controlled tab state when provided, otherwise fall back to internal defaults
    const currentTab = activeTab || 'Recommended';
    const setTab = setActiveTab || (() => { });

    const staticTabs = [
        { name: 'Recommended', icon: 'star' },
        { name: 'Trending Now', icon: 'chart' },
        { name: 'New', icon: 'clock' },
    ];
    // Default categories if fetch fails + dynamic ones
    const [tabs, setTabs] = useState([
        ...staticTabs,
        { name: 'Travel', icon: 'globe' },
        { name: 'Education', icon: 'book' },
        { name: 'Entertainment', icon: 'film' },
        { name: 'Music', icon: 'music' },
        { name: 'Sports', icon: 'dumbbell' },
    ]);

    useEffect(() => {
        const fetchCategories = async () => {
             try {
                 const BACKEND = (window && window.__BACKEND_URL__) || 'https://regaarder-pwin.onrender.com';
                 const res = await fetch(`${BACKEND}/categories`);
                 if (res.ok) {
                     const catList = await res.json();
                     // Map to tabs structure
                     const catTabs = catList.map(name => {
                         // Comprehensive category → icon mapping
                         const catIconMap = {
                             travel: 'globe', education: 'book', entertainment: 'film',
                             music: 'music', sports: 'dumbbell', gaming: 'zap',
                             tech: 'monitor', technology: 'monitor', science: 'sparkles',
                             finance: 'dollar-sign', business: 'dollar-sign', money: 'dollar-sign',
                             health: 'heart', fitness: 'dumbbell', wellness: 'heart',
                             food: 'camera', cooking: 'camera', fashion: 'sparkles',
                             art: 'palette', design: 'palette', beauty: 'sparkles',
                             comedy: 'sparkles', humor: 'sparkles', funny: 'sparkles',
                             news: 'globe', politics: 'flag', history: 'clock',
                             love: 'heart', romance: 'heart', relationships: 'heart',
                             lifestyle: 'sun', motivation: 'zap', inspiration: 'zap',
                             golf: 'flag', nature: 'globe', animals: 'eye',
                             cars: 'zap', auto: 'zap', markets: 'chart',
                             crypto: 'dollar-sign', stocks: 'chart', investing: 'chart',
                             photography: 'camera', film: 'film', movies: 'film',
                             diy: 'sparkles', crafts: 'sparkles', other: 'star',
                         };
                         const icon = catIconMap[name.toLowerCase()] || 'tag';
                         
                         return { name, icon };
                     });
                     
                     setTabs([...staticTabs, ...catTabs]);
                 }
             } catch(e) { console.error("Failed to load categories", e); }
        };
        fetchCategories();
    }, []);

    return (

        <div className="flex px-5 pb-4 overflow-x-auto whitespace-nowrap">

            {tabs.map((tab) => {
                const isSelected = tab.name === currentTab;

                let className = "flex items-center text-sm px-4 py-2.5 mr-3 transition duration-150 ease-in-out";
                let buttonStyle = {
                    borderRadius: '8px',
                };

                if (isSelected) {
                    className += " text-black font-bold";
                    buttonStyle.backgroundColor = 'var(--color-gold)';
                    buttonStyle.boxShadow = `
                        0 4px 10px rgba(0, 0, 0, 0.3), 
                        0 0 10px var(--color-gold-light), 
                        inset 0 1px 0 rgba(255, 255, 255, 0.6) 
                    `;
                } else {
                    className += " bg-white text-gray-600 font-medium shadow-sm shadow-gray-200 hover:bg-gray-50";
                    buttonStyle.boxShadow = `
                        0 1px 3px rgba(0, 0, 0, 0.05), 
                        inset 0 1px 0 #ffffff 
                    `;
                }

                return (
                    <button
                        key={tab.name}
                        className={className}
                        style={buttonStyle}
                        onClick={() => setTab(tab.name)}
                    >
                        {tab.icon && (
                            <Icon
                                name={tab.icon}
                                size={16}
                                className="mr-2"
                                style={{ color: isSelected ? 'black' : '#71717A' }}
                            />
                        )}
                        {getTranslation(tab.name, selectedLanguage)}
                    </button>
                );
            })}
        </div>
    );
};

const StatItem = ({ iconName, value, label, iconColor, valueColor = 'text-gray-800' }) => (
    <div className="flex items-center mb-3">
        <Icon name={iconName} size={20} className="mr-4" style={{ color: iconColor }} />
        <span className={`text-base font-semibold w-auto ${valueColor}`}>{value}</span>
        <span className="text-base text-gray-500 ml-2">{label}</span>
    </div>
);

const LikesDislikesStats = ({ stats, selectedLanguage = 'English' }) => (
    <div className="p-4 pt-6 pb-2">
        <StatItem iconName="heart" value={stats.likes} label={getTranslation('Likes', selectedLanguage)} iconColor="var(--color-gold)" />
        <StatItem iconName="heartOff" value={stats.dislikes} label={getTranslation('Dislikes', selectedLanguage)} iconColor="var(--color-danger)" />
        <p className="text-xs text-gray-400 mt-4 text-center">{getTranslation('Swipe for stats', selectedLanguage)}</p>
        <div className="h-6"></div>
    </div>
);

const ViewsCommentsStats = ({ stats, selectedLanguage = 'English' }) => (
    <div className="p-4 pt-6 pb-2">
        <StatItem iconName="eye" value={stats.views} label={getTranslation('Views', selectedLanguage)} iconColor="var(--color-gold)" />
        <StatItem iconName="message" value={stats.comments} label={getTranslation('Comments', selectedLanguage)} iconColor="#57606C" />
        <p className="text-xs text-gray-400 mt-4 text-center">{getTranslation('Swipe left for engagement stats', selectedLanguage)}</p>
        <div className="h-6"></div>
    </div>
);

const EngagementStats = ({ stats, selectedLanguage = 'English' }) => (
    <div className="p-4 pt-6 pb-2">
        <StatItem iconName="share" value={stats.shares} label={getTranslation('Shares', selectedLanguage)} iconColor="#10B981" />
        <StatItem
            iconName="trendingUp"
            value={`${stats.retentionRate} ${getTranslation('retention rate', selectedLanguage)}`}
            label={`(${stats.retentionPercentage})`}
            iconColor="#A78BFA"
            valueColor="text-gray-800"
        />
        <p className="text-xs text-gray-400 mt-4 text-center">{getTranslation('Swipe right to return', selectedLanguage)}</p>
        <div className="h-6"></div>
    </div>
);

const FloatingActionButton = ({ searchTerm = '', navigate: routerNavigate, selectedLanguage = 'English', onOpenSupportTicket, showWelcomeModals = false, isDrawerOpen = false }) => {
    const navigatedRef = useRef(false);
    const [pressed, setPressed] = useState(false);
    const [dismissed, setDismissed] = useState(() => {
        try { return window.localStorage.getItem('fab_dismissed') === '1'; } catch (e) { return false; }
    });
    const touchStartX = useRef(0);
    const touchStartY = useRef(0);
    const translateX = useRef(0);
    const translateY = useRef(0);
    const [tx, setTx] = useState(0);
    const [ty, setTy] = useState(0);
    const [touching, setTouching] = useState(false);
    const [position, setPosition] = useState(() => {
        try {
            const saved = window.localStorage.getItem('fab_position');
            return saved ? JSON.parse(saved) : { right: 24, bottom: 130 };
        } catch (e) {
            return { right: 24, bottom: 130 };
        }
    });

    const openSupportTicket = () => {
        try {
            if (typeof onOpenSupportTicket === 'function') {
                onOpenSupportTicket();
            }
        } catch (e) {
            console.warn('Support ticket modal open failed', e);
        }
    };

    // Persist position to localStorage whenever it changes
    useEffect(() => {
        try {
            window.localStorage.setItem('fab_position', JSON.stringify(position));
        } catch (e) { }
    }, [position]);

    useEffect(() => {
        // if dismissed elsewhere (other tab), update
        const onStorage = (e) => {
            if (e.key === 'fab_dismissed') {
                try { setDismissed(window.localStorage.getItem('fab_dismissed') === '1'); } catch (err) { }
            }
            if (e.key === 'fab_position') {
                try {
                    const saved = window.localStorage.getItem('fab_position');
                    if (saved) setPosition(JSON.parse(saved));
                } catch (err) { }
            }
        };
        window.addEventListener('storage', onStorage);
        return () => window.removeEventListener('storage', onStorage);
    }, []);

    const handleMouseDown = (e) => {
        try { if (e && e.preventDefault) e.preventDefault(); } catch (err) { }
        setPressed(true);
        navigatedRef.current = false;
    };

    const handleTouchStart = (e) => {
        if (!e.touches || e.touches.length === 0) return;
        e.preventDefault();
        e.stopPropagation();
        navigatedRef.current = false;
        touchStartX.current = e.touches[0].clientX;
        touchStartY.current = e.touches[0].clientY;
        translateX.current = 0;
        translateY.current = 0;
        setTx(0);
        setTy(0);
        setTouching(true);
    };

    const handleTouchMove = (e) => {
        if (!touching || !e.touches || e.touches.length === 0) return;
        e.preventDefault();
        e.stopPropagation();
        const dx = e.touches[0].clientX - touchStartX.current;
        const dy = e.touches[0].clientY - touchStartY.current;
        translateX.current = dx;
        translateY.current = dy;
        setTx(dx);
        setTy(dy);
    };

    const handleDismiss = (dir) => {
        // animate out then persist dismissal
        try { window.localStorage.setItem('fab_dismissed', '1'); } catch (e) { }
        setDismissed(true);
    };

    const handleTouchEnd = (e) => {
        e.preventDefault();
        e.stopPropagation();
        setTouching(false);
        const dx = translateX.current || 0;
        const dy = translateY.current || 0;
        const THRESHOLD = 60; // px for dismiss
        const MIN_MOVE = 2; // Minimum movement to register as drag

        // Check for horizontal dismiss (left/right)
        if (Math.abs(dx) > THRESHOLD) {
            handleDismiss(dx > 0 ? 'right' : 'left');
        } else if (Math.abs(dx) > MIN_MOVE || Math.abs(dy) > MIN_MOVE) {
            // Save new position - update both right and bottom
            const newPosition = {
                right: position.right - dx,  // Drag left = increase right position
                bottom: position.bottom - dy  // Drag down = increase bottom (move down)
            };
            setPosition(newPosition);
            try {
                window.localStorage.setItem('fab_position', JSON.stringify(newPosition));
            } catch (e) { }
            // Reset drag visualization
            translateX.current = 0;
            translateY.current = 0;
            setTx(0);
            setTy(0);
        } else {
            // This was a click (not a drag), open support
            openSupportTicket();
            translateX.current = 0;
            translateY.current = 0;
            setTx(0);
            setTy(0);
        }
    };

    if (dismissed) return null;
    
    // Hide FAB during launch screen
    if (window.showLaunchScreen) return null;

    // Hide FAB during welcome modals
    if (showWelcomeModals) return null;

    // Hide FAB when sidebar/drawer is open
    if (isDrawerOpen) return null;

    // Use position values directly (already in pixels) with viewport clamping for safety
    const buttonSize = 56; // w-14 h-14 = 56px
    const margin = 20;
    const bottomPos = Math.max(margin, Math.min(window.innerHeight - buttonSize - margin, position.bottom));
    const rightPos = Math.max(margin, Math.min(window.innerWidth - buttonSize - margin, position.right));

    return (
        <button
            className={`fixed w-14 h-14 rounded-full flex items-center justify-center transition-all duration-300 cursor-grab ${touching ? 'cursor-grabbing' : ''} ${pressed ? 'scale-95 shadow-lg' : ''}`}
            style={{
                bottom: `${bottomPos}px`,
                right: `${rightPos}px`,
                transform: touching ? `translateX(${tx}px) translateY(${ty}px)` : 'none',
                transition: touching ? 'none' : 'transform 0.2s ease-out, bottom 0.2s ease-out, right 0.2s ease-out',
                backgroundColor: 'var(--color-gold)',
                boxShadow: pressed ? '0 8px 20px rgba(0, 0, 0, 0.3)' : '0 4px 12px rgba(0, 0, 0, 0.15)',
                border: 'none',
                zIndex: 50,
                touchAction: 'none'
            }}
            onMouseDown={handleMouseDown}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
            onMouseUp={() => setPressed(false)}
            onMouseLeave={() => setPressed(false)}
            onClick={(e) => { e.preventDefault(); e.stopPropagation(); openSupportTicket(); }}
            title="Contact Support - Drag to move"
        >
            <LifeBuoy size={26} className="text-black" strokeWidth={1.5} />
        </button>
    );
};


// BottomBar is now using SharedBottomBar from components/SharedBottomBar.jsx
const BottomBar = ({ selectedLanguage = 'English' }) => {
    return <SharedBottomBar selectedLanguage={selectedLanguage} activeTabOverride="Home" />;
};

const MiniPlayer = React.memo(({ data, onClose, onExpand, onUpdateData, navigate, onMiniPlayerReady }) => {
    // MiniPlayer uses its OWN video element for reliability
    const videoRef = useRef(null);
    const ytIframeRef = useRef(null);
    
    // YouTube detection helpers
    const isYTUrl = (url) => url && (url.includes('youtube.com') || url.includes('youtu.be'));
    const getYTId = (url) => {
        if (!url) return '';
        if (url.includes('youtu.be/')) return url.split('youtu.be/')[1].split(/[?&#]/)[0];
        if (url.includes('youtube.com')) { try { return new URL(url).searchParams.get('v') || ''; } catch { return ''; } }
        return '';
    };
    
    // Local state for dragging to prevent re-rendering the parent Home component
    const [pos, setPos] = useState({ right: 16, bottom: 100 });
    const dragRef = useRef({ isDragging: false, hasMoved: false, startX: 0, startY: 0, startRight: 0, startBottom: 0 });
    const [playing, setPlaying] = useState(!(data && data.paused));
    
    // Track if video has loaded enough to display (prevents empty state flash)
    const [videoReady, setVideoReady] = useState(false);
    
    // Opaque veil over YouTube iframe — hides branding on load & unpause
    const [ytVeil, setYtVeil] = useState(true);
    const ytVeilTimer = useRef(null);
    
    // Track if we've signaled ready to parent (only once)
    const hasSignaledReady = useRef(false);
    
    // Track YouTube current time for seek functionality
    const ytCurrentTime = useRef(data?.time || 0);
    
    // Capture initial paused state once (avoids using `data` in effect deps which causes loop)
    const initialPausedRef = useRef(data?.paused);

    // Stable start time — captured once at mount, never changes
    // (prevents iframe src from changing → reloading YouTube on every time update)
    const initialStartTimeRef = useRef(Math.floor(data?.time || 0));

    // Get video source URL and thumbnail from data
    const rawVideoSrc = data?.video?.src || data?.video?.videoUrl || data?.video?.url || '';
    const isYouTube = isYTUrl(rawVideoSrc);
    const youTubeId = isYouTube ? getYTId(rawVideoSrc) : '';
    const videoSrc = isYouTube ? rawVideoSrc : (resolveMediaUrl(rawVideoSrc) || rawVideoSrc);
    const thumbnailUrl = data?.video?.imageUrl || data?.video?.thumbnail || data?.imageUrl || (youTubeId ? `https://img.youtube.com/vi/${youTubeId}/mqdefault.jpg` : '');
    
    // Signal ready to parent ONLY when video is actually ready
    // This allows fullscreen player to close, creating seamless handoff
    useEffect(() => {
        if (videoReady && !hasSignaledReady.current && onMiniPlayerReady) {
            hasSignaledReady.current = true;
            onMiniPlayerReady();
        }
    }, [videoReady, onMiniPlayerReady]);

    // Initialize video when component mounts or source changes  
    useEffect(() => {
        // For YouTube videos, we use an iframe — skip native <video> setup
        if (isYouTube) {
            setYtVeil(true);
            // Minimal veil — just long enough for iframe to render a frame, then fade out
            const timer = setTimeout(() => {
                setVideoReady(true);
                ytVeilTimer.current = setTimeout(() => setYtVeil(false), 400);
            }, 800);
            return () => { clearTimeout(timer); clearTimeout(ytVeilTimer.current); };
        }

        const v = videoRef.current;
        if (!v || !videoSrc) return;

        // Reset ready state when source changes
        setVideoReady(false);

        // Set source if different
        if (videoSrc && v.src !== videoSrc) {
            v.src = videoSrc;
            v.load();
        }

        // Set start time once metadata is loaded
        const handleLoadedMetadata = () => {
            try {
                if (initialStartTimeRef.current > 0) {
                    v.currentTime = initialStartTimeRef.current;
                }
            } catch (e) {}
            
            // Auto-play if not paused (muted for autoplay reliability)
            // Uses ref instead of `data` prop to avoid re-running effect on every data update
            if (initialPausedRef.current === false || initialPausedRef.current == null) {
                v.muted = true;
                v.volume = 0;
                v.playsInline = true;
                v.autoplay = true;
                v.play().then(() => {
                    setPlaying(true);
                    // Auto-unmute after autoplay succeeds (mirrors YouTube's unmute approach)
                    // Delay gives the browser time to settle after the muted autoplay
                    setTimeout(() => {
                        try { v.muted = false; } catch {}
                        try { v.volume = 1; } catch {}
                    }, 600);
                    // Second attempt in case the first is too early
                    setTimeout(() => {
                        try { if (v.muted) v.muted = false; } catch {}
                        try { if (v.volume < 1) v.volume = 1; } catch {}
                    }, 1500);
                }).catch(() => { /* autoplay may be blocked */ });
            }
        };

        const handleLoadedData = () => {
            try { setVideoReady(true); } catch (e) {}
        };

        v.addEventListener('loadedmetadata', handleLoadedMetadata);
        v.addEventListener('loadeddata', handleLoadedData);
        // Only show video when it actually starts playing (prevents grey play overlay)
        const handlePlaying = () => {
            setVideoReady(true);
        };
        const handleError = () => {
            // keep thumbnail visible if video fails
            setVideoReady(false);
        };
        v.addEventListener('playing', handlePlaying);
        v.addEventListener('timeupdate', handlePlaying);
        v.addEventListener('canplay', handlePlaying);
        v.addEventListener('canplaythrough', handlePlaying);
        v.addEventListener('error', handleError);
        
        // If already loaded, apply immediately
        if (v.readyState >= 1) {
            handleLoadedMetadata();
        }
        
        // Requirements for video ready: metadata loaded + some data available
        if (v.readyState >= 3) {
            setVideoReady(true);
        }

        return () => {
            v.removeEventListener('loadedmetadata', handleLoadedMetadata);
            v.removeEventListener('loadeddata', handleLoadedData);
            v.removeEventListener('playing', handlePlaying);
            v.removeEventListener('timeupdate', handlePlaying);
            v.removeEventListener('canplay', handlePlaying);
            v.removeEventListener('canplaythrough', handlePlaying);
            v.removeEventListener('error', handleError);
        };
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [videoSrc]);

    // YouTube MiniPlayer: listen for postMessage events to track current time & send periodic 'listening'
    useEffect(() => {
        if (!isYouTube || !youTubeId) return;

        const sendListening = () => {
            try {
                if (ytIframeRef.current && ytIframeRef.current.contentWindow) {
                    ytIframeRef.current.contentWindow.postMessage(
                        JSON.stringify({ event: 'listening', id: youTubeId }), '*'
                    );
                }
            } catch { }
        };

        const handleYTMsg = (e) => {
            try {
                let d = e.data;
                if (typeof d === 'string') d = JSON.parse(d);
                if (!d || !d.info) return;
                const info = d.info;
                // Track current time in local ref only — NO parent state updates
                // (updating parent creates new data object → re-render → iframe src changes → RELOAD LOOP)
                if (typeof info.currentTime === 'number') {
                    ytCurrentTime.current = info.currentTime;
                }
                // Track duration if available (only update once when it changes)
                if (typeof info.duration === 'number' && info.duration > 0) {
                    if (onUpdateData) onUpdateData(prev => {
                        if (prev.duration === info.duration) return prev; // no change, avoid re-render
                        return { ...prev, duration: info.duration };
                    });
                }
                // Track play state
                if (typeof info.playerState === 'number') {
                    setPlaying(info.playerState === 1);
                }
            } catch { }
        };

        window.addEventListener('message', handleYTMsg);

        // Send explicit playVideo command to guarantee playback starts
        const sendPlay = () => {
            try {
                if (ytIframeRef.current && ytIframeRef.current.contentWindow) {
                    ytIframeRef.current.contentWindow.postMessage(
                        JSON.stringify({ event: 'command', func: 'playVideo' }), '*'
                    );
                }
            } catch { }
        };
        // Also unmute after playback starts (autoplay requires mute=1)
        const sendUnmute = () => {
            try {
                if (ytIframeRef.current && ytIframeRef.current.contentWindow) {
                    ytIframeRef.current.contentWindow.postMessage(JSON.stringify({ event: 'command', func: 'unMute' }), '*');
                    ytIframeRef.current.contentWindow.postMessage(JSON.stringify({ event: 'command', func: 'setVolume', args: [100] }), '*');
                }
            } catch { }
        };

        // Send listening more frequently and start earlier for faster YouTube postMessage init
        const t0 = setTimeout(sendListening, 200);
        const t1 = setTimeout(sendListening, 500);
        const t2 = setTimeout(sendListening, 1000);
        const t3 = setTimeout(sendListening, 2000);
        const listeningInterval = setInterval(sendListening, 500);
        // Play + unmute commands
        const t4 = setTimeout(() => { sendPlay(); sendUnmute(); }, 800);
        const t5 = setTimeout(() => { sendPlay(); sendUnmute(); }, 2000);

        return () => {
            window.removeEventListener('message', handleYTMsg);
            clearTimeout(t0);
            clearTimeout(t1);
            clearTimeout(t2);
            clearTimeout(t3);
            clearTimeout(t4);
            clearTimeout(t5);
            clearInterval(listeningInterval);
        };
    }, [isYouTube, youTubeId]);

    // State to track if resizing or dragging
    const [isResizing, setIsResizing] = useState(false);
    const [size, setSize] = useState({ width: 220, height: 172 }); // Combined height (124+48)

    const handlePointerDown = (e) => {
        // Use touch coordinates for mobile, pointer for desktop
        const clientX = e.touches ? e.touches[0].clientX : e.clientX;
        const clientY = e.touches ? e.touches[0].clientY : e.clientY;
        const drag = dragRef.current;
        drag.isDragging = false;
        drag.hasMoved = false;
        drag.startX = clientX;
        drag.startY = clientY;
        drag.startRight = pos.right;
        drag.startBottom = pos.bottom;
        drag.startWidth = size.width;
        drag.startHeight = size.height;
        const target = e.target || (e.touches && e.touches[0] && e.touches[0].target);
        if (target && target.dataset && target.dataset.resize === "true") {
            setIsResizing(true);
            drag.isResizing = true;
        } else {
            setIsResizing(false);
            drag.isResizing = false;
        }
    };

    const handlePointerMove = (e) => {
        const clientX = e.touches ? e.touches[0].clientX : e.clientX;
        const clientY = e.touches ? e.touches[0].clientY : e.clientY;
        const drag = dragRef.current;
        const dx = clientX - drag.startX;
        const dy = clientY - drag.startY;

        if (!drag.isDragging && !drag.isResizing && Math.sqrt(dx * dx + dy * dy) > 5) {
            if (!drag.isResizing) {
                drag.isDragging = true;
                drag.hasMoved = true;
            }
        }

        if (drag.isResizing) {
            // Resize logic: dragging top-left corner increases size
            // dx < 0 means moving left -> increase width
            // dy < 0 means moving up -> increase height
            // We'll maintain aspect ratio somewhat or just clamp dimensions
            const newWidth = Math.max(180, Math.min(400, drag.startWidth - dx));
            // Keep control bar height fixed (48px), resize video area
            const newHeight = Math.max(140, Math.min(300, drag.startHeight - dy));
            setSize({ width: newWidth, height: newHeight });
        } else if (drag.isDragging) {
            const newRight = Math.max(8, Math.min(window.innerWidth - size.width, drag.startRight - dx));
            const newBottom = Math.max(8, Math.min(window.innerHeight - size.height, drag.startBottom - dy));
            setPos({ right: newRight, bottom: newBottom });
        }
    };

    const handlePointerUp = (e) => {
        const drag = dragRef.current;
        drag.isDragging = false;
        drag.isResizing = false;
        setIsResizing(false);
    };

    const handleClick = (e) => {
        if (dragRef.current.hasMoved || dragRef.current.isResizing) return;
        if (onExpand) {
            // Pass live current time so fullscreen player can seek to the right position
            const currentTime = isYouTube ? (ytCurrentTime.current || 0) : (videoRef.current ? videoRef.current.currentTime : 0);
            onExpand(currentTime);
            return;
        }
        else {
            showVideoLaunchMask();
            const video = data.video || {};
            const params = new URLSearchParams();
            const idVal = video.id || video.videoId || video.src || video.url || '';
            const srcVal = video.src || video.videoUrl || video.url || '';
            if (idVal) params.set('id', idVal);
            if (srcVal) params.set('src', srcVal);
            if (video.title) params.set('title', video.title);
            const channel = data.creatorName || video.creator || video.author || video.channel || '';
            if (channel) params.set('channel', channel);
            const liveTime = isYouTube ? ytCurrentTime.current : (videoRef.current ? videoRef.current.currentTime : 0);
            if (liveTime > 0) params.set('t', String(Math.floor(liveTime)));
            
            // Store video data in localStorage for immediate loading (near-instantaneous switch)
            try {
                const videoData = {
                    id: idVal,
                    url: srcVal,
                    videoUrl: srcVal,
                    src: srcVal,
                    title: video.title || 'Video',
                    creator: channel,
                    creatorName: channel,
                    imageUrl: video.imageUrl || data.imageUrl || null,
                    timestamp: Date.now()
                };
                localStorage.setItem('videoplayer_quick_load', JSON.stringify(videoData));
            } catch (err) {
                console.error('Failed to store video data:', err);
            }
            
            if (onClose) onClose();
            try {
                navigate(`/videoplayer?${params.toString()}`, { state: { miniPlayerData: data } });
            } catch (err) {
                // Fallback only if navigate is not available
                console.warn('navigate failed, using location.href:', err);
                window.location.href = `/videoplayer?${params.toString()}`;
            }
        }
    };

    const togglePlay = (e) => {
        e.stopPropagation();
        // YouTube videos: use postMessage to control iframe
        if (isYouTube && ytIframeRef.current) {
            try {
                if (playing) {
                    ytIframeRef.current.contentWindow.postMessage(JSON.stringify({ event: 'command', func: 'pauseVideo' }), '*');
                    setPlaying(false);
                    if (onUpdateData) onUpdateData(prev => ({ ...prev, paused: true, time: ytCurrentTime.current }));
                } else {
                    // Brief veil flash — hides YouTube's transient play-state overlay
                    setYtVeil(true);
                    clearTimeout(ytVeilTimer.current);
                    ytIframeRef.current.contentWindow.postMessage(JSON.stringify({ event: 'command', func: 'playVideo' }), '*');
                    setPlaying(true);
                    if (onUpdateData) onUpdateData(prev => ({ ...prev, paused: false }));
                    // Lift quickly — scale(1.3) + gradients already hide branding
                    ytVeilTimer.current = setTimeout(() => setYtVeil(false), 600);
                }
            } catch { }
            return;
        }
        // Use local video ref
        const v = videoRef.current;
        if (!v) return;
        if (v.paused) {
            try { v.muted = false; } catch { }
            try { v.volume = 1; } catch { }
            v.play().catch(() => { });
            setPlaying(true);
            if (onUpdateData) onUpdateData(prev => ({ ...prev, paused: false }));
        } else {
            v.pause();
            setPlaying(false);
            if (onUpdateData) onUpdateData(prev => ({ ...prev, paused: true }));
        }
    };

    const seek = (seconds) => {
        // YouTube: use postMessage to seek
        if (isYouTube && ytIframeRef.current) {
            try {
                // Use tracked current time from YouTube infoDelivery
                const curTime = ytCurrentTime.current || 0;
                const newTime = Math.max(0, curTime + seconds);
                ytIframeRef.current.contentWindow.postMessage(
                    JSON.stringify({ event: 'command', func: 'seekTo', args: [newTime, true] }), '*'
                );
                ytCurrentTime.current = newTime;
                // Update parent's time tracking
                if (onUpdateData) onUpdateData(prev => ({ ...prev, time: newTime }));
                // Re-send listening so YouTube resumes delivering infoDelivery events after seek
                setTimeout(() => {
                    try {
                        if (ytIframeRef.current && ytIframeRef.current.contentWindow) {
                            ytIframeRef.current.contentWindow.postMessage(
                                JSON.stringify({ event: 'listening', id: youTubeId }), '*'
                            );
                        }
                    } catch { }
                }, 300);
            } catch { }
            return;
        }
        const v = videoRef.current;
        if (!v) return;
        v.currentTime = Math.max(0, Math.min(v.duration, v.currentTime + seconds));
    };

    // Track control visibility
    const [controlsVisible, setControlsVisible] = useState(false);
    const controlsTimeoutRef = useRef(null);

    const showControls = () => {
        try { clearTimeout(controlsTimeoutRef.current); } catch (e) { }
        setControlsVisible(true);
    };

    const hideControlsDelayed = () => {
        try { clearTimeout(controlsTimeoutRef.current); } catch (e) { }
        controlsTimeoutRef.current = setTimeout(() => {
            setControlsVisible(false);
        }, 5000);
    };

    // Ensure controls are visible when resizing
    useEffect(() => {
        if (isResizing) showControls();
    }, [isResizing]);

    return (
        <div
            onTouchStart={(e) => { handlePointerDown(e); showControls(); }}
            onTouchMove={(e) => { handlePointerMove(e); showControls(); }}
            onTouchEnd={(e) => { handlePointerUp(e); }}
            onMouseDown={(e) => { handlePointerDown(e); showControls(); }}
            onMouseMove={(e) => { handlePointerMove(e); showControls(); }}
            onMouseUp={(e) => { handlePointerUp(e); }}
            onClick={handleClick}
            style={{
                position: 'fixed',
                right: pos.right,
                bottom: pos.bottom,
                width: size.width,
                height: size.height,
                zIndex: 55,
                borderRadius: 16,
                overflow: 'hidden',
                boxShadow: '0 10px 30px rgba(0,0,0,0.4)',
                background: '#fff',
                cursor: 'grab',
                touchAction: 'none',
                display: 'flex',
                flexDirection: 'column',
                opacity: 1,
                transform: 'scale(1)',
                pointerEvents: 'auto',
                transition: 'opacity 0.3s ease-out'
            }}
        >
            {/* Resize Handle (Top-Left) - where requested */}
            <div
                data-resize="true"
                style={{
                    position: 'absolute',
                    top: 0, left: 0,
                    width: 44, height: 44, // Larger hit area
                    zIndex: 20,
                    cursor: 'nwse-resize',
                    display: 'flex',
                    alignItems: 'center', // Icon will be at top-left visually via padding if needed, or centered
                    justifyContent: 'center',
                    opacity: (controlsVisible || isResizing) && videoReady ? 1 : 0,
                    transition: 'opacity 0.2s',
                    pointerEvents: 'auto', // Ensure it captures clicks even if opacity is 0
                    touchAction: 'none'
                }}
            >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" style={{ filter: 'drop-shadow(0 1px 2px rgba(0,0,0,0.5))', pointerEvents: 'none' }}>
                    <path d="M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7" />
                </svg>
            </div>

            <div style={{ 
                width: '100%', 
                height: size.height - 48, 
                position: 'relative', 
                overflow: 'hidden',
                background: '#000',
                backgroundImage: thumbnailUrl ? `url(${thumbnailUrl})` : 'none',
                backgroundSize: 'cover',
                backgroundPosition: 'center'
            }}>
                {/* Pure black overlay - covers everything until video is ready */}
                {!videoReady && (
                    <div style={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        width: '100%',
                        height: '100%',
                        background: '#000',
                        backgroundImage: thumbnailUrl ? `url(${thumbnailUrl})` : 'none',
                        backgroundSize: 'cover',
                        backgroundPosition: 'center',
                        zIndex: 5
                    }} />
                )}
                
                {/* MiniPlayer's video content - YouTube iframe OR native video element */}
                {isYouTube && youTubeId ? (
                    <>
                        <iframe
                            ref={ytIframeRef}
                            src={`https://www.youtube-nocookie.com/embed/${youTubeId}?autoplay=1&mute=1&controls=0&modestbranding=1&showinfo=0&rel=0&iv_load_policy=3&fs=0&disablekb=1&playsinline=1&enablejsapi=1&start=${initialStartTimeRef.current}`}
                            allow="accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture"
                            allowFullScreen={false}
                            style={{
                                position: 'absolute',
                                inset: 0,
                                width: '100%',
                                height: '100%',
                                background: '#000',
                                border: 'none',
                                pointerEvents: 'none',
                                opacity: videoReady ? 1 : 0,
                                transform: 'scale(1.3)',
                                transformOrigin: 'center center'
                            }}
                            title="MiniPlayer YouTube"
                        />

                        {/* Edge gradient masks — permanently hide YouTube watermark & title */}
                        <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: '15%', background: 'linear-gradient(to top, #000 20%, transparent 100%)', zIndex: 2, pointerEvents: 'none' }} />
                        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '10%', background: 'linear-gradient(to bottom, #000 5%, transparent 100%)', zIndex: 2, pointerEvents: 'none' }} />

                        {/* Solid veil — hides branding on load & unpause, fades out smoothly */}
                        <div style={{
                            position: 'absolute', inset: 0, zIndex: 4,
                            background: '#000',
                            backgroundImage: thumbnailUrl ? `url(${thumbnailUrl})` : 'none',
                            backgroundSize: 'cover', backgroundPosition: 'center',
                            opacity: ytVeil ? 1 : 0,
                            transition: 'opacity 0.5s ease-out',
                            pointerEvents: 'none'
                        }} />
                        {/* Click-blocking overlay for YouTube */}
                        <div style={{ position: 'absolute', inset: 0, zIndex: 5 }} />
                    </>
                ) : (
                    <video 
                        ref={videoRef}
                        playsInline
                        poster={thumbnailUrl || undefined}
                        style={{ 
                            position: 'absolute',
                            top: 0,
                            left: 0,
                            width: '100%', 
                            height: '100%', 
                            background: '#000', 
                            objectFit: 'cover',
                            visibility: videoReady ? 'visible' : 'hidden'
                        }}
                    />
                )}
                
                {/* Close Button - inside video area, visible on hover */}
                <button
                    onClick={(e) => { e.stopPropagation(); if (onClose) onClose(); }}
                    style={{
                        position: 'absolute', top: 6, right: 6,
                        width: 24, height: 24, borderRadius: '50%',
                        background: 'rgba(0,0,0,0.6)', color: '#fff', border: 'none',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        cursor: 'pointer', zIndex: 10,
                        opacity: controlsVisible ? 1 : 0,
                        transition: 'opacity 0.2s',
                        pointerEvents: controlsVisible ? 'auto' : 'none'
                    }}
                >
                    ✕
                </button>
            </div>

            {/* Control Bar - Below video */}
            <div style={{
                width: '100%',
                height: 48,
                background: '#fff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-evenly',
                borderTop: '1px solid rgba(0,0,0,0.05)',
                pointerEvents: 'auto',
                flexShrink: 0
            }}
                onClick={(e) => e.stopPropagation()}
            >
                {/* Seek Back 10s */}
                <button
                    onClick={(e) => { e.stopPropagation(); seek(-10); }}
                    className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-gray-100 active:scale-95 transition-transform"
                >
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#333" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
                        <path d="M3 3v5h5" />
                        <text x="12" y="17" fontSize="8" fill="#333" textAnchor="middle" stroke="none" fontWeight="bold">10</text>
                    </svg>
                </button>

                {/* Play/Pause */}
                <button
                    onClick={togglePlay}
                    className="w-12 h-12 flex items-center justify-center rounded-full hover:bg-gray-100 active:scale-95 transition-transform"
                >
                    {!playing ? (
                        <svg width="20" height="22" viewBox="0 0 24 24" fill="#111"><path d="M5 3l14 9-14 9V3z" /></svg>
                    ) : (
                        <svg width="18" height="22" viewBox="0 0 24 24" fill="#111"><rect x="6" y="4" width="4" height="16" /><rect x="14" y="4" width="4" height="16" /></svg>
                    )}
                </button>

                {/* Seek Forward 10s */}
                <button
                    onClick={(e) => { e.stopPropagation(); seek(10); }}
                    className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-gray-100 active:scale-95 transition-transform"
                >
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#333" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M21 12a9 9 0 1 1-9-9 9.75 9.75 0 0 1 6.74 2.74L21 8" />
                        <path d="M21 3v5h-5" />
                        <text x="12" y="17" fontSize="8" fill="#333" textAnchor="middle" stroke="none" fontWeight="bold">10</text>
                    </svg>
                </button>
            </div>
        </div>
    );
});

export default App;
