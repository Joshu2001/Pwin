/* eslint-disable no-empty */
import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    ChevronLeft, Edit2, Copy, Share2, Play, Zap, Camera, LineChart, DollarSign, CreditCard,
    Bell, Plus, Monitor, BookOpen, Zap as ThunderIcon, Globe, Clock, MoreHorizontal,
    Home, FileText, Edit, Grid, File, CheckCircle, Clock3, Check, Lock, Link as LinkIcon, ChevronDown, Pencil // Added Check icon for save
} from 'lucide-react';
import SharedBottomBar from './components/SharedBottomBar.jsx';

// Use the app accent via CSS variable for dynamic theming
const GOLD_COLOR_SHADE = 'var(--color-gold)';

// Mock profile data
const initialProfileData = {
    name: "Alex Morgan",
    handle: "alexmorgan",
    bio: "",
    // Start with no prefilled interests so the UI doesn't show placeholder tags
    interests: [],
    // Placeholder image URL
    avatarUrl: "https://placehold.co/100x100/A0A0A0/FFFFFF?text=AM",
};

// Mock data for new sections
import { getTranslation } from './translations.js';

// Example: you may want to pass selectedLanguage from context or props
const selectedLanguage = localStorage.getItem('regaarder_language') || 'English';
const t = (key) => getTranslation(key, selectedLanguage);

const statsData = [
    { value: "0", label: t('Requests'), color: "text-stone-900", bgColor: '#ffffff', shadow: "shadow-stone-200/50" },
    { value: "0", label: t('Active'), color: "text-stone-900", bgColor: 'var(--color-gold-light-bg)', shadow: "shadow-amber-200/50", glow: true },
    { value: "0", label: t('Completed'), color: "text-stone-900", bgColor: '#ffffff', shadow: "shadow-stone-200/50" },
];

const templatesData = [
    { icon: Monitor, title: "Tech Tutorial Request", usage: "Used 12 times", iconColor: 'var(--color-gold)', bgColor: 'var(--color-gold-light-bg)' },
    { icon: BookOpen, title: "History Documentary", usage: "Used 8 times", iconColor: 'var(--color-gold)', bgColor: 'var(--color-gold-light-bg)' },
    { icon: ThunderIcon, title: "Quick Tips Video", usage: "Used 15 times", iconColor: 'var(--color-gold)', bgColor: 'var(--color-gold-light-bg)' },
];

const requestsData = [
    {
        title: "History of Ancient Rome",
        description: "A deep dive into the rise and fall of the...",
        time: "2 weeks ago",
        creator: "HistoryBuff",
        status: "Fulfilled",
        statusStyle: { backgroundColor: 'var(--color-gold-light-bg, rgba(202,138,4,0.08))', color: 'var(--color-gold)' },
        image: "https://placehold.co/60x60/8B4513/FFFFFF?text=ROM"
    },
    {
        title: "Future of Space Travel",
        description: "Exploring the next 50 years of human space...",
        time: "5 days ago",
        creator: "SpaceExplorer",
        status: "In Progress",
        statusStyle: { backgroundColor: '#DBEAFE', color: '#1D4ED8' },
        image: "https://placehold.co/60x60/000000/FFFFFF?text=SPC"
    },
    {
        title: "Mastering Python in 2025",
        description: "Complete guide to modern Python...",
        time: "1 day ago",
        creator: null,
        status: "Pending",
        statusStyle: { backgroundColor: 'var(--color-gold-light-bg, rgba(202,138,4,0.08))', color: 'var(--color-gold)' },
        image: null // Use default icon
    },
];

const followingData = [
    { name: "HistoryBuff", handle: "historybuff", videos: 24, avatar: "https://placehold.co/40x40/64748B/FFFFFF?text=HB" },
    { name: "SpaceExplorer", handle: "spaceexplorer", videos: 18, avatar: "https://placehold.co/40x40/1E3A8A/FFFFFF?text=SE" },
    { name: "TechGuru", handle: "techguru", videos: 31, avatar: "https://placehold.co/40x40/059669/FFFFFF?text=TG" },
    { name: "NatureLens", handle: "naturelens", videos: 45, avatar: "https://placehold.co/40x40/F59E0B/FFFFFF?text=NL" },
    { name: "CodeMaster", handle: "codemaster", videos: 67, avatar: "https://placehold.co/40x40/9D174D/FFFFFF?text=CM" },
];

// --- Helper Components ---

const InterestTag = ({ text }) => (
    <span className="px-4 py-1 text-sm bg-stone-100 text-stone-700 rounded-full font-medium transition duration-150 hover:bg-stone-200 cursor-pointer">
        {text}
    </span>
);

const ActionButton = ({ icon: Icon, text, onClick }) => (
    <button
        onClick={onClick}
        className="flex items-center justify-center space-x-2 px-6 py-2 text-sm font-semibold bg-[var(--color-gold)] text-black rounded-lg shadow-md hover:bg-[var(--color-gold-darker)] transition duration-150 active:scale-[0.98]"
    >
        <Icon size={16} />
        <span>{text}</span>
    </button>
);

const StatCard = ({ value, label, bgColor, shadow, glow }) => (
    <div
        className={`flex flex-col items-center justify-center p-6 rounded-2xl w-full max-w-[130px] aspect-square shadow-lg transition duration-300 hover:shadow-xl cursor-default relative overflow-hidden`}
        style={{
            backgroundColor: bgColor || '#ffffff',
            boxShadow: glow ? `0 0 16px 6px rgba(202, 138, 4, 0.12)` : `0 10px 15px -3px rgba(0, 0, 0, 0.1)`,
        }}
    >
        {/* <div className={`absolute top-1.5 right-1.5 w-2 h-2 rounded-full ${!glow && 'hidden'}`} style={{ backgroundColor: 'var(--color-gold)' }}></div> */}
        <span className="text-4xl font-extrabold text-stone-900 mb-3">
            {value}
        </span>
        <span className="text-xs font-semibold text-stone-600 uppercase leading-tight tracking-wider text-center">
            {label}
        </span>
    </div>
);

const TemplateRow = ({ icon: Icon, title, subtitle, iconColor, bgColor, badge }) => (
    <div className="flex items-center p-4 bg-white rounded-xl shadow-lg shadow-stone-100/50 mb-3 last:mb-0 cursor-pointer hover:bg-stone-50 transition duration-150">
        <div className={`p-3 rounded-xl mr-4 flex-shrink-0`} style={{ backgroundColor: bgColor }}>
            <Icon size={24} style={{ color: iconColor }} />
        </div>
        <div className="flex-grow text-left">
            <p className="text-base font-semibold text-stone-800">{title}</p>
            <p className="text-sm text-stone-500">{subtitle}</p>
        </div>
        {badge && (
            <span className="px-3 py-1 bg-blue-100 text-blue-600 rounded-full text-sm font-bold flex-shrink-0">
                {badge}
            </span>
        )}
        <ChevronLeft size={16} className="text-stone-400 transform rotate-180 ml-4 flex-shrink-0" />
    </div>
);

// Component for a single Request Card
const RequestCard = ({ title, description, time, timeAgo, creator, status, statusStyle, image, imageUrl, createdAt }) => {
    // Calculate time display
    const timeDisplay = time || timeAgo || (createdAt ? (() => {
        try {
            const created = new Date(createdAt);
            const now = new Date();
            const diffMs = now - created;
            const diffMins = Math.floor(diffMs / 60000);
            if (diffMins < 60) return `${diffMins}m ago`;
            const diffHours = Math.floor(diffMins / 60);
            if (diffHours < 24) return `${diffHours}h ago`;
            const diffDays = Math.floor(diffHours / 24);
            return `${diffDays}d ago`;
        } catch (e) {
            return 'Recently';
        }
    })() : 'Recently');

    // Determine status
    const requestStatus = status || 'Pending';
    const statusColors = statusStyle || (requestStatus === "Fulfilled"
        ? { backgroundColor: 'var(--color-gold-light-bg, rgba(202,138,4,0.08))', color: 'var(--color-gold)' }
        : requestStatus === "In Progress"
            ? { backgroundColor: '#DBEAFE', color: '#1D4ED8' }
            : { backgroundColor: 'var(--color-gold-light-bg, rgba(202,138,4,0.08))', color: 'var(--color-gold)' });

    return (
        <div className="p-4 mb-4 bg-white rounded-xl shadow-lg shadow-stone-100/50 flex space-x-4 items-start cursor-pointer hover:bg-stone-50 transition duration-150 border border-stone-100">

            {/* Image/Icon Area */}
            <div className="w-16 h-16 flex-shrink-0 rounded-lg overflow-hidden border border-stone-200">
                {(image || imageUrl) ? (
                    <img
                        src={image || imageUrl}
                        alt={title}
                        className="w-full h-full object-cover"
                        onError={(e) => { e.target.onerror = null; e.target.src = "https://placehold.co/60x60/8B4513/FFFFFF?text=REQ"; }}
                    />
                ) : (
                    <div className="w-full h-full flex items-center justify-center bg-stone-100">
                        <File size={28} className="text-stone-500" />
                    </div>
                )}
            </div>

            {/* Text Content */}
            <div className="flex-grow min-w-0">
                <div className="flex justify-between items-start mb-1">
                    <p className="text-base font-semibold text-stone-800 truncate pr-2">{title}</p>
                    <span className={`text-xs font-bold whitespace-nowrap px-2 py-0.5 rounded-full flex-shrink-0`} style={statusColors}>
                        {requestStatus === "Fulfilled" ? <CheckCircle size={12} className="inline mr-1 -mt-0.5" /> : null}
                        {t(requestStatus)}
                    </span>
                </div>

                <p className="text-sm text-stone-500 mb-2 line-clamp-1">{description}</p>

                <div className="flex items-center text-xs text-stone-400 space-x-3">
                    <div className="flex items-center">
                        <Clock3 size={12} className="mr-1" />
                        <span>{timeDisplay}</span>
                    </div>
                    {creator && (
                        <div className="flex items-center">
                            <span className="font-semibold text-stone-500">
                                • {t('by')} {typeof creator === 'string' ? creator : (creator.name || t('You'))}
                            </span>
                        </div>
                    )}
                </div>
            </div>

            {/* More Options Button */}
            <button className="text-stone-400 hover:text-stone-600 p-1 -mr-2 flex-shrink-0">
                <MoreHorizontal size={18} />
            </button>
        </div>
    );
};

// Component for a single Following Row
const FollowingRow = ({ id, name, handle, videos, avatar, onUnfollow, isUnfollowed, onSwipe }) => {
    const [touchStart, setTouchStart] = useState(null);
    const [touchEnd, setTouchEnd] = useState(null);
    const minSwipeDistance = 50;

    const handleTouchStart = (e) => {
        setTouchEnd(null);
        setTouchStart(e.targetTouches[0].clientX);
    };

    const handleTouchMove = (e) => {
        setTouchEnd(e.targetTouches[0].clientX);
    };

    const handleTouchEnd = () => {
        if (!touchStart || !touchEnd) return;
        const distance = touchStart - touchEnd;
        if (distance > minSwipeDistance) {
            // Swiped left
            onSwipe(id);
        }
    };

    return (
        <div 
            className={`flex items-center p-3 mb-3 bg-white rounded-xl shadow-lg shadow-stone-100/50 cursor-pointer hover:bg-stone-50 transition duration-150 border border-stone-100 ${isUnfollowed ? 'opacity-30' : ''}`}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
        >
            <img
                src={avatar}
                alt={name}
                className="w-10 h-10 object-cover rounded-full mr-4 flex-shrink-0 border border-stone-200"
                onError={(e) => { e.target.onerror = null; e.target.src = "https://placehold.co/40x40/64748B/FFFFFF?text=HB"; }}
            />
            <div className="flex-grow text-left min-w-0">
                <p className="text-base font-semibold text-stone-800 truncate">{name}</p>
                <p className="text-sm text-stone-500 truncate">
                    @{handle} • {videos} {t('videos')}
                </p>
            </div>
            <button
                onClick={(e) => {
                    e.stopPropagation();
                    if (onUnfollow) onUnfollow(id);
                }}
                className={`px-4 py-1.5 text-sm font-semibold rounded-full transition duration-150 active:scale-[0.98] ml-4 flex-shrink-0 ${
                    isUnfollowed 
                        ? 'text-stone-600 bg-stone-100 hover:bg-stone-200' 
                        : 'text-white bg-stone-900 hover:bg-stone-800'
                }`}
            >
                {isUnfollowed ? t('Follow') : t('Following')}
            </button>
        </div>
    );
};

// Component for a single navigation item to handle the active glow effect
const NavItem = ({ icon: Icon, name, isActive, onClick }) => {
    return (
        <button
            onClick={onClick}
            className="flex flex-col items-center justify-center p-2 transition duration-150 relative h-full w-full"
        >
            {/* Conditional Glow Circle (matches the faint background highlight in the image) */}
            {isActive && (
                <div
                    className="absolute inset-0 flex items-center justify-center"
                    style={{
                        // Large, faint circle glow behind the active icon
                        background: 'radial-gradient(circle at center, rgba(255, 199, 0, 0.1), rgba(255, 199, 0, 0))',
                        borderRadius: '50%',
                        transform: 'scale(1.5)',
                        opacity: 0.6,
                    }}
                >
                    <div className="w-12 h-12 rounded-full"></div>
                </div>
            )}

            {/* Icon (needs to be above the glow/circle) */}
            <Icon
                size={24}
                style={isActive ? { color: 'var(--color-gold)' } : { color: '#374151' }}
            />
            {/* Text */}
            <span
                className="text-xs font-medium mt-1 z-10"
                style={isActive ? { color: 'var(--color-gold)' } : { color: '#374151' }}
            >
                {name}
            </span>
        </button>
    );
};

// --- Main Component ---

const App = () => {
    const navigate = useNavigate();
    const [profile, setProfile] = useState(initialProfileData);
    const [isCopied, setIsCopied] = useState(false);
    // Ref for the hidden file input
    const fileInputRef = useRef(null);

    // Account balance and payment states
    const [accountBalance, setAccountBalance] = useState(0);
    const [cardNumber, setCardNumber] = useState(null);
    const [showUpdateCardModal, setShowUpdateCardModal] = useState(false);
    const [showAddFundsModal, setShowAddFundsModal] = useState(false);
    const [showWithdrawModal, setShowWithdrawModal] = useState(false);
    const [addFundsAmount, setAddFundsAmount] = useState('');
    const [withdrawAmount, setWithdrawAmount] = useState('');

    // Requests display state
    const [showAllRequests, setShowAllRequests] = useState(false);

    // Fetch user profile from backend on mount
    useEffect(() => {
        const fetchProfile = async () => {
            try {
                const token = localStorage.getItem('regaarder_token');
                if (!token) return;

                const BACKEND = (window && window.__BACKEND_URL__) || 'https://pwin.onrender.com';
                const res = await fetch(`${BACKEND}/users/me`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });

                if (res.ok) {
                    const data = await res.json();
                    if (data && data.user) {
                        const u = data.user;
                        if (u.image) {
                            try {
                                const url = new URL(u.image);
                                u.image = url.toString();
                            } catch (e) { }
                        }
                        setProfile({
                            name: u.name || initialProfileData.name,
                            handle: u.handle || u.tag || initialProfileData.handle,
                            bio: u.bio || "",
                            interests: Array.isArray(u.interests) ? u.interests : [],
                            avatarUrl: u.image || initialProfileData.avatarUrl
                        });
                        // Sync local editing states
                        setNewName(u.name || initialProfileData.name);
                        setNewHandle(u.handle || u.tag || initialProfileData.handle);
                        setNewBio(u.bio || "");
                        setNewInterestsString(Array.isArray(u.interests) ? u.interests.join(', ') : "");
                    }
                }
            } catch (err) {
                console.error('Failed to load profile:', err);
            }
        };
        fetchProfile();
    }, []);

    const saveProfileToBackend = async (updates) => {
        try {
            const token = localStorage.getItem('regaarder_token');
            if (!token) return;

            const BACKEND = (window && window.__BACKEND_URL__) || 'https://pwin.onrender.com';
            await fetch(`${BACKEND}/users/update`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(updates)
            });
        } catch (e) {
            console.error('Failed to save profile:', e);
        }
    };

    // New state for inline editing - Name/Handle
    const [isEditingName, setIsEditingName] = useState(false);
    const [newName, setNewName] = useState(initialProfileData.name);
    const [isEditingHandle, setIsEditingHandle] = useState(false);
    const [newHandle, setNewHandle] = useState(initialProfileData.handle);

    // New state for inline editing - Bio and Interests
    const [isEditingBio, setIsEditingBio] = useState(false);
    const [newBio, setNewBio] = useState(initialProfileData.bio);

    const [isEditingInterests, setIsEditingInterests] = useState(false);
    // Initialize newInterestsString as a comma-separated string
    const [newInterestsString, setNewInterestsString] = useState(initialProfileData.interests.join(', '));

    // Global Preview Mode
    const [isPreviewMode, setIsPreviewMode] = useState(false);
    // Data lists: default to empty so the app shows empty-state placeholders by default.
    // If you want to preview with mock data, change the initial value to `requestsData`, `templatesData`, `followingData` respectively.
    const [requests, setRequests] = useState([]);
    const [templates, setTemplates] = useState([]);
    const [following, setFollowing] = useState([]);

    // Track unfollowed creators (swipe or button click)
    const [unfollowedCreators, setUnfollowedCreators] = useState(new Set());

    // Privacy settings dropdown state
    const [selectedPrivacy, setSelectedPrivacy] = useState("public");
    const [privacyDropdownOpen, setPrivacyDropdownOpen] = useState(false);


    // Custom useEffect hook to handle mobile viewport height (VH) calculation
    useEffect(() => {
        const setVh = () => {
            // Calculate 1% of the viewport height
            let vh = window.innerHeight * 0.01;
            // Set the value in the --vh custom property to the root of the document
            document.documentElement.style.setProperty('--vh', `${vh}px`);
        };

        // Set initial value and listen for resize and orientation changes
        setVh();
        window.addEventListener('resize', setVh);
        window.addEventListener('orientationchange', setVh);

        // Cleanup listener on component unmount
        return () => {
            window.removeEventListener('resize', setVh);
            window.removeEventListener('orientationchange', setVh);
        };
    }, []); // Run only once on mount

    // Fetch following list from backend
    useEffect(() => {
        const fetchFollowing = async () => {
            if (isPreviewMode) return; // Don't fetch in preview mode

            try {
                // Use regaarder_token consistently with other operations
                const token = localStorage.getItem('regaarder_token');
                if (!token) return;

                const BACKEND = (window && window.__BACKEND_URL__) || 'https://pwin.onrender.com';
                const res = await fetch(`${BACKEND}/following`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });

                if (res.ok) {
                    const data = await res.json();
                    setFollowing(data.following || []);
                }
            } catch (err) {
                console.error('Failed to fetch following list:', err);
            }
        };

        fetchFollowing();
    }, [isPreviewMode]);

    // Fetch user's requests from backend
    useEffect(() => {
        const fetchMyRequests = async () => {
            if (isPreviewMode) return; // Don't fetch in preview mode

            try {
                const token = localStorage.getItem('regaarder_token');
                if (!token) return;

                const BACKEND = (window && window.__BACKEND_URL__) || 'https://pwin.onrender.com';
                const res = await fetch(`${BACKEND}/requests/my`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });

                if (res.ok) {
                    const data = await res.json();
                    setRequests(data.requests || []);
                }
            } catch (err) {
                console.error('Failed to fetch user requests:', err);
            }
        };

        fetchMyRequests();
    }, [isPreviewMode]);

    // Listen for new request creation events and refresh the list
    useEffect(() => {
        const handleRequestCreated = (event) => {
            const newRequest = event.detail;
            if (newRequest) {
                setRequests(prev => [newRequest, ...prev]);
            }
        };

        window.addEventListener('ideas:request_created', handleRequestCreated);

        return () => {
            window.removeEventListener('ideas:request_created', handleRequestCreated);
        };
    }, []);

    // Handles click on the Camera icon to trigger file selection
    const handleUploadClick = useCallback(() => {
        if (fileInputRef.current) {
            fileInputRef.current.click();
        }
    }, []);

    // Handles file selection after the file input is triggered
    const handleImageChange = useCallback(async (event) => {
        const file = event.target.files[0];
        if (file) {
            console.log('Selected file for upload:', file.name, file.type);

            // Optimistic update
            const reader = new FileReader();
            reader.onloadend = () => {
                setProfile(prev => ({ ...prev, avatarUrl: reader.result }));
            };
            reader.readAsDataURL(file);

            // Upload to backend
            try {
                const token = localStorage.getItem('regaarder_token');
                if (!token) return;

                const formData = new FormData();
                formData.append('image', file);

                const BACKEND = (window && window.__BACKEND_URL__) || 'https://pwin.onrender.com';
                const res = await fetch(`${BACKEND}/creator/photo`, {
                    method: 'POST',
                    headers: { 'Authorization': `Bearer ${token}` },
                    body: formData
                });

                if (res.ok) {
                    const data = await res.json();
                    if (data && data.url) {
                        setProfile(prev => ({ ...prev, avatarUrl: data.url }));
                    }
                } else {
                    console.error('Upload failed');
                }
            } catch (e) {
                console.error('Upload error:', e);
            }
        }
        // Reset the file input value to allow the same file to be selected again
        event.target.value = null;
    }, []);

    const handleCopy = useCallback(() => {
        // Fallback copy logic for restricted environments
        const tempInput = document.createElement('input');
        tempInput.value = `@${profile.handle}`;
        document.body.appendChild(tempInput);
        tempInput.select();
        try {
            document.execCommand('copy');
            console.log(`Copied handle: @${profile.handle}`);
            setIsCopied(true);
            setTimeout(() => setIsCopied(false), 2000);
        } catch (err) {
            console.error('Could not copy text: ', err);
        }
        document.body.removeChild(tempInput);
    }, [profile.handle]);

    const handleShare = useCallback(() => {
        console.log("Sharing profile...");
    }, []);

    // Function to handle name edit/save
    const handleEditName = useCallback(() => {
        if (isEditingName) {
            // Save the new name (trim whitespace and ensure it's not empty)
            const trimmedName = newName.trim();
            if (trimmedName) {
                setProfile(prev => ({ ...prev, name: trimmedName }));
                saveProfileToBackend({ name: trimmedName });
            }
        } else {
            // Start editing, set temporary state to current profile name
            setNewName(profile.name);
        }
        setIsEditingName(prev => !prev);
        setIsEditingHandle(false); // Close handle editing if open
    }, [isEditingName, newName, profile.name]);

    // Function to handle handle edit/save
    const handleEditHandle = useCallback(() => {
        if (isEditingHandle) {
            // Save the new handle (clean it up: lowercase, remove @, trim)
            const cleanHandle = newHandle.toLowerCase().replace('@', '').trim();
            if (cleanHandle) {
                setProfile(prev => ({ ...prev, handle: cleanHandle }));
                saveProfileToBackend({ handle: cleanHandle });
            }
        } else {
            // Start editing, set temporary state to current profile handle
            setNewHandle(profile.handle);
        }
        setIsEditingHandle(prev => !prev);
        setIsEditingName(false); // Close name editing if open
    }, [isEditingHandle, newHandle, profile.handle]);

    // Function to handle bio edit/save
    const handleEditBio = useCallback(() => {
        if (isEditingBio) {
            // Save the new bio (trim whitespace)
            const trimmedBio = newBio.trim();
            setProfile(prev => ({ ...prev, bio: trimmedBio }));
            saveProfileToBackend({ bio: trimmedBio });
        } else {
            // Start editing, set temporary state to current profile bio
            setNewBio(profile.bio);
        }
        setIsEditingBio(prev => !prev);
    }, [isEditingBio, newBio, profile.bio]);

    // Function to handle interests edit/save
    const handleEditInterests = useCallback(() => {
        if (isEditingInterests) {
            // Split the comma-separated string into an array, filter out empty strings
            const updatedInterests = newInterestsString.split(',')
                .map(tag => tag.trim())
                .filter(tag => tag.length > 0);

            setProfile(prev => ({ ...prev, interests: updatedInterests }));
            saveProfileToBackend({ interests: updatedInterests });
        } else {
            // Start editing, set temp state to current profile interests as a comma-separated string
            setNewInterestsString(profile.interests.join(', '));
        }
        setIsEditingInterests(prev => !prev);
    }, [isEditingInterests, newInterestsString, profile.interests]);

    // Privacy options for dropdown
    const privacyOptions = [
        {
            id: "public",
            label: "Public by Default",
            icon: Globe,
            desc: "New requests are visible to everyone",
            iconColor: "text-green-600",
            bgColor: "bg-green-100"
        },
        {
            id: "unlisted",
            label: "Unlisted by Default",
            icon: LinkIcon,
            desc: "New requests only visible with link",
            iconColor: "text-blue-600",
            bgColor: "bg-blue-100"
        },
        {
            id: "private",
            label: "Private by Default",
            icon: Lock,
            desc: "New requests only visible to you",
            iconColor: "text-gray-600",
            bgColor: "bg-gray-100"
        }
    ];

    const currentPrivacyOption = privacyOptions.find(opt => opt.id === selectedPrivacy) || privacyOptions[0];

    // Handle unfollow action
    const handleUnfollow = useCallback(async (creatorId) => {
        try {
            // Use regaarder_token consistently with other operations
            const token = localStorage.getItem('regaarder_token');
            if (!token) return;

            // Toggle the unfollowed state
            setUnfollowedCreators(prev => {
                const newSet = new Set(prev);
                if (newSet.has(creatorId)) {
                    newSet.delete(creatorId);
                } else {
                    newSet.add(creatorId);
                }
                return newSet;
            });

            const BACKEND = (window && window.__BACKEND_URL__) || 'https://pwin.onrender.com';
            const res = await fetch(`${BACKEND}/unfollow`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ creatorId })
            });

            if (res.ok) {
                // Don't remove from state - only remove on page refresh
                console.log('Unfollowed creator:', creatorId);
            }
        } catch (err) {
            console.error('Failed to unfollow:', err);
        }
    }, []);

    // Handle swipe-to-hide action
    const handleSwipe = useCallback((creatorId) => {
        setUnfollowedCreators(prev => {
            const newSet = new Set(prev);
            newSet.add(creatorId);
            return newSet;
        });
    }, []);


    return (
        // Outer container: Covers full width and height of the browser viewport.
        <>
            <style>{`
            @keyframes shine {
                0% { left: -100%; }
                20% { left: 100%; }
                100% { left: 100%; }
            }
        `}</style>
            <div
                className="bg-stone-50 antialiased font-sans flex justify-center w-full overflow-hidden"
                style={{
                    height: 'calc(var(--vh, 1vh) * 100)',
                    width: '100vw'
                }}
            >

                {/* Inner Container: Mobile View */}
                <div className="w-full bg-white shadow-2xl flex flex-col h-full">

                    {/* Hidden File Input */}
                    <input
                        name="avatarUpload"
                        type="file"
                        accept="image/*"
                        ref={fileInputRef}
                        onChange={handleImageChange}
                        className="hidden" // Keep it hidden
                    />

                    {/* Scrollable Content Wrapper: Takes up all available vertical space */}
                    <div className="flex-grow overflow-y-auto">

                        {/* Header Section (Profile) - Updated for Preview Toggle */}
                        <header
                          className="p-4 flex items-center justify-between bg-stone-50 flex-shrink-0"
                          style={{ paddingTop: 'calc(16px + env(safe-area-inset-top, 0px))' }}
                        >
                            <button
                                onClick={() => {
                                    try { if (window.setFooterTab) window.setFooterTab('home'); } catch (e) { }
                                    navigate('/home');
                                }}
                                className="p-2 rounded-full hover:bg-stone-100 transition"
                            >
                                <ChevronLeft size={24} className="text-stone-800" />
                            </button>

                            {/* (Scale control removed) */}

                            {/* Preview/Edit Toggle Button */}
                            <button
                                onClick={() => setIsPreviewMode(prev => !prev)}
                                className={`px-4 py-1.5 text-sm font-semibold rounded-full transition duration-200 shadow-md active:scale-[0.98]'`}
                                style={isPreviewMode ? { backgroundColor: 'var(--color-gold)', color: 'var(--color-accent-text)' } : { backgroundColor: 'white', color: '#374151', border: '1px solid #D1D5DB' }}
                            >
                                {isPreviewMode ? t('Exit Preview') : t('Preview Profile')}
                            </button>
                        </header>

                        {/* Profile Content Section (First Image) */}
                        <div className="flex flex-col items-center p-6 pt-0 bg-stone-50 text-center flex-shrink-0">
                            {/* Avatar and Glow Effect */}
                            <div className="relative w-32 h-32 mb-6">
                                <div
                                    className="absolute inset-0 rounded-full"
                                    style={{
                                        background: 'radial-gradient(circle at center, rgba(var(--color-gold-rgb), 0.12), rgba(var(--color-gold-rgb), 0))',
                                        boxShadow: '0 0 40px 10px rgba(var(--color-gold-rgb), 0.4)',
                                        opacity: 0.5,
                                    }}
                                ></div>
                                <img
                                    src={profile.avatarUrl}
                                    alt={`${profile.name}'s avatar`}
                                    className="relative w-full h-full object-cover rounded-full border-4 border-white shadow-md z-10"
                                    onError={(e) => { e.target.onerror = null; e.target.src = "https://placehold.co/100x100/A0A0A0/FFFFFF?text=AM"; }}
                                />
                                {/* Camera Edit Button Overlay (Hidden in Preview Mode) */}
                                {!isPreviewMode && (
                                    <button
                                        onClick={handleUploadClick}
                                        className="absolute bottom-0 right-0 p-2 rounded-full shadow-lg border-2 border-white transform translate-y-1 translate-x-1 z-20 transition"
                                        style={{ backgroundColor: 'var(--color-gold)', color: 'white' }}
                                    >
                                        <Camera size={16} style={{ color: 'white' }} />
                                    </button>
                                )}
                            </div>

                            {/* Name and Handle Section (Editable) */}
                            <div className="mb-6">
                                {/* Name Block */}
                                <div className="flex items-center justify-center h-8"> {/* Fixed height for consistency */}
                                    {isEditingName ? (
                                        <input
                                            name="profileName"
                                            type="text"
                                            value={newName}
                                            onChange={(e) => setNewName(e.target.value)}
                                            onBlur={handleEditName} // Save on blur
                                            onKeyDown={(e) => { if (e.key === 'Enter') handleEditName(); }} // Save on Enter
                                            className="text-2xl font-bold text-stone-900 mb-1 w-48 text-center focus:outline-none bg-stone-50"
                                            style={{ borderBottom: '2px solid var(--color-gold)' }}
                                            autoFocus
                                        />
                                    ) : (
                                        <h1 className="text-2xl font-bold text-stone-900 mb-1">
                                            {profile.name}
                                        </h1>
                                    )}
                                    {!isPreviewMode && (
                                        <button
                                            onClick={handleEditName}
                                            className={`ml-2 transition`}
                                            style={isEditingName ? { color: '#16A34A' } : { color: '#9CA3AF' }}
                                            onMouseDown={(e) => e.preventDefault()}
                                        >
                                            {isEditingName ? <Check size={16} /> : <Edit2 size={16} />}
                                        </button>
                                    )}
                                </div>

                                {/* Handle Block */}
                                <div className="flex items-center justify-center -mt-1 h-6"> {/* Fixed height for consistency */}
                                    {isEditingHandle ? (
                                        <>
                                            <span className="text-stone-500">@</span>
                                            <input
                                                name="profileHandle"
                                                type="text"
                                                value={newHandle.startsWith('@') ? newHandle.substring(1) : newHandle}
                                                onChange={(e) => setNewHandle(e.target.value)}
                                                onBlur={handleEditHandle} // Save on blur
                                                onKeyDown={(e) => { if (e.key === 'Enter') handleEditHandle(); }} // Save on Enter
                                                className="text-stone-500 w-32 text-center focus:outline-none bg-stone-50 text-sm"
                                                style={{ borderBottom: '2px solid var(--color-gold)' }}
                                            />
                                        </>
                                    ) : (
                                        <p className="text-stone-500 text-sm">
                                            @{profile.handle}
                                        </p>
                                    )}
                                    {!isPreviewMode && (
                                        <button
                                            onClick={handleEditHandle}
                                            className={`ml-1 transition`}
                                            style={isEditingHandle ? { color: '#16A34A' } : { color: '#9CA3AF' }}
                                            onMouseDown={(e) => e.preventDefault()}
                                        >
                                            {isEditingHandle ? <Check size={12} /> : <Edit2 size={12} />}
                                        </button>
                                    )}
                                </div>
                            </div>

                            {/* Share Profile Button - Centered */}
                            <div className="flex justify-center mb-6 w-full px-2">
                                <ActionButton
                                    icon={Share2}
                                    text={t('Share Your Profile')}
                                    onClick={handleShare}
                                />
                            </div>



                            {/* Bio Description (Editable) */}
                            <div className="flex flex-col items-center mb-6 w-full px-4">
                                <div className="flex justify-center items-start w-full">
                                    {isEditingBio ? (
                                        <textarea
                                            value={newBio}
                                            onChange={(e) => setNewBio(e.target.value)}
                                            onBlur={handleEditBio}
                                            onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleEditBio(); } }}
                                            rows="3"
                                            className="w-full text-base text-stone-700 p-2 rounded-lg focus:outline-none bg-stone-50 resize-none text-center"
                                            style={{ border: '1px solid var(--color-gold)' }}
                                            autoFocus
                                        />
                                    ) : (
                                        <p className="text-base text-stone-600 text-center flex-grow">
                                            {profile.bio || t('Write your Bio here')}
                                        </p>
                                    )}
                                    {!isPreviewMode && (
                                        <button
                                            onClick={handleEditBio}
                                            className={`ml-2 mt-1 transition flex-shrink-0`}
                                            style={isEditingBio ? { color: '#16A34A' } : { color: '#9CA3AF' }}
                                            onMouseDown={(e) => e.preventDefault()}
                                        >
                                            {isEditingBio ? <Check size={16} /> : <Edit2 size={16} />}
                                        </button>
                                    )}
                                </div>
                            </div>

                            {/* Interest Tags (Editable) */}
                            <div className="flex flex-col w-full mb-8 px-4">
                                <div className="flex items-center justify-center w-full mb-4">
                                    <h2 className="text-base font-semibold text-stone-700 mr-2">{t('Interests/Tags')}</h2>
                                    {!isPreviewMode && (
                                        <button
                                            onClick={handleEditInterests}
                                            className={`transition`}
                                            style={isEditingInterests ? { color: '#16A34A' } : { color: '#9CA3AF' }}
                                            onMouseDown={(e) => e.preventDefault()}
                                        >
                                            {isEditingInterests ? <Check size={16} /> : <Edit2 size={16} />}
                                        </button>
                                    )}
                                </div>

                                {isEditingInterests ? (
                                    <textarea
                                        value={newInterestsString}
                                        onChange={(e) => setNewInterestsString(e.target.value)}
                                        onBlur={handleEditInterests}
                                        rows="2"
                                        placeholder={t('Enter interests separated by commas (e.g., History, Science, Technology)')}
                                        className="w-full text-base text-stone-700 p-2 rounded-lg focus:outline-none bg-stone-50 text-center resize-none"
                                        style={{ border: '1px solid var(--color-gold)' }}
                                        autoFocus
                                    />
                                ) : (
                                    <div className="flex flex-wrap justify-center gap-3">
                                        {profile.interests.map((interest, index) => (
                                            <InterestTag key={index} text={t(interest)} />
                                        ))}
                                    </div>
                                )}
                            </div>

                        </div>

                        {/* Main Content Area (Background is now white for contrast) */}
                        {/* Added pb-24 to ensure the last elements clear the fixed BottomNav */}
                        <main className="p-6 pt-4 bg-white" style={{ paddingBottom: 'calc(60px + env(safe-area-inset-bottom))' }}>

                            {/* Activity Overview Title */}
                            <div className="flex items-center justify-center space-x-2 text-lg font-bold text-stone-900 mb-8">
                                <LineChart size={20} style={{ color: 'var(--color-gold)' }} />
                                <span>{t('Activity Overview')}</span>
                            </div>

                            {/* Stats Cards */}
                            <div className="flex justify-center gap-6 mb-12">
                                {[
                                    { 
                                        value: String(requests.length), 
                                        label: t('Requests'), 
                                        color: "text-stone-900", 
                                        bgColor: '#ffffff', 
                                        shadow: "shadow-stone-200/50" 
                                    },
                                    { 
                                        value: String(requests.filter(r => r.status === 'In Progress' || r.status === 'Pending').length), 
                                        label: t('Active'), 
                                        color: "text-stone-900", 
                                        bgColor: 'var(--color-gold-light-bg)', 
                                        shadow: "shadow-amber-200/50", 
                                        glow: true 
                                    },
                                    { 
                                        value: String(requests.filter(r => r.status === 'Fulfilled' || r.status === 'Completed').length), 
                                        label: t('Completed'), 
                                        color: "text-stone-900", 
                                        bgColor: '#ffffff', 
                                        shadow: "shadow-stone-200/50" 
                                    }
                                ].map((stat, index) => (
                                    <StatCard key={index} {...stat} />
                                ))}
                            </div>

                            {/* Account Balance & Management Section */}
                            <div className="flex items-center justify-between mb-4">
                                <h2 className="text-base font-semibold text-stone-900">{t('Account Balance')}</h2>
                                <button className="font-semibold text-sm transition" style={{ color: 'var(--color-gold)' }}>
                                    {t('Manage')}
                                </button>
                            </div>

                            <div className="grid grid-cols-1 gap-4 mb-10">
                                {/* Main Balance Card */}
                                <div className="p-6 rounded-2xl shadow-md border border-stone-100" style={{ backgroundColor: 'var(--color-gold-light-bg)' }}>
                                    <div className="flex items-center space-x-2 text-stone-600 mb-2">
                                        <DollarSign size={16} style={{ color: 'var(--color-gold)' }} />
                                        <span className="text-sm font-bold">{t('Your Balance')}</span>
                                    </div>
                                    <p className="text-4xl font-extrabold text-stone-900 mb-6">
                                        {accountBalance > 0 ? `$${accountBalance.toFixed(2)}` : '$0.00'}
                                    </p>
                                    
                                    {/* Action Buttons */}
                                    <div className="grid grid-cols-2 gap-3">
                                        <button 
                                            onClick={() => setShowAddFundsModal(true)}
                                            className="py-2.5 text-sm font-bold rounded-lg transition active:scale-[0.98] text-white" 
                                            style={{ backgroundColor: 'var(--color-gold)' }}
                                        >
                                            {t('Add Funds')}
                                        </button>
                                        <button 
                                            onClick={() => setShowWithdrawModal(true)}
                                            className="py-2.5 text-sm font-bold rounded-lg transition active:scale-[0.98] border-2" 
                                            style={{ borderColor: 'var(--color-gold)', color: 'var(--color-gold)', backgroundColor: 'transparent' }}
                                        >
                                            {t('Withdraw')}
                                        </button>
                                    </div>
                                </div>

                                {/* Payment Method Card */}
                                <div className="p-4 bg-white border border-stone-200 rounded-2xl shadow-md flex flex-col justify-between">
                                    <div className="flex items-center space-x-1.5 text-stone-600 mb-3">
                                        <CreditCard size={14} className="text-stone-600" />
                                        <span className="text-xs font-bold">{t('Payment Method')}</span>
                                    </div>
                                    <p className="text-lg font-extrabold text-stone-900 mb-3 tracking-wider">
                                        {cardNumber ? `•••• ${cardNumber}` : 'No card added yet'}
                                    </p>
                                    <button 
                                        onClick={() => setShowUpdateCardModal(true)}
                                        className="font-bold text-xs self-start transition" 
                                        style={{ color: 'var(--color-gold)' }}
                                    >
                                        {cardNumber ? t('Update Card') : 'Add Card'}
                                    </button>
                                </div>
                            </div>

                            {/* Update Card Modal */}
                            {showUpdateCardModal && (
                                <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
                                    <div className="bg-white rounded-2xl p-6 w-full max-w-sm">
                                        <h3 className="text-xl font-bold mb-4">{cardNumber ? t('Update Card') : 'Add Card'}</h3>
                                        
                                        <div className="mb-4">
                                            <label className="text-sm font-semibold text-stone-700 mb-2 block">Card Number</label>
                                            <input 
                                                type="text" 
                                                placeholder="1234 5678 9012 3456"
                                                className="w-full px-4 py-2 border border-stone-300 rounded-lg focus:outline-none focus:ring-2" 
                                                style={{ '--tw-ring-color': 'var(--color-gold)' }}
                                            />
                                        </div>

                                        <div className="grid grid-cols-2 gap-3 mb-6">
                                            <div>
                                                <label className="text-sm font-semibold text-stone-700 mb-2 block">Exp. Date</label>
                                                <input 
                                                    type="text" 
                                                    placeholder="MM/YY"
                                                    className="w-full px-4 py-2 border border-stone-300 rounded-lg focus:outline-none focus:ring-2" 
                                                    style={{ '--tw-ring-color': 'var(--color-gold)' }}
                                                />
                                            </div>
                                            <div>
                                                <label className="text-sm font-semibold text-stone-700 mb-2 block">CVV</label>
                                                <input 
                                                    type="text" 
                                                    placeholder="123"
                                                    className="w-full px-4 py-2 border border-stone-300 rounded-lg focus:outline-none focus:ring-2" 
                                                    style={{ '--tw-ring-color': 'var(--color-gold)' }}
                                                />
                                            </div>
                                        </div>

                                        <div className="flex gap-3">
                                            <button 
                                                onClick={() => setShowUpdateCardModal(false)}
                                                className="flex-1 py-2 px-4 border-2 border-stone-300 rounded-lg font-semibold text-stone-700 transition hover:bg-stone-50"
                                            >
                                                {t('Cancel')}
                                            </button>
                                            <button 
                                                onClick={() => {
                                                    setCardNumber('4242');
                                                    setShowUpdateCardModal(false);
                                                }}
                                                className="flex-1 py-2 px-4 rounded-lg font-semibold text-white transition active:scale-[0.98]" 
                                                style={{ backgroundColor: 'var(--color-gold)' }}
                                            >
                                                {t('Save Card')}
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Add Funds Modal */}
                            {showAddFundsModal && (
                                <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
                                    <div className="bg-white rounded-2xl p-6 w-full max-w-sm">
                                        <h3 className="text-xl font-bold mb-4">{t('Add Funds')}</h3>
                                        
                                        <div className="mb-6">
                                            <label className="text-sm font-semibold text-stone-700 mb-2 block">Amount</label>
                                            <div className="flex items-center">
                                                <span className="text-xl font-bold mr-2" style={{ color: 'var(--color-gold)' }}>$</span>
                                                <input 
                                                    type="number" 
                                                    placeholder="0.00"
                                                    value={addFundsAmount}
                                                    onChange={(e) => setAddFundsAmount(e.target.value)}
                                                    className="flex-1 px-4 py-2 border border-stone-300 rounded-lg focus:outline-none focus:ring-2" 
                                                    style={{ '--tw-ring-color': 'var(--color-gold)' }}
                                                />
                                            </div>
                                        </div>

                                        <div className="flex gap-3">
                                            <button 
                                                onClick={() => {
                                                    setShowAddFundsModal(false);
                                                    setAddFundsAmount('');
                                                }}
                                                className="flex-1 py-2 px-4 border-2 border-stone-300 rounded-lg font-semibold text-stone-700 transition hover:bg-stone-50"
                                            >
                                                {t('Cancel')}
                                            </button>
                                            <button 
                                                onClick={() => {
                                                    if (addFundsAmount) {
                                                        setAccountBalance(prev => prev + parseFloat(addFundsAmount));
                                                        setShowAddFundsModal(false);
                                                        setAddFundsAmount('');
                                                    }
                                                }}
                                                className="flex-1 py-2 px-4 rounded-lg font-semibold text-white transition active:scale-[0.98]" 
                                                style={{ backgroundColor: 'var(--color-gold)' }}
                                            >
                                                {t('Add Funds')}
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Withdraw Modal */}
                            {showWithdrawModal && (
                                <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
                                    <div className="bg-white rounded-2xl p-6 w-full max-w-sm">
                                        <h3 className="text-xl font-bold mb-4">{t('Withdraw')}</h3>
                                        
                                        <div className="mb-4 p-4 bg-stone-50 rounded-lg">
                                            <p className="text-sm text-stone-600 mb-2">Available Balance</p>
                                            <p className="text-2xl font-bold" style={{ color: 'var(--color-gold)' }}>${accountBalance.toFixed(2)}</p>
                                        </div>

                                        <div className="mb-6">
                                            <label className="text-sm font-semibold text-stone-700 mb-2 block">Amount to Withdraw</label>
                                            <div className="flex items-center">
                                                <span className="text-xl font-bold mr-2" style={{ color: 'var(--color-gold)' }}>$</span>
                                                <input 
                                                    type="number" 
                                                    placeholder="0.00"
                                                    value={withdrawAmount}
                                                    onChange={(e) => setWithdrawAmount(e.target.value)}
                                                    className="flex-1 px-4 py-2 border border-stone-300 rounded-lg focus:outline-none focus:ring-2" 
                                                    style={{ '--tw-ring-color': 'var(--color-gold)' }}
                                                />
                                            </div>
                                        </div>

                                        <div className="flex gap-3">
                                            <button 
                                                onClick={() => {
                                                    setShowWithdrawModal(false);
                                                    setWithdrawAmount('');
                                                }}
                                                className="flex-1 py-2 px-4 border-2 border-stone-300 rounded-lg font-semibold text-stone-700 transition hover:bg-stone-50"
                                            >
                                                {t('Cancel')}
                                            </button>
                                            <button 
                                                onClick={() => {
                                                    if (withdrawAmount && parseFloat(withdrawAmount) <= accountBalance) {
                                                        setAccountBalance(prev => prev - parseFloat(withdrawAmount));
                                                        setShowWithdrawModal(false);
                                                        setWithdrawAmount('');
                                                    }
                                                }}
                                                className="flex-1 py-2 px-4 rounded-lg font-semibold text-white transition active:scale-[0.98]" 
                                                style={{ backgroundColor: 'var(--color-gold)' }}
                                            >
                                                {t('Withdraw')}
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Your Requests Section (New Content) */}
                            <div className="flex items-center justify-between mt-8 mb-4">
                                <h2 className="text-base font-semibold text-stone-900">{t('Your Requests')}</h2>
                                {requests.length > 2 && (
                                    <button 
                                        onClick={() => setShowAllRequests(!showAllRequests)}
                                        className="font-semibold text-sm transition" 
                                        style={{ color: 'var(--color-gold)' }}
                                    >
                                        {showAllRequests ? t('Show Less') : `${t('View All')} (${requests.length})`}
                                    </button>
                                )}
                            </div>

                            {/* Requests List */}
                            <div className="space-y-3">
                                {requests.length > 0 ? (
                                    (showAllRequests ? requests : requests.slice(0, 2)).map((request, index) => (
                                        <RequestCard
                                            key={index}
                                            {...request}
                                        />
                                    ))
                                ) : (
                                    <div className="w-full p-6 bg-stone-50 rounded-xl flex flex-col items-center justify-center text-stone-400">
                                        <div className="text-lg font-semibold mb-2">{t('No requests yet')}</div>
                                        <div className="text-sm">{t('Requests you create will appear here.')}</div>
                                    </div>
                                )}
                            </div>


                            {/* Following Section (New Content) */}
                            <div className="flex items-center justify-between mt-8 mb-4">
                                <h2 className="text-base font-semibold text-stone-900">{t('Following')} ({following.length})</h2>
                                <button className="font-semibold text-sm transition" style={{ color: 'var(--color-gold)' }}>
                                    {t('Discover More')}
                                </button>
                            </div>

                            {/* Following List */}
                            <div className="space-y-3 pb-8"> {/* Added padding bottom to account for the fixed nav */}
                                {following.length > 0 ? (
                                    following.map((follower, index) => (
                                        <FollowingRow
                                            key={follower.id || index}
                                            {...follower}
                                            isUnfollowed={unfollowedCreators.has(follower.id)}
                                            onUnfollow={handleUnfollow}
                                            onSwipe={handleSwipe}
                                        />
                                    ))
                                ) : (
                                    <div className="w-full p-6 bg-stone-50 rounded-xl flex flex-col items-center justify-center text-stone-400">
                                        <div className="text-lg font-semibold mb-2">{t('Not following anyone yet')}</div>
                                        <div className="text-sm">{t('Follow creators to see their activity here.')}</div>
                                    </div>
                                )}
                            </div>

                        </main>
                    </div>
                </div>

                {/* Bottom Navigation Bar (Fixed) */}
                <SharedBottomBar selectedLanguage={selectedLanguage} />

            </div>
        </>
    );
};

export default App;
