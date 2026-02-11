/* eslint-disable no-empty */
import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Home, FileText, File as FileIcon, Pencil, MoreHorizontal, MoreVertical, Pin, Star, TrendingUp, Trophy, User, Zap, Video, Clock, BarChart, Upload, Lightbulb, Headphones, Copy, LineChart, CheckCircle, Search, Globe, Link2, Image, Lock, Link, Eye, ChevronDown, ChevronUp, AlertCircle } from 'lucide-react';
import RequestsFeed from './requests.jsx';
import VideoOverlayEditor from './VideoOverlayEditor.jsx';
import FeedbackModal from './FeedbackModal.jsx'; // Feedback Modal
import SharedBottomBar from './components/SharedBottomBar.jsx';
import { useAuth } from './AuthContext.jsx';
import { getTranslation, translations } from './translations.js';
import { WEB_URL } from './config.js';

// No per-page CSS vars here — let the page inherit the global :root variables
const customStyle = {};

// Utility style for clamping long titles to 2 lines (copied from `home.jsx`)
const clamp2 = {
    display: '-webkit-box',
    WebkitLineClamp: 2,
    WebkitBoxOrient: 'vertical',
    overflow: 'hidden'
};

// Composed User+Star icon for a premium header mark. This composes the
// existing lucide `User` icon with a small filled star so we don't rely on a
// non-existent export from the lucide package and avoid reference-order bugs.
const UserStar = ({ size = 24, className = '', ...props }) => {
    const starSize = Math.round(size * 0.5);
    return (
        <span style={{ position: 'relative', display: 'inline-block', width: size, height: size }}>
            <User size={size} className={className} {...props} />
            <span
                style={{
                    position: 'absolute',
                    right: -2,
                    bottom: -2,
                    width: starSize,
                    height: starSize,
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    pointerEvents: 'none'
                }}
            >
                <svg
                    width={starSize}
                    height={starSize}
                    viewBox="0 0 24 24"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                    aria-hidden
                >
                    <path
                        d="M12 17.27L18.18 21l-1.63-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.45 4.73L5.82 21z"
                        fill="var(--color-gold)"
                    />
                </svg>
            </span>
        </span>
    );
};

// Composed double-check icon for the Claimed Requests tab
const CheckCheck = ({ size = 20, className = '', strokeWidth = 2, ...props }) => {
    const checkSize = size;
    const small = Math.round(checkSize * 0.55);
    return (
        <span style={{ position: 'relative', display: 'inline-block', width: checkSize, height: checkSize }} className={className} {...props}>
            <svg width={checkSize} height={checkSize} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
                <path d="M20 6L9 17l-5-5" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            <span style={{ position: 'absolute', right: -2, bottom: -2, width: small, height: small, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', pointerEvents: 'none' }}>
                <svg width={small} height={small} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
                    <path d="M20 6L9 17l-5-5" stroke="currentColor" strokeWidth={Math.max(1, Math.round(strokeWidth - 0.5))} strokeLinecap="round" strokeLinejoin="round" />
                </svg>
            </span>
        </span>
    );
};

// Reusable Toast component with smooth entry/exit, white background and
// a green circular check icon to match the standard toaster look.
const Toast = ({ message, duration = 2000, bottom = true }) => {
    const [visible, setVisible] = useState(Boolean(message));
    const [exiting, setExiting] = useState(false);
    const [swipeOffset, setSwipeOffset] = useState(0);
    const dragStartX = useRef(0);
    const toastRef = useRef(null);

    useEffect(() => {
        let hideTimer = null;
        if (message) {
            setVisible(true);
            setExiting(false);
            hideTimer = setTimeout(() => setExiting(true), duration);
        } else {
            if (visible) setExiting(true);
        }
        return () => { if (hideTimer) clearTimeout(hideTimer); };
    }, [message, duration]);

    useEffect(() => {
        if (exiting) {
            const t = setTimeout(() => setVisible(false), 260);
            return () => clearTimeout(t);
        }
        return undefined;
    }, [exiting]);

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
            setExiting(true);
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
            setExiting(true);
        } else {
            setSwipeOffset(0);
        }
        dragStartX.current = 0;
        if (toastRef.current) toastRef.current.style.cursor = 'grab';
    };

    if (!visible) return null;

    const positionClass = bottom
        ? 'bottom-6 left-1/2 transform -translate-x-1/2'
        : 'top-1/2 left-1/2';

    return (
        <div className={`fixed ${positionClass} z-50 pointer-events-auto ${exiting ? 'toast-exit' : 'toast-enter'}`} style={!bottom ? { transform: 'translate(-50%, -50%)' } : {}}>
            <style>{`
                /* Bottom toast: slide up/out */
                @keyframes toastInUp { from { transform: translateY(14px) scale(0.98); opacity: 0 } to { transform: translateY(0) scale(1); opacity: 1 } }
                @keyframes toastOutDown { from { transform: translateY(0) scale(1); opacity: 1 } to { transform: translateY(12px) scale(0.98); opacity: 0 } }
                /* Center toast: scale/fade */
                @keyframes toastInCenter { from { transform: scale(0.96); opacity: 0 } to { transform: scale(1); opacity: 1 } }
                @keyframes toastOutCenter { from { transform: scale(1); opacity: 1 } to { transform: scale(0.96); opacity: 0 } }
                /* Top slide down animation */
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

                .toast-enter { animation: ${bottom ? 'toastInUp 280ms cubic-bezier(.2,.8,.2,1) both' : 'toastSlideDown 400ms cubic-bezier(.16,1,.3,1) both'}; }
                .toast-exit { animation: ${bottom ? 'toastOutDown 220ms cubic-bezier(.2,.8,.2,1) both' : 'toastOutCenter 180ms cubic-bezier(.2,.8,.2,1) both'}; }
            `}</style>

            <div
                ref={toastRef}
                className="bg-white text-sm px-4 py-2 rounded-md shadow-lg flex items-center gap-3 cursor-grab select-none"
                style={{
                    minWidth: 220,
                    transform: `translateX(${swipeOffset}px)`,
                    transition: swipeOffset === 0 ? 'transform 0.3s ease-out' : 'none'
                }}
                onTouchStart={handleTouchStart}
                onTouchMove={handleTouchMove}
                onTouchEnd={handleTouchEnd}
                onMouseDown={handleMouseDown}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                onMouseLeave={handleMouseUp}
            >
                <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ background: '#10B981', flex: '0 0 auto' }}>
                    <svg width="16" height="12" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
                        <path d="M20 6L9 17l-5-5" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                </div>
                <div className="text-gray-900">{message}</div>
            </div>
        </div>
    );
};

// RequestDetailsModal - Beautiful modal displaying all request metadata
const RequestDetailsModal = ({ isOpen, onClose, requestData = {}, selectedLanguage = 'English' }) => {
    if (!isOpen || !requestData) return null;

    const meta = requestData.meta || {};

    // Render label + value pair (always shows, with placeholder if empty)
    const DetailField = ({ label, value, icon: Icon = null }) => {
        let displayValue = null;
        
        if (Array.isArray(value)) {
            displayValue = value.length > 0 ? value.join(', ') : getTranslation('Not provided', selectedLanguage);
        } else if (typeof value === 'object' && value !== null) {
            displayValue = JSON.stringify(value);
        } else if (value !== undefined && value !== null && value !== '') {
            displayValue = String(value);
        } else {
            displayValue = getTranslation('Not provided', selectedLanguage);
        }

        return (
            <div className="flex items-start gap-3 pb-4 border-b border-gray-200 last:border-b-0">
                {Icon && <Icon size={18} className="text-blue-500 mt-0.5 flex-shrink-0" />}
                <div className="flex-1">
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">{label}</p>
                    <p className={`text-sm leading-relaxed break-words ${!displayValue || displayValue === getTranslation('Not provided', selectedLanguage) ? 'text-gray-400 italic' : 'text-gray-800'}`}>
                        {displayValue}
                    </p>
                </div>
            </div>
        );
    };

    return (
        <>
            {/* Backdrop */}
            <div 
                className="fixed inset-0 bg-black/40 z-[60]"
                onClick={onClose}
                style={{ animation: 'fadeIn 280ms ease-out' }}
            />
            {/* Modal */}
            <div 
                className="fixed inset-0 z-[70] flex items-end sm:items-center justify-center"
                style={{ padding: '16px', paddingBottom: 'calc(16px + env(safe-area-inset-bottom, 0px))' }}
                onClick={(e) => e.target === e.currentTarget && onClose()}
            >
                <div 
                    className="bg-white rounded-xl shadow-xl w-full max-w-lg overflow-y-auto"
                    style={{ animation: 'slideUp 300ms cubic-bezier(0.16, 1, 0.3, 1)', maxHeight: 'calc(90vh - env(safe-area-inset-bottom, 0px))' }}
                >
                    <style>{`
                        @keyframes fadeIn { from { opacity: 0 } to { opacity: 1 } }
                        @keyframes slideUp { from { transform: translateY(30px); opacity: 0 } to { transform: translateY(0); opacity: 1 } }
                    `}</style>

                    {/* Header */}
                    <div className="sticky top-0 bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-blue-100 px-6 py-4 flex items-center justify-between">
                        <h2 className="text-lg font-bold text-gray-900">{getTranslation('Request Details', selectedLanguage)}</h2>
                        <button
                            onClick={onClose}
                            className="p-1 hover:bg-white rounded-lg transition text-gray-400 hover:text-gray-600"
                        >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>

                    {/* Content */}
                    <div className="p-6 space-y-6">
                        {/* Basic Info */}
                        <div>
                            <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wide mb-3 flex items-center gap-2">
                                <span className="w-1 h-1 bg-blue-500 rounded-full"></span>
                                {getTranslation('Basic Information', selectedLanguage)}
                            </h3>
                            <div className="space-y-3 pl-5">
                                <DetailField label={getTranslation('Title', selectedLanguage)} value={requestData.title} />
                                <DetailField label={getTranslation('Description', selectedLanguage)} value={requestData.description} />
                                <DetailField label={getTranslation('Requester', selectedLanguage)} value={requestData.requesterName || requestData.creator?.name} />
                            </div>
                        </div>

                        {/* Video Preferences */}
                        <div>
                            <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wide mb-3 flex items-center gap-2">
                                <span className="w-1 h-1 bg-purple-500 rounded-full"></span>
                                {getTranslation('Video Preferences', selectedLanguage)}
                            </h3>
                            <div className="space-y-3 pl-5">
                                <DetailField label={getTranslation('Video Length', selectedLanguage)} value={meta.selectedVideoLength} />
                                <DetailField label={getTranslation('Custom Length', selectedLanguage)} value={meta.customVideoLength} />
                                <DetailField label={getTranslation('Tones', selectedLanguage)} value={meta.selectedTones} />
                                <DetailField label={getTranslation('Styles', selectedLanguage)} value={meta.selectedStyles} />
                            </div>
                        </div>

                        {/* Delivery & Frequency */}
                        <div>
                            <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wide mb-3 flex items-center gap-2">
                                <span className="w-1 h-1 bg-green-500 rounded-full"></span>
                                {getTranslation('Delivery Schedule', selectedLanguage)}
                            </h3>
                            <div className="space-y-3 pl-5">
                                <DetailField label={getTranslation('Delivery Type', selectedLanguage)} value={meta.selectedDeliveryType} />
                                <DetailField label={getTranslation('Frequency', selectedLanguage)} value={meta.selectedFrequency} />
                                <DetailField label={getTranslation('Release Schedule', selectedLanguage)} value={meta.selectedReleaseSchedule} />
                                <DetailField label={getTranslation('Custom Dates', selectedLanguage)} value={meta.customRecurrentDates} />
                                <DetailField label={getTranslation('Series Dates', selectedLanguage)} value={meta.customSeriesDates} />
                            </div>
                        </div>

                        {/* Series/Episodes */}
                        <div>
                            <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wide mb-3 flex items-center gap-2">
                                <span className="w-1 h-1 bg-red-500 rounded-full"></span>
                                {getTranslation('Series Information', selectedLanguage)}
                            </h3>
                            <div className="space-y-3 pl-5">
                                <DetailField label={getTranslation('Number of Episodes', selectedLanguage)} value={meta.numberOfEpisodes} />
                                <DetailField label={getTranslation('Target Videos', selectedLanguage)} value={meta.targetVideos} />
                            </div>
                        </div>

                        {/* Content & Themes */}
                        <div>
                            <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wide mb-3 flex items-center gap-2">
                                <span className="w-1 h-1 bg-yellow-500 rounded-full"></span>
                                {getTranslation('Content & Privacy', selectedLanguage)}
                            </h3>
                            <div className="space-y-3 pl-5">
                                <DetailField label={getTranslation('Themes', selectedLanguage)} value={meta.themes} />
                                <DetailField label={getTranslation('Privacy', selectedLanguage)} value={meta.selectedPrivacy} />
                            </div>
                        </div>

                        {/* Creator & Expert */}
                        <div>
                            <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wide mb-3 flex items-center gap-2">
                                <span className="w-1 h-1 bg-indigo-500 rounded-full"></span>
                                {getTranslation('Creator Preferences', selectedLanguage)}
                            </h3>
                            <div className="space-y-3 pl-5">
                                <DetailField label={getTranslation('Selected Creator', selectedLanguage)} value={meta.selectedCreator} />
                                <DetailField label={getTranslation('Creator Type', selectedLanguage)} value={meta.creatorSelectionType} />
                                <DetailField label={getTranslation('Expert Type', selectedLanguage)} value={meta.expertType} />
                            </div>
                        </div>

                        {/* Budget & Files */}
                        <div>
                            <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wide mb-3 flex items-center gap-2">
                                <span className="w-1 h-1 bg-orange-500 rounded-full"></span>
                                {getTranslation('Budget & Resources', selectedLanguage)}
                            </h3>
                            <div className="space-y-3 pl-5">
                                <DetailField 
                                    label={getTranslation('Custom Price', selectedLanguage)} 
                                    value={meta.customPrice ? `$${meta.customPrice}` : null} 
                                />
                                <DetailField 
                                    label={getTranslation('Uploaded Files', selectedLanguage)} 
                                    value={
                                        meta.uploadedFiles && Array.isArray(meta.uploadedFiles) && meta.uploadedFiles.length > 0 
                                            ? `${meta.uploadedFiles.length} ${getTranslation('file(s)', selectedLanguage)}`
                                            : null
                                    } 
                                />
                                <DetailField label={getTranslation('Reference Links', selectedLanguage)} value={meta.referenceLinks} />
                            </div>
                        </div>
                    </div>

                    {/* Footer */}
                    <div className="sticky bottom-0 bg-gray-50 border-t border-gray-200 px-6 py-4">
                        <button
                            onClick={onClose}
                            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 rounded-lg transition"
                        >
                            {getTranslation('Close', selectedLanguage)}
                        </button>
                    </div>
                </div>
            </div>
        </>
    );
};

const ClaimStatusPanel = ({
    title = 'A night tour of taipei',
    requesterName = 'AllVater',
    requesterRole = getTranslation('Requester', (typeof window !== 'undefined' ? localStorage.getItem('regaarder_language') : 'English') || 'English'),
    requesterAvatar = null,
    currentStep = 1,
    requestId = null,
    requestData = null,
    onClose = () => { },
    onUpdateProgress = () => { },
    onUnclaim = () => { },
    pendingReuploadItem = null,
    clearPendingReupload = () => { },
    isProCreator = false,
}) => {
    const [showModal, setShowModal] = useState(false);
    const [isCollapsed, setIsCollapsed] = useState(false);
    const [showUnclaimModal, setShowUnclaimModal] = useState(false);
    const [showDetailsModal, setShowDetailsModal] = useState(false);
    const [showDetailsHint, setShowDetailsHint] = useState(false);
    const [detailsHintCount, setDetailsHintCount] = useState(() => {
        try {
            return parseInt(localStorage.getItem('detailsHintCount') || '0', 10);
        } catch (e) {
            return 0;
        }
    });
    const [message, setMessage] = useState('');
    const [videoFile, setVideoFile] = useState(null);
    const [videoPreview, setVideoPreview] = useState(null);
    const [thumbnailFile, setThumbnailFile] = useState(null);
    const [thumbnailPreview, setThumbnailPreview] = useState(null);
    const [uploading, setUploading] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(0);
    const [validationError, setValidationError] = useState('');
    const [linkCopied, setLinkCopied] = useState(false);
    const [toastMessage, setToastMessage] = useState('');
    const [selectedLanguage, setSelectedLanguage] = useState(() => (typeof window !== 'undefined' ? localStorage.getItem('regaarder_language') : 'English') || 'English');
    const { user: authUser } = useAuth(); // For accent color in category dropdown

    useEffect(() => {
        const handleStorage = () => {
            const lang = localStorage.getItem('regaarder_language') || 'English';
            setSelectedLanguage(lang);
        };
        window.addEventListener('storage', handleStorage);
        return () => window.removeEventListener('storage', handleStorage);
    }, []);

    // Initialize Details button hint visibility (show only for first 2 views)
    useEffect(() => {
        try {
            const count = parseInt(localStorage.getItem('detailsHintCount') || '0', 10);
            if (count < 2) {
                setShowDetailsHint(true);
                const newCount = count + 1;
                setDetailsHintCount(newCount);
                localStorage.setItem('detailsHintCount', String(newCount));
            }
        } catch (e) { }
    }, []);
    
    // Format state and definitions for video uploads
    const [videoFormat, setVideoFormat] = useState('one-time');
    const formats = [
        { key: 'one-time', label: getTranslation('One-Time', selectedLanguage), fullLabel: getTranslation('One-Time Video', selectedLanguage), desc: getTranslation('Single video delivery', selectedLanguage), icon: '🎬' },
        { key: 'recurrent', label: getTranslation('Recurrent', selectedLanguage), desc: getTranslation('Ongoing video series', selectedLanguage), icon: '🔁' },
        { key: 'series', label: getTranslation('Series', selectedLanguage), desc: getTranslation('Fixed episode count', selectedLanguage), icon: '🎞️' },
        { key: 'catalogue', label: getTranslation('Catalogue', selectedLanguage), desc: getTranslation('Collection of videos', selectedLanguage), icon: '📁' },
    ];
    const [formatOpen, setFormatOpen] = useState(false);
    const formatRef = useRef(null);
    
    const selectedFormat = formats.find(f => f.key === videoFormat) || formats[0];

    // Category states
    const [category, setCategory] = useState('');
    const [categoryOpen, setCategoryOpen] = useState(false);
    const [isAddingCategory, setIsAddingCategory] = useState(false);
    const [newCategoryName, setNewCategoryName] = useState('');
    const [categories, setCategories] = useState(['Travel', 'Education', 'Entertainment', 'Music', 'Sports']); // Default fallback
    const categoryRef = useRef(null);

    // Fetch categories from backend
    const fetchCategories = useCallback(async () => {
        try {
            const BACKEND = (window && window.__BACKEND_URL__) || import.meta.env.VITE_BACKEND_URL || import.meta.env.VITE_BACKEND || 'https://pwin.onrender.com';
            const res = await fetch(`${BACKEND}/categories`);
            if (res.ok) {
                const data = await res.json();
                console.log('Fetched categories:', data);
                if (Array.isArray(data) && data.length > 0) {
                    setCategories(data);
                    return;
                }
            }
            // Fallback defaults if empty
            setCategories(['Travel', 'Education', 'Entertainment', 'Music', 'Sports']);
        } catch (err) {
            console.error("Error fetching categories:", err);
            setCategories(['Travel', 'Education', 'Entertainment', 'Music', 'Sports']);
        }
    }, []);

    // Fetch on mount
    useEffect(() => {
        fetchCategories();
    }, [fetchCategories]);

    // Also refetch when dropdown opens (to get any newly added categories)
    useEffect(() => {
        if (categoryOpen && !isAddingCategory) {
            fetchCategories();
        }
    }, [categoryOpen, isAddingCategory, fetchCategories]);
    
    const handleSaveNewCategory = async () => {
        if (!newCategoryName.trim()) {
            setIsAddingCategory(false);
            return;
        }

        try {
            const raw = newCategoryName.trim();
            const BACKEND = (window && window.__BACKEND_URL__) || import.meta.env.VITE_BACKEND_URL || import.meta.env.VITE_BACKEND || 'https://pwin.onrender.com';
            const res = await fetch(`${BACKEND}/categories`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ category: raw })
            });
            
            if (res.ok) {
                const updatedList = await res.json();
                setCategories(updatedList);
                setCategory(raw); // Select the newly created category
                // Keep dropdown open so user can see the new category in the list
                setIsAddingCategory(false);
                setNewCategoryName('');
                // Don't close dropdown - let user see the updated list
                return;
            }
        } catch (e) {
            console.error("Failed to save category", e);
        }

        setNewCategoryName('');
        setIsAddingCategory(false);
        setCategoryOpen(false);
    };

    const handleCategorySelect = (c) => {
        setCategory(c);
        setCategoryOpen(false);
    };

    const [scriptOpen, setScriptOpen] = useState(false);
    const scriptRef = useRef(null);
    
    // Video upload and editing states for this claim panel
    const [videoTitle, setVideoTitle] = useState(title || '');
    const [appearance, setAppearance] = useState('public');
    const [scriptType, setScriptType] = useState('');
    const scriptTypes = ['Narration', 'Interview', 'Vlog', 'Explainer', 'Other'];
    const [scriptFile, setScriptFile] = useState(null);
    const [scriptOther, setScriptOther] = useState('');
    const scriptInputRef = useRef(null);
    const [changeNote, setChangeNote] = useState('');
    const [isReuploading, setIsReuploading] = useState(false);
    const [publishStep, setPublishStep] = useState('form');
    const [previewData, setPreviewData] = useState(null);

    // YouTube link states for video and thumbnail
    const [videoLinkMode, setVideoLinkMode] = useState(!isProCreator); // Default starter creators to link mode
    const [videoLinkUrl, setVideoLinkUrl] = useState('');
    const [thumbnailLinkMode, setThumbnailLinkMode] = useState(false);
    const [thumbnailLinkUrl, setThumbnailLinkUrl] = useState('');
    const [videoLinkDuration, setVideoLinkDuration] = useState('');
    const [showUpgradeModal, setShowUpgradeModal] = useState(false);

    // Status steps for the claim workflow (used to render the tracker and labels)
    const steps = [
        'Request Received',
        'Under Review',
        'In Production',
        'Preview Ready',
        'Published',
        'Completed'
    ];
    const [finished, setFinished] = useState(false);
    const [celebrate, setCelebrate] = useState(false);

    const videoInputRef = useRef(null);
    const thumbInputRef = useRef(null);

    // Thumbnail adjust state and refs
    const [showAdjustModal, setShowAdjustModal] = useState(false);
    const [adjustScale, setAdjustScale] = useState(1);
    const [adjustPos, setAdjustPos] = useState({ x: 0, y: 0 });
    const adjustContainerRef = useRef(null);
    const adjustImageRef = useRef(null);
    const draggingRef = useRef(false);
    const dragStartRef = useRef({ x: 0, y: 0 });
    const pinchRef = useRef({ initialDist: null, initialScale: 1 });
    const zoomIntervalRef = useRef(null);
    // Track how many times a video has been published for this request
    const [publishedCount, setPublishedCount] = useState(0);
    const [publishedItems, setPublishedItems] = useState([]);
    const [privateLink, setPrivateLink] = useState('');
    const [showPrivateLinkModal, setShowPrivateLinkModal] = useState(false);
    // Load persisted published items (if any) so Published tab reflects prior publishes
    useEffect(() => {
        try {
            const raw = (typeof localStorage !== 'undefined') && localStorage.getItem('publishedItems');
            if (raw) {
                const arr = JSON.parse(raw);
                if (Array.isArray(arr)) setPublishedItems(arr);
            }
        } catch (e) {
            // ignore parse errors
        }
    }, []);

    // Persist published items to localStorage so other UI (Published tab) can read them
    useEffect(() => {
        try {
            if (typeof localStorage !== 'undefined') {
                localStorage.setItem('publishedItems', JSON.stringify(publishedItems || []));
            }
        } catch (e) {
            // ignore storage errors
        }
    }, [publishedItems]);
    const seriesLimit = 5;
    const catalogueLimit = 5;
    const [lastPublished, setLastPublished] = useState(null);
    const [videoOverlays, setVideoOverlays] = useState([]);
    const [creatorName, setCreatorName] = useState('CreatorName');
    const [creatorHandle, setCreatorHandle] = useState(null);
    // If the parent requests a reupload, we'll open preview with this item
    // Parent (App) passes `pendingReuploadItem` and `clearPendingReupload` props.
    useEffect(() => {
        // handled below via props — placeholder so linter doesn't warn
    }, []);

    useEffect(() => {
        try {
            // Try common global names first (some pages expose profile on window)
            const g = (typeof window !== 'undefined') && (window.__PROFILE__ || window.__CREATOR__ || window.creatorProfile || window.profile || window.currentUser);
            if (g && typeof g === 'object') {
                setCreatorName(g.name || g.username || g.handle || 'CreatorName');
                setCreatorHandle(g.handle || g.username || null);
                return;
            }

            // Try common localStorage keys used to persist profile info
            const keys = ['creatorProfile', 'profile', 'user', 'currentUser'];
            for (const k of keys) {
                const raw = (typeof localStorage !== 'undefined') && localStorage.getItem(k);
                if (raw) {
                    try {
                        const obj = JSON.parse(raw);
                        if (obj && typeof obj === 'object') {
                            setCreatorName(obj.name || obj.username || obj.handle || 'CreatorName');
                            setCreatorHandle(obj.handle || obj.username || null);
                            return;
                        }
                    } catch (e) {
                        // not JSON — skip
                    }
                }
            }
        } catch (e) {
            // ignore errors — keep fallback
        }
    }, []);

    // Mouse/touch handler wrappers
    const handleAdjustMouseDown = (e) => { e.preventDefault(); startAdjustDrag(e.clientX, e.clientY); };
    const handleAdjustMouseMove = (e) => { if (draggingRef.current) onAdjustPointerMove(e.clientX, e.clientY); };
    const handleAdjustMouseUp = () => { endAdjustDrag(); };

    const handleAdjustTouchStart = (e) => {
        if (!e.touches) return;
        if (e.touches.length === 1) {
            const t = e.touches[0];
            startAdjustDrag(t.clientX, t.clientY);
        } else if (e.touches.length === 2) {
            const t0 = e.touches[0];
            const t1 = e.touches[1];
            const dist = Math.hypot(t1.clientX - t0.clientX, t1.clientY - t0.clientY);
            pinchRef.current.initialDist = dist;
            pinchRef.current.initialScale = adjustScale;
            // midpoint for potential panning during pinch
            dragStartRef.current = { x: (t0.clientX + t1.clientX) / 2, y: (t0.clientY + t1.clientY) / 2 };
        }
    };

    const handleAdjustTouchMove = (e) => {
        if (!e.touches) return;
        if (e.touches.length === 1) {
            const t = e.touches[0];
            if (draggingRef.current) onAdjustPointerMove(t.clientX, t.clientY);
        } else if (e.touches.length === 2) {
            const t0 = e.touches[0];
            const t1 = e.touches[1];
            const dist = Math.hypot(t1.clientX - t0.clientX, t1.clientY - t0.clientY);
            const initial = pinchRef.current.initialDist || dist;
            const ratio = dist / initial;
            const newScale = Math.max(0.2, Math.min(3, pinchRef.current.initialScale * ratio));
            // update pos so midpoint remains stable
            const midX = (t0.clientX + t1.clientX) / 2;
            const midY = (t0.clientY + t1.clientY) / 2;
            const dx = midX - dragStartRef.current.x;
            const dy = midY - dragStartRef.current.y;
            setAdjustPos((p) => ({ x: p.x + dx, y: p.y + dy }));
            dragStartRef.current = { x: midX, y: midY };
            setAdjustScale(newScale);
            e.preventDefault();
        }
    };

    const handleAdjustTouchEnd = (e) => {
        if (!e.touches || e.touches.length === 0) {
            endAdjustDrag();
            pinchRef.current.initialDist = null;
        }
    };

    const handleResetAdjust = () => {
        // Compute a fit-to-crop scale so the full image is visible inside the 16:9 crop
        const img = adjustImageRef.current;
        const container = adjustContainerRef.current;
        if (img && container) {
            const imgRect = img.getBoundingClientRect();
            const containerRect = container.getBoundingClientRect();
            // Compute centered 16:9 crop (same logic as save)
            let cropW = containerRect.width;
            let cropH = (cropW * 9) / 16;
            if (cropH > containerRect.height) {
                cropH = containerRect.height;
                cropW = (cropH * 16) / 9;
            }
            // Fit image inside crop area
            const fitScale = Math.min(cropW / img.naturalWidth, cropH / img.naturalHeight);
            // Prevent extremely small values
            const clamped = Math.max(0.1, Math.min(3, fitScale));
            setAdjustScale(clamped);
        } else {
            setAdjustScale(1);
        }
        setAdjustPos({ x: 0, y: 0 });
        pinchRef.current = { initialDist: null, initialScale: 1 };
    };

    const stopZoomRepeat = () => {
        if (zoomIntervalRef.current) {
            clearInterval(zoomIntervalRef.current);
            zoomIntervalRef.current = null;
        }
    };

    const startZoomRepeat = (delta) => {
        // delta is +/-0.1 per step
        stopZoomRepeat();
        // apply immediate change
        setAdjustScale((s) => Math.max(0.2, Math.min(3, +(s + delta).toFixed(3))));
        // then start repeating every 120ms for faster change
        zoomIntervalRef.current = setInterval(() => {
            setAdjustScale((s) => Math.max(0.2, Math.min(3, +(s + delta).toFixed(3))));
        }, 120);
    };

    // Cleanup object URLs when component unmounts
    useEffect(() => {
        return () => {
            if (videoPreview) URL.revokeObjectURL(videoPreview);
            if (thumbnailPreview) URL.revokeObjectURL(thumbnailPreview);
        };
    }, [videoPreview, thumbnailPreview]);

    // Close format dropdown when clicking outside
    useEffect(() => {
        const handler = (e) => {
            if (formatRef.current && !formatRef.current.contains(e.target)) {
                setFormatOpen(false);
            }
        };
        if (formatOpen) {
            document.addEventListener('mousedown', handler);
            document.addEventListener('touchstart', handler);
        }
        return () => {
            document.removeEventListener('mousedown', handler);
            document.removeEventListener('touchstart', handler);
        };
    }, [formatOpen]);

    // Close category dropdown when clicking outside
    useEffect(() => {
        const handler = (e) => {
            if (categoryRef.current && !categoryRef.current.contains(e.target)) {
                setCategoryOpen(false);
            }
        };
        if (categoryOpen) {
            document.addEventListener('mousedown', handler);
            document.addEventListener('touchstart', handler);
        }
        return () => {
            document.removeEventListener('mousedown', handler);
            document.removeEventListener('touchstart', handler);
        };
    }, [categoryOpen]);

    // Close script dropdown when clicking outside
    useEffect(() => {
        const handler = (e) => {
            if (scriptRef.current && !scriptRef.current.contains(e.target)) {
                setScriptOpen(false);
            }
        };
        if (scriptOpen) {
            document.addEventListener('mousedown', handler);
            document.addEventListener('touchstart', handler);
        }
        return () => {
            document.removeEventListener('mousedown', handler);
            document.removeEventListener('touchstart', handler);
        };
    }, [scriptOpen]);

    // Clear toast after a short time
    useEffect(() => {
        if (!toastMessage) return undefined;
        const t = setTimeout(() => setToastMessage(''), 2000);
        return () => clearTimeout(t);
    }, [toastMessage]);

    const computeShareLink = () => {
        try {
            const base = WEB_URL;
            const slug = (videoTitle || title || 'your-video').toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 60) || 'your-video';
            return `${base}/videos/${slug}`;
        } catch (e) {
            return `${WEB_URL}/videos/your-video`;
        }
    };

    const handleCopyLink = async () => {
        const link = computeShareLink();
        try {
            if (navigator && navigator.clipboard && navigator.clipboard.writeText) {
                await navigator.clipboard.writeText(link);
            } else {
                const ta = document.createElement('textarea');
                ta.value = link;
                ta.setAttribute('readonly', '');
                ta.style.position = 'fixed';
                ta.style.left = '-9999px';
                document.body.appendChild(ta);
                ta.select();
                ta.setSelectionRange(0, ta.value.length);
                const ok = document.execCommand('copy');
                document.body.removeChild(ta);
                if (!ok) throw new Error('execCommand returned false');
            }
            setLinkCopied(true);
            setToastMessage(getTranslation('Copied', selectedLanguage));
            setTimeout(() => setLinkCopied(false), 1200);
        } catch (err) {
            // Last-resort fallback: show a prompt so users can copy manually (works on many mobile browsers)
            try {
                // window.prompt may be blocked in some embedded contexts; wrap in try/catch
                // eslint-disable-next-line no-alert
                window.prompt && window.prompt('Copy this link', link);
                setToastMessage(getTranslation('Copy ready — paste manually', selectedLanguage));
                setTimeout(() => setToastMessage(''), 2000);
            } catch (e) {
                setToastMessage(getTranslation('Copy failed', selectedLanguage));
                setTimeout(() => setToastMessage(''), 1500);
            }
        }
    };

    // Thumbnail adjust handlers: pan (drag) and zoom (scale)
    const startAdjustDrag = (clientX, clientY) => {
        draggingRef.current = true;
        dragStartRef.current = { x: clientX, y: clientY };
    };

    // If parent set a pending reupload item, open the publish modal prefilled
    // The parent can provide `openInForm: true` to open the modal in the
    // 'form' step (allowing the creator to upload a video), otherwise the
    // modal opens in the 'preview' step for re-uploads / quick previews.
    useEffect(() => {
        if (!pendingReuploadItem) return;
        try {
            const item = pendingReuploadItem;
            setVideoTitle(item.title || '');
            setThumbnailPreview(item.thumbnail || null);
            setCategory(item.category || category || '');
            setScriptType(item.scriptType || scriptType || '');

            if (item.openInForm) {
                // Open the publish modal on the form step so the user can upload
                // a video from the Claims modal (used when coming from Upload tab).
                setPreviewData(null);
                setPublishStep('form');
                setIsReuploading(Boolean(item.isReupload));
                setShowModal(true);
            } else {
                // Default behaviour: open preview mode for re-uploads
                setPreviewData({
                    title: item.title || '',
                    thumbnail: item.thumbnail || null,
                    time: null,
                    format: item.format || videoFormat,
                    category: item.category || category,
                    scriptType: item.scriptType || scriptType,
                });
                setPublishStep('preview');
                setIsReuploading(true);
                setShowModal(true);
            }
        } catch (e) {
            console.warn('Failed to open reupload preview', e);
        } finally {
            try { clearPendingReupload(); } catch (e) { }
        }
    }, [pendingReuploadItem]);

    // Open publish modal prefilled when parent requests a re-upload
    useEffect(() => {
        try {
            if (typeof arguments !== 'undefined') {
                // arguments is available; actual pendingReuploadItem comes from props
            }
        } catch (e) { }
    }, []);

    const onAdjustPointerMove = (clientX, clientY) => {
        if (!draggingRef.current) return;
        const dx = clientX - dragStartRef.current.x;
        const dy = clientY - dragStartRef.current.y;
        dragStartRef.current = { x: clientX, y: clientY };
        setAdjustPos((p) => ({ x: p.x + dx, y: p.y + dy }));
    };

    const endAdjustDrag = () => {
        draggingRef.current = false;
    };

    const handleSaveAdjustedThumbnail = async () => {
        try {
            const img = adjustImageRef.current;
            const container = adjustContainerRef.current;
            if (!img || !container) return;

            const imgRect = img.getBoundingClientRect();
            const containerRect = container.getBoundingClientRect();
            // Enforce a centered 16:9 crop that fits within the visible container
            let cropW = containerRect.width;
            let cropH = (cropW * 9) / 16;
            if (cropH > containerRect.height) {
                cropH = containerRect.height;
                cropW = (cropH * 16) / 9;
            }
            const cropLeft = containerRect.left + (containerRect.width - cropW) / 2;
            const cropTop = containerRect.top + (containerRect.height - cropH) / 2;

            // portion of the image visible within the crop (CSS pixels)
            const sxCss = cropLeft - imgRect.left;
            const syCss = cropTop - imgRect.top;
            const swCss = cropW;
            const shCss = cropH;

            // Map CSS pixel coordinates to image natural pixels
            const sx = (sxCss / imgRect.width) * img.naturalWidth;
            const sy = (syCss / imgRect.height) * img.naturalHeight;
            const sw = (swCss / imgRect.width) * img.naturalWidth;
            const sh = (shCss / imgRect.height) * img.naturalHeight;

            const canvasW = 1280;
            const canvasH = Math.round((canvasW * 9) / 16);
            const canvas = document.createElement('canvas');
            canvas.width = canvasW;
            canvas.height = canvasH;
            const ctx = canvas.getContext('2d');
            ctx.fillStyle = '#fff';
            ctx.fillRect(0, 0, canvasW, canvasH);

            if (sw > 0 && sh > 0) {
                ctx.drawImage(img, sx, sy, sw, sh, 0, 0, canvasW, canvasH);
            } else {
                // fallback: draw full image scaled to canvas
                ctx.drawImage(img, 0, 0, img.naturalWidth, img.naturalHeight, 0, 0, canvasW, canvasH);
            }

            const dataUrl = canvas.toDataURL('image/jpeg', 0.9);
            setThumbnailPreview(dataUrl);

            try {
                const res = await fetch(dataUrl);
                const blob = await res.blob();
                const file = new File([blob], 'thumbnail.jpg', { type: blob.type });
                setThumbnailFile(file);
            } catch (e) {
                // ignore file creation errors; preview is set
            }

            setShowAdjustModal(false);
            setAdjustScale(1);
            setAdjustPos({ x: 0, y: 0 });
        } catch (e) {
            // If anything fails, close modal and keep current thumbnail
            console.warn('Thumbnail adjust failed', e);
            setShowAdjustModal(false);
        }
    };

    return (
        <div className="rounded-2xl border border-[#F3E8D0] bg-white p-5 shadow-sm">
            <div className="flex items-start justify-between">
                <div className="flex-1">
                    {isCollapsed ? (
                        // Collapsed view: show profile picture, name, role, and price
                        <div className="flex items-center gap-3 w-full">
                            <div className="w-10 h-10 rounded-full bg-gray-100 overflow-hidden flex items-center justify-center flex-shrink-0">
                                {requesterAvatar ? (
                                    <img src={requesterAvatar} alt={requesterName} className="w-full h-full object-cover" />
                                ) : (
                                    <div className="text-xs text-gray-500">{requesterName.charAt(0)}</div>
                                )}
                            </div>
                            <div className="flex-1">
                                <div className="text-sm font-semibold text-gray-900">{requesterName}</div>
                                <div className="text-xs text-gray-400">{requesterRole}</div>
                            </div>
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={() => setShowDetailsModal(true)}
                                    className="text-xs bg-blue-50 hover:bg-blue-100 text-blue-600 px-3 py-1.5 rounded-md transition font-medium"
                                    title="View full request details"
                                >
                                    {getTranslation('Details', selectedLanguage)}
                                </button>
                                <div className="text-sm text-gray-600 font-medium whitespace-nowrap">$0</div>
                            </div>
                        </div>
                    ) : (
                        // Expanded view: show title, price and details button inline
                        <div className="flex items-start justify-between w-full">
                            <div className="flex-1">
                                <h3 className="text-[18px] font-semibold text-gray-900">{title}</h3>
                                <div className="text-sm text-gray-600 mt-1">${(0).toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 2 })}</div>
                            </div>
                            <button
                                onClick={() => setShowDetailsModal(true)}
                                className="text-xs bg-blue-50 hover:bg-blue-100 text-blue-600 px-3 py-1.5 rounded-md transition font-medium ml-3 relative flex-shrink-0"
                                title="View full request details"
                                style={{
                                    ...(showDetailsHint && {
                                        boxShadow: '0 0 0 0 rgba(147, 51, 234, 0.7)',
                                        animation: 'pulse-hint 2s infinite'
                                    })
                                }}
                            >
                                {getTranslation('Details', selectedLanguage)}
                                
                                {/* Details Button Hint - Positioned above and to the right */}
                                {showDetailsHint && (
                                    <div className="absolute -top-56 right-0 translate-x-12 w-64 bg-white rounded-xl shadow-2xl border-2 p-4 z-50 animate-fade-in-up"
                                         style={{
                                            borderColor: 'rgba(147, 51, 234, 0.8)',
                                            backgroundColor: 'rgba(147, 51, 234, 0.95)',
                                         }}>
                                        {/* Arrow pointing down to button */}
                                        <div 
                                            className="absolute -bottom-2 right-8 w-4 h-4 rotate-45"
                                            style={{
                                                backgroundColor: 'rgba(147, 51, 234, 0.95)',
                                                borderRight: '2px solid rgba(147, 51, 234, 0.95)',
                                                borderBottom: '2px solid rgba(147, 51, 234, 0.95)'
                                            }}
                                        />
                                        
                                        <div className="flex items-start justify-between gap-2">
                                            <div className="flex-1">
                                                <p className="text-sm font-bold text-white flex items-center gap-1">
                                                    <span>👁️</span> {getTranslation('View Details', selectedLanguage)}
                                                </p>
                                                <p className="text-sm text-white mt-2 leading-snug font-medium">
                                                    {getTranslation('Click to see all request information including delivery type, tones, styles, and more', selectedLanguage)}
                                                </p>
                                            </div>
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    setShowDetailsHint(false);
                                                }}
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
                    )}
                </div>
                <div className="flex items-center gap-2">
                    <button 
                        onClick={() => setIsCollapsed(!isCollapsed)} 
                        className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition"
                        title={isCollapsed ? "Expand" : "Collapse"}
                    >
                        {isCollapsed ? (
                            <ChevronDown size={20} />
                        ) : (
                            <ChevronUp size={20} />
                        )}
                    </button>
                    {/* Hide unclaim button for re-uploads from Published tab */}
                    {!requestData?.sourceTab && (
                        <button 
                            onClick={() => setShowUnclaimModal(true)} 
                            className="text-gray-400 hover:text-red-600 p-2 hover:bg-red-50 rounded-lg transition"
                            title="Unclaim request"
                        >
                            ✕
                        </button>
                    )}
                </div>
            </div>

            {!isCollapsed && (
                <>
                    <div className="mt-4 flex items-center gap-4">
                        <div className="w-12 h-12 rounded-full bg-gray-100 overflow-hidden flex items-center justify-center">
                            {requesterAvatar ? (
                                <img src={requesterAvatar} alt={requesterName} className="w-full h-full object-cover" />
                            ) : (
                                <div className="text-sm text-gray-500">{requesterName.charAt(0)}</div>
                            )}
                        </div>
                        <div>
                            <div className="text-sm font-semibold text-gray-900">{requesterName}</div>
                            <div className="text-xs text-gray-400">{requesterRole}</div>
                        </div>
                    </div>

                    <div className="mt-6 flex items-center justify-between">
                        <div className="text-sm font-semibold text-gray-900">{getTranslation('Status Tracker', selectedLanguage)}</div>
                {(() => {
                    const publishStage = steps.findIndex((s) => s === 'Preview Ready') + 1; // step number for 'Preview Ready' -> show 'Publish Video'
                    const isPublishStage = currentStep === publishStage;
                    return (
                        <button onClick={() => setShowModal(true)} className="bg-[var(--color-gold)] text-white px-4 py-2 rounded-lg shadow-sm flex items-center gap-2">
                            {isPublishStage ? (
                                <React.Fragment>
                                    <Star size={14} className="mr-1" />
                                    <span className="font-semibold text-[13px]">{getTranslation('Publish Video', selectedLanguage)}</span>
                                </React.Fragment>
                            ) : (
                                <React.Fragment>
                                    <span className="text-[14px]">→</span>
                                    <span className="font-semibold text-[13px]">{getTranslation('Update Progress', selectedLanguage)}</span>
                                </React.Fragment>
                            )}
                        </button>
                    );
                })()}
            </div>

            <div className="mt-5 border-l-2 border-gray-100 pl-6">
                {/* Embedded styles for the pulsing ring used on the active step */}
                <style>{`
                    @keyframes pulseRing {
                        0% { transform: scale(1); opacity: 0.9; box-shadow: 0 0 0 0 rgba(0,0,0,0.06); }
                        50% { transform: scale(1.45); opacity: 0.55; box-shadow: 0 12px 28px 0 rgba(0,0,0,0.08); }
                        100% { transform: scale(1); opacity: 0.9; box-shadow: 0 0 0 0 rgba(0,0,0,0.06); }
                    }
                    .pulse-ring { animation: pulseRing 1.4s ease-out infinite; border-radius: 9999px; }
                `}</style>

                {steps.map((label, idx) => {
                    const step = idx + 1;
                    const isActive = step === currentStep;
                    const isCompleted = step < currentStep || (finished && step === steps.length);

                    return (
                        <div key={label} className="mb-6 relative">
                            <div className="absolute -left-10 top-0">
                                {isCompleted ? (
                                    <div className="w-8 h-8 rounded-full bg-green-500 flex items-center justify-center shadow-md">
                                        <svg width="14" height="10" viewBox="0 0 14 10" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
                                            <path d="M1 5L5 8L13 1" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                        </svg>
                                    </div>
                                ) : isActive ? (
                                    <div className="relative w-8 h-8 flex items-center justify-center">
                                        <span className="absolute inset-0 rounded-full" style={{ background: 'rgba(203,138,0,0.08)' }} />
                                        <span className="absolute inset-0 rounded-full pulse-ring" style={{ background: 'rgba(107,114,128,0.08)' }} />
                                        <div className="relative w-8 h-8 rounded-full bg-[var(--color-gold)] flex items-center justify-center shadow-md">
                                            <span className="text-[13px] font-semibold text-white">{step}</span>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="w-8 h-8 rounded-full flex items-center justify-center" style={{ border: '2px solid #E5E7EB', background: '#fff' }}>
                                        <span className="text-[13px] text-gray-500 font-semibold">{step}</span>
                                    </div>
                                )}
                            </div>

                            <div>
                                <div className={`text-sm font-semibold ${isActive ? 'text-[var(--color-gold-darker)]' : isCompleted ? 'text-gray-500' : 'text-gray-900'}`}>{getTranslation(label, selectedLanguage)}</div>
                                <div className="text-xs text-gray-400 mt-1">—</div>
                            </div>
                        </div>
                    );
                })}
            </div>
            {/* Modal: Advance Request Status */}
            {showModal && (
                <div className="fixed inset-0 z-[80] flex items-center justify-center">
                    <div className="absolute inset-0 bg-black opacity-60" onClick={() => setShowModal(false)} />

                    {/* Modal container */}
                    <div className="relative bg-white rounded-lg shadow-xl max-w-lg w-full mx-4 z-10 max-h-[80vh] flex flex-col overflow-hidden">
                        {/* Scrollable content area - user asked this modal be scrollable */}
                        <div className="p-6 overflow-y-auto flex-1">
                            {(currentStep === 5 || isReuploading) ? (
                                <React.Fragment>
                                    <div className="flex items-start justify-between mb-4">
                                        <div>
                                            <div className="flex items-center gap-3">
                                                <div className="text-[22px] text-[var(--color-gold)]">✨</div>
                                                <h3 className="text-[20px] font-semibold text-gray-900">{getTranslation('Publish Your Video', selectedLanguage)}</h3>
                                            </div>
                                            <div className="text-sm text-gray-400 mt-2">{getTranslation('Upload your video, add interactive elements, and publish to the community', selectedLanguage)}</div>
                                        </div>
                                        <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600">✕</button>
                                    </div>

                                    {publishStep !== 'preview' && (
                                        <div className="mt-4 rounded-lg border border-[var(--color-gold-light)] bg-[var(--color-gold-light-bg)] p-4 mb-6">
                                            <div className="flex items-center gap-3 mb-2">
                                                <div className="w-8 h-8 rounded-md bg-[var(--color-gold-cream)] flex items-center justify-center text-[var(--color-gold)]">🎬</div>
                                                <div>
                                                    <div className="text-sm font-semibold text-[var(--color-gold-darker)]">{getTranslation('Publishing Request', selectedLanguage)}</div>
                                                    <div className="text-xs text-gray-600 mt-1">{getTranslation('Requester', selectedLanguage)}: {requesterName} · {getTranslation('Creator: You', selectedLanguage)}</div>
                                                </div>
                                            </div>
                                            <div className="mt-3">
                                                <div className="relative" ref={formatRef}>
                                                    <button
                                                        type="button"
                                                        onClick={() => setFormatOpen((s) => !s)}
                                                        aria-haspopup="listbox"
                                                        aria-expanded={formatOpen}
                                                        className="w-full border border-gray-200 rounded-lg px-4 py-3 text-sm bg-white flex items-center justify-between"
                                                    >
                                                        <div className="flex items-center gap-3">
                                                            <div className="text-lg">{selectedFormat?.icon}</div>
                                                            <div className={videoFormat ? 'text-gray-900' : 'text-gray-400'}>{selectedFormat?.fullLabel || selectedFormat?.label}</div>
                                                        </div>
                                                        <svg className="ml-2" width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M6 9l6 6 6-6" stroke="#6B7280" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
                                                    </button>

                                                    {formatOpen && (
                                                        <div className="absolute left-0 mt-2 w-full z-30 bg-white rounded-lg shadow-lg border border-gray-200 max-h-48 overflow-y-auto">
                                                            <div className="p-2">
                                                                <div className="text-lg font-semibold text-gray-900 mb-2 px-3">{getTranslation('Select Video Format', selectedLanguage)}</div>
                                                                <div className="flex flex-col">
                                                                    {formats.map((f) => {
                                                                        const selected = f.key === videoFormat;
                                                                        return (
                                                                            <button
                                                                                key={f.key}
                                                                                onClick={() => { setVideoFormat(f.key); setFormatOpen(false); }}
                                                                                className={`w-full text-left px-4 py-3 hover:bg-gray-50 flex items-center justify-between ${selected ? 'bg-[var(--color-gold-light-bg)]' : ''}`}
                                                                            >
                                                                                <div className="flex items-center gap-3">
                                                                                    <div className="w-10 h-10 rounded-md bg-white flex items-center justify-center text-[20px]">{f.icon}</div>
                                                                                    <div>
                                                                                        <div className="font-semibold text-gray-900">{f.label}</div>
                                                                                        <div className="text-xs text-gray-500">{f.desc}</div>
                                                                                    </div>
                                                                                </div>
                                                                                {selected && <div className="text-[var(--color-gold-darker)]">✓</div>}
                                                                            </button>
                                                                        );
                                                                    })}
                                                                </div>
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    {/* Preview of the most recently published item (card-style preview copied from home.jsx) */}
                                    {(publishStep === 'preview' && previewData) && (
                                        <div className="mb-6">
                                            <div className="mx-5 mb-5 bg-white rounded-xl shadow-lg transition-shadow duration-300 overflow-visible">
                                                <div className="relative w-full pb-[75%]">
                                                    <img
                                                        src={(publishStep === 'preview' ? previewData : lastPublished)?.thumbnail || thumbnailPreview || 'https://placehold.co/600x400/333333/ffffff?text=Video+Image+Unavailable'}
                                                        alt={(publishStep === 'preview' ? previewData : lastPublished)?.title || videoTitle || 'Published thumbnail'}
                                                        className="absolute top-0 left-0 w-full h-full object-cover rounded-t-xl"
                                                    />

                                                    {/* Pin badge (top-left) */}
                                                    {((publishStep === 'preview' ? previewData : lastPublished)?.pinned && (publishStep === 'preview' ? previewData : lastPublished)?.pinnedDays) && (
                                                        <div className="absolute top-3 left-3 flex items-center rounded-lg px-2 py-1 shadow-md" style={{ backgroundColor: 'rgba(0,0,0,0.7)' }}>
                                                            <Pin size={14} className="text-red-500 mr-1" />
                                                            <span className="text-sm font-bold text-white">{(publishStep === 'preview' ? previewData : lastPublished)?.pinnedDays}d</span>
                                                        </div>
                                                    )}

                                                    <div className="relative">
                                                        <div className="absolute top-3 right-3">
                                                            <div className="relative flex items-center rounded-lg px-2 py-1 shadow-md text-sm font-semibold text-black" style={{ backgroundColor: 'var(--color-gold)' }}>
                                                                <Pencil size={14} className="text-black mr-1" />
                                                                Requested
                                                            </div>
                                                        </div>

                                                        {/* Optional small tooltip removed for preview copy */}
                                                    </div>

                                                    <div className="absolute bottom-3 right-3 bg-black bg-opacity-70 rounded-lg px-2 py-1">
                                                        <span className="text-sm font-bold text-white">{(publishStep === 'preview' ? previewData : lastPublished)?.time || getTranslation('Just now', selectedLanguage)}</span>
                                                    </div>
                                                </div>

                                                <div className="p-4 relative">
                                                    <h3 className="text-lg font-semibold text-gray-900 mb-2" style={clamp2}>{(publishStep === 'preview' ? previewData : lastPublished)?.title || videoTitle || getTranslation('Untitled', selectedLanguage)}</h3>

                                                    {/* Creator placeholder (matches home.jsx 'by' line) */}
                                                    <p className="text-sm text-gray-600 mb-1 leading-5">
                                                        {getTranslation('by', selectedLanguage)}{' '}
                                                        <button
                                                            className="font-medium underline hover:text-gray-800"
                                                            style={{ color: 'var(--color-gold)', background: 'transparent', padding: 0 }}
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                try {
                                                                    if (creatorHandle) {
                                                                        // navigate to profile with handle if available
                                                                        window.location.href = `/creatorprofile.jsx?handle=${encodeURIComponent(creatorHandle)}`;
                                                                    } else {
                                                                        // fallback to the profile page
                                                                        window.location.href = '/creatorprofile.jsx';
                                                                    }
                                                                } catch (err) {
                                                                    console.warn('Navigation failed', err);
                                                                }
                                                            }}
                                                        >
                                                            {creatorName}
                                                        </button>
                                                    </p>

                                                    <div className="flex justify-between items-center mt-2">
                                                        <div className="text-xs text-gray-500">
                                                            {(publishStep === 'preview' ? previewData : lastPublished)?.date || getTranslation('Just now', selectedLanguage)} &middot; {getTranslation('Requested by', selectedLanguage)}
                                                            <button className="text-gray-600 font-medium underline hover:text-gray-800 ml-1 bg-transparent p-0">{requesterName}</button>
                                                        </div>

                                                        {/* Three-dot button placed on the card (no outside share button) */}
                                                        <div className="flex items-center space-x-2">
                                                            <button className="p-1 text-gray-400 hover:text-gray-600">
                                                                <MoreVertical size={20} />
                                                            </button>
                                                        </div>
                                                    </div>
                                                </div>

                                                <div className="flex justify-center p-2 pt-0">
                                                    <span className="block w-2 h-2 mx-1 rounded-full bg-gray-300"></span>
                                                    <span className="block w-2 h-2 mx-1 rounded-full bg-gray-300"></span>
                                                    <span className="block w-2 h-2 mx-1 rounded-full bg-gray-300"></span>
                                                    <span className="block w-2 h-2 mx-1 rounded-full bg-gray-300"></span>
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    {/* Toast message (simple) inside modal container */}
                                    {toastMessage && (
                                        <Toast message={toastMessage} bottom={true} />
                                    )}

                                    {publishStep === 'form' && (
                                        <>
                                            <div className="mb-6">
                                                <div className="flex items-center justify-between mb-2">
                                                    <div className="text-sm font-medium text-gray-700">{getTranslation('Upload Video', selectedLanguage)} <span className="text-red-500">*</span></div>
                                                    <button type="button" onClick={() => {
                                                        if (!videoLinkMode) {
                                                            // Switching to link mode — always allowed
                                                            setVideoLinkMode(true); setVideoFile(null); setVideoPreview(null);
                                                        } else if (!isProCreator) {
                                                            // Starter creator trying to upload from device — show upgrade modal
                                                            setShowUpgradeModal(true);
                                                        } else {
                                                            // Pro creator switching to file upload
                                                            setVideoLinkMode(false); setVideoLinkUrl('');
                                                        }
                                                    }} className="text-xs text-blue-600 hover:text-blue-800 font-medium flex items-center gap-1">
                                                        <Link2 size={12} />
                                                        {videoLinkMode ? (isProCreator ? getTranslation('Upload file instead', selectedLanguage) : getTranslation('Upload file instead', selectedLanguage)) : getTranslation('Add video link', selectedLanguage)}
                                                    </button>
                                                </div>
                                                {videoLinkMode ? (
                                                    <>
                                                        <input
                                                            type="url"
                                                            value={videoLinkUrl}
                                                            onChange={(e) => setVideoLinkUrl(e.target.value)}
                                                            placeholder="https://example.com/video-url"
                                                            className="w-full border border-gray-200 rounded-lg px-4 py-3 text-sm mb-1"
                                                        />
                                                        <p className="text-xs mb-2 flex items-start gap-1" style={{ color: '#dc2626' }}>
                                                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="flex-shrink-0 mt-0.5"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                                                            <span>Privacy Requirement: If using YouTube, the video must be set to <strong>Unlisted</strong>. Do not set it to Public for privacy reasons, and do not set it to Private, as our servers will be unable to access and download it.</span>
                                                        </p>
                                                        {videoLinkUrl && (videoLinkUrl.includes('youtube.com') || videoLinkUrl.includes('youtu.be')) && (() => {
                                                            let ytId = '';
                                                            if (videoLinkUrl.includes('youtu.be/')) ytId = videoLinkUrl.split('youtu.be/')[1].split('?')[0];
                                                            else { try { ytId = new URL(videoLinkUrl).searchParams.get('v') || ''; } catch {} }
                                                            if (!ytId) return null;
                                                            return (
                                                                <div className="w-full rounded-lg overflow-hidden border border-gray-200 h-44 relative bg-black" style={{ borderRadius: 8 }}>
                                                                    {/* Use YouTube thumbnail image instead of iframe to avoid all branding */}
                                                                    <img
                                                                        src={`https://img.youtube.com/vi/${ytId}/hqdefault.jpg`}
                                                                        alt="Video preview"
                                                                        style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }}
                                                                        onError={(e) => { e.target.src = `https://img.youtube.com/vi/${ytId}/mqdefault.jpg`; }}
                                                                    />
                                                                    {/* Subtle dark overlay for contrast */}
                                                                    <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.15)', zIndex: 2 }} />
                                                                    {/* Play icon in center */}
                                                                    <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', zIndex: 3, width: 48, height: 48, borderRadius: '50%', background: 'rgba(0,0,0,0.65)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                                                        <svg width="22" height="22" viewBox="0 0 24 24" fill="white"><polygon points="6,3 20,12 6,21" /></svg>
                                                                    </div>
                                                                    {/* YouTube link badge */}
                                                                    <div style={{ position: 'absolute', bottom: 8, left: 8, zIndex: 3, background: 'rgba(0,0,0,0.7)', color: '#fff', fontSize: 10, fontWeight: 600, padding: '3px 8px', borderRadius: 4, letterSpacing: '0.3px' }}>
                                                                        YouTube Link
                                                                    </div>
                                                                </div>
                                                            );
                                                        })()}

                                                    </>
                                                ) : (
                                                    <>
                                                        <input ref={videoInputRef} type="file" accept="video/mp4,video/quicktime,video/webm" className="hidden" onChange={(e) => {
                                                            const file = e.target.files && e.target.files[0];
                                                            if (file) {
                                                                setVideoFile(file);
                                                                const url = URL.createObjectURL(file);
                                                                setVideoPreview(url);
                                                            }
                                                        }} />

                                                        <div onClick={() => videoInputRef.current && videoInputRef.current.click()} className="w-full rounded-lg border-2 border-dashed border-gray-200 h-44 flex items-center justify-center cursor-pointer">
                                                            {videoPreview ? (
                                                                <video src={videoPreview} className="max-h-[160px] max-w-full" controls />
                                                            ) : (
                                                                <div className="text-center text-gray-500">
                                                                    <div className="w-12 h-12 rounded-md bg-[var(--color-gold-light-bg)] mx-auto mb-3 flex items-center justify-center text-[var(--color-gold)]">
                                                                        <Video size={20} className="text-[var(--color-gold)]" />
                                                                    </div>
                                                                    <div>{getTranslation('Click to upload video', selectedLanguage)}</div>
                                                                    <div className="text-xs text-gray-400 mt-1">{getTranslation('MP4, MOV or WebM · Max 500MB', selectedLanguage)}</div>
                                                                </div>
                                                            )}
                                                        </div>
                                                        {videoFile && <div className="text-xs text-gray-500 mt-2">{getTranslation('Selected:', selectedLanguage)} {videoFile.name} ({Math.round(videoFile.size / 1024 / 1024)} MB)</div>}
                                                    </>
                                                )}
                                            </div>

                                            <div className="mb-6">
                                                <div className="flex items-center justify-between mb-2">
                                                    <div className="text-sm font-medium text-gray-700">{getTranslation('Video Thumbnail', selectedLanguage)} <span className="text-red-500">*</span></div>
                                                    <button type="button" onClick={() => { setThumbnailLinkMode(!thumbnailLinkMode); if (!thumbnailLinkMode) { setThumbnailFile(null); setThumbnailPreview(null); } else { setThumbnailLinkUrl(''); } }} className="text-xs text-blue-600 hover:text-blue-800 font-medium flex items-center gap-1">
                                                        <Link2 size={12} />
                                                        {thumbnailLinkMode ? getTranslation('Upload file instead', selectedLanguage) : getTranslation('Add link instead', selectedLanguage)}
                                                    </button>
                                                </div>
                                                {thumbnailLinkMode ? (
                                                    <>
                                                        <input
                                                            type="url"
                                                            value={thumbnailLinkUrl}
                                                            onChange={(e) => { setThumbnailLinkUrl(e.target.value); if (e.target.value) { setThumbnailPreview(e.target.value); } }}
                                                            placeholder="https://example.com/thumbnail.jpg"
                                                            className="w-full border border-gray-200 rounded-lg px-4 py-3 text-sm mb-2"
                                                        />
                                                        {thumbnailLinkUrl && (
                                                            <div className="w-full rounded-lg overflow-hidden border border-gray-200 h-32 bg-gray-50">
                                                                <img src={thumbnailLinkUrl} alt="Thumbnail preview" className="object-cover w-full h-full" onError={(e) => { e.target.style.display = 'none'; }} />
                                                            </div>
                                                        )}
                                                    </>
                                                ) : (
                                                    <>
                                                <input ref={thumbInputRef} type="file" accept="image/*" className="hidden" onChange={(e) => {
                                                    const file = e.target.files && e.target.files[0];
                                                    if (file) {
                                                        setThumbnailFile(file);
                                                        const url = URL.createObjectURL(file);
                                                        setThumbnailPreview(url);
                                                    }
                                                }} />

                                                <div onClick={() => thumbInputRef.current && thumbInputRef.current.click()} className="w-full rounded-lg border-2 border-dashed border-gray-200 h-32 flex items-center justify-center cursor-pointer overflow-hidden bg-white">
                                                    {thumbnailPreview ? (
                                                        <img src={thumbnailPreview} alt="Video thumbnail preview" className="object-cover w-full h-full" loading="lazy" />
                                                    ) : (
                                                        <div className="text-gray-400 flex flex-col items-center justify-center">
                                                            <Image size={36} className="text-gray-300 mb-2" />
                                                            <div>{getTranslation('Click to upload thumbnail', selectedLanguage)}</div>
                                                        </div>
                                                    )}
                                                </div>

                                                {thumbnailFile && <div className="text-xs text-gray-500 mt-2">{getTranslation('Selected:', selectedLanguage)} {thumbnailFile.name} ({Math.round(thumbnailFile.size / 1024)} KB)</div>}
                                                    </>
                                                )}

                                                {/* Adjust thumbnail control */}
                                                {thumbnailPreview && (
                                                    <div className="mt-2">
                                                        <button
                                                            type="button"
                                                            onClick={() => setShowAdjustModal(true)}
                                                            className="inline-flex items-center gap-2 px-3 py-1 rounded-md border border-gray-200 bg-white text-sm"
                                                        >
                                                            {getTranslation('Adjust thumbnail', selectedLanguage)}
                                                        </button>
                                                    </div>
                                                )}

                                                {/* Thumbnail adjust modal */}
                                                {showAdjustModal && thumbnailPreview && (
                                                    <div className="fixed inset-0 z-50 flex items-center justify-center">
                                                        <div className="absolute inset-0 bg-black opacity-60" onClick={() => setShowAdjustModal(false)} />
                                                        <div className="relative bg-white rounded-lg shadow-xl w-full max-w-2xl mx-4 z-10 p-4">
                                                            <div className="flex items-center justify-between mb-3">
                                                                <div className="font-semibold">{getTranslation('Adjust Thumbnail', selectedLanguage)}</div>
                                                                <button onClick={() => setShowAdjustModal(false)} className="text-gray-400 hover:text-gray-600">✕</button>
                                                            </div>

                                                            <div className="flex flex-col md:flex-row gap-4">
                                                                <div className="flex-1">
                                                                    <div ref={adjustContainerRef} className="w-full h-64 bg-gray-100 overflow-hidden relative touch-action-none" style={{ borderRadius: 8 }}
                                                                        onMouseDown={handleAdjustMouseDown}
                                                                        onMouseUp={handleAdjustMouseUp}
                                                                        onMouseMove={handleAdjustMouseMove}
                                                                        onMouseLeave={handleAdjustMouseUp}
                                                                        onTouchStart={handleAdjustTouchStart}
                                                                        onTouchMove={handleAdjustTouchMove}
                                                                        onTouchEnd={handleAdjustTouchEnd}
                                                                    >
                                                                        <img
                                                                            ref={adjustImageRef}
                                                                            src={thumbnailPreview}
                                                                            alt="Adjustable thumbnail"
                                                                            loading="lazy"
                                                                            style={{
                                                                                position: 'absolute',
                                                                                left: '50%',
                                                                                top: '50%',
                                                                                transform: `translate(-50%, -50%) translate(${adjustPos.x}px, ${adjustPos.y}px) scale(${adjustScale})`,
                                                                                transformOrigin: 'center center',
                                                                                userSelect: 'none',
                                                                                touchAction: 'none',
                                                                                maxWidth: 'none',
                                                                            }}
                                                                        />

                                                                        {/* 16:9 crop overlay (centered) - uses large inset shadow to dim outside */}
                                                                        <div style={{
                                                                            position: 'absolute',
                                                                            left: '50%',
                                                                            top: '50%',
                                                                            transform: 'translate(-50%, -50%)',
                                                                            width: '90%',
                                                                            aspectRatio: '16/9',
                                                                            border: '2px dashed rgba(255,255,255,0.9)',
                                                                            boxShadow: '0 0 0 100vmax rgba(0,0,0,0.45)',
                                                                            borderRadius: 8,
                                                                            pointerEvents: 'none'
                                                                        }} />
                                                                    </div>
                                                                </div>

                                                                <div className="w-40 flex-shrink-0 flex flex-col gap-3">
                                                                    <div>
                                                                        <label className="text-xs text-gray-600">{getTranslation('Zoom', selectedLanguage)}</label>
                                                                        <input type="range" min="0.2" max="3" step="0.05" value={adjustScale} onChange={(e) => setAdjustScale(Number(e.target.value))} className="w-full mt-1" />
                                                                        <div className="text-xs text-gray-500 mt-1">{Math.round(adjustScale * 100)}%</div>
                                                                    </div>
                                                                    <div className="flex gap-2">
                                                                        <button
                                                                            onMouseDown={() => startZoomRepeat(-0.1)}
                                                                            onMouseUp={() => stopZoomRepeat()}
                                                                            onMouseLeave={() => stopZoomRepeat()}
                                                                            onTouchStart={() => startZoomRepeat(-0.1)}
                                                                            onTouchEnd={() => stopZoomRepeat()}
                                                                            className="px-3 py-2 bg-gray-100 rounded-md"
                                                                        >-</button>
                                                                        <button
                                                                            onMouseDown={() => startZoomRepeat(0.1)}
                                                                            onMouseUp={() => stopZoomRepeat()}
                                                                            onMouseLeave={() => stopZoomRepeat()}
                                                                            onTouchStart={() => startZoomRepeat(0.1)}
                                                                            onTouchEnd={() => stopZoomRepeat()}
                                                                            className="px-3 py-2 bg-gray-100 rounded-md"
                                                                        >+</button>
                                                                    </div>
                                                                    <div className="mt-2">
                                                                        <button onClick={handleResetAdjust} className="w-full px-3 py-2 rounded-md border border-gray-200 bg-white mb-2">{getTranslation('Reset', selectedLanguage)}</button>
                                                                        <div className="mt-auto">
                                                                            <button onClick={handleSaveAdjustedThumbnail} className="w-full bg-[var(--color-gold)] text-white px-3 py-2 rounded-md">{getTranslation('Save', selectedLanguage)}</button>
                                                                            <button onClick={() => setShowAdjustModal(false)} className="w-full mt-2 px-3 py-2 rounded-md border border-gray-200 bg-white">{getTranslation('Cancel', selectedLanguage)}</button>
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                )}
                                            </div>

                                            {/* Video metadata fields (title, category, appearance) shown after thumbnail */}
                                            <div className="mb-6">
                                                <div className="text-sm font-medium text-gray-700 mb-2">{getTranslation('Video Title', selectedLanguage)} <span className="text-red-500">*</span></div>
                                                <input
                                                    value={videoTitle}
                                                    onChange={(e) => {
                                                        const v = e.target.value.slice(0, 100);
                                                        setVideoTitle(v);
                                                    }}
                                                    placeholder={getTranslation('Add a title for your video', selectedLanguage)}
                                                    className="w-full border border-gray-200 rounded-lg px-4 py-3 text-sm"
                                                />
                                                <div className="text-xs text-gray-400 mt-1">{videoTitle.length}/100 {getTranslation('characters', selectedLanguage)}</div>
                                            </div>

                                            <div className="mb-6">
                                                <div className="flex items-center justify-between mb-2">
                                                    <div className="text-sm font-medium text-gray-700">{getTranslation('Category', selectedLanguage)} <span className="text-red-500">*</span></div>
                                                    <button 
                                                        type="button" 
                                                        onClick={() => { setIsAddingCategory(true); setCategoryOpen(true); }}
                                                        className="text-gray-400 hover:text-blue-600 transition-colors p-1"
                                                        title="Add Category"
                                                    >
                                                        <Pencil size={14} />
                                                    </button>
                                                </div>
                                                <div className="relative" ref={categoryRef}>
                                                    <button
                                                        type="button"
                                                        onClick={() => setCategoryOpen((s) => !s)}
                                                        aria-haspopup="listbox"
                                                        aria-expanded={categoryOpen}
                                                        className="w-full border border-gray-200 rounded-lg px-4 py-3 text-sm bg-white flex items-center justify-between"
                                                    >
                                                        <span className={category ? 'text-gray-900' : 'text-gray-400'}>{getTranslation(category || 'Select a category for your video', selectedLanguage)}</span>
                                                        <svg className="ml-2" width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M6 9l6 6 6-6" stroke="#6B7280" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
                                                    </button>

                                                    {categoryOpen && (
                                                        <div className="absolute left-0 mt-2 w-full z-30 bg-white rounded-lg shadow-lg border border-gray-200 overflow-hidden">
                                                            {isAddingCategory ? (
                                                                <div className="p-2 bg-gray-50 border-b border-gray-200 flex items-center gap-2">
                                                                    <input 
                                                                        autoFocus
                                                                        value={newCategoryName}
                                                                        onChange={(e) => setNewCategoryName(e.target.value)}
                                                                        placeholder="New Category..."
                                                                        className="flex-1 text-sm border border-gray-300 rounded px-2 py-1 focus:outline-none focus:border-blue-500"
                                                                        onKeyDown={(e) => {
                                                                            if (e.key === 'Enter') { e.preventDefault(); handleSaveNewCategory(); }
                                                                             if (e.key === 'Escape') setIsAddingCategory(false);
                                                                        }}
                                                                    />
                                                                    <button onClick={handleSaveNewCategory} className="text-green-600 p-1 hover:bg-green-100 rounded">
                                                                        <CheckCircle size={14} />
                                                                    </button>
                                                                    <button onClick={() => setIsAddingCategory(false)} className="text-gray-500 p-1 hover:bg-gray-200 rounded">
                                                                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6L6 18M6 6l12 12" /></svg>
                                                                    </button>
                                                                </div>
                                                            ) : null}
                                                            <div className="max-h-48 overflow-y-auto">
                                                                {categories.map((c) => {
                                                                    const selected = c === category;
                                                                    return (
                                                                        <button
                                                                            key={c}
                                                                            type="button"
                                                                            onClick={() => handleCategorySelect(c)}
                                                                            className={`w-full text-left px-4 py-2 hover:bg-gray-50 flex items-center justify-between ${selected ? 'bg-[var(--color-gold-light-bg)]' : ''}`}
                                                                        >
                                                                            <span className="text-sm text-gray-900">{getTranslation(c, selectedLanguage)}</span>
                                                                            {selected && <span className="text-[var(--color-gold-darker)]">✓</span>}
                                                                        </button>
                                                                    );
                                                                })}
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>

                                            <div className="mb-6">
                                                <div className="text-sm font-medium text-gray-700 mb-3">{getTranslation('How it appears', selectedLanguage)}</div>
                                                <div className="flex flex-col gap-3">
                                                    <button type="button" onClick={() => setAppearance('public')} className={`text-left p-4 rounded-lg border ${appearance === 'public' ? 'border-[var(--color-gold)] bg-[var(--color-gold-light-bg)]' : 'border-gray-200 bg-white'}`}>
                                                        <div className="flex items-center justify-between">
                                                            <div className="flex items-start gap-3">
                                                                <Globe size={20} className="text-[var(--color-gold-darker)] mt-1" />
                                                                <div>
                                                                    <div className="flex items-center gap-3">
                                                                        <div className="font-semibold">{getTranslation('Public', selectedLanguage)}</div>
                                                                        <span className="inline-block text-xs px-2 py-1 rounded-full bg-[var(--color-gold-cream)] text-[var(--color-gold-darker)] border border-[var(--color-gold)] whitespace-nowrap">{getTranslation('Recommended', selectedLanguage)}</span>
                                                                    </div>
                                                                    <div className="text-xs text-gray-500">{getTranslation('Video appears on home page after completion. Best for maximum reach.', selectedLanguage)}</div>
                                                                </div>
                                                            </div>
                                                            <div>
                                                                {appearance === 'public' && <div className="text-[var(--color-gold-darker)]">✓</div>}
                                                            </div>
                                                        </div>
                                                    </button>
                                                    <button type="button" onClick={() => setAppearance('unlisted')} className={`text-left p-4 rounded-lg border ${appearance === 'unlisted' ? 'border-[var(--color-gold)] bg-[var(--color-gold-light-bg)]' : 'border-gray-200 bg-white'}`}>
                                                        <div className="flex items-center justify-between">
                                                            <div className="flex items-start gap-3">
                                                                <Link2 size={20} className="text-gray-700 mt-1" />
                                                                <div>
                                                                    <div className="flex items-center gap-3">
                                                                        <div className="font-semibold">{getTranslation('Unlisted', selectedLanguage)}</div>
                                                                        <span className="inline-block text-xs px-2 py-1 rounded-full bg-[var(--color-gold-cream)] text-[var(--color-gold-darker)] border border-[var(--color-gold)] whitespace-nowrap">{getTranslation('For Review', selectedLanguage)}</span>
                                                                    </div>
                                                                    <div className="text-xs text-gray-500">{getTranslation('Shareable via link only. Not visible on home page.', selectedLanguage)}</div>
                                                                </div>
                                                            </div>
                                                            <div>
                                                                {appearance === 'unlisted' && <div className="text-[var(--color-gold-darker)]">✓</div>}
                                                            </div>
                                                        </div>
                                                    </button>
                                                    <button type="button" onClick={() => setAppearance('private')} className={`text-left p-4 rounded-lg border ${appearance === 'private' ? 'border-[var(--color-gold)] bg-[var(--color-gold-light-bg)]' : 'border-gray-200 bg-white'}`}>
                                                        <div className="flex items-center justify-between">
                                                            <div className="flex items-start gap-3">
                                                                <Lock size={20} className="text-gray-700 mt-1" />
                                                                <div>
                                                                    <div className="font-semibold">{getTranslation('Private', selectedLanguage)}</div>
                                                                    <div className="text-xs text-gray-500">{getTranslation('Only visible to you and the requester.', selectedLanguage)}</div>
                                                                </div>
                                                            </div>
                                                            {appearance === 'private' && <div className="text-[var(--color-gold-darker)]">✓</div>}
                                                        </div>
                                                    </button>
                                                </div>
                                            </div>

                                            {/* Your Video Link + Script fields (appear after 'How it appears') */}
                                            <div className="mb-6">
                                                <div className="rounded-lg border border-[var(--color-gold-light)] bg-[var(--color-gold-light-bg)] p-4 mb-4 flex items-center justify-between">
                                                    <div className="flex items-start gap-3">
                                                        <Link size={20} className="text-[var(--color-gold-darker)] mt-1" />
                                                        <div>
                                                            <div className="font-semibold text-[var(--color-gold-darker)]">{getTranslation('Your Video Link', selectedLanguage)}</div>
                                                            <div className="text-sm text-gray-600 mt-1">{getTranslation('✨ A permanent link will be generated when you publish', selectedLanguage)}</div>
                                                        </div>
                                                    </div>
                                                    <div>
                                                        <button type="button" onClick={handleCopyLink} className="inline-flex items-center gap-2 px-3 py-2 bg-white border border-gray-200 rounded-md">
                                                            {linkCopied ? <Copy size={16} className="text-[var(--color-gold-darker)]" /> : <Link size={16} className="text-[var(--color-gold-darker)]" />}
                                                        </button>
                                                    </div>
                                                </div>

                                                <div className="text-sm font-medium text-gray-700 mb-2">{getTranslation('Script Type', selectedLanguage)} <span className="text-red-500">*</span></div>
                                                <div className="relative mb-4" ref={scriptRef}>
                                                    <button
                                                        type="button"
                                                        onClick={() => setScriptOpen((s) => !s)}
                                                        aria-haspopup="listbox"
                                                        aria-expanded={scriptOpen}
                                                        className="w-full border border-gray-200 rounded-lg px-4 py-3 text-sm bg-white flex items-center justify-between"
                                                    >
                                                        <span className={scriptType ? 'text-gray-900' : 'text-gray-400'}>{getTranslation(scriptType || 'Select the script style used', selectedLanguage)}</span>
                                                        <svg className="ml-2" width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M6 9l6 6 6-6" stroke="#6B7280" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
                                                    </button>

                                                    {scriptOpen && (
                                                        <div className="absolute left-0 mt-2 w-full z-30 bg-white rounded-lg shadow-lg border border-gray-200 max-h-48 overflow-y-auto">
                                                            {scriptTypes.map((s) => {
                                                                const selected = s === scriptType;
                                                                return (
                                                                    <button
                                                                        key={s}
                                                                        type="button"
                                                                        onClick={() => { setScriptType(s); setScriptOpen(false); }}
                                                                        className={`w-full text-left px-4 py-2 hover:bg-gray-50 flex items-center justify-between ${selected ? 'bg-[var(--color-gold-light-bg)]' : ''}`}
                                                                    >
                                                                        <span className="text-sm text-gray-900">{getTranslation(s, selectedLanguage)}</span>
                                                                        {selected && <span className="text-[var(--color-gold-darker)]">✓</span>}
                                                                    </button>
                                                                );
                                                            })}
                                                        </div>
                                                    )}
                                                </div>

                                                <div className="flex items-center justify-between mb-2">
                                                    <div className="text-sm font-medium text-gray-700">{getTranslation('Upload Script File', selectedLanguage)} <span className="text-xs text-gray-400">{getTranslation('Optional', selectedLanguage)}</span></div>
                                                </div>

                                                <input ref={scriptInputRef} type="file" accept=".txt,.doc,.docx,.pdf" className="hidden" onChange={(e) => {
                                                    const file = e.target.files && e.target.files[0];
                                                    if (file) {
                                                        setScriptFile(file);
                                                    }
                                                }} />

                                                <div onClick={() => scriptInputRef.current && scriptInputRef.current.click()} className="w-full rounded-lg border-2 border-dashed border-gray-200 h-36 flex items-center justify-center cursor-pointer overflow-hidden bg-white">
                                                    {scriptFile ? (
                                                        <div className="text-sm text-gray-700">{getTranslation('Selected:', selectedLanguage)} {scriptFile.name} ({Math.round(scriptFile.size / 1024)} KB)</div>
                                                    ) : (
                                                        <div className="text-center text-gray-500">
                                                            <div className="w-12 h-12 rounded-md bg-[var(--color-gold-light-bg)] mx-auto mb-3 flex items-center justify-center text-[var(--color-gold)]">
                                                                <FileIcon size={20} className="text-[var(--color-gold)]" />
                                                            </div>
                                                            <div className="font-medium">{getTranslation('Upload Script File', selectedLanguage)}</div>
                                                            <div className="text-xs text-gray-400 mt-1">{getTranslation('TXT, DOC, DOCX, or PDF · Max 10MB', selectedLanguage)}</div>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>

                                            {/* If user selected "Other" allow them to describe it */}
                                            {scriptType === 'Other' && (
                                                <div className="mb-4">
                                                    <div className="text-sm font-medium text-gray-700 mb-2">{getTranslation('Please describe the script type', selectedLanguage)}</div>
                                                    <input
                                                        value={scriptOther}
                                                        onChange={(e) => setScriptOther(e.target.value)}
                                                        placeholder={getTranslation('Describe the script type', selectedLanguage)}
                                                        className="w-full p-3 border border-gray-200 rounded-lg text-sm"
                                                    />
                                                </div>
                                            )}

                                            {/* Video Overlay Editor - for adding interactive elements to public videos */}
                                            <VideoOverlayEditor
                                                videoFile={videoFile}
                                                isPublic={appearance === 'public'}
                                                onOverlaysChange={setVideoOverlays}
                                                getTranslation={getTranslation}
                                                selectedLanguage={selectedLanguage}
                                            />

                                            {/* Duplicate CTA removed — fixed action area below handles Next/Cancel */}
                                        </>
                                    )}

                                    {/* Overlays step - shown when publishStep === 'overlays' */}
                                    {publishStep === 'overlays' && (
                                        <>
                                            <div className="flex items-start justify-between mb-4">
                                                <div>
                                                    <h3 className="text-[20px] font-semibold text-gray-900">{getTranslation('Add Interactive Elements', selectedLanguage)}</h3>
                                                    <div className="text-sm text-gray-400 mt-2">{getTranslation('Make your video more engaging with clickable links and images', selectedLanguage)}</div>
                                                </div>
                                            </div>

                                            <VideoOverlayEditor
                                                videoFile={videoFile}
                                                isPublic={true}
                                                onOverlaysChange={setVideoOverlays}
                                                getTranslation={getTranslation}
                                                selectedLanguage={selectedLanguage}
                                            />
                                        </>
                                    )}
                                </React.Fragment>
                            ) : (
                                <React.Fragment>
                                    <div className="flex items-start justify-between mb-4">
                                        <div>
                                            <h3 className="text-[20px] font-semibold text-gray-900">{getTranslation('Advance Request Status', selectedLanguage)}</h3>
                                            <div className="text-sm text-gray-400">{getTranslation('Update the status and notify the requester', selectedLanguage)}</div>
                                        </div>
                                        <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600">✕</button>
                                    </div>

                                    <div className="flex items-center justify-center gap-6 my-4">
                                        <div className="text-center">
                                            <div className="text-xs text-gray-400">{getTranslation('Current Status', selectedLanguage)}</div>
                                            <div className="text-lg font-semibold mt-2">{getTranslation(steps[Math.max(0, currentStep - 1)], selectedLanguage)}</div>
                                        </div>
                                        <div className="text-2xl text-gray-400">→</div>
                                        <div className="text-center">
                                            <div className="text-xs text-gray-400">{getTranslation('Next Status', selectedLanguage)}</div>
                                            <div className="text-lg font-semibold mt-2">{getTranslation(currentStep < steps.length ? steps[currentStep] : steps[steps.length - 1], selectedLanguage)}</div>
                                        </div>
                                    </div>

                                    <div className="mt-4">
                                        <label className="text-sm font-medium text-gray-700">{getTranslation('Progress Update Message (Optional)', selectedLanguage)}</label>
                                        <textarea value={message} onChange={(e) => setMessage(e.target.value)} placeholder={getTranslation('Add a custom message for the requester...', selectedLanguage)} className="w-full mt-2 p-3 border border-gray-200 rounded-lg min-h-[120px] text-sm" />
                                    </div>

                                    <div className="mt-4 p-4 bg-blue-50 rounded-lg flex items-start gap-3">
                                        <div className="text-blue-600">🔔</div>
                                        <div className="text-sm text-blue-900">{requesterName} {getTranslation('will be notified via email and app notification', selectedLanguage)}</div>
                                    </div>

                                    <div className="mt-6 flex flex-col gap-3">
                                        <button
                                            onClick={() => {
                                                // If we're on the final step, treat this as the final Update Progress action
                                                if (currentStep === steps.length) {
                                                    try {
                                                        // inform parent we're finishing
                                                        onUpdateProgress(currentStep, message);
                                                    } catch (e) { }
                                                    setShowModal(false);
                                                    setFinished(true);
                                                    setCelebrate(true);
                                                    // auto-dismiss celebration after 3s
                                                    setTimeout(() => { setCelebrate(false); }, 3000);
                                                    return;
                                                }

                                                // compute next step (cap at length)
                                                const next = Math.min(steps.length, currentStep + 1);
                                                try {
                                                    onUpdateProgress(next, message);
                                                } catch (e) { }
                                                setShowModal(false);
                                            }}
                                            disabled={currentStep > steps.length}
                                            className={`w-full px-4 py-3 rounded-lg text-white font-semibold ${currentStep > steps.length ? 'bg-gray-300 cursor-not-allowed' : 'bg-green-600 hover:bg-green-700'}`}
                                        >
                                            <span className="mr-2">✔</span>
                                            {currentStep === steps.length ? getTranslation('Update Progress', selectedLanguage) : (currentStep === steps.length - 1 ? getTranslation('Publish Video', selectedLanguage) : getTranslation('Update Status', selectedLanguage))}
                                        </button>
                                        <button onClick={() => setShowModal(false)} className="w-full px-4 py-3 rounded-lg border border-gray-200 bg-white">{getTranslation('Cancel', selectedLanguage)}</button>
                                    </div>
                                </React.Fragment>
                            )}
                        </div>

                        {/* Fixed action area for publish modal (keeps buttons visible while content scrolls) */}
                        {(currentStep === 5 || isReuploading) && (
                            <div className="p-4 border-t bg-white">
                                {validationError && <div className="text-sm text-red-600 mb-3">{getTranslation(validationError, selectedLanguage)}</div>}
                                {/* Two-step actions: form (Next: Preview) -> preview (Publish) */}
                                {publishStep === 'form' ? (
                                    <>
                                        <button
                                            onClick={async () => {
                                                setValidationError('');
                                                // basic validation (same as before)
                                                if (!videoFile && !videoLinkUrl) { setValidationError('Please upload a video or add a video link before continuing.'); return; }
                                                if (!thumbnailFile && !thumbnailLinkUrl) { setValidationError('Please upload a thumbnail or add a link before continuing.'); return; }
                                                if (!videoTitle || videoTitle.trim().length === 0) { setValidationError(getTranslation('Please add a video title before continuing.', selectedLanguage)); return; }
                                                if (!category) { setValidationError(getTranslation('Please select a category for your video.', selectedLanguage)); return; }
                                                // Script type and script file are now optional - no validation needed
                                                // if (!scriptType) { setValidationError('Please select a Script Type for your video.'); return; }
                                                // if (scriptType === 'Other' && (!scriptOther || scriptOther.trim().length === 0)) { setValidationError('Please describe the script type when "Other" is selected.'); return; }

                                                // enforce format-specific limits
                                                if (videoFormat === 'one-time' && publishedCount >= 1) {
                                                    setValidationError('This one-time video has already been published.');
                                                    return;
                                                }
                                                if (videoFormat === 'series' && publishedCount >= seriesLimit) {
                                                    setValidationError('Series limit reached');
                                                    return;
                                                }
                                                if (videoFormat === 'catalogue' && publishedCount >= catalogueLimit) {
                                                    setValidationError('Catalogue limit reached');
                                                    return;
                                                }

                                                // prepare preview data and move to overlays step (if public) or preview step
                                                setPreviewData({
                                                    title: videoTitle,
                                                    file: videoFile,
                                                    thumbnail: thumbnailPreview || (thumbnailFile ? (typeof thumbnailFile === 'string' ? thumbnailFile : thumbnailFile.name) : null),
                                                    time: 'Just now',
                                                    format: videoFormat,
                                                    category,
                                                    scriptType,
                                                });
                                                // If video is public, show overlay editor. Otherwise skip to preview.
                                                if (appearance === 'public') {
                                                    setPublishStep('overlays');
                                                } else {
                                                    setPublishStep('preview');
                                                }
                                            }}
                                            disabled={(videoFormat === 'one-time' && publishedCount >= 1) || (videoFormat === 'series' && publishedCount >= seriesLimit) || (videoFormat === 'catalogue' && publishedCount >= catalogueLimit)}
                                            style={{ backgroundColor: authUser?.accentColor || 'var(--color-gold)' }}
                                            className={`w-full text-white px-4 py-3 rounded-lg font-semibold mb-3`}
                                        >
                                            {getTranslation('Next: Preview', selectedLanguage)}
                                        </button>
                                        <button onClick={() => setShowModal(false)} className="w-full px-4 py-3 rounded-lg border border-gray-200 bg-white">{getTranslation('Cancel', selectedLanguage)}</button>
                                    </>
                                ) : publishStep === 'overlays' ? (
                                    <>
                                        <button
                                            onClick={() => {
                                                setPublishStep('preview');
                                            }}
                                            style={{ backgroundColor: authUser?.accentColor || 'var(--color-gold)' }}
                                            className={`w-full text-white px-4 py-3 rounded-lg font-semibold mb-3`}
                                        >
                                            {getTranslation('Next: Preview', selectedLanguage)}
                                        </button>
                                        <button onClick={() => setPublishStep('form')} className="w-full px-4 py-3 rounded-lg border border-gray-200 bg-white mb-3">{getTranslation('Back', selectedLanguage)}</button>
                                        <button onClick={() => setShowModal(false)} className="w-full px-4 py-3 rounded-lg border border-gray-200 bg-white">{getTranslation('Cancel', selectedLanguage)}</button>
                                    </>
                                ) : (
                                    <>
                                        <button
                                            onClick={async () => {
                                                // run publish flow using previewData if available, otherwise fallback to current fields
                                                const pd = previewData || { title: videoTitle, file: videoFile, thumbnail: thumbnailFile ? thumbnailFile.name : null, format: videoFormat };
                                                setValidationError('');

                                                // Compute file metadata for duplicate detection
                                                const fileObj = pd.file || videoFile || null;
                                                const fileName = fileObj ? (fileObj.name || '') : '';
                                                const fileSize = fileObj ? (fileObj.size || 0) : 0;
                                                const fileType = fileObj ? (fileObj.type || '') : '';
                                                const titleStr = (pd.title || videoTitle || '').trim();
                                                const titleNormalized = titleStr.toLowerCase();

                                                // Duplicate detection: prevent publishing if an item with same title (normalized), fileName and size already exists
                                                // Duplicate detection: prevent publishing if an item with same title (normalized), fileName and size already exists
                                                // Skip duplicate detection when performing a re-upload (we will replace the original item)
                                                let dup = null;
                                                if (!isReuploading) {
                                                    dup = publishedItems && publishedItems.find((it) => {
                                                        if (!it) return false;
                                                        const itTitle = (it.title || '').toString().trim().toLowerCase();
                                                        const itName = it.fileName || '';
                                                        const itSize = it.fileSize || 0;
                                                        return itTitle === titleNormalized && itName === fileName && itSize === fileSize;
                                                    });
                                                }
                                                if (dup) {
                                                    setValidationError(getTranslation('Duplicate upload detected. This video has already been uploaded.', selectedLanguage));
                                                    return;
                                                }

                                                // Re-upload: no change note required (no input field exists for it)
                                                setUploading(true);
                                                setUploadProgress(0);
                                                try {
                                                    for (let p = 10; p <= 100; p += 10) {
                                                        // eslint-disable-next-line no-await-in-loop
                                                        await new Promise((res) => setTimeout(res, 80));
                                                        setUploadProgress(p);
                                                    }

                                                    const publishedMeta = {
                                                        id: Date.now().toString() + '-' + Math.random().toString(36).slice(2),
                                                        title: titleStr || videoTitle,
                                                        titleNormalized,
                                                        fileName,
                                                        fileSize,
                                                        fileType,
                                                        thumbnail: pd.thumbnail || (thumbnailFile ? thumbnailFile.name : null),
                                                        time: Date.now(),
                                                        format: pd.format || videoFormat,
                                                        changeNote: changeNote || null,
                                                        appearance: appearance,
                                                        privateLink: appearance === 'private' ? `${WEB_URL}/?vid=${Date.now().toString() + '-' + Math.random().toString(36).slice(2)}` : null,
                                                        overlays: videoOverlays && Array.isArray(videoOverlays) ? videoOverlays : [],
                                                    };

                                                    // POST to backend to save video
                                                    // Upload video and thumbnail files to server first
                                                    try {
                                                        const BACKEND = (window && window.__BACKEND_URL__) || 'https://pwin.onrender.com';
                                                        const token = localStorage.getItem('regaarder_token');

                                                        console.log('Uploading files to backend:', {
                                                            backend: BACKEND,
                                                            hasToken: !!token,
                                                            hasVideo: !!videoFile,
                                                            hasThumbnail: !!thumbnailFile
                                                        });

                                                        // Upload thumbnail (or use link URL)
                                                        let thumbnailUrl = thumbnailLinkUrl || thumbnailPreview;
                                                        if (!thumbnailLinkUrl && thumbnailFile && thumbnailFile instanceof File) {
                                                            const thumbFormData = new FormData();
                                                            thumbFormData.append('photo', thumbnailFile);

                                                            const thumbResponse = await fetch(`${BACKEND}/creator/photo`, {
                                                                method: 'POST',
                                                                headers: token ? { 'Authorization': `Bearer ${token}` } : {},
                                                                body: thumbFormData
                                                            });

                                                            if (thumbResponse.ok) {
                                                                const thumbData = await thumbResponse.json();
                                                                thumbnailUrl = thumbData.url;
                                                                console.log('Thumbnail uploaded:', thumbnailUrl);
                                                            } else {
                                                                console.warn('Thumbnail upload failed, using preview');
                                                            }
                                                        }

                                                        // Upload video (or use YouTube link URL)
                                                        let videoUrl = videoLinkUrl || videoPreview;
                                                        if (!videoLinkUrl && videoFile && videoFile instanceof File) {
                                                            const videoFormData = new FormData();
                                                            videoFormData.append('video', videoFile);

                                                            const videoResponse = await fetch(`${BACKEND}/creator/intro-video`, {
                                                                method: 'POST',
                                                                headers: token ? { 'Authorization': `Bearer ${token}` } : {},
                                                                body: videoFormData
                                                            });

                                                            if (videoResponse.ok) {
                                                                const videoData = await videoResponse.json();
                                                                videoUrl = videoData.url;
                                                                console.log('Video uploaded:', videoUrl);
                                                            } else {
                                                                console.warn('Video upload failed, using preview');
                                                            }
                                                        }

                                                        // Update publishedMeta with actual server URLs (so Published tab shows correct thumbnail/link)
                                                        publishedMeta.thumbnail = thumbnailUrl || publishedMeta.thumbnail;
                                                        publishedMeta.videoUrl = videoUrl || null;

                                                        // Calculate video duration from the video file or auto-detect
                                                        let videoDuration = '0:00';
                                                        if (videoLinkUrl) {
                                                            // For YouTube/link videos, try to fetch duration automatically
                                                            try {
                                                                const isYT = videoLinkUrl.includes('youtube.com') || videoLinkUrl.includes('youtu.be');
                                                                if (isYT) {
                                                                    let ytId = '';
                                                                    if (videoLinkUrl.includes('youtu.be/')) ytId = videoLinkUrl.split('youtu.be/')[1].split(/[?&#]/)[0];
                                                                    else if (videoLinkUrl.includes('youtube.com')) { try { ytId = new URL(videoLinkUrl).searchParams.get('v') || ''; } catch {} }
                                                                    if (ytId) {
                                                                        // Check localStorage cache first
                                                                        const cached = localStorage.getItem(`yt_dur_${ytId}`);
                                                                        if (cached && parseInt(cached) > 0) {
                                                                            const dur = parseInt(cached);
                                                                            videoDuration = `${Math.floor(dur / 60)}:${(dur % 60).toString().padStart(2, '0')}`;
                                                                        } else {
                                                                            // Try noembed API
                                                                            try {
                                                                                const res = await fetch(`https://noembed.com/embed?url=https://www.youtube.com/watch?v=${ytId}`);
                                                                                if (res.ok) {
                                                                                    const data = await res.json();
                                                                                    if (data.duration) {
                                                                                        const parts = String(data.duration).split(':');
                                                                                        if (parts.length === 2) videoDuration = data.duration;
                                                                                    }
                                                                                }
                                                                            } catch {}
                                                                        }
                                                                    }
                                                                }
                                                            } catch {}
                                                        } else if (videoFile) {
                                                            try {
                                                                const videoElement = document.createElement('video');
                                                                videoElement.preload = 'metadata';

                                                                // Create object URL from the file for reliable duration reading
                                                                const objectUrl = URL.createObjectURL(videoFile);
                                                                videoElement.src = objectUrl;

                                                                await new Promise((resolve, reject) => {
                                                                    const timeout = setTimeout(() => {
                                                                        URL.revokeObjectURL(objectUrl);
                                                                        resolve(); // Don't fail, just continue with 0:00
                                                                    }, 5000); // 5 second timeout

                                                                    videoElement.onloadedmetadata = () => {
                                                                        clearTimeout(timeout);
                                                                        const duration = Math.floor(videoElement.duration);
                                                                        const minutes = Math.floor(duration / 60);
                                                                        const seconds = duration % 60;
                                                                        videoDuration = `${minutes}:${seconds.toString().padStart(2, '0')}`;
                                                                        console.log('Video duration calculated:', videoDuration);
                                                                        URL.revokeObjectURL(objectUrl);
                                                                        resolve();
                                                                    };

                                                                    videoElement.onerror = (e) => {
                                                                        clearTimeout(timeout);
                                                                        console.warn('Video metadata load error:', e);
                                                                        URL.revokeObjectURL(objectUrl);
                                                                        resolve(); // Continue even if we can't get duration
                                                                    };
                                                                });
                                                            } catch (err) {
                                                                console.warn('Could not calculate video duration:', err);
                                                            }
                                                        }

                                                        const response = await fetch(`${BACKEND}/videos/publish`, {
                                                            method: 'POST',
                                                            headers: {
                                                                'Content-Type': 'application/json',
                                                                'Authorization': token ? `Bearer ${token}` : ''
                                                            },
                                                            body: JSON.stringify({
                                                                title: titleStr || videoTitle,
                                                                thumbnail: thumbnailUrl || null,
                                                                videoUrl: videoUrl || null,
                                                                category: category || 'General',
                                                                format: pd.format || videoFormat,
                                                                time: videoDuration,
                                                                requester: requesterName || null,
                                                                overlays: videoOverlays && Array.isArray(videoOverlays) ? videoOverlays : []
                                                            })
                                                        });

                                                        if (response.ok) {
                                                            const result = await response.json();
                                                            console.log('Video published successfully:', result);

                                                            // Show success toast with option to view
                                                            setToastMessage(getTranslation('Video published! Refresh home page to see it.', selectedLanguage));
                                                        } else {
                                                            console.error('Failed to publish video to backend. Status:', response.status);
                                                            const errorText = await response.text();
                                                            console.error('Error details:', errorText);
                                                            setToastMessage(getTranslation('Publishing failed. Please try again.', selectedLanguage));
                                                        }
                                                    } catch (err) {
                                                        console.error('Error publishing video to backend:', err);
                                                    }

                                                    // Behavior differs by format
                                                    if (pd.format === 'recurrent') {
                                                        const newCount = publishedCount + 1;
                                                        setPublishedCount(newCount);
                                                        setPublishedItems((arr) => [...arr, publishedMeta]);
                                                        setLastPublished(publishedMeta);
                                                        setToastMessage(`${getTranslation('Published video', selectedLanguage)} #${newCount}`);
                                                        
                                                        // Show private link modal if appearance is private
                                                        if (appearance === 'private' && publishedMeta.privateLink) {
                                                            setPrivateLink(publishedMeta.privateLink);
                                                            setShowPrivateLinkModal(true);
                                                        }

                                                        // Reset upload fields so user can add another
                                                        setVideoFile(null);
                                                        if (videoPreview) { URL.revokeObjectURL(videoPreview); setVideoPreview(null); }
                                                        setThumbnailPreview(null);
                                                        setThumbnailFile(null);
                                                        setScriptFile(null);
                                                        setScriptOther('');
                                                        setPreviewData(null);
                                                        setUploadProgress(0);
                                                        setPublishStep('form');

                                                    } else if (pd.format === 'series') {
                                                        const prevCount = publishedCount;
                                                        const newCount = prevCount + 1;
                                                        setPublishedCount(newCount);
                                                        setPublishedItems((arr) => [...arr, publishedMeta]);
                                                        setLastPublished(publishedMeta);
                                                        setToastMessage(`${getTranslation('Published episode', selectedLanguage)} #${newCount}`);
                                                        
                                                        // Show private link modal if appearance is private
                                                        if (appearance === 'private' && publishedMeta.privateLink) {
                                                            setPrivateLink(publishedMeta.privateLink);
                                                            setShowPrivateLinkModal(true);
                                                        }

                                                        // Auto-increment title for next episode: strip existing (Part N) and add next
                                                        const baseTitle = (titleStr || videoTitle || '').replace(/\s*\(Part\s*\d+\)\s*$/i, '').trim();
                                                        const nextTitle = baseTitle ? `${baseTitle} (Part ${newCount + 1})` : `Part ${newCount + 1}`;
                                                        setVideoTitle(nextTitle);

                                                        // Reset upload fields so user can add the next episode
                                                        setVideoFile(null);
                                                        if (videoPreview) { URL.revokeObjectURL(videoPreview); setVideoPreview(null); }
                                                        setThumbnailPreview(null);
                                                        setThumbnailFile(null);
                                                        setScriptFile(null);
                                                        setScriptOther('');
                                                        setPreviewData(null);
                                                        setUploadProgress(0);
                                                        setPublishStep('form');
                                                        // Clear reupload state and note after successful re-upload
                                                        setIsReuploading(false);
                                                        setChangeNote('');

                                                    } else if (pd.format === 'catalogue') {
                                                        const newCount = publishedCount + 1;
                                                        setPublishedCount(newCount);
                                                        setPublishedItems((arr) => [...arr, publishedMeta]);
                                                        setLastPublished(publishedMeta);
                                                        setToastMessage(`${getTranslation('Published item', selectedLanguage)} #${newCount}`);
                                                        
                                                        // Show private link modal if appearance is private
                                                        if (appearance === 'private' && publishedMeta.privateLink) {
                                                            setPrivateLink(publishedMeta.privateLink);
                                                            setShowPrivateLinkModal(true);
                                                        }

                                                        // Reset upload fields for next catalogue item
                                                        setVideoFile(null);
                                                        if (videoPreview) { URL.revokeObjectURL(videoPreview); setVideoPreview(null); }
                                                        setThumbnailPreview(null);
                                                        setThumbnailFile(null);
                                                        setScriptFile(null);
                                                        setScriptOther('');
                                                        setPreviewData(null);
                                                        setUploadProgress(0);
                                                        setPublishStep('form');
                                                        // Clear reupload state and note after successful re-upload
                                                        setIsReuploading(false);
                                                        setChangeNote('');

                                                    } else {
                                                        // one-time default behaviour: publish once and advance
                                                        if (isReuploading && pendingReuploadItem && pendingReuploadItem.id) {
                                                            // Replace the original published item instead of appending
                                                            const existingId = pendingReuploadItem.id;
                                                            // preserve previous id
                                                            publishedMeta.id = existingId;
                                                            setPublishedItems((arr) => {
                                                                const found = arr && arr.some((it) => it && it.id === existingId);
                                                                if (found) {
                                                                    return arr.map((it) => (it && it.id === existingId ? publishedMeta : it));
                                                                }
                                                                return [...(arr || []), publishedMeta];
                                                            });
                                                            setLastPublished(publishedMeta);
                                                            setToastMessage(getTranslation('Updated published video', selectedLanguage));
                                                            try { onUpdateProgress(Math.min(steps.length, currentStep + 1), `Re-uploaded video:${publishedMeta.fileName} thumb:${publishedMeta.thumbnail || ''}`); } catch (e) { }
                                                        } else {
                                                            const newCount = publishedCount + 1;
                                                            setPublishedCount(newCount);
                                                            setPublishedItems((arr) => [...arr, publishedMeta]);
                                                            setLastPublished(publishedMeta);
                                                            try { onUpdateProgress(Math.min(steps.length, currentStep + 1), `Uploaded video:${publishedMeta.fileName} thumb:${publishedMeta.thumbnail || ''}`); } catch (e) { }
                                                        }
                                                        // keep modal open to show preview — user can close when ready
                                                        setPublishStep('form');
                                                        setIsReuploading(false);
                                                        setChangeNote('');
                                                    }
                                                } finally {
                                                    setUploading(false);
                                                    setUploadProgress(0);
                                                }
                                            }}
                                            disabled={uploading}
                                            className={`w-full ${uploading ? 'bg-gray-300 cursor-not-allowed' : 'bg-[var(--color-gold)] text-white'} px-4 py-3 rounded-lg font-semibold mb-3`}
                                        >
                                            {uploading ? ('Uploading ' + uploadProgress + '%') : (
                                                (() => {
                                                    const nextIndex = publishedCount + 1;
                                                    const fmt = (previewData && previewData.format) || videoFormat;
                                                    if (fmt === 'recurrent') return (<React.Fragment><span className="mr-2">✨</span>Publish video #{nextIndex}</React.Fragment>);
                                                    if (fmt === 'series') return (<React.Fragment><span className="mr-2">✨</span>Publish episode #{nextIndex}</React.Fragment>);
                                                    if (fmt === 'catalogue') return (<React.Fragment><span className="mr-2">✨</span>Publish item #{nextIndex}</React.Fragment>);
                                                    // one-time
                                                    return (<React.Fragment><span className="mr-2">✨</span>{publishedCount === 0 ? 'Publish Video' : 'Published'}</React.Fragment>);
                                                })()
                                            )}
                                        </button>
                                        <button onClick={() => { setPublishStep('overlays'); }} className="w-full px-4 py-3 rounded-lg border border-gray-200 bg-white">Back</button>
                                    </>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            )}
            {/* Confetti + Success toast when celebration occurs */}
            {celebrate && (
                <>
                    <style>{`
                    @keyframes confettiFall {
                        0% { transform: translateY(-10vh) rotate(0deg); opacity: 1; }
                        100% { transform: translateY(110vh) rotate(360deg); opacity: 0.95; }
                    }
                    @keyframes confettiSwing {
                        0% { transform: translateY(0) translateX(0) rotate(0deg); }
                        50% { transform: translateY(20px) translateX(8px) rotate(90deg); }
                        100% { transform: translateY(0) translateX(0) rotate(180deg); }
                    }
                `}</style>

                    <div className="fixed inset-0 z-50 pointer-events-none overflow-hidden">
                        {/* Render a handful of confetti pieces with varied positions/delays */}
                        {(() => {
                            const colors = ['#F59E0B', '#10B981', '#3B82F6', '#EF4444', '#8B5CF6', '#06B6D4'];
                            const pieces = [];
                            for (let i = 0; i < 28; i++) {
                                const left = Math.round(Math.random() * 100);
                                const delay = Math.round(Math.random() * 800);
                                const dur = 1400 + Math.round(Math.random() * 800);
                                const w = 6 + Math.round(Math.random() * 8);
                                const h = 10 + Math.round(Math.random() * 12);
                                const color = colors[i % colors.length];
                                pieces.push(
                                    <div
                                        key={i}
                                        style={{
                                            position: 'absolute',
                                            left: `${left}%`,
                                            top: '-8%',
                                            width: w,
                                            height: h,
                                            background: color,
                                            borderRadius: 2,
                                            transformOrigin: 'center',
                                            animation: `confettiFall ${dur}ms cubic-bezier(.2,.7,.2,1) ${delay}ms forwards`,
                                            opacity: 0.95,
                                        }}
                                    />
                                );
                            }
                            return pieces;
                        })()}
                    </div>

                    {/* Prominent success toast at center (uses Toast for animations) */}
                    <Toast message={"Your video has been successfully completed. We're proud of you !"} bottom={false} duration={3500} />
                </>
            )}

            {/* Unclaim Confirmation Modal */}
            {showUnclaimModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center">
                    <div className="absolute inset-0 bg-black opacity-50" onClick={() => setShowUnclaimModal(false)} />
                    <div className="relative bg-white rounded-3xl shadow-2xl p-6 max-w-sm mx-4">
                        <div className="text-center">
                            <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-4">
                                <AlertCircle size={32} className="text-red-600" />
                            </div>
                            <h2 className="text-xl font-bold text-gray-900 mb-2">{getTranslation('Unclaim Request?', selectedLanguage)}</h2>
                            <p className="text-gray-600 text-sm mb-6">
                                {getTranslation('Are you sure you want to stop working on this request? It will become available for other creators to claim.', selectedLanguage)}
                            </p>
                            <div className="space-y-3">
                                <button
                                    onClick={async () => {
                                        try {
                                            const token = localStorage.getItem('regaarder_token');
                                            const BACKEND = (window && window.__BACKEND_URL__) || 'https://pwin.onrender.com';
                                            if (token) {
                                                const response = await fetch(`${BACKEND}/claims`, {
                                                    method: 'DELETE',
                                                    headers: {
                                                        'Content-Type': 'application/json',
                                                        'Authorization': `Bearer ${token}`
                                                    },
                                                    body: JSON.stringify({ requestId: requestId || title, title })
                                                });
                                                if (response.ok) {
                                                    setShowUnclaimModal(false);
                                                    // Call the onUnclaim callback to remove from claimed requests using ID
                                                    onUnclaim(requestId || title);
                                                    console.log('Request successfully unclaimed');
                                                } else {
                                                    const errorData = await response.json();
                                                    console.error('Failed to unclaim request:', response.status, errorData);
                                                    alert(`Failed to unclaim: ${errorData.error || 'Unknown error'}`);
                                                }
                                            }
                                        } catch (err) {
                                            console.error('Unclaim failed', err);
                                            alert('Error unclaiming request: ' + err.message);
                                        }
                                    }}
                                    className="w-full bg-red-600 text-white font-semibold py-3 rounded-lg hover:bg-red-700 transition"
                                >
                                    {getTranslation('Yes, Unclaim', selectedLanguage)}
                                </button>
                                <button
                                    onClick={() => setShowUnclaimModal(false)}
                                    className="w-full border border-gray-200 text-gray-900 font-semibold py-3 rounded-lg hover:bg-gray-50 transition"
                                >
                                    {getTranslation('Keep Working', selectedLanguage)}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Request Details Modal */}
            <RequestDetailsModal 
                isOpen={showDetailsModal} 
                onClose={() => setShowDetailsModal(false)} 
                requestData={requestData}
                selectedLanguage={selectedLanguage}
            />

            {/* Private Link Modal */}
            {showPrivateLinkModal && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 backdrop-blur-sm">
                    <div className="bg-white rounded-xl shadow-xl p-6 w-[90%] max-w-md animate-scale-in">
                        <div className="flex flex-col items-center text-center">
                            <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mb-4">
                                <CheckCircle className="w-6 h-6 text-green-600" />
                            </div>
                            <h3 className="text-xl font-bold text-gray-900 mb-2">
                                {getTranslation('Video Published Privately', selectedLanguage)}
                            </h3>
                            <p className="text-sm text-gray-500 mb-6">
                                {getTranslation('Your video is only visible to those with the link below.', selectedLanguage)}
                            </p>
                            
                            <div className="w-full flex items-center bg-gray-50 rounded-lg border border-gray-200 p-3 mb-6">
                                <span className="flex-1 truncate text-sm text-gray-600 font-mono select-all">
                                    {privateLink}
                                </span>
                                <button
                                    onClick={() => {
                                        navigator.clipboard.writeText(privateLink);
                                        setToastMessage(getTranslation('Link copied!', selectedLanguage));
                                    }}
                                    className="ml-2 bg-transparent text-gray-500 hover:text-gray-900 focus:outline-none"
                                    title={getTranslation('Copy Link', selectedLanguage)}
                                >
                                    <Copy size={18} />
                                </button>
                            </div>
                            
                            <button
                                onClick={() => setShowPrivateLinkModal(false)}
                                className="px-6 py-2.5 bg-gray-900 hover:bg-black text-white rounded-lg font-medium transition-colors w-full"
                            >
                                {getTranslation('Close', selectedLanguage)}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Upgrade to Pro Modal — shown when starter creators try to upload from device */}
            {showUpgradeModal && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm" onClick={() => setShowUpgradeModal(false)}>
                    <div className="bg-white rounded-2xl shadow-2xl p-6 w-[90%] max-w-md" onClick={(e) => e.stopPropagation()} style={{ animation: 'fadeIn 250ms ease-out' }}>
                        <style>{`@keyframes fadeIn { from { opacity: 0; transform: scale(0.95); } to { opacity: 1; transform: scale(1); } }`}</style>
                        <div className="flex flex-col items-center text-center">
                            <div className="w-16 h-16 rounded-full bg-[var(--color-gold-light-bg)] flex items-center justify-center mb-4">
                                <Lock size={28} className="text-[var(--color-gold)]" />
                            </div>
                            <h3 className="text-xl font-bold text-gray-900 mb-2">
                                {getTranslation('Pro Feature', selectedLanguage)}
                            </h3>
                            <p className="text-sm text-gray-600 mb-4 leading-relaxed">
                                {getTranslation('Uploading videos directly from your device is exclusive to Pro Creators.', selectedLanguage)}
                            </p>
                            <div className="w-full bg-gray-50 rounded-xl p-4 mb-4 text-left">
                                <p className="text-sm font-semibold text-gray-800 mb-2">
                                    {getTranslation('Starter creators can still publish videos:', selectedLanguage)}
                                </p>
                                <ul className="text-sm text-gray-600 space-y-2">
                                    <li className="flex items-start gap-2">
                                        <span className="text-[var(--color-gold)] mt-0.5">•</span>
                                        <span>{getTranslation('Upload your video to YouTube or another platform as "Unlisted"', selectedLanguage)}</span>
                                    </li>
                                    <li className="flex items-start gap-2">
                                        <span className="text-[var(--color-gold)] mt-0.5">•</span>
                                        <span>{getTranslation('Paste the video link in the field above', selectedLanguage)}</span>
                                    </li>
                                    <li className="flex items-start gap-2">
                                        <span className="text-[var(--color-gold)] mt-0.5">•</span>
                                        <span>{getTranslation('Your video will play seamlessly within Regaarder', selectedLanguage)}</span>
                                    </li>
                                </ul>
                            </div>
                            <div className="w-full flex flex-col gap-3">
                                <button
                                    onClick={() => {
                                        setShowUpgradeModal(false);
                                        try {
                                            const nav = window.__creatordashboard_navigate;
                                            if (nav) nav('/sponsorship?tab=creator');
                                            else window.location.href = '/sponsorship?tab=creator';
                                        } catch (e) {
                                            console.warn('Navigation failed', e);
                                            window.location.href = '/sponsorship?tab=creator';
                                        }
                                    }}
                                    className="w-full py-3 bg-[var(--color-gold)] text-white font-semibold rounded-lg shadow-md hover:opacity-90 transition"
                                >
                                    {getTranslation('Upgrade to Pro Creator', selectedLanguage)}
                                </button>
                                <button
                                    onClick={() => setShowUpgradeModal(false)}
                                    className="w-full py-3 border border-gray-200 text-gray-700 font-medium rounded-lg hover:bg-gray-50 transition"
                                >
                                    {getTranslation('Use video link instead', selectedLanguage)}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

                </>
            )}
        </div>
    );
};




// Main pixel-perfect dashboard
const App = () => {
    const navigate = useNavigate();
    // Expose navigate so inner components can use it for in-app routing
    window.__creatordashboard_navigate = navigate;
    const [activeTopTab, setActiveTopTab] = useState('Overview');
    const [showDropdown, setShowDropdown] = useState(false);

    // Feedback Modal State
    const [showCreatorFeedback, setShowCreatorFeedback] = useState(false);
    const [completedRequestId, setCompletedRequestId] = useState(null);

    const handleCreatorFeedbackSubmit = (answers) => {
        try {
            console.log('Creator Feedback:', answers);
            // Save to local storage for demo
            const feedbackKey = `feedback_creator_${completedRequestId || 'general'}`;
            localStorage.setItem(feedbackKey, JSON.stringify(answers));
        } catch (e) { console.error(e); }
    };

    // Check URL parameters on mount to navigate to specific tab
    useEffect(() => {
        try {
            const params = new URLSearchParams(window.location.search);
            const tabParam = params.get('tab');
            if (tabParam && baseTopTabs.includes(tabParam)) {
                setActiveTopTab(tabParam);
            }
        } catch (e) {
            console.error('Error parsing URL params:', e);
        }
    }, []);

    // Listen for claim events from RequestsFeed
    useEffect(() => {
        const handleClaim = (event) => {
            try {
                const claimData = event.detail;
                if (claimData) {
                    // Switch to Claims tab
                    setActiveTopTab('Claims');
                    // Add the claimed request data
                    const newClaim = {
                        id: claimData.requestId,
                        title: claimData.title,
                        requesterName: claimData.requesterName,
                        requesterAvatar: claimData.requesterAvatar,
                        funding: claimData.funding,
                        description: claimData.description,
                        currentStep: claimData.currentStep || 1,
                        claimedAt: claimData.claimedAt
                    };

                    setClaimedRequests(prev => {
                        // Avoid duplicates just in case
                        if (prev.some(r => r.id === newClaim.id)) return prev;
                        return [newClaim, ...prev];
                    });
                    // Ensure panel is expanded
                    setClaimsMinimized(false);
                }
            } catch (e) {
                console.error('Error handling claim event:', e);
            }
        };

        window.addEventListener('request:claimed', handleClaim);
        return () => window.removeEventListener('request:claimed', handleClaim);
    }, []);

    // Base list of top tabs (kept as canonical order) — display order can change based on search
    const baseTopTabs = ['Overview', 'Requests', 'Claims', 'Published', 'Analytics', 'Upload', 'Insights', 'Support', 'Templates'];
    // Dashboard search state (controls ordering of cards and tabs)
    const [dashboardSearch, setDashboardSearch] = useState('');
    const [selectedLanguage, setSelectedLanguage] = useState(() => (typeof window !== 'undefined' ? localStorage.getItem('regaarder_language') : 'English') || 'English');

    useEffect(() => {
        const handleStorage = () => {
            const lang = localStorage.getItem('regaarder_language') || 'English';
            setSelectedLanguage(lang);
        };
        window.addEventListener('storage', handleStorage);
        return () => window.removeEventListener('storage', handleStorage);
    }, []);

    const getTopTabs = () => {
        const normalized = (dashboardSearch || '').toString().trim().toLowerCase();
        if (!normalized) return baseTopTabs;
        const matches = baseTopTabs.filter(t => t.toLowerCase().includes(normalized));
        const others = baseTopTabs.filter(t => !t.toLowerCase().includes(normalized));
        return [...matches, ...others];
    };
    // Track user's creator plan to control feature access
    const [userPlan, setUserPlan] = useState(null);
    const [isProCreator, setIsProCreator] = useState(false);

    // Category states (moved from ClaimStatusPanel where they were causing errors)
    const [categories, setCategories] = useState(['Travel', 'Education', 'Entertainment', 'Music', 'Sports']);
    const [categoryOpen, setCategoryOpen] = useState(false);
    const [category, setCategory] = useState('');
    const [isAddingCategory, setIsAddingCategory] = useState(false);
    const [newCategoryName, setNewCategoryName] = useState('');
    const { user: authUser } = useAuth(); // For accent color

    // Fetch user plan on mount
    useEffect(() => {
        const fetchUserPlan = async () => {
            try {
                const token = localStorage.getItem('regaarder_token');
                if (!token) return;

                const BACKEND = (window && window.__BACKEND_URL__) || import.meta.env.VITE_BACKEND_URL || import.meta.env.VITE_BACKEND || 'https://pwin.onrender.com';
                const response = await fetch(`${BACKEND}/users/me`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                
                if (response.ok) {
                    const data = await response.json();
                    if (data.user) {
                        setUserPlan(data.user.userPlan || null);
                        // Check if user is on Pro Creator plan
                        setIsProCreator((data.user.userPlan || '').toLowerCase() === 'procreator');
                    }
                }
            } catch (err) {
                console.warn('Error fetching user plan:', err);
            }
        };

        fetchUserPlan();
    }, []);

    // Fetch categories from backend - matching home page logic
    const fetchCategories = useCallback(async () => {
         try {
             // Fallback default list
            const defaults = ['Travel', 'Education', 'Entertainment', 'Music', 'Sports'];

            const BACKEND = (window && window.__BACKEND_URL__) || import.meta.env.VITE_BACKEND_URL || import.meta.env.VITE_BACKEND || 'https://pwin.onrender.com';
            const res = await fetch(`${BACKEND}/categories`);
            if (res.ok) {
                const data = await res.json();
                if (Array.isArray(data) && data.length > 0) {
                    setCategories(data);
                    return;
                }
            }
             // Fallback if empty/error
             setCategories(prev => prev.length > 0 ? prev : defaults);
         } catch(e) { console.error("Could not fetch categories", e); }
    }, []);

    // Initial load
    useEffect(() => {
        fetchCategories();
    }, [fetchCategories]);

    // Refetch when opening dropdown
    useEffect(() => {
        if (categoryOpen && !isAddingCategory) {
            fetchCategories();
        }
    }, [categoryOpen, isAddingCategory, fetchCategories]);

    const handleSaveNewCategory = async () => {
        if (!newCategoryName.trim()) {
            setIsAddingCategory(false);
            return;
        }

        try {
            const raw = newCategoryName.trim();
            const BACKEND = (window && window.__BACKEND_URL__) || import.meta.env.VITE_BACKEND_URL || import.meta.env.VITE_BACKEND || 'https://pwin.onrender.com';
            const res = await fetch(`${BACKEND}/categories`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ category: raw })
            });
            
            if (res.ok) {
                const updatedList = await res.json();
                setCategories(updatedList);
                setCategory(raw); // Select it
            }
        } catch (e) {
            console.error("Failed to save category", e);
        }

        setNewCategoryName('');
        setIsAddingCategory(false);
        setCategoryOpen(false);
    };

    const handleCategorySelect = (c) => {
        setCategory(c);
        setCategoryOpen(false);
    };
    const categoryRef = useRef(null);

    const [claimedRequests, setClaimedRequests] = useState(() => {
        try {
            const saved = (typeof localStorage !== 'undefined') && localStorage.getItem('claimedRequests');
            return saved ? JSON.parse(saved) : [];
        } catch (e) { return []; }
    });
    // For backward compatibility or reupload, we might use a separate state or just append to list.
    // We will use claimedRequests exclusively for the claims tab.

    useEffect(() => {
        try {
            if (typeof localStorage !== 'undefined') {
                localStorage.setItem('claimedRequests', JSON.stringify(claimedRequests));
            }
        } catch (e) { }
    }, [claimedRequests]);

    useEffect(() => {
        const handleStorage = (e) => {
            if (e.key === 'claimedRequests') {
                try {
                    const val = e.newValue;
                    setClaimedRequests(val ? JSON.parse(val) : []);
                } catch (err) { }
            }
        };
        window.addEventListener('storage', handleStorage);
        return () => window.removeEventListener('storage', handleStorage);
    }, []);

    const [pendingReuploadItem, setPendingReuploadItem] = useState(null);
    const [collapsedRequests, setCollapsedRequests] = useState({}); // Track which requests are collapsed by ID
    const [claimsMinimized, setClaimsMinimized] = useState(false);
    // Published list stored in local state (backed by localStorage)
    const [publishedList, setPublishedList] = useState(() => {
        try {
            if (typeof localStorage !== 'undefined') {
                const raw = localStorage.getItem('publishedItems');
                return raw ? JSON.parse(raw) : [];
            }
        } catch (e) { /* ignore */ }
        return [];
    });
    const [showUploadModal, setShowUploadModal] = useState(false);
    const [uploadFile, setUploadFile] = useState(null);
    const [uploadTitle, setUploadTitle] = useState('');
    const [uploadThumbPreview, setUploadThumbPreview] = useState(null);
    const [uploadThumbFile, setUploadThumbFile] = useState(null);
    const [uploadingLocal, setUploadingLocal] = useState(false);
    // Requests list received from RequestsFeed (used to compute active counts and earnings)
    const [requestsList, setRequestsList] = useState([]);

    const [appToast, setAppToast] = useState('');
    const [deletingId, setDeletingId] = useState(null);
    const [pressedId, setPressedId] = useState(null);
    const [deleteCandidate, setDeleteCandidate] = useState(null);

    const handleDeletePressStart = (id) => {
        setPressedId(id);
    };

    const handleDeletePressEnd = () => {
        setPressedId(null);
    };

    // Swipe navigation state (use refs to avoid re-renders)
    const swipeRef = useRef({ active: false, startX: 0, startY: 0, lastX: 0 });

    const onTouchStart = (e) => {
        try {
            if (!e.touches || e.touches.length !== 1) return;
            const t = e.touches[0];
            swipeRef.current.active = true;
            swipeRef.current.startX = t.clientX;
            swipeRef.current.startY = t.clientY;
            swipeRef.current.lastX = t.clientX;
        } catch (err) {
            swipeRef.current.active = false;
        }
    };

    const onTouchMove = (e) => {
        try {
            if (!swipeRef.current.active || !e.touches || e.touches.length !== 1) return;
            swipeRef.current.lastX = e.touches[0].clientX;
        } catch (err) {
            swipeRef.current.active = false;
        }
    };

    const finishSwipe = (endX, endY) => {
        try {
            if (!swipeRef.current.active) return;
            const dx = endX - swipeRef.current.startX;
            const dy = endY - swipeRef.current.startY;
            const absDx = Math.abs(dx);
            const absDy = Math.abs(dy);
            const threshold = 60; // minimum px to count as a swipe
            const verticalLimit = 80; // max vertical movement allowed
            if (absDx > threshold && absDy < verticalLimit) {
                const currentTabs = getTopTabs();
                const idx = currentTabs.indexOf(activeTopTab);
                if (dx < 0 && idx >= 0 && idx < currentTabs.length - 1) {
                    // swipe left -> next tab
                    setActiveTopTab(currentTabs[idx + 1]);
                } else if (dx > 0 && idx > 0) {
                    // swipe right -> previous tab
                    setActiveTopTab(currentTabs[idx - 1]);
                }
            }
        } catch (err) {
            // swallow errors to avoid blanking the UI
            console.warn('Swipe handling failed', err);
        } finally {
            swipeRef.current.active = false;
        }
    };

    const onTouchEnd = (e) => {
        try {
            if (!e.changedTouches || e.changedTouches.length === 0) { swipeRef.current.active = false; return; }
            const t = e.changedTouches[0];
            finishSwipe(t.clientX, t.clientY);
        } catch (err) {
            swipeRef.current.active = false;
        }
    };

    // Mouse support (desktop): treat mouse drag as swipe
    const onMouseDown = (e) => {
        try {
            swipeRef.current.active = true;
            swipeRef.current.startX = e.clientX;
            swipeRef.current.startY = e.clientY;
            swipeRef.current.lastX = e.clientX;
            // attach listeners to window for move/up to ensure we capture outside the element
            window.addEventListener('mousemove', onMouseMove);
            window.addEventListener('mouseup', onMouseUp);
        } catch (err) {
            swipeRef.current.active = false;
        }
    };

    const onMouseMove = (e) => {
        try {
            if (!swipeRef.current.active) return;
            swipeRef.current.lastX = e.clientX;
        } catch (err) {
            swipeRef.current.active = false;
        }
    };

    const onMouseUp = (e) => {
        if (!swipeRef.current.active) return;
        finishSwipe(e.clientX, e.clientY);
        window.removeEventListener('mousemove', onMouseMove);
        window.removeEventListener('mouseup', onMouseUp);
    };

    // reload published list when storage changes or when switching to Published tab
    useEffect(() => {
        const onStorage = (e) => {
            if (e.key === 'publishedItems') {
                try { setPublishedList(e.newValue ? JSON.parse(e.newValue) : []); } catch (err) { }
            }
        };
        window.addEventListener('storage', onStorage);
        return () => window.removeEventListener('storage', onStorage);
    }, []);

    useEffect(() => {
        // refresh when switching to Published tab in same window (storage event not fired)
        if (activeTopTab === 'Published') {
            try {
                const raw = localStorage.getItem('publishedItems');
                setPublishedList(raw ? JSON.parse(raw) : []);
            } catch (e) { }
        }
    }, [activeTopTab]);

    const persistPublishedList = (arr) => {
        try {
            setPublishedList(arr);
            if (typeof localStorage !== 'undefined') localStorage.setItem('publishedItems', JSON.stringify(arr));
        } catch (e) { /* ignore */ }
    };

    const handleDeletePublished = (id) => {
        try {
            setDeletingId(id);
            const next = publishedList.filter((i) => i.id !== id);
            persistPublishedList(next);
            setAppToast(getTranslation('Deleted', selectedLanguage));
            setTimeout(() => setAppToast(''), 1800);
        } finally {
            // slight delay so user sees deleting state
            setTimeout(() => setDeletingId(null), 300);
        }
    };

    // Re-upload flow: set `pendingReuploadItem` and switch to Claims
    const openReupload = (item) => {
        const newId = 'reupload-' + Date.now();
        const newClaim = {
            id: newId,
            title: item?.title || getTranslation('Untitled', selectedLanguage),
            requesterName: item?.requesterName || getTranslation('Requester', selectedLanguage),
            requesterAvatar: item?.requesterAvatar || null,
            currentStep: 5,
            isReupload: true,
            sourceTab: 'Published' // Track that this re-upload came from Published tab
        };
        setClaimedRequests(prev => [newClaim, ...prev]);
        setPendingReuploadItem({ ...item, targetClaimId: newId, sourceTab: 'Published', openInForm: true, isReupload: true });
        // Switch to Claims tab so the ClaimStatusPanel can consume the pendingReuploadItem
        setActiveTopTab('Claims');
    };

    const handleStartUpload = () => {
        const newId = 'upload-' + Date.now();
        const newClaim = {
            id: newId,
            title: '',
            requesterName: getTranslation('You', selectedLanguage),
            requesterAvatar: null,
            currentStep: 5,
            isReupload: false
        };
        setClaimedRequests(prev => [newClaim, ...prev]);
        setPendingReuploadItem({
            title: '',
            thumbnail: null,
            openInForm: true,
            isReupload: false,
            targetClaimId: newId
        });
        setActiveTopTab('Claims');
    };

    // Callback passed to RequestsFeed so it can tell the parent to switch to Claimed
    const handleRequestClaim = (request) => {
        setActiveTopTab('Claims');
        if (request && typeof request === 'object') {
            setClaimedRequests(prev => {
                if (prev.some(r => r.id === request.id)) return prev;
                return [request, ...prev];
            });
        }
    };

    // Called when the ClaimStatusPanel modal advances the status
    const handleUpdateClaimStatus = (nextStep, message, requestId) => {
        // Get the request that's being updated
        const requestBeingUpdated = claimedRequests.find(r => r.id === requestId);
        
        setClaimedRequests((prev) => {
            return prev.map(req => {
                if (req.id === requestId) {
                    return { ...req, currentStep: nextStep };
                }
                return req;
            });
        });
        
        // If this is the final step (completion), move to published
        const stepsCount = 6; // Based on ClaimStatusPanel steps
        if (nextStep >= stepsCount && requestBeingUpdated) {
            setTimeout(() => {
                // Remove from claims
                setClaimedRequests(prev => prev.filter(r => r.id !== requestId));
                
                // Add to published list
                const publishedItem = {
                    id: requestBeingUpdated.id,
                    title: requestBeingUpdated.title,
                    description: requestBeingUpdated.description,
                    funding: requestBeingUpdated.funding,
                    requesterName: requestBeingUpdated.requesterName,
                    requesterAvatar: requestBeingUpdated.requesterAvatar,
                    format: requestBeingUpdated.format,
                    completedAt: Date.now(),
                    currentStep: nextStep,
                    originalClaim: requestBeingUpdated
                };
                setPublishedList(prev => [publishedItem, ...prev]);

                // TRIGGER FEEDBACK for Creator
                setCompletedRequestId(requestBeingUpdated.id);
                setShowCreatorFeedback(true);
            }, 2000);
        }
        
        // Ensure this request is considered active in the Requests list so
        // the Active Requests card and the Claims view reflect the update.
        try {
            setRequestsList((prev) => {
                const list = Array.isArray(prev) ? prev.slice() : [];
                if (!requestId) return list;

                // try to find by id
                const idx = list.findIndex((r) => r && r.id === requestId);

                if (idx !== -1) {
                    // update existing entry's step (preserve other fields)
                    const updated = { ...(list[idx] || {}), currentStep: nextStep };
                    list.splice(idx, 1, updated);
                    return list;
                }
                return list;
            });
        } catch (e) {
            console.warn('Update claim stats error', e);
        }
        // Auto-switch to Active Claims tab when status is updated
        setActiveTopTab('Claims');
        // Optionally store or send `message` to server here.
        console.log('Status updated to', nextStep, 'message:', message);

        // Update server and notify requester
        try {
            const token = localStorage.getItem('regaarder_token');
            const rid = requestId;
            if (token && rid) {
                const BACKEND = (window && window.__BACKEND_URL__) || 'https://pwin.onrender.com';
                fetch(`${BACKEND}/requests/${rid}/status`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    },
                    body: JSON.stringify({ step: nextStep, message })
                }).then(res => {
                    if (res.ok) setToastMessage('Status updated & requester notified');
                }).catch(err => console.error('Status update failed', err));
            }
        } catch (e) {
            console.error('Failed to update status on server', e);
        }
        // Try to resync published list from localStorage
        try {
            const raw = (typeof localStorage !== 'undefined') && localStorage.getItem('publishedItems');
            if (raw) setPublishedList(JSON.parse(raw));
        } catch (e) { }
    };

    // Header navigation guard and active state for header buttons (prevents double navigation)
    const headerNavigatedRef = useRef(false);
    const [profileActive, setProfileActive] = useState(false);
    // Separate active state for Settings so tapping it doesn't affect Profile
    const [settingsActive, setSettingsActive] = useState(false);
    // Availability state for the creator
    const [isAvailable, setIsAvailable] = useState(true);
    const [showUnavailableModal, setShowUnavailableModal] = useState(false);
    const [showPrivateLinkModal, setShowPrivateLinkModal] = useState(false);
    const [privateLink, setPrivateLink] = useState(null);
    const [privateLinkCopied, setPrivateLinkCopied] = useState(false);

    // First-time user welcome popup
    const [showWelcomePopup, setShowWelcomePopup] = useState(() => {
        try {
            const seen = localStorage.getItem('creatorDashboardWelcomeSeen');
            return !seen;
        } catch (e) {
            return true;
        }
    });

    const closeWelcomePopup = () => {
        setShowWelcomePopup(false);
        try {
            localStorage.setItem('creatorDashboardWelcomeSeen', 'true');
        } catch (e) {
            // ignore
        }
    };

    const topActiveClass = "flex items-center gap-2 px-5 py-2 rounded-xl bg-[var(--color-gold-light-bg)] text-[var(--color-gold)] font-semibold text-[15px] shadow-sm min-w-[160px] whitespace-nowrap";
    const topInactiveClass = "flex items-center gap-2 px-5 py-2 rounded-xl bg-white border border-[var(--color-gold-light-bg)] text-gray-900 font-semibold text-[15px] shadow-sm min-w-[160px] whitespace-nowrap";

    // Cards — base definitions. We'll reorder these so any card matching the search moves to the front.
    const normalizedCardsSearch = (dashboardSearch || '').toString().trim().toLowerCase();
    const cardsBase = [
        {
            id: 'earnings',
            title: getTranslation('Total Earnings', selectedLanguage),
            jsx: (
                <div key="earnings" className="snap-start min-w-full flex-shrink-0 px-5">
                    <div className="rounded-3xl p-6 shadow-lg border-2 flex flex-col items-start justify-between min-h-[200px] relative overflow-hidden" style={{ background: 'white', borderColor: 'var(--color-purple)' }}>
                        <div className="flex items-center gap-3 mb-3">
                            <div className="w-12 h-12 rounded-2xl flex items-center justify-center shadow-md" style={{ background: 'var(--color-purple)' }}>
                                <Trophy size={22} className="text-white" fill="white" />
                            </div>
                            <span className="text-[14px] font-bold uppercase tracking-wider" style={{ color: 'var(--color-purple)' }}>{getTranslation('Total Earnings', selectedLanguage)}</span>
                        </div>
                        <div className="flex-1 flex flex-col justify-center">
                            <div className="text-[32px] font-bold text-gray-900 mb-2 leading-none tracking-tight">--</div>
                            <span className="text-[13px] text-gray-600 font-medium">{getTranslation('Start earning today', selectedLanguage)}</span>
                        </div>
                    </div>
                </div>
            )
        },
        {
            id: 'requests',
            title: getTranslation('Active Requests', selectedLanguage),
            jsx: (
                <div key="requests" className="snap-start min-w-full flex-shrink-0 px-5">
                    <div className="rounded-3xl p-6 shadow-lg border-2 flex flex-col items-start justify-between min-h-[200px] relative overflow-hidden" style={{ background: 'white', borderColor: 'var(--color-purple)' }}>
                        <div className="flex items-center gap-3 mb-3">
                            <div className="flex items-center gap-2">
                                <span className="text-[14px] font-bold uppercase tracking-wider" style={{ color: 'var(--color-purple)' }}>{getTranslation('Active Requests', selectedLanguage)}</span>
                                <span className="px-2.5 py-1 rounded-full text-white text-[10px] font-bold shadow-md" style={{ background: 'var(--color-purple)' }}>{getTranslation('NEW', selectedLanguage)}</span>
                            </div>
                        </div>
                        {(() => {
                            try {
                                const activeCount = (claimedRequests || []).length;
                                const totalEarnings = (claimedRequests || []).reduce((s, it) => s + (Number(it.funding) || 0), 0);
                                const label = activeCount === 1 ? getTranslation('active request', selectedLanguage) : getTranslation('active requests', selectedLanguage);
                                return (
                                    <div className="flex-1 flex flex-col justify-center">
                                        <div className="text-[32px] font-bold text-gray-900 mb-2 leading-none">{activeCount}</div>
                                        <span className="text-[13px] text-gray-600 font-medium">{activeCount ? `${activeCount} ${label}` : getTranslation('No active requests', selectedLanguage)}</span>
                                    </div>
                                );
                            } catch (e) {
                                return (
                                    <div className="flex-1 flex flex-col justify-center">
                                        <div className="text-[32px] font-bold text-gray-900 mb-2 leading-none">0</div>
                                        <span className="text-[13px] text-gray-600 font-medium">{getTranslation('No active requests', selectedLanguage)}</span>
                                    </div>
                                );
                            }
                        })()}
                    </div>
                </div>
            )
        },
        {
            id: 'rating',
            title: getTranslation('Avg Rating', selectedLanguage),
            jsx: (
                <div key="rating" className="snap-start min-w-full flex-shrink-0 px-5">
                    <div className="rounded-3xl p-6 shadow-lg border-2 flex flex-col items-start justify-between min-h-[200px] relative overflow-hidden" style={{ background: 'white', borderColor: 'var(--color-purple)' }}>
                        <div className="flex items-center gap-3 mb-3">
                            <div className="w-12 h-12 rounded-2xl flex items-center justify-center shadow-md" style={{ background: 'var(--color-purple)' }}>
                                <Star size={22} className="text-white" fill="white" />
                            </div>
                            <span className="text-[14px] font-bold uppercase tracking-wider" style={{ color: 'var(--color-purple)' }}>{getTranslation('Avg Rating', selectedLanguage)}</span>
                        </div>
                        <div className="flex-1 flex flex-col justify-center">
                            <div className="text-[32px] font-bold text-gray-900 mb-2 leading-none tracking-tight">--</div>
                            <span className="text-[14px] text-gray-600 font-medium">{getTranslation('Not rated yet ⭐', selectedLanguage)}</span>
                        </div>
                    </div>
                </div>
            )
        },
        {
            id: 'response',
            title: getTranslation('Response Time', selectedLanguage),
            jsx: (
                <div key="response" className="snap-start min-w-full flex-shrink-0 px-5">
                    <div className="rounded-3xl p-6 shadow-lg border-2 flex flex-col items-start justify-between min-h-[200px] relative overflow-hidden" style={{ background: 'white', borderColor: 'var(--color-purple)' }}>
                        <div className="flex items-center gap-3 mb-3">
                            <div className="w-12 h-12 rounded-2xl flex items-center justify-center shadow-md" style={{ background: 'var(--color-purple)' }}>
                                <Zap size={22} className="text-white" fill="white" />
                            </div>
                            <span className="text-[14px] font-bold uppercase tracking-wider" style={{ color: 'var(--color-purple)' }}>{getTranslation('Response Time', selectedLanguage)}</span>
                        </div>
                        <div className="flex-1 flex flex-col justify-center">
                            <div className="text-[32px] font-bold text-gray-900 mb-2 leading-none tracking-tight">--</div>
                            <span className="text-[14px] text-gray-600 font-medium">{getTranslation('Start responding ⚡', selectedLanguage)}</span>
                        </div>
                    </div>
                </div>
            )
        }
    ];
    const orderedCards = normalizedCardsSearch
        ? [...cardsBase.filter(c => c.title.toLowerCase().includes(normalizedCardsSearch)), ...cardsBase.filter(c => !c.title.toLowerCase().includes(normalizedCardsSearch))]
        : cardsBase;

    return (
        <div
            data-creatordashboard-root
            className="w-full max-w-[640px] mx-auto min-h-screen bg-white font-sans relative overflow-y-auto"
            style={{ ...customStyle, paddingBottom: 'calc(115px + env(safe-area-inset-bottom))' }}
        >
            {/* Page Selector Dropdown */}
            <div
                className="-mx-6 -mt-6 pt-10 pb-10"
                style={{
                    background: 'var(--color-purple)',
                    borderTop: '3px solid var(--color-purple)',
                    borderLeft: '3px solid var(--color-purple)',
                    borderRight: '3px solid var(--color-purple)',
                    borderTopLeftRadius: '16px',
                    borderTopRightRadius: '16px',
                    paddingTop: 'calc(40px + env(safe-area-inset-top, 0px))'
                }}
            >
                <div className="relative px-6">
                    <button
                        onClick={() => setShowDropdown(!showDropdown)}
                        className="w-full px-5 py-3 rounded-2xl border-2 flex items-center justify-between font-semibold text-[15px] shadow-md transition-all"
                        style={{
                            backgroundColor: 'var(--color-purple)',
                            color: 'white',
                            borderColor: 'var(--color-purple)',
                            opacity: 0.95
                        }}
                        onBlur={(e) => {
                            // Only close dropdown if focus is moving outside the dropdown menu
                            if (!e.currentTarget.parentElement.contains(e.relatedTarget)) {
                                setTimeout(() => setShowDropdown(false), 150);
                            }
                        }}
                    >
                        <span className="flex items-center gap-2">
                            {activeTopTab === 'Overview' && <TrendingUp size={18} />}
                            {activeTopTab === 'Requests' && <FileText size={18} />}
                            {activeTopTab === 'Claims' && <CheckCheck size={18} />}
                            {activeTopTab === 'Published' && <Video size={18} />}
                            {activeTopTab === 'Analytics' && <LineChart size={18} />}
                            {activeTopTab === 'Upload' && <Upload size={18} />}
                            {activeTopTab === 'Insights' && <Lightbulb size={18} />}
                            {activeTopTab === 'Support' && <Headphones size={18} />}
                            {activeTopTab === 'Templates' && <Copy size={18} />}
                            {getTranslation(activeTopTab, selectedLanguage)}
                        </span>
                        <ChevronDown size={20} className="transition-transform" style={{transform: showDropdown ? 'rotate(180deg)' : 'rotate(0deg)'}} />
                    </button>

                    {showDropdown && (
                        <div className="absolute top-full left-5 right-5 mt-2 rounded-2xl border-2 shadow-2xl z-50" style={{background: 'var(--color-purple)', borderColor: 'var(--color-purple)'}}>
                            {/* Header buttons section */}
                            <div className="px-4 py-3 flex items-center gap-2">
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        setIsAvailable(!isAvailable);
                                    }}
                                    className="px-3 py-2 rounded-lg text-[12px] font-bold shadow text-center flex-shrink-0 transition-all"
                                    style={{
                                        background: isAvailable ? 'rgb(187, 247, 208)' : 'rgb(254, 202, 202)',
                                        color: isAvailable ? 'rgb(22, 101, 52)' : 'rgb(127, 29, 29)',
                                        border: 'none'
                                    }}
                                >
                                    {getTranslation(isAvailable ? 'Available' : 'Unavailable', selectedLanguage)}
                                </button>
                                <button
                                    className={`px-3 py-2 rounded-lg border border-gray-200 text-gray-700 text-[12px] font-medium flex items-center justify-center shadow-sm flex-shrink-0 ${settingsActive ? 'bg-white' : 'bg-white'}`}
                                    onClick={() => {
                                        try {
                                            localStorage.setItem('redirectBackTo', 'creatorDashboard');
                                            navigate('/settings');
                                            setShowDropdown(false);
                                        } catch (e) {
                                            console.warn('Navigation failed', e);
                                        }
                                    }}
                                >
                                    <Star size={14} className="mr-1" />
                                    {getTranslation('Settings', selectedLanguage)}
                                </button>
                                <button
                                    className={`px-3 py-2 rounded-lg border border-gray-200 text-gray-700 text-[12px] font-medium flex items-center justify-center shadow-sm flex-shrink-0 ${profileActive ? 'bg-white' : 'bg-white'}`}
                                    onMouseDown={() => {
                                        setProfileActive(true);
                                        if (!headerNavigatedRef.current) {
                                            headerNavigatedRef.current = true;
                                            try {
                                                localStorage.setItem('redirectBackTo', 'creatorDashboard');
                                                window.location.href = '/creatorprofile.jsx';
                                            } catch (e) { console.warn('Navigation failed', e); }
                                        }
                                    }}
                                    onTouchStart={() => {
                                        setProfileActive(true);
                                        if (!headerNavigatedRef.current) {
                                            headerNavigatedRef.current = true;
                                            try {
                                                localStorage.setItem('redirectBackTo', 'creatorDashboard');
                                                window.location.href = '/creatorprofile.jsx';
                                            } catch (e) { /* ignore */ }
                                        }
                                    }}
                                    onClick={(e) => {
                                        if (headerNavigatedRef.current) { headerNavigatedRef.current = false; e.preventDefault(); setProfileActive(false); return; }
                                        setProfileActive(false);
                                        try {
                                            localStorage.setItem('redirectBackTo', 'creatorDashboard');
                                            window.location.href = '/creatorprofile.jsx';
                                        } catch (e) { console.warn('Navigation failed', e); }
                                    }}
                                    onMouseUp={() => setProfileActive(false)}
                                    onTouchEnd={() => setProfileActive(false)}
                                >
                                    <User size={14} className="mr-1" />
                                    {getTranslation('Profile', selectedLanguage)}
                                </button>
                            </div>
                            
                            {/* Page tabs */}
                            {baseTopTabs.map((tabName) => {
                                const isActive = activeTopTab === tabName;
                                return (
                                    <button
                                        key={tabName}
                                        onClick={() => {
                                            setActiveTopTab(tabName);
                                            setShowDropdown(false);
                                        }}
                                        className={`w-full px-5 py-3 text-left text-[15px] font-semibold flex items-center gap-3 transition-colors ${ isActive ? 'bg-var(--color-purple-light-bg)' : 'hover:bg-purple-600'}`}
                                        style={isActive ? {color: 'white', background: 'rgba(255, 255, 255, 0.15)'} : {color: 'white'}}
                                    >
                                        {(() => {
                                            switch (tabName) {
                                                case 'Overview': return <TrendingUp size={18} />;
                                                case 'Requests': return <FileText size={18} />;
                                                case 'Claims': return <CheckCheck size={18} />;
                                                case 'Published': return <Video size={18} />;
                                                case 'Analytics': return <LineChart size={18} />;
                                                case 'Upload': return <Upload size={18} />;
                                                case 'Insights': return <Lightbulb size={18} />;
                                                case 'Support': return <Headphones size={18} />;
                                                case 'Templates': return <Copy size={18} />;
                                                default: return null;
                                            }
                                        })()}
                                        {getTranslation(tabName, selectedLanguage)}
                                    </button>
                                );
                            })}
                        </div>
                    )}
                </div>
            </div>

            {/* Welcome popup for first-time users */}
            {showWelcomePopup && (
                <div className="fixed inset-0 z-50 flex items-center justify-center">
                    <div className="absolute inset-0 bg-black opacity-60" onClick={closeWelcomePopup} />
                    <div className="relative bg-white rounded-2xl shadow-2xl max-w-md w-full mx-4 z-10 p-6">
                        <button onClick={closeWelcomePopup} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600">✕</button>

                        <div className="flex items-center gap-3 mb-4">
                            <div className="w-14 h-14 rounded-xl bg-[var(--color-gold)] flex items-center justify-center shadow-md">
                                <Video size={24} className="text-white" />
                            </div>
                            <div>
                                <h3 className="text-[20px] font-semibold text-gray-900">{getTranslation('Welcome to Creator Dashboard', selectedLanguage)}</h3>
                            </div>
                        </div>

                        <p className="text-[15px] text-gray-600 leading-relaxed mb-6">
                            {getTranslation('Manage your video requests and grow your audience. Track your earnings, respond to requests, and publish amazing content all in one place.', selectedLanguage)}
                        </p>

                        <div className="space-y-3 mb-6">
                            <div className="flex items-start gap-3 p-3 rounded-lg bg-[var(--color-gold-light-bg)]">
                                <div className="w-8 h-8 rounded-lg bg-[var(--color-gold)] flex items-center justify-center flex-shrink-0 mt-0.5">
                                    <FileText size={16} className="text-white" />
                                </div>
                                <div>
                                    <div className="font-semibold text-gray-900 text-sm">{getTranslation('Browse Requests', selectedLanguage)}</div>
                                    <div className="text-xs text-gray-600 mt-0.5">{getTranslation('Find video requests that match your skills', selectedLanguage)}</div>
                                </div>
                            </div>

                            <div className="flex items-start gap-3 p-3 rounded-lg bg-[var(--color-gold-light-bg)]">
                                <div className="w-8 h-8 rounded-lg bg-[var(--color-gold)] flex items-center justify-center flex-shrink-0 mt-0.5">
                                    <Video size={16} className="text-white" />
                                </div>
                                <div>
                                    <div className="font-semibold text-gray-900 text-sm">{getTranslation('Create & Publish', selectedLanguage)}</div>
                                    <div className="text-xs text-gray-600 mt-0.5">{getTranslation('Upload your videos and track their performance', selectedLanguage)}</div>
                                </div>
                            </div>

                            <div className="flex items-start gap-3 p-3 rounded-lg bg-[var(--color-gold-light-bg)]">
                                <div className="w-8 h-8 rounded-lg bg-[var(--color-gold)] flex items-center justify-center flex-shrink-0 mt-0.5">
                                    <Star size={16} className="text-white" />
                                </div>
                                <div>
                                    <div className="font-semibold text-gray-900 text-sm">{getTranslation('Earn Money', selectedLanguage)}</div>
                                    <div className="text-xs text-gray-600 mt-0.5">{getTranslation('Get paid for fulfilling video requests', selectedLanguage)}</div>
                                </div>
                            </div>
                        </div>

                        <button
                            onClick={closeWelcomePopup}
                            className="w-full bg-[var(--color-gold)] text-white px-6 py-3 rounded-lg font-semibold shadow-md"
                        >
                            {getTranslation('Get Started', selectedLanguage)}
                        </button>
                    </div>
                </div>
            )}

            {/* Unavailable Modal */}
            {showUnavailableModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center">
                    <div className="absolute inset-0 bg-black opacity-60" onClick={() => setShowUnavailableModal(false)} />
                    <div className="relative bg-white rounded-2xl shadow-2xl max-w-md w-full mx-4 z-10 p-6">
                        <button onClick={() => setShowUnavailableModal(false)} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600">✕</button>

                        <div className="flex items-center gap-3 mb-4">
                            <div className="w-14 h-14 rounded-xl bg-red-100 flex items-center justify-center shadow-md">
                                <AlertCircle size={24} className="text-red-600" />
                            </div>
                            <div>
                                <h3 className="text-[20px] font-semibold text-gray-900">{getTranslation('Creator Unavailable', selectedLanguage)}</h3>
                            </div>
                        </div>

                        <p className="text-[15px] text-gray-600 leading-relaxed mb-6">
                            {getTranslation('This creator is unavailable right now. You can check back later or send your request to another creator.', selectedLanguage)}
                        </p>

                        <button
                            onClick={() => setShowUnavailableModal(false)}
                            className="w-full bg-gray-900 text-white px-6 py-3 rounded-lg font-semibold shadow-md"
                        >
                            {getTranslation('Got It', selectedLanguage)}
                        </button>
                    </div>
                </div>
            )}

            {/* Private Video Link Modal */}
            {showPrivateLinkModal && privateLink && (
                <div className="fixed inset-0 z-50 flex items-center justify-center">
                    <div className="absolute inset-0 bg-black opacity-60" onClick={() => setShowPrivateLinkModal(false)} />
                    <div className="relative bg-white rounded-2xl shadow-2xl max-w-md w-full mx-4 z-10 p-6">
                        <button onClick={() => setShowPrivateLinkModal(false)} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600">✕</button>

                        <div className="flex items-center gap-3 mb-4">
                            <div className="w-14 h-14 rounded-xl bg-purple-100 flex items-center justify-center shadow-md">
                                <Lock size={24} className="text-purple-600" />
                            </div>
                            <div>
                                <h3 className="text-[20px] font-semibold text-gray-900">{getTranslation('Private Video Published', selectedLanguage)}</h3>
                            </div>
                        </div>

                        <p className="text-[15px] text-gray-600 leading-relaxed mb-4">
                            {getTranslation('Your video has been published as private. Share this link with the requester to let them view it.', selectedLanguage)}
                        </p>

                        <div className="bg-gray-50 rounded-lg p-4 mb-4">
                            <div className="text-xs text-gray-500 mb-2">{getTranslation('Private Video Link', selectedLanguage)}</div>
                            <div className="flex items-center gap-2">
                                <input 
                                    type="text" 
                                    value={privateLink} 
                                    readOnly 
                                    className="flex-1 bg-white border border-gray-200 rounded px-3 py-2 text-sm text-gray-900 font-mono"
                                />
                                <button
                                    onClick={async () => {
                                        try {
                                            await navigator.clipboard.writeText(privateLink);
                                            setPrivateLinkCopied(true);
                                            setTimeout(() => setPrivateLinkCopied(false), 2000);
                                        } catch (e) {
                                            window.prompt && window.prompt('Copy this link', privateLink);
                                        }
                                    }}
                                    className="px-3 py-2 bg-purple-600 text-white rounded text-sm font-semibold hover:bg-purple-700 transition-colors"
                                >
                                    {privateLinkCopied ? '✓' : getTranslation('Copy', selectedLanguage)}
                                </button>
                            </div>
                        </div>

                        <button
                            onClick={() => setShowPrivateLinkModal(false)}
                            className="w-full bg-gray-900 text-white px-6 py-3 rounded-lg font-semibold shadow-md"
                        >
                            {getTranslation('Done', selectedLanguage)}
                        </button>
                    </div>
                </div>
            )}

            {/* Cards Row with Accent Background and Border */}
            <div className="mt-0 -mx-6 px-0 py-6" style={{ backgroundColor: 'var(--color-purple)', minHeight: '280px', borderLeft: '3px solid var(--color-purple)', borderRight: '3px solid var(--color-purple)', borderBottom: '3px solid var(--color-purple)', borderBottomLeftRadius: '16px', borderBottomRightRadius: '16px' }}>
                <div
                    className="overflow-x-auto hide-scrollbar snap-x snap-mandatory flex gap-4"
                    style={{ WebkitOverflowScrolling: 'touch', paddingLeft: '20px', paddingRight: '20px', scrollPaddingLeft: '20px' }}
                >
                    {orderedCards.map(c => c.jsx)}
                </div>
            </div>
            {/* Content area — show RequestsFeed when Requests tab is active, otherwise show overview placeholders */}
            {activeTopTab === 'Requests' ? (
                <div className="mt-7">
                    <RequestsFeed onClaim={handleRequestClaim} onData={setRequestsList} />
                </div>
            ) : activeTopTab === 'Claims' ? (
                <div className="px-6 mt-7 pb-20">
                    <h3 className="text-[18px] font-semibold text-gray-900 mb-4">{getTranslation('Active Claims', selectedLanguage)}</h3>
                    {/* Active requests stats */}
                    {(() => {
                        const activeCount = (claimedRequests || []).length;
                        const totalEarnings = (claimedRequests || []).reduce((s, it) => s + (Number(it.funding) || 0), 0);
                        return (
                            <div className="flex items-center justify-between mb-4">
                                <div className="text-sm text-gray-600">{getTranslation('Active requests:', selectedLanguage)} <span className="font-semibold text-gray-900">{activeCount}</span></div>
                                <div className="text-sm text-gray-600">{getTranslation('Potential earnings:', selectedLanguage)} <span className="font-semibold text-gray-900">${totalEarnings.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 2 })}</span></div>
                            </div>
                        );
                    })()}

                    {claimedRequests.length === 0 ? (
                        <div className="rounded-2xl bg-white border border-gray-100 shadow-sm p-8 flex flex-col items-center justify-center min-h-[260px]">
                            <div className="w-20 h-20 rounded-xl bg-[var(--color-gold-light-bg)] flex items-center justify-center mb-6 shadow-sm">
                                <CheckCheck size={32} className="text-[var(--color-gold)]" />
                            </div>
                            <h4 className="text-lg font-bold text-gray-900 mb-2">{getTranslation('No Active Claims', selectedLanguage)}</h4>
                            <p className="text-sm text-gray-600 text-center max-w-sm mb-6">
                                {getTranslation('Claim a request from the Requests tab to start working on it and track your progress here.', selectedLanguage)}
                            </p>
                            <button
                                onClick={() => setActiveTopTab('Requests')}
                                className="px-5 py-2 rounded-lg font-semibold text-white transition-all hover:opacity-90 shadow-md"
                                style={{ backgroundColor: 'var(--color-gold)' }}
                            >
                                {getTranslation('Browse Requests', selectedLanguage)}
                            </button>
                        </div>
                    ) : (
                        <div className="space-y-6">
                            {claimedRequests.map((req, idx) => {
                                // Auto-collapse if more than 2 active requests
                                const shouldCollapse = claimedRequests.length > 2 && idx > 0;
                                const isCollapsed = collapsedRequests[req.id] !== false ? shouldCollapse : false;
                                
                                return (
                                    <div key={req.id || Math.random()}>
                                        {/* Collapse button for requests beyond the first when 2+ exist */}
                                        {claimedRequests.length > 2 && idx > 0 && (
                                            <button
                                                onClick={() => setCollapsedRequests(prev => ({
                                                    ...prev,
                                                    [req.id]: !isCollapsed
                                                }))}
                                                className="text-sm text-[var(--color-gold)] font-semibold mb-2 flex items-center gap-2 hover:opacity-80"
                                            >
                                                {isCollapsed ? '▶' : '▼'} {req.title}
                                            </button>
                                        )}
                                        {!isCollapsed && (
                                            <ClaimStatusPanel
                                                key={req.id || Math.random()}
                                                title={req.title}
                                                requesterName={req.requesterName}
                                                requesterAvatar={req.requesterAvatar}
                                                currentStep={req.currentStep || 1}
                                                requestId={req.id}
                                                requestData={req}
                                                onClose={() => { }}
                                                onUpdateProgress={(step, msg) => {
                                                    handleUpdateClaimStatus(step, msg, req.id);
                                                }}
                                                onUnclaim={(requestIdentifier) => {
                                                    // Remove the unclaimed request from claimedRequests using ID
                                                    setClaimedRequests(prev => prev.filter(r => r.id !== requestIdentifier));
                                                }}
                                                // Pass pendingReuploadItem ONLY if it targets this request (or if reupload has no target ID, pass to first/active?)
                                                pendingReuploadItem={pendingReuploadItem && (pendingReuploadItem.targetClaimId === req.id) ? pendingReuploadItem : null}
                                                clearPendingReupload={() => setPendingReuploadItem(null)}
                                                isProCreator={isProCreator}
                                            />
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            ) : activeTopTab === 'Published' ? (
                <div className="px-6 mt-7">
                    <div className="mb-4 flex items-center justify-between">
                        <h3 className="text-[18px] font-semibold text-gray-900">{getTranslation('Published', selectedLanguage)}</h3>
                        <button onClick={() => { setActiveTopTab('Upload'); }} className="text-[var(--color-gold)] font-medium">{getTranslation('Upload New', selectedLanguage)}</button>
                    </div>

                    {publishedList && publishedList.length > 0 ? (
                        <div className="space-y-4">
                            {publishedList.map((item) => (
                                <div key={item.id} className="bg-white rounded-2xl p-4 border border-[var(--color-gold-light-bg)] shadow-sm flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className="w-20 h-12 rounded-md overflow-hidden bg-gray-100 flex items-center justify-center">
                                            {item.thumbnail ? (
                                                <img src={item.thumbnail} alt={item.title} className="w-full h-full object-cover" />
                                            ) : (
                                                <Video size={20} />
                                            )}
                                        </div>
                                        <div>
                                            <div className="font-semibold text-gray-900">{item.title}</div>
                                            <div className="text-xs text-gray-500">{new Date(item.time || item.completedAt || Date.now()).toLocaleString()} {item.changeNote ? `• ${getTranslation('Updated:', selectedLanguage)} ${item.changeNote}` : ''}</div>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <button onClick={() => openReupload(item)} className="px-3 py-1 rounded-md border border-gray-200 text-sm text-gray-700">{getTranslation('Re-upload', selectedLanguage)}</button>
                                        <button
                                            onClick={() => setDeleteCandidate(item)}
                                            onMouseDown={() => handleDeletePressStart(item.id)}
                                            onTouchStart={() => handleDeletePressStart(item.id)}
                                            onMouseUp={handleDeletePressEnd}
                                            onMouseLeave={handleDeletePressEnd}
                                            onTouchEnd={handleDeletePressEnd}
                                            disabled={deletingId === item.id}
                                            className={`px-3 py-1 rounded-md text-sm transition-colors duration-150 ${deletingId === item.id ? 'bg-red-100 text-red-400 border border-red-100 cursor-not-allowed' : pressedId === item.id ? 'bg-red-50 text-red-700 border border-red-200' : 'border border-red-200 text-red-600'}`}
                                        >
                                            {deletingId === item.id ? getTranslation('Deleting...', selectedLanguage) : (pressedId === item.id ? getTranslation('Delete', selectedLanguage) : getTranslation('Delete', selectedLanguage))}
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="rounded-2xl bg-white border border-[var(--color-gold-light-bg)] shadow-sm p-8 flex flex-col items-center justify-center min-h-[160px]">
                            <div className="w-20 h-20 rounded-xl bg-[var(--color-gold-light-bg)] flex items-center justify-center mb-6 shadow-sm">
                                <div className="w-12 h-12 rounded-lg bg-white flex items-center justify-center">
                                    <Video size={24} className="text-[var(--color-gold)]" />
                                </div>
                            </div>
                            <h3 className="text-[20px] font-semibold text-gray-900 mb-3">{getTranslation('No Published Videos Yet', selectedLanguage)}</h3>
                            <p className="text-sm text-gray-500 text-center max-w-[320px]">{getTranslation('Your published videos will appear here', selectedLanguage)}</p>
                        </div>
                    )}

                    {/* Reupload modal */}
                    {deleteCandidate && (
                        <div className="fixed inset-0 z-50 flex items-center justify-center">
                            <div className="absolute inset-0 bg-black opacity-60" onClick={() => setDeleteCandidate(null)} />
                            <div className="relative bg-white rounded-lg shadow-xl max-w-sm w-full mx-4 z-10 p-4">
                                <div className="flex items-start justify-between mb-4">
                                    <div>
                                        <h3 className="text-[18px] font-semibold text-gray-900">{getTranslation('Delete Published Video?', selectedLanguage)}</h3>
                                        <div className="text-sm text-gray-500 mt-1">{getTranslation('This action cannot be undone. Are you sure you want to delete this video?', selectedLanguage)}</div>
                                    </div>
                                    <button onClick={() => setDeleteCandidate(null)} className="text-gray-400 hover:text-gray-600">✕</button>
                                </div>

                                <div className="flex items-center gap-3 mb-4">
                                    <div className="w-16 h-10 rounded-md overflow-hidden bg-gray-100 flex items-center justify-center">
                                        {deleteCandidate.thumbnail ? <img src={deleteCandidate.thumbnail} alt={deleteCandidate.title} className="w-full h-full object-cover" /> : <Video size={20} />}
                                    </div>
                                    <div>
                                        <div className="font-semibold">{deleteCandidate.title}</div>
                                        <div className="text-xs text-gray-500">{new Date(deleteCandidate.time).toLocaleString()}</div>
                                    </div>
                                </div>

                                <div className="flex gap-2">
                                    <button onClick={() => { handleDeletePublished(deleteCandidate.id); setDeleteCandidate(null); setPressedId(null); }} className="flex-1 px-4 py-2 rounded-lg bg-red-600 text-white">{getTranslation('Delete', selectedLanguage)}</button>
                                    <button onClick={() => { setDeleteCandidate(null); setPressedId(null); }} className="flex-1 px-4 py-2 rounded-lg border border-gray-200 bg-white">{getTranslation('Cancel', selectedLanguage)}</button>
                                </div>
                            </div>
                        </div>
                    )}


                    {/* small toast (moved to bottom for better visibility) */}
                    {appToast && (
                        <Toast message={appToast} bottom={true} />
                    )}
                </div>
            ) : activeTopTab === 'Upload' ? (
                <div className="px-6 mt-7">
                    {isProCreator ? (
                        <div className="rounded-2xl bg-white border border-[var(--color-gold-light-bg)] shadow-sm p-8 flex flex-col items-center justify-center min-h-[260px]">
                            <div className="w-20 h-20 rounded-xl bg-[var(--color-gold-light-bg)] flex items-center justify-center mb-6 shadow-sm">
                                <div className="w-12 h-12 rounded-lg bg-[var(--color-gold-light-bg)] flex items-center justify-center">
                                    <Upload size={24} className="text-[var(--color-gold)]" />
                                </div>
                            </div>
                            <h3 className="text-[20px] font-semibold text-gray-900 mb-3">{getTranslation('Upload', selectedLanguage)}</h3>
                            <p className="text-sm text-gray-500 text-center max-w-[320px] mb-6">{getTranslation('Upload videos independently without waiting for requests. Available exclusively for Premium creators.', selectedLanguage)}</p>
                            <div className="flex flex-col gap-3 items-center">
                                {(() => {
                                    try {
                                        const uploadedCount = (publishedList || []).length;
                                        const allowed = uploadedCount < 1;
                                        if (allowed) {
                                            return (
                                                <>
                                                    <button onClick={handleStartUpload} className="bg-[var(--color-gold)] text-white px-5 py-2 rounded-lg shadow-md font-semibold">{getTranslation('Upload Video', selectedLanguage)}</button>
                                                    <button onClick={() => setActiveTopTab('Published')} className="px-4 py-2 rounded-lg border border-[var(--color-gold-light-bg)] text-gray-700 bg-white">{getTranslation('View Published', selectedLanguage)}</button>
                                                </>
                                            );
                                        }
                                        return (
                                            <>
                                                <div className="text-center max-w-[320px] text-sm text-gray-700">{getTranslation('You have reached the free upload limit. Subscribe to upload more videos.', selectedLanguage)}</div>
                                                <div className="flex gap-3 mt-4">
                                                    <button onClick={() => { navigate('/sponsorship'); }} className="px-4 py-2 rounded-lg bg-[var(--color-gold)] text-white">{getTranslation('Subscribe', selectedLanguage)}</button>
                                                    <button onClick={() => setActiveTopTab('Published')} className="px-4 py-2 rounded-lg border border-[var(--color-gold-light-bg)] bg-white">{getTranslation('View Published', selectedLanguage)}</button>
                                                </div>
                                            </>
                                        );
                                    } catch (e) {
                                        return (<button onClick={handleStartUpload} className="bg-[var(--color-gold)] text-white px-5 py-2 rounded-lg shadow-md font-semibold">{getTranslation('Upload Video', selectedLanguage)}</button>);
                                    }
                                })()}
                            </div>
                        </div>
                    ) : (
                        <div className="rounded-2xl bg-white border border-gray-200 shadow-sm p-8 flex flex-col items-center justify-center min-h-[260px]">
                            <div className="w-20 h-20 rounded-xl bg-gray-100 flex items-center justify-center mb-6 shadow-sm">
                                <div className="w-12 h-12 rounded-lg bg-gray-100 flex items-center justify-center">
                                    <Lock size={24} className="text-gray-400" />
                                </div>
                            </div>
                            <h3 className="text-[20px] font-semibold text-gray-900 mb-3">{getTranslation('Pro Feature', selectedLanguage)}</h3>
                            <p className="text-sm text-gray-500 text-center max-w-[320px] mb-6">{getTranslation('Upload videos independently without waiting for requests. This feature is exclusive to Pro Creators. Upgrade to unlock independent uploads.', selectedLanguage)}</p>
                            <div className="flex flex-col gap-3 items-center">
                                <button onClick={() => { navigate('/sponsorship'); }} className="bg-[var(--color-gold)] text-white px-5 py-2 rounded-lg shadow-md font-semibold">{getTranslation('Upgrade to Pro', selectedLanguage)}</button>
                                <button onClick={() => setActiveTopTab('Claims')} className="px-4 py-2 rounded-lg border border-gray-200 text-gray-700 bg-white">{getTranslation('Fulfill Requests Instead', selectedLanguage)}</button>
                            </div>
                        </div>
                    )}

                </div>
            ) : activeTopTab === 'Insights' ? (
                <div className="px-6 mt-7">
                    <div className="rounded-2xl bg-white border border-[var(--color-gold-light-bg)] shadow-sm p-8 flex flex-col items-center justify-center min-h-[260px]">
                        <div className="w-20 h-20 rounded-xl bg-[var(--color-gold-light-bg)] flex items-center justify-center mb-6 shadow-sm">
                            <div className="w-12 h-12 rounded-lg bg-white flex items-center justify-center">
                                <Lightbulb size={24} className="text-[var(--color-gold)]" />
                            </div>
                        </div>
                        <h3 className="text-[20px] font-semibold text-gray-900 mb-3">{getTranslation('Insights Coming Soon', selectedLanguage)}</h3>
                        <p className="text-sm text-gray-500 text-center max-w-[340px] mb-6">{getTranslation('Complete your first few requests to unlock personalized insights, tips, and recommendations to grow your creator business.', selectedLanguage)}</p>
                        <button className="flex items-center gap-3 bg-[var(--color-gold)] text-white px-6 py-3 rounded-lg shadow-md">
                            <Pencil className="w-4 h-4" />
                            <span className="font-semibold">{getTranslation('Complete Your Profile', selectedLanguage)}</span>
                        </button>
                    </div>
                </div>
            ) : activeTopTab === 'Support' ? (
                <div className="px-6 mt-7">
                    <div className="rounded-2xl bg-white border border-[var(--color-gold-light-bg)] shadow-sm p-8 flex flex-col items-center justify-center min-h-[260px]">
                        <div className="w-20 h-20 rounded-xl bg-[var(--color-gold-light-bg)] flex items-center justify-center mb-6 shadow-sm">
                            <div className="w-12 h-12 rounded-lg bg-white flex items-center justify-center">
                                <Headphones size={24} className="text-[var(--color-gold)]" />
                            </div>
                        </div>
                        <h3 className="text-[20px] font-semibold text-gray-900 mb-3">{getTranslation('We\'re Here to Help', selectedLanguage)}</h3>
                        <p className="text-sm text-gray-500 text-center max-w-[340px] mb-6">{getTranslation('Get personalized support for everything from technical issues to creative guidance. Our creator success team is dedicated to your growth.', selectedLanguage)}</p>

                        <div className="flex flex-col gap-3 w-full max-w-[360px]">
                            <div className="flex items-center gap-3 bg-[var(--color-gold-light-bg)] border border-[var(--color-gold-light-bg)] rounded-lg px-4 py-3">
                                <Clock size={16} className="text-[var(--color-accent-text)]" />
                                <div className="text-sm text-gray-700">{getTranslation('Avg response:', selectedLanguage)} <span className="font-semibold">{getTranslation('2 hours', selectedLanguage)}</span></div>
                            </div>

                            <div className="flex items-center gap-3 bg-[var(--color-gold-light-bg)] border border-[var(--color-gold-light-bg)] rounded-lg px-4 py-3">
                                <CheckCircle size={16} className="text-[var(--color-accent-text)]" />
                                <div className="text-sm text-gray-700">{getTranslation('98% satisfaction rate', selectedLanguage)}</div>
                            </div>
                        </div>
                    </div>
                </div>
            ) : activeTopTab === 'Templates' ? (
                <div className="px-6 mt-7">
                    <div className="rounded-2xl bg-white border border-[var(--color-gold-light-bg)] shadow-sm p-8 flex flex-col items-center justify-center min-h-[260px]">
                        <div className="w-20 h-20 rounded-xl bg-[var(--color-gold-light-bg)] flex items-center justify-center mb-6 shadow-sm">
                            <div className="w-12 h-12 rounded-lg bg-white flex items-center justify-center">
                                <Copy size={24} className="text-[var(--color-gold)]" />
                            </div>
                        </div>
                        <h3 className="text-[20px] font-semibold text-gray-900 mb-1">{getTranslation('Response Templates', selectedLanguage)}</h3>
                        <div className="text-sm text-gray-500 mb-4">{getTranslation('Coming Soon', selectedLanguage)}</div>
                        <p className="text-sm text-gray-500 text-center max-w-[340px]">{getTranslation('Save and reuse templates for common responses, video scripts, and messages to streamline your workflow.', selectedLanguage)}</p>
                    </div>
                </div>
            ) : activeTopTab === 'Analytics' ? (
                // New Analytics empty state block
                <div className="px-6 mt-7">
                    <div className="rounded-2xl bg-white border border-[var(--color-gold-light-bg)] shadow-sm p-6 min-h-[260px]">
                        <div className="flex items-center justify-between mb-5">
                            <div>
                                <h3 className="text-[18px] font-semibold text-gray-900">{getTranslation('Analytics', selectedLanguage)}</h3>
                                <p className="text-[13px] text-gray-500 mt-1">{getTranslation('Track performance metrics across your videos and requests', selectedLanguage)}</p>
                            </div>
                            <button className="flex items-center gap-2 px-3 py-1 rounded-lg bg-[var(--color-gold-light-bg)] border border-[var(--color-gold-light-bg)] text-gray-900 font-semibold text-[13px] shadow-sm h-9">
                                <BarChart size={16} className="mr-1 text-[var(--color-accent-text)]" />
                                {getTranslation('Export', selectedLanguage)}
                            </button>
                        </div>

                        <div className="flex flex-col md:flex-row gap-6">
                            <div className="flex-1 rounded-lg bg-[var(--color-gold-light-bg)] border border-[var(--color-gold-light-bg)] p-5 flex flex-col items-start justify-center min-h-[160px]">
                                <div className="flex items-center gap-3 mb-3">
                                    <div className="w-10 h-10 rounded-md bg-[var(--color-gold-light-bg)] flex items-center justify-center">
                                        <LineChart size={20} className="text-[var(--color-gold)]" />
                                    </div>
                                    <div>
                                        <div className="text-sm font-semibold text-gray-900">{getTranslation('Views & Watch Time', selectedLanguage)}</div>
                                        <div className="text-[13px] text-gray-400">{getTranslation('No data available yet', selectedLanguage)}</div>
                                    </div>
                                </div>
                                <div className="text-[14px] text-gray-500">{getTranslation('Accept and publish videos to start collecting analytics like views, watch time, and engagement.', selectedLanguage)}</div>
                            </div>

                            <div className="flex-1 rounded-lg bg-[var(--color-gold-light-bg)] border border-[var(--color-gold-light-bg)] p-5 flex flex-col items-start justify-center min-h-[160px]">
                                <div className="flex items-center gap-3 mb-3">
                                    <div className="w-10 h-10 rounded-md bg-[var(--color-gold-light-bg)] flex items-center justify-center">
                                        <TrendingUp size={20} className="text-[var(--color-gold)]" />
                                    </div>
                                    <div>
                                        <div className="text-sm font-semibold text-gray-900">{getTranslation('Growth', selectedLanguage)}</div>
                                        <div className="text-[13px] text-gray-400">{getTranslation('No growth data yet', selectedLanguage)}</div>
                                    </div>
                                </div>
                                <div className="text-[14px] text-gray-500">{getTranslation('Complete requests and share videos to begin tracking follower and audience growth.', selectedLanguage)}</div>
                            </div>
                        </div>

                        <div className="mt-6 flex items-center gap-3">
                            <button onClick={() => setActiveTopTab('Requests')} className="bg-[var(--color-gold)] text-white px-5 py-2 rounded-lg shadow-md font-semibold">{getTranslation('View Requests', selectedLanguage)}</button>
                            <button onClick={() => setActiveTopTab('Upload')} className="px-4 py-2 rounded-lg border border-[var(--color-gold-light-bg)] text-gray-700 bg-white">{getTranslation('Upload Video', selectedLanguage)}</button>
                        </div>
                    </div>
                </div>
            ) : (
                <React.Fragment>
                    {/* Performance Metrics Empty State */}
                    <div className="px-6 mt-7">
                        <div className="rounded-2xl bg-white border border-[var(--color-gold-light-bg)] shadow-sm p-8 flex flex-col items-center justify-center min-h-[220px]">
                            <div className="flex justify-between w-full mb-6">
                                <div>
                                    <div className="text-[18px] font-semibold text-gray-900">{getTranslation('Performance Metrics', selectedLanguage)}</div>
                                    <div className="text-[14px] text-gray-400 font-normal">{getTranslation('Track your success over time', selectedLanguage)}</div>
                                </div>
                                <button className="flex items-center gap-2 px-3 py-1 rounded-lg bg-[var(--color-gold-light-bg)] border border-[var(--color-gold-light-bg)] text-gray-900 font-semibold text-[15px] shadow-sm h-10">
                                    <BarChart size={20} className="mr-1 text-[var(--color-accent-text)]" />
                                    {getTranslation('Export', selectedLanguage)}
                                </button>
                            </div>
                            <div className="flex flex-col items-center justify-center flex-1">
                                <div className="w-16 h-16 rounded-xl bg-gray-50 flex items-center justify-center mb-4">
                                    <BarChart size={40} className="text-[var(--color-accent-text)]" />
                                </div>
                                <div className="text-[16px] text-gray-500 font-medium mb-1">{getTranslation('No data to display yet', selectedLanguage)}</div>
                                <div className="text-[14px] text-gray-400 font-normal text-center">{getTranslation('Start accepting and completing requests to see your performance metrics', selectedLanguage)}</div>
                            </div>
                        </div>
                    </div>
                    {/* Recent Activity Empty State */}
                    <div className="px-6 mt-7">
                        <div className="rounded-2xl bg-white border border-[var(--color-gold-light-bg)] shadow-sm p-8 flex flex-col items-center justify-center min-h-[220px]">
                            <div className="text-[18px] font-semibold text-gray-900 mb-6 self-start">{getTranslation('Recent Activity', selectedLanguage)}</div>
                            <div className="flex flex-col items-center justify-center flex-1">
                                <div className="w-16 h-16 rounded-xl bg-gray-50 flex items-center justify-center mb-4">
                                    <Clock size={40} className="text-[var(--color-accent-text)]" />
                                </div>
                                <div className="text-[16px] text-gray-500 font-medium mb-1">{getTranslation('No active requests in progress', selectedLanguage)}</div>
                                <div className="text-[14px] text-gray-400 font-normal">{getTranslation('Accept requests from the marketplace to see activity here', selectedLanguage)}</div>
                            </div>
                        </div>
                    </div>
                    {/* Earnings Overview Empty State */}
                    <div className="px-6 mt-7">
                        <div className="rounded-2xl bg-white border border-[var(--color-gold-light-bg)] shadow-sm p-8 flex flex-col items-center justify-center min-h-[220px]">
                            <div className="text-[18px] font-semibold text-gray-900 mb-6 self-start">{getTranslation('Earnings Overview', selectedLanguage)}</div>
                            <div className="flex flex-col items-center justify-center flex-1">
                                <div className="w-16 h-16 rounded-xl bg-gray-50 flex items-center justify-center mb-4">
                                    <span className="text-[32px] text-[var(--color-accent-text)] font-bold">$</span>
                                </div>
                                <div className="text-[16px] text-gray-500 font-medium mb-1">{getTranslation('No earnings yet', selectedLanguage)}</div>
                                <div className="text-[14px] text-gray-400 font-normal text-center">{getTranslation('Complete your first video request to start earning', selectedLanguage)}</div>
                            </div>
                        </div>
                    </div>
                </React.Fragment>
            )}
            {/* Feedback Modal for Creator */}
             <FeedbackModal
                isOpen={showCreatorFeedback}
                onClose={() => setShowCreatorFeedback(false)}
                onSubmit={handleCreatorFeedbackSubmit}
                title={getTranslation('How was the publishing process?', selectedLanguage)}
                questions={[
                    { id: 'understood', type: 'likert', label: getTranslation('Did you easily understand the process?', selectedLanguage) },
                    { id: 'length', type: 'likert', label: getTranslation('Was the process fast enough?', selectedLanguage) },
                    { id: 'friction', type: 'text', label: getTranslation('Did you face any friction? (Optional)', selectedLanguage), placeholder: 'Describe any issues...' },
                    { id: 'satisfaction', type: 'likert', label: getTranslation('Overall Satisfaction', selectedLanguage) },
                    { id: 'suggestions', type: 'text', label: getTranslation('Suggestions for improvement', selectedLanguage) }
                ]}
            />
            {/* Footer */}
            <SharedBottomBar selectedLanguage={selectedLanguage} />

        </div>
    );
};

export default App;
