/* eslint-disable no-empty, no-unused-vars, no-undef, no-extra-semi */
import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useAuth } from './AuthContext.jsx';
import { useLocation } from 'react-router-dom';
import { createPortal } from 'react-dom';
import { getTranslation } from './translations.js';
import { useLanguage } from './LanguageContext.jsx';
import { WEB_URL, getBackendBaseUrl } from './config.js';
import { resolveMediaUrl } from './utils/media.js';
import BoostsModal from './BoostsModal.jsx';
import DailyLimitModal from './DailyLimitModal.jsx';
import RequestValueLimitModal from './RequestValueLimitModal.jsx';
import RequestNudgeModal from './RequestNudgeModal.jsx';
import SharedBottomBar from './components/SharedBottomBar.jsx';
import {
    Home, MoreHorizontal, FileText, Clock, DollarSign, Search,
    TrendingUp, Heart, MessageSquare, ChevronsUp, Bookmark, Pin, ChevronDown, ChevronUp, Lightbulb,
    X, Send, ThumbsUp, Zap, Pencil, ThumbsDown, Flag, Share2, HeartOff, SlidersHorizontal, Calendar, CheckCircle2,
    User, Check, Sparkles, Trophy, Rocket, Gem, CreditCard, Award, Eye, EyeOff, Crown, Megaphone, Trash2
} from 'lucide-react';

// --- Component Data ---
const getCssVar = (name, fallback) => {
    try {
        const val = getComputedStyle(document.documentElement).getPropertyValue(name);
        return val ? val.trim() : (fallback || '');
    } catch (e) { return fallback || ''; }
};
// so UI layers update automatically when the active theme changes.
const customColors = {
    '--color-gold': 'var(--color-gold)',
    '--color-gold-light': 'var(--color-gold-light)',
    '--color-neutral-light-bg': 'var(--color-neutral-light-bg)',
    '--color-alert-light': 'var(--color-alert-light)',
    '--color-alert-border': 'var(--color-alert-border)',
    '--color-alert-text': 'var(--color-alert-text)',
    '--color-like': 'var(--color-like)',
};

// Resolve image URL strings used in request cards and mock data.
const resolveImageUrl = (url) => resolveMediaUrl(url);

// Small utility to produce human-friendly relative time strings from ISO timestamps
const timeAgoFromISO = (iso) => {
    try {
        if (!iso) return '';
        const then = new Date(iso);
        if (isNaN(then.getTime())) return '';
        const diff = Date.now() - then.getTime();
        const sec = Math.floor(diff / 1000);
        if (sec < 60) return 'Just now';
        const m = Math.floor(sec / 60);
        if (m < 60) return `${m}m ago`;
        const h = Math.floor(m / 60);
        if (h < 24) return `${h}h ago`;
        const d = Math.floor(h / 24);
        if (d < 7) return `${d}d ago`;
        const w = Math.floor(d / 7);
        if (w < 4) return `${w}w ago`;
        return then.toLocaleDateString();
    } catch (e) { return ''; }
};
// Mock User Data for new comments
const MOCK_USER = {
    id: 'user-123',
    name: 'You',
    avatarUrl: 'https://placehold.co/40x40/4F46E5/ffffff?text=U', // Indigo background for "You" initial
};

// Mock data structured to ensure clear ranking tiers after calculation

const mockRequests = [
    {
        id: 3,
        company: 'NASA Official',
        timeAgo: '2w ago',
        title: 'Artemis Program: Orion Capsule Deep Dive',
        description: 'Requesting an educational video series on the Orion capsule, covering its design, mission parameters, and future role in lunar exploration. The content must be vetted for scientific accuracy by NASA representatives and target a middle-school to high-school educational demographic.',
        likes: 350,
        comments: 102,
        boosts: 88, // Total Influence target: 526 (350 + 88*2)
        funding: 8900.00,
        isTrending: false,
        isSponsored: false,
        companyInitial: 'N',
        companyColor: 'bg-blue-800',
        imageUrl: 'uploaded:1000002754.jpg-f38ae5ef-59ef-4f7d-9c73-a5a04433228a',
    },
    {
        id: 4,
        company: 'Global Watchdog',
        timeAgo: '3d ago',
        title: 'The Lithium Trail: Investigating Sustainable Battery Sources',
        description: 'In-depth documentary exploring the global supply chain for lithium, tracing its journey from mining to final battery assembly. The focus should be on environmental impact, ethical sourcing challenges, and potential sustainable alternatives for the future of electric power.',
        likes: 210,
        comments: 78,
        boosts: 110, // Total Influence target: 430 (210 + 110*2)
        funding: 4500.00,
        isTrending: true,
        isSponsored: false,
        companyInitial: 'G',
        companyColor: 'bg-green-700',
        imageUrl: 'uploaded:1000002752.jpg-22797b9e-93d7-4f62-a5a2-42bbe6353ed5',
    },
    {
        id: 5,
        company: 'Cultural Archive',
        timeAgo: '1w ago',
        title: 'The Silent Screen: A History of Early Cinema',
        description: 'Seeking a rich, detailed historical investigation into the foundational years of silent film, covering key technological innovations, the rise of the star system, and its cultural impact before the advent of sound. Requires archival footage and expert interviews.',
        likes: 155,
        comments: 42,
        boosts: 55, // Total Influence target: 265 (155 + 55*2)
        funding: 3100.00,
        isTrending: false,
        isSponsored: true,
        companyInitial: 'C',
        companyColor: 'bg-indigo-600',
        imageUrl: 'uploaded:mock-image-fail-123.jpg',
    },
    {
        id: 2,
        company: 'Adobe Creative ...',
        timeAgo: '1d ago',
        title: 'Photoshop 2025: Advanced Editing',
        description: 'A deep dive into the new Generative Fill features and advanced mask editing workflows in the latest Photoshop release. Focus on efficiency gains and creative possibilities for professional graphic designers and digital artists.',
        likes: 120,
        comments: 67,
        boosts: 67, // Total Influence target: 254 (120 + 67*2) - This will be the "threat" for #5
        funding: 1200.00,
        isTrending: true,
        isSponsored: false,
        companyInitial: 'A',
        companyColor: 'bg-red-800',
        imageUrl: 'uploaded:1000002749.jpg-948349c1-85e2-4ea6-a50c-08549e9480a6',
    },
    {
        id: 1,
        company: 'Tesla Motors',
        timeAgo: '6h ago',
        title: 'Tesla Model Y: Full Review and Road Trip',
        description: 'Need a comprehensive review of the Tesla Model Y including a long-distance road trip to showcase charging infrastructure and real-world range performance. The review should cover software updates, comparison with competitors, and include high-quality video footage and imagery suitable for marketing materials.',
        likes: 89,
        comments: 34,
        boosts: 45, // Total Influence target: 179 (89 + 45*2)
        funding: 2500.00,
        isTrending: true,
        isSponsored: true,
        companyInitial: 'T',
        companyColor: 'bg-red-600',
        imageUrl: 'uploaded:1000002747.jpg-6e26ff74-e416-4377-b6f7-72897269edb2',
    },
];

// --- Comment Component (Unchanged) ---
const CommentItem = ({ comment, onReply, onToggleLike, onToggleDislike, onEdit, onDelete, selectedLanguage = 'English' }) => {
    const isUserComment = comment.userId === MOCK_USER.id;
    const avatarUrl = isUserComment
        ? MOCK_USER.avatarUrl
        : 'https://placehold.co/40x40/CCCCCC/666666?text=G';

    const parts = comment.text.split(' ');
    const firstWord = parts[0];
    const isReplyText = firstWord.startsWith('@');
    const replyTargetName = isReplyText ? firstWord.substring(1) : null;
    const commentBody = isReplyText ? parts.slice(1).join(' ') : comment.text;

    // Derive reaction state from the comment object so the parent (modal) can persist
    const isLiked = !!comment.likedByUser;
    const isDisliked = !!comment.dislikedByUser;

    const handleReplyClick = () => {
        onReply(comment);
    };

    // Editing / deletion UI for user's own comments
    const [isEditing, setIsEditing] = useState(false);
    const [editValue, setEditValue] = useState(comment.text || '');

    useEffect(() => {
        setEditValue(comment.text || '');
    }, [comment.text]);

    const startLongPressRef = useRef(null);

    const handleLongPress = () => {
        if (!isUserComment) return;
        // confirm then call delete
        try {
            if (window.confirm('Delete this comment?')) {
                if (typeof onDelete === 'function') onDelete(comment.id);
            }
        } catch (e) { }
    };

    const handleTouchStartLong = () => {
        startLongPressRef.current = setTimeout(() => handleLongPress(), 600);
    };

    const handleTouchEndLong = () => {
        if (startLongPressRef.current) { clearTimeout(startLongPressRef.current); startLongPressRef.current = null; }
    };

    const toggleLike = () => {
        const handler = (typeof comment.onToggleLike === 'function') ? comment.onToggleLike : (typeof onToggleLike === 'function' ? onToggleLike : null);
        if (handler) {
            handler(comment.id);
            return;
        }
        if (typeof onReply === 'function') onReply(comment);
    };

    const toggleDislike = () => {
        const handler = (typeof comment.onToggleDislike === 'function') ? comment.onToggleDislike : (typeof onToggleDislike === 'function' ? onToggleDislike : null);
        if (handler) {
            handler(comment.id);
            return;
        }
        if (typeof onReply === 'function') onReply(comment);
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
                    <span className="font-medium">Just now</span>

                    <button
                        onClick={toggleLike}
                        aria-pressed={isLiked}
                        className={`flex items-center space-x-1 transition-colors ${isLiked ? 'text-red-500' : 'hover:text-gray-700'}`}
                        aria-label="Like comment"
                    >
                        <Heart className="w-3.5 h-3.5" style={{ fill: isLiked ? 'var(--color-like)' : 'none', stroke: isLiked ? 'var(--color-like)' : 'currentColor' }} />
                        <span className="text-xs font-medium">{comment.likesCount || 0}</span>
                    </button>

                    <button
                        onClick={toggleDislike}
                        aria-pressed={isDisliked}
                        className={`flex items-center space-x-1 transition-colors ${isDisliked ? 'text-red-500' : 'hover:text-gray-700'}`}
                        aria-label="Dislike comment"
                    >
                        <HeartOff className="w-3.5 h-3.5" style={{ stroke: isDisliked ? 'var(--color-like)' : 'currentColor', fill: 'none' }} />
                        <span className="text-xs font-medium">{comment.dislikesCount || 0}</span>
                    </button>

                    <button
                        onClick={handleReplyClick}
                        className="hover:text-gray-700 transition-colors"
                    >
                        {getTranslation('Reply', selectedLanguage)}
                    </button>
                </div>
                {/* end transformed content */}
            </div>
        </div>
    );
};


// --- Reusable Component for the Comments Modal (Unchanged) ---
const CommentsModal = ({ isOpen, onClose, requestId, selectedLanguage = 'English' }) => {
    const modalRef = useRef(null);
    const contentRef = useRef(null);
    const inputRef = useRef(null);
    const auth = useAuth();

    const [currentHeight, setCurrentHeight] = useState(window.innerHeight * 0.9);
    const minHeight = window.innerHeight * 0.4;
    const maxHeight = window.innerHeight * 0.95;

    const [comments, setComments] = useState([]);
    const [inputValue, setInputValue] = useState('');
    const [replyingTo, setReplyingTo] = useState(null);

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

    const handleSendComment = () => {
        if (!auth.user) { auth.openAuthModal(); return; }
        if (inputValue.trim() === '') return;

        let commentText = inputValue.trim();

        const newComment = {
            id: `local_${Date.now()}`,
            userId: (auth.user && auth.user.id) ? auth.user.id : MOCK_USER.id,
            userName: (auth.user && auth.user.name) ? auth.user.name : MOCK_USER.name,
            text: commentText,
            timestamp: new Date(),
            parentId: replyingTo ? replyingTo.id : null,
            likesCount: 0,
            dislikesCount: 0,
            likedByUser: false,
            dislikedByUser: false,
        };

        (async () => {
            const BACKEND = getBackendBaseUrl();
            const token = localStorage.getItem('regaarder_token');
            try {
                const res = await fetch(`${BACKEND}/requests/${requestId}/comments`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
                    body: JSON.stringify({ text: commentText, parentId: replyingTo ? replyingTo.id : null })
                });
                if (res.ok) {
                    const body = await res.json();
                    if (body && body.comment) {
                        setComments(prev => {
                            const next = [...prev, body.comment];
                            try { console.debug('CommentsModal: dispatching comment_added', { requestId, comment: body.comment }); window.dispatchEvent(new CustomEvent('request:comment_added', { detail: { requestId, comment: body.comment } })); } catch (e) { console.warn(e); }
                            return next;
                        });
                        return;
                    }
                }
            } catch (e) {
                console.warn('CommentsModal: POST comment failed', e);
            }
            // fallback to local optimistic update
            setComments(prev => {
                const next = [...prev, newComment];
                try { console.debug('CommentsModal: dispatching comment_added (local)', { requestId, comment: newComment }); window.dispatchEvent(new CustomEvent('request:comment_added', { detail: { requestId, comment: newComment } })); } catch (e) { console.warn(e); }
                return next;
            });
        })();
        setInputValue('');
        setReplyingTo(null);
    };

    const handleEditComment = (commentId, newText) => {
        (async () => {
            const BACKEND = getBackendBaseUrl();
            const token = localStorage.getItem('regaarder_token');
            try {
                const res = await fetch(`${BACKEND}/requests/${requestId}/comments/${commentId}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
                    body: JSON.stringify({ text: newText })
                });
                if (res.ok) {
                    const body = await res.json();
                    setComments(prev => {
                        const next = prev.map(c => c.id === commentId ? (body.comment || { ...c, text: newText }) : c);
                        try { console.debug('CommentsModal: dispatching comment_updated', { requestId, commentId, newText }); window.dispatchEvent(new CustomEvent('request:comment_updated', { detail: { requestId, commentId, newText } })); } catch (e) { console.warn(e); }
                        return next;
                    });
                    return;
                }
            } catch (e) { console.warn('CommentsModal: PUT comment failed', e); }
            // fallback
            setComments(prev => {
                const next = prev.map(c => c.id === commentId ? { ...c, text: newText } : c);
                try { console.debug('CommentsModal: dispatching comment_updated (local)', { requestId, commentId, newText }); window.dispatchEvent(new CustomEvent('request:comment_updated', { detail: { requestId, commentId, newText } })); } catch (e) { console.warn(e); }
                return next;
            });
        })();
    };

    const handleDeleteComment = (commentId) => {
        (async () => {
            const BACKEND = getBackendBaseUrl();
            const token = localStorage.getItem('regaarder_token');
            try {
                const res = await fetch(`${BACKEND}/requests/${requestId}/comments/${commentId}`, { method: 'DELETE', headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}) } });
                if (res.ok) {
                    setComments(prev => {
                        const next = prev.filter(c => c.id !== commentId);
                        try { console.debug('CommentsModal: dispatching comment_deleted', { requestId, commentId }); window.dispatchEvent(new CustomEvent('request:comment_deleted', { detail: { requestId, commentId } })); } catch (e) { console.warn(e); }
                        return next;
                    });
                    return;
                }
            } catch (e) { console.warn('CommentsModal: DELETE comment failed', e); }
            // fallback
            setComments(prev => {
                const next = prev.filter(c => c.id !== commentId);
                try { console.debug('CommentsModal: dispatching comment_deleted (local)', { requestId, commentId }); window.dispatchEvent(new CustomEvent('request:comment_deleted', { detail: { requestId, commentId } })); } catch (e) { console.warn(e); }
                return next;
            });
        })();
    };

    // --- Interaction Handlers ---

    // Send comment like/dislike to backend
    const toggleCommentReaction = async (commentId, action) => {
        try {
            const token = localStorage.getItem('regaarder_token');
            if (!token) return;

            const BACKEND = getBackendBaseUrl();
            await fetch(`${BACKEND}/comments/react`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ commentId, action, requestId })
            });
        } catch (e) { console.warn('Failed to react to comment', e); }
    };

    const onToggleLike = (commentId) => {
        if (!auth.user) { auth.openAuthModal(); return; }
        setComments(prev => prev.map(c => {
            if (c.id !== commentId) return c;
            const wasLiked = !!c.likedByUser;
            const wasDisliked = !!c.dislikedByUser;
            let likesCount = Number(c.likesCount || 0);
            let dislikesCount = Number(c.dislikesCount || 0);

            // Optimistic update: mutual exclusivity (like cancels dislike)
            if (wasLiked) {
                // undo like
                likesCount = Math.max(0, likesCount - 1);
                toggleCommentReaction(commentId, 'unlike');
                return { ...c, likedByUser: false, likesCount };
            }

            // apply like; if previously disliked, remove that
            likesCount = likesCount + 1;
            toggleCommentReaction(commentId, 'like');
            if (wasDisliked) {
                dislikesCount = Math.max(0, dislikesCount - 1);
                return { ...c, likedByUser: true, dislikedByUser: false, likesCount, dislikesCount };
            }
            return { ...c, likedByUser: true, likesCount };
        }));
    };

    const onToggleDislike = (commentId) => {
        if (!auth.user) { auth.openAuthModal(); return; }
        setComments(prev => prev.map(c => {
            if (c.id !== commentId) return c;
            const wasLiked = !!c.likedByUser;
            const wasDisliked = !!c.dislikedByUser;
            let likesCount = Number(c.likesCount || 0);
            let dislikesCount = Number(c.dislikesCount || 0);

            // Optimistic update: mutual exclusivity (dislike cancels like)
            if (wasDisliked) {
                // undo dislike
                dislikesCount = Math.max(0, dislikesCount - 1);
                toggleCommentReaction(commentId, 'undislike');
                return { ...c, dislikedByUser: false, dislikesCount };
            }

            // apply dislike; if previously liked, remove that
            dislikesCount = dislikesCount + 1;
            toggleCommentReaction(commentId, 'dislike');
            if (wasLiked) {
                likesCount = Math.max(0, likesCount - 1);
                return { ...c, dislikedByUser: true, likedByUser: false, likesCount, dislikesCount };
            }
            return { ...c, dislikedByUser: true, dislikesCount };
        }));
    };

    useEffect(() => {
        if (contentRef.current) {
            setTimeout(() => {
                contentRef.current.scrollTop = contentRef.current.scrollHeight;
            }, 0);
        }
    }, [comments]);


    // Unified drag-to-dismiss logic for mobile touch
    const handleTouchStart = useCallback((e) => {
        e.preventDefault();
        if (!modalRef.current) return;

        const startY = e.touches[0].clientY;
        const startHeight = modalRef.current.clientHeight;

        const handleTouchMove = (moveEvent) => {
            const deltaY = moveEvent.touches[0].clientY - startY;
            let newHeight = startHeight - deltaY;

            newHeight = Math.min(Math.max(newHeight, minHeight), maxHeight);
            setCurrentHeight(newHeight);
        };

        const handleTouchEnd = () => {
            window.removeEventListener('touchmove', handleTouchMove);
            window.removeEventListener('touchend', handleTouchEnd);

            if (modalRef.current && modalRef.current.clientHeight < minHeight + 50) {
                onClose();
            }
        };

        window.addEventListener('touchmove', handleTouchMove, { passive: false });
        window.addEventListener('touchend', handleTouchEnd);
    }, [minHeight, maxHeight, onClose]);

    // Persist comments per-request in localStorage under `comments_request_<id>`
    const getCommentsKey = (id) => `comments_request_${id}`;

    useEffect(() => {
        if (isOpen) {
            setCurrentHeight(window.innerHeight * 0.9);
            document.body.style.overflow = 'hidden';

            // Load comments for this request from backend (fallback to localStorage)
            (async () => {
                try {
                    if (requestId) {
                        const BACKEND = getBackendBaseUrl();
                        const res = await fetch(`${BACKEND}/requests/${requestId}/comments`);
                        if (res.ok) {
                            const body = await res.json();
                            if (body && Array.isArray(body.comments)) {
                                setComments(body.comments);
                                return;
                            }
                        }
                        const raw = localStorage.getItem(getCommentsKey(requestId));
                        if (raw) {
                            const parsed = JSON.parse(raw);
                            setComments(Array.isArray(parsed) ? parsed : []);
                        } else {
                            setComments([]);
                        }
                    } else {
                        setComments([]);
                    }
                } catch (e) {
                    try {
                        const raw = localStorage.getItem(getCommentsKey(requestId));
                        if (raw) {
                            const parsed = JSON.parse(raw);
                            setComments(Array.isArray(parsed) ? parsed : []);
                        } else {
                            setComments([]);
                        }
                    } catch (err) { setComments([]); }
                }
            })();

            setReplyingTo(null);
            setInputValue('');

            setTimeout(() => {
                if (inputRef.current) {
                    inputRef.current.focus();
                }
            }, 300);
        } else {
            document.body.style.overflow = '';
        }
        return () => {
            document.body.style.overflow = '';
        };
    }, [isOpen, requestId]);

    // Persist comments whenever they change for the current request
    useEffect(() => {
        try {
            if (requestId) {
                localStorage.setItem(getCommentsKey(requestId), JSON.stringify(comments));
            }
        } catch (e) { }
    }, [comments, requestId]);

    const isActive = inputValue.trim().length > 0;

    const sendButtonStyle = isActive
        ? { backgroundColor: '#4b5563', color: 'white' }
        : { backgroundColor: '#e5e7eb', color: '#9ca3af' };

    // Filter out hidden and deleted comments
    const visibleComments = comments.filter(c => !c.hidden && !c.deleted);
    const commentCount = visibleComments.length;

    return (
        <div
            className={`fixed inset-0 z-[9999] transition-all duration-300 ${isOpen ? 'translate-y-0' : 'translate-y-full pointer-events-none'}`}
            style={{
                transitionProperty: 'transform',
                transitionTimingFunction: 'cubic-bezier(0.4, 0, 0.2, 1)',
                transitionDuration: isOpen ? '300ms' : '0ms'
            }}
        >
            <div
                className={`absolute inset-0 bg-black transition-opacity duration-300 ${isOpen ? 'opacity-50' : 'opacity-0'}`}
                onClick={onClose}
            ></div>

            <div
                ref={modalRef}
                className={`absolute bottom-0 left-0 right-0 bg-white rounded-t-2xl flex flex-col shadow-2xl transition-transform duration-300 ease-in-out`}
                style={{ height: isOpen ? currentHeight : 0 }}
            >
                <div
                    className="flex justify-center py-2 flex-shrink-0"
                    onTouchStart={handleTouchStart}
                >
                    <div className="w-10 h-1.5 bg-gray-300 rounded-full cursor-grab"></div>
                </div>

                <header className="flex items-center px-4 py-3 border-b border-gray-100 flex-shrink-0">
                    <h3 className="text-lg font-semibold text-gray-800 flex items-center">
                        <MessageSquare className="w-5 h-5 mr-2 text-gray-500" /> {getTranslation('Comments', selectedLanguage)}
                    </h3>
                </header>

                <main ref={contentRef} className="flex-grow overflow-y-auto px-4">

                    {commentCount === 0 ? (
                        <div className="flex items-center justify-center h-full min-h-[200px]">
                            <div className="text-center p-8">
                                <MessageSquare className="w-12 h-12 mx-auto text-gray-300 mb-4" />
                                <p className="text-gray-700 font-semibold mb-2">{getTranslation('No comments yet', selectedLanguage)}</p>
                                <p className="text-sm text-gray-500">{getTranslation('Be the first to share your thoughts!', selectedLanguage)}</p>
                            </div>
                        </div>
                    ) : (
                        <div className="space-y-1 pt-2 pb-4">
                            {visibleComments.map(comment => (
                                <CommentItem
                                    key={comment.id}
                                    comment={comment}
                                    onReply={handleReply}
                                    onToggleLike={onToggleLike}
                                    onToggleDislike={onToggleDislike}
                                    onEdit={handleEditComment}
                                    onDelete={handleDeleteComment}
                                    selectedLanguage={selectedLanguage}
                                />
                            ))}
                        </div>
                    )}
                </main>

                <footer
                    className="p-4 border-t border-gray-100 flex-shrink-0"
                    style={{ paddingBottom: 'calc(12px + env(safe-area-inset-bottom, 0px))' }}
                >

                    {replyingTo && (
                        <div className="flex items-center justify-between p-2 mb-2 bg-gray-100 rounded-lg text-sm text-gray-700">
                            <span className="font-medium">
                                {getTranslation('Replying to', selectedLanguage)} <span className="text-indigo-600 font-semibold">{replyingTo.userName}</span>
                            </span>
                            <button
                                onClick={handleCancelReply}
                                className="p-1 rounded-full hover:bg-gray-200 transition-colors"
                                aria-label="Cancel reply"
                            >
                                <X className="w-4 h-4 text-gray-500" />
                            </button>
                        </div>
                    )}

                    <div className="flex items-center space-x-2">
                        <input
                            ref={inputRef}
                            type="text"
                            placeholder={getTranslation('Add a comment... (use @ to mention)', selectedLanguage)}
                            value={inputValue}
                            onChange={(e) => setInputValue(e.target.value)}
                            onKeyPress={(e) => {
                                if (e.key === 'Enter' && isActive) {
                                    handleSendComment();
                                }
                            }}
                            className="w-full py-3 px-4 bg-gray-100 border border-gray-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-gray-300 focus:border-gray-300 text-gray-700 placeholder-gray-500"
                        />
                        <button
                            onClick={handleSendComment}
                            disabled={!isActive}
                            style={sendButtonStyle}
                            className={`p-2 rounded-full transition-colors flex-shrink-0 ${isActive ? 'hover:bg-gray-700' : 'cursor-not-allowed'}`}
                        >
                            <Send className="w-5 h-5" />
                        </button>
                    </div>
                </footer>
            </div>
        </div>
    );
};


// --- Creative Suggestions Modal Component (REVAMPED) ---
const CreativeSuggestionsModal = ({ isOpen, onClose, requestId, selectedLanguage = 'English' }) => {
    const modalRef = useRef(null);
    const contentRef = useRef(null);
    const inputRef = useRef(null);

    const [currentHeight, setCurrentHeight] = useState(window.innerHeight * 0.9);
    const minHeight = window.innerHeight * 0.4;
    const maxHeight = window.innerHeight * 0.95;

    const auth = useAuth();
    const [inputValue, setInputValue] = useState('');
    const [suggestions, setSuggestions] = useState([]);
    const [isFirstTimeUser, setIsFirstTimeUser] = useState(false);

    const goldColor = 'var(--color-gold)'; // accent color
    const goldLight = 'var(--color-gold-light)'; // accent color light

    // Check if first-time user
    useEffect(() => {
        try {
            const hasSeenSuggestions = localStorage.getItem('has_seen_suggestions_modal');
            if (!hasSeenSuggestions) {
                setIsFirstTimeUser(true);
                localStorage.setItem('has_seen_suggestions_modal', '1');
            }
        } catch (e) {
            // ignore localStorage errors
        }
    }, []);

    // Send suggestion handler
    const handleSendSuggestion = async () => {
        if (!auth.user) { return; }
        const text = inputValue.trim();
        if (!text) return;

        const newSuggestion = {
            id: Date.now(),
            text,
            userName: (auth.user && (auth.user.name || auth.user.email)) || MOCK_USER.name,
            timestamp: new Date(),
        };

        setSuggestions(prev => [...prev, newSuggestion]);
        setInputValue('');

        try {
            const token = localStorage.getItem('regaarder_token');
            if (token) {
                await fetch(`${getBackendBaseUrl()}/suggestion`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                    body: JSON.stringify({ requestId, text })
                });
            }
        } catch { }

        if (inputRef.current) {
            setTimeout(() => inputRef.current.focus(), 50);
        }
    };

    useEffect(() => {
        if (contentRef.current) {
            setTimeout(() => {
                contentRef.current.scrollTop = contentRef.current.scrollHeight;
            }, 0);
        }
    }, [suggestions]);


    // --- Drag Handle Logic ---
    const handleTouchStart = useCallback((e) => {
        e.preventDefault();
        if (!modalRef.current) return;

        const startY = e.touches[0].clientY;
        const startHeight = modalRef.current.clientHeight;

        const handleTouchMove = (moveEvent) => {
            const deltaY = moveEvent.touches[0].clientY - startY;
            let newHeight = startHeight - deltaY;

            newHeight = Math.min(Math.max(newHeight, minHeight), maxHeight);
            setCurrentHeight(newHeight);
        };

        const handleTouchEnd = () => {
            window.removeEventListener('touchmove', handleTouchMove);
            window.removeEventListener('touchend', handleTouchEnd);

            if (modalRef.current && modalRef.current.clientHeight < minHeight + 50) {
                onClose();
            }
        };

        window.addEventListener('touchmove', handleTouchMove, { passive: false });
        window.addEventListener('touchend', handleTouchEnd);
    }, [minHeight, maxHeight, onClose]);

    useEffect(() => {
        if (isOpen) {
            setCurrentHeight(window.innerHeight * 0.9);
            document.body.style.overflow = 'hidden';
            setInputValue('');
            // Load persisted suggestions for this request
            (async () => {
                try {
                    if (requestId) {
                        const BACKEND = getBackendBaseUrl();
                        const res = await fetch(`${BACKEND}/requests/${requestId}/suggestions`);
                        if (res.ok) {
                            const body = await res.json();
                            if (body && Array.isArray(body.suggestions)) {
                                setSuggestions(body.suggestions);
                                return;
                            }
                        }
                    }
                } catch (e) { }
                setSuggestions([]);
            })();

            setTimeout(() => {
                if (inputRef.current) {
                    inputRef.current.focus();
                }
            }, 300);
        } else {
            document.body.style.overflow = '';
        }
        return () => {
            document.body.style.overflow = '';
        };
    }, [isOpen, requestId]);
    // --- End Drag Handle Logic ---

    const isActive = inputValue.trim().length > 0;
    const suggestionCount = suggestions.length;

    return (
        <div
            className={`fixed inset-0 z-[9999] transition-all duration-300 ${isOpen ? 'translate-y-0' : 'translate-y-full pointer-events-none'}`}
            style={{
                transitionProperty: 'transform',
                transitionTimingFunction: 'cubic-bezier(0.4, 0, 0.2, 1)',
                transitionDuration: isOpen ? '300ms' : '0ms'
            }}
        >
            <div
                className={`absolute inset-0 bg-black/70 backdrop-blur-sm transition-opacity duration-300 ${isOpen ? 'opacity-100' : 'opacity-0'}`}
                onClick={onClose}
            ></div>

            <div
                ref={modalRef}
                className={`absolute bottom-0 left-0 right-0 rounded-t-3xl flex flex-col shadow-2xl transition-transform duration-300 ease-in-out`}
                style={{
                    height: isOpen ? currentHeight : 0,
                    background: 'linear-gradient(180deg, #ffffff 0%, #fefdfb 100%)',
                    boxShadow: '0 -8px 32px rgba(0,0,0,0.12), 0 -2px 8px rgba(203,138,0,0.08)',
                    border: '1px solid rgba(203,138,0,0.1)',
                    borderBottom: 'none'
                }}
            >
                <div
                    className="flex justify-center py-2 flex-shrink-0"
                    onTouchStart={handleTouchStart}
                >
                    <div className="w-10 h-1.5 bg-gray-300 rounded-full cursor-grab"></div>
                </div>

                <header className="px-5 pt-2 pb-4 flex-shrink-0">
                    <div className="flex items-start mb-3">
                        <div className="flex items-center space-x-3">
                            <div
                                className="w-11 h-11 rounded-xl flex items-center justify-center"
                                style={{
                                    background: `linear-gradient(135deg, ${goldLight} 0%, rgba(255,255,255,0.3) 100%)`,
                                    boxShadow: '0 2px 8px rgba(203,138,0,0.15)'
                                }}
                            >
                                <Lightbulb className="w-6 h-6" style={{ color: goldColor }} />
                            </div>
                            <div>
                                <h3 className="text-xl font-bold text-gray-900 flex items-center">
                                    {getTranslation('Creative Suggestions', selectedLanguage)}
                                </h3>
                                <p className="text-xs text-gray-500 mt-0.5">
                                    {getTranslation('on Request #req_1767338342444', selectedLanguage).replace('#req_1767338342444', `#${requestId}`)}
                                </p>
                            </div>
                        </div>
                    </div>
                </header>

                <main ref={contentRef} className="flex-grow overflow-y-auto px-5">
                    {isFirstTimeUser && (
                        <div
                            className="relative p-4 mb-5 rounded-2xl overflow-hidden"
                            style={{
                                background: `linear-gradient(135deg, ${goldLight} 0%, rgba(255,250,240,0.4) 100%)`,
                                border: `1.5px solid ${goldColor}`,
                                boxShadow: '0 4px 12px rgba(203,138,0,0.12)'
                            }}
                        >
                            <div className="absolute top-0 right-0 w-24 h-24 opacity-10" style={{
                                background: `radial-gradient(circle, ${goldColor} 0%, transparent 70%)`
                            }}></div>
                            <div className="relative flex items-start">
                                <div
                                    className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 mr-3"
                                    style={{
                                        background: `linear-gradient(135deg, ${goldLight} 0%, rgba(255,255,255,0.3) 100%)`,
                                        boxShadow: '0 2px 6px rgba(0,0,0,0.08)'
                                    }}
                                >
                                    <Sparkles className="w-5 h-5" style={{ color: goldColor }} />
                                </div>
                                <div>
                                    <p className="font-bold text-sm mb-1 flex items-center" style={{ color: goldColor }}>
                                        <Sparkles className="w-4 h-4 mr-1.5" style={{ color: goldColor }} />
                                        {getTranslation('Reward Great Ideas', selectedLanguage)}
                                    </p>
                                    <p className="text-xs text-gray-700 leading-relaxed">
                                        {getTranslation('Creators love your input! Show appreciation by tipping contributors for their valuable creative suggestions that help shape amazing content.', selectedLanguage)}
                                    </p>
                                </div>
                            </div>
                        </div>
                    )}

                    {suggestionCount === 0 ? (
                        <div className="flex flex-col items-center justify-center py-12 text-center min-h-[200px]">
                            <div
                                className="w-20 h-20 rounded-2xl flex items-center justify-center mb-4"
                                style={{
                                    background: `linear-gradient(135deg, ${goldLight} 0%, rgba(255,255,255,0.3) 100%)`,
                                    boxShadow: '0 4px 12px rgba(203,138,0,0.1)'
                                }}
                            >
                                <Lightbulb className="w-10 h-10" style={{ color: goldColor, opacity: 0.7 }} />
                            </div>
                            <p className="text-lg font-bold text-gray-800 mb-2">{getTranslation('No suggestions yet', selectedLanguage)}</p>
                            <p className="text-sm text-gray-500 max-w-xs">
                                {getTranslation('Be the first to share a creative idea and help shape this content!', selectedLanguage)}
                            </p>
                        </div>
                    ) : (
                        <div className="space-y-3 pb-4">
                            {suggestions.map((s, index) => (
                                <div
                                    key={index}
                                    className="p-4 rounded-xl border transition-all hover:shadow-md"
                                    style={{
                                        background: 'linear-gradient(135deg, #ffffff 0%, #fafafa 100%)',
                                        borderColor: '#e5e7eb',
                                        boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
                                    }}
                                >
                                    <div className="flex items-center space-x-2 mb-2">
                                        <div
                                            className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold text-white"
                                            style={{ background: `linear-gradient(135deg, ${goldColor}, ${goldLight})` }}
                                        >
                                            {s.userName.charAt(0)}
                                        </div>
                                        <div>
                                            <p className="text-xs font-semibold text-gray-800">{s.userName}</p>
                                            <p className="text-[10px] text-gray-400">{getTranslation('Just now', selectedLanguage)}</p>
                                        </div>
                                    </div>
                                    <p className="text-sm text-gray-700 leading-relaxed pl-9">{s.text}</p>
                                </div>
                            ))}
                        </div>
                    )}
                </main>

                <footer
                    className="p-5 border-t flex-shrink-0"
                    style={{
                        borderColor: 'rgba(203,138,0,0.1)',
                        background: 'linear-gradient(180deg, rgba(255,255,255,0.95) 0%, rgba(254,253,251,0.98) 100%)',
                        backdropFilter: 'blur(8px)',
                        paddingBottom: 'calc(12px + env(safe-area-inset-bottom, 0px))'
                    }}
                >
                    <div className="flex items-center space-x-3">
                        <input
                            ref={inputRef}
                            type="text"
                            placeholder={getTranslation('What would make this video amazing?', selectedLanguage)}
                            value={inputValue}
                            onChange={(e) => setInputValue(e.target.value)}
                            onKeyPress={(e) => {
                                if (e.key === 'Enter' && isActive) {
                                    handleSendSuggestion();
                                }
                            }}
                            className="flex-1 py-3 px-5 bg-white border-2 rounded-2xl focus:outline-none text-gray-800 placeholder-gray-400 transition-all"
                            style={{
                                borderColor: isActive ? goldColor : '#e5e7eb',
                                boxShadow: isActive ? `0 0 0 3px ${goldLight}` : 'none'
                            }}
                        />
                        <button
                            onClick={handleSendSuggestion}
                            disabled={!isActive}
                            className={`w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0 transition-all shadow-md ${isActive ? 'hover:scale-105 active:scale-95' : 'cursor-not-allowed opacity-50'
                                }`}
                            style={{
                                background: isActive
                                    ? `linear-gradient(135deg, ${goldColor}, ${goldLight})`
                                    : '#e5e7eb',
                                boxShadow: isActive
                                    ? '0 4px 12px rgba(203,138,0,0.3)'
                                    : 'none'
                            }}
                        >
                            <Send className="w-5 h-5 text-white" />
                        </button>
                    </div>
                </footer>
            </div>
        </div>
    );
};


// --- Simplified Progress Component ---
const RankProgressBar = ({ currentScore, projectedScore, rank, nextRankNeeded, goldColor, selectedLanguage = 'English' }) => {
    const progress = Math.min(100, ((currentScore % 100) / 100) * 100);
    const projProgress = Math.min(100, ((projectedScore % 100) / 100) * 100);

    return (
        <div className="mb-4">
            <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-semibold text-gray-700">
                    {getTranslation('Rank', selectedLanguage)} #{rank}
                </span>
                <span className="text-xs text-gray-500">
                    {nextRankNeeded} {getTranslation('needed for next rank', selectedLanguage)}
                </span>
            </div>
            <div className="h-2 bg-gray-200 rounded-full relative overflow-hidden">
                <div
                    className="h-2 absolute top-0 left-0 rounded-full transition-all duration-500 bg-gray-900"
                    style={{
                        width: `${progress}%`
                    }}
                />
                {projectedScore > currentScore && (
                    <div
                        className="h-2 absolute top-0 rounded-full transition-all duration-500 bg-gray-400"
                        style={{
                            left: `${progress}%`,
                            width: `${projProgress - progress}%`,
                            opacity: 0.5
                        }}
                    />
                )}
            </div>
        </div>
    );
}


// --- Boosts Modal Component (Revamped - Experiential messaging) ---
// The modal component is now imported from BoostsModal.jsx
// It focuses on communicating VISIBILITY & DISCOVERY as the core benefit of boosting
// with principled urgency based on rank decay windows and competitive proximity


// --- Claim Confirmation Modal ---
const ClaimConfirmationModal = ({ isOpen, onClose, onConfirm, selectedLanguage = 'English' }) => {
    if (!isOpen) return null;

    const goldColor = 'var(--color-gold)';

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 px-6">
            <div
                className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
                onClick={onClose}
            />
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm relative z-10 overflow-hidden animate-in fade-in zoom-in duration-200">
                <div className="p-6 text-center">
                    <h3 className="text-xl font-bold text-gray-900 mb-3">{getTranslation('Ready to Commit?', selectedLanguage)}</h3>
                    <p className="text-sm text-gray-600 mb-8 leading-relaxed">
                        {getTranslation('Claiming this request means you take responsibility for creating the video and must submit a first update within 48 hours.', selectedLanguage)}
                    </p>
                    <div className="flex space-x-3">
                        <button
                            onClick={onClose}
                            className="flex-1 py-3 px-4 bg-gray-100 text-gray-700 font-bold rounded-xl hover:bg-gray-200 transition-colors"
                        >
                            {getTranslation('Not Yet', selectedLanguage)}
                        </button>
                        <button
                            onClick={onConfirm}
                            className="flex-1 py-3 px-4 text-white font-bold rounded-xl transition-colors shadow-lg"
                            style={{
                                backgroundColor: goldColor,
                                boxShadow: '0 4px 12px -2px rgba(var(--color-gold-rgb), 0.35)'
                            }}
                        >
                            {getTranslation('Claim', selectedLanguage)}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

// --- Toast Notification Component ---
const Toast = ({ message, isVisible, onClose, actionLabel, onAction, variant = 'success', selectedLanguage = 'English' }) => {
    const [swipeOffset, setSwipeOffset] = useState(0);
    const [isDismissing, setIsDismissing] = useState(false);
    const dragStartX = useRef(0);
    const toastRef = useRef(null);

    useEffect(() => {
        if (isVisible) {
            const timer = setTimeout(() => {
                handleDismiss();
            }, 4000);
            return () => clearTimeout(timer);
        }
    }, [isVisible, onClose]);

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

    const iconColor = variant === 'success' ? 'bg-green-500' : 'bg-gray-400';

    return (
        <div
            className={`fixed left-4 right-4 z-[70] flex justify-center transition-all duration-500 ease-out ${isVisible && !isDismissing ? 'translate-y-0 opacity-100' : '-translate-y-8 opacity-0 pointer-events-none'}`}
            style={{ top: 'calc(12px + env(safe-area-inset-top, 0px))' }}
        >
            <div
                ref={toastRef}
                className="bg-white text-gray-900 px-4 py-3 rounded-lg shadow-lg flex items-start max-w-md border border-gray-100 w-full cursor-grab select-none transition-all duration-300"
                style={{
                    transform: `translateX(${swipeOffset}px)`,
                    animation: isVisible && !isDismissing ? 'toastSlideDown 0.4s cubic-bezier(0.16, 1, 0.3, 1)' : 'none',
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
                <div className={`${iconColor} rounded-full p-1 flex-shrink-0 mt-0.5 mr-3`}>
                    {variant === 'success' ? (
                        <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                        </svg>
                    ) : (
                        <svg className="w-3 h-3 text-white" viewBox="0 0 24 24" fill="currentColor">
                            <circle cx="12" cy="12" r="6" />
                        </svg>
                    )}
                </div>
                <div className="flex-grow mr-2">
                    <h4 className="text-sm font-bold text-gray-900">{variant === 'success' ? getTranslation('Success', selectedLanguage) : getTranslation('Notice', selectedLanguage)}</h4>
                    <p className="text-sm text-gray-600 leading-snug mt-0.5">{message}</p>
                </div>
                {actionLabel && onAction && (
                    <button
                        onClick={() => { onAction(); onClose(); }}
                        className="mr-3 text-sm font-semibold text-gray-700 hover:underline"
                        aria-label={actionLabel}
                    >
                        {actionLabel}
                    </button>
                )}
            </div>
        </div>
    );
};


// --- Reusable Component for a Single Request Card ---
const RequestCard = ({ request, detailedRank, searchQuery, isPinned = false, onTogglePin, pulseActive = false, onOpenProfile, selectedLanguage = 'English', initialBookmarked = false, adminSelections = {}, onBookmarkChange = null, isFocused = false }) => {
    const goldColor = 'var(--color-gold)';
    const lightGreyBg = customColors['--color-neutral-light-bg']; // UPDATED

    const [isExpanded, setIsExpanded] = useState(false);
    const requesterName = request.requesterName || (request.creator && request.creator.name) || request.company || 'Anonymous';
    const requesterId = (request.creator && request.creator.id) || request.createdBy || request.creatorId || null;
    const requesterAvatar = resolveImageUrl(
        request.requesterAvatar ||
        (request.creator && (request.creator.image || request.creator.avatar || request.creator.photoURL)) ||
        request.imageUrl ||
        request.avatarUrl ||
        ''
    );

    // States for interactivity
    const [isBookmarked, setIsBookmarked] = useState(false);
    const [isBookmarkHover, setIsBookmarkHover] = useState(false);
    const [isBookmarkActive, setIsBookmarkActive] = useState(false);

    // initialize bookmark state from parent-provided set
    useEffect(() => { try { setIsBookmarked(!!initialBookmarked); } catch { } }, [initialBookmarked]);
    // --- Swipe / gesture state ---
    const [swipeOffset, setSwipeOffset] = useState(0);
    const [isDragging, setIsDragging] = useState(false);
    const dragStartX = useRef(0);
    const dragStartY = useRef(0);
    const removeTimeoutRef = useRef(null);
    const [isRemoving, setIsRemoving] = useState(false);
    const [isVisible, setIsVisible] = useState(true);
    const [pendingAction, setPendingAction] = useState(null); // { type, prev }
    const [swipeToast, setSwipeToast] = useState({ visible: false, message: '' });
    const [isLiked, setIsLiked] = useState(false);
    const [isHeartHover, setIsHeartHover] = useState(false);
    const [isHeartActive, setIsHeartActive] = useState(false);
    // First-like long-press hint
    const [showLongPressHint, setShowLongPressHint] = useState(false);
    const [longPressHintStyle, setLongPressHintStyle] = useState({ left: 0, top: 0 });
    // Long-press / quick options for Heart
    const [showLikeOptions, setShowLikeOptions] = useState(false);
    const heartBtnRef = useRef(null);
    const heartOptionsRef = useRef(null);
    const [likeOptionsStyle, setLikeOptionsStyle] = useState({});
    const longPressTimeoutRef = useRef(null);
    const longPressTriggeredRef = useRef(false);
    const [isDisliked, setIsDisliked] = useState(false);
    const [showReportModal, setShowReportModal] = useState(false);
    const [showShareModal, setShowShareModal] = useState(false);
    const autoHideTimeoutRef = useRef(null);
    const [showDoubleTapEffect, setShowDoubleTapEffect] = useState(false);
    const doubleTapTimeoutRef = useRef(null);
    const [reportReason, setReportReason] = useState('spam');
    const [reportOtherText, setReportOtherText] = useState('');
    const [bookmarkToast, setBookmarkToast] = useState({ visible: false, message: '' });
    const [showBoostsModal, setShowBoostsModal] = useState(false);
    const [showDailyLimitModal, setShowDailyLimitModal] = useState(false);
    const [showRequestValueLimitModal, setShowRequestValueLimitModal] = useState(false);
    const [likesCount, setLikesCount] = useState(request.likes);
    const [showCommentsModal, setShowCommentsModal] = useState(false);
    const [showSuggestionsModal, setShowSuggestionsModal] = useState(false);
    const auth = useAuth();

    // Claim Logic State - initialize from backend data
    const [isClaimed, setIsClaimed] = useState(!!request.claimed);
    const [claimedBy, setClaimedBy] = useState(request.claimedBy || null);
    const [showClaimModal, setShowClaimModal] = useState(false);
    const [showToast, setShowToast] = useState(false);
    const [actionToast, setActionToast] = useState({ visible: false, message: '' });
    // Edit state (only available to the request creator when not claimed)
    const [showEditModal, setShowEditModal] = useState(false);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [editTitle, setEditTitle] = useState(request.title || '');
    const [editDescription, setEditDescription] = useState(request.description || '');
    const [editLength, setEditLength] = useState(request.meta?.selectedVideoLength || '');
    const [editPrivacy, setEditPrivacy] = useState(request.meta?.selectedPrivacy || 'public');
    const [editFormat, setEditFormat] = useState(request.meta?.selectedFormat || 'one-time');
    const [showLengthDropdown, setShowLengthDropdown] = useState(false);
    const [showFormatDropdown, setShowFormatDropdown] = useState(false);

    // Sync claimed state when request prop changes
    useEffect(() => {
        setIsClaimed(!!request.claimed);
        setClaimedBy(request.claimedBy || null);
        // keep edit fields in sync if the request prop changes
        try { setEditTitle(request.title || ''); } catch (e) { }
        try { setEditDescription(request.description || ''); } catch (e) { }
        try { setEditLength(request.meta?.selectedVideoLength || ''); } catch (e) { }
        try { setEditPrivacy(request.meta?.selectedPrivacy || 'public'); } catch (e) { }
        try { setEditFormat(request.meta?.selectedFormat || 'one-time'); } catch (e) { }
    }, [request.claimed, request.claimedBy, request.title, request.description, request.meta]);

    // State for Avatar Fallback
    const [showFallback, setShowFallback] = useState(false);

    // Update internal state if the prop changes (e.g., after a simulated successful boost)
    const [currentInfluence, setCurrentInfluence] = useState(detailedRank.totalInfluence);

    useEffect(() => {
        setCurrentInfluence(detailedRank.totalInfluence);
    }, [detailedRank.totalInfluence]);

    // Load persisted likes/dislikes for this request if present
    useEffect(() => {
        try {
            const raw = localStorage.getItem('request_reacts_v1');
            if (raw) {
                const map = JSON.parse(raw) || {};
                const data = map[request.id];
                if (data) {
                    if (typeof data.likesCount === 'number') setLikesCount(data.likesCount);
                    if (typeof data.isLiked === 'boolean') setIsLiked(data.isLiked);
                    if (typeof data.isDisliked === 'boolean') setIsDisliked(data.isDisliked);
                }
            }
        } catch (e) { }
    }, [request.id]);




    useEffect(() => {
        if (!requesterAvatar) {
            setShowFallback(true);
            return;
        }
        if (request.imageUrl && request.imageUrl.includes('mock-image-fail')) {
            setShowFallback(true);
            return;
        }
        setShowFallback(false);
    }, [request.imageUrl, requesterAvatar]);


    const handleImageError = () => {
        setShowFallback(true);
    };

    const lastTapRef = useRef(0);
    const DOUBLE_TAP_DELAY = 300;

    const MAX_LENGTH = 120;
    const _description = (request && typeof request.description === 'string') ? request.description : '';

    const needsTruncation = _description.length > MAX_LENGTH;

    const displayedDescriptionRaw = isExpanded || !needsTruncation
        ? _description
        : _description.substring(0, MAX_LENGTH) + '...';

    const toggleExpansion = () => {
        setIsExpanded(!isExpanded);
    };

    const toggleBookmark = () => {
        // allow anonymous fallback (no hard auth requirement)
        const token = (auth.user && auth.user.token) || localStorage.getItem('regaarder_token');

        const prev = isBookmarked;
        const next = !prev;

        // optimistic UI update
        setIsBookmarked(next);

        console.log('Toggling bookmark:', { requestId: request.id, action: next ? 'add' : 'remove', title: request.title, hasToken: !!token });

        const base = getBackendBaseUrl();
        const doPersist = async () => {
            const headers = { 'Content-Type': 'application/json', ...(token ? { 'Authorization': `Bearer ${token}` } : {}) };
            if (next) {
                const res = await fetch(`${base}/bookmarks/requests`, {
                    method: 'POST',
                    headers,
                    body: JSON.stringify({ requestId: request.id, title: request.title || '' })
                });
                const result = await res.json();
                console.log('Bookmark add response:', result);
                if (!res.ok || !result.success) throw new Error('Bookmark add failed');
                return true;
            } else {
                const res = await fetch(`${base}/bookmarks/requests`, {
                    method: 'DELETE',
                    headers,
                    body: JSON.stringify({ requestId: request.id })
                });
                const result = await res.json();
                console.log('Bookmark remove response:', result);
                if (!res.ok || !result.success) throw new Error('Bookmark remove failed');
                return true;
            }
        };
        doPersist().then(() => {
            if (next) setBookmarkToast({ visible: true, message: 'Saved to bookmarks' });
            try { if (onBookmarkChange) onBookmarkChange(request.id, next); } catch { }
        }).catch((err) => {
            console.error('Bookmark error:', err);
            // revert optimistic update on failure
            setIsBookmarked(prev);
            setActionToast({ visible: true, message: 'Bookmark failed' });
        });
    };

    const handleUndoSwipe = () => {
        if (!pendingAction) return;
        if (pendingAction.type === 'bookmark') {
            setIsBookmarked(pendingAction.prev);
        }
        if (pendingAction.type === 'dismiss') {
            // cancel removal if pending
            if (removeTimeoutRef.current) {
                clearTimeout(removeTimeoutRef.current);
                removeTimeoutRef.current = null;
            }
            setIsRemoving(false);
            setIsVisible(true);
        }
        setPendingAction(null);
        setSwipeToast({ visible: false, message: '' });
    };

    // --- Long-press on card body to open native share ---
    const cardLongPressRef = useRef(null);
    const cardLongPressTriggered = useRef(false);

    const handleCardShareNative = async () => {
        const shareUrl = `${WEB_URL}/share/request/${encodeURIComponent(request.id)}`;
        const shareTitle = request.title || 'Check out this request on Regaarder';
        const shareText = `${shareTitle}\n\nRequested by ${requesterName}\n\n${shareUrl}`;
        try {
            if (navigator && navigator.share) {
                await navigator.share({
                    title: shareTitle,
                    text: shareText,
                    url: shareUrl
                });
            } else {
                // Fallback: copy to clipboard
                try {
                    await navigator.clipboard.writeText(shareText);
                    setSwipeToast({ visible: true, message: getTranslation('Link copied to clipboard', selectedLanguage) });
                } catch { }
            }
        } catch (err) {
            // user cancelled or share API failed silently
            if (err.name !== 'AbortError') {
                try {
                    await navigator.clipboard.writeText(shareText);
                    setSwipeToast({ visible: true, message: getTranslation('Link copied to clipboard', selectedLanguage) });
                } catch { }
            }
        }
    };

    const startCardLongPress = () => {
        cardLongPressTriggered.current = false;
        if (cardLongPressRef.current) clearTimeout(cardLongPressRef.current);
        cardLongPressRef.current = setTimeout(() => {
            cardLongPressTriggered.current = true;
            // Haptic feedback if available
            try { navigator.vibrate && navigator.vibrate(30); } catch { }
            handleCardShareNative();
        }, 600); // 600ms long press
    };

    const cancelCardLongPress = () => {
        if (cardLongPressRef.current) {
            clearTimeout(cardLongPressRef.current);
            cardLongPressRef.current = null;
        }
    };

    const handlePointerStart = (clientX, clientY) => {
        dragStartX.current = clientX;
        dragStartY.current = clientY;
        // don't mark as dragging yet — wait until movement shows horizontal intent
        setIsDragging(false);
        setSwipeOffset(0);
    };

    const handlePointerMove = (clientX, clientY, e) => {
        const deltaX = clientX - dragStartX.current;
        const deltaY = clientY - dragStartY.current;

        // If we haven't started a horizontal drag yet, detect horizontal intent
        if (!isDragging) {
            const absX = Math.abs(deltaX);
            const absY = Math.abs(deltaY);
            const START_THRESHOLD = 12; // px before we consider it a swipe
            const HORIZONTAL_DOMINANCE = 1.3; // require horizontal > 1.3 * vertical

            if (absX > START_THRESHOLD && absX > absY * HORIZONTAL_DOMINANCE) {
                setIsDragging(true);
                // prevent scrolling once we've decided it's a horizontal swipe
                try { if (e && e.preventDefault) e.preventDefault(); } catch (err) { }
                setSwipeOffset(deltaX);
            } else {
                // still vertical/undetermined — do not update swipeOffset so scrolling works
                return;
            }
        } else {
            // already dragging — update offset and prevent default scrolling
            try { if (e && e.preventDefault) e.preventDefault(); } catch (err) { }
            setSwipeOffset(deltaX);
        }
    };

    const finalizeSwipe = () => {
        // If we never engaged a horizontal drag, treat as tap
        if (!isDragging) {
            setSwipeOffset(0);
            return;
        }
        setIsDragging(false);
        const threshold = 110; // px to confirm action
        // Right-swipe (bookmark) disabled — only allow left-swipe to dismiss
        if (swipeOffset < -threshold) {
            // Confirm dismiss (left)
            setPendingAction({ type: 'dismiss', prevVisible: isVisible });
            // trigger enhanced remove animation
            setIsRemoving(true);
            // allow the reverse-news animation to play, then remove
            removeTimeoutRef.current = setTimeout(() => {
                setIsVisible(false);
                setIsRemoving(false);
            }, 420);
            setSwipeOffset(0);
            setSwipeToast({ visible: true, message: 'Hidden from feed' });
        } else {
            // not enough movement, snap back
            setSwipeOffset(0);
        }
    };

    // Touch and mouse handlers bridging
    const onTouchStart = (e) => {
        if (!e.touches || e.touches.length === 0) return;
        handlePointerStart(e.touches[0].clientX, e.touches[0].clientY);
        startCardLongPress();
    };
    const onTouchMove = (e) => {
        if (!e.touches || e.touches.length === 0) return;
        cancelCardLongPress(); // cancel long-press if user moves
        handlePointerMove(e.touches[0].clientX, e.touches[0].clientY, e);
    };
    const onTouchEnd = (e) => {
        cancelCardLongPress();
        if (cardLongPressTriggered.current) { cardLongPressTriggered.current = false; return; } // swallow tap after long-press
        finalizeSwipe();
    };

    const onMouseDown = (e) => {
        handlePointerStart(e.clientX, e.clientY);
        startCardLongPress();
        window.addEventListener('mousemove', onMouseMove);
        window.addEventListener('mouseup', onMouseUp);
    };
    const onMouseMove = (e) => { cancelCardLongPress(); handlePointerMove(e.clientX, e.clientY, e); };
    const onMouseUp = (e) => {
        cancelCardLongPress();
        window.removeEventListener('mousemove', onMouseMove);
        window.removeEventListener('mouseup', onMouseUp);
        if (cardLongPressTriggered.current) { cardLongPressTriggered.current = false; return; }
        finalizeSwipe();
    };

    const toggleLike = () => {
        if (!auth.user) { auth.openAuthModal(); return; }
        const REQUEST_REACTS_KEY = 'request_reacts_v1';

        setIsLiked(prevLiked => {
            const nextLiked = !prevLiked;
            setLikesCount(c => {
                const newCount = nextLiked ? c + 1 : Math.max(0, c - 1);
                // If we are liking and a dislike was set, clear it
                if (nextLiked && isDisliked) {
                    setIsDisliked(false);
                }

                // persist to localStorage
                try {
                    const raw = localStorage.getItem(REQUEST_REACTS_KEY);
                    const map = raw ? JSON.parse(raw) : {};
                    map[request.id] = map[request.id] || {};
                    map[request.id].likesCount = newCount;
                    map[request.id].isLiked = nextLiked;
                    map[request.id].isDisliked = nextLiked && isDisliked ? false : (map[request.id].isDisliked || false);
                    localStorage.setItem(REQUEST_REACTS_KEY, JSON.stringify(map));
                } catch (e) { }

                return newCount;
            });

            setCurrentInfluence(c => nextLiked ? c + 1 : Math.max(0, c - 1));

            // If this is the user's first like (not previously shown), show the long-press hint bubble
            if (nextLiked) {
                try {
                    const seen = localStorage.getItem('heart_longpress_hint_shown');
                    if (!seen) {
                        try {
                            const btn = heartBtnRef.current;
                            const defaultTopOffset = 8; // place slightly above the button
                            if (btn && btn.getBoundingClientRect) {
                                const rect = btn.getBoundingClientRect();
                                // initial center X and top Y (above the button)
                                const initialCenterX = rect.left + rect.width / 2;
                                const initialTop = rect.top - defaultTopOffset;

                                // Render bubble first at the estimated center, then measure and clamp
                                setLongPressHintStyle({ left: initialCenterX, top: initialTop });
                                setShowLongPressHint(true);

                                // After render, measure the bubble width and clamp horizontally so it stays visible
                                setTimeout(() => {
                                    try {
                                        const el = document.querySelector('.hint-bubble');
                                        if (el && el.offsetWidth) {
                                            const bw = el.offsetWidth;
                                            const half = bw / 2;

                                            // Compute bounds: keep the bubble within viewport with a small margin
                                            const viewportMinCenter = half + 62;
                                            const viewportMaxCenter = window.innerWidth - half - 8;

                                            // Prefer to keep the bubble centered over the heart but clamp to viewport
                                            let clampedCenter = initialCenterX;
                                            if (clampedCenter < viewportMinCenter) clampedCenter = viewportMinCenter;
                                            if (clampedCenter > viewportMaxCenter) clampedCenter = viewportMaxCenter;

                                            // Also ensure top is not negative (stay inside viewport vertically)
                                            const adjustedTop = Math.max(8, initialTop);

                                            // Compute tail position relative to the left edge of the bubble
                                            // tailLeftFromLeft = initialCenterX - (clampedCenter - half)
                                            let tailLeftFromLeft = initialCenterX - clampedCenter + half;
                                            // Bias the tail towards the left so it visually points down-left at the heart
                                            const LEFT_BIAS = 18; // pixels to nudge the tail leftwards
                                            let biasedTail = tailLeftFromLeft - LEFT_BIAS;
                                            // Clamp tail so it doesn't sit too close to edges
                                            const minTail = 12;
                                            const maxTail = Math.max(12, bw - 12);
                                            const clampedTail = Math.max(minTail, Math.min(maxTail, biasedTail));

                                            // Use a dedicated tail class so we can style a left-edge pointing tail
                                            setLongPressHintStyle({ left: clampedCenter, top: adjustedTop, tailLeft: clampedTail, tailClass: 'hint-tail-left-edge' });
                                        }
                                    } catch (e) { }
                                }, 20);

                                // Hide only after a user gesture (onboarding-style) or long fallback timeout
                                (function setupHintDismissal() {
                                    let fallbackTimer = null;
                                    const dismissHint = () => {
                                        try { if (fallbackTimer) clearTimeout(fallbackTimer); } catch (e) { }
                                        try { document.removeEventListener('pointerdown', dismissHint, true); } catch (e) { }
                                        try { document.removeEventListener('touchstart', dismissHint, true); } catch (e) { }
                                        try { window.removeEventListener('keydown', keyHandler, true); } catch (e) { }
                                        try { localStorage.setItem('heart_longpress_hint_shown', '1'); } catch (e) { }
                                        setShowLongPressHint(false);
                                    };
                                    const keyHandler = (ev) => { if (ev.key === 'Escape') dismissHint(); };

                                    try {
                                        document.addEventListener('pointerdown', dismissHint, { once: true, capture: true });
                                        document.addEventListener('touchstart', dismissHint, { once: true, capture: true });
                                        window.addEventListener('keydown', keyHandler, { capture: true });
                                    } catch (e) { }

                                    // Safety fallback: auto-hide after 15s if user doesn't interact
                                    try { fallbackTimer = setTimeout(dismissHint, 15000); } catch (e) { }
                                })();
                            } else {
                                // fallback: place near center-top of viewport if button rect missing
                                const fallbackLeft = Math.max(48, window.innerWidth / 2);
                                setLongPressHintStyle({ left: fallbackLeft, top: 48 });
                                setShowLongPressHint(true);
                                setTimeout(() => setShowLongPressHint(false), 3800);
                            }
                        } catch (e) { }
                    }
                } catch (err) { }
            }

            return nextLiked;
        });
        // Persist reaction to backend so it survives across devices
        try {
            const token = (auth.user && auth.user.token) || localStorage.getItem('regaarder_token');
            const action = (!isLiked ? 'like' : 'unlike');
            fetch(`${getBackendBaseUrl()}/requests/react`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', ...(token ? { 'Authorization': `Bearer ${token}` } : {}) },
                body: JSON.stringify({ requestId: request.id, action })
            }).catch(() => { });
        } catch (e) { }
    };

    const handleOpenComments = () => {
        if (!auth.user) return auth.openAuthModal();
        setShowCommentsModal(true);
    };

    const handleCloseComments = () => {
        setShowCommentsModal(false);
    };

    const handleOpenSuggestions = () => {
        if (!auth.user) { auth.openAuthModal(); return; }
        setShowSuggestionsModal(true);
    };

    const handleCloseSuggestions = () => {
        setShowSuggestionsModal(false);
    };

    // NEW BOOSTS MODAL HANDLERS
    const handleOpenBoosts = () => {
        if (!auth.user) { auth.openAuthModal(); return; }
        setShowBoostsModal(true);
    };

    const handleCloseBoosts = () => {
        setShowBoostsModal(false);
    };

    // Claim Handlers
    const handleClaimClick = () => {
        if (isClaimed) return;
        if (!auth.user) { auth.openAuthModal(); return; }
        // Prevent users from claiming their own requests
        if (request.creator && request.creator.id && auth.user && auth.user.id && request.creator.id === auth.user.id) {
            setActionToast({ visible: true, message: 'You cannot claim your own request' });
            return;
        }
        setShowClaimModal(true);
    };

    const handleConfirmClaim = async () => {
        // Send claim to backend (requires auth token)
        const token = (auth.user && auth.user.token) || localStorage.getItem('regaarder_token');
        if (!token) {
            auth.openAuthModal();
            return;
        }

        try {
            const res = await fetch(`${getBackendBaseUrl()}/claim`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ requestId: request.id })
            });

            if (!res.ok) {
                const error = await res.json().catch(() => ({ error: 'Claim failed' }));
                
                // Check if it's a request value limit error
                if (error.requestValueLimitExceeded) {
                    setShowClaimModal(false);
                    setShowRequestValueLimitModal(true);
                    return;
                }
                
                // Check if it's a daily limit reached error
                if (res.status === 429 && error.dailyClaimLimitReached) {
                    setShowClaimModal(false);
                    setShowDailyLimitModal(true);
                    return;
                }
                
                throw new Error(error.error || 'Claim failed');
            }

            const body = await res.json();

            // Update local state
            setIsClaimed(true);
            setClaimedBy(body.claimedBy);
            setShowClaimModal(false);
            setShowToast(true);

            // Dispatch event with full request details for creator dashboard
            const claimData = {
                requestId: request.id,
                id: request.id, // Ensure ID is available in both formats
                title: request.title || 'Untitled Request',
                requesterName: request.company || (request.creator && request.creator.name) || 'Anonymous',
                requesterAvatar: resolveImageUrl(request.creator && (request.creator.image || request.creator.avatar) ? (request.creator.image || request.creator.avatar) : null) || null,
                funding: request.funding || 0,
                description: request.description || '',
                currentStep: 1,
                claimedBy: body.claimedBy,
                claimedAt: body.claimedAt || new Date().toISOString()
            };

            // Persist locally so dashboard picks it up on navigation
            const existingClaimsStr = localStorage.getItem('claimedRequests');
            let existingClaims = [];
            try {
                existingClaims = existingClaimsStr ? JSON.parse(existingClaimsStr) : [];
                if (!Array.isArray(existingClaims)) existingClaims = [];
            } catch (e) { existingClaims = []; }

            // Check if already exists to prevent duplicates
            const exists = existingClaims.some(c => c.id === claimData.id);
            if (!exists) {
                existingClaims.push(claimData);
                localStorage.setItem('claimedRequests', JSON.stringify(existingClaims));
            } else {
                // if exists, update it
                const idx = existingClaims.findIndex(c => c.id === claimData.id);
                if (idx !== -1) existingClaims[idx] = claimData;
                localStorage.setItem('claimedRequests', JSON.stringify(existingClaims));
            }

            window.dispatchEvent(new CustomEvent('request:claimed', {
                detail: claimData
            }));
        } catch (err) {
            console.error('Claim error:', err);
            // If unauthorized, prompt login
            if (err && err.message && err.message.toLowerCase().includes('unauthor')) {
                auth.openAuthModal();
                return;
            }
            setActionToast({ visible: true, message: err.message || 'Claim failed' });
            setShowClaimModal(false);
        }
    };


    const handleDoubleTap = (event) => {
        if (showCommentsModal || showSuggestionsModal || showBoostsModal) return;

        if (event.type === 'touchend') {
            const currentTime = new Date().getTime();
            const lastTapTime = lastTapRef.current;

            if (currentTime - lastTapTime < DOUBLE_TAP_DELAY) {
                if (!isLiked) {
                    toggleLike();
                    // trigger satisfying double-tap effect
                    if (doubleTapTimeoutRef.current) clearTimeout(doubleTapTimeoutRef.current);
                    setShowDoubleTapEffect(true);
                    doubleTapTimeoutRef.current = setTimeout(() => setShowDoubleTapEffect(false), 900);
                }
                lastTapRef.current = 0;
            } else {
                lastTapRef.current = currentTime;
            }
        }
    };

    const handleLikeOption = () => {
        toggleLike();
        setShowLikeOptions(false);
    };

    const handleBookmarkOption = () => {
        toggleBookmark();
        setShowLikeOptions(false);
    };

    const handleBoostOptionFromQuick = () => {
        setShowLikeOptions(false);
        setShowBoostsModal(true);
    };

    // New quick-option handlers: Dislike, Report, Share
    const handleDislikeOption = () => {
        if (!auth.user) { auth.openAuthModal(); return; }
        const REQUEST_REACTS_KEY = 'request_reacts_v1';
        setIsDisliked(prev => {
            const next = !prev;
            if (next) {
                // mark disliked: if previously liked, undo like
                setIsLiked(false);
                setLikesCount(c => Math.max(0, c - 1));
                setSwipeToast({ visible: true, message: 'Marked as disliked' });
            } else {
                setSwipeToast({ visible: true, message: 'Removed dislike' });
            }

            // persist to localStorage
            try {
                const raw = localStorage.getItem(REQUEST_REACTS_KEY);
                const map = raw ? JSON.parse(raw) : {};
                map[request.id] = map[request.id] || {};
                map[request.id].isDisliked = next;
                // ensure likesCount is present
                map[request.id].likesCount = map[request.id].likesCount || likesCount;
                map[request.id].isLiked = next ? false : (map[request.id].isLiked || false);
                localStorage.setItem(REQUEST_REACTS_KEY, JSON.stringify(map));
            } catch (e) { }

            return next;
        });
        // Persist dislike to backend
        try {
            const token = (auth.user && auth.user.token) || localStorage.getItem('regaarder_token');
            const action = (!isDisliked ? 'dislike' : 'undislike');
            fetch(`${getBackendBaseUrl()}/requests/react`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', ...(token ? { 'Authorization': `Bearer ${token}` } : {}) },
                body: JSON.stringify({ requestId: request.id, action })
            }).catch(() => { });
        } catch (e) { }
        // Keep the popover visible briefly so user sees the filled icon
        if (autoHideTimeoutRef.current) clearTimeout(autoHideTimeoutRef.current);
        autoHideTimeoutRef.current = setTimeout(() => setShowLikeOptions(false), 1400);
    };

    const handleReportOption = () => {
        // open a small report confirmation modal (mirrors home.jsx behavior)
        setShowReportModal(true);
    };

    const handleShareOption = () => {
        // open share modal/popover
        setShowShareModal(true);
    };

    const handlePinOption = () => {
        if (isPinned) {
            // ask for confirmation before unpinning
            setShowUnpinConfirm(true);
        } else {
            try { if (typeof onTogglePin === 'function') onTogglePin(); } catch (err) { }
            setShowLikeOptions(false);
        }
    };

    const [showUnpinConfirm, setShowUnpinConfirm] = useState(false);

    const handleCardPinClick = () => {
        if (isPinned) {
            setShowUnpinConfirm(true);
        } else {
            try { if (typeof onTogglePin === 'function') onTogglePin(); } catch (err) { }
        }
    };

    const confirmUnpin = () => {
        try { if (typeof onTogglePin === 'function') onTogglePin(); } catch (err) { }
        setShowUnpinConfirm(false);
        setShowLikeOptions(false);
    };

    const cancelUnpin = () => {
        setShowUnpinConfirm(false);
    };

    const confirmReport = () => {
        setShowReportModal(false);
        setShowLikeOptions(false);
        const reasonLabel = reportReason === 'other' ? (reportOtherText || 'Other') : reportReason;
        // In a real app, send `reasonLabel` and request.id to the backend here.
        setSwipeToast({ visible: true, message: `Reported — ${reasonLabel}` });
    };

    // Robust clipboard copy helper with fallback for older browsers
    const copyTextToClipboard = async (text) => {
        try {
            if (navigator && navigator.clipboard && navigator.clipboard.writeText) {
                await navigator.clipboard.writeText(text);
                return true;
            }
        } catch (err) {
            console.error('navigator.clipboard.writeText failed', err);
        }

        // Fallback using textarea + execCommand('copy')
        try {
            const ta = document.createElement('textarea');
            ta.value = text;
            // avoid scrolling to bottom
            ta.style.position = 'fixed';
            ta.style.left = '-9999px';
            ta.style.top = '0';
            document.body.appendChild(ta);
            ta.focus();
            ta.select();
            const ok = document.execCommand('copy');
            document.body.removeChild(ta);
            return !!ok;
        } catch (err) {
            console.error('fallback copy failed', err);
            return false;
        }
    };

    const confirmShareCopy = async () => {
        const shareUrl = `${WEB_URL}/share/request/${encodeURIComponent(request.id)}`;
        const shareText = `${request.title}\n${shareUrl}`;
        const ok = await copyTextToClipboard(shareText);
        if (ok) {
            setSwipeToast({ visible: true, message: 'Link copied to clipboard' });
        } else {
            setSwipeToast({ visible: true, message: 'Copy failed' });
        }
        setShowShareModal(false);
        setShowLikeOptions(false);
    };

    const confirmShareNative = async () => {
        const shareUrl = `${WEB_URL}/share/request/${encodeURIComponent(request.id)}`;
        try {
            if (navigator && navigator.share) {
                await navigator.share({ title: request.title, text: `${request.title}\n${shareUrl}`, url: shareUrl });
                setSwipeToast({ visible: true, message: 'Shared' });
                setShowShareModal(false);
                setShowLikeOptions(false);
                return;
            }
        } catch (err) {
            console.error('navigator.share failed', err);
        }
        // fallback to copy
        await confirmShareCopy();
    };

    // Long-press handlers for Heart quick options
    const startHeartPress = (e) => {
        longPressTriggeredRef.current = false;
        if (longPressTimeoutRef.current) clearTimeout(longPressTimeoutRef.current);
        const clientX = e.touches ? e.touches[0].clientX : e.clientX;
        const clientY = e.touches ? e.touches[0].clientY : e.clientY;
        longPressTimeoutRef.current = setTimeout(() => {
            longPressTriggeredRef.current = true;
            // compute fixed position for the options card near the heart button
            try {
                if (heartBtnRef.current) {
                    const rect = heartBtnRef.current.getBoundingClientRect();
                    const left = rect.left + (rect.width / 2);
                    const top = rect.top - 8;
                    setLikeOptionsStyle({ position: 'fixed', left: `${left}px`, top: `${top}px`, transform: 'translate(-50%, -100%)' });
                }
            } catch (err) { }
            setShowLikeOptions(true);
        }, 520); // ~520ms long press
    };

    const endHeartPress = () => {
        if (longPressTimeoutRef.current) {
            clearTimeout(longPressTimeoutRef.current);
            longPressTimeoutRef.current = null;
        }
    };

    useEffect(() => {
        if (!showLikeOptions) return;
        const onDocPointer = (ev) => {
            const target = ev.target;
            if (heartBtnRef.current && heartBtnRef.current.contains(target)) return;
            if (heartOptionsRef.current && heartOptionsRef.current.contains(target)) return;
            setShowLikeOptions(false);
        };
        window.addEventListener('pointerdown', onDocPointer);
        return () => window.removeEventListener('pointerdown', onDocPointer);
    }, [showLikeOptions]);

    // (Removed auto-activating bookmark when quick-options open)

    // Auto-hide management: keep quick-options visible for a few seconds by default
    useEffect(() => {
        if (!showLikeOptions) {
            if (autoHideTimeoutRef.current) {
                clearTimeout(autoHideTimeoutRef.current);
                autoHideTimeoutRef.current = null;
            }
            return;
        }
        // start auto-hide timer
        if (autoHideTimeoutRef.current) clearTimeout(autoHideTimeoutRef.current);
        autoHideTimeoutRef.current = setTimeout(() => setShowLikeOptions(false), 4000);
        return () => {
            if (autoHideTimeoutRef.current) {
                clearTimeout(autoHideTimeoutRef.current);
                autoHideTimeoutRef.current = null;
            }
        };
    }, [showLikeOptions]);

    // If card has been fully hidden, don't render
    if (!isVisible) return null;

    // Utility function to convert hex to rgba
    const hexToRgba = (hex, alpha = 1) => {
        if (!hex) return `rgba(0,0,0,${alpha})`;
        const h = hex.replace('#', '');
        const bigint = parseInt(h.length === 3 ? h.split('').map(c => c + c).join('') : h, 16);
        const r = (bigint >> 16) & 255;
        const g = (bigint >> 8) & 255;
        const b = bigint & 255;
        return `rgba(${r}, ${g}, ${b}, ${alpha})`;
    };

    // Determine border color based on boost status AND admin selection
    const accentColor = '#9333ea'; // Purple accent
    const isBoosted = (request.boosts || 0) >= 1;
    // Use state for admin selections (updated in real-time via storage listener)
    const isAdminSelected = adminSelections[request.id] || false;
    const useAccentBorder = isBoosted || isAdminSelected;
    const borderColor = useAccentBorder ? accentColor : '#d1d5db'; // Lighter grey outline by default, purple if boosted or selected
    const borderWidth = useAccentBorder ? '2px' : '1px'; // Thicker border when boosted or selected
    const backgroundColor = useAccentBorder ? hexToRgba(accentColor, 0.05) : '#ffffff'; // Light purple tint if boosted or selected

    const claimButtonStyle = {
        position: 'absolute',
        top: '50%',
        right: '-12px',
        transform: 'translateY(-50%) rotate(-90deg)',
        transformOrigin: '50% 50%',

        backgroundColor: isClaimed ? '#d1d5db' : lightGreyBg, // Grey if claimed
        color: isClaimed ? '#6b7280' : '#6b7280', // Grey text if claimed
        fontSize: '11px',
        fontWeight: 'bold',
        padding: '5px 12px',
        borderRadius: '6px',
        letterSpacing: '0.5px',
        boxShadow: isClaimed ? '0 2px 6px rgba(107, 114, 128, 0.2)' : 'none', // Light grey shadow if claimed
        border: 'none',
        whiteSpace: 'nowrap',
        cursor: isClaimed ? 'default' : 'pointer',
        height: 'auto',
        lineHeight: '1',
        zIndex: 10,
        transition: 'all 0.3s ease', // Smooth transition
    };

    const nubilousBackgroundStyle = {
        background: `radial-gradient(circle at 100% 0%, ${lightGreyBg} 0%, rgba(243, 244, 246, 0.8) 70%, transparent 100%)`, // decorative gradient
        zIndex: 0,
        pointerEvents: 'none'
    };

    const fundingBadgeStyle = {
        backgroundColor: goldColor,
        color: 'white',
        fontWeight: 'bold',
        padding: '4px 10px',
        borderRadius: '0 10px 0 10px',
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
        fontSize: '14px',
        zIndex: 5,
    };

    const trendingBadgeStyle = {
        backgroundColor: lightGreyBg, // UPDATED
        color: goldColor,
        fontWeight: '600',
        padding: '3px 10px',
        borderRadius: '20px', // Pill shape for pro look
        fontSize: '12px',
        display: 'inline-flex',
        alignItems: 'center',
        zIndex: 5,
    };

    const q = (searchQuery || '').trim();
    const escapeRegExp = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const highlight = (text) => {
        if (!q) return text;
        const regex = new RegExp(`(${escapeRegExp(q)})`, 'ig');
        const parts = text.split(regex);
        return parts.map((part, i) =>
            i % 2 === 1
                ? <mark key={i} className="bg-[var(--color-gold-cream)] text-gray-900 rounded px-0.5">{part}</mark>
                : part
        );
    };

    // Compute hover/active colors for Heart & Bookmark
    const heartFill = isLiked
        ? (isHeartActive ? 'var(--color-like-active)' : (isHeartHover ? 'var(--color-like-hover)' : 'var(--color-like)'))
        : (isHeartHover ? 'rgba(107, 114, 128, 0.3)' : 'none');

    const heartStroke = isLiked
        ? (isHeartActive ? 'var(--color-like-active)' : (isHeartHover ? 'var(--color-like-hover)' : 'var(--color-like)'))
        : (isHeartActive ? '#6B7280' : (isHeartHover ? '#6B7280' : '#6B7280'));

    // Bookmark visuals: no circular accent; icon fills grey when bookmarked
    const bookmarkFill = isBookmarked ? '#6B7280' : 'none'; // gray-500 when active

    const bookmarkStroke = isBookmarked
        ? '#6B7280'
        : (isBookmarkActive ? 'var(--color-gold)' : (isBookmarkHover ? 'var(--color-gold-light)' : 'currentColor'));

    const bookmarkBoxShadow = (isBookmarkActive || isBookmarkHover)
        ? '0 8px 22px rgba(2,6,23,0.06)'
        : '0 6px 18px rgba(2,6,23,0.07)';

    // Compute swipe transform values for smoother animation (moved out of JSX)
    const rotate = swipeOffset / 20; // subtle rotate
    const skew = swipeOffset < 0 ? Math.min(8, -swipeOffset / 18) : Math.min(2, swipeOffset / 80);
    const absOffset = Math.min(200, Math.abs(swipeOffset));
    const scale = isRemoving ? 0.95 : 1 - Math.min(0.04, absOffset / 200);
    const transformStyle = isRemoving
        ? `perspective(800px) translateX(-140%) rotate(-20deg) skewY(-18deg) rotateX(12deg) scale(${0.86})`
        : `translateX(${swipeOffset}px) rotate(${rotate}deg) skewY(${skew}deg) scale(${scale})`;

    const transitionStyle = isDragging
        ? 'none'
        : isRemoving
            ? 'transform 420ms cubic-bezier(.2,.8,.2,1), opacity 360ms ease'
            : 'transform 300ms cubic-bezier(.22,.9,.35,1)';

    return (
        <>
            <div id={`request-card-${request.id}`} className="relative mb-6 overflow-visible">
                {/* Reveal layers for swipe actions (stay behind the surface) */}
                <div className="absolute inset-0 flex items-center justify-end px-4 z-0 pointer-events-none">
                    <div className="flex items-center text-gray-500 pr-3" style={{ opacity: swipeOffset < 0 ? Math.min(1, -swipeOffset / 160) : 0 }}>
                        <X className="w-6 h-6 mr-2" />
                        <span className="text-sm font-semibold">Hide</span>
                    </div>
                </div>

                {/* Card surface moves as a single element (includes border + shadow) */}
                <div
                    className={`p-5 pb-4 pr-12 rounded-3xl relative z-10 ${pulseActive ? 'pinned-pulse' : ''} ${isFocused ? 'ring-2 ring-yellow-400 ring-offset-2 ring-offset-gray-50' : ''}`}
                    style={{
                        backgroundColor: backgroundColor,
                        border: `${borderWidth} solid ${borderColor}`,
                        boxShadow: '0 10px 30px rgba(2,6,23,0.07), 0 -4px 12px rgba(2,6,23,0.03)',
                        transform: transformStyle,
                        opacity: isRemoving ? 0 : 1,
                        transition: transitionStyle,
                        touchAction: 'pan-y',
                        willChange: 'transform, opacity',
                        transformOrigin: '50% 50%'
                    }}
                    onTouchStart={onTouchStart}
                    onTouchMove={onTouchMove}
                    onTouchEnd={(e) => { onTouchEnd(e); handleDoubleTap(e); }}
                    onMouseDown={onMouseDown}
                    onContextMenu={(e) => { e.preventDefault(); handleCardShareNative(); }}
                >


                    {/* Double-tap like visual effect (center burst) */}
                    <style>{`
                    @keyframes dt-heart-pop {
                        0% { transform: translate(-50%, -50%) scale(0.6); opacity: 0.0; filter: drop-shadow(0 2px 6px rgba(0,0,0,0.08)); }
                        30% { transform: translate(-50%, -50%) scale(1.6); opacity: 1; }
                        60% { transform: translate(-50%, -50%) scale(1.2); opacity: 0.9; }
                        100% { transform: translate(-50%, -50%) scale(0.8); opacity: 0; }
                    }
                    @keyframes dt-star {
                        0% { transform: translate(-50%, -50%) scale(0.2) translateY(0); opacity: 1; }
                        60% { transform: translate(-50%, -50%) scale(1.05) translateY(-36px); opacity: 1; }
                        100% { transform: translate(-50%, -50%) scale(1) translateY(-56px); opacity: 0; }
                    }
                    .dt-overlay { position: absolute; left: 50%; top: 50%; transform: translate(-50%, -50%); pointer-events: none; z-index: 30; }
                    .dt-heart { width: 84px; height: 84px; color: var(--color-like); transform-origin: center center; animation: dt-heart-pop 900ms cubic-bezier(.2,.9,.25,1) forwards; }
                    .dt-burst { position: absolute; left: 50%; top: 50%; transform: translate(-50%, -50%); width: 120px; height: 120px; }
                    .dt-star { position: absolute; left: 50%; top: 50%; display: block; width: 12px; height: 12px; color: #FFD86B; }
                    .dt-star:nth-child(1) { transform: translate(-50%, -50%); animation: dt-star 820ms ease-out 0ms forwards; }
                    .dt-star:nth-child(2) { transform: translate(-50%, -50%); animation: dt-star 820ms ease-out 40ms forwards; transform-origin: 50% 50%; }
                    .dt-star:nth-child(3) { transform: translate(-50%, -50%); animation: dt-star 820ms ease-out 80ms forwards; }
                    .dt-star:nth-child(4) { transform: translate(-50%, -50%); animation: dt-star 820ms ease-out 120ms forwards; }
                    .dt-star:nth-child(5) { transform: translate(-50%, -50%); animation: dt-star 820ms ease-out 160ms forwards; }
                    .dt-star svg { width: 100%; height: 100%; }
                `}</style>

                    {showDoubleTapEffect && (
                        <div className="dt-overlay">
                            <div style={{ position: 'relative', width: 0, height: 0 }}>
                                <div className="dt-burst" aria-hidden>
                                    <span className="dt-star" style={{ transform: 'translate(-20px,-10px)' }}>
                                        <svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2l1.9 4.1L18 8l-4 2.9L14 15l-2-1.3L10 15l.9-4.1L8 8l4.1-1.9L12 2z" /></svg>
                                    </span>
                                    <span className="dt-star" style={{ transform: 'translate(12px,-6px)' }}>
                                        <svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2l1.9 4.1L18 8l-4 2.9L14 15l-2-1.3L10 15l.9-4.1L8 8l4.1-1.9L12 2z" /></svg>
                                    </span>
                                    <span className="dt-star" style={{ transform: 'translate(26px,8px)' }}>
                                        <svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2l1.9 4.1L18 8l-4 2.9L14 15l-2-1.3L10 15l.9-4.1L8 8l4.1-1.9L12 2z" /></svg>
                                    </span>
                                    <span className="dt-star" style={{ transform: 'translate(-26px,6px)' }}>
                                        <svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2l1.9 4.1L18 8l-4 2.9L14 15l-2-1.3L10 15l.9-4.1L8 8l4.1-1.9L12 2z" /></svg>
                                    </span>
                                    <span className="dt-star" style={{ transform: 'translate(0px,26px)' }}>
                                        <svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2l1.9 4.1L18 8l-4 2.9L14 15l-2-1.3L10 15l.9-4.1L8 8l4.1-1.9L12 2z" /></svg>
                                    </span>
                                </div>
                                <div style={{ position: 'absolute', left: '50%', top: '50%', transform: 'translate(-50%,-50%)' }}>
                                    <Heart className="dt-heart" />
                                </div>
                            </div>
                        </div>
                    )}
                    {/* Long-press hint bubble anchored to the Heart button (one-time after first like) — rendered in a portal so it sits above transforms */}
                    {showLongPressHint && typeof document !== 'undefined' && createPortal(
                        <div
                            className="hint-bubble"
                            style={{
                                position: 'fixed',
                                left: longPressHintStyle.left,
                                top: longPressHintStyle.top,
                                transform: 'translate(-50%, -120%)',
                                zIndex: 9999,
                                pointerEvents: 'none'
                            }}
                        >
                            <div style={{ position: 'relative', display: 'inline-block' }}>
                                <div className="hint-inner" role="status" aria-live="polite">
                                    <MessageSquare className="w-5 h-5" style={{ color: '#fff', flexShrink: 0 }} />
                                    <div className="hint-text">Long-press the heart to access more options.</div>
                                </div>
                                {/* Tail: position is set dynamically so the tip aligns with the target (can be left-edge or bottom) */}
                                <div
                                    className={longPressHintStyle && longPressHintStyle.tailClass ? longPressHintStyle.tailClass : 'hint-tail'}
                                    style={
                                        longPressHintStyle && longPressHintStyle.tailClass && longPressHintStyle.tailClass.indexOf('left-edge') !== -1
                                            ? { top: '50%', left: '-12px', transform: 'translateY(-50%)' }
                                            : { left: longPressHintStyle && longPressHintStyle.tailLeft ? `${longPressHintStyle.tailLeft}px` : '50%' }
                                    }
                                />
                            </div>
                        </div>,
                        document.body
                    )}
                    {/* 1. Nubilous Gradient Background (responsive sizes) */}
                    <div className="absolute top-0 right-0 w-40 sm:w-44 md:w-48 h-40 sm:h-44 md:h-48 rounded-tr-xl overflow-hidden pointer-events-none" style={nubilousBackgroundStyle} aria-hidden="true" />

                    {/* 2. CLAIM Button (Vertical Tab on the side) - only for authenticated users who are not the creator */}
                    {auth.user && !(request.creator && request.creator.id && auth.user.id && request.creator.id === auth.user.id) && (
                        <button
                            onTouchStart={(e) => e.stopPropagation()}
                            onTouchEnd={(e) => e.stopPropagation()}
                            onMouseDown={(e) => e.stopPropagation()}
                            onClick={handleClaimClick}
                            style={claimButtonStyle}
                            className="focus:outline-none hover:text-gray-900 transition duration-150"
                            disabled={isClaimed}
                            title={isClaimed && claimedBy ? `Claimed by ${claimedBy.name}` : 'Claim this request'}
                            aria-label={isClaimed && claimedBy ? `Claimed by ${claimedBy.name}` : 'Claim this request'}
                        >
                            {isClaimed ? '✓ Claimed' : 'CLAIM'}
                        </button>
                    )}

                    {/* 3. Absolutely Positioned Badges */}
                    <div
                        onTouchStart={(e) => e.stopPropagation()}
                        onTouchEnd={(e) => e.stopPropagation()}
                        onMouseDown={(e) => e.stopPropagation()}
                        className="absolute top-4 right-4 flex flex-col items-end space-y-1 z-10"
                    >
                        {request.isTrending && (
                            <div style={trendingBadgeStyle}>
                                <TrendingUp className="w-4 h-4 mr-1" style={{ color: goldColor }} />
                                {getTranslation('Trending', selectedLanguage)}
                            </div>
                        )}
                        {isBoosted && (
                            <div style={{
                                backgroundColor: accentColor,
                                color: 'white',
                                fontWeight: '600',
                                padding: '3px 10px',
                                borderRadius: '20px',
                                fontSize: '12px',
                                display: 'inline-flex',
                                alignItems: 'center',
                                zIndex: 5,
                                marginLeft: '6px'
                            }}>
                                <Megaphone className="w-4 h-4 mr-1" />
                                {getTranslation('Boosted', selectedLanguage)}
                            </div>
                        )}
                        {isAdminSelected && !isBoosted && (
                            <div style={{
                                backgroundColor: accentColor,
                                color: 'white',
                                fontWeight: '600',
                                padding: '3px 10px',
                                borderRadius: '20px',
                                fontSize: '12px',
                                display: 'inline-flex',
                                alignItems: 'center',
                                zIndex: 5,
                                marginLeft: '6px'
                            }}>
                                <Crown className="w-4 h-4 mr-1" />
                                Admin Selected
                            </div>
                        )}
                        <div style={fundingBadgeStyle}>
                            ${Number(request.funding || 0).toFixed(2)}
                        </div>
                        {/* Pin indicator: only show when the request is pinned (pin is toggled via quick-options) */}
                        {/* pinned indicator intentionally moved below to sit above the rank badge */}
                    </div>

                    {/* RANK Badge (NEW) */}
                    <div className="absolute top-4 left-4 z-10">
                        <div className="bg-gray-800 text-white text-xs font-bold px-3 py-1 rounded-full">
                            RANK #{detailedRank.rank}
                        </div>
                    </div>

                    {/* Pin indicator: positioned above the rank badge, half outside the card */}
                    {isPinned && (
                        <button
                            onClick={handleCardPinClick}
                            aria-label={isPinned ? 'Unpin request' : 'Pin request'}
                            className="absolute z-20 focus:outline-none"
                            style={{
                                top: '2px',
                                left: '44px',
                                transform: 'translateY(-50%)',
                                background: 'transparent',
                                padding: 4,
                                border: 'none'
                            }}
                        >
                            <Pin className="w-5 h-5" style={{ fill: 'var(--color-gold)', stroke: '#6b7280' }} />
                        </button>
                    )}


                    {/* Top Row: Company Info */}
                    <div className="flex items-start mb-4 relative z-10 pt-10">
                        <div className="flex items-center">
                            <button
                                className="w-10 h-10 rounded-full overflow-hidden mr-3 flex-shrink-0 relative cursor-pointer focus:outline-none focus:ring-2 focus:ring-offset-2 transition-all"
                                style={{ focusRingColor: 'var(--color-gold)' }}
                                onClick={(e) => {
                                    e.stopPropagation();
                                    if (onOpenProfile && requesterName && requesterName !== 'Anonymous' && requesterName !== 'Community') {
                                        onOpenProfile(requesterName, true, {
                                            id: requesterId,
                                            avatar: requesterAvatar,
                                            bio: (request.creator && request.creator.bio) || 'Creating engaging content',
                                            stats: {
                                                videos: (request.creator && request.creator.videosCount) || 0,
                                                requests: (request.creator && request.creator.requestsCompleted) || 0,
                                                followers: (request.creator && (request.creator.followers || request.creator.followerCount)) || 0,
                                                following: (request.creator && request.creator.following) || 0
                                            },
                                            verified: (request.creator && request.creator.verified) || false,
                                            joinedDate: (request.creator && request.creator.joinedYear) || new Date().getFullYear()
                                        });
                                    }
                                }}
                            >

                                {/* Image with onError for fallback */}
                                <img
                                    src={requesterAvatar}
                                    alt={`${requesterName} profile`}
                                    className={`w-full h-full object-cover absolute inset-0 z-10 transition-opacity duration-300 ${showFallback ? 'opacity-0' : 'opacity-100'}`}
                                    onError={handleImageError}
                                    onLoad={() => setShowFallback(false)}
                                />

                                {/* Fallback Initial */}
                                {(() => {
                                    const avatarInitial = requesterName ? String(requesterName).charAt(0).toUpperCase() : 'U';
                                    const colorClasses = ['bg-gray-400', 'bg-blue-600', 'bg-indigo-600', 'bg-green-600', 'bg-red-600', 'bg-yellow-500', 'bg-pink-600'];
                                    const seed = String(request.id || '').split('').reduce((s, ch) => s + ch.charCodeAt(0), 0);
                                    const colorClass = request.companyColor || colorClasses[seed % colorClasses.length];
                                    return (
                                        <div
                                            className={`w-10 h-10 rounded-full flex items-center justify-center text-white text-xl font-bold ${colorClass}`}
                                            style={{
                                                opacity: showFallback ? 1 : 0,
                                                transition: 'opacity 0.3s',
                                                position: 'absolute',
                                                inset: 0
                                            }}
                                        >
                                            {avatarInitial}
                                        </div>
                                    );
                                })()}
                            </button>

                            <div>
                                <p className="text-sm font-medium text-gray-900">{requesterName}</p>
                                <p className="text-xs text-gray-500">{request.timeAgo}</p>
                            </div>
                        </div>
                    </div>

                    {/* Request Title and Description */}
                    <h2 className="text-lg font-medium text-gray-900 mb-2 leading-tight">
                        {highlight(request.title)}
                    </h2>
                    <p className="text-[15px] leading-relaxed text-gray-600 mb-4">
                        {highlight(displayedDescriptionRaw)}
                    </p>

                    {/* "See more" / "See less" and "Sponsored" */}
                    <div className="flex justify-between items-center mb-4">
                        {needsTruncation && (
                            <button
                                onTouchStart={(e) => e.stopPropagation()}
                                onTouchEnd={(e) => e.stopPropagation()}
                                onMouseDown={(e) => e.stopPropagation()}
                                onClick={toggleExpansion}
                                className="flex items-center text-sm font-semibold text-gray-600 hover:text-gray-900 transition-colors"
                            >
                                {isExpanded ? getTranslation('See less', selectedLanguage) : getTranslation('See more...', selectedLanguage)}
                                {isExpanded ? <ChevronUp className="w-4 h-4 ml-1" /> : <ChevronDown className="w-4 h-4 ml-1" />}
                            </button>
                        )}

                        {request.isSponsored && (
                            <span className="text-xs text-gray-500 font-medium">Sponsored</span>
                        )}
                    </div>

                    {/* Footer Metrics and Actions */}
                    <div className="border-t border-gray-100 pt-3 flex justify-between items-center">

                        {/* Metrics Group (Likes, Comments, Boosts) */}
                        <div className="flex space-x-4 text-gray-600">
                            <button
                                ref={heartBtnRef}
                                onTouchStart={(e) => { e.stopPropagation(); setIsHeartActive(true); startHeartPress(e); }}
                                onTouchEnd={(e) => { endHeartPress(); setIsHeartActive(false); e.stopPropagation(); if (longPressTriggeredRef.current) { longPressTriggeredRef.current = false; return; } }}
                                onMouseDown={(e) => { e.stopPropagation(); setIsHeartActive(true); startHeartPress(e); }}
                                onMouseUp={(e) => { endHeartPress(); setIsHeartActive(false); }}
                                onMouseEnter={() => setIsHeartHover(true)}
                                onMouseLeave={() => { setIsHeartHover(false); setIsHeartActive(false); endHeartPress(); }}
                                onClick={(e) => { if (longPressTriggeredRef.current) { longPressTriggeredRef.current = false; return; } toggleLike(); }}
                                className={`flex items-center space-x-1 p-0 transition-colors transform-gpu hover:scale-105 active:scale-95 ${isLiked ? 'text-gray-700' : 'text-gray-500'} focus:outline-none`}
                            >
                                <Heart
                                    className={`w-5 h-5 transition-colors`}
                                    style={{
                                        strokeWidth: 2,
                                        fill: heartFill,
                                        stroke: heartStroke,
                                        transition: 'transform .12s ease, fill .12s ease, stroke .12s ease'
                                    }}
                                />
                                <span className="text-xs font-medium">{likesCount}</span>
                            </button>

                            <button
                                onClick={handleOpenComments}
                                onTouchStart={(e) => e.stopPropagation()}
                                onTouchEnd={(e) => e.stopPropagation()}
                                onMouseDown={(e) => e.stopPropagation()}
                                className="flex items-center space-x-1 p-0 transition-colors text-gray-500 hover:text-gray-700 focus:outline-none"
                            >
                                <MessageSquare className="w-5 h-5" />
                                <span className="text-xs font-medium">{request.comments}</span>
                            </button>

                            {/* Boosts Button - Now opens the Boosts Modal */}
                            <button
                                onClick={handleOpenBoosts}
                                onTouchStart={(e) => e.stopPropagation()}
                                onTouchEnd={(e) => e.stopPropagation()}
                                onMouseDown={(e) => e.stopPropagation()}
                                className="flex items-center space-x-1 p-0 transition-colors text-gray-500 hover:text-gray-700 focus:outline-none"
                            >
                                <ChevronsUp className="w-5 h-5" />
                                <span className="text-xs font-medium">{request.boosts} {getTranslation('Boosts', selectedLanguage)}</span>
                            </button>
                        </div>

                        {/* Action Icons Group (Edit, Bookmark, Lightbulb) */}
                        <div className="flex space-x-2" style={{ marginRight: '-28px' }}>
                            {/* Edit button: only the request creator can edit and only if not claimed */}
                            {auth.user && request.createdBy && String(auth.user.id) === String(request.createdBy) && !isClaimed && (
                                <button
                                    onClick={(e) => { e.stopPropagation(); setShowEditModal(true); }}
                                    className="flex items-center justify-center p-2.5 h-9 w-9 rounded-full bg-white hover:bg-gray-100 transition-colors ring-1 ring-gray-200 hover:shadow-md text-gray-600"
                                    title="Edit request"
                                    aria-label="Edit request"
                                >
                                    <Pencil className="w-5 h-5" />
                                </button>
                            )}

                            <button
                                onTouchEnd={(e) => { e.stopPropagation(); setIsBookmarkActive(false); }}
                                onTouchStart={() => setIsBookmarkActive(true)}
                                onMouseEnter={() => setIsBookmarkHover(true)}
                                onMouseLeave={() => { setIsBookmarkHover(false); setIsBookmarkActive(false); }}
                                onMouseDown={() => setIsBookmarkActive(true)}
                                onMouseUp={() => setIsBookmarkActive(false)}
                                onFocus={() => setIsBookmarkHover(true)}
                                onBlur={() => { setIsBookmarkHover(false); setIsBookmarkActive(false); }}
                                onClick={toggleBookmark}
                                className={`flex items-center justify-center p-2.5 h-9 w-9 rounded-full transition-transform transform-gpu hover:scale-105 active:scale-95 focus:outline-none ring-1 ring-gray-200`}
                                style={{ boxShadow: bookmarkBoxShadow }}
                            >
                                <Bookmark
                                    className={`w-5 h-5 transition-colors`}
                                    style={{
                                        strokeWidth: 2,
                                        fill: bookmarkFill,
                                        stroke: bookmarkStroke,
                                        transition: 'transform .12s ease, fill .12s ease, stroke .12s ease'
                                    }}
                                />
                            </button>

                            {/* Lightbulb Button - Now opens the Suggestions Modal with accent color styling */}
                            <button
                                onClick={handleOpenSuggestions}
                                onTouchStart={(e) => e.stopPropagation()}
                                onTouchEnd={(e) => e.stopPropagation()}
                                onMouseDown={(e) => e.stopPropagation()}
                                className="flex items-center justify-center p-2.5 h-10 w-10 rounded-full transition-colors focus:outline-none"
                                style={{
                                    backgroundColor: auth?.user?.accentColor ? `${auth.user.accentColor}20` : 'rgba(147, 51, 234, 0.12)', // 12% opacity using hex alpha approximation (20 for ~12%) or fallback
                                    color: auth?.user?.accentColor || '#9333ea'
                                }}
                            >
                                <Lightbulb className="w-5 h-5" />
                            </button>

                            {/* Edit Modal (per-card) */}
                            {showEditModal && createPortal(
                                <div className="fixed inset-0 z-[80] flex items-center justify-center p-4">
                                    <div className="absolute inset-0 bg-black/40" onClick={() => setShowEditModal(false)} />
                                    <div className="bg-white rounded-2xl shadow-2xl p-6 relative z-10 w-full max-w-lg">
                                        <h3 className="text-lg font-bold mb-2">Edit request</h3>
                                        <p className="text-sm text-gray-600 mb-4">Update your request details. Changes are visible to everyone.</p>

                                        <div className="space-y-4">
                                            <div>
                                                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Title</label>
                                                <input value={editTitle} onChange={(e) => setEditTitle(e.target.value)} className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition-shadow" placeholder="Request title" />
                                            </div>
                                            
                                            <div>
                                                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Description</label>
                                                <textarea value={editDescription} onChange={(e) => setEditDescription(e.target.value)} className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition-shadow" rows={4} placeholder="Describe what you want..." />
                                            </div>
                                            
                                            <div className="grid grid-cols-2 gap-5">
                                                <div>
                                                    <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Duration</label>
                                                    <div className="relative">
                                                        <button 
                                                            onClick={() => setShowLengthDropdown(!showLengthDropdown)}
                                                            className="w-full text-left bg-gradient-to-br from-gray-50 to-gray-100 border-2 border-gray-200 text-gray-700 py-3 px-4 rounded-2xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all font-semibold cursor-pointer text-[15px] hover:border-purple-300 hover:from-purple-50 flex items-center justify-between"
                                                        >
                                                            <span>{editLength || 'Any duration'}</span>
                                                            <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${showLengthDropdown ? 'rotate-180' : ''}`} />
                                                        </button>
                                                        {showLengthDropdown && (
                                                            <div className="absolute top-full left-0 right-0 mt-2 bg-white border-2 border-gray-200 rounded-2xl shadow-xl z-50">
                                                                {[
                                                                    { value: '', label: 'Any duration' },
                                                                    { value: 'Short (< 2 min)', label: 'Short (< 2 min)' },
                                                                    { value: 'Medium (2-5 min)', label: 'Medium (2-5 min)' },
                                                                    { value: 'Long (5+ min)', label: 'Long (5+ min)' }
                                                                ].map((opt) => (
                                                                    <button
                                                                        key={opt.value}
                                                                        onClick={() => { setEditLength(opt.value); setShowLengthDropdown(false); }}
                                                                        className={`w-full text-left px-4 py-3 font-medium transition-colors ${editLength === opt.value ? 'bg-purple-100 text-purple-700' : 'text-gray-700 hover:bg-gray-50'}`}
                                                                    >
                                                                        {opt.label}
                                                                    </button>
                                                                ))}
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                                <div>
                                                    <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Format</label>
                                                    <div className="relative">
                                                        <button 
                                                            onClick={() => setShowFormatDropdown(!showFormatDropdown)}
                                                            className="w-full text-left bg-gradient-to-br from-gray-50 to-gray-100 border-2 border-gray-200 text-gray-700 py-3 px-4 rounded-2xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all font-semibold cursor-pointer text-[15px] hover:border-purple-300 hover:from-purple-50 flex items-center justify-between"
                                                        >
                                                            <span>{editFormat === 'one-time' ? 'One-Time' : editFormat === 'series' ? 'Series' : editFormat === 'recurrent' ? 'Recurrent' : editFormat === 'catalogue' ? 'Catalogue' : 'One-Time'}</span>
                                                            <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${showFormatDropdown ? 'rotate-180' : ''}`} />
                                                        </button>
                                                        {showFormatDropdown && (
                                                            <div className="absolute top-full left-0 right-0 mt-2 bg-white border-2 border-gray-200 rounded-2xl shadow-xl z-50">
                                                                {[
                                                                    { value: 'one-time', label: 'One-Time' },
                                                                    { value: 'recurrent', label: 'Recurrent' },
                                                                    { value: 'series', label: 'Series' },
                                                                    { value: 'catalogue', label: 'Catalogue' }
                                                                ].map((opt) => (
                                                                    <button
                                                                        key={opt.value}
                                                                        onClick={() => { setEditFormat(opt.value); setShowFormatDropdown(false); }}
                                                                        className={`w-full text-left px-4 py-3 font-medium transition-colors ${editFormat === opt.value ? 'bg-purple-100 text-purple-700' : 'text-gray-700 hover:bg-gray-50'}`}
                                                                    >
                                                                        {opt.label}
                                                                    </button>
                                                                ))}
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="flex justify-between items-center mt-8 pt-5 border-t border-gray-100">
                                            <button 
                                                onClick={async () => {
                                                    setShowDeleteConfirm(true);
                                                }}
                                                className="inline-flex items-center justify-center w-10 h-10 rounded-lg text-red-600 hover:bg-red-50 transition-colors"
                                                title="Delete Request"
                                            >
                                                <Trash2 size={18} />
                                            </button>

                                            <div className="flex space-x-3">
                                                <button onClick={() => setShowEditModal(false)} className="px-6 py-2.5 rounded-full bg-gray-100 font-semibold text-gray-600 hover:bg-gray-200 transition-colors text-[15px]">Cancel</button>
                                                <button
                                                    onClick={async () => {
                                                        const token = localStorage.getItem('regaarder_token');
                                                        const BACKEND = getBackendBaseUrl();
                                                        try {
                                                            const meta = { 
                                                                ...(request.meta || {}), 
                                                                selectedVideoLength: editLength, 
                                                                selectedFormat: editFormat,
                                                                selectedPrivacy: editPrivacy 
                                                            };
                                                            
                                                            const res = await fetch(`${BACKEND}/requests/${request.id}`, {
                                                                method: 'PUT',
                                                                headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
                                                                body: JSON.stringify({ title: editTitle, description: editDescription, meta })
                                                            });
                                                            if (!res.ok) {
                                                                const err = await res.json().catch(() => ({ error: 'Update failed' }));
                                                                throw new Error(err.error || 'Update failed');
                                                            }
                                                            const body = await res.json();
                                                            try { window.dispatchEvent(new CustomEvent('request:updated', { detail: { request: body.request } })); } catch (e) { }
                                                            setShowEditModal(false);
                                                            setActionToast({ visible: true, message: 'Request updated' });
                                                        } catch (err) {
                                                            console.error('Update failed', err);
                                                            setActionToast({ visible: true, message: err.message || 'Update failed' });
                                                        }
                                                    }}
                                                    className="px-7 py-2.5 rounded-full font-semibold shadow-lg shadow-purple-200 hover:shadow-purple-300 transition-all text-[15px] transform active:scale-95" 
                                                    style={{ backgroundColor: 'var(--color-gold)', color: '#fff' }}
                                                >
                                                    Save
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </div>,
                                document.body
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Modals are positioned outside the card but within the App's context */}
            <CommentsModal
                isOpen={showCommentsModal}
                onClose={handleCloseComments}
                requestId={request.id}
                selectedLanguage={selectedLanguage}
            />

            <CreativeSuggestionsModal
                isOpen={showSuggestionsModal}
                onClose={handleCloseSuggestions}
                requestId={request.id}
                selectedLanguage={selectedLanguage}
            />

            <BoostsModal
                isOpen={showBoostsModal}
                onClose={handleCloseBoosts}
                requestId={request.id}
                detailedRank={{ ...detailedRank, totalInfluence: currentInfluence }} // Pass current influence state
                onGiveLikeFree={() => { toggleLike(); setActionToast({ visible: true, message: 'You gave a like — thanks!' }); }}
                selectedLanguage={selectedLanguage}
            />

            <ClaimConfirmationModal
                isOpen={showClaimModal}
                onClose={() => setShowClaimModal(false)}
                onConfirm={handleConfirmClaim}
                selectedLanguage={selectedLanguage}
            />

            <DailyLimitModal
                isOpen={showDailyLimitModal}
                onClose={() => setShowDailyLimitModal(false)}
                onUpgrade={() => {
                    setShowDailyLimitModal(false);
                    // Navigate to upgrade page or show upgrade modal
                    window.location.href = '/sponsorship';
                }}
                onClaimFree={() => {
                    setShowDailyLimitModal(false);
                    // Allow claiming a free request instead
                    // This would require filtering free requests or modifying the claim flow
                }}
                selectedLanguage={selectedLanguage}
            />

            <RequestValueLimitModal
                isOpen={showRequestValueLimitModal}
                onClose={() => setShowRequestValueLimitModal(false)}
                onUpgrade={() => {
                    setShowRequestValueLimitModal(false);
                    // Navigate to upgrade page or show upgrade modal
                    window.location.href = '/sponsorship';
                }}
                onViewLowerValue={() => {
                    setShowRequestValueLimitModal(false);
                    // Could filter to show requests under $150
                    // For now just close the modal
                }}
                selectedLanguage={selectedLanguage}
            />

            {/* Delete Confirmation Modal */}
            {showDeleteConfirm && (
                <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
                    <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full p-8 animate-in fade-in scale-in">
                        <div className="flex items-center justify-center w-12 h-12 mx-auto rounded-full bg-red-100 mb-6">
                            <Trash2 className="w-6 h-6 text-red-600" />
                        </div>
                        <h3 className="text-center text-lg font-bold text-gray-900 mb-2">Delete Request?</h3>
                        <p className="text-center text-gray-600 mb-8 leading-relaxed">
                            This will permanently delete your request. This action cannot be undone.
                        </p>
                        <div className="space-y-3">
                            <button
                                onClick={async () => {
                                    const token = localStorage.getItem('regaarder_token');
                                    const BACKEND = getBackendBaseUrl();
                                    try {
                                        const res = await fetch(`${BACKEND}/requests/${request.id}`, {
                                            method: 'DELETE',
                                            headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}) }
                                        });
                                        
                                        if (!res.ok) {
                                            const err = await res.json().catch(() => ({ error: 'Delete failed' }));
                                            // Check specifically for the in-progress error
                                            if (res.status === 400 || err.error.includes('progress')) {
                                                setShowDeleteConfirm(false);
                                                setActionToast({ visible: true, message: 'This request is currently in progress and cannot be deleted.' });
                                                return;
                                            }
                                            throw new Error(err.error || 'Delete failed');
                                        }
                                        
                                        setShowDeleteConfirm(false);
                                        setShowEditModal(false);
                                        // Broadcast delete event
                                        try { window.dispatchEvent(new CustomEvent('request:deleted', { detail: { requestId: request.id } })); } catch (e) { }
                                        setActionToast({ visible: true, message: 'Request deleted successfully' });
                                    } catch (err) {
                                        console.error('Delete failed', err);
                                        setShowDeleteConfirm(false);
                                        setActionToast({ visible: true, message: err.message || 'Delete failed' });
                                    }
                                }}
                                className="w-full px-4 py-3 rounded-lg bg-red-600 text-white font-semibold hover:bg-red-700 active:scale-95 transition-all"
                            >
                                Yes, delete it
                            </button>
                            <button
                                onClick={() => setShowDeleteConfirm(false)}
                                className="w-full px-4 py-3 rounded-lg bg-gray-100 text-gray-700 font-semibold hover:bg-gray-200 active:scale-95 transition-all"
                            >
                                Cancel
                            </button>
                        </div>
                    </div>
                </div>
            )}
            <Toast
                message={swipeToast.message}
                isVisible={swipeToast.visible}
                onClose={() => setSwipeToast({ ...swipeToast, visible: false })}
                actionLabel="Undo"
                onAction={handleUndoSwipe}
                variant="success"
            />

            <Toast
                message={bookmarkToast.message}
                isVisible={bookmarkToast.visible}
                onClose={() => setBookmarkToast({ ...bookmarkToast, visible: false })}
                variant="success"
            />

            <Toast
                message={actionToast.message}
                isVisible={actionToast.visible}
                onClose={() => setActionToast({ visible: false, message: '' })}
                variant="success"
            />

            {/* Quick-options popover shown on long-press of the Heart */}
            {showLikeOptions && (
                <div
                    ref={heartOptionsRef}
                    style={likeOptionsStyle}
                    className="z-40"
                    onMouseEnter={() => { if (autoHideTimeoutRef.current) { clearTimeout(autoHideTimeoutRef.current); autoHideTimeoutRef.current = null; } }}
                    onMouseLeave={() => { if (autoHideTimeoutRef.current) clearTimeout(autoHideTimeoutRef.current); autoHideTimeoutRef.current = setTimeout(() => setShowLikeOptions(false), 4000); }}
                >
                    <style>{`
                        @keyframes fadeScale { 
                            0% { opacity: 0; transform: translateY(6px) scale(0.98); }
                            100% { opacity: 1; transform: translateY(0) scale(1); }
                        }
                    `}</style>
                    <div className="bg-white rounded-xl shadow-lg py-2 px-4 flex flex-col space-y-1 text-sm" style={{ animation: 'fadeScale 160ms ease-out forwards', minWidth: 160 }} role="menu" aria-label="Quick actions">
                        <button onClick={handleDislikeOption} className="px-4 py-2 hover:bg-gray-100 rounded-md text-left w-full flex items-center" role="menuitem" aria-label="Dislike">
                            <HeartOff className="w-4 h-4 mr-3" style={{ color: 'var(--color-like)', fill: isDisliked ? 'var(--color-like)' : 'none' }} />
                            Dislike
                        </button>
                        <button onClick={handlePinOption} className="px-4 py-2 hover:bg-gray-100 rounded-md text-left w-full flex items-center" role="menuitem" aria-label="Pin">
                            <Pin className="w-4 h-4 mr-3" style={{ color: isPinned ? 'var(--color-gold)' : '#9CA3AF', fill: isPinned ? 'var(--color-gold)' : 'none' }} />
                            Pin
                        </button>
                        <button onClick={handleReportOption} className="px-4 py-2 hover:bg-gray-100 rounded-md text-left w-full flex items-center" role="menuitem" aria-label="Report">
                            <Flag className="w-4 h-4 mr-3" style={{ color: '#9CA3AF' }} />
                            Report
                        </button>
                        <button onClick={handleShareOption} className="px-4 py-2 hover:bg-gray-100 rounded-md text-left w-full flex items-center" role="menuitem" aria-label="Share">
                            <Share2 className="w-4 h-4 mr-3" style={{ color: 'var(--color-gold)' }} />
                            Share
                        </button>
                    </div>
                </div>
            )}

            {/* Report Modal (small) */}
            {showReportModal && (
                <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-black/40" onClick={() => setShowReportModal(false)} />
                    <div className="bg-white rounded-2xl shadow-2xl p-6 relative z-10 w-full max-w-sm">
                        <h3 className="text-lg font-bold mb-2">{getTranslation('Report request', selectedLanguage)}</h3>
                        <p className="text-sm text-gray-600 mb-4">{getTranslation('Please select a reason for reporting — this helps our moderation team prioritize reviews.', selectedLanguage)}</p>

                        <div className="space-y-2">
                            <label className="flex items-center space-x-3">
                                <input type="radio" name="reportReason" value="spam" checked={reportReason === 'spam'} onChange={() => setReportReason('spam')} />
                                <span className="text-sm">{getTranslation('Spam or misleading', selectedLanguage)}</span>
                            </label>
                            <label className="flex items-center space-x-3">
                                <input type="radio" name="reportReason" value="harassment" checked={reportReason === 'harassment'} onChange={() => setReportReason('harassment')} />
                                <span className="text-sm">{getTranslation('Harassment or hate', selectedLanguage)}</span>
                            </label>
                            <label className="flex items-center space-x-3">
                                <input type="radio" name="reportReason" value="inaccurate" checked={reportReason === 'inaccurate'} onChange={() => setReportReason('inaccurate')} />
                                <span className="text-sm">{getTranslation('Inaccurate or harmful information', selectedLanguage)}</span>
                            </label>
                            <label className="flex items-center space-x-3">
                                <input type="radio" name="reportReason" value="other" checked={reportReason === 'other'} onChange={() => setReportReason('other')} />
                                <span className="text-sm">{getTranslation('Other', selectedLanguage)}</span>
                            </label>

                            {reportReason === 'other' && (
                                <textarea
                                    value={reportOtherText}
                                    onChange={(e) => setReportOtherText(e.target.value)}
                                    placeholder={getTranslation('Optional: tell us more (max 200 chars)', selectedLanguage)}
                                    maxLength={200}
                                    className="w-full mt-2 p-2 border border-gray-200 rounded-md text-sm"
                                />
                            )}
                        </div>

                        <div className="flex justify-end space-x-3 mt-4">
                            <button onClick={() => setShowReportModal(false)} className="px-4 py-2 rounded-full bg-gray-100">{getTranslation('Cancel', selectedLanguage)}</button>
                            <button onClick={confirmReport} className="px-4 py-2 rounded-full" style={{ backgroundColor: 'var(--color-gold)', color: '#fff' }}>{getTranslation('Report', selectedLanguage)}</button>
                        </div>
                    </div>
                </div>
            )}

            {/* Share Modal (small) */}
            {showShareModal && (
                <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-black/40" onClick={() => setShowShareModal(false)} />
                    <div className="bg-white rounded-2xl shadow-2xl p-6 relative z-10 w-full max-w-sm">
                        <h3 className="text-lg font-bold mb-2">{getTranslation('Share request', selectedLanguage)}</h3>
                        <p className="text-sm text-gray-600 mb-4">{getTranslation('Share this request with others.', selectedLanguage)}</p>
                        <div className="flex flex-col space-y-3">
                            <button onClick={confirmShareNative} className="px-4 py-2 rounded-full text-left" style={{ backgroundColor: '#f3f4f6' }}>{getTranslation('Share via device', selectedLanguage)}</button>
                            <button onClick={confirmShareCopy} className="px-4 py-2 rounded-full text-left bg-gray-100">{getTranslation('Copy link', selectedLanguage)}</button>
                        </div>
                        <div className="flex justify-end mt-4">
                            <button onClick={() => setShowShareModal(false)} className="px-4 py-2 rounded-full bg-white border">{getTranslation('Close', selectedLanguage)}</button>
                        </div>
                    </div>
                </div>
            )}

            {/* Unpin Confirmation Modal (per-card) */}
            {showUnpinConfirm && (
                <div className="fixed inset-0 z-[80] flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-black/40" onClick={cancelUnpin} />
                    <div className="bg-white rounded-2xl shadow-2xl p-6 relative z-10 w-full max-w-sm">
                        <h3 className="text-lg font-bold mb-2">Unpin request?</h3>
                        <p className="text-sm text-gray-600 mb-4">Are you sure you want to remove this request from your pinned items? It will no longer appear at the top of your feed.</p>
                        <div className="flex justify-end space-x-3 mt-4">
                            <button onClick={cancelUnpin} className="px-4 py-2 rounded-full bg-gray-100">Cancel</button>
                            <button onClick={confirmUnpin} className="px-4 py-2 rounded-full" style={{ backgroundColor: 'var(--color-gold)', color: '#fff' }}>Unpin</button>
                        </div>
                    </div>
                </div>
            )}

            <Toast
                message="You’ve successfully claimed this request. You now have 48 hours to provide an update or draft."
                isVisible={showToast}
                onClose={() => setShowToast(false)}
            />

        </>
    );
};


// --- Profile Dialog Component (matching home.jsx) ---
const ProfileDialog = ({ name, username, isCreator = false, onClose, profileData = null, selectedLanguage = 'English', onNavigateToIdeas = null }) => {
    const currentYear = new Date().getFullYear();
    const [loadedProfileData, setLoadedProfileData] = useState(null);

    // Fetch user profile data to get avatar if not already provided
    useEffect(() => {
        if (profileData && profileData.avatar) {
            setLoadedProfileData(profileData);
            return;
        }

        const fetchUserProfile = async () => {
            try {
                const targetId = username || name;
                const BACKEND = getBackendBaseUrl();
                const response = await fetch(`${BACKEND}/users`);
                const result = await response.json();
                const users = Array.isArray(result.users) ? result.users : (Array.isArray(result) ? result : []);
                
                const user = users.find(u => 
                    u.id === targetId || 
                    u.email === targetId || 
                    u.name === targetId || 
                    (u.name && u.name.toLowerCase() === String(targetId).toLowerCase())
                );

                if (user) {
                    setLoadedProfileData({
                        ...profileData,
                        avatar: user.image || user.avatar || null
                    });
                } else {
                    setLoadedProfileData(profileData);
                }
            } catch (err) {
                console.error('Error fetching user profile:', err);
                setLoadedProfileData(profileData);
            }
        };

        fetchUserProfile();
    }, [username, name, profileData]);

    const data = loadedProfileData || profileData || {
        avatar: null,
        bio: isCreator ? getTranslation('Creating engaging content for you', selectedLanguage) : getTranslation('Enjoying great content', selectedLanguage),
        stats: {
            videos: isCreator ? 24 : 0,
            requests: 12,
            followers: 1245,
            following: 180
        },
        verified: false,
        joinedDate: currentYear
    };

    const auth = useAuth();
    const [isFollowing, setIsFollowing] = useState(false);
    useEffect(() => {
        try {
            const creatorId = (profileData && profileData.id) || null;
            const token = (auth.user && auth.user.token) || localStorage.getItem('regaarder_token');
            if (!creatorId || !token) return;
            fetch(`${getBackendBaseUrl()}/following/${creatorId}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            }).then(res => res.json()).then(d => { if (typeof d.isFollowing !== 'undefined') setIsFollowing(!!d.isFollowing); }).catch(() => { });
        } catch (e) { }
    }, [profileData && profileData.id, auth.user && auth.user.token]);

    return (
        <div className="fixed inset-0 z-[130] flex items-center justify-center px-4" style={{ backgroundColor: 'rgba(0,0,0,0.6)' }} onClick={onClose}>
            <div className="bg-white rounded-2xl w-full max-w-md overflow-hidden shadow-2xl" onClick={(e) => e.stopPropagation()}>
                <div className="relative h-24" style={{ background: 'linear-gradient(135deg, rgba(203,138,0,0.1) 0%, rgba(203,138,0,0.05) 100%)' }}>
                </div>

                <div className="px-6 pb-6 -mt-12">
                    <div className="relative inline-block">
                        <div
                            className="w-24 h-24 rounded-full border-4 border-white shadow-lg flex items-center justify-center overflow-hidden"
                            style={{ background: data.avatar ? 'transparent' : 'linear-gradient(135deg, #e5e7eb 0%, #f3f4f6 100%)' }}
                        >
                            {data.avatar ? (
                                <img src={data.avatar} alt={name} className="w-full h-full object-cover" />
                            ) : (
                                <User className="w-12 h-12 text-gray-400" />
                            )}
                        </div>
                        {isCreator && data.verified && (
                            <div
                                className="absolute bottom-0 right-0 w-7 h-7 rounded-full border-2 border-white flex items-center justify-center shadow-md"
                                style={{ backgroundColor: 'var(--color-gold)' }}
                            >
                                <Check className="w-3.5 h-3.5 text-white" />
                            </div>
                        )}
                    </div>

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

                    {data.bio && (
                        <p className="text-sm text-gray-600 mt-3 leading-relaxed">{data.bio}</p>
                    )}

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

                    <div className="mt-6 space-y-3">
                        <button
                            onClick={() => {
                                const creatorId = (profileData && profileData.id) || null;
                                const token = (auth.user && auth.user.token) || localStorage.getItem('regaarder_token');
                                if (!creatorId || !token) { onClose && onClose(); return; }
                                const url = isFollowing ? '/unfollow' : '/follow';
                                fetch(`${getBackendBaseUrl()}${url}`, {
                                    method: 'POST',
                                    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                                    body: JSON.stringify({ creatorId })
                                }).then(res => res.json()).then(() => setIsFollowing(!isFollowing)).catch(() => { });
                            }}
                            className="w-full py-3 rounded-xl font-semibold text-white transition-all hover:opacity-90 shadow-md"
                            style={{
                                backgroundColor: 'var(--color-gold)',
                                boxShadow: '0 4px 12px rgba(203, 138, 0, 0.3)'
                            }}
                        >
                            {isFollowing ? getTranslation('Following', selectedLanguage) : getTranslation('Follow', selectedLanguage)}
                        </button>
                        {isCreator && (
                            <button
                                onClick={async (e) => {
                                    e.preventDefault();
                                    e.stopPropagation();

                                    // Create creator object immediately
                                    const key = 'ideas_selectedCreator_v1';
                                    const creatorObj = {
                                        id: data.id || (data.handle || data.tag || String(data.name || '').replace(/^@+/, '')).toLowerCase(),
                                        name: data.handle ? `@${data.handle}` : (data.name || ''),
                                        handle: data.handle,
                                        image: data.image || null
                                    };
                                    window.localStorage.setItem(key, JSON.stringify(creatorObj));

                                    // If parent provided navigation handler, use it (preferred path)
                                    if (onNavigateToIdeas && typeof onNavigateToIdeas === 'function') {
                                        onNavigateToIdeas();
                                        return;
                                    }

                                    // Fallback: Close modal and navigate
                                    if (onClose) onClose();
                                    
                                    // Yield to let React process the close
                                    await new Promise(r => setTimeout(r, 10));

                                    // Dispatch event
                                    window.dispatchEvent(new CustomEvent('ideas:creator_selected'));
                                    
                                    // Navigate
                                    if (window.setFooterTab) {
                                        window.setFooterTab('ideas');
                                        window.history.pushState({}, '', '/ideas');
                                    } else {
                                        window.location.href = '/ideas';
                                    }
                                }}
                                className="w-full py-3 rounded-xl border-2 font-semibold transition-all hover:bg-gray-50"
                                style={{
                                    borderColor: 'var(--color-gold)',
                                    color: 'var(--color-gold)'
                                }}
                            >
                                {getTranslation('Request Video', selectedLanguage)}
                            </button>
                        )}
                    </div>

                    <div className="mt-6 text-center">
                        <p className="text-xs text-gray-400">{getTranslation('Member since', selectedLanguage)} {data.joinedDate}</p>
                    </div>
                </div>
            </div>
        </div>
    );
};

// --- Main Requests Feed Component ---
export default function RequestsFeed() {
    const auth = useAuth();
    const location = useLocation();
    // Use global language context
    const { selectedLanguage } = useLanguage();

    const [activeFilter, setActiveFilter] = useState(() => {
        try {
            const p = new URLSearchParams(window.location.search);
            const f = p.get('filter');
            // Check against valid filters to be safe, or just allow it if the UI can handle it.
            // Valid maps: 'For You', 'Trending', 'Newest', 'Top Funded', 'Completed'
            if (['For You', 'Trending', 'Newest', 'Top Funded', 'Completed'].includes(f)) {
                return f;
            }
        } catch (e) { }
        return 'For You';
    });
    const [activeNav, setActiveNav] = useState('Requests');
    const [searchQuery, setSearchQuery] = useState('');
    const [focusRequestId, setFocusRequestId] = useState(null);
    const [bookmarkedReqSet, setBookmarkedReqSet] = useState(new Set());
    const [showFilterDropdown, setShowFilterDropdown] = useState(false);
    const [selectedCategory, setSelectedCategory] = useState('All');
    const [selectedDateRange, setSelectedDateRange] = useState('All Time');
    const [selectedStatus, setSelectedStatus] = useState('All');
    const [selectedDate, setSelectedDate] = useState(null); // For calendar date picker
    const [calendarMonth, setCalendarMonth] = useState(new Date().getMonth());
    const [calendarYear, setCalendarYear] = useState(new Date().getFullYear());
    const [showMonthYearPicker, setShowMonthYearPicker] = useState(false);
    const [showNudgeModal, setShowNudgeModal] = useState(false);
    const [nudgeRequest, setNudgeRequest] = useState(null); // Store the request that needs nudging
    const [hideClaimedRequests, setHideClaimedRequests] = useState(() => {
        try {
            return localStorage.getItem('hideClaimedRequests') === 'true';
        } catch (e) {
            return false;
        }
    }); // Toggle to hide claimed requests
    const [hideClaimedHintCount, setHideClaimedHintCount] = useState(() => {
        try {
            return parseInt(localStorage.getItem('hideClaimedHintCount') || '0', 10);
        } catch (e) {
            return 0;
        }
    });
    const [showHideClaimedHint, setShowHideClaimedHint] = useState(false);
    const [adminSelections, setAdminSelections] = useState(() => {
        try {
            const saved = localStorage.getItem('requestAccentColorSelection');
            return saved ? JSON.parse(saved) : {};
        } catch (e) {
            return {};
        }
    });
    const filterDropdownRef = useRef(null);

    // Initialize hint visibility on component mount
    useEffect(() => {
        try {
            const count = parseInt(localStorage.getItem('hideClaimedHintCount') || '0', 10);
            // Show hint only for first 2 page loads
            if (count < 2) {
                setShowHideClaimedHint(true);
                // Increment count
                const newCount = count + 1;
                setHideClaimedHintCount(newCount);
                localStorage.setItem('hideClaimedHintCount', String(newCount));
            }
        } catch (e) { }
    }, []);

    // Listen for admin selection changes and polling
    useEffect(() => {
        // Poll localStorage for admin selections every 500ms
        const interval = setInterval(() => {
            try {
                const saved = localStorage.getItem('requestAccentColorSelection');
                const updated = saved ? JSON.parse(saved) : {};
                setAdminSelections(prev => {
                    const newStr = JSON.stringify(updated);
                    const prevStr = JSON.stringify(prev);
                    return newStr !== prevStr ? updated : prev;
                });
            } catch (e) {}
        }, 500);

        // Listen for custom event from admin panel
        const handleAdminSelectionChanged = (e) => {
            if (e.detail) {
                setAdminSelections(e.detail);
            }
        };

        // Listen for storage changes from other tabs/windows
        const handleStorageChange = (e) => {
            if (e.key === 'requestAccentColorSelection') {
                try {
                    const updated = e.newValue ? JSON.parse(e.newValue) : {};
                    setAdminSelections(updated);
                } catch (err) {
                    console.error('Failed to parse admin selections:', err);
                }
            }
        };

        window.addEventListener('adminSelectionChanged', handleAdminSelectionChanged);
        window.addEventListener('storage', handleStorageChange);

        return () => {
            clearInterval(interval);
            window.removeEventListener('adminSelectionChanged', handleAdminSelectionChanged);
            window.removeEventListener('storage', handleStorageChange);
        };
    }, []);

    // Sync active filter with URL param when location changes (client-side navigation)
    useEffect(() => {
        try {
            const p = new URLSearchParams(location.search);
            const f = p.get('filter');
            if (f && ['For You', 'Trending', 'Newest', 'Top Funded', 'Completed'].includes(f)) {
                setActiveFilter(f);
            }
        } catch (e) { }
    }, [location.search]);


    // If arriving with a query param, seed the search box or target specific request
    useEffect(() => {
        const handleDeepLink = () => {
            try {
                const params = new URLSearchParams(window.location.search || '');
                const qParam = params.get('q');
                if (qParam) setSearchQuery(qParam);

                const idParam = params.get('id');
                if (idParam) {
                    setPulseId(String(idParam));
                    setTimeout(() => {
                        try {
                            const el = document.querySelector(`[data-request-id="${String(idParam)}"]`);
                            if (el && el.scrollIntoView) {
                                el.scrollIntoView({ behavior: 'smooth', block: 'center' });
                            }
                        } catch (e) { }
                    }, 800);
                }
            } catch (e) { }
        };

        handleDeepLink();
    }, []);

    // id of the request that should briefly pulse (set immediately after pin or via deep link)
    const [pulseId, setPulseId] = useState(null);

    // --- Influence and Ranking Calculation Logic ---
    // Influence: 1 Like = 1 Influence, $1 Boost = 2 Influence
    const influenceMultiplier = 2;
    const THREAT_DIFFERENCE = 20; // Competitors within 20 influence points are a threat

    const calculateInfluenceAndRank = (requests) => {
        // 1. Calculate the total influence score for each request
        const requestsWithInfluence = requests.map(req => ({
            ...req,
            totalInfluence: req.likes + (req.boosts * influenceMultiplier),
        }));

        // 2. Create a sorted copy to determine global ranks
        const sortedByInfluence = [...requestsWithInfluence].sort((a, b) => b.totalInfluence - a.totalInfluence);

        // 3. Map IDs to their rank data
        const rankMap = {};
        sortedByInfluence.forEach((req, index) => {
            const currentRank = index + 1;
            let nextRankScore = null;
            if (currentRank > 1) {
                nextRankScore = sortedByInfluence[index - 1].totalInfluence;
            }
            const nextRankNeeded = nextRankScore !== null
                ? nextRankScore - req.totalInfluence + 1
                : 0;
            const threatCount = sortedByInfluence.slice(index + 1).filter(
                competitor => req.totalInfluence - competitor.totalInfluence <= THREAT_DIFFERENCE
            ).length;

            rankMap[req.id] = {
                rank: currentRank,
                nextRankNeeded,
                nextRankScore,
                threatCount,
                totalInfluence: req.totalInfluence
            };
        });

        // 4. Return the original list order, augmented with rank data
        return requestsWithInfluence.map(req => {
            const rData = rankMap[req.id] || { rank: 999, nextRankNeeded: 0, threatCount: 0 };
            return {
                ...req,
                ...rData,
                pinned: req.pinned || false,
                pinnedAt: req.pinnedAt || null,
            };
        });
    };

    const [rankedRequests, setRankedRequests] = useState(() => {
        const initial = calculateInfluenceAndRank([]);
        try {
            const raw = localStorage.getItem('pinned_requests_v1');
            if (raw) {
                const map = JSON.parse(raw); // { id: pinnedAt }
                const withPins = initial.map(r => ({ ...r, pinned: !!map[r.id], pinnedAt: map[r.id] || null }));
                // ensure pinned items appear first, most recently pinned first
                const pinned = withPins.filter(r => r.pinned).sort((a, b) => (b.pinnedAt || 0) - (a.pinnedAt || 0));
                const unpinned = withPins.filter(r => !r.pinned);
                return [...pinned, ...unpinned];
            }
        } catch (err) { }
        return initial;
    });

    // DEBUG LOGGER
    useEffect(() => {
        console.log(`DEBUG: RankedRequests update. Count=${rankedRequests.length}`);
        const optimistic = rankedRequests.filter(r => r.isOptimistic);
        if (optimistic.length > 0) {
            console.warn('DEBUG: Found OPTIMISTIC requests in list:', optimistic.map(r => r.id));
        }
        console.log('DEBUG: Top 3 IDs:', rankedRequests.slice(0, 3).map(r => r.id));
    }, [rankedRequests]);

    // Fetch persisted requests from backend on mount and whenever refreshed
    useEffect(() => {
        let cancelled = false;
        (async () => {
            try {
                const BACKEND = getBackendBaseUrl();

                // Fetch bookmarks to sync request bookmark state
                const token = localStorage.getItem('regaarder_token');
                let bookmarkedRequestIds = new Set();
                try {
                    const bookmarksRes = await fetch(`${BACKEND}/bookmarks`, {
                        headers: token ? { Authorization: `Bearer ${token}` } : {}
                    });
                    const bookmarksData = await bookmarksRes.json();
                    if (bookmarksData && bookmarksData.success && Array.isArray(bookmarksData.requests)) {
                        bookmarksData.requests.forEach(b => {
                            if (b.requestId) {
                                console.log('Bookmarked requestId:', b.requestId);
                                bookmarkedRequestIds.add(String(b.requestId));
                            }
                        });
                        console.log('Bookmarked request IDs set:', Array.from(bookmarkedRequestIds));
                    }
                } catch (e) {
                    console.warn('Failed to fetch request bookmarks:', e);
                }

                // Construct URL with feed param based on activeFilter
                const filterMap = { 'For You': 'recommended', 'Trending': 'trending', 'Newest': 'fresh', 'Top Funded': 'funded', 'Completed': 'completed' };
                const feedType = filterMap[activeFilter] || 'recommended';
                const url = new URL(`${BACKEND}/requests`);
                url.searchParams.set('feed', feedType);
                if (selectedCategory && selectedCategory !== 'All') url.searchParams.set('category', selectedCategory);

                const res = await fetch(url.toString());
                console.log('[REQUESTS_FETCH] URL:', url.toString(), 'status:', res.status);
                if (!res.ok) throw new Error('Failed to fetch requests');
                const body = await res.json();
                console.log('[REQUESTS_FETCH] Backend returned:', body.requests?.length || 0, 'requests');
                
                // CRITICAL DEBUG - Very visible
                window.__DEBUG_REQUESTS_COUNT = body.requests?.length || 0;
                
                if (cancelled) return;
                let list = Array.isArray(body.requests) ? body.requests : [];

                const processLocalRequests = (backendList) => {
                    let finalList = [...backendList];
                    try {
                        const localRaw = localStorage.getItem('ideas_requests_v1');
                        if (localRaw) {
                            console.log('Found local optimistic requests:', localRaw.length, 'chars');
                            const localReqs = JSON.parse(localRaw);
                            console.log('Local requests parsed:', localReqs.length, 'items');
                            if (Array.isArray(localReqs)) {
                                const backendIds = new Set(finalList.map(r => String(r.id)));
                                const missing = localReqs.filter(r => {
                                    if (!r || !r.id) return false;
                                    if (backendIds.has(String(r.id))) return false;
                                    return true;
                                });
                                console.log('Merging missing optimistic requests:', missing.length);

                                if (missing.length > 0) {
                                    const taggedMissing = missing.map(m => ({ 
                                        ...m, 
                                        isOptimistic: true,
                                        likes: m.likes || 0,
                                        boosts: m.boosts || 0,
                                        comments: m.comments || 0,
                                        funding: m.funding || m.amount || 0 
                                    }));
                                    taggedMissing.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

                                    // Always include missing optimistic items at the top for Newest
                                    // For other filters, we append them or interleave them, but since they are
                                    // just created, they likely belong at the top or near it.
                                    if (activeFilter === 'Newest' || activeFilter === 'For You' || activeFilter === 'recommended') {
                                        finalList = [...taggedMissing, ...finalList];
                                    } else {
                                        // For trending etc, they might have 0 score, so just append normally
                                        // or prepend to let user see them? Prepend is safer for UX.
                                        finalList = [...taggedMissing, ...finalList];
                                    }

                                    // SELF-HEALING: Attempt to sync optimistic requests to backend if they are missing
                                    // This runs in background to fix issues where ideas.jsx redirected before saving.
                                    setTimeout(() => {
                                        taggedMissing.forEach(async (req) => {
                                           if (!req || req.backendSynced) return; 
                                           // Check if we already tried syncing this session to avoid spam
                                           const key = `sync_attempt_${req.id}`;
                                           if (sessionStorage.getItem(key)) return;
                                           sessionStorage.setItem(key, '1');

                                           console.log('Self-healing: Syncing missing request to backend', req.id);
                                           try {
                                               const token = localStorage.getItem('regaarder_token');
                                               const headers = { 'Content-Type': 'application/json' };
                                               if (token) headers['Authorization'] = `Bearer ${token}`;
                                               
                                               // Use public endpoint if no token provided (anonymous sync)
                                               const endpoint = token ? `${BACKEND}/requests` : `${BACKEND}/requests/public`;

                                               const payload = {
                                                   id: req.id,
                                                   title: req.title,
                                                   description: req.description,
                                                   creator: req.creator,
                                                   // Ensure creator is valid object not null
                                                   createdBy: req.createdBy || (req.creator ? req.creator.id : null),
                                                   meta: req.meta,
                                                   amount: req.amount || req.funding || 0
                                               };

                                               const res = await fetch(endpoint, {
                                                   method: 'POST',
                                                   headers,
                                                   body: JSON.stringify(payload)
                                               });
                                               
                                               if (res.ok) {
                                                   console.log('Self-healing: Successfully synced', req.id);
                                                   // Update local storage to mark as apparently synced (or letting next fetch handle it)
                                                   // actually, next fetch will see it in backend list, so it won't be "missing" anymore.
                                               } else {
                                                   console.warn('Self-healing: Failed to sync', req.id, res.status);
                                                   sessionStorage.removeItem(key); // Retry next time
                                               }
                                           } catch(e) { 
                                               console.error('Self-healing error', e); 
                                               sessionStorage.removeItem(key);
                                           }
                                        });
                                    }, 2000);
                                }
                            }
                        }
                    } catch (e) {
                        console.warn('Failed to merge local requests:', e);
                    }

                    // CLEANUP: Prune ideas_requests_v1 — remove entries that are now in the backend.
                    // Also cap at 50 most-recent entries to prevent unbounded growth.
                    try {
                        const localRaw2 = localStorage.getItem('ideas_requests_v1');
                        if (localRaw2) {
                            const localArr = JSON.parse(localRaw2);
                            if (Array.isArray(localArr)) {
                                const backendIdSet = new Set(backendList.map(r => String(r.id)));
                                // Keep only entries NOT yet in backend (still pending sync)
                                let pruned = localArr.filter(r => r && r.id && !backendIdSet.has(String(r.id)));
                                // Also remove entries older than 7 days that never synced (stale)
                                const sevenDaysAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
                                pruned = pruned.filter(r => {
                                    const ct = r.createdAt ? new Date(r.createdAt).getTime() : 0;
                                    return !isNaN(ct) && ct > sevenDaysAgo;
                                });
                                // Cap at 50 most-recent
                                pruned.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
                                pruned = pruned.slice(0, 50);
                                if (pruned.length === 0) {
                                    localStorage.removeItem('ideas_requests_v1');
                                    console.log('[CLEANUP] Removed ideas_requests_v1 (all synced)');
                                } else {
                                    localStorage.setItem('ideas_requests_v1', JSON.stringify(pruned));
                                    console.log(`[CLEANUP] Pruned ideas_requests_v1: ${localArr.length} → ${pruned.length}`);
                                }
                            }
                        }
                    } catch (e) {
                        console.warn('[CLEANUP] Failed to prune ideas_requests_v1:', e);
                    }

                    // Return merged list (backend + missing local optimistic requests)
                    console.log('processLocalRequests returning:', finalList.length, 'total requests');
                    return finalList;
                };

                list = processLocalRequests(list);

                // Normalize each request so the UI has the expected fields
                let normalized = list.map(r => {
                    const base = { likes: 0, boosts: 0, comments: 0, funding: 0, ...r };
                    // Prefer explicit funding or fall back to posted amount
                    base.funding = (typeof base.funding === 'number' && base.funding > 0) ? base.funding : (typeof base.amount === 'number' ? base.amount : 0);
                    // Normalize requester/creator fields for consistent display across platforms
                    const creatorObj = (base.creator && typeof base.creator === 'object') ? base.creator : null;
                    const creatorId = (creatorObj && (creatorObj.id || creatorObj.userId)) || base.creatorId || base.createdBy || (typeof base.creator === 'string' ? base.creator : null);
                    const requesterName = base.requesterName || base.requester || base.createdByName || base.creatorName || (creatorObj && (creatorObj.name || creatorObj.handle || creatorObj.tag)) || base.company || 'Community';
                    const requesterAvatar = base.requesterAvatar || base.requesterImage || base.avatar || base.photoURL || (creatorObj && (creatorObj.image || creatorObj.avatar || creatorObj.photoURL)) || base.imageUrl || '';
                    base.creator = creatorObj || { id: creatorId || null, name: requesterName, image: requesterAvatar || '' };
                    base.requesterName = requesterName;
                    base.requesterAvatar = requesterAvatar || '';
                    // Derive company / display name
                    base.company = base.company || requesterName;
                    base.companyInitial = base.companyInitial || (base.company ? String(base.company).charAt(0).toUpperCase() : 'C');
                    base.companyColor = base.companyColor || 'bg-gray-400';
                    // Accept image from body.imageUrl or nested creator/image fields
                    base.imageUrl = base.imageUrl || requesterAvatar || '';
                    // Compute a friendly time label from createdAt
                    base.timeAgo = base.timeAgo || timeAgoFromISO(base.createdAt);
                    // Sync bookmark state from backend
                    const isBookmarked = bookmarkedRequestIds.has(String(base.id));
                    console.log(`Request ${base.id} bookmarked:`, isBookmarked);
                    base.bookmarked = isBookmarked;
                    return base;
                });

                // If some requests reference a creator id, fetch those creator profiles from backend
                try {
                    const creatorIds = Array.from(new Set(normalized.filter(r => r.creator && r.creator.id).map(r => r.creator.id)));
                    if (creatorIds.length > 0) {
                        const fetched = await Promise.all(creatorIds.map(async (id) => {
                            try {
                                const res = await fetch(`${getBackendBaseUrl()}/users/${id}`);
                                if (!res.ok) return null;
                                const body = await res.json();
                                return body && body.user ? body.user : null;
                            } catch (e) { return null; }
                        }));
                        const byId = (fetched || []).reduce((acc, u) => { if (u && u.id) acc[u.id] = u; return acc; }, {});
                        normalized = normalized.map(r => {
                            if (r.creator && r.creator.id && byId[r.creator.id]) {
                                const u = byId[r.creator.id];
                                // merge backend user public fields into creator
                                r.creator = { ...r.creator, ...u };
                                // prefer creator image
                                r.imageUrl = r.imageUrl || u.image || u.avatar || '';
                                r.company = r.company || u.name || r.creator.name || r.creator.id;
                                r.companyInitial = r.companyInitial || (r.company ? String(r.company).charAt(0).toUpperCase() : 'C');
                            }
                            return r;
                        });
                    }
                } catch (e) { }

                // Hide requests created by the current user - REMOVED so users can see their own requests
                // if (auth.user) {
                //      normalized = normalized.filter(r => r.createdBy !== auth.user.id && (!r.creator || r.creator.id !== auth.user.id));
                // }

                // Ensure strict sorting for filtered views even after merging local optimistic requests.
                // This fixes the issue where a locally merged request (e.g. $15) appears above higher funded ones (e.g. $7888)
                // simply because it was prepended to the list.
                if (activeFilter === 'Top Funded') {
                    normalized.sort((a, b) => (b.funding || 0) - (a.funding || 0));
                } else if (activeFilter === 'Newest') {
                    // CRITICAL FIX #2: Handle null/invalid timestamps safely
                    normalized.sort((a, b) => {
                        const timeA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
                        const timeB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
                        if (isNaN(timeA) || isNaN(timeB)) return 0;
                        return timeB - timeA;
                    });
                }

                const ranked = calculateInfluenceAndRank(normalized);
                // Apply pinned map from localStorage if present
                try {
                    const raw = localStorage.getItem('pinned_requests_v1');
                    if (raw) {
                        const map = JSON.parse(raw);
                        const withPins = ranked.map(r => ({ ...r, pinned: !!map[r.id], pinnedAt: map[r.id] || null }));
                        const pinned = withPins.filter(r => r.pinned).sort((a, b) => (b.pinnedAt || 0) - (a.pinnedAt || 0));
                        const unpinned = withPins.filter(r => !r.pinned);
                        console.log('🔴 SETTING rankedRequests with pinned:', [...pinned, ...unpinned].length);
                        setRankedRequests([...pinned, ...unpinned]);
                        return;
                    }
                } catch (e) { }
                console.log('🔴 SETTING rankedRequests (no pins):', ranked.length);
                setRankedRequests(ranked);
            } catch (e) {
                console.error('🔴🔴🔴 FETCH ERROR:', e);
                // fallback: only use mock data in development
                try {
                    const useMock = (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.DEV);
                    let initial = calculateInfluenceAndRank(useMock ? mockRequests : []);

                    // Even if backend fails, try to show local optimistic requests on top of mocks
                    try {
                        const localRaw = localStorage.getItem('ideas_requests_v1');
                        if (localRaw) {
                            const localReqs = JSON.parse(localRaw);
                            if (Array.isArray(localReqs) && localReqs.length > 0) {
                                // Normalize local reqs to match mock structure roughly
                                const normalizedLocal = localReqs.map(r => ({
                                    ...r,
                                    likes: 0, boosts: 0, comments: 0, funding: (r.amount || 0),
                                    isOptimistic: true,
                                    company: r.company || (r.creator ? r.creator.name : 'Me'),
                                    companyInitial: 'M',
                                    companyColor: 'bg-gray-400',
                                    timeAgo: 'Just now',
                                    imageUrl: r.imageUrl || '',
                                }));
                                // Prepend
                                initial = calculateInfluenceAndRank([...normalizedLocal, ...(useMock ? mockRequests : [])]);
                            }
                        }
                    } catch (ex) { }

                    setRankedRequests(initial);
                } catch (err) { }
            }
        })();
        return () => { cancelled = true; };
    }, [activeFilter, selectedCategory, selectedStatus, location.search]); // Re-fetch on URL query change

    // Listen for local events when a new request is created in Ideas page
    useEffect(() => {
        const handler = (ev) => {
            try {
                const newReq = ev && ev.detail ? ev.detail : null;
                if (!newReq) return;
                console.log('RequestsFeed: received ideas:request_created', newReq);
                setRankedRequests(prev => {
                    // normalize numeric fields
                    const normalized = { likes: 0, boosts: 0, comments: 0, funding: 0, ...newReq };
                    // Avoid duplicates
                    if (prev.some(r => r.id === normalized.id)) return prev;
                    
                    const combined = [normalized, ...prev.map(p => ({ ...p }))];
                    const recalculated = calculateInfluenceAndRank(combined);
                    return recalculated;
                });
            } catch (e) { }
        };
        window.addEventListener('ideas:request_created', handler);
        return () => window.removeEventListener('ideas:request_created', handler);
    }, []);

    // Listen for claim events to update the request list
    useEffect(() => {
        const handler = (ev) => {
            try {
                const { requestId, claimedBy, claimedAt } = ev.detail || {};
                if (!requestId) return;
                setRankedRequests(prev => {
                    return prev.map(r => {
                        if (r.id === requestId) {
                            return { ...r, claimed: true, claimedBy, claimedAt };
                        }
                        return r;
                    });
                });
            } catch (e) { }
        };
        window.addEventListener('request:claimed', handler);
        return () => window.removeEventListener('request:claimed', handler);
    }, []);

    // Listen for comment events to update counts live
    useEffect(() => {
        const addHandler = (ev) => {
            try {
                const { requestId } = ev && ev.detail ? ev.detail : {};
                console.log('RequestsFeed: received comment_added', { requestId, detail: ev && ev.detail });
                if (typeof requestId === 'undefined' || requestId === null) return;
                setRankedRequests(prev => prev.map(r => (String(r.id) === String(requestId)) ? { ...r, comments: (Number(r.comments) || 0) + 1 } : r));
            } catch (e) { console.warn('RequestsFeed: error handling comment_added', e); }
        };

        const updateHandler = (ev) => {
            try {
                const { requestId } = ev && ev.detail ? ev.detail : {};
                console.log('RequestsFeed: received comment_updated', { requestId, detail: ev && ev.detail });
                if (typeof requestId === 'undefined' || requestId === null) return;
                // No change to count on edit, but this allows re-render if needed
                setRankedRequests(prev => prev.map(r => (String(r.id) === String(requestId)) ? { ...r } : r));
            } catch (e) { console.warn('RequestsFeed: error handling comment_updated', e); }
        };

        const deleteHandler = (ev) => {
            try {
                const { requestId } = ev && ev.detail ? ev.detail : {};
                console.log('RequestsFeed: received comment_deleted', { requestId, detail: ev && ev.detail });
                if (typeof requestId === 'undefined' || requestId === null) return;
                setRankedRequests(prev => prev.map(r => (String(r.id) === String(requestId)) ? { ...r, comments: Math.max(0, (Number(r.comments) || 0) - 1) } : r));
            } catch (e) { console.warn('RequestsFeed: error handling comment_deleted', e); }
        };

        window.addEventListener('request:comment_added', addHandler);
        window.addEventListener('request:comment_updated', updateHandler);
        window.addEventListener('request:comment_deleted', deleteHandler);
        return () => {
            window.removeEventListener('request:comment_added', addHandler);
            window.removeEventListener('request:comment_updated', updateHandler);
            window.removeEventListener('request:comment_deleted', deleteHandler);
        };
    }, []);

    // Listen for request updates (edits) to refresh cards
    useEffect(() => {
        const handler = (ev) => {
            try {
                const updated = ev && ev.detail && ev.detail.request ? ev.detail.request : null;
                if (!updated || !updated.id) return;
                setRankedRequests(prev => prev.map(r => (String(r.id) === String(updated.id) ? { ...r, ...updated } : r)));
            } catch (e) { console.warn('RequestsFeed: error handling request:updated', e); }
        };
        window.addEventListener('request:updated', handler);
        return () => window.removeEventListener('request:updated', handler);
    }, []);

    // Load per-user reactions from backend to persist across devices
    useEffect(() => {
        try {
            const token = (auth.user && auth.user.token) || localStorage.getItem('regaarder_token');
            if (!token) return;
            fetch(`${getBackendBaseUrl()}/requests/react/me`, {
                headers: { 'Authorization': `Bearer ${token}` }
            }).then(res => res.json()).then(data => {
                if (data && data.reactions) {
                    try {
                        const raw = localStorage.getItem('request_reacts_v1');
                        const map = raw ? JSON.parse(raw) : {};
                        const merged = { ...map, ...data.reactions };
                        localStorage.setItem('request_reacts_v1', JSON.stringify(merged));
                    } catch (e) { }
                }
            }).catch(() => { });
        } catch (e) { }
    }, [auth.user && auth.user.token]);

    // Check for requests that need nudging (36+ hours old with no interaction)
    useEffect(() => {
        const checkForNudgeableRequests = () => {
            if (!rankedRequests || rankedRequests.length === 0) return;
            
            const now = new Date();
            const thirtyHoursAgo = new Date(now.getTime() - 36 * 60 * 60 * 1000);
            
            // Find first request that:
            // 1. Is free (amount === 0 or no amount)
            // 2. Was created 36+ hours ago
            // 3. Has no interaction (no likes, boosts, comments, saves, or views)
            // 4. Is created by current user
            const token = localStorage.getItem('regaarder_token');
            let currentUserId = null;
            try {
                const userRaw = localStorage.getItem('regaarder_user');
                if (userRaw) {
                    const user = JSON.parse(userRaw);
                    currentUserId = user.id;
                }
            } catch (e) { }
            
            for (const req of rankedRequests) {
                const isFree = !req.amount || req.amount === 0;
                const createdAt = new Date(req.createdAt || req.timestamp);
                const isOldEnough = createdAt <= thirtyHoursAgo;
                const hasNoInteraction = (req.likes || 0) === 0 && 
                                        (req.boosts || 0) === 0 && 
                                        (req.comments || 0) === 0 &&
                                        (req.bookmarks || 0) === 0 &&
                                        (req.views || 0) === 0;
                const isCreatedByUser = currentUserId && String(req.createdBy) === String(currentUserId);
                
                // Check if we've already shown the nudge for this request
                try {
                    const nudgeSeen = localStorage.getItem(`nudge_shown_${req.id}`);
                    if (nudgeSeen) continue; // Skip if already shown
                } catch (e) { }
                
                if (isFree && isOldEnough && hasNoInteraction && isCreatedByUser) {
                    setNudgeRequest(req);
                    setShowNudgeModal(true);
                    // Mark this request as having been nudged
                    try {
                        localStorage.setItem(`nudge_shown_${req.id}`, 'true');
                    } catch (e) { }
                    break; // Only show one nudge at a time
                }
            }
        };
        
        checkForNudgeableRequests();
    }, [rankedRequests]);

    const [pinToast, setPinToast] = useState({ visible: false, message: '' });

    // Live-sync request bookmarks across devices
    useEffect(() => {
        let cancelled = false;
        const fetchBookmarks = async () => {
            try {
                const token = (auth.user && auth.user.token) || localStorage.getItem('regaarder_token');
                // console.log('Fetching bookmarks - has token:', !!token, 'auth.user:', auth.user?.id);
                const headers = token ? { 'Authorization': `Bearer ${token}` } : {};
                const res = await fetch(`${getBackendBaseUrl()}/bookmarks`, { headers });
                const data = await res.json();
                // console.log('Bookmarks fetch response:', data);
                if (!cancelled && data && data.success) {
                    // console.log('Raw bookmarks data - requests:', data.requests);
                    const ids = new Set((Array.isArray(data.requests) ? data.requests : []).map(b => String(b.requestId)));
                    // console.log('Live-syncing bookmarked request IDs:', Array.from(ids));
                    setBookmarkedReqSet(ids);

                    // Update existing requests with bookmark state
                    setRankedRequests(prev => prev.map(r => ({
                        ...r,
                        bookmarked: ids.has(String(r.id))
                    })));
                }
            } catch (e) {
                console.warn('Failed to sync request bookmarks:', e);
            }
        };
        fetchBookmarks();
        const id = setInterval(fetchBookmarks, 5000);
        return () => { cancelled = true; clearInterval(id); };
    }, [auth.user]);

    // Navigate to a specific request if coming from Bookmarks
    useEffect(() => {
        try {
            const target = localStorage.getItem('requests:navigateTo');
            if (target) {
                setPulseId(String(target));
                setTimeout(() => {
                    try {
                        const el = document.querySelector(`[data-request-id="${String(target)}"]`);
                        if (el && el.scrollIntoView) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    } catch { }
                }, 600);
                localStorage.removeItem('requests:navigateTo');
            }
        } catch { }
    }, []);


    // Profile dialog state
    const [isProfileOpen, setIsProfileOpen] = useState(false);
    const [profileUser, setProfileUser] = useState(null);
    const [profileIsCreator, setProfileIsCreator] = useState(false);
    const [profileData, setProfileData] = useState(null);

    // Handler to open profile dialog
    const handleOpenProfile = (name, isCreator = false, data = null) => {
        setProfileUser(name);
        setProfileIsCreator(isCreator);
        setProfileData(data);
        setIsProfileOpen(true);
    };

    // Handler to close profile dialog
    const handleCloseProfile = () => {
        setIsProfileOpen(false);
        setProfileUser(null);
        setProfileIsCreator(false);
        setProfileData(null);
    };

    // Handler to navigate to Ideas page with creator pre-selected
    const handleNavigateToIdeas = () => {
        const creatorData = profileData || {};
        const key = 'ideas_selectedCreator_v1';
        const creatorObj = {
            id: creatorData.id || (creatorData.handle || creatorData.tag || String(creatorData.name || '').replace(/^@+/, '')).toLowerCase(),
            name: creatorData.handle ? `@${creatorData.handle}` : (creatorData.name || ''),
            handle: creatorData.handle,
            image: creatorData.image || null
        };
        window.localStorage.setItem(key, JSON.stringify(creatorObj));
        
        // Close the modal immediately and synchronously
        setIsProfileOpen(false);
        setProfileUser(null);
        setProfileIsCreator(false);
        setProfileData(null);
        
        // Dispatch event for Ideas page
        window.dispatchEvent(new CustomEvent('ideas:creator_selected'));
        
        // Navigate to Ideas
        setTimeout(() => {
            if (window.setFooterTab) {
                window.setFooterTab('ideas');
                window.history.pushState({}, '', '/ideas');
            } else {
                window.location.href = '/ideas';
            }
        }, 50);
    };

    // Toggle pin for a request: sets pinned flag and reorders pinned items to the top
    const togglePin = (requestId) => {
        setRankedRequests(prev => {
            const found = prev.find(r => r.id === requestId);
            const willBePinned = !(found && found.pinned);

            // toggle pinned state
            const next = prev.map(r => r.id === requestId ? { ...r, pinned: !r.pinned, pinnedAt: !r.pinned ? Date.now() : null } : r);
            // sort: pinned first (most recently pinned first), then by previous order (stable)
            const pinned = next.filter(r => r.pinned).sort((a, b) => (b.pinnedAt || 0) - (a.pinnedAt || 0));
            const unpinned = next.filter(r => !r.pinned);
            const combined = [...pinned, ...unpinned];

            // persist pinned map to localStorage
            try {
                const map = {};
                combined.forEach(r => { if (r.pinned) map[r.id] = r.pinnedAt; });
                localStorage.setItem('pinned_requests_v1', JSON.stringify(map));
            } catch (err) { }

            // after DOM updates, show toast and scroll to top for pinned item
            setTimeout(() => {
                if (willBePinned) {
                    try {
                        const el = document.getElementById(`request-card-${requestId}`);
                        if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
                    } catch (err) { }
                    setPinToast({ visible: true, message: 'Pinned' });
                    try {
                        // trigger a brief pulse on the newly pinned card
                        setPulseId(requestId);
                        setTimeout(() => setPulseId(null), 1200);
                    } catch (err) { }
                } else {
                    setPinToast({ visible: true, message: 'Unpinned' });
                }
            }, 120);

            return combined;
        });
    };

    // Since mock data is static, this would be re-run on data change.


    // Footer component (copied/adapted from `home.jsx` for visual parity)
    // Removed local BottomBar component - now using SharedBottomBar from components/SharedBottomBar.jsx

    // Note: Theme variables are managed globally by ThemeProvider. Avoid writing
    // CSS variable values from this module so the provider's selection isn't
    // overwritten when the page mounts.



    // Click outside to close filter dropdown
    useEffect(() => {
        if (!showFilterDropdown) return;

        const handleClickOutside = (e) => {
            if (filterDropdownRef.current && !filterDropdownRef.current.contains(e.target)) {
                setShowFilterDropdown(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        document.addEventListener('touchstart', handleClickOutside);

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
            document.removeEventListener('touchstart', handleClickOutside);
        };
    }, [showFilterDropdown]);

    // Entrance swipe hint overlay (one-time)
    const [showSwipeEntrance, setShowSwipeEntrance] = useState(false);
    useEffect(() => {
        try {
            const seen = localStorage.getItem('requests_swipe_entrance_shown');
            if (!seen) setShowSwipeEntrance(true);
        } catch (e) {
            // ignore (SSR or privacy settings)
        }
    }, []);
    const dismissSwipeEntrance = () => {
        try { localStorage.setItem('requests_swipe_entrance_shown', '1'); } catch (e) { }
        setShowSwipeEntrance(false);
    };

    // If there are no trending requests, show "Newest" first and
    // make sure the active filter switches to "Newest" automatically.
    const hasTrending = Array.isArray(rankedRequests) && rankedRequests.some(r => r.isTrending);

    useEffect(() => {
        if (!hasTrending && activeFilter === 'Trending') {
            setActiveFilter('Newest');
        }
    }, [hasTrending, activeFilter]);

    const filters = hasTrending ? [
        { name: 'For You', Icon: Sparkles },
        { name: 'Newest', Icon: Clock },
        { name: 'Trending', Icon: TrendingUp },
        { name: 'Top Funded', Icon: DollarSign },
        { name: 'Completed', Icon: FileText },
        { name: 'Following', Icon: Heart },
    ] : [
        { name: 'For You', Icon: Sparkles },
        { name: 'Newest', Icon: Clock },
        { name: 'Trending', Icon: TrendingUp },
        { name: 'Top Funded', Icon: DollarSign },
        { name: 'Completed', Icon: FileText },
        { name: 'Following', Icon: Heart },
    ];

    const applyActiveFilter = (list) => {
        let filtered = list;

        // Filter out claimed requests if toggle is enabled
        if (hideClaimedRequests) {
            filtered = filtered.filter(r => !r.claimed && !r.claimedBy);
        }

        // Apply category filter
        if (selectedCategory !== 'All') {
            filtered = filtered.filter(r => {
                // Example: match by category field if it exists
                return (r.category || 'General') === selectedCategory;
            });
        }

        // Apply specific date filter
        if (selectedDate) {
            filtered = filtered.filter(r => {
                if (!r.createdAt) return false;
                const created = new Date(r.createdAt);
                const selected = new Date(selectedDate);
                return created.toDateString() === selected.toDateString();
            });
        }
        // Apply date range filter (only if no specific date selected)
        else if (selectedDateRange !== 'All Time') {
            const now = Date.now();
            filtered = filtered.filter(r => {
                const created = r.createdAt ? new Date(r.createdAt).getTime() : now;
                const daysDiff = (now - created) / (1000 * 60 * 60 * 24);

                if (selectedDateRange === 'Today') return daysDiff < 1;
                if (selectedDateRange === 'This Week') return daysDiff < 7;
                if (selectedDateRange === 'This Month') return daysDiff < 30;
                return true;
            });
        }

        // Apply status filter
        if (selectedStatus !== 'All') {
            if (selectedStatus === 'Completed') {
                filtered = filtered.filter(r => r.isCompleted === true);
            } else if (selectedStatus === 'Active') {
                filtered = filtered.filter(r => !r.isCompleted);
            }
        }

        // Apply primary filter (Trending, Newest, etc)
        switch (activeFilter) {
            case 'For You': {
                // Personalized: show user's own requests first when available
                try {
                    // Robustly determine current user ID (AuthContext or LocalStorage)
                    let currentUserId = (auth && auth.user && auth.user.id) ? String(auth.user.id) : null;
                    if (!currentUserId) {
                       try {
                          const raw = localStorage.getItem('regaarder_user');
                          if (raw) {
                             const u = JSON.parse(raw);
                             if (u && u.id) currentUserId = String(u.id);
                          }
                       } catch(e) {}
                    }

                    if (currentUserId) {
                        return [...filtered].sort((a, b) => {
                            // Always prioritize optimistic/pending requests at the very top
                            if (a.isOptimistic && !b.isOptimistic) return -1;
                            if (b.isOptimistic && !a.isOptimistic) return 1;

                            const aSelf = (String(a.createdBy || (a.creator && a.creator.id)) === currentUserId) ? 1 : 0;
                            const bSelf = (String(b.createdBy || (b.creator && b.creator.id)) === currentUserId) ? 1 : 0;
                            const diff = bSelf - aSelf;
                            if (diff !== 0) return diff;
                            // Second sort criteria: Recent first
                            return new Date(b.createdAt) - new Date(a.createdAt);
                        });
                    }
                    
                    // If no user detected, still float optimistic items to top, then descending date
                    return [...filtered].sort((a, b) => {
                         if (a.isOptimistic && !b.isOptimistic) return -1;
                         if (b.isOptimistic && !a.isOptimistic) return 1;
                         return new Date(b.createdAt) - new Date(a.createdAt);
                    });
                } catch (e) { console.warn('Sort For You failed', e); }
                return filtered;
            }
            case 'Trending': return filtered; // Backend already returns trending-sorted; don't re-filter
            case 'Newest': return [...filtered].sort((a, b) => {
                const da = a.createdAt ? new Date(a.createdAt).getTime() : 0;
                const db = b.createdAt ? new Date(b.createdAt).getTime() : 0;
                if (isNaN(da) || isNaN(db)) return 0; // Handle invalid dates
                return db - da; // Descending
            });
            case 'Top Funded': return [...filtered].sort((a, b) => b.funding - a.funding);
            case 'Completed': return filtered.filter(r => r.isCompleted === true);
            case 'Following': return filtered; // placeholder
            default: return filtered;
        }
    };

    // Base search filtering (re-using rankedRequests which now contains server-sorted data)
    let displayedRequests = rankedRequests.filter(req => {
        if (!req || !req.id) return false;
        // Filter out hidden and deleted requests
        if (req.hidden || req.deleted) return false;
        if (!searchQuery.trim()) return true;
        const q = searchQuery.trim().toLowerCase();
        return (
            (req.title || '').toLowerCase().includes(q) ||
            (req.description || '').toLowerCase().includes(q) ||
            (req.company || '').toLowerCase().includes(q)
        );
    });

    // Apply active filters (Category, Date, Status, Primary Filter)
    displayedRequests = applyActiveFilter(displayedRequests);

    // Auto-focus the matching request when arriving from a video option
    useEffect(() => {
        let clearTimer = null;
        try {
            const params = new URLSearchParams(window.location.search || '');
            const reqIdParam = params.get('reqId');
            const focusParam = params.get('focus');
            let targetId = focusParam || reqIdParam || null;

            if (!targetId && searchQuery) {
                const qLower = searchQuery.toLowerCase();
                const match = rankedRequests.find(r => (r.title || '').toLowerCase().includes(qLower) || (r.company || '').toLowerCase().includes(qLower));
                if (match) targetId = match.id;
            }

            if (!targetId) {
                const raw = localStorage.getItem('focus_request_hint');
                if (raw) {
                    const hint = JSON.parse(raw);
                    const t = rankedRequests.find(r => (r.title || '').toLowerCase().includes((hint.title || '').toLowerCase()) || (r.company || '').toLowerCase() === (hint.requester || '').toLowerCase());
                    if (t) targetId = t.id;
                }
            }

            if (targetId) {
                const focusId = String(targetId);
                setFocusRequestId(focusId);
                const el = document.getElementById(`request-card-${focusId}`);
                if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
                try { localStorage.removeItem('focus_request_hint'); } catch (e) { }
                clearTimer = setTimeout(() => setFocusRequestId(null), 3500);
            }
        } catch (e) { }
        return () => {
            if (clearTimer) clearTimeout(clearTimer);
        };
    }, [rankedRequests, searchQuery]);

    const filterButtonStyle = (active) => ({
        backgroundColor: active ? 'transparent' : 'transparent',
        color: active ? 'var(--color-gold)' : '#6b7280',
        borderColor: active ? 'var(--color-gold)' : '#d1d5db',
        boxShadow: active ? '0 0 6px rgba(var(--color-gold-rgb), 0.25)' : 'none',
        textShadow: active ? '0 0 6px rgba(var(--color-gold-rgb), 0.35)' : 'none',
        transition: 'all .25s cubic-bezier(.4,0,.2,1)',
        fontWeight: active ? '600' : '500'
    });


    return (
        <div className="min-h-screen bg-gray-50 pb-32 app-container-light">
            <header
                className="sticky top-0 bg-white shadow-sm z-20 pb-2 border-b border-gray-100"
                style={{ paddingTop: 'calc(12px + env(safe-area-inset-top, 0px))', marginBottom: '4px' }}
            >
                <div className="p-4">
                    <div className="relative">
                        <Search className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                        <input
                            type="text"
                            placeholder={getTranslation('Search requests...', selectedLanguage)}
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full py-3 pl-10 pr-24 bg-gray-100 border border-gray-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-gray-300 text-gray-700 placeholder-gray-500 text-base"
                            aria-label={getTranslation('Search requests...', selectedLanguage)}
                        />
                        <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center space-x-2">
                            {searchQuery && (
                                <button
                                    onClick={() => setSearchQuery('')}
                                    aria-label="Clear search"
                                    className="p-1 rounded-full text-gray-500 hover:text-gray-800 hover:bg-gray-200 transition"
                                >
                                    <X className="w-4 h-4" />
                                </button>
                            )}
                            <button
                                onClick={() => setShowFilterDropdown(!showFilterDropdown)}
                                aria-label="Advanced filters"
                                className="p-1.5 rounded-full text-gray-500 hover:text-gray-800 hover:bg-gray-200 transition relative"
                                style={{
                                    backgroundColor: (selectedCategory !== 'All' || selectedDateRange !== 'All Time' || selectedStatus !== 'All' || selectedDate)
                                        ? 'var(--color-gold-light)'
                                        : 'transparent',
                                    color: (selectedCategory !== 'All' || selectedDateRange !== 'All Time' || selectedStatus !== 'All' || selectedDate)
                                        ? 'var(--color-gold)'
                                        : '#6b7280'
                                }}
                            >
                                <SlidersHorizontal className="w-5 h-5" />
                                {(selectedCategory !== 'All' || selectedDateRange !== 'All Time' || selectedStatus !== 'All' || selectedDate) && (
                                    <span
                                        className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full"
                                        style={{ backgroundColor: 'var(--color-gold)' }}
                                    />
                                )}
                            </button>
                            <button
                                onClick={() => {
                                    setHideClaimedRequests(!hideClaimedRequests);
                                    localStorage.setItem('hideClaimedRequests', !hideClaimedRequests);
                                }}
                                aria-label={hideClaimedRequests ? "Show claimed requests" : "Hide claimed requests"}
                                title={hideClaimedRequests ? "Show claimed requests" : "Hide claimed requests"}
                                className="p-1.5 rounded-full text-gray-500 hover:text-gray-800 hover:bg-gray-200 transition relative"
                                style={{
                                    backgroundColor: hideClaimedRequests ? 'var(--color-gold-light)' : 'transparent',
                                    color: hideClaimedRequests ? 'var(--color-gold)' : '#6b7280',
                                    ...(showHideClaimedHint && {
                                        boxShadow: '0 0 0 0 rgba(202, 138, 4, 0.7)',
                                        animation: 'pulse-hint 2s infinite'
                                    })
                                }}
                            >
                                {hideClaimedRequests ? (
                                    <EyeOff className="w-5 h-5" />
                                ) : (
                                    <Eye className="w-5 h-5" />
                                )}
                                
                                {/* Hint Popover - Positioned below, constrained within viewport */}
                                {showHideClaimedHint && (
                                    <div className="absolute top-full mt-3 right-0 w-64 max-w-[80vw] bg-white rounded-xl shadow-2xl border-2 p-4 z-50 animate-fade-in-up"
                                         style={{
                                            borderColor: 'var(--color-gold)',
                                            backgroundColor: 'var(--color-gold)',
                                         }}>
                                        {/* Arrow pointing up to button */}
                                        <div 
                                            className="absolute -top-2 right-6 w-4 h-4 rotate-45"
                                            style={{
                                                backgroundColor: 'var(--color-gold)',
                                                borderLeft: '2px solid var(--color-gold)',
                                                borderTop: '2px solid var(--color-gold)'
                                            }}
                                        />
                                        
                                        <div className="flex items-start justify-between gap-2">
                                            <div className="flex-1">
                                                <p className="text-xs font-bold text-white flex items-center gap-1">
                                                    <span>👁️</span> Hide Claimed Requests
                                                </p>
                                                <p className="text-xs text-white mt-2 leading-snug font-medium whitespace-normal break-words">
                                                    Click the eye icon to focus on available requests and hide the ones already claimed by others
                                                </p>
                                            </div>
                                            <button
                                                onClick={() => setShowHideClaimedHint(false)}
                                                className="text-white hover:text-gray-100 flex-shrink-0 mt-0.5 font-bold text-lg leading-none opacity-80 hover:opacity-100 transition"
                                                aria-label="Close hint"
                                            >
                                                ×
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </button>
                        </div>
                    </div>

                    {/* Filter Dropdown */}
                    {showFilterDropdown && (
                        <div
                            ref={filterDropdownRef}
                            className="absolute right-4 mt-2 w-72 bg-white rounded-2xl shadow-2xl border border-gray-100 z-30 overflow-hidden"
                            style={{ maxHeight: '380px' }}
                        >
                            {/* Fixed Header */}
                            <div className="flex items-center justify-between p-4 border-b border-gray-100 bg-white sticky top-0 z-10">
                                <h3 className="text-lg font-bold text-gray-800 flex items-center">
                                    <SlidersHorizontal className="w-5 h-5 mr-2" style={{ color: 'var(--color-gold)' }} />
                                    {getTranslation('Filters', selectedLanguage)}
                                </h3>
                                <button
                                    onClick={() => setShowFilterDropdown(false)}
                                    className="text-gray-500 hover:text-gray-900 p-1 rounded-full transition-colors"
                                >
                                    <X className="w-5 h-5" />
                                </button>
                            </div>

                            {/* Scrollable Content */}
                            <div className="overflow-y-auto p-4 pt-2" style={{ maxHeight: '280px' }}>
                                {/* Category Filter */}
                                <div className="mb-4">
                                    <label className="text-sm font-semibold text-gray-700 mb-2 block">{getTranslation('Category', selectedLanguage)}</label>
                                    <div className="space-y-1.5">
                                        {['All', 'Technology', 'Education', 'Entertainment', 'Documentary', 'Review'].map(cat => (
                                            <button
                                                key={cat}
                                                onClick={() => setSelectedCategory(cat)}
                                                className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-all ${selectedCategory === cat
                                                        ? 'font-semibold'
                                                        : 'text-gray-600 hover:bg-gray-50'
                                                    }`}
                                                style={{
                                                    backgroundColor: selectedCategory === cat ? 'var(--color-gold-light)' : 'transparent',
                                                    color: selectedCategory === cat ? 'var(--color-gold)' : '#4b5563'
                                                }}
                                            >
                                                {selectedCategory === cat && <CheckCircle2 className="w-4 h-4 inline mr-2" />}
                                                {getTranslation(cat, selectedLanguage)}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* Mini Calendar Date Picker */}
                                <div className="mb-4">
                                    <label className="text-sm font-semibold text-gray-700 mb-2 block flex items-center justify-between">
                                        <span className="flex items-center">
                                            <Calendar className="w-4 h-4 mr-1.5" />
                                            {getTranslation('Date', selectedLanguage)}
                                        </span>
                                        {selectedDate && (
                                            <button
                                                onClick={() => setSelectedDate(null)}
                                                className="text-xs text-gray-500 hover:text-gray-700"
                                            >
                                                {getTranslation('Clear', selectedLanguage)}
                                            </button>
                                        )}
                                    </label>

                                    {/* Mini Calendar */}
                                    <div className="bg-gray-50 rounded-lg p-2">
                                        {(() => {
                                            const today = new Date();
                                            const firstDay = new Date(calendarYear, calendarMonth, 1);
                                            const lastDay = new Date(calendarYear, calendarMonth + 1, 0);
                                            const daysInMonth = lastDay.getDate();
                                            const startingDayOfWeek = firstDay.getDay();

                                            const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
                                            const dayNames = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

                                            const days = [];
                                            for (let i = 0; i < startingDayOfWeek; i++) {
                                                days.push(null);
                                            }
                                            for (let i = 1; i <= daysInMonth; i++) {
                                                days.push(i);
                                            }

                                            const goToPreviousMonth = () => {
                                                if (calendarMonth === 0) {
                                                    setCalendarMonth(11);
                                                    setCalendarYear(calendarYear - 1);
                                                } else {
                                                    setCalendarMonth(calendarMonth - 1);
                                                }
                                            };

                                            const goToNextMonth = () => {
                                                if (calendarMonth === 11) {
                                                    setCalendarMonth(0);
                                                    setCalendarYear(calendarYear + 1);
                                                } else {
                                                    setCalendarMonth(calendarMonth + 1);
                                                }
                                            };

                                            return (
                                                <>
                                                    <div className="flex items-center justify-between mb-2">
                                                        <button
                                                            onClick={goToPreviousMonth}
                                                            className="p-1 hover:bg-gray-200 rounded transition-colors"
                                                            aria-label="Previous month"
                                                        >
                                                            <ChevronDown className="w-4 h-4 transform rotate-90" />
                                                        </button>
                                                        <button
                                                            onClick={() => setShowMonthYearPicker(!showMonthYearPicker)}
                                                            className="text-center font-bold text-xs text-gray-700 hover:bg-gray-200 px-3 py-1 rounded transition-colors"
                                                        >
                                                            {getTranslation(monthNames[calendarMonth], selectedLanguage)} {calendarYear}
                                                        </button>
                                                        <button
                                                            onClick={goToNextMonth}
                                                            className="p-1 hover:bg-gray-200 rounded transition-colors"
                                                            aria-label="Next month"
                                                        >
                                                            <ChevronDown className="w-4 h-4 transform -rotate-90" />
                                                        </button>
                                                    </div>

                                                    {/* Month/Year Picker Dropdown */}
                                                    {showMonthYearPicker && (
                                                        <div className="mb-3 bg-white rounded-lg p-3 shadow-lg border border-gray-200">
                                                            <div className="mb-3">
                                                                <label className="text-xs font-semibold text-gray-600 mb-1 block">{getTranslation('Month', selectedLanguage)}</label>
                                                                <div className="grid grid-cols-4 gap-1">
                                                                    {monthNames.map((month, index) => (
                                                                        <button
                                                                            key={index}
                                                                            onClick={() => {
                                                                                setCalendarMonth(index);
                                                                                setShowMonthYearPicker(false);
                                                                            }}
                                                                            className={`px-2 py-1.5 text-xs rounded transition-all ${calendarMonth === index
                                                                                    ? 'font-bold shadow-sm'
                                                                                    : 'hover:bg-gray-100'
                                                                                }`}
                                                                            style={{
                                                                                backgroundColor: calendarMonth === index ? 'var(--color-gold)' : 'transparent',
                                                                                color: calendarMonth === index ? 'white' : '#374151'
                                                                            }}
                                                                        >
                                                                            {getTranslation(month, selectedLanguage)}
                                                                        </button>
                                                                    ))}
                                                                </div>
                                                            </div>

                                                            <div>
                                                                <label className="text-xs font-semibold text-gray-600 mb-1 block">{getTranslation('Year', selectedLanguage)}</label>
                                                                <div className="grid grid-cols-3 gap-1 max-h-32 overflow-y-auto">
                                                                    {(() => {
                                                                        const currentYear = new Date().getFullYear();
                                                                        const years = [];
                                                                        for (let y = currentYear + 5; y >= currentYear - 10; y--) {
                                                                            years.push(y);
                                                                        }
                                                                        return years.map(year => (
                                                                            <button
                                                                                key={year}
                                                                                onClick={() => {
                                                                                    setCalendarYear(year);
                                                                                    setShowMonthYearPicker(false);
                                                                                }}
                                                                                className={`px-2 py-1.5 text-xs rounded transition-all ${calendarYear === year
                                                                                        ? 'font-bold shadow-sm'
                                                                                        : 'hover:bg-gray-100'
                                                                                    }`}
                                                                                style={{
                                                                                    backgroundColor: calendarYear === year ? 'var(--color-gold)' : 'transparent',
                                                                                    color: calendarYear === year ? 'white' : '#374151'
                                                                                }}
                                                                            >
                                                                                {year}
                                                                            </button>
                                                                        ));
                                                                    })()}
                                                                </div>
                                                            </div>
                                                        </div>
                                                    )}
                                                    <div className="grid grid-cols-7 gap-1 mb-1">
                                                        {dayNames.map((day, i) => (
                                                            <div key={i} className="text-center text-xs font-semibold text-gray-500 bg-white rounded-md py-1">
                                                                {day}
                                                            </div>
                                                        ))}
                                                    </div>
                                                    <div className="grid grid-cols-7 gap-1">
                                                        {days.map((day, i) => {
                                                            if (day === null) {
                                                                return <div key={i} />;
                                                            }

                                                            const dayDate = new Date(calendarYear, calendarMonth, day);
                                                            const isSelected = selectedDate && new Date(selectedDate).toDateString() === dayDate.toDateString();
                                                            const isToday = today.toDateString() === dayDate.toDateString();

                                                            return (
                                                                <button
                                                                    key={i}
                                                                    onClick={() => {
                                                                        setSelectedDate(dayDate.toISOString());
                                                                        setSelectedDateRange('All Time'); // Clear range when specific date selected
                                                                    }}
                                                                    className={`
                                                                        aspect-square flex items-center justify-center text-xs rounded-md transition-all
                                                                        ${isSelected ? 'font-bold shadow-sm' : 'hover:bg-gray-200'}
                                                                        ${isToday && !isSelected ? 'ring-1 ring-gray-400' : ''}
                                                                    `}
                                                                    style={{
                                                                        backgroundColor: isSelected ? 'var(--color-gold)' : 'transparent',
                                                                        color: isSelected ? 'white' : '#374151'
                                                                    }}
                                                                >
                                                                    {day}
                                                                </button>
                                                            );
                                                        })}
                                                    </div>
                                                </>
                                            );
                                        })()}
                                    </div>
                                </div>

                                {/* Status Filter */}
                                <div className="mb-2">
                                    <label className="text-sm font-semibold text-gray-700 mb-2 block">{getTranslation('Status', selectedLanguage)}</label>
                                    <div className="space-y-1.5">
                                        {['All', 'Active', 'Completed'].map(status => (
                                            <button
                                                key={status}
                                                onClick={() => setSelectedStatus(status)}
                                                className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-all ${selectedStatus === status
                                                        ? 'font-semibold'
                                                        : 'text-gray-600 hover:bg-gray-50'
                                                    }`}
                                                style={{
                                                    backgroundColor: selectedStatus === status ? 'var(--color-gold-light)' : 'transparent',
                                                    color: selectedStatus === status ? 'var(--color-gold)' : '#4b5563'
                                                }}
                                            >
                                                {selectedStatus === status && <CheckCircle2 className="w-4 h-4 inline mr-2" />}
                                                {getTranslation(status, selectedLanguage)}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            {/* Fixed Footer with Clear Button */}
                            {(selectedCategory !== 'All' || selectedDate || selectedStatus !== 'All') && (
                                <div className="p-4 pt-3 border-t border-gray-100 bg-white sticky bottom-0">
                                    <button
                                        onClick={() => {
                                            setSelectedCategory('All');
                                            setSelectedDateRange('All Time');
                                            setSelectedStatus('All');
                                            setSelectedDate(null);
                                        }}
                                        className="w-full py-2.5 rounded-lg text-sm font-semibold transition-all hover:opacity-90"
                                        style={{ backgroundColor: 'var(--color-gold)', color: 'white' }}
                                    >
                                        {getTranslation('Clear All Filters', selectedLanguage)}
                                    </button>
                                </div>
                            )}
                        </div>
                    )}

                    <div className="mt-2">
                        {searchQuery.trim() ? (
                            <p className="text-xs text-gray-500">
                                Showing {displayedRequests.length} of {rankedRequests.length} "{activeFilter}" results for "<span className="font-medium">{searchQuery.trim()}</span>"
                            </p>
                        ) : (
                            <p className="text-xs text-gray-400">
                                {rankedRequests.length} {getTranslation(activeFilter, selectedLanguage)} {getTranslation('requests', selectedLanguage).toLowerCase()}
                            </p>
                        )}
                    </div>
                </div>
                <div className="flex overflow-x-scroll no-scrollbar px-4 space-x-2 pb-2">
                    {filters.map(({ name, Icon }) => {
                        const isActive = name === activeFilter;
                        return (
                            <button
                                key={name}
                                style={filterButtonStyle(isActive)}
                                className={`
                                    flex items-center px-4 py-2 text-sm font-medium rounded-full
                                    border whitespace-nowrap
                                    ${!isActive ? 'hover:bg-gray-100' : ''}
                                    active:scale-[.96]
                                `}
                                onClick={() => setActiveFilter(name)}
                                onTouchEnd={() => setActiveFilter(name)}
                                aria-pressed={isActive}
                                aria-label={`Filter: ${name}`}
                            >
                                <Icon className="w-4 h-4 mr-1.5" />
                                {getTranslation(name, selectedLanguage)}
                            </button>
                        );
                    })}
                </div>
            </header>
            {showSwipeEntrance && (
                <div className="fixed inset-0 z-[999] flex items-center justify-center px-4">
                    <div className="absolute inset-0 bg-black/60" onClick={dismissSwipeEntrance} />
                    <div className="relative max-w-sm w-[90%] mx-auto">
                        <style>{`
                            @keyframes swipeLeftMove { 
                                0% { transform: translateX(24px) scale(1); opacity: 1; }
                                60% { transform: translateX(-18px) scale(.98); opacity: .95; }
                                100% { transform: translateX(-56px) scale(.94); opacity: 0; }
                            }
                            .swipe-hand { animation: swipeLeftMove 1.2s ease-in-out infinite; }
                        `}</style>
                        <div className="bg-white rounded-2xl p-6 text-center shadow-2xl">
                            <div className="flex items-center justify-center mb-4">
                                <div className="h-14 w-14 rounded-lg bg-gray-100 flex items-center justify-center mr-3 swipe-hand" aria-hidden>
                                    <div style={{ width: 20, height: 20, borderRadius: 4, background: '#111827' }} />
                                </div>
                                <svg className="w-10 h-10 text-gray-400" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
                                    <path d="M17 12H7" stroke="#9CA3AF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                    <path d="M10 8l-4 4 4 4" stroke="#9CA3AF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                </svg>
                            </div>
                            <h3 className="text-lg font-bold text-gray-900 mb-2">{getTranslation('Swipe left to remove a request', selectedLanguage)}</h3>
                            <p className="text-sm text-gray-600 mb-4">{getTranslation('A left swipe clears the request from your feed. Bookmark it if you want to revisit it anytime.', selectedLanguage)}</p>
                            <div className="flex justify-center">
                                <button
                                    onClick={dismissSwipeEntrance}
                                    className="px-4 py-2 bg-gray-100 rounded-full font-semibold hover:bg-gray-200"
                                    style={{ color: 'var(--color-gold)' }}
                                >
                                    {getTranslation('Got it', selectedLanguage)}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
            <main className="px-2 pt-4 max-w-lg mx-auto w-full">
                {displayedRequests.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-16 text-center">
                        <Search className="w-10 h-10 text-gray-300 mb-4" />
                        <p className="text-sm font-semibold text-gray-700">{getTranslation('No matches found', selectedLanguage)}</p>
                        <p className="text-xs text-gray-500 mt-1">
                            {getTranslation('Try a different keyword or switch filters.', selectedLanguage)}
                        </p>
                    </div>
                ) : (


                    displayedRequests.map(req => (
                        <div key={req.id} data-request-id={req.id}>
                            <RequestCard
                                key={req.id}
                                request={req}
                                detailedRank={req}
                                searchQuery={searchQuery}
                                isPinned={!!req.pinned}
                                onTogglePin={() => togglePin(req.id)}
                                pulseActive={pulseId === req.id}
                                isFocused={focusRequestId && String(req.id) === String(focusRequestId)}
                                onOpenProfile={handleOpenProfile}
                                selectedLanguage={selectedLanguage}
                                initialBookmarked={bookmarkedReqSet.has(String(req.id))}
                                adminSelections={adminSelections}
                                onBookmarkChange={(id, next) => {
                                    setBookmarkedReqSet(prev => {
                                        const copy = new Set(Array.from(prev));
                                        if (next) copy.add(String(id)); else copy.delete(String(id));
                                        return copy;
                                    });
                                }}
                            />
                        </div>
                    ))
                )}
            </main>
            {showNudgeModal && nudgeRequest && (
                <RequestNudgeModal
                    nudgeRequest={nudgeRequest}
                    onClose={() => setShowNudgeModal(false)}
                    onBoostRequest={() => {
                        setShowNudgeModal(false);
                        setShowBoostsModal(true);
                    }}
                    onInviteFriends={() => {
                        setShowNudgeModal(false);
                        // Navigate to requests page or show invite UI
                        window.location.href = '/requests?filter=For You';
                    }}
                    selectedLanguage={selectedLanguage}
                />
            )}
            <SharedBottomBar selectedLanguage={selectedLanguage} activeTabOverride="Requests" />
            <Toast
                message={pinToast.message}
                isVisible={pinToast.visible}
                onClose={() => setPinToast({ visible: false, message: '' })}
                variant="success"
                selectedLanguage={selectedLanguage}
            />
            {isProfileOpen && (
                <ProfileDialog
                    name={profileUser}
                    username={profileUser}
                    isCreator={profileIsCreator}
                    onClose={handleCloseProfile}
                    profileData={profileData}
                    selectedLanguage={selectedLanguage}
                    onNavigateToIdeas={handleNavigateToIdeas}
                />
            )}
        </div>
    );
};


