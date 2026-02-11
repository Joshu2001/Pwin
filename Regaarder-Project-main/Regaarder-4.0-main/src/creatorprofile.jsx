/* eslint-disable no-empty */
import React, { useState, useRef, useEffect } from 'react';
import { X, Menu, Bell, Settings, Search, Star, TrendingUp, Trophy, Home, FileText, Lightbulb, MoreHorizontal, MoreVertical, Heart, ThumbsDown, Eye, MessageSquare, Share2, Palette, Shield, Globe, Gift, DollarSign, Users, Monitor, BookOpen, History, Scissors, Zap, CreditCard, Crown, Tag, User, Folder, Shuffle, Camera, Pencil, PencilLine, ShoppingBag, Video, Sparkles, Pin, Bookmark, Info, EyeOff, Flag, Check, AlertCircle, AlertTriangle, Sun, Moon, ArrowLeft, VolumeX, Play, Pause, Save, ChevronDown, Upload, CheckCircle, Mail, ChevronUp, ChevronLeft, Clapperboard, Coins } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { getTranslation } from './translations';
import { WEB_URL } from './config';
import SharedBottomBar from './components/SharedBottomBar.jsx';

// Utility function to format numbers as 1k, 1m, etc.
const formatNumber = (num) => {
    if (!num || num === 0) return '0';
    const number = parseInt(num) || 0;
    if (number >= 1000000) {
        return (number / 1000000).toFixed(1).replace(/\.0$/, '') + 'm';
    }
    if (number >= 1000) {
        return (number / 1000).toFixed(1).replace(/\.0$/, '') + 'k';
    }
    return number.toString();
};

// (removed incorrect self-referential inline CSS vars)

const CustomPencilLine = ({ size = 24, className = '', ...props }) => (
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={`lucide lucide-pencil-line-icon lucide-pencil-line ${className}`} {...props}>
        <path d="M13 21h8" /><path d="m15 5 4 4" /><path d="M21.174 6.812a1 1 0 0 0-3.986-3.987L3.842 16.174a2 2 0 0 0-.5.83l-1.321 4.352a.5.5 0 0 0 .623.622l4.353-1.32a2 2 0 0 0 .83-.497z" />
    </svg>
);

const CustomClapperboard = ({ size = 24, className = '', ...props }) => (
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} {...props}>
        <path d="M22 10v6a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2v-6Z" />
        <path d="M2 10V6a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v4Z" />
        <path d="m2 10 6-6" />
        <path d="m8 10 6-6" />
        <path d="m14 10 6-6" />
    </svg>
);

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
        eye: Eye,
        message: MessageSquare,
        share: Share2,
        trendingUp: TrendingUp,
        pencil: Pencil,
        pencilLine: CustomPencilLine,
        profile: User,
        subscriptions: CreditCard,
        referral: Gift,
        marketplace: ShoppingBag,
        bookmarks: BookOpen,
        history: History,
        editor: Scissors,
        creator: Camera,
        premium: Crown,
        theme: Palette,
        policies: Shield,
        users: Users,
        folder: Folder,
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
        arrowLeft: ChevronLeft,
        volumeX: VolumeX,
        play: Play,
        pause: Pause,
        save: Save,
        chevronDown: ChevronDown,
        upload: Upload,
        checkCircle: CheckCircle,
        alertCircle: AlertCircle,
        mail: Mail,
        twitter: Monitor,
        instagram: Camera,
        chevronUp: ChevronUp,
        clapperboard: CustomClapperboard,
        coins: Coins,
        dollarSign: DollarSign,
    };
    const Component = IconMap[name] || IconMap.star;
    return <Component size={size} className={className} {...props} />;
};

// BottomBar is now using SharedBottomBar from components/SharedBottomBar.jsx
const BottomBar = ({ selectedLanguage = 'English' }) => {
    return <SharedBottomBar selectedLanguage={selectedLanguage} />;
};

const EditIcon = ({ onClick }) => (
    <div className="ml-2 cursor-pointer" onClick={onClick}>
        <Icon name="pencilLine" size={16} className="text-black" />
    </div>
);

const EditableField = ({ value, onSave, onCancel, type = 'text', placeholder, prefix, options }) => {
    const [tempValue, setTempValue] = useState(value);
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const [isCustomInput, setIsCustomInput] = useState(false);
    const dropdownRef = useRef(null);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsDropdownOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleOptionClick = (optValue) => {
        setTempValue(optValue);
        setIsDropdownOpen(false);
    };

    const handleCreateNewClick = () => {
        setIsCustomInput(true);
        setTempValue('');
        setIsDropdownOpen(false);
    };

    return (
        <div className="flex items-center w-full gap-3 mb-3 relative" ref={dropdownRef}>
            {/* For text/textarea inputs - use the gray wrapper */}
            {(type === 'text' || type === 'textarea' || (type === 'select' && isCustomInput)) && (
                <div className="flex-grow bg-gray-100 rounded-xl px-4 py-3 flex items-center relative">
                    {prefix && <span className="text-gray-500 mr-1">{prefix}</span>}
                    {type === 'textarea' ? (
                        <textarea
                            value={tempValue}
                            onChange={(e) => setTempValue(e.target.value)}
                            className="bg-transparent w-full outline-none text-gray-900 resize-none font-medium"
                            rows={2}
                            placeholder={placeholder}
                            autoFocus
                        />
                    ) : (
                        <input
                            type="text"
                            value={tempValue}
                            onChange={(e) => setTempValue(e.target.value)}
                            className="bg-transparent w-full outline-none text-gray-900 font-medium"
                            placeholder={isCustomInput ? "Enter new category name" : placeholder}
                            autoFocus={type === 'text' || isCustomInput}
                        />
                    )}
                </div>
            )}

            {/* For select dropdown - classy refined version */}
            {type === 'select' && !isCustomInput && (
                <div className="flex-grow relative">
                    <div
                        className="w-full flex items-center justify-between cursor-pointer px-4 py-3 rounded-xl border-2 border-gray-200 hover:border-blue-400 bg-gradient-to-r from-white to-gray-50 shadow-md hover:shadow-lg transition-all duration-200"
                        onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                    >
                        <span className={`text-sm font-semibold ${
                            tempValue ? 'text-gray-900' : 'text-gray-600'
                        }`}>
                            {tempValue || placeholder}
                        </span>
                        <div className={`flex items-center justify-center w-6 h-6 rounded-full bg-blue-100 transition-transform duration-300 ${
                            isDropdownOpen ? 'rotate-180 bg-blue-500' : ''
                        }`}>
                            <Icon name="chevronDown" className={`transition-colors ${
                                isDropdownOpen ? 'text-white' : 'text-blue-600'
                            }`} size={16} />
                        </div>
                    </div>

                    {/* Classy Dropdown Menu */}
                    {isDropdownOpen && (
                        <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-2xl shadow-2xl border-2 border-blue-100 z-50 max-h-80 overflow-y-auto backdrop-blur-sm">
                            {/* Header */}
                            <div className="px-4 pt-3 pb-2 border-b border-blue-100 sticky top-0 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-t-2xl">
                                <span className="text-xs font-bold text-blue-700 uppercase tracking-wider">Select Category</span>
                            </div>
                            
                            {options && options.length > 0 ? (
                                <>
                                    {options.map((opt, index) => (
                                        <div
                                            key={opt.value}
                                            onClick={() => handleOptionClick(opt.value)}
                                            className={`px-4 py-3.5 cursor-pointer text-sm flex items-center justify-between hover:bg-blue-50 transition-all duration-150 ${
                                                tempValue === opt.value 
                                                    ? 'bg-gradient-to-r from-blue-100 to-indigo-50 border-l-4 border-blue-500 text-blue-900 font-semibold' 
                                                    : 'text-gray-800 hover:pl-5'
                                            }`}
                                        >
                                            <span className="flex items-center gap-2">
                                                {tempValue === opt.value && (
                                                    <div className="w-2 h-2 rounded-full bg-blue-600"></div>
                                                )}
                                                {opt.label}
                                            </span>
                                            {tempValue === opt.value && (
                                                <div className="w-6 h-6 rounded-full bg-blue-500 flex items-center justify-center">
                                                    <Icon name="check" size={14} className="text-white" strokeWidth={3} />
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                    <div className="border-t-2 border-blue-100 mt-1">
                                        <div
                                            onClick={handleCreateNewClick}
                                            className="px-4 py-3 hover:bg-blue-50 cursor-pointer text-sm text-blue-600 font-semibold flex items-center gap-2 transition-all duration-150 hover:pl-5"
                                        >
                                            <div className="w-5 h-5 rounded-full border-2 border-blue-400 flex items-center justify-center">
                                                <Icon name="plus" size={12} className="text-blue-400" />
                                            </div>
                                            <span>Create new category</span>
                                        </div>
                                    </div>
                                </>
                            ) : (
                                <div className="px-4 py-6 text-center text-gray-500 text-sm font-medium">
                                    No categories available
                                </div>
                            )}
                        </div>
                    )}
                </div>
            )}

            <button onClick={(e) => { e.stopPropagation(); onCancel(); }} className="p-2 text-gray-500 hover:text-gray-700">
                <Icon name="x" size={24} />
            </button>

            <button
                onClick={() => onSave(tempValue)}
                className="p-3 bg-[var(--color-gold)] rounded-xl text-black shadow-sm hover:bg-[var(--color-gold-darker)] transition-colors flex items-center justify-center w-12 h-12"
            >
                <Icon name="save" size={20} />
            </button>
        </div>
    );
};

const StatCard = ({ label, value, selectedLanguage = 'English' }) => (
    <div className="bg-white rounded-2xl shadow-md p-2 flex flex-col items-center justify-center w-16 h-16 md:w-20 md:h-20 border border-gray-200">
        <div className="text-xs text-gray-700 font-medium mb-1">{getTranslation(label, selectedLanguage)}</div>
        <div className="font-bold text-sm md:text-lg" style={{
            background: 'linear-gradient(135deg, #3B82F6 0%, #8B5CF6 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text'
        }}>
            {formatNumber(value)}
        </div>
    </div>
);

const ProfileHeader = ({ profile, onUpdate, isPreviewMode, onTogglePreview, onTip, selectedCTAs, onCTAClick, availableTags, onShowToast, isSharedLink = false, selectedLanguage = 'English' }) => {
    const navigate = useNavigate();
    const [editingField, setEditingField] = useState(null);
    const [tempPrice, setTempPrice] = useState(profile.price);
    const [tempPricingType, setTempPricingType] = useState(profile.pricingType || 'One Time');
    const [isFollowing, setIsFollowing] = useState(false);
    const [followActive, setFollowActive] = useState(false);
    const [ctaIndex, setCtaIndex] = useState(0);
    const [isVisible, setIsVisible] = useState(true);
    const [isCopied, setIsCopied] = useState(false);
    const fileInputRef = useRef(null);
    const [previewDocument, setPreviewDocument] = useState(null);
    const [showPrice, setShowPrice] = useState(true);
    const [pricePulse, setPricePulse] = useState(true);
    const [showPriceHint, setShowPriceHint] = useState(false);

    useEffect(() => {
        // Only show the price hint when NOT in preview mode
        if (isPreviewMode) return;
        setShowPriceHint(true);
        const t = setTimeout(() => setShowPriceHint(false), 10000);
        return () => clearTimeout(t);
    }, [isPreviewMode]);

    useEffect(() => {
        // Check if already following this creator
        const checkFollowing = async () => {
            if (!profile?.id) return;
            try {
                // Use regaarder_token consistently with other operations
                const token = localStorage.getItem('regaarder_token');
                if (!token) return;

                const BACKEND = (window && window.__BACKEND_URL__) || 'https://regaarder-pwin.onrender.com';
                const res = await fetch(`${BACKEND}/following/${profile.id}`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                if (res.ok) {
                    const data = await res.json();
                    setIsFollowing(data.isFollowing);
                }
            } catch (err) {
                console.error('Failed to check following status:', err);
            }
        };
        checkFollowing();
    }, [profile?.id]);

    useEffect(() => {
        if (!selectedCTAs || selectedCTAs.length <= 1) return;
        const interval = setInterval(() => {
            setIsVisible(false); // Start dissolve out
            setTimeout(() => {
                setCtaIndex((prev) => (prev + 1) % selectedCTAs.length);
                setIsVisible(true); // Start dissolve in
            }, 500); // Wait for fade out
        }, 5000);
        return () => clearInterval(interval);
    }, [selectedCTAs]);

    const ctaText = (selectedCTAs && selectedCTAs.length > 0)
        ? selectedCTAs[ctaIndex]
        : "Your idea → {creator}'s next video";

    const handleShare = async () => {
        // Use real production domain for profile links
        const key = profile?.handle || profile?.id || profile?.email || profile?.name || 'user';
        const displayName = profile?.name || profile?.handle || 'Creator';
        const url = `${WEB_URL}/share/profile/${encodeURIComponent(String(key).replace(/^@/, ''))}`;
        const shareTitle = `${displayName} on Regaarder`;
        const shareText = `Check out ${displayName}'s profile on Regaarder — discover their content, ideas, and more!\n\n${url}`;
        const successData = { title: "Link Copied", subtitle: "Profile link copied to clipboard" };

        const onCopySuccess = () => {
            if (onShowToast) onShowToast(successData);
            setIsCopied(true);
            setTimeout(() => setIsCopied(false), 3000);
        };

        // Try native share first (opens WhatsApp, Messages, etc.)
        try {
            if (navigator && navigator.share) {
                await navigator.share({
                    title: shareTitle,
                    text: shareText,
                    url: url
                });
                if (onShowToast) onShowToast({ title: "Shared", subtitle: "Profile shared successfully" });
                setIsCopied(true);
                setTimeout(() => setIsCopied(false), 3000);
                return;
            }
        } catch (err) {
            // If user cancelled, don't fall through to copy
            if (err.name === 'AbortError') return;
        }

        // Fallback to clipboard
        try {
            if (navigator.clipboard && navigator.clipboard.writeText) {
                await navigator.clipboard.writeText(url);
                onCopySuccess();
            } else {
                throw new Error("Clipboard API unavailable");
            }
        } catch (err) {
            try {
                const textArea = document.createElement("textarea");
                textArea.value = url;
                textArea.style.position = "fixed";
                textArea.style.left = "-9999px";
                textArea.style.top = "0";
                document.body.appendChild(textArea);
                textArea.focus();
                textArea.select();
                const successful = document.execCommand('copy');
                document.body.removeChild(textArea);
                if (successful) onCopySuccess();
            } catch (fallbackErr) {
                console.error('Failed to copy:', fallbackErr);
            }
        }
    };

    const handleSave = (field, value) => {
        onUpdate(field, value);
        setEditingField(null);
    };

    const handlePriceSave = () => {
        onUpdate('price', tempPrice);
        onUpdate('pricingType', tempPricingType);
        setEditingField(null);
    };

    const handleFollow = async () => {
        try {
            // Use regaarder_token consistently with other operations
            const token = localStorage.getItem('regaarder_token');
            if (!token) {
                if (onShowToast) onShowToast({ title: getTranslation("Login Required", selectedLanguage), subtitle: getTranslation("Please log in to follow creators", selectedLanguage) });
                return;
            }

            const BACKEND = (window && window.__BACKEND_URL__) || 'https://regaarder-pwin.onrender.com';
            const endpoint = isFollowing ? '/unfollow' : '/follow';

            setFollowActive(true);

            const res = await fetch(`${BACKEND}${endpoint}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ creatorId: profile.id })
            });

            if (res.ok) {
                setTimeout(() => setIsFollowing(!isFollowing), 120);
                // Update follower count
                const newFollowerCount = isFollowing 
                    ? Math.max(0, (profile.followers || 0) - 1)
                    : (profile.followers || 0) + 1;
                onUpdate('followers', newFollowerCount);
                if (onShowToast) {
                    onShowToast({
                        title: isFollowing ? getTranslation("Unfollowed", selectedLanguage) : getTranslation("Following!", selectedLanguage),
                        subtitle: isFollowing ? getTranslation("You unfollowed {creator}", selectedLanguage).replace('{creator}', profile.name) : getTranslation("You're now following {creator}", selectedLanguage).replace('{creator}', profile.name)
                    });
                }
            } else {
                const error = await res.json();
                if (onShowToast) onShowToast({ title: getTranslation("Error", selectedLanguage), subtitle: getTranslation(error.error || "Failed to update follow status", selectedLanguage) });
            }

            setTimeout(() => setFollowActive(false), 420);
        } catch (err) {
            console.error('Follow error:', err);
            setFollowActive(false);
            if (onShowToast) onShowToast({ title: getTranslation("Error", selectedLanguage), subtitle: getTranslation("Network error. Please try again.", selectedLanguage) });
        }
    };

    const handleFileChange = async (event) => {
        const file = event.target.files[0];
        if (!file) return;

        // Client-side validation: allowed mime types and size limit
        const MAX_BYTES = 10 * 1024 * 1024; // 10 MB
        const allowedMimes = [
            'image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml', 'image/jfif', 'image/bmp', 'image/heic', 'image/heif'
        ];

        const ext = (file.name && file.name.split('.').pop() || '').toLowerCase();
        const allowedExts = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg', 'jfif', 'bmp', 'heic', 'heif', 'pdf', 'txt'];

        const hasValidMime = file.type && (file.type.startsWith('image/') || allowedMimes.includes(file.type));
        const hasValidExt = ext && allowedExts.includes(ext);

        if (!hasValidMime && !hasValidExt) {
            console.error('Unsupported file type. Allowed: images (jpg,png,gif,webp,svg,jfif,heic,heif,bmp) and small text/pdf files.');
            if (onShowToast) onShowToast({ title: getTranslation("Invalid File Type", selectedLanguage), subtitle: getTranslation("Please upload an image file (jpg, png, gif, webp, etc.)", selectedLanguage) });
            return;
        }

        if (file.size > MAX_BYTES) {
            console.error('File too large. Maximum allowed is 10MB.');
            if (onShowToast) onShowToast({ title: getTranslation("File Too Large", selectedLanguage), subtitle: getTranslation("Maximum file size is 10MB", selectedLanguage) });
            return;
        }

        const isImage = file.type && file.type.startsWith('image/') || hasValidExt;

        // Optimistic local preview: images show as avatar, documents show filename/icon
        try {
            if (isImage) {
                const imageUrl = URL.createObjectURL(file);
                // update parent profile via callback (ProfileHeader doesn't own setProfile)
                onUpdate('image', imageUrl);
                setPreviewDocument(null);
            } else {
                setPreviewDocument({ name: file.name, type: file.type });
            }
        } catch (e) { }

        // Upload to backend so the profile is updated for everyone
        try {
            const token = localStorage.getItem('regaarder_token');
            if (!token) {
                console.warn('No authentication token found. Profile changes will only be saved locally.');
                if (onShowToast) onShowToast({ title: getTranslation("Not Authenticated", selectedLanguage), subtitle: getTranslation("Changes saved locally only. Please login to sync across devices.", selectedLanguage) });
                return;
            }

            const fd = new FormData();
            fd.append('image', file);
            const res = await fetch(`${(window && window.__BACKEND_URL__) || 'https://pwin.onrender.com'}/creator/photo`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}` },
                body: fd
            });

            if (!res.ok) {
                if (res.status === 401) {
                    console.warn('Authentication failed. Token may be invalid or expired.');
                    if (onShowToast) onShowToast({ title: getTranslation("Authentication Required", selectedLanguage), subtitle: getTranslation("Please login again to upload files", selectedLanguage) });
                    return;
                }
                throw new Error(`Upload failed with status ${res.status}`);
            }

            const data = await res.json();
            if (data && data.url) {
                // If backend tells us it's an image, persist to `image`; otherwise persist as `document`
                if (data.mimeType && data.mimeType.startsWith('image/')) {
                    // persist via parent update
                    onUpdate('image', data.url);
                    // persist via creator/complete
                    try {
                        await fetch(`${(window && window.__BACKEND_URL__) || 'https://pwin.onrender.com'}/creator/complete`, {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                            body: JSON.stringify({ image: data.url })
                        });
                    } catch (e) {
                        console.warn('Failed to persist image update', e);
                    }
                } else {
                    // non-image document uploaded: save as `document` field and show filename
                    onUpdate('document', data.url);
                    setPreviewDocument(prev => ({ ...(prev || {}), url: data.url }));
                    try {
                        await fetch(`${(window && window.__BACKEND_URL__) || 'https://pwin.onrender.com'}/creator/complete`, {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                            body: JSON.stringify({ document: data.url })
                        });
                    } catch (e) {
                        console.warn('Failed to persist document update', e);
                    }
                }
                if (onShowToast) onShowToast({ title: getTranslation("Upload Successful", selectedLanguage), subtitle: getTranslation("Your profile image has been updated", selectedLanguage) });
            } else {
                console.warn('Profile file upload failed - no URL returned', data);
                if (onShowToast) onShowToast({ title: "Upload Failed", subtitle: "Server did not return a valid file URL" });
            }
        } catch (err) {
            console.error('Profile file upload error', err);
            if (onShowToast) onShowToast({ title: "Upload Error", subtitle: "Failed to upload file. Please try again." });
        }
    };



    const handleTaglineEdit = () => {
        setEditingField('tagline');
    };

    const [ctaActive, setCtaActive] = useState(false);
    const [backActive, setBackActive] = useState(false);

    const handlePriceEdit = () => {
        setEditingField('price');
        setTempPrice(profile.price);
        setTempPricingType(profile.pricingType || 'One Time');
    };

    const handleVideoEdit = () => {
        fileInputRef.current.click();
    };

    const handleBackNavigation = () => {
        try {
            const redirectTo = localStorage.getItem('redirectBackTo');
            const targetUrl = redirectTo === 'creatorDashboard' ? '/creatordashboard' : '/home';
            if (redirectTo === 'creatorDashboard') {
                localStorage.removeItem('redirectBackTo');
            }
            navigate(targetUrl);
        } catch (e) {
            console.warn('Navigation failed', e);
            window.location.href = '/home';
        }
    };

    return (
        <div className="relative bg-white pb-6">
            <style>{`
                @keyframes shimmer-gold-premium {
                    0% { background-position: 100% 0; }
                    40% { background-position: 0% 0; }
                    100% { background-position: 0% 0; }
                }
                @keyframes glow-pulse {
                    0%, 100% { 
                        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
                    }
                    50% { 
                        box-shadow: 0 6px 16px rgba(0, 0, 0, 0.15);
                    }
                }
                .shimmer-gold {
                    background: var(--color-gold);
                    background-size: 300% 100%;
                }
                @keyframes pulse-ring {
                    0% { box-shadow: 0 0 0 0 var(--color-gold); }
                    70% { box-shadow: 0 0 0 12px rgba(0,0,0,0); }
                    100% { box-shadow: 0 0 0 0 rgba(0,0,0,0); }
                }
                .pulse-price {
                    animation: pulse-ring 2.2s infinite;
                }
                .price-tooltip {
                    pointer-events: none;
                    transform-origin: center bottom;
                }
            `}</style>
            {/* Background Gradient - Darkened for better contrast */}
            <div className="absolute top-0 left-0 right-0 h-48 bg-gradient-to-br from-purple-950 via-red-600 to-orange-500" style={{ borderBottomLeftRadius: '20px', borderBottomRightRadius: '20px' }}></div>

            {/* Top Navigation */}
            <div
                className="relative z-10 flex justify-between items-center px-4 text-white"
                style={{ paddingTop: 'calc(16px + env(safe-area-inset-top, 0px))' }}
            >
                <button
                    className={`w-11 h-11 flex items-center justify-center bg-black/20 rounded-full backdrop-blur-sm hover:bg-black/30 transition ${typeof backActive !== 'undefined' ? (backActive ? 'scale-95 opacity-90' : '') : ''}`}
                    onClick={() => {
                        // show a brief active state then navigate to home
                        try {
                            // set a transient active state visible to the user
                            /* eslint-disable no-unused-expressions */
                            (typeof setBackActive === 'function') && setBackActive(true);
                            setTimeout(() => { handleBackNavigation(); }, 120);
                            setTimeout(() => { (typeof setBackActive === 'function') && setBackActive(false); }, 420);
                        } catch (e) {
                            console.warn('Navigation failed', e);
                            window.location.href = '/home';
                        }
                    }}
                >
                    <Icon name="arrowLeft" size={24} />
                </button>
                <div className="flex space-x-3">
                    {!isSharedLink && (
                        <button
                            className="w-11 h-11 flex items-center justify-center bg-black/20 rounded-full backdrop-blur-sm hover:bg-black/30 transition"
                            onClick={onTogglePreview}
                        >
                            <Icon name={isPreviewMode ? "pencilLine" : "eye"} size={24} style={{ width: 24, height: 24 }} />
                        </button>
                    )}
                    {!isSharedLink && (
                        <button
                            className="w-11 h-11 flex items-center justify-center bg-black/20 rounded-full backdrop-blur-sm hover:bg-black/30 transition"
                            onClick={handleShare}
                        >
                            <Icon name={isCopied ? "check" : "share"} size={24} />
                        </button>
                    )}
                </div>
            </div>

            {/* Profile Info */}
            <div className="relative z-10 px-4 mt-20">
                <div className="flex justify-between items-end">
                    {/* Avatar */}
                    <div className="relative">
                        {/* Shimmer Ring Container */}
                        <div className="w-28 h-28 md:w-32 md:h-32 rounded-full p-1 shadow-lg bg-transparent">
                            <div className="w-full h-full rounded-full p-1 shimmer-gold">
                                <div className="w-full h-full rounded-full overflow-hidden bg-transparent relative flex items-center justify-center">
                                    {previewDocument ? (
                                        <div className="flex flex-col items-center justify-center text-center px-2">
                                            <FileText className="w-8 h-8 text-gray-700" />
                                            <div className="text-xs text-gray-700 mt-1 break-words max-w-full">{previewDocument.name}</div>
                                        </div>
                                    ) : (profile.image ? (
                                        <img src={profile.image} alt="Profile" className="w-full h-full object-cover" />
                                    ) : (
                                        <img src="https://placehold.co/400x400/e2e8f0/1e293b?text=User" alt="Profile" className="w-full h-full object-cover" />
                                    ))}
                                </div>
                            </div>
                        </div>

                        <input
                            type="file"
                            ref={fileInputRef}
                            className="hidden"
                            accept="image/*,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,text/plain,application/vnd.ms-powerpoint,application/vnd.openxmlformats-officedocument.presentationml.presentation,application/zip"
                            onChange={handleFileChange}
                        />

                        {!isPreviewMode && (
                            <div
                                className="absolute bottom-1 left-1 rounded-full p-2 border-4 border-white cursor-pointer z-20 transition-all shadow-sm hover:scale-110 relative overflow-hidden"
                                style={{
                                    background: 'linear-gradient(135deg, #3B82F6 0%, #8B5CF6 100%)',
                                    boxShadow: '0 4px 12px rgba(59, 130, 246, 0.3)'
                                }}
                                onClick={() => fileInputRef.current.click()}
                            >
                                <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent"></div>
                                <Icon name="pencilLine" size={16} className="text-white relative z-10" />
                            </div>
                        )}
                    </div>

                    {/* Stats Row */}
                    <div className="flex space-x-2 mb-2">
                        <StatCard label={getTranslation("Followers", selectedLanguage)} value={profile.followers || profile.followerCount || 0} selectedLanguage={selectedLanguage} />
                        <StatCard label={getTranslation("Views", selectedLanguage)} value={profile.views || 0} selectedLanguage={selectedLanguage} />
                        <StatCard label={getTranslation("Fulfilled", selectedLanguage)} value={profile.comments || 0} selectedLanguage={selectedLanguage} />
                    </div>
                </div>

                {/* Text Info - Left Aligned */}
                <div className="mt-4 text-left">
                    {/* Name */}
                    {editingField === 'name' && !isPreviewMode ? (
                        <EditableField
                            value={profile.name}
                            onSave={(val) => handleSave('name', val)}
                            onCancel={() => setEditingField(null)}
                        />
                    ) : (
                        <div className="flex items-center flex-wrap gap-2">
                            <h1 className="text-2xl font-bold" style={{
                                background: 'linear-gradient(135deg, #3B82F6 0%, #8B5CF6 100%)',
                                WebkitBackgroundClip: 'text',
                                WebkitTextFillColor: 'transparent',
                                backgroundClip: 'text'
                            }}>{profile.name}</h1>
                            {isPreviewMode && !isSharedLink ? (
                                <div className="text-white text-xs font-bold px-2 py-1 rounded-md flex items-center shadow-sm" style={{
                                    background: 'linear-gradient(135deg, #3B82F6 0%, #8B5CF6 100%)'
                                }}>
                                    <Icon name="eye" size={12} className="mr-1" />
                                    {getTranslation('Preview Mode', selectedLanguage)}
                                </div>
                            ) : (
                                !isSharedLink && <EditIcon onClick={() => setEditingField('name')} />
                            )}
                        </div>
                    )}

                    {/* Handle */}
                    {editingField === 'handle' && !isPreviewMode ? (
                        <EditableField
                            value={profile.handle}
                            onSave={(val) => handleSave('handle', val)}
                            onCancel={() => setEditingField(null)}
                            prefix="@"
                        />
                    ) : (
                        <div className="flex items-center mt-1">
                            <p className="text-gray-700 text-lg font-medium">@{profile.handle}</p>
                            {!isPreviewMode && <EditIcon onClick={() => setEditingField('handle')} />}
                        </div>
                    )}

                    {/* Bio */}
                    {editingField === 'bio' && !isPreviewMode ? (
                        <EditableField
                            value={profile.bio}
                            onSave={(val) => handleSave('bio', val)}
                            onCancel={() => setEditingField(null)}
                            type="textarea"
                        />
                    ) : (
                        <div className="flex items-start mt-3 max-w-md">
                            <p className="text-gray-700 font-normal leading-relaxed text-left">
                                {profile.bio}
                            </p>
                            {!isPreviewMode && <div className="mt-1 min-w-[24px]"><EditIcon onClick={() => setEditingField('bio')} /></div>}
                        </div>
                    )}

                    {/* Tag */}
                    {editingField === 'tag' && !isPreviewMode ? (
                        <EditableField
                            value={profile.tag}
                            onSave={(val) => handleSave('tag', val)}
                            onCancel={() => setEditingField(null)}
                            type="select"
                            placeholder={getTranslation('Select a category', selectedLanguage)}
                            options={availableTags}
                        />
                    ) : (
                        <div className="flex items-center mt-4">
                            <span className="bg-gradient-to-r from-blue-50 to-indigo-50 text-blue-700 px-4 py-2 rounded-full text-sm font-bold border border-blue-200 shadow-sm">
                                {getTranslation(profile.tag, selectedLanguage)}
                            </span>
                            {!isPreviewMode && <EditIcon onClick={() => setEditingField('tag')} />}
                        </div>
                    )}
                </div>

                {/* Price Button or Follow/Tip */}
                {isPreviewMode ? (
                    <>
                        <div className="flex gap-3 mt-8">
                            {isFollowing ? (
                                <button
                                    className={`flex-grow bg-white border border-gray-200 text-gray-900 font-semibold py-2.5 rounded-xl text-base shadow-sm flex items-center justify-center hover:bg-gray-50 transition ${followActive ? 'scale-95 opacity-90' : ''}`}
                                    onClick={handleFollow}
                                >
                                    <div className="w-5 h-5 rounded-full border-2 border-gray-900 flex items-center justify-center mr-2">
                                        <Icon name="check" size={12} className="text-gray-900" strokeWidth={3} />
                                    </div>
                                    {getTranslation('Following', selectedLanguage)}
                                </button>
                            ) : (
                                <button
                                    className={`flex-grow bg-[var(--color-gold)] text-black font-semibold py-2.5 rounded-xl text-base shadow-sm flex items-center justify-center hover:bg-[var(--color-gold-darker)] transition ${followActive ? 'scale-95 opacity-90' : ''}`}
                                    onClick={handleFollow}
                                >
                                    <Icon name="heart" size={18} className="mr-2" />
                                    {getTranslation('Follow', selectedLanguage)}
                                </button>
                            )}
                            <button
                                className="px-6 bg-white border border-gray-200 text-gray-900 font-semibold py-2.5 rounded-xl text-base shadow-sm flex items-center justify-center hover:bg-gray-50 transition"
                                onClick={onTip}
                            >
                                <Icon name="dollarSign" size={18} className="mr-1" />
                                {getTranslation('Tip', selectedLanguage)}
                            </button>
                        </div>

                        <div className="mt-3">
                            <button
                                onClick={() => {
                                    // show a brief active state then call the provided CTA handler
                                    setCtaActive(true);
                                    setTimeout(() => {
                                        if (onCTAClick) onCTAClick();
                                    }, 120);
                                    // clear active state shortly after so it doesn't persist
                                    setTimeout(() => setCtaActive(false), 420);
                                }}
                                className={`w-full shimmer-gold text-black font-medium py-4 px-4 rounded-xl text-base shadow-sm hover:opacity-90 transition flex items-center justify-center ${ctaActive ? 'scale-95 opacity-90' : ''}`}
                            >
                                <Icon name="video" size={18} className="mr-2 flex-shrink-0" />
                                <span className={`text-center leading-tight transition-opacity duration-500 ${isVisible ? 'opacity-100' : 'opacity-0'}`}>
                                    {getTranslation(ctaText, selectedLanguage).replace('{creator}', profile.name)}
                                </span>
                            </button>
                        </div>
                    </>
                ) : (
                    editingField === 'price' ? (
                        <div className="w-full mt-8 flex flex-col gap-3">
                            <div className="flex-grow bg-[var(--color-gold-light-bg)] rounded-xl px-4 py-3 flex items-center shadow-sm">
                                <span className="mr-2 opacity-50 text-gray-800 font-semibold text-lg">$</span>
                                <input
                                    type="number"
                                    value={tempPrice}
                                    onChange={(e) => setTempPrice(e.target.value)}
                                    className="bg-transparent w-24 outline-none text-gray-800 font-semibold text-lg placeholder-gray-600"
                                    autoFocus
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter') handlePriceSave();
                                    }}
                                />
                                <div className="h-6 w-px bg-black/10 mx-2"></div>
                                <select
                                    value={tempPricingType}
                                    onChange={(e) => setTempPricingType(e.target.value)}
                                    className="bg-transparent outline-none text-gray-800 font-semibold text-sm appearance-none flex-grow cursor-pointer"
                                >
                                    <option value="One Time">{getTranslation('One Time', selectedLanguage)}</option>
                                    <option value="Series">Series</option>
                                    <option value="Recurrent">Recurrent</option>
                                </select>
                                <Icon name="chevronDown" size={16} className="text-gray-800 opacity-50 ml-1 pointer-events-none" />
                            </div>
                            <div className="flex gap-2 justify-end">
                                <button onClick={() => setEditingField(null)} className="px-4 py-2 text-gray-500 hover:text-gray-700 bg-white rounded-xl shadow-sm border border-gray-100 transition-colors">
                                    <Icon name="x" size={20} />
                                </button>
                                <button
                                    onClick={handlePriceSave}
                                    className="px-6 py-2 bg-[var(--color-gold)] text-black rounded-xl shadow-sm hover:bg-[var(--color-gold-dark)] transition-colors font-semibold"
                                    title="Save price"
                                >
                                    Save
                                </button>
                            </div>
                        </div>
                    ) : (
                        <div className="w-full mt-8 relative">
                            {/* Price wrapper: provides group hover for tooltip */}
                            <div className="group w-full relative">
                                {showPrice ? (
                                    <button
                                        className={`w-full bg-[var(--color-gold-light-bg)] text-gray-800 font-semibold py-4 rounded-xl text-lg shadow-sm flex items-center justify-center ${pricePulse ? 'pulse-price' : ''}`}
                                        onClick={() => {
                                            setTempPrice(profile.price);
                                            setTempPricingType(profile.pricingType || 'One Time');
                                            setEditingField('price');
                                        }}
                                        aria-label={`Price per request: $${profile.price} / ${getTranslation(profile.pricingType || 'One Time', selectedLanguage)}`}
                                    >
                                        <span className="mr-2 opacity-50">$</span>
                                        ${profile.price}
                                        <span className="opacity-50 ml-1">/ {getTranslation(profile.pricingType || 'One Time', selectedLanguage)}</span>
                                    </button>
                                ) : (
                                    <div className="w-full bg-gray-100 text-gray-500 font-medium py-4 rounded-xl text-lg shadow-sm flex items-center justify-center border border-gray-200">
                                        {getTranslation('Price hidden', selectedLanguage)}
                                    </div>
                                )}

                                {/* Tooltip that appears on hover (disabled in preview mode) */}
                                {!isPreviewMode && (
                                    <div className="absolute -top-10 left-1/2 transform -translate-x-1/2 opacity-0 group-hover:opacity-100 transition duration-150 text-xs bg-black text-white px-2 py-1 rounded-md price-tooltip">
                                        {showPrice ? 'Price per request. Click to edit' : 'Price is hidden from fans'}
                                    </div>
                                )}

                                {/* optional underline when pulse is off (subtle accent) */}
                                {!pricePulse && showPrice && (
                                    <div className="absolute left-6 right-6 bottom-0 h-0.5 bg-[var(--color-gold)] rounded-full"></div>
                                )}

                                {/* Edit + visibility controls (top-right) */}
                                <div className="absolute right-3 top-1/2 transform -translate-y-1/2 flex items-center gap-1">
                                    <div
                                        className="cursor-pointer p-2 rounded-md hover:bg-gray-100 transition"
                                        onClick={(e) => { e.stopPropagation(); setTempPrice(profile.price); setTempPricingType(profile.pricingType || 'One Time'); setEditingField('price'); }}
                                        title="Edit price"
                                    >
                                        <Icon name="pencilLine" size={18} className="text-black" />
                                    </div>

                                    <button
                                        className={`p-2 rounded-md hover:bg-gray-100 transition ${showPrice ? '' : 'opacity-80'}`}
                                        onClick={(e) => { e.stopPropagation(); setShowPrice(prev => !prev); }}
                                        aria-pressed={showPrice}
                                        title={showPrice ? 'Hide price' : 'Show price'}
                                    >
                                        <Icon name={showPrice ? 'eye' : 'eyeOff'} size={18} />
                                    </button>
                                </div>
                            </div>
                        </div>
                    )
                )}
            </div>
        </div>
    );
};

const ActionCard = ({ title, progress, missingFields, icon, isPopup, onClick, onPreview, selectedLanguage = 'English' }) => {
    return (
        <div
            className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 mb-4 cursor-pointer transition hover:shadow-md"
            onClick={onClick}
        >
            <div className="flex justify-between items-center mb-3">
                <div className="flex items-center">
                    <div className="w-10 h-10 rounded-lg flex items-center justify-center mr-3 relative overflow-hidden"
                        style={{
                            background: 'linear-gradient(135deg, #3B82F6 0%, #8B5CF6 100%)',
                            boxShadow: '0 4px 12px rgba(59, 130, 246, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.3)'
                        }}>
                        <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent"></div>
                        <Icon name={icon} size={20} className="text-white relative z-10" />
                    </div>
                    <h3 className="font-semibold text-lg text-gray-900">{title}</h3>
                </div>
                {progress && <span className="text-[var(--color-gold)] font-bold">{progress}%</span>}
            </div>

            {progress ? (
                <>
                    <div className="w-full bg-gray-200 rounded-full h-2 mb-2">
                        <div className="bg-[var(--color-gold)] h-2 rounded-full" style={{ width: `${progress}%` }}></div>
                    </div>
                    <p className="text-xs text-gray-500 mb-3">{getTranslation('8 of 10 fields completed • Tap to edit', selectedLanguage)}</p>
                    <div className="flex flex-wrap gap-2">
                        <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-md">{getTranslation('Missing fields:', selectedLanguage)}</span>
                        {missingFields.map((field, idx) => (
                            <span key={idx} className="text-xs text-gray-600 bg-gray-100 px-2 py-1 rounded-md font-medium">{field}</span>
                        ))}
                    </div>
                </>
            ) : (
                <>
                    <p className="text-gray-500 text-sm mb-4 leading-relaxed">
                        {getTranslation('Create a personalized greeting for fans who visit your profile', selectedLanguage)}
                    </p>
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            if (onPreview) onPreview();
                        }}
                        className="flex items-center px-4 py-2 border border-gray-200 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition"
                    >
                        <Icon name="eye" size={16} className="mr-2" />
                        {getTranslation('Preview', selectedLanguage)}
                    </button>
                </>
            )}
        </div>
    );
};

const FeaturedVideo = ({ isPreviewMode, video, onUpload, onDelete, selectedLanguage }) => {
    const fileInputRef = useRef(null);
    const videoRef = useRef(null);
    const [isPlaying, setIsPlaying] = useState(false);

    const handleUploadClick = () => {
        fileInputRef.current.click();
    };

    const handleFileChange = (event) => {
        const file = event.target.files[0];
        if (file) {
            const videoUrl = URL.createObjectURL(file);
            onUpload({ url: videoUrl, file: file });
        }
    };

    useEffect(() => {
        const videoElement = videoRef.current;
        if (!videoElement) return;

        const handlePlay = () => setIsPlaying(true);
        const handlePause = () => setIsPlaying(false);

        videoElement.addEventListener('play', handlePlay);
        videoElement.addEventListener('pause', handlePause);

        return () => {
            videoElement.removeEventListener('play', handlePlay);
            videoElement.removeEventListener('pause', handlePause);
        };
    }, []);

    return (
        <div className="mb-8">
            <h2 className="text-xl font-normal text-gray-900 mb-4 px-1">{getTranslation('Featured Video', selectedLanguage)}</h2>

            {video ? (
                <div className="relative bg-black rounded-2xl overflow-hidden shadow-sm border border-gray-100 aspect-video group">
                    <video
                        ref={videoRef}
                        src={video.url}
                        className="w-full h-full object-contain bg-black cursor-pointer"
                        onClick={() => {
                            if (videoRef.current) {
                                if (videoRef.current.paused) {
                                    videoRef.current.play();
                                } else {
                                    videoRef.current.pause();
                                }
                            }
                        }}
                    />
                    {/* Play/Pause Button in Center */}
                    <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                            onClick={() => {
                                if (videoRef.current) {
                                    if (videoRef.current.paused) {
                                        videoRef.current.play();
                                        setIsPlaying(true);
                                    } else {
                                        videoRef.current.pause();
                                        setIsPlaying(false);
                                    }
                                }
                            }}
                            onMouseEnter={() => {
                                if (videoRef.current && !videoRef.current.paused) {
                                    setIsPlaying(true);
                                } else if (videoRef.current && videoRef.current.paused) {
                                    setIsPlaying(false);
                                }
                            }}
                            className="p-4 bg-white/20 hover:bg-white/30 rounded-full backdrop-blur-sm transition-all"
                        >
                            {isPlaying ? (
                                <Icon name="pause" size={32} className="text-white" />
                            ) : (
                                <Icon name="play" size={32} className="text-white" />
                            )}
                        </button>
                    </div>
                    {!isPreviewMode && (
                        <button
                            onClick={onDelete}
                            className="absolute top-3 right-3 p-2 bg-black/50 text-white rounded-full hover:bg-red-500 transition backdrop-blur-sm opacity-0 group-hover:opacity-100"
                            title="Remove video"
                        >
                            <Icon name="x" size={16} />
                        </button>
                    )}
                </div>
            ) : (
                <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100 flex flex-col items-center text-center">
                    <div className="w-16 h-16 rounded-full flex items-center justify-center mb-4 relative overflow-hidden"
                        style={{
                            background: 'linear-gradient(135deg, #3B82F6 0%, #8B5CF6 100%)',
                            boxShadow: '0 4px 12px rgba(59, 130, 246, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.3)'
                        }}>
                        <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent"></div>
                        <Icon name="video" size={32} className="text-white relative z-10" />
                    </div>
                    <h3 className="text-lg font-medium text-gray-900 mb-2">{getTranslation('No featured video yet', selectedLanguage)}</h3>
                    <p className="text-gray-500 text-sm mb-6 max-w-xs leading-relaxed">
                        {getTranslation('Upload an introduction video to showcase your content', selectedLanguage)}
                    </p>

                    <input
                        type="file"
                        ref={fileInputRef}
                        className="hidden"
                        accept="video/*"
                        onChange={handleFileChange}
                    />

                    {!isPreviewMode && (
                        <button
                            onClick={handleUploadClick}
                            className="w-full border border-gray-200 rounded-xl py-3 flex items-center justify-center font-medium text-gray-700 hover:bg-gray-50 transition"
                        >
                            <Icon name="upload" size={18} className="mr-2" />
                            {getTranslation('Upload Intro Video', selectedLanguage)}
                        </button>
                    )}
                </div>
            )}
        </div>
    );
};

const AllVideosPopup = ({ videos, creatorId, onClose, onDelete, isPreview = false, selectedLanguage = 'English' }) => {
    const [allVideos, setAllVideos] = useState(videos);
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        // Fetch all videos from backend
        const fetchAllVideos = async () => {
            if (!creatorId) return;
            setIsLoading(true);
            try {
                const BACKEND = (window && window.__BACKEND_URL__) || import.meta.env.VITE_BACKEND || 'https://pwin.onrender.com';
                const response = await fetch(`${BACKEND}/videos/${creatorId}`, {
                    credentials: 'include'
                });
                if (response.ok) {
                    const data = await response.json();
                    setAllVideos(data.videos || []);
                } else {
                    setAllVideos(videos);
                }
            } catch (err) {
                console.error('Failed to fetch videos:', err);
                setAllVideos(videos);
            } finally {
                setIsLoading(false);
            }
        };
        
        fetchAllVideos();
    }, [creatorId]);

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
            <div className={isPreview ? "absolute inset-0 bg-black/90" : "absolute inset-0 bg-black/60 backdrop-blur-sm"} onClick={onClose}></div>
            <div className="relative bg-white rounded-3xl w-full max-w-md p-6 shadow-2xl animate-in fade-in zoom-in duration-200 max-h-[80vh] overflow-y-auto">
                <div className="flex justify-between items-center mb-6">
                    <div>
                        <h2 className="text-xl font-bold text-gray-900">{getTranslation('All Videos', selectedLanguage)}</h2>
                        <p className="text-gray-500 text-sm">{isLoading ? 'Loading...' : allVideos.length} videos</p>
                    </div>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
                        <Icon name="x" size={24} />
                    </button>
                </div>

                {isLoading ? (
                    <div className="flex items-center justify-center py-12">
                        <div className="text-gray-400">{getTranslation('Loading videos...', selectedLanguage)}</div>
                    </div>
                ) : allVideos.length > 0 ? (
                    <div className="grid grid-cols-2 gap-4">
                        {allVideos.map((video) => (
                            <div key={video.id} className="relative group">
                                {/* 16:9 format */}
                                <div className="relative aspect-video rounded-xl overflow-hidden bg-gray-200 shadow-sm">
                                    <img src={video.image || video.thumbnail} alt={video.title} className="w-full h-full object-cover" />
                                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors"></div>

                                    {/* Delete Button */}
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            onDelete(video.id);
                                        }}
                                        className="absolute top-2 right-2 p-1.5 bg-black/50 text-white rounded-full hover:bg-red-500 transition backdrop-blur-sm"
                                    >
                                        <Icon name="x" size={12} />
                                    </button>

                                    <div className="absolute bottom-2 left-2">
                                        <div className="flex items-center text-white text-xs font-medium drop-shadow-md bg-black/40 px-1.5 py-0.5 rounded-md backdrop-blur-sm">
                                            <Icon name="eye" size={10} className="mr-1" />
                                            {video.views || 0}
                                        </div>
                                    </div>
                                </div>
                                <h3 className="text-gray-900 text-sm font-medium mt-2 leading-tight line-clamp-2">{video.title}</h3>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="flex items-center justify-center py-12">
                        <div className="text-gray-400">{getTranslation('No videos yet', selectedLanguage)}</div>
                    </div>
                )}
            </div>
        </div>
    );
};

const TopVideos = ({ videos, onViewAll, isPreviewMode, selectedLanguage = 'English' }) => {
    const [expandedVideoId, setExpandedVideoId] = useState(null);
    const displayVideos = videos.slice(0, 3);
    // Default to visible in preview so preview isn't blank; user can toggle to hide
    const [visibleInPreview, setVisibleInPreview] = useState(true);
    const [previewToggleActive, setPreviewToggleActive] = useState(false);
    const [showEyeHint, setShowEyeHint] = useState(false);

    // Helper to check if title is truncated (ends with ...)
    const isTruncated = (title) => title.endsWith("...");

    // If in preview mode and the user has hidden this section, render nothing
    if (isPreviewMode && !visibleInPreview) {
        return null;
    }

    useEffect(() => {
        // show the eye hint on initial mount for 10 seconds to educate the user
        // but skip when preview mode is active (no hints in preview)
        if (isPreviewMode) return;
        setShowEyeHint(true);
        const t = setTimeout(() => setShowEyeHint(false), 10000);
        return () => clearTimeout(t);
    }, [isPreviewMode]);

    return (
        <div className="mb-8">
            <div className="relative flex justify-between items-center mb-4 px-1">
                <h2 className="text-xl font-normal text-gray-900">{getTranslation('Top Videos', selectedLanguage)}</h2>
                <div className="flex items-center gap-2">
                    <button onClick={onViewAll} className="text-gray-500 text-sm font-medium hover:text-gray-900">{getTranslation('View All', selectedLanguage)}</button>
                    {!isPreviewMode && (
                        <button
                            onClick={() => {
                                setPreviewToggleActive(true);
                                setVisibleInPreview(v => !v);
                                setTimeout(() => setPreviewToggleActive(false), 300);
                            }}
                            aria-pressed={!visibleInPreview}
                            title={visibleInPreview ? getTranslation('Hide in preview', selectedLanguage) : getTranslation('Show in preview', selectedLanguage)}
                            className={`p-2 rounded-lg transition ${previewToggleActive ? 'scale-95 opacity-90' : 'hover:bg-gray-100'}`}
                        >
                            <Icon name={visibleInPreview ? "eye" : "eyeOff"} size={18} />
                        </button>
                    )}
                </div>
                {/* Page-load hint for the eye toggle */}
                {showEyeHint && !isPreviewMode && (
                    <div className="absolute right-0 -top-10 text-xs bg-black text-white px-2 py-1 rounded-md">
                        {getTranslation('Toggle this section in Preview. Click the eye to show/hide.', selectedLanguage)}
                    </div>
                )}
            </div>

            <div className="flex overflow-x-auto gap-3 pb-2 -mx-4 px-4 scrollbar-hide snap-x">
                {displayVideos.map((video) => (
                    <div key={video.id} className="relative min-w-[85%] aspect-video rounded-xl overflow-hidden bg-gray-200 shadow-sm snap-center flex-shrink-0">
                        <img src={video.image} alt={video.title} className="w-full h-full object-cover" />

                        {/* Edit Button */}
                        {!isPreviewMode && (
                            <div className="absolute top-2 right-2 bg-black/60 backdrop-blur-sm text-white text-[10px] px-2 py-1 rounded-md flex items-center cursor-pointer hover:bg-black/70 transition">
                                <Icon name="pencilLine" size={10} className="mr-1 text-white" />
                                {getTranslation('Edit', selectedLanguage)}
                            </div>
                        )}

                        {/* Bottom Info */}
                        <div className="absolute bottom-0 left-0 right-0 p-3 bg-gradient-to-t from-black/90 via-black/50 to-transparent pt-10">
                            <h3 className="text-white text-sm font-medium mb-1 leading-tight line-clamp-1">
                                {expandedVideoId === video.id
                                    ? (video.fullTitle || video.title)
                                    : (
                                        isTruncated(video.title)
                                            ? <span className="cursor-pointer underline decoration-dotted" onClick={() => setExpandedVideoId(video.id)}>{video.title}</span>
                                            : video.title
                                    )
                                }
                            </h3>
                            <div className="flex items-center text-gray-300 text-xs">
                                <Icon name="eye" size={12} className="mr-1" />
                                {video.views}
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

const QuickCTATemplates = ({ onCustomize, selectedLanguage = 'English' }) => {
    return (
        <div className="mb-8">
            <div className="flex justify-between items-start mb-1 px-1">
                <h2 className="text-xl font-semibold text-gray-900">{getTranslation('Quick CTA Templates', selectedLanguage)}</h2>
                <Icon name="more" className="text-gray-400" size={20} />
            </div>
            <p className="text-gray-500 text-sm mb-4 px-1">{getTranslation('Customize how fans request videos from you', selectedLanguage)}</p>

            <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
                <div className="flex items-center mb-3">
                    <span className="text-gray-400 text-sm mr-2">{getTranslation('Current CTA Preview:', selectedLanguage)}</span>
                    <span className="text-[var(--color-gold)] text-xs font-medium px-2 py-0.5 rounded-full border border-[var(--color-gold)]">
                        {getTranslation('Rotating (2/2)', selectedLanguage)}
                    </span>
                </div>

                <div className="flex justify-between items-center mb-4">
                    <p className="text-gray-900 font-medium text-lg pr-4 leading-tight">
                        {getTranslation("Your idea → Alex Morgan's next video", selectedLanguage)}
                    </p>
                    <button
                        onClick={onCustomize}
                        className="text-[var(--color-gold)] border border-[var(--color-gold)] px-3 py-1.5 rounded-lg text-sm font-medium whitespace-nowrap hover:bg-[var(--color-gold-light-bg)] transition"
                    >
                        {getTranslation('Customize', selectedLanguage)}
                    </button>
                </div>

                <div className="flex items-center text-gray-400 text-xs">
                    <Icon name="ideas" size={14} className="text-[var(--color-gold)] mr-1.5" />
                    {getTranslation('CTAs rotate every 30 seconds', selectedLanguage)}
                </div>
            </div>
        </div>
    );
};

const CTAPopup = ({ isOpen, onClose, onShowToast, categories, onToggleCategory, onToggleTemplate, onCreateTemplate, isPreview = false, selectedLanguage = 'English' }) => {
    if (!isOpen) return null;

    const [isCreating, setIsCreating] = useState(false);
    const [newTemplate, setNewTemplate] = useState({
        categoryId: 'custom',
        text: '',
        heading: '',
        subtext: ''
    });

    const handleCreateTemplate = () => {
        if (!newTemplate.text) return;

        const newTemplateObj = {
            id: Date.now(),
            text: newTemplate.text,
            label: newTemplate.heading,
            subtext: newTemplate.subtext,
            selected: true
        };

        onCreateTemplate(newTemplate.categoryId, newTemplateObj);

        setIsCreating(false);
        setNewTemplate({ categoryId: 'custom', text: '', heading: '', subtext: '' });

        if (onShowToast) {
            onShowToast({
                title: "Template Saved",
                subtitle: "Added to Your Templates"
            });
        }
    };

    return (
        <div className="fixed inset-0 z-[80] flex items-end sm:items-center justify-center sm:px-4">
            <div className={isPreview ? "absolute inset-0 bg-black/90" : "absolute inset-0 bg-black/60 backdrop-blur-sm"} onClick={onClose}></div>
            <div className="relative bg-white w-full max-w-md h-[85vh] sm:h-auto sm:max-h-[90vh] rounded-t-3xl sm:rounded-3xl shadow-2xl animate-in slide-in-from-bottom-full sm:zoom-in duration-300 flex flex-col overflow-hidden">

                {isCreating ? (
                    <div className="flex flex-col h-full border-2 border-[var(--color-gold)] rounded-t-3xl sm:rounded-3xl m-1">
                        <div className="p-6 pb-2 bg-white z-10 flex items-center gap-3">
                            <button onClick={() => setIsCreating(false)} className="text-gray-500 hover:text-gray-700 p-1 -ml-2">
                                <Icon name="arrowLeft" size={24} />
                            </button>
                            <h2 className="text-xl font-bold text-gray-900">{getTranslation('Create Custom CTA', selectedLanguage)}</h2>
                        </div>

                        <div className="p-6 pt-4 overflow-y-auto flex-grow scrollbar-hide">
                            {/* Category */}
                            <div className="mb-4">
                                <label className="block text-sm font-medium text-gray-700 mb-1">{getTranslation('Category', selectedLanguage)}</label>
                                <div className="relative">
                                    <select
                                        value={newTemplate.categoryId}
                                        onChange={(e) => setNewTemplate({ ...newTemplate, categoryId: e.target.value })}
                                        className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 outline-none appearance-none focus:border-[var(--color-gold)] text-gray-900"
                                    >
                                        {categories.map(cat => (
                                            <option key={cat.id} value={cat.id}>
                                                {cat.emoji ? `${cat.emoji} ` : ''}{cat.name}
                                            </option>
                                        ))}
                                    </select>
                                    <Icon name="chevronDown" className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none" size={20} />
                                </div>
                            </div>

                            {/* CTA Text */}
                            <div className="mb-4">
                                <label className="block text-sm font-medium text-gray-700 mb-1">{getTranslation('CTA Text (use {creator} for name)', selectedLanguage)}</label>
                                <input
                                    type="text"
                                    value={newTemplate.text}
                                    onChange={(e) => setNewTemplate({ ...newTemplate, text: e.target.value })}
                                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 outline-none focus:border-[var(--color-gold)] text-gray-900"
                                    placeholder={getTranslation('e.g., Tell {creator} what to create next', selectedLanguage)}
                                />
                            </div>

                            {/* Heading */}
                            <div className="mb-4">
                                <label className="block text-sm font-medium text-gray-700 mb-1">{getTranslation('Heading (optional)', selectedLanguage)}</label>
                                <input
                                    type="text"
                                    value={newTemplate.heading}
                                    onChange={(e) => setNewTemplate({ ...newTemplate, heading: e.target.value })}
                                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 outline-none focus:border-[var(--color-gold)] text-gray-900"
                                    placeholder={getTranslation('e.g., Your ideas matter', selectedLanguage)}
                                />
                            </div>

                            {/* Subtext */}
                            <div className="mb-6">
                                <label className="block text-sm font-medium text-gray-700 mb-1">{getTranslation('Subtext (optional)', selectedLanguage)}</label>
                                <textarea
                                    value={newTemplate.subtext}
                                    onChange={(e) => setNewTemplate({ ...newTemplate, subtext: e.target.value })}
                                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 outline-none focus:border-[var(--color-gold)] resize-none text-gray-900"
                                    rows={3}
                                    placeholder={getTranslation('e.g., Every request helps {creator} create better content', selectedLanguage)}
                                />
                            </div>

                            {/* Buttons */}
                            <div className="flex gap-3 mt-auto">
                                <button
                                    onClick={handleCreateTemplate}
                                    className="flex-1 bg-[var(--color-gold)] text-black font-semibold py-3 rounded-xl shadow-sm hover:bg-[var(--color-gold-darker)] transition flex items-center justify-center"
                                >
                                    <Icon name="check" size={18} className="mr-2" />
                                    {getTranslation('Create Template', selectedLanguage)}
                                </button>
                                <button
                                    onClick={() => setIsCreating(false)}
                                    className="flex-1 bg-white border border-gray-200 text-gray-700 font-semibold py-3 rounded-xl hover:bg-gray-50 transition"
                                >
                                    {getTranslation('Cancel', selectedLanguage)}
                                </button>
                            </div>
                        </div>
                    </div>
                ) : (
                    <>
                        {/* Header */}
                        <div className="p-6 pb-2 bg-white z-10 flex justify-between items-start">
                            <div>
                                <h2 className="text-xl font-bold text-gray-900">{getTranslation('Quick CTA Templates', selectedLanguage)}</h2>
                                <p className="text-gray-500 text-sm mt-1">{getTranslation('Customize how fans request videos from you', selectedLanguage)}</p>
                            </div>
                            <button onClick={onClose} className="text-gray-400 hover:text-gray-600 p-1">
                                <Icon name="x" size={24} />
                            </button>
                        </div>

                        {/* Scrollable Content */}
                        <div className="overflow-y-auto p-6 pt-4 space-y-4 scrollbar-hide pb-20">

                            {/* Intro Section */}
                            <div>
                                <div className="flex justify-between items-start gap-4 mb-4">
                                    <p className="text-gray-500 text-sm leading-relaxed">
                                        {getTranslation('Choose from 140+ templates across 23 categories (Max 3 selected)', selectedLanguage)}
                                    </p>
                                    <button
                                        onClick={() => setIsCreating(true)}
                                        className="flex items-center gap-1 px-3 py-1.5 border border-[var(--color-gold)] text-[var(--color-gold)] rounded-lg text-sm font-medium whitespace-nowrap hover:bg-[var(--color-gold-light-bg)] transition"
                                    >
                                        <span className="text-lg leading-none mb-0.5">+</span>
                                        <span>{getTranslation('New Template', selectedLanguage)}</span>
                                    </button>
                                </div>

                                <div className="flex items-center gap-3 mb-6">
                                    <span className="px-3 py-1 border border-[var(--color-gold)] text-[var(--color-gold)] rounded-lg text-xs font-medium bg-[var(--color-gold-light-bg)]">
                                        {categories.reduce((acc, cat) => acc + (cat.templates?.filter(t => t.selected).length || 0), 0)} {getTranslation('templates selected', selectedLanguage)}
                                    </span>
                                    <span className="text-gray-400 text-xs">
                                        {getTranslation('CTAs will rotate randomly on your profile', selectedLanguage)}
                                    </span>
                                </div>
                            </div>

                            {/* Categories List */}
                            <div className="space-y-3">
                                {categories.map((cat) => (
                                    <div key={cat.id} className="border border-gray-200 rounded-2xl overflow-hidden bg-white">
                                        {/* Category Header */}
                                        <div
                                            className="p-4 flex items-center justify-between cursor-pointer hover:bg-gray-50 transition"
                                            onClick={() => onToggleCategory(cat.id)}
                                        >
                                            <div className="flex items-center gap-3">
                                                <div className="text-xl w-6 text-center">
                                                    {cat.icon ? <Icon name={cat.icon} className={cat.id === 'default' ? "text-[var(--color-gold)]" : "text-gray-700"} /> : cat.emoji}
                                                </div>
                                                <div>
                                                    <div className="flex items-center gap-2">
                                                        <h3 className="font-semibold text-gray-900">{getTranslation(cat.name, selectedLanguage)}</h3>
                                                        {cat.count > 0 && (
                                                            <span className="w-5 h-5 flex items-center justify-center rounded-full border border-[var(--color-gold)] text-[var(--color-gold)] text-[10px] font-bold">
                                                                {cat.count}
                                                            </span>
                                                        )}
                                                    </div>
                                                    {cat.description && (
                                                        <p className="text-gray-500 text-xs mt-0.5">{getTranslation(cat.description, selectedLanguage)}</p>
                                                    )}
                                                    {cat.id === 'default' && (
                                                        <p className="text-gray-500 text-xs mt-0.5">{getTranslation('Simple, direct CTAs that work for any creator', selectedLanguage)}</p>
                                                    )}
                                                </div>
                                            </div>
                                            <Icon name={cat.isOpen ? "chevronUp" : "chevronDown"} className="text-gray-400" size={20} />
                                        </div>

                                        {/* Templates (if open) */}
                                        {cat.isOpen && cat.templates && (
                                            <div className="px-4 pb-4 space-y-3">
                                                {cat.templates.map((template) => (
                                                    <div
                                                        key={template.id}
                                                        onClick={() => onToggleTemplate(cat.id, template.id)}
                                                        className={`p-4 rounded-xl border transition-all cursor-pointer flex items-center justify-between ${template.selected 
                                                            ? 'border-[var(--color-gold)] bg-[var(--color-gold-light-bg)]'
                                                            : 'border-gray-200 bg-gray-50 hover:border-gray-300'
                                                        }`}
                                                    >
                                                <div className="pr-4">
                                                    {template.label && (
                                                        <p className="text-xs text-gray-400 mb-1">{getTranslation(template.label, selectedLanguage)}</p>
                                                    )}
                                                    <p className={`text-sm font-medium ${template.selected ? 'text-[var(--color-gold-darker)]' : 'text-gray-900'}`}>
                                                        {getTranslation(template.text, selectedLanguage)}
                                                    </p>
                                                    {template.subtext && (
                                                        <p className="text-xs text-gray-400 mt-1">{getTranslation(template.subtext, selectedLanguage)}</p>
                                                    )}
                                                </div>
                                                {template.selected && (
                                                    <div className="w-6 h-6 rounded-full bg-[var(--color-gold)] flex items-center justify-center flex-shrink-0">
                                                        <Icon name="check" size={14} className="text-white" strokeWidth={3} />
                                                    </div>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                                ))}
                        </div>

                        {/* How CTAs Work Section */}
                        <div className="bg-gray-50 rounded-2xl p-5 border border-gray-100 mt-6">
                            <div className="flex items-center gap-2 mb-4">
                                <Icon name="ideas" className="text-[var(--color-gold)]" size={24} />
                                <h3 className="font-semibold text-gray-900 text-lg">{getTranslation('How CTAs Work', selectedLanguage)}</h3>
                            </div>
                            <ul className="space-y-3 text-gray-500 text-sm">
                                <li className="flex items-start gap-2">
                                    <span className="mt-1.5 w-1 h-1 rounded-full bg-gray-400 flex-shrink-0"></span>
                                    <span>{getTranslation("Select multiple templates - they'll rotate every 30 seconds on your profile", selectedLanguage)}</span>
                                </li>
                                <li className="flex items-start gap-2">
                                    <span className="mt-1.5 w-1 h-1 rounded-full bg-gray-400 flex-shrink-0"></span>
                                    <span>{getTranslation('Hover over any template to edit or delete (custom templates only)', selectedLanguage)}</span>
                                </li>
                                <li className="flex items-start gap-2">
                                    <span className="mt-1.5 w-1 h-1 rounded-full bg-gray-400 flex-shrink-0"></span>
                                    <span>{getTranslation('All {creator} placeholders automatically use your name', selectedLanguage)}</span>
                                </li>
                                <li className="flex items-start gap-2">
                                    <span className="mt-1.5 w-1 h-1 rounded-full bg-gray-400 flex-shrink-0"></span>
                                    <span>{getTranslation('23 specialized categories: Tech, Podcasts, Fashion, Business, Psychology & more', selectedLanguage)}</span>
                                </li>
                                <li className="flex items-start gap-2">
                                    <span className="mt-1.5 w-1 h-1 rounded-full bg-gray-400 flex-shrink-0"></span>
                                    <span>Emotional CTAs convert better than transactional ones</span>
                                </li>
                                <li className="flex items-start gap-2">
                                    <span className="mt-1.5 w-1 h-1 rounded-full bg-gray-400 flex-shrink-0"></span>
                                    <span>Create and customize CTAs to match your unique style</span>
                                </li>
                            </ul>
                        </div>
                    </div>
            </>
                )}
        </div>
        </div >
    );
};

const AllVideos = ({ selectedCTAs, profileName, onCTAClick, selectedLanguage = 'English' }) => {
    const [currentIndex, setCurrentIndex] = useState(0);
    const [isVisible, setIsVisible] = useState(true);
    const [ctaActive, setCtaActive] = useState(false);
    const [messageIndex, setMessageIndex] = useState(0);
    const navigate = useNavigate();

    const messages = [
        getTranslation('Your idea could become the next video here', selectedLanguage),
        getTranslation('Turn your request into part of {name}\'s collection', selectedLanguage).replace('{name}', profileName)
    ];

    // Reset message index when user exits and returns to page
    useEffect(() => {
        const handleVisibilityChange = () => {
            if (document.visibilityState === 'visible') {
                setMessageIndex(0);
            }
        };
        document.addEventListener('visibilitychange', handleVisibilityChange);
        return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
    }, []);

    useEffect(() => {
        if (messages.length <= 1) return;
        const messageInterval = setInterval(() => {
            setMessageIndex((prev) => (prev + 1) % messages.length);
        }, 5000);
        return () => clearInterval(messageInterval);
    }, [messages.length, profileName]);

    const currentMessage = messages[messageIndex];

    useEffect(() => {
        if (selectedCTAs.length <= 1) return;
        const interval = setInterval(() => {
            setIsVisible(false); // Start dissolve out
            setTimeout(() => {
                setCurrentIndex((prev) => (prev + 1) % selectedCTAs.length);
                setIsVisible(true); // Start dissolve in
            }, 500); // Wait for fade out
        }, 5000);
        return () => clearInterval(interval);
    }, [selectedCTAs.length]);

    const ctaText = selectedCTAs.length > 0
        ? selectedCTAs[currentIndex].replace('{creator}', profileName)
        : `Your idea → ${profileName}'s next video`;

    return (
        <div className="mb-24">
            <h2 className="text-xl font-normal text-gray-900 mb-4 px-1">{getTranslation('All Videos', selectedLanguage)}</h2>

            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 flex flex-col items-center text-center min-h-[280px] justify-center">
                <div className="mb-6 text-gray-400">
                    <Icon name="video" size={48} strokeWidth={1.5} />
                </div>
                <h3 className="text-gray-400 text-lg mb-10">{currentMessage}</h3>

                <button
                    onClick={() => {
                        // show a brief active state so users perceive the press, then navigate
                        setCtaActive(true);
                        setTimeout(() => {
                            navigate('/ideas');
                            if (onCTAClick) onCTAClick();
                        }, 120);
                        // clear active state shortly after so it doesn't persist
                        setTimeout(() => setCtaActive(false), 420);
                    }}
                    className={`w-full shimmer-gold text-black font-medium py-4 rounded-xl text-base shadow-sm hover:opacity-90 transition flex items-center justify-center ${ctaActive ? 'scale-95 opacity-90' : ''}`}
                >
                    <span className={`transition-opacity duration-500 ${isVisible ? 'opacity-100' : 'opacity-0'}`}>
                        {ctaText}
                    </span>
                </button>
            </div>
        </div>
    );
};

const AboutSection = ({ profile, onUpdate, isPreviewMode, selectedLanguage = 'English' }) => {
    const [isEditing, setIsEditing] = useState(false);
    const [tempBio, setTempBio] = useState(profile?.bio || '');
    const [tempSocial, setTempSocial] = useState(profile?.social || { twitter: '', instagram: '' });

    const handleEditClick = () => {
        setTempBio(profile.bio);
        setTempSocial(profile.social || { twitter: '', instagram: '' });
        setIsEditing(true);
    };

    const handleSave = () => {
        onUpdate('bio', tempBio);
        onUpdate('social', tempSocial);
        setIsEditing(false);
    };

    if (isEditing) {
        return (
            <div className="mb-8">
                <h2 className="text-xl font-normal text-gray-900 mb-4 px-1">{getTranslation('About', selectedLanguage)}</h2>
                <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
                    <div className="mb-4">
                        <label className="block text-gray-700 font-medium mb-2 text-sm">{getTranslation('About You', selectedLanguage)}</label>
                        <div className="bg-gray-100 rounded-xl px-4 py-3">
                            <textarea
                                className="bg-transparent w-full outline-none text-gray-900 text-base resize-none"
                                rows={4}
                                value={tempBio}
                                onChange={(e) => setTempBio(e.target.value)}
                                autoFocus
                            />
                        </div>
                    </div>

                    <div className="mb-6">
                        <label className="block text-gray-700 font-medium mb-2 text-sm">{getTranslation('Social Links (Optional)', selectedLanguage)}</label>
                        <div className="bg-gray-100 rounded-xl px-4 py-3 mb-3 flex items-center">
                            <Icon name="twitter" size={18} className="text-gray-500 mr-3" />
                            <input
                                type="text"
                                placeholder={getTranslation('Twitter/X username (without @)', selectedLanguage)}
                                value={tempSocial.twitter}
                                onChange={(e) => setTempSocial({ ...tempSocial, twitter: e.target.value })}
                                className="bg-transparent w-full outline-none text-gray-900 text-base"
                            />
                        </div>
                        <div className="bg-gray-100 rounded-xl px-4 py-3 flex items-center">
                            <Icon name="instagram" size={18} className="text-gray-500 mr-3" />
                            <input
                                type="text"
                                placeholder={getTranslation('Instagram username (without @)', selectedLanguage)}
                                value={tempSocial.instagram}
                                onChange={(e) => setTempSocial({ ...tempSocial, instagram: e.target.value })}
                                className="bg-transparent w-full outline-none text-gray-900 text-base"
                            />
                        </div>
                    </div>

                    <div className="flex justify-end gap-3">
                        <button
                            onClick={() => setIsEditing(false)}
                            className="px-4 py-2 rounded-lg border border-gray-200 text-gray-700 font-medium hover:bg-gray-50 flex items-center text-sm"
                        >
                            <Icon name="x" size={16} className="mr-2" />
                            {getTranslation('Cancel', selectedLanguage)}
                        </button>
                        <button
                            onClick={handleSave}
                            className="px-6 py-2 rounded-lg bg-[var(--color-gold)] font-medium text-black hover:bg-[var(--color-gold-darker)] flex items-center shadow-sm text-sm"
                        >
                            <Icon name="save" size={16} className="mr-2" />
                            {getTranslation('Save', selectedLanguage)}
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="mb-8">
            <div className="flex justify-between items-center mb-4 px-1">
                <h2 className="text-xl font-normal text-gray-900">{getTranslation('About', selectedLanguage)}</h2>
                {!isPreviewMode && (
                    <button
                        onClick={handleEditClick}
                        className="flex items-center text-gray-900 font-medium text-sm hover:text-gray-600 transition"
                    >
                        <Icon name="pencilLine" size={16} className="mr-1" />
                        {getTranslation('Edit', selectedLanguage)}
                    </button>
                )}
            </div>

            <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
                <p className="text-gray-800 leading-relaxed whitespace-pre-wrap">
                    {profile.bio}
                </p>
            </div>
        </div>
    );
};

const ShareProfile = ({ profile, onCopy, selectedLanguage = 'English' }) => {
    const handleCopy = async () => {
        // Construct the profile URL using production domain
        const key = profile?.handle || profile?.id || profile?.email || profile?.name || 'user';
        const displayName = profile?.name || profile?.handle || 'Creator';
        const url = `${WEB_URL}/share/profile/${encodeURIComponent(String(key).replace(/^@/, ''))}`;
        const shareTitle = `${displayName} on Regaarder`;
        const shareText = `Check out ${displayName}'s profile on Regaarder — discover their content, ideas, and more!`;

        const successData = { title: "Link Copied", subtitle: "Profile link copied to clipboard" };

        // Try native share first
        try {
            if (navigator && navigator.share) {
                await navigator.share({ title: shareTitle, text: shareText, url: url });
                if (onCopy) onCopy({ title: "Shared", subtitle: "Profile shared successfully" });
                return;
            }
        } catch (err) {
            if (err.name === 'AbortError') return;
        }

        // Fallback to clipboard
        try {
            if (navigator.clipboard && navigator.clipboard.writeText) {
                await navigator.clipboard.writeText(url);
                if (onCopy) onCopy(successData);
            } else {
                throw new Error("Clipboard API unavailable");
            }
        } catch (err) {
            try {
                const textArea = document.createElement("textarea");
                textArea.value = url;
                textArea.style.position = "fixed";
                textArea.style.left = "-9999px";
                textArea.style.top = "0";
                document.body.appendChild(textArea);
                textArea.focus();
                textArea.select();
                const successful = document.execCommand('copy');
                document.body.removeChild(textArea);
                if (successful) {
                    if (onCopy) onCopy(successData);
                }
            } catch (fallbackErr) {
                console.error('Failed to copy:', fallbackErr);
            }
        }
    };

    return (
        <div className="mb-8">
            <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 flex items-center justify-between">
                <div className="flex items-center">
                    <div className="w-12 h-12 rounded-full flex items-center justify-center mr-3 relative overflow-hidden"
                        style={{
                            background: 'linear-gradient(135deg, #3B82F6 0%, #8B5CF6 100%)',
                            boxShadow: '0 4px 12px rgba(59, 130, 246, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.3)'
                        }}>
                        <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent"></div>
                        <Icon name="share" size={20} className="text-white relative z-10" />
                    </div>
                    <div>
                        <h3 className="font-semibold text-gray-900">{getTranslation('Share Your Profile', selectedLanguage)}</h3>
                        <p className="text-gray-500 text-sm">{getTranslation('Share your unique profile link', selectedLanguage)}</p>
                    </div>
                </div>

                <button
                    onClick={handleCopy}
                    className="flex items-center px-4 py-2 border border-gray-200 rounded-xl text-sm font-medium text-gray-900 hover:bg-gray-50 transition whitespace-nowrap active:scale-95 active:bg-gray-100"
                >
                    <Icon name="share" size={16} className="mr-2" />
                    {getTranslation('Share', selectedLanguage)}
                </button>
            </div>
        </div>
    );
};

const Toast = ({ data, onClose }) => {
    const [swipeOffset, setSwipeOffset] = useState(0);
    const [isDismissing, setIsDismissing] = useState(false);
    const dragStartX = useRef(0);
    const toastRef = useRef(null);

    useEffect(() => {
        const timer = setTimeout(() => {
            handleDismiss();
        }, 3000);
        return () => clearTimeout(timer);
    }, [onClose]);

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
        toastRef.current.style.cursor = 'grabbing';
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

    if (!data) return null;

    return (
        <div
            ref={toastRef}
            className={`fixed left-1/2 transform -translate-x-1/2 z-[100] flex items-center gap-3 px-4 py-3 rounded-2xl shadow-2xl min-w-[280px] max-w-[360px] transition-all duration-300 cursor-grab select-none backdrop-blur-xl ${isDismissing ? 'opacity-0 scale-95 -translate-y-4' : 'opacity-100 scale-100'}`}
            style={{
                top: 'calc(12px + env(safe-area-inset-top, 0px))',
                transform: `translateX(calc(-50% + ${swipeOffset}px))`,
                animation: isDismissing ? 'none' : 'toastSlideDown 0.5s cubic-bezier(0.34, 1.56, 0.64, 1)',
                background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.95) 0%, rgba(249, 250, 251, 0.95) 100%)',
                border: '1px solid rgba(255, 255, 255, 0.8)',
                boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04), inset 0 1px 0 rgba(255, 255, 255, 0.6)'
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
                    0% {
                        opacity: 0;
                        transform: translateX(-50%) translateY(-30px) scale(0.9);
                    }
                    50% {
                        transform: translateX(-50%) translateY(5px) scale(1.02);
                    }
                    100% {
                        opacity: 1;
                        transform: translateX(-50%) translateY(0) scale(1);
                    }
                }
                @keyframes checkPop {
                    0% { transform: scale(0) rotate(-45deg); }
                    50% { transform: scale(1.2) rotate(5deg); }
                    100% { transform: scale(1) rotate(0deg); }
                }
                .toast-check-icon {
                    animation: checkPop 0.4s cubic-bezier(0.34, 1.56, 0.64, 1) 0.2s backwards;
                }
            `}</style>
            <div className="relative flex-shrink-0">
                <div className="w-10 h-10 rounded-full flex items-center justify-center relative overflow-hidden"
                    style={{
                        background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                        boxShadow: '0 4px 12px rgba(16, 185, 129, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.3)'
                    }}>
                    <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent"></div>
                    <Icon name="check" size={18} className="text-white relative z-10 toast-check-icon" strokeWidth={3} />
                </div>
                <div className="absolute -inset-1 rounded-full animate-pulse"
                    style={{
                        background: 'radial-gradient(circle, rgba(16, 185, 129, 0.2) 0%, transparent 70%)',
                        animation: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite'
                    }}></div>
            </div>
            <div className="flex-grow min-w-0">
                <h4 className="font-semibold text-sm text-gray-900 leading-tight">{data.title}</h4>
                {data.subtitle && <p className="text-gray-600 text-xs mt-0.5 leading-snug">{data.subtitle}</p>}
            </div>
        </div>
    );
};

const SendTipPopup = ({ isOpen, onClose, profile, isPreview = false, selectedLanguage = 'English' }) => {
    if (!isOpen) return null;

    const quickAmounts = [5, 10, 25, 50, 100];
    const [customAmount, setCustomAmount] = useState('');
    const [selectedAmount, setSelectedAmount] = useState(null);
    const [showPayPal, setShowPayPal] = useState(false);
    const [selectedFormat, setSelectedFormat] = useState('One Time');
    const [showFormatDropdown, setShowFormatDropdown] = useState(false);
    
    // Pricing options with multipliers for recurring
    const pricingFormats = [
        { label: 'One Time', value: 'One Time', multiplier: 1 },
        { label: 'Monthly', value: 'Monthly', multiplier: 0.8 }
    ];

    const amountSelected = () => {
        // prefer selectedAmount (quick buttons) but allow customAmount if provided
        if (selectedAmount) return selectedAmount;
        const parsed = Number(customAmount);
        return parsed > 0 ? parsed : null;
    };

    const isActive = !!amountSelected();

    // If showing PayPal, navigate to the payment page
    if (showPayPal) {
        // Redirect to PayPal payment page in the same window
        window.location.href = "https://www.paypal.com/ncp/payment/LABFRAJUV5B9J";
        return null;
    }

    return (
        <div className="fixed inset-0 z-[70] flex items-center justify-center px-4">
            <div className={isPreview ? "absolute inset-0 bg-black/90" : "absolute inset-0 bg-black/60 backdrop-blur-sm"} onClick={onClose}></div>
            <div className="relative bg-white rounded-3xl w-full max-w-md shadow-2xl animate-in fade-in zoom-in duration-200 max-h-[85vh] flex flex-col overflow-hidden">
                {/* Header */}
                <div className="p-6 pb-4 border-b border-gray-50 bg-white z-10 relative">
                    <div className="flex items-center gap-2 mb-1">
                        <span className="text-[var(--color-gold)] font-semibold text-xl">$</span>
                        <h2 className="text-2xl sm:text-3xl font-semibold text-gray-900 tracking-tight">{getTranslation('Send Tip', selectedLanguage)}</h2>
                    </div>
                    <p className="text-gray-600 text-sm sm:text-base leading-relaxed mt-1">{getTranslation("Show your appreciation and support {name}'s work", selectedLanguage).replace('{name}', profile.name)}</p>
                </div>

                <div className="overflow-y-auto p-5 pt-2 space-y-4 scrollbar-hide flex-1">
                    {/* Creator Card */}
                    <div className="bg-gray-50 rounded-2xl p-4 flex items-center gap-4">
                        <div className="w-12 h-12 rounded-full overflow-hidden bg-gray-200 flex-shrink-0">
                            <img src={profile.image || "https://placehold.co/400x400/e2e8f0/1e293b?text=User"} alt="Profile" className="w-full h-full object-cover" />
                        </div>
                        <div>
                            <p className="text-gray-600 text-sm sm:text-base">{getTranslation('Sending tip to', selectedLanguage)}</p>
                            <p className="font-semibold text-gray-900 text-lg">{profile.name}</p>
                        </div>
                    </div>

                    {/* Pricing Format Dropdown */}
                    <div className="relative">
                        <h3 className="text-gray-600 text-sm mb-2 font-medium">{getTranslation('Select Tip Type', selectedLanguage)}</h3>
                        <button
                            onClick={() => setShowFormatDropdown(!showFormatDropdown)}
                            className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3 flex items-center justify-between hover:bg-gray-50 transition-colors"
                        >
                            <span className="font-medium text-gray-900">{selectedFormat}</span>
                            <Icon name={showFormatDropdown ? "chevron-up" : "chevron-down"} size={20} className="text-gray-400" />
                        </button>
                        
                        {showFormatDropdown && (
                            <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-xl shadow-lg z-20 overflow-hidden">
                                {pricingFormats.map((format) => (
                                    <button
                                        key={format.value}
                                        onClick={() => {
                                            setSelectedFormat(format.value);
                                            setShowFormatDropdown(false);
                                        }}
                                        className={`w-full px-4 py-3 text-left transition-colors flex justify-between items-center ${
                                            selectedFormat === format.value 
                                                ? 'bg-[var(--color-gold-cream)] border-b border-gray-100' 
                                                : 'hover:bg-gray-50 border-b border-gray-50 last:border-b-0'
                                        }`}
                                    >
                                        <span className="font-medium text-gray-900">{format.label}</span>
                                        {selectedFormat === format.value && (
                                            <Icon name="check" size={18} className="text-[var(--color-gold)]" />
                                        )}
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Quick Amount */}
                    <div>
                        <h3 className="text-gray-600 text-sm mb-2 font-medium">{getTranslation('Quick Amount', selectedLanguage)}</h3>
                        <div className="grid grid-cols-3 gap-2">
                            {quickAmounts.map((amount) => {
                                const active = selectedAmount === amount;
                                return (
                                    <button
                                        key={amount}
                                        onClick={() => {
                                            setSelectedAmount(amount);
                                            setCustomAmount('');
                                        }}
                                        className={`rounded-xl py-3 flex flex-col items-center justify-center transition-colors border text-sm ${active ? 'bg-[#173A66] text-white border-[#173A66]' : 'bg-gray-50 hover:bg-gray-100 border-gray-100'}`}>
                                        <span className={`font-semibold`}>${amount}</span>
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    {/* Custom Amount */}
                    <div>
                        <h3 className="text-gray-600 text-sm mb-2 font-medium">{getTranslation('Custom Amount', selectedLanguage)}</h3>
                        <div className="flex gap-2">
                            <div className="flex-grow bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 flex items-center focus-within:border-[var(--color-gold)] transition-colors">
                                <span className="text-gray-400 mr-2 text-lg">$</span>
                                <input
                                    type="number"
                                    value={customAmount}
                                    onChange={(e) => {
                                        setCustomAmount(e.target.value);
                                        setSelectedAmount(null);
                                    }}
                                    className="bg-transparent w-full outline-none text-gray-900 font-semibold text-sm"
                                    placeholder={getTranslation('Amount', selectedLanguage)}
                                />
                            </div>
                        </div>
                    </div>

                    {/* Support Info - condensed */}
                    <div className="bg-[var(--color-gold-cream)]/40 rounded-xl p-3 flex gap-3 border border-[var(--color-gold-cream)]/50 text-xs">
                        <div className="text-[var(--color-gold)] flex-shrink-0">
                            <div className="w-6 h-6 bg-[var(--color-gold-cream)] rounded-md flex items-center justify-center">
                                <span className="font-bold text-sm">$</span>
                            </div>
                        </div>
                        <div>
                            <p className="text-gray-900 font-medium mb-0.5">{getTranslation('100% to creator', selectedLanguage)}</p>
                            <p className="text-gray-500 leading-snug">
                                {selectedFormat === 'One Time' 
                                    ? getTranslation('No fees, goes directly to support their work', selectedLanguage)
                                    : getTranslation('Monthly recurring, cancel anytime', selectedLanguage)}
                            </p>
                        </div>
                    </div>

                    {/* Primary CTA */}
                    <div className="sticky bottom-0 pt-3 bg-white border-t border-gray-100">
                        <button
                            onClick={() => {
                                const amt = amountSelected();
                                if (!amt) return;
                                setShowPayPal(true);
                            }}
                            disabled={!isActive}
                            className={`w-full px-4 py-3 rounded-2xl text-base font-semibold transition-colors focus:outline-none ${isActive ? 'bg-gray-900 text-white hover:bg-gray-800' : 'bg-gray-100 text-gray-400 cursor-not-allowed'}`}>
                            {isActive ? `${getTranslation('Continue', selectedLanguage)} \u2014 $${amountSelected() || '0'} / ${selectedFormat}` : getTranslation('Select an amount', selectedLanguage)}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

const WelcomePopup = ({ isOpen, onClose, profile, onBecomeSponsor, onSendTip, customData, isPreview = false, isSharedLink = false, selectedLanguage = 'English' }) => {
    if (!isOpen) return null;

    const title = (customData?.title || getTranslation('{name} is waiting for you!', selectedLanguage)).replace(/{name}/g, profile.name);
    const message = (customData?.message || getTranslation('Tell {name} what video(s) to create next', selectedLanguage)).replace(/{name}/g, profile.name);
    const ctaText = (customData?.ctaText || getTranslation('Tell {name}', selectedLanguage)).replace(/{name}/g, profile.name);

    const navigate = useNavigate();
    const [ctaActive, setCtaActive] = useState(false);

    const handleMainCTA = () => {
        // Store creator data in localStorage for ideas page
        const creatorData = {
            id: profile.id || profile.handle || profile.name,
            name: profile.name,
            handle: profile.handle,
            displayName: profile.name,
            photoURL: profile.image,
            image: profile.image,
            price: profile.price || 0
        };
        try {
            localStorage.setItem('ideas_selectedCreator_v1', JSON.stringify(creatorData));
        } catch (e) {
            console.warn('Failed to store creator data:', e);
        }

        // show a brief active state so users perceive the press, then navigate
        setCtaActive(true);
        setTimeout(() => {
            try { if (window.setFooterTab) window.setFooterTab('ideas'); } catch (e) { }
            navigate('/ideas');
        }, 120);
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center px-0">
            <style>{`
                @keyframes shine {
                    0% { left: -100%; }
                    20% { left: 100%; }
                    100% { left: 100%; }
                }
                @keyframes shimmer-gold-premium {
                    0% { background-position: 100% 0; }
                    40% { background-position: 0% 0; }
                    100% { background-position: 0% 0; }
                }
                @keyframes img-brighten {
                    0% { filter: brightness(0.96) saturate(0.98); }
                    40% { filter: brightness(1.12) saturate(1.03); }
                    100% { filter: brightness(0.96) saturate(0.98); }
                }
                .shimmer-gold {
                    background: linear-gradient(100deg, var(--color-gold) 0%, var(--color-gold) 42%, var(--color-gold-cream) 45%, var(--color-gold-cream) 55%, var(--color-gold) 58%, var(--color-gold) 100%);
                    background-size: 300% 100%;
                    animation: shimmer-gold-premium 3s ease-in-out infinite;
                }
                .img-shimmer {
                    animation: img-brighten 3.5s ease-in-out infinite;
                    will-change: filter;
                }
            `}</style>
            {/* Use a plain black backdrop when opened from preview mode (no blur) */}
            <div className={isPreview || isSharedLink ? "absolute inset-0 bg-black/90" : "absolute inset-0 bg-black/60 backdrop-blur-sm"} onClick={!isSharedLink ? onClose : undefined}></div>
            <div className="relative bg-white rounded-xl w-full max-w-md mx-4 px-6 py-8 sm:px-6 sm:py-8 shadow-2xl animate-in fade-in zoom-in duration-200 flex flex-col items-center">
                {!isPreview && !isSharedLink && (
                    <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600">
                        <Icon name="x" size={24} />
                    </button>
                )}

                {/* Avatar */}
                <div className="mb-4 relative">
                    <div className="w-28 h-28 rounded-full p-1 shadow-sm bg-transparent">
                        <div className="w-full h-full rounded-full p-1 shimmer-gold">
                            <div className="w-full h-full rounded-full border-4 border-white overflow-hidden bg-gray-200 relative">
                                <img
                                    src={profile.image || "https://placehold.co/400x400/e2e8f0/1e293b?text=User"}
                                    alt="Profile"
                                    className="w-full h-full object-cover img-shimmer"
                                />
                            </div>
                        </div>
                    </div>
                </div>

                <h2 className="text-2xl sm:text-3xl font-semibold text-gray-900 text-center mb-2 tracking-tight leading-snug">
                    {title}
                </h2>
                <div className="flex items-center justify-center mb-3 text-4xl" aria-hidden="true">🎬</div>

                <p className="text-gray-600 text-center text-base sm:text-lg font-normal whitespace-pre-wrap mb-6 max-w-[44rem] leading-relaxed">
                    {message}
                </p>

                {profile.price && (
                    <div className="bg-gray-100 text-gray-900 px-5 py-2 rounded-xl text-sm font-medium mb-4">
                        {getTranslation('From', selectedLanguage)} ${profile.price} USD
                    </div>
                )}

                <button
                    className={`relative overflow-hidden w-full bg-[var(--color-gold)] text-white font-semibold py-4 rounded-full text-lg tracking-wide shadow-md hover:bg-[var(--color-gold-darker)] transition flex items-center justify-center mb-4 ${ctaActive ? 'scale-95 opacity-90' : ''}`}
                    onClick={handleMainCTA}
                    aria-label={ctaText}
                >
                    <div
                        className="absolute top-0 h-full w-2/3 bg-gradient-to-r from-transparent via-white/30 to-transparent"
                        style={{ animation: 'shine 6s infinite' }}
                    ></div>
                    <Icon name="video" size={20} className="mr-2 text-white relative z-10" />
                    <span className="relative z-10">{ctaText}</span>
                </button>

                <div className="flex gap-3 w-full mb-4 flex-nowrap">
                    <button
                        onClick={onSendTip}
                        className={`flex-1 min-w-0 border border-gray-200 rounded-full py-2 sm:py-3 flex items-center justify-center font-medium text-gray-700 hover:bg-gray-50 transition text-sm tracking-wide`}
                    >
                        <Icon name="heart" size={18} className="mr-2 flex-shrink-0" />
                        <span className="truncate">{getTranslation('Send Tip', selectedLanguage)}</span>
                    </button>
                    <button
                        onClick={onBecomeSponsor}
                        className={`flex-1 min-w-0 border border-gray-200 rounded-full py-2 sm:py-3 flex items-center justify-center font-medium text-gray-700 hover:bg-gray-50 transition text-sm tracking-wide`}
                    >
                        <Icon name="star" size={18} className="mr-2 flex-shrink-0" />
                        <span className="truncate">{getTranslation('Become a Sponsor', selectedLanguage)}</span>
                    </button>
                </div>

                {!isSharedLink && (
                    <button onClick={onClose} className="text-gray-500 text-sm hover:text-gray-700 font-normal mt-1">
                        {getTranslation('Maybe later', selectedLanguage)}
                    </button>
                )}
            </div>
        </div>
    );
};

const WelcomePopupConfig = ({ isOpen, onClose, data, onSave, onPreview, isPreview = false, selectedLanguage = 'English' }) => {
    if (!isOpen) return null;

    const getDefaults = () => ({
        title: getTranslation('{name} is waiting for you! 🎬', selectedLanguage),
        message: getTranslation('Where should {name} go next?', selectedLanguage),
        ctaText: getTranslation('Tell {name}', selectedLanguage)
    });

    const [tempData, setTempData] = useState(data || getDefaults());

    const handleChange = (field, value) => {
        setTempData(prev => ({ ...prev, [field]: value }));
    };

    const handleReset = () => {
        setTempData(getDefaults());
    };

    return (
        <div className="fixed inset-0 z-[90] flex items-end sm:items-center justify-center sm:px-4">
            <div className={isPreview ? "absolute inset-0 bg-black/90" : "absolute inset-0 bg-black/60 backdrop-blur-sm"} onClick={onClose}></div>
            <div className="relative bg-white w-full max-w-md h-[90vh] sm:h-auto rounded-t-3xl sm:rounded-3xl shadow-2xl animate-in slide-in-from-bottom-full sm:zoom-in duration-300 flex flex-col overflow-hidden">
                <div className="p-6 pb-2 bg-white z-10 flex justify-between items-start">
                    <div>
                        <h2 className="text-2xl sm:text-3xl font-semibold text-gray-900 tracking-tight">{getTranslation('Customize Welcome Popup', selectedLanguage)}</h2>
                        <p className="text-gray-600 text-sm sm:text-base leading-relaxed mt-1">{getTranslation('Personalize the greeting message that fans see when they visit your profile', selectedLanguage)}</p>
                    </div>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600 p-1">
                        <Icon name="x" size={24} />
                    </button>
                </div>

                {/* Scrollable Content */}
                <div className="overflow-y-auto p-6 pt-4 space-y-4 scrollbar-hide pb-20">
                    {/* Title */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">{getTranslation('Title', selectedLanguage)}</label>
                        <div className="bg-gray-100 rounded-xl px-4 py-3">
                            <input
                                type="text"
                                value={tempData.title}
                                onChange={(e) => handleChange('title', e.target.value)}
                                className="bg-transparent w-full outline-none text-gray-900 font-medium"
                                placeholder={getTranslation('Enter a title', selectedLanguage)}
                                autoFocus
                            />
                        </div>
                        <div className="text-right text-xs text-gray-400 mt-1">{tempData.title.length}/60 {getTranslation('characters', selectedLanguage)}</div>
                    </div>

                    {/* Message */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">{getTranslation('Message', selectedLanguage)}</label>
                        <div className="bg-gray-100 rounded-xl px-4 py-3">
                            <textarea
                                value={tempData.message}
                                onChange={(e) => handleChange('message', e.target.value)}
                                className="bg-transparent w-full outline-none text-gray-900 resize-none font-medium"
                                rows={3}
                                placeholder={getTranslation('Enter your message', selectedLanguage)}
                            />
                        </div>
                        <div className="text-right text-xs text-gray-400 mt-1">{tempData.message.length}/200 {getTranslation('characters', selectedLanguage)}</div>
                    </div>

                    {/* CTA Text */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">{getTranslation('CTA Button Text', selectedLanguage)}</label>
                        <div className="bg-gray-100 rounded-xl px-4 py-3">
                            <input
                                type="text"
                                value={tempData.ctaText}
                                onChange={(e) => handleChange('ctaText', e.target.value)}
                                className="bg-transparent w-full outline-none text-gray-900 font-medium"
                                placeholder={getTranslation('Enter CTA button text', selectedLanguage)}
                            />
                        </div>
                        <div className="text-right text-xs text-gray-400 mt-1">{tempData.ctaText.length}/40 {getTranslation('characters', selectedLanguage)}</div>
                    </div>

                    {/* Buttons */}
                    <div className="flex gap-3 mt-auto">
                        <button
                            onClick={handleReset}
                            className="flex-1 bg-white border border-gray-200 text-gray-700 font-semibold py-3 rounded-xl hover:bg-gray-50 transition flex items-center justify-center"
                        >
                            <Icon name="refresh" size={18} className="mr-2" />
                            {getTranslation('Reset', selectedLanguage)}
                        </button>
                        <button
                            onClick={() => onPreview(tempData)}
                            className="flex-1 bg-white border border-gray-200 text-gray-700 font-semibold py-3 rounded-xl hover:bg-gray-50 transition flex items-center justify-center"
                        >
                            <Icon name="eye" size={18} className="mr-2" />
                            {getTranslation('Preview', selectedLanguage)}
                        </button>
                        <button
                            onClick={() => { onSave(tempData); onClose(); }}
                            className="flex-grow flex items-center justify-center px-4 py-3 bg-[var(--color-gold)] rounded-xl text-sm font-bold text-black hover:bg-[var(--color-gold-darker)] transition shadow-sm"
                        >
                            <Icon name="save" size={18} className="mr-2" />
                            Save
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

const SponsorPopup = ({ isOpen, onClose, profile, isPreview = false, selectedLanguage = 'English' }) => {
    if (!isOpen) return null;

    const tiers = [
        {
            name: getTranslation("Support", selectedLanguage),
            price: "5",
            description: getTranslation("Help me create more content", selectedLanguage),
            perks: [getTranslation("Early access to videos", selectedLanguage), getTranslation("Supporter badge", selectedLanguage)]
        },
        {
            name: getTranslation("Enthusiast", selectedLanguage),
            price: "15",
            description: getTranslation("Show your enthusiasm", selectedLanguage),
            perks: [getTranslation("All Support perks", selectedLanguage), getTranslation("Monthly Q&A access", selectedLanguage), getTranslation("Name in credits", selectedLanguage)]
        },
        {
            name: getTranslation("Patron", selectedLanguage),
            price: "50",
            description: getTranslation("Become a patron", selectedLanguage),
            perks: [getTranslation("All Enthusiast perks", selectedLanguage), getTranslation("1-on-1 consultation (quarterly)", selectedLanguage), getTranslation("Custom video request priority", selectedLanguage)],
            popular: true
        }
    ];

    const [selectedTier, setSelectedTier] = useState(null);
    const [customMonthlyAmount, setCustomMonthlyAmount] = useState('');
    const [oneTimeAmount, setOneTimeAmount] = useState('');
    const [isProcessing, setIsProcessing] = useState(false);
    const [paymentError, setPaymentError] = useState(null);
    const isMonthlyActive = !!selectedTier || Number(customMonthlyAmount) > 0;
    const selectedPrice = selectedTier ? (tiers.find(t => t.name === selectedTier)?.price || null) : (Number(customMonthlyAmount) > 0 ? customMonthlyAmount : null);

    // Get backend URL dynamically
    const getBackendUrl = () => {
        if (window && window.__BACKEND_URL__) return window.__BACKEND_URL__;
        return 'https://pwin.onrender.com';
    };

    // Process payment and redirect to PayPal
    const processPayment = async (mode, amount) => {
        if (!amount || Number(amount) <= 0) return;
        setIsProcessing(true);
        setPaymentError(null);

        try {
            const backendUrl = getBackendUrl();
            const token = localStorage.getItem('authToken');

            if (!token) {
                setPaymentError(getTranslation('Please log in to continue', selectedLanguage));
                setIsProcessing(false);
                return;
            }

            // Initialize payment session with backend
            const initResponse = await fetch(`${backendUrl}/payment/init`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    amount: Number(amount),
                    paymentType: 'subscription',
                    subscriptionTier: selectedTier || 'custom',
                    paymentMode: mode === 'monthly' ? 'monthly' : 'one-time'
                })
            });

            if (!initResponse.ok) {
                throw new Error('Failed to initialize payment session');
            }

            const initData = await initResponse.json();
            const sessionId = initData.sessionId;

            // Store payment session data in localStorage for callback handling
            localStorage.setItem('pending_payment_session', JSON.stringify({
                sessionId,
                amount: Number(amount),
                tier: selectedTier || 'custom',
                mode: mode === 'monthly' ? 'monthly' : 'one-time',
                timestamp: Date.now()
            }));

            console.log('✅ Payment session initialized:', sessionId);

            // Redirect to PayPal payment page
            // In production, this would be dynamic based on actual PayPal setup
            // For now, this is the static PayPal payment link
            window.location.href = "https://www.paypal.com/ncp/payment/XWKNU42XM5ZPQ";
        } catch (error) {
            console.error('Payment initialization error:', error);
            setPaymentError(error.message || getTranslation('Payment failed. Please try again.', selectedLanguage));
            setIsProcessing(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center px-4">
            <div className={isPreview ? "absolute inset-0 bg-black/90" : "absolute inset-0 bg-black/60 backdrop-blur-sm"} onClick={onClose}></div>
            <div className="relative bg-white rounded-3xl w-full max-w-md shadow-2xl animate-in fade-in zoom-in duration-200 max-h-[85vh] flex flex-col overflow-hidden">
                {/* Header */}
                <div className="p-4 pb-3 border-b border-gray-50 bg-white z-10 relative">
                    <div className="text-center px-4">
                        <h2 className="text-lg sm:text-2xl md:text-3xl font-semibold text-gray-900 tracking-tight leading-tight">{getTranslation('Become a Sponsor', selectedLanguage)}</h2>
                        <p className="text-gray-600 text-sm sm:text-base leading-relaxed mt-1 max-w-[90%] mx-auto">{getTranslation('Support {name} and get exclusive perks', selectedLanguage).replace('{name}', profile.name)}</p>
                    </div>
                </div>

                {/* Scrollable Content */}
                <div className="overflow-y-auto p-5 pt-2 space-y-3 scrollbar-hide flex-1">
                    {/* Error message */}
                    {paymentError && (
                        <div className="bg-red-50 border border-red-200 rounded-xl p-3 flex gap-3">
                            <Icon name="alert-circle" size={18} className="text-red-600 flex-shrink-0 mt-0.5" />
                            <p className="text-red-700 text-sm">{paymentError}</p>
                        </div>
                    )}
                    {/* Compact tier cards */}
                    <div className="grid grid-cols-3 gap-2 mb-3">
                        {tiers.map((tier) => {
                            const active = selectedTier === tier.name;
                            return (
                                <button
                                    key={tier.name}
                                    type="button"
                                    onClick={() => setSelectedTier(tier.name)}
                                    aria-pressed={active}
                                    aria-label={`${tier.name} tier ${tier.price} dollars per month`}
                                    className={`relative p-3 rounded-xl flex flex-col items-center justify-center text-center transition-shadow focus:outline-none ${active ? 'bg-[#173A66] text-white shadow-lg ring-2 ring-[#173A66]' : 'bg-white border border-gray-200 hover:shadow-sm hover:bg-gray-50'} focus:ring-2 focus:ring-[#173A66] focus:ring-offset-2`}>
                                    {tier.popular && (
                                        <div className="absolute -top-1.5 right-1 text-[9px] bg-[var(--color-gold-cream)] text-[var(--color-gold)] px-1.5 py-0.5 rounded-full font-bold">{getTranslation('Popular', selectedLanguage)}</div>
                                    )}
                                    <div className="text-xs font-medium truncate">{tier.name}</div>
                                    <div className={`text-lg font-extrabold mt-1 ${active ? 'text-white' : 'text-gray-900'}`}>${tier.price}</div>
                                </button>
                            );
                        })}
                    </div>

                    {/* Custom monthly amount */}
                    <div className="mb-2">
                        <div className="flex items-center justify-between mb-1.5">
                            <h3 className="font-medium text-gray-900 text-sm">{getTranslation('Custom Amount', selectedLanguage)}</h3>
                            <div className="text-xs text-gray-400">{getTranslation('/month', selectedLanguage)}</div>
                        </div>
                        <div className="flex gap-2">
                            <div className="flex-grow bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 flex items-center focus-within:border-[#173A66] transition-colors">
                                <span className="text-gray-400 mr-2 text-sm">$</span>
                                <input
                                    type="number"
                                    value={customMonthlyAmount}
                                    onChange={(e) => {
                                        setCustomMonthlyAmount(e.target.value);
                                        setSelectedTier(null);
                                    }}
                                    className="bg-transparent w-full outline-none text-gray-900 font-medium text-sm"
                                    placeholder="0"
                                />
                            </div>
                        </div>
                    </div>

                    {/* One-time Tip - optional */}
                    <div className="mb-2 border border-gray-200 rounded-xl p-3 bg-white shadow-sm">
                        <div className="flex items-center justify-between mb-2">
                            <h3 className="font-medium text-gray-900 text-sm">{getTranslation('One-time Tip', selectedLanguage)}</h3>
                            <div className="text-xs text-gray-400">{getTranslation('Optional', selectedLanguage)}</div>
                        </div>

                        <div className="flex gap-2 items-center">
                            <div className="flex-grow bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 flex items-center focus-within:border-[#173A66] transition-colors">
                                <span className="text-gray-400 mr-2 text-sm">$</span>
                                <input
                                    type="number"
                                    value={oneTimeAmount}
                                    onChange={(e) => setOneTimeAmount(e.target.value)}
                                    className="bg-transparent w-full outline-none text-gray-900 font-medium text-sm"
                                    placeholder="0"
                                />
                            </div>
                            <button
                                type="button"
                                onClick={() => processPayment('one-time', oneTimeAmount)}
                                disabled={!oneTimeAmount || Number(oneTimeAmount) <= 0 || isProcessing}
                                className={`px-3 py-2 rounded-lg text-xs transition-colors ${oneTimeAmount && Number(oneTimeAmount) > 0 && !isProcessing ? 'bg-[var(--color-gold-light-bg)] text-black font-semibold hover:bg-[var(--color-gold-darker)]' : 'bg-gray-100 text-gray-400 cursor-not-allowed'}`}>
                                {isProcessing ? getTranslation('Processing...', selectedLanguage) : getTranslation('Send', selectedLanguage)}
                            </button>
                        </div>
                    </div>

                    {/* Primary CTA */}
                    <div className="sticky bottom-0 pt-3 bg-white border-t border-gray-100">
                        <button
                            type="button"
                            onClick={() => processPayment('monthly', selectedPrice)}
                            disabled={!isMonthlyActive || isProcessing}
                            className={`w-full px-4 py-3 rounded-2xl text-base font-semibold transition-colors focus:outline-none ${isMonthlyActive && !isProcessing ? 'bg-gray-900 text-white hover:bg-gray-800' : 'bg-gray-100 text-gray-400 cursor-not-allowed'}`}>
                            {isProcessing ? `${getTranslation('Processing', selectedLanguage)}...` : isMonthlyActive ? `${getTranslation('Continue', selectedLanguage)} \u2014 $${selectedPrice} / ${getTranslation('mo', selectedLanguage)}` : getTranslation('Select amount', selectedLanguage)}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

const CompleteProfilePopup = ({ onClose, profile, onUpdate, isPreview = false }) => {
    const [editingField, setEditingField] = useState(null);
    const [tagline, setTagline] = useState(profile.tagline || '');
    const [price, setPrice] = useState(profile.price || '');
    const [emailInput, setEmailInput] = useState(profile.email || '');
    const [showEmailInput, setShowEmailInput] = useState(false);
    const [verificationSent, setVerificationSent] = useState(false);

    // Derived states
    const isTaglineSet = !!tagline;
    const isPriceSet = !!price && Number(price) >= 7;
    const emailVerified = !!profile.emailVerified;

    const fileInputRef = useRef(null);

    const handleSaveTagline = () => {
        onUpdate('tagline', tagline);
        setEditingField(null);
    };
    const handleSavePrice = () => {
        onUpdate('price', price);
        setEditingField(null);
    };

    // Email verification handler
    const handleSendVerification = () => {
        if (!emailInput) return;
        setVerificationSent(true);
        setTimeout(() => setVerificationSent(false), 3000);
        // Simulate verification sent, update profile
        onUpdate('email', emailInput);
        // You can add more logic here to actually send email
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-2">
            <div className={isPreview ? "absolute inset-0 bg-black/90" : "absolute inset-0 bg-black/60 backdrop-blur-sm"} onClick={onClose}></div>
            <div className="relative bg-white rounded-2xl w-full max-w-md shadow-2xl animate-in fade-in zoom-in duration-200" style={{ maxHeight: '90vh', minHeight: '480px' }}>
                {/* Header */}
                <div className="px-6 pt-6 pb-2 flex items-center justify-between">
                    <div>
                        <div className="flex items-center gap-2 mb-1">
                            <Icon name="sparkles" size={22} className="text-[var(--color-gold)]" />
                            <h2 className="text-2xl sm:text-3xl font-semibold text-gray-900 tracking-tight">{getTranslation('Complete Your Profile', selectedLanguage)}</h2>
                        </div>
                        <div className="text-gray-600 text-sm sm:text-base font-normal leading-relaxed">
                            {getTranslation('Fill in all fields to maximize your profile visibility and attract more fans', selectedLanguage)}
                        </div>
                    </div>
                </div>
                {/* Divider */}
                <div className="px-6 pt-2 pb-2">
                    <div className="w-full h-0.5 bg-gradient-to-r from-transparent via-[var(--color-gold)] to-transparent rounded-full"></div>
                </div>
                {/* Scrollable Content */}
                <div className="flex-1 overflow-y-auto px-6 pb-4 pt-2 scrollbar-hide">
                    {/* Tagline */}
                    <div className="mb-4">
                        <span className="text-gray-900 font-normal text-base">{getTranslation('Tagline (optional)', selectedLanguage)}</span>
                        <div className="flex items-center mt-1">
                            {editingField === 'tagline' ? (
                                <input
                                    type="text"
                                    value={tagline}
                                    onChange={e => setTagline(e.target.value)}
                                    className="w-full bg-gray-100 rounded-xl px-4 py-3 outline-none text-gray-900 font-normal"
                                    placeholder={getTranslation('Not set', selectedLanguage)}
                                    autoFocus
                                />
                            ) : (
                                <div className="flex w-full items-center">
                                    <div className="flex-grow bg-gray-100 rounded-xl px-4 py-3 text-gray-900 font-normal">
                                        {tagline || <span className="text-gray-400">{getTranslation('Not set', selectedLanguage)}</span>}
                                    </div>
                                </div>
                            )}
                        </div>
                        {editingField === 'tagline' && (
                            <div className="flex gap-2 mt-2 justify-end">
                                <button onClick={() => setEditingField(null)} className="px-4 py-2 rounded-lg border border-gray-200 text-gray-700 text-sm font-normal">{getTranslation('Cancel', selectedLanguage)}</button>
                                <button onClick={handleSaveTagline} className="px-4 py-2 rounded-lg bg-[var(--color-gold)] text-white font-bold text-sm">{getTranslation('Save Tagline', selectedLanguage)}</button>
                            </div>
                        )}
                        <div className="flex items-center mt-2">
                            {!isTaglineSet && <Icon name="alertCircle" size={18} className="text-gray-400 mr-1" />}
                        </div>
                        <button className="w-full bg-white border border-gray-200 rounded-xl py-2 mt-2 flex items-center justify-center font-medium text-gray-700 hover:bg-gray-50 transition" onClick={() => setEditingField('tagline')}>
                            <Icon name="pencilLine" size={18} className="mr-2" />
                            {getTranslation('Edit Tagline', selectedLanguage)}
                        </button>
                    </div>
                    {/* Price per Request */}
                    <div className="mb-4">
                        <span className="text-gray-900 font-normal text-base">{getTranslation('Price per Request (min. $7 USD)', selectedLanguage)}</span>
                        <div className="flex items-center mt-1">
                            {editingField === 'price' ? (
                                <input
                                    type="number"
                                    value={price}
                                    onChange={e => setPrice(e.target.value)}
                                    className="w-full bg-gray-100 rounded-xl px-4 py-3 outline-none text-gray-900 font-normal"
                                    placeholder="Not set (min. $7.00)"
                                    min={7}
                                    autoFocus
                                />
                            ) : (
                                <div className="flex w-full items-center">
                                    <div className="flex-grow bg-gray-100 rounded-xl px-4 py-3 text-gray-900 font-normal">
                                        {price ? `$${price}` : <span className="text-gray-400">{getTranslation('Not set (min. $7.00)', selectedLanguage)}</span>}
                                    </div>
                                </div>
                            )}
                        </div>
                        {editingField === 'price' && (
                            <div className="flex gap-2 mt-2 justify-end">
                                <button onClick={() => setEditingField(null)} className="px-4 py-2 rounded-lg border border-gray-200 text-gray-700 text-sm font-normal">{getTranslation('Cancel', selectedLanguage)}</button>
                                <button onClick={handleSavePrice} className="px-4 py-2 rounded-lg bg-[var(--color-gold)] text-white font-bold text-sm">{getTranslation('Save Price', selectedLanguage)}</button>
                            </div>
                        )}
                        <div className="flex items-center mt-2">
                            {!isPriceSet && <Icon name="alertCircle" size={20} className="text-orange-400 mr-1" />}
                        </div>
                        <button className="w-full bg-white border border-gray-200 rounded-xl py-2 mt-2 flex items-center justify-center font-medium text-gray-700 hover:bg-gray-50 transition" onClick={() => setEditingField('price')}>
                            <Icon name="pencilLine" size={18} className="mr-2" />
                            {getTranslation('Edit Price', selectedLanguage)}
                        </button>
                    </div>
                    {/* Email Verification */}
                    <div className="mb-4">
                        <span className="text-gray-900 font-normal text-base">{getTranslation('Email Verification', selectedLanguage)}</span>
                        <div className="flex items-center mt-1">
                            <div className="flex-grow bg-gray-100 rounded-xl px-4 py-3 text-gray-900 font-normal">
                                {emailVerified
                                    ? getTranslation('Email verified', selectedLanguage)
                                    : verificationSent
                                        ? <span className="text-green-600">{getTranslation('Verification sent to', selectedLanguage)} {emailInput}</span>
                                        : showEmailInput
                                            ? (
                                                <input
                                                    type="email"
                                                    value={emailInput}
                                                    onChange={e => setEmailInput(e.target.value)}
                                                    className="bg-transparent w-full outline-none text-gray-900"
                                                    placeholder={getTranslation('Enter your email', selectedLanguage)}
                                                    autoFocus
                                                />
                                            )
                                            : <span className="text-gray-400">{getTranslation('Email not verified yet', selectedLanguage)}</span>
                                }
                            </div>
                            {!emailVerified && <Icon name="alertCircle" size={20} className="text-orange-400 ml-2" />}
                        </div>
                        {!emailVerified && !showEmailInput && !verificationSent && (
                            <button
                                className="w-full bg-white border border-gray-200 rounded-xl py-2 mt-2 flex items-center justify-center font-medium text-gray-700 hover:bg-gray-50 transition"
                                onClick={() => setShowEmailInput(true)}
                            >
                                <Icon name="mail" size={18} className="mr-2" />
                                {getTranslation('Verify Email', selectedLanguage)}
                            </button>
                        )}
                        {showEmailInput && !emailVerified && (
                            <div className="flex gap-2 mt-2">
                                <button
                                    className="px-4 py-2 rounded-lg border border-gray-200 text-gray-700 text-sm font-normal"
                                    onClick={() => setShowEmailInput(false)}
                                >
                                    {getTranslation('Cancel', selectedLanguage)}
                                </button>
                                <button
                                    className="px-4 py-2 rounded-lg bg-[var(--color-gold)] text-white font-bold text-sm"
                                    onClick={handleSendVerification}
                                    disabled={!emailInput}
                                >
                                    {getTranslation('Send Verification', selectedLanguage)}
                                </button>
                            </div>
                        )}
                        {verificationSent && (
                            <div className="text-green-600 text-sm mt-2">{getTranslation('Verification email sent!', selectedLanguage)}</div>
                        )}
                    </div>
                </div>
                {/* Footer */}
                <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-100 bg-white">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 rounded-lg border border-gray-200 text-gray-700 text-sm font-normal flex items-center"
                    >
                        <Icon name="x" size={18} className="mr-1" />
                        {getTranslation('Exit', selectedLanguage)}
                    </button>
                    <button
                        onClick={() => {
                            onUpdate('tagline', tagline);
                            onUpdate('price', price);
                            onClose();
                        }}
                        className="px-6 py-2 rounded-lg bg-[var(--color-gold)] text-white font-bold text-sm flex items-center gap-2"
                    >
                        <Icon name="save" size={18} className="mr-1" />
                        {getTranslation('Save', selectedLanguage)}
                    </button>
                </div>
            </div>
        </div>
    );
};

const App = () => {
    const [selectedLanguage, setSelectedLanguage] = useState(() => {
        return localStorage.getItem('regaarder_language') || 'English';
    });

    useEffect(() => {
        const handleLanguageChange = () => {
            const newLang = localStorage.getItem('regaarder_language') || 'English';
            setSelectedLanguage(newLang);
        };
        window.addEventListener('languageChanged', handleLanguageChange);
        return () => window.removeEventListener('languageChanged', handleLanguageChange);
    }, []);

    const [isPreviewMode, setIsPreviewMode] = useState(false);
    const [isProfileOwner, setIsProfileOwner] = useState(false);
    const [showCompleteProfile, setShowCompleteProfile] = useState(false);
    const [showWelcomePopup, setShowWelcomePopup] = useState(false);
    const [showWelcomeConfig, setShowWelcomeConfig] = useState(false);
    const [showSponsorPopup, setShowSponsorPopup] = useState(false);
    const [showSendTipPopup, setShowSendTipPopup] = useState(false);
    const [showCTAPopup, setShowCTAPopup] = useState(false);
    const [showAllVideos, setShowAllVideos] = useState(false);
    const [toastMessage, setToastMessage] = useState(null);
    const [featuredVideo, setFeaturedVideo] = useState(null);
    const [profile, setProfile] = useState({
        name: 'Nejdkr',
        handle: 'nejdkr',
        bio: 'Exploring human motivation through real-world experiments',
        tag: 'general',
        price: '50',
        tagline: '',
        social: { twitter: '', instagram: '' },
        email: ''
    });
    const [welcomeData, setWelcomeData] = useState(null);
    const [previewWelcomeData, setPreviewWelcomeData] = useState(null);
    const [isSharedLink, setIsSharedLink] = useState(false);

    useEffect(() => {
        let timer;
        if (isPreviewMode) {
            // For shared links, show welcome popup immediately; for preview mode toggle, delay it
            const delay = isSharedLink ? 500 : 1000;
            timer = setTimeout(() => {
                setShowWelcomePopup(true);
            }, delay);
        }
        return () => clearTimeout(timer);
    }, [isPreviewMode, isSharedLink]);

    // Check for request parameter to auto-open welcome popup
    useEffect(() => {
        const params = new URLSearchParams(window.location.search || '');
        const requestParam = params.get('request') === 'true';
        if (requestParam && !isSharedLink) {
            setIsPreviewMode(true);
            setIsSharedLink(true);
        }
    }, [isSharedLink]);

    // Hydrate profile and featured video from query params (public view) or demo auth stored in localStorage
    useEffect(() => {
        const tryLoad = async () => {
            try {
                const params = new URLSearchParams(window.location.search || '');
                const id = params.get('id');
                const handle = params.get('handle') || params.get('h');
                // Extract handle from /@handle URL pattern
                const pathHandle = window.location.pathname.startsWith('/@') ? window.location.pathname.slice(2).split('?')[0] : null;
                const isSharedLink = params.get('shared') === 'true' || params.get('request') === 'true';
                const BACKEND = (window && window.__BACKEND_URL__) || 'https://pwin.onrender.com';
                
                // Use handle from URL path, query params, or default
                const finalHandle = pathHandle || handle;
                
                // If this is a shared link, enable shared preview mode
                if (isSharedLink) {
                    setIsPreviewMode(true);
                    setIsSharedLink(true);
                }

                // Get current logged-in user to check ownership
                const getCurrentUser = () => {
                    try {
                        const stored = JSON.parse(localStorage.getItem('regaarder_user') || 'null');
                        return stored;
                    } catch (e) {
                        return null;
                    }
                };

                const currentUser = getCurrentUser();

                const fetchUserWithStats = async (userId, handle) => {
                    // Fetch user data
                    let res;
                    if (userId) {
                        res = await fetch(`${BACKEND}/users/${encodeURIComponent(userId)}`);
                    } else if (handle) {
                        const cleaned = String(handle).trim().replace(/^@/, '');
                        res = await fetch(`${BACKEND}/users/handle/${encodeURIComponent(cleaned)}`);
                    }
                    
                    if (!res || !res.ok) return null;
                    const json = await res.json();
                    if (!json || !json.user) return null;

                    const safeUser = { ...json.user };
                    if (safeUser.image && String(safeUser.image).startsWith('blob:')) safeUser.image = '';
                    if (safeUser.image) { 
                        try { 
                            const u = new URL(safeUser.image); 
                            if (window && window.location && window.location.protocol) u.protocol = window.location.protocol; 
                            safeUser.image = u.toString(); 
                        } catch (e) { } 
                    }
                    if (safeUser.document && String(safeUser.document).startsWith('blob:')) safeUser.document = '';

                    // Fetch all videos to calculate stats for this user
                    try {
                        const videosRes = await fetch(`${BACKEND}/videos`);
                        if (videosRes.ok) {
                            const videosData = await videosRes.json();
                            const videos = Array.isArray(videosData) ? videosData : (videosData.videos || []);
                            
                            // Filter videos by author ID or email
                            const userVideos = videos.filter(v => 
                                (v.authorId === safeUser.id) || 
                                (v.authorId === safeUser.email) ||
                                (v.author && v.author.toLowerCase() === (safeUser.name || '').toLowerCase())
                            );
                            
                            // Sum up views and comments
                            const totalViews = userVideos.reduce((sum, v) => sum + (parseInt(v.views) || 0), 0);
                            const totalComments = userVideos.reduce((sum, v) => sum + (parseInt(v.comments) || 0), 0);
                            
                            safeUser.views = totalViews;
                            safeUser.comments = totalComments;
                            safeUser.videoCount = userVideos.length;
                        }
                    } catch (e) {
                        console.error('Error fetching videos for stats:', e);
                    }

                    return safeUser;
                };

                if (id) {
                    try {
                        const user = await fetchUserWithStats(id, null);
                        if (user) {
                            setProfile(prev => ({ ...prev, ...user }));
                            // Check if this is the current user's profile
                            const isOwner = currentUser && (currentUser.id === user.id || currentUser.email === user.email || (currentUser.name && currentUser.name.toLowerCase() === user.name.toLowerCase()));
                            setIsProfileOwner(isOwner);
                            if (user.introVideo) setFeaturedVideo({ url: user.introVideo });
                            if (user.categories && Array.isArray(user.categories)) {
                                try { setCategories(user.categories); } catch (e) { /* ignore */ }
                            }
                            return;
                        }
                    } catch (e) { /* ignore fetch error and fall back */ }
                }

                if (finalHandle) {
                    try {
                        const user = await fetchUserWithStats(null, finalHandle);
                        if (user) {
                            setProfile(prev => ({ ...prev, ...user }));
                            // Check if this is the current user's profile
                            const isOwner = currentUser && (currentUser.id === user.id || currentUser.email === user.email || (currentUser.name && currentUser.name.toLowerCase() === user.name.toLowerCase()));
                            setIsProfileOwner(isOwner);
                            if (user.introVideo) setFeaturedVideo({ url: user.introVideo });
                            if (user.categories && Array.isArray(user.categories)) {
                                try { setCategories(user.categories); } catch (e) { /* ignore */ }
                            }
                            return;
                        }
                    } catch (e) { /* ignore fetch error and fall back */ }
                }

                // Fallback: use local demo auth user if present
                try {
                    const stored = JSON.parse(localStorage.getItem('regaarder_user') || 'null');
                    if (stored && typeof stored === 'object') {
                        const safeStored = { ...stored };
                        if (safeStored.image && String(safeStored.image).startsWith('blob:')) safeStored.image = '';
                        if (safeStored.image) { try { const u = new URL(safeStored.image); if (window && window.location && window.location.protocol) u.protocol = window.location.protocol; safeStored.image = u.toString(); } catch (e) { } }
                        if (safeStored.document && String(safeStored.document).startsWith('blob:')) safeStored.document = '';
                        
                        // Fetch videos for stats
                        try {
                            const videosRes = await fetch(`${BACKEND}/videos`);
                            if (videosRes.ok) {
                                const videosData = await videosRes.json();
                                const videos = Array.isArray(videosData) ? videosData : (videosData.videos || []);
                                
                                const userVideos = videos.filter(v => 
                                    (v.authorId === safeStored.id) || 
                                    (v.authorId === safeStored.email) ||
                                    (v.author && v.author.toLowerCase() === (safeStored.name || '').toLowerCase())
                                );
                                
                                safeStored.views = userVideos.reduce((sum, v) => sum + (parseInt(v.views) || 0), 0);
                                safeStored.comments = userVideos.reduce((sum, v) => sum + (parseInt(v.comments) || 0), 0);
                                safeStored.videoCount = userVideos.length;
                            }
                        } catch (e) {
                            console.error('Error fetching videos for stats:', e);
                        }
                        
                        setProfile(prev => ({ ...prev, ...safeStored }));
                        // This is the owner's own profile
                        setIsProfileOwner(true);
                        if (stored.introVideo) {
                            setFeaturedVideo({ url: stored.introVideo });
                        }
                        // Hydrate categories/templates if stored locally
                        if (stored.categories && Array.isArray(stored.categories)) {
                            try { setCategories(stored.categories); } catch (e) { /* ignore */ }
                        }
                    }
                } catch (e) { /* ignore */ }

                // Check if user has a valid token, if not show a helpful message
                const token = localStorage.getItem('regaarder_token');
                if (!token) {
                    console.info('No authentication token found. You can still edit your profile locally, but changes won\'t sync to the server until you log in.');
                    // Optionally show a toast to inform the user
                    setTimeout(() => {
                        setToastMessage({
                            title: "Local Mode",
                            subtitle: "Profile edits saved locally. Login to sync across devices."
                        });
                    }, 2000);
                }
            } catch (err) {
                // ignore top-level errors
            }
        };
        tryLoad();
    }, []);

    // Refresh all profile stats (followers, views, fulfilled) periodically to keep them in sync
    useEffect(() => {
        const refreshProfileStats = async () => {
            try {
                if (!profile.id) return;

                const BACKEND = (window && window.__BACKEND_URL__) || 'https://pwin.onrender.com';
                
                // Fetch fresh user data to get updated stats
                const res = await fetch(`${BACKEND}/users/${encodeURIComponent(profile.id)}`);
                if (res.ok) {
                    const json = await res.json();
                    if (json && json.user) {
                        const updates = {};
                        if (json.user.followers !== undefined) updates.followers = json.user.followers;
                        if (json.user.views !== undefined) updates.views = json.user.views;
                        if (json.user.comments !== undefined) updates.comments = json.user.comments;
                        
                        if (Object.keys(updates).length > 0) {
                            setProfile(prev => ({ ...prev, ...updates }));
                        }
                    }
                }
            } catch (err) {
                console.error('Error refreshing profile stats:', err);
            }
        };

        // Set up interval to refresh stats every 3 seconds
        const interval = setInterval(refreshProfileStats, 3000);
        
        return () => clearInterval(interval);
    }, [profile.id]);

    // Refresh stats when comments are added or watch history is updated (only for visitors, not profile owner)
    useEffect(() => {
        const refreshStats = async () => {
            // Only refresh stats if this is NOT the profile owner (i.e., a visitor is viewing the profile)
            if (isProfileOwner) {
                console.log('Stats refresh skipped: viewing own profile');
                return;
            }

            try {
                const BACKEND = (window && window.__BACKEND_URL__) || 'https://pwin.onrender.com';
                
                // Fetch all videos to recalculate stats
                const videosRes = await fetch(`${BACKEND}/videos`);
                if (videosRes.ok) {
                    const videosData = await videosRes.json();
                    const videos = Array.isArray(videosData) ? videosData : (videosData.videos || []);
                    
                    // Filter videos by current profile user
                    const userVideos = videos.filter(v => 
                        (v.authorId === profile.id) || 
                        (v.authorId === profile.email) ||
                        (v.author && v.author.toLowerCase() === (profile.name || '').toLowerCase())
                    );
                    
                    // Sum up views and comments
                    const totalViews = userVideos.reduce((sum, v) => sum + (parseInt(v.views) || 0), 0);
                    const totalComments = userVideos.reduce((sum, v) => sum + (parseInt(v.comments) || 0), 0);
                    
                    setProfile(prev => ({
                        ...prev,
                        views: totalViews,
                        comments: totalComments,
                        videoCount: userVideos.length
                    }));
                }
            } catch (err) {
                console.error('Error refreshing stats:', err);
            }
        };

        // Listen for comment events
        const handleCommentAdded = (e) => {
            console.log('Comment event detected, refreshing stats:', e.detail);
            refreshStats();
        };

        // Listen for watch history updates (when views change)
        const handleWatchHistoryUpdated = (e) => {
            console.log('Watch history updated, refreshing stats');
            refreshStats();
        };

        window.addEventListener('request:comment_added', handleCommentAdded);
        window.addEventListener('watchhistory:updated', handleWatchHistoryUpdated);
        
        return () => {
            window.removeEventListener('request:comment_added', handleCommentAdded);
            window.removeEventListener('watchhistory:updated', handleWatchHistoryUpdated);
        };
    }, [profile.id, profile.email, profile.name, isProfileOwner]);

    const [categories, setCategories] = useState([
        {
            id: 'custom',
            name: 'Your Templates',
            icon: 'user',
            count: 0,
            isOpen: true,
            templates: []
        },
        {
            id: 'default',
            name: 'Default',
            icon: 'sparkles',
            count: 1,
            isOpen: true,
            templates: [
                { id: 1, text: "Tell {creator} what video(s) to create next", selected: false },
                { id: 2, text: "Your idea → {creator}'s next video", selected: true }
            ]
        },
        {
            id: 'premium',
            name: 'Premium & Elegant',
            emoji: '🎩',
            description: "Sophisticated, refined tone for artistic creators",
            isOpen: false,
            templates: [
                { id: 'p1', label: "Work with a creator you admire", text: "Commission a video from {creator}", selected: false },
                { id: 'p2', label: "Your idea → {creator}'s next video", text: "Inspire {creator}'s next creation", selected: false },
                { id: 'p3', text: "Collaborate with {creator} on a new video", selected: false },
                { id: 'p4', text: "Shape {creator}'s next masterpiece", selected: false }
            ]
        },
        {
            id: 'personal',
            name: 'Personal & Ownership',
            emoji: '🤝',
            description: "Triggers co-creation feelings and influence",
            isOpen: false,
            templates: [
                { id: 'po1', label: "You decide what happens next", text: "Make {creator} create your idea", selected: false },
                { id: 'po2', text: "You decide what {creator} creates next", selected: false },
                { id: 'po3', label: "Your influence, their creation", text: "Be part of {creator}'s next video", selected: false },
                { id: 'po4', text: "Turn your idea into {creator}'s next release", selected: false }
            ]
        },
        {
            id: 'action',
            name: 'Action-Oriented',
            icon: 'zap',
            description: "Exciting, energetic marketing-style CTAs",
            isOpen: false,
            templates: [
                { id: 'ao1', label: "Ready to see your idea come to life?", text: "Get your custom video from {creator} now", selected: false },
                { id: 'ao2', text: "Start your request — {creator} is taking ideas", selected: false },
                { id: 'ao3', text: "Send your idea — {creator} might make it next!", selected: false },
                { id: 'ao4', text: "Your story could become {creator}'s next video", selected: false },
                { id: 'ao5', text: "Pitch your idea — watch {creator} bring it to life", selected: false }
            ]
        },
        {
            id: 'weekend',
            name: 'Weekend / Emotional',
            emoji: '🌅',
            description: "Netflix-like, entertainment-focused prompts",
            isOpen: false,
            templates: [
                { id: 'w1', text: "What do you want to watch {creator} create this weekend?", selected: false },
                { id: 'w2', text: "Tell {creator} your idea", selected: false },
                { id: 'w3', text: "Request from {creator}", selected: false },
                { id: 'w4', text: "{creator} is taking requests", selected: false },
                { id: 'w5', text: "Your weekend idea — {creator}'s next creation", selected: false },
                { id: 'w6', text: "What should {creator} film next for you?", selected: false },
                { id: 'w7', text: "Need something new to watch? Ask {creator} to create it", selected: false },
                { id: 'w8', text: "What's the next video you'd love {creator} to make?", selected: false }
            ]
        },
        {
            id: 'conversational',
            name: 'Conversational',
            icon: 'message',
            description: "Warm, human, and effortless tone",
            isOpen: false,
            templates: [
                { id: 'c1', text: "What do you want {creator} to make next?", selected: false },
                { id: 'c2', text: "Got a topic you'd love {creator} to cover?", selected: false },
                { id: 'c3', text: "Your idea could be {creator}'s next video", selected: false },
                { id: 'c4', text: "Ask {creator} to bring your idea to life", selected: false },
                { id: 'c5', text: "What would you love to see {creator} create?", selected: false },
                { id: 'c6', text: "Tell {creator} your idea — they'll make it happen", selected: false },
                { id: 'c7', text: "You imagine it. {creator} creates it.", selected: false },
                { id: 'c8', text: "Let's turn your idea into {creator}'s next hit", selected: false }
            ]
        },
        {
            id: 'playful',
            name: 'Playful & Light',
            emoji: '🪄',
            description: "Fun, softly persuasive approach",
            isOpen: false,
            templates: [
                { id: 'pl1', text: "Got a wild idea? Drop it for {creator}", selected: false },
                { id: 'pl2', text: "Give {creator} a challenge — what should they make?", selected: false },
                { id: 'pl3', text: "Your wish, {creator}'s camera", selected: false },
                { id: 'pl4', text: "Go on, make {creator} work for it 😉", selected: false },
                { id: 'pl5', text: "You think it, {creator} films it", selected: false },
                { id: 'pl6', text: "One click away from seeing your idea come alive", subtext: "Request from {creator}", selected: false },
                { id: 'pl7', text: "Inspire {creator}'s next upload", selected: false },
                { id: 'pl8', text: "Start something new with {creator} today", selected: false }
            ]
        },
        {
            id: 'entertainment',
            name: 'Entertainment',
            emoji: '🎬',
            description: "Fun, engaging content for everyone",
            isOpen: false,
            templates: [
                { id: 'ent1', text: "What should {creator} react to next?", selected: false },
                { id: 'ent2', text: "Suggest a movie or show for {creator} to review", selected: false }
            ]
        },
        {
            id: 'educational',
            name: 'Educational',
            emoji: '📚',
            description: "Perfect for educators and explainers",
            isOpen: false,
            templates: [
                { id: 't1', text: "Got a tech problem? Ask {creator} to break it down", selected: false },
                { id: 't2', text: "What gadget or tool should {creator} review next?", selected: false },
                { id: 't3', text: "Let {creator} explain the tech behind your favorite thing", selected: false },
                { id: 't4', text: "Your question → {creator}'s next tech deep dive", selected: false },
                { id: 't5', text: "Curious about how something works? Ask {creator}", selected: false },
                { id: 't6', text: "Tell {creator} which tech mystery to uncover", selected: false },
                { id: 't7', text: "Your idea could power {creator}'s next innovation video", selected: false },
                { id: 't8', text: "What should {creator} decode next in tech?", selected: false },
                { id: 't9', text: "Tech confusing you? Let {creator} make sense of it", selected: false },
                { id: 't10', text: "Give {creator} a tech challenge — what should they test?", selected: false }
            ]
        },
        {
            id: 'diy',
            name: 'DIY / Science',
            emoji: '🧬',
            description: "Curiosity + excitement + creation for makers",
            isOpen: false,
            templates: [
                { id: 'd1', text: "What experiment should {creator} try next?", selected: false },
                { id: 'd2', text: "Got a crazy idea? Let {creator} test it!", selected: false },
                { id: 'd3', text: "Tell {creator} what to build or blow up (safely)", selected: false },
                { id: 'd4', text: "Your curiosity → {creator}'s next experiment", selected: false },
                { id: 'd5', text: "Let {creator} bring your science idea to life", selected: false },
                { id: 'd6', text: "What if {creator} tested your theory next?", selected: false },
                { id: 'd7', text: "Got a DIY hack in mind? Share it with {creator}", selected: false },
                { id: 'd8', text: "You imagine it. {creator} builds it.", selected: false },
                { id: 'd9', text: "Your idea might just explode — in a good way", subtext: "Share with {creator}", selected: false },
                { id: 'd10', text: "Ask {creator} to turn your idea into a science project", selected: false }
            ]
        },
        {
            id: 'debates',
            name: 'Debates / Philosophy',
            emoji: '🗣️',
            description: "Thought leadership + perspective + dialogue",
            isOpen: false,
            templates: [
                { id: 'db1', text: "Let {creator} unpack your big question", selected: false },
                { id: 'db2', text: "What issue should {creator} dive into next?", selected: false },
                { id: 'db3', text: "Join the conversation — what should {creator} discuss?", selected: false },
                { id: 'db4', text: "Your idea could spark {creator}'s next debate", selected: false },
                { id: 'db5', text: "What truth do you want {creator} to tackle?", selected: false },
                { id: 'db6', text: "Got a topic {creator} should debate next?", selected: false },
                { id: 'db7', text: "What question deserves {creator}'s take?", selected: false },
                { id: 'db8', text: "Tell {creator} which side you want them to argue", selected: false },
                { id: 'db9', text: "Your question → {creator}'s next discussion", selected: false },
                { id: 'db10', text: "Challenge {creator} — what should they debate?", selected: false }
            ]
        },
        {
            id: 'creative',
            name: 'Creative / Art',
            emoji: '🎨',
            description: "Inspiration + collaboration + beauty",
            isOpen: false,
            templates: [
                { id: 'cr1', text: "Got a concept {creator} should turn into art?", selected: false },
                { id: 'cr2', text: "Tell {creator} what to create next — song, sketch, or scene", selected: false },
                { id: 'cr3', text: "Your vision → {creator}'s next masterpiece", selected: false },
                { id: 'cr4', text: "What should {creator} draw, compose, or craft?", selected: false },
                { id: 'cr5', text: "Inspire {creator}'s next creative work", selected: false },
                { id: 'cr6', text: "Let {creator} bring your imagination to life", selected: false },
                { id: 'cr7', text: "You dream it, {creator} makes it", selected: false },
                { id: 'cr8', text: "Your emotion → {creator}'s next piece", selected: false },
                { id: 'cr9', text: "Co-create something beautiful with {creator}", selected: false },
                { id: 'cr10', text: "Share an idea, and let {creator} create around it", selected: false }
            ]
        },
        {
            id: 'academic',
            name: 'Educational / Academic',
            emoji: '🎓',
            description: "Clarity + curiosity + learning satisfaction",
            isOpen: false,
            templates: [
                { id: 'ac1', text: "Tell {creator} what you want to learn next", selected: false },
                { id: 'ac2', text: "What concept should {creator} break down for you?", selected: false },
                { id: 'ac3', text: "Turn your confusion into {creator}'s next explainer", selected: false },
                { id: 'ac4', text: "Ask {creator} to teach what you've always wondered", selected: false },
                { id: 'ac5', text: "Your question starts the next lesson", subtext: "Ask {creator}", selected: false },
                { id: 'ac6', text: "Got a topic you want {creator} to explain?", selected: false },
                { id: 'ac7', text: "Ask {creator} to simplify something complex", selected: false },
                { id: 'ac8', text: "Your question could become {creator}'s next lesson", selected: false },
                { id: 'ac9', text: "Let {creator} turn your curiosity into a clear answer", selected: false },
                { id: 'ac10', text: "What topic should {creator} make easier to understand?", selected: false }
            ]
        },
        {
            id: 'travel',
            name: 'Travel / Culture',
            emoji: '🌍',
            description: "Discovery + immersion + wonder",
            count: 2,
            isOpen: false,
            templates: [
                { id: 'tr1', text: "Where should {creator} go next?", selected: false },
                { id: 'tr2', text: "Tell {creator} what place or story to explore", selected: false },
                { id: 'tr3', text: "Your curiosity → {creator}'s next destination", selected: false },
                { id: 'tr4', text: "What culture should {creator} uncover next?", selected: false },
                { id: 'tr5', text: "Suggest {creator}'s next adventure", selected: false },
                { id: 'tr6', text: "Got a place you wish you could visit? Send {creator}", selected: false },
                { id: 'tr7', text: "Let {creator} capture your story idea on the road", selected: false },
                { id: 'tr8', text: "What story from the world should {creator} tell?", selected: false },
                { id: 'tr9', text: "Your idea could guide {creator}'s next journey", selected: false },
                { id: 'tr10', text: "Point {creator}'s camera to your curiosity", selected: false }
            ]
        },
        {
            id: 'motivation',
            name: 'Motivation / Lifestyle',
            emoji: '❤️',
            description: "Inspiration + empathy + relatability",
            isOpen: false,
            templates: [
                { id: 'm1', text: "Let {creator} create something meaningful for you", selected: false },
                { id: 'm2', text: "Your idea → {creator}'s next motivation video", selected: false },
                { id: 'm3', text: "What story should {creator} tell to lift others?", selected: false },
                { id: 'm4', text: "You share. {creator} inspires.", selected: false },
                { id: 'm5', text: "Your experience could spark {creator}'s next message", selected: false },
                { id: 'm6', text: "What topic should {creator} inspire next?", selected: false },
                { id: 'm7', text: "Got a life question? Ask {creator} to talk about it", selected: false },
                { id: 'm8', text: "Your struggle could inspire {creator}'s next video", selected: false },
                { id: 'm9', text: "Tell {creator} what message people need to hear", selected: false },
                { id: 'm10', text: "What truth should {creator} share next?", selected: false }
            ]
        },
        {
            id: 'podcasts',
            name: 'Podcasts & Conversations',
            emoji: '🎙️',
            description: "Curiosity + intimacy + authenticity",
            isOpen: false,
            templates: [
                { id: 'pc1', text: "What topic should {creator} discuss next?", selected: false },
                { id: 'pc2', text: "Who do you want {creator} to talk with?", selected: false },
                { id: 'pc3', text: "Got a deep question? Let {creator} unpack it", selected: false },
                { id: 'pc4', text: "Your question → {creator}'s next podcast episode", selected: false },
                { id: 'pc5', text: "Which conversation should {creator} start?", selected: false },
                { id: 'pc6', text: "Tell {creator} what voices need to be heard", selected: false },
                { id: 'pc7', text: "What idea should {creator} debate next?", selected: false },
                { id: 'pc8', text: "Request a one-on-one talk on your favorite topic", selected: false },
                { id: 'pc9', text: "Your idea could become {creator}'s next dialogue", selected: false },
                { id: 'pc10', text: "What discussion do you want {creator} to open up?", selected: false }
            ]
        },
        {
            id: 'journalistic',
            name: 'Journalistic Investigations',
            emoji: '🕵️',
            description: "Intrigue + justice + curiosity",
            isOpen: false,
            templates: [
                { id: 'j1', text: "What story should {creator} investigate next?", selected: false },
                { id: 'j2', text: "Which mystery do you want {creator} to uncover?", selected: false },
                { id: 'j3', text: "Got a lead or hidden truth? Send it to {creator}", selected: false },
                { id: 'j4', text: "Tell {creator} what deserves a spotlight", selected: false },
                { id: 'j5', text: "Your curiosity → {creator}'s next investigation", selected: false },
                { id: 'j6', text: "What issue should {creator} expose next?", selected: false },
                { id: 'j7', text: "Help {creator} reveal what's been ignored", selected: false },
                { id: 'j8', text: "Which hidden story should {creator} chase?", selected: false },
                { id: 'j9', text: "Request {creator} to dig into what matters to you", selected: false },
                { id: 'j10', text: "What truth do you want {creator} to uncover?", selected: false }
            ]
        },
        {
            id: 'entrepreneurship',
            name: 'Entrepreneurship & Success',
            emoji: '💼',
            description: "Ambition + inspiration + insight",
            isOpen: false,
            templates: [
                { id: 'e1', text: "Your curiosity → {creator}'s next business story", selected: false },
                { id: 'e2', text: "What lessons should {creator} reveal next?", selected: false },
                { id: 'e3', text: "Who built it best? Tell {creator} to unpack their story", selected: false },
                { id: 'e4', text: "Ask {creator} to uncover how they made it happen", selected: false },
                { id: 'e5', text: "Which success story deserves {creator}'s spotlight?", selected: false },
                { id: 'e6', text: "What brand or founder should {creator} decode next?", selected: false },
                { id: 'e7', text: "Whose success story should {creator} break down next?", selected: false },
                { id: 'e8', text: "Got a business hero? Ask {creator} to analyze them", selected: false },
                { id: 'e9', text: "What startup story do you want {creator} to tell?", selected: false },
                { id: 'e10', text: "Which entrepreneur's journey inspires you most?", selected: false }
            ]
        },
        {
            id: 'business_history',
            name: 'Business History',
            emoji: '🏛️',
            description: "Curiosity + admiration + intelligence",
            isOpen: false,
            templates: [
                { id: 'bh1', text: "Which company should {creator} analyze next?", selected: false },
                { id: 'bh2', text: "What business story do you want {creator} to uncover?", selected: false },
                { id: 'bh3', text: "Ask {creator} to explain how your favorite brand really makes money", selected: false },
                { id: 'bh4', text: "Your curiosity → {creator}'s next company deep dive", selected: false },
                { id: 'bh5', text: "Which business legacy should {creator} explore?", selected: false },
                { id: 'bh6', text: "Tell {creator} which strategy to decode next", selected: false },
                { id: 'bh7', text: "What startup or empire fascinates you most?", selected: false },
                { id: 'bh8', text: "Ask {creator} to dissect your favorite brand", selected: false },
                { id: 'bh9', text: "What can we learn from history's greatest companies?", selected: false },
                { id: 'bh10', text: "Let {creator} reveal how success was engineered", selected: false }
            ]
        },
        {
            id: 'fashion',
            name: 'Modeling & Fashion',
            emoji: '👠',
            description: "Aspiration + artistry + self-expression",
            isOpen: false,
            templates: [
                { id: 'f1', text: "What look should {creator} model next?", selected: false },
                { id: 'f2', text: "Got a concept? Ask {creator} to bring it to life", selected: false },
                { id: 'f3', text: "Your style idea → {creator}'s next photo or video", selected: false },
                { id: 'f4', text: "What fashion era or trend should {creator} recreate?", selected: false },
                { id: 'f5', text: "Tell {creator} what vibe to embody next", selected: false },
                { id: 'f6', text: "Your vision could shape {creator}'s next shoot", selected: false },
                { id: 'f7', text: "What aesthetic should {creator} explore next?", selected: false },
                { id: 'f8', text: "Suggest a creative look or concept for {creator}", selected: false },
                { id: 'f9', text: "Help {creator} design their next masterpiece", selected: false },
                { id: 'f10', text: "What style moment do you want {creator} to capture?", selected: false }
            ]
        },
        {
            id: 'psychology',
            name: 'Psychology & Behavior',
            emoji: '🧩',
            description: "Curiosity + relatability + intellect",
            isOpen: false,
            templates: [
                { id: 'psy1', text: "Ask {creator} to explain a mystery of human nature", selected: false },
                { id: 'psy2', text: "Tell {creator} what behavior fascinates you most", selected: false },
                { id: 'psy3', text: "What makes people tick? Let {creator} find out", selected: false },
                { id: 'psy4', text: "Request {creator} to decode your curiosity", selected: false },
                { id: 'psy5', text: "Your thought → {creator}'s next mind experiment", selected: false },
                { id: 'psy6', text: "What human behavior should {creator} analyze next?", selected: false },
                { id: 'psy7', text: "Got a question about people? Ask {creator}", selected: false },
                { id: 'psy8', text: "Your idea → {creator}'s next psychological breakdown", selected: false },
                { id: 'psy9', text: "Which bias or habit should {creator} explore?", selected: false },
                { id: 'psy10', text: "What social experiment should {creator} run?", selected: false }
            ]
        },
        {
            id: 'catalogue',
            name: 'Catalogue',
            emoji: '📚',
            description: "Curated collection of creator works",
            isOpen: false,
            templates: [
                { id: 'cat1', text: "Browse {creator}'s full portfolio", selected: false },
                { id: 'cat2', text: "View all of {creator}'s creations", selected: false },
                { id: 'cat3', text: "Explore {creator}'s collection", selected: false },
                { id: 'cat4', text: "See {creator}'s complete works", selected: false }
            ]
        },
        {
            id: 'health',
            name: 'Health & Fitness',
            emoji: '🧬',
            description: "Motivation + trust + self-improvement",
            isOpen: false,
            templates: [
                { id: 'h1', text: "What routine should {creator} test next?", selected: false },
                { id: 'h2', text: "Ask {creator} to demystify a fitness myth", selected: false },
                { id: 'h3', text: "What wellness hack do you want {creator} to verify?", selected: false },
                { id: 'h4', text: "Suggest a body or mind challenge for {creator}", selected: false },
                { id: 'h5', text: "Let {creator} test your fitness idea", selected: false },
                { id: 'h6', text: "What challenge should {creator} try next?", selected: false },
                { id: 'h7', text: "Got a health goal? Ask {creator} to tackle it", selected: false },
                { id: 'h8', text: "Your idea → {creator}'s next fitness experiment", selected: false },
                { id: 'h9', text: "What topic should {creator} break down for you?", selected: false },
                { id: 'h10', text: "Tell {creator} what transformation you want to see", selected: false }
            ]
        }
    ]);

    const creatorTags = categories
        .filter(cat => {
            // Explicitly include catalogue, exclude specific categories
            if (cat.id === 'catalogue') return true;
            if (['custom', 'default', 'premium', 'personal', 'action', 'weekend', 'conversational', 'playful'].includes(cat.id)) return false;
            return true;
        })
        .sort((a, b) => {
            if (a.id === 'catalogue') return -1;
            if (b.id === 'catalogue') return 1;
            return a.name.localeCompare(b.name);
        })
        .map(cat => ({ value: cat.name, label: cat.name }));
    
    console.log('DEBUG: All categories count:', categories.length);
    console.log('DEBUG: Filtered creatorTags =', creatorTags);
    console.log('DEBUG: Catalogue in creatorTags?', creatorTags.some(tag => tag.label === 'Catalogue'));

    const [videos, setVideos] = useState([]);

    // Attempt to source published videos from `creatordashboard.jsx` if that file exists
    // This uses a dynamic import so the app won't crash if the file is absent.
    useEffect(() => {
        let mounted = true;
        (async () => {
            try {
                const mod = await import('./creatordashboard.jsx');
                // Support several export shapes: named `publishedVideos`, default export with `publishedVideos`, or a function `getPublishedVideos`.
                const published = mod.publishedVideos || (mod.default && mod.default.publishedVideos) || (typeof mod.getPublishedVideos === 'function' ? await mod.getPublishedVideos() : null);
                if (mounted && published && Array.isArray(published) && published.length > 0) {
                    setVideos(published);
                }
            } catch (e) {
                // File not found or import failed — fall back to local videos defined above.
                // Swallow the error silently to keep current behavior.
            }
        })();
        return () => { mounted = false; };
    }, []);

    const handleDeleteVideo = (id) => {
        setVideos(videos.filter(v => v.id !== id));
    };

    const handleFeaturedVideoUpload = (videoData) => {
        setFeaturedVideo(videoData);
        setToastMessage({ title: "Video Uploaded", subtitle: "Your featured video is now live" });
        // Persist featured video locally and to backend (if available)
        try {
            const existing = JSON.parse(localStorage.getItem('regaarder_user') || '{}');
            localStorage.setItem('regaarder_user', JSON.stringify({ ...existing, introVideo: videoData.url }));
        } catch (e) { console.warn('Failed saving featured video locally', e); }
        (async () => {
            try {
                const token = localStorage.getItem('regaarder_token');
                if (!token) {
                    console.warn('No authentication token. Featured video saved locally only.');
                    return;
                }
                const response = await fetch(`${(window && window.__BACKEND_URL__) || 'https://pwin.onrender.com'}/creator/complete`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    },
                    body: JSON.stringify({ introVideo: videoData.url })
                });
                if (!response.ok && response.status === 401) {
                    console.warn('Authentication failed when saving featured video');
                }
            } catch (e) { console.warn('Failed to persist featured video to server', e); }
        })();
    };

    const handleDeleteFeaturedVideo = () => {
        setFeaturedVideo(null);
        try {
            const existing = JSON.parse(localStorage.getItem('regaarder_user') || '{}');
            const clone = { ...existing };
            delete clone.introVideo;
            localStorage.setItem('regaarder_user', JSON.stringify(clone));
        } catch (e) { console.warn('Failed removing featured video locally', e); }
        (async () => {
            try {
                const token = localStorage.getItem('regaarder_token');
                if (!token) {
                    console.warn('No authentication token. Featured video deleted locally only.');
                    return;
                }
                const response = await fetch(`${(window && window.__BACKEND_URL__) || 'https://pwin.onrender.com'}/creator/complete`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    },
                    body: JSON.stringify({ introVideo: null })
                });
                if (!response.ok && response.status === 401) {
                    console.warn('Authentication failed when deleting featured video');
                }
            } catch (e) { console.warn('Failed to delete featured video on server', e); }
        })();
    };

    const handleUpdateProfile = async (field, value) => {
        // Update local state immediately
        setProfile(prev => ({ ...prev, [field]: value }));
        // Persist locally so preferences survive refresh and offline
        try {
            const existing = JSON.parse(localStorage.getItem('regaarder_user') || '{}');
            const merged = { ...existing, [field]: value };
            localStorage.setItem('regaarder_user', JSON.stringify(merged));
        } catch (e) {
            console.warn('Failed to persist profile locally', e);
        }

        // Try to persist to backend so name/handle/image are available to other users
        try {
            const token = localStorage.getItem('regaarder_token');
            if (!token) {
                console.warn('No authentication token found. Profile changes saved locally only.');
                return;
            }

            const payload = { [field]: value };
            const response = await fetch(`${(window && window.__BACKEND_URL__) || 'https://pwin.onrender.com'}/creator/complete`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(payload)
            });

            if (!response.ok) {
                if (response.status === 401) {
                    console.warn('Authentication failed. Token may be invalid or expired. Changes saved locally only.');
                }
                throw new Error(`Server returned ${response.status}`);
            }
        } catch (e) {
            // ignore errors — UI stays updated locally
            console.warn('Failed to persist profile update to server', e);
        }
    };

    const togglePreviewMode = () => {
        const newMode = !isPreviewMode;
        setIsPreviewMode(newMode);
        if (newMode) {
            setToastMessage({ title: "Preview Mode Active", subtitle: "You are viewing your profile as a fan" });
        }
    };

    const getSelectedTemplates = () => {
        const selected = [];
        categories.forEach(cat => {
            if (cat.templates) {
                cat.templates.forEach(t => {
                    if (t.selected) selected.push(t.text);
                });
            }
        });
        return selected;
    };

    const handleToggleCategory = (id) => {
        setCategories(categories.map(cat =>
            cat.id === id ? { ...cat, isOpen: !cat.isOpen } : cat
        ));
    };

    const handleToggleTemplate = (categoryId, templateId) => {
        const selectedCount = getSelectedTemplates().length;

        // Check if we are selecting a new one (not deselecting)
        let isSelecting = false;
        const category = categories.find(c => c.id === categoryId);
        if (category && category.templates) {
            const template = category.templates.find(t => t.id === templateId);
            if (template && !template.selected) {
                isSelecting = true;
            }
        }

        if (isSelecting && selectedCount >= 3) {
            setToastMessage({
                title: "Limit Reached",
                subtitle: "You can only select up to 3 CTAs at a time"
            });
            return;
        }

        const updated = categories.map(cat => {
            if (cat.id !== categoryId) return cat;
            if (!cat.templates) return cat;
            return {
                ...cat,
                templates: cat.templates.map(t =>
                    t.id === templateId ? { ...t, selected: !t.selected } : t
                )
            };
        });

        setCategories(updated);

        // Persist categories locally and attempt server save
        try {
            const existing = JSON.parse(localStorage.getItem('regaarder_user') || '{}');
            localStorage.setItem('regaarder_user', JSON.stringify({ ...existing, categories: updated }));
        } catch (e) { console.warn('Failed saving categories locally', e); }

        (async () => {
            try {
                const token = localStorage.getItem('regaarder_token');
                if (!token) {
                    console.warn('No authentication token. Categories saved locally only.');
                    return;
                }
                const response = await fetch(`${(window && window.__BACKEND_URL__) || 'https://pwin.onrender.com'}/creator/complete`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    },
                    body: JSON.stringify({ categories: updated })
                });
                if (!response.ok && response.status === 401) {
                    console.warn('Authentication failed when saving categories');
                }
            } catch (e) { console.warn('Failed to persist categories to server', e); }
        })();
    };

    const handleCreateTemplate = (categoryId, newTemplateObj) => {
        const updated = categories.map(cat => {
            if (cat.id === categoryId) {
                const currentTemplates = cat.templates || [];
                return {
                    ...cat,
                    templates: [newTemplateObj, ...currentTemplates],
                    isOpen: true,
                    count: (cat.count || 0) + 1
                };
            }
            return cat;
        });

        setCategories(updated);

        // Persist new template locally and attempt server save
        try {
            const existing = JSON.parse(localStorage.getItem('regaarder_user') || '{}');
            localStorage.setItem('regaarder_user', JSON.stringify({ ...existing, categories: updated }));
        } catch (e) { console.warn('Failed saving new template locally', e); }

        (async () => {
            try {
                const token = localStorage.getItem('regaarder_token');
                if (!token) {
                    console.warn('No authentication token. Template saved locally only.');
                    return;
                }
                const response = await fetch(`${(window && window.__BACKEND_URL__) || 'https://pwin.onrender.com'}/creator/complete`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    },
                    body: JSON.stringify({ categories: updated })
                });
                if (!response.ok && response.status === 401) {
                    console.warn('Authentication failed when saving template');
                }
            } catch (e) { console.warn('Failed to persist new template to server', e); }
        })();
    };

    const handleFanRequest = () => {
        // Navigate to the ideas page so the user can type their request
        try {
            // Prevent requesting from your own profile
            try {
                const raw = window.localStorage.getItem('regaarder_user');
                let me = null;
                try { me = raw ? JSON.parse(raw) : null; } catch (e) { me = null; }
                const myId = me ? String(me.id || me.handle || me.name || '').replace(/^@+/, '').toLowerCase() : null;
                const profileId = String(profile?.id || profile?.handle || profile?.name || '').replace(/^@+/, '').toLowerCase();
                if (myId && profileId && myId === profileId) {
                    setToastMessage({ title: "Can't request yourself", subtitle: "You can't request a video from your own profile — try another creator." });
                    return;
                }

                const key = 'ideas_selectedCreator_v1';
                const creatorObj = {
                    id: profile?.id || (profile?.handle || profile?.tag || String(profile?.name || '').replace(/^@+/, '')).toLowerCase(),
                    name: profile?.handle ? `@${profile.handle}` : (profile?.name || ''),
                    handle: profile?.handle,
                    image: profile?.image || null
                };
                window.localStorage.setItem(key, JSON.stringify(creatorObj));
            } catch (e) { /* ignore storage errors */ }
            window.location.href = '/ideas';
        } catch (e) {
            console.warn('Navigation failed', e);
        }
    };

    return (
        <div className="max-w-md mx-auto min-h-screen bg-gray-50 font-sans relative overflow-hidden">
            {/* Toast Notification */}
            {toastMessage && <Toast data={toastMessage} onClose={() => setToastMessage(null)} />}

            {showCompleteProfile && <CompleteProfilePopup isPreview={isPreviewMode} onClose={() => setShowCompleteProfile(false)} profile={profile} onUpdate={handleUpdateProfile} selectedLanguage={selectedLanguage} />}
            {showWelcomePopup && (
                <WelcomePopup
                    isOpen={showWelcomePopup}
                    isPreview={isPreviewMode}
                    isSharedLink={isSharedLink}
                    onClose={() => {
                        setShowWelcomePopup(false);
                        setPreviewWelcomeData(null);
                    }}
                    profile={profile}
                    customData={previewWelcomeData || welcomeData}
                    onBecomeSponsor={() => {
                        setShowWelcomePopup(false);
                        if (isSharedLink) {
                            navigate('/ideas');
                        } else {
                            setShowSponsorPopup(true);
                        }
                    }}
                    onSendTip={() => {
                        setShowWelcomePopup(false);
                        if (isSharedLink) {
                            navigate('/ideas');
                        } else {
                            setShowSendTipPopup(true);
                        }
                    }}
                    selectedLanguage={selectedLanguage}
                />
            )}
            {showWelcomeConfig && (
                <WelcomePopupConfig
                    isOpen={showWelcomeConfig}
                    isPreview={isPreviewMode}
                    onClose={() => setShowWelcomeConfig(false)}
                    data={welcomeData}
                    selectedLanguage={selectedLanguage}
                    onSave={setWelcomeData}
                    onPreview={(data) => {
                        setPreviewWelcomeData(data);
                        setShowWelcomePopup(true);
                    }}
                />
            )}
            {showSponsorPopup && <SponsorPopup isOpen={showSponsorPopup} isPreview={isPreviewMode} onClose={() => setShowSponsorPopup(false)} profile={profile} selectedLanguage={selectedLanguage} />}
            {showSendTipPopup && <SendTipPopup isOpen={showSendTipPopup} isPreview={isPreviewMode} onClose={() => setShowSendTipPopup(false)} profile={profile} selectedLanguage={selectedLanguage} />}
            {showCTAPopup && (
                <CTAPopup
                    isOpen={showCTAPopup}
                    isPreview={isPreviewMode}
                    onClose={() => setShowCTAPopup(false)}
                    onShowToast={setToastMessage}
                    categories={categories}
                    onToggleCategory={handleToggleCategory}
                    onToggleTemplate={handleToggleTemplate}
                    onCreateTemplate={handleCreateTemplate}
                    selectedLanguage={selectedLanguage}
                />
            )}
            {showAllVideos && <AllVideosPopup videos={videos} creatorId={profile.id} isPreview={isPreviewMode} onClose={() => setShowAllVideos(false)} onDelete={handleDeleteVideo} selectedLanguage={selectedLanguage} />}

            {/* Scrollable Container */}
            <div className="h-screen overflow-y-auto pb-20 scrollbar-hide">
                <ProfileHeader
                    profile={profile}
                    onUpdate={handleUpdateProfile}
                    isPreviewMode={isPreviewMode}
                    onTogglePreview={togglePreviewMode}
                    onTip={() => setShowSendTipPopup(true)}
                    selectedCTAs={getSelectedTemplates()}
                    onCTAClick={handleFanRequest}
                    availableTags={creatorTags}
                    onShowToast={setToastMessage}
                    isSharedLink={isSharedLink}
                    selectedLanguage={selectedLanguage}
                />

                <div className="px-4 mt-6">
                    {!isPreviewMode && (
                        <>
                            {/* Complete Your Profile Card - matches provided design */}
                            <div
                                className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 mb-4 cursor-pointer transition hover:shadow-md"
                                onClick={() => setShowCompleteProfile(true)}
                            >
                                <div className="flex justify-between items-center mb-2">
                                    <div className="flex items-center">
                                        <div className="w-10 h-10 rounded-lg flex items-center justify-center mr-3 relative overflow-hidden"
                                            style={{
                                                background: 'linear-gradient(135deg, #3B82F6 0%, #8B5CF6 100%)',
                                                boxShadow: '0 4px 12px rgba(59, 130, 246, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.3)'
                                            }}>
                                            <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent"></div>
                                            <Icon name="sparkles" size={20} className="text-white relative z-10" />
                                        </div>
                                        <h3 className="font-semibold text-lg text-gray-900">{getTranslation('Complete Your Profile', selectedLanguage)}</h3>
                                    </div>
                                    <span className="text-blue-600 font-bold text-base">0%</span>
                                </div>
                                <div className="w-full bg-gray-200 rounded-full h-2 mb-2">
                                    <div className="h-2 rounded-full" style={{ width: `80%`, background: 'linear-gradient(90deg, #3B82F6 0%, #8B5CF6 100%)' }}></div>
                                </div>
                                <p className="text-xs text-gray-500 mb-3">{getTranslation('0 of 10 fields completed • Tap to edit', selectedLanguage)}</p>
                                <div className="flex flex-wrap gap-2 items-center">
                                    <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-md">{getTranslation('Missing fields:', selectedLanguage)}</span>
                                    <span className="text-xs text-gray-600 bg-gray-100 px-2 py-1 rounded-md font-medium">{getTranslation('Tagline', selectedLanguage)}</span>
                                    <span className="text-xs text-gray-600 bg-gray-100 px-2 py-1 rounded-md font-medium">{getTranslation('Email Verified', selectedLanguage)}</span>
                                </div>
                            </div>
                            {/* End Complete Your Profile Card */}

                            <ActionCard
                                title={getTranslation('Customize Welcome Popup', selectedLanguage)}
                                icon="sparkles"
                                isPopup={true}
                                onClick={() => setShowWelcomeConfig(true)}
                                onPreview={() => setShowWelcomePopup(true)}
                                selectedLanguage={selectedLanguage}
                            />
                        </>
                    )}

                    <FeaturedVideo
                        isPreviewMode={isPreviewMode}
                        video={featuredVideo}
                        onUpload={handleFeaturedVideoUpload}
                        onDelete={handleDeleteFeaturedVideo}
                        selectedLanguage={selectedLanguage}
                    />
                    <TopVideos videos={videos} onViewAll={() => setShowAllVideos(true)} isPreviewMode={isPreviewMode} selectedLanguage={selectedLanguage} />
                    <AboutSection profile={profile} onUpdate={handleUpdateProfile} isPreviewMode={isPreviewMode} selectedLanguage={selectedLanguage} />

                    {!isPreviewMode && <QuickCTATemplates onCustomize={() => setShowCTAPopup(true)} selectedLanguage={selectedLanguage} />}
                    {!isPreviewMode && <ShareProfile profile={profile} onCopy={setToastMessage} selectedLanguage={selectedLanguage} />}

                    <AllVideos
                        selectedCTAs={getSelectedTemplates()}
                        profileName={profile.name}
                        onCTAClick={handleFanRequest}
                        selectedLanguage={selectedLanguage}
                    />
                </div>
            </div>

            <BottomBar selectedLanguage={selectedLanguage} />
        </div>
    );
};

export default App;
